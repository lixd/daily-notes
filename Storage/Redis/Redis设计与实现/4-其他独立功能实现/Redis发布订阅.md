# Redis发布订阅实现

## 1. 概述

Redis 发布订阅(pub/sub)是一种消息通信模式：发送者(pub)发送消息，订阅者(sub)接收消息。

客户端通过`SUBSCRIBE`订阅频道或者换`PSUBSCRIBE`订阅模式

然后`PUBLISH`发送消息到指定频道或者模式，订阅客户端都可以收到消息了。



## 2. 实现

### 1. 频道订阅与退订

当一个客户端执行 SUBSCRIBE 命令， 订阅某个或某些频道的时候， 这个客户端与被订阅频道之间就建立起了一种订阅关系。

Redis 将所有频道的订阅关系都保存在服务器状态的 `pubsub_channels` 字典里面， **这个字典的`键`是某个`被订阅的频道`， 而键的`值`则是一个`链表`， 链表里面记录了所有订阅这个频道的客户端**：

```c
struct redisServer {

    // ...

    // 保存所有频道的订阅关系
    dict *pubsub_channels;

    // ...

};
```

**1.订阅频道**

每当客户端执行 SUBSCRIBE 命令， 订阅某个或某些频道的时候， 服务器都会将客户端与被订阅的频道在 `pubsub_channels` 字典中进行关联。

根据频道是否已经有其他订阅者， 关联操作分为两种情况执行：

- 如果频道已经有其他订阅者， 那么它在 `pubsub_channels` 字典中必然有相应的订阅者链表， 程序唯一要做的就是将客户端添加到订阅者链表的末尾。
- 如果频道还未有任何订阅者， 那么它必然不存在于 `pubsub_channels` 字典， 程序首先要在 `pubsub_channels` 字典中为频道创建一个键， 并将这个键的值设置为空链表， 然后再将客户端添加到链表， 成为链表的第一个元素。

SUBSCRIBE 命令的实现可以用以下伪代码来描述：

```python
def subscribe(*all_input_channels):

    # 遍历输入的所有频道
    for channel in all_input_channels:

        # 如果 channel 不存在于 pubsub_channels 字典（没有任何订阅者）
        # 那么在字典中添加 channel 键，并设置它的值为空链表
        if channel not in server.pubsub_channels:
            server.pubsub_channels[channel] = []

        # 将订阅者添加到频道所对应的链表的末尾
        server.pubsub_channels[channel].append(client)
```

**2. 退订频道**

UNSUBSCRIBE 命令的行为和 SUBSCRIBE 命令的行为正好相反 —— 当一个客户端退订某个或某些频道的时候， 服务器将从 `pubsub_channels` 中解除客户端与被退订频道之间的关联：

- 程序会根据被退订频道的名字， 在 `pubsub_channels` 字典中找到频道对应的订阅者链表， 然后从订阅者链表中删除退订客户端的信息。
- 如果删除退订客户端之后， 频道的订阅者链表变成了空链表， 那么说明这个频道已经没有任何订阅者了， 程序将从 `pubsub_channels` 字典中删除频道对应的键。

UNSUBSCRIBE 命令的实现可以用以下伪代码来描述：

```python
def unsubscribe(*all_input_channels):

    # 遍历要退订的所有频道
    for channel in all_input_channels:

        # 在订阅者链表中删除退订的客户端
        server.pubsub_channels[channel].remove(client)

        # 如果频道已经没有任何订阅者了（订阅者链表为空）
        # 那么将频道从字典中删除
        if len(server.pubsub_channels[channel]) == 0:
            server.pubsub_channels.remove(channel)
```

### 2. 模式的订阅与退订

Redis 将所有频道的订阅关系都保存在服务器状态的 `pubsub_patterns` 字典里面

```c
struct redisServer {

    // ...

    // 保存所有模式的订阅关系
    list *pubsub_patterns;

    // ...

};
```

`pubsub_patterns`属性是一个链表，每个节点都是一个`pubsubPattern`结构

```c
typedef struct pubsubPattern {
    //订阅模式的客户端
    redisClient *client;
    // 被订阅的模式
    robj *pattern;
}
```

**1. 模式订阅**

客户端执行模式订阅(PSUBSCRIBE)的时候，服务端会对被订阅的模式执行以下操作：

* 1.新建一个`pubsubPattern`结构 clinet为订阅客户端，pattern为被订阅模式
* 2.将`pubsubPattern`添加到链表`pubsub_patterns`的表尾

**2. 模式退订**

客户端执行模式退订`PUNSUBSCRIBE`的时候，服务端会在链表中查找并删除pattern属性为被退订模式且client属性为执行退订操作的客户端的所有节点。

### 3. 发送消息

客户端执行`PUBLISH channel message`时，服务端要执行一下两个动作

* 1.将消息发给channel频道的所有订阅者
* 2.如果有模式pattern与channel匹配，那么将消息发送给pattern模式的所有订阅者

**频道订阅者**

`pubsubChannels`字典中查找键为channel的链表，即可找到所有的订阅者。

**模式订阅者**

查找模式订阅者只能遍历`pubsub_patterns`链表了。

### 4. 查询信息

命令`PUBSUB subcommand [argument [argument ...]]`可以查看发布订阅信息。

**PUBSUB CHANNELS**

比如`PUBSUB CHANNELS [pattern]`会返回服务器当前被订阅的频道。

其实就是遍历了`pubsub_channels`字典的所有键，然后找出满足条件的并返回。

**PUBSUB NUMSUB**

`PUBSUB NUMSUB [channel1 channel2...]`

返回给定频道的订阅者，内部实现为在链表`pubsub_channels`中通过键即这里的channel找到所有的链表，然后返回所有链表的长度和。

**PUBSUB NUMPAT**

返回当前服务器被订阅模式的数量。

其实只是返回了`pubsub_patterns`链表的长度,应该这个长度就代表了订阅者数量。

## 3. 小结

- 服务器状态在 `pubsub_channels` 字典保存了所有频道的订阅关系： SUBSCRIBE 命令负责将客户端和被订阅的频道关联到这个字典里面， 而 UNSUBSCRIBE 命令则负责解除客户端和被退订频道之间的关联。
- 服务器状态在 `pubsub_patterns` 链表保存了所有模式的订阅关系： PSUBSCRIBE 命令负责将客户端和被订阅的模式记录到这个链表中， 而UNSUBSCRIBE 命令则负责移除客户端和被退订模式在链表中的记录。
- PUBLISH 命令通过访问 `pubsub_channels` 字典来向频道的所有订阅者发送消息， 通过访问 `pubsub_patterns` 链表来向所有匹配频道的模式的订阅者发送消息。
- PUBSUB 命令的三个子命令都是通过读取 `pubsub_channels` 字典和 `pubsub_patterns` 链表中的信息来实现的。