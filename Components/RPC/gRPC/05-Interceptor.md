---
title: "gRPC系列(五)---拦截器Interceptor"
description: "gRPC拦截器使用"
date: 2021-01-02 22:00:00
draft: false
tags: ["gRPC"]
categories: ["gRPC"]
---

本文主要介绍了 gPRC中 的拦截器(Interceptor)和具体使用实例。

<!--more-->

## 1. 概述

> gRPC 系列相关代码见 [Github][Github]

gRPC 提供了 Interceptor 功能，包括客户端拦截器和服务端拦截器。可以在接收到请求或者发起请求之前优先对请求中的数据做一些处理后再转交给指定的服务处理并响应，很适合在这里处理验证、日志等流程。

gRPC-go 在 v1.28.0版本增加了多 interceptor 支持，可以在不借助第三方库（go-grpc-middleware）的情况下添加多个 interceptor 了。

> go-grpc-middleware 中也提供了多种常用 interceptor ，可以直接使用。

在 gRPC 中，根据拦截的方法类型不同可以分为拦截 Unary 方法的**一元拦截器**，和作用于 Stream 方法的**流拦截器**。

同时还分为**服务端拦截器**和**客户端拦截器**，所以一共有以下4种类型:

- grpc.UnaryServerInterceptor
- grpc.StreamServerInterceptor
- grpc.UnaryClientInterceptor
- grpc.StreamClientInterceptor



## 2. 定义

### 客户端拦截器

使用客户端拦截器 只需要在 Dial的时候指定相应的 DialOption 即可。

#### Unary Interceptor

客户端一元拦截器类型为 `grpc.UnaryClientInterceptor`，具体如下：

```go
type UnaryClientInterceptor func(ctx context.Context, method string, req, reply interface{}, cc *ClientConn, invoker UnaryInvoker, opts ...CallOption) error
```

可以看到，所谓的**拦截器其实就是一个函数**，可以分为`预处理(pre-processing)`、`调用RPC方法(invoking RPC method)`、`后处理(post-processing)`三个阶段。

参数含义如下:

* ctx：Go语言中的上下文，一般和 Goroutine 配合使用，起到超时控制的效果
* method：当前调用的 RPC 方法名
* req：本次请求的参数，只有在`处理前`阶段修改才有效
* reply：本次请求响应，需要在`处理后`阶段才能获取到
* cc：gRPC 连接信息
* invoker：可以看做是当前 RPC 方法，一般在拦截器中调用 invoker 能达到调用 RPC 方法的效果，当然底层也是 gRPC 在处理。
* opts：本次调用指定的 options 信息

作为一个客户端拦截器，可以在`处理前`检查 req 看看本次请求带没带 token 之类的鉴权数据，没有的话就可以在拦截器中加上。

#### Stream Interceptor

```go
type StreamClientInterceptor func(ctx context.Context, desc *StreamDesc, cc *ClientConn, method string, streamer Streamer, opts ...CallOption) (ClientStream, error)
```

由于 StreamAPI 和 UnaryAPI有所不同，因此拦截器方面也有所区别，比如 req 参数变成了 streamer 。同时其拦截过程也有所不同，不在是处理 req resp，而是对 streamer 这个流对象进行包装，比如说实现自己的 SendMsg 和 RecvMsg 方法。

然后在这些方法中的`预处理(pre-processing)`、`调用RPC方法(invoking RPC method)`、`后处理(post-processing)`各个阶段加入自己的逻辑。



### 服务端拦截器

服务端拦截器和客户端拦截器类似，就不做过多描述。使用客户端拦截器 只需要在 NewServer 的时候指定相应的 ServerOption 即可。

#### Unary Interceptor

定义如下：

```go
type UnaryServerInterceptor func(ctx context.Context, req interface{}, info *UnaryServerInfo, handler UnaryHandler) (resp interface{}, err error)
```

参数具体含义如下：

- ctx context.Context：请求上下文
- req interface{}：RPC 方法的请求参数
- info *UnaryServerInfo：RPC 方法的所有信息
- handler UnaryHandler：RPC 方法真正执行的逻辑



#### Stream Interceptor

```go
type StreamServerInterceptor func(srv interface{}, ss ServerStream, info *StreamServerInfo, handler StreamHandler) error
```





## 3. UnaryInterceptor

一元拦截器可以分为3个阶段：

* 1）预处理(pre-processing)
* 2）调用RPC方法(invoking RPC method)
* 3）后处理(post-processing)



### Client

```go
// unaryInterceptor 一个简单的 unary interceptor 示例。
func unaryInterceptor(ctx context.Context, method string, req, reply interface{}, cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
	// pre-processing
	start := time.Now()
	err := invoker(ctx, method, req, reply, cc, opts...) // invoking RPC method
	// post-processing
	end := time.Now()
	logger("RPC: %s, req:%v start time: %s, end time: %s, err: %v", method, req, start.Format(time.RFC3339), end.Format(time.RFC3339), err)
	return err
}
```

