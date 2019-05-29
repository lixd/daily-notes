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

### 配置详解

```shell
tickTinte： 基本事件服务器之间或客户端与服务器之间维持心跣的时间间隔

dataDiri：存储内存中数据库快照的位置，顾名思义就是Zookeeper保存数据的目录，默认情況下，Zookeeper将写数据的日志文件也保存在这个目录里，

clientPorti：这个端口就是客户端连接Zookeeper服务器的端口，Zookeeper会监听这个雄口，接受客户端的访间请求。

initLimit： 这个配置表示ZooKeeper最大能接受多少个心跳时间间隔，当超过后最大次数后还没收到客户端信息，表明客户端连接失败

syncLiniiti ：这个配置表明Leader和Follower之间发送消息，请求和应答时间长度，最长不能超多多少个tickTinte

server.A = B：C：D
			A：表示这个是第几号服务器，myid中的数字就是这个
			B：这个服务器的IP
			C：与集群中的leader交换信息的端口
			D：集群中的leader挂了，需要一个端口用来进行选举，选出一个新的leader
```



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

**问题**

```java
Error contacting service. It is probably not running.
```

**解决**

1.**可能是防火墙问题，关闭防火墙**

```shell
临时关闭: systemctl stop firewalld
开机禁用(需要重启生效):systemctl disable firewalld
```

2.**myid配置错了，这个必须和配置文件对应上，必须放在配置的那个文件夹下**

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



## 4.原生Api
导包
```xml

        <!--zookeeper-->
        <dependency>
            <groupId>org.apache.zookeeper</groupId>
            <artifactId>zookeeper</artifactId>
            <version>3.5.4-beta</version>
        </dependency>
```

