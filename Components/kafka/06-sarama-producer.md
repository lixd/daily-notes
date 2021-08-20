---
title: "kafka(Go)教程(六)---sarama 客户端 producer 源码分析"
description: "Kafka Go sarama 客户端异步生产者源码分析"
date: 2021-08-14 22:00:00
draft: false
categories: ["Kafka"]
tags: ["Kafka"]
---

本文主要通过源码分析了 Kafka Go sarama 客户端生产者的实现原理，包括消息分发流程，消息打包处理，以及最终发送到 Kafka 等具体步骤，最后通过分析总结出的常见性能优化手段。



<!--more-->

> 本文基于 sarama v1.29.1

## 1. 概述

> Kafka 系列相关代码见 [Github][Github]

具体流程如下图：

![Sarama Producer 流程.png][Sarama Producer 流程.png]



`Sarama`有两种类型的生产者，同步生产者和异步生产者。

> To produce messages, use either the AsyncProducer or the SyncProducer. The AsyncProducer accepts messages on a channel and produces them asynchronously in the background as efficiently as possible; it is preferred in most cases. The SyncProducer provides a method which will block until Kafka acknowledges the message as produced. This can be useful but comes with two caveats: it will generally be less efficient, and the actual durability guarantees depend on the configured value of `Producer.RequiredAcks`. There are configurations where a message acknowledged by the SyncProducer can still sometimes be lost.

大致意思是异步生产者使用`channel`接收（生产成功或失败）的消息，并且也通过`channel`来发送消息，这样做通常是性能最高的。而同步生产者需要阻塞，直到收到了`acks`。但是这也带来了两个问题，一是性能变得更差了，而是可靠性是依靠参数`acks`来保证的。



异步生产者 Demo 如下：

```go
func Producer(topic string, limit int) {
	config := sarama.NewConfig()
	// 异步生产者不建议把 Errors 和 Successes 都开启，一般开启 Errors 就行
	// 同步生产者就必须都开启，因为会同步返回发送成功或者失败
	config.Producer.Return.Errors = false   // 设定需要返回错误信息
	config.Producer.Return.Successes = true // 设定需要返回成功信息
	producer, err := sarama.NewAsyncProducer([]string{kafka.HOST}, config)
	if err != nil {
		log.Fatal("NewSyncProducer err:", err)
	}
	defer producer.AsyncClose()
	go func() {
		// [!important] 异步生产者发送后必须把返回值从 Errors 或者 Successes 中读出来 不然会阻塞 sarama 内部处理逻辑 导致只能发出去一条消息
		select {
		case _ = <-producer.Successes():
		case e := <-producer.Errors():
			if e != nil {
				log.Printf("[Producer] err:%v msg:%+v \n", e.Msg, e.Err)
			}
		}
	}()
	// 异步发送
	for i := 0; i < limit; i++ {
		str := strconv.Itoa(int(time.Now().UnixNano()))
		msg := &sarama.ProducerMessage{Topic: topic, Key: nil, Value: sarama.StringEncoder(str)}
		// 异步发送只是写入内存了就返回了，并没有真正发送出去
		// sarama 库中用的是一个 channel 来接收，后台 goroutine 异步从该 channel 中取出消息并真正发送
		producer.Input() <- msg
		atomic.AddInt64(&count, 1)
		if atomic.LoadInt64(&count)%1000 == 0 {
			log.Printf("已发送消息数:%v\n", count)
		}

	}
	log.Printf("发送完毕 总发送消息数:%v\n", limit)
}
```

可以看到整个 API 使用起来还是非常简单的：

* 1）NewAsyncProducer() ：创建 一个 producer 对象
* 2）producer.Input() <- msg ：发送消息
* 3）s = <-producer.Successes()，e := <-producer.Errors() ：异步获取成功或失败信息



## 2. 发送流程源码分析

> 为了便于阅读，省略了部分无关代码。



另外：由于同步生产者和异步生产者逻辑是一致的，只是在异步生产者基础上封装了一层，所以本文主要分析了异步生产者。

```go
// 可以看到 同步生产者其实就是把异步生产者封装了一层
type syncProducer struct {
    producer *asyncProducer
    wg       sync.WaitGroup
}
```



