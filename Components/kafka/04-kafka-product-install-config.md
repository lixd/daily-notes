---
title: "Kafka(Go)教程(四)---Kafka 线上部署与集群参数配置"
description: "Kafka 线上部署与集群参数配置"
date: 2021-08-06 22:00:00
draft: false
categories: ["Kafka"]
tags: ["Kafka"]
---

本文主要记录了 Kafka 线上环境集群部署考虑因素以及非常非常重要的 Kafka 参数配置讲解。

<!--more-->

## 1. 概述

Kafka 生产环境的一些注意事项，包括集群部署的考量和 集群配置参数的设置等，具体见下图：

![kafka-config-params][kafka-config-params]





## 2. 集群部署

### 2.1 操作系统

主要为以下 3 方面：

* I/O 模型的使用
  * Kafka 客户端底层使用了 Java 的 selector，selector 在 Linux 上的实现机制是 epoll，而在 Windows 平台上的实现机制是 select。
* 数据网络传输效率
  * 在 Linux 部署 Kafka 能够享受到零拷贝技术所带来的快速数据传输特性。
* 社区支持度
  * 主要支持 Linux



### 2.2 磁盘

Kafka 使用磁盘的方式多是顺序读写操作，一定程度上规避了机械磁盘最大的劣势，即随机读写操作慢。

> 即 SDS 优势并不大

一方面 Kafka 自己实现了冗余机制来提供高可靠性；另一方面通过分区的概念，Kafka 也能在软件层面自行实现负载均衡。

> RAID 也没必要上了

所以机械磁盘即可。



### 2.3 磁盘容量

规划磁盘容量时你需要考虑下面这几个元素：

* 新增消息数
* 消息留存时间
* 平均消息大小
* 备份数
* 是否启用压缩

假设每天需要向 Kafka 集群发送 1 亿条消息，每条消息保存两份以防止数据丢失，另外消息默认保存两周时间。现在假设消息的平均大小是 1KB。

那么每天的空间大小就等于 1 亿(消息数) * 1KB(消息大小) * 2(备份数) / 1000 / 1000 = 200GB。

一般情况下 Kafka 集群除了消息数据还有其他类型的数据，比如索引数据等，故我们再为这些数据预留出 10% 的磁盘空间，因此总的存储容量就是 220GB。

既然要保存两周，那么整体容量即为 220GB * 14，大约 3TB 左右。

Kafka 支持数据的压缩，假设压缩比是 0.75，那么最后你需要规划的存储空间就是 0.75 * 3 = 2.25TB。



### 2.4 带宽

假设 1 小时内处理 1TB 的业务数据，同时假设带宽是 1Gbps。

通常情况下你只能假设 Kafka 会用到 70% 的带宽资源，因为总要为其他应用或进程留一些资源。

另外不能让 Kafka 服务器常规性使用这么多资源，故通常要再额外预留出 2/3 的资源。

即单台服务器使用带宽 1G * 70%  / 3  ≈  240Mbps

> 这里的 2/3 其实是相当保守的，你可以结合你自己机器的使用情况酌情减少此值。

 1 小时内处理 1TB 数据，即每秒需要处理 2336Mb，除以 240，约等于 10 台服务器。如果消息还需要额外复制两份，那么总的服务器台数还要乘以 3，即 30 台。



### 2.5 小结

| 因素     | 考量点                                    | 建议                                                         |
| -------- | ----------------------------------------- | ------------------------------------------------------------ |
| 操作系统 | 操作系统 I/O 模型                         | Linux                                                        |
| 磁盘类型 | 磁盘 I/O 性能                             | 普通环境 机械硬盘 即可                                       |
| 磁盘容量 | 根据消息数、留存时间预估磁盘容量          | 实际使用中建议预留20%~30%磁盘空间                            |
| 带宽     | 根据实际带宽资源和业务 SLA 预估服务器数量 | 对于千兆网络，建议每台服务器按照700Mbps来计算，避免大流量下的丢包 |





