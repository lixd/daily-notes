# Go函数多返回值原理

> [Go函数调用](https://draveness.me/golang/docs/part2-foundation/ch04-basic/golang-function-call/)

C 语言和 Go 语言在设计函数的调用惯例时选择了不同的实现：

* C 语言同时使用寄存器和栈传递参数，使用 eax 寄存器传递返回值；
  * 因为只有一个 eax 寄存器，所以C语言函数只能返回一个值
* 而 Go 语言使用栈传递参数和返回值。



我们可以对比一下这两种设计的优点和缺点：

- C 语言的方式能够极大地减少函数调用的额外开销，但是也增加了实现的复杂度；
  - CPU 访问栈的开销比访问寄存器高几十倍[3](https://draveness.me/golang/docs/part2-foundation/ch04-basic/golang-function-call/#fn:3)；
  - 需要单独处理函数参数过多的情况；
- Go 语言的方式能够降低实现的复杂度并支持多返回值，但是牺牲了函数调用的性能；
  - 不需要考虑超过寄存器数量的参数应该如何传递；
  - 不需要考虑不同架构上的寄存器差异；
  - 函数入参和出参的内存空间需要在栈上进行分配；

Go 语言使用栈作为参数和返回值传递的方法是综合考虑后的设计，选择这种设计意味着编译器会更加简单、更容易维护。



Go 1.17 设计了一套基于寄存器传参的调用规约，目前只在 x86 平台下开启。

> 具体见[#40724](https://github.com/golang/go/issues/40724)

官方只使用了 9 个通用寄存器，依次是 AX，BX，CX，DI，SI，R8，R9，R10，R11。

返回值和输入使用了完全相同的寄存器序列，同样在超出 9 个返回值时，多出的内容在栈上返回。

> 在传统的调用规约中，一般会区分 caller saved registers 和 callee saved registers，但在 Go 中，所有寄存器都是 caller saved，也就是由 caller 负责保存，在 callee 中不保证不对其现场进行破坏。

