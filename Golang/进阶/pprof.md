# pprof

## 1. 概述

### 1. 是什么

pprof 是用于可视化和分析性能分析数据的工具

pprof 以 profile.proto 读取分析样本的集合，并生成报告以可视化并帮助分析数据（支持文本和图形报告）

profile.proto 是一个 Protocol Buffer v3 的描述文件，它描述了一组 callstack 和 symbolization 信息， 作用是表示统计分析的一组采样的调用栈，是很常见的 stacktrace 配置文件格式



### 2. 可以做什么

- CPU Profiling：CPU 分析，按照一定的频率采集所监听的应用程序 CPU（含寄存器）的使用情况，可确定应用程序在主动消耗 CPU 周期时花费时间的位置
- Memory Profiling：内存分析，在应用程序进行堆分配时记录堆栈跟踪，用于监视当前和历史内存使用情况，以及检查内存泄漏
- Block Profiling：阻塞分析，记录 goroutine 阻塞等待同步（包括定时器通道）的位置
- Mutex Profiling：互斥锁分析，报告互斥锁的竞争情况



### 3. 使用模式

- Report generation：报告生成
- Interactive terminal use：交互式终端使用
- Web interface：Web 界面



## 2. 使用

### 1. 工具型应用

如果你的应用程序是运行一段时间就结束退出类型。那么最好的办法是在应用退出的时候把 profiling 的报告保存到文件中，进行分析。对于这种情况，可以使用runtime/pprof库。 首先在代码中导入runtime/pprof工具：

```go
  import "runtime/pprof"
```

CPU性能分析

```go
// 程序运行时开启统计
pprof.StartCPUProfile(w io.Writer)
// 程序结束时关闭
pprof.StopCPUProfile()
```

内存性能优化

```go
// 程序退出前记录即可 
pprof.WriteHeapProfile(w io.Writer)
```

例如

```go
f1, err := os.Create("./cpu.pprof") // 在当前路径下创建一个cpu.pprof文件
		if err != nil {
			fmt.Printf("create cpu pprof failed, err:%v\n", err)
			return
		}
		pprof.StartCPUProfile(f1) // 往文件中记录CPU profile信息
		defer func() {
			pprof.StopCPUProfile()
			f1.Close()
		}()
```

或者

```go
f2, err := os.Create("./mem.pprof")
if err != nil {
    fmt.Printf("create mem pprof failed, err:%v\n", err)
    return
}
pprof.WriteHeapProfile(f2)
f2.Close()
```



### 2. 服务型应用

如果你的应用程序是一直运行的，比如 web 应用，那么可以使用net/http/pprof库，它能够在提供 HTTP 服务进行分析。

如果使用了默认的http.DefaultServeMux（通常是代码直接使用 `http.ListenAndServe("0.0.0.0:8000", nil)`，只需要在你的web server端代码中按如下方式导入net/http/pprof

```go
 import _ "net/http/pprof"
```

如果你使用自定义的 Mux，则需要手动注册一些路由规则：

```go
    r.HandleFunc("/debug/pprof/", pprof.Index)
    r.HandleFunc("/debug/pprof/cmdline", pprof.Cmdline)
    r.HandleFunc("/debug/pprof/profile", pprof.Profile)
    r.HandleFunc("/debug/pprof/symbol", pprof.Symbol)
    r.HandleFunc("/debug/pprof/trace", pprof.Trace)
```

如果你使用的是gin框架，那么推荐使用"github.com/DeanThompson/ginpprof"。

例如

```go
import (
    // 省略...
    _ "net/http/pprof"
)
func main() {
    flag.Parse()

    //远程获取pprof数据
    go func() {
        log.Println(http.ListenAndServe("localhost:8080", nil))
    }()
	// 省略...
}
```

```go
}
```

编译运行之后在浏览器访问 `http://localhost:8080/debug/pprof/`

这个路径下还有几个子页面：