```java
package zookeeper;

import org.apache.zookeeper.AsyncCallback;
import org.apache.zookeeper.CreateMode;
import org.apache.zookeeper.KeeperException;
import org.apache.zookeeper.WatchedEvent;
import org.apache.zookeeper.Watcher;
import org.apache.zookeeper.ZooDefs;
import org.apache.zookeeper.ZooKeeper;
import org.apache.zookeeper.data.Stat;
import org.junit.Before;
import org.junit.Test;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CountDownLatch;

/**
 * @author illusory
 */
public class ZooKeeperBase {
    /**
     * ZooKeeper地址
     */
    static final String CONN_ADDR = "192.168.5.154:2181,192.168.5.155:2181,192.168.5.156:2181";
    /**
     * session超时时间ms
     */
    static final int SESSION_TIMEOUT = 5000;
    /**
     * wait for zk connect
     */
    static final CountDownLatch waitZooKeeperConnOne = new CountDownLatch(1);
    private ZooKeeper zooKeeper;


    @Before
    public void before() throws IOException {
        /**
         * zk客户端
         * 参数1 connectString 连接服务器列表，用逗号分隔
         * 参数2 sessionTimeout 心跳检测时间周期 毫秒
         * 参数3 watcher 事件处理通知器
         * 参数4 canBeReadOnly 标识当前会话是否支持只读
         * 参数5 6 sessionId sessionPassword通过这两个确定唯一一台客户端 目的是提供重复会话
         */
        zooKeeper = new ZooKeeper(CONN_ADDR, SESSION_TIMEOUT, new Watcher() {
            @Override
            public void process(WatchedEvent watchedEvent) {
                //获取事件状态与类型
                Event.KeeperState state = watchedEvent.getState();
                Event.EventType type = watchedEvent.getType();
                //如果是建立连接成功
                if (Event.KeeperState.SyncConnected == state) {
                    //刚连接成功什么都没有所以是None
                    if (Event.EventType.None == type) {
                        //连接成功则发送信号 让程序继续执行
                        waitZooKeeperConnOne.countDown();
                        System.out.println("ZK 连接成功");
                    }
                }
            }
        });
    }

    @Test
    public void testCreate() throws IOException, InterruptedException, KeeperException {
        waitZooKeeperConnOne.await();
        System.out.println("zk start");
        //创建简介
        // 参数1 key
        // 参数2 value  参数3 一般就是ZooDefs.Ids.OPEN_ACL_UNSAFE
        // 参数4 为节点模式 有临时节点(本次会话有效，分布式锁就是基于临时节点)或者持久化节点
        // 返回值就是path 节点已存在则报错NodeExistsException

/**
 * 同步方式
 *
 * 参数1 path 可以看成是key  原生Api不能递归创建 不能在没父节点的情况下创建子节点的，会抛出异常
 *     框架封装也是通过if一层层判断的 如果父节点没有 就先给你创建出来 这样实现的递归创建
 * 参数2 data 可以看成是value 要求是字节数组 也就是说不支持序列化
 *      如果要序列化可以使用一些序列化框架 Hessian Kryo等
 * 参数3 节点权限 使用ZooDefs.Ids.OPEN_ACL_UNSAFE开放权限即可
 *      在权限没有太高要求的场景下 没必要关注
 * 参数4  节点类型 创建节点的类型 提供了多种类型
 *             CreateMode.PERSISTENT     持久节点
 *             CreateMode.PERSISTENT_SEQUENTIAL  持久顺序节点
 *             CreateMode.EPHEMERAL       临时节点
 *             CreateMode.EPHEMERAL_SEQUENTIAL   临时顺序节点
 *             CreateMode.CONTAINER
 *             CreateMode.PERSISTENT_WITH_TTL
 *             CreateMode.PERSISTENT_SEQUENTIAL_WITH_TTL
 */
//        String s = zooKeeper.create("/illusory", "test".getBytes(), ZooDefs.Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT);
        //illusory
//        System.out.println(s);
        //原生Api不能递归创建 不能在没父节点的情况下创建子节点的
        //框架封装也是同过if判断的 如果父节点没有 就先给你创建出来 这样实现的递归创建
//        zooKeeper.create("/illusory/testz/zzz", "testzz".getBytes(), ZooDefs.Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT);
//        System.out.println();
/**
 * 异步方式
 * 在同步基础上多加两个参数
 *
 * 参数5 注册一个回调函数 要实现AsyncCallback.Create2Callback()重写processResult(int rx, String path, Object ctx, String name, Stat stat)方法
 *   processResult参数1  int rx为服务端响应码 0表示调用成功 -4表示端口连接 -110表示指定节点存在 -112表示会话已过期
 *                参数2 String path 节点调用时传入Api的数据节点路径
 *                参数3 Object ctx 调用接口时传入的ctx值
 *                参数4 String name 实际在服务器创建节点的名称
 *                参数5 Stat stat 被创建的那个节点信息
 *
 */
        zooKeeper.create("/illusory/testz/zzz/zzz/aa", "testzz".getBytes(), ZooDefs.Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT
                , (rc, path, ctx, name, stat) -> {
                    System.out.println(stat.getAversion());
                    System.out.println(rc);
                    System.out.println(path);
                    System.out.println(ctx);
                }, "s");

        System.out.println("继续执行");

        Thread.sleep(1000);

        byte[] data = zooKeeper.getData("/illusory", false, null);
        System.out.println(new String(data));

    }

    @Test
    public void testGet() throws KeeperException, InterruptedException {
        waitZooKeeperConnOne.await();
//        zooKeeper.create("/illusory","root".getBytes(),ZooDefs.Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT);
//        zooKeeper.create("/illusory/aaa","aaa".getBytes(),ZooDefs.Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT);
//        zooKeeper.create("/illusory/bbb","aaa".getBytes(),ZooDefs.Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT);
//        zooKeeper.create("/illusory/ccc","aaa".getBytes(),ZooDefs.Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT);
        //不支持递归 只能取下面的一层
        List<String> children = zooKeeper.getChildren("/illusory", false);
        for (String s : children) {
            //拼接绝对路径
            String realPath = "/illusory/" + s;
            byte[] data = zooKeeper.getData(realPath, false, null);
            System.out.println(new String(data));
        }

    }

    @Test
    public void testSet() throws KeeperException, InterruptedException {
        waitZooKeeperConnOne.await();
        zooKeeper.setData("/illusory/aaa", "new AAA".getBytes(), -1);
        zooKeeper.setData("/illusory/bbb", "new BBB".getBytes(), -1);
        zooKeeper.setData("/illusory/ccc", "new CCC".getBytes(), -1);
        testGet();
    }

    @Test
    public void testDelete() throws KeeperException, InterruptedException {
        waitZooKeeperConnOne.await();
        zooKeeper.delete("/illusory/aaa", -1);
        testGet();
    }

    @Test
    public void testExists() throws KeeperException, InterruptedException {
        waitZooKeeperConnOne.await();
        //判断节点是否存在 没有就是null 有的话会返回一长串12884901923,12884901933,1552027900801,1552028204414,1,0,0,0,7,0,12884901923
        Stat exists = zooKeeper.exists("/illusory/bbb", null);
        System.out.println(exists);
    }


}

```