`invoker(ctx, method, req, reply, cc, opts...)` 是真正调用 RPC 方法。因此我们可以在调用前后增加自己的逻辑：比如调用前检查一下参数之类的，调用后记录一下本次请求处理耗时等。

建立连接时通过 grpc.WithUnaryInterceptor 指定要加载的拦截器即可。

```go
func main() {
	flag.Parse()

	creds, err := credentials.NewClientTLSFromFile(data.Path("x509/server.crt"), "www.lixueduan.com")
	if err != nil {
		log.Fatalf("failed to load credentials: %v", err)
	}

	// 建立连接时指定要加载的拦截器
	conn, err := grpc.Dial(*addr, grpc.WithTransportCredentials(creds), grpc.WithUnaryInterceptor(unaryInterceptor))
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()

	client := ecpb.NewEchoClient(conn)
	callUnaryEcho(client, "hello world")
}
```



### Server

服务端的一元拦截器和客户端类似：

```go
func unaryInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	start := time.Now()
	m, err := handler(ctx, req)
	end := time.Now()
	// 记录请求参数 耗时 错误信息等数据
	logger("RPC: %s,req:%v start time: %s, end time: %s, err: %v", info.FullMethod, req, start.Format(time.RFC3339), end.Format(time.RFC3339), err)
	return m, err
}
```

服务端则是在 NewServer 时指定拦截器：

```go
func main() {
	flag.Parse()

	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", *port))
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	creds, err := credentials.NewServerTLSFromFile(data.Path("x509/server.crt"), data.Path("x509/server.key"))
	if err != nil {
		log.Fatalf("failed to create credentials: %v", err)
	}

	s := grpc.NewServer(grpc.Creds(creds), grpc.UnaryInterceptor(unaryInterceptor))

	pb.RegisterEchoServer(s, &server{})
	log.Println("Server gRPC on 0.0.0.0" + fmt.Sprintf(":%d", *port))
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
```



### Test

Server

```sh
2021/01/24 19:18:09 Server gRPC on 0.0.0.0:50051
unary echoing message "hello world"
LOG:    RPC: /echo.Echo/UnaryEcho,req:message:"hello world" start time: 2021-01-24T19:18:10+08:00, end time: 2021-01-24T19:18:10+08:00, err: <nil>
```

Client

```sh
LOG:    RPC: /echo.Echo/UnaryEcho, req:message:"hello world" start time: 2021-01-24T19:18:10+08:00, end time: 2021-01-24T19:18:10+08:00, err: <nil>
UnaryEcho:  hello world
```



## 4. StreamInterceptor

流拦截器过程和一元拦截器有所不同，同样可以分为3个阶段：

* 1）预处理(pre-processing)
* 2）调用RPC方法(invoking RPC method)
* 3）后处理(post-processing)

预处理阶段和一元拦截器类似，但是调用RPC方法和后处理这两个阶段则完全不同。

StreamAPI 的请求和响应都是通过 Stream 进行传递的，更进一步是通过 Streamer 调用 SendMsg 和 RecvMsg 这两个方法获取的。

然后 Streamer 又是调用RPC方法来获取的，所以在流拦截器中我们可以**对 Streamer 进行包装，然后实现 SendMsg 和 RecvMsg 这两个方法**。

### Client

本例中通过结构体嵌入的方式，对 Streamer 进行包装，在 SendMsg 和 RecvMsg 之前打印出具体的值。

```go
// wrappedStream  用于包装 grpc.ClientStream 结构体并拦截其对应的方法。
type wrappedStream struct {
	grpc.ClientStream
}

func newWrappedStream(s grpc.ClientStream) grpc.ClientStream {
	return &wrappedStream{s}
}

func (w *wrappedStream) RecvMsg(m interface{}) error {
	logger("Receive a message (Type: %T) at %v", m, time.Now().Format(time.RFC3339))
	return w.ClientStream.RecvMsg(m)
}

func (w *wrappedStream) SendMsg(m interface{}) error {
	logger("Send a message (Type: %T) at %v", m, time.Now().Format(time.RFC3339))
	return w.ClientStream.SendMsg(m)
}
```

连接时则通过 grpc.WithStreamInterceptor 指定要加载的拦截器。

```go
func main() {
	flag.Parse()

	creds, err := credentials.NewClientTLSFromFile(data.Path("x509/server.crt"), "www.lixueduan.com")
	if err != nil {
		log.Fatalf("failed to load credentials: %v", err)
	}

	// 建立连接时指定要加载的拦截器
	conn, err := grpc.Dial(*addr, grpc.WithTransportCredentials(creds), grpc.WithStreamInterceptor(streamInterceptor))
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()

	client := ecpb.NewEchoClient(conn)
	// callUnaryEcho(client, "hello world")
	callBidiStreamingEcho(client)
}
```



