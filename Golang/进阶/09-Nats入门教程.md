# Nats入门教程

## 1. 概述

NATS是一个开源、轻量级、高性能的分布式消息中间件，实现了高可伸缩性和优雅的Publish/Subscribe模型，使用Golang语言开发。NATS的开发哲学认为高质量的QoS应该在客户端构建，故只建立了Request-Reply，不提供 1.持久化 2.事务处理 3.增强的交付模式 4.企业级队列。

## 2. 使用

### 1.基于Docker 安装服务端

```go
// 拉取镜像
> docker pull nats:latest
//运行nats
> docker run -p 4222:4222 -ti nats:latest
```

### Install

## 建立

下载并安装[NATS Streaming Server](https://github.com/nats-io/nats-streaming-server/releases)。

克隆以下存储库：

- NATS流媒体服务器： `git clone https://github.com/nats-io/nats-streaming-server.git`
- NATS流媒体客户端： `git clone https://github.com/nats-io/stan.go.git`

### 3. 运行服务端

两种选择：

运行您下载的二进制文件，例如： `$ ./nats-streaming-server`

或者，从源代码运行：

```sh
> cd $GOPATH/src/github.com/nats-io/nats-streaming-server
> go run nats-streaming-server.go
```

您应该看到以下内容，表明NATS Streaming Server正在运行：

```sh
> go run nats-streaming-server.go
[59232] 2019/05/22 14:24:54.426344 [INF] STREAM: Starting nats-streaming-server[test-cluster] version 0.14.2
[59232] 2019/05/22 14:24:54.426423 [INF] STREAM: ServerID: 3fpvAuXHo3C66Rkd4rmfFX
[59232] 2019/05/22 14:24:54.426440 [INF] STREAM: Go version: go1.11.10
[59232] 2019/05/22 14:24:54.426442 [INF] STREAM: Git commit: [not set]
[59232] 2019/05/22 14:24:54.426932 [INF] Starting nats-server version 1.4.1
[59232] 2019/05/22 14:24:54.426937 [INF] Git commit [not set]
[59232] 2019/05/22 14:24:54.427104 [INF] Listening for client connections on 0.0.0.0:4222
[59232] 2019/05/22 14:24:54.427108 [INF] Server is ready
[59232] 2019/05/22 14:24:54.457604 [INF] STREAM: Recovering the state...
[59232] 2019/05/22 14:24:54.457614 [INF] STREAM: No recovered state
[59232] 2019/05/22 14:24:54.711407 [INF] STREAM: Message store is MEMORY
[59232] 2019/05/22 14:24:54.711465 [INF] STREAM: ---------- Store Limits ----------
[59232] 2019/05/22 14:24:54.711471 [INF] STREAM: Channels:                  100 *
[59232] 2019/05/22 14:24:54.711474 [INF] STREAM: --------- Channels Limits --------
[59232] 2019/05/22 14:24:54.711478 [INF] STREAM:   Subscriptions:          1000 *
[59232] 2019/05/22 14:24:54.711481 [INF] STREAM:   Messages     :       1000000 *
[59232] 2019/05/22 14:24:54.711485 [INF] STREAM:   Bytes        :     976.56 MB *
[59232] 2019/05/22 14:24:54.711488 [INF] STREAM:   Age          :     unlimited *
[59232] 2019/05/22 14:24:54.711492 [INF] STREAM:   Inactivity   :     unlimited *
[59232] 2019/05/22 14:24:54.711495 [INF] STREAM: ----------------------------------
```

### 4. 运行发布者客户端

布多条消息。对于每个出版物，您应该得到一个结果。

```sh
> cd $GOPATH/src/github.com/nats-io/stan.go/examples/stan-pub
> go run main.go foo "msg one"
Published [foo] : 'msg one'
> go run main.go foo "msg two"
Published [foo] : 'msg two'
> go run main.go foo "msg three"
Published [foo] : 'msg three'
```

### 5.运行订户客户端

使用该`--all`标志接收所有已发布的消息。

```sh
> cd $GOPATH/src/github.com/nats-io/stan.go/examples/stan-sub
> go run main.go --all -c test-cluster -id myID foo
Connected to nats://localhost:4222 clusterID: [test-cluster] clientID: [myID]
subscribing with DeliverAllAvailable
Listening on [foo], clientID=[myID], qgroup=[] durable=[]
[#1] Received on [foo]: 'sequence:1 subject:"foo" data:"msg one" timestamp:1465962202884478817 '
[#2] Received on [foo]: 'sequence:2 subject:"foo" data:"msg two" timestamp:1465962208545003897 '
[#3] Received on [foo]: 'sequence:3 subject:"foo" data:"msg three" timestamp:1465962215567601196
```

### 6. 探索其他订阅选项

```sh
 	--seq <seqno>                   Start at seqno
    --all                           Deliver all available messages
    --last                          Deliver starting with last published message
    --since <duration>              Deliver messages in last interval (e.g. 1s, 1hr, h		ttps://golang.org/pkg/time/#ParseDuration)
    --durable <name>                Durable subscriber name
    --unsubscribe                   Unsubscribe the durable on exit
```

