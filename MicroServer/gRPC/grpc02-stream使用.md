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

其实双向流 已经 基本退化成 tcp了，grpc 底层为我们 分包了，所以真的很方便。

经常测试流式调用比同步调用会有一定的效率提升。

项目中使用go调用Python的图像处理服务，同步调用时一次需要300ms左右，换做流式调用后平均下来一次只需要260~270ms

## 2.服务端推送流

### 2.1 ProtoBuf

```protobuf
syntax = "proto3";
package helloworld;

service ServerStreamServer {
    //  服务端推送流
    rpc ServerStream (ServerStreamReq) returns (stream ServerStreamResp) {
    }
}

message ServerStreamReq {
    string data = 1;
}

message ServerStreamResp {
    string data = 1;
}
```

### 2.2 Server

```go
package main

import (
	"fmt"
	grpc_middleware "github.com/grpc-ecosystem/go-grpc-middleware"
	log "github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	pro "i-go/grpc/proto"
	"net"
)

const ServerStreamPort = ":50053"

type serverStream struct {
}

var ServerStream = &serverStream{}

// ServerStream
/*
和客户端流相反 是服务端循环发送 然后发送完成后调用
*/
func (server *serverStream) ServerStream(req *pro.ServerStreamReq, stream pro.ServerStreamServer_ServerStreamServer) error {
	fmt.Printf("Recv Client Data %v\n", req.Data)
	for i := 0; i < 5; i++ {
		// 通过 send 方法不断推送数据
		err := stream.Send(&pro.ServerStreamResp{Data: req.Data})
		if err != nil {
			log.Error(err.Error())
			return err
		}
	}
	// ? 好像没有close方法 client也能监听到
	return nil
}

func main() {
	// 监听端口
	lis, err := net.Listen("tcp", ServerStreamPort)
	if err != nil {
		panic(err)
	}
	s := grpc.NewServer(grpc.StreamInterceptor(grpc_middleware.ChainStreamServer(GenerateInterceptor)))
	pro.RegisterServerStreamServerServer(s, &serverStream{})
	err = s.Serve(lis)
	if err != nil {
		panic(err)
	}
}

func GenerateInterceptor(srv interface{}, ss grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) error {
	log.Printf("gRPC method: %s", info.FullMethod)
	err := handler(srv, ss)
	if err != nil {
		log.Printf("gRPC err:  %v", err)
	}
	return err
}

```



### 2.3 Client

```go
package main

import (
	"context"
	"fmt"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	pro "i-go/grpc/proto"
	"i-go/utils"
	"io"
)

const ServerStreamAddress = "localhost:50053"

/*
1. 建立连接 获取client
2. 组装req参数并调用方法获取stream
3. for循环中通过stream.Recv()获取服务端推送的消息
4. err==io.EOF则表示服务端关闭stream了 退出
*/
func main() {
	// 1.建立连接
	conn, err := grpc.Dial(ServerStreamAddress, grpc.WithInsecure(), grpc.WithBlock())
	if err != nil {
		panic(err)
	}
	defer conn.Close()
	// 1.获取client
	client := pro.NewServerStreamServerClient(conn)
	// 2.组装req参数
	data := &pro.ServerStreamReq{Data: "1"}
	// 2.调用获取stream
	stream, err := client.ServerStream(context.Background(), data)
	if err != nil {
		logrus.WithFields(logrus.Fields{"Caller": utils.Caller(), "Scenes": "ClientStream Recv error"}).Error(err)
		return
	}

	// 3. for循环获取服务端推送的消息
	for {
		// 3.通过 Recv() 不断获取服务端send()推送的消息
		// 内部也是调用RecvMsg
		data, err := stream.Recv()
		if err != nil {
			// 4. err==io.EOF则表示服务端关闭stream了 退出
			if err == io.EOF {
				fmt.Println("server closed")
				break
			}
			logrus.WithFields(logrus.Fields{"Caller": utils.Caller(), "Scenes": "ClientStream Recv error"}).Error(err)
			continue
		}
		fmt.Printf("Recv Data:%v \n",data)
	}
}

```

