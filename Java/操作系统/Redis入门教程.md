# Redis入门教程

## 1.NoSQL简介

* key-value:Redis
* 列存储： Hbase
* 文档; MongoDB
* 图形：Neo4J

## 2.Redis简介

redis提供两种方式进行持久化

RDB持久化（原理是将Reids在内存中的数据库记录定时 dump到磁盘上的RDB持久化），

AOF机制对每条写入命令作为日志，以append-only的模式写入一个日志文件中，在redis重启的时候，可以通过回放AOF日志中的写入指令来重新构建整个数据集。 

**区别**：

RDB持久化是指在指定的时间间隔内将内存中的数据集快照写入磁盘，实际操作过程是fork一个子进程，先将数据集写入临时文件，写入成功后，再替换之前的文件，用二进制压缩存储。 

AOF持久化以日志的形式记录服务器所处理的每一个写、删除操作，查询操作不会记录，以文本的方式记录，可以打开文件看到详细的操作记录。 

#### RDB存在哪些优势呢？

1). 一旦采用该方式，那么你的整个Redis数据库将只包含一个文件，这对于文件备份而言是非常完美的。比如，你可能打算每个小时归档一次最近24小时的数 据，同时还要每天归档一次最近30天的数据。通过这样的备份策略，一旦系统出现灾难性故障，我们可以非常容易的进行恢复。

2). 对于灾难恢复而言，RDB是非常不错的选择。因为我们可以非常轻松的将一个单独的文件压缩后再转移到其它存储介质上。

3). 性能最大化。对于Redis的服务进程而言，在开始持久化时，它唯一需要做的只是fork出子进程，之后再由子进程完成这些持久化的工作，这样就可以极大的避免服务进程执行IO操作了。

4). 相比于AOF机制，如果数据集很大，RDB的启动效率会更高。

RDB又存在哪些劣势呢？

1). 如果你想保证数据的高可用性，即最大限度的避免数据丢失，那么RDB将不是一个很好的选择。因为系统一旦在定时持久化之前出现宕机现象，此前没有来得及写入磁盘的数据都将丢失。

2). 由于RDB是通过fork子进程来协助完成数据持久化工作的，因此，如果当数据集较大时，可能会导致整个服务器停止服务几百毫秒，甚至是1秒钟。

#### AOF的优势有哪些呢？

1). 该机制可以带来更高的数据安全性，即数据持久性。Redis中提供了3中同步策略，即每秒同步、每修改同步和不同步。事实上，每秒同步也是异步完成的，其 效率也是非常高的，所差的是一旦系统出现宕机现象，那么这一秒钟之内修改的数据将会丢失。而每修改同步，我们可以将其视为同步持久化，即每次发生的数据变 化都会被立即记录到磁盘中。可以预见，这种方式在效率上是最低的。至于无同步，无需多言，我想大家都能正确的理解它。

2). 由于该机制对日志文件的写入操作采用的是append模式，因此在写入过程中即使出现宕机现象，也不会破坏日志文件中已经存在的内容。然而如果我们本次操 作只是写入了一半数据就出现了系统崩溃问题，不用担心，在Redis下一次启动之前，我们可以通过redis-check-aof工具来帮助我们解决数据 一致性的问题。

3). 如果日志过大，Redis可以自动启用rewrite机制。即Redis以append模式不断的将修改数据写入到老的磁盘文件中，同时Redis还会创 建一个新的文件用于记录此期间有哪些修改命令被执行。因此在进行rewrite切换时可以更好的保证数据安全性。

4). AOF包含一个格式清晰、易于理解的日志文件用于记录所有的修改操作。事实上，我们也可以通过该文件完成数据的重建。

AOF的劣势有哪些呢？

1). 对于相同数量的数据集而言，AOF文件通常要大于RDB文件。RDB 在恢复大数据集时的速度比 AOF 的恢复速度要快。

2). 根据同步策略的不同，AOF在运行效率上往往会慢于RDB。总之，每秒同步策略的效率是比较高的，同步禁用策略的效率和RDB一样高效。

