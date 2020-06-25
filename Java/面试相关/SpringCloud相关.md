# SpringCloud相关

## Eureka和ZooKeeper

两者都可以提供服务注册与发现的功能,请说说两个的区别

### 1. ZooKeeper保证的是CP,Eureka保证的是AP

*CAP*原则又称*CAP*定理，指的是在一个分布式系统中，Consistency（一致性）、 Availability（可用性）、Partition tolerance（分区容错性），三者不可兼得。 

**ZooKeeper保证一致性与分区容错性，可用性降低。Eureka保证可用性与分区容错性，取而代之的是最终一致性**。

ZooKeeper在选举期间注册服务瘫痪,虽然服务最终会恢复,但是选举期间不可用的
Eureka各个节点是平等关系,只要有一台Eureka就可以保证服务可用,而查询到的数据并不是最新的

自我保护机制会导致

Eureka不再从注册列表移除因长时间没收到心跳而应该过期的服务
Eureka仍然能够接受新服务的注册和查询请求,但是不会被同步到其他节点(高可用)
当网络稳定时,当前实例新的注册信息会被同步到其他节点中(最终一致性)
Eureka可以很好的应对因网络故障导致部分节点失去联系的情况,而不会像ZooKeeper一样使得整个注册系统瘫痪

### 2. ZooKeeper有Leader和Follower角色,Eureka各个节点平等

### 3. ZooKeeper采用过半数存活原则,Eureka采用自我保护机制解决分区问题

### 4. Eureka本质上是一个工程,而ZooKeeper只是一个进程

## 微服务之间是如何独立通讯的

### 1. 同步调用

远程过程调用（Remote Procedure Invocation） 

REST http请求

### 2. 异步调用

消息队列 MQ