### 2.4 运行

```go
先启动服务端再运行客户端
`客户端` 输出如下

data:"count:0 client data: 1" 
data:"count:1 client data: 1" 
data:"count:2 client data: 1" 
data:"count:3 client data: 1" 
data:"count:4 client data: 1" 
data:"count:5 client data: 1" 
data:"count:6 client data: 1" 
data:"count:7 client data: 1" 
data:"count:8 client data: 1" 
data:"count:9 client data: 1" 
data:"count:10 client data: 1" 
data:"count:11 client data: 1" 
data:"count:12 client data: 1" 
data:"count:13 client data: 1" 
data:"count:14 client data: 1" 
data:"count:15 client data: 1" 
data:"count:16 client data: 1" 
data:"count:17 client data: 1" 
data:"count:18 client data: 1" 
data:"count:19 client data: 1" 
time="2019-07-08T16:57:21+08:00" level=info msg=EOF // 这里服务端推送结束
```

## 3. 客户端推送流

### 3.1 ProtoBuf

```protobuf
syntax = "proto3";
package helloworld;

service ClientStreamServer {
    // 客户端推送流
    rpc ClientStream (stream ClientStreamReq) returns (ClientStreamResp) {
    }
}

message ClientStreamReq {
    string data = 1;
}

message ClientStreamResp {
    string data = 1;
}
```



### 3.2 Server

```go
package main

import (
	"fmt"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	pro "i-go/grpc/proto"
	"i-go/utils"
	"io"
	"net"
	"strings"
)

const ClientStreamPort = ":50054"

type clientStream struct {
}

var ClientStream = &clientStream{}

// ClientStream 客户端流demo
/*
1. for循环中通过stream.Recv()不断接收client传来的数据
2. err == io.EOF表示客户端已经发送完毕关闭连接了,此时服务端需要返回消息
3. stream.SendAndClose() 发送消息并关闭连接(虽然客户端流服务器这边并不需要关闭 但是方法还是叫的这个名字)
*/
func (server *clientStream) ClientStream(stream pro.ClientStreamServer_ClientStreamServer) error {
	list := make([]string, 0)
	// 1.for循环一直接收客户端发送的消息
	for {
		// 2. 通过 Recv() 不断获取服务端send()推送的消息
		data, err := stream.Recv() // Recv内部也是调用RecvMsg
		if err != nil {
			// 3. err == io.EOF表示客户端已经发送完成且关闭stream了
			if err == io.EOF {
				fmt.Println("client closed")
				// 4.SendAndClose 返回并关闭连接
				// 内部调用SendMsg方法 由于这是客户端流 服务端只能发一次 所以没有调用close方法。
				err := stream.SendAndClose(&pro.ClientStreamResp{
					Data: strings.Join(list, ",")})
				if err != nil {
					logrus.WithFields(logrus.Fields{"Caller": utils.Caller(), "Scenes": "ClientStream send error"}).Error(err)
					return err
				}
			} else {
				logrus.WithFields(logrus.Fields{"Caller": utils.Caller(), "Scenes": "ClientStream Recv error"}).Error(err)
				return err
			}
			return nil
		}
		fmt.Printf("Recv data %v \n", data.Data)
		list = append(list, data.Data)
	}
}

func main() {
	// 监听端口
	lis, err := net.Listen("tcp", ClientStreamPort)
	if err != nil {
		panic(err)
	}
	newServer := grpc.NewServer()
	// 注册server
	pro.RegisterClientStreamServerServer(newServer, &clientStream{})
	_ = newServer.Serve(lis)
}

```



### 3.3 Client