### NewAsyncProducer

首先是构建一个异步生产者对象

```go
func NewAsyncProducer(addrs []string, conf *Config) (AsyncProducer, error) {
	client, err := NewClient(addrs, conf)
	if err != nil {
		return nil, err
	}
	return newAsyncProducer(client)
}

func newAsyncProducer(client Client) (AsyncProducer, error) {
	// ...
	p := &asyncProducer{
		client:     client,
		conf:       client.Config(),
		errors:     make(chan *ProducerError),
		input:      make(chan *ProducerMessage),
		successes:  make(chan *ProducerMessage),
		retries:    make(chan *ProducerMessage),
		brokers:    make(map[*Broker]*brokerProducer),
		brokerRefs: make(map[*brokerProducer]int),
		txnmgr:     txnmgr,
	}

	go withRecover(p.dispatcher)
	go withRecover(p.retryHandler)
}
```

可以看到在 `newAsyncProducer` 最后开启了两个 goroutine，一个为 `dispatcher`，一个为 `retryHandler `。

> retryHandler 主要是处理重试逻辑，暂时先忽略。



### dispatcher

主要根据 `topic` 将消息分发到对应的 channel。

```go
func (p *asyncProducer) dispatcher() {
   handlers := make(map[string]chan<- *ProducerMessage)
   // ...
   for msg := range p.input {
       
	  // 拦截器逻辑
      for _, interceptor := range p.conf.Producer.Interceptors {
         msg.safelyApplyInterceptor(interceptor)
      }
	  // 找到这个Topic对应的Handler
      handler := handlers[msg.Topic]
      if handler == nil {
         // 如果没有这个Topic对应的Handler，那么创建一个
         handler = p.newTopicProducer(msg.Topic)
         handlers[msg.Topic] = handler
      }
	  // 然后把这条消息写进这个Handler中
      handler <- msg
   }
}
```

具体逻辑：从 `p.int` 中取出消息并写入到 `handler` 中，如果 `topic` 对应的 `handler` 不存在，则调用 `newTopicProducer()` 创建。

> 这里的 handler 是一个 unbuffered channel



然后让我们来`handler = p.newTopicProducer(msg.Topic)`这一行的代码。

```go
func (p *asyncProducer) newTopicProducer(topic string) chan<- *ProducerMessage {
   input := make(chan *ProducerMessage, p.conf.ChannelBufferSize)
   tp := &topicProducer{
      parent:      p,
      topic:       topic,
      input:       input,
      breaker:     breaker.New(3, 1, 10*time.Second),
      handlers:    make(map[int32]chan<- *ProducerMessage),
      partitioner: p.conf.Producer.Partitioner(topic),
   }
   go withRecover(tp.dispatch)
   return input
}
```

在这里创建了一个缓冲大小为`ChannelBufferSize`的channel，用于存放发送到这个主题的消息，然后创建了一个 `topicProducer`。

> 在这个时候你可以认为消息已经交付给各个 topic 对应的 topicProducer 了。



还有一个需要注意的是`newTopicProducer` 的这种写法，内部创建一个 chan 返回到外层，然后通过在内部新开一个 goroutine 来处理该 chan 里的消息，这种写法在后面还会遇到好几次。

> 相比之下在外部显示创建 chan 之后传递到该函数可能会更容易理解。



### topicDispatch

`newTopicProducer`的最后一行`go withRecover(tp.dispatch)`又启动了一个 goroutine 用于处理消息。也就是说，到了这一步，对于每一个Topic，都有一个协程来处理消息。

dispatch 具体如下：

```go
func (tp *topicProducer) dispatch() {
	for msg := range tp.input {
		handler := tp.handlers[msg.Partition]
		if handler == nil {
			handler = tp.parent.newPartitionProducer(msg.Topic, msg.Partition)
			tp.handlers[msg.Partition] = handler
		}

		handler <- msg
	}
}
```

可以看到又是同样的套路：

* 1）找到这条消息所在的分区对应的 channel，然后把消息丢进去
* 2）如果不存在则新建 chan



### PartitionDispatch

新建的 chan 是通过 `newPartitionProducer` 返回的，和之前的`newTopicProducer`又是同样的套路,点进去看一下：

