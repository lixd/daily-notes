# Redis服务器

## 1. 概述

**Redis 命令请求的执行过程**

一个命令请求从发送到获得回复的过程中， 客户端和服务器需要完成一系列操作。

举个例子， 如果我们使用客户端执行以下命令：

```c
redis> SET KEY VALUE
OK
```

那么从客户端发送 `SET KEY VALUE` 命令到获得回复 `OK` 期间， 客户端和服务器共需要执行以下操作：

1. 客户端向服务器发送命令请求 `SET KEY VALUE` 。
2. 服务器接收并处理客户端发来的命令请求 `SET KEY VALUE` ， 在数据库中进行设置操作， 并产生命令回复 `OK` 。
3. 服务器将命令回复 `OK` 发送给客户端。
4. 客户端接收服务器返回的命令回复 `OK` ， 并将这个回复打印给用户观看。



## 2. 具体流程

### 1. 发送请求

当用户在客户端中键入一个命令请求时， 客户端会将这个命令请求转换成协议格式， 然后通过连接到服务器的套接字， 将协议格式的命令请求发送给服务器。

举个例子， 假设客户端执行命令：

```
SET KEY VALUE
```

那么客户端会将这个命令转换成协议：

```
*3\r\n$3\r\nSET\r\n$3\r\nKEY\r\n$5\r\nVALUE\r\n
```

然后将这段协议内容发送给服务器。



### 2. 读取命令请求

当客户端与服务器之间的连接套接字因为客户端的写入而变得可读时， 服务器将调用命令请求处理器来执行以下操作：

1. 读取套接字中协议格式的命令请求， 并将其保存到客户端状态的输入缓冲区里面。
2. 对输入缓冲区中的命令请求进行分析， 提取出命令请求中包含的命令参数， 以及命令参数的个数， 然后分别将参数和参数个数保存到客户端状态的 `argv` 属性和 `argc` 属性里面。
3. 调用命令执行器， 执行客户端指定的命令。

 分析程序将对输入缓冲区中的协议：

```
*3\r\n$3\r\nSET\r\n$3\r\nKEY\r\n$5\r\nVALUE\r\n
```

进行分析， 并将得出的分析结果保存到客户端状态的 `argv` 属性和 `argc` 属性里面。

之后， 服务器将通过调用命令执行器来完成执行命令所需的余下步骤

**命令执行器（1）：查找命令实现**

命令执行器要做的第一件事就是根据客户端状态的 `argv[0]` 参数， 在命令表（command table）中查找参数所指定的命令， 并将找到的命令保存到客户端状态的 `cmd` 属性里面。

命令表是一个字典， 字典的键是一个个命令名字，比如 `"set"` 、 `"get"` 、 `"del"` ，等等； 而字典的值则是一个个 `redisCommand` 结构， 每个`redisCommand` 结构记录了一个 Redis 命令的实现信息

**命令执行器（2）：执行预备操作**

到目前为止， 服务器已经将执行命令所需的命令实现函数（保存在客户端状态的 `cmd` 属性）、参数（保存在客户端状态的 `argv` 属性）、参数个数（保存在客户端状态的 `argc` 属性）都收集齐了， 但是在真正执行命令之前， 程序还需要进行一些预备操作， 从而确保命令可以正确、顺利地被执行， 这些操作包括：

* 1.检查客户端状态的 `cmd` 指针是否指向 `NULL`
* 2.检查命令请求所给定的参数个数是否正确
* 3.检查客户端是否已经通过了身份验证
* 等等

**命令执行器（3）：调用命令的实现函数**

在前面的操作中， 服务器已经将要执行命令的实现保存到了客户端状态的 `cmd` 属性里面， 并将命令的参数和参数个数分别保存到了客户端状态的 `argv` 属性和 `argc` 属性里面， 当服务器决定要执行命令时， 它只要执行以下语句就可以了：

```sh
// client 是指向客户端状态的指针

client->cmd->proc(client);
```

因为执行命令所需的实际参数都已经保存到客户端状态的 `argv` 属性里面了， 所以命令的实现函数只需要一个指向客户端状态的指针作为参数即可。

