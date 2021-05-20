---
title: "gRPC系列教程(十一)---NameResolver 实战及原理分析"
description: "gRPC NameResolver 核心原理详解"
date: 2021-05-14 22:00:00
draft: false
tags: ["gRPC"]
categories: ["gRPC"]
---

本文主要介绍了 gRPC 的 NameResolver 及其简单使用，同时从源码层面对其核心原理进行了分析。

<!--more-->

> gRPC 系列相关代码见 [Github][Github]

## 1. 概述

具体可以参考[官方文档-Name Resolver](https://github.com/grpc/grpc/blob/master/doc/naming.md)

gRPC 中的默认 name-system 是 DNS，同时在客户端以插件形式提供了自定义 name-system 的机制。

gRPC NameResolver 会根据 name-system 选择对应的解析器，用以解析用户提供的服务器名，最后返回具体地址列表（IP+端口号）。

例如：默认使用 DNS name-system，我们只需要提供服务器的域名即端口号，NameResolver 就会使用 DNS 解析出域名对应的 IP 列表并返回。



## 2. Demo

首先用一个 Demo 来介绍一个 gRPC 的 NameResolver 如何使用。

### 2.1 Server

服务端代码比较简单，没有什么需要注意的地方。

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

客户端需要注意的是，这里建立连接时使用我们自定义的 Scheme，而不是默认的 dns，所以需要有和这个自定义的 Scheme 对应的 Resolver 来解析才行。

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
	myScheme      = "17x"
	myServiceName = "resolver.17x.lixueduan.com"

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
		// passthrough 也是gRPC内置的一个scheme
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

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*3)
	defer cancel()
	exampleConn, err := grpc.DialContext(
		ctx,
		fmt.Sprintf("%s:///%s", myScheme, myServiceName), // Dial to "17x:///resolver.17x.lixueduan.com"
		grpc.WithInsecure(),
		grpc.WithBlock(),
	)
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer exampleConn.Close()

	fmt.Printf("--- calling helloworld.Greeter/SayHello to \"%s:///%s\"\n", myScheme, myServiceName)
	makeRPCs(exampleConn, 10)
}
```



具体 Resolver 实现如下：

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
			myServiceName: {backendAddr},
		},
	}
	r.ResolveNow(resolver.ResolveNowOptions{})
	return r, nil
}
func (*exampleResolverBuilder) Scheme() string { return myScheme }

// exampleResolver is a
// Resolver(https://godoc.org/google.golang.org/grpc/resolver#Resolver).
type exampleResolver struct {
	target     resolver.Target
	cc         resolver.ClientConn
	addrsStore map[string][]string
}

func (r *exampleResolver) ResolveNow(o resolver.ResolveNowOptions) {
	// 直接从map中取出对于的addrList
	addrStrs := r.addrsStore[r.target.Endpoint]
	addrs := make([]resolver.Address, len(addrStrs))
	for i, s := range addrStrs {
		addrs[i] = resolver.Address{Addr: s}
	}
	r.cc.UpdateState(resolver.State{Addresses: addrs})
}

func (*exampleResolver) Close() {}

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



Resolver 是整个功能最核心的代码，用于将服务名解析成对应实例。

Builder 则采用 Builder 模式在包初始化时创建并注册构造自定义 Resolver 实例。当客户端通过 `Dial` 方法对指定服务进行拨号时，grpc resolver 查找注册的 Builder 实例调用其 `Build()` 方法构建自定义 Resolver。

### 2.3 Test

分别启动服务端和客户端进行测试：

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/name_resolving/server$ go run main.go 
2021/05/15 10:04:11 serving on localhost:50051
```

