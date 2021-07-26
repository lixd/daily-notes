---
title: "一次HTTP(S)请求究竟需要多少流量?Wireshark抓包分析"
description: "通过Wireshark抓包分析一次HTTP(S)请求究竟需要多少流量，和 HTTP 请求的执行流程"
date: 2021-07-23
draft: false
categories: ["Network"]
tags: ["Network"]
---

本文主要通过 Wireshark 抓包分析了一次 HTTP(S) 请求究竟需要多少流量，同时也分析了一下整个 HTTP 请求的执行流程。

<!--more-->

## 1. 背景

最近查询监控，观察到某个负载的带宽峰值在最高的时候都达到了近 30M，然后查了对应时间段的系统 QPS，发现确实是有一个明细的峰值，但是也不应该有这种多流量吧？

> 根据QPS和接口响应数据大致计算下来，最多 5M 带宽就够了。

后续对接口响应进行了优化和精简，整体响应数据降低了 20% 左右，但是负载的带宽峰值还是没什么变化，有降低但是并不明显。

HTTP 响应除了包含我们业务数据的`响应体`之外还有`状态行`和`响应头`，这些都是要算流量的，所以多出的流量是不是在这些地方呢？

对比了几个请求后发现，虽然这部分会消耗一定流量，但是并不多，还没有业务数据多呢。

这就很奇怪了，也找不到流量到底消耗到哪儿去了，于是想着通过抓包来分析一下。



## 2. 抓包分析

没办法，HTTP 层找不到原因只能从更底层找了，这里使用的是`Wireshark`工具进行抓包分析。

具体的抓包结果如下图所示：

> 由于一台机器上网络请求较多，我加了筛选条件，仅显示客户端和服务端通信的网络请求，所以请求的序号是不连续的。

![ws-tcp-3][ws-tcp-3]

![ws-tls][ws-tls]

![ws-logic][ws-logic]]

> 因为没有保存，导致有部分截图漏掉了，所以又抓了一次，下面是第二次抓包的结果。

![ws-keep-alive][ws-keep-alive]

![ws-tcp-4][ws-tcp-4]



按阶段拆分了一下，可以看到整个流程可以分为 5 个阶段：

* 1）TCP 3 次握手
* 2）TLS 握手
* 3）正常业务请求
* 4）Keep-Alive 保持连接
* 5）TCP 4 次挥手



TCP 三次握手，四次挥手详情见[计算机网络(二)---TCP三次握手四次挥手](https://www.lixueduan.com/post/network/02-tcp-connection/)



### 2.1 TCP 三次握手

![ws-tcp-3][ws-tcp-3]

首先是 三次握手，毕竟 HTTP 也是基于 TCP 的，所以需要先建立 TCP 连接。

<img src="https://github.com/lixd/blog/raw/master/images/network/tcp-connection-three.jpg" style="zoom:67%;" />

从图中可以看到，客户端发送两次请求，总共 66+54 字节，服务端一次请求共 66 字节。

### 2.2 TLS 握手

![ws-tls][ws-tls]

由于是 HTTPS，所以还需要进行额外的一个 TLS 握手，具体步骤如下：

* 1）客户端提供【客户端随机数、可选算法套件、sessionId】等信息
* 2）服务端提供【服务端随机数、选用算法套件、sessionId】等信息
* 3）服务端提供证书
* 4）服务端与客户端互换算法需要的参数
* 5）客户端根据前面提到的随机数和参数生成master secret，确认开始使用指定算法加密，并将握手信息加密传输给服务端，用来校验握手信息、秘钥是否正确
* 6）服务端进行与（5）一样的操作
* 7）客户端、服务端可以用master secret进行加密通讯

从截图或者步骤中可以看到，服务端需要提供证书给客户端，所以肯定会耗费较多的流量。

客户端：571(步骤1)+54(ACK)+147(步骤4)+153(步骤5)+576(步骤5)

服务端：60(ACK)+1446(步骤2)+1446(步骤3)+220(步骤4)+60(ACK)+312(步骤6)

### 2.3 业务请求

![ws-logic][ws-logic]

建立 TLS 连接后才能进行真正的业务请求，这里一共进行了 3 个请求。

客户端：189(业务数据)+54(ACK)+268(业务数据)+54(ACK)+683(业务数据)+54(ACK)

服务端：636(业务数据)+92+350(业务数据)+92+257(业务数据)+92



### 2.4 Keep-Alive

![ws-keep-alive][ws-keep-alive]

为了防止连接被关闭，客户端会自动发送 Keep-Alive 请求来保持连接。

> 必须要在 HTTP Request 中开启 Keep-Alive 才行

每个心跳包：客户端 55 字节，服务端 66 字节。



### 2.5 TCP 四次挥手

最后则是 TCP 的四次挥手了。

![ws-tcp-4][ws-tcp-4]

<img src="https://github.com/lixd/blog/raw/master/images/network/tcp-close-connection-four.jpg" style="zoom: 67%;" />

客户端：54+54

服务端：60+60



## 3. 结论

经过前面的分析，基本上已经可以确定流量到底是消耗在哪个阶段了，这里还是总结一下，具体流量消耗请求见下表：

| CS / 阶段 | TCP 3 次握手 | TLS 握手 | 正常业务请求 | Keep-Alive 保持连接 | TCP 4 次挥手 | 总计 |
| --------- | ------------ | -------- | ------------ | ------------------- | ------------ | ---- |
| Client    | 120          | 1510     | 1302         | 55                  | 105          | 3092 |
| Server    | 66           | 3544     | 1515         | 66                  | 120          | 5311 |

从表格中可以看到，一共发起了 3 个 HTTP 请求，客户端消耗了 3092 字节，服务端则多达 5311 字节。

客户端真正发送的业务数据为：1140 字节，占比 36%

服务端真正的响应数据为 1243 字节，占比只有 23%。

不管是客户端还是服务端 TLS 握手消耗占比都超过了 50%，这也是为什么要保持连接，不然每请求一次都要走一遍 TLS 握手，那这个消耗可太大了。

> 理论上讲 HTTP 肯定是比 HTTPS 快的，但是 HTTPS 多了 TLS 层极大增强了安全性，相比之下还是安全更重要，这也是为什么现在大部分网站都上 HTTPS 了。

这也印证了为什么负载带宽这么高，且减少响应数据后带宽变化不大。毕竟真正消耗带宽的地方并不是业务数据。





[ws-tcp-3]:https://github.com/lixd/blog/raw/master/images/network/http-flow/ws-tcp-3.png
[ws-tls]:https://github.com/lixd/blog/raw/master/images/network/http-flow/ws-tls.png
[ws-logic]:https://github.com/lixd/blog/raw/master/images/network/http-flow/ws-logic.png
[ws-keep-alive]:https://github.com/lixd/blog/raw/master/images/network/http-flow/ws-keep-alive.png
[ws-tcp-4]:https://github.com/lixd/blog/raw/master/images/network/http-flow/ws-tcp-4.png

