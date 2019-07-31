# Nats入门教程

## 1. 概述

NATS是一个开源、轻量级、高性能的分布式消息中间件，实现了高可伸缩性和优雅的Publish/Subscribe模型，使用Golang语言开发。NATS的开发哲学认为高质量的QoS应该在客户端构建，故只建立了Request-Reply，不提供 1.持久化 2.事务处理 3.增强的交付模式 4.企业级队列。

**NATS为一对多通信实现发布 - 订阅消息分发模型**。

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

## 3. 连接到服务器

```go
//1.连接到默认服务器
nc, err := nats.Connect(nats.DefaultURL)
//2.连接到指定服务器
//nc, err := nats.Connect("demo.nats.io")
//3.连接到集群
servers := []string{"nats://127.0.0.1:1222", "nats://127.0.0.1:1223", "nats://127.0.0.1:1224"}
nc, err := nats.Connect(strings.Join(servers, ","))

//4. 设置超时时长
nc, err := nats.Connect("demo.nats.io", nats.Name("API Options Example"), nats.Timeout(10*time.Second))

//5.心跳协议
//5.1设置心跳时间间隔20秒
nc, err := nats.Connect("demo.nats.io", nats.Name("API Ping Example"), nats.PingInterval(20*time.Second))
//5.2设置最大心跳次数5次
nc, err := nats.Connect("demo.nats.io", nats.Name("API MaxPing Example"), nats.MaxPingsOutstanding(5))

//6.获取最大有效负载大小
nc, err := nats.Connect("demo.nats.io")
if err != nil {
	log.Fatal(err)
}
defer nc.Close()
mp := nc.MaxPayload()
log.Printf("Maximum payload is %v bytes", mp)

//7.NATS服务器提供了一种迂腐模式，可以对协议进行额外检查。默认情况下，此设置已关闭，但您可以将其打开
opts := nats.GetDefaultOptions()
opts.Url = "demo.nats.io"
// Turn on Pedantic
opts.Pedantic = true
nc, err := opts.Connect()
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

//8.NATS服务器还提供详细模式。默认情况下，启用详细模式，服务器将使用+ OK或-ERR回复客户端的每条消息。大多数客户端关闭详细模式，禁用所有+ OK流量。错误很少受到详细模式的影响，客户端库会按照文档处理它们。打开详细模式，可能用于测试
opts := nats.GetDefaultOptions()
opts.Url = "demo.nats.io"
// Turn on Verbose
opts.Verbose = true
nc, err := opts.Connect()
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

//9.关闭回声消息
//默认情况下，如果连接对已发布主题感兴趣，则NATS连接将回显消息。这意味着，如果连接上的发布者向主题发送消息，则该同一连接上的任何订阅者都将收到该消息。客户端可以选择关闭此行为，这样无论兴趣如何，都不会将消息传递给同一连接上的订阅者。
nc, err := nats.Connect("demo.nats.io", nats.Name("API NoEcho Example"), nats.NoEcho())
if err != nil {
	log.Fatal(err)
}
defer nc.Close()
```

## 4.自动重连