```sh
lixd@17x:~/17x/projects/grpc-go-example/features/name_resolving/client$ go run main.go 
--- calling helloworld.Greeter/SayHello to "passthrough:///localhost:50051"
this is examples/name_resolving (from localhost:50051)
this is examples/name_resolving (from localhost:50051)
this is examples/name_resolving (from localhost:50051)
this is examples/name_resolving (from localhost:50051)
this is examples/name_resolving (from localhost:50051)
this is examples/name_resolving (from localhost:50051)
this is examples/name_resolving (from localhost:50051)
this is examples/name_resolving (from localhost:50051)
this is examples/name_resolving (from localhost:50051)
this is examples/name_resolving (from localhost:50051)

--- calling helloworld.Greeter/SayHello to "17x:///resolver.17x.lixueduan.com"
this is examples/name_resolving (from localhost:50051)
this is examples/name_resolving (from localhost:50051)
this is examples/name_resolving (from localhost:50051)
this is examples/name_resolving (from localhost:50051)
this is examples/name_resolving (from localhost:50051)
this is examples/name_resolving (from localhost:50051)
this is examples/name_resolving (from localhost:50051)
this is examples/name_resolving (from localhost:50051)
this is examples/name_resolving (from localhost:50051)
this is examples/name_resolving (from localhost:50051)
```

一切正常，说明我们的自定义 Resolver 是可以运行的，那么接下来从源码层面来分析一下 gRPC 中 Resolver 具体是如何工作的。



## 3. 源码分析

> 以下分析基于 grpc-go v1.35.0 版本



首先客户端调用`grpc.Dial()`方法建立连接，会进入`DialContext()`方法。

```go
// clientconn.go 103 行
func Dial(target string, opts ...DialOption) (*ClientConn, error) {
	return DialContext(context.Background(), target, opts...)
}
```



DialContext() 内容比较多，这里只关注 Resolver 相关的代码：

这一段是通过解析 target 获取 scheme，然后根据 scheme 找到对应的 resolverBuilder

```go
// clientconn.go 249行
// 首先解析target
	cc.parsedTarget = grpcutil.ParseTarget(cc.target, cc.dopts.copts.Dialer != nil)
	channelz.Infof(logger, cc.channelzID, "parsed scheme: %q", cc.parsedTarget.Scheme)
// 然后根据scheme从全局Resolver列表中找到对应的resolverBuilder
	resolverBuilder := cc.getResolver(cc.parsedTarget.Scheme)
	if resolverBuilder == nil {
	// 如果指定的scheme找不到对应的resolverBuilder那就用defaultScheme
    // 默认协议为 `passthrough`，它会从用户解析的 target 中直接读取 endpoint 地址
		channelz.Infof(logger, cc.channelzID, "scheme %q not registered, fallback to default scheme", cc.parsedTarget.Scheme)
		cc.parsedTarget = resolver.Target{
			Scheme:   resolver.GetDefaultScheme(),
			Endpoint: target,
		}
		resolverBuilder = cc.getResolver(cc.parsedTarget.Scheme)
		if resolverBuilder == nil {
			return nil, fmt.Errorf("could not get resolver for default scheme: %q", cc.parsedTarget.Scheme)
		}
	}
```

具体获取 resolver 的逻辑如下：

```go
// // clientconn.go 1577行
func (cc *ClientConn) getResolver(scheme string) resolver.Builder {
	for _, rb := range cc.dopts.resolvers {
		if scheme == rb.Scheme() {
			return rb
		}
	}
	return resolver.Get(scheme)
}
// resolver.go 54行
func Get(scheme string) Builder {
	if b, ok := m[scheme]; ok {
		return b
	}
	return nil
}
```

可以看到最终是去 m 这个 map 中获取的 resolverBuilder。

**那么这个 map m 中的 resolverBuilder 是从哪儿来的呢？**

这个 resolver 就是客户端代码中的 init 方法注册进去的，全局 resolverBuild 都存放一个 map 中，key 为 scheme，value 为对应的 resolverBuilder。

```go
func init() {
	// Register the example ResolverBuilder. This is usually done in a package's
	// init() function.
	resolver.Register(&exampleResolverBuilder{})
}
func Register(b Builder) {
	m[b.Scheme()] = b
}
```



