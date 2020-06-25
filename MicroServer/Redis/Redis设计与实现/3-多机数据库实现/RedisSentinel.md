# RedisSentinel

## 1. 概述

Sentinel是Redis的(HA)高可用解决方案。由一个或多个Sentinel实例组成的Sentinel系统可以监视任意多个主从服务器。**并在主服务器下线时自动将主服务器下属的某个从服务器升级为新的主服务器**,由新的主服务器继续处理客户端请求。

## 2. 初始化

### 1. 启动普通Redis服务器

Sentinel本质上是一个运行在特殊模式下Redis服务器，所以初始化第一步就是启动一个普通Redis服务器，由于功能不同所以初始化过程并不完全相同。

比如说Sentinel不会载入RDB或AOF文件还原服务器状态。



### 2. 替换Sentinel专用代码

第二步就是讲Redis中部分代码替换成Sentinel使用的专用代码。

比如`REDIS_SERVERPORT`替换成`REDIS_SENTINEL_PORT`

加载命令表也从`redicCommandTable`替换为`sentinelcmds`

这也就是为什么Sentinel模式下服务器不能执行`set`、`dbsize`、`eval`等命令了，根本都没加载这些命令。



### 3. 初始化Sentinel状态

在应用了 Sentinel 的专用代码之后， 接下来， 服务器会初始化一个 `sentinel.c/sentinelState` 结构（后面简称“Sentinel 状态”）， 这个结构保存了服务器中所有和 Sentinel 功能有关的状态 （服务器的一般状态仍然由 `redis.h/redisServer` 结构保存）：

```c
struct sentinelState {

    // 当前纪元，用于实现故障转移
    uint64_t current_epoch;

    // 保存了所有被这个 sentinel 监视的主服务器
    // 字典的键是主服务器的名字
    // 字典的值则是一个指向 sentinelRedisInstance 结构的指针
    dict *masters;

    // 是否进入了 TILT 模式？
    int tilt;

    // 目前正在执行的脚本的数量
    int running_scripts;

    // 进入 TILT 模式的时间
    mstime_t tilt_start_time;

    // 最后一次执行时间处理器的时间
    mstime_t previous_time;

    // 一个 FIFO 队列，包含了所有需要执行的用户脚本
    list *scripts_queue;

} sentinel;
```

Sentinel 状态中的 `masters` 字典记录了所有被 Sentinel 监视的主服务器的相关信息， 其中：

- 字典的键是被监视主服务器的名字。
- 而字典的值则是被监视主服务器对应的 `sentinel.c/sentinelRedisInstance` 结构。

每个 `sentinelRedisInstance` 结构（后面简称“实例结构”）代表一个被 Sentinel 监视的 Redis 服务器实例（instance）， 这个实例可以是主服务器、从服务器、或者另外一个 Sentinel 。

```c
typedef struct sentinelRedisInstance {

    // 标识值，记录了实例的类型，以及该实例的当前状态
    int flags;

    // 实例的名字
    // 主服务器的名字由用户在配置文件中设置
    // 从服务器以及 Sentinel 的名字由 Sentinel 自动设置
    // 格式为 ip:port ，例如 "127.0.0.1:26379"
    char *name;

    // 实例的运行 ID
    char *runid;

    // 配置纪元，用于实现故障转移
    uint64_t config_epoch;

    // 实例的地址
    sentinelAddr *addr;

    // SENTINEL down-after-milliseconds 选项设定的值
    // 实例无响应多少毫秒之后才会被判断为主观下线（subjectively down）
    mstime_t down_after_period;

    // SENTINEL monitor <master-name> <IP> <port> <quorum> 选项中的 quorum 参数
    // 判断这个实例为客观下线（objectively down）所需的支持投票数量
    int quorum;

    // SENTINEL parallel-syncs <master-name> <number> 选项的值
    // 在执行故障转移操作时，可以同时对新的主服务器进行同步的从服务器数量
    int parallel_syncs;

    // SENTINEL failover-timeout <master-name> <ms> 选项的值
    // 刷新故障迁移状态的最大时限
    mstime_t failover_timeout;

    // ...

} sentinelRedisInstance;
```

