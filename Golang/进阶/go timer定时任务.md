# Go Ticker 定时任务

## 1. 简单使用

### 1.1 结构

```go

type Ticker struct {
	C <-chan Time // 每过一次定时时间就会往该 channel发送一次数据
	r runtimeTimer
}
```



### 1.2 NewTicker

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

### 1.3 执行定时任务

ticker每过一次定时时间就会往

```go
for {
		// 从ticker.C channel中取数据
		<-ticker.C
		fmt.Println("child goroutine bootstrap running")
	}
```

## 2. Example

```go
func TestHoursJob(t *testing.T) {
	// 指定使用多核
	runtime.GOMAXPROCS(runtime.NumCPU())
	// 定时时间 每过这个时间会往ticker.C 这个channel中发一个数据
	ticker := time.NewTicker(2 * time.Second)
	go func() {
		defer func() {
			err := recover()
			if err != nil {
				fmt.Println(err)
			}
		}()
		fmt.Println("goroutine bootstrap start")
		go func() {
			defer func() {
				err := recover()
				if err != nil {
					fmt.Println(err)
				}
			}()
			for {
				// 从ticker.C channel中取数据
				<-ticker.C
				fmt.Println("child goroutine bootstrap running")
			}
		}()
	}()
	select {}
}
```

> 就是阻塞在一个for循环内，等待到了定时器的C从channel出来，当获取到值的时候，进行想要的操作。