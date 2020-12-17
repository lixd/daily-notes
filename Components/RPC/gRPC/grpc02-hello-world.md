# gRPC系列(一)---Hello World

## 1. 概述

gRPC 是一个高性能、通用的开源RPC框架，其由Google主要面向移动应用开发并基于HTTP/2协议标准而设计，基于ProtoBuf(Protocol Buffers)序列化协议开发，且支持众多开发语言。

与许多 RPC 系统类似，gRPC 也是基于以下理念：**定义一个`服务`，指定其能够被远程调用的方法（包含参数和返回类型）。在服务端实现这个接口，并运行一个 gRPC 服务器来处理客户端调用。在客户端拥有一个`存根`能够像服务端一样的方法**。

gRPC 默认使用 **protocol buffers**，这是 Google 开源的一套成熟的结构数据序列化机制（当然也可以使用其他数据格式如 JSON）。



## 2. 环境准备

**1）protoc**

首先需要安装 protocol buffers compile  `protoc ` 和 Go Plugins。

> 具体见 [Protobuf 章节](https://www.lixueduan.com)

**2）gRPC**

然后是安装 gRPC 。

```go
$ go get -u google.golang.org/grpc
```

国内由于某些原因，安装超时的话可以在这里查看解决办法：`https://github.com/grpc/grpc-go#FAQ`

> 或者设置 GOPROXY ,具体看这里 `https://goproxy.cn`

**3）Go plugins**

接着是下载 gRPC Plugins，用于生成 gRPC 相关源代码。

```sh
$ go get google.golang.org/grpc/cmd/protoc-gen-go-grpc
```



## 3. Helloworld

**环境**

首先确保自己的环境是OK的：

* 1）终端输入 protoc --version 能打印出版本信息；
* 2）$GOPATH/bin 目录下有 `protoc-gen-go`、`protoc-gen-go-grpc` 这两个可执行文件。

**本教程版本信息如下**：

* protoc 3.14.0
* protoc-gen-go v1.25.0
* gPRC v1.34.0
* protoc-gen-go-grpc 1.0.1

**项目结构如下**：

```json
helloworld
├── client
│   └── client.go
├── proto     
│   └── hello_world.proto
└── server
    └── server.go
```



### 1. 创建.proto文件

首先创建一个`hello_world.proto`

```protobuf
//声明proto的版本 只有 proto3 才支持 gRPC
syntax = "proto3";
// .表示生成go文件存在在当前目录，proto 表示生成go文件报名为proto
option go_package = ".;proto";
// 指定当前proto文件属于helloworld包
package helloworld;

// The greeting service definition.
service Greeter {
  // Sends a greeting
  rpc SayHello (HelloRequest) returns (HelloReply) {}
}
//
// The request message containing the user's name.
message HelloRequest {
  string name = 1;
}

// The response message containing the greetings
message HelloReply {
  string message = 1;
}
```

这里定义了一个服务 `Greeter`，其中有一个 API 名为 `SayHello`。其接受参数为`HelloRequest`类型，返回`HelloReply`类型。

服务定义为：

```cpp
// The greeting service definition.
service Greeter {
  // Sends a greeting
  rpc SayHello (HelloRequest) returns (HelloReply) {}
}
```

`service`定义了一个 server，其中的 API 可以是以下四种类型：

- `rpc GetFeature(Point) returns (Feature) {}`
  类似普通的函数调用，客户端发送请求 Point 到服务器，服务器返回响应 Feature.
- `rpc ListFeatures(Rectangle) returns (stream Feature) {}`
  客户端发起一次请求，服务器端返回一个流式数据，比如一个数组中的逐个元素。
- `rpc RecordRoute(stream Point) returns (RouteSummary) {}`
  客户端发起的请求是一个流式的数据，比如数组中的逐个元素，服务器返回一个相应
- `rpc RouteChat(stream RouteNote) returns (stream RouteNote) {}`
  客户端发起的请求是一个流式数据，比如数组中的逐个元素，服务器返回的也是流式数据。



### 2. protoc 编译

使用 protoc 编译生成对应源文件，具体命令如下:

```go
protoc  --go_out=. --go_opt=paths=source_relative \
   --go-grpc_out=. --go-grpc_opt=paths=source_relative \
   ./proto/hello_world.proto
```

会生成`.pb.go`和`_grpc.pb.go`两个文件。



### 3. server.go

```go
package main

import (
	"context"
	"log"
	"net"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
	pb "i-go/grpc/helloworld/proto"
)

// greeterServer 随便定义一个结构体用于实现 .proto文件中定义的API
// 新版本 gRPC 要求必须嵌入 pb.UnimplementedGreeterServer 对象
type greeterServer struct {
	pb.UnimplementedGreeterServer
}

// SayHello 简单实现一下.proto文件中定义的 API
func (g *greeterServer) SayHello(ctx context.Context, in *pb.HelloRequest) (*pb.HelloReply, error) {
	return &pb.HelloReply{Message: "Hello " + in.Name}, nil
}
func main() {
	listen, err := net.Listen("tcp", ":8080")
	if err != nil {
		panic(err)
	}
	server := grpc.NewServer()
	// 将服务描述(server)及其具体实现(greeterServer)注册到 gRPC 中去.
	// 内部使用的是一个 map 结构存储，类似 HTTP server。
	pb.RegisterGreeterServer(server, &greeterServer{})
	// reflection.Register(server)
	log.Println("Serving gRPC on 0.0.0.0:8080")
	if err := server.Serve(listen); err != nil {
		panic(err)
	}
}
```

具体步骤如下:

* 1）定义一个结构体，必须包含`pb.UnimplementedGreeterServer` 对象；
* 2）实现 .proto文件中定义的API；
* 3）将服务描述及其具体实现注册到 gRPC 中；
* 4）启动服务。

### 4. client.go

```go
package main

import (
	"context"
	"log"

	"google.golang.org/grpc"
	pb "i-go/grpc/helloworld/proto"
)

func main() {
	conn, err := grpc.DialContext(context.Background(), "0.0.0.0:8080", grpc.WithInsecure())
	if err != nil {
		panic(err)
	}
	defer conn.Close()

	client := pb.NewGreeterClient(conn)
	resp, err := client.SayHello(context.Background(), &pb.HelloRequest{Name: "world"})
	if err != nil {
		log.Fatalf("could not greet: %v", err)
	}
	log.Printf("Greeting: %s", resp.Message)
}
```

具体步骤如下：

* 1）首先使用 `grpc.DialContext()` 与 gRPC 服务器建立连接；
* 2）使用` pb.NewGreeterClient(conn)`获取客户端；
* 3）使用 客户端调用方法`client.SayHello`。



### 5. run

先运行服务端

```sh
$ go run server.go
2020/12/17 20:28:19 Serving gRPC on 0.0.0.0:8080
```

然后运行客户端

```go
$ go run client.go
2020/12/17 20:28:27 Greeting: Hello world
```

到此为止 gRPC 版的 hello world 已经完成了。

## 4. 小结

使用 gRPC 的3个步骤:

* 1）需要使用 protobuf 定义接口，即编写 .proto 文件;
* 2）然后使用 protoc 工具配合编译插件编译生成特定语言或模块的执行代码，比如 Go、Java、C/C++、Python 等。
* 3）分别编写 server 端和 client 端代码，写入自己的业务逻辑。





## 5. 参考

`https://grpc.io/docs/languages/go/quickstart/`

`https://github.com/grpc/grpc-go`