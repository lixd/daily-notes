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

应用场景：

```
服务发现和服务注册
配置中心
分布式锁
master选举
```

和ZK类似，ETCD有很多使用场景，包括：

- 配置管理
- 服务注册于发现
- 选主
- 应用调度
- 分布式队列
- 分布式锁

ETCD集群是一个分布式系统，由多个节点相互通信构成整体对外服务，每个节点都存储了完整的数据，并且通过Raft协议保证每个节点维护的数据是一致的。

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