二者选择的标准，就是看系统是愿意牺牲一些性能，换取更高的缓存一致性（aof），还是愿意写操作频繁的时候，不启用备份来换取更高的性能，待手动运行save的时候，再做备份（rdb）。rdb这个就更有些 eventually consistent的意思了。

**注意**：

如果同时使用RDB和AOF两种持久化机制，那么在redis重启的时候，会默认使用AOF来重新构建数据，因为AOF中的数据更加完整（因为AOF默认每隔一秒往AOF文件里面写入一条写操作，和RDB是每隔一段时间生成一个快照）。 





## 3. Redis安装

### 1. 下载

官网`https://redis.io/download` 下载文件，这里下的是`redis-5.0.3.tar.gz`

然后上传到服务器。这里是放在了`/usr/software`目录下



### 2. 环境准备

**安装编译源码所需要的工具和库**:

```linux
# yum install gcc gcc-c++ ncurses-devel perl 
```

### 3. 解压安装

#### 1. 解压

```linux
[root@localhost software]# tar -zxvf redis-5.0.3.tar.gz -C /usr/local
//解压到/usr/local目录下
```

#### 2.编译

进入刚才解压的后的文件夹`redis-5.0.3`进行编译

```linux
[root@localhost redis-5.0.3]# make
```

如果提示`Hint: It's a good idea to run 'make test' ;)`就说明编译ok了，接下来进行安装。

#### 3. 安装

进入`src`目录下

```linux
[root@localhost redis-5.0.3]# cd src/
[root@localhost src]# make install
```

出现下面的提示代表安装ok

```shell
    CC Makefile.dep

Hint: It's a good idea to run 'make test' ;)

    INSTALL install
    INSTALL install
    INSTALL install
    INSTALL install
    INSTALL install

```

#### 4. 文件复制

创建两个文件夹来存放Redis命令和配置文件。

```linux
[root@localhost local]# mkdir -p /usr/local/redis/etc
[root@localhost local]# mkdir -p /usr/local/redis/bin
```

