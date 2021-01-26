---
title: "gRPC系列(三)---Stream 推送流"
description: "gRPC stream 推送流使用教程"
date: 2020-12-20 22:00:00
draft: false
tags: ["gRPC"]
categories: ["gRPC"]
---

本文主要讲述了 gRPC 中的四种类型的方法使用，包括普通的 Unary API 和三种 Stream API：`ServerStreaming`、`ClientStreaming`、`BidirectionalStreaming`。

<!--more-->

## 1. 概述

gRPC 中的 Service API 有如下4种类型：

* 1）UnaryAPI：普通一元方法
* 2）ServerStreaming：服务端推送流
* 3）ClientStreaming：客户端推送流
* 4）BidirectionalStreaming：双向推送流

Unary API 就是普通的 RPC 调用，例如之前的 HelloWorld 就是一个 Unary API，本文主要讲解 Stream API。

Stream  顾名思义就是一种流，可以源源不断的推送数据，很适合大数据传输，或者服务端和客户端长时间数据交互的场景。Stream API 和 Unary API 相比，因为省掉了中间每次建立连接的花费，所以效率上会提升一些。

> gRPC 系列相关代码见 [Github][Git]



## 2. proto 文件定义

`echo.proto`文件定义如下：

```protobuf
syntax = "proto3";

option go_package = "github.com/lixd/grpc-go-example/features/proto/echo";

package echo;


// Echo 服务，包含了4种类型API
service Echo {
  // UnaryAPI
  rpc UnaryEcho(EchoRequest) returns (EchoResponse) {}
  // SServerStreaming
  rpc ServerStreamingEcho(EchoRequest) returns (stream EchoResponse) {}
  // ClientStreamingE
  rpc ClientStreamingEcho(stream EchoRequest) returns (EchoResponse) {}
  // BidirectionalStreaming
  rpc BidirectionalStreamingEcho(stream EchoRequest) returns (stream EchoResponse) {}
}

message EchoRequest {
  string message = 1;
}

message EchoResponse {
  string message = 1;
}
```

**编译**

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/proto/echo$ protoc --go_out=. --go_opt=paths=source_relative \
--go-grpc_out=. --go-grpc_opt=paths=source_relative \
./echo.proto
```



## 3. UnaryAPI

比较简单，没有需要特别注意的地方。

### Server

```go
type Echo struct {
	pb.UnimplementedEchoServer
}

// UnaryEcho 一个普通的UnaryAPI
func (e *Echo) UnaryEcho(ctx context.Context, req *pb.EchoRequest) (*pb.EchoResponse, error) {
	log.Printf("Recved: %v", req.GetMessage())
	resp := &pb.EchoResponse{Message: req.GetMessage()}
	return resp, nil
}
```

### Client

```go
func main() {
	// 1.建立连接 获取client
	conn, err := grpc.Dial(address, grpc.WithInsecure(), grpc.WithBlock())
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()
	client := pb.NewEchoClient(conn)
	// 2.执行各个Stream的对应方法
	unary(client)
}
func unary(client pb.EchoClient) {
	resp, err := client.UnaryEcho(context.Background(), &pb.EchoRequest{Message: "hello world"})
	if err != nil {
		log.Printf("send error:%v\n", err)
	}
	fmt.Printf("Recved:%v \n", resp.GetMessage())
}
```

### Test

Server

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/stream/server$ go run main.go 
2021/01/23 19:00:30 Serving gRPC on 0.0.0.0:50051
2021/01/23 19:00:36 Recved: hello world
```

Client

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/stream/client$ go run main.go 
Recved:hello world
```



## 4. ServerStream

服务端流：服务端可以发送多个数据给客户端。

> 使用场景: 例如图片处理的时候，客户端提供一张原图，服务端依次返回多个处理后的图片。

### Server

注意点：可以多次调用 stream.Send() 来返回多个数据。

```go
//  ServerStreamingEcho 客户端发送一个请求 服务端以流的形式循环发送多个响应
/*
1. 获取客户端请求参数
2. 处理完成后返回过个响应
3. 最后返回nil表示已经完成响应
*/
func (e *Echo) ServerStreamingEcho(req *pb.EchoRequest, stream pb.Echo_ServerStreamingEchoServer) error {
	log.Printf("Recved %v", req.GetMessage())
    // 具体返回多少个response根据业务逻辑调整
	for i := 0; i < 2; i++ {
		// 通过 send 方法不断推送数据
		err := stream.Send(&pb.EchoResponse{Message: req.GetMessage()})
		if err != nil {
			log.Fatalf("Send error:%v", err)
			return err
		}
	}
	// 返回nil表示已经完成响应
	return nil
}
```



### Client

注意点：调用方法获取到的不是单纯的响应，而是一个 stream。通过 stream.Recv() 接收服务端的多个返回值。

```go
/*
1. 建立连接 获取client
2. 通过 client 获取stream
3. for循环中通过stream.Recv()依次获取服务端推送的消息
4. err==io.EOF则表示服务端关闭stream了
*/
func serverStream(client pb.EchoClient) {
	// 2.调用获取stream
	stream, err := client.ServerStreamingEcho(context.Background(), &pb.EchoRequest{Message: "Hello World"})
	if err != nil {
		log.Fatalf("could not echo: %v", err)
	}

	// 3. for循环获取服务端推送的消息
	for {
		// 通过 Recv() 不断获取服务端send()推送的消息
		resp, err := stream.Recv()
		// 4. err==io.EOF则表示服务端关闭stream了 退出
		if err == io.EOF {
			log.Println("server closed")
			break
		}
		if err != nil {
			log.Printf("Recv error:%v", err)
			continue
		}
		log.Printf("Recv data:%v", resp.GetMessage())
	}
}
```



### Test

Server

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/stream/server$ go run main.go 
2021/01/23 19:06:18 Serving gRPC on 0.0.0.0:50051
2021/01/23 19:06:27 Recved Hello World
```

