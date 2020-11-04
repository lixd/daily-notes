# sync.Cond

>
>
>https://developer.aliyun.com/article/740913
>
>https://segmentfault.com/a/1190000019957459
>
>https://www.jianshu.com/p/7b59d1d92a95
>
>http://www.pydevops.com/2016/12/04/go-cond%E6%BA%90%E7%A0%81%E5%89%96%E6%9E%90-3/
>
>https://ieevee.com/tech/2019/06/15/cond.html

## 1. 概述

Golang的sync包中的Cond实现了一种条件变量，可以使用在**多个Reader**等待共享资源ready的场景（如果只有一读一写，一个锁或者channel就搞定了）。

Cond的汇合点：多个goroutines等待、1个goroutine通知事件发生。

每个Cond都会关联一个Lock（*sync.Mutex or *sync.RWMutex），当修改条件或者调用Wait方法时，必须加锁，**保护condition**。

Cond 提供了以下三个方法：

- Signal：调用Signal之后可以唤醒单个goroutine。
- Broadcast：唤醒等待队列中所有的goroutine。
- Wait：会把当前goroutine放入到队列中等待获取通知，调用此方法必须先Lock,不然方法里会调用Unlock()报错。



基本使用大概是需要等待的时候通过 Wait() 将 Goroutine 挂起，资源准备好的时候再通过 Signal() 或者 Broadcast() 将挂起中的 Goroutine 唤醒。


## 2. 源码分析

### 1. Cond

```go
type Cond struct {
	noCopy noCopy

	// L is held while observing or changing the condition
	L Locker

	notify  notifyList
	checker copyChecker
}

// NewCond returns a new Cond with Locker l.
func NewCond(l Locker) *Cond {
	return &Cond{L: l}
}

```



Cond主要有三个函数构成，Broadcast(), Signal(), Wait()。



### Broadcast



### Signal



### Wait

