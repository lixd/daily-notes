# Etcd 集群搭建

类似Zookeeper,Etcd官方推荐的集群个数同样为奇数个，当节点为3个和为4个时的容错都是1, 节点5个和6个时，容错为2，即剩余机器大于50%时集群都可以正常运行。

## 1.单机版

### 1.1 直接安装

```go
$ curl -L  https://github.com/coreos/etcd/releases/download/v3.3.13/etcd-v3.3.13-linux-amd64.tar.gz -o etcd-v3.3.13-linux-amd64.tar.gz && 
sudo tar xzvf etcd-v3.3.13-linux-amd64.tar.gz -C /usr/local/etcd && 
cd etcd-v3.3.13-linux-amd64 && 
sudo cp etcd* /usr/local/bin/
//当前最新release版本为3.3.13 
```

其实就是将编译后的二进制文件，拷贝到`/usr/local/bin/`目录，各个版本的二进制文件，可以从 `https://github.com/coreos/etcd/releases/` 中查找下载。

启动

etcd默认监听的是`localhost`的2379端口，既只监听了I/O设备，这样会导致启动后集群中的其他机器无法访问
因此我们可以在启动的时候将默认的localhost改成`0.0.0.0`,确保etcd监听了所有网卡。

```go
./etcd --listen-client-urls="http://0.0.0.0:2379" --advertise-client-urls="http://0.0.0.0:2379"
```

**注意**：etcd有要求，如果--listen-client-urls被设置了，那么就必须同时设置--advertise-client-urls，所以即使设置和默认相同，也必须显式设置



```go
C:\Users\illusory>curl -L  http://192.168.1.9:2379/version
{"etcdserver":"3.3.13","etcdcluster":"3.3.0"}
```

### 1.2 Docker安装

拉取镜像

```sh
docker pull quay.io/coreos/etcd
```

启动

```sh
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

### 3. 测试

我们来使用curl来测试一下，是否可以远程访问，这里我的机器IP是`192.168.1.9`

```sh
C:\Users\illusory>curl -L  http://192.168.1.9:2379/version
{"etcdserver":"3.3.13","etcdcluster":"3.3.0"}
```

### 4. 启动参数解释

* --**name**
  etcd集群中的节点名，这里可以随意，可区分且不重复就行  
* --**listen-peer-urls**
  监听的用于节点之间通信的url，可监听多个，集群内部将通过这些url进行数据交互(如选举，数据同步等)
* --**initial-advertise-peer-urls **
  建议用于节点之间通信的url，节点间将以该值进行通信。
* --**listen-client-urls**
  监听的用于客户端通信的url,同样可以监听多个。
* --**advertise-client-urls**
  建议使用的客户端通信url,该值用于etcd代理或etcd成员与etcd节点通信。
* --**initial-cluster-token etcd-cluster-1**
  节点的token值，设置该值后集群将生成唯一id,并为每个节点也生成唯一id,当使用相同配置文件再启动一个集群时，只要该token值不一样，etcd集群就不会相互影响。
* --**initial-cluster**
  也就是集群中所有的initial-advertise-peer-urls 的合集
* --**initial-cluster-state new**
  新建集群的标志



## 2. 单机伪集群

机器有限，在一台机器配置了3个容器，在机器上创建了子网络，三台容器在一个网络里。

### 1. 拉取镜像

```go
$ docker pull quay.io/coreos/etcd
```

### 2. 编写docker-compsoe文件

`docker-compsoe.yaml`

```yaml
version: '2'
networks:
  etcdnet:

