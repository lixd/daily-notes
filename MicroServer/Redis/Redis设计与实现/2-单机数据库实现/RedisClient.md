# Redis客户端

## 1. 概述

redis服务器中通过链表来存储所有客户端的状态

```c
struct redisServer {
    //...
    //一个链表 保存了所有客户端状态
    list *clients;
    //...
    
};
```



## 2. 客户端状态

客户端状态包含的属性可以分为两类：

- 一类是比较通用的属性， 这些属性很少与特定功能相关， 无论客户端执行的是什么工作， 它们都要用到这些属性。
- 另外一类是和特定功能相关的属性， 比如操作数据库时需要用到的 `db` 属性和 `dictid` 属性， 执行事务时需要用到的 `mstate` 属性， 以及执行 WATCH 命令时需要用到的 `watched_keys` 属性， 等等。

`redis.h/redisClient`

```c
/* With multiplexing we need to take per-client state.
 * Clients are taken in a liked list.
 *
 * 因为 I/O 复用的缘故，需要为每个客户端维持一个状态。
 *
 * 多个客户端状态被服务器用链表连接起来。
 */
typedef struct redisClient {

    // 套接字描述符
    int fd;

    // 当前正在使用的数据库
    redisDb *db;

    // 当前正在使用的数据库的 id （号码）
    int dictid;

    // 客户端的名字
    robj *name;             /* As set by CLIENT SETNAME */

    // 查询缓冲区
    sds querybuf;

    // 查询缓冲区长度峰值
    size_t querybuf_peak;   /* Recent (100ms or more) peak of querybuf size */

    // 参数数量
    int argc;

    // 参数对象数组
    robj **argv;

    // 记录被客户端执行的命令
    struct redisCommand *cmd, *lastcmd;

    // 请求的类型：内联命令还是多条命令
    int reqtype;

    // 剩余未读取的命令内容数量
    int multibulklen;       /* number of multi bulk arguments left to read */

    // 命令内容的长度
    long bulklen;           /* length of bulk argument in multi bulk request */

    // 回复链表
    list *reply;

    // 回复链表中对象的总大小
    unsigned long reply_bytes; /* Tot bytes of objects in reply list */

    // 已发送字节，处理 short write 用
    int sentlen;            /* Amount of bytes already sent in the current
                               buffer or object being sent. */

    // 创建客户端的时间
    time_t ctime;           /* Client creation time */

    // 客户端最后一次和服务器互动的时间
    time_t lastinteraction; /* time of the last interaction, used for timeout */

    // 客户端的输出缓冲区超过软性限制的时间
    time_t obuf_soft_limit_reached_time;

    // 客户端状态标志
    int flags;              /* REDIS_SLAVE | REDIS_MONITOR | REDIS_MULTI ... */

    // 当 server.requirepass 不为 NULL 时
    // 代表认证的状态
    // 0 代表未认证， 1 代表已认证
    int authenticated;      /* when requirepass is non-NULL */

    // 复制状态
    int replstate;          /* replication state if this is a slave */
    // 用于保存主服务器传来的 RDB 文件的文件描述符
    int repldbfd;           /* replication DB file descriptor */

    // 读取主服务器传来的 RDB 文件的偏移量
    off_t repldboff;        /* replication DB file offset */
    // 主服务器传来的 RDB 文件的大小
    off_t repldbsize;       /* replication DB file size */
    
    sds replpreamble;       /* replication DB preamble. */

    // 主服务器的复制偏移量
    long long reploff;      /* replication offset if this is our master */
    // 从服务器最后一次发送 REPLCONF ACK 时的偏移量
    long long repl_ack_off; /* replication ack offset, if this is a slave */
    // 从服务器最后一次发送 REPLCONF ACK 的时间
    long long repl_ack_time;/* replication ack time, if this is a slave */
    // 主服务器的 master run ID
    // 保存在客户端，用于执行部分重同步
    char replrunid[REDIS_RUN_ID_SIZE+1]; /* master run id if this is a master */
    // 从服务器的监听端口号
    int slave_listening_port; /* As configured with: SLAVECONF listening-port */

    // 事务状态
    multiState mstate;      /* MULTI/EXEC state */

    // 阻塞类型
    int btype;              /* Type of blocking op if REDIS_BLOCKED. */
    // 阻塞状态
    blockingState bpop;     /* blocking state */

    // 最后被写入的全局复制偏移量
    long long woff;         /* Last write global replication offset. */

    // 被监视的键
    list *watched_keys;     /* Keys WATCHED for MULTI/EXEC CAS */

    // 这个字典记录了客户端所有订阅的频道
    // 键为频道名字，值为 NULL
    // 也即是，一个频道的集合
    dict *pubsub_channels;  /* channels a client is interested in (SUBSCRIBE) */

    // 链表，包含多个 pubsubPattern 结构
    // 记录了所有订阅频道的客户端的信息
    // 新 pubsubPattern 结构总是被添加到表尾
    list *pubsub_patterns;  /* patterns a client is interested in (SUBSCRIBE) */
    sds peerid;             /* Cached peer ID. */

    /* Response buffer */
    // 回复偏移量
    int bufpos;
    // 回复缓冲区
    char buf[REDIS_REPLY_CHUNK_BYTES];

} redisClient;

```





