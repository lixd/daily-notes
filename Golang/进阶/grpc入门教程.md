# gRPC

## 概述

在 gRPC 里*客户端*应用可以像调用本地对象一样直接调用另一台不同的机器上*服务端*应用的方法，使得您能够更容易地创建分布式应用和服务。与许多 RPC 系统类似，gRPC 也是基于以下理念：定义一个*服务*，指定其能够被远程调用的方法（包含参数和返回类型）。在服务端实现这个接口，并运行一个 gRPC 服务器来处理客户端调用。在客户端拥有一个*存根*能够像服务端一样的方法。



一个高性能、通用的开源RPC框架，其由Google主要面向移动应用开发并基于HTTP/2协议标准而设计，基于ProtoBuf(Protocol Buffers)序列化协议开发，且支持众多开发语言。 gRPC基于HTTP/2标准设计，带来诸如双向流控、头部压缩、单TCP连接上的多复用请求等特性。这些特性使得其在移动设备上表现更好，更省电和节省空间占用。

### 性能 gRPC/Thrift

从压测的结果商米我们可以得到以下重要结论：

- 整体上看，长连接性能优于短连接，性能差距在两倍以上；
- 对比Go语言的两个RPC框架，Thrift性能明显优于gRPC，性能差距也在两倍以上；
- 对比Thrift框架下的的两种语言，长连接下Go 与C++的RPC性能基本在同一个量级，在短连接下，Go性能大概是C++的二倍；
- 两套RPC框架，以及两大语言运行都非常稳定，5w次请求耗时约是1w次的5倍；

> 这里主要要回答的一个问题是既然已经用thrift并且性能还是grpc的2倍为什么还要用grpc呢？

这里主要要说到两个Go的微服务框架，go-kit和istio

- go-kit 支持thrift但是在thrift的情况下不支持链路追踪
- istio因为是无侵入式连thrift也不支持

主要的导致这个问题的原因在于thrift的传输方式是通过TCP的方式传输，对于这些框架想在传输过程中加入些链路的ID是无法实现的，istio连对于thrift的请求次数感知都做不到，对于grpc因为是基于http2在harder头上可以做很多补充参数，对于这类微服务框架非常友好。

gRPC 默认使用 **protocol buffers**，这是 Google 开源的一套成熟的结构数据序列化机制（当然也可以使用其他数据格式如 JSON）。

## Quick Start

#### env

* gRPC 需要 go 1.6以上

#### 安装gRPC

```go
go get -u google.golang.org/grpc
```

#### 安装protobuf

* 1.下载编译器

```go
https://github.com/golang/protobuf
```

* 2.插件

```go
 $ go get -u github.com/golang/protobuf/protoc-gen-go
```