services:
  etcd1:
    image: quay.io/coreos/etcd
    container_name: etcd1
    command: etcd -name etcd1 -advertise-client-urls http://0.0.0.0:2379 -listen-client-urls http://0.0.0.0:2379 -listen-peer-urls http://0.0.0.0:2380 -initial-cluster-token etcd-cluster -initial-cluster "etcd1=http://etcd1:2380,etcd2=http://etcd2:2380,etcd3=http://etcd3:2380" -initial-cluster-state new
    ports:
      - 2379
      - 2380
    networks:
      - etcdnet

  etcd2:
    image: quay.io/coreos/etcd
    container_name: etcd2
    command: etcd -name etcd2 -advertise-client-urls http://0.0.0.0:2379 -listen-client-urls http://0.0.0.0:2379 -listen-peer-urls http://0.0.0.0:2380 -initial-cluster-token etcd-cluster -initial-cluster "etcd1=http://etcd1:2380,etcd2=http://etcd2:2380,etcd3=http://etcd3:2380" -initial-cluster-state new
    ports:
      - 2379
      - 2380
    networks:
      - etcdnet

  etcd3:
    image: quay.io/coreos/etcd
    container_name: etcd3
    command: etcd -name etcd3 -advertise-client-urls http://0.0.0.0:2379 -listen-client-urls http://0.0.0.0:2379 -listen-peer-urls http://0.0.0.0:2380 -initial-cluster-token etcd-cluster -initial-cluster "etcd1=http://etcd1:2380,etcd2=http://etcd2:2380,etcd3=http://etcd3:2380" -initial-cluster-state new
    ports:
      - 2379
      - 2380
    networks:
      - etcdnet
```



```sh
version: '2'
networks:
  etcdnet:

services:
  etcd1:
    image: quay.io/coreos/etcd
    container_name: etcd1
    command: etcd -name etcd1 -advertise-client-urls http://127.0.0.1:2379 -listen-client-urls http://127.0.0.1:2379 -listen-peer-urls http://127.0.0.1:2380 -initial-cluster-token etcd-cluster -initial-cluster "etcd1=http://etcd1:2380,etcd2=http://etcd2:2380,etcd3=http://etcd3:2380" -initial-cluster-state new
    ports:
      - 2379
      - 2380
    networks:
      - etcdnet

  etcd2:
    image: quay.io/coreos/etcd
    container_name: etcd2
    command: etcd -name etcd2 -advertise-client-urls http://127.0.0.1:2379 -listen-client-urls http://127.0.0.1:2379 -listen-peer-urls http://127.0.0.1:2380 -initial-cluster-token etcd-cluster -initial-cluster "etcd1=http://etcd1:2380,etcd2=http://etcd2:2380,etcd3=http://etcd3:2380" -initial-cluster-state new
    ports:
      - 2379
      - 2380
    networks:
      - etcdnet

  etcd3:
    image: quay.io/coreos/etcd
    container_name: etcd3
    command: etcd -name etcd3 -advertise-client-urls http://127.0.0.1:2379 -listen-client-urls http://127.0.0.1:2379 -listen-peer-urls http://127.0.0.1:2380 -initial-cluster-token etcd-cluster -initial-cluster "etcd1=http://etcd1:2380,etcd2=http://etcd2:2380,etcd3=http://etcd3:2380" -initial-cluster-state new
    ports:
      - 2379
      - 2380
    networks:
      - etcdnet