对于这个例子来说， 执行语句：

```
client->cmd->proc(client);
```

等于执行语句：

```
setCommand(client);
```

被调用的命令实现函数会执行指定的操作， 并产生相应的命令回复， 这些回复会被保存在客户端状态的输出缓冲区里面（`buf` 属性和 `reply`属性）， 之后实现函数还会为客户端的套接字关联命令回复处理器， 这个处理器负责将命令回复返回给客户端。

**命令执行器（4）：执行后续工作**

在执行完实现函数之后， 服务器还需要执行一些后续工作：

- 如果服务器开启了慢查询日志功能， 那么慢查询日志模块会检查是否需要为刚刚执行完的命令请求添加一条新的慢查询日志。
- 根据刚刚执行命令所耗费的时长， 更新被执行命令的 `redisCommand` 结构的 `milliseconds` 属性， 并将命令的 `redisCommand` 结构的 `calls`计数器的值增一。
- 如果服务器开启了 AOF 持久化功能， 那么 AOF 持久化模块会将刚刚执行的命令请求写入到 AOF 缓冲区里面。
- 如果有其他从服务器正在复制当前这个服务器， 那么服务器会将刚刚执行的命令传播给所有从服务器。

当以上操作都执行完了之后， 服务器对于当前命令的执行到此就告一段落了， 之后服务器就可以继续从文件事件处理器中取出并处理下一个命令请求了。

### 3. 将命令回复发送给客户端

 命令实现函数会将命令回复保存到客户端的输出缓冲区里面， 并为客户端的套接字关联命令回复处理器， 当客户端套接字变为可写状态时， 服务器就会执行命令回复处理器， 将保存在客户端输出缓冲区中的命令回复发送给客户端。

当命令回复发送完毕之后， 回复处理器会清空客户端状态的输出缓冲区， 为处理下一个命令请求做好准备。

### 4. 客户端接收并打印命令回复

当客户端接收到协议格式的命令回复之后， 它会将这些回复转换成人类可读的格式， 并打印给用户观看（假设我们使用的是 Redis 自带的`redis-cli` 客户端）

继续以之前的 SET 命令为例子， 当客户端接到服务器发来的 `"+OK\r\n"` 协议回复时， 它会将这个回复转换成 `"OK\n"` ， 然后打印给用户看：

```c
redis> SET KEY VALUE
OK
```

以上就是 Redis 客户端和服务器执行命令请求的整个过程了。

## 3. 服务器初始化

### 1.初始化服务器状态结构

第一步就是创建一个redisServer类型的变量实例server作为服务器的状态，并为结构中的各个属性赋默认值。

主要执行如下工作:

* 1.设置服务器的运行 ID
* 2.设置默认配置文件路径
* 3.设置服务器默认频率
* 4.设置服务器的运行架构
* 5.设置默认服务器端口号
* 6.设置持久化条件
* 7.初始化 LRU 时间
* 8.创建命令表



具体如下`redis.c/initServerConfig()`

