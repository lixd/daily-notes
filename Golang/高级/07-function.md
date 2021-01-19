# function

## 1. 概述

Go 语言中 function 是一等公民，可以用作参数、返回值，也可以赋值给变量。



例子

```go
type A struct {
	name string
}

func (a A) GetName() string {
	a.name = "Hi " + a.name
	return a.name
}

func main() {
	a := A{name: "17x"}
	fmt.Println(a.GetName())
	fmt.Println(A.GetName(a))
}
```

可以看到`a.Name()`和 `A.Name(a)` 两种写法效果是一样的，前者只是 Go 语言提供的语法糖。

具体证明如下：

```go
func main() {
	t1 := reflect.TypeOf(A.GetName)
	t2 := reflect.TypeOf(NameOfA)
	fmt.Println(t1 == t2) // true
}
func NameOfA(a A) string {
	a.name = "Hi " + a.name
	return a.name
}
```

t1 t2 分别为A.Name方法 和 NameOfA 函数的类型，t1=t2 说明二者是相同的。

**Go 语言中函数类型只与参数和返回值有关**。所以这两个类型值相等就可以证明，**方法本质上就是普通的函数**，而方法接收者就是隐含的第一个参数。



## 2.值/指针接收者

```go
type A struct {
	name string
}

func (a A) GetName() string {
	a.name = "Hi " + a.name
	return a.name
}
func (a *A) SetName() string {
	a.name = "Hi " + a.name
	return a.name
}
```

我们已经知道了，方法本质上就是普通的函数，而**方法接收者就是隐含的第一个参数**。

Go 语言中只有值拷贝，不存在引用拷贝的说法。所以 GetName() 第一个参数为 A 类型，SetName 则为 *A 类型。

虽然都是值拷贝，但是指针接收者拷贝的是地址，所以可以修改外部变量的值。

```go
func main() {
   a := A{name: "17x"}
   pa:=&a
   // 通过值调用指针接收者的方法
   fmt.Println(a.SetName())
   // 
   fmt.Println(pa.GetName())
}
```

**通过值调用指针接收者的方法，通过指针调用值接收者的方法 都是可以的？这又是什么情况？**

如果没有涉及到接口的话，这也是 Go 语言提供的语法糖。

**编译阶段**就会转换成对应的形式：

```go
pa.GetName()-->(*pa).GetName()
a.SetName()-->(&a).SetName()
```

由于该语法糖是在**编译期间**发挥作用的，编译期间无法获取地址的字面量，也就不能借助语法糖进行转换了，如下：

```go
// 无法进行转换导致编译失败 
A{name: "17x"}.SetName()
```



## 3. 赋值给变量

**把 function 赋值给变量是怎么回事？**

Go 语言中把函数作为变量、参数和返回值时都是以 Function Value 的形式存在的，闭包也只是一个有捕获列表的 Function Value 而已。



```go
type A struct {
	name string
}

func (a A) GetName() string {
	return a.name
}

func main() {
	a := A{name: "17x"}
	// 这样赋值后 f1 叫做 方法表达式
	f1 := A.GetName
    f1(a)
}
```

把 一个类型的方法赋值给变量后，该变量就称之为 **方法表达式**。

同时方法就是一个带有隐含参数的普通函数，所以以上代码等价于：

```go
func GetName (a A) string {
	return a.name
}

func main() {
	a := A{name: "17x"}
	f11 := GetName
    f11(a)
}
```

**所以 f1 本质上也是一个 Function Value。**

之前已经证明了 f1 和 f11 是等价的，所以 调用 f1 的时候也要传入一个 A 类型的变量 a 作为第一个参数。



```go
func Fourth() {
	a := A{name: "17x"}
	// 这样赋值后 f2 叫做 方法变量
	f2 := a.GetName
	f2()
}
```

f2 以这样的方式赋值，被称作 **方法变量**。

因为` a.GetName()` 这样调用的时候，会把变量 a 作为 GetName()的第一个参数传入，所以可以想到 **f2 理论上应该是一个 闭包**，即一个由捕获列表的 Function Value。

但是因为这里 f2 仅作为局部变量，它的生命周期和a的生命周期相同，所以**编译器会做出优化**。转换为类型A的方法调用并传入a作为参数，具体如下：

```go
A.GetName(a)
```



## 3. 做为返回值

```go
type A struct {
	name string
}

func (a A) GetName() string {
	return a.name
}

func GetFunc() func() string {
	a := A{name: "17x in GetFunc"}
	return a.GetName
}
func main() {
	a := A{name: "17x in main"}
	f2 := a.GetName
	fmt.Println(f2()) // 17x in main

	f3 := GetFunc()
	fmt.Println(f3()) // 17x in GetFunc
}
```



f2 和上个例子相同，会被编译器优化为`A.GetName(a)` 这样的调用，所以打印出的是 17x in main。

而 f3 的 GetFunc() 等价于如下函数：

```go
func GetFunc() func() string {
	a := A{name: "17x in GetFunc"}
	
	return func() string {
		return A.GetName(a)
	}
}
```

可以清晰的看到，**GetFunc() 中的局部变量 a 直接被 A.GetName() 引用而形成了闭包**。

> f3 为闭包对象，捕获了GetFunc() 中的局部变量 a 。

所以 f3 打印出的是 17x in GetFunc。



## 4. 小结

**从本质上讲，方法表达式 Method Expression 和方法变量 Method Value 都是 Function Value。**

> 一个没有捕获列表，一个有捕获列表。当然有时候编译器会做出优化。





## 5. 参考

`https://www.bilibili.com/video/BV1hv411x7we?p=8`

`https://draveness.me/golang/docs/part2-foundation/ch04-basic/golang-function-call/`