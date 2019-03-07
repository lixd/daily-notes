# Zookeeper入门教程

## 1. 简介

ZooKeeper是一个分布式的，开放源码的分布式应用程序协调服务，是Google的Chubby一个开源的实现，是Hadoop和Hbase的重要组件。它是一个为分布式应用提供一致性服务的软件，提供的功能包括：配置维护、域名服务、分布式同步、组服务等。

ZooKeeper的目标就是封装好复杂易出错的关键服务，将简单易用的接口和性能高效、功能稳定的系统提供给用户。

ZooKeeper包含一个简单的原语集， 提供Java和C的接口。

### 设计目标

- 1.简单的数据结构，Zookeeper就是以简单的树形结构来进行相互协调的
- 2.可以构建集群，只要集群中超过半数的机器能正常工作，整个集群就能正常对外提供服务。
- 3.顺序访问，对于每个客户端的每个请求，zk都会分配一个全局唯一的递增编号，这个编号反应了所有事务操作的先后顺序
- 4.高性能，全量数据保存在内存中，并直接服务于所有的非事务请求

### 服务组成：

ZKServer根据身份特性分为三种

- Leader，负责客户端的write类型请求
- Follower,负责客户端的read类型请求
- Observer，特殊的Follower，可以接受客户端的read氢气球，但不参加选举

### 应用场景：

Hadoop、Storm、消息中间件、RPC服务框架、数据库增量订阅与消费组件(MySQL Binlog)、分布式数据库同步系统、淘宝的Otter。

#### 配置管理

配置的管理在分布式应用环境中很常见，比如我们在平常的应用系统 
中，经常会碰到这样的求：如机器的配置列表、运行时的开关配罝、数据库配罝信 
息等。这些全局配置信息通常具备以下3个特性：
1数据量比较小。
2数据内容在运行时动态发生变化。
3集群中各个集群共享信息，配置一致。

#### 集群管理

Zookeeper不仅能够帮你维护当前的集群中机器的服务状态，而且能 
够帮你选出一个“总管”，让这个总管来管理集群，这就是Zookeeper的另一个功能 
Leader，并实现集群容错功能。
1希望知道当前集群中宄竞有多少机器工作。
2对集群中每天集群的运行时状态进行数据收集。
3对集群中每台集群进行上下线操作。

#### 发布与订阅

Zookeeper是一个典型的发布/订阅模式的分布式数控管理与协调框 
架，开发人员可以使用它来进行分布式数据的发布与订阅。

#### 数据库切换

比如我们初始化zookeeper的时候读取其节点上的数据库配置文件, 
当ES—旦发生变更时，zookeeper就能帮助我们把变更的通知发送到各个客户端， 
每个了互动在接收到这个变更通知后，就可以从新进行最新数据的获取。

#### 分布式日志的收集

我们可以做一个日志系统收集集群中所有的日志信息，进行统 一管理。



zookeeper的特性就是在分布式场景下高可用，但是原生的API实现分布式功能非 
常困难，团队去实现也太浪费时间，即使实现了也未必稳定。那么可以采用第三方的 
客户端的完美实现，比如Curator框架，他是Apache的顶级项目~

### 配置管理

## 2.安装

注：Zookeeper集群最低需要3个节点，所以开3个虚拟机。要求服务器间时间保持一致。

### 下载

官网：`https://mirrors.tuna.tsinghua.edu.cn/apache/zookeeper/`

这里下载的是`zookeeper-3.4.13.tar.gz`

下载后上传到服务器上，习惯放在`/usr/software`目录下

### 解压

将Zookeeper解压到` /usr/local`目录下

```linux
[root@localhost software]# tar -zxvf zookeeper-3.4.13.tar.gz  -C /usr/local/
```

改个名字

```linux
[root@localhost local]# mv zookeeper-3.4.13/ zookeeper
```

### 配置环境变量

```linux
[root@localhost etc]# vim /etc/profile
```

添加如下内容：目录按照自己的目录写

```shell
export ZOOKEEPER_HOME=/usr/local/zookeeper
export PATH=$PATH:$ZOOKEEPER_HOME/bin
```

刷新使其生效

```linux
[root@localhost etc]# source /etc/profile
```

### 修改ZK配置文件

ZooKeeper配置文件在`/usr/local/zookeeper/conf/zoo_sample.cfg`

首先修改一下名字，改成`zoo.cfg`

```linux
[root@localhost conf]# mv zoo_sample.cfg zoo.cfg
```

然后修改配置文件

```linux
[root@localhost conf]# vim zoo.cfg
```

主要修改如下内容：

```shell
# 保存数据的地方
dataDir=/usr/local/zookeeper/data

#文件末尾添加下面这些配置
#server.0 IP 
server.0 192.168.1.111:2888:3888
server.1 192.168.1.112:2888:3888
server.2 192.168.1.113:2888:3888
```

### 配置myid

然后创建一下上面配置的`/usr/local/zookeeper/data`目录

