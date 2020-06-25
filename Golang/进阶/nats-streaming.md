

## Nats-Streaming

### 1.概述

> NATS核心提供**最多一次**的服务质量。如果订户没有收听主题（没有主题匹配），或者在发送消息时未激活，则不会收到消息。这与TCP / IP提供的保证级别相同。默认情况下，NATS是一种即发即弃的消息传递系统。

NATS Streaming是一个由NATS驱动的数据流系统，用Go编程语言编写。NATS Streaming服务器的可执行文件名是`nats-streaming-server`。NATS Streaming与核心NATS平台无缝嵌入，扩展和互操作。

除了核心NATS平台的功能外，NATS Streaming还提供以下功能：

- **增强的消息协议** - NATS Streaming使用[Google Protocol Buffers](https://developers.google.com/protocol-buffers/)实现自己的增强消息格式。这些消息通过核心NATS平台作为二进制消息有效载荷传输，因此不需要更改基本NATS协议。

- **消息/事件持久性** - NATS Streaming提供可配置的消息持久性：内存中，平面文件或数据库。存储子系统使用公共接口，允许贡献者开发自己的自定义实现。

- **至少一次传送** - NATS Streaming在发布者和服务器之间（用于发布操作）以及订阅者和服务器之间提供消息确认（以确认消息传递）。消息由服务器在内存或二级存储（或其他外部存储）中保留，并根据需要重新传送给符合条件的订阅客户端。

- **发布者速率限制** - NATS Streaming提供了一个连接选项`MaxPubAcksInFlight`，可以有效地限制发布者在任何给定时间内可能在运行中发送的未确认消息的数量。达到此最大值时，将阻止进一步的异步发布调用，直到未确认的消息数低于指定的限制。

- **每个订户的速率匹配/限制** - 订阅可以指定一个`MaxInFlight`选项，该选项指定NATS流将允许给定订阅的未完成确认的最大数量（已传递但未确认的消息）。达到此限制时，NATS Streaming将暂停向此订阅传递邮件，直到未确认的邮件数低于指定的限制。

- 按主题重放的历史消息

   \- 新订阅可以指定为订阅主题的频道存储的消息流中的起始位置。通过使用此选项，邮件传递可以从以下位置开始：

  - 为此主题存储的最早消息
  - 在当前订阅开始之前，此主题的最近存储的消息。这通常被认为是“最后值”或“初始值”缓存。
  - 特定日期/时间，以纳秒为单位
  - 与当前服务器日期/时间的历史偏移量，例如最近30秒。
  - 特定的消息序列号

- **持久订阅** - 订阅还可以指定“持久名称”，这将在客户端重新启动后继续存在。持久订阅使服务器跟踪客户端的最后确认消息序列号和持久名称。当客户端重新启动/重新订阅并使用相同的客户端ID和持久名称时，服务器将从最早的未确认消息开始继续传递此持久订阅。

### 2.服务端安装

#### 直接安装

github地址：`https://github.com/nats-io/nats-streaming-server/releases`

直接下载对应OS版本运行即可

#### docker安装

拉取镜像

```sh
$ docker pull nats-streaming
```

运行

```sh
$ docker run -p 4223:4222 -p 8223:8222 nats-streaming -p 4222 -m 8222
```

指定入口运行

```sh
$ docker run --entrypoint /nats-streaming-server -p 4222:4222 -p 8222:8222 nats-streaming
```

### 3.hello world

#### publisher

```go
package demo

import (
	"github.com/nats-io/nats.go"
	"github.com/nats-io/stan.go"
	"github.com/sirupsen/logrus"
	"log"
)

func PublisMsg() {
	sc, err := GetConn("pub")
	if err != nil {
		logrus.Error(err)
	}
	defer sc.Close()

	ackHandler := func(ackedNuid string, err error) {
		log.Println("ackedNuid: ", ackedNuid)
	}

	for i := 0; i < 10; i++ {
		_, err := sc.PublishAsync("illusory", []byte("Hello World"), ackHandler)
		if err != nil {
			logrus.Error(err)
		}
	}
}

func GetConn(clientID string) (stan.Conn, error) {
	// 1.连接到默认服务器
	sc, err := stan.Connect("test-cluster", clientID,
		stan.NatsURL(nats.DefaultURL))
	if err != nil {
		logrus.Error(err)
		return nil, err
	}
	return sc, nil
}

```

#### subclient

```go
package demo

import (
	"github.com/nats-io/stan.go"
	"github.com/sirupsen/logrus"
	"log"
)

func SubClient() {
	// 1.连接到默认服务器
	sc, err := GetConn("sub")
	if err != nil {
		logrus.Error(err)
	}
	defer sc.Close()
	subscription, err := sc.Subscribe("illusory", func(msg *stan.Msg) {
		log.Println(msg)
	})
	if err != nil {
		logrus.Error(err)
	}
	defer subscription.Close()
	select {}
}

```

#### test

1.启动服务器

2.启动订阅客户端

3.启动发布客户端

```go
// publisher
2019/08/11 17:20:00 ackedNuid:  2lrgKNojpO6F2O4GoqpMrK
2019/08/11 17:20:00 ackedNuid:  2lrgKNojpO6F2O4GoqpN4s
2019/08/11 17:20:00 ackedNuid:  2lrgKNojpO6F2O4GoqpMdm
2019/08/11 17:20:00 ackedNuid:  2lrgKNojpO6F2O4GoqpMmo
2019/08/11 17:20:00 ackedNuid:  2lrgKNojpO6F2O4GoqpMvq
2019/08/11 17:20:00 ackedNuid:  2lrgKNojpO6F2O4GoqpN0M
2019/08/11 17:20:00 ackedNuid:  2lrgKNojpO6F2O4GoqpN9O
2019/08/11 17:20:00 ackedNuid:  2lrgKNojpO6F2O4GoqpNDu
2019/08/11 17:20:00 ackedNuid:  2lrgKNojpO6F2O4GoqpMZG
2019/08/11 17:20:00 ackedNuid:  2lrgKNojpO6F2O4GoqpMiI

//subclient
2019/08/11 17:20:00 sequence:14 subject:"illusory" data:"Hello World" timestamp:1565515200099092200 
2019/08/11 17:20:00 sequence:15 subject:"illusory" data:"Hello World" timestamp:1565515200099092200 
2019/08/11 17:20:00 sequence:16 subject:"illusory" data:"Hello World" timestamp:1565515200099092200 
2019/08/11 17:20:00 sequence:17 subject:"illusory" data:"Hello World" timestamp:1565515200099092200 
2019/08/11 17:20:00 sequence:18 subject:"illusory" data:"Hello World" timestamp:1565515200099092200 
2019/08/11 17:20:00 sequence:19 subject:"illusory" data:"Hello World" timestamp:1565515200099092200 
2019/08/11 17:20:00 sequence:20 subject:"illusory" data:"Hello World" timestamp:1565515200099092200 
2019/08/11 17:20:00 sequence:21 subject:"illusory" data:"Hello World" timestamp:1565515200099092200 
2019/08/11 17:20:00 sequence:22 subject:"illusory" data:"Hello World" timestamp:1565515200099092200 
2019/08/11 17:20:00 sequence:23 subject:"illusory" data:"Hello World" timestamp:1565515200100090300 
```



