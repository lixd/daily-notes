# gRPC Interceptor

## 1. 概述

grpc服务端提供了interceptor功能，可以在服务端接收到请求时优先对请求中的数据做一些处理后再转交给指定的服务处理并响应，功能类似middleware，很适合在这里处理验证、日志等流程。

grpc中只能添加一个拦截器(添加多个也只有第一个有效)，所以使用第三方库`go-grpc-middleware`，这个项目对interceptor进行了封装，支持多个拦截器的链式组装，对于需要多种处理的地方使用起来会更方便些。

在 gRPC 中，大类可分为两种 RPC 方法，与拦截器的对应关系是：

- 普通方法：一元拦截器（grpc.UnaryInterceptor）
- 流方法：流拦截器（grpc.StreamInterceptor）

## 2. interceptor定义

### grpc.UnaryInterceptor

```go
func UnaryInterceptor(i UnaryServerInterceptor) ServerOption {
	return func(o *options) {
		if o.unaryInt != nil {
			panic("The unary server interceptor was already set and may not be reset.")
		}
		o.unaryInt = i
	}
}
```

函数原型

```go
type UnaryServerInterceptor func(ctx context.Context, req interface{}, info *UnaryServerInfo, handler UnaryHandler) (resp interface{}, err error)
```

通过查看源码可得知，要完成一个拦截器需要实现 `UnaryServerInterceptor` 方法。形参如下：

- ctx context.Context：请求上下文
- req interface{}：RPC 方法的请求参数
- info *UnaryServerInfo：RPC 方法的所有信息
- handler UnaryHandler：RPC 方法本身

### grpc.StreamInterceptor

```go
func StreamInterceptor(i StreamServerInterceptor) ServerOption
```

 函数原型： 

```go
type StreamServerInterceptor func(srv interface{}, ss ServerStream, info *StreamServerInfo, handler StreamHandler) error
```

### 3. 多个拦截器

  gRPC 本身居然只能设置一个拦截器，需要采用第三方库`go-grpc-middleware`，这个项目对interceptor进行了封装，支持多个拦截器的链式组装，对于需要多种处理的地方使用起来会更方便些。

就像这样：

```go
import "github.com/grpc-ecosystem/go-grpc-middleware"

myServer := grpc.NewServer(
    grpc.StreamInterceptor(grpc_middleware.ChainStreamServer(
        ...
    )),
    grpc.UnaryInterceptor(grpc_middleware.ChainUnaryServer(
       ...
    )),
)
```



### 4. 具体interceptor

```go
// LoggingInterceptor RPC 方法的入参出参的日志输出
func LoggingInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	logrus.Printf("gRPC before: %s, %v", info.FullMethod, req)
	resp, err := handler(ctx, req)
	logrus.Printf("gRPC after: %s, %v", info.FullMethod, resp)
	return resp, err
}
 
// RecoveryInterceptor RPC 方法的异常保护和日志输出
func RecoveryInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp interface{}, err error) {
	defer func() {
		if e := recover(); e != nil {
			debug.PrintStack()
			err = status.Errorf(codes.Internal, "Panic err: %v", e)
		}
	}()

	return handler(ctx, req)
}
```



## 3. 使用

使用第三方库`go-grpc-middleware`进行链式组装。

只需要在NewServer的时候指定interceptor即可。

```go

func main() {
	// RPC
	// 监听
	lis, err := net.Listen("tcp", port)
	if err != nil {
		panic(err)
	}
	// 构建Server的时候传入指定的interceptor
	s := grpc.NewServer(grpc.UnaryInterceptor(grpc_middleware.ChainUnaryServer(LoggingInterceptor, RecoveryInterceptor)))
	// 注册 server
	proto.RegisterHelloServer(s, &helloServer{})
	err = s.Serve(lis)
	if err != nil {
		panic(err)
	}
}

```

重点是这句

```go
// 构建Server的时候传入指定的interceptor	
s := grpc.NewServer(grpc.UnaryInterceptor(grpc_middleware.ChainUnaryServer(LoggingInterceptor, RecoveryInterceptor)))
```

