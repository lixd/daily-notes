# gRPC Stream

## 1. 概述

srteam 顾名思义 就是 一种 流，可以源源不断的 推送 数据，很适合 传输一些大数据，或者 服务端 和 客户端 长时间 数据交互，比如 客户端 可以向 服务端 订阅 一个数据，服务端 就 可以利用 stream ，源源不断地 推送数据。

stream的种类:
客户端推送 服务端 rpc GetStream (StreamReqData) returns (stream StreamResData){}
服务端推送 客户端 rpc PutStream (stream StreamReqData) returns (StreamResData){}
客户端与 服务端 互相 推送 rpc AllStream (stream StreamReqData) returns (stream StreamResData){}

其实这个流 已经 基本退化成 tcp了，grpc 底层为我们 分包了，所以真的很方便。

经常测试流式调用比同步调用会有一定的效率提升。

项目中使用go调用Python的图像处理服务，同步调用时一次需要300ms左右，换做流式调用后平均下来一次只需要260~270ms

## 2.服务端推送流

### 2.1 ProtoBuf

```protobuf
syntax = "proto3"; //声明proto的版本 只能 是3，才支持 gRPC
//声明 包名
package helloworld;

//声明gRPC服务
service ServerStreamServer {
    //  服务端推送流
    rpc ServerStream (ServerStreamReq) returns (stream ServerStreamResp) {
    }
}

//stream 请求结构
message ServerStreamReq {
    string data = 1;
}
//stream 返回结构
message ServerStreamResp {
    string data = 1;
}
```

### 2.2 Server

```go
package main

import (
	log "github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	pro "i-go/grpc/proto"
	"net"
	"strconv"
	"time"
)

const ServerStreamPort = ":50053"
type serverStream struct {
}

var ServerStream = &serverStream{}

func (server *serverStream) ServerStream(data *pro.ServerStreamReq, res pro.MyStreamServer_ServerStreamServer) error {

	for i := 0; i < 20; i++ {
		itoa := strconv.Itoa(i)
		// 通过 send 方法不断推送数据
		err := res.Send(&pro.ServerStreamResp{Data: "count:" + itoa+" client data: "+data.Data})
		if err != nil {
			log.Error(err.Error())
			return err
		}
		time.Sleep(time.Second)
	}
	return nil
}

func main() {
	// 监听端口
	lis, err := net.Listen("tcp", ServerStreamPort)
	if err != nil {
		return
	}
	newServer := grpc.NewServer()
	pro.RegisterMyStreamServerServer(newServer, &serverStream{})
	newServer.Serve(lis)
}

```



### 2.3 Client

```go
package main

import (
	"context"
	"fmt"
	log "github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	pro "i-go/grpc/proto"
	"time"
)

const ServerStreamAddress = "localhost:50053"

func main() {
	conn, err := grpc.Dial(ServerStreamAddress, grpc.WithInsecure())
	if err != nil {
		log.Error(err.Error())
		return
	}
	defer conn.Close()
	// 通过conn new 一个 client
	client := pro.NewMyStreamServerClient(conn)

	data := &pro.ServerStreamReq{Data: "1"}
	// 这里获取到的 res 是一个stream
	res, err := client.ServerStream(context.Background(), data)
	if err != nil {
		log.Error(err.Error())
		return
	}

	start := time.Now().Unix()
	for {
		// 通过 Recv() 不断获取服务端send()推送的消息
		data, err := res.Recv()
		if err != nil {
			log.Println(err)
			break
		}
		fmt.Println(data)
	}
	fmt.Printf("take time :%v", time.Now().Unix()-start)
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
syntax = "proto3"; //声明proto的版本 只能 是3，才支持 gRPC
//声明 包名
package helloworld;

//声明gRPC服务
service ClientStreamServer {
    // 客户端推送流
    rpc ClientStream (stream ClientStreamReq) returns (ClientStreamResp) {
    }
}

//stream 请求结构
message ClientStreamReq {
    string data = 1;
}
//stream 返回结构
message ClientStreamResp {
    string data = 1;
}
```



### 3.2 Server

```go
package main

import (
	"fmt"
	log "github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	pro "i-go/grpc/proto"
	"net"
)

const ClientStreamPort = ":50054"

type clientStream struct {
}

var ClientStream = &clientStream{}

func (server *clientStream) ClientStream(res pro.ClientStreamServer_ClientStreamServer) error {
	for {
		// 通过 Recv() 不断获取服务端send()推送的消息
		data, err := res.Recv()
		if err != nil {
			log.Println(err)
			return err
		}
		fmt.Println(data)
	}
}

func main() {
	// 监听端口
	lis, err := net.Listen("tcp", ClientStreamPort)
	if err != nil {
		return
	}
	newServer := grpc.NewServer()
	// 注册server
	pro.RegisterClientStreamServerServer(newServer, &clientStream{})
	newServer.Serve(lis)
}

```



### 3.3 Client

```go
package main

import (
	"context"
	log "github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	pro "i-go/grpc/proto"
	"strconv"
	"time"
)

const ClientStreamAddress = "localhost:50054"

func main() {
	conn, err := grpc.Dial(ClientStreamAddress, grpc.WithInsecure())
	if err != nil {
		log.Error(err.Error())
		return
	}
	defer conn.Close()
	// 通过conn new 一个 client
	client := pro.NewClientStreamServerClient(conn)

	// 这里获取到的 res 是一个stream
	res, err := client.ClientStream(context.Background())
	if err != nil {
		log.Error(err.Error())
		return
	}

	for i := 0; i < 20; i++ {
		itoa := strconv.Itoa(i)
		// 通过 send 方法不断推送数据到server
		err := res.Send(&pro.ClientStreamReq{Data: " client data: " + itoa})
		if err != nil {
			log.Error(err.Error())
			return
		}
		time.Sleep(time.Second)
	}
	return
}

```



