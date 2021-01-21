# Defer

## 1. 概述

Go 语言中的 Defer 是和栈比较相似的，**先进后出**，即先注册的 defer 会后执行。

## 2. 1.12

> 本节将的是 Go 1.12 版本的 defer。1.13 和1.14 都有不少优化。

### demo

```go
func A() {
	defer B()
}
func B() {
 // dosomething
}
```

上述代码，编译后伪指令如下：

```go
func A() {
    r = deferproc(8,B)
    if r > 0{
        goto ret
    }
    // dosomething
    runtime.deferreturn()
    return
 ret:
     runtime.deferreturn()
}
```

`deferproc`负责把要执行的函数信息保存起来，也叫 **defer 注册**。

deferproc()函数会返回0，if 分支和 panic，recover有关，暂时忽略。

首先调用 deferproc() 进行 defer 注册，然后继续执行后面的逻辑， 直到返回之前通过`deferreturn`执行注册的 defer 函数。

> 先注册后调用，所以实现了延迟执行的效果。



defer 信息会注册到一个**链表**，而当前执行的 goroutine 会持有这个链表的头指针。，每个goroutine都要一个结构体g，其中有字段 _defer 就指向defer链表头。

```go
// src/runtime/runtime2.go  395行
type g struct {
	// ...
	_defer       *_defer // innermost defer
}
```

defer 链表中存储的是一个一个的 defer 结构体。**每次注册 defer 时会将当前 defer 链接到链表头，同时 Defer 执行时也是从链表头开始执行**。

>所以才会有先进后出的感觉。



defer 结构体如下：

```go
type _defer struct {
	siz     int32 // 参数和返回值共占多少字节
	started bool // 标记defer是否已经执行
	sp        uintptr  // 调用者栈指针，通过这个调用者可以判断自己注册的defer是否都执行完了
	pc        uintptr  // deferproc 的返回地址
	fn        *funcval // 要注册的 funcval
	_panic    *_panic  // panic that is running defer
	link      *_defer // 链接到前一个注册的 _defer 结构体
}
```



### 参数与闭包

需要关注的是 defer 传参和闭包变量捕获机制。

**普通参数**

```go
func main() {
	a, b := 1, 2
	defer func(a int) {
		fmt.Println(a) // 1
	}(a)
	a = a + b
	fmt.Println(a, b) // 3,2
}
```

这里的 defer function 只使用到了一个 int 类型的参数。

所以会直接将参数a的**值**拷贝到 defer function 对应的栈空间中。

等函数执行完成，返回之前就会执行这个 defer function，将 a 的值打印出来。

由于是拷贝的**值**，所以后续a=a+b 修改变量a的值和和这个  defer function 中的参数 a 已经完全没有关系了，最终打印出a的值还是传入时的1。

**引入普通参数的 defer function 参数值在执行 defer 时就确定了。**



**闭包变量**

```go
func main() {
	a, b := 1, 2
	defer func(b int) {
		a = a + b
		fmt.Println(a, b) // 5 2
	}(b)
	a = a + b
	fmt.Println(a, b) // 3 2
}
```

上述例子中 defer function 除了参数 b 之外还引用到了 外层局部变量 a。

这里就形成了**闭包**。

> 闭包也是一个 function value。

同时由于捕获变量a除了初始化赋值之外，还被修改过，所以局部变量a改为**堆分配**，栈上只存储a的地址。

所以后续a的修改也会影响到defer function，导致最终打印出a的值为5

**引入闭包变量的 defer function 参数值需要到 defer function 执行时才能确定。**



### 缺点

* 1）defer 在堆上分配
* 2）使用链表注册 defer 信息

以上两点导致了 defer 很慢。

go 1.13 1.14 版本分别对上述问题进行了不同的优化。





## 3. 优化

### 1.13

Go 1.12 中通过 runtime.deferproc() 函数注册 defer，将 _defer结构体分配在**堆**上。

Go 1.13 中通过编译器优化，生成局部变量，将 defer 信息分配在**栈**上。然后通过 runtime.deferprocStack() 将 _defer 结构体注册到链表中。

1.13 主要优化点在于减少 defer 信息的堆分配。由于循环中的 defer 调用无法进行编译器优化，因此只能使用 1.12 版本中的处理方法。所以 defer 结构体中增加了一个字段，用于标识是否为堆分配。

```go
// 、src/runtime/runtime2.go 861 行
type _defer struct {

	heap    bool
}
```

1.13 版本 defer 官方提供的数据是性能提升 30%。



### 1.14

对于能够显式优化的部分，进行了优化。

比如

```go
func A(i int) {
	defer A1(i, 2*i)
	
	if i > 1 {
		defer A2("hello", "world")
	}
	
	return
}
func A1(a, b int) {
	fmt.Println(a, b)
}
func A2(m, n string) {
	fmt.Println(m, n)
}
```

**A1 优化**

函数A中的第一个 defer，`defer A1(i, 2*i)`编译器会对其进行优化，直接在函数A return 之前，调用A1函数，直接省去了构造 defer 链表项和注册到 链表的过程。

