# gRPC Interceptor

## 1. 概述

gRPC 服务端提供了 interceptor 功能，可以在服务端接收到请求时优先对请求中的数据做一些处理后再转交给指定的服务处理并响应，很适合在这里处理验证、日志等流程。

gRPC-go 在 v1.28.0版本增加了多 interceptor 支持，可以在不借助第三方库（go-grpc-middleware）的情况下添加多个 interceptor 了。

> go-grpc-middleware 中也提供了多种常用 interceptor ，可以直接使用。

在 gRPC 中，根据方法类型可以分为作用于 Unary 方法的**一元拦截器**，和作用于 Stream 方法的**流拦截器**。

同时还分为**服务端拦截器**和**客户端拦截器**，所以一共有以下4种类型:

- grpc.UnaryServerInterceptor
- grpc.StreamServerInterceptor
- grpc.UnaryClientInterceptor
- grpc.StreamClientInterceptor

> gRPC 系列所有代码都在这个 [Git仓库](https://github.com/lixd/i-go/tree/master/grpc)

## 2. 定义

### 1. 服务端拦截器

**UnaryServerInterceptor**

要完成一个拦截器需要实现为 `grpc.UnaryServerInterceptor` 类型的方法。

> Go 里面方法也是一等公民，所以这里直接将方法当做参数传递了。

具体定义如下：

```go
type UnaryServerInterceptor func(ctx context.Context, req interface{}, info *UnaryServerInfo, handler UnaryHandler) (resp interface{}, err error)
```

参数具体含义如下：

- ctx context.Context：请求上下文
- req interface{}：RPC 方法的请求参数
- info *UnaryServerInfo：RPC 方法的所有信息
- handler UnaryHandler：RPC 方法真正执行的逻辑

**StreamServerInterceptor**

同样的，流拦截器需要实现 一个类型为 `grpc.StreamServerInterceptor` 的方法。

具体定义如下：

```go
type StreamServerInterceptor func(srv interface{}, ss ServerStream, info *StreamServerInfo, handler StreamHandler) error
```

### 2. 客户端拦截器

客户端拦截器和服务端拦截器类似，也是实现对应类型的方法即可。

**UnaryClientInterceptor**

```go
type UnaryClientInterceptor func(ctx context.Context, method string, req, reply interface{}, cc *ClientConn, invoker UnaryInvoker, opts ...CallOption) error
```

**StreamClientInterceptor**

```go
type StreamClientInterceptor func(ctx context.Context, desc *StreamDesc, cc *ClientConn, method string, streamer Streamer, opts ...CallOption) (ClientStream, error)
```



## 3. 使用

### 1. 服务端

服务端只需要在创建 gRPC server 的时候通过 grpc.ServerOption 参数指定 interceptor 即可。

下面代码分别指定了一个 / 多个的 Unary / Stream 拦截器。

```go
	interceptors := grpc.UnaryInterceptor(inter.UnaryServerFilter)
	// interceptors := grpc.StreamInterceptor(inter.StreamServerFilter)
	// interceptors := grpc.ChainUnaryInterceptor(inter.UnaryServerRecovery, inter.UnaryServerFilter, inter.UnaryServerLogging)
	// interceptors := grpc.ChainStreamInterceptor(inter.StreamServerRecovery, inter.StreamServerFilter, inter.StreamServerLogging)
	s := grpc.NewServer(interceptors)
```

完整代码如下

```go
func main() {
	listen, err := net.Listen("tcp", ":8084")
	if err != nil {
		panic(err)
	}
	// gRPCv1.28.0 增加了ChainUnaryInterceptor 多Interceptor的情况也可以不借助 go-grpc-middleware 这个包了
	// https://github.com/grpc/grpc-go/pull/3336
	interceptors:=grpc.ChainUnaryInterceptor(inter.UnaryServerRecovery, inter.UnaryServerFilter, inter.UnaryServerLogging)
	s := grpc.NewServer(interceptors)
	pb.RegisterGreeterServer(s, &greeterServer{})
	log.Println("Serving gRPC on 0.0.0.0:8084")
	if err := s.Serve(listen); err != nil {
		panic(err)
	}
}
```



### 2. 客户端

与服务端类似，客户端则在获取连接的时候通过`grpc.DialOption` 参数指定拦截器。

```go
	// 指定拦截器
	interceptors := grpc.WithUnaryInterceptor(inter.UnaryClientFilter)
	// interceptors := grpc.WithStreamInterceptor(inter.StreamClientFilter)
	// interceptors := grpc.WithChainUnaryInterceptor(inter.UnaryClientRecovery, inter.UnaryClientLogging, inter.UnaryClientFilter)
	// interceptors := grpc.WithChainStreamInterceptor(inter.StreamClientRecovery, inter.StreamClientLogging, inter.StreamClientFilter)
	conn, err := grpc.DialContext(
		context.Background(),
		"0.0.0.0:8084",
		grpc.WithInsecure(),
		grpc.WithBlock(),
		interceptors)
```

完整代码如下

```go
func main() {
	// 指定拦截器
	interceptors := grpc.WithUnaryInterceptor(inter.UnaryClientFilter)
	conn, err := grpc.DialContext(
		context.Background(),
		"0.0.0.0:8084",
		grpc.WithInsecure(),
		grpc.WithBlock(),
		interceptors)
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



## 4. 例子

例子都是用的之前文章中的代码，为了演示不同类型的拦截器，分别写了一个 Unary 方法和一个 Stream 方法。

### interceptor.proto

```protobuf
syntax = "proto3";
option go_package = ".;proto";
package interceptor;

service Interceptor {
  rpc SayHello (HelloRequest) returns (HelloReply) {}
  rpc Sqrt (stream SqrtReq) returns (stream SqrtReply) {}
}

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}

