## Redis Stream

> [Redis Stream 实践](https://juejin.cn/post/6844903641732612103)
>
> [基于Redis的Stream类型的完美消息队列解决方案](https://zhuanlan.zhihu.com/p/60501638)
>
> [Redis5新特性Streams作消息队列](https://www.cnblogs.com/ytao-blog/p/12522070.html)
>
> [Redis 5.0 新特性 Stream 尝鲜](https://toutiao.io/posts/2agvp3/preview)





## 1. 概述

Streams 是 Redis 5.0 版本引入的数据类型,是以更抽象的方式对日志数据的建模. 其日志本质是依然是完整的:以一种追加写入的方式。

Redis Streams 是以只追加为主的数据类型. 同时作为内存的抽象数据类型,Redis Streams 实现了更加强大的操作来克服日志文件的限制。

Streams 作为 Redis 中最复杂的数据类型,得益于实现了额外且非强制的特性,一系列阻塞操作和称之为消费组的概念。

消费组最初是由 kafka 引入的概述, Redis 以全新的方式重写达到相似理念.不过放心,大家的目标是相同的,就是让一组客户端能够以不同的视角来合作消费流中的消息。



## 2. 概念

首先第一点是：**Redis Stream 不光是 MQ，也是一个存储**。

> 类似于 Kafka，但又有所不同。

### 基本套路

首先是生产消息(XADD)存到 Redis，这和普通 MQ 一样。

然后是查询消息，可以是简单查询(XREAD)或者范围查询(XRANGE)。这个和 Kafka 基本一致，需要指定 offset 来查询(不过Kafka会存储在Server端，Redis需要自己存)，然后查询后消息不会删除，会一直存在（Kafka也类似，不过有过期时间）。

最后是删除消息，由于只是查询的话消息会一直堆积，因此提供了删除接口。

到此，**一个基本流程就是**：先添加消息，然后查询消息，处理完成后删除消息。



### 消费者组

上述的基本流程在单消费者时没有问题，如果多消费者则会出现重复消费问题。

> 查询和删除不是原子操作。

Redis Stream 也提供了消费者组，类似于 Kafka。同时也提供了真正的消费和ACK API。

首先自然是创建一个消费者组(XGROUP CREATE )。

然后产生消息(XADD)。

接着消费者组中的消费者进行消费(XGROUPREAD)，被一个消费者消费过的消息不会再被其他消费者消费，这就避免了重复消费问题。

> 这也是XGROUPREAD和XREAD的差别。

最后则是消费逻辑结束后的 ACK(XACK)。消费后，ACK 之前，消息会存在消费历史记录(XGROUPREAD 将初始ID设置为0)中，通过查询该记录可以看到消费了但是为确认的消息，可以进行**失败处理**。





## 3. 演示

本节主要记录了常用的一下 API，完整 API 请参考 [官方文档](https://redis.io/commands#stream)



### [XADD](https://redis.io/commands/xadd)

> XADD key ID field string [field string ...]

* key：stream 的名字

* ID：消息ID，一般为`*`星号，表示由 Redis 自动生成 ID，这也是强烈建议的方案

* field string [field string ...]：当前消息内容，由1个或多个key-value构成，可以看做是一个 map 结构。

  

```shell
redis-cnh:1>XADD mystream * title "redis stream" link "https://www.lixueduan.com"
"1645420850255-0"
```

返回值`1645420850255-0`为当前消息的 ID，两个部分数字都是64位的，自动生成的 ID 格式如下：

* 第一部分是生成ID的Redis实例的毫秒格式的Unix时间。
*  第二部分只是一个序列号，是用来区分同一毫秒内生成的ID的。



注意点：消息ID一般使用`*`，让 Redis 自动生成。



### [XREAD](https://redis.io/commands/xread)

从一个或多个流中读取数据，仅返回 ID 大于调用者指定的 ID 的条目。

> XREAD [COUNT count] [BLOCK milliseconds] STREAMS key [key ...] id [id ...]



* COUNT：限制本次读取的消息最大数量
* BLOCK ：表示阻塞方式执行 Read，并指定超时时间，0 则表示永不超时
  * 类似于 tail -f
* key [key ...]：指定要读取的 stream 名字，可以指定 1个或 多个。
* id [id ...]：指定要读取的消息的最小ID，只会返回比该ID大的消息，也是可以指定多个。
  * 指定为 0 则可以查询到所有的消息
  * `$` 表示 stream 中的最大ID，指定为`$`则表示只监听后续的消息



```shell
redis-cnh:1>XREAD STREAMS mystream 0
1) 1) "mystream"
   2) 1) 1) "1645416348978-0"
         2) 1) "sensor-id"
            2) "1234"
            3) "temperature"
            4) "19.8"
```



### [XRANGE](https://redis.io/commands/xrange)

该命令返回匹配给定 ID 范围的流条目。范围由最小和最大 ID 指定。返回具有两个指定的 ID 或恰好是指定的两个 ID 之一（闭区间）的所有条目。

> 由于ID中包含了时间，因此可以用于查询特定时间范围内的消息。



> XRANGE key start end [COUNT count]

* key ：stream 名字
*  start end：ID 的起止范围
  * `-`、`+`分别代表Stream中de最小ID和最大ID，可以用于查询全部消息
* COUNT ：指定返回的消息数



**ID 补全**

ID有时间戳和序号组成，如果只提供时间戳部分Redis 会自动补全序号：

* start 位置序号自动补全为0
* end 位置序号自动补全为最大值

比如：

```shell
XRANGE somestream 1526985054069 1526985055069
```

会自动补全为

```shell
XRANGE somestream 1526985054069-0 1526985055069-maxSeq
```

也就是查询当前毫秒内产生的消息。



**开闭区间**

默认为闭区间，可以通过`(`或者`)`来指定成开区间。

比如下面这条命令就会查询除了`1526985685298-0`以外的所有消息。

```shell
XRANGE writers (1526985685298-0 + COUNT 2
```



### [XDEL](https://redis.io/commands/xdel)

从 Stream 删除指定消息。

> XDEL key id [id ...]



* key ：stream 名字
* id [id ...]：待删除消息的 ID，可以指定多个



```shell
redis-cnh:1>XRANGE mystream - +
1) 1) "1645420850255-0"
   2) 1) "title"
      2) "redis stream"
      3) "link"
      4) "https://www.lixueduan.com"


2) 1) "1645424995543-0"
   2) 1) "key1"
      2) "value1"


3) 1) "1645429600464-0"
   2) 1) "k1"
      2) "v1"



redis-cnh:1>XDEL mystream 1645429600464-0
"1"
redis-cnh:1>XRANGE mystream - +
1) 1) "1645420850255-0"
   2) 1) "title"
      2) "redis stream"
      3) "link"
      4) "https://www.lixueduan.com"


2) 1) "1645424995543-0"
   2) 1) "key1"
      2) "value1"
```







### [XGROUP CREATE](https://redis.io/commands/xgroup-create)

创建消费者组,消费者组名字在每个 Stream 中必须唯一，否则该命令返回`-BUSYGROUP`错误。

> XGROUP CREATE key groupname id|$ [MKSTREAM]



* key ：stream 名字
* groupname ：消费者组名字
* id：当前消费者组可以从指定ID之后消费起走
  * 指定 0 则可以消费到所有消息
  * `$`表示当前 Stream 中最大的 ID，即这个消费者组只能消费到创建之后产生的消息
* MKSTREAM：STREAM 不存在时是否自动创建。





```shell
# STREAM 不存在时报错
redis:6379> XGROUP CREATE mystream mygroup01 $
OK
# STREAM 不存在自动创建
redis:6379> XGROUP CREATE notExistsStream mygroup01 $ MKSTREAM 
OK
```

针对 **mystream** 这个 stream 创建了一个消费者组，名字为 **mygroup01**，**$** 表示读取目前最大ID之后的元素。





### [XGROUP DESTROY](https://redis.io/commands/xgroup-destroy)

删除指定消费者组。

> XGROUP DESTROY key groupname



* key ：stream 名字
* groupname：待删除的消费者组名字



```shell
redis-cnh:1>XGROUP DESTROY mystream mygroup01
"1"
```





### [XREADGROUP](https://redis.io/commands/xreadgroup)

XREADGROUP命令是 XREAD 命令的特殊版本,支持消费者组。



> XREADGROUP GROUP group consumer [COUNT count] [BLOCK milliseconds] [NOACK] STREAMS key [key ...] id [id ...]

* group ：消费者组名字
* consumer：消费者名字
  * 消费者不存在时会自动创建
*  [COUNT count]：限制一次消费的消息条数
*  [BLOCK milliseconds] ：是否阻塞和对应超时时间
*  [NOACK] ：消息消费后是否加入未确认消息列表，也可以理解为读取到消息后就自动 ACK，一般建议设置为 false。
* key [key ...]：指定要读取的 stream 名字，可以指定 1个或 多个。
* id [id ...]：指定要读取的消息的最小ID，只会返回比该ID大的消息，也是可以指定多个。
  * 指定为 `>` 则只会返回**没有被其他消费者消费的消息**
  * 指定其他任何ID都会返回大于该ID的消息，并且是**被当前消费者消费了但是还未 ACK 的消息**。



#### 消费消息

将ID指定为`>`即可进行消息消费。

```shell
redis-cnh:1>XREADGROUP GROUP mygroup01 Alice STREAMS mystream >
1) 1) "mystream"
   2) 1) 1) "1645420850255-0"
         2) 1) "title"
            2) "redis stream"
            3) "link"
            4) "https://www.lixueduan.com"


      2) 1) "1645424995543-0"
         2) 1) "key1"
            2) "value1"


      3) 1) "1645492516505-0"
         2) 1) "kkk"
            2) "vvv"
```



#### 未ACK的消息列表

将消息指定为 0 就拿到**悬而未决**的历史数据（也就是上面的 Pending Entries List），即该消费者所有的消费了但是未 ACK 的消息，这样可以让我们做故障恢复后的完善工作。

```shell
redis-cnh:1>XREADGROUP GROUP mygroup01 Alice STREAMS mystream 0
1) 1) "mystream"
   2) 1) 1) "1645420850255-0"
         2) 1) "title"
            2) "redis stream"
            3) "link"
            4) "https://www.lixueduan.com"


      2) 1) "1645424995543-0"
         2) 1) "key1"
            2) "value1"


      3) 1) "1645492516505-0"
         2) 1) "kkk"
            2) "vvv"
```



### [XACK](https://redis.io/commands/xack)

消费确认。确认后该消息就会从 Pending Entries List 中移除。

> XACK key group id [id ...]



* key：stream 名字
* group：消费者组名字
*  id [id ...]：确认的消息ID，可以是多个



首先查看一下当前消费者悬而未决消息：

```shell
redis-cnh:1>XREADGROUP GROUP mygroup01 Alice STREAMS mystream 0
1) 1) "mystream"
   2) 1) 1) "1645420850255-0"
         2) 1) "title"
            2) "redis stream"
            3) "link"
            4) "https://www.lixueduan.com"


      2) 1) "1645424995543-0"
         2) 1) "key1"
            2) "value1"


      3) 1) "1645492516505-0"
         2) 1) "kkk"
            2) "vvv"
```

然后进行一次 ACK 并再此查询：

```shell
redis-cnh:1>XACK mystream mygroup01 1645420850255-0
"1"
redis-cnh:1>XREADGROUP GROUP mygroup01 Alice STREAMS mystream 0
1) 1) "mystream"
   2) 1) 1) "1645424995543-0"
         2) 1) "key1"
            2) "value1"


      2) 1) "1645492516505-0"
         2) 1) "kkk"
            2) "vvv"
```

可以看到，悬而未决消息只有两条了，ACK 过的那条被移除了。



### [XPENDING](https://redis.io/commands/xpending)

查询指定**消费者组**的 悬而未决的消息列表（Pending Entries List）。

> 和 XREADGROUP 指定消息ID为0时的效果类似，但是 XPENDING 不需要指定具体的消费者，可以查询整个消费者组下面的，一般用于做失败处理。



> XPENDING key group [[IDLE min-idle-time] start end count [consumer]]

* key ：stream 名字
* group：消费者组名字
* [[IDLE min-idle-time] ：空闲时间过滤器，只会返回空闲时间超过指定值的消息
* start end：消息ID的起止范围，
  * 一般用`-`、`+`来表示查询所有
  * 也支持使用`（`、`）`来将闭区间改成开区间
* count：限制每次返回的消息条数
* [consumer]：可以指定只查询某个消费者的，也可以不指定

只有 stream 和 group 是必填参数，其他都是可选的，不同的参数类型返回值也不同：



首先是什么参数都不指定，返回的是一个类似统计的结果：

```shell
redis-cnh:1>XPENDING mystream mygroup01
1) "2"
2) "1645424995543-0"
3) "1645492516505-0"
4) 1) 1) "Alice"
      2) "2"
```

该消费者组的待处理消息总数，即2，后跟待处理消息中最小和最大的ID，然后列出该消费者组中至少有一条待处理消息的每个消费者，以及它拥有的待处理消息的数量。



如果带上 ID 范围进行查询的话，结果就比较详细：

```shell
redis-cnh:1>XPENDING mystream mygroup01 - + 100
1) 1) "1645424995543-0"
   2) "Alice"
   3) "1427871"
   4) "3"

2) 1) "1645492516505-0"
   2) "Alice"
   3) "1427871"
   4) "3"
```

这样我们不再看到摘要信息，而是在待处理条目列表中显示每条消息的详细信息。对于每条消息，返回四个属性：

* 1）消息的 ID。
* 2）获取消息但仍需确认的消费者的名称。我们称它为消息的当前*所有者*。
* 3）自上次将此消息传递给此使用者以来经过的毫秒数。
* 4）此消息的传递次数。





### [XCLAIM](https://redis.io/commands/xclaim)

更改待处理消息的所有权,以便新的消费者能消费者部分消息。至于是修改哪些消息，则由后续的参数决定。



> XCLAIM key group consumer min-idle-time id [id ...] [IDLE ms] [TIME unix-time-milliseconds] [RETRYCOUNT count] [FORCE] [JUSTID]



* key ：stream 名字
* group：消费者组名字
* consumer ：消费者名字
* min-idle-time：消息的最小空闲时间
*  id [id ...] ：指定消息ID
*  [IDLE ms]：设置消息的空闲时间（因为这个命令执行后，消息所有者变了，所以空闲时间也应该更新）
  * 如果不指定则默认从 0 开始计算
* [TIME unix-time-milliseconds]：这与 IDLE 相同，但不是相对的毫秒数，而是将空闲时间设置为特定的 Unix 时间
*  [RETRYCOUNT count]：将重试计数器设置为指定值。每次再次传递消息时，此计数器都会增加。
* [FORCE] ：
* [JUSTID]：仅返回成功声明的消息 ID 数组，不返回实际消息。使用此选项意味着重试计数器不会增加。



首先查看 mygroup01 中未 ACK 的消息：

```shell
redis-cnh:1>XPENDING mystream mygroup01
1) "2"
2) "1645424995543-0"
3) "1645492516505-0"
4) 1) 1) "Alice"
      2) "2"
```

可以看到，Alice 有两条。

然后把其中一个分给 Bob：

```shell
redis-cnh:1>XCLAIM mystream mygroup01 Bob 10 1645424995543-0
1) 1) "1645424995543-0"
   2) 1) "key1"
      2) "value1"
```

再次查看：

```go
redis-cnh:1>XPENDING mystream mygroup01
1) "2"
2) "1645424995543-0"
3) "1645492516505-0"
4) 1) 1) "Alice"
      2) "1"

   2) 1) "Bob"
      2) "1"
```

Alice 和 Bob 各有一条了。

> 如果 Alice 已经宕机了，而 Bob 还在正常运行，这样就能让这条消息被消费掉，而不是一直待在 Alice 的未 ACK 列表中得不到处理。





### [XINFO STREAM](https://redis.io/commands/xinfo-stream)

查询 Stream 信息。

> XINFO STREAM key [FULL [COUNT count]]

* key：stream 名字
* FULL ：是否显示完整信息
*  [COUNT count]：限制返回的消息条目数量
  * 默认为 10
  * 0 表示不限制



```shell
redis-cnh:2>XINFO STREAM vaptcha-sync
1)  "length"
2)  "8016"
3)  "radix-tree-keys"
4)  "80"
5)  "radix-tree-nodes"
6)  "168"
7)  "groups"
8)  "2"
9)  "last-generated-id"
10) "1645498806908-0"
11) "first-entry"
12) 1) "1645497335965-0"
    2) 1) "Tag"
       2) "CT1"
       3) "Msg"
       4) "CT1 Msg"


13) "last-entry"
14) 1) "1645498806908-0"
    2) 1) "msg"
       2) "CT2Msg"
       3) "tag"
       4) "CT2"
```

- **length**：流中的条目数（请参阅[XLEN](https://redis.io/commands/xlen)）
- **radix-tree-keys**：底层基数数据结构中的键数
- **radix-tree-nodes**：底层基数数据结构中的节点数
- **groups**：为流定义的消费者组的数量
- **last-generated-id**：最近添加到流中的条目的 ID
- **first-entry**：流中第一个条目的 ID 和字段值元组
- **last-entry**：流中最后一个条目的 ID 和字段值元组



### [XTRIM ](https://redis.io/commands/xtrim)

通过逐出较旧的条目（具有较低 ID 的条目）来修剪 Stream。

> ACK 之后消息只是从消费者的 Pending Entries List 中移除了，还是存在于 Stream 中，为了避免堆积大量消息占用太多 Redis 内存，需要定时调用 XTIRM 来清理。



> XTRIM key MAXLEN|MINID [=|~] threshold [LIMIT count]
>
> Redis version >= 6.2.0: Added the `MINID` trimming strategy and the `LIMIT` option.

* key ：stream 名字
* MAXLEN|MINID ：具体逐出策略

  * MAXLEN：只要流的长度超过指定值 ，就会驱逐超过`threshold`的部分，其中`threshold`是一个正整数。
  * MINID：驱逐 ID 低于 阈值的消息，可以保证不会把没有读取的消息给删了，推荐使用（Redis 6.2.0及其以上版本新增特性）。
* 
*  [=|~] ：逐出精确度
* 默认为 =，即精确逐出
  * ~ 则是非精确逐出，效率会高一些
* threshold ：逐出后的阈值，在 MAXLEN 时是一个正整数，在 MINID 时则是一个 ID。
* [LIMIT count]：指定本次逐出的最大消息条数
  * Redis 6.2.0及其以上版本新增特性





```shell
redis-cnh:2>XTRIM vaptcha-sync MAXLEN 1000
"7016"
```

之前查询中得知，stream 的消息数为 8016，这里 XTRIM 限制 MAXLEN 1000，所以会剔除掉 7016 个消息。

```shell
redis-cnh:2>XTRIM vaptcha-sync MINID 1645501851479-0
"ERR syntax error"
```

当前是 Redis5.0 不支持 MINID 策略就不演示了。



## 4. FAQ

**1）避免重复消费：消费者组可以保证同一条消息，只有一个消费者取到**

每个Stream都可以挂多个消费组，每个消费组会有个游标last_delivered_id在Stream数组之上往前移动，表示当前消费组已经消费到哪条消息了。

同一个消费组(Consumer Group)可以挂接多个消费者(Consumer)，这些消费者之间是竞争关系，**任意一个消费者读取了消息都会使游标last_delivered_id往前移动**。每个消费者者有一个组内唯一名称。

**2）悬而未决的消息：PEL(Pending Entries List)**

消费者(Consumer)内部会有个状态变量pending_ids，它记录了当前已经被客户端读取但是还没有ack的消息。如果客户端没有 ack，这个变量里面的消息 ID 会越来越多，一旦某个消息被ack，它就会被移除。

这个 pending_ids 变量在 Redis 官方被称之为 PEL，也就是 Pending Entries List，这是一个很核心的数据结构，它用来确保客户端至少消费了消息一次，而不会在网络传输的中途丢失了没处理。

**3）失败处理**

当某个消费者出现问题然后恢复了之后，可以通过 XREADGROUP 将 ID 指定为 0 拿到自己还没有确认过的消息数据，这个一个安全保障机制。

*但如果这个出问题的消费者再也恢复不了了怎么办？他的那些还没确认过的消息数据是不是就没办法处理了？*

redis stream 提供了这种情况的处理办法，通过2个步骤来解决：

* 1）XPENDING 查出所有已传递但未确认的消息数据 
* 2）XCLAIM 变更这些数据的所有者 

这样就可以让新的消费者来处理这些数据了。

**4）消息删除**

XADD 之后消息是存在 Stream 里的，通过 XREADGROUP 消费后会把 ID 记录到 消费者的 Pending Entries List 中，XACK 后则会从 Pending Entries List 中移除，但是消息还在 STREAM 里，如果不处理则会越堆积越多。

**可以在消费时使用 XDEL 删除指定消息或者 XTRIM 命令剔除多余的消息**。

> Redis6.2.0及以上推荐使用 XTRIM 的 MINID 策略，否则还是使用 XDEL 逐个删除吧，基于 MAXLEN 的 XTRIM 可能会把没有消费的给删了。





[使用nginx-quic支持HTTP/3 _](https://tinychen.com/20200821-nginx-quic-compile-to-implement-http3/)

[Nginx-QUIC初尝试，体验HTTP/3](https://nestealin.com/ce9634bf/)

[全站已经启用HTTP3 + QUIC + Brotli](https://www.gksec.com/HTTP3.html)

[尝试 Nginx 上使用HTTP3](https://kiosk007.top/2021/07/31/%E5%B0%9D%E8%AF%95-Nginx-%E4%B8%8A%E4%BD%BF%E7%94%A8HTTP3)