```c
void initServerConfig() {
    int j;

    // 服务器状态

    // 设置服务器的运行 ID
    getRandomHexChars(server.runid,REDIS_RUN_ID_SIZE);
    // 设置默认配置文件路径
    server.configfile = NULL;
    // 设置默认服务器频率
    server.hz = REDIS_DEFAULT_HZ;
    // 为运行 ID 加上结尾字符
    server.runid[REDIS_RUN_ID_SIZE] = '\0';
    // 设置服务器的运行架构
    server.arch_bits = (sizeof(long) == 8) ? 64 : 32;
    // 设置默认服务器端口号
    server.port = REDIS_SERVERPORT;
    //设置默认值

    // 初始化 LRU 时间
    server.lruclock = getLRUClock();

    // 初始化并设置保存条件
    resetServerSaveParams();

    appendServerSaveParams(60*60,1);  /* save after 1 hour and 1 change */
    appendServerSaveParams(300,100);  /* save after 5 minutes and 100 changes */
    appendServerSaveParams(60,10000); /* save after 1 minute and 10000 changes */

    /* Replication related */
    // 初始化和复制相关的状态
    server.masterauth = NULL;
    server.masterhost = NULL;
    server.masterport = 6379;
    server.master = NULL;
    server.cached_master = NULL;
    server.repl_master_initial_offset = -1;
    server.repl_state = REDIS_REPL_NONE;
    server.repl_syncio_timeout = REDIS_REPL_SYNCIO_TIMEOUT;
    server.repl_serve_stale_data = REDIS_DEFAULT_SLAVE_SERVE_STALE_DATA;
    server.repl_slave_ro = REDIS_DEFAULT_SLAVE_READ_ONLY;
    server.repl_down_since = 0; /* Never connected, repl is down since EVER. */
    server.repl_disable_tcp_nodelay = REDIS_DEFAULT_REPL_DISABLE_TCP_NODELAY;
    server.slave_priority = REDIS_DEFAULT_SLAVE_PRIORITY;
    server.master_repl_offset = 0;

    /* Replication partial resync backlog */
    // 初始化 PSYNC 命令所使用的 backlog
    server.repl_backlog = NULL;
    server.repl_backlog_size = REDIS_DEFAULT_REPL_BACKLOG_SIZE;
    server.repl_backlog_histlen = 0;
    server.repl_backlog_idx = 0;
    server.repl_backlog_off = 0;
    server.repl_backlog_time_limit = REDIS_DEFAULT_REPL_BACKLOG_TIME_LIMIT;
    server.repl_no_slaves_since = time(NULL);

    /* Client output buffer limits */
    // 设置客户端的输出缓冲区限制
    for (j = 0; j < REDIS_CLIENT_LIMIT_NUM_CLASSES; j++)
        server.client_obuf_limits[j] = clientBufferLimitsDefaults[j];

    /* Double constants initialization */
    // 初始化浮点常量
    R_Zero = 0.0;
    R_PosInf = 1.0/R_Zero;
    R_NegInf = -1.0/R_Zero;
    R_Nan = R_Zero/R_Zero;

    /* Command table -- we initiialize it here as it is part of the
     * initial configuration, since command names may be changed via
     * redis.conf using the rename-command directive. */
    // 初始化命令表
    // 在这里初始化是因为接下来读取 .conf 文件时可能会用到这些命令
    server.commands = dictCreate(&commandTableDictType,NULL);
    server.orig_commands = dictCreate(&commandTableDictType,NULL);
    populateCommandTable();
    server.delCommand = lookupCommandByCString("del");
    server.multiCommand = lookupCommandByCString("multi");
    server.lpushCommand = lookupCommandByCString("lpush");
    server.lpopCommand = lookupCommandByCString("lpop");
    server.rpopCommand = lookupCommandByCString("rpop");
    
    /* Slow log */
    // 初始化慢查询日志
    server.slowlog_log_slower_than = REDIS_SLOWLOG_LOG_SLOWER_THAN;
    server.slowlog_max_len = REDIS_SLOWLOG_MAX_LEN;

    /* Debugging */
    // 初始化调试项
    server.assert_failed = "<no assertion failed>";
    server.assert_file = "<no file>";
    server.assert_line = 0;
    server.bug_report_start = 0;
    server.watchdog_period = 0;
}

```



### 2. 载入配置选项

在赋默认值之后如果用户指定了配置则会更新为用户设置的值。



### 3. 初始化服务器数据结构

执行`initServerConfig`只创建了一个命令表,实际上还包含其他数据结构需要初始化：

* 1.server.clients链表 记录了连接到服务器的所有客户端状态
* 2.频道订阅相关的server.pu_sub_channels字典和模式订阅相关的server.pubsub_patterns链表
* 3.执行Lua脚本的环境 server.lua
* 4.用于保存慢日志的server.slowlog属性

当执行到这一步时会调用`initServer`函数初始化以上数据结构。

`redis.c/initServer`

