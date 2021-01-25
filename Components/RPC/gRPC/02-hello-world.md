---
title: "gRPC系列(二)---Hello gRPC"
description: "gRPC之hello world"
date: 2020-12-19 22:00:00
draft: false
tags: ["gRPC"]
categories: ["gRPC"]
---

本文主要对 gRPC 框架做了简单的介绍，同时记录了一个简单的 hello wolrd 教程。

<!--more-->

## 1. 概述

gRPC 是一个高性能、通用的开源 RPC 框架，其由 Google 主要面向移动应用开发并基于 HTTP/2 协议标准而设计，基于 ProtoBuf(Protocol Buffers) 序列化协议开发，且支持众多开发语言。

与许多 RPC 系统类似，gRPC 也是基于以下理念：**定义一个`服务`，指定其能够被远程调用的方法（包含参数和返回类型）。在服务端实现这个接口，并运行一个 gRPC 服务器来处理客户端调用。在客户端拥有一个`存根`能够像服务端一样的方法**。

gRPC 默认使用 **protocol buffers**，这是 Google 开源的一套成熟的结构数据序列化机制（当然也可以使用其他数据格式如 JSON）。

> gRPC 系列相关代码见 [Github][Git]



## 2. 环境准备

**1）protoc**

首先需要安装 protocol buffers compile 即 `protoc ` 和 Go Plugins。

> 具体见 [Protobuf 章节][Protobuf 章节]

**2）gRPC**

然后是安装 gRPC 。

```sh
$ go get -u google.golang.org/grpc
```

国内由于某些原因，安装超时的话可以在这里查看解决办法：`https://github.com/grpc/grpc-go#FAQ`

> 或者设置 GOPROXY ,具体看这里 `https://goproxy.cn`

**3）gRPC plugins**

接着是下载 gRPC Plugins，用于生成 gRPC 相关源代码。

```sh
$ go get google.golang.org/grpc/cmd/protoc-gen-go-grpc
```



## 3. Helloworld

**环境**

首先确保自己的环境是 OK 的：

* 1）终端输入 protoc --version 能打印出版本信息；
* 2）$GOPATH/bin 目录下有 `protoc-gen-go`、`protoc-gen-go-grpc` 这两个可执行文件。

**本教程版本信息如下**：

* protoc 3.14.0
* protoc-gen-go v1.25.0
* gPRC v1.35.0
* protoc-gen-go-grpc 1.0.1

**项目结构如下**：

```sh
helloworld/
├── client
│   └── main.go
├── helloworld
│   ├── hello_world_grpc.pb.go
│   ├── hello_world.pb.go
│   └── hello_world.proto
└── server
    └── main.go
```



### 1. 编写.proto文件

`hello_world.proto`文件内容如下：

```protobuf
//声明proto的版本 只有 proto3 才支持 gRPC
syntax = "proto3";
// 将编译后文件输出在 github.com/lixd/grpc-go-example/helloworld/helloworld 目录
option go_package = "github.com/lixd/grpc-go-example/helloworld/helloworld";
// 指定当前proto文件属于helloworld包
package helloworld;

// 定义一个名叫 greeting 的服务
service Greeter {
  // 该服务包含一个 SayHello 方法 HelloRequest、HelloReply分别为该方法的输入与输出
  rpc SayHello (HelloRequest) returns (HelloReply) {}
}
// 具体的参数定义
message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
```

这里定义了一个服务 `Greeter`，其中有一个方法名为 `SayHello`。其接收参数为`HelloRequest`类型，返回`HelloReply`类型。

服务定义为：

```cpp
// 定义一个名叫 greeting 的服务
service Greeter {
  // 该服务包含一个 SayHello 方法 HelloRequest、HelloReply分别为该方法的输入与输出
  rpc SayHello (HelloRequest) returns (HelloReply) {}
}
```



### 2. 编译生成源代码

使用 protoc 编译生成对应源文件，具体命令如下:

```go
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
   ./hello_world.proto
```

会在当前目录生成`hello_world.pb.go`和`hello_world_grpc.pb.go`两个文件。



> 具体 protobuf 如何定义，各个参数的作用见 [protobuf][protobuf]



### 3. Server 

