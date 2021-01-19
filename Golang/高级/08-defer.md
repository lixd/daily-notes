# Defer

## 1. 概述

Go 语言中的 Defer 是和栈比较相似的，**先进后出**，即先注册的 defer 会后执行。

因为 defer 底层是使用 链表进行存储的。每次注册 defer 时会将当前 defer 链接到链表头，同时 Defer 执行时也是从链表头开始执行。

所以才会有这种先进后出的效果。



## 2. 注意事项

需要关注的是 defer 传参和闭包变量捕获机制。





### 普通参数

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

### 闭包变量

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

上述例子中 defer function 出了参数 b 之外还引用到了 外层局部变量 a。

这里就形成了**闭包**。

> 闭包也是一个 function value。

同时由于捕获变量a出了初始化赋值之外，还被修改过，所以局部变量a改为

**堆分配**，栈上只存储a的地址。



所以后续a的修改也会影响到defer function。

最终打印出a的值为5

**引入闭包变量的 defer function 参数值需要到 defer function 执行时才能确定。**



### 缺点

* 1）defer 在堆上分配
* 2）使用链表注册 defer 信息

以上两点导致了 defer 很慢。

go 1.13 1.14 版本分别对上述问题进行了不同的优化。