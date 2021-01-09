# gRPC auth

## 1. 概述

gRPC内置了以下身份验证机制：

* 1）SSL / TLS：通过证书进行数据加密
* 2）ALTS：Google开发的一种双向身份验证和传输加密系统
  * 只有运行在 Google Cloud Platform 才可用，一般不用考虑
* 3）Token：基于 token 的身份验证



## 2. TLS

### 1. 简单使用

Client:

```go
creds, _ := credentials.NewClientTLSFromFile(certFile, "")
conn, _ := grpc.Dial("localhost:50051", grpc.WithTransportCredentials(creds))
// error handling omitted
client := pb.NewGreeterClient(conn)
// ...
```



Server:

```go
creds, _ := credentials.NewServerTLSFromFile(certFile, keyFile)
s := grpc.NewServer(grpc.Creds(creds))
lis, _ := net.Listen("tcp", "localhost:50051")
// error handling omitted
s.Serve(lis)
```



### 2. 制作证书

首先需要要制作证书，这里使用 openssl 来生成公钥密钥文件。

**私钥**

```sh
openssl genrsa -out server.key 2048
```

- `openssl genrsa`：生成`RSA`私钥，命令的最后一个参数，将指定生成密钥的位数，如果没有指定，默认512

**自签名公钥**

> 这里的参数 CN 记一下，后续代码中会用到。

```sh
openssl req -new -x509 -sha256 -key server.key -out server.crt -days 3650 -subj "/C=GB/L=China/O=lixd/CN=www.lixueduan.com"
```

- `openssl req`：生成自签名证书，`-new`指生成证书请求、`-sha256`指使用`sha256`加密、`-key`指定私钥文件、`-x509`指输出证书、`-days 3650`为有效期，此后则输入证书拥有者信息



### 3. 例子

> 这里的代码也是从之前的 helloworld 复制过来的，只需要一点点修改即可。

**hello_world.proto**

```protobuf
syntax = "proto3";
option go_package = ".;proto";
package tls;

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply) {}
}

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
```

编译

```sh
protoc --go_out=. --go_opt=paths=source_relative \
		--go-grpc_out=. --go-grpc_opt=paths=source_relative \
        ./hello_world.proto
```



**server.go**

```go
package main

import (
	"fmt"
	"log"
	"net"

	"golang.org/x/net/context"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"i-go/grpc/auth/tls"
	pb "i-go/grpc/auth/tls/proto"
)

type greeterServer struct {
	pb.UnimplementedGreeterServer
}

func (g *greeterServer) SayHello(ctx context.Context, in *pb.HelloRequest) (*pb.HelloReply, error) {
	return &pb.HelloReply{Message: "Hello " + in.Name}, nil
}

/*
1. credentials.NewServerTLSFromFile("../../conf/server.pem", "../../conf/server.key") 构建TransportCredentials
2. grpc.NewServer(grpc.Creds(c)) 开启TLS
*/
func main() {
	// 构建 TransportCredentials
	c, err := credentials.NewServerTLSFromFile("../cert/server.pem", "../cert/server.key")
	if err != nil {
		log.Fatalf("NewServerTLSFromFile err: %v", err)
	}
	listener, err := net.Listen("tcp", ":8085")
	if err != nil {
		log.Fatalf("Listen err: %v", err)
	}
	// 通过 grpc.Creds(c) 开启TLS
	newServer := grpc.NewServer(grpc.Creds(c))
	pb.RegisterGreeterServer(newServer, &greeterServer{})
	log.Println("Serving gRPC on 0.0.0.0:8085")
	if err = newServer.Serve(listener); err != nil {
		panic(err)
	}
}
```



**client.go**

```go
package main

import (
	"context"
	"fmt"
	"log"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"i-go/grpc/auth/tls"
	pb "i-go/grpc/auth/tls/proto"
)

/*
1. credentials.NewClientTLSFromFile(crt, "www.lixueduan.com") 构建TransportCredentials
2. rpc.WithTransportCredentials(c) 配置TLS
*/
func main() {
	// serverNameOverride(即这里的"grpc")需要和生成证书时指定的Common Name对应
	c, err := credentials.NewClientTLSFromFile("../cert/server.pem", "www.lixueduan.com")
	if err != nil {
		log.Fatalf("NewClientTLSFromFile error:%v", err)
	}
	// grpc.WithTransportCredentials(c) 配置TLS
	conn, err := grpc.DialContext(context.Background(), "0.0.0.0:8085", grpc.WithTransportCredentials(c))
	if err != nil {
		log.Fatalf("DialContext error:%v", err)
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



**run**

分别运行服务端和客户端

```sh
$ go run server.go
2020/12/22 12:35:41 Serving gRPC on 0.0.0.0:8085
```



```sh
$ go run client.go
2020/12/22 12:36:07 Greeter: Hello world
```



抓包结果如下

<img src="/assets/grpc-tls-wireshark.png" style="zoom:80%;" />


可以看到成功开启了 TLS。



## 3. CA 签名

前面 TLS 请求中可以看到 Client 需要 Server 的证书和服务名称来建立连接。

> 即需要将证书从 Server 传递给 Client，这个传递的过程就可能会出现问题。

所以需要使用 CA 进行证书签名，然后在服务端客户端都对对方的证书进行校验，这样就不容易出问题了

### 1. 制作证书

* 1）生成根证书

* 2）生成 server、client证书
* 3）使用根证书对s erver、client 证书进行签名

**根证书**

**.key**

```sh
openssl genrsa -out ca.key 2048
```

**.csr**

```sh
openssl req -new -key ca.key -out ca.csr  -subj "/C=GB/L=China/O=lixd/CN=www.lixueduan.com"
```

**.crt**

```sh
openssl req -new -x509 -days 3650 -key ca.key -out ca.crt  -subj "/C=GB/L=China/O=lixd/CN=www.lixueduan.com"
```



**server**

**.key**

```sh
openssl genrsa -out server.key 2048
```

**.csr**

```sh
openssl req -new -key server.key -out server.csr -subj "/C=GB/L=China/O=lixd/CN=www.lixueduan.com"
```

**.crt**

```sh
openssl x509 -req -sha256 -CA ca.crt -CAkey ca.key -CAcreateserial -days 3650 -in server.csr -out server.crt
```



**client**
**.key**

```sh
openssl genrsa -out client.key 2048
```

**.csr**

```sh
openssl req -new -key client.key -out client.csr -subj "/C=GB/L=China/O=lixd/CN=www.lixueduan.com"
```

**.crt**

```sh
openssl x509 -req -sha256 -CA ca.crt -CAkey ca.key -CAcreateserial -days 3650 -in client.csr -out client.crt
```



最后会生成10个文件，需要用到的是这5个：

```sh
ca.crt
client.crt
client.key
server.crt
server.key
```



### 2. server.go

具体改动如下

```go
package main

