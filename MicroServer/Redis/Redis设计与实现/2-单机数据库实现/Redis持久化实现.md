# Redis持久化实现

## 1. RDB

rdb自动触发是如何实现的?

首先需要用户在配置文件`redis.conf`中设定相关配置。

```sh
save 900 1
save 300 10
save 60 10000
```

只要满足三个中的一个就会触发。

* 1).900秒内至少进行了1次修改
* 2).300秒内至少进行了10次修改
* 3).60秒内至少进行了10000次修改

### 1. 配置信息加载

这个配置将会加载到服务器状态结构`redisServer`中

```c
struct redisServer {
    //...
    struct saveparam *saveparams;
    //...  
};
```

其中`saveparams`是一个数组,每个元素都是一个`saveparam`结构

```c
struct saveparam {
    //秒数
    time_t seconds;
    // 修改次数
    int changes;
};
```

### 2. 触发信息记录

此外服务器上还维持着一个`dirty`计数器和一个`lastsave`属性。

```c
struct redisServer {
    //...
    // 修改计数器
    long long dirty;
    // 上一次执行保存的时间
    time_t lastsave;
    //...  
};
```

`dirty`记录了上次成功执行`SAVE`或者`BGSAVE`之后对服务器数据库(所有数据库)进行了多少次修改(写入、删除、更新等)。

`lastsave`属性记录了上次成功执行`SAVE`或者`BGSAVE`的时间，Unix时间戳。

### 3. 定期检查

Redis服务器的周期性操作函数`serverCron`会默认每隔100ms就检查一下是否满足执行条件。满足就执行`BGSAVE`,执行成功后重置`dirty`并更新`lastsave`



### 4. 文件结构

RDB文件分为5个部分，大概是这么一个结构

```sh
REDIS|db_version|databases|EOF|check_sum|
```

**1.REDIS**

开头REDIS部分长度5字节,保存着`REDIS`5个字符，用于载入时快速检查是否是RDB文件。

**2.db_version**

`db_version`部分长度4字节,记录着RDB文件的版本号

**3.databases**

`databases**`这部分保存着0个或多个数据库，已经数据库中的键值对数据。

如果服务器数据库为空那么这部分长度也为0。



**4.EOF**

`EOF`常量长度为1字节,标志着RDB文件正文内容结束。

**5.check_sum**

`check_sum` 是一个 `8` 字节长的无符号整数， 保存着一个校验和， 这个校验和是程序通过对 `REDIS` 、 `db_version` 、 `databases` 、 `EOF` 四个部分的内容进行计算得出的。 服务器在载入 RDB 文件时， 会将载入数据所计算出的校验和与 `check_sum` 所记录的校验和进行对比， 以此来检查 RDB 文件是否有出错或者损坏的情况出现。

**6.database具体结构**

每个非空数据库在 RDB 文件中都可以保存为 `SELECTDB` 、 `db_number` 、 `key_value_pairs` 三个部分

```sh
SELECTDB|db_number|key_value_pairs
```

`SELECTDB` 常量的长度为 `1` 字节， 当读入程序遇到这个值的时候， 它知道接下来要读入的将是一个数据库号码。

`db_number` 保存着一个数据库号码， 根据号码的大小不同， 这个部分的长度可以是 `1` 字节、 `2` 字节或者 `5` 字节。 当程序读入 `db_number` 部分之后， 服务器会调用 SELECT 命令， 根据读入的数据库号码进行数据库切换， 使得之后读入的键值对可以载入到正确的数据库中。

`key_value_pairs` 部分保存了数据库中的所有键值对数据， 如果键值对带有过期时间， 那么过期时间也会和键值对保存在一起。 根据键值对的数量、类型、内容、以及是否有过期时间等条件的不同， `key_value_pairs` 部分的长度也会有所不同。

**7.key_value_pairs结构**

RDB 文件中的每个 `key_value_pairs` 部分都保存了一个或以上数量的键值对， 如果键值对带有过期时间的话， 那么键值对的过期时间也会被保存在内。

键值对在 RDB 文件中对由`EXPIRETIME_MS`、`ms`、 `TYPE` 、 `key` 、 `value` 五部分组成,如果没有过期时间则只有后面三部分。

```sh
EXPIRETIME_MS|ms|TYPE|key|value
```

实例如下

```sh
EXPIRETIME_MS|1587455668|REDIS_RDB_TYPE_STRING|key|value
```



`EXPIRETIME_MS`常量的长度为 `1` 字节， 它告知读入程序， 接下来要读入的将是一个以毫秒为单位的过期时间。

`ms` 是一个 `8` 字节长的带符号整数， 记录着一个以毫秒为单位的 UNIX 时间戳， 这个时间戳就是键值对的过期时间。

`TYPE` 记录了 `value` 的类型， 长度为 `1` 字节

`key` 和 `value` 分别保存了键值对的键对象和值对象：

- 其中 `key` 总是一个字符串对象， 它的编码方式和 `REDIS_RDB_TYPE_STRING` 类型的 `value` 一样。 根据内容长度的不同， `key` 的长度也会有所不同。
- 根据 `TYPE` 类型的不同， 以及保存内容长度的不同， 保存 `value` 的结构和长度也会有所不同， 本节稍后会详细说明每种 `TYPE` 类型的`value` 结构保存方式。



**8.value编码**