```go
package main

import (
	"context"
	"fmt"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	pro "i-go/grpc/proto"
	"i-go/utils"
	"strconv"
)

const ClientStreamAddress = "localhost:50054"

/*
1. 建立连接并获取client
2. 通过stream.Send()循环发送消息
3. 发送完成后通过stream.CloseAndRecv() 关闭steam并接收服务端返回结果
*/
func main() {
	// 1.建立连接
	conn, err := grpc.Dial(ClientStreamAddress, grpc.WithInsecure(), grpc.WithBlock())
	if err != nil {
		panic(err)
	}
	defer conn.Close()
	// 1. 获取client
	client := pro.NewClientStreamServerClient(conn)

	// 获取stream
	stream, err := client.ClientStream(context.Background())
	if err != nil {
		logrus.WithFields(logrus.Fields{"Caller": utils.Caller(), "Scenes": "ClientStream Get Client error"}).Error(err)
		return
	}

	for i := 0; i < 5; i++ {
		// 2.通过 send 方法不断推送数据到server
		// send方法内部调用的就是SendMsg方法
		err := stream.Send(&pro.ClientStreamReq{Data: strconv.Itoa(i)})
		if err != nil {
			logrus.WithFields(logrus.Fields{"Caller": utils.Caller(), "Scenes": "ClientStream send error"}).Error(err)
			return
		}
	}
	// 3. CloseAndRecv关闭连接并接收服务端返回结果(服务端则根据err==io.EOF来判断client是否关闭stream)
	// CloseAndRecv内部也只是调用了 CloseSend方法和RecvMsg方法
	resp, err := stream.CloseAndRecv()
	if err != nil {
		logrus.WithFields(logrus.Fields{"Caller": utils.Caller(), "Scenes": "ClientStream Recv error"}).Error(err)
		return
	}
	fmt.Printf("Recv %v \n", resp.Data)
}

```



### 3.4 运行

```go
先启动服务端再运行客户端
`服务端` 输出如下

Recv data 0 
Recv data 1 
Recv data 2 
Recv data 3 
Recv data 4 
client closed

// 这里服务端推送结束
Recv 0,1,2,3,4 
```

## 4. 双向推送流

### 4.1 ProtoBuf

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



### 4.2 Server

```go
package main

import (
	"fmt"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	pro "i-go/grpc/proto"
	"i-go/utils"
	"io"
	"net"
	"strconv"
	"sync"
	"time"
)

const AllStreamPort = ":50055"

type allStream struct {
}

var AllStream = &allStream{}

// AllStream 双向流服务端
/*
// 1. 建立连接 获取client
// 2. 调用方法获取stream
// 3. 开两个goroutine 分别用于Recv()和Send()
// 3.1 一直Recv()到err==io.EOF(即客户端关闭stream)
// 3.2 Send()则自己控制什么时候Close 服务端stream没有close 只要跳出循环就算close了。 具体见https://github.com/grpc/grpc-go/issues/444
*/
func (server *allStream) AllStream(stream pro.AllStreamServer_AllStreamServer) error {
	waitGroup := sync.WaitGroup{}

	waitGroup.Add(1)
	go func() {
		for i := 0; i < 5; i++ {
			err := stream.Send(&pro.AllStreamResp{Data: strconv.Itoa(i)})
			if err != nil {
				logrus.WithFields(logrus.Fields{"Caller": utils.Caller(), "Scenes": "AllStream Send error"}).Error(err)
				continue
			}
			time.Sleep(time.Second)
		}
		waitGroup.Done()
	}()

	waitGroup.Add(1)
	go func() {
		for {
			data, err := stream.Recv()
			if err != nil {
				if err == io.EOF {
					fmt.Println("Client Closed")
					break
				}
				logrus.WithFields(logrus.Fields{"Caller": utils.Caller(), "Scenes": "AllStream Recv error"}).Error(err)
				continue
			}
			fmt.Printf("Recv Data:%v \n", data.Data)
		}
		waitGroup.Done()
	}()

	waitGroup.Wait()

	return nil

}

func main() {
	// 监听端口
	lis, err := net.Listen("tcp", AllStreamPort)
	if err != nil {
		panic(err)
	}
	newServer := grpc.NewServer()
	// 注册server
	pro.RegisterAllStreamServerServer(newServer, &allStream{})
	err = newServer.Serve(lis)
	if err != nil {
		panic(err)
	}
}

```