Client

```go
lixd@17x:~/17x/projects/grpc-go-example/features/stream/client$ go run main.go 
2021/01/23 19:06:27 Recv data:Hello World
2021/01/23 19:06:27 Recv data:Hello World
2021/01/23 19:06:27 server closed
```



## 5. ClientStream

和 ServerStream 相反，客户端可以发送多个数据。

### Server

注意点：循环调用 stream.Recv() 获取数据，err == io.EOF 则表示数据已经全部获取了，最后通过 stream.SendAndClose() 返回响应。

```go
// ClientStreamingEcho 客户端流
/*
1. for循环中通过stream.Recv()不断接收client传来的数据
2. err == io.EOF表示客户端已经发送完毕关闭连接了,此时在等待服务端处理完并返回消息
3. stream.SendAndClose() 发送消息并关闭连接(虽然在客户端流里服务器这边并不需要关闭 但是方法还是叫的这个名字，内部也只会调用Send())
*/
func (e *Echo) ClientStreamingEcho(stream pb.Echo_ClientStreamingEchoServer) error {
	// 1.for循环接收客户端发送的消息
	for {
		// 2. 通过 Recv() 不断获取客户端 send()推送的消息
		req, err := stream.Recv() // Recv内部也是调用RecvMsg
		// 3. err == io.EOF表示已经获取全部数据
		if err == io.EOF {
			log.Println("client closed")
			// 4.SendAndClose 返回并关闭连接
			// 在客户端发送完毕后服务端即可返回响应
			return stream.SendAndClose(&pb.EchoResponse{Message: "ok"})
		}
		if err != nil {
			return err
		}
		log.Printf("Recved %v", req.GetMessage())
	}
}
```



### Client

注意点：通过多次调用 stream.Send() 像服务端推送多个数据，最后调用 stream.CloseAndRecv() 关闭stream并接收服务端响应。

```go
// clientStream 客户端流
/*
1. 建立连接并获取client
2. 获取 stream 并通过 Send 方法不断推送数据到服务端
3. 发送完成后通过stream.CloseAndRecv() 关闭steam并接收服务端返回结果
*/
func clientStream(client pb.EchoClient) {
	// 2.获取 stream 并通过 Send 方法不断推送数据到服务端
	stream, err := client.ClientStreamingEcho(context.Background())
	if err != nil {
		log.Fatalf("Sum() error: %v", err)
	}
	for i := int64(0); i < 2; i++ {
		err := stream.Send(&pb.EchoRequest{Message: "hello world"})
		if err != nil {
			log.Printf("send error: %v", err)
			continue
		}
	}

	// 3. 发送完成后通过stream.CloseAndRecv() 关闭steam并接收服务端返回结果
	// (服务端则根据err==io.EOF来判断client是否关闭stream)
	resp, err := stream.CloseAndRecv()
	if err != nil {
		log.Fatalf("CloseAndRecv() error: %v", err)
	}
	log.Printf("sum: %v", resp.GetMessage())

}
```



### Test

Server

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/stream/server$ go run main.go 
2021/01/23 19:10:34 Serving gRPC on 0.0.0.0:50051
2021/01/23 19:10:42 Recved hello world
2021/01/23 19:10:42 Recved hello world
2021/01/23 19:10:42 client closed
```

Cliet

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/stream/client$ go run main.go 
2021/01/23 19:10:42 sum: ok
```



## 6. BidirectionalStream

双向推送流则可以看做是结合了 ServerStream 和 ClientStream 二者。客户端和服务端都可以向对方推送多个数据。

> 注意：服务端和客户端的这两个Stream 是独立的。