```go
func (p *asyncProducer) newPartitionProducer(topic string, partition int32) chan<- *ProducerMessage {
	input := make(chan *ProducerMessage, p.conf.ChannelBufferSize)
	pp := &partitionProducer{
		parent:    p,
		topic:     topic,
		partition: partition,
		input:     input,

		breaker:    breaker.New(3, 1, 10*time.Second),
		retryState: make([]partitionRetryState, p.conf.Producer.Retry.Max+1),
	}
	go withRecover(pp.dispatch)
	return input
}
```

> 果然是这样，有没有一种似曾相识的感觉。

`TopicProducer`是按照 `Topic` 进行分发，这里的 `PartitionProducer` 则是按照 `partition` 进行分发。

> 到这里可以认为消息已经交付给对应 topic 下的对应 partition 了。

每个 partition 都会有一个 goroutine 来处理分发给自己的消息。



### PartitionProducer

到了这一步，我们再来看看消息到了每个 partition 所在的 channel 之后，是如何处理的。

> 其实在这一步中，主要是做一些错误处理之类的，然后把消息丢进brokerProducer。

可以理解为这一步是业务逻辑层到网络IO层的转变，在这之前我们只关心消息去到了哪个分区，而在这之后，我们需要找到这个分区所在的 broker 的地址，并使用之前已经建立好的 TCP 连接，发送这条消息。



具体 `pp.dispatch` 代码如下

```go
func (pp *partitionProducer) dispatch() {
	// 找到这个主题和分区的leader所在的broker
	pp.leader, _ = pp.parent.client.Leader(pp.topic, pp.partition)
	if pp.leader != nil {
        // 根据 leader 信息创建一个 BrokerProducer 对象
		pp.brokerProducer = pp.parent.getBrokerProducer(pp.leader)
		pp.parent.inFlight.Add(1) 
		pp.brokerProducer.input <- &ProducerMessage{Topic: pp.topic, Partition: pp.partition, flags: syn}
	}
	// 然后把消息丢进brokerProducer中
	for msg := range pp.input {
		pp.brokerProducer.input <- msg
	}
}
```

> 根据之前的套路我们知道，真正的逻辑肯定在`pp.parent.getBrokerProducer(pp.leader)` 这个方法里面。



### BrokerProducer

到了这里，大概算是整个发送流程最后的一个步骤了。

让我们继续跟进`pp.parent.getBrokerProducer(pp.leader)`这行代码里面的内容。其实就是找到`asyncProducer`中的`brokerProducer`，如果不存在，则创建一个。

```go
func (p *asyncProducer) getBrokerProducer(broker *Broker) *brokerProducer {
	p.brokerLock.Lock()
	defer p.brokerLock.Unlock()

	bp := p.brokers[broker]

	if bp == nil {
		bp = p.newBrokerProducer(broker)
		p.brokers[broker] = bp
		p.brokerRefs[bp] = 0
	}

	p.brokerRefs[bp]++

	return bp
}
```

又调用了`newBrokerProducer()`，继续追踪下去：

```go
func (p *asyncProducer) newBrokerProducer(broker *Broker) *brokerProducer {
	var (
		input     = make(chan *ProducerMessage)
		bridge    = make(chan *produceSet)
		responses = make(chan *brokerProducerResponse)
	)

	bp := &brokerProducer{
		parent:         p,
		broker:         broker,
		input:          input,
		output:         bridge,
		responses:      responses,
		stopchan:       make(chan struct{}),
		buffer:         newProduceSet(p),
		currentRetries: make(map[string]map[int32]error),
	}
	go withRecover(bp.run)

	// minimal bridge to make the network response `select`able
	go withRecover(func() {
		for set := range bridge {
			request := set.buildRequest()

			response, err := broker.Produce(request)

			responses <- &brokerProducerResponse{
				set: set,
				err: err,
				res: response,
			}
		}
		close(responses)
	})

	if p.conf.Producer.Retry.Max <= 0 {
		bp.abandoned = make(chan struct{})
	}

	return bp
}
```

这里又启动了两个 goroutine，一个为 run，一个是匿名函数姑且称为 bridge。