### 4.3 Client

```go
package main

import (
	"context"
	"fmt"
	"github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	pro "i-go/grpc/proto"
	"i-go/utils"
	"io"
	"strconv"
	"sync"
	"time"
)

const AllStreamAddress = "localhost:50055"

/*
// 1. 建立连接 获取client
// 2. 调用方法获取stream
// 3. 开两个goroutine 分别用于Recv()和Send()
// 3.1 一直Recv()到err==io.EOF(即服务端关闭stream)
// 3.2 Send()则由自己控制
// 4. 发送完毕调用 stream.CloseSend()关闭stream 必须调用关闭 否则Server会一直尝试接收数据 一直报错...

*/
func main() {
	// 1.建立连接
	conn, err := grpc.Dial(AllStreamAddress, grpc.WithInsecure(), grpc.WithBlock())
	if err != nil {
		panic(err)
	}
	defer conn.Close()

	// 1.new client
	client := pro.NewAllStreamServerClient(conn)
	waitGroup := sync.WaitGroup{}
	// 2. 调用方法获取stream
	stream, err := client.AllStream(context.Background())
	if err != nil {
		panic(err)
	}
	// 3.开两个goroutine 分别用于Recv()和Send()
	waitGroup.Add(1)
	go func() {
		for {
			data, err := stream.Recv()
			if err != nil {
				if err == io.EOF {
					fmt.Println("Server Closed")
					break
				}
				logrus.WithFields(logrus.Fields{"Caller": utils.Caller(), "Scenes": "AllStream Recv error"}).Error(err)
				continue
			}
			fmt.Printf("Recv Data:%v \n", data.Data)
		}
		waitGroup.Done()
	}()

	waitGroup.Add(1)
	go func() {
		for i := 0; i < 5; i++ {
			err := stream.Send(&pro.AllStreamReq{Data: strconv.Itoa(i)})
			if err != nil {
				logrus.WithFields(logrus.Fields{"Caller": utils.Caller(), "Scenes": "ClientStream Recv error"}).Error(err)
			}
			time.Sleep(time.Second)
		}
		// 4. 发送完毕关闭stream
		err := stream.CloseSend()
		if err != nil {
			logrus.WithFields(logrus.Fields{"Caller": utils.Caller(), "Scenes": "ClientStream CloseSend error"}).Error(err)
		}
		waitGroup.Done()
	}()
	waitGroup.Wait()
}

```

### 4.4 运行

```go
先启动服务端再运行客户端
客户端输出如下

Recv Data:0 
Recv Data:1 
Recv Data:2 
Recv Data:3 
Recv Data:4 
Server Closed
.....

服务端输出如下

Recv Data:0 
Recv Data:1 
Recv Data:2 
Recv Data:3 
Recv Data:4 
Client Closed
....
```

## 5. 总结

* 1.每个函数都对应着 完成了 protobuf 里面的 定义。
* 2.每个函数 形参都有对应的 推送 或者 接收 对象，我们只要 不断循环 Recv(),或者 Send() 就能接收或者推送了！
* 3.当return出函数，就说明此次 推送 或者 接收 结束了，client 会 对应的 收到消息！

grpc 的 stream 和 go的协程 配合 简直完美。通过流 我们 可以更加 灵活的 实现自己的业务。如 订阅，大数据传输等。

**Client发送完成后需要手动调用Close()方法关闭stream，Server端则退出循环就会自动Close()**

## 6. 参考

`https://blog.csdn.net/weixin_34219944/article/details/87456847`

`https://blog.csdn.net/m0_37595562/article/details/80784101`

