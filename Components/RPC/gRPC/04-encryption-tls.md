---
 title: "gRPC系列(五)---通过SSL/TLS建立安全连接"
description: "gRPC中如何通过TLS证书建立安全连接，让数据能够加密处理"
date: 2021-01-02 22:00:00
draft: false
tags: ["gRPC"]
categories: ["gRPC"]
---

本文记录了gRPC 中如何通过 TLS 证书建立安全连接，让数据能够加密处理，包括证书制作和CA签名校验等。

<!--more-->

## 1. 概述

gRPC 内置了以下 encryption 机制：

* 1）SSL / TLS：通过证书进行数据加密；
* 2）ALTS：Google开发的一种双向身份验证和传输加密系统。
  * 只有运行在 Google Cloud Platform 才可用，一般不用考虑。



**gRPC 中的连接类型一共有以下3种**：

* 1）insecure connection：不使用TLS加密
* 2）server-side TLS：仅服务端TLS加密
* 3）mutual TLS：客户端、服务端都使用TLS加密



我们之前案例中使用的都是 insecure connection，

```go
conn, err := grpc.Dial(addr,grpc.WithInsecure())
```

通过指定 WithInsecure option 来建立 insecure connection，**不建议在生产环境使用**。



本章将记录如何使用 `server-side TLS` 和`mutual TLS`来建立安全连接。

> gRPC 系列相关代码见 [Github][Git]



## 2. server-side TLS

### 1. 流程

服务端 TLS 具体包含以下几个步骤：

* 1）制作证书，包含服务端证书和 CA 证书；
* 2）服务端启动时加载证书；
* 3）客户端连接时使用CA 证书校验服务端证书有效性。

> 也可以不使用 CA证书，即服务端证书自签名。



### 2. 制作证书

> 具体证书相关，点击查看[证书制作章节]()，实在不行可以直接使用本教程 Github 仓库中提供的证书文件。

#### CA 证书

```sh
# 生成.key  私钥文件
$ openssl genrsa -out ca.key 2048

# 生成.csr 证书签名请求文件
$ openssl req -new -key ca.key -out ca.csr  -subj "/C=GB/L=China/O=lixd/CN=www.lixueduan.com"

# 自签名生成.crt 证书文件
$ openssl req -new -x509 -days 3650 -key ca.key -out ca.crt  -subj "/C=GB/L=China/O=lixd/CN=www.lixueduan.com"
```

#### 服务端证书

和生成 CA证书类似，不过最后一步由 CA 证书进行签名，而不是自签名。

然后openssl 配置文件可能位置不同，需要自己修改一下。

```sh
$ find / -name "openssl.cnf"
```



```sh
# 生成.key  私钥文件
$ openssl genrsa -out server.key 2048

# 生成.csr 证书签名请求文件
$ openssl req -new -key server.key -out server.csr \
	-subj "/C=GB/L=China/O=lixd/CN=www.lixueduan.com" \
	-reqexts SAN \
	-config <(cat /etc/ssl/openssl.cnf <(printf "\n[SAN]\nsubjectAltName=DNS:*.lixueduan.com,DNS:*.refersmoon.com"))

# 签名生成.crt 证书文件
$ openssl x509 -req -days 3650 \
   -in server.csr -out server.crt \
   -CA ca.crt -CAkey ca.key -CAcreateserial \
   -extensions SAN \
   -extfile <(cat /etc/ssl/openssl.cnf <(printf "\n[SAN]\nsubjectAltName=DNS:*.lixueduan.com,DNS:*.refersmoon.com"))
```

#### 

到此会生成以下 6 个文件：

```sh
ca.crt  
ca.csr  
ca.key   
server.crt  
server.csr  
server.key
```

**会用到的有下面这3个**：

* 1）ca.crt
* 2）server.key
* 3）server.crt



### 3. 服务端

服务端代码修改点如下：

* 1）NewServerTLSFromFile 加载证书
* 2）NewServer 时指定 Creds。



