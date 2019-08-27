# Go-Micro入门教程

## 1. 概述

微服务框架

## 2. HelloWorld

### 2.1 环境准备

#### 1.protobuf 

具体教程点这里[Protobuf安装与基本使用](https://www.lixueduan.com/posts/5ad1b62f.html)

#### 2.protobuf-micro插件

```sh
go get github.com/micro/protoc-gen-micro
```

#### 3.go-micro

```sh
go get github.com/micro/go-micro
```

### 2.2 hello.proto文件

```protobuf
syntax = "proto3";

package go.micro.srv.hello;

// 定义一个服务
service Hello {
    // 定义 SayHello 方法
    rpc SayHello (User) returns (Msg) {
    }
}

//  request
message User {
    string name = 1;
}

//  response
message Msg {
    string message = 1;
}

```

编译命令

```sh
protoc  --gofast_out=. --micro_out=. hello.proto
```

同时会生成`hello.pb.go`和`hello.micro.go`两个文件

### 2.3 Server

```go
package main

import (
	"github.com/micro/go-micro"
	"github.com/sirupsen/logrus"
	"golang.org/x/net/context"
	pb "i-go/go-micro/first/new_micro/pb"
)

const (
	port = ":50051"
)

// 定义一个结构体
type helloServerNew struct{}

// 实现proto文件中定义的方法
func (s *helloServerNew) SayHello(ctx context.Context, req *pb.User, resp *pb.Msg) error {
	resp.Message = "Hello " + req.Name
	return nil
}

func main() {
	srv := micro.NewService(
		// 注意，Name方法的必须是你在proto文件中定义的package名字
		micro.Name("go.micro.srv.consignment"),
		micro.Version("latest"),
	)
	// Init方法会解析命令行flags
	srv.Init()
	err := pb.RegisterHelloHandler(srv.Server(), &helloServerNew{})
	if err != nil {
		logrus.Error(err)
	}
	if err := srv.Run(); err != nil {
		logrus.Error(err)
	}
}

```

### 2.4 Client

```go
package main


import (
	"fmt"
	"github.com/micro/go-micro"
	"github.com/sirupsen/logrus"
	"golang.org/x/net/context"
	pb "i-go/go-micro/first/new_micro/pb"
)

const (
	address     = "localhost:50051"
	defaultName = "illusory"
)

func main() {
	// Create a new service. Optionally include some options here.
	service := micro.NewService(micro.Name("go.micro.srv.hello"))
	service.Init()

	// Create new greeter client
	client := pb.NewHelloService("go.micro.srv.hello", service.Client())

	// Call the greeter
	rsp, err := client.SayHello(context.TODO(), &pb.User{Name: defaultName})
	if err != nil {
		logrus.Error(err)
	}
	// Print response
	fmt.Println(rsp)
}

```

### 2.5 测试

先启动Server再启动Client，结果如下：

```go
//Server
2019/08/11 21:45:38 Transport [http] Listening on [::]:11156
2019/08/11 21:45:38 Broker [http] Connected to [::]:11157
2019/08/11 21:45:39 Registry [mdns] Registering node: go.micro.srv.hello-530a88d4-7e30-45ea-8143-d07bf1211253
//Client
message:"Hello illusory"
```



Go-grpc服务与go-micro服务一样，也就是说你可以直接将服务声明方式`micro.NewService`换成`grpc.NewService`，而不需要改动其它代码。