## 5.ZooKeeper分布式锁

**并发相关的锁只能限制当前服务器上只能有一个用户或者线程访问**，但是分布式环境下有多态服务器，并发相关的东西就不管用了，Nginx负载均衡将用户请求
分到多台服务器上，然后每台服务器都可以用一个用户访问加锁的代码，这样又出现了并发问题。
所以需要使用分布式锁，ZooKeeper可以通过依赖于临时节点实现分布式锁。具体如下：
用户不管是访问的那个服务器，在访问并发相关代码时先去ZooKeeper上创建一个临时节点，ZooKeeper使用的ZAB算法保证了同时只能有一个请求能执行，当第一个用户
创建了该节点后，后面的用户发现该节点已经被创建了就需要等待，等前一个用户执行完成后，退出，然后临时节点自动失效，下一个用户又创建一个临时节点继续去
执行。这样就保证了同时只能有一个用户能够访问，不会出现并发问题，其中临时节点有效期为本次会话，退出后自动消失。


例子：
假设有两台服务器 一台8888 一台8889

同时来了两个请求 一个访问8888，一个访问8889
都要去修改数据库中的User表里的ID 为666的用户信息，例如都是把age属性+1 假设当前age为22

没加锁之前：
 用户A查询到age为22 ++后变成23
 用户B也查询到是22  ++后也变成23
 其中这里两个++后应该变成24的，由于没加锁出现了数据异常

 加锁后：
 用户A先在ZooKeeper中创建临时节点 假设为user_666，创建之前会先get一下看有没有这个节点，若存在就等待,若不存在就创建
 此时用户B也来访问，也要创建user_666节点，一get发送已经有了，只能等待了。 
 ZooKeeper保证了同一时间只能有一个请求被执行 即只会创建一个user_666节点，不会出现同时创建了俩个user_666节点的情况。
 同时ZooKeeper创建节点时若已经存在再次创建则会抛出异常。
 最终A和B只有一个人能成功创建节点并修改数据，
 这里假设是A先创建，那么A将age ++后变成23了 然后数据库持久化 8888中的age就是23了 8889中还是22
 然后服务器8888和8889之间执行进行数据同步 同步成功后A关闭会话，临时节点失效.
 现在用户B 创建临时节点user_666 接着去修改数据 此时获取到age=23 ++后变成了24 持久化后 再次进行8888 8889服务期间数据同步。
 这样就不会出现数据异常。

 问题： 1.为什么要用临时节点，创建持久化节点然后执行完后删除不行吗？
​        
       答：临时节点性能高
       
       2.为什么要先get，在创建 直接创建不行吗，反正节点已存在时会抛异常。
       答：get效率要高于create。数据存在内存中的，查询效率是非常高的。


​       
 ## 6.watch、ZK状态、事件类型
 在 ZooKeeper 中，引入了 Watcher 机制来实现这种分布式的通知功能。ZooKeeper 允许客户端向服务端注册一个 Watcher 监听，
 当服务器的一些特定事件触发了这个 Watcher，那么就会向指定客户端发送一个事件通知来实现分布式的通知功能。

 同样，其watcher是监听数据发送了某些变化，那就一定会有对应的事件类型, 
 和状态类型。
 事件类型：（znode节点相关的）
*  EventType.NodeCreated 
*  EventType.NodeDataChanged 
*  EventType.NodeChildrenChanged 
*  EventType.NodeDeleted 
 状态类型：（是跟客户端实例相关的）