```linux
[root@localhost zookeeper]# mkdir data
```

接着在`/usr/local/zookeeper/data`目录下创建一个叫`myid`的文件

```linux
[root@localhost data]# vim myid
```

分别写入一个数字，和上面配置的`server.0 192.168.1.111:2888:3888`这个对应上。

即

`192.168.1.111`上的`myid`中写入一个数字`0`

`192.168.1.112`上的`myid`中写入一个数字`1`

`192.168.1.113`上的`myid`中写入一个数字`2`

## 3. 使用

### 启动

到这里Zookeeper就算配置完成了,可以启动了。

进入`/usr/local/zookeeper/bin`目录，可以看到里面有很多脚本文件。

```shell
[root@localhost bin]# ls
README.txt  zkCleanup.sh  zkCli.cmd  zkCli.sh  zkEnv.cmd  zkEnv.sh  zkServer.cmd  zkServer.sh  zkTxnLogToolkit.cmd  zkTxnLogToolkit.sh
```

其中` zkServer.sh`就是服务端操作相关脚本，`zkCli.sh`这个就是客户端。

前面配置了环境变量，所以在哪里都可以使用这些脚本，不用非得进到这个文件夹。

启动服务端：

```linux'
[root@localhost bin]# zkServer.sh start
```

查看Zookeeper状态

```linux
[root@localhost data]# zkServer.sh status
ZooKeeper JMX enabled by default
Using config: /usr/local/zookeeper/bin/../conf/zoo.cfg
Mode: leader
```

可以已经启动了，而且这是一个`leader`节点。那么其他两个节点就是`follower`了。

###  操作

可以通过shell操作zookeeper,首先进入客户端

```linux
[root@localhost data]# zkCli.sh
```

windows下的可视化工具ZooInspector

下载地址`https://issues.apache.org/jira/secure/attachment/12436620/ZooInspector.zip`

解压后build目录下有个jar包，cmd命令行中通过命令`java -jar zookeeper-dev-ZooInspector.jar`运行

idea下也有zookeeper插件。



常用操作：

### 查询节点

`ls path`  ZK是一个树形结构 刚创建是跟目录下有个zookeeper节点，zookeeper节点下有个quoat节点

```linux
[zk: localhost:2181(CONNECTED) 0] ls /
[zookeeper]
[zk: localhost:2181(CONNECTED) 2] ls /zookeeper
[quota]
```

### 创建节点

`create path value`  创建节点

```linux
[zk: localhost:2181(CONNECTED) 5] create /illusory redis
Created /illusory
```

### get/set

`get path `获取值

```shell
[zk: localhost:2181(CONNECTED) 6] get /illusory
# 值
redis
# 这个ID就是前面说的那个ID Zk会为所有客户端的每一次操作生成一个全局唯一的ID
cZxid = 0x100000003
# 创建时间
ctime = Thu Mar 07 23:18:12 CST 2019
mZxid = 0x100000003
# 修改时间
mtime = Thu Mar 07 23:18:12 CST 2019
pZxid = 0x100000003
cversion = 0
#数据版本号 每次修改后都会加1
dataVersion = 0
aclVersion = 0
ephemeralOwner = 0x0
dataLength = 5
# 孩子 子节点
numChildren = 0

```

`set path` 设置值

```shell
[zk: localhost:2181(CONNECTED) 7] set /illusory mysql
cZxid = 0x100000003
ctime = Thu Mar 07 23:18:12 CST 2019
mZxid = 0x100000004
mtime = Thu Mar 07 23:24:10 CST 2019
pZxid = 0x100000003
cversion = 0
# 可以看到 改变后也加1了
dataVersion = 1
aclVersion = 0
ephemeralOwner = 0x0
dataLength = 5
numChildren = 0

```

### 删除

`delete path` 只能删除子节点

```shell
[zk: localhost:2181(CONNECTED) 9] create /illusory/cloud nginx
Created /illusory/cloud
[zk: localhost:2181(CONNECTED) 11] ls /illusory
[cloud]
[zk: localhost:2181(CONNECTED) 12] delete /illusory
Node not empty: /illusory
# 删除子节点成功
[zk: localhost:2181(CONNECTED) 13] delete /illusory/cloud
```

`rmr path`  递归删除父节点也可以删除

```shell
[zk: localhost:2181(CONNECTED) 15] ls /illusory
[cloud]
# 递归删除
[zk: localhost:2181(CONNECTED) 16] rmr /illusory
```



所有命令列表

```java
ZooKeeper -server host:port cmd args
	stat path [watch]
	set path data [version]
	ls path [watch]
	delquota [-n|-b] path
	ls2 path [watch]
	setAcl path acl
	setquota -n|-b val path
	history 
	redo cmdno
	printwatches on|off
	delete path [version]
	sync path
	listquota path
	rmr path
	get path [watch]
	create [-s] [-e] path data acl
	addauth scheme auth
	quit 
	getAcl path
	close 
	connect host:port

```