RDB 文件中的每个 `value` 部分都保存了一个值对象， 每个值对象的类型都由与之对应的 `TYPE` 记录， 根据类型的不同， `value` 部分的结构、长度也会有所不同。编码方式和Redis存储时各类型的编码一致。

#### 实例

清空redis,保存一个最简单的rdb文件

```shell
127.0.0.1:6379> flushall
OK
127.0.0.1:6379> save
OK
```

然后使用`od`命令查看

```shell
[root@localhost /]# od -c dump.rdb 
0000000   R   E   D   I   S   0   0   0   9 372  \t   r   e   d   i   s
0000020   -   v   e   r 005   5   .   0   .   7 372  \n   r   e   d   i
0000040   s   -   b   i   t   s 300   @ 372 005   c   t   i   m   e 302
0000060   N 250 236   ^ 372  \b   u   s   e   d   -   m   e   m 302 360
0000100   X  \r  \0 372  \f   a   o   f   -   p   r   e   a   m   b   l
0000120   e 300  \0 377   V 237 375 275   g 355 276   d
0000134

```

最前面五个字节`R   E   D   I   S`

接着4个字节版本` 0   0   0   9 `

然后databases为空 没有

后面1个字节的EOF常量`372`

最后的就是`check_sum`校验和了。

> 前面写的是0006版本的格式 0009版本好像有些变化了

### 5. 小结

- RDB 文件用于保存和还原 Redis 服务器所有数据库中的所有键值对数据。
- SAVE 命令由服务器进程直接执行保存操作，所以该命令会阻塞服务器。
- BGSAVE 命令由子进程执行保存操作，所以该命令不会阻塞服务器。
- 服务器状态中会保存所有用 `save` 选项设置的保存条件，当任意一个保存条件被满足时，服务器会自动执行 BGSAVE 命令。
- RDB 文件是一个经过压缩的二进制文件，由多个部分组成。
- 对于不同类型的键值对， RDB 文件会使用不同的方式来保存它们。



## 2. AOF

RDB持久化是将内存中的数据存起来，写入到RDB文件中。

而AOF则是将执行的redis命令一条条保存起来。

通过AOF还原则是将AOF文件中记录的命令在执行一遍。



### 1. 具体流程

AOF 持久化功能的实现可以分为命令追加（append）、文件写入、文件同步（sync）三个步骤。

**命令追加**

当 AOF 持久化功能处于打开状态时， 服务器在执行完一个写命令之后， 会以协议格式将被执行的写命令追加到服务器状态的 `aof_buf` 缓冲区的末尾：

```c
struct redisServer {

    // ...

    // AOF 缓冲区
    sds aof_buf;

    // ...
};
```



**AOF 文件的写入与同步**

Redis 的服务器进程就是一个事件循环（loop）， 这个循环中的文件事件负责接收客户端的命令请求， 以及向客户端发送命令回复， 而时间事件则负责执行像 `serverCron` 函数这样需要定时运行的函数。

伪代码如下

```c
def eventLoop():

    while True:

        # 处理文件事件，接收命令请求以及发送命令回复
        # 处理命令请求时可能会有新内容被追加到 aof_buf 缓冲区中
        processFileEvents()

        # 处理时间事件
        processTimeEvents()

        # 考虑是否要将 aof_buf 中的内容写入和保存到 AOF 文件里面
        flushAppendOnlyFile()
```

`flushAppendOnlyFile` 函数的行为由服务器配置的 `appendfsync` 选项的值来决定， 各个不同值产生的行为如表 TABLE_APPENDFSYNC 所示。

如果用户没有主动为 `appendfsync` 选项设置值， 那么 `appendfsync` 选项的默认值为 `everysec`

### 2. 文件重写

随着AOF文件越来越大，需要定期对AOF文件进行重写，达到压缩的目的。

**虽然是叫重写,但实际和AOF文件没关系，是直接读取数据库状态然后写入命令。**





### 3. 小结

- AOF 文件通过保存所有修改数据库的写命令请求来记录服务器的数据库状态。
- AOF 文件中的所有命令都以 Redis 命令请求协议的格式保存。
- 命令请求会先保存到 AOF 缓冲区里面， 之后再定期写入并同步到 AOF 文件。
- `appendfsync` 选项的不同值对 AOF 持久化功能的安全性、以及 Redis 服务器的性能有很大的影响。
- 服务器只要载入并重新执行保存在 AOF 文件中的命令， 就可以还原数据库本来的状态。
- AOF 重写可以产生一个新的 AOF 文件， 这个新的 AOF 文件和原有的 AOF 文件所保存的数据库状态一样， 但体积更小。
- AOF 重写是一个有歧义的名字， 该功能是通过读取数据库中的键值对来实现的， 程序无须对现有 AOF 文件进行任何读入、分析或者写入操作。
- 在执行 BGREWRITEAOF 命令时， Redis 服务器会维护一个 AOF 重写缓冲区， 该缓冲区会在子进程创建新 AOF 文件的期间， 记录服务器执行的所有写命令。 当子进程完成创建新 AOF 文件的工作之后， 服务器会将重写缓冲区中的所有内容追加到新 AOF 文件的末尾， 使得新旧两个 AOF 文件所保存的数据库状态一致。 最后， 服务器用新的 AOF 文件替换旧的 AOF 文件， 以此来完成 AOF 文件重写操作。