### Server

注意点：一般是使用两个 Goroutine，一个接收数据，一个推送数据。最后通过  return nil 表示已经完成响应。

```go
// BidirectionalStreamingEcho 双向流服务端
/*
// 1. 建立连接 获取client
// 2. 通过client调用方法获取stream
// 3. 开两个goroutine（使用 chan 传递数据） 分别用于Recv()和Send()
// 3.1 一直Recv()到err==io.EOF(即客户端关闭stream)
// 3.2 Send()则自己控制什么时候Close 服务端stream没有close 只要跳出循环就算close了。 具体见https://github.com/grpc/grpc-go/issues/444
*/
func (e *Echo) BidirectionalStreamingEcho(stream pb.Echo_BidirectionalStreamingEchoServer) error {
	var (
		waitGroup sync.WaitGroup
		msgCh     = make(chan string)
	)
	waitGroup.Add(1)
	go func() {
		defer waitGroup.Done()

		for v := range msgCh {
			err := stream.Send(&pb.EchoResponse{Message: v})
			if err != nil {
				fmt.Println("Send error:", err)
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
				log.Fatalf("recv error:%v", err)
			}
			fmt.Printf("Recved :%v \n", req.GetMessage())
			msgCh <- req.GetMessage()
		}
		close(msgCh)
	}()
	waitGroup.Wait()

	// 返回nil表示已经完成响应
	return nil
}
```



### Client

注意点：和服务端类似，不过客户端推送结束后需要主动调用 stream.CloseSend() 函数来关闭Stream。

```go
// bidirectionalStream 双向流
/*
1. 建立连接 获取client
2. 通过client获取stream
3. 开两个goroutine 分别用于Recv()和Send()
	3.1 一直Recv()到err==io.EOF(即服务端关闭stream)
	3.2 Send()则由自己控制
4. 发送完毕调用 stream.CloseSend()关闭stream 必须调用关闭 否则Server会一直尝试接收数据 一直报错...
*/
func bidirectionalStream(client pb.EchoClient) {
	var wg sync.WaitGroup
	// 2. 调用方法获取stream
	stream, err := client.BidirectionalStreamingEcho(context.Background())
	if err != nil {
		panic(err)
	}
	// 3.开两个goroutine 分别用于Recv()和Send()
	wg.Add(1)
	go func() {
		defer wg.Done()
		for {
			req, err := stream.Recv()
			if err == io.EOF {
				fmt.Println("Server Closed")
				break
			}
			if err != nil {
				continue
			}
			fmt.Printf("Recv Data:%v \n", req.GetMessage())
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()

		for i := 0; i < 2; i++ {
			err := stream.Send(&pb.EchoRequest{Message: "hello world"})
			if err != nil {
				log.Printf("send error:%v\n", err)
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



### Test

Server

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/stream/server$ go run main.go 
2021/01/23 19:14:56 Serving gRPC on 0.0.0.0:50051
Recved :hello world 
Recved :hello world 
```

Client

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/stream/client$ go run main.go 
Recved:hello world 
Recved:hello world 
Server Closed
```



## 7. 小结

客户端或者服务端都有对应的 `推送 `或者 `接收`对象，我们只要 不断循环 Recv(),或者 Send() 就能接收或者推送了！

> gRPC Stream 和 goroutine 配合简直完美。通过 Stream 我们可以更加灵活的实现自己的业务。如 订阅，大数据传输等。

**Client发送完成后需要手动调用Close()或者CloseSend()方法关闭stream，Server端则`return nil`就会自动 Close**。



**1）ServerStream**

* 服务端处理完成后`return nil`代表响应完成
* 客户端通过 `err == io.EOF`判断服务端是否响应完成

**2）ClientStream**

* 客户端发送完毕通过`CloseAndRecv关闭stream 并接收服务端响应
* 服务端通过 `err == io.EOF`判断客户端是否发送完毕，完毕后使用`SendAndClose`关闭 stream并返回响应。

**3）BidirectionalStream**

* 客户端服务端都通过stream向对方推送数据
* 客户端推送完成后通过`CloseSend关闭流，通过`err == io.EOF`判断服务端是否响应完成
* 服务端通过`err == io.EOF`判断客户端是否响应完成,通过`return nil`表示已经完成响应



通过`err == io.EOF`来判定是否把对方推送的数据全部获取到了。

客户端通过`CloseAndRecv`或者`CloseSend`关闭 Stream，服务端则通过`SendAndClose`或者直接 `return nil`来返回响应。



> gRPC 系列相关代码见 [Github][Git]

## 8. 参考

`https://grpc.io/docs/languages/go/basics/#server-side-streaming-rpc`

`https://github.com/grpc/grpc-go`



[Git]:https://github.com/lixd/grpc-go-example

