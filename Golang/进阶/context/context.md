# Go中的Context

## 1. 概述

### 1.1 作用

* 1.web编程中，一个请求对应多个goroutine之间的数据交互
* 2.超时控制
* 3.上下文控制

### 1.2 底层结构

```go
type Context interface {
    //返回一个time.Time，表示当前Context应该结束的时间，ok则表示有结束时间
    Deadline() (deadline time.Time, ok bool)
    //当Context被取消或者超时时候返回的一个close的channel，告诉给context相关的函数要停止当前工作然后返回了。(这个有点像全局广播)
    Done() <-chan struct{}
    //context被取消的原因
    Err() error
    //ntext实现共享数据存储的地方，是协程安全的
    Value(key interface{}) interface{}
}
```

`Done()` 返回一个 channel，可以表示 context 被取消的信号：当这个 channel 被关闭时，说明 context 被取消了。注意，这是一个只读的channel。 我们又知道，**读一个关闭的 channel 会读出相应类型的零值**。并且**源码里没有地方会向这个 channel 里面塞入值**。换句话说，**这是一个 `receive-only` 的 channel。因此在子协程里读这个 channel，除非被关闭，否则读不出来任何东西**。也正是利用了这一点，子协程从 channel 里读出了值（零值）后，就可以做一些收尾工作，尽快退出。



同时包中也定义了提供cancel功能需要实现的接口。这个主要是后文会提到的“取消信号、超时信号”需要去实现。

```go
// A canceler is a context type that can be canceled directly. The
// implementations are *cancelCtx and *timerCtx.
type canceler interface {
	cancel(removeFromParent bool, err error)
	Done() <-chan struct{}
}

```

### 1.3 context的创建

为了更方便的创建Context，包里头定义了Background来作为所有Context的根，它是一个emptyCtx的实例。

```go
var (
    background = new(emptyCtx)
    todo       = new(emptyCtx) // 
)

func Background() Context {
    return background
}
```

你可以认为所有的Context是树的结构，Background是树的根，当任一Context被取消的时候，那么继承它的Context 都将被回收

## 2. context实战应用

### 2.1 WithCancel

可以手动取消的 Context

```go
func WithCancel(parent Context) (ctx Context, cancel CancelFunc) {
	c := newCancelCtx(parent)
	propagateCancel(parent, &c)
	return &c, func() { c.cancel(true, Canceled) }
}
```

cancel 方法如下

```go
func (c *cancelCtx) cancel(removeFromParent bool, err error) {
    // 必须要传 err
	if err == nil {
		panic("context: internal error: missing cancel error")
	}
	c.mu.Lock()
	if c.err != nil {
		c.mu.Unlock()
		return // 已经被其他协程取消
	}
	// 给 err 字段赋值
	c.err = err
	// 关闭 channel，通知其他协程
	if c.done == nil {
		c.done = closedchan
	} else {
		close(c.done)
	}
	
	// 遍历它的所有子节点
	for child := range c.children {
	    // 递归地取消所有子节点
		child.cancel(false, err)
	}
	// 将子节点置空
	c.children = nil
	c.mu.Unlock()

	if removeFromParent {
	    // 从父节点中移除自己 
		removeChild(c.Context, c)
	}
}
```

主要就是关闭 channel（c.done ），然后遍历 cancel 掉所有的子节点。

还注意到一点，调用子节点 cancel 方法的时候，传入的第一个参数 `removeFromParent` 是 false。但是 WithCancel 返回的 cancel 第一个参数确实 true

当 `removeFromParent` 为 true 时，会将当前节点的 context 从父节点 context 中删除：

```go
func removeChild(parent Context, child canceler) {
	p, ok := parentCancelCtx(parent)
	if !ok {
		return
	}
	p.mu.Lock()
	if p.children != nil {
		delete(p.children, child)
	}
	p.mu.Unlock()
}
```

最关键的一行：

```go
delete(p.children, child)
```