>  bridge 看起来是真正的发送逻辑，那么 batch handle 逻辑应该是在 run 方法里了。

这里先分析  bridge 函数，run 在下一章分析。

#### buildRequest 

buildRequest 方法主要是构建一个标准的 Kafka Request 消息。

> 根据不同版本、是否配置压缩信息做了额外处理，这里先忽略，只看核心代码：

```go
func (ps *produceSet) buildRequest() *ProduceRequest {	
	req := &ProduceRequest{
		RequiredAcks: ps.parent.conf.Producer.RequiredAcks,
		Timeout:      int32(ps.parent.conf.Producer.Timeout / time.Millisecond),
	}
	for topic, partitionSets := range ps.msgs {
		for partition, set := range partitionSets {
				rb := set.recordsToSend.RecordBatch
				if len(rb.Records) > 0 {
					rb.LastOffsetDelta = int32(len(rb.Records) - 1)
					for i, record := range rb.Records {
						record.OffsetDelta = int64(i)
					}
				}
				req.AddBatch(topic, partition, rb)
				continue
			}
    }
}
```

首先是构建一个 req 对象，然后遍历 ps.msg 中的消息，根据 topic 和 partition 分别写入到 req 中。



#### Produce

```go
func (b *Broker) Produce(request *ProduceRequest) (*ProduceResponse, error) {
	var (
		response *ProduceResponse
		err      error
	)

	if request.RequiredAcks == NoResponse {
		err = b.sendAndReceive(request, nil)
	} else {
		response = new(ProduceResponse)
		err = b.sendAndReceive(request, response)
	}

	if err != nil {
		return nil, err
	}

	return response, nil
}
```

最终调用了`sendAndReceive()`方法将消息发送出去。

如果我们设置了需要 Acks，就会传一个 response 进去接收返回值吗；如果没设置，那么消息发出去之后，就不管了。

```go
func (b *Broker) sendAndReceive(req protocolBody, res protocolBody) error {
    
	promise, err := b.send(req, res != nil, responseHeaderVersion)
	if err != nil {
		return err
	}
	select {
	case buf := <-promise.packets:
		return versionedDecode(buf, res, req.version())
	case err = <-promise.errors:
		return err
	}
}
```

```go
func (b *Broker) send(rb protocolBody, promiseResponse bool, responseHeaderVersion int16) (*responsePromise, error) {
	
	req := &request{correlationID: b.correlationID, clientID: b.conf.ClientID, body: rb}
	buf, err := encode(req, b.conf.MetricRegistry)
	if err != nil {
		return nil, err
	}
	bytes, err := b.write(buf)
}

```

最终通过`bytes, err := b.write(buf)` 发送出去。

```go
func (b *Broker) write(buf []byte) (n int, err error) {
	if err := b.conn.SetWriteDeadline(time.Now().Add(b.conf.Net.WriteTimeout)); err != nil {
		return 0, err
	}
	// 这里就是 net 包中的逻辑了。。
	return b.conn.Write(buf)
}
```



至此，`Sarama`生产者相关的内容就介绍完毕了。

> 还有一个比较重要的，消息打包批量发送的逻辑，比较多再下一章讲。



## 3. 消息打包源码分析

在之前 BrokerProducer 逻辑中启动了两个 goroutine，其中 bridge 从 chan 中取消息并真正发送出去。

*那么这个 chan 里的消息是哪里来的呢?* 

其实这就是另一个 goroutine 的工作了。

```go
func (p *asyncProducer) newBrokerProducer(broker *Broker) *brokerProducer {
	var (
		input     = make(chan *ProducerMessage)
		bridge    = make(chan *produceSet)
		responses = make(chan *brokerProducerResponse)
	)

	bp := &brokerProducer{
		parent:         p,
		broker:         broker,
		input:          input,
		output:         bridge,
		responses:      responses,
		stopchan:       make(chan struct{}),
		buffer:         newProduceSet(p),
		currentRetries: make(map[string]map[int32]error),
	}
	go withRecover(bp.run)

	// minimal bridge to make the network response `select`able
	go withRecover(func() {
		for set := range bridge {
			request := set.buildRequest()

			response, err := broker.Produce(request)

			responses <- &brokerProducerResponse{
				set: set,
				err: err,
				res: response,
			}
		}
		close(responses)
	})

	if p.conf.Producer.Retry.Max <= 0 {
		bp.abandoned = make(chan struct{})
	}

	return bp
}
```