```go
//1.禁用重新连接 
nc, err := nats.Connect("demo.nats.io", nats.NoReconnect())
//2.设置重新连接尝试次数 10次
nc, err := nats.Connect("demo.nats.io", nats.MaxReconnects(10))
//3.重新连接暂停时间 重新连接失败后等待10秒再次进行连接尝试
nc, err := nats.Connect("demo.nats.io", nats.ReconnectWait(10*time.Second))
//4.避免Thundering Herd
//当服务器出现故障时其中所有客户端都会立即尝试重新连接，从而产生拒绝服务攻击。为了防止这种情况，大多数NATS客户端库会随机化他们尝试连接的服务器。如果仅使用单个服务器，则此设置无效，但在群集，随机化或随机播放的情况下，将确保没有任何一台服务器承受客户端重新连接尝试的冲击。
servers := []string{"nats://127.0.0.1:1222",
	"nats://127.0.0.1:1223",
	"nats://127.0.0.1:1224",
}

nc, err := nats.Connect(strings.Join(servers, ","), nats.DontRandomize())
if err != nil {
	log.Fatal(err)
}
defer nc.Close()
//5.监听重新连接信息
nc, err := nats.Connect("demo.nats.io",
	nats.DisconnectHandler(func(nc *nats.Conn) {
		// handle disconnect event
	}),
	nats.ReconnectHandler(func(nc *nats.Conn) {
		// handle reconnect event
	}))
// 设置断开连接后的消息缓冲区 断开服务器连接后 客户端可以继续发送消息到缓冲区 直到缓冲区满
// 重新连接后 缓冲区的消息将发送到服务器
nc, err := nats.Connect("demo.nats.io", nats.ReconnectBufSize(5*1024*1024))
```



## 5.保护连接

NATS提供了几种形式的安全性，`身份验证`，`授权`和`隔离`。您可以启用限制NATS系统访问权限的身份验证。

### 使用用户和密码进行身份验证

对于此示例，使用以下命令启动服务器：

```sh
> nats-server --user myname --pass password
```

您可以`nats-server`使用服务器提供的简单工具加密要传递的密码：

```sh
> go run mkpasswd.go -p
> password: password
> bcrypt hash: $2a$11$1oJy/wZYNTxr9jNwMNwS3eUGhBpHT3On8CL9o7ey89mpgo88VG6ba
```

并在服务器配置中使用散列密码。客户端仍使用纯文本版本。

代码使用localhost：4222，以便您可以在计算机上启动服务器以试用它们。

使用密码登录时，`nats-server`将使用纯文本密码或加密密码。

### 使用用户/密码连接

```go
// 1.使用用户密码连接
nc, err := nats.Connect("127.0.0.1", nats.UserInfo("myname", "password"))
// 2.URL中使用用户密码 格式：user：password @server：port
nc, err := nats.Connect("myname:password@127.0.0.1")
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

// Do something with the connection


```

### 使用Token进行身份验证

对于此示例，使用以下命令启动服务器：

```sh
> nats-server --auth mytoken
```

代码使用localhost：4222，以便您可以在计算机上启动服务器以试用它们。

```go
// 使用token连接
nc, err := nats.Connect("127.0.0.1", nats.Name("API Token Example"), nats.Token("mytoken"))
// 在URL中使用Token 格式：token@server:port
nc, err := nats.Connect("mytoken@localhost")
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

// Do something with the connection
```

### 使用NKey进行身份验证

