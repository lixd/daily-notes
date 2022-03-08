# gRPC总结

[从实践到原理，带你参透 gRPC](https://segmentfault.com/a/1190000019608421)





## 1. 概述

### gRPC 组成

gRPC 共由三部分组成。

* 1）网络传输层使用 HTTP2
* 2）序列化协议使用 Protobuf。
* 3）生成桩代码的gRPC Plugins

作为使用者，不需要去开发 gRPC 插件的话,我们只需要知道 HTTP2 和Protobuf 这两部分就行了。



**grpc的优点在于什么？**

高兼容性、高性能、使用简单



### 应用场景

**常见的场景是后端服务之间进行调用**，除此之外，grpc还使用与移动端，通过grpc-web也可以在浏览器中使用grpc，当然对于grpc-web当前还是需要envoy做协议兼容，另外grpc-web对于前端来说不是很友好，也有相当的学习成本，且不支持gprc bidi模式。grpc-web的优点在于前后端接口统一。

> 移动端、网页端和开放API端都可使用grpc来调用服务。





## 2. HTTP/2

[HTTP/2-rfc7540](https://httpwg.org/specs/rfc7540.html)

[HTTP/2-rfc7540-zh-CN](https://github.com/abbshr/rfc7540-translation-zh_cn)



### gRPC 为什么选择 HTTP/2

在社区里看到过官方的说法，就是为了最大程度的**兼容性**。

私有协议最大的问题就是兼容性,拿负载均衡为例：

现在市面上开源的 LoadBalance 没几个支持 thrift 的，而 gRPC则不同，你能想到的基本都支持 gRPC。大家想过原因么？

原因就是 gRPC 基于 HTTP2，现在主流的 LB 都要支持 http2，那么自然就支持gRPC 了。



### HTTP 发展史

HTTP/1.0 是个老古董，最大的槽点是**短连接**。

HTTP/1.1 的 **Keepalive** 解决了 HTTP1.0 最大的性能问题，并且增加了丰富的 header语义。

但 HTTP/1.1 也不完美，HTTP/1.1 的问题在于**队头阻塞 ( head of line blocking)**。一个连接只能跑一个请求，在这个请求没返回数据之前，其他请求就不能占用该连接。如果你有N个并发请求，那么就需要N个连接，问题是浏览器让你开这么多连接么？

**浏览器针对一个域名是有连接限制的**，像 Chrome 是 6个 连接，Safari 也为6个。

如果首页有100个资源，浏览器的连接又被限制为6个，那么100个资源回被浏览器排队等待。

于是才出现了下面这些优化方案：

* css sprites
* js/css combine
* 压缩数据
* cookie free
* 域名分片
* 缓存
* ...





### HTTP/1.1 VS HTTP/2

[akamai](https://http2.akamai.com/demo) 提供了HTTP/1.1 VS HTTP/2 的测试页面。下面的地图是由几百个小图片组成的。测试方式为先使用 HTTP/1.1 请求，再通过 HTTP/2 请求。通过时间对比，我们可以分析出 HTTP/2 由于多路复用，要比 HTTP/1.1 快的多。

![](assets/HTTP1.1 VS HTTP2.png)



那么，如果浏览器不限制连接数，HTTP/1.1是否可以跟 HTTP/2 一样的效果？ 不行的，依旧有几个问题，新的连接要 3次 握手，TLS 也要握手，之后还要经历TCP 拥塞控制下的慢启动。这些连接启动后是否要一直保持？ 那么保持这些连接对比客户端和服务端都有一定的负担，比如 TCP 级别的心跳，由内核依赖定时器来发送，对端也要接收该报文更正定时器，等等。

> 类似于 Redis Pipeline，可以省去一些 RTT。



### HTTP/2 概述

HTTP/2 的优点：

* 二进制分帧（Binary Format）- http2.0的基石
  * HTTP/2 之所以能够突破 HTTP/1.1 的性能限制，改进传输性能，实现低延迟和高吞吐量，就是因为其新增了二进制分帧层。

* 多路复用
  * 实际上叫做连接共享更合适
* header 压缩
* 流控
* 优先级
* 服务端推送

 

**HTTP/2 是二进制协议**，最小单位是 frame，一个请求需要 header frame、data frame 两个帧的。stream 是 HTTP/2 抽象的流，每个 stream 都有 id，通过 id 来区分并发过来的请求。

HTTP/2 最大的优点是**多路复用**，这里的多路复用不是指传统类似 epoll 对 TCP 连接的复用，而是协议层的多路复用，把一个个的请求封装成 stream 流，这些流是可以并发交错请求，没有 HTTP/1.1 那种队头阻塞问题。



## 3. Protobuf

Protocol buffers 是一个灵活的、高效的、自动化的用于对结构化数据进行序列化的协议。

> 更多信息参考这篇文章：[protobuf教程(二)---核心编码原理](https://www.lixueduan.com/post/protobuf/02-encode-core/)

Protocol buffers 核心就是对单个数据的编码（Varint编码）和对数据整体的编码（Message Structure 编码）。



###  Varint 编码

> protobuf 编码主要依赖于 Varint 编码。

Varint 是一种紧凑的表示数字的方法。它用一个或多个字节来表示一个数字，值越小的数字使用越少的字节数。这能减少用来表示数字的字节数。

Varint 中的每个字节（最后一个字节除外）都设置了最高有效位（msb），这一位表示是否还会有更多字节出现。

> 类似于可变长的 UTF8 编码，如果首位为 1 说明这个字节后面还有内容。

编码方式

* 1）将被编码数转换为二进制表示
* 2）从低位到高位按照 7位 一组进行划分
* 3）将大端序转为小端序，即以分组为单位进行首尾顺序交换
  * 因为 protobuf 使用是小端序，所以需要转换一下
* 4）给每组加上最高有效位(最后一个字节高位补0，其余各字节高位补1)组成编码后的数据。
* 5）最后转成 10 进制。

![varints-encode][varints-encode]

图中对数字123456进行 varint 编码：

* 1）123456 用二进制表示为`1 11100010 01000000`，
* 2）每次从低向高取 7位 变成`111` `1000100` `1000000`
* 3）大端序转为小端序，即交换字节顺序变成`1000000` `1000100` `111` 
* 4）然后加上最高有效位(即：最后一个字节高位补0，其余各字节高位补1)变成`11000000` `11000100` `00000111` 
* 5）最后再转成 10进制，所以经过 varint 编码后 123456 占用三个字节分别为`192 196 7`。



不过 Varint 编码对负数不友好，所以 Protobuf 中又使用 ZigZag 编码将符号数统一映射到无符号号数，然后再事宜 Varint 进行编码。

具体映射函数为：

| `1 2 3 ` | `Zigzag(n) = (n << 1) ^ (n >> 31), n 为 sint32 时 Zigzag(n) = (n << 1) ^ (n >> 63), n 为 sint64 时 ` |
| -------- | ------------------------------------------------------------ |
|          |                                                              |

比如：对于0 -1 1 -2 2映射到无符号数 0 1 2 3 4。

| 原始值 | 映射值 |
| :----- | :----- |
| 0      | 0      |
| -1     | 1      |
| 1      | 2      |
| 2      | 3      |
| -2     | 4      |



### Message Structure 编码

protocol buffer 中 message 是一系列键值对。message 的二进制版本只是使用字段号(field’s number 和 wire_type)作为 key。每个字段的名称和声明类型只能在解码端通过引用消息类型的定义（即 `.proto` 文件）来确定。这一点也是人们常常说的 protocol buffer 比 JSON，XML 安全一点的原因，如果没有数据结构描述 `.proto` 文件，拿到数据以后是无法解释成正常的数据的。

编码后结果如下

![pb_message_structure_encoding][pb_message_structure_encoding]

当消息编码时，键和值被连接成一个字节流。当消息被解码时，解析器需要能够跳过它无法识别的字段。这样，可以将新字段添加到消息中，而不会破坏不知道它们的旧程序。这就是所谓的 “向后”兼容性。

**wire_type**

在 protobuf 中的 wire_type 取值如下表：

| Type | Meaning          | Userd For                                            |
| :--- | :--------------- | :--------------------------------------------------- |
| 0    | Varint           | int32,int64,uint32,uint64,sint32,sint64,bool,enum    |
| 1    | 64-bit           | fixed64,sfix64,double                                |
| 2    | Length-delimited | string,bytes,embedded messages,oacked repeated field |
| 3    | Strart Group     | groups(deprecated)                                   |
| 4    | End Group        | groups(deprecated)                                   |
| 5    | 32-bit           | fixed 32,sfixed32,float                              |

其中 3、4已经废弃了，可选值为0、1、2、5。



**Tag**

key 是使用该字段的 field_number 与wire_type 取|(或运算)后的值，field_number 是定义 proto 文件时使用的 tag 序号

左移3位是因为wire_type最大取值为5，需要占3个bit，这样左移+或运算之后得到的结果就是，高位为field_number，低位为wire_type。

比如下面这个 message 中字段 a 的 tag 序号就是 1：

```protobuf
message Test {
  required int32 a = 1;
}
```

field_number=1，wire_type=0，按照公式计算`(1«3|0) = 1000`

低三位 000 表示wire_type=0；

高位 1 表示field_number=1。

再使用 Varints 编码后结果就是 08



[varints-encode]:https://github.com/lixd/blog/raw/master/images/protobuf/varints-encode.png

[pb_message_structure_encoding]:https://github.com/lixd/blog/raw/master/images/protobuf/pb_message_structure_encoding.png