## 3. 参数配置

### 3.1 Broker 端参数

**存储信息相关参数**

* **log.dirs**：这是非常重要的参数，指定了 Broker 需要使用的若干个文件目录路径。
  * **该参数没有默认值，必须手动指定。**

* **log.dir**：注意这是 dir，结尾没有 s，说明它只能表示单个路径，它是补充上一个参数用的。

建议：**只设置log.dirs 即可，不用设置 log.dir**。而且更重要的是，在线上生产环境中一定要为 log.dirs **配置用逗号分隔的多个路径**。

> 比如 /home/kafka1,/home/kafka2,/home/kafka3 这样

如果有条件的话你最好保证这些目录挂载到不同的物理磁盘上。这样做有两个好处：

* 提升读写性能：比起单块磁盘，多块物理磁盘同时读写数据有更高的吞吐量。
* 能够实现故障转移：即 Failover。这是 Kafka 1.1 版本新引入的强大功能，Kafka Broker 上任意一快磁盘坏掉后，上面的数据会自动地转移到其他正常的磁盘上，而且 Broker 还能正常工作。



**Zookeeper 相关参数**

**zookeeper.connect**：zk 的连接地址，这也是一个 CSV 格式的参数，比如我可以指定它的值为zk1:2181,zk2:2181,zk3:2181。

如果多个 Kafka 集群使用同一套 ZooKeeper 集群，可以使用 Zookeeper 的 chroot 功能。

只需要将参数这样设置：`zk1:2181,zk2:2181,zk3:2181/kafka1`和`zk1:2181,zk2:2181,zk3:2181/kafka2`。

切记 chroot 只需要写一次，而且是加到最后的。



**Broker 连接相关参数**

* **listeners**：学名叫监听器，其实就是告诉外部连接者要通过什么协议访问指定主机名和端口开放的 Kafka 服务。
* **advertised.listeners**：和 listeners 相比多了个 advertised。Advertised 的含义表示宣称的、公布的，就是说这组监听器是 Broker 用于对外发布的。

>  注意：host.name/port 为过期参数，不建议再使用了。

监听器它是若干个逗号分隔的三元组，每个三元组的格式为`<协议名称，主机名，端口号>`。

这里的协议名称可能是标准的名字，比如 PLAINTEXT 表示明文传输、SSL 表示使用 SSL 或 TLS 加密传输等；也可能是你自己定义的协议名字，比如CONTROLLER: //localhost:9092。

一旦你自己定义了协议名称，你必须还要指定`listener.security.protocol.map`参数告诉这个协议底层使用了哪种安全协议，比如指定listener.security.protocol.map=CONTROLLER:PLAINTEXT表示CONTROLLER这个自定义协议底层使用明文不加密传输数据。

> 注意：主机名真的就是填写主机名，不建议填写 IP。



**Topic 管理相关参数**

* **auto.create.topics.enable**：是否允许自动创建 Topic
  * 即：生产者往不存在的 Topic 发送消息时，是否允许自动创建该 Topic
  * 测试环境可以开启(true)，生产环境建议关闭(false)。
* **unclean.leader.election.enable**：是否允许 Unclean Leader 选举
  * 即：是否允许落后 Leader 太多的副本参加 Leader 选举
  * 如果数据落后的副本 选举为新 Leader 后可能会丢失数据
  * 建议设置为 false
* **auto.leader.rebalance.enable**：是否允许定期进行 Leader 选举。
  * 切换 Leader 代价是很大的，所有建议设置为 false



**数据留存相关参数**

* **log.retention.{hours|minutes|ms}**：这是个“三兄弟”，都是控制一条消息数据被保存多长时间。从优先级上来说 ms 设置最高、minutes 次之、hours 最低。
  * 虽然 ms 设置有最高的优先级，但是通常情况下我们还是设置 hours 级别的多一些，毕竟不需这么精确。
  * 比如 log.retention.hours=168 表示默认保存 7 天的数据，自动删除 7 天前的数据。
