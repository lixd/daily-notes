# HTTP

> [HTTP/1.1-rfc7230](https://datatracker.ietf.org/doc/html/rfc7230)
>
> [HTTP/2-rfc7540](https://httpwg.org/specs/rfc7540.html)
>
> [HTTP/2-rfc7540-zh-CN](https://github.com/abbshr/rfc7540-translation-zh_cn)
>
> [深入理解 Web 协议 (三)：HTTP 2](https://segmentfault.com/a/1190000039262103)



## 1. 概述

HTTP/1.0 短连接，效率低。

> TCP 三次握手 slow start 等

HTTP1.1 KeepAlive 复用 TCP 连接，但是依旧存在队头阻塞问题。

> 发送一个请求后，必须等Server返回才能发送下一个请求，如果处理慢则后续请求都会被阻塞

虽然引入了pipeline技术，可以同时发送多个请求，但是Server在响应时需要按照顺序响应，如果第一个请求比较耗时还是会阻塞。

> Redis pipeleine也是要顺序返回，所以如果队列中有耗时操作也会阻塞。



为了实现并发性，HTTP1.x 都需要建立多个连接。

此外，每个请求都会重复发送HTTP报头。



HTTP/2通过定义一个优化的HTTP语义到底层连接的映射来解决这些问题。具体来说，它允许请求和响应交错地使用同一个连接，并可以使用高效编码的HTTP报头。它还允许请求具有优先级，让更重要的请求更快速地完成，这进一步提高了性能。

此外，通过使用二进制消息帧，HTTP/2也能更有效地处理消息。



因为只会出一个版本，所以直接叫做HTTP/2，而不是HTTP/2.0。





## 2.建立连接

HTTP/2 有两个标识：

* h2：使用了 TLS 的HTTP/2
* h2c：明文传输的 HTTP/2

> 所以：HTTP/2 也是可以不带 TLS 的。



具体流程可以分为以下两步：

* 1）协议协商(HTTP/1.x升级到HTTP/2)
* 2）连接初始化

h2 和 h2c 主要区别在协议协商这一步。



### 前置

#### Connection Preface

> 一般翻译为连接序言或者连接前奏

客户端连接序言以一个 24字节 的序列开始，用 16 进制表示为：

```shell
0x505249202a20485454502f322e300d0a0d0a534d0d0a0d0a
```

转换成 ASCII 就是：

```shell
PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n
```

> 注意：客户端的 Connection Preface 是专门挑选的，目的是为了让大部分 HTTP/1.1 或 HTTP/1.0 服务器和中介不会试图处理后面的帧。

服务端 Connection Preface 包含一个可能为空的 SETTINGS 帧，它必须是服务端在 HTTP/2 连接中发送的第一个帧。



在发送完本端的 connection preface 之后，必须对来自对端的作为 connection preface 一部分的 SETTINGS 帧进行确认。

当 Client 或者 Server 端收到对方的 Connection Preface 的请求之后，都需要给出 ACK：

- 对于 Client 来说，Server 的 ACK 可能是 Server 接受了 Client 端的 Setting 之后，反馈回来的 Connection Preface
- 对于 Server 端来说，Client 的 ACK 就是一个带 ACK 标记的 Setting Frame



#### Setting Frame

在 HTTP/2  中，Setting Frame 用于协调 Client 和 Server 双方的通信配置信息。

在初始化连接时，RFC 要求双方都必须发送 Setting Frame，且接收到的对方必须给予 ACK（带 ACK flag 的 Setting Frame）。

> Client 和 Server 可以多次发送 Setting Frame，并且双方都以收到的最新的 Setting 进行处理。



目前已经定义在 RFC 中的有：

- SETTINGS_HEADER_TABLE_SIZE (0x1)
- SETTINGS_ENABLE_PUSH (0x2)
- SETTINGS_MAX_CONCURRENT_STREAMS (0x3)
- SETTINGS_INITIAL_WINDOW_SIZE (0x4)
- SETTINGS_MAX_FRAME_SIZE (0x5)
- SETTINGS_MAX_HEADER_LIST_SIZE (0x6)

其他如果没有定义的出现在 Setting Frame 里面，将会被忽略。



####  HTTP2-Settings 首部字段

从 HTTP/1.1 升级到 HTTP/2 的请求必须包含且只包含一个 HTTP2-Settings 首部字段。HTTP2-Settings 是一个连接相关的首部字段，它提供了用于管理 HTTP/2 连接的参数（前提是服务端接受了升级请求）。

```shell
HTTP2-Settings    = token68
```

如果该首部字段没有出现，或者出现了不止一个，那么服务端一定不能把连接升级到 HTTP/2。

HTTP2-Settings 首部字段的值是 SETTINGS 帧(6.5节)的有效载荷，被编码成了 base64url 串。

就像对其他的 SETTINGS 帧那样，服务端对这些值进行解码和解释。对这些设置进行显式的确认是没有必要的，因为 101 响应本身就相当于隐式的确认。

升级请求中提供这些值，让客户端有机会在收到服务端的帧之前就设置一些参数。



### 连接建立流程

#### h2c

当客户端不知道服务器是否支持 HTTP/2 时，可以先用 HTTP/1.1 向服务器发一个请求，在请求上带上一个 Header：**`Upgrade: h2c`**，然后 RFC 文档规定这样的请求还必须带一个(有且只能有一个) HTTP2-Settings Header。

就像下面这样：

```shell
GET / HTTP/1.1
Host: server.example.com
Connection: Upgrade, HTTP2-Settings
Upgrade: h2c
HTTP2-Settings: <base64url encoding of HTTP/2 SETTINGS payload>
```

服务端收到这样的请求就会做特殊处理。

**如果服务端不支持 HTTP/2**，那么Upgrade 首部字段会被忽略掉，还是当做一个普通的 HTTP/1.1 请求处理并响应：

```shell
HTTP/1.1 200 OK
Content-Length: 243
Content-Type: text/html
...
```

**如果服务端支持 HTTP/2**，那么会返回状态码 101 (Switching Protocols)，表示接受升级协议的请求。

> **注意**：如果客户端发送的是 Upgrade: h2 那么服务端必须也忽略掉，因为 h2 的协议协商和 h2c 不一样。

这就是**协议协商**过程，后续就进入**连接初始化**步骤了。

协议协商完成后双方需要互相发送 Connection Preface 以初始化连接。

服务端的 Connection Preface 可以和上面的 101 状态码一并返回，就像这样：

```shell
HTTP/1.1 101 Switching Protocols
Connection: Upgrade
Upgrade: h2c

[ HTTP/2 connection ...
```

上述 101 响应中的 body 里面，包含服务器的 Connection Preface，里面也包含 Server 端的 Setting 信息。

这里有个细节需要注意，请求中有一个 Header 名为：**HTTP2-Settings**，里面放的是 HTTP/2 的 Setting 信息，也就是说，如果服务器支持 HTTP/2 ，那么就会使用这个 Setting 进行 HTTP/2  初始化。

虽然这里 Client 发送了一个 HTTP2-Settings，但是 RFC 要求 Cleint 端在收到 101 响应之后还应该再发送一个 Setting Frame，并且将覆盖初始的 Setting。



#### 带先验知识的 h2c

除了发送一个 HTTP 请求之外，客户端可以通过其他方式了解服务端是否支持 HTTP/2。

> 如果明确知道服务端支持 HTTP/2 的话协议协商这一步可以省略了，直接进入连接初始化步骤。

Client 直接向服务端发送 Connection Preface，然后 Server 如果真的支持 HTTP/2 的话，那么也必须响应一个 Connection Preface，最后 Client 端就可以和 Server 端愉快地进行 HTTP/2 通信了。

> 注意：**这只影响基于明文 TCP 的 HTTP/2 连接**。基于 TLS 的 HTTP/2 实现必须使用 TLS 中的协议协商*[TLS-ALPN]*。



#### h2

因为 TLS 在网络协议栈中的特殊性（介于 Transport Layer 和 Application Layer），所以，Google 就提出了可以在 TLS 握手的时候进行 Application Layer 的协议协商，初版为 NPN（Next Protocol Negotiation)，后被抛弃，转为 ALPN（Application Layer Protocol Negotiation）。

也就是说，支持在 TLS 握手期间协商应用层是否使用 http2，这样，当 TLS 通道建立完成之后，已经知道 Server 端是否支持 http2 了，。

> 可以理解成此时已经完成了协议协商，或者说已经拥有 先验知识了。 

后续则进入 连接初始化 步骤。如果支持，那么就是来回的一个 Connection Preface，如果不支持，那么就是普通的 http/1.1 的 https。

ALPN 的协商信息是在 https 的 Client Hello 阶段发送的，一个示例的 Client Hello 信息为：

```shell
    Handshake Type: Client Hello (1)
    Length: 141
    Version: TLS 1.2 (0x0303)
    Random: dd67b5943e5efd0740519f38071008b59efbd68ab3114587...
    Session ID Length: 0
    Cipher Suites Length: 10
    Cipher Suites (5 suites)
    Compression Methods Length: 1
    Compression Methods (1 method)
    Extensions Length: 90
    [other extensions omitted]
    Extension: application_layer_protocol_negotiation (len=14)
        Type: application_layer_protocol_negotiation (16)
        Length: 14
        ALPN Extension Length: 12
        ALPN Protocol
            ALPN string length: 2
            ALPN Next Protocol: h2
            ALPN string length: 8
            ALPN Next Protocol: http/1.1
```





#### Connection Preface

在 HTTP/2 连接中，要求两端都要发送一个连接序言，作为对所使用协议的最终确认，并确定 HTTP/2 连接的初始设置。客户端和服务端各自发送不同的连接序言。

客户端连接序言以一个24字节的序列开始，用十六进制表示为：

```
0x505249202a20485454502f322e300d0a0d0a534d0d0a0d0a
```

转成 ASCII 就是这样：

```shell
PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n
```







## 3. 演示

### Demo

简单地启动一个 HTTP/2 服务。

```go
package main

import (
	"fmt"
	"net/http"

	"github.com/pkg/errors"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
)

func indexHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(http.StatusOK)
	message := fmt.Sprintf("Hello %s!", r.UserAgent())
	w.Write([]byte(message))
}

func main() {
	server := &http.Server{
		Addr: ":9876",
		Handler: h2c.NewHandler(
			http.HandlerFunc(indexHandler),
			&http2.Server{},
		),
	}

	if err := server.ListenAndServe(); err != nil {
		panic(err)
	}
}
```



```shell
$ go run main.go
```



### 请求

使用 curl 请求一下，添加`-v` 标记打印出详细信息

```shell
$ curl --http2 -v http://localhost:9876
*   Trying 127.0.0.1:9876...
* TCP_NODELAY set
* Connected to localhost (127.0.0.1) port 9876 (#0)
> GET / HTTP/1.1
> Host: localhost:9876
> User-Agent: curl/7.68.0
> Accept: */*
> Connection: Upgrade, HTTP2-Settings
> Upgrade: h2c
> HTTP2-Settings: AAMAAABkAARAAAAAAAIAAAAA
>
* Mark bundle as not supporting multiuse
< HTTP/1.1 101 Switching Protocols
< Connection: Upgrade
< Upgrade: h2c
* Received 101
* Using HTTP2, server supports multi-use
* Connection state changed (HTTP/2 confirmed)
* Copying HTTP/2 data in stream buffer to connection buffer after upgrade: len=0
* Connection state changed (MAX_CONCURRENT_STREAMS == 250)!
< HTTP/2 200
< content-type: text/plain
< content-length: 18
< date: Mon, 07 Mar 2022 06:44:15 GMT
<
* Connection #0 to host localhost left intact
Hello curl/7.68.0!%
```



### h2

直接访问一个 基于 TLS 的 HTTP/2 网站试一下:

```shell
$ curl --http2 -v https://www.tmall.com  
   Trying 219.153.35.232:443...
* TCP_NODELAY set
* Connected to www.tmall.com (219.153.35.232) port 443 (#0)
* ALPN, offering h2
* ALPN, offering http/1.1
* successfully set certificate verify locations:
*   CAfile: /etc/ssl/certs/ca-certificates.crt
  CApath: /etc/ssl/certs
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* TLSv1.2 (IN), TLS handshake, Certificate (11):
* TLSv1.2 (IN), TLS handshake, Server key exchange (12):
* TLSv1.2 (IN), TLS handshake, Server finished (14):
* TLSv1.2 (OUT), TLS handshake, Client key exchange (16):
* TLSv1.2 (OUT), TLS change cipher, Change cipher spec (1):
* TLSv1.2 (OUT), TLS handshake, Finished (20):
* TLSv1.2 (IN), TLS handshake, Finished (20):
* SSL connection using TLSv1.2 / ECDHE-ECDSA-AES128-GCM-SHA256
* ALPN, server accepted to use h2
* Server certificate:
*  subject: C=CN; ST=ZheJiang; L=HangZhou; O=Alibaba (China) Technology Co., Ltd.; CN=*.tmall.com
*  start date: Sep 16 03:51:03 2021 GMT
*  expire date: Oct 18 03:51:03 2022 GMT
*  subjectAltName: host "www.tmall.com" matched cert's "*.tmall.com"
*  issuer: C=BE; O=GlobalSign nv-sa; CN=GlobalSign Organization Validation CA - SHA256 - G2
*  SSL certificate verify ok.
* Using HTTP2, server supports multi-use
* Connection state changed (HTTP/2 confirmed)
* Copying HTTP/2 data in stream buffer to connection buffer after upgrade: len=0
* Using Stream ID: 1 (easy handle 0x55751a274800)
> GET / HTTP/2
> Host: www.tmall.com
> user-agent: curl/7.68.0
> accept: */*
>
* Connection state changed (MAX_CONCURRENT_STREAMS == 128)!
< HTTP/2 200 
< server: Tengine
< content-type: text/html; charset=utf-8
< vary: Accept-Encoding
< date: Mon, 07 Mar 2022 06:58:38 GMT
< x-server-id: 28c3d6b2523ca52c32ad72931842b19a5638aaee493d492979dba33b8c5562ed66d7bc0eaed84f7d
< x-air-hostname: air-ual033007008180.center.na620
< x-air-trace-id: 7909cb2116466363180021673e
< vary: Accept-Encoding, Origin, Ali-Detector-Type, X-Host
< cache-control: max-age=0, s-maxage=149
< etag: W/"5e62-0tMic2ejfXXsD1z/5z3BSlfnlyE"
< x-readtime: 52
< x-via: cn3780.l1, cache6.cn3780, l2cn1851.l2, cache47.l2cn1851, wormholesource033006234216.center.na620
< x-air-source: proxy
< x-xss-protection: 1; mode=block
< eagleeye-traceid: 7909cb2116466363180021673e
< strict-transport-security: max-age=31536000
< timing-allow-origin: *, *
< ali-swift-global-savetime: 1646636318
< via: cache47.l2cn1851[261,105,304-0,C], cache36.l2cn1851[107,0], cache19.cn3668[0,0,200-0,H], cache24.cn3668[1,0]
< x-snapshot-date: 1646455392296
< age: 70
< x-cache: HIT TCP_MEM_HIT dirn:11:1039225653
< x-swift-savetime: Mon, 07 Mar 2022 06:58:38 GMT
< x-swift-cachetime: 149
< x-air-pt: pt0
< eagleid: db99232c16466363880817314e
// 省略中间的一大段html
* Connection #0 to host www.tmall.com left intact

```



### Wireshark抓包

todo

