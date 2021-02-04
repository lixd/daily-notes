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

> gRPC 系列相关代码见 [Github][Github]

在 gRPC 中，身份验证被抽象为了`credentials.PerRPCCredentials`接口：

```go
type PerRPCCredentials interface {
	GetRequestMetadata(ctx context.Context, uri ...string) (map[string]string, error)
	RequireTransportSecurity() bool
}
```

**各方法作用如下**：

**GetRequestMetadata**：以 map 的形式返回本次调用的授权信息，ctx 是用来控制超时的，并不是从这个 ctx 中获取。

**RequireTransportSecurity **：指该 Credentials 的传输是否需要需要 TLS 加密，如果返回 true 则说明该 Credentials 需要在一个有 TLS 认证的安全连接上传输，如果当前连接并没有使用 TLS 则会报错：

```sh
transport: cannot send secure credentials on an insecure connection
```

**具体逻辑为**：

**在发出请求之前，gRPC 会将  Credentials 存放在 metadata 中进行传递,在真正发起调用之前，gRPC 会通过 `GetRequestMetadata `函数，将用户定义的 Credentials 提取出来，并添加到 metadata 中，随着请求一起传递到服务端。**

然后服务端从 metadata 中取出 Credentials 进行有效性校验。

gRPC 中已经内置了部分常用的授权方式，如 oAuth2 和 JWT，在 oauth 包中，具体如下：

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



## 2. 使用流程

具体分为以下两步：

* 1）客户端请求时带上 Credentials；
* 2）服务端取出 Credentials，并验证有效性，一般配合拦截器使用。

### Client

客户端添加 Credentials 有两种方式：

**1）建立连接时指定**

这样授权信息保存在 conn 对象上，通过该连接发起的每个调用都会附带上该授权信息。

```go
func main() {
	flag.Parse()

	// 构建一个 PerRPCCredentials。
	perRPC := oauth.NewOauthAccess(fetchToken())

	creds, err := credentials.NewClientTLSFromFile(data.Path("x509/ca_cert.pem"), "x.test.example.com")
	if err != nil {
		log.Fatalf("failed to load credentials: %v", err)
	}

	conn, err := grpc.Dial(*addr, grpc.WithPerRPCCredentials(perRPC),grpc.WithTransportCredentials(creds))
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()
	rgc := ecpb.NewEchoClient(conn)

	callUnaryEcho(rgc, "hello world")
}
```

**2）发起调用时指定**

这样可以为每个调用指定不同的 授权信息。

```go
func main() {
	flag.Parse()

	creds, err := credentials.NewClientTLSFromFile(data.Path("x509/ca_cert.pem"), "x.test.example.com")
	if err != nil {
		log.Fatalf("failed to load credentials: %v", err)
	}

	conn, err := grpc.Dial(*addr,grpc.WithTransportCredentials(creds))
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()
	client := ecpb.NewEchoClient(conn)

	// 构建一个 PerRPCCredentials。
	cred := oauth.NewOauthAccess(fetchToken())
	resp, err := client.UnaryEcho(context.Background(), &ecpb.EchoRequest{Message: "hello world"},grpc.PerRPCCredentials(cred))
	if err != nil {
		log.Fatalf("client.UnaryEcho(_) = _, %v: ", err)
	}
	fmt.Println("UnaryEcho: ", resp.Message)
}
```



### Server

服务端则是获取授权信息并校验有效性。

gPRC 传输的时候把授权信息存放在 metada 的，所以需要先获取 metadata。通过`metadata.FromIncomingContext`即可从 ctx 中取出本次调用的 metadata，然后再从 MD 中取出授权信息并校验即可。

metadata 结构如下：

```go
type MD map[string][]string
```

可以看到 MD 是一个 map ，授权信息在这个map中具体怎么存的由 PerRPCCredentials接口的**GetRequestMetadata**函数实现。



```go
// valid 校验认证信息有效性。
func valid(authorization []string) bool {
	if len(authorization) < 1 {
		return false
	}
	token := strings.TrimPrefix(authorization[0], "Bearer ")
	return token == "some-secret-token"
}

// ensureValidToken 用于校验 token 有效性的一元拦截器。
func ensureValidToken(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	// 如果 token不存在或者无效，直接返回错误，否则就调用真正的RPC方法。
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, errMissingMetadata
	}
	if !valid(md["authorization"]) {
		return nil, errInvalidToken
	}
	return handler(ctx, req)
}
```



## 3. Demo

这里主要演示如何实现 自定义 Auth。

### 1. MyAuth

这里主要实现`credentials.PerRPCCredentials`接口和自定义验证逻辑两部分。

* 1）实现`credentials.PerRPCCredentials`接口

> 这里就简单使用 Username+Password 进行身份验证。