### run

```go
func (bp *brokerProducer) run() {
	var output chan<- *produceSet

	for {
		select {
		case msg, ok := <-bp.input:
            // 1. 检查 buffer 空间是否足够存放当前 msg
			if bp.buffer.wouldOverflow(msg) {
				if err := bp.waitForSpace(msg, false); err != nil {
					bp.parent.retryMessage(msg, err)
					continue
				}
			}
			// 2. 将 msg 存入 buffer
			if err := bp.buffer.add(msg); err != nil {
				bp.parent.returnError(msg, err)
				continue
			}
            // 3. 如果间隔时间到了，也会将消息发出去
		case <-bp.timer:
			bp.timerFired = true
            // 4. 将 buffer 里的数据发送到 局部变量 output chan 里
		case output <- bp.buffer:
			bp.rollOver()
		case response, ok := <-bp.responses:
			if ok {
				bp.handleResponse(response)
			}
		} 
		// 5.如果发送时间到了 或者消息大小或者条数达到阈值 则表示可以发送了 将  bp.output chan 赋值给局部变量 output
		if bp.timerFired || bp.buffer.readyToFlush() {
			output = bp.output
		} else {
			output = nil
		}
	}
}
```

* 1）首先检测 buffer 空间
* 2）将 msg 写入 buffer
* 3）后面的 3 4 5 步都是在发送消息，或者为发送消息做准备



### wouldOverflow 

```go
if bp.buffer.wouldOverflow(msg) {
    if err := bp.waitForSpace(msg, false); err != nil {
        bp.parent.retryMessage(msg, err)
        continue
    }
}
```

在 add 之前先调用`bp.buffer.wouldOverflow(msg)` 方法检查 buffer 是否存在足够空间以存放当前消息。

wouldOverflow 比较简单，就是判断当前消息大小或者消息数量是否超过设定值：

```go
func (ps *produceSet) wouldOverflow(msg *ProducerMessage) bool {
	switch {
	case ps.bufferBytes+msg.byteSize(version) >= int(MaxRequestSize-(10*1024)):
		return true
	case ps.msgs[msg.Topic] != nil && ps.msgs[msg.Topic][msg.Partition] != nil &&
		ps.msgs[msg.Topic][msg.Partition].bufferBytes+msg.byteSize(version) >= ps.parent.conf.Producer.MaxMessageBytes:
		return true
	case ps.parent.conf.Producer.Flush.MaxMessages > 0 && ps.bufferCount >= ps.parent.conf.Producer.Flush.MaxMessages:
		return true
	default:
		return false
	}
}
```

如果不够就要调用`bp.waitForSpace()` 等待 buffer 腾出空间，其实就是把 buffer 里的消息发到 output chan。

> 这个 output chan 就是前面匿名函数里的 bridge。

```go
func (bp *brokerProducer) waitForSpace(msg *ProducerMessage, forceRollover bool) error {
	for {
		select {
		case response := <-bp.responses:
			bp.handleResponse(response)
			if reason := bp.needsRetry(msg); reason != nil {
				return reason
			} else if !bp.buffer.wouldOverflow(msg) && !forceRollover {
				return nil
			}
		case bp.output <- bp.buffer:
			bp.rollOver()
			return nil
		}
	}
}
```



### add

接下来是调用`bp.buffer.add()`把消息添加到 buffer，功能比较简单，把待发送的消息添加到 buffer 中。

```go
func (ps *produceSet) add(msg *ProducerMessage) error {
		// 1.消息编码
		key, err = msg.Key.Encode()
		val, err = msg.Value.Encode()
		// 2.添加消息到 set.msgs 数组
		set.msgs = append(set.msgs, msg)
		// 3.添加到set.recordsToSend
		msgToSend := &Message{Codec: CompressionNone, Key: key, Value: val}
		if ps.parent.conf.Version.IsAtLeast(V0_10_0_0) {
			msgToSend.Timestamp = timestamp
			msgToSend.Version = 1
		}
		set.recordsToSend.MsgSet.addMessage(msgToSend)
		// 4. 增加 buffer 大小和 buffer 中的消息条数
		ps.bufferBytes += size
		ps.bufferCount++
}
```