把``redis-5.0.3`下的`redis.conf`复制到`/usr/local/redis/etc`目录下

```linux
[root@localhost redis-5.0.3]# cp redis.conf /usr/local/redis/etc/
```

把`redis-5.0.3/src`里的`mkreleasehdr.sh`、`redis-benchmark`、`redis-check-aof`、`redis-check-rdb`、`redis-cli`、`redis-server` 文件移动到`/usr/local/redis/bin`下

```linux
[root@localhost src]# mv mkreleasehdr.sh redis-benchmark redis-check-aof redis-check-rdb redis-cli redis-server /usr/local/redis/bin
```

### 4. 启动

#### 1. 前台启动

启动时并指定配置文件：.

```linux
[root@localhost etc]# /usr/local/redis/bin/redis-server /usr/local/redis/etc/redis.conf
```

出现如下提示代表启动成功

```shell
[root@localhost etc]# /usr/local/redis/bin/redis-server /usr/local/redis/etc/redis.conf
10869:C 05 Mar 2019 13:33:39.041 # oO0OoO0OoO0Oo Redis is starting oO0OoO0OoO0Oo
10869:C 05 Mar 2019 13:33:39.042 # Redis version=5.0.3, bits=64, commit=00000000, modified=0, pid=10869, just started
10869:C 05 Mar 2019 13:33:39.042 # Configuration loaded
10869:M 05 Mar 2019 13:33:39.044 * Increased maximum number of open files to 10032 (it was originally set to 1024).
                _._                                                  
           _.-``__ ''-._                                             
      _.-``    `.  `_.  ''-._           Redis 5.0.3 (00000000/0) 64 bit
  .-`` .-```.  ```\/    _.,_ ''-._                                   
 (    '      ,       .-`  | `,    )     Running in standalone mode
 |`-._`-...-` __...-.``-._|'` _.-'|     Port: 6379
 |    `-._   `._    /     _.-'    |     PID: 10869
  `-._    `-._  `-./  _.-'    _.-'                                   
 |`-._`-._    `-.__.-'    _.-'_.-'|                                  
 |    `-._`-._        _.-'_.-'    |           http://redis.io        
  `-._    `-._`-.__.-'_.-'    _.-'                                   
 |`-._`-._    `-.__.-'    _.-'_.-'|                                  
 |    `-._`-._        _.-'_.-'    |                                  
  `-._    `-._`-.__.-'_.-'    _.-'                                   
      `-._    `-.__.-'    _.-'                                       
          `-._        _.-'                                           
              `-.__.-'                                               

10869:M 05 Mar 2019 13:33:39.046 # WARNING: The TCP backlog setting of 511 cannot be enforced because /proc/sys/net/core/somaxconn is set to the lower value of 128.
10869:M 05 Mar 2019 13:33:39.046 # Server initialized
10869:M 05 Mar 2019 13:33:39.047 # WARNING overcommit_memory is set to 0! Background save may fail under low memory condition. To fix this issue add 'vm.overcommit_memory = 1' to /etc/sysctl.conf and then reboot or run the command 'sysctl vm.overcommit_memory=1' for this to take effect.
10869:M 05 Mar 2019 13:33:39.047 # WARNING you have Transparent Huge Pages (THP) support enabled in your kernel. This will create latency and memory usage issues with Redis. To fix this issue run the command 'echo never > /sys/kernel/mm/transparent_hugepage/enabled' as root, and add it to your /etc/rc.local in order to retain the setting after a reboot. Redis must be restarted after THP is disabled.
10869:M 05 Mar 2019 13:33:39.047 * DB loaded from disk: 0.000 seconds
10869:M 05 Mar 2019 13:33:39.047 * Ready to accept connections

```

**退出**：`CTRL+C`

#### 2. 后台启动

(**注意要使用后台启动需要修改`redis.conf`里的`daemonize`改为`yes`**)

```shell
[root@localhost etc]# vim redis.conf 
#主要修改下面这个daemonize
# By default Redis does not run as a daemon. Use 'yes' if you need it.
# Note that Redis will write a pid file in /var/run/redis.pid when daemonized.
# daemonize no 把这个改为yes no代表前台启动 yes代表后台启动
daemonize yes

# The working directory.
#
# The DB will be written inside this directory, with the filename specified
# above using the 'dbfilename' configuration directive.
#
# The Append Only File will also be created inside this directory.
#
# Note that you must specify a directory here, not a file name.
# dir ./  这个是工作区 默认为./ 即上级目录 这里也改一下
dir /usr/local/redis/etc
```

再次启动

```linux
[root@localhost etc]# /usr/local/redis/bin/redis-server /usr/local/redis/etc/redis.conf
```

**验证启动是否成功**：

```linux
[root@localhost etc]#/ps aux|grep redis

root      11012  0.2  0.2 153880  2344 ?        Ssl  13:36   0:00 /usr/local/redis/bin/redis-server 127.0.0.1:6379
root      11126  0.0  0.0 112708   976 pts/2    R+   13:39   0:00 grep --color=auto redis
```

redis启动成功端口号也是默认的6379。

### 5. 使用

#### 1.进入客户端

进入redis客户端

```linux
[root@localhost etc]# /usr/local/redis/bin/redis-cli 
127.0.0.1:6379> 
```

成功进入Redis客户端

随意操作一下：

```shell
127.0.0.1:6379> keys *
(empty list or set)
127.0.0.1:6379> set name illusory
OK
127.0.0.1:6379> keys *
1) "name"
127.0.0.1:6379> get name
"illusory"
127.0.0.1:6379> set age 22
OK
127.0.0.1:6379> get age
"22"
127.0.0.1:6379> quit #退出命令
[root@localhost etc]# 
```

**退出客户端**：`quit`

#### 2.关闭Redis

退出redis服务的三种方法：

*  1.`pkill redis-server`、
* 2.`kill 进程号`、
* 3.`/usr/local/redis/bhi/redis-cli shutdown`

#### 4. dump.rdb文件

由于前面配置文件中配置的是`dir /usr/local/redis/etc`,所以Redis的所有数据都会存储在这个目录

```linux
[root@localhost etc]# ll
total 68
-rw-r--r--. 1 root root    92 Mar  5 13:36 dump.rdb
-rw-r--r--. 1 root root 62174 Mar  5 13:36 redis.conf
```

确实有这个文件。**这个文件删除后Redis中的数据就真的没了**。



## 4. Redis数据类型

Redis一共分5种数据类型：``String`、``Hash`、``List`、``Set`、``ZSet`

### 1. String

```java
设置值：set key value-->set myname illusory   //同一个key多次set会覆盖
获取值：get key  ------>get myname
删除值：del key-------->del myname
```

其他set方法：

`setnx(not exist)`: 如果key不存在就设置值，返回1;存在就不设置，返回0；

```shell
#格式：setnx key value
127.0.0.1:6379> set myname illusory
OK
127.0.0.1:6379> setnx myname cloud   #myname 已经存在了 返回0
(integer) 0
127.0.0.1:6379> get myname  # 值也没有发生变化
"illusory"
```

`setex(expired)`: 设置数据过期时间，数据只存在一段时间

```shell
#格式：setnx key seconds value;
setnx vercode 60 123456； 
#设置key-->vercode有效时间60s，60s内获取值为123456,60s后返回nil（Redis中nil表示空）
```

 ```shell
127.0.0.1:6379> setex vercode 5 123456
OK
127.0.0.1:6379> get vercode #时间没到 还能查询到
"123456"
127.0.0.1:6379> get vercode  #5s到了 数据过期 查询返回nil
(nil)
 ```



`setrange`：替换字符串

```shell
#格式：setrange key offset value
set email 123456789@gmail.com
setrange email 10 qqqqq # 从第10位开始替换(不包括第10位) 后面跟上用来替换的字符串

```

```shell
127.0.0.1:6379> set email 123456789@gmail.com
OK
127.0.0.1:6379> get email
"123456789@qqail.com"
127.0.0.1:6379> setrange email 10 qqqqq
(integer) 19
127.0.0.1:6379> get email
"123456789@qqqqq.com"
```

mset：一次设置多个值

`mset key1 value1 key2 value2 ...keyn valuen`

mget：一次获取多个值

`mget key1 key2 key3...keyn`

```shell
127.0.0.1:6379> mset k1 111 k2 222 k3 333 
OK
127.0.0.1:6379> mget k1 k2 k3
1) "111"
2) "222"
3) "333"

