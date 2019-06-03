## 协程

### 概述

Go 语言在语言层面上支持了并发，goroutine是Go语言提供的一种用户态线程，有时我们也称之为协程。所谓的协程，某种程度上也可以叫做轻量线程，它不由os而由应用程序创建和管理，因此使用开销较低（一般为4K）。我们可以创建很多的goroutine，并且它们跑在同一个内核线程之上的时候，就需要一个调度器来维护这些goroutine，确保所有的goroutine都能使用cpu，并且是尽可能公平地使用cpu资源。

调度器的主要有4个重要部分，分别是M、G、P、Sched，前三个定义在runtime.h中，Sched定义在proc.c中。

- M (work thread) 代表了系统线程OS Thread，由操作系统管理。
- P (processor) 衔接M和G的调度上下文，它负责将等待执行的G与M对接。P的数量可以通过GOMAXPROCS()来设置，它其实也就代表了真正的并发度，即有多少个goroutine可以同时运行。
- G (goroutine) goroutine的实体，包括了调用栈，重要的调度信息，例如channel等。

在操作系统的OS Thread和编程语言的User Thread之间，实际上存在3种线程对应模型，也就是：1:1，1:N，M:N。

协程是轻量级的线程 [编译器优化]

独立的栈

共享堆

由用户控制

主线程是物理线程，直接作用在cpu上，是重量级的，非常消耗cpu资源。

协程从主线程开启，是轻量级的线程，是逻辑态，资源消耗相对小

### MPG模式

M关联了一个内核线程，通过调度器P（上下文）的调度，可以连接1个或者多个G,相当于把一个内核线程切分成了了N个用户线程，M和P是一对一关系（但是实际调度中关系多变），通过P调度N个G（P和G是一对多关系），实现内核线程和G的多对多关系（M:N），通过这个方式，一个内核线程就可以起N个Goroutine，同样硬件配置的机器可用的用户线程就成几何级增长，并发性大幅提高



运行情况：

1) 分成两个部分来看
2) 原来的情况是M0主线程正在执行GO协程，另外有三个协程在队列等待 
3) 如果GO协程阻塞,比如读取文件或者数据库等
4) 这时就会创建M1主线程(也可能是从己有的线程池中取出Ml), 将等待的3个协程挂到M1开始执行，M0主线程下的GO仍然执 行文件IO的读写。
5) 这样的MPG调度模式，可以既让GO执行，同时也不会让队列的其它协程一直阻塞，仍然 可以并发/并行执行。
6) 等到GO不阻塞了，M0会被放到空闲的主线程 继续执行(从已有的线程池中取)，同时GO又会 被唤醒。

## 资源共享 通信

### sync

```go
import "sync"
```

sync包提供了基本的同步基元，如互斥锁。除了Once和WaitGroup类型，大部分都是适用于低水平程序线程，高水平的同步使用channel通信更好一些。

```go
	//声明一个全局互斥锁
	lock sync.Mutex
	//加锁解锁
	lock.Lock()
	myMap[n] = res
	lock.Unlock()
```

## 管道

### 概述

* 1.`channel` 本质就是一个数据结构-队列
* 2.数据是先进先出
* 3.线程安全 多 `goroutine`读取时 不需要加锁 channel 本身就是线程安全的
* 4.channel 是有类型的 string 类型的 channel 只能存放 string 类型数据

### 内部结构

每个channel内部实现都有三个队列

**接收消息的协程队列**。这个队列的结构是一个限定最大长度的链表，所有阻塞在channel的接收操作的协程都会被放在这个队列里。

**发送消息的协程队列**。这个队列的结构也是一个限定最大长度的链表。所有阻塞在channel的发送操作的协程也都会被放在这个队列里。

**环形数据缓冲队列**。这个环形数组的大小就是channel的容量。如果数组装满了，就表示channel满了，如果数组里一个值也没有，就表示channel是空的。对于一个阻塞型channel来说，它总是同时处于即满又空的状态。

一个channel被所有使用它的协程所引用，也就是说，只要这两个装了协程的队列长度大于零，那么这个channel就永远不会被垃圾回收。另外，协程本身如果阻塞在channel的读写操作上，这个协程也永远不会被垃圾回收，即使这个channel只会被这一个协程所引用。

### 基本使用

channel 是引用类型

channel 必须初始化才能写入数据 即 make 后才能使用

语法：`var 变量名 chan 数据类型`