```c
void initServer() {
    int j;

    // 设置信号处理函数
    signal(SIGHUP, SIG_IGN);
    signal(SIGPIPE, SIG_IGN);
    setupSignalHandlers();

    // 设置 syslog
    if (server.syslog_enabled) {
        openlog(server.syslog_ident, LOG_PID | LOG_NDELAY | LOG_NOWAIT,
            server.syslog_facility);
    }

    // 初始化并创建数据结构
    server.current_client = NULL;
    server.clients = listCreate();
    server.clients_to_close = listCreate();
    server.slaves = listCreate();
    server.monitors = listCreate();
    server.slaveseldb = -1; /* Force to emit the first SELECT command. */
    server.unblocked_clients = listCreate();
    server.ready_keys = listCreate();
    server.clients_waiting_acks = listCreate();
    server.get_ack_from_slaves = 0;
    server.clients_paused = 0;

    // 创建共享对象
    createSharedObjects();
    adjustOpenFilesLimit();
    server.el = aeCreateEventLoop(server.maxclients+REDIS_EVENTLOOP_FDSET_INCR);
    server.db = zmalloc(sizeof(redisDb)*server.dbnum);

    /* Open the TCP listening socket for the user commands. */
    // 打开 TCP 监听端口，用于等待客户端的命令请求
    if (server.port != 0 &&
        listenToPort(server.port,server.ipfd,&server.ipfd_count) == REDIS_ERR)
        exit(1);

    /* Open the listening Unix domain socket. */
    // 打开 UNIX 本地端口
    if (server.unixsocket != NULL) {
        unlink(server.unixsocket); /* don't care if this fails */
        server.sofd = anetUnixServer(server.neterr,server.unixsocket,
            server.unixsocketperm, server.tcp_backlog);
        if (server.sofd == ANET_ERR) {
            redisLog(REDIS_WARNING, "Opening socket: %s", server.neterr);
            exit(1);
        }
        anetNonBlock(NULL,server.sofd);
    }

    /* Abort if there are no listening sockets at all. */
    if (server.ipfd_count == 0 && server.sofd < 0) {
        redisLog(REDIS_WARNING, "Configured to not listen anywhere, exiting.");
        exit(1);
    }

    /* Create the Redis databases, and initialize other internal state. */
    // 创建并初始化数据库结构
    for (j = 0; j < server.dbnum; j++) {
        server.db[j].dict = dictCreate(&dbDictType,NULL);
        server.db[j].expires = dictCreate(&keyptrDictType,NULL);
        server.db[j].blocking_keys = dictCreate(&keylistDictType,NULL);
        server.db[j].ready_keys = dictCreate(&setDictType,NULL);
        server.db[j].watched_keys = dictCreate(&keylistDictType,NULL);
        server.db[j].eviction_pool = evictionPoolAlloc();
        server.db[j].id = j;
        server.db[j].avg_ttl = 0;
    }

    // 创建 PUBSUB 相关结构
    server.pubsub_channels = dictCreate(&keylistDictType,NULL);
    server.pubsub_patterns = listCreate();
    listSetFreeMethod(server.pubsub_patterns,freePubsubPattern);
    listSetMatchMethod(server.pubsub_patterns,listMatchPubsubPattern);

    server.cronloops = 0;
    server.rdb_child_pid = -1;
    server.aof_child_pid = -1;
    aofRewriteBufferReset();
    server.aof_buf = sdsempty();
    server.lastsave = time(NULL); /* At startup we consider the DB saved. */
    server.lastbgsave_try = 0;    /* At startup we never tried to BGSAVE. */
    server.rdb_save_time_last = -1;
    server.rdb_save_time_start = -1;
    server.dirty = 0;
    resetServerStats();
    /* A few stats we don't want to reset: server startup time, and peak mem. */
    server.stat_starttime = time(NULL);
    server.stat_peak_memory = 0;
    server.resident_set_size = 0;
    server.lastbgsave_status = REDIS_OK;
    server.aof_last_write_status = REDIS_OK;
    server.aof_last_write_errno = 0;
    server.repl_good_slaves_count = 0;
    updateCachedTime();

    /* Create the serverCron() time event, that's our main way to process
     * background operations. */
    // 为 serverCron() 创建时间事件
    if(aeCreateTimeEvent(server.el, 1, serverCron, NULL, NULL) == AE_ERR) {
        redisPanic("Can't create the serverCron time event.");
        exit(1);
    }

    /* Create an event handler for accepting new connections in TCP and Unix
     * domain sockets. */
    // 为 TCP 连接关联连接应答（accept）处理器
    // 用于接受并应答客户端的 connect() 调用
    for (j = 0; j < server.ipfd_count; j++) {
        if (aeCreateFileEvent(server.el, server.ipfd[j], AE_READABLE,
            acceptTcpHandler,NULL) == AE_ERR)
            {
                redisPanic(
                    "Unrecoverable error creating server.ipfd file event.");
            }
    }

    // 为本地套接字关联应答处理器
    if (server.sofd > 0 && aeCreateFileEvent(server.el,server.sofd,AE_READABLE,
        acceptUnixHandler,NULL) == AE_ERR) redisPanic("Unrecoverable error creating server.sofd file event.");

    /* Open the AOF file if needed. */
    // 如果 AOF 持久化功能已经打开，那么打开或创建一个 AOF 文件
    if (server.aof_state == REDIS_AOF_ON) {
        server.aof_fd = open(server.aof_filename,
                               O_WRONLY|O_APPEND|O_CREAT,0644);
        if (server.aof_fd == -1) {
            redisLog(REDIS_WARNING, "Can't open the append-only file: %s",
                strerror(errno));
            exit(1);
        }
    }

    /* 32 bit instances are limited to 4GB of address space, so if there is
     * no explicit limit in the user provided configuration we set a limit
     * at 3 GB using maxmemory with 'noeviction' policy'. This avoids
     * useless crashes of the Redis instance for out of memory. */
    // 对于 32 位实例来说，默认将最大可用内存限制在 3 GB
    if (server.arch_bits == 32 && server.maxmemory == 0) {
        redisLog(REDIS_WARNING,"Warning: 32 bit instance detected but no memory limit set. Setting 3 GB maxmemory limit with 'noeviction' policy now.");
        server.maxmemory = 3072LL*(1024*1024); /* 3 GB */
        server.maxmemory_policy = REDIS_MAXMEMORY_NO_EVICTION;
    }

    // 如果服务器以 cluster 模式打开，那么初始化 cluster
    if (server.cluster_enabled) clusterInit();

    // 初始化复制功能有关的脚本缓存
    replicationScriptCacheInit();

    // 初始化脚本系统
    scriptingInit();

    // 初始化慢查询功能
    slowlogInit();

    // 初始化 BIO 系统
    bioInit();
}
```



