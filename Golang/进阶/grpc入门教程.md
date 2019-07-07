# gRPC

## 1. 概述

gRPC 是一个高性能、通用的开源RPC框架，其由Google主要面向移动应用开发并基于HTTP/2协议标准而设计，基于ProtoBuf(Protocol Buffers)序列化协议开发，且支持众多开发语言。 gRPC基于HTTP/2标准设计，带来诸如双向流控、头部压缩、单TCP连接上的多复用请求等特性。这些特性使得其在移动设备上表现更好，更省电和节省空间占用。

在 gRPC 里`客户端`应用可以像调用本地对象一样直接调用另一台不同的机器上`服务端`应用的方法，使得您能够更容易地创建分布式应用和服务。与许多 RPC 系统类似，gRPC 也是基于以下理念：**定义一个`服务`，指定其能够被远程调用的方法（包含参数和返回类型）。在服务端实现这个接口，并运行一个 gRPC 服务器来处理客户端调用。在客户端拥有一个`存根`能够像服务端一样的方法**。

gRPC 默认使用 **protocol buffers**，这是 Google 开源的一套成熟的结构数据序列化机制（当然也可以使用其他数据格式如 JSON）。

## 2. 环境准备

#### env

* gRPC 需要 go 1.6以上

#### 安装gRPC

```go
go get -u google.golang.org/grpc
```

```go
$ go get -u google.golang.org/grpc
package google.golang.org/grpc: unrecognized import path "google.golang.org/grpc" (https fetch: Get https://google.golang.org/grpc?go-get=1: dial tcp 216.239.37.1:443: i/o timeout)
```

国内一般这样安装不上，具体解决办法：`https://github.com/grpc/grpc-go#FAQ`

如果用了go mod 可以用下面的方法

```go
go mod edit -replace=google.golang.org/grpc=github.com/grpc/grpc-go@latest
go mod tidy
go mod vendor
go build -mod=vendor
```

#### 安装protobuf