`set.recordsToSend.MsgSet.addMessage`也很简单：

```go
func (ms *MessageSet) addMessage(msg *Message) {
	block := new(MessageBlock)
	block.Msg = msg
	ms.Messages = append(ms.Messages, block)
}
```



### 定时发送

因为异步发送者除了消息数或者消息大小达到阈值会触发一次发送之外，到了一定时间也会触发一次发送，具体逻辑也在这个 run 方法里，这个地方比较有意思。

```go
func (bp *brokerProducer) run() {
	var output chan<- *produceSet
	for {
		select {
		case msg, ok := <-bp.input:
        // 1.时间到了就将 bp.timerFired 设置为 true
		case <-bp.timer:
			 bp.timerFired = true
        // 3.直接把 buffer 里的消息往局部变量 output 里发
		case output <- bp.buffer:
			bp.rollOver()
		}
		// 2.如果时间到了，或者 buffer 里的消息达到阈值后都会触发真正的发送逻辑，这里实现比较有意思，需要发送的时候就把 bp.output 也就是存放真正需要发送的批量消息的 chan 赋值给局部变量 output，如果不需要发送就把局部变量 output 清空
		if bp.timerFired || bp.buffer.readyToFlush() {
			output = bp.output
		} else {
			output = nil
		}
	}
}
```

根据注释中的 1、2、3步骤看来，如果第二步需要发送就会给 output 赋值，这样下一轮 select 的时候`case output <- bp.buffer:` 这个 case 就可能会执行到，就会把消息发给 output，实际上就是发送给了 bp.output.

如果第二步时不需要发消息，output 就被置空，select 时对应的 case 就不会被执行。

> 正常写法一般是在启动一个 goroutine 来处理定时发送的功能，但是这样两个 goroutine 之间就会存在竞争，会影响性能。这样处理省去了加解锁过程，性能会高一些，但是随之而来的是代码复杂度的提升。



作者源码阅读能力实在是有限，在这个过程中很有可能会有一些错误的理解。所以当你发现了一些违和的地方，也请不吝指教，谢谢你！

再次感谢你能看到这里！



## 4. 小结

**1）具体流程：见开篇图**

**2）常见优化手段：批量处理。**

异步消费者 Go 实现中做了**消息批量发送**这个优化，当累积了足够的消息后一次性发送，减少网络请求次数以提升性能。

> 类似于 Redis Pipeline，将多次命令一次性发送，以减少 RTT。

当然为了避免在消息少的时候很久都凑不齐足够消息，导致的无法发送，一般还会设定一个**定时发送阈值**，每隔一段时间也会发送一次。

这是一种常见的优化手段，比如 IO 相关的地方肯定会有什么 bufferio 之类的库，在写时先写 buffer，buffer 满了再一次性写入到磁盘。读取也是同样的，先读到 buffer 里，然后应用程序再从 buffer 里一行行读出去。

**3）代码复杂度和性能取舍**

在分析 Sarama Proudcer 的最后一段可以看到是有一个骚操作的，这种操作可以提升性能，但是随之而来的就是代码复杂度的提升。

> 最近在看 Go runtime 里面也有很多骚操作。这种底层库、中间件这样写没什么问题，但是平常我们的业务代码就尽量别搞骚炒作了。

> "The performance improvement does not materialize from the air,it comes with code complexity increase."一dvyokov

性能不会凭空提升，随之而来的一定是代码复杂度的增加。





> Kafka 系列相关代码见 [Github][Github]

## 5. 参考

`https://github.com/Shopify/sarama`

`https://cs50mu.github.io/post/2021/01/22/source-code-of-sarama-part-i/`

`https://www.jianshu.com/p/138e0ac2e1f0`

`https://juejin.cn/post/6866316565348876296`



[Github]: https://github.com/lixd/kafka-go-example
[Sarama Producer 流程.png]:https://github.com/lixd/blog/raw/master/images/kafka/Sarama%20Producer%20%E6%B5%81%E7%A8%8B.png