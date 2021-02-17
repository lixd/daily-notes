---
title: "gRPC系列(九)---配置retry自动重试"
description: "gRPC 中的retry自动重试配置"
date: 2021-02-06 22:00:00
draft: false
tags: ["gRPC"]
categories: ["gRPC"]
---

本文主要记录了如何使用 gRPC 中的 自动重试功能。

<!--more-->



## 1. 概述

> gRPC 系列相关代码见 [Github][Github]

gRPC 中已经内置了 retry 功能，可以直接使用，不需要我们手动来实现，非常方便。



## 2. Demo

### Server

为了测试 retry 功能，服务端做了一点调整。

记录客户端的请求次数，只有满足条件的那一次（这里就是请求次数模4等于0的那一次）才返回成功，其他时候都返回失败。

```go
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net"
	"sync"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pb "github.com/lixd/grpc-go-example/features/proto/echo"
)

var port = flag.Int("port", 50052, "port number")

type failingServer struct {
	pb.UnimplementedEchoServer
	mu sync.Mutex

	reqCounter uint
	reqModulo  uint
}

// maybeFailRequest 手动模拟请求失败 一共请求n次，前n-1次都返回失败，最后一次返回成功。
func (s *failingServer) maybeFailRequest() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.reqCounter++
	if (s.reqModulo > 0) && (s.reqCounter%s.reqModulo == 0) {
		return nil
	}

	return status.Errorf(codes.Unavailable, "maybeFailRequest: failing it")
}

func (s *failingServer) UnaryEcho(ctx context.Context, req *pb.EchoRequest) (*pb.EchoResponse, error) {
	if err := s.maybeFailRequest(); err != nil {
		log.Println("request failed count:", s.reqCounter)
		return nil, err
	}

	log.Println("request succeeded count:", s.reqCounter)
	return &pb.EchoResponse{Message: req.Message}, nil
}

func main() {
	flag.Parse()

	address := fmt.Sprintf(":%v", *port)
	lis, err := net.Listen("tcp", address)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	fmt.Println("listen on address", address)

	s := grpc.NewServer()

	// 指定第4次请求才返回成功，用于测试 gRPC 的 retry 功能。
	failingservice := &failingServer{
		reqModulo: 4,
	}

	pb.RegisterEchoServer(s, failingservice)
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
```



### Client

客户端则是建立连接的时候通过`grpc.WithDefaultServiceConfig()`配置好 retry 功能。

```go
package main

import (
	"context"
	"flag"
	"log"
	"time"

	pb "github.com/lixd/grpc-go-example/features/proto/echo"
	"google.golang.org/grpc"
)

var (
	addr = flag.String("addr", "localhost:50052", "the address to connect to")
	// 更多配置信息查看官方文档： https://github.com/grpc/grpc/blob/master/doc/service_config.md
	// service这里语法为<package>.<service> package就是proto文件中指定的package，service也是proto文件中指定的 Service Name。
	// method 可以不指定 即当前service下的所以方法都使用该配置。
	retryPolicy = `{
		"methodConfig": [{
		  "name": [{"service": "echo.Echo","method":"UnaryEcho"}],
		  "retryPolicy": {
			  "MaxAttempts": 4,
			  "InitialBackoff": ".01s",
			  "MaxBackoff": ".01s",
			  "BackoffMultiplier": 1.0,
			  "RetryableStatusCodes": [ "UNAVAILABLE" ]
		  }
		}]}`
)

func main() {
	flag.Parse()
	conn, err := grpc.Dial(*addr, grpc.WithInsecure(), grpc.WithDefaultServiceConfig(retryPolicy))
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer func() {
		if e := conn.Close(); e != nil {
			log.Printf("failed to close connection: %s", e)
		}
	}()

	c := pb.NewEchoClient(conn)

	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	reply, err := c.UnaryEcho(ctx, &pb.EchoRequest{Message: "Try and Success"})
	if err != nil {
		log.Fatalf("UnaryEcho error: %v", err)
	}
	log.Printf("UnaryEcho reply: %v", reply)
}
```

需要注意的是其中的配置信息：

```go
{
		"methodConfig": [{
		  "name": [{"service": "echo.Echo","method":"UnaryEcho"}],
		  "retryPolicy": {
			  "MaxAttempts": 4,
			  "InitialBackoff": ".01s",
			  "MaxBackoff": ".01s",
			  "BackoffMultiplier": 1.0,
			  "RetryableStatusCodes": [ "UNAVAILABLE" ]
		  }}]
}
```

* name 指定下面的配置信息作用的 RPC 服务或方法
  * service：通过服务名匹配，语法为`<package>.<service> `package就是proto文件中指定的package，service也是proto文件中指定的 Service Name。
  * method：匹配具体某个方法，proto文件中定义的方法名。

主要关注 retryPolicy，重试策略

* MaxAttempts：最大尝试次数
* InitialBackoff：默认退避时间
* MaxBackoff：最大退避时间
* BackoffMultiplier：退避时间增加倍率
* RetryableStatusCodes：服务端返回什么错误码才重试

重试机制一般会搭配退避算法一起使用。

> 即假设第一次请求失败后，等1秒（随便取的一个数）再次请求，又失败后就等2秒在请求，一直重试直达超过指定重试次数或者等待时间就不在重试。

如果不使用退避算法，失败后就一直重试只会增加服务器的压力。如果是因为服务器压力大，导致的请求失败，那么根据退避算法等待一定时间后再次请求可能就能成功。反之直接请求可能会因为压力过大导致服务崩溃。



### Run

先启动服务端

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/retry/server$ go run main.go 
listen on address :50052
2021/02/17 17:35:29 request failed count: 1
```

在启动客户端

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/retry/client$ go run main.go 
2021/02/17 17:35:29 UnaryEcho error: rpc error: code = Unavailable desc = maybeFailRequest: failing it
exit status 1
```



emmm 并没有重试。。。

### 开启重试

查看文档后发现是需要**设置环境变量**。

查看文档后发现是需要**设置环境变量**。

查看文档后发现是需要**设置环境变量**。

> 这个比较坑，看了好多文章都没提到这个。

> https://github.com/grpc/grpc-go/issues/3020



```sh
lixd@17x$ export GRPC_GO_RETRY=on
lixd@17x$ echo $GRPC_GO_RETRY
on
```

然后重新启动服务端和客户端

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/retry/server$ go run main.go 
listen on address :50052
2021/02/17 17:37:55 request failed count: 1
2021/02/17 17:37:55 request failed count: 2
2021/02/17 17:37:55 request failed count: 3
2021/02/17 17:37:55 request succeeded count: 4
```

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/retry/client$ go run main.go 
2021/02/17 17:37:55 UnaryEcho reply: message:"Try and Success"
```

现在重试功能就生效了。

前3次都失败了，且返回错误码是客户端重试策略中指定的`UNAVAILABLE`,所以都进行了重试，直到第4次成功了就不在重试了。

> 当然，第4次已经是最大尝试次数了，就算失败也不会重试了。



## 3. 小结

gRPC 中内置了 retry 功能，使用比较简单。

* 1）客户端建立连接时通过`grpc.WithDefaultServiceConfig(retryPolicy)`指定重试策略
* 2）环境变量中开启重试:`export GRPC_GO_RETRY=on`





[Github]: https://github.com/lixd/grpc-go-example