```

`getset`: 返回旧值并设置新值

```shell
#格式 getset key value
getset name cloud #将name设置为cloud并放回name的旧值
```

```shell
127.0.0.1:6379> set name illusory
OK
127.0.0.1:6379> get name
"illusory"
127.0.0.1:6379> getset name cloud
"illusory"
127.0.0.1:6379> get name
"cloud"
```

`incr/decr`:对一个值进行递增或者递减操作。

```shell
# 格式 incr key/decr key
incr age #age递增1
decr age #age递减1
```

```shell
127.0.0.1:6379> get age
"22"
127.0.0.1:6379> incr age #递增
(integer) 23
127.0.0.1:6379> get age
"23"
127.0.0.1:6379> decr age #递减
(integer) 22
127.0.0.1:6379> get age
"22"
```

`incrby/decrby`:对一个值按照一定`步长`进行递增或者递减操作。

```shell
# 格式 incrby key increment/decrby key increment
incrby age 3 #age递增3
decrby age 3 #age递减3
```

```shell
127.0.0.1:6379> get age
"22"
127.0.0.1:6379> incrby age 3
(integer) 25
127.0.0.1:6379> get age
"25"
127.0.0.1:6379> decrby age 3
(integer) 22
127.0.0.1:6379> get age
"22"

