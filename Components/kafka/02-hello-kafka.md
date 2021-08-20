---
title: "Kafka(Go)教程(二)---hello Kafka"
description: "Kafka 的 Golang 客户端 sarama 基本使用"
date: 2021-07-30 22:00:00
draft: false
categories: ["Kafka"]
tags: ["Kafka"]
---

本文记录了 Kafka Golang 客户端(sarama)基本使用。

<!--more-->

## 1. 概述

> Kafka 系列相关代码见 [Github][Github]

Kafka 的 Golang 客户端比较少，不像 Java 由官方维护，Golang 的都是社区在维护。

这里选取的是 [sarama](https://github.com/Shopify/sarama),社区活跃度还行，不过封装度比较低，比较接近原生，不过有好处也有坏处吧，如果对 Kafka 比较熟悉使用起来还是不错的。



## 2. Demo

这是一个简单的 Hello World 示例，主要用于演示如何使用 Kafka 和 测试上文中部署的 kafka 能否正常工作。

和其他 MQ 一样， Kafka 中同样分为 producer 和 consumer。



### 2.1 producer

```go
package sync

import (
	"log"
	"strconv"
	"time"

	"github.com/Shopify/sarama"
	"kafka-go-example/conf"
)


func Produce(topic string, limit int) {
	config := sarama.NewConfig()
	config.Producer.Return.Successes = true
	config.Producer.Return.Errors = true 
	producer, err := sarama.NewSyncProducer([]string{conf.HOST}, config)
	if err != nil {
		log.Fatal("NewSyncProducer err:", err)
	}
	defer producer.Close()
	for i := 0; i < limit; i++ {
		str := strconv.Itoa(int(time.Now().UnixNano()))
		
		msg := &sarama.ProducerMessage{Topic: topic, Key: nil, Value: sarama.StringEncoder(str)}
		partition, offset, err := producer.SendMessage(msg) 
		if err != nil {
			log.Println("SendMessage err: ", err)
			return
		}
		log.Printf("[Producer] partitionid: %d; offset:%d, value: %s\n", partition, offset, str)
	}
}

```



### 2.2 consumer

```go
func Consume(topic string) {
	config := sarama.NewConfig()
	consumer, err := sarama.NewConsumer([]string{conf.HOST}, config)
	if err != nil {
		log.Fatal("NewConsumer err: ", err)
	}
	defer consumer.Close()
	partitionConsumer, err := consumer.ConsumePartition(topic, 0, sarama.OffsetNewest)
	if err != nil {
		log.Fatal("ConsumePartition err: ", err)
	}
	defer partitionConsumer.Close()

	for message := range partitionConsumer.Messages() {
		log.Printf("[Consumer] partitionid: %d; offset:%d, value: %s\n", message.Partition, message.Offset, string(message.Value))
	}
}
```



### 2.3 Test

先启动 consumer  

```sh
lixd@17x:~/17x/projects/kafka-go-example/helloworld/consumer/cmd$ go run main.go 
```

再启动 producer

```sh
lixd@17x:~/17x/projects/kafka-go-example/helloworld/producer/cmd$ go run main.go 
2021/07/31 10:38:32 [Producer] partitionid: 0; offset:7340, value: 1627699112413451557
2021/07/31 10:38:32 [Producer] partitionid: 0; offset:7341, value: 1627699112483251015
2021/07/31 10:38:32 [Producer] partitionid: 0; offset:7342, value: 1627699112518530847
2021/07/31 10:38:32 [Producer] partitionid: 0; offset:7343, value: 1627699112552429595
2021/07/31 10:38:32 [Producer] partitionid: 0; offset:7344, value: 1627699112586320615
2021/07/31 10:38:32 [Producer] partitionid: 0; offset:7345, value: 1627699112621294679
2021/07/31 10:38:32 [Producer] partitionid: 0; offset:7346, value: 1627699112656351458
2021/07/31 10:38:32 [Producer] partitionid: 0; offset:7347, value: 1627699112690306556
2021/07/31 10:38:32 [Producer] partitionid: 0; offset:7348, value: 1627699112724161792
```

可以看到 生产者启动就开始往 kafka 中发送消息了。

切换回 consumer 看是否能正常消费。

```sh
2021/07/31 10:38:32 [Consumer] partitionid: 0; offset:7340, value: 1627699112413451557
2021/07/31 10:38:32 [Consumer] partitionid: 0; offset:7341, value: 1627699112483251015
2021/07/31 10:38:32 [Consumer] partitionid: 0; offset:7342, value: 1627699112518530847
2021/07/31 10:38:32 [Consumer] partitionid: 0; offset:7343, value: 1627699112552429595
2021/07/31 10:38:32 [Consumer] partitionid: 0; offset:7344, value: 1627699112586320615
2021/07/31 10:38:32 [Consumer] partitionid: 0; offset:7345, value: 1627699112621294679
2021/07/31 10:38:32 [Consumer] partitionid: 0; offset:7346, value: 1627699112656351458
```



ok，一切正常。



## 3. 小结

本文主要通过一个 HelloWorld Demo 测试了上文部署的 Kafka 能否正常工作。

同时也展示了 Kafka Golang 客户端的基本使用。

文中相关的名词、概念会在后续文章中给出详细解释。



> kKfka 系列相关代码见 [Github][Github]



[Github]:https://github.com/lixd/kafka-go-example