```go
func main() {
	flag.Parse()

	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", *port))
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	// 指定使用服务端证书创建一个 TLS credentials。
	creds, err := credentials.NewServerTLSFromFile(data.Path("x509/server.crt"), data.Path("x509/server.key"))
	if err != nil {
		log.Fatalf("failed to create credentials: %v", err)
	}
	// 指定使用 TLS credentials。
	s := grpc.NewServer(grpc.Creds(creds))
	ecpb.RegisterEchoServer(s, &ecServer{})

	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
```



### 4. 客户端

客户端代码主要修改点：

* 1）NewClientTLSFromFile 指定使用 CA 证书来校验服务端的证书有效性。
  * 注意：第二个参数域名就是前面生成服务端证书时指定的CN参数。
* 2）建立连接时 指定建立安全连接 WithTransportCredentials。




```go
func main() {
	flag.Parse()

	// 客户端通过ca证书来验证服务的提供的证书
	creds, err := credentials.NewClientTLSFromFile(data.Path("x509/ca.crt"), "www.lixueduan.com")
	if err != nil {
		log.Fatalf("failed to load credentials: %v", err)
	}
	// 建立连接时指定使用 TLS
	conn, err := grpc.Dial(*addr, grpc.WithTransportCredentials(creds))
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()


	rgc := ecpb.NewEchoClient(conn)
	callUnaryEcho(rgc, "hello world")
}
```



### 5. Test

Server

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/encryption/server-side-TLS/server$ go run main.go 
2021/01/24 18:00:25 Server gRPC on 0.0.0.0:50051
```

Client

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/encryption/server-side-TLS/client$ go run main.go 
UnaryEcho:  hello world
```



抓包结果如下

![grpc-tls-wireshark][grpc-tls-wireshark]


可以看到成功开启了 TLS。



## 3. mutual TLS

server-side TLS 中虽然服务端使用了证书，但是客户端却没有使用证书，本章节会给客户端也生成一个证书，并完成 mutual TLS。



### 1. 制作证书

```sh
# 生成.key  私钥文件
$ openssl genrsa -out server.key 2048

# 生成.csr 证书签名请求文件
$ openssl req -new -key server.key -out server.csr \
	-subj "/C=GB/L=China/O=lixd/CN=www.lixueduan.com" \
	-reqexts SAN \
	-config <(cat /etc/ssl/openssl.cnf <(printf "\n[SAN]\nsubjectAltName=DNS:*.lixueduan.com,DNS:*.refersmoon.com"))

# 签名生成.crt 证书文件
$ openssl x509 -req -days 3650 \
   -in server.csr -out server.crt \
   -CA ca.crt -CAkey ca.key -CAcreateserial \
   -extensions SAN \
   -extfile <(cat /etc/ssl/openssl.cnf <(printf "\n[SAN]\nsubjectAltName=DNS:*.lixueduan.com,DNS:*.refersmoon.com"))
```

这里又会生成3个文件，需要的是下面这两个：

* client.crt
* client.key

到此为止，我们已经有了如下5个文件：

* ca.crt
* client.crt
* client.key
* server.crt
* server.key



### 2. 服务端

mutual TLS 中服务端、客户端改动都比较多。

具体步骤如下：

* 1）加载服务端证书
* 2）构建用于校验客户端证书的 CertPool
* 3）使用上面的参数构建一个 TransportCredentials
* 4）newServer 是指定使用前面创建的 creds。

具体改动如下：

> 看似改动很大，其实如果你仔细查看了前面 NewServerTLSFromFile 方法做的事的话，就会发现是差不多的，只有极个别参数不同。

修改点如下：

* 1）tls.Config的参数ClientAuth，这里改成了tls.RequireAndVerifyClientCert，即服务端也必须校验客户端的证书，之前使用的默认值(即不校验)
* 2）tls.Config的参数ClientCAs，由于之前都不校验客户端证书，所以也没有指定用什么证书来校验。