接下来就通过 resolverBuilder 构建一个 Resolver 实例。

```go
// clientconn.go 312行
// Build the resolver.
	rWrapper, err := newCCResolverWrapper(cc, resolverBuilder)
	if err != nil {
		return nil, fmt.Errorf("failed to build resolver: %v", err)
	}

// resolver_conn_wapper.go 48行
// newCCResolverWrapper uses the resolver.Builder to build a Resolver and
// returns a ccResolverWrapper object which wraps the newly built resolver.
func newCCResolverWrapper(cc *ClientConn, rb resolver.Builder) (*ccResolverWrapper, error) {
	ccr := &ccResolverWrapper{
		cc:   cc,
		done: grpcsync.NewEvent(),
	}

	var credsClone credentials.TransportCredentials
	if creds := cc.dopts.copts.TransportCredentials; creds != nil {
		credsClone = creds.Clone()
	}
	rbo := resolver.BuildOptions{
		DisableServiceConfig: cc.dopts.disableServiceConfig,
		DialCreds:            credsClone,
		CredsBundle:          cc.dopts.copts.CredsBundle,
		Dialer:               cc.dopts.copts.Dialer,
	}

	var err error

	ccr.resolverMu.Lock()
	defer ccr.resolverMu.Unlock()
    // 调用resolverBuilder的Build方法构建Resolver
	ccr.resolver, err = rb.Build(cc.parsedTarget, ccr, rbo)
	if err != nil {
		return nil, err
	}
	return ccr, nil
}
```



接来下我们看一下 gRPC 内置的 ResolverBuilder 是 Build 方法是怎么实现的，就拿 DNSResolverBuilder 为例，代码如下：

```go
// dns_resolver.go 109行
func (b *dnsBuilder) Build(target resolver.Target, cc resolver.ClientConn, opts resolver.BuildOptions) (resolver.Resolver, error) {
    // 首先依旧是解析target，获取格式化后的 host + port
	host, port, err := parseTarget(target.Endpoint, defaultPort)
	if err != nil {
		return nil, err
	}

	// 对host进行IP格式化处理 如果是IP地址则直接调用cc.UpdateState更新连接信息后返回 不走后续的dns解析逻辑了
	if ipAddr, ok := formatIP(host); ok {
		addr := []resolver.Address{{Addr: ipAddr + ":" + port}}
		cc.UpdateState(resolver.State{Addresses: addr})
		return deadResolver{}, nil
	}

	// 如果是域名则需要进行dns解析
	ctx, cancel := context.WithCancel(context.Background())
	d := &dnsResolver{
		host:                 host,
		port:                 port,
		ctx:                  ctx,
		cancel:               cancel,
		cc:                   cc,
		rn:                   make(chan struct{}, 1),
		disableServiceConfig: opts.DisableServiceConfig,
	}

    // 根据 Authority 判定使用默认Resolver还是自定义Resolver
	if target.Authority == "" {
		d.resolver = defaultResolver
	} else {
		d.resolver, err = customAuthorityResolver(target.Authority)
		if err != nil {
			return nil, err
		}
	}

	d.wg.Add(1)
    // 单独开一个 goroutine watcher 给定域名的 dns 信息变化
	go d.watcher()
    // 强制触发一次更新
	d.ResolveNow(resolver.ResolveNowOptions{})
	return d, nil
}
```

需要继续跟进 Resolver.watcher() 和 Resolver.ResolveNow() 方法。

```go
// dns_resolver.go 189行
// ResolveNow 方法比较简单，只是往 d.rn 这个 channel 里传了一个消息，具体该消息怎么使用是在后续的 watcher 方法里
func (d *dnsResolver) ResolveNow(resolver.ResolveNowOptions) {
	select {
	case d.rn <- struct{}{}:
	default:
	}
}
```