`sentinelRedisInstance.addr` 属性是一个指向 `sentinel.c/sentinelAddr` 结构的指针， 这个结构保存着实例的 IP 地址和端口号：

```c
typedef struct sentinelAddr {

    char *ip;

    int port;

} sentinelAddr;
```

对 Sentinel 状态的初始化将引发对 `masters` 字典的初始化， 而 `masters` 字典的初始化是根据被载入的 Sentinel 配置文件来进行的。

配置文件格式如下

```sh
#####################
# master1 configure #
#####################

sentinel monitor master1 127.0.0.1 6379 2

sentinel down-after-milliseconds master1 30000

sentinel parallel-syncs master1 1

sentinel failover-timeout master1 900000

#####################
# master2 configure #
#####################

sentinel monitor master2 127.0.0.1 12345 5

sentinel down-after-milliseconds master2 50000

sentinel parallel-syncs master2 5

sentinel failover-timeout master2 450000
```

### 4. 建立网络连接

初始化 Sentinel 的最后一步是`创建连向被监视主服务器的网络连接`： Sentinel 将成为主服务器的客户端， 它可以向主服务器发送命令， 并从命令回复中获取相关的信息。

对于每个被 Sentinel 监视的主服务器来说， Sentinel 会创建两个连向主服务器的异步网络连接：

- 一个是命令连接， 这个连接专门用于向主服务器发送命令， 并接收命令回复。
- 另一个是订阅连接， 这个连接专门用于订阅主服务器的 `__sentinel__:hello` 频道。

为什么有两个连接？

在 Redis 目前的发布与订阅功能中， 被发送的信息都不会保存在 Redis 服务器里面， 如果在信息发送时， 想要接收信息的客户端不在线或者断线， 那么这个客户端就会丢失这条信息。

因此， 为了不丢失 `__sentinel__:hello` 频道的任何信息， Sentinel 必须专门用一个订阅连接来接收该频道的信息。

而另一方面， 除了订阅频道之外， Sentinel 还又必须向主服务器发送命令， 以此来与主服务器进行通讯， 所以 Sentinel 还必须向主服务器创建命令连接。

并且因为 Sentinel 需要与多个实例创建多个网络连接， 所以 Sentinel 使用的是异步连接。

## 3. 获取服务器信息

### 1. 主服务器

Sentinel默认会以每十秒一次的频率，向被监视的主服务器发送INFO命令来获取主服务器当前信息。

```sh
# Server
...
run_id:xxxxxxxxxxxxxx
...
# Replication
...
role:master
...
slave0:ip=127.0.0.1,port=11111,state=online,offset=43,lag=0
slave1:ip=127.0.0.1,port=22222,state=online,offset=43,lag=0
slave2:ip=127.0.0.1,port=33333,state=online,offset=43,lag=0
```

一方面是主服务器的信息：runid和role,另一方面是可以获取到从服务器信息

runid和role将会用于更新主服务器的实例结构，从服务器信息则会用来更新slaves字典。

### 2. 从服务器

同样是默认10秒一次获取从服务器信息。

```sh
# Server
...
run_id:xxxxxxxxxxxxxx
...
# Replication
...
role:slave
master_host:127.0.0.1
master_port:6379
master_link_status:up
slave_repl_offset:11871
slave_priority:100
...
```

同样会根据回复信息更新从服务器实例结构。



## 4. 主服务器客观下线

`redis.conf`中可以设置多久算下线。

```sh
down-after-milliseconds 10000
```

主服务器要下线超过`down-after-milliseconds `设定值才会被Sentinel判定为客观下线。

即在`down-after-milliseconds`时间内Sentinel发送的PING命令返回的都是无效回复则会被这个Sentinel判定为客观下线。

这个时候为了确定主服务器是否真的是客观下线了，当前发现问题的Sentinel会和其他监视这个主服务器的Sentinel进行询问,要有`足够数量(由配置文件设置)`的Sentinel都认为是客观下线才会真的确认为客观下线。

通过以下命令进行通信

```sh
SENTINEL is-master-down-by-addr
```





## 5. 故障转移

