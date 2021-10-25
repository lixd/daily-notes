---
title: "Go语言sync.Cond源码分析"
description: "sync.Cond源码分析及其基本使用介绍"
date: 2020-11-05 22:00:00
draft: false
tags: ["Golang"]
categories: ["Golang"]
---

## 1. 概述

Golang 的 sync 包中的 Cond 实现了一种条件变量，可以使用在**多个Reader**等待共享资源 ready 的场景（如果只有一读一写，一个锁或者channel就搞定了）。

Cond的汇合点：多个goroutines等待、1个goroutine通知事件发生。

比较适合任务调用场景，一个 Master goroutine 通知事件发生，多个 Worker goroutine 在资源没准备好的时候就挂起，等待通知。

**使用方法**

```go
// 创建Cond
cond := sync.NewCond(new(sync.Mutex))
// 挂起goroutine
cond.L.Lock()
cond.Wait()
// 唤醒一个
cond.Signal()
// 唤醒所有
cond.Broadcast()
```

> 基本使用大概是需要等待的时候通过 Wait() 将 Goroutine 挂起，资源准备好的时候再通过 Signal() 或者 Broadcast() 将挂起中的 Goroutine 唤醒。



一个简单的 Demo

```go
func main() {
	var (
		locker sync.Mutex
		cond   = sync.NewCond(&locker)
		wg     sync.WaitGroup
	)

	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(number int) {
			// wait()方法内部是先释放锁 然后在加锁 所以这里需要先 Lock()
			cond.L.Lock()
			defer cond.L.Unlock()
			cond.Wait() // 等待通知,阻塞当前 goroutine
			fmt.Printf("g %v ok~ \n", number)
			wg.Done()
		}(i)
	}
	for i := 0; i < 5; i++ {
		// 每过 50毫秒 唤醒一个 goroutine
		cond.Signal()
		time.Sleep(time.Millisecond * 50)
	}
	time.Sleep(time.Millisecond * 50)
	// 剩下5个 goroutine 一起唤醒
	cond.Broadcast()
	fmt.Println("Broadcast...")
	wg.Wait()
}
```





## 2. 源码分析

> go version 1.14.7



### 1. Cond

```go
/*
package: sync
file： cond.go
line: 21
*/

type Cond struct {
    noCopy noCopy
    L Locker
    notify  notifyList
    checker copyChecker
}

// NewCond() 返回指针，保证多 goroutine 获取到的是同一个实例。
func NewCond(l Locker) *Cond {
	return &Cond{L: l}
}

```



**noCopy**：noCopy对象，实现了`sync.Locker`接口，使得内嵌 noCopy 的对象在进行 go vet 静态检查的时候，可以检查出是否被复制。

