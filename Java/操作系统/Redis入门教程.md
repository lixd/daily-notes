# Redis入门教程

## NoSQL

* key-value:Redis
* 列存储： Hbase
* 文档; MongoDB
* 图形：Neo4J

## Redis

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





## Redis安装

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