```go
// dns_resolver.go 202行
// watcher 方法也比较简单，通过一个for死循环不断更新
func (d *dnsResolver) watcher() {
	defer d.wg.Done()
	for {
        // 第一个select 只有d.rn这个channel里用消息了才能触发
        // 所以前面的ResolveNow方法实际上是写入了一个标记，让这个select能够退出 从而能够去执行后续逻辑
		select {
		case <-d.ctx.Done():
			return
		case <-d.rn:
		}
		// 进行dns解析 如果成功就调用UpdateState方法更新连接信息
		state, err := d.lookup()
		if err != nil {
			d.cc.ReportError(err)
		} else {
			d.cc.UpdateState(*state)
		}

	    // 第二个select 用一个 timer 来限制dns更新频率
		t := time.NewTimer(minDNSResRate)
		select {
		case <-t.C:
		case <-d.ctx.Done():
			t.Stop()
			return
		}
	}
}
```

所以这里虽然是死循环，但是会阻塞在第一个 select 处，直到 d.rn 有消息后才会执行一个 dns 更新。

> 至于什么地方会往  d.rn 里写消息相关代码比较复杂，等后续LB相关文章分析。

这里还需要继续跟进`d.cc.UpdateState`方法，看下具体是怎么更新的，代码如下：

```go
// resolver_conn_wapper.go 139行
// grpc 底层 LB 组件对每个服务端实例创建一个 subConnection。并根据设定的 LB 策略，选择合适的 subConnection 处理某次 RPC 请求。
func (ccr *ccResolverWrapper) UpdateState(s resolver.State) {
	if ccr.done.HasFired() {
		return
	}
	channelz.Infof(logger, ccr.cc.channelzID, "ccResolverWrapper: sending update to cc: %v", s)
	if channelz.IsOn() {
		ccr.addChannelzTraceEvent(s)
	}
	ccr.curState = s
	ccr.poll(ccr.cc.updateResolverState(ccr.curState, nil))
}
```

此处代码比较复杂，后续在 LB 相关原理文章中再做概述。



## 4. 小结

![name-reslover][name-reslover]

* 1）客户端启动时，注册自定义的 resolver 。
  * 一般在 init() 方法，构造自定义的 resolveBuilder，并将其注册到 grpc 内部的 resolveBuilder 表中（其实是一个全局 map，key 为协议名，value 为构造的 resolveBuilder）。

* 2）客户端启动时通过自定义 Dail() 方法构造 grpc.ClientConn 单例
  * grpc.DialContext() 方法内部解析 URI，分析协议类型，并从 resolveBuilder 表中查找协议对应的 resolverBuilder。
  * 找到指定的 resolveBuilder 后，调用 resolveBuilder 的 Build() 方法，构建自定义 resolver，同时开启协程，通过此 resolver 更新被调服务实例列表。
  * Dial() 方法接收主调服务名和被调服务名，并根据自定义的协议名，基于这两个参数构造服务的 URI
  * Dial() 方法内部使用构造的 URI，调用 grpc.DialContext() 方法对指定服务进行拨号

* 3）grpc 底层 LB 库对每个实例均创建一个 subConnection，最终根据相应的 LB 策略，选择合适的 subConnection 处理某次 RPC 请求。



> 到这里在回头看 Demo 中的自定义 Resolver 应该就没什么问题了。由于只是个 Demo 所以真的非常简单。直接在 Build 中通过 map 存储addr，然后 ResolveNow 时直接从 map 中取出来更新服务实例列表，连 watcher 都省略了。




## 5. 参考

`https://github.com/grpc/grpc-go`

`https://github.com/grpc/grpc/blob/master/doc/naming.md`

`https://blog.csdn.net/ra681t58cjxsgckj31/article/details/104079070`



[Github]:https://github.com/lixd/grpc-go-example
[name-reslover]:https://github.com/lixd/blog/raw/master/images/grpc/name-resolver.png