import (
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"
	"log"
	"net"

	"golang.org/x/net/context"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	pb "i-go/grpc/auth/ca/proto"
)

type greeterServer struct {
	pb.UnimplementedGreeterServer
}

func (g *greeterServer) SayHello(ctx context.Context, in *pb.HelloRequest) (*pb.HelloReply, error) {
	return &pb.HelloReply{Message: "Hello " + in.Name}, nil
}

func main() {
	// 从证书相关文件中读取和解析信息，得到证书公钥、密钥对
	certificate, err := tls.LoadX509KeyPair("../cert/server.crt", "../cert/server.key")
	if err != nil {
		log.Fatal(err)
	}

	certPool := x509.NewCertPool()
	ca, err := ioutil.ReadFile("../cert/ca.crt")
	if err != nil {
		log.Fatal(err)
	}
	if ok := certPool.AppendCertsFromPEM(ca); !ok {
		log.Fatal("failed to append certs")
	}
	// 构建基于 TLS 的 TransportCredentials
	creds := credentials.NewTLS(&tls.Config{
		// 设置证书链，允许包含一个或多个
		Certificates: []tls.Certificate{certificate},
		// 要求必须校验客户端的证书 可以根据实际情况选用其他参数
		ClientAuth:   tls.RequireAndVerifyClientCert, // NOTE: this is optional!
		// 设置根证书的集合，校验方式使用 ClientAuth 中设定的模式
		ClientCAs:    certPool,
	})
	server := grpc.NewServer(grpc.Creds(creds))
	pb.RegisterGreeterServer(server, &greeterServer{})

	listener, err := net.Listen("tcp", ":8085")
	if err != nil {
		log.Fatalf("Listen err: %v", err)
	}
	log.Println("Serving gRPC on 0.0.0.0:8085")
	if err = server.Serve(listener); err != nil {
		panic(err)
	}
}
```



### 3. client.go

和 server 类似，简单流程大致如下：

1. Client 通过请求得到 Server 端的证书
2. 使用 CA 认证的根证书对 Server 端的证书进行可靠性、有效性等校验
3. 校验 ServerName 是否可用、有效

```go
package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"io/ioutil"
	"log"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	pb "i-go/grpc/auth/ca/proto"
)

func main() {
	certificate, err := tls.LoadX509KeyPair("../cert/client.crt", "../cert/client.key")
	if err != nil {
		log.Fatal(err)
	}

	certPool := x509.NewCertPool()
	ca, err := ioutil.ReadFile("../cert/ca.crt")
	if err != nil {
		log.Fatal(err)
	}
	if ok := certPool.AppendCertsFromPEM(ca); !ok {
		log.Fatal("failed to append ca certs")
	}

	creds := credentials.NewTLS(&tls.Config{
		Certificates: []tls.Certificate{certificate},
		ServerName:   "www.lixueduan.com", // NOTE: this is required!
		RootCAs:      certPool,
	})
	conn, err := grpc.DialContext(context.Background(), "0.0.0.0:8085", grpc.WithTransportCredentials(creds))
	if err != nil {
		log.Fatalf("DialContext error:%v", err)
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

```sh
$ go run server.go
2020/12/22 16:53:17 Serving gRPC on 0.0.0.0:8086
```

```sh
$ go run client.go
2020/12/22 16:53:47 Greeter: Hello world
```

一切正常，大功告成。



## 4. 小结

本章首先简单的实现了 TLS 安全传输，接着使用 CA 对证书进行签名并验证，进一步提高了安全性。



## 5. 参考

`https://grpc.io/docs/guides/auth`

`https://eddycjy.com/posts/go/grpc/2018-10-07-grpc-tls/`

`https://www.openssl.org/docs/manmaster/`

`https://www.jianshu.com/p/37ded4da1095`