# Go-Micro入门教程

## 1. 概述

微服务框架

## 2. HelloWorld

### 2.1 环境准备

#### 1.protobuf 

具体教程点这里[Protobuf安装与基本使用](https://www.lixueduan.com/posts/5ad1b62f.html)

#### 2.protobuf-micro插件

```sh
go get github.com/micro/micro/v2/cmd/protoc-gen-micro@master
```

#### 3.go-micro

```sh
go install github.com/micro/micro/v2
```

### 2.2 hello.proto文件

```protobuf
syntax = "proto3";

package proto;

// 定义服务 Greeter
service Greeter {
    // 定义方法
    rpc SayHello (HelloRequest) returns (HelloReply) {
    }
}

// 请求参数
message HelloRequest {
    string name = 1;
}

// 返回值
message HelloReply {
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
	"context"
	"github.com/micro/go-micro/v2"
	"github.com/sirupsen/logrus"
	"i-go/go-micro/hello/micro/proto"
)

const (
	Hello = "go.micro.srv.greeter"
)

// 定义一个结构体
type helloServerNew struct{}

// 实现proto文件中定义的方法
func (s *helloServerNew) SayHello(ctx context.Context, in *proto.HelloRequest, out *proto.HelloReply) error {
	out.Message = "Hello " + in.Name
	return nil
}

/*
使用的micro内部的注册中心
*/
func main() {
	// 注意，在这里我们使用go-micro的NewService方法来创建新的微服务服务器，
	// 而不是上一篇文章中所用的标准
	srv := micro.NewService(
		// 名字需要注意 微服务是通过名字调用的 所以客户端调用时也要用同样的名字
		micro.Name(Hello),
		micro.Version("latest"),
	)

	/*
		//当然这里也可以直接用grpc.NewServer()
		//不过这个grpc 是"github.com/micro/go-micro/service/grpc"
		// gomicro为了兼容grpc做的特殊处理 内部也是调用的micro.NewService()
		srv := grpc.NewService(
			micro.Name("go.micro.srv.hello"),
			micro.Version("latest"),
		)*/
	// Init方法会解析命令行flags
	srv.Init()
	// 这里是注册 可以看成http server的注册路由
	// 实际内部执行的是传入的第一个参数 即这里的srv.Server() 的Handle(Handler) error方法
	// gomicro这里有3个实现 rpc grpc和一个mock 应该用来测试的吧
	err := proto.RegisterGreeterHandler(srv.Server(), &helloServerNew{})
	if err != nil {
		logrus.Error(err)
	}
	// run方法调用了start方法
	// start方法也和上面一样有3个实现 grpc的start方法内部和普通grpc差不多
	// 也是net.Listen开启监听	ts, err := net.Listen("tcp", config.Address)
	// 然后还调用了register方法 根据不同的注册中心也有不同实现 就是把server信息添加到注册中心去
	// 然后循环根据设置的注册时间间隔 每过一段时间就去重新注册一次
	// start方法中同时也监听了 linux下的syscall.SIGTERM, syscall.SIGINT, syscall.SIGQUIT这几个信号
	// 信号和context.done触发时都会执行stop方法 stop方法也是3种实现 grpc的stop方法是把started状态改成false然后发送了一个exit信号
	// run方法循环注册那个地方接收到这个退出信号也就退出循环了 然后从注册中心取消注册 接着有一个优雅关闭
	// 优雅关闭大概就是先不在接收新的连接 然后等所有的连接都处理完了再关掉
	if err := srv.Run(); err != nil {
		logrus.Error(err)
	}
}

```

### 2.4 Client

```go
package main

import (
	"context"
	"fmt"
	"github.com/micro/go-micro/v2"
	"github.com/sirupsen/logrus"
	"i-go/go-micro/hello/micro/proto"
)

const (
	Hello = "go.micro.srv.greeter"
)

func main() {
	service := micro.NewService(micro.Name(Hello))
	service.Init()

	client := proto.NewGreeterService(Hello, service.Client())

	rsp, err := client.SayHello(context.TODO(), &proto.HelloRequest{Name: "lixd"})
	if err != nil {
		logrus.Error(err)
	}
	fmt.Println(rsp)
}

```

### 2.5 测试

先启动Server再启动Client，结果如下：

```go
//Server
Auth [noop] Authenticated as go.micro.srv.hello-7289d8f2-d860-448f-8441-6cdd6702f74d in the go.micro namespace
Starting [service] go.micro.srv.greeter
Server [grpc] Listening on [::]:50609
// 默认用的mdns注册中心
Registry [mdns] Registering node: go.micro.srv.greeter-7289d8f2-d860-448f-8441-6cdd6702f74d

//Client
message:"Hello lixd" 
```



## 3 etcd注册中心



 ### server

```go
package main

import (
	"context"
	"github.com/micro/go-micro/v2"
	"github.com/micro/go-micro/v2/registry"
	"github.com/micro/go-micro/v2/registry/etcd"
	"github.com/sirupsen/logrus"
	"i-go/go-micro/hello-etcd/proto"
	"time"
)

const (
	Hello = "go.micro.srv.greeter"
)

type helloServerNew struct{}

func (s *helloServerNew) SayHello(ctx context.Context, in *proto.HelloRequest, out *proto.HelloReply) error {
	out.Message = "Hello " + in.Name
	return nil
}

/*
使用的etcd做注册中心
*/
func main() {
	// etcd-->"github.com/micro/go-micro/v2/registry/etcd"
	// NewRegistry 需要传一个或多个func进去 type Option func(*Options)
	reg := etcd.NewRegistry(func(options *registry.Options) {
		options.Addrs = []string{"123.57.236.125:12379", "123.57.236.125:22379", "123.57.236.125:32379"}
		options.Timeout = 10 * time.Second
	})

	// 注意，在这里我们使用go-micro的NewService方法来创建新的微服务服务器，
	/*
		当然这里也可以直接用grpc.NewService()
		不过这个grpc 是"github.com/micro/go-micro/service/grpc"
		gomicro为了兼容grpc做的特殊处理 内部也是调用的micro.NewService()
		srv := grpc.NewService(
			micro.Name("go.micro.srv.hello"),
			micro.Version("latest"),
		)*/
	srv := micro.NewService(
		// 名字需要注意 微服务是通过名字调用的 所以客户端调用时也要用同样的名字
		micro.Name(Hello),
		micro.Version("v1"),
		micro.Registry(reg),
		micro.AfterStart(func() error {
			logrus.WithFields(logrus.Fields{"Server": Hello, "Scenes": "server start..."})
			return nil
		}),
		micro.AfterStop(func() error {
			logrus.WithFields(logrus.Fields{"Server": Hello, "Scenes": "server stop..."})
			return nil
		}),
	)

	// Init方法会解析命令行flags
	srv.Init()
	// 这里是注册 可以看成http server的注册路由
	// 实际内部执行的是传入的第一个参数 即这里的srv.Server() 的Handle(Handler) error方法
	// gomicro这里有3个实现 rpc grpc和一个mock 应该用来测试的吧
	err := proto.RegisterGreeterHandler(srv.Server(), &helloServerNew{})
	if err != nil {
		panic(err)
	}

	if err := srv.Run(); err != nil {
		panic(err)
	}
}

```



### client

```go
package main

import (
	"context"
	"fmt"
	"github.com/micro/go-micro/v2"
	"github.com/micro/go-micro/v2/registry"
	"github.com/micro/go-micro/v2/registry/etcd"
	"github.com/sirupsen/logrus"
	"i-go/go-micro/hello-etcd/proto"
	"time"
)

const (
	Hello = "go.micro.srv.greeter"
)

func main() {
	// etcd服务注册与发现
	reg := etcd.NewRegistry(func(options *registry.Options) {
		options.Addrs = []string{"123.57.236.125:12379", "123.57.236.125:22379", "123.57.236.125:32379"}
		options.Timeout = 10 * time.Second
	})
	service := micro.NewService(
		micro.Name(Hello),
		micro.Version("v1"),
		micro.Registry(reg),
	)
	service.Init()

	client := proto.NewGreeterService(Hello, service.Client())

	rsp, err := client.SayHello(context.TODO(), &proto.HelloRequest{Name: "lixd"})
	if err != nil {
		logrus.Error(err)
	}
	fmt.Println(rsp)
}
```



可以看到只是增加了一句`micro.Registry(reg)`

## 4. 代码下载 

[github](https://github.com/lixd/i-go/tree/master/go-micro)