```



### 3. 启动

```sh
docker-compose up
```

下面是一些常用配置选项的说明：

* --name：方便理解的节点名称，默认为 default，在集群中应该保持唯一
* --data-dir：服务运行数据保存的路径，默认为 ${name}.etcd
* --snapshot-count：指定有多少事务（transaction）被提交时，触发截取快照保存到磁盘
* --heartbeat-interval：leader 多久发送一次心跳到 followers。默认值是 100ms
* --eletion-timeout：重新投票的超时时间，如果follower在该时间间隔没有收到心跳包，会触发重新投票，默认为 1000 ms
* --listen-peer-urls：和同伴通信的地址，比如 http://ip:2380，如果有多个，使用逗号分隔。需要所有节点都能够访问，所以不要使用 localhost
* --advertise-client-urls：对外公告的该节点客户端监听地址，这个值会告诉集群中其他节点
* --listen-client-urls：对外提供服务的地址：比如 http://ip:2379,http://127.0.0.1:2379，客户端会连接到这里和etcd交互
* --initial-advertise-peer-urls：该节点同伴监听地址，这个值会告诉集群中其他节点
* --initial-cluster：集群中所有节点的信息，格式为 node1=http://ip1:2380,node2=http://ip2:2380,…。需要注意的是，这里的 node1 是节点的--name指定的名字；后面的ip1:2380 是--initial-advertise-peer-urls 指定的值
* --initial-cluster-state：新建集群的时候，这个值为 new；假如已经存在的集群，这个值为existing
* --initial-cluster-token：创建集群的token，这个值每个集群保持唯一。这样的话，如果你要重新创建集群，即使配置和之前一样，也会再次生成新的集群和节点 uuid；否则会导致多个集群之间的冲突，造成未知的错误

> 所有以--init开头的配置都是在第一次启动etcd集群的时候才会用到，后续节点的重启会被忽略，如--initial-cluseter参数。所以当成功初始化了一个etcd集群以后，就不再需要这个参数或环境变量了。

　如果服务已经运行过就要把修改 --initial-cluster-state 为existing

### 4. 验证集群的状态

验证从三个node返回的v2/members数据是一样的值。

```
$ docker ps
CONTAINER ID        IMAGE                 COMMAND                  CREATED             STATUS              PORTS                                              NAMES
33785a959d95        quay.io/coreos/etcd   "etcd -name etcd1 ..."   2 hours ago         Up 2 hours          0.0.0.0:32791->2379/tcp, 0.0.0.0:32790->2380/tcp   etcd1
106ba12b1c25        quay.io/coreos/etcd   "etcd -name etcd2 ..."   2 hours ago         Up 2 hours          0.0.0.0:32789->2379/tcp, 0.0.0.0:32788->2380/tcp   etcd2
76cd127439a3        quay.io/coreos/etcd   "etcd -name etcd3 ..."   2 hours ago         Up 2 hours          0.0.0.0:32787->2379/tcp, 0.0.0.0:32786->2380/tcp   etcd3

$ curl -L http://127.0.0.1:32787/v2/members
{"members":[{"id":"ade526d28b1f92f7","name":"etcd1","peerURLs":["http://etcd1:2380"],"clientURLs":["http://0.0.0.0:2379"]},{"id":"bd388e7810915853","name":"etcd3","peerURLs":["http://etcd3:2380"],"clientURLs":["http://0.0.0.0:2379"]},{"id":"d282ac2ce600c1ce","name":"etcd2","peerURLs":["http://etcd2:2380"],"clientURLs":["http://0.0.0.0:2379"]}]}

$ curl -L http://127.0.0.1:32789/v2/members
{"members":[{"id":"ade526d28b1f92f7","name":"etcd1","peerURLs":["http://etcd1:2380"],"clientURLs":["http://0.0.0.0:2379"]},{"id":"bd388e7810915853","name":"etcd3","peerURLs":["http://etcd3:2380"],"clientURLs":["http://0.0.0.0:2379"]},{"id":"d282ac2ce600c1ce","name":"etcd2","peerURLs":["http://etcd2:2380"],"clientURLs":["http://0.0.0.0:2379"]}]}