*  KeeperState.Oisconnected 
*  KeeperState.SyncConnected 
*  KeeperState.AuthFailed 
*  KeeperState.Expired

ZooKeeper中有很多个节点，客户端也也可以new多个watcher，会开一个新的线程分别监听不同的节点，当监听的节点发送变化后，客户端就可以收到消息。
然后watch可以看成是一个动作，是一次性的，watch一次就只能收到一次监听，节点别修改两次也只能收到第一次的通知。
两种持续监听方案：
​    1.收到变化后将Boolean值手动赋为true，表示下一次还要监听
​    2.再new一个watcher去监听
​    
 测试代码
 ```java

    @Test
    public void testWatch() throws KeeperException, InterruptedException, IOException {
        Watcher watcher = new Watcher() {
            @Override
            public void process(WatchedEvent event) {
                Event.EventType type = event.getType();
                Event.KeeperState state = event.getState();
                String path = event.getPath();
                switch (state) {
                    case SyncConnected:
                        System.out.println("state: SyncConnected");
                        System.out.println("path: " + path);
                        waitZooKeeperConnOne.countDown();
                        break;
                    case Disconnected:
                        System.out.println("state: Disconnected");
                        System.out.println("path: " + path);
                        break;
                    case AuthFailed:
                        System.out.println("state: AuthFailed");
                        System.out.println("path: " + path);
                        break;
                    case Expired:
                        System.out.println("state: Expired");
                        System.out.println("path: " + path);
                        break;
                    default:
                        System.out.println("state: default");
                }
                System.out.println("------------------------");
                switch (type) {
                    case None:
                        System.out.println("type: None");
                        System.out.println("path: " + path);
                        break;
                    case NodeCreated:
                        System.out.println("type: NodeCreated");
                        System.out.println("path: " + path);
                        break;
                    case NodeDataChanged:
                        System.out.println("type: NodeDataChanged");
                        System.out.println("path: " + path);
                        break;
                    case DataWatchRemoved:
                        System.out.println("type: DataWatchRemoved");
                        System.out.println("path: " + path);
                        break;
                    case ChildWatchRemoved:
                        System.out.println("type:child watch被移除");
                        System.out.println("path: " + path);
                        break;
                    case NodeChildrenChanged:
                        System.out.println("type: NodeChildrenChanged");
                        System.out.println("path: " + path);
                        break;
                    case NodeDeleted:
                        System.out.println("type: NodeDeleted");
                        System.out.println("path: " + path);
                        break;
                    default:
                        System.out.println("type: default");
                }
                System.out.println("------------------------");
            }

        };
        String childPath = "/cloud/test5";
        String childPath2 = "/cloud/test6";
        String parentPath = "/cloud";
        //创建时watch一次 1次
        ZooKeeper z = new ZooKeeper(CONN_ADDR, SESSION_TIMEOUT, watcher);
        waitZooKeeperConnOne.await();
        //这里也watch一次 2次
        z.exists(childPath, true);
        z.create(childPath, "cloud".getBytes(), ZooDefs.Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT);
        //watch一下父节点 即/cloud  3次
        z.getChildren(parentPath, true);
        z.create(childPath2, "cloud".getBytes(), ZooDefs.Ids.OPEN_ACL_UNSAFE, CreateMode.PERSISTENT);
        //再watch一次子节点  4次
        z.exists(childPath, true);
        z.setData(childPath, "a".getBytes(), -1);
        Thread.sleep(1000);
    }
 ```


ZooKeeper 的 Watcher 具有以下几个特性。

**一次性 **
无论是服务端还是客户端，一旦一个 Watcher 被触发，ZooKeeper 都会将其从相应的存储中移除。因此，在 Watcher 的使用上，
需要反复注册。这样的设计有效地减轻了服务端的压力。

**客户端串行执行** 
客户端 Watcher 回调的过程是一个串行同步的过程，这为我们保证了顺序，同时，需要注意的一点是，
一定不能因为一个 Watcher 的处理逻辑影响了整个客户端的 Watcher 回调，所以，我觉得客户端 Watcher 
的实现类要另开一个线程进行处理业务逻辑，以便给其他的 Watcher 调用让出时间。

