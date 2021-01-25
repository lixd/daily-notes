---
title: "gRPC系列(六)---自定义身份校验"
description: "gRPC 自定义身份校验以提升安全性"
date: 2021-01-08 22:00:00
draft: false
tags: ["gRPC"]
categories: ["gRPC"]
---

本文主要记录了如何在 gRPC 中使用自定义身份校验以提升服务安全性。

<!--more-->

## 1. 概述

除了 TLS 之外， gRPC 还提供了自定义身份验证接口。所有验证逻辑都可以自定义，这样比较灵活。



具体`credentials.PerRPCCredentials`接口如下

```go
type PerRPCCredentials interface {
	GetRequestMetadata(ctx context.Context, uri ...string) (map[string]string, error)
	RequireTransportSecurity() bool
}
```

它的作用是将所需的安全认证信息添加到每个 RPC 方法的上下文中。

实现该接口之后客户端就可以通过`WithPerRPCCredentials`方法传递验证信息

```go
func WithPerRPCCredentials(creds credentials.PerRPCCredentials) DialOption {
	return newFuncDialOption(func(o *dialOptions) {
		o.copts.PerRPCCredentials = append(o.copts.PerRPCCredentials, creds)
	})
}
```

然后服务端从请求中取出对应的验证信息并校验即可。

## 2. 例子

> 还是用的前面的 helloworld 中的代码。



### 1. auth.go

这里主要实现`credentials.PerRPCCredentials`接口和自定义验证逻辑两部分。

首先定义结构体并实现`credentials.PerRPCCredentials`接口

> 这里就简单使用 Username+Password 进行身份验证。

```go
type Authentication struct {
	Username string
	Password string
}

// GetRequestMetadata 获取当前请求认证所需的元数据（metadata），后续授权的时候使用
func (a *Authentication) GetRequestMetadata(context.Context, ...string) (map[string]string, error) {
	return map[string]string{"username": a.Username, "password": a.Password}, nil
}

// RequireTransportSecurity 是否需要基于 TLS 认证进行安全传输
func (a *Authentication) RequireTransportSecurity() bool {
	return false
}
```

授权信息通过 Authentication 结构体传递，然后通过 GetRequestMetadata()方法获取。



然后需要写好具体的验证逻辑。

> 简单判断一下客户端传过来的信息是否等于服务端启动时指定的信息。

```go
// Auth 具体的验证逻辑
func (a *Authentication) Auth(ctx context.Context) error {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return fmt.Errorf("missing credentials")
	}
	var (
		user     string
		password string
	)

	if val, ok := md["username"]; ok {
		user = val[0]
	}
	if val, ok := md["password"]; ok {
		password = val[0]
	}

	if user != a.Username || password != a.Password {
		return status.Errorf(codes.Unauthenticated, "Unauthorized")
	}

	return nil
}
```

除了自定义之外，gRPC 也提供了一些常用的的 Auth：

```go
func NewJWTAccessFromFile(keyFile string) (credentials.PerRPCCredentials, error) {
	jsonKey, err := ioutil.ReadFile(keyFile)
	if err != nil {
		return nil, fmt.Errorf("credentials: failed to read the service account key file: %v", err)
	}
	return NewJWTAccessFromKey(jsonKey)
}

func NewOauthAccess(token *oauth2.Token) credentials.PerRPCCredentials {
	return oauthAccess{token: *token}
}
```



### 2. server.go

服务端主要修改

* 1）服务启动时指定验证新；
* 2）在业务逻辑执行前增加身份校验。



```go
package main

import (
	"log"
	"net"

	"golang.org/x/net/context"
	"google.golang.org/grpc"
	"i-go/grpc/auth/token"
	pb "i-go/grpc/auth/token/proto"
)

type greeterServer struct {
	pb.UnimplementedGreeterServer
	auth *token.Authentication
}

func (g *greeterServer) SayHello(ctx context.Context, in *pb.HelloRequest) (*pb.HelloReply, error) {
	// 增加身份校验
	if err := g.auth.Auth(ctx); err != nil {
		return nil, err
	}
	return &pb.HelloReply{Message: "Hello " + in.Name}, nil
}

func main() {
	listener, err := net.Listen("tcp", ":8087")
	if err != nil {
		panic(err)
	}
	newServer := grpc.NewServer()
	// 自定义验证新
	us := greeterServer{auth: &token.Authentication{Username: "17x", Password: "golang"}}
	pb.RegisterGreeterServer(newServer, &us)
	log.Println("Serving gRPC on 0.0.0.0:8087")
	if err = newServer.Serve(listener); err != nil {
		log.Fatal(err)
	}
}
```



### 3. client.go

客户端只需要在请求时带上验证信息即可。

由于实现了`credentials.PerRPCCredentials`接口，所以可以通过`grpc.WithPerRPCCredentials()`传递。

```go
package main

import (
	"context"
	"log"

	"google.golang.org/grpc"
	"i-go/grpc/auth/token"
	pb "i-go/grpc/auth/token/proto"
)

func main() {
	credential := token.Authentication{
		Username: "17x",
		Password: "golang",
	}
	//  WithTransportCredentials()  自定义验证
	conn, err := grpc.Dial("0.0.0.0:8087", grpc.WithInsecure(), grpc.WithPerRPCCredentials(&credential))
	if err != nil {
		panic(err)
	}
	defer conn.Close()

	client := pb.NewGreeterClient(conn)
	resp, err := client.SayHello(context.Background(), &pb.HelloRequest{Name: "world"})
	if err != nil {
		log.Fatalf("SayHello error:%v", err)
	}
	log.Printf("Greeter: %v \n", resp.Message)
}
```



### 4. run

先后运行服务端和客户端

```sh
$ go run server.go
2020/12/22 14:12:56 Serving gRPC on 0.0.0.0:8087
```

```sh
$ go run client.go
2020/12/22 14:13:00 Greeter: Hello world
```

授权信息正确则可以正常请求，故意传一个错误的数据测试一下

```sh
$ go run client.go
2020/12/22 14:16:06 SayHello error:rpc error: code = Unauthenticated desc = Unauthorized
exit status 1
```



## 3. 小结

* 1）实现`credentials.PerRPCCredentials`接口就可以把数据当做 gRPC 中的 Credential 在各个请求中进行传递；
* 2）客户端请求时带上 Credential，服务端从 ctx 中解析出来并进行身份验证；
* 3）可以借助 Interceptor 实现全局身份验证。



## 4. 参考

`https://books.studygolang.com/advanced-go-programming-book/ch4-rpc/ch4-05-grpc-hack.html`

`https://grpc.io/docs/guides/auth`