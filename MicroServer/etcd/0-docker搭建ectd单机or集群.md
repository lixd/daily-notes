# Docker搭建etcd和web监控

## 1. 单节点

### 1. 目录结构

```sh
/usr/local/docker/etcd
					--/data
					--docker-compose.yml
```



### 2. docker-compose.yml

```yml
version: '3'
networks:
  myetcd_single:
services:
  etcd:
    image: quay.io/coreos/etcd
    container_name: etcd_single
    command: etcd -name etcd1 -advertise-client-urls http://0.0.0.0:2379 -listen-client-urls http://0.0.0.0:2379 -listen-peer-urls http://0.0.0.0:2380
    ports:
      - 12379:2379
      - 12380:2380
    volumes:
      - ./data:/etcd-data
    networks:
      - myetcd_single
  etcdkeeper:
    image: deltaprojects/etcdkeeper
    container_name: etcdkeeper_single
    ports:
      - 8088:8080
    networks:
      - myetcd_single
      
```

### 3. 相关参数

| 参数                        | 作用                                                         |
| --------------------------- | ------------------------------------------------------------ |
| name                        | 节点名称                                                     |
| data-dir                    | 指定节点的数据存储目录                                       |
| listen-client-urls          | 对外提供服务的地址：比如 http://ip:2379,http://127.0.0.1:2379 ，客户端会连接到这里和 etcd 交互 |
| `listen-peer-urls`          | 监听URL，用于与其他节点通讯                                  |
| advertise-client-urls       | 对外公告的该节点客户端监听地址，这个值会告诉集群中其他节点   |
| initial-advertise-peer-urls | 该节点同伴监听地址，这个值会告诉集群中其他节点               |
| initial-cluster             | 集群中所有节点的信息，格式为 node1=http://ip1:2380,node2=http://ip2:2380,… 。注意：这里的 node1 是节点的 --name 指定的名字；后面的 ip1:2380 是 --initial-advertise-peer-urls 指定的值 |
| initial-cluster-state       | 新建集群的时候，这个值为 new ；假如已经存在的集群，这个值为 existing |
| initial-cluster-token       | 创建集群的 token，这个值每个集群保持唯一。这样的话，如果你要重新创建集群，即使配置和之前一样，也会再次生成新的集群和节点 uuid；否则会导致多个集群之间的冲突，造成未知的错误 |



### 4. 启动

```sh
docker-compose up
#后台启动增加`-d`参数
docker-compose up -d
```



## 2. 伪集群

### 1. 目录结构

```sh
/usr/local/docker/etcd
					--/data
						--/etcd1
						--/etcd2
						--/etcd3
					--docker-compose.yml
```



### 2. docker-compose.yml

```yml
version: '3'
networks:
  myetcd:

services:
  etcd1:
    image: quay.io/coreos/etcd
    container_name: etcd1
    command: etcd -name etcd1 -advertise-client-urls http://0.0.0.0:2379 -listen-client-urls http://0.0.0.0:2379 -listen-peer-urls http://0.0.0.0:2380 -initial-cluster-token etcd-cluster -initial-cluster "etcd1=http://etcd1:2380,etcd2=http://etcd2:2380,etcd3=http://etcd3:2380" -initial-cluster-state new
    ports:
      - 12379:2379
      - 12380:2380
    volumes:
      - ./data/etcd1:/etcd-data
    networks:
      - myetcd
 
  etcd2:
    image: quay.io/coreos/etcd
    container_name: etcd2
    command: etcd -name etcd2 -advertise-client-urls http://0.0.0.0:2379 -listen-client-urls http://0.0.0.0:2379 -listen-peer-urls http://0.0.0.0:2380 -initial-cluster-token etcd-cluster -initial-cluster "etcd1=http://etcd1:2380,etcd2=http://etcd2:2380,etcd3=http://etcd3:2380" -initial-cluster-state new
    ports:
      - 22379:2379
      - 22380:2380
    volumes:
      - ./data/etcd2:/etcd-data
    networks:
      - myetcd
  
  etcd3:
    image: quay.io/coreos/etcd
    container_name: etcd3
    command: etcd -name etcd3 -advertise-client-urls http://0.0.0.0:2379 -listen-client-urls http://0.0.0.0:2379 -listen-peer-urls http://0.0.0.0:2380 -initial-cluster-token etcd-cluster -initial-cluster "etcd1=http://etcd1:2380,etcd2=http://etcd2:2380,etcd3=http://etcd3:2380" -initial-cluster-state new
    ports:
      - 32379:2379
      - 32380:2380
    volumes:
      - ./data/etcd3:/etcd-data
    networks:
      - myetcd
      
  etcdkeeper:
    image: deltaprojects/etcdkeeper
    container_name: etcdkeeper
    ports:
      - 8088:8080
    networks:
      - myetcd
      

```



### 3. 启动

```sh
docker-compose up
#后台启动增加`-d`参数
docker-compose up -d
```



### 4. 查看集群信息

```sh
[root@localhost etcd3]# curl -L http://127.0.0.1:32379/v2/members

{"members":[{"id":"ade526d28b1f92f7","name":"etcd1","peerURLs":["http://etcd1:2380"],"clientURLs":["http://0.0.0.0:2379"]},{"id":"bd388e7810915853","name":"etcd3","peerURLs":["http://etcd3:2380"],"clientURLs":["http://0.0.0.0:2379"]},{"id":"d282ac2ce600c1ce","name":"etcd2","peerURLs":["http://etcd2:2380"],"clientURLs":["http://0.0.0.0:2379"]}]}
```



## 3. web监控

启动etcd的同时也会启动web监控`etcdkeeper`

访问路径

```sh
localhost:8088
```



> etcdKeeper访问etcd好像是通过外网访问的(也可能是我配置问题)
>
> 如果是线上服务器的话需要配置一下安全组才能访问

