# pipeline 入门



## 1. 概述

Golang并发核心思路是关注数据流动。数据流动的过程交给channel，数据处理的每个环节都交给goroutine，把这些流程画起来，有始有终形成一条线，那就能构成流水线模型。



## 2. 例子

举个例子，设计一个程序：计算一个整数切片中元素的平方值并把它打印出来。非并发的方式是使用for遍历整个切片，然后计算平方，打印结果。

我们使用流水线模型实现这个简单的功能，从流水线的角度，可以分为3个阶段：

* 1) 遍历切片，这是生产者。
* 2) 计算平方值。
* 3) 打印结果，这是消费者。



```go
package main

import "fmt"

func main() {
	in := producer(1, 2, 3, 4)
	ch := square(in)
	for v := range ch {
	fmt.Println(v)
	}
}
// producer 负责生产数据 它会把数据写入通道，并把它写数据的通道返回。
func producer(nums ...int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for _, v := range nums {
			out <- v
		}
	}()
	return out
}
// square 负责从某个通道读数字，然后计算平方，将结果写入通道，并把它的输出通道返回。
func square(inChan <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for v := range inChan {
			out <- v * v
		}
	}()
	return out
}

```



结果：

```go
1
4
9
16
```

## 3. 小结

这是一种原始的流水线模型，这种原始能让我们掌握流水线的思路。

**流水线的特点**

* 1) 每个阶段把数据通过channel传递给下一个阶段。
* 2) 每个阶段要创建1个goroutine和1个通道，这个goroutine向里面写数据，函数要返回这个通道。
* 3) 有1个函数来组织流水线，我们例子中是main函数。



原文:

```text
https://mp.weixin.qq.com/s/YB5XZ5NatniHSYBQ3AHONw
```

