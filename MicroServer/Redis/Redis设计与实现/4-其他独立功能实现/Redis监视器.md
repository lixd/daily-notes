# Redis监视器

## 1. 概述

通过执行`MONITOR`命令，客户端可以让自己变为一个监视器，实时接收并打印出服务器当前处理的命令请求相关信息。

## 2. 实现

### 1. 成为监视器

发送 MONITOR 命令可以让一个普通客户端变为一个监视器， 该命令的实现原理可以用以下伪代码来实现：

```python
def MONITOR():

    # 打开客户端的监视器标志
    client.flags |= REDIS_MONITOR

    # 将客户端添加到服务器状态的 monitors 链表的末尾
    server.monitors.append(client)

    # 向客户端返回 OK
    send_reply("OK")
```

举个例子， 如果客户端 `c10086` 向服务器发送 MONITOR 命令， 那么这个客户端的 `REDIS_MONITOR` 标志会被打开， 并且这个客户端本身会被添加到 `monitors` 链表的表尾。



### 2. 发送命令给监视器

服务器在每次处理命令请求之前， 都会调用 `replicationFeedMonitors` 函数， 由这个函数将被处理命令请求的相关信息发送给各个监视器。

以下是 `replicationFeedMonitors` 函数的伪代码定义， 函数首先根据传入的参数创建信息， 然后将信息发送给所有监视器：

```python
def replicationFeedMonitors(client, monitors, dbid, argv, argc):

    # 根据执行命令的客户端、当前数据库的号码、命令参数、命令参数个数等参数
    # 创建要发送给各个监视器的信息
    msg = create_message(client, dbid, argv, argc)

    # 遍历所有监视器
    for monitor in monitors:

        # 将信息发送给监视器
        send_message(monitor, msg)
```



## 3. 小结

- 客户端可以通过执行 MONITOR 命令， 将客户端转换成监视器， 接收并打印服务器处理的每个命令请求的相关信息。
- 当一个客户端从普通客户端变为监视器时， 该客户端的 `REDIS_MONITOR` 标识会被打开。
- 服务器将所有监视器都记录在 `monitors` 链表中。
- 每次处理命令请求时， 服务器都会遍历 `monitors` 链表， 将相关信息发送给监视器。