- /debug/pprof/profile：访问这个链接会自动进行 CPU profiling，持续 30s，并生成一个文件供下载
- /debug/pprof/heap： Memory Profiling 的路径，访问这个链接会得到一个内存 Profiling 结果的文件
- /debug/pprof/block：block Profiling 的路径
- /debug/pprof/goroutines：运行的 goroutines 列表，以及调用关系



### 3. 数据分析

通过前面两种方式，获取到数据后即可进行分析。

我们可以使用go tool pprof命令行工具。

go tool pprof最简单的使用方式为:

```
    go tool pprof [binary] [source]
```

其中：

- binary 是应用的二进制文件，用来解析各种符号；
- source 表示 profile 数据的来源，可以是本地的文件，也可以是 http 地址。

注意事项： 获取的 Profiling 数据是动态的，要想获得有效的数据，请保证应用处于较大的负载（比如正在生成中运行的服务，或者通过其他工具模拟访问压力）。否则如果应用处于空闲状态，得到的结果可能没有任何意义。



#### 1. 通过交互式终端使用

```shell
go tool pprof cpu.pprof
```

会进入一个交互式界面：

```shell
Type: cpu
Time: Jul 15, 2020 at 9:23am (CST)
Duration: 20s, Total samples = 10ms ( 0.05%)
Entering interactive mode (type "help" for commands, "o" for options)
```

进入终端之后，排查性能问题的三个命令为：

* `top`
   查看资源较高的调用。

* `list`
   `list 代码片段`查看问题代码具体位置。