### 3.4 运行

```go
先启动服务端再运行客户端
`服务端` 输出如下

data:" client data: 0" 
data:" client data: 1" 
data:" client data: 2" 
data:" client data: 3" 
data:" client data: 4" 
data:" client data: 5" 
data:" client data: 6" 
data:" client data: 7" 
data:" client data: 8" 
data:" client data: 9" 
data:" client data: 10" 
data:" client data: 11" 
data:" client data: 12" 
data:" client data: 13" 
data:" client data: 14" 
data:" client data: 15" 
data:" client data: 16" 
data:" client data: 17" 
data:" client data: 18" 
data:" client data: 19" 
// 这里服务端推送结束
time="2019-07-08T17:38:18+08:00" level=info msg="rpc error: code = Canceled desc = context canceled" 
```

## 4. 双向推送流

### 4.1 ProtoBuf

```protobuf
syntax = "proto3"; //声明proto的版本 只能 是3，才支持 gRPC
//声明 包名
package helloworld;

//声明gRPC服务
service AllStreamServer {
    // 双向推送流
    rpc AllStream (stream AllStreamReq) returns (stream AllStreamResp) {
    }
}

//stream 请求结构
message AllStreamReq {
    string data = 1;
}
//stream 返回结构
message AllStreamResp {
    string data = 1;
}
```



### 4.2 Server

```go
package main

import (
	"fmt"
	log "github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	pro "i-go/grpc/proto"
	"net"
	"time"
)

const AllStreamPort = ":50055"

type allStream struct {
}

var AllStream = &allStream{}

func (server *allStream) AllStream(allStream pro.AllStreamServer_AllStreamServer) error {
	ok := make(chan bool, 2)
	go func() {
		for {
			data, _ := allStream.Recv()
			fmt.Println(data)
		}
		ok <- true
	}()

	go func() {
		for {
			err := allStream.Send(&pro.AllStreamResp{Data: "All Stream From Server"})
			if err != nil {
				log.Error(err.Error())
			}
			time.Sleep(time.Second)
		}
		ok <- true
	}()
	// 让主线程卡在这里
	for i := 0; i < 2; i++ {
		<-ok
	}
	return nil

}

func main() {
	// 监听端口
	lis, err := net.Listen("tcp", AllStreamPort)
	if err != nil {
		return
	}
	newServer := grpc.NewServer()
	// 注册server
	pro.RegisterAllStreamServerServer(newServer, &allStream{})
	newServer.Serve(lis)
}

```

### 4.3 Client

```go
package main

import (
	"context"
	"fmt"
	log "github.com/sirupsen/logrus"
	"google.golang.org/grpc"
	pro "i-go/grpc/proto"
	"time"
)

const AllStreamAddress = "localhost:50055"

func main() {
	conn, err := grpc.Dial(AllStreamAddress, grpc.WithInsecure())
	if err != nil {
		log.Error(err.Error())
		return
	}
	defer conn.Close()

	// 通过conn new 一个 client
	client := pro.NewAllStreamServerClient(conn)
	ok := make(chan bool, 2)

	allStr, _ := client.AllStream(context.Background())
	go func() {
		for {
			data, _ := allStr.Recv()
			fmt.Println(data)
		}
		ok <- true
	}()

	go func() {
		for {
			err := allStr.Send(&pro.AllStreamReq{Data: "All Stream From Client"})
			if err != nil {
				log.Error(err.Error())
			}
			time.Sleep(time.Second)
		}
		ok <- true
	}()

	// 让主线程卡在这里
	for i := 0; i < 2; i++ {
		<-ok
	}

}

```

### 4.4 运行

```go
先启动服务端再运行客户端
客户端输出如下

data:"All Stream From Server" 
data:"All Stream From Server" 
data:"All Stream From Server" 
data:"All Stream From Server" 
data:"All Stream From Server" 
data:"All Stream From Server" 
data:"All Stream From Server" 
data:"All Stream From Server" 
data:"All Stream From Server" 
data:"All Stream From Server" 
.....

服务端输出如下

data:"All Stream From Client" 
data:"All Stream From Client" 
data:"All Stream From Client" 
data:"All Stream From Client" 
data:"All Stream From Client" 
data:"All Stream From Client" 
data:"All Stream From Client" 
data:"All Stream From Client"
....
```

## 5. 总结

* 1.每个函数都对应着 完成了 protobuf 里面的 定义。
* 2.每个函数 形参都有对应的 推送 或者 接收 对象，我们只要 不断循环 Recv(),或者 Send() 就能接收或者推送了！
* 3.当return出函数，就说明此次 推送 或者 接收 结束了，client 会 对应的 收到消息！

grpc 的 stream 和 go的协程 配合 简直完美。通过流 我们 可以更加 灵活的 实现自己的业务。如 订阅，大数据传输等。

## 6. 问题

程序运行一段时间后，server端无法继续提供服务。

猜测：Stream未关闭 测试

## 6. 参考

`https://blog.csdn.net/weixin_34219944/article/details/87456847`

`https://blog.csdn.net/m0_37595562/article/details/80784101`

