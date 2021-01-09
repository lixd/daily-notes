

## 1. Coroutine

* 1.轻量级`线程`
* 2.`非抢占式`多任务处理，由协程主动交出控制权
* 3.编译器/解释器/虚拟机层面的多任务
* 4.多个协程可能在一个或多个线程上运行



## 2. Goroutine

### 2.1 概述

Go 语言在语言层面上支持了并发，`goroutine`是Go语言提供的一种用户态线程，有时我们也称之为`协程`。所谓的协程，某种程度上也可以叫做`轻量线程` [编译器优化]，它`不由os而由应用程序创建和管理，因此使用开销较低`（一般为`4K`）。我们可以创建很多的goroutine，并且它们跑在同一个内核线程之上的时候，就需要一个调度器来维护这些goroutine，确保所有的goroutine都能使用cpu，并且是尽可能公平地使用cpu资源。



### 2.1 Goroutine定义

* 1.任何函数只需要加上`go`关键字就能送给调度器运行
* 2.不需要在定义时区分是否是异步函数
* 3.调度器在合适的点进行切换
* 4.程序运行时添加`-rance`来检测数据访问冲突(go run -rance xxx.go)
* 5.goroutine拥有独立的栈,多个goroutine共享堆。

主线程是物理线程，直接作用在cpu上，是重量级的，非常消耗cpu资源。

协程从主线程开启，是轻量级的线程，是逻辑态，资源消耗相对小

### 2.2 oroutine可能切换的点

* 1.I/O,select
* 2.Channel
* 3.等待锁
* 4.函数调用(有时会 并不一定)
* 5.runtime.Gosched() 手动提供切换机会

**只是参考，不能保证切换，也不能保证在其他地方不切换**

## 3. 调度器

调度器的主要有4个重要部分，分别是`M`、`G`、`P`、`Sched`，前三个定义在runtime.h中，Sched定义在proc.c中。

- `M (work thread) `代表了系统线程`OS Thread`，由操作系统管理。
- `P (processor) `衔接M和G的调度上下文，它负责将等待执行的G与M对接。P的数量可以通过GOMAXPROCS()来设置，它其实也就代表了真正的并发度，即有多少个goroutine可以同时运行。
- `G (goroutine)` goroutine的实体，包括了调用栈，重要的调度信息，例如channel等。

在操作系统的OS Thread和编程语言的User Thread之间，实际上存在3种线程对应模型，也就是：1:1，1:N，M:N。

### 3.1 MPG模式

#### 概述

M关联了一个内核线程，通过调度器P（上下文）的调度，可以连接1个或者多个G,相当于把一个内核线程切分成了了N个用户线程，M和P是一对一关系（但是实际调度中关系多变），通过P调度N个G（P和G是一对多关系），实现内核线程和G的多对多关系（M:N），通过这个方式，一个内核线程就可以起N个Goroutine，同样硬件配置的机器可用的用户线程就成几何级增长，并发性大幅提高

#### 运行情况

* 1.此时有一个系统线程`M0`正在执行协程`G0`，另外三个协程`G1 G2 G3`在队列等待。
* 2.如果`G0`协程阻塞,比如读取文件或者数据库等
* 3.这时就会创建`M1`主线程(也可能是从己有的线程池中取出), 将等待的3个协程挂到`M1`开始执行，`M0`主线程下的`G0`仍然执行文件IO的读写。
* 4.这样的MPG调度模式，可以既让`G0`执行，同时也不会让队列的其它协程一直阻塞，仍然可以并发/并行执行。
* 等到`G0`不阻塞了，`M0`会被放到空闲的主线程继续执行(从已有的线程池中取)，同时`G0`也会被唤醒。

### 3.2 资源共享 通信

#### 1. Mutex

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

#### 2. WaitGroup

计数器,类似Java中的`CountDownLatch`

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	// New一个waitGroup
	waitGroup:=sync.WaitGroup{}
	// add 2 表示有两个需要等待
	waitGroup.Add(2)
	for i:=0;i<2 ;i++  {
		go func(i int) {
			fmt.Print(i)
			time.Sleep(time.Second)
			// 执行完成后done一个
			defer waitGroup.Done()
		}(i)
	}
	// 程序会阻塞直到计数器减为零
	waitGroup.Wait()
}

```

##### 注意事项

*  1.计数器不能为负值
* 2.WaitGroup对象不是一个引用类型，在通过函数传值的时候需要使用地址

```go
// 一定要通过指针传值，不然进程会进入死锁状态
func f(i int, wg *sync.WaitGroup) { 
    fmt.Println(i)
    wg.Done()
}
```

#### 3. Cond

在go语言sync包中提供了一个Cond类，这个类用于goroutine之间进行协作

只有三个函数`Broadcast()` , `Signal()`, `Wait()`， 一个成员变量，L　Lock

其中Broadcast()实现的功能是唤醒在这个cond上等待的所有的goroutine，而Signal()则只选择一个进行唤醒。Wait()自然是让goroutine在这个cond上进行等待了(有点像Java的RentrockLock中的Condition)

这几个函数有以下几个注意点：

1.Wait()函数在调用时一定要确保已经获取了其成员变量锁L ,因为Wait第一件事就是解锁。　但是需要注意的是，当Wait()结束等待返回之前，它会重新对Ｌ进行加锁，也就是说当 Wait 结束，调用它的 goroutine 仍然会获取Lock L。

２．调用 Broadcast() 函数会导致系统切换到之前在等待的那个 goroutine  进行执行。

##### NewCond

```go
func NewCond(l Locker) *Cond {
    return &Cond{L: l}
}
```

##### Wait

```go

