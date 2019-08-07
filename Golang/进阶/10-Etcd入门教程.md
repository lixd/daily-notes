# Etcd入门教程

## 1. 概述

概念：高可用的分布式key-value存储，可以用于配置共享和服务发现。 

类似项目：zookeeper和consul 

开发语言：Go 

接口：提供restful的http接口，使用简单 

实现算法：基于raft算法的强一致性、高可用的服务存储目录

- 简单：基于HTTP+JSON的API让你用curl命令就可以轻松使用。
- 安全：可选SSL客户认证机制。
- 快速：每个实例每秒支持一千次写操作。
- 可信：使用Raft算法充分实现了分布式。

### 应用场景：

和ZK类似，ETCD有很多使用场景，包括：

* 服务发现和服务注册
* 配置中心
* 分布式锁
* master选举

`ETCD`集群是一个分布式系统，由多个节点相互通信构成整体对外服务，每个节点都存储了完整的数据，并且通过`Raft协议`保证每个节点维护的数据是一致的。

## 2. 安装

### 2.1 直接安装

```go
$ curl -L  https://github.com/coreos/etcd/releases/download/v3.3.13/etcd-v3.3.13-linux-amd64.tar.gz -o etcd-v3.3.13-linux-amd64.tar.gz && 
sudo tar xzvf etcd-v3.3.13-linux-amd64.tar.gz -C /usr/local/etcd && 
cd etcd-v3.3.13-linux-amd64 && 
sudo cp etcd* /usr/local/bin/
//当前最新release版本为3.3.13 
```

其实就是将编译后的二进制文件，拷贝到`/usr/local/bin/`目录，各个版本的二进制文件，可以从 `https://github.com/coreos/etcd/releases/` 中查找下载。

#### 启动

etcd默认监听的是`localhost`的2379端口，既只监听了I/O设备，这样会导致启动后集群中的其他机器无法访问
因此我们可以在启动的时候将默认的localhost改成`0.0.0.0`,确保etcd监听了所有网卡。

```go
./etcd --listen-client-urls="http://0.0.0.0:2379" --advertise-client-urls="http://0.0.0.0:2379"
```

**注意**：etcd有要求，如果--listen-client-urls被设置了，那么就必须同时设置--advertise-client-urls，所以即使设置和默认相同，也必须显式设置

### 测试

我们来使用curl来测试一下，是否可以远程访问，这里我的机器IP是`192.168.1.9`

```go
C:\Users\illusory>curl -L  http://192.168.1.9:2379/version
{"etcdserver":"3.3.13","etcdcluster":"3.3.0"}
```



### 启动参数解释

```shell
--name
etcd集群中的节点名，这里可以随意，可区分且不重复就行  
--listen-peer-urls
监听的用于节点之间通信的url，可监听多个，集群内部将通过这些url进行数据交互(如选举，数据同步等)
--initial-advertise-peer-urls 
建议用于节点之间通信的url，节点间将以该值进行通信。
--listen-client-urls
监听的用于客户端通信的url,同样可以监听多个。
--advertise-client-urls
建议使用的客户端通信url,该值用于etcd代理或etcd成员与etcd节点通信。
--initial-cluster-token etcd-cluster-1
节点的token值，设置该值后集群将生成唯一id,并为每个节点也生成唯一id,当使用相同配置文件再启动一个集群时，只要该token值不一样，etcd集群就不会相互影响。
--initial-cluster
也就是集群中所有的initial-advertise-peer-urls 的合集
--initial-cluster-state new
新建集群的标志


```

### 2.2 Docker安装

```go
docker pull quay.io/coreos/etcd
```

```go
rm -rf /tmp/etcd-data.tmp && mkdir -p /tmp/etcd-data.tmp && \
  docker run \
  -p 2379:2379 \
  -p 2380:2380 \
  --mount type=bind,source=/tmp/etcd-data.tmp,destination=/etcd-data \
  --name etcd-3.3.13 \
  quay.io/coreos/etcd:latest \
  /usr/local/bin/etcd \
  --name s1 \
  --data-dir /etcd-data \
  --listen-client-urls http://0.0.0.0:2379 \
  --advertise-client-urls http://0.0.0.0:2379 \
  --listen-peer-urls http://0.0.0.0:2380 \
  --initial-advertise-peer-urls http://0.0.0.0:2380 \
  --initial-cluster s1=http://0.0.0.0:2380 \
  --initial-cluster-token tkn \
  --initial-cluster-state new
```

## 参考

`https://www.cnblogs.com/chenqionghe/p/10503840.html`

