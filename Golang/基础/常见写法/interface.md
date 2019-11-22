# interface

### 概述

> Under the covers, interfaces are implemented as two elements, a type and a value. The value, called the interface’s dynamic value, is an arbitrary concrete value and the type is that of the value. For the int value 3, an interface value contains, schematically, (int, 3).

### 底层实现

事实上，interface 的实现分为两种 eface,iface，它们结构如下：

```go
type iface struct {
	tab  *itab
	data unsafe.Pointer
}

type eface struct {
	_type *_type
	data  unsafe.Pointer
}
```

**iface 为有方法声明的 interface，eface 为空的 interface 即 interface{}**。

我们可以看到 eface 结构体中只存两个指针：

一个_type 类型指针用于存数据的实际类型，

一个通用指针（unsafe.Pointer）存实际数据；

iface 则比较复杂，这里不做详细展开了，你只需要记住它也是两个指针，和 eface 一样其中一个用来存数据，另一个 itab 指针用来存数据类型以及方法集。因此 interface 类型的变量所占空间一定为 16。

**小结**

**当一个指针赋值给 interface 类型时，无论此指针是否为 nil，赋值过的 interface 都不为 nil**。

> 当我们将一个 nil 指针赋值给 interface 时，实际是对 interface 的这两个指针分别赋值，虽言数据指针 data 为 nil，但是类型指针_type 或 tab 并不是 nil，他将指向你的空指针的类型，因此赋值的结果 interface 肯定不是 nil 啦！

### 结构体嵌入interface

```go
type Talkable interface {
	TalkEnglish(string)
	TalkChinese(string)
}

type Student1 struct {
	Talkable
	Name string
	Age  int
}

func main(){
    a := Student1{Name: "aaa", Age: 12}
    var b Talkable = a
    fmt.Println(b)
}
```



以上的代码时 100%能编译运行的。输出为：

```go
{<nil> aaa 12}
```

这是一种取巧的方法，将 interface 嵌入结构体，可以使该类型快速实现该 interface。所以，本小节开头的话并不成立。但是如果我们调一下方法呢？

example7

```go
...
func main(){
    a := Student1{Name: "aaa", Age: 12}
    a.TalkEnglish("nice to meet you\n")
}
```

可以预见到的，报错了：

```go
//example7 output
panic: runtime error: invalid memory address or nil pointer dereference
```

并没有实现 interface 的方法，当然会报错。

**小结**

总而言之，嵌入 interface 的好处就是可以帮在整体类型兼容某个接口的前提下，允许你你针对你的应用场景只实现 interface 中的一部分方法。但是在使用时要注意没有实现的方法在调用时会 panic。

> 