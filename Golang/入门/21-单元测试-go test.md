# 单元测试

## 1. 概述

Go 的测试方法看上去相对比较低级，它依赖于命令 `go test` 和一些能用 `go test` 运行的测试函数的编写约定。但是，我认为这就是所谓的 Go 风格，用 Go 以来，我的感受是 Go 语言就是保持了 C 语言编程习惯的一门语言。

## 2. 简单测试

`main.go`

```go
package main

import "fmt"

func Add(x, y int) int {
	return x + y
}
func main() {
	fmt.Println(Add(1, 2))
}
```

这个例子就是这么简单，将这个文件命名为 **main.go**，然后我们就应该编写测试代码了。测试代码的文件放置的位置可以随意，`package` 也可以随意写，但是，**文件名必须以 _test 结尾**，所以，我这里就命名为 **main_test.go**。

这里编写测试函数，有几个需要注意的点：

1. 每个测试文件必须以 **_test.go** 结尾，不然 `go test` 不能发现测试文件
2. 每个测试文件必须导入 **testing** 包
3. 功能测试函数必须以 **Test** 开头，然后一般接测试函数的名字，这个不强求

根据这些条件，我们可以写出一个测试文件：

`main_test.go`

```go
package main

import "testing"

func TestAdd(t *testing.T) {
	sum := Add(1, 2)
	if sum != 3 {
		t.Error("1 and 2 result is not 3")
	}
}
```

测试文件写完之后，我们就应该执行测试了，打开命令行工具，敲入这条命令：`go test main_test.go main.go -v -cover`

然后就应该等待测试结果了，这里加了两个参数，分别是 `-v` 和 `-cover`，如果不加上的话你会发现只有 **Test Pass** 的简单提示，而看不到我们加了参数的具体提示：

```go
=== RUN   TestAdd
--- PASS: TestAdd (0.00s)
PASS
coverage: 50.0% of statements
ok      i-go/base/test  0.566s
```

## 3. 表格驱动测试

在 Go 语言中，有一种常用的测试套路，叫做**基于表的测试方式**，其核心就是我们需要针对不同的场景，其实也就是不同的输入和输出来验证一个功能。例如我们要验证的 `Add` 函数，我们需要验证的功能点有很多，例如：

- 两个正数相加是否正确
- 两个负数相加是否正确
- 一个正数加上一个负数是否正确
- 有一个数为 0 是否正确

那么，我们就可以使用 **基于表的测试方式** 了，代码可以这样写：

```go
// func add
package main

func add(a,b int)int{
	return a+b
}

// 测试代码
package main

import "testing"

func TestAdd(t *testing.T) {
    // 表格数据
	tests := []struct {
		a, b, c int
	}{
		{1, 2, 3},
		{4, 5, 9},
		{6, 7, 13},
		{1, 1, 2},
		{0, 0, 0}}

	for _, tt := range tests {
		if result := add(tt.a, tt.b); result != tt.c {
			t.Errorf("test add %d + %d except %d but got %d", tt.a, tt.b, tt.c, result)
		}
	}
}

```

## 4. 代码覆盖率

### 检查代码覆盖率

命令

```go
go test -coverprofile=c.out
```

将代码覆盖率存入`c.out`文件中

### 查看结果

`c.out` 文件查看起来并不直观，所以可以借助`go tool`工具 直观的查看检查结果。

```go
go tool cover
```

将结果显示为html

```go
go tool cover -html=c.out
```

还有其他方式就不一一演示了。

## 5. 性能测试

### 1.测试

函数名以`Benchmark`开头 参数为`*testing.B`

其中循环次数由` b.N` 系统自动控制。

```go
func BenchmarkAdd(b *testing.B) {
	a := 1
	bb := 2
	res := 3
	// 前面都是在准备数据 所以计算时可以除去这部分时间
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		if result := add(a, bb); result != res {
			b.Errorf("test add %d + %d except %d but got %d", a, bb,res, result)
		}
	}
}

//输出
goarch: amd64
pkg: i-go/base/test
BenchmarkAdd-4   	2000000000	         0.43 ns/op
PASS
```

### 2.生成测试结果

同样是生成测试结果文件 `.`表示生成在当前路径 `cpu.out`是文件名，生成的是一个二进制文件

```go
go test -bench . -cpuprofile=cpu.out
```

### 3.查看结果

上边生成的测试结果是二进制文件，肯定是看不懂了，也是需要借助工具来查看。

```go
go tool pprof cpu.out // 执行后会进入一个交互模式

交互模式下执行然
web // 会自动弹出网页展示svg图

//退出命令
quit
```

如果出现以下错误

```go
Failed to execute dot. Is Graphviz installed? Error: exec: "dot": executable file not found in %PATH%

```

请到`http://www.graphviz.org/download`下载Graphviz, 并配置`graphviz-2.38\release\bin`到环境变量`path`中。

然后这个图的话就是方块越大说明占用的时间越多，就是我们做性能优化时需要关注的点。

## Mock 依赖

前面介绍的测试都是比较简单的，功能简单的话我们就可以直接给定输入，然后看输出是否符合预期，这样就可以很简单得写完单元测试了。但是，有的时候，由于业务逻辑的复杂性，功能代码并不会就这么直接，往往还会掺杂很多其他组件，这就给我们的测试工作带来很大的麻烦，我这里列举几个常见的依赖：

- 组件依赖
- 函数依赖

组件依赖和函数依赖是两种比较常见的依赖，但是，这两种依赖也是可以扩展开来说的，既可能来自于我们自己编写的组件/函数，也可能是引入其他人写的。但是，无妨，对于这些情况，我们都会做一些分析。





## 注意事项

1) 测试用例文件名必须`_test.go`结尾。比如cal_test.go,cal不是固定的。
2) 测试用例函数必须以`Test`开头，一般来说就是Test+被测试的函数名，比如TestAddUpper。
3) TestAddUpper(t *tesing.T)的形参类型必须是`testing.T`【看一下手册】
4) —个测试用例文件中，可以有多个测试用例函数，比如TestAddUpper、TestSub
5) 运行测试用例指令
(1)cmd>go test [如果运行正无日志，错误时，会输出日志]
⑵cmd>go test -v [运行正确或是错误，都输出日志]
6) 当出现错误时，可以使用`t.Fatalf`来格式化输出措误信息，并退出程序
7) `t.Logf`方法可以输出相应的日志
8) 测试用例函数，并没有放在main函数中，也执行了，这就是测试用例的方便之处
9) PASS表示测试用例运行成功，FAIL表示测试用例运行失败

10）测试单个文件`go test -v -test.run 文件名`

11）测试单个方法 `go test -v -test.run 方法名`

## 小结

### 1. 测试

`testing.T`的使用

运行测试

### 2. 代码覆盖

使用IDE查看代码覆盖

使用`go test`获取代码覆盖报告

使用`go tool cover`工具查看代码覆盖报告

### 3. 性能测试

`test.B`的使用

使用`pprof`查看代码耗时分析，优化性能