* **log.retention.bytes**：这是指定 Broker 为消息保存的总磁盘容量大小。
  * 默认值为 -1 即：可以存储任意数据的消息，一般不用修改，除非是多租户场景。
* **message.max.bytes**：控制 Broker 能够接收的最大消息大小。
  * 默认的 1000012 太少了，还不到 1MB，实际场景中突破 1M 的消息还是比较多的
  * 因此在线上环境中设置一个比较大的值还是比较保险的做法。



### 3.2 Topic 级别参数

如果同时设置了 Topic 级别参数和全局 Broker 参数， **Topic 级别参数会覆盖全局 Broker 参数的值**。

* **retention.ms**：规定了该 Topic 消息被保存的时长。默认是 7 天，即该 Topic 只保存最近 7 天的消息。一旦设置了这个值，它会覆盖掉 Broker 端的全局参数值。
* **retention.bytes**：规定了要为该 Topic 预留多大的磁盘空间。和全局参数作用相似，这个值通常在多租户的 Kafka 集群中会有用武之地。当前默认值是 -1，表示可以无限使用磁盘空间。
* **max.message.bytes**：它决定了 Kafka Broker 能够正常接收该 Topic 的最大消息大小。

Topic 级别参数有两种修改方式：

* 创建 Topic 时进行设置
* 动态设置

可以在创建时指定

```sh
bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic transaction --partitions 1 --replication-factor 1 --config retention.ms=15552000000 --config max.message.bytes=5242880
```

也可以动态设置

```sh
bin/kafka-configs.sh --zookeeper localhost:2181 --entity-type topics --entity-name transaction --alter --add-config max.message.bytes=10485760
```



建议统一使用动态修改方式。



### 3.3 JVM 参数



*  JVM 堆大小
  * 建议设置成 6GB ，这是目前业界比较公认的一个合理值
* 垃圾回收器
  * 如果 Broker 所在机器的 CPU 资源非常充裕，建议使用 CMS 收集器。启用方法是指定-XX:+UseCurrentMarkSweepGC。
  * 否则，使用吞吐量收集器。开启方法是指定-XX:+UseParallelGC。
  * 如果使用 Java 8，那么可以手动设置使用 G1 收集器



### 3.4 操作系统参数

* 文件描述符限制
  * 通常情况下将它设置成一个超大的值是合理的做法，比如 ulimit -n 1000000
* 文件系统类型
  * 根据官网的测试报告，ZFS > XFS > ext4
* Swappiness
  * 不建议直接将交换空间设置为 0 ，可以设置为一个较小值。
  * 一旦设置成 0，当物理内存耗尽时，操作系统会触发 OOM killer 这个组件
  * 如果设置成一个比较小的值，当开始使用 swap 空间时，你至少能够观测到 Broker 性能开始出现急剧下降，从而给你进一步调优和诊断问题的时间
* 提交时间 或者说是 Flush 落盘时间。
  * 向 Kafka 发送数据并不是真要等数据被写入磁盘才会认为成功，而是只要数据被写入到操作系统的页缓存（Page Cache）上就可以了，随后操作系统根据 LRU 算法会定期将页缓存上的“脏”数据落盘到物理磁盘上。
  * 这个定期就是由提交时间来确定的，默认是 5 秒。一般情况下我们会认为这个时间太频繁了，**可以适当地增加提交间隔来降低物理磁盘的写操作**。
  * 因为 Kafka 在软件层面已经提供了多副本的冗余机制，所以这里稍微拉大提交间隔去换取性能还是一个合理的做法。



## 4. 参考

`https://kafka.apache.org/documentation/#configuration`

`《Kafka 核心技术与实战》`





[kafka-config-params]:https://github.com/lixd/blog/raw/master/images/kafka/kafka-config-params.png