* `web`
   在Web Browser上图形化显示当前的资源监控内容。需要事先安装**[graphviz](https://links.jianshu.com/go?to=https%3A%2F%2Fgraphviz.gitlab.io%2Fdownload%2F)**。



我们可以在交互界面输入`top3`来查看程序中占用CPU前3位的函数：

```shell
(pprof) top3
Showing nodes accounting for 10ms, 100% of 10ms total
Showing top 3 nodes out of 4
      flat  flat%   sum%        cum   cum%
      10ms   100%   100%       10ms   100%  runtime.findrunnable
         0     0%   100%       10ms   100%  runtime.mcall
         0     0%   100%       10ms   100%  runtime.park_m
```

结束后将默认进入 pprof 的交互式命令模式，可以对分析的结果进行查看或导出。具体可执行 pprof help 查看命令说明

- flat：给定函数上运行耗时
- flat%：同上的 CPU 运行耗时总比例
- sum%：给定函数累积使用 CPU 总比例
- cum：当前函数加上它之上的调用运行总耗时
- cum%：同上的 CPU 运行耗时总比例

最后一列为函数名称，在大多数的情况下，我们可以通过这五列得出一个应用程序的运行情况，加以优化

#### 2. 图形化

或者可以直接输入web，通过svg图的方式查看程序中详细的CPU占用情况。 想要查看图形化的界面首先需要安装graphviz图形化工具。

> `web`命令的实际行为是产生一个 `.svg`文件，并调用系统里设置的默认打开 `.svg` 的程序打开它。如果系统里打开 `.svg` 的默认程序并不是浏览器（比如代码编辑器），需要设置一下默认使用浏览器打开 `.svg` 文件。

关于图形的说明： 每个框代表一个函数，理论上框的越大表示占用的CPU资源越多。 方框之间的线条代表函数之间的调用关系。 线条上的数字表示函数调用的次数。 方框中的第一行数字表示当前函数占用CPU的百分比，第二行数字表示当前函数累计占用CPU的百分比。

#### 3. go-torch和火焰图

火焰图（Flame Graph）是 Bredan Gregg 创建的一种性能分析图表，因为它的样子近似 🔥而得名。上面的 profiling 结果也转换成火焰图，如果对火焰图比较了解可以手动来操作，不过这里我们要介绍一个工具：go-torch。这是 uber 开源的一个工具，可以直接读取 golang profiling 数据，并生成一个火焰图的 svg 文件。

安装go-touch

```go
go get -v github.com/uber/go-torch
```

go-torch 工具的使用非常简单，没有任何参数的话，它会尝试从http://localhost:8080/debug/pprof/profile获取 profiling 数据。它有三个常用的参数可以调整：

- -u –url：要访问的 URL，这里只是主机和端口部分
- -s –suffix：pprof profile 的路径，默认为 /debug/pprof/profile
- –seconds：要执行 profiling 的时间长度，默认为 30s

要生成火焰图，需要事先安装 FlameGraph工具，这个工具的安装很简单（需要perl环境支持），只要把对应的可执行文件加入到环境变量中即可。

1.下载安装perl：https://www.perl.org/get.html

2.下载FlameGraph：git clone https://github.com/brendangregg/FlameGraph.git

3.将FlameGraph目录加入到操作系统的环境变量中。

4.Windows平台的同学，需要把go-torch/render/flamegraph.go文件中的GenerateFlameGraph按如下方式修改，然后在go-torch目录下执行go install即可。

```go
// GenerateFlameGraph runs the flamegraph script to generate a flame graph SVG. func GenerateFlameGraph(graphInput []byte, args ...string) ([]byte, error) {
flameGraph := findInPath(flameGraphScripts)
if flameGraph == "" {
    return nil, errNoPerlScript
}
if runtime.GOOS == "windows" {
    return runScript("perl", append([]string{flameGraph}, args...), graphInput)
}
  return runScript(flameGraph, args, graphInput)
}
```



运行

```shell
go-torch -u localhost:8080
```



#### 4. 自带火焰图

也可以使用 go 自带的工具生成火焰图

**获取cpuprofile**

```shell
go tool pprof ./binname http://127.0.0.1:8080/debug/pprof/profile -seconds 10
```

时间到后会生成一个类似`pprof.samples.cpu.003.pb.gz`的文件

**生成火焰图**

```shell
go tool pprof -http=:8081 ~/pprof/pprof.samples.cpu.001.pb.gz
```

在浏览器中即可查看到相关信息了 view中可以选择查询各种内容。感觉这种方式方便一些。

### 4. 组合使用

#### 1. 压测

使用压测工具的同时，进行 pprof 以达到最好的效果。

压测工具推荐使用

```shell
https://github.com/wg/wrk
https://github.com/adjust/go-wrk
```

压测同时使用 go-torch 采集数据。

例如

```shell
#压测
go-wrk -n 50000 http://127.0.0.1:8080/book/list
# 采集
go-torch -u http://127.0.0.1:8080 -t 30
```

30秒之后终端会出现如下提示：Writing svg to torch.svg

然后我们使用浏览器打开torch.svg就能看到火焰图了。

火焰图的y轴表示cpu调用方法的先后，x轴表示在每个采样调用时间内，方法所占的时间百分比，越宽代表占据cpu时间越多。通过火焰图我们就可以更清楚的找出耗时长的函数调用，然后不断的修正代码，重新采样，不断优化。

#### 2. 性能测试

go test命令有两个参数和 pprof 相关，它们分别指定生成的 CPU 和 Memory profiling 保存的文件：

- -cpuprofile：cpu profiling 数据要保存的文件地址
- -memprofile：memory profiling 数据要报文的文件地址

我们还可以选择将pprof与性能测试相结合，比如：

比如下面执行测试的同时，也会执行 CPU profiling，并把结果保存在 cpu.prof 文件中：

```
    go test -bench . -cpuprofile=cpu.prof
```

比如下面执行测试的同时，也会执行 Mem profiling，并把结果保存在 cpu.prof 文件中：

```
    go test -bench . -memprofile=./mem.prof
```

需要注意的是，Profiling 一般和性能测试一起使用，这个原因在前文也提到过，只有应用在负载高的情况下 Profiling 才有意义。



## 3. 小结

pprof 使用一共两个步骤：

* 1）采集数据
  * 工具型应用
  * 服务型应用
* 2）分析数据
  * 交互式终端
  * svg
  * 火焰图