### Server

和客户端类似。

```go
type wrappedStream struct {
	grpc.ServerStream
}

func newWrappedStream(s grpc.ServerStream) grpc.ServerStream {
	return &wrappedStream{s}
}

func (w *wrappedStream) RecvMsg(m interface{}) error {
	logger("Receive a message (Type: %T) at %s", m, time.Now().Format(time.RFC3339))
	return w.ServerStream.RecvMsg(m)
}

func (w *wrappedStream) SendMsg(m interface{}) error {
	logger("Send a message (Type: %T) at %v", m, time.Now().Format(time.RFC3339))
	return w.ServerStream.SendMsg(m)
}
```

相似的，通过 函数指定要加载的拦截器。

```go
func main() {
	flag.Parse()

	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", *port))
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	creds, err := credentials.NewServerTLSFromFile(data.Path("x509/server.crt"), data.Path("x509/server.key"))
	if err != nil {
		log.Fatalf("failed to create credentials: %v", err)
	}

	s := grpc.NewServer(grpc.Creds(creds), grpc.StreamInterceptor(streamInterceptor))

	pb.RegisterEchoServer(s, &server{})
	log.Println("Server gRPC on 0.0.0.0" + fmt.Sprintf(":%d", *port))
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
```



### Test

Server

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/interceptor/server$ go run main.go 
2021/01/24 19:58:12 Server gRPC on 0.0.0.0:50051
LOG:    Receive a message (Type: *echo.EchoRequest) at 2021-01-24T19:58:14+08:00
bidi echoing message "Request 1"
LOG:    Send a message (Type: *echo.EchoResponse) at 2021-01-24T19:58:14+08:00
LOG:    Receive a message (Type: *echo.EchoRequest) at 2021-01-24T19:58:14+08:00
bidi echoing message "Request 2"
LOG:    Send a message (Type: *echo.EchoResponse) at 2021-01-24T19:58:14+08:00
LOG:    Receive a message (Type: *echo.EchoRequest) at 2021-01-24T19:58:14+08:00
```

Client

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/interceptor/client$ go run main.go 
LOG:    Send a message (Type: *echo.EchoRequest) at 2021-01-24T19:58:14+08:00
LOG:    Send a message (Type: *echo.EchoRequest) at 2021-01-24T19:58:14+08:00
LOG:    Receive a message (Type: *echo.EchoResponse) at 2021-01-24T19:58:14+08:00
BidiStreaming Echo:  Request 1
LOG:    Receive a message (Type: *echo.EchoResponse) at 2021-01-24T19:58:14+08:00
BidiStreaming Echo:  Request 2
LOG:    Receive a message (Type: *echo.EchoResponse) at 2021-01-24T19:58:14+08:00
```



## 5. 小结

**1）拦截器分类与定义**
gRPC 拦截器可以分为：一元拦截器和流拦截器，服务端拦截器和客户端拦截器。

一共有以下4种类型:

- grpc.UnaryServerInterceptor
- grpc.StreamServerInterceptor
- grpc.UnaryClientInterceptor
- grpc.StreamClientInterceptor

拦截器本质上就是一个特定类型的函数，所以实现拦截器只需要实现对应类型方法（**方法签名相同**）即可。



**2）拦截器执行过程**

**一元拦截器**

* 1）预处理
* 2）调用RPC方法
* 3）后处理

**流拦截器**

* 1）预处理
* 2）调用RPC方法 获取 Streamer
* 3）后处理
  * 调用 SendMsg 、RecvMsg 之前
  * 调用 SendMsg 、RecvMsg
  * 调用 SendMsg 、RecvMsg 之后



**3）拦截器使用及执行顺序**

**配置多个拦截器时，会按照参数传入顺序依次执行**

所以，**如果想配置一个 Recovery 拦截器则必须放在第一个**，放在最后则无法捕获前面执行的拦截器中触发的 panic。

同时也可以将 一元和流拦截器一起配置，gRPC 会根据不同方法选择对应类型的拦截器执行。



最后推荐一下这个 [go-grpc-middleware](https://github.com/grpc-ecosystem/go-grpc-middleware)，该仓库提供了多种常用拦截器。



> gRPC 系列相关代码见 [Github][Github]



## 6. 参考

`https://eddycjy.com/posts/go/grpc/2018-10-10-interceptor/`

`https://github.com/grpc/grpc-go`

`https://github.com/grpc-ecosystem/go-grpc-middleware`





[Github]:https://github.com/lixd/grpc-go-example
[go-grpc-middleware]:https://github.com/grpc-ecosystem/go-grpc-middleware

