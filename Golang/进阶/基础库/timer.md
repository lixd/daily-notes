# Timer

## 1. ticker

```go
func Tick(d Duration) <-chan Time
func NewTicker(d Duration) *Ticker
func (t *Ticker) Stop()
```

需要注意的是，ticker 在不使用时，应该手动 stop，如果不 stop 可能会造成 timer 泄漏。泄漏之后会在时间堆中累积越来越多的 timer 对象，从而发生更麻烦的问题。

例子

```go
func tickerBad() {
	for {
		select {
		// 错误写法 每次都会 new 一个 ticker
		case t := <-time.Tick(time.Second * 2):
			fmt.Println(t, "time.Tick")
		}
	}
}

func tickerGood() {
	ticker := time.NewTicker(time.Second * 2)
	for {
		select {
		case t := <-ticker.C:
			fmt.Println(t, "time.NewTicker")
		}
	}
}
```



## 2. timer

```go
func After(d Duration) <-chan Time
func NewTimer(d Duration) *Timer
func (t *Timer) Reset(d Duration) bool
func (t *Timer) Stop() bool
```

time.After 一般用来控制某些耗时较长的行为，在超时后不再等待，以使程序行为可预期。如果不做超时取消释放资源，则可能因为依赖方响应缓慢而导致本地资源堆积，例如 fd，连接数，内存占用等等。从而导致服务宕机。

time.After 和 time.Tick 不同，是一次性触发的，触发后 timer 本身会从时间堆中删除。所以一般情况下直接用 `<-time.After` 是没有问题的，不过在 for 循环的时候要注意:

```go
func timerBad() {
	var ch = make(chan int)
	go func() {
		for {
			ch <- 1
		}
	}()

	for {
		select {
		// 但每次进入 select，time.After 都会分配一个新的 timer。因此会在短时间内创建大量的无用 timer，
		// 虽然没用的 timer 在触发后会消失，但这种写法会造成无意义的 cpu 资源浪费
		case <-time.After(time.Second):
			println("time out, and end")
		case <-ch:
		}
	}
}
```

上面的代码，<-ch 这个 case 每次执行的时间都很短，但每次进入 select，`time.After` 都会分配一个新的 timer。因此会在短时间内创建大量的无用 timer，虽然没用的 timer 在触发后会消失，但这种写法会造成无意义的 cpu 资源浪费。正确的写法应该对 timer 进行重用，如下:

```go
func timerGood() {
	var ch = make(chan int)
	go func() {
		for {
			ch <- 1
		}
	}()
	// timer 复用 
	timer := time.NewTimer(time.Second)
	for {
		timer.Reset(time.Second)
		select {
		case <-timer.C:
			println("time out, and end")
		case <-ch:
		}
	}
}
```

和 Ticker 一样，如果之前的 timer 没用了，可以手动 Stop 以使该 timer 从时间堆中移除。