func (c *Cond) Wait() {
    // 检查c是否是被复制的，如果是就panic
    c.checker.check()
    // 将当前goroutine加入等待队列
    t := runtime_notifyListAdd(&c.notify)
    // 解锁
    c.L.Unlock()
    // 等待队列中的所有的goroutine执行等待唤醒操作
    runtime_notifyListWait(&c.notify, t)
    c.L.Lock()
}
// 判断cond是否被复制。
type copyChecker uintptr

func (c *copyChecker) check() {
    if uintptr(*c) != uintptr(unsafe.Pointer(c)) &&
        !atomic.CompareAndSwapUintptr((*uintptr)(c), 0, uintptr(unsafe.Pointer(c))) &&
        uintptr(*c) != uintptr(unsafe.Pointer(c)) {
        panic("sync.Cond is copied")
    }
}
```

##### Signal

```go
func (c *Cond) Signal() {
    // 检查c是否是被复制的，如果是就panic
    c.checker.check()
    // 通知等待列表中的一个 
    runtime_notifyListNotifyOne(&c.notify)
}
```

##### Broadcast

```go
func (c *Cond) Broadcast() {
    // 检查c是否是被复制的，如果是就panic
    c.checker.check()
    // 唤醒等待队列中所有的goroutine
    runtime_notifyListNotifyAll(&c.notify)
}
```

##### Example

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

var locker = new(sync.Mutex)
var cond = sync.NewCond(locker)

func main() {
    for i := 0; i < 40; i++ {
        go func(x int) {
            cond.L.Lock()         //获取锁
            defer cond.L.Unlock() //释放锁
            cond.Wait()           //等待通知,阻塞当前goroutine
            fmt.Println(x)
            time.Sleep(time.Second * 1)

        }(i)
    }
    time.Sleep(time.Second * 1)
    fmt.Println("Signal...")
    cond.Signal() // 下发一个通知给已经获取锁的goroutine
    time.Sleep(time.Second * 1)
    cond.Signal() // 3秒之后 下发一个通知给已经获取锁的goroutine
    time.Sleep(time.Second * 3)
    cond.Broadcast() //3秒之后 下发广播给所有等待的goroutine
    fmt.Println("Broadcast...")
    time.Sleep(time.Second * 60)
}
```



## 4.Channel

### 4.1 概述

* 1.`channel` 本质就是一个数据结构-队列
* 2.数据是先进先出
* 3.线程安全 多 `goroutine`读取时 不需要加锁 channel 本身就是线程安全的
* 4.channel 是有类型的 string 类型的 channel 只能存放 string 类型数据

### 4.2 内部结构

每个channel内部实现都有三个队列

#### 1.接收消息的协程队列

这个队列的结构是一个限定最大长度的链表，所有阻塞在channel的接收操作的协程都会被放在这个队列里。

#### 2. 发送消息的协程队列

这个队列的结构也是一个限定最大长度的链表。所有阻塞在channel的发送操作的协程也都会被放在这个队列里。

#### 3. 环形数据缓冲队列

这个环形数组的大小就是channel的容量。如果数组装满了，就表示channel满了，如果数组里一个值也没有，就表示channel是空的。对于一个阻塞型channel来说，它总是同时处于即满又空的状态。

**一个channel被所有使用它的协程所引用，也就是说，只要这两个装了协程的队列长度大于零，那么这个channel就永远不会被垃圾回收**。另外，协程本身如果阻塞在channel的读写操作上，这个协程也永远不会被垃圾回收，即使这个channel只会被这一个协程所引用。

### 4.3 基本使用

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

## 5. select语句

select块是为channel特殊设计的语法，它和switch语法非常相近。分支上它们都可以有多个case块和做多一个default块，但是也有很多不同。

* `select` 到 `括号{`之间不得有任何表达式

* `fallthrough`关键字不能用在`select`里面

* 所有的case语句要么是`channel的发送操`作，要么就是`channel的接收操作`

* select里面的case语句是`随机执行`的，而不能是顺序执行的。

设想如果第一个case语句对应的channel是非阻塞的话，case语句的顺序执行会导致后续的case语句一直得不到执行除非第一个case语句对应的channel里面的值都耗尽了。

* **如果所有case语句关联的操作都是阻塞的，default分支就会被执行。如果没有default分支，当前goroutine就会阻塞**，当前的goroutine会挂接到所有关联的channel内部的协程队列上。 

所以说单个goroutine是可以同时挂接到多个channel上的，甚至可以同时挂接到同一个channel的发送协程队列和接收协程队列上。当一个阻塞的goroutine拿到了数据解除阻塞的时候，它会从所有相关的channel队列中移掉。

**通过select+case加入一组管道，当满足（这里说的满足意思是有数据可读或者可写)select中的某个case时候，那么该case返回，若都不满足case，则走default分支,若没有default分支则阻塞**。

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



## 6. channel 遍历和关闭

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

## 7. channel 注意事项

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