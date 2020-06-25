# 流水线FAN模式



## 1. 概述

- **FAN-OUT模式：多个goroutine从同一个通道读取数据，直到该通道关闭。**OUT是一种张开的模式，所以又被称为扇出，可以用来分发任务。
- **FAN-IN模式：1个goroutine从多个通道读取数据，直到这些通道关闭。**IN是一种收敛的模式，所以又被称为扇入，用来收集处理的结果。

![](images/pipeline-fan.webp)



## 2. 例子

我们这次试用FAN-OUT和FAN-IN，解决《Golang并发模型：轻松入门流水线模型》中提到的问题：计算一个整数切片中元素的平方值并把它打印出来。

- `producer()`保持不变，负责生产数据。
- `squre()`也不变，负责计算平方值。
- 修改`main()`，启动3个square，这3个squre从producer生成的通道读数据，**这是FAN-OUT**。
- 增加`merge()`，入参是3个square各自写数据的通道，给这3个通道分别启动1个协程，把数据写入到自己创建的通道，并返回该通道，**这是FAN-IN**。



```go
func main() {
	in := producer(1, 2, 3, 4)
	c1 := square(in)
	c2 := square(in)
	c3 := square(in)
	for v := range merge(c1,c2,c3) {
		fmt.Println(v)
	}
}


// merge 从多个通道读取值 FAN-IN 模式
func merge(cs ...<-chan int) <-chan int {
	out := make(chan int)

	var wg sync.WaitGroup
	// 处理数据的 func
	collect := func(in <-chan int) {
		defer wg.Done()
		for v := range in {
			out <- v
		}
	}

	wg.Add(len(cs))
	for _, ch := range cs {
		go collect(ch)
	}

	// 错误方式：直接等待是bug，死锁，因为merge写了out，main却没有读
	// wg.Wait()
	// close(out)

	// 正确方式
	go func() {
		wg.Wait()
		close(out)
	}()

	return out
}

```

## 3. 小结

**FAN模式真能提升性能吗？**

- FAN模式可以提高CPU利用率。
- **FAN模式不一定能提升效率，降低程序运行时间。**
- **适当使用带缓冲通道可以提高程序性能**