```go
func main() {
	// 从证书相关文件中读取和解析信息，得到证书公钥、密钥对
	certificate, err := tls.LoadX509KeyPair(data.Path("x509/server.crt"), data.Path("x509/server.key"))
	if err != nil {
		log.Fatal(err)
	}
	// 创建CertPool，后续就用池里的证书来校验客户端证书有效性
	// 所以如果有多个客户端 可以给每个客户端使用不同的 CA 证书，来实现分别校验的目的
	certPool := x509.NewCertPool()
	ca, err := ioutil.ReadFile(data.Path("x509/ca.crt"))
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
		ClientAuth: tls.RequireAndVerifyClientCert, // NOTE: this is optional!
		// 设置根证书的集合，校验方式使用 ClientAuth 中设定的模式
		ClientCAs: certPool,
	})
	s := grpc.NewServer(grpc.Creds(creds))
	ecpb.RegisterEchoServer(s, &ecServer{})

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



### 3. 客户端

客户端改动和前面服务端差不多，具体步骤都一样，除了不能指定校验策略之外基本一样。

> 大概是因为客户端必校验服务端证书，所以没有提供可选项。

```go
func main() {
	// 加载客户端证书
	certificate, err := tls.LoadX509KeyPair(data.Path("x509/client.crt"), data.Path("x509/client.key"))
	if err != nil {
		log.Fatal(err)
	}
	// 构建CertPool以校验服务端证书有效性
	certPool := x509.NewCertPool()
	ca, err := ioutil.ReadFile(data.Path("x509/ca.crt"))
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
	conn, err := grpc.Dial(*addr, grpc.WithTransportCredentials(creds))
	if err != nil {
		log.Fatalf("DialContext error:%v", err)
	}
	defer conn.Close()
	client := ecpb.NewEchoClient(conn)
	callUnaryEcho(client, "hello world")
}
```



### 4. Test

Server

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/encryption/mutual-TLS/server$ go run main.go 
2021/01/24 18:02:01 Serving gRPC on 0.0.0.0:50051
```

Client

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/encryption/mutual-TLS/client$ go run main.go 
UnaryEcho:  hello world
```

一切正常，大功告成。



## 4. FAQ

**问题**

```sh
error:rpc error: code = Unavailable desc = connection error: desc = "transport: authentication handshake failed: x509: certificate relies on legacy Common Name field, use SANs or temporarily enable Common Name matching with GODEBUG=x509ignoreCN=0"
```

由于之前使用的不是 SAN 证书，在Go版本升级到1.15后出现了该问题。

**原因**

Go 1.15 版本开始废弃 CommonName 并且推荐使用 SAN 证书，导致依赖 CommonName 的证书都无法使用了。

**解决方案**

* 1）开启兼容：设置环境变量 GODEBUG 为 `x509ignoreCN=0`
* 2）使用 SAN 证书

本教程已经修改成了 SAN 证书，所以不会遇到该问题了。



## 5. 小结

本章主要讲解了 gRPC 中三种类型的连接，及其具体配置方式。

* 1）insecure connection
* 2）server-side TLS
* 3）mutual TLS

> gRPC 系列相关代码见 [Github][Git]



## 6. 参考

`https://grpc.io/docs/guides/auth`

`https://dev.to/techschoolguru/how-to-secure-grpc-connection-with-ssl-tls-in-go-4ph`

`https://www.openssl.org/docs/manmaster/`

`https://www.jianshu.com/p/37ded4da1095`



[Git]:https://github.com/lixd/grpc-go-example
[grpc-tls-wireshark]:https://github.com/lixd/blog/raw/master/images/grpc/grpc-tls-wireshark.png
[证书制作章节]:https://github.com/lixd/daily-notes/blob/master/Components/RPC/gRPC/openssl%E5%88%B6%E4%BD%9C%E8%AF%81%E4%B9%A6.md