### 4. 还原数据库状态

完成服务器状态变量初始化后需要载入RDB或者AOF文件来还原服务器状态。

如果开启了AOF持久化则载入AOF文件

否则载入RDB文件



### 5. 执行事件循环

最后会打印出以下日志

```sh
the server is now ready to accept connections on port 6379
```

并开始执行服务器的事件循环(loop)

这时服务器初始化完成，可以接受客户端的连接请求了。

## 4. 小结

- 一个命令请求从发送到完成主要包括以下步骤： 
  - 1.客户端将命令请求发送给服务器；
  - 2.服务器读取命令请求，并分析出命令参数；
  - 3.命令执行器根据参数查找命令的实现函数，然后执行实现函数并得出命令回复； 
  - 4.服务器将命令回复返回给客户端。
- `serverCron` 函数默认每隔 `100` 毫秒执行一次， 它的工作主要包括更新服务器状态信息， 处理服务器接收的 `SIGTERM` 信号， 管理客户端资源和数据库状态， 检查并执行持久化操作， 等等。
- 服务器从启动到能够处理客户端的命令请求需要执行以下步骤： 
  - 1.初始化服务器状态； 
  - 2.载入服务器配置； 
  - 3.初始化服务器数据结构；
  - 4.还原数据库状态；
  - 5.执行事件循环。