具体见[gRPC入门教程(一)---Protobuf安装与基本使用](https://www.lixueduan.com/posts/5ad1b62f.html)

## 3. 使用步骤

* 1）需要使用 protobuf 定义接口，即编写 .proto 文件

* 2）然后使用 compile 工具生成特定语言的执行代码，比如 Java、C/C++、Python 等。类似于 thrift，为了解决跨语言问题。

* 3）启动一个 Server 端，server 端通过侦听指定的 port，来等待 Client 链接请求，通常使用 Netty 来构建，gRPC 内置了 Netty 的支持。

*  4）启动一个或者多个 Client 端，Client 也是基于 Netty，Client 通过与 Server 建立 TCP 长链接，并发送请求；Request 与 Response 均被封装成 HTTP2 的 stream Frame，通过 Netty Channel 进行交互。

## 4. 示例程序

#### 1.hello.proto

```protobuf
syntax = "proto3";

package helloworld;

// The greeting service definition.
service Greeter {
    // Sends a greeting
    rpc SayHello (HelloRequest) returns (HelloReply) {}
}

// The request message containing the user's name.
message HelloRequest {
    string name = 1;
}

// The response message containing the greetings
message HelloReply {
    string message = 1;
}

```

编译

```go
// 官方插件
protoc --go_out=plugins=grpc:. hello.proto
// protoc 编译命令
// go_out 编译成go代码 java_out 则编译成Java代码
// plugins=grpc 使用grpc插件提供对grpc的支持 否则不会生成Service的接口
// :. 编译到当前路径
// hello.proto 被编译的文件

// gofast插件
protoc --gofast_out=plugins=grpc:. hello.proto
```

生成对应的 pb.go 文件。这里用了 plugins 选项，提供对 grpc 的支持，否则不会生成 Service 的接口。

这里定义了一个服务 Greeter，其中有个API `SayHello`。其接受参数为`HelloRequest`类型，返回`HelloReply`类型。这里`HelloRequest`和`HelloReply`就是普通的PB定义

服务定义为：

```cpp
// The greeting service definition.

service Greeter {

  // Sends a greeting

  rpc SayHello (HelloRequest) returns (HelloReply) {}

}
```

`service`定义了一个server。其中的接口可以是四种类型

- rpc GetFeature(Point) returns (Feature) {}
  类似普通的函数调用，客户端发送请求Point到服务器，服务器返回相应Feature.
- rpc ListFeatures(Rectangle) returns (stream Feature) {}
  客户端发起一次请求，服务器端返回一个流式数据，比如一个数组中的逐个元素
- rpc RecordRoute(stream Point) returns (RouteSummary) {}
  客户端发起的请求是一个流式的数据，比如数组中的逐个元素，服务器返回一个相应
- rpc RouteChat(stream RouteNote) returns (stream RouteNote) {}
  客户端发起的请求是一个流式数据，比如数组中的逐个元素，二服务器返回的也是一个类似的数据结构

#### 2.Server

```go

package main
 
import (
    "log"
    "net"
 	//pb文件目录
    pb "your_path_to_gen_pb_dir/helloworld" 
    "golang.org/x/net/context"
    "google.golang.org/grpc"
)
 
const (
    port = ":50051"
)
 
// server is used to implement helloworld.GreeterServer.
type server struct{}
 
// SayHello implements helloworld.GreeterServer
func (s *server) SayHello(ctx context.Context, in *pb.HelloRequest) (*pb.HelloReply, error) {
    return &pb.HelloReply{Message: "Hello " + in.Name}, nil
}
 
func main() {
    lis, err := net.Listen("tcp", port)
    if err != nil {
        log.Fatalf("failed to listen: %v", err)
    }
    s := grpc.NewServer()
    pb.RegisterGreeterServer(s, &server{})
    s.Serve(lis)
}
```

这里首先定义一个 server 结构，然后实现 SayHello 的接口。

```go
SayHello(context.Context, *HelloRequest) (*HelloReply, error)
```

然后调用`grpc.NewServer()` 创建一个server s。接着注册这个server s到结构server上面 `pb.RegisterGreeterServer(s, &server{})` 最后将创建的net.Listener传给`s.Serve()`。就可以开始监听并服务了，类似HTTP的ListenAndServe。

#### 3.client

```go
package main
 
import (
    "log"
    "os"
 
    pb "your_path_to_gen_pb_dir/helloworld"
    "golang.org/x/net/context"
    "google.golang.org/grpc"
)
 
const (
    address     = "localhost:50051"
    defaultName = "world"
)
 
func main() {
    // Set up a connection to the server.
    conn, err := grpc.Dial(address, grpc.WithInsecure())
    if err != nil {
        log.Fatalf("did not connect: %v", err)
    }
    defer conn.Close()
    c := pb.NewGreeterClient(conn)
 
    // Contact the server and print out its response.
    name := defaultName
    if len(os.Args) > 1 {
        name = os.Args[1]
    }
    r, err := c.SayHello(context.Background(), &pb.HelloRequest{Name: name})
    if err != nil {
        log.Fatalf("could not greet: %v", err)
    }
    log.Printf("Greeting: %s", r.Message)
}

```

这里通过pb.NewGreeterClient()传入一个conn创建一个client，然后直接调用client上面对应的服务器的接口

```go
SayHello(context.Context, *HelloRequest) (*HelloReply, error)
```

接口，返回*HelloReply 对象。

先运行服务器，在运行客户端，可以看到。

```go
2019/07/02 17:07:50 Greeting: Hello world
```



## 5. 小结

使用gRPC的3个步骤

#### 1. 写proto文件

```protobuf
syntax = "proto3";

package helloworld;

// 定义一个服务
service UserService {
	// 定义服务中的某个方法 请求参数User 返回值Resp
    rpc Create (User) returns (Resp) {
    }
}
// 请求参数
message User {
    string name = 1;
    string age = 2;
}
// 返回值
message Resp {
    string message = 1;
}
```

#### 2. 编译后的文件

部分代码如下：

```go
// UserServiceClient is the client API for UserService service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://godoc.org/google.golang.org/grpc#ClientConn.NewStream.
// 客户端调用接口
type UserServiceClient interface {
	Create(ctx context.Context, in *User, opts ...grpc.CallOption) (*Resp, error)
}

type userServiceClient struct {
	cc *grpc.ClientConn
}

func NewUserServiceClient(cc *grpc.ClientConn) UserServiceClient {
	return &userServiceClient{cc}
}
// 客户端调用的方法具体实现
func (c *userServiceClient) Create(ctx context.Context, in *User, opts ...grpc.CallOption) (*Resp, error) {
	out := new(Resp)
    // invoke 大概是反射调用 service中的方法
	err := c.cc.Invoke(ctx, "/helloworld.UserService/Create", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// UserServiceServer is the server API for UserService service.
type UserServiceServer interface {
	Create(context.Context, *User) (*Resp, error)
}

func RegisterUserServiceServer(s *grpc.Server, srv UserServiceServer) {
	s.RegisterService(&_UserService_serviceDesc, srv)
}

func _UserService_Create_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(User)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(UserServiceServer).Create(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/helloworld.UserService/Create",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(UserServiceServer).Create(ctx, req.(*User))
	}
	return interceptor(ctx, in, info, handler)
}

var _UserService_serviceDesc = grpc.ServiceDesc{
	ServiceName: "helloworld.UserService",
	HandlerType: (*UserServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "Create",
			Handler:    _UserService_Create_Handler,
		},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "hello.proto",
}

```

#### 3. Service

定义结构体，实现proto中定义的接口。

```go
package main

import (
	"golang.org/x/net/context"
	"google.golang.org/grpc"
	pb "i-go/grpc/proto"
	"log"
	"net"
)
// 定义一个结构体
type userServer struct {
}
// 然后实现proto中定义的方法
func (s *userServer) Create(ctx context.Context, user *pb.User) (msg *pb.Resp, err error) {
	return &pb.Resp{Message: "Create Success"}, nil
}

func main() {
	listener, err := net.Listen("tcp", "50052")
	if err != nil {
		log.Fatalf("net.Listen fail: %v", err)
	}
	newServer := grpc.NewServer()
	pb.RegisterUserServiceServer(newServer, &userServer{})
	newServer.Serve(listener)
}

```

#### 4. client

```go
package main

import (
	"context"
	"google.golang.org/grpc"
	pb "i-go/grpc/proto"
	"log"
)

func main() {
	// grpc.WithInsecure() 禁用传输安全性
	conn, err := grpc.Dial("localhost:50052", grpc.WithInsecure())
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()
    // 创建一个client
	client := pb.NewUserServiceClient(conn)
    // 调用的是UserServiceClient中的方法
	resp, err := client.Create(context.Background(), &pb.User{Name: "illusory", Age: "23"})
	if err != nil {
		log.Fatalf("could not Create: %v", err)
	}
	log.Printf("Create Resp: %s", resp.Message)
}

```

