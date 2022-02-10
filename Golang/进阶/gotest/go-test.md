# Test

> [Go单测从零到溜系列0—单元测试基础](https://www.liwenzhou.com/posts/Go/golang-unit-test-0)
>
> [GoLang快速上手单元测试（思想、框架、实践）](https://learnku.com/articles/52896)

常见命令

指定运行某个文件中的测试用例,**一定要带上被测试的原文件，有多个则指定多个**。

```shell
go test -v wechat_test.go wechat.go
```

测试文件下的具体方法命令

```shell
go test -v -test.run TestRefreshAccessToken
# windows 下要加引号
go test -v -"test.run" TestRefreshAccessToken
# 或者用 -run=xxx也行
go test -v -run=Test_dfuVHelper_Generate
```





## 1. 概述

Go语言中的测试依赖go test命令。编写测试代码和编写普通的Go代码过程是类似的，并不需要学习新的语法、规则或工具。

go test命令是一个按照一定约定和组织的测试代码的驱动程序。在包目录内，所有以**`_test.go`**为后缀名的源代码文件都是go test测试的一部分，不会被go build编译到最终的可执行文件中。

在`*_test.go`文件中有三种类型的函数，单元测试函数、基准测试函数和示例函数。

| 类型     | 格式                  | 作用                           |
| -------- | --------------------- | ------------------------------ |
| 测试函数 | 函数名前缀为Test      | 测试程序的一些逻辑行为是否正确 |
| 基准函数 | 函数名前缀为Benchmark | 测试函数的性能                 |
| 示例函数 | 函数名前缀为Example   | 为文档提供示例文档             |

**测试文件以`_test.go`结尾**，且放在同一位置，例如

```shell
  test
      |
       —— calc.go
      |
       —— calc_test.go
```

## 2. go test

`go test` 是 Go 语言自带的测试工具，其中包含的是两类，`单元测试`和`性能测试`。



### 1. 运行模式

#### 1. 本地目录模式

在**没有包参数**（例如 `go test` 或 `go test -v` ）调用时发生。

在此模式下， `go test` 编译当前目录中找到的包和测试，然后运行测试二进制文件。在这种模式下，caching 是禁用的。在包测试完成后，go test 打印一个概要行，显示测试状态、包名和运行时间。

#### 2. 包列表模式

在**使用显式包参数**调用 `go test` 时发生（例如 `go test math` ， `go test ./...` 甚至是 `go test .` ）。

> 该模式下会使用 cache 来避免不必要的重复测试。

在此模式下，go 测试编译并测试在命令上列出的每个包。如果一个包测试通过， `go test` 只打印最终的 ok 总结行。如果一个包测试失败， `go test` 将输出完整的测试输出。如果使用 `-bench` 或 `-v` 标志，则 `go test` 会输出完整的输出，甚至是通过包测试，以显示所请求的基准测试结果或详细日志记录。



### 2. 参数解读

通过 go help test 可以看到 go test 的使用说明：

#### 1. 语法 

```go
go test [-c] [-i] [build flags] [packages] [flags for test binary]
```



#### 2. 变量

```shell
go help testflag
```

go test 的变量列表如下：

- test.short : 一个快速测试的标记，在测试用例中可以使用 testing.Short() 来绕开一些测试
- test.outputdir : 输出目录
- test.coverprofile : 测试覆盖率参数，指定输出文件
- test.run : 指定正则来运行某个/某些测试用例
- test.memprofile : 内存分析参数，指定输出文件
- test.memprofilerate : 内存分析参数，内存分析的抽样率
- test.cpuprofile : cpu分析输出参数，为空则不做cpu分析
- test.blockprofile : 阻塞事件的分析参数，指定输出文件
- test.blockprofilerate : 阻塞事件的分析参数，指定抽样频率
- test.timeout : 超时时间
- test.cpu : 指定cpu数量
- test.parallel : 指定运行测试用例的并行数



#### 3. 参数

参数解读：

关于build flags，调用go help build，这些是编译运行过程中需要使用到的参数，一般设置为空

关于packages，调用go help packages，这些是关于包的管理，一般设置为空

关于flags for test binary，调用go help testflag，这些是go test过程中经常使用到的参数

* -c : 编译 go tes t成为可执行的二进制文件，但是不运行测试。

* -i : 安装测试包依赖的package，但是不运行测试。

* **-v**: 是否输出全部的单元测试用例（不管成功或者失败），默认没有加上，所以只输出失败的单元测试用例。
* **-run**=pattern: 只跑哪些单元测试用例
* **-bench**=patten: 只跑那些性能测试用例
* **-benchmem** : 是否在性能测试的时候输出内存情况
* **-benchtime t **: 性能测试运行的时间，默认是1s
* -cpuprofile cpu.out : 是否输出cpu性能分析文件
*  -cover: 测试覆盖率
* -coverprofile=file ：输出测试覆盖率到文件
* -memprofile mem.out : 是否输出内存性能分析文件
* -blockprofile block.out : 是否输出内部goroutine阻塞的性能分析文件
* -memprofilerate n : 内存性能分析的时候有一个分配了多少的时候才打点记录的问题。

这个参数就是设置打点的内存分配间隔，也就是profile中一个sample代表的内存大小。默认是设置为512 * 1024的。如果你将它设置为1，则每分配一个内存块就会在profile中有个打点，那么生成的profile的sample就会非常多。如果你设置为0，那就是不做打点了。

你可以通过设置memprofilerate=1和GOGC=off来关闭内存回收，并且对每个内存块的分配进行观察。

* -blockprofilerate n: 基本同上，控制的是goroutine阻塞时候打点的纳秒数。默认不设置就相当于-test.blockprofilerate=1，每一纳秒都打点记录一下

* -parallel n : 性能测试的程序并行cpu数，默认等于GOMAXPROCS。

* -timeout t : 如果测试用例运行时间超过t，则抛出panic

* -cpu 1,2,4 : 程序运行在哪些CPU上面，使用二进制的1所在位代表，和nginx的nginx_worker_cpu_affinity是一个道理

* -short : 将那些运行时间较长的测试用例运行时间缩短





## 2. 单元测试

* 1）文件名必须以xx_test.go命名
* 2）方法必须是Test[^a-z]开头
* 3）方法参数必须 t *testing.T
* 4）使用go test执行单元测试





## 3. 性能测试

基准测试的基本格式如下：

```go
func BenchmarkName(b *testing.B){
    // ...
}
```

基准测试以Benchmark为前缀，需要一个`*testing.B`类型的参数b，基准测试必须要执行b.N次，这样的测试才有对照性，b.N的值是系统根据实际情况去调整的，从而保证测试的稳定性。

基准测试并不会默认执行，需要增加`-bench`参数。

## 4. 示例函数

被go test特殊对待的第三种函数就是示例函数，它们的函数名以Example为前缀。它们既没有参数也没有返回值。标准格式如下：

```go
func ExampleName() {
    // ...
}
```



```go
func ExampleFib() {
	fmt.Println(Fib(1))
	//	Output:1
}
```

go test 会将打印的内容与 下面的注释`Output`对比，相同则通过。

## 5. 其他

### 1. TestMain

如果测试文件包含函数:`func TestMain(m *testing.M)`那么生成的测试会先调用 TestMain(m)，然后再运行具体测试。



### 2. 子测试

`t.Run()`开启子测试。

```go
		t.Run(tt.name, func(t *testing.T) {
			if got := Fib(tt.args.n); got != tt.want {
				t.Errorf("Fib() = %v, want %v", got, tt.want)
			}
		})
```

### 3. 跳过某些测试用例

为了节省时间支持在单元测试时跳过某些耗时的测试用例。

```go
func TestTimeConsuming(t *testing.T) {
    if testing.Short() {
        t.Skip("short模式下会跳过该测试用例")
    }
    ...
}
```

当执行`go test -short`时就不会执行上面的`TestTimeConsuming`测试用例。