什么时候会传 true 呢？答案是调用 `WithCancel()` 方法的时候，也就是新创建一个可取消的 context 节点时，返回的 cancelFunc 函数会传入 true。这样做的结果是：当调用返回的 cancelFunc 时，会将这个 context 从它的父节点里“除名”，因为父节点可能有很多子节点，你自己取消了，所以我要和你断绝关系，对其他人没影响。

![](./assets/context-cancel.png)



例子：

```go
func main(){
    ctx, cancel := context.WithCancel(context.Background())
	add := CountAddCancel(ctx)
	for value := range add {
        //当累加超过30时 手动调用cancel() 取消context
		if value > 30 {
			cancel()
			break
		}
	}
	fmt.Println("正在统计结果。。。")
	time.Sleep(1500 * time.Millisecond)
}

func CountAddCancel(ctx context.Context) <-chan int {
	c := make(chan int)
	n := 0
	t := 0
	go func() {
		for {
			time.Sleep(time.Second * 1)
			select {
               //手动调用cancel() 取消context 后 channel被close
			case <-ctx.Done():
				fmt.Printf("耗时 %d S 累加值 % d \n", t, n)
                return
			case c <- n:
				// 随机增加1-5
				incr := rand.Intn(4) + 1
				n += incr
				t++
				fmt.Printf("当前累加值 %d \n", n)
			}
		}
	}()
	return c
}
```

### 2.2 WithDeadline & WithTimeout

设定超时时间，时间到了自动取消context。

```go
func WithDeadline(parent Context, d time.Time) (Context, CancelFunc) {
	if cur, ok := parent.Deadline(); ok && cur.Before(d) {
		// The current deadline is already sooner than the new one.
		return WithCancel(parent)
	}
	c := &timerCtx{
		cancelCtx: newCancelCtx(parent),
		deadline:  d,
	}
	propagateCancel(parent, c)
	dur := time.Until(d)
	if dur <= 0 {
		c.cancel(true, DeadlineExceeded) // deadline has already passed
		return c, func() { c.cancel(true, Canceled) }
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.err == nil {
		c.timer = time.AfterFunc(dur, func() {
			c.cancel(true, DeadlineExceeded)
		})
	}
	return c, func() { c.cancel(true, Canceled) }
}

func WithTimeout(parent Context, timeout time.Duration) (Context, CancelFunc) {
	return WithDeadline(parent, time.Now().Add(timeout))
}

```



```go
func main(){
 	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	CountAddTimeOut(ctx)
	defer cancel()
}

func CountAddTimeOut(ctx context.Context) {
	n := 0
	for {
		select {
		case <-ctx.Done():
			fmt.Println("时间到了 \n")
			return
		default:
			incr := rand.Intn(4)+1
			n += incr
			fmt.Printf("当前累加值 %d \n", n)
		}
		time.Sleep(time.Second)
	}
}
```

### 2.3 WithValue

可以传递数据的context，携带关键信息，为全链路提供线索，比如接入elk等系统，需要来一个trace_id，那WithValue就非常适合做这个事。

```go
func WithValue(parent Context, key, val interface{}) Context {
	if key == nil {
		panic("nil key")
	}
	if !reflect.TypeOf(key).Comparable() {
		panic("key is not comparable")
	}
	return &valueCtx{parent, key, val}
}
```

## 3. 建议

* 1.不要把Context放在结构体中，要以参数的方式传递，parent Context一般为Background

* 2。应该要把Context作为第一个参数传递给入口请求和出口请求链路上的每一个函数，放在第一位，变量名建议都统一，如ctx。

* 3.给一个函数方法传递Context的时候，不要传递nil，否则在tarce追踪的时候，就会断了连接
* 4.Context的Value相关方法应该传递必须的数据，不要什么数据都使用这个传递

* 5.Context是线程安全的，可以放心的在多个goroutine中传递

* 6.可以把一个 Context 对象传递给任意个数的 gorotuine，对它执行 取消 操作时，所有 goroutine 都会接收到取消信号。

## 4. 参考

`https://blog.csdn.net/qq_36183935/article/details/81137834`

`https://blog.csdn.net/u011957758/article/details/82948750`

`https://www.jianshu.com/p/e5df3cd0708b`

