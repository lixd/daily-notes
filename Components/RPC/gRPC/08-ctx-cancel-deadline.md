---
title: "gRPC系列(八)---使用context进行超时控制"
description: "使用context进行超时控制"
date: 2021-01-29 22:00:00
draft: false
tags: ["gRPC"]
categories: ["gRPC"]
---

本文主要记录了如何使用 context 为 RPC 请求设置超时时间，或者通过 cancel 手动取消本次请求。

<!--more-->



## 1. 概述

> gRPC 系列相关代码见 [Github][Github]

通过 ctx 完成 cancel 和 deadline 功能。

Go 语言中可以通过 ctx 来控制各个 Goroutine，调用 cancel 函数，则该 ctx 上的各个子 Goroutine 都会被一并取消。

gRPC 中同样实现了该功能，在调用方法的时候可以传入 ctx 参数。

> gRPC 会通过 HTTP2 HEADERS Frame 来传递相关信息。



## 2. deadline

gRPC 提倡**TL;DR: Always set a deadline**

Deadlines 允许gRPC 客户端设置自己等待多长时间来完成 RPC 操作，直到出现这个错误 `DEADLINE_EXCEEDED`。但是在正常情况下默认设置是一个很大的数值。

如果不设置截止日期时，如果出现阻塞，那么所有的请求可能在最大请求时间过后才超时，最终可能导致资源被耗尽。

