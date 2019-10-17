# gRPC Interceptor

grpc服务端提供了interceptor功能，可以在服务端接收到请求时优先对请求中的数据做一些处理后再转交给指定的服务处理并响应，功能类似middleware，很适合在这里处理验证、日志等流程。

grpc中只能添加一个拦截器(添加多个也只有第一个有效)，所以使用第三方库`go-grpc-middleware`，这个项目对interceptor进行了封装，支持多个拦截器的链式组装，对于需要多种处理的地方使用起来会更方便些。

server

```go
package main

import (
	grpc_middleware "github.com/grpc-ecosystem/go-grpc-middleware"
	"golang.org/x/net/context"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	pb "i-go/grpc/proto"
	"log"
	"net"
	"runtime/debug"
)

const (
	port = ":50051"
)

// 定义一个结构体
type helloServer struct{}

// 实现proto文件中定义的方法
func (s *helloServer) SayHello(ctx context.Context, in *pb.HelloReq) (*pb.HelloRep, error) {
	return &pb.HelloRep{Message: "Hello " + in.Name}, nil
}

func main() {
	// 监听
	lis, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer(grpc.UnaryInterceptor(grpc_middleware.ChainUnaryServer(LoggingInterceptor, RecoveryInterceptor)))
	// 注册 server
	pb.RegisterHelloServer(s, &helloServer{})
	s.Serve(lis)
}
// Interceptor
func LoggingInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	log.Printf("gRPC method: %s, %v", info.FullMethod, req)
	resp, err := handler(ctx, req)
	log.Printf("gRPC method: %s, %v", info.FullMethod, resp)
	return resp, err
}

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

