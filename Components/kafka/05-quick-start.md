---
title: "Kafka(Go)教程(五)---Producer-Consumer API 基本使用"
description: "Kafka Go sarama 客户端同步异步生产者,独立消费者和消费者组的基本使用"
date: 2021-08-13 22:00:00
draft: false
categories: ["Kafka"]
tags: ["Kafka"]
---

本文主要讲解其中的 Producer API 和 Consumer API 在 Go Client sarama 中的使基本使用以及注意事项。

<!--more-->

## 1. 概述

> Kakfa 相关代码见 [Github][Github]

 Kafka 有 5 个核心 API：

* Producer API
* Consumer API
* Stream API
* Connect API
* Admin API

在 Go sarama 客户端中暂时只实现了 Producer、Consumer、Admin 3 个API。

> 其中 Stream API 已经明确表示不会支持，Connect 未知。





## 2. Producer API

Kafka 中生产者分为同步生产者和异步生产者。

顾名思义，同步生产者每条消息都会实时发送到 Kafka，而异步生产者则为了提升性能，会等待存了一批消息或者到了指定间隔时间才会一次性发送到 Kafka。

### Async Producer

sarama 中异步生产者使用 Demo 如下

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
		for {
			select {
			case s := <-producer.Successes():
				log.Printf("[Producer] key:%v msg:%+v \n", s.Key, s.Value)
			case e := <-producer.Errors():
				if e != nil {
					log.Printf("[Producer] err:%v msg:%+v \n", e.Msg, e.Err)
				}
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



注意点：

异步生产者只需要将消息发送到 chan 就会返回，同样的具体的响应包括 Success 或者 Errors 也是通过 chan 异步返回的。

**必须把返回值从 Errors 或者 Successes 中读出来 不然会阻塞 producer.Input()**



### Sync Producer

同步生产者就更简单了：

```go
func Producer(topic string, limit int) {
	config := sarama.NewConfig()
	// 同步生产者必须同时开启 Return.Successes 和 Return.Errors
	// 因为同步生产者在发送之后就必须返回状态，所以需要两个都返回
	config.Producer.Return.Successes = true
	config.Producer.Return.Errors = true // 这个默认值就是 true 可以不用手动 赋值
	// 同步生产者和异步生产者逻辑是一致的，Success或者Errors都是通过channel返回的，
	// 只是同步生产者封装了一层，等channel返回之后才返回给调用者
	// 具体见 sync_producer.go 文件72行 newSyncProducerFromAsyncProducer 方法
	// 内部启动了两个 goroutine 分别处理Success Channel 和 Errors Channel
	// 同步生产者内部就是封装的异步生产者
	// type syncProducer struct {
	// 	producer *asyncProducer
	// 	wg       sync.WaitGroup
	// }
	producer, err := sarama.NewSyncProducer([]string{kafka.HOST}, config)
	if err != nil {
		log.Fatal("NewSyncProducer err:", err)
	}
	defer producer.Close()
	for i := 0; i < limit; i++ {
		str := strconv.Itoa(int(time.Now().UnixNano()))
		msg := &sarama.ProducerMessage{Topic: topic, Key: nil, Value: sarama.StringEncoder(str)}
		partition, offset, err := producer.SendMessage(msg) // 发送逻辑也是封装的异步发送逻辑，可以理解为将异步封装成了同步
		if err != nil {
			log.Println("SendMessage err: ", err)
			return
		}
		log.Printf("[Producer] partitionid: %d; offset:%d, value: %s\n", partition, offset, str)
	}
}
```



注意点：

**必须同时开启 Return.Successes 和 Return.Errors**



## 3. Consumer API

Kafka 中消费者分为独立消费者和消费者组。

### StandaloneConsumer

```go
// SinglePartition 单分区消费
func SinglePartition(topic string) {
	config := sarama.NewConfig()
	consumer, err := sarama.NewConsumer([]string{kafka.HOST}, config)
	if err != nil {
		log.Fatal("NewConsumer err: ", err)
	}
	defer consumer.Close()
	// 参数1 指定消费哪个 topic
	// 参数2 分区 这里默认消费 0 号分区 kafka 中有分区的概念，类似于ES和MongoDB中的sharding，MySQL中的分表这种
	// 参数3 offset 从哪儿开始消费起走，正常情况下每次消费完都会将这次的offset提交到kafka，然后下次可以接着消费，
	// 这里demo就从最新的开始消费，即该 consumer 启动之前产生的消息都无法被消费
	// 如果改为 sarama.OffsetOldest 则会从最旧的消息开始消费，即每次重启 consumer 都会把该 topic 下的所有消息消费一次
	partitionConsumer, err := consumer.ConsumePartition(topic, 0, sarama.OffsetOldest)
	if err != nil {
		log.Fatal("ConsumePartition err: ", err)
	}
	defer partitionConsumer.Close()
	// 会一直阻塞在这里
	for message := range partitionConsumer.Messages() {
		log.Printf("[Consumer] partitionid: %d; offset:%d, value: %s\n", message.Partition, message.Offset, string(message.Value))
	}
}
```



```go
// Partitions 多分区消费
func Partitions(topic string) {
	config := sarama.NewConfig()
	consumer, err := sarama.NewConsumer([]string{kafka.HOST}, config)
	if err != nil {
		log.Fatal("NewConsumer err: ", err)
	}
	defer consumer.Close()
	// 先查询该 topic 有多少分区
	partitions, err := consumer.Partitions(topic)
	if err != nil {
		log.Fatal("Partitions err: ", err)
	}
	var wg sync.WaitGroup
	// 然后每个分区开一个 goroutine 来消费
	for _, partitionId := range partitions {
		consumeByPartition(consumer, partitionId, &wg)
	}
	wg.Wait()
}

func consumeByPartition(consumer sarama.Consumer, partitionId int32, wg *sync.WaitGroup) {
	defer wg.Done()
	partitionConsumer, err := consumer.ConsumePartition(kafka.Topic, partitionId, sarama.OffsetOldest)
	if err != nil {
		log.Fatal("ConsumePartition err: ", err)
	}
	defer partitionConsumer.Close()
	for message := range partitionConsumer.Messages() {
		log.Printf("[Consumer] partitionid: %d; offset:%d, value: %s\n", message.Partition, message.Offset, string(message.Value))
	}
}
```



反复运行上面的 Demo 会发现，每次都会从第 1 条消息开始消费，一直到消费完全部消息。

这不是妥妥的重复消费吗?

Kafka 和其他 MQ 最大的区别在于 Kafka 中的消息在消费后不会被删除，而是会一直保留，直到过期。

为了防止每次重启消费者都从第 1 条消息开始消费，**我们需要在消费消息后将 offset 提交给 Kafka**。这样重启后就可以接着上次的 Offset 继续消费了。



### OffsetManager

在独立消费者中没有实现提交 Offset 的功能，所以我们需要借助 OffsetManager 来完成。

```go
func OffsetManager(topic string) {
	config := sarama.NewConfig()
	// 配置开启自动提交 offset，这样 samara 库会定时帮我们把最新的 offset 信息提交给 kafka
	config.Consumer.Offsets.AutoCommit.Enable = true              // 开启自动 commit offset
	config.Consumer.Offsets.AutoCommit.Interval = 1 * time.Second // 自动 commit时间间隔
	client, err := sarama.NewClient([]string{kafka.HOST}, config)
	if err != nil {
		log.Fatal("NewClient err: ", err)
	}
	defer client.Close()
	// offsetManager 用于管理每个 consumerGroup的 offset
	// 根据 groupID 来区分不同的 consumer，注意: 每次提交的 offset 信息也是和 groupID 关联的
	offsetManager, _ := sarama.NewOffsetManagerFromClient("myGroupID", client) // 偏移量管理器
	defer offsetManager.Close()
	// 每个分区的 offset 也是分别管理的，demo 这里使用 0 分区，因为该 topic 只有 1 个分区
	partitionOffsetManager, _ := offsetManager.ManagePartition(topic, kafka.DefaultPartition) // 对应分区的偏移量管理器
	defer partitionOffsetManager.Close()
	// defer 在程序结束后在 commit 一次，防止自动提交间隔之间的信息被丢掉
	defer offsetManager.Commit()
	consumer, _ := sarama.NewConsumerFromClient(client)
	// 根据 kafka 中记录的上次消费的 offset 开始+1的位置接着消费
	nextOffset, _ := partitionOffsetManager.NextOffset() // 取得下一消息的偏移量作为本次消费的起点
	pc, _ := consumer.ConsumePartition(topic, kafka.DefaultPartition, nextOffset)
	defer pc.Close()

	for message := range pc.Messages() {
		value := string(message.Value)
		log.Printf("[Consumer] partitionid: %d; offset:%d, value: %s\n", message.Partition, message.Offset, value)
		// 每次消费后都更新一次 offset,这里更新的只是程序内存中的值，需要 commit 之后才能提交到 kafka
		partitionOffsetManager.MarkOffset(message.Offset+1, "modified metadata") // MarkOffset 更新最后消费的 offset
	}
}
```

1）创建偏移量管理器

```go
offsetManager, _ := sarama.NewOffsetManagerFromClient("myGroupID", client)
```

2）创建对应分区的偏移量管理器

> Kafka 中每个分区的偏移量是单独管理的

```go
partitionOffsetManager, _ := offsetManager.ManagePartition(topic, kafka.DefaultPartition)
```

3）记录偏移量

> 这里记录的是下一条要取的消息，而不是取的最后一条消息，所以需要 +1

```go
partitionOffsetManager.MarkOffset(message.Offset+1, "modified metadata")
```

4）提交偏移量

> sarama 中默认会自动提交偏移量，但还是建议用 defer 在程序退出的时候手动提交一次。

```go
defer offsetManager.Commit()
```





### ConsumerGroup

Kafka 消费者组中可以存在多个消费者，**Kafka 会以 partition 为单位将消息分给各个消费者**。**每条消息只会被消费者组的一个消费者消费**。

> 注意：是以分区为单位，如果消费者组中有两个消费者，但是订阅的 Topic 只有 1 个分区，那么注定有一个消费者永远消费不到任何消息。

消费者组的好处在于并发消费，Kafka 把分发逻辑已经实现了，我们只需要启动多个消费者即可。

> 如果只有一个消费者，我们需要手动获取消息后分发给多个 Goroutine，需要多写一段代码，而且 Offset 维护还比较麻烦。



```go
// MyConsumerGroupHandler 实现 sarama.ConsumerGroup 接口，作为自定义ConsumerGroup
type MyConsumerGroupHandler struct {
	name  string
	count int64
}

// Setup 执行在 获得新 session 后 的第一步, 在 ConsumeClaim() 之前
func (MyConsumerGroupHandler) Setup(_ sarama.ConsumerGroupSession) error { return nil }

// Cleanup 执行在 session 结束前, 当所有 ConsumeClaim goroutines 都退出时
func (MyConsumerGroupHandler) Cleanup(_ sarama.ConsumerGroupSession) error { return nil }

// ConsumeClaim 具体的消费逻辑
func (h MyConsumerGroupHandler) ConsumeClaim(sess sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	for msg := range claim.Messages() {
		// fmt.Printf("[consumer] name:%s topic:%q partition:%d offset:%d\n", h.name, msg.Topic, msg.DefaultPartition, msg.Offset)
		// 标记消息已被消费 内部会更新 consumer offset
		sess.MarkMessage(msg, "")
		sess.Commit()
		h.count++
		if h.count%100 == 0 {
			fmt.Printf("name:%s 消费数:%v\n", h.name, h.count)
		}
	}
	return nil
}

func ConsumerGroup(topic, group, name string) {
	config := sarama.NewConfig()
	config.Consumer.Return.Errors = true
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	cg, err := sarama.NewConsumerGroup([]string{kafka.HOST}, group, config)
	if err != nil {
		log.Fatal("NewConsumerGroup err: ", err)
	}
	defer cg.Close()
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		handler := MyConsumerGroupHandler{name: name}
		for {
			fmt.Println("running: ", name)
			/*
				应该在一个无限循环中不停地调用 Consume()
				因为每次 Rebalance 后需要再次执行 Consume() 来恢复连接
				Consume 开始才发起 Join Group 请求 如果当前消费者加入后成为了 消费者组 leader,则还会进行 Rebalance 过程，从新分配
				组内每个消费组需要消费的 topic 和 partition，最后 Sync Group 后才开始消费
			*/
			err = cg.Consume(ctx, []string{topic}, handler)
			if err != nil {
				log.Println("Consume err: ", err)
			}
			// 如果 context 被 cancel 了，那么退出
			if ctx.Err() != nil {
				return
			}
		}
	}()
	wg.Wait()
}
```

注意点：

主要是实现`sarama.ConsumerGroup`接口。`Setup`和`Cleanup`都是一些辅助性的工作，真正的逻辑在 `ConsumeClaim`方法中。

```go
func (h MyConsumerGroupHandler) ConsumeClaim(sess sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	for msg := range claim.Messages() {
		// 标记消息已被消费 内部会更新 consumer offset
		sess.MarkMessage(msg, "")
	}
	return nil
}
```

需要调用`sess.MarkMessage()`方法更新 Offset。



> Kakfa 相关代码见 [Github][Github]

## 4. 小结

1）生产者

* 同步生产者
  * 同步发送，效率低实时性高
* 异步生产者
  * 异步发送，效率高
  * 消息大小、数量达到阈值或间隔时间达到设定值时触发发送

异步生产者不会阻塞，而且会批量发送消息给 Kafka，性能上优于 同步生产者。



2）消费者

* 独立消费者
  * 需要配合 OffsetManager 使用
* 消费者组
  * 以分区为单位将消息分发给组里的各个消费者
  * 若消费者数大于分区数，必定有消费者消费不到消息



[Github]:https://github.com/lixd/kafka-go-example