2.0版本的NATS服务器引入了新的质询响应身份验证选项。此挑战响应基于我们称为使用[Ed25519](https://ed25519.cr.yp.to/)签名的NKeys的包装器。服务器可以通过多种方式使用这些密钥进行身份验证。最简单的方法是为服务器配置一个已知公钥列表，并让客户端通过使用私钥对其进行签名来响应挑战。

```go
opt, err := nats.NkeyOptionFromSeed("seed.txt")
if err != nil {
	log.Fatal(err)
}
nc, err := nats.Connect("127.0.0.1", opt)
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

// Do something with the connection


```



### 使用用户凭据文件进行身份验证

2.0版本的NATS服务器引入了基于JWT的身份验证的思想。客户端使用用户JWT和来自NKey对的私钥与此新方案交互。为了更轻松地与JWT建立连接，客户端库支持凭证文件的概念。此文件包含私钥和JWT，可以使用该`nsc`工具生成。

文件内容如下：

```go
-----BEGIN NATS USER JWT-----
eyJ0eXAiOiJqd3QiLCJhbGciOiJlZDI1NTE5In0.eyJqdGkiOiJUVlNNTEtTWkJBN01VWDNYQUxNUVQzTjRISUw1UkZGQU9YNUtaUFhEU0oyWlAzNkVMNVJBIiwiaWF0IjoxNTU4MDQ1NTYyLCJpc3MiOiJBQlZTQk0zVTQ1REdZRVVFQ0tYUVM3QkVOSFdHN0tGUVVEUlRFSEFKQVNPUlBWV0JaNEhPSUtDSCIsIm5hbWUiOiJvbWVnYSIsInN1YiI6IlVEWEIyVk1MWFBBU0FKN1pEVEtZTlE3UU9DRldTR0I0Rk9NWVFRMjVIUVdTQUY3WlFKRUJTUVNXIiwidHlwZSI6InVzZXIiLCJuYXRzIjp7InB1YiI6e30sInN1YiI6e319fQ.6TQ2ilCDb6m2ZDiJuj_D_OePGXFyN3Ap2DEm3ipcU5AhrWrNvneJryWrpgi_yuVWKo1UoD5s8bxlmwypWVGFAA
------END NATS USER JWT------

************************* IMPORTANT *************************
NKEY Seed printed below can be used to sign and prove identity.
NKEYs are sensitive and should be treated as secrets.

-----BEGIN USER NKEY SEED-----
SUAOY5JZ2WJKVR4UO2KJ2P3SW6FZFNWEOIMAXF4WZEUNVQXXUOKGM55CYE
------END USER NKEY SEED------

*************************************************************
```

给定一个creds文件，客户端可以作为属于特定帐户的特定用户进行身份验证：

```go
nc, err := nats.Connect("127.0.0.1", nats.UserCredentials("path_to_creds_file"))
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

// Do something with the connection


```

###  使用TLS加密连接

使用TLS连接到服务器非常简单。当使用TLS连接到NATS系统时，大多数客户端将自动使用TLS。

#### 连接TLS

```go
nc, err := nats.Connect("localhost",
	nats.ClientCert("resources/certs/cert.pem", "resources/certs/key.pem"),
	nats.RootCAs("resources/certs/ca.pem"))
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

// Do something with the connection


```

####  连接TLS协议

```go
nc, err := nats.Connect("tls://localhost", nats.RootCAs("resources/certs/ca.pem")) // May need this if server is using self-signed certificate
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

// Do something with the connection


```

##  6. 接收消息

### 6.1 同步订阅

同步订阅要求应用程序等待消息。这种类型的订阅易于设置和使用，但如果需要多个消息，则需要应用程序处理循环。

```go
nc, err := nats.Connect("demo.nats.io")
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

// Subscribe
sub, err := nc.SubscribeSync("updates")
if err != nil {
	log.Fatal(err)
}

// Wait for a message
msg, err := sub.NextMsg(10 * time.Second)
if err != nil {
	log.Fatal(err)
}

// Use the response
log.Printf("Reply: %s", msg.Data)
```

### 6.2 异步订阅

异步订阅使用某种形式的回调来在消息到达时通知应用程序。

```go
nc, err := nats.Connect("demo.nats.io")
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

// Use a WaitGroup to wait for a message to arrive
wg := sync.WaitGroup{}
wg.Add(1)

// Subscribe
if _, err := nc.Subscribe("updates", func(m *nats.Msg) {
	wg.Done()
}); err != nil {
	log.Fatal(err)
}

// Wait for a message to come in
wg.Wait()
```

### 6.3  退订

客户端库提供了取消订阅先前订阅请求的方法。

此过程需要与服务器进行交互，因此对于异步订阅，可能会有一个小的等待时间，当处理取消订阅时，可能会继续接收到消息。

```go
nc, err := nats.Connect("demo.nats.io")
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

// Sync Subscription
sub, err := nc.SubscribeSync("updates")
if err != nil {
	log.Fatal(err)
}
if err := sub.Unsubscribe(); err != nil {
	log.Fatal(err)
}

// Async Subscription
sub, err = nc.Subscribe("updates", func(_ *nats.Msg) {})
if err != nil {
	log.Fatal(err)
}
if err := sub.Unsubscribe(); err != nil {
	log.Fatal(err)
}
```

### 6.4 收到一定数量消息之后取消订阅

NATS提供了一种特殊形式的取消订阅，配置了消息计数，并在许多消息发送给订阅者时生效。

> 例如设置为1条消息，即客户端收到1条消息之后就会自动取消订阅。大多数也使用在1条消息时

```go
nc, err := nats.Connect("demo.nats.io")
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

// Sync Subscription
sub, err := nc.SubscribeSync("updates")
if err != nil {
	log.Fatal(err)
}
if err := sub.AutoUnsubscribe(1); err != nil {
	log.Fatal(err)
}

// Async Subscription
sub, err = nc.Subscribe("updates", func(_ *nats.Msg) {})
if err != nil {
	log.Fatal(err)
}
if err := sub.AutoUnsubscribe(1); err != nil {
	log.Fatal(err)
}
```

### 6.5 回复消息

传入消息具有可选的回复字段。如果设置了该字段，则它将包含期望回复的主题。

例如，以下代码将侦听该请求并响应时间。

```go
nc, err := nats.Connect("demo.nats.io")
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

// Subscribe
sub, err := nc.SubscribeSync("time")
if err != nil {
	log.Fatal(err)
}

// Read a message
msg, err := sub.NextMsg(10 * time.Second)
if err != nil {
	log.Fatal(err)
}

// Get the time
timeAsBytes := []byte(time.Now().String())

// Send the time as the response.
msg.Respond(timeAsBytes)
```

### 6.6 通配符

订阅通配符主题没有特殊代码。通配符是主题名称的正常部分。

```go
nc, err := nats.Connect("demo.nats.io")
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

// Use a WaitGroup to wait for 2 messages to arrive
wg := sync.WaitGroup{}
wg.Add(2)

// Subscribe
if _, err := nc.Subscribe("time.*.east", func(m *nats.Msg) {
	log.Printf("%s: %s", m.Subject, m.Data)
	wg.Done()
}); err != nil {
	log.Fatal(err)
}

// Wait for the 2 messages to come in
wg.Wait()
```

或者

```go
nc, err := nats.Connect("demo.nats.io")
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

// Use a WaitGroup to wait for 4 messages to arrive
wg := sync.WaitGroup{}
wg.Add(4)

// Subscribe
if _, err := nc.Subscribe("time.>", func(m *nats.Msg) {
	log.Printf("%s: %s", m.Subject, m.Data)
	wg.Done()
}); err != nil {
	log.Fatal(err)
}

// Wait for the 4 messages to come in
wg.Wait()

// Close the connection
nc.Close()
```

以下示例可用于测试这两个订户。该`*`用户应接受至多2个消息，而`>`用户接收4.更重要的是`time.*.east`用户将无法收到`time.us.east.atlanta`，因为这将不匹配。

```go
nc, err := nats.Connect("demo.nats.io")
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

zoneID, err := time.LoadLocation("America/New_York")
if err != nil {
	log.Fatal(err)
}
now := time.Now()
zoneDateTime := now.In(zoneID)
formatted := zoneDateTime.String()

nc.Publish("time.us.east", []byte(formatted))
nc.Publish("time.us.east.atlanta", []byte(formatted))

zoneID, err = time.LoadLocation("Europe/Warsaw")
if err != nil {
	log.Fatal(err)
}
zoneDateTime = now.In(zoneID)
formatted = zoneDateTime.String()

nc.Publish("time.eu.east", []byte(formatted))
nc.Publish("time.eu.east.warsaw", []byte(formatted))
```

### 6.7  队列订阅

订阅队列组与仅订阅主题略有不同。应用程序只包含订阅的队列名称。包含组的效果相当重要，因为服务器现在将在队列组的成员之间加载平衡消息，但代码差异很小。

NATS中的队列组是动态的，不需要任何服务器配置。您几乎可以将常规订阅视为1的队列组

例如，要`workers`使用主题订阅队列`updates`

```go
nc, err := nats.Connect("demo.nats.io")
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

// Use a WaitGroup to wait for 10 messages to arrive
wg := sync.WaitGroup{}
wg.Add(10)

// Create a queue subscription on "updates" with queue name "workers"
if _, err := nc.QueueSubscribe("updates", "worker", func(m *nats.Msg) {
	wg.Done()
}); err != nil {
	log.Fatal(err)
}

// Wait for messages to come in
wg.Wait()
```

如果您使用发送到的发布示例运行此示例`updates`，您将看到其中一个实例收到消息，而您运行的其他实例则不会。

### 6.8 排空连接和订阅

最近在NATS客户端库中添加的功能是消耗连接或订阅的能力。关闭连接或取消订阅通常被视为立即请求。当您关闭或取消订阅时，库将暂停任何待处理队列中的消息或订阅者的缓存。当您消耗订阅或连接时，它将在关闭之前处理任何飞行和缓存/挂起的消息。

Drain为使用队列订阅的客户端提供了一种在不丢失任何消息的情况下关闭应用程序的方法。客户端可以调出新的队列成员，排空并关闭旧的队列成员，所有这些都不会丢失发送给旧客户端的消息。

对于连接，该过程基本上是：

1. 排除所有订阅
2. 阻止发布新消息
3. 刷新任何剩余的已发布消息
4. close

```go
wg := sync.WaitGroup{}
wg.Add(1)

errCh := make(chan error, 1)

// To simulate a timeout, you would set the DrainTimeout()
// to a value less than the time spent in the message callback,
// so say: nats.DrainTimeout(10*time.Millisecond).

nc, err := nats.Connect("demo.nats.io",
	nats.DrainTimeout(10*time.Second),
	nats.ErrorHandler(func(_ *nats.Conn, _ *nats.Subscription, err error) {
		errCh <- err
	}),
	nats.ClosedHandler(func(_ *nats.Conn) {
		wg.Done()
	}))
if err != nil {
	log.Fatal(err)
}

// Just to not collide using the demo server with other users.
subject := nats.NewInbox()

// Subscribe, but add some delay while processing.
if _, err := nc.Subscribe(subject, func(_ *nats.Msg) {
	time.Sleep(200 * time.Millisecond)
}); err != nil {
	log.Fatal(err)
}

// Publish a message
if err := nc.Publish(subject, []byte("hello")); err != nil {
	log.Fatal(err)
}

// Drain the connection, which will close it when done.
if err := nc.Drain(); err != nil {
	log.Fatal(err)
}

// Wait for the connection to be closed.
wg.Wait()

// Check if there was an error
select {
case e := <-errCh:
	log.Fatal(e)
default:
}
```

订阅的流失机制更简单：

1. 退订
2. 处理所有缓存或飞行消息
3. 清理

```go

	nc, err := nats.Connect("demo.nats.io")
	if err != nil {
		log.Fatal(err)
	}
	defer nc.Close()

	done := sync.WaitGroup{}
	done.Add(1)

	count := 0
	errCh := make(chan error, 1)

	msgAfterDrain := "not this one"

	// Just to not collide using the demo server with other users.
	subject := nats.NewInbox()

	// This callback will process each message slowly
	sub, err := nc.Subscribe(subject, func(m *nats.Msg) {
		if string(m.Data) == msgAfterDrain {
			errCh <- fmt.Errorf("Should not have received this message")
			return
		}
		time.Sleep(100 * time.Millisecond)
		count++
		if count == 2 {
			done.Done()
		}
	})

	// Send 2 messages
	for i := 0; i < 2; i++ {
		nc.Publish(subject, []byte("hello"))
	}

	// Call Drain on the subscription. It unsubscribes but
	// wait for all pending messages to be processed.
	if err := sub.Drain(); err != nil {
		log.Fatal(err)
	}

	// Send one more message, this message should not be received
	nc.Publish(subject, []byte(msgAfterDrain))

	// Wait for the subscription to have processed the 2 messages.
	done.Wait()

	// Now check that the 3rd message was not received
	select {
	case e := <-errCh:
		log.Fatal(e)
	case <-time.After(200 * time.Millisecond):
		// OK!
	}
```

因为耗尽可能涉及流向服务器的消息，对于刷新和异步消息处理，耗尽的超时通常应高于简单消息请求/回复或类似的超时。

### 6.9 接收结构化数据

客户端库可以提供工具来帮助接收结构化数据，如JSON。NATS服务器的核心流量始终是不透明的字节数组。服务器不以任何形式处理消息有效负载。对于不提供帮助程序的库，您始终可以在将相关字节发送到NATS客户端之前对数据进行编码和解码。

例如，要接收JSON，您可以执行以下操作：

```go
nc, err := nats.Connect("demo.nats.io")
if err != nil {
	log.Fatal(err)
}
defer nc.Close()
ec, err := nats.NewEncodedConn(nc, nats.JSON_ENCODER)
if err != nil {
	log.Fatal(err)
}
defer ec.Close()

// Define the object
type stock struct {
	Symbol string
	Price  int
}

wg := sync.WaitGroup{}
wg.Add(1)

// Subscribe
if _, err := ec.Subscribe("updates", func(s *stock) {
	log.Printf("Stock: %s - Price: %v", s.Symbol, s.Price)
	wg.Done()
}); err != nil {
	log.Fatal(err)
}

// Wait for a message to come in
wg.Wait()
```

## 7. 发送消息

NATS使用包括目标主题，可选回复主题和字节数组的协议发送和接收消息。某些库可能会提供帮助程序以将其他数据格式转换为字节，但NATS服务器会将所有消息视为不透明的字节数组。

```go
nc, err := nats.Connect("demo.nats.io", nats.Name("API PublishBytes Example"))
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

if err := nc.Publish("updates", []byte("All is Well")); err != nil {
	log.Fatal(err)
}

```

### 包括回复主题

发布消息时的可选回复字段可以在接收方用于响应。回复主题通常称为*收件箱*，并且大多数库可以提供用于生成唯一收件箱主题的方法。大多数库还通过单个调用提供请求 - 回复模式。例如，要向主题发送请求`time`而没有消息内容，您可以：

```go
nc, err := nats.Connect("demo.nats.io")
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

// Create a unique subject name for replies.
uniqueReplyTo := nats.NewInbox()

// Listen for a single response
sub, err := nc.SubscribeSync(uniqueReplyTo)
if err != nil {
	log.Fatal(err)
}

// Send the request.
// If processing is synchronous, use Request() which returns the response message.
if err := nc.PublishRequest("time", uniqueReplyTo, nil); err != nil {
	log.Fatal(err)
}

// Read the reply
msg, err := sub.NextMsg(time.Second)
if err != nil {
	log.Fatal(err)
}

// Use the response
log.Printf("Reply: %s", msg.Data)


```

### 请求 - 回复

发送消息和接收响应的模式在大多数客户端库中封装为请求方法。在封面下，此方法将发布带有唯一回复主题的消息，并在返回之前等待响应。

请求方法与使用回复发布之间的主要区别在于，库只接受一个响应，并且在大多数库中，请求将被视为同步操作。该库甚至可以提供设置超时的方法。

例如，更新先前的发布示例，我们可能会请求`time`一秒超时：

```go
nc, err := nats.Connect("demo.nats.io")
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

// Send the request
msg, err := nc.Request("time", nil, time.Second)
if err != nil {
	log.Fatal(err)
}

// Use the response
log.Printf("Reply: %s", msg.Data)

// Close the connection
nc.Close()

```

您可以将库中的请求 - 回复视为订阅，获取一条消息，取消订阅模式。在Go中，这可能看起来像：

```go
sub, err := nc.SubscribeSync(replyTo)
if err != nil {
    log.Fatal(err)
}
nc.Flush()

// Send the request
nc.PublishRequest(subject, replyTo, []byte(input))

// Wait for a single response
for {
    msg, err := sub.NextMsg(1 * time.Second)
    if err != nil {
        log.Fatal(err)
    }

    response = string(msg.Data)
    break
}
sub.Unsubscribe()
```

###  分散 - 集中

您可以将请求 - 回复模式扩展为通常称为scatter-gather的内容。要接收多条消息，超时，您可以执行以下操作，其中获取消息的循环使用时间作为限制，而不是接收单个消息：

```go
sub, err := nc.SubscribeSync(replyTo)
if err != nil {
    log.Fatal(err)
}
nc.Flush()

// Send the request
nc.PublishRequest(subject, replyTo, []byte(input))

// Wait for a single response
max := 100 * time.Millisecond
start := time.Now()
for time.Now().Sub(start) < max {
    msg, err := sub.NextMsg(1 * time.Second)
    if err != nil {
        break
    }

    responses = append(responses, string(msg.Data))
}
sub.Unsubscribe()
```

或者，您可以循环计数器和超时以尝试获得*至少N个*响应：

```go
sub, err := nc.SubscribeSync(replyTo)
if err != nil {
    log.Fatal(err)
}
nc.Flush()

// Send the request
nc.PublishRequest(subject, replyTo, []byte(input))

// Wait for a single response
max := 500 * time.Millisecond
start := time.Now()
for time.Now().Sub(start) < max {
    msg, err := sub.NextMsg(1 * time.Second)
    if err != nil {
        break
    }

    responses = append(responses, string(msg.Data))

    if len(responses) >= minResponses {
        break
    }
}
sub.Unsubscribe()
```

### Caches, Flush and Ping

出于性能原因，大多数（如果不是全部）客户端库将缓存传出数据，以便可以一次将更大的块写入网络。这可能就像字节缓冲区一样简单，它在被推送到网络之前存储了一些消息。

这些缓冲区不会永久保留消息，通常它们被设计为在高吞吐量情况下保存消息，同时仍然在低吞吐量情况下提供良好的延迟。

```go
nc, err := nats.Connect("demo.nats.io")
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

// Just to not collide using the demo server with other users.
subject := nats.NewInbox()

if err := nc.Publish(subject, []byte("All is Well")); err != nil {
	log.Fatal(err)
}
// Sends a PING and wait for a PONG from the server, up to the given timeout.
// This gives guarantee that the server has processed the above message.
if err := nc.FlushTimeout(time.Second); err != nil {
	log.Fatal(err)
}

```

### 发送结构化数据

些客户端库提供帮助程序来发送结构化数据，而其他客户端库依赖于应用程序来执行任何编码和解码，只需要使用字节数组进行发送。以下示例显示了如何发送JSON，但这可以很容易地更改为发送协议缓冲区，YAML或其他一些格式。JSON是一种文本格式，因此我们还必须将大多数语言的字符串编码为字节。我们使用的是UTF-8，即JSON标准编码。

```go
nc, err := nats.Connect("demo.nats.io")
if err != nil {
	log.Fatal(err)
}
defer nc.Close()

ec, err := nats.NewEncodedConn(nc, nats.JSON_ENCODER)
if err != nil {
	log.Fatal(err)
}
defer ec.Close()

// Define the object
type stock struct {
	Symbol string
	Price  int
}

// Publish the message
if err := ec.Publish("updates", &stock{Symbol: "GOOG", Price: 1200}); err != nil {
	log.Fatal(err)
}

```

## 8. 控连接

