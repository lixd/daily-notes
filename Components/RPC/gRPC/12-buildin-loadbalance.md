---
title: "gRPC系列教程(十一)---负载均衡"
description: "gRPC LoadBalance"
date: 2021-05-08 22:00:00
draft: false
tags: ["gRPC"]
categories: ["gRPC"]
---

本文主要介绍了 gRPC 内置的负载均衡策略及其配置与使用，包括 Name Resolver、ServiceConfig 等。

<!--more-->

> gRPC 系列相关代码见 [Github][Github]

## 1. 概述

gRPC 负载均衡包括客户端负载均衡和服务端负载均衡两种方向。本文主要介绍的是客户端负载均衡。

gRPC 的客户端负载均衡主要分为两个部分：

* 1）Name Resolver
* 2）Load Balancing Policy



### 1. NameResolver

具体可以参考[官方文档-Name Resolver](https://github.com/grpc/grpc/blob/master/doc/naming.md)

gRPC 中的默认 name-system 是DNS，同时在客户端以插件形式提供了自定义 name-system 的机制。

gRPC NameResolver 会根据 name-system 选择对应的解析器，用以解析用户提供的服务器名，最后返回具体地址列表（IP+端口号）。

例如：默认使用 DNS name-system，我们只需要提供服务器的域名即端口号，NameResolver 就会使用 DNS 解析出域名对应的IP列表并返回。

在本例中我们会自定义一个 NameResolver。



### 1.2 Load Balancing Policy

具体可以参考[官方文档-Load Balancing Policy](https://github.com/grpc/grpc/blob/master/doc/load-balancing.md)

常见的 gRPC 库都内置了几个负载均衡算法，比如 [gRPC-Go](https://github.com/grpc/grpc-go/tree/master/examples/features/load_balancing#pick_first) 中内置了`pick_first`和`round_robin`两种算法。

* pick_first：尝试连接到第一个地址，如果连接成功，则将其用于所有RPC，如果连接失败，则尝试下一个地址（并继续这样做，直到一个连接成功）。
* round_robin：连接到它看到的所有地址，并依次向每个后端发送一个RPC。例如，第一个RPC将发送到backend-1，第二个RPC将发送到backend-2，第三个RPC将再次发送到backend-1。



本例中我们会分别测试两种负载均衡策略的效果。



## 2. NameResolver

首先用一个Demo来介绍一个 gRPC 的NameResolver如何使用。

### 2.1 Server

服务端代码比较简单，没有什么需要注意的点。

```go
package main

import (
	"context"
	"fmt"
	"log"
	"net"

	pb "github.com/lixd/grpc-go-example/features/proto/echo"
	"google.golang.org/grpc"
)

const addr = "localhost:50051"

type ecServer struct {
	pb.UnimplementedEchoServer
	addr string
}

func (s *ecServer) UnaryEcho(ctx context.Context, req *pb.EchoRequest) (*pb.EchoResponse, error) {
	return &pb.EchoResponse{Message: fmt.Sprintf("%s (from %s)", req.Message, s.addr)}, nil
}

func main() {
	lis, err := net.Listen("tcp", addr)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()
	pb.RegisterEchoServer(s, &ecServer{addr: addr})
	log.Printf("serving on %s\n", addr)
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}

```



### 2.2 Client

客户端需要注意的是，这里建立连接时用到了自定义的Scheme，而不是默认的 DNS。所以需要有和这个自定义的Scheme对应的 Resolver 来解析才行。

```go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	pb "github.com/lixd/grpc-go-example/features/proto/echo"
	"google.golang.org/grpc"

	"google.golang.org/grpc/resolver"
)

const (
	exampleScheme      = "example"
	exampleServiceName = "resolver.example.grpc.io"

	backendAddr = "localhost:50051"
)

func callUnaryEcho(c pb.EchoClient, message string) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	r, err := c.UnaryEcho(ctx, &pb.EchoRequest{Message: message})
	if err != nil {
		log.Fatalf("could not greet: %v", err)
	}
	fmt.Println(r.Message)
}

func makeRPCs(cc *grpc.ClientConn, n int) {
	hwc := pb.NewEchoClient(cc)
	for i := 0; i < n; i++ {
		callUnaryEcho(hwc, "this is examples/name_resolving")
	}
}

func main() {
	passthroughConn, err := grpc.Dial(
		fmt.Sprintf("passthrough:///%s", backendAddr), // Dial to "passthrough:///localhost:50051"
		grpc.WithInsecure(),
		grpc.WithBlock(),
	)
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer passthroughConn.Close()

	fmt.Printf("--- calling helloworld.Greeter/SayHello to \"passthrough:///%s\"\n", backendAddr)
	makeRPCs(passthroughConn, 10)

	fmt.Println()

	exampleConn, err := grpc.Dial(
		fmt.Sprintf("%s:///%s", exampleScheme, exampleServiceName), // Dial to "example:///resolver.example.grpc.io"
		grpc.WithInsecure(),
		grpc.WithBlock(),
	)
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer exampleConn.Close()

	fmt.Printf("--- calling helloworld.Greeter/SayHello to \"%s:///%s\"\n", exampleScheme, exampleServiceName)
	makeRPCs(exampleConn, 10)
}
```



具体 Resolver 相关代码如下：

```go
// Following is an example name resolver. It includes a
// ResolverBuilder(https://godoc.org/google.golang.org/grpc/resolver#Builder)
// and a Resolver(https://godoc.org/google.golang.org/grpc/resolver#Resolver).
//
// A ResolverBuilder is registered for a scheme (in this example, "example" is
// the scheme). When a ClientConn is created for this scheme, the
// ResolverBuilder will be picked to build a Resolver. Note that a new Resolver
// is built for each ClientConn. The Resolver will watch the updates for the
// target, and send updates to the ClientConn.

// exampleResolverBuilder is a
// ResolverBuilder(https://godoc.org/google.golang.org/grpc/resolver#Builder).
type exampleResolverBuilder struct{}

func (*exampleResolverBuilder) Build(target resolver.Target, cc resolver.ClientConn, opts resolver.BuildOptions) (resolver.Resolver, error) {
	r := &exampleResolver{
		target: target,
		cc:     cc,
		addrsStore: map[string][]string{
			exampleServiceName: {backendAddr},
		},
	}
	r.start()
	return r, nil
}
func (*exampleResolverBuilder) Scheme() string { return exampleScheme }

// exampleResolver is a
// Resolver(https://godoc.org/google.golang.org/grpc/resolver#Resolver).
type exampleResolver struct {
	target     resolver.Target
	cc         resolver.ClientConn
	addrsStore map[string][]string
}

func (r *exampleResolver) start() {
	addrStrs := r.addrsStore[r.target.Endpoint]
	addrs := make([]resolver.Address, len(addrStrs))
	for i, s := range addrStrs {
		addrs[i] = resolver.Address{Addr: s}
	}
	r.cc.UpdateState(resolver.State{Addresses: addrs})
}
func (*exampleResolver) ResolveNow(o resolver.ResolveNowOptions) {}
func (*exampleResolver) Close()                                  {}

func init() {
	// Register the example ResolverBuilder. This is usually done in a package's
	// init() function.
	resolver.Register(&exampleResolverBuilder{})
}
```

resolver 包括 ResolverBuilder 和 Resolver两个部分。

分别需要实现`Builder`和`Resolver`接口

```go
type Builder interface {
	Build(target Target, cc ClientConn, opts BuildOptions) (Resolver, error)
	Scheme() string
}


type Resolver interface {
	ResolveNow(ResolveNowOptions)
	Close()
}
```







[Github]:https://github.com/lixd/grpc-go-example