### 1. 套接字描述符

客户端状态的 `fd` 属性记录了客户端正在使用的套接字描述符：

```c
typedef struct redisClient {

    // ...

    int fd;

    // ...

} redisClient;
```

根据客户端类型的不同， `fd` 属性的值可以是 `-1` 或者是大于 `-1` 的整数：

- 伪客户端（fake client）的 `fd` 属性的值为 `-1` ： 伪客户端处理的命令请求来源于 AOF 文件或者 Lua 脚本， 而不是网络， 所以这种客户端不需要套接字连接， 自然也不需要记录套接字描述符。 目前 Redis 服务器会在两个地方用到伪客户端， 一个用于载入 AOF 文件并还原数据库状态， 而另一个则用于执行 Lua 脚本中包含的 Redis 命令。
- 普通客户端的 `fd` 属性的值为大于 `-1` 的整数： 普通客户端使用套接字来与服务器进行通讯， 所以服务器会用 `fd` 属性来记录客户端套接字的描述符。 因为合法的套接字描述符不能是 `-1` ， 所以普通客户端的套接字描述符的值必然是大于 `-1` 的整数。

执行 CLIENT_LIST 命令可以列出目前所有连接到服务器的普通客户端， 命令输出中的 `fd` 域显示了服务器连接客户端所使用的套接字描述符：

```c
redis> CLIENT list

addr=127.0.0.1:53428 fd=6 name= age=1242 idle=0 ...
addr=127.0.0.1:53469 fd=7 name= age=4 idle=4 ...
```

### 2. 名字

默认情况下客户端是没有名字的，但是用`CLIENT_SETNAME` 命令可以为客户端设置一个名字， 让客户端的身份变得更清晰。

客户端的名字记录在客户端状态的 `name` 属性里面：

```c
typedef struct redisClient {

    // ...

    robj *name;

    // ...

} redisClient;
```

### 3. 标志

客户端的标志属性 `flags` 记录了客户端的角色（role）， 以及客户端目前所处的状态：

```c
typedef struct redisClient {

    // ...

    int flags;

    // ...

} redisClient;
```

`flags` 属性的值可以是单个标志：

```c
flags = <flag>
```

也可以是多个标志的二进制或， 比如：

```c
flags = <flag1> | <flag2> | ...
```

以下是一些 `flags` 属性的例子：

```sh
# 客户端是一个主服务器
REDIS_MASTER

# 客户端正在被列表命令阻塞
REDIS_BLOCKED

# 客户端正在执行事务，但事务的安全性已被破坏
REDIS_MULTI | REDIS_DIRTY_CAS

# 客户端是一个从服务器，并且版本低于 Redis 2.8
REDIS_SLAVE | REDIS_PRE_PSYNC

# 这是专门用于执行 Lua 脚本包含的 Redis 命令的伪客户端
# 它强制服务器将当前执行的命令写入 AOF 文件，并复制给从服务器
REDIS_LUA_CLIENT | REDIS_FORCE_AOF | REDIS_FORCE_REPL
```

### 4. 输入缓冲区

客户端状态的输入缓冲区用于保存客户端发送的命令请求：

```c
typedef struct redisClient {

    // ...

    sds querybuf;

    // ...

} redisClient;
```

举个例子， 如果客户端向服务器发送了以下命令请求：

```
SET key value
```

### 5. 命令与命令参数

在服务器将客户端发送的命令请求保存到客户端状态的 `querybuf` 属性之后， 服务器将对命令请求的内容进行分析， 并将得出的命令参数以及命令参数的个数分别保存到客户端状态的 `argv` 属性和 `argc` 属性：

```c
typedef struct redisClient {

    // ...

    robj **argv;

    int argc;

    // ...

} redisClient;
```

`argv` 属性是一个数组， 数组中的每个项都是一个字符串对象： 其中 `argv[0]` 是要执行的命令， 而之后的其他项则是传给命令的参数。

`argc` 属性则负责记录 `argv` 数组的长度。

### 6. 命令的实现函数

当服务器从协议内容中分析并得出 `argv` 属性和 `argc` 属性的值之后， 服务器将根据项 `argv[0]` 的值， 在命令表中查找命令所对应的命令实现函数。