> 由于类似的问题，在高并发的时候导致了一次事故，具体看[数据库连接池该设置多大?记一次由连接池引发的事故](https://www.lixueduan.com/post/redis/db-connection-pool-settings/)

### Server

如果客户端传来的消息时 delay 则 sleep 两秒，如果是带`[propagate me]`前缀的消息则由服务端在延迟 800ms 后发起一次 RPC 调用。

```go
func (s *server) UnaryEcho(ctx context.Context, req *pb.EchoRequest) (*pb.EchoResponse, error) {
	message := req.Message
	if strings.HasPrefix(message, "[propagate me]") {
		time.Sleep(800 * time.Millisecond)
		message = strings.TrimPrefix(message, "[propagate me]")
		return s.client.UnaryEcho(ctx, &pb.EchoRequest{Message: message})
	}

	if message == "delay" {
		time.Sleep(2 * time.Second)
	}

	return &pb.EchoResponse{Message: req.Message}, nil
}

func (s *server) BidirectionalStreamingEcho(stream pb.Echo_BidirectionalStreamingEchoServer) error {
	for {
		req, err := stream.Recv()
		if err == io.EOF {
			return status.Error(codes.InvalidArgument, "request message not received")
		}
		if err != nil {
			return err
		}

		message := req.Message
		if strings.HasPrefix(message, "[propagate me]") {
			time.Sleep(800 * time.Millisecond)
			message = strings.TrimPrefix(message, "[propagate me]")
			res, err := s.client.UnaryEcho(stream.Context(), &pb.EchoRequest{Message: message})
			if err != nil {
				return err
			}
			stream.Send(res)
		}

		if message == "delay" {
			time.Sleep(2 * time.Second)
		}
		stream.Send(&pb.EchoResponse{Message: message})
	}
}
```



### Client

客户端则是为每次 RPC 调用都指定超时时间为 1秒。

```go
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"time"

	pb "github.com/lixd/grpc-go-example/features/proto/echo"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"

	"google.golang.org/grpc/status"
)

var addr = flag.String("addr", "localhost:50051", "the address to connect to")

func unaryCall(c pb.EchoClient, requestID int, message string, want codes.Code) {
	// 每次都指定1秒超时
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	req := &pb.EchoRequest{Message: message}

	_, err := c.UnaryEcho(ctx, req)
	got := status.Code(err)
	fmt.Printf("[%v] wanted = %v, got = %v\n", requestID, want, got)
}

func streamingCall(c pb.EchoClient, requestID int, message string, want codes.Code) {
	// 每次都指定1秒超时
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	stream, err := c.BidirectionalStreamingEcho(ctx)
	if err != nil {
		log.Printf("Stream err: %v", err)
		return
	}

	err = stream.Send(&pb.EchoRequest{Message: message})
	if err != nil {
		log.Printf("Send error: %v", err)
		return
	}

	_, err = stream.Recv()

	got := status.Code(err)
	fmt.Printf("[%v] wanted = %v, got = %v\n", requestID, want, got)
}

func main() {
	flag.Parse()

	conn, err := grpc.Dial(*addr, grpc.WithInsecure(), grpc.WithBlock())
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()

	c := pb.NewEchoClient(conn)

	unaryCall(c, 1, "world", codes.OK)
	unaryCall(c, 2, "delay", codes.DeadlineExceeded)
	unaryCall(c, 3, "[propagate me]world", codes.OK)
	unaryCall(c, 4, "[propagate me][propagate me]world", codes.DeadlineExceeded)
	streamingCall(c, 5, "[propagate me]world", codes.OK)
	streamingCall(c, 6, "[propagate me][propagate me]world", codes.DeadlineExceeded)
}
```



### Run

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/deadline/server$ go run main.go 
server listening at port [::]:50051
```

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/deadline/client$ go run main.go 
[1] wanted = OK, got = OK
[2] wanted = DeadlineExceeded, got = DeadlineExceeded
[3] wanted = OK, got = OK
[4] wanted = DeadlineExceeded, got = DeadlineExceeded
[5] wanted = OK, got = OK
[6] wanted = DeadlineExceeded, got = DeadlineExceeded
```

其中请求 2 是传递的 delay 消息服务端会 sleep 两秒，所以触发 deadline，请求4和6 由于有两个`[propagate me]`前缀，所以会传递两轮，每次 sleep 800ms，再第二轮的时候也会触发 deadline。

请求1为正常请求，请求3和5只传递一轮，只 sleep 800ms 所以没有触发 deadline。



## 3. cancel

除了等待 deadline 超时之外，客户端还可以主动调用 cancel 取消本次请求。

> 比如在某次调用中，客户端某个环节报错导致本次请求已经可以直接返回了，这时候在等待服务端返回已经没有意义了。此时就可以直接调用 cancel 取消本次请求，而不是让服务端一直等待到超时才返回。

### Server

```go
package main

import (
	"flag"
	"fmt"
	"io"
	"log"
	"net"

	pb "github.com/lixd/grpc-go-example/features/proto/echo"
	"google.golang.org/grpc"
)

var port = flag.Int("port", 50051, "the port to serve on")

type server struct {
	pb.UnimplementedEchoServer
}

func (s *server) BidirectionalStreamingEcho(stream pb.Echo_BidirectionalStreamingEchoServer) error {
	for {
		in, err := stream.Recv()
		if err != nil {
			fmt.Printf("server: error receiving from stream: %v\n", err)
			if err == io.EOF {
				return nil
			}
			return err
		}
		fmt.Printf("echoing message %q\n", in.Message)
		stream.Send(&pb.EchoResponse{Message: in.Message})
	}
}

func main() {
	flag.Parse()

	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", *port))
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	fmt.Printf("server listening at port %v\n", lis.Addr())
	s := grpc.NewServer()
	pb.RegisterEchoServer(s, &server{})
	s.Serve(lis)
}
```



### Client

```go
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"time"

	pb "github.com/lixd/grpc-go-example/features/proto/echo"
	"google.golang.org/grpc"
)

var addr = flag.String("addr", "localhost:50051", "the address to connect to")

func sendMessage(stream pb.Echo_BidirectionalStreamingEchoClient, msg string) error {
	fmt.Printf("sending message %q\n", msg)
	return stream.Send(&pb.EchoRequest{Message: msg})
}

func recvMessage(stream pb.Echo_BidirectionalStreamingEchoClient) {
	res, err := stream.Recv()
	if err != nil {
		fmt.Printf("stream.Recv() returned error %v\n", err)
		return
	}
	fmt.Printf("received message %q\n", res.GetMessage())
}

func main() {
	flag.Parse()

	// 建立连接
	conn, err := grpc.Dial(*addr, grpc.WithInsecure())
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()

	c := pb.NewEchoClient(conn)

	// 初始化一个带取消功能的ctx
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	stream, err := c.BidirectionalStreamingEcho(ctx)
	if err != nil {
		log.Fatalf("error creating stream: %v", err)
	}

	// 正常发送消息
	if err := sendMessage(stream, "hello"); err != nil {
		log.Fatalf("error sending on stream: %v", err)
	}
	if err := sendMessage(stream, "world"); err != nil {
		log.Fatalf("error sending on stream: %v", err)
	}

	// 正常接收消息
	recvMessage(stream)
	recvMessage(stream)
	// 这里调用cancel方法取消 ctx
	fmt.Println("cancelling context")
	cancel()

	// 再次发送消息 这里是否会报错取决于ctx是否检测到前面发送的取消命令(cancel())
	if err := sendMessage(stream, "world"); err != nil {
		log.Printf("error sending on stream: %v", err)
	}

	// 这里一定会报错
	recvMessage(stream)
}
```

## 4. 小结

不管是 cancel 和 deadline 都只需调用方传递对应的 ctx 即可。gRPC 中已经做了对应的实现，所以使用起来和在 Goroutine 中传递 ctx 没有太大的区别。

ctx 可以使用`context.WithDeadline()`或者`context.WithTimeout()`,二者效果类似，只是传递的参数不一样。

> timeout 只能设置在某一段时间后超时，比如3秒后超时，deadline 则可以设置到具体某个时间点，比如在8点10分20秒的时候返回。类似于 Redis 中的 Expire 和 ExpireAt。

> gRPC 系列相关代码见 [Github][Github]



## 5. 参考

`https://github.com/grpc/grpc-go`

`https://blog.csdn.net/u014229282/article/details/109294837`

`https://grpc.io/blog/deadlines/`





[Github]: https://github.com/lixd/grpc-go-example