编译后代码可以看做如下：

```go
func A(i int) {
	var a,b int=i,2*i
	
    // ...
    A1(a,b)
	return
}
```

声明了调用A1需要的两个变量，a,b，然后在 return 之前调用了 A1函数。

降低消耗的同时，也实现了延迟执行的效果。

**A2优化**

第二个 defer `defer A2("hello", "world")`就不能这样处理了，应该这个defer 需要到执行阶段才能确定是否需要调用。Go 语言用一个标识变量 df 来解决这个问题。

df 中的每一位都用来标识一个 defer 是否需要被执行。比如之前的 defer A1 需要执行，所以就把第一位置为1，即`df|=1`。

执行前判定对应标识位是否为1，同时执行之前还需要将标识位置0，防止重置执行。

defer A1 调用如下：

```go
func A(i int) {
    var df byte
	var a,b int=i,2*i
	
    df|=1
    // ...
    if df&1>0{
        df=df&^1
        A1(a,b)
    }
    
	return
}
```

同样的方法处理 defer A2

```go
func A(i int) {
    var df byte
	var a,b int=i,2*i
	var m,n int="hello","world"
    df|=1
    if i>1{
        df |=2
    }
    // ...
    
   if df&2>0{
        df=df&^2
        A2(m,n)
    }
    
    if df&1>0{
        df=df&^1
        A1(a,b)
    }
    
	return
}
```



**Go1.14 defer 优化就是通过编译期置入代码，把defer函数的执行逻辑展开在所属函数内，从而免于创建 _defer 结构体，而且不需要注册到 defer 链表。**

Go 语言称这种方式为 open coded defer。

但是和 1.13 版本一样，这种方式依然不适用于 循环中的 defer，所以1.14中版本还是保留了 1.12 版本的 defer处理方式。

1.14 版本 defer 性能提升了一个数量级。



**栈扫描**

性能提升也不是没有代价的，像这样展开后的 defer 如果在执行之前，出现了 panic 或者执行了 runtime.Goexit ，此时就会直接跳去执行 defer 链表，所以后面的defer 展开代码就无法执行了。

于是 Go1.14 又在 defer 中增加了几个字段，同时通过栈扫描的方式，来执行这些原本无法执行的 defer。

```go
// 、src/runtime/runtime2.go 861 行
type _defer struct {
	openDefer bool
	
	fd   unsafe.Pointer // funcdata for the function associated with the frame
	varp uintptr        // value of varp for the stack frame
	framepc uintptr
}
```

借助这些信息，可以找到未注册到链表的 defer 函数并按照正确的顺序执行。

**这就导致 1.14 版本中 defer 变快的同时，panic 变得更慢了。**

> 官方这样优化肯定是有自己的考量，毕竟 panic 发生的几率比 defer 低。





## 4. 小结

**defer 注册流程**

* 1）deferproc 进行 defer 注册。
* 2）return之前通过 runtime.deferreturn() 调用注册的 defer 函数。



**具体执行逻辑**

* 1）从当前 goroutine 的字段 defer 中拿到 defer 链表
* 2）从链表中拿到第一个要执行的 defer 结构体
* 3）根据 defer 结构体的 fn 字段找到对应的 funcval
* 4）根据 funcval 找打对应的函数入口地址
* 5）执行具体函数



**优化记录**

* 1.1~1.12：堆分配

  * 编译期将 defer 关键字转换为 deferproc ，并在调用defer关键字的函数返回之前插入 runtime.deferreturn 。
  * 运行时 runtime.deferproc 会将一个新的` runtime._defer`结构体追加到当前 Goroutine 的 defer 链表头。
  * 运行时调用 runtime.deferreturn 会从当前 goroutine 的 defer 链表中取出 ` runtime._defer`结构并依次执行
* 1.13：栈分配
  * 当该关键字在函数体中最多执行一次时，编译期间会将结构体分配到栈上，并调用 runtime.deferprocStack
* 1.14：开放编码
  * 编译期间判断 `defer` 关键字、`return` 语句的个数确定是否开启开放编码优化；
  * 如果 `defer` 关键字的执行可以在编译期间确定，会在函数返回前直接插入相应的代码，否则会由运行时的  runtime.deferreturn 处理。

**问题**

**defer 调用时机与执行顺序**

deferproc 注册时是往链表头注册，而调用时也是从链表头开始调用，所以是先进后出的效果。

**参数问题**

注册时就会拷贝 defer 函数的参数(**参数预计算**)，所以如果是参数是值类型，注册时就确定了，如果是指针类型，则后续的修改也会影响到 defer 函数中的参数。

> 可以简单理解为 defer 参数在调用defer关键字时确定。但是如果传的是指针那被修改也就说得通了。



## 5. 参考

`https://www.bilibili.com/video/BV1hv411x7we?p=9`

`https://www.bilibili.com/video/BV1hv411x7we?p=10`

`https://draveness.me/golang/docs/part2-foundation/ch05-keyword/golang-defer/`