**轻量 **
WatcherEvent 是 ZooKeeper 整个 Watcher 通知机制的最小通知单元，这个数据结构中只包含三部分内容：
通知状态、事件类型和节点路径。也就是说，Watcher 通知非常简单，只会告诉客户端发生了事件，而不会说明事件的具体内容。
例如针对 NodeDataChanged 事件，ZooKeeper 的Watcher 只会通知客户端指定数据节点的数据内容发生了变更，
而对于原始数据以及变更后的新数据都无法从这个事件中直接获取到，而是需要客户端主动重新去获取数据——这也是 ZooKeeper 
的 Watcher 机制的一个非常重要的特性。

 ## ACL权限认证

 首先说明一下为什么需要ACL？
 简单来说 :在通常情况下,zookeeper允许未经授权的访问,因此在安全漏洞扫描中暴漏未授权访问漏洞。
 这在一些监控很严的系统中是不被允许的,所以需要ACL来控制权限.

 既然需要ACL来控制权限,那么Zookeeper的权限有哪些呢?
 权限包括以下几种:

 CREATE: 能创建子节点
 READ：能获取节点数据和列出其子节点
 WRITE: 能设置节点数据
 DELETE: 能删除子节点
 ADMIN: 能设置权限
 说到权限,就要介绍一下zookeeper的认证方式:
 包括以下四种:

 world：默认方式，相当于全世界都能访问
 auth：代表已经认证通过的用户(cli中可以通过addauth digest user:pwd 来添加当前上下文中的授权用户)
 digest：即用户名:密码这种方式认证，这也是业务系统中最常用的
 ip：使用Ip地址认证

```java
   @Test
    public void testAuth() throws KeeperException, InterruptedException, IOException {
        /**
         * 测试路径
         */
        final String Path = "/testAuth";
        final String pathDel = "/testAuth/delNode";
        /**
         * 认证类型
         */
        final String authType = "digest";
        /**
         * 正确的key
         */
        final String rightAuth = "123456";
        /**
         * 错误的key
         */
        final String badAuth = "654321";
        ZooKeeper z1 = new ZooKeeper(CONN_ADDR, SESSION_TIMEOUT, null);
        
        //添加认证信息 类型和key   以后执行操作时必须带上一个相同的key才行
        z1.addAuthInfo(authType, rightAuth.getBytes());
        //把所有的权限放入集合中，这样不管操作什么权限的节点都需要认证才行
        List<ACL> acls = new ArrayList<>(ZooDefs.Ids.CREATOR_ALL_ACL);
        try {
            zooKeeper.create(Path, "xxx".getBytes(), acls, CreateMode.PERSISTENT);
        } catch (Exception e) {
            System.out.println("创建节点，抛出异常： " + e.getMessage());

        }
        ZooKeeper z2 = new ZooKeeper(CONN_ADDR, SESSION_TIMEOUT, null);
        /**
         * 未授权
         */
        try {
            //未授权客户端操作时抛出异常
            //NoAuthException: KeeperErrorCode = NoAuth for /testAuth
            z2.getData(Path, false, new Stat());
        } catch (Exception e) {
            System.out.println("未授权：操作失败，抛出异常： " + e.getMessage());
        }
        /**
         * 错误授权信息
         */
            ZooKeeper z3 = new ZooKeeper(CONN_ADDR, SESSION_TIMEOUT, null);
        try {
            //添加错误授权信息后再次执行
            z3.addAuthInfo(authType, badAuth.getBytes());
            //NoAuthException: KeeperErrorCode = NoAuth for /testAuth
            z3.getData(Path, false, new Stat());
        } catch (Exception e) {
            System.out.println("错误授权信息：操作失败，抛出异常： " + e.getMessage());
        }

        /**
         * 正确授权信息
         */
        ZooKeeper z4 = new ZooKeeper(CONN_ADDR, SESSION_TIMEOUT, null);
        //添加正确授权信息后再次执行
        z4.addAuthInfo(authType, rightAuth.getBytes());
        byte[] data = z4.getData(Path, false, new Stat());
        System.out.println("正确授权信息：再次操作成功获取到数据：" + new String(data));

    }

```

