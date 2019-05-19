# defer

## 概述

1.当执行到defer时，暂时不执行 会将defer后的语句压入到独立的栈中(defer栈)

2.当函数执行完毕后在从defer栈中 按照先入后出的方式出栈执行

3.在defer将语句放入栈时，也会将相关的值拷贝同时入栈。

## 例子

```go
package main

import "fmt"

func main() {
	testDefer(1,2)
}

func testDefer(a int,b int)int{
	//当执行到defer时，暂时不执行 会将defer后的语句压入到独立的栈中(defer栈)
	//当函数执行完毕后在从defer栈中 按照先入后出的方式出栈执行
	res:=0
	defer fmt.Printf("deferA res: %d \n",res)
	defer fmt.Printf("deferB res: %d \n",res)
	defer fmt.Println("deferB")
	res=a+b
	fmt.Printf("a: %d \n",a)
	fmt.Printf("b: %d \n",b)
	return res
}
```

输入如下

```go
a: 1 
b: 2 
deferB
deferB res: 0 
deferA res: 0 
```

可以看到 defer后的语句中的res的值并不是最后计算出的值 虽然defer后的语句会最后执行但是值和语句同时压入栈中，最后执行时用的是压栈时的值。

## 小结

go中的defer类似于Java中的finally

1.在golang编程中通常做法是打开资源后(打开了文件，数据库连接等)，可以执行defer file.Close() defer connect.Close()

2.在defer后可以继续使用资源

3.在函数完毕后，系统会依次从defer栈中取出语句关闭资源

4.不用在为什么时候关闭资源担心了