```go
package main

import "fmt"

func main() {
	//1.声明管道
	var intChan chan int
	intChan = make(chan int, 3)
	// 2.引用类型 值为地址 0xc000094080
	fmt.Println(intChan)

	//3.向管道写入数据
	intChan <- 10
	//注意：写入数据时不能超过其容量
	fmt.Printf("channel len%v cap %v \n", len(intChan), cap(intChan))

	//4.读取数据 读取后len减少 cap不变 可以继续存数据了
	var num int
	num = <-intChan
	fmt.Println(num)

	fmt.Printf("channel len%v cap %v \n", len(intChan), cap(intChan))

}

```

使用ch <- v发送一个值v到channel。发送值到channel可能会有多种结果，即可能成功，也可能阻塞，甚至还会引发panic，取决于当前channel在什么状态。

使用 `v, ok <- ch` 接收一个值。**第二个遍历ok是可选的，它表示channel是否已关闭**。接收值只会又两种结果，要么成功要么阻塞，而永远也不会引发panic。

### select

select块是为channel特殊设计的语法，它和switch语法非常相近。分支上它们都可以有多个case块和做多一个default块，但是也有很多不同。

* select 到 括号{之间不得有任何表达式

* fallthrough关键字不能用在select里面

* 所有的case语句要么是channel的发送操作，要么就是channel的接收操作

* select里面的case语句是随机执行的，而不能是顺序执行的。

设想如果第一个case语句对应的channel是非阻塞的话，case语句的顺序执行会导致后续的case语句一直得不到执行除非第一个case语句对应的channel里面的值都耗尽了。

* 如果所有case语句关联的操作都是阻塞的，default分支就会被执行。

如果没有default分支，当前goroutine就会阻塞，当前的goroutine会挂接到所有关联的channel内部的协程队列上。 

所以说单个goroutine是可以同时挂接到多个channel上的，甚至可以同时挂接到同一个channel的发送协程队列和接收协程队列上。当一个阻塞的goroutine拿到了数据解除阻塞的时候，它会从所有相关的channel队列中移掉。

**通过select+case加入一组管道，当满足（这里说的满足意思是有数据可读或者可写)select中的某个case时候，那么该case返回，若都不满足case，则走default分支**。

```go
package main

import (
    "fmt"
)

func send(c chan int)  {
    for i :=1 ; i<10 ;i++  {
     c <-i
     fmt.Println("send data : ",i)
    }
}

func main() {
    resch := make(chan int,20)
    strch := make(chan string,10)
    go send(resch)
    strch <- "wd"
    select {
    case a := <-resch:
        fmt.Println("get data : ", a)
    case b := <-strch:
        fmt.Println("get data : ", b)
    default:
        fmt.Println("no channel actvie")

    }

}

//结果：get data :  wd
```



### channel 遍历和关闭

#### 关闭

使用内置函数 close 可以关闭 channel，当 channel关闭后，就不能再向 channel 写数据，但是仍然可以从该 channel 读取数据

```go
func close
func close(c chan<- Type)
内建函数close关闭信道，该通道必须为双向的或只发送的。它应当只由发送者执行，而不应由接收者执行，其效果是在最后发送的值被接收后停止该通道。在最后的值从已关闭的信道中被接收后，任何对其的接收操作都会无阻塞的成功。对于已关闭的信道，语句：

x, ok := <-c
还会将ok置为false。
```

```go
	intChan2 := make(chan int, 3)
	intChan2 <- 100
	intChan2 <- 101
	//关闭 channel 不能再写数据 可以继续读取
	close(intChan2)
```



#### 遍历

channel 支持 for-range 遍历

* 在遍历时，如果 channel 没有关闭，则会出现 dead lock 错误
* 在遍历时，**如果 channel 已经关闭** 则会正常遍历数据，遍历完成后就会退出遍历。



```go
	intChan3 := make(chan int, 100)
	for i := 0; i <= 100; i++ {
		intChan3 <- i * 2
	}
	close(intChan3)
	for value := range intChan3 {
		fmt.Println(value)
	}
```

### channel 注意事项

* 1.channe 可以声明为只读或只写性质(默认情况下可读可写)
* 2.使用 select 可以解决从管道读取数据阻塞的问题
* 3.goroutine 中使用 recover,解决协程中出现的 panic ，避免导致程序崩溃

```go
func main() {
	go testPanic()
}

func testPanic() {
    //捕获异常
	defer func() {
		if err := recover(); err != nil {
			fmt.Printf("testPanic err:%v \n",err)
		}
	}()
	var panicMap map[int]string
	panicMap[0] = "golang"
}
```

- 1.channel 中只能存放指定类型数据
- 2.channel 中 数据满了就不能再放入
- 3.从 channel 中取出数据后 可以继续放入
- 4.没有使用协程的情况下， channel 中数据取完了再取会报 dead lock