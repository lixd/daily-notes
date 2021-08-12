### Scheduler Affinity

亲缘性调度的一些限制：

* Work-stealing 
  * 当 P 的 local queue 任务不够，同时 global queue、network poller 也会空，这时从其他 P 窃取 任务运行，然后任务就运行到了其他线程。

* 系统调用
  * 当 syscall 产生，Go 把当前线程置为 blocking mode，让一个新的线程接管了这个 P (过一个 sysmon tick 才会交给其他 M，大多数syscall都是很快的)。

G 跑到其他线程上去运行，会导致内存亲缘性问题被放大。



![](D:/Home/17x/Projects/daily-notes/Golang/训练营/assets/12/Affinity_limitation.png)



上图中，P0 队列中有 4 个 G 等待执行，假设现在准备执行 G5，但是之前被 channel 阻塞的 G9 突然被唤醒了，因为现在正在执行 G5，所以只能等待。最终可能要靠别人把 G9 窃取过去才能执行到。

> 正常情况下肯定希望越快唤醒越好。



![](D:/Home/17x/Projects/daily-notes/Golang/训练营/assets/12/runnext.png)

针对 communicate-and-wait 模式，进行了亲缘性调度的优化。

>  communicate-and-wait 模式：即通过 channel 通信的这种模式。

当前 local queue，使用了 FIFO 实现，unlock 的 G 无法尽快执行，如果队列中前面存在占用线程的其他 G。

**Go 1.5 在 P 中引入了 runnext 特殊的一个字段，可以高优先级执行 unblock G。**

> 相当于是插队，优先看 runnext 有没有等待执行的，再去看 本地队列。



```go
// runtime/runtime2.go
type p struct {
// runnext, if non-nil, is a runnable G that was ready'd by
	// the current G and should be run next instead of what's in
	// runq if there's time remaining in the running G's time
	// slice. It will inherit the time left in the current time
	// slice. If a set of goroutines is locked in a
	// communicate-and-wait pattern, this schedules that set as a
	// unit and eliminates the (potentially large) scheduling
	// latency that otherwise arises from adding the ready'd
	// goroutines to the end of the run queue.

runnext guintptr
    
}
```

执行时优先执行 runnext

```go
// proc.go 5033 行

// Get g from local runnable queue.
// If inheritTime is true, gp should inherit the remaining time in the
// current time slice. Otherwise, it should start a new time slice.
// Executed only by the owner P.
func runqget(_p_ *p) (gp *g, inheritTime bool) {
	// If there's a runnext, it's the next G to run.
	for {
		next := _p_.runnext
		if next == 0 {
			break
		}
		if _p_.runnext.cas(next, 0) {
			return next.ptr(), true
		}
	}

	for {
		h := atomic.LoadAcq(&_p_.runqhead) // load-acquire, synchronize with other consumers
		t := _p_.runqtail
		if t == h {
			return nil, false
		}
		gp := _p_.runq[h%uint32(len(_p_.runq))].ptr()
		if atomic.CasRel(&_p_.runqhead, h, h+1) { // cas-release, commits consume
			return gp, false
		}
	}
}
```



添加时也是优先添加到 runnext

```go
// proc.go 4955 行
// runqput tries to put g on the local runnable queue.
// If next is false, runqput adds g to the tail of the runnable queue.
// If next is true, runqput puts g in the _p_.runnext slot.
// If the run queue is full, runnext puts g on the global queue.
// Executed only by the owner P.
func runqput(_p_ *p, gp *g, next bool) {
	if randomizeScheduler && next && fastrand()%2 == 0 {
		next = false
	}

	if next {
	retryNext:
		oldnext := _p_.runnext
		if !_p_.runnext.cas(oldnext, guintptr(unsafe.Pointer(gp))) {
			goto retryNext
		}
		if oldnext == 0 {
			return
		}
		// Kick the old runnext out to the regular run queue.
		gp = oldnext.ptr()
	}

retry:
	h := atomic.LoadAcq(&_p_.runqhead) // load-acquire, synchronize with consumers
	t := _p_.runqtail
	if t-h < uint32(len(_p_.runq)) {
		_p_.runq[t%uint32(len(_p_.runq))].set(gp)
		atomic.StoreRel(&_p_.runqtail, t+1) // store-release, makes the item available for consumption
		return
	}
	if runqputslow(_p_, gp, h, t) {
		return
	}
	// the queue is not full, now the put above must succeed
	goto retry
}

```



解决了 channel 通信唤醒的问题，但是核心 goroutine 有时无法被唤醒的问题依旧存在。