```

`append`:字符串追加

```shell
#格式 append key value
append name cloud #在name后追加cloud
```

```shell
127.0.0.1:6379> get name
"illusory"
127.0.0.1:6379> append name cloud
(integer) 13
127.0.0.1:6379> get name
"illusorycloud"
```

`strlen`：获取字符串长度

```shell
#格式 strlen key 
strlen name #获取name对应的value的长度
```

```shell
127.0.0.1:6379> get name
"illusorycloud"
127.0.0.1:6379> strlen name
(integer) 13
```

### 2.Hash

工作中使用最多的就是Hash类型

将一个对象存储在Hash类型里要比String类型里占用的空间少一些，并方便存取整个对象。

`hset`:类似于set，数据都存为Hash类型，类似于存在map中

```shell
# 格式 hset key filed value
hset me name illusory #me是hash名 name是hash中的key illusory为hash中的value 

#类似于Java中的Map
        Map<Object,Object> me = new HashMap<>();
        me.put("name", "illusory");
```

`hget`:类似于get

```shell
# 格式 hget hash filed
hget me name #获取hash名为me的hash中的name对应的value
```

```shell
127.0.0.1:6379> hset me name illusory
(integer) 1
127.0.0.1:6379> hset me age 22
(integer) 1
127.0.0.1:6379> hget me name
"illusory"
127.0.0.1:6379> hget me age
"22"

```

同样也有批量操作的`hmset`、`hmget`

```shell
#格式 hmset key filed1 value1 filde2 value2 ....filedn valuen
#格式 hmget key filed1  filde2....filedn 
```

```shell
127.0.0.1:6379> hmset me name illusory age 22
OK
127.0.0.1:6379> hmget me name age
1) "illusory"
2) "22"

```

`hsetnx(not exist)`: 如果key不存在就设置值，返回1;存在就不设置，返回0；

```shell
#格式 hsetnx value filed value
```

`hincrby/hdecrby`:对一个值按照一定`步长`进行递增或者递减操作。

```shell
# 格式 hincrby key filed increment/hdecrby key filed increment
incrby me age 3 #age递增3
decrby me age 3 #age递减3
```

`hstrlen key filed`:回哈希表 `key` 中， 与给定域 `field` 相关联的值的字符串长度（string length）。

如果给定的键或者域不存在， 那么命令返回 `0` 。



`hexists`:判断是否存在

```shell
#格式 hexists value filed
```

`hlen`:查看hash的filed数

```shell
#格式 hlen key
```

`hdel`:删除指定hash中的filed

```shell
#格式 hdel key filed
```

`hkeys`:返回指定hash中所有的filed

```shell
#格式 hkeys key 
```

`hvals`:返回指定hash中所有的value

```shell
#格式 hvals key 
```

`hgetall`:返回指定hash中所有的filed和value

```shell
#格式 hgetall key
```

```shell
127.0.0.1:6379> hgetall me
1) "name"
2) "illusory"
3) "age"
4) "23"