### 1.选取领头Sentinel

当某个主服务器被协商后判断为真的客观下线时,监视这个主服务器的各个Sentinel会进行协商，选举出一个Leader(领头Sentinel)，并由Leader来执行故障转移操作。

选取规则：

**基于Raft算法实现**

* 1.所有在线的Sentinel都有资格被选为Leader
* 2.每次进行选取后，不论成功与否，所有Sentinel的配置纪元都要+1
* 3.每个发现主服务器客观下线的Sentinel都会要求其他Sentinel选自己为Leader
* 4.每个Sentinel只会选取第一个要求自己投票的Sentinel为Leader
* 5.获得超过半数票就会成为真的Leader(领头Sentinel)
* 6.给定时间内没选出来，那么过一段时间后会再次选取。



### 2. 转移流程

领头Sentinel将对主服务器执行故障转移操作。

* 1.在已下线主服务器从属服务器里挑一个转为主服务器
* 2.让其他从服务器改为复制这个新的主服务器
* 3.让已下线的主服务器成为新主服务器的从服务器,如果这个服务器重连上来就会自动成为从服务器继续工作。

### 3. 挑选主服务器规则

* 1.排除处于下线或者断线状态的从服务器
* 2.排除最近5秒没有回复过领头Sentinel的INFO命令的从服务器
* 3.排除与主服务器断线超过`down-after-milliseconds*10`毫秒的从服务器,掉线超过`down-after-milliseconds`毫秒后主服务器才会被判断为掉线，如果从服务器与主服务器断线时间是这个值得10倍还多那说明已经断线很久了
* 4.然后从剩下的从服务器中选优先级最高的作为主服务器
  * 1.优先级是INFO命令时从服务器返回的
  * 2.如果优先级相同则选复制偏移量大的(这样数据是最新的)，runid小的

## 6. 小结

- Sentinel 只是一个运行在特殊模式下的 Redis 服务器， 它使用了和普通模式不同的命令表， 所以 Sentinel 模式能够使用的命令和普通 Redis 服务器能够使用的命令不同。
- Sentinel 会读入用户指定的配置文件， 为每个要被监视的主服务器创建相应的实例结构， 并创建连向主服务器的命令连接和订阅连接， 其中命令连接用于向主服务器发送命令请求， 而订阅连接则用于接收指定频道的消息。
- Sentinel 通过向主服务器发送 INFO 命令来获得主服务器属下所有从服务器的地址信息， 并为这些从服务器创建相应的实例结构， 以及连向这些从服务器的命令连接和订阅连接。
- 在一般情况下， Sentinel 以每十秒一次的频率向被监视的主服务器和从服务器发送 INFO 命令， 当主服务器处于下线状态， 或者 Sentinel 正在对主服务器进行故障转移操作时， Sentinel 向从服务器发送 INFO 命令的频率会改为每秒一次。
- 对于监视同一个主服务器和从服务器的多个 Sentinel 来说， 它们会以每两秒一次的频率， 通过向被监视服务器的 `__sentinel__:hello`频道发送消息来向其他 Sentinel 宣告自己的存在。
- 每个 Sentinel 也会从 `__sentinel__:hello` 频道中接收其他 Sentinel 发来的信息， 并根据这些信息为其他 Sentinel 创建相应的实例结构， 以及命令连接。
- Sentinel 只会与主服务器和从服务器创建命令连接和订阅连接， Sentinel 与 Sentinel 之间则只创建命令连接。
- Sentinel 以每秒一次的频率向实例（包括主服务器、从服务器、其他 Sentinel）发送 PING 命令， 并根据实例对 PING 命令的回复来判断实例是否在线： 当一个实例在指定的时长中连续向 Sentinel 发送无效回复时， Sentinel 会将这个实例判断为主观下线。
- 当 Sentinel 将一个主服务器判断为主观下线时， 它会向同样监视这个主服务器的其他 Sentinel 进行询问， 看它们是否同意这个主服务器已经进入主观下线状态。
- 当 Sentinel 收集到足够多的主观下线投票之后， 它会将主服务器判断为客观下线， 并发起一次针对主服务器的故障转移操作。