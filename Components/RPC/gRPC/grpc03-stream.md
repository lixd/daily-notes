# gRPC Stream

## 1. 概述

srteam 顾名思义 就是 一种 流，可以源源不断的 推送 数据，很适合 传输一些大数据，或者 服务端 和 客户端 长时间 数据交互，比如 客户端 可以向 服务端 订阅 一个数据，服务端 就 可以利用 stream ，源源不断地 推送数据。

stream的种类:

```protobuf
// 客户端推送 服务端 
rpc GetStream (StreamReqData) returns (stream StreamResData){}
// 服务端推送 客户端 
rpc PutStream (stream StreamReqData) returns (StreamResData){}
// 客户端与 服务端 互相 推送 
rpc AllStream (stream StreamReqData) returns (stream StreamResData){}
```

其实双向流 已经 基本退化成 TCP 了，gRPC底层为我们 分包了，所以真的很方便。

经常测试流式调用比同步调用会有一定的效率提升。

项目中使用 Go 调用 Python 的图像处理服务，同步调用时一次需要 300ms 左右，换做流式调用后平均下来一次只需要 260~270ms。

> 省掉了中间每次建立连接的花费，所以效率上会提升一些。

> gRPC 系列所有代码都在这个 [Git仓库](https://github.com/lixd/i-go/tree/master/grpc)

## 2.服务端推送流

### 2.1 server_stream.proto

```protobuf
syntax = "proto3";
option go_package = ".;proto";
package stream;

//  服务端推送流
service ServerStream {
  // 客户端传入一个数,服务端分别返回该数的0到9次方
  rpc Pow (ServerStreamReq) returns (stream ServerStreamResp) {
  }
}

message ServerStreamReq {
  int64 number = 1;
}

message ServerStreamResp {
  int64 number = 1;
}
```

编译

```sh
protoc --proto_path=./proto \
        --go_out=./proto --go_opt=paths=source_relative \
        --go-grpc_out=./proto --go-grpc_opt=paths=source_relative \
        ./proto/server_stream.proto
```



### 2.2 server_stram_server.go

```go
package main

import (
	"log"
	"math"
	"net"

	"google.golang.org/grpc"
	pb "i-go/grpc/stream/proto"
)

type serverStream struct {
	pb.UnimplementedServerStreamServer
}

// Pow ServerStreamDemo 客户端发送一个请求 服务端以流的形式循环发送多个响应
/*
1. 获取客户端请求参数
2. 循环处理并返回多个响应
3. 返回nil表示已经完成响应
*/
func (server *serverStream) Pow(req *pb.ServerStreamReq, stream pb.ServerStream_PowServer) error {
	log.Printf("Recv Client Data %v", req.Number)
	for i := 0; i < 10; i++ {
		// 通过 send 方法不断推送数据
		pow := int64(math.Pow(float64(req.Number), float64(i)))
		err := stream.Send(&pb.ServerStreamResp{Number: pow})
		if err != nil {
			log.Fatalf("Send error:%v", err)
			return err
		}
	}
	// 返回nil表示已经完成响应
	return nil
}

func main() {
	lis, err := net.Listen("tcp", ":8082")
	if err != nil {
		panic(err)
	}
	s := grpc.NewServer()
	pb.RegisterServerStreamServer(s, &serverStream{})
	log.Println("Serving gRPC on 0.0.0.0:8082")
	if err = s.Serve(lis); err != nil {
		panic(err)
	}
}
```



### 2.3 server_stream_client.go

```go
package main

import (
	"context"
	"io"
	"log"

	"google.golang.org/grpc"
	pb "i-go/grpc/stream/proto"
)

/*
1. 建立连接 获取client
2. 调用方法获取stream
3. for循环中通过stream.Recv()获取服务端推送的消息
4. err==io.EOF则表示服务端关闭stream了
*/
func main() {
	// 1.建立连接 获取client
	conn, err := grpc.DialContext(context.Background(), "0.0.0.0:8082", grpc.WithInsecure(), grpc.WithBlock())
	if err != nil {
		panic(err)
	}
	defer conn.Close()
	client := pb.NewServerStreamClient(conn)
	// 2.调用获取stream
	stream, err := client.Pow(context.Background(), &pb.ServerStreamReq{Number: 2})
	if err != nil {
		log.Fatalf("Pow error:%v", err)
		return
	}

	// 3. for循环获取服务端推送的消息
	for {
		// 3.通过 Recv() 不断获取服务端send()推送的消息
		resp, err := stream.Recv()
		// 4. err==io.EOF则表示服务端关闭stream了 退出
		if err == io.EOF {
			log.Fatal("server closed")
			return
		}
		if err != nil {
			log.Printf("Recv error:%v", err)
			continue
		}
		log.Printf("Recv data:%v", resp.Number)
	}
}
```

### 2.4 run

启动服务端

```sh
$ go run server_stram_server.go
2020/12/17 22:06:14 Serving gRPC on 0.0.0.0:8082
```

启动客户端

```sh
$ go run server_stream_client.go
2020/12/17 22:10:19 Recv data:1
2020/12/17 22:10:19 Recv data:2
2020/12/17 22:10:19 Recv data:4
2020/12/17 22:10:19 Recv data:8
2020/12/17 22:10:19 Recv data:16
2020/12/17 22:10:19 Recv data:32
2020/12/17 22:10:19 Recv data:64
2020/12/17 22:10:19 Recv data:128
2020/12/17 22:10:19 Recv data:256
2020/12/17 22:10:19 Recv data:512
2020/12/17 22:10:19 server closed
```

服务端输出

```sh
Recv Client Data 2
```





## 3. 客户端推送流

### 3.1 client_stream.proto

```protobuf
syntax = "proto3";
option go_package = ".;proto";
package stream;

// 客户端推送流
service ClientStream {
  // 客户端推送多个整数到服务端,服务端返回这些数之和
  rpc Sum (stream ClientStreamReq) returns (ClientStreamResp) {
  }
}

message ClientStreamReq {
  int64 data = 1;
}

message ClientStreamResp {
  int64 sum = 1;
}
```

编译

```sh
protoc --proto_path=./proto \
        --go_out=./proto --go_opt=paths=source_relative \
        --go-grpc_out=./proto --go-grpc_opt=paths=source_relative \
        ./proto/client_stream.proto
```



### 3.2 client_stram_server.go

```go
package main

import (
	"io"
	"log"
	"net"

	"google.golang.org/grpc"
	pb "i-go/grpc/stream/proto"
)

type clientStream struct {
	pb.UnimplementedClientStreamServer
}

// ClientStream 客户端流demo
/*
1. for循环中通过stream.Recv()不断接收client传来的数据
2. err == io.EOF表示客户端已经发送完毕关闭连接了,此时在等待服务端处理完并返回消息
3. stream.SendAndClose() 发送消息并关闭连接(虽然客户端流服务器这边并不需要关闭 但是方法还是叫的这个名字)
*/
func (c *clientStream) Sum(stream pb.ClientStream_SumServer) error {
	var sum int64
	// 1.for循环接收客户端发送的消息
	for {
		// 2. 通过 Recv() 不断获取客户端 send()推送的消息
		req, err := stream.Recv() // Recv内部也是调用RecvMsg
		// 3. err == io.EOF表示客户端已经发送完成且关闭stream了
		if err == io.EOF {
			log.Println("client closed")
			// 4.SendAndClose 返回并关闭连接
			// 在客户端发送完毕后服务端即可返回响应
			err := stream.SendAndClose(&pb.ClientStreamResp{Sum: sum})
			if err != nil {
				log.Fatalf("SendAndClose error:%v", err)
				return err
			}
			return nil
		}
		if err != nil {
			return err
		}
		// 累加求和
		log.Printf("Recved %v", req.Number)
		sum += req.Number
	}
}

func main() {
	lis, err := net.Listen("tcp", ":8081")
	if err != nil {
		panic(err)
	}
	server := grpc.NewServer()
	pb.RegisterClientStreamServer(server, &clientStream{})
	log.Println("Serving gRPC on 0.0.0.0:8081")
	if err := server.Serve(lis); err != nil {
		panic(err)
	}
}
```



### 3.3 client_stram_client.go

```go
package main

import (
	"context"
	"log"

	"google.golang.org/grpc"
	pb "i-go/grpc/stream/proto"
)

/*
1. 建立连接并获取client
2.获取 stream 并通过 Send 方法不断推送数据到服务端
3. 发送完成后通过stream.CloseAndRecv() 关闭steam并接收服务端返回结果
*/
func main() {
	// 1.建立连接并获取 client
	conn, err := grpc.DialContext(context.Background(), "0.0.0.0:8081", grpc.WithInsecure(), grpc.WithBlock())
	if err != nil {
		panic(err)
	}
	defer conn.Close()
	client := pb.NewClientStreamClient(conn)

	// 2.获取 stream 并通过 Send 方法不断推送数据到服务端
	stream, err := client.Sum(context.Background())
	if err != nil {
		log.Fatalf("Sum() error: %v", err)
		return
	}
	for i := int64(0); i < 10; i++ {
		err := stream.Send(&pb.ClientStreamReq{Data: i})
		if err != nil {
			log.Fatalf("Send(%v) error: %v", i, err)
		}
	}

	// 3. 发送完成后通过stream.CloseAndRecv() 关闭steam并接收服务端返回结果
	// (服务端则根据err==io.EOF来判断client是否关闭stream)
	resp, err := stream.CloseAndRecv()
	if err != nil {
		log.Fatalf("CloseAndRecv() error: %v", err)
		return
	}
	log.Printf("sum: %v", resp.Sum)
}
```



### 3.4 run

启动服务端

```sh
$ go run client_stram_server.go
2020/12/17 21:31:13 Serving gRPC on 0.0.0.0:8081
```

启动客户端

```sh
$ go run client_stream_client.go
2020/12/17 21:31:59 sum: 45
```

服务端输出

```json
2020/12/17 21:31:59 Recved 0
2020/12/17 21:31:59 Recved 1
2020/12/17 21:31:59 Recved 2
2020/12/17 21:31:59 Recved 3
2020/12/17 21:31:59 Recved 4
2020/12/17 21:31:59 Recved 5
2020/12/17 21:31:59 Recved 6
2020/12/17 21:31:59 Recved 7
2020/12/17 21:31:59 Recved 8
2020/12/17 21:31:59 Recved 9
2020/12/17 21:31:59 client closed
```



## 4. 双向推送流

### 4.1 bidirectional_stream.proto

```protobuf
syntax = "proto3";
package helloworld;

service AllStreamServer {
    // 双向推送流
    rpc AllStream (stream AllStreamReq) returns (stream AllStreamResp) {
    }
}

message AllStreamReq {
    string data = 1;
}

message AllStreamResp {
    string data = 1;
}
```



### 4.2 bidirectional_stream_server.go

```go
package main

import (
	"fmt"
	"io"
	"log"
	"math"
	"net"
	"sync"

	"google.golang.org/grpc"
	pb "i-go/grpc/stream/proto"
)

type bidirectionalStream struct {
	pb.UnimplementedBidirectionalStreamServerServer
}

// Sqrt 双向流服务端
/*
// 1. 建立连接 获取client
// 2. 调用方法获取stream
// 3. 开两个goroutine（使用 chan 传递数据） 分别用于Recv()和Send()
// 3.1 一直Recv()到err==io.EOF(即客户端关闭stream)
// 3.2 Send()则自己控制什么时候Close 服务端stream没有close 只要跳出循环就算close了。 具体见https://github.com/grpc/grpc-go/issues/444
*/
func (b *bidirectionalStream) Sqrt(stream pb.BidirectionalStreamServer_SqrtServer) error {
	var (
		waitGroup sync.WaitGroup
		numbers   = make(chan float64)
	)
	waitGroup.Add(1)
	go func() {
		defer waitGroup.Done()

		for v := range numbers {
			err := stream.Send(&pb.AllStreamResp{Sqrt: math.Sqrt(v)})
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
				log.Fatalf("Recv error:%v", err)
			}
			fmt.Printf("Recv Data:%v \n", req.Number)
			numbers <- req.Number
		}
		close(numbers)
	}()
	waitGroup.Wait()

	// 返回nil表示已经完成响应
	return nil
}

func main() {
	lis, err := net.Listen("tcp", ":8083")
	if err != nil {
		panic(err)
	}
	newServer := grpc.NewServer()
	pb.RegisterBidirectionalStreamServerServer(newServer, &bidirectionalStream{})
	log.Println("Serving gRPC on 0.0.0.0:8083")
	if err = newServer.Serve(lis); err != nil {
		panic(err)
	}
}
```

### 4.3 bidirectional_stream_client.go

```go
package main

import (
	"context"
	"fmt"
	"io"
	"log"
	"sync"
	"time"

	"google.golang.org/grpc"
	pb "i-go/grpc/stream/proto"
)

/*
1. 建立连接 获取client
2. 调用方法获取stream
3. 开两个goroutine 分别用于Recv()和Send()
	3.1 一直Recv()到err==io.EOF(即服务端关闭stream)
	3.2 Send()则由自己控制
4. 发送完毕调用 stream.CloseSend()关闭stream 必须调用关闭 否则Server会一直尝试接收数据 一直报错...

*/
func main() {
	var(
		wg  sync.WaitGroup
	)

	// 1.建立连接
	conn, err := grpc.DialContext(context.Background(), "0.0.0.0:8083", grpc.WithInsecure(), grpc.WithBlock())
	if err != nil {
		panic(err)
	}
	defer conn.Close()

	// 1.new client
	client := pb.NewBidirectionalStreamServerClient(conn)
	// 2. 调用方法获取stream
	stream, err := client.Sqrt(context.Background())
	if err != nil {
		panic(err)
	}
	// 3.开两个goroutine 分别用于Recv()和Send()
	wg.Add(1)
	go func() {
		defer wg.Done()
		for {
			data, err := stream.Recv()
			if err == io.EOF {
				fmt.Println("Server Closed")
				break
			}
			if err != nil {
				continue
			}
			fmt.Printf("Recv Data:%v \n", data.Sqrt)
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()

		for i := 0; i < 10; i++ {
			err := stream.Send(&pb.AllStreamReq{Number: float64(i)})
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

### 4.4 run

启动服务端

```sh
$ go run bidirectional_stream_server.go
2020/12/17 23:43:49 Serving gRPC on 0.0.0.0:8083
```

启动客户端

```sh
$ go run bidirectional_stream_client.go
Recv Data:0
Recv Data:1
Recv Data:1.4142135623730951
Recv Data:1.7320508075688772
Recv Data:2
Recv Data:2.23606797749979
Recv Data:2.449489742783178
Recv Data:2.6457513110645907
Recv Data:2.8284271247461903
Recv Data:3
Server Closed
```

服务端输出

```sh
Recv Data:0
Recv Data:1
Recv Data:2
Recv Data:3
Recv Data:4
Recv Data:5
Recv Data:6
Recv Data:7
Recv Data:8
Recv Data:9
```



## 5. 总结

每个函数 形参都有对应的 推送 或者 接收 对象，我们只要 不断循环 Recv(),或者 Send() 就能接收或者推送了！

> grpc 的 stream 和 go的协程 配合 简直完美。通过流 我们 可以更加 灵活的 实现自己的业务。如 订阅，大数据传输等。

**Client发送完成后需要手动调用Close()方法关闭stream，Server端则`return nil`就会自动Close()**



**1）服务端推送流**

* 服务端处理完成后`return nil`代表响应完成
* 客户端通过 `err == io.EOF`判断服务端是否响应完成

**2）客户端推送流**

* 客户端发送完毕通过`CloseAndRecv()`关闭stream 并接收服务端响应
* 服务端通过 `err == io.EOF`判断客户端是否发送完毕，完毕后使用`SendAndClose()`关闭 stream并返回响应。

**3）双向推送流**

* 客户端服务端都通过stream向对方推送数据
* 客户端推送完成后通过`CloseSend()`关闭流，通过`err == io.EOF`判断服务端是否响应完成
* 服务端通过`err == io.EOF`判断客户端是否响应完成,通过`return nil`表示已经完成响应





## 6. 参考

`https://blog.csdn.net/weixin_34219944/article/details/87456847`

`https://blog.csdn.net/m0_37595562/article/details/80784101`