> noCopy 具体见 [Go issues 8005](https://github.com/golang/go/issues/8005)
>

```go
/*
package: sync
file： cond.go
line: 94
*/
type noCopy struct{}

func (*noCopy) Lock()   {}
func (*noCopy) Unlock() {}
```



**L**：实现了 `sync.Locker` 接口的锁对象，通常使用 Mutex 或 RWMutex 。

```go
/*
package: sync
file： mutex.go
line: 31
*/
type Locker interface {
     Lock()
     Unlock()
}
```



**notify**：notifyList 对象，维护等待唤醒的 goroutine 队列,使用链表实现。

```go
/*
package: sync
file： runtime.go
line: 33    
*/
type notifyList struct {
	wait   uint32
	notify uint32
	lock   uintptr
	head   unsafe.Pointer
	tail   unsafe.Pointer
}  
```



**checker**：copyChecker 对象，实际上是 uintptr 对象，保存自身对象地址。

```go
/*
package: sync
file： cond.go
line: 79    
*/    
type copyChecker uintptr

func (c *copyChecker) check() {
     if uintptr(*c) != uintptr(unsafe.Pointer(c)) &&
            !atomic.CompareAndSwapUintptr((*uintptr)(c), 0, uintptr(unsafe.Pointer(c))) &&
            uintptr(*c) != uintptr(unsafe.Pointer(c)) {
            panic("sync.Cond is copied")
     }
}
```

* 1）检查当前 checker 对象的地址是否等于保存在 checker 中的地址
  * 由于第一次比较的时候 checker 中没有存地址所以第一次比较肯定是不相等的，于是有了后续 2 3步。

* 2）对 checker 进行 CAS 操作，如果 checker 中存储的地址值为空（就是0）就把当前 checker 对象的地址值存进去
* 3）第三步和第一步一样，再比较一下。
  * 主要是防止在第一步比较发现不相等之后，第二步 CAS 之前，其他 goroutine 也在执行这个方法，并发的将 checker 赋值了，导致这里判定的时候第二步 CAS 失败，返回 false，然后错误的抛出一个 panic，所以执行第三步在比较一下是否相等。如果其他 goroutine 抢先执行 CAS 修改了 checker 中的值导致这里第二步也返回 false 的话，第三步的判定也会是相等的，不会抛出 panic
* 4）如果 3 个条件都成立，那 checker 肯定是被复制了，就是由于 cond 被复制引起的。



> check 方法在第一次调用的时候，会将 checker 对象地址赋值给 checker，也就是将自身内存地址赋值给自身。
> 再次调用 checker 方法的时候，会将当前 checker 对象地址值与 checker 中保存的地址值（原始地址）进行比较，若不相同则表示当前 checker 的地址不是第一次调用 check 方法时候的地址，即 cond 对象被复制了，导致checker 被重新分配了内存地址。





### 2. Wait

```go
/*
package: sync
file： cond.go
line: 52    
*/
func (c *Cond) Wait() {
    // 1.每次操作之前都要检测一下 cond 是否被复制了。
    c.checker.check() 
    // 2.将 notifyList 中的 wait 值加1并返回之前的值
    t := runtime_notifyListAdd(&c.notify) 
    // 3.释放锁，因此在调用Wait方法前，必须保证获取到了cond的锁，否则会报错
    c.L.Unlock()
    // 4.将当前goroutine挂起，等待唤醒信号
    runtime_notifyListWait(&c.notify, t) 
    // 5.gorountine被唤醒，重新获取锁
    c.L.Lock()
}
```

第二步代码如下：

```go
 /*
 package: runtime
 file： sema.go
 line: 479  
 */
func notifyListAdd(l *notifyList) uint32 {
    return atomic.Xadd(&l.wait, 1) - 1
}
```

第四步代码如下：

```go
/*
package: runtime
file： sema.go
line: 488  
*/
// 获取当前 goroutine 添加到链表末端，然后 goparkunlock 函数休眠阻塞当前 goroutine
// goparkunlock 函数会让出当前处理器的使用权并等待调度器的唤醒
func notifyListWait(l *notifyList, t uint32) {
    // 1.锁住 notify 队列
    lock(&l.lock)
    // 2.判断传入的等待序号t是否小于当前已经唤醒的序号notify
    // 如果是则说明当前 goroutine 不需要阻塞了 直接解锁并返回
    // 有可能执行这步之前 goroutine 就已经被唤醒了
    if less(t, l.notify) {
        unlock(&l.lock)
        return
    }
    // 3.获取当前 goroutine，设置相关参数，将当前等待数赋值给 ticket
    s := acquireSudog()
    s.g = getg()
    s.ticket = t
    s.releasetime = 0
    t0 := int64(0)
    if blockprofilerate > 0 {
        t0 = cputicks()
        s.releasetime = -1
    }
    // 4.将当前 goroutine 写入到链表尾部
    if l.tail == nil {
        l.head = s
    } else {
        l.tail.next = s
    }
    l.tail = s
    // 5. 调用 goparkunlock 函数将当前 goroutine 挂起，等待唤醒信号
    goparkunlock(&l.lock, "semacquire", traceEvGoBlockCond, 3)
    if t0 != 0 {
        blockevent(s.releasetime-t0, 2)
    }
    releaseSudog(s)
}
```

### 3. Signal

```go
/*
package: sync
file： cond.go
line: 64  
*/
func (c *Cond) Signal() {
    // 1.复制检查
    c.checker.check() 
    // 2.顺序唤醒一个等待的gorountine
    runtime_notifyListNotifyOne(&c.notify)
}

```



```go
/*
package: runtime
file： sema.go
line: 554  
*/
func notifyListNotifyOne(l *notifyList) {
   // 1.等待序号和唤醒序号相同则说明没有需要唤醒的 goroutine 直接返回
   if atomic.Load(&l.wait) == atomic.Load(&l.notify) {
        return
   }
   // 2.锁住队列后再检查一遍等待序号和唤醒序号是否相同即判断有没有需要唤醒的 goroutine，没有则解锁后直接返回
   lock(&l.lock) 
   t := l.notify
   if t == atomic.Load(&l.wait) {
        unlock(&l.lock)
        return
   }
   // 3.到这里就说明有需要唤醒的 goroutine，于是先将 notify序号+1
   atomic.Store(&l.notify, t+1)  
   // 4.然后就开始唤醒 goroutine 了
   for p, s := (*sudog)(nil), l.head; s != nil; p, s = s, s.next {
        // 4.1 找到 ticket等于当前唤醒序号的 goroutine
        if s.ticket == t {
           // 4.2 然后将其从等待唤醒链表中移除（因为这个 goroutine 马上就要被唤醒了）
           n := s.next
           if p != nil {
               p.next = n
           } else {
               l.head = n
           }
           if n == nil {
               l.tail = p
           }
           unlock(&l.lock)
           s.next = nil
           // 4.3 然后唤醒这个 goroutine 
           readyWithTime(s, 4)
           return
       }
   }
   // 4.4 最后解锁队列 
   unlock(&l.lock)
}
```



### 4. Broadcast

唤醒链表中所有的阻塞中的goroutine，还是使用readyWithTime来实现这个功能

```go
/*
package: sync
file： cond.go
line: 73  
*/
func (c *Cond) Broadcast() {
    // 1.复制检查
    c.checker.check()
    // 2.唤醒所有在等待的 goroutine
    runtime_notifyListNotifyAll(&c.notify)
}
```



这里和 `notifyListNotifyOne()`差不多，只是一次性唤醒所有 goroutine。

```go
/*
package: runtime
file： sema.go
line: 522 
*/
func notifyListNotifyAll(l *notifyList) {
    // 1.等待序号和唤醒序号相同则说明没有需要唤醒的 goroutine 直接返回
    if atomic.Load(&l.wait) == atomic.Load(&l.notify) {
        return
    }

    // 2. 将链表头尾指针置为空（可以看做是清空整个等待队列）
    // 但是需要将当前的链表头保存下来，不然等会找不到链表中的数据了
    lock(&l.lock)
    s := l.head
    l.head = nil
    l.tail = nil

    // 3.直接将notify需要赋值成等待序号（这样表示当前没有需要唤醒的 goroutine 了）
    // 前面唤醒一个的时候这里是+1
    atomic.Store(&l.notify, atomic.Load(&l.wait))
    unlock(&l.lock)

   // 4.最后 for 循环唤醒链表中所有等待状态的 goroutine
    for s != nil {
        next := s.next
        s.next = nil
        readyWithTime(s, 4)
        s = next
    }
}
```

## 3. 小结

**基本使用**

* 1）资源未准备好时，使用 Wait() 方法将 goroutine 挂起，由底层实现，会让出 CPU 时间片，从而避免使用无意义的循环浪费系统资源。
* 2）资源准备好时通过 Signal() 或者 Broadcast() 方法唤醒一个或多个被挂起的 goroutine。



**等待唤醒流程**

* 1）所有相关数据都是存在 notifyList 中的，包括 goroutine 和一些计数信息。
* 2）其中的 wait 和 notify 可以理解为等待序号和唤醒序号，都是自增值，wait 在有新 goroutine 等待时+1，notify 则在唤醒一个 goroutine 时+1。
* 3）等待状态的 goroutine 信息则存放在链表中，等待时加入链表尾部，唤醒时移除。
* 4）每个等待链表的 goroutine  都会将当前的 wait（等待序号）赋值给 ticket 字段，唤醒的时候会将 ticket=唤醒序号的 goroutine 唤醒。
* 5）当 wait==notify 时表示没有 goroutine 需要被唤醒，wait>notify 时表示有 goroutine 需要被唤醒，wait 恒大于等于 notify。



**noCopy**

Cond在内部持有一个等待队列 notifyList ，这个队列维护所有等待在这个 Cond 的 goroutine。如果 Cond 被复制则会导致其中的等待队列也被复制，最终可能会导致在唤醒 goroutine 的时候出现错误。



Kubernetes 的调度中也用到了 sync.Cond 有兴趣的可以研究一下。

> https://mp.weixin.qq.com/s/rKLiazgWzneJfpfgHay8cA
>
> https://github.com/kubernetes/kubernetes/blob/0599ca2bcfcae7d702f95284f3c2e2c2978c7772/pkg/scheduler/internal/queue/scheduling_queue.go



## 4. 参考

`https://ieevee.com/tech/2019/06/15/cond.html`

`https://segmentfault.com/a/1190000019957459`

`https://www.jianshu.com/p/7b59d1d92a95`

`http://www.pydevops.com/2016/12/04/go-cond源码剖析-3/`