```

### 3.List

可以看做Java中的List，不过更像Queue。

下表列出了列表相关的基本命令：

| 序号 | 命令及描述                                                   |
| ---- | ------------------------------------------------------------ |
| 1    | [BLPOP key1 [key2 \] timeout](http://www.runoob.com/redis/lists-blpop.html)  移出并获取列表的第一个元素， 如果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止。 |
| 2    | [BRPOP key1 [key2 \] timeout](http://www.runoob.com/redis/lists-brpop.html)  移出并获取列表的最后一个元素， 如果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止。 |
| 3    | [BRPOPLPUSH source destination timeout](http://www.runoob.com/redis/lists-brpoplpush.html)  从列表中弹出一个值，将弹出的元素插入到另外一个列表中并返回它； 如果列表没有元素会阻塞列表直到等待超时或发现可弹出元素为止。 |
| 4    | [LINDEX key index](http://www.runoob.com/redis/lists-lindex.html)  通过索引获取列表中的元素 |
| 5    | [LINSERT key BEFORE\|AFTER pivot value](http://www.runoob.com/redis/lists-linsert.html)  在列表的元素前或者后插入元素 |
| 6    | [LLEN key](http://www.runoob.com/redis/lists-llen.html)  获取列表长度 |
| 7    | [LPOP key](http://www.runoob.com/redis/lists-lpop.html)  移出并获取列表的第一个元素 |
| 8    | [LPUSH key value1 [value2\]](http://www.runoob.com/redis/lists-lpush.html)  将一个或多个值插入到列表头部 |
| 9    | [LPUSHX key value](http://www.runoob.com/redis/lists-lpushx.html)  将一个值插入到已存在的列表头部 |
| 10   | [LRANGE key start stop](http://www.runoob.com/redis/lists-lrange.html)  获取列表指定范围内的元素 |
| 11   | [LREM key count value](http://www.runoob.com/redis/lists-lrem.html)  移除列表元素 |
| 12   | [LSET key index value](http://www.runoob.com/redis/lists-lset.html)  通过索引设置列表元素的值 |
| 13   | [LTRIM key start stop](http://www.runoob.com/redis/lists-ltrim.html)  对一个列表进行修剪(trim)，就是说，让列表只保留指定区间内的元素，不在指定区间之内的元素都将被删除。 |
| 14   | [RPOP key](http://www.runoob.com/redis/lists-rpop.html)  移除列表的最后一个元素，返回值为移除的元素。 |
| 15   | [RPOPLPUSH source destination](http://www.runoob.com/redis/lists-rpoplpush.html)  移除列表的最后一个元素，并将该元素添加到另一个列表并返回 |
| 16   | [RPUSH key value1 [value2\]](http://www.runoob.com/redis/lists-rpush.html)  在列表中添加一个或多个值 |
| 17   | [RPUSHX key value](http://www.runoob.com/redis/lists-rpushx.html)  为已存在的列表添加值 |

### 4.Set

`Set`集合是String类型的`无序`集合，通过hashtable实现的，对集合我们可以取交集，并集，差集。

Java中List的升级版。

下表列出了 Redis 集合基本命令：

| 序号 | 命令及描述                                                   |
| ---- | ------------------------------------------------------------ |
| 1    | [SADD key member1 [member2\]](http://www.runoob.com/redis/sets-sadd.html)  向集合添加一个或多个成员 |
| 2    | [SCARD key](http://www.runoob.com/redis/sets-scard.html)  获取集合的成员数 |
| 3    | [SDIFF key1 [key2\]](http://www.runoob.com/redis/sets-sdiff.html)  返回给定所有集合的差集 |
| 4    | [SDIFFSTORE destination key1 [key2\]](http://www.runoob.com/redis/sets-sdiffstore.html)  返回给定所有集合的差集并存储在 destination 中 |
| 5    | [SINTER key1 [key2\]](http://www.runoob.com/redis/sets-sinter.html)  返回给定所有集合的交集 |
| 6    | [SINTERSTORE destination key1 [key2\]](http://www.runoob.com/redis/sets-sinterstore.html)  返回给定所有集合的交集并存储在 destination 中 |
| 7    | [SISMEMBER key member](http://www.runoob.com/redis/sets-sismember.html)  判断 member 元素是否是集合 key 的成员 |
| 8    | [SMEMBERS key](http://www.runoob.com/redis/sets-smembers.html)  返回集合中的所有成员 |
| 9    | [SMOVE source destination member](http://www.runoob.com/redis/sets-smove.html)  将 member 元素从 source 集合移动到 destination 集合 |
| 10   | [SPOP key](http://www.runoob.com/redis/sets-spop.html)  移除并返回集合中的一个随机元素 |
| 11   | [SRANDMEMBER key [count\]](http://www.runoob.com/redis/sets-srandmember.html)  返回集合中一个或多个随机数 |
| 12   | [SREM key member1 [member2\]](http://www.runoob.com/redis/sets-srem.html)  移除集合中一个或多个成员 |
| 13   | [SUNION key1 [key2\]](http://www.runoob.com/redis/sets-sunion.html)  返回所有给定集合的并集 |
| 14   | [SUNIONSTORE destination key1 [key2\]](http://www.runoob.com/redis/sets-sunionstore.html)  所有给定集合的并集存储在 destination 集合中 |
| 15   | [SSCAN key cursor [MATCH pattern\] [COUNT count]](http://www.runoob.com/redis/sets-sscan.html)  迭代集合中的元素 |

### 5. ZSet

`ZSet`则是`有序`的。

下表列出了 redis 有序集合的基本命令:

| 序号 | 命令及描述                                                   |
| ---- | ------------------------------------------------------------ |
| 1    | [ZADD key score1 member1 [score2 member2\]](http://www.runoob.com/redis/sorted-sets-zadd.html)  向有序集合添加一个或多个成员，或者更新已存在成员的分数 |
| 2    | [ZCARD key](http://www.runoob.com/redis/sorted-sets-zcard.html)  获取有序集合的成员数 |
| 3    | [ZCOUNT key min max](http://www.runoob.com/redis/sorted-sets-zcount.html)  计算在有序集合中指定区间分数的成员数 |
| 4    | [ZINCRBY key increment member](http://www.runoob.com/redis/sorted-sets-zincrby.html)  有序集合中对指定成员的分数加上增量 increment |
| 5    | [ZINTERSTORE destination numkeys key [key ...\]](http://www.runoob.com/redis/sorted-sets-zinterstore.html)  计算给定的一个或多个有序集的交集并将结果集存储在新的有序集合 key 中 |
| 6    | [ZLEXCOUNT key min max](http://www.runoob.com/redis/sorted-sets-zlexcount.html)  在有序集合中计算指定字典区间内成员数量 |
| 7    | [ZRANGE key start stop [WITHSCORES\]](http://www.runoob.com/redis/sorted-sets-zrange.html)  通过索引区间返回有序集合成指定区间内的成员 |
| 8    | [ZRANGEBYLEX key min max [LIMIT offset count\]](http://www.runoob.com/redis/sorted-sets-zrangebylex.html)  通过字典区间返回有序集合的成员 |
| 9    | [ZRANGEBYSCORE key min max [WITHSCORES\] [LIMIT]](http://www.runoob.com/redis/sorted-sets-zrangebyscore.html)  通过分数返回有序集合指定区间内的成员 |
| 10   | [ZRANK key member](http://www.runoob.com/redis/sorted-sets-zrank.html)  返回有序集合中指定成员的索引 |
| 11   | [ZREM key member [member ...\]](http://www.runoob.com/redis/sorted-sets-zrem.html)  移除有序集合中的一个或多个成员 |
| 12   | [ZREMRANGEBYLEX key min max](http://www.runoob.com/redis/sorted-sets-zremrangebylex.html)  移除有序集合中给定的字典区间的所有成员 |
| 13   | [ZREMRANGEBYRANK key start stop](http://www.runoob.com/redis/sorted-sets-zremrangebyrank.html)  移除有序集合中给定的排名区间的所有成员 |
| 14   | [ZREMRANGEBYSCORE key min max](http://www.runoob.com/redis/sorted-sets-zremrangebyscore.html)  移除有序集合中给定的分数区间的所有成员 |
| 15   | [ZREVRANGE key start stop [WITHSCORES\]](http://www.runoob.com/redis/sorted-sets-zrevrange.html)  返回有序集中指定区间内的成员，通过索引，分数从高到底 |
| 16   | [ZREVRANGEBYSCORE key max min [WITHSCORES\]](http://www.runoob.com/redis/sorted-sets-zrevrangebyscore.html)  返回有序集中指定分数区间内的成员，分数从高到低排序 |
| 17   | [ZREVRANK key member](http://www.runoob.com/redis/sorted-sets-zrevrank.html)  返回有序集合中指定成员的排名，有序集成员按分数值递减(从大到小)排序 |
| 18   | [ZSCORE key member](http://www.runoob.com/redis/sorted-sets-zscore.html)  返回有序集中，成员的分数值 |
| 19   | [ZUNIONSTORE destination numkeys key [key ...\]](http://www.runoob.com/redis/sorted-sets-zunionstore.html)  计算给定的一个或多个有序集的并集，并存储在新的 key 中 |
| 20   | [ZSCAN key cursor [MATCH pattern\] [COUNT count]](http://www.runoob.com/redis/sorted-sets-zscan.html)  迭代有序集合中的元素（包括元素成员和元素分值） |







## 参考

`http://www.runoob.com/redis/redis-hashes.html`