```c
typedef struct redisClient {

    // ...

    struct redisCommand *cmd;

    // ...

} redisClient;
```

![](./images/redis-cmd-list.png)



之后， 服务器就可以使用 `cmd` 属性所指向的 `redisCommand` 结构， 以及 `argv` 、 `argc` 属性中保存的命令参数信息， 调用命令实现函数， 执行客户端指定的命令。

针对命令表的查找操作不区分输入字母的大小写， 所以无论 `argv[0]` 是 `"SET"` 、 `"set"` 、或者 `"SeT` ， 等等， 查找的结果都是相同的。

### 7. 输出缓冲区

执行命令所得的命令回复会被保存在客户端状态的输出缓冲区里面， 每个客户端都有两个输出缓冲区可用， 一个缓冲区的大小是固定的， 另一个缓冲区的大小是可变的：

- 固定大小的缓冲区用于保存那些长度比较小的回复， 比如 `OK` 、简短的字符串值、整数值、错误回复，等等。
- 可变大小的缓冲区用于保存那些长度比较大的回复， 比如一个非常长的字符串值， 一个由很多项组成的列表， 一个包含了很多元素的集合， 等等。

客户端的固定大小缓冲区由 `buf` 和 `bufpos` 两个属性组成：

```c
typedef struct redisClient {

    // ...

    char buf[REDIS_REPLY_CHUNK_BYTES];

    int bufpos;

    // ...

} redisClient;
```

`buf` 是一个大小为 `REDIS_REPLY_CHUNK_BYTES` 字节的字节数组， 而 `bufpos` 属性则记录了 `buf` 数组目前已使用的字节数量。

`REDIS_REPLY_CHUNK_BYTES` 常量目前的默认值为 `16*1024` ， 也即是说， `buf` 数组的默认大小为 16 KB 。

### 8. 身份验证

客户端状态的 `authenticated` 属性用于记录客户端是否通过了身份验证：

```c
typedef struct redisClient {

    // ...

    int authenticated;

    // ...

} redisClient;
```

如果 `authenticated` 的值为 `0` ， 那么表示客户端未通过身份验证； 如果 `authenticated` 的值为 `1` ， 那么表示客户端已经通过了身份验证。

### 9. 时间

最后， 客户端还有几个和时间有关的属性：

```c
typedef struct redisClient {

    // ...

    time_t ctime;

    time_t lastinteraction;

    time_t obuf_soft_limit_reached_time;

    // ...

} redisClient;
```

`ctime` 属性记录了创建客户端的时间， 这个时间可以用来计算客户端与服务器已经连接了多少秒 —— CLIENT_LIST 命令的 `age` 域记录了这个秒数

## 3. 客户端类型

通过网络与服务器进行连接的客户端称为普通客户端，此外还有伪客户端。

包括用于执行Lua脚本的客户端,不需要进行网络连接，所以没有fd,在Redis服务器一启动就会创建，知道服务器关闭才关闭。

还有AOF文件的伪客户端,服务器在载入AOF文件是会创建一个伪客户端用于执行Redis命令，并在载入完成后关闭这个伪客户端。



## 4. 小结

- 服务器状态结构使用 `clients` 链表连接起多个客户端状态， 新添加的客户端状态会被放到链表的末尾。
- 客户端状态的 `flags` 属性使用不同标志来表示客户端的角色， 以及客户端当前所处的状态。
- 输入缓冲区记录了客户端发送的命令请求， 这个缓冲区的大小不能超过 1 GB 。
- 命令的参数和参数个数会被记录在客户端状态的 `argv` 和 `argc` 属性里面， 而 `cmd` 属性则记录了客户端要执行命令的实现函数。
- 客户端有固定大小缓冲区和可变大小缓冲区两种缓冲区可用， 其中固定大小缓冲区的最大大小为 16 KB ， 而可变大小缓冲区的最大大小不能超过服务器设置的硬性限制值。
- 输出缓冲区限制值有两种， 如果输出缓冲区的大小超过了服务器设置的硬性限制， 那么客户端会被立即关闭； 除此之外， 如果客户端在一定时间内， 一直超过服务器设置的软性限制， 那么客户端也会被关闭。
- 当一个客户端通过网络连接连上服务器时， 服务器会为这个客户端创建相应的客户端状态。 网络连接关闭、 发送了不合协议格式的命令请求、 成为 CLIENT_KILL 命令的目标、 空转时间超时、 输出缓冲区的大小超出限制， 以上这些原因都会造成客户端被关闭。
- 处理 Lua 脚本的伪客户端在服务器初始化时创建， 这个客户端会一直存在， 直到服务器关闭。
- 载入 AOF 文件时使用的伪客户端在载入工作开始时动态创建， 载入工作完毕之后关闭。