message SqrtReq {
  double number = 1;
}

message SqrtReply {
  double sqrt = 1;
}
```

编译

```sh
protoc --proto_path=./proto \
   --go_out=./proto --go_opt=paths=source_relative \
   --go-grpc_out=./proto --go-grpc_opt=paths=source_relative \
   ./proto/interceptor.proto
```



### interceptor.go

只列举了部分拦截器实现，完整代码见这个[Git仓库](https://github.com/lixd/i-go/tree/master/grpc/interceptor)

> [这个仓库](https://github.com/grpc-ecosystem/go-grpc-middleware)也提供了很多常见拦截器。

```go
func UnaryServerFilter(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (
	resp interface{}, err error) {
	log.Printf("unary filter server:%v method:%v :", info.Server, info.FullMethod)
	return handler(ctx, req)
}
```

```go
// UnaryServerLogging RPC 方法的入参出参的日志输出
func UnaryServerLogging(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (
	interface{}, error) {
	log.Printf("unary gRPC before: %s, %v", info.FullMethod, req)
	resp, err := handler(ctx, req)
	log.Printf("unary gRPC after: %s, %v", info.FullMethod, resp)
	return resp, err
}
```

```go
// UnaryServerRecovery RPC 方法的异常保护和日志输出
func UnaryServerRecovery(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (
	resp interface{}, err error) {
	defer func() {
		if e := recover(); e != nil {
			debug.PrintStack()
			err = status.Errorf(codes.Internal, "unary panic err: %v", e)
		}
	}()

	return handler(ctx, req)
}
```



### server.go

**服务端需要注册所有拦截器(unary和stream)**，gRPC 会根据请求的不同方法选择调用不同类型的拦截器。

```go
package main

import (
	"io"
	"log"
	"math"
	"net"
	"sync"

	"golang.org/x/net/context"
	"google.golang.org/grpc"
	"i-go/grpc/interceptor/inter"
	pb "i-go/grpc/interceptor/proto"
)

type interceptor struct {
	pb.UnimplementedInterceptorServer
}

func (i *interceptor) SayHello(ctx context.Context, in *pb.HelloRequest) (*pb.HelloReply, error) {
	// panic("test")
	return &pb.HelloReply{Message: "Hello " + in.Name}, nil
}
func (i *interceptor) Sqrt(stream pb.Interceptor_SqrtServer) error {
	// panic("test")

	var (
		waitGroup sync.WaitGroup
		numbers   = make(chan float64)
	)
	waitGroup.Add(1)
	go func() {
		defer waitGroup.Done()

		for v := range numbers {
			err := stream.Send(&pb.SqrtReply{Sqrt: math.Sqrt(v)})
			if err != nil {
				log.Printf("Send error:%v \n", err)
				continue
			}
		}
	}()

	waitGroup.Add(1)
	go func() {
		defer waitGroup.Done()
		for {
			req, err := stream.Recv()
			if err == io.EOF {
				break
			}
			if err != nil {
				log.Fatalf("Recv error:%v", err)
			}
			log.Printf("Recv Data:%v \n", req.Number)
			numbers <- req.Number
		}
		close(numbers)
	}()
	waitGroup.Wait()

	// 返回nil表示已经完成响应
	return nil
}

func main() {
	listen, err := net.Listen("tcp", ":8084")
	if err != nil {
		panic(err)
	}
	// https://github.com/grpc/grpc-go/pull/3336
	// gRPCv1.28.0 增加了ChainUnaryInterceptor 多Interceptor的情况也可以不借助 go-grpc-middleware 这个包了
	// interceptors := grpc.UnaryInterceptor(grpcMiddleware.ChainUnaryServer(
	// 	inter.UnaryServerRecovery,inter.UnaryServerFilter,inter.UnaryServerLogging))
	// 服务端需要注册所有拦截器(unary和stream)
	unaryInts := grpc.ChainUnaryInterceptor(inter.UnaryServerRecovery, inter.UnaryServerFilter, inter.UnaryServerLogging)
	streamInts := grpc.ChainStreamInterceptor(inter.StreamServerRecovery, inter.StreamServerFilter, inter.StreamServerLogging)
	s := grpc.NewServer(unaryInts, streamInts)
	pb.RegisterInterceptorServer(s, &interceptor{})
	log.Println("Serving gRPC on 0.0.0.0:8084")
	if err := s.Serve(listen); err != nil {
		panic(err)
	}
}

```



### client.go

需要调用两种不同类型的方法，这里就分成了两个文件。`client_unary.go`和

`client_stream.go`

**客户端调用的时候只需要注册需要的拦截器即可**，比如调用 unary 方法则只需要注册 unary拦截器，stream 方法同理。

**client_unary.go**

```go
package main

import (
	"log"

	"golang.org/x/net/context"
	"google.golang.org/grpc"
	"i-go/grpc/interceptor/inter"
	pb "i-go/grpc/interceptor/proto"
)

func main() {
	// 指定拦截器 这里指调用unary方法SayHello所以只需要注册unary相关拦截器
	unaryInts := grpc.WithChainUnaryInterceptor(inter.UnaryClientRecovery, inter.UnaryClientLogging, inter.UnaryClientFilter)
	conn, err := grpc.DialContext(context.Background(), "0.0.0.0:8084", grpc.WithInsecure(),
		grpc.WithBlock(), unaryInts)
	if err != nil {
		panic(err)
	}
	defer conn.Close()
	client := pb.NewInterceptorClient(conn)
	resp, err := client.SayHello(context.Background(), &pb.HelloRequest{Name: "world"})
	if err != nil {
		log.Fatalf("could not greet: %v", err)
	}
	log.Printf("Greeting: %s", resp.Message)
}
```



**client_stream.go**

```go
package main

import (
	"io"
	"log"
	"sync"
	"time"

	"golang.org/x/net/context"
	"google.golang.org/grpc"
	"i-go/grpc/interceptor/inter"
	pb "i-go/grpc/interceptor/proto"
)

func main() {
	var (
		wg sync.WaitGroup
	)
	// 指定拦截器 这里指调用stream方法SayHello所以只需要注册stream相关拦截器
	streamInts := grpc.WithChainStreamInterceptor(inter.StreamClientRecovery, inter.StreamClientLogging, inter.StreamClientFilter)
	conn, err := grpc.DialContext(context.Background(), "0.0.0.0:8084", grpc.WithInsecure(),
		grpc.WithBlock(), streamInts)
	if err != nil {
		panic(err)
	}
	defer conn.Close()
	client := pb.NewInterceptorClient(conn)
	stream, err := client.Sqrt(context.Background())
	if err != nil {
		log.Fatalf("Sqrt error: %v", err)
	}
	// 3.开两个goroutine 分别用于Recv()和Send()
	wg.Add(1)
	go func() {
		defer wg.Done()
		for {
			data, err := stream.Recv()
			if err == io.EOF {
				log.Println("Server Closed")
				break
			}
			if err != nil {
				continue
			}
			log.Printf("Recv Data:%v \n", data.Sqrt)
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()

		for i := 0; i < 10; i++ {
			err := stream.Send(&pb.SqrtReq{Number: float64(i)})
			if err != nil {
				log.Printf("Send error:%v\n", err)
			}
			time.Sleep(time.Second)
		}
		// 4. 发送完毕关闭stream
		err := stream.CloseSend()
		if err != nil {
			log.Printf("Send error:%v\n", err)
			return
		}
	}()
	wg.Wait()
}
```



### run

先运行服务端

```sh
$ go run server.go
2020/12/21 14:33:09 Serving gRPC on 0.0.0.0:8084
```

接着运行 unary 方法客户端

```sh
$ go run client_unary.go
2020/12/21 14:33:26 unary filter,method :/interceptor.Interceptor/SayHello
2020/12/21 14:33:26 unary gRPC before method: /interceptor.Interceptor/SayHello req:name:"world"
2020/12/21 14:33:26 unary gRPC after method: /interceptor.Interceptor/SayHello reply:message:"Hello world"
2020/12/21 14:33:26 Greeting: Hello world
```

服务端输出

```sh
2020/12/21 14:33:26 unary filter server:&{{}} method:/interceptor.Interceptor/SayHello :
2020/12/21 14:33:26 unary gRPC before: /interceptor.Interceptor/SayHello, name:"world"
2020/12/21 14:33:26 unary gRPC after: /interceptor.Interceptor/SayHello, message:"Hello world"
```



然后运行 stream 方法客户端

```go
$ go run client_stream.go
2020/12/21 14:33:51 stream filter,method :/interceptor.Interceptor/Sqrt
2020/12/21 14:33:51 stream gRPC before method: /interceptor.Interceptor/Sqrt
2020/12/21 14:33:51 stream gRPC after method: /interceptor.Interceptor/Sqrt
2020/12/21 14:33:51 Recv Data:0
2020/12/21 14:33:52 Recv Data:1
2020/12/21 14:33:53 Recv Data:1.4142135623730951
2020/12/21 14:33:54 Recv Data:1.7320508075688772
2020/12/21 14:33:55 Recv Data:2
2020/12/21 14:33:56 Recv Data:2.23606797749979
2020/12/21 14:33:57 Recv Data:2.449489742783178
2020/12/21 14:33:58 Recv Data:2.6457513110645907
2020/12/21 14:33:59 Recv Data:2.8284271247461903
2020/12/21 14:34:00 Recv Data:3
2020/12/21 14:34:01 Server Closed
```

服务端输出

```sh
2020/12/21 14:33:51 stream filter method:/interceptor.Interceptor/Sqrt :
2020/12/21 14:33:51 stream gRPC before: /interceptor.Interceptor/Sqrt
2020/12/21 14:33:51 Recv Data:0
2020/12/21 14:33:52 Recv Data:1
2020/12/21 14:33:53 Recv Data:2
2020/12/21 14:33:54 Recv Data:3
2020/12/21 14:33:55 Recv Data:4
2020/12/21 14:33:56 Recv Data:5
2020/12/21 14:33:57 Recv Data:6
2020/12/21 14:33:58 Recv Data:7
2020/12/21 14:33:59 Recv Data:8
2020/12/21 14:34:00 Recv Data:9
2020/12/21 14:34:01 stream gRPC after: /interceptor.Interceptor/Sqrt
```



可以看到**拦截器执行顺序就是参数的传递顺序**，参数指定时按照 recovery、filter、logging 顺序来的，执行时也是这个顺序。

> 由于没有 panic 所以 recovery 拦截器什么也没有做。

手动触发 panic 后结果如下

```go
$ go run client_unary.go
2020/12/21 15:15:48 unary filter,method :/interceptor.Interceptor/SayHello
2020/12/21 15:15:48 unary gRPC before method: /interceptor.Interceptor/SayHello req:name:"world"
2020/12/21 15:15:48 unary gRPC after method: /interceptor.Interceptor/SayHello reply:
2020/12/21 15:15:48 could not greet: rpc error: code = Internal desc = unary panic err: test
exit status 1
```

**Recovery拦截器必须放在第一个**，否则无法捕获后续拦截器中触发的panic。



## 5. 小结

**1）拦截器分类与定义**
gRPC拦截器可以分为：一元拦截器和流拦截器，服务端拦截器和客户端拦截器。

一共有以下4种类型:

- grpc.UnaryServerInterceptor
- grpc.StreamServerInterceptor
- grpc.UnaryClientInterceptor
- grpc.StreamClientInterceptor

拦截器本质上就是一个特定类型的方法，所以实现拦截器只需要实现对应类型方法（**方法签名相同**）即可。

**2）拦截器使用及执行顺序**

服务端需要指定所有方法用到的拦截器，客户端只需要指定调用方法用到的拦截器即可。

**拦截器执行顺序就是参数传入顺序，gRPC 会根据不同方法选择对应类型的拦截器执行。**

所以，**Recovery拦截器必须放在第一个**，否则无法捕获后续拦截器中触发的panic。



## 6. 参考

`https://eddycjy.com/posts/go/grpc/2018-10-10-interceptor/`

`https://github.com/grpc/grpc-go`

`https://github.com/grpc-ecosystem/go-grpc-middleware`