```go
type MyAuth struct {
	Username string
	Password string
}

// GetRequestMetadata 定义授权信息的具体存放形式，最终会按这个格式存放到 metadata map 中。
func (a *MyAuth) GetRequestMetadata(context.Context, ...string) (map[string]string, error) {
	return map[string]string{"username": a.Username, "password": a.Password}, nil
}

// RequireTransportSecurity 是否需要基于 TLS 加密连接进行安全传输
func (a *MyAuth) RequireTransportSecurity() bool {
	return false
}
```

授权信息通过 MyAuth 结构体传递，然后通过gRPC框架内部通过 GetRequestMetadata 方法获取。

* 2）具体token的验证逻辑

这里就简单判断一下客户端传过来的信息是否等于服务端启动时指定的信息。

```go
const (
	Admin = "admin"
	Root  = "root"
)

func NewMyAuth() *MyAuth {
	return &MyAuth{
		Username: Admin,
		Password: Root,
	}
}

// IsValidAuth 具体的验证逻辑
func IsValidAuth(ctx context.Context) error {
	var (
		user     string
		password string
	)
	// 从 ctx 中获取 metadata
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return status.Errorf(codes.InvalidArgument, "missing metadata")
	}
	// 从metadata中获取授权信息
	// 这里之所以通过md["username"]和md["password"] 可以取到对应的授权信息
	// 是因为我们自定义的 GetRequestMetadata 方法是按照这个格式返回的.
	if val, ok := md["username"]; ok {
		user = val[0]
	}
	if val, ok := md["password"]; ok {
		password = val[0]
	}
	// 简单校验一下 用户名密码是否正确.
	if user != Admin || password != Root {
		return status.Errorf(codes.Unauthenticated, "Unauthorized")
	}

	return nil
}
```



### 2. 服务端

服务端主要修改点：

* 1）服务启动时指定授权信息；
* 2）在业务逻辑执行前增加身份校验。



```go
func main() {
	flag.Parse()

	cert, err := tls.LoadX509KeyPair(data.Path("x509/server.crt"), data.Path("x509/server.key"))
	if err != nil {
		log.Fatalf("failed to load key pair: %s", err)
	}

	s := grpc.NewServer(grpc.UnaryInterceptor(myEnsureValidToken), grpc.Creds(credentials.NewServerTLSFromCert(&cert)))
	pb.RegisterEchoServer(s, &ecServer{})
	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", *port))
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	log.Println("Serving gRPC on 0.0.0.0" + fmt.Sprintf(":%d", *port))
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
```

具体 token 验证逻辑直接调用 auth 中的实现即可,服务端只需要将其包装到拦截器中：

```go
// myEnsureValidToken 自定义 token 校验
func myEnsureValidToken(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	// 如果返回err不为nil则说明token验证未通过
	err := authentication.IsValidAuth(ctx)
	if err != nil {
		return nil, err
	}
	return handler(ctx, req)
}
```



### 3. 客户端

客户端只需要在请求时带上验证信息即可。

```go
func main() {
	flag.Parse()

	// 构建一个自定义的PerRPCCredentials。
	myAuth := authentication.NewMyAuth()
	creds, err := credentials.NewClientTLSFromFile(data.Path("x509/ca_cert.pem"), "x.test.example.com")
	if err != nil {
		log.Fatalf("failed to load credentials: %v", err)
	}

	conn, err := grpc.Dial(*addr, grpc.WithTransportCredentials(creds), grpc.WithPerRPCCredentials(myAuth))
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()
	client := ecpb.NewEchoClient(conn)

	callUnaryEcho(client, "hello world")
}
```



### 4. Test

Server

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/authentication/server$ go run main.go 
2021/01/24 22:17:35 Serving gRPC on 0.0.0.0:50051
```

Client

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/authentication/client$ go run main.go 
UnaryEcho:  hello world
```

授权信息正确则可以正常请求，故意传一个错误的数据测试一下

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/authentication/client$ go run main.go 
2021/01/24 22:18:19 client.UnaryEcho(_) = _, rpc error: code = Unauthenticated desc = Unauthorized: 
exit status 1
```



## 4. 小结

* 1）实现`credentials.PerRPCCredentials`接口就可以把数据当做 gRPC 中的 Credential 在添加到 metadata 中，跟着请求一起传递到服务端；
* 2）服务端从 ctx 中解析 metadata，然后从 metadata 中获取 授权信息并进行验证；
* 3）可以借助 Interceptor 实现全局身份验证。
* 4）客户端可以通过 DialOption 为所有请求统一指定授权信息，或者通过 CallOption 为每一个请求分别指定授权信息。

> gRPC 系列相关代码见 [Github][Github]



## 5. 参考

`https://books.studygolang.com/advanced-go-programming-book/ch4-rpc/ch4-05-grpc-hack.html`

`https://grpc.io/docs/guides/auth`



[Github]: https://github.com/lixd/grpc-go-example