$ curl -L http://127.0.0.1:32791/v2/members
{"members":[{"id":"ade526d28b1f92f7","name":"etcd1","peerURLs":["http://etcd1:2380"]
```

也可以用命令行工具etcdctl：

```
$ docker exec -t etcd1 etcdctl member list
ade526d28b1f92f7: name=etcd1 peerURLs=http://etcd1:2380 clientURLs=http://0.0.0.0:2379 isLeader=false
bd388e7810915853: name=etcd3 peerURLs=http://etcd3:2380 clientURLs=http://0.0.0.0:2379 isLeader=false
d282ac2ce600c1ce: name=etcd2 peerURLs=http://etcd2:2380 clientURLs=http://0.0.0.0:2379 isLeader=true

$ docker exec -t etcd3 etcdctl -C http://etcd1:2379,http://etcd2:2379,http://etcd3:2379 member list
ade526d28b1f92f7: name=etcd1 peerURLs=http://etcd1:2380 clientURLs=http://0.0.0.0:2379 isLeader=false
bd388e7810915853: name=etcd3 peerURLs=http://etcd3:2380 clientURLs=http://0.0.0.0:2379 isLeader=false
d282ac2ce600c1ce: name=etcd2 peerURLs=http://etcd2:2380 clientURLs=http://0.0.0.0:2379 isLead
```

### 5.问题

最开始的时候只能本地访问无法远程访问，很奇怪 然后重启docker之后就行了。。。

## 3. 多机集群

//FIXME 单节点添加到集群有点问题。。暂时先用单机伪集群了。

### 3.1 下载

分别在三台服务器上下载etcd。

```sh
ETCD_VER=v3.4.0-rc.2

# choose either URL
GOOGLE_URL=https://storage.googleapis.com/etcd
GITHUB_URL=https://github.com/etcd-io/etcd/releases/download
DOWNLOAD_URL=${GITHUB_URL}

rm -f /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz
rm -rf /tmp/etcd-download-test && mkdir -p /tmp/etcd-download-test

curl -L ${DOWNLOAD_URL}/${ETCD_VER}/etcd-${ETCD_VER}-linux-amd64.tar.gz -o /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz
tar xzvf /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz -C /tmp/etcd-download-test --strip-components=1
rm -f /tmp/etcd-${ETCD_VER}-linux-amd64.tar.gz

/tmp/etcd-download-test/etcd --version
/tmp/etcd-download-test/etcdctl version
```

### 3.2 拉取镜像

```sh
$ docker pull quay.io/coreos/etcd
```

### 3.3 启动各个节点

```sh
192.168.1.9
192.168.1.10
192.168.1.11
```



节点`192.168.1.9` docker-compose文件

```yaml
version: '2'
services:
  etcd:
    container_name: etcd_node1
    image: quay.io/coreos/etcd
    network_mode: "host"
    ports:
      - "2379:2379"
      - "2380:2380"
    environment:
      - TZ=CST-8
      - LANG=zh_CN.UTF-8
    command:
      /usr/local/bin/etcd
      -name etcd_node1
      -data-dir /etcd-data
      -advertise-client-urls http://192.168.1.9:2379
      -listen-client-urls http://192.168.1.9:2379,http://127.0.0.1:2379
      -initial-advertise-peer-urls http://192.168.1.9:2380
      -listen-peer-urls http://192.168.1.9:2380
      -initial-cluster-token myetcd
      -initial-cluster-state new
    volumes:
      - "/usr/local/docker/etcdd/data:/etcd-data"
```

启动该节点

```sh
docker-compose up
```

添加到集群 这里出错emmm

```sh
ETCDCTL_API=3 etcdctl member add etcd-node2 http://192.168.1.10:2380
```



节点`192.168.1.10` docker-compose文件

```yaml
version: '2'
services:
  etcd:
    container_name: etcd_node2
    image: quay.io/coreos/etcd
    network_mode: "host"
    ports:
      - "2379:2379"
      - "2380:2380"
    environment:
      - TZ=CST-8
      - LANG=zh_CN.UTF-8
    command:
      /usr/local/bin/etcd
      -name etcd_node2
      -data-dir /etcd-data
      -advertise-client-urls http://192.168.1.10:2379
      -listen-client-urls http://192.168.1.10:2379,http://127.0.0.1:2379
      -initial-advertise-peer-urls http://192.168.1.10:2380
      -listen-peer-urls http://192.168.1.10:2380
      -initial-cluster-token myetcd
      -initial-cluster-state new
    volumes:
      - "/usr/local/docker/etcdd/data:/etcd-data"
```

启动该节点

```sh
docker-compose up
```



节点`192.168.1.11` docker-compose文件

```yaml
version: '2'
services:
  etcd:
    container_name: etcd_node3
    image: quay.io/coreos/etcd
    network_mode: "host"
    ports:
      - "2379:2379"
      - "2380:2380"
    environment:
      - TZ=CST-8
      - LANG=zh_CN.UTF-8
    command:
      /usr/local/bin/etcd
      -name etcd-node3
      -data-dir /etcd-data
      -advertise-client-urls http://192.168.1.11:2379
      -listen-client-urls http://192.168.1.11:2379,http://127.0.0.1:2379
      -initial-advertise-peer-urls http://192.168.1.11:2380
      -listen-peer-urls http://192.168.1.11:2380
      -initial-cluster-token myetcd
      -initial-cluster-state new
    volumes:
      - "/usr/local/docker/etcdd/data:/etcd-data"
```

启动该节点

```sh
docker-compose up
```

