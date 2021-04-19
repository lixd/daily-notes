---
title: "gRPC系列教程(十)---gRPC压测工具ghz"
description: "gRPC Benchmark Tools ghz"
date: 2021-04-16 22:00:00
draft: false
tags: ["gRPC"]
categories: ["gRPC"]
---

本文主要介绍了 gRPC 压测工具 ghz ，包括 ghz 的安装、使用及压测计划制定等。

<!--more-->

> gRPC 系列相关代码见 [Github][Github]

## 1. 安装

可以直接在[Release页面](https://github.com/bojand/ghz/releases)下载二进制文件，也可以 clone 仓库手动编译。

下载解压后即可使用

```sh
# 下载
$ wget https://github.91chifun.workers.dev/https://github.com//bojand/ghz/releases/download/v0.94.0/ghz-linux-x86_64.tar.gz
ghz-linux-x86_64.ta 100%[===================>]  10.41M  1.84MB/s    用时 5.7s  
# 解压
$ tar -zxvf ghz-linux-x86_64.tar.gz 
ghz
ghz-web
LICENSE
$ ls
ghz  ghz-linux-x86_64.tar.gz  ghz-web  LICENSE
# 添加到环境变量
$ sudo vim /etc/profile
$ source /etc/profile
# 具体位置就是刚解压的位置
$ cat /etc/profile
export PATH=$PATH:/home/lixd/17x/env
```

具体语法

```sh
ghz [<flags>] [<host>]
```



## 2. 参数说明

只列出了常用参数，其他参数可以查看[官方文档](https://ghz.sh/docs/usage)或者查阅帮助命令`ghz -h`

大致可以分为三类参数：

* 基本参数
* 负载参数
* 并发参数



### 2.1 基本参数

* `--config`：指定配置文件位置
* `--proto`：指定 proto 文件位置
  * 会从 proto 文件中获取相关信息
* `--call`：指定调用的方法。
  * 具体格式为`包名.服务名.方法名`
  * 如：`--call helloworld.Greeter.SayHello`
* `-c`：并发请求数
* `-n`：最大请求数，达到后则结束测试
* `-d`：请求参数
  * JSON格式，如`-d '{"name":"Bob"}'`
* `-D`：以文件方式指定请求参数，JSON文件位置
  * 如`-D ./file.json`
* `-o`：输出路径
  * 默认输出到 stdout
* `-O/--format`：输出格式，有多种格式可选
  * 便于查看的：csv、json、pretty、html：
  * 便于入库的：influx-summary、influx-details：满足[InfluxDB line-protocol](https://docs.influxdata.com/influxdb/v1.6/concepts/glossary/#line-protocol) 格式的输出

 以上就是相关的基本参数，有了这些参数基本可以进行测试了。



### 2.2 负载参数

负载参数主要控制ghz每秒发起的请求数（RPS）。

* `-r/--rps`：指定RPS
  * ghz以恒定的RPS进行测试
* `--load-schedule`：负载调度算法，取值如下：
  * const：恒定RPS，也是默认调用算法
  * step：步进增长RPS，需要配合`load-start`，`load-step`，`load-end`，`load-step-duration`，和`load-max-duration`等参数
  * line：线性增长RPS，需要配合`load-start`，`load-step`，`load-end`，和`load-max-duration`等参数，其实line就是 step 算法将load-step-duration时间固定为一秒了。
* `--load-start`：step、line 的起始RPS
* `--load-step`：step、line 的步进值或斜率值
* `--load-end`：step、line 的负载结束值
* `--load-max-duration`：最大持续时间，到达则结束

例如

```sh
-n 10000 -c 10 --load-schedule=step --load-start=50 --load-step=10 --load-step-duration=5s
```

从50RPS开始，每5秒钟增加10RPS，一直到完成10000请求为止。

```sh
-n 10000 -c 10 --load-schedule=step --load-start=50 --load-end=150 --load-step=10 --load-step-duration=5s
```

从50RPS开始，每5秒钟增加10RPS，最多增加到150RPS，一直到完成10000请求为止。

```sh
-n 10000 -c 10 --load-schedule=line --load-start=200 --load-step=-2 --load-end=50
```

从200RPS开始，每1秒钟降低2RPS，一直降低到50RPS，一直到完成10000请求为止。

> line 其实就是 step，只不过是把--load-step-duration固定为1秒了



### 2.3 并发参数

* `-c`：并发woker数，
  * 注意：不是并发请求数
* `--concurrency-schedule`：并发调度算法，和`--load-schedule`类似

  * const：恒定并发数，默认值
  * step：步进增加并发数
  * line：线性增加并发数
* `--concurrency-start`：起始并发数
* `--concurrency-end`：结束并发数
* `--concurrency-step`：并发数步进值
* `--concurrency-step-duration`：在每个梯段需要持续的时间
* `--concurrency-max-duration`：最大持续时间

例子：

```sh
-n 100000 --rps 200 --concurrency-schedule=step --concurrency-start=5 --concurrency-step=5 --concurrency-end=50 --concurrency-step-duration=5s
```

固定RPS200，worker数从5开始，每5秒增加5，最大增加到50。

> 注意：5个worker时也要完成200RPS，即每个worker需要完成40RPS，到50个worker时只需要每个worker完成4RPS即可达到200RPS。

通过指定负载参数和并发参数可以更加专业的进行压测。

### 2.4 配置文件

所有参数都可以通过配置文件来指定，这也是比较推荐的用法。

比如这样：

```json
{
    "proto": "/path/to/greeter.proto",
    "call": "helloworld.Greeter.SayHello",
    "total": 2000,
    "concurrency": 50,
    "data": {
        "name": "Joe"
    },
    "metadata": {
        "foo": "bar",
        "trace_id": "{{.RequestNumber}}",
        "timestamp": "{{.TimestampUnix}}"
    },
    "import-paths": [
        "/path/to/protos"
    ],
    "max-duration": "10s",
    "host": "0.0.0.0:50051"
}
```



## 3. 使用

该工具有两种使用方式。

* 1）`ghz` 二进制文件方式，通过命令行参数或者配置文件指定配置信息
* 2）`ghz/runner`编程方式使用，通过代码指定配置信息

二者只是打开方式不同，具体原理是一样的。

首页启动服务端，这里就是要之前[HelloWorld教程](https://lixueduan.com/post/grpc/02-hello-world/)中的[Greeter](https://github.com/lixd/grpc-go-example/tree/main/helloworld/server)服务。

```sh
lixd@17x:~/17x/projects/grpc-go-example/helloworld/server$ go run main.go 
2021/04/17 10:53:46 Serving gRPC on 0.0.0.0:50051
```



### 3.1 命令行方式

**1）基本参数**

首先使用基本参数进行测试

```sh
ghz -c 10 -n 1000 \
   --insecure \
   --proto ./hello_world.proto \
   --call helloworld.Greeter.SayHello \
   -d '{"name":"Joe"}' \
   0.0.0.0:50051
```

`--call helloworld.Greeter.SayHello`：说明，具体 proto 文件如下

```protobuf
// 省略其他代码...
package helloworld;
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply) {}
}
```

可以看到，包名为helloworld、 service名为Greeter，方法名为 SayHello。

结果如下

```sh
Summary:
  Count:        1000
  Total:        87.65 ms
  Slowest:      6.97 ms
  Fastest:      0.12 ms
  Average:      0.75 ms
  Requests/sec: 11409.21

Response time histogram:
  0.118 [1]     |
  0.803 [801]   |∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎
  1.487 [131]   |∎∎∎∎∎∎∎
  2.172 [27]    |∎
  2.857 [18]    |∎
  3.542 [12]    |∎
  4.226 [0]     |
  4.911 [0]     |
  5.596 [0]     |
  6.281 [0]     |
  6.966 [10]    |

Latency distribution:
  10 % in 0.35 ms 
  25 % in 0.43 ms 
  50 % in 0.57 ms 
  75 % in 0.75 ms 
  90 % in 1.23 ms 
  95 % in 1.62 ms 
  99 % in 3.31 ms 

Status code distribution:
  [OK]   1000 responses  
```

大部分请求都能在3ms左右响应。



**2）负载参数**

接着增加负载参数

```sh
ghz -c 10 -n 1000 \
   --insecure \
   --proto ./hello_world.proto \
   --call helloworld.Greeter.SayHello \
   -d '{"name":"Joe"}' \
   --load-schedule=step --load-start=50 --load-step=10 --load-step-duration=5s \
   -o report.html -O html \
   0.0.0.0:50051
```

这次指定使用HTML方式输出结果，执行完成后可以在当前目录看到输出的HTML文件

```sh
$ ls
report.html
```

具体内容如下：

![ghz-html][ghz-html]

相比之下HTML方式更加直观。



**3）并发参数**

最后使用并发参数

```sh
ghz -c 10 -n 10000 \
   --insecure \
   --proto ./hello_world.proto \
   --call helloworld.Greeter.SayHello \
   -d '{"name":"Joe"}' \
   --rps 200 --concurrency-schedule=step --concurrency-start=5 --concurrency-step=5 --concurrency-end=50 --concurrency-step-duration=5s \
   -o report.json -O pretty \
   0.0.0.0:50051
```

本次以CSV格式打印输出

```txt
duration (ms),status,error
1.05,OK,
0.32,OK,
0.30,OK,
0.36,OK,
0.34,OK,
0.29,OK,
0.40,OK,
0.40,OK,
0.62,OK,
0.31,OK,
0.30,OK,
0.48,OK,
```

CSV和JSON格式会将每次请求及其消耗时间、状态等信息一一列出，信息比较全，不过相比HTML不够直观。



### 3.2  ghz/runner编程方式

编程方式更加灵活，同时可以直接使用二进制请求数据也比较方便。

> 完整代码见 [Github][Github]

相关代码如下：

```go
package main

import (
	"log"
	"os"

	"github.com/bojand/ghz/printer"
	"github.com/bojand/ghz/runner"
	"github.com/golang/protobuf/proto"
	pb "github.com/lixd/grpc-go-example/helloworld/helloworld"
)

// 官方文档 https://ghz.sh/docs/intro.html
func main() {
	// 组装BinaryData
	item := pb.HelloRequest{Name: "lixd"}
	buf := proto.Buffer{}
	err := buf.EncodeMessage(&item)
	if err != nil {
		log.Fatal(err)
		return
	}
	report, err := runner.Run(
		// 基本配置 call host proto文件 data
		"helloworld.Greeter.SayHello", //  'package.Service/method' or 'package.Service.Method'
		"localhost:50051",
		runner.WithProtoFile("../helloworld/helloworld/hello_world.proto", []string{}),
		runner.WithBinaryData(buf.Bytes()),
		runner.WithInsecure(true),
		runner.WithTotalRequests(10000),
		// 并发参数
		runner.WithConcurrencySchedule(runner.ScheduleLine),
		runner.WithConcurrencyStep(10),
		runner.WithConcurrencyStart(5),
		runner.WithConcurrencyEnd(100),
	)
	if err != nil {
		log.Fatal(err)
		return
	}
	// 指定输出路径
	file, err := os.Create("report.html")
	if err != nil {
		log.Fatal(err)
		return
	}
	rp := printer.ReportPrinter{
		Out:    file,
		Report: report,
	}
	// 指定输出格式
	_ = rp.Print("html")
}
```



运行测试会在当前目录输出`report.html`文件

```sh
$ go run ghz.go
$ ls
ghz.go  report.html
```



## 4. 小结

推荐使用ghz/runner编程方式+HTML格式输出结果。

* ghz/runner编程方式相比二进制方式更加灵活
* HTML格式输出结果更加直观



[Github]:https://github.com/lixd/grpc-go-example
[ghz-html]:https://github.com/lixd/blog/raw/master/images/grpc/ghz-html.png