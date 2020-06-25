# 协程退出方式

### 使用for-range退出

`for-range`是使用频率很高的结构，常用它来遍历数据，**`range`能够感知channel的关闭，当channel被发送数据的协程关闭时，range就会结束**，接着退出for循环。

```go
func forRange(in <-chan int) {
	for v := range in {
		fmt.Println(v)
	}
}
```

### 使用,ok退出

`for-select`也是使用频率很高的结构，select提供了多路复用的能力，所以for-select可以让函数具有持续多路处理多个channel的能力。**但select没有感知channel的关闭，这引出了2个问题**：

1. 继续在关闭的通道上读，会读到通道传输数据类型的零值，如果是指针类型，读到nil，继续处理还会产生nil。
2. 继续在关闭的通道上写，将会panic。

问题2可以这样解决，通道只由发送方关闭，接收方不可关闭，即某个写通道只由使用该select的协程关闭，select中就不存在继续在关闭的通道上写数据的问题。

问题1可以使用`,ok`来检测通道的关闭，使用情况有2种。

第一种：**如果某个通道关闭后，需要退出协程，直接return即可**

```go
func forSelectOne(in <-chan int) {
	for {
		select {
		case x, ok := <-in:
			if !ok {
				return
			}
			fmt.Println(x)
		case <-time.After(time.Second * 1):
			fmt.Println("wait...")
		}
	}
}
```



第二种：如果**某个通道关闭了，不再处理该通道，而是继续处理其他case**，退出是等待所有的可读通道关闭。我们需要**使用select的一个特征：select不会在nil的通道上进行等待**。这种情况，把只读通道设置为nil即可解决。

```go
func forSelectTwo(in <-chan int) {
	for {
		select {
		case x, ok := <-in:
			if !ok {
				// 赋值为 nil 后 select 就不会在当前 case 等待了
				in = nil
			}
			fmt.Println(x)
		case <-time.After(time.Second * 1):
			fmt.Println("wait...")
		}
	}
}
```

### 使用退出通道退出

```go
func channel(in <-chan int, stopCh <-chan struct{}) {
	for {
		select {
		case x, ok := <-in:
			if !ok {
				// 赋值为 nil 后 select 就不会在当前 case 等待了
				in = nil
			}
			fmt.Println(x)
		//	同时监听 另一个用于传递 stop 信号的 chan
		case <-stopCh:
			fmt.Println("stop...")
		}
	}
}
```



### 小结

* 1) **发送协程主动关闭通道，接收协程不关闭通道。**

> 技巧：把接收方的通道入参声明为只读，如果接收协程关闭只读协程，编译时就会报错。

* 2) 协程处理1个通道，并且是读时，协程优先使用`for-range`，因为`range`可以关闭通道的关闭自动退出协程。

* 3) `,ok`可以处理多个读通道关闭，需要关闭当前使用`for-select`的协程。

* 4) 显式关闭通道`stopCh`可以处理主动通知协程退出的场景。