```go
package main

import (
	"context"
	"log"
	"net"

	pb "github.com/lixd/grpc-go-example/helloworld/helloworld"
	"google.golang.org/grpc"
)

const (
	port = ":50051"
)

// greeterServer 定义一个结构体用于实现 .proto文件中定义的方法
// 新版本 gRPC 要求必须嵌入 pb.UnimplementedGreeterServer 结构体
type greeterServer struct {
	pb.UnimplementedGreeterServer
}

// SayHello 简单实现一下.proto文件中定义的 SayHello 方法
func (g *greeterServer) SayHello(ctx context.Context, in *pb.HelloRequest) (*pb.HelloReply, error) {
	log.Printf("Received: %v", in.GetName())
	return &pb.HelloReply{Message: "Hello " + in.GetName()}, nil
}

func main() {
	listen, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()
	// 将服务描述(server)及其具体实现(greeterServer)注册到 gRPC 中去.
	// 内部使用的是一个 map 结构存储，类似 HTTP server。
	pb.RegisterGreeterServer(s, &greeterServer{})
	log.Println("Serving gRPC on 0.0.0.0" + port)
	if err := s.Serve(listen); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
```

具体步骤如下:

* 1）定义一个结构体，必须包含`pb.UnimplementedGreeterServer` 对象；
* 2）实现 .proto文件中定义的API；
* 3）将服务描述及其具体实现注册到 gRPC 中；
* 4）启动服务。



### 4. Client 

```go
package main

import (
	"context"
	"log"
	"os"
	"time"

	pb "github.com/lixd/grpc-go-example/helloworld/helloworld"
	"google.golang.org/grpc"
)

const (
	address     = "localhost:50051"
	defaultName = "world"
)

func main() {
	conn, err := grpc.Dial(address, grpc.WithInsecure(), grpc.WithBlock())
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()
	c := pb.NewGreeterClient(conn)

	// 通过命令行参数指定 name
	name := defaultName
	if len(os.Args) > 1 {
		name = os.Args[1]
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	r, err := c.SayHello(ctx, &pb.HelloRequest{Name: name})
	if err != nil {
		log.Fatalf("could not greet: %v", err)
	}
	log.Printf("Greeting: %s", r.GetMessage())
}
```

具体步骤如下：

* 1）首先使用 `grpc.Dial()` 与 gRPC 服务器建立连接；
* 2）使用` pb.NewGreeterClient(conn)`获取客户端；
* 3）通过客户端调用ServiceAPI方法`client.SayHello`。



### 5. Test

先运行服务端

```sh
lixd@17x:~/17x/projects/grpc-go-example/helloworld/server$ go run main.go 
2021/01/23 14:47:20 Serving gRPC on 0.0.0.0:50051
2021/01/23 14:47:32 Received: world
2021/01/23 14:47:52 Received: 指月
```

然后运行客户端

```sh
lixd@17x:~/17x/projects/grpc-go-example/helloworld/client$ go run main.go 
2021/01/23 14:47:32 Greeting: Hello world
lixd@17x:~/17x/projects/grpc-go-example/helloworld/client$ go run main.go 指月
2021/01/23 14:47:52 Greeting: Hello 指月
```

到此为止 gRPC 版的 hello world 已经完成了。



## 4. 小结

使用 gRPC 的 3个 步骤:

* 1）需要使用 protobuf 定义接口，即编写 .proto 文件;
* 2）然后使用 protoc 工具配合编译插件编译生成特定语言或模块的执行代码，比如 Go、Java、C/C++、Python 等。
* 3）分别编写 server 端和 client 端代码，写入自己的业务逻辑。



> gRPC 系列相关代码见 [Github][Git]



## 5. 参考

`https://grpc.io/docs/languages/go/quickstart/`

`https://github.com/grpc/grpc-go`



[Git]:https://github.com/lixd/grpc-go-example
[Protobuf 章节]:https://www.lixueduan.com/post/grpc/01-protobuf
[protobuf详解]:https://github.com/lixd/daily-notes/blob/master/Components/RPC/gRPC/%E5%BC%95%E5%85%A5%E5%85%B6%E4%BB%96proto%E6%96%87%E4%BB%B6.md