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

## 3.建议

**Context要是全链路函数的第一个参数**。

## 4. 参考

`https://blog.csdn.net/qq_36183935/article/details/81137834`

`https://blog.csdn.net/u011957758/article/details/82948750`