## ZK实际使用场景
我们希望ZooKeeper对分布式系统的配置文件进行管理，也即是多个服务器作为watcher，监听ZooKeeper节点，ZooKeeper节点发生
变化(即配置文件变化)，watcher收到通知，然后实时更新配置文件。
毕竟等服务器多起来时，不可能自己一台一台的去修改配置文件吧。

给多个应用服务器注册watcher，然后去实时观察数据的变化，然后反馈给媒体服务器变更的数据，观察ZooKeeper节点。



## 7. zkClient Api

引入依赖

```xml
        <!--zkClient-->
        <!-- https://mvnrepository.com/artifact/com.101tec/zkclient -->
        <dependency>
            <groupId>com.101tec</groupId>
            <artifactId>zkclient</artifactId>
            <version>0.11</version>
        </dependency>
```

测试代码

```java
/**
 * @author illusoryCloud
 */
public class zkCLientTest {
    /**
     * ZooKeeper地址
     */
//    static final String CONN_ADDR = "192.168.5.154:2181,192.168.5.155:2181,192.168.5.156:2181";
    static final String CONN_ADDR = "192.168.1.111:2181,192.168.1.112:2181,192.168.1.113:2181";
    /**
     * session超时时间ms
     */
    static final int SESSION_TIMEOUT = 5000;
    private ZkClient zkClient;

    @Before
    public void before() {
        zkClient = new ZkClient(new ZkConnection(CONN_ADDR, SESSION_TIMEOUT));
    }

    @After
    public void after() {
        zkClient.close();
    }

    @Test
    public void testOne() {
        zkClient.createEphemeral("/test", true);
        //可以递归创建 只能创建key 不能直接设置value
        zkClient.createPersistent("/super/c1", true);
        zkClient.writeData("/super/c1", "c1");
        String o = zkClient.readData("/super/c1");
        System.out.println(o);
        zkClient.writeData("/super/c1", "新的内容");
        System.out.println(zkClient.exists("/super/c1"));
        System.out.println(zkClient.readData("/super/c1").toString());
    }
}
```

Api中并没有watch，zkClient提供了自己的一套监听机制，剔除了繁琐的watch操作。

```java
 @Test
    public void testWatch() throws InterruptedException {
        //监听/super节点的子节点增加或删除的变化
        zkClient.subscribeChildChanges("/super", new IZkChildListener() {
            @Override
            public void handleChildChange(String parentPath, List<String> childs) throws Exception {
                System.out.println("parent path: " + parentPath);
                System.out.println("childs : " + childs);
            }
        });

        zkClient.createEphemeral("/super/c2", "c2");
        zkClient.createEphemeral("/super/c3", "c3");
        zkClient.createEphemeral("/super/c4", "c4");

        List<String> children = zkClient.getChildren("/super");
        for (String s:children
             ) {
            System.out.println(zkClient.readData("/super/"+s).toString());
        }
        //监听/super节点的数据变化 数据变化和节点被删除都走这个
        zkClient.subscribeDataChanges("/super", new IZkDataListener() {
            @Override
            public void handleDataChange(String path, Object o) throws Exception {
                System.out.println("变更的节点为：" + path + "变更的内容为：" + o);
            }

            @Override
            public void handleDataDeleted(String s) throws Exception {
                System.out.println("删除的节点为：" + s);

            }
        });
        Thread.sleep(1000);
        zkClient.writeData("/super", "new super",-1);
        zkClient.delete("/super/c1");
        zkClient.delete("/super/c2");
        zkClient.delete("/super/c3");
        zkClient.delete("/super/c4");
        zkClient.delete("/super");
  //订阅节点连接及状态的变化情况
        zkClient.subscribeStateChanges(new IZkStateListener() {
            @Override
            public void handleStateChanged(Watcher.Event.KeeperState keeperState) throws Exception {
                System.out.println("节点连接及状态变化：" + keeperState.name());
            }

            @Override
            public void handleNewSession() throws Exception {
                System.out.println("节点Session变化。。。");
            }

            @Override
            public void handleSessionEstablishmentError(Throwable throwable) throws Exception {

            }
        });
    }

```



