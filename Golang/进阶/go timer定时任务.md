# Go Timer&Ticker

## 0. 最佳实践

* Timer：只会触发一次，因此只适合单次任务
  * 不要在循环中调用 time.After
  * 不建议使用 time.Reset 来让 timer 触发多次
  * **单次任务所以推荐使用 time.After，写法上更简洁**
* Ticker：会触发多次，适合重复任务
  * 不要再循环中调用 time.Tick
  * 需要手动停止 Ticker
  * **重复任务，所以推荐使用 time.NewTicker 以复用 ticker**

```go
// timerGood timer 只会触发一次，所以只适合用于单次任务
func timerGood() {
	select {
	case <-time.After(time.Second):
		fmt.Println("timerGood: time.After")
	}
}
```

```go
// tickerGood 会触发多次适合重复任务，使用 time.NewTicker 以复用 ticker
func tickerGood() {
	ticker := time.NewTicker(time.Second * 2) // 复用 ticker
	defer ticker.Stop()                       // 需要手动停止 ticker，
	for {
		select {
		case t := <-ticker.C:
			fmt.Println(t, "time.NewTicker")
		}
	}
}
```







## 1. Timer

### 结构

```go
type Timer struct {
	C <-chan Time // 每过一次定时时间就会往该 channel发送一次数据
	r runtimeTimer
}
```



### NewTimer

主要通过 Timer.C 这个 chan 中是否有值，来判断定时任务是否触发了。

```go
func NewTimer(d Duration) *Timer {
	c := make(chan Time, 1)
	t := &Timer{
		C: c,
		r: runtimeTimer{
			when: when(d),
			f:    sendTime,
			arg:  c,
		},
	}
	startTimer(&t.r)
	return t
}
```



**time.After()**是一种简便写法：

```go
func After(d Duration) <-chan Time {
	return NewTimer(d).C
}
```



### Example

```go
timer := time.NewTimer(time.Second)
select {
    case <-timer.C:
    println("time out, and end")
}
```

### 注意事项

**time.After 写法问题**

每次执行 time.After 会创建一个新 timer，不建议在循环中调用。

```go
for {
    select {
        // 每次进入 执行 time.After 都会分配一个新的 timer。因此会在短时间内创建大量的无用 timer，
        // 虽然没用的 timer 在触发后会消失，但这种写法会造成无意义的 cpu 资源浪费
        case <-time.After(time.Second):
        println("time out, and end")
    }
}
```



**time.Reset 不推荐使用**

timer 只会触发一次，虽然 Reset 后又可以再次触发了,不过不推荐，重复任务更推荐使用 ticker

```go
timer := time.NewTimer(time.Second)
for {
    select {
        case <-timer.C:
        println("time out, and end")
        timer.Reset(time.Second) // 不推荐使用
    }
}
```



## 2. Ticker

### 2.1 结构

```go
type Ticker struct {
	C <-chan Time // 每过一次定时时间就会往该 channel发送一次数据
	r runtimeTimer
}
```



### 2.2 NewTicker

ticker 每过一次定时时间就会往 chan 中发送一次数据，表示触发任务了。

```go
	// 指定定时时间 
	ticker := time.NewTicker(2 * time.Second)

// 指定 r runtimeTimer
func NewTicker(d Duration) *Ticker {
	if d <= 0 {
		panic(errors.New("non-positive interval for NewTicker"))
	}
	// Give the channel a 1-element time buffer.
	// If the client falls behind while reading, we drop ticks
	// on the floor until the client catches up.
	c := make(chan Time, 1)
	t := &Ticker{
		C: c,
		r: runtimeTimer{
			when:   when(d),
			period: int64(d),
			f:      sendTime,
			arg:    c,
		},
	}
	startTimer(&t.r)
	return t
}
```



### 2.3 Example

```go
func main(){
	ticker := time.NewTicker(time.Second * 2)
	defer ticker.Stop()
	for {
		select {
		case t := <-ticker.C:
			fmt.Println(t, "time.NewTicker")
		}
	}
}
```



### 2.4 注意事项

**time.Tick**

```go
for {
    select {
        // 不推荐  每次都会 new 一个 ticker
        case t := <-time.Tick(time.Second * 2):
        fmt.Println(t, "time.Tick")
    }
}
```

推荐使用 timer.NewTicker() 以复用：

```go
// tickerGood 需要手动停止 ticker，会触发多次适合重复任务
ticker := time.NewTicker(time.Second * 2)
defer ticker.Stop()
for {
    select {
        case t := <-ticker.C:
        fmt.Println(t, "time.NewTicker")
    }
}
```





**ticker Stop**

ticker 使用后需要手动关闭，可能会造成 ticker 泄漏。

```go
ticker := time.NewTicker(time.Second * 2)
defer ticker.Stop()
```

