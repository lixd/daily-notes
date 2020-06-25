# etcdv3

## 1. 概述

etcdv3在v2基础上进行了改进和优化：

* 使用 `gRPC`+`protobuf` 取代 HTTP+JSON 通信，提高通信效率；另外通过gRPC gateway 来继续保持对 HTTPJSON 接口的支持。

* 使用更轻 级的基于`租约(lease)`的 key 自动过期机制，取代了基于TTL key 的自动过期机制

* `观察者(watcher)`机制也进行了重新设计。etcd v2 的观察者机制是基于HTTP 长连接的事件驱动机制；而 etcd v3 的观察者机制是基于HTTP/2的server push ，并且对事件进行了多路复用（ multiplexing ）优化。

* etcd v3 的数据模型也发生了较大的改变， `v2` 是一个简单的 key

  value 的`内存数据库`，而 `v3` 则是支持事务和多版本并发控制的`磁盘数据库`。



### 1. gRPC+protobuf

序列化和反序列化速度是v2的两倍多。

gRPC支持HTTP/2,对HTTP 通信进行了多路复用，可以共享一个 TCP 连接，每个客户端只需要和服务器建立一个TCP连接即可，v2版本则每个HTTP请求都要建立一个连接。



### 2. 租约机制

etcd v2 key 的自动过期机制是基于 `TTL` 的：客户端可以为一个 key设置自动过期时间， 一旦 TTL 到了，服务端就会自动删除该 key。 如果客户端不想服务器端删除某个 key ，就需要定期去更新这个 key TTL 。

> 也就是说，即使整个集群都处于 闲状态，也会有很多客户端需要与服务器端进行定期通信以保证某个 key 不被自动删除。而且 TTL 是设置在 key 上的，那么对于客户想保留的 key ，**客户端需要对每个 key 都进行定期更新，即使这些 key过期时间是一样的**。
> 



etcd v3 使用`租约(lease)机制`，替代了 TTL 的自动过期机制 用户可以创建 个租约，然后将这个租约与 key 关联起来 一旦一个租约过期， etcd v3 服务器端就会删除与这个租约关联的所有的 key。

> **如果多个 key的过期时间是一样的，那么这些 key 就可以共享一个租约**。这就大大减小了客户端请求的数量， 对于过期时间相同 ，共享了一个租约的所有 key ，客户端只
需要更新这个租约的过期时间即可 而不是像 etcd v2 样更新所有 key 的过期时间



### 3. 观察者模式

观察者机制使得客户端可以监控一个 key 的变化，**当 key 发生变化时，服务器端将通知客户端**，而不是让客户端定期向服务器端发送请求去轮询 key的变化。
etcd v2 的服务端对每个客户端的每个 watch 请求都维持着一 HTTP 长连接 如果数千个客户端 watch 了数千个 key ，那么 etcd v2 服务器端的 socket 和内存等资源很快就会被耗尽。

etcd v3 的改进方法是对来自于同一个客户端的 watch 请求进行了多路复用(multiplexing) 这样的话，同一个客户端只需要与服务器端维护一个 TCP 连接即可，这就大大减轻了服务器端的压力。



### 4. 数据存储模型

etcd 是一个 key-value 数据库， etcd v2 只保存了 key 的最新的 value ，之前value 直接被覆盖了。

同时 v2 维护了一个全局的 key 的历史记录变更的窗口，默认保存最新的 1000 个变更，整个数据库**全局的历史变更记录**。因此在很短的时间内如果有频繁的写操作的话，那么变更记录会很快超过 1000 ；如果watch 过慢就会无法得到之前的变更，带来的后果就是 **watch 丢失事件**。

etcd v3则通过引入MVCC(多版本并发控制),采用了从历史记录为主索引的存储结构，保存了key的所有历史变更记录。etcd 可以存储上十万个纪录进行快速查询，并且支持根据用户的要求进行压缩合并。

由于etcd v3 实现了 MVCC ，保存了每个 key value pair 的历史版本，数据量大了很多，不能将整个数据库都放在内存里了 因此 etcd v3 摒弃了内存数据库，转为磁盘数据库，整个数据库都存储在磁盘上，底层的存储引擎使用的是BoltDB。

### 5. 迷你事务

etcd v3 引人了迷你事务（ mini transaction ）的概念 每个迷你事务都可以包含一系列的条件语句，只有在还有条件满足时事务才会执行成功。
```go
	// 开启事务
	txn := kv.Txn(context.Background())
	getOwner := clientv3.OpGet(Prefix+Suffix, clientv3.WithFirstCreate()...)
	// 如果/illusory/cloud的值为hello则获取/illusory/cloud的值 否则获取/illusory/wind的值
	txnResp, err := txn.If(clientv3.Compare(clientv3.Value(Prefix+Suffix), "=", "hello")).
		Then(clientv3.OpGet(Prefix+"/equal"), getOwner).
		Else(clientv3.OpGet(Prefix+"/unequal"), getOwner).
		Commit()
	if err != nil {
		return
	}
	if txnResp.Succeeded { // 事务成功
		
	} else {
		
	}
```

### 6. 快照

一致性系统都采用了基于 log 的复制 log 不能无限增长，所以在某一时刻系统需要做完整的快照，并且将快照存储到磁盘中，在存储快照之后才能将之前的 log 丢弃。
> 每次存储完整的快照是一件非常没有效率的事情，但是对于一致性系统来说，设计增量快照以及传输同步大数据都是非常烦琐的。
> 

etcd 通过对 Raft 和存储系统的重构，能够很好地支持增量快照和传输相对较大的快照。目前 etcd 可以存储百万到千万级别的 key。



## 2. gRPC

发送至 etcd v3服务器 每一个API 请求均为 gRPC 过程调用。

根据 etcd v3 所定义的不同服务，其 API 可分为键值 KV 、集群（ Cluster ）、维护（ Ma ntenance）、 认证／鉴权（ Auth ）、观察（ Watch）与租约（ Lease) 6 大类。

KV键值相关API

* KV Service:键值对创建、更新、获取和删除操作。
* Watch Service:用于检测Key的变化。
* Lease Service：用于消耗客户端Keep-Alive消息的原语。



* Cluster Service：集群相关，增删成员、更新配置和获取成员列表。
* Auth Service：可使能或失能某项鉴定过程以及处理鉴定的请求。如增删用户、修改密码、授予用户角色等等。
* Matintenance Service：提供了启动或停止警报以及查询警报的功能。



## 3. KV



### 2. revision

etcd revision ，本质上就是 etcd 维护的一个在集群范围内有效的 64计数器(单调递增)。只要 etcd 的键空间发生变化， revision 的值就会相应地增加。
> 也可以revision 看成是全局的逻辑时钟，即将所有针对后端存储的修改操作进行连续的排序。
> 
对于 etcd 的多版本并发性控制（ multi-version concurrency control, MVCC) 后端而言revision 的价值更是不言而喻。 MVCC 模型是指由于保存了键的历史，因此可以查过去某个 revision （时刻）的 key value 存储。
> 为了实现细粒度的存储管理，集群管理者可自定义配置键空间历史保存策略。

### 3. 键区间
etcd v3 数据模型采用了扁平 key 空间，为所有 key 都建立了索引。

> 该模型有别于其他常见的采用层级系统将 key 组建为目录(directory)的 key-value储系统（即v2)。 key 不再以目录的形式列出，而代之以新的方式一**左闭右开的 key 区间**（interval ），如[Key1,KeyN)。
> 

区间左端的字段为 key ，表示 range 的**非空首 key **，而右端的字段则为range_end ，表示**紧接 range key 的后一个 key**

> 即[1,20)=[1,19]，其中[a,b)在表示了a为前缀的所有key

**key或range_end字段为`\0`则表示所有**

> [a,`\0`)表示该区间包含所有大于a的
>
> [`\0`,`\0`)则代表key
>
> [`\0`,a) 应该没有这种写法





### 4. 事务

etcd v3 中，事务就是一个原子的、针对 key-value 存储操作的 If/Then/Else 结构。

事务提供了一个原语，用于将请求归并到一起放在原子块中（例then/else ），这些原子块的执行条件（例如 if）以 key value 存储里的内容为依据。
事务可以用来保护 key 不受其他并发更新操作的修改，也可构建CAS(Compare And Swap ）操作，并以此作为更高层次（应用层）并发控制的基础。

### 5. Compact调用
Compact 远程调用压缩 etcd 键值存储的事件历史中。 键值存储应该定期压缩，否则事件历史会无限制地持续增长。

```go
	var rev int64 = 10
	// rev:会压缩指定版本之前的记录
	// clientv3.WithCompactPhysical(): RPC 将会等待直 压缩物理性地应用到数据库，之后被压缩的项将完全从后端数据库中移除
	kv.Compact(context.Background(), rev, clientv3.WithCompactPhysical())
```

### 6. Watch

Watch API 提供了 基于事件（ event ）的接口，用于异步监测 key 的变化。

```go
	watchChan := client.Watch(context.Background(),"mykey")
	for wr := range watchChan {
		for _, e := range wr.Events {
			switch e.Type {
			case clientv3.EventTypePut:
				fmt.Printf("watch event put-current: %#v \n", string(e.Kv.Value))
			case clientv3.EventTypeDelete:
				fmt.Printf("watch event delete-current: %#v \n", string(e.Kv.Value))
			default:
			}
		}
	}
```



#### 1. event

对于每个 key 而言，发生的每一个变化都以 Event 消息进行表示。

```protobuf
message Event {
  enum EventType {
    PUT = 0;
    DELETE = 1;
  }

  EventType type = 1;
  KeyValue kv = 2;
  KeyValue prev_kv = 3;
}

```

*  type：Event类型包括PUT和DELETE两种。
* kv：与当前event关联的key-value。
* prev_kv：该 key 在发生此 Event 之前最近一刻 revision key value对。



#### 2. 流式watch

watch 操作是长期持续存在的请求，并且它使用 gRPC 流来传输 Event数据

etcd3 watch 机制确保了监测到的 Event 有有序、可靠与原子化的特点。

* 有序：Event 按照 revision 排序，后发 Event 不会在前面的 Event之前出现在 watch 流中。
* 可靠：某个事件序列不会遗漏其中任意的子序列，假设有 Event,按发生的时间依次排序分别为a<b<c ，而如果 watch 接收到 a和c ，那么就能保证b也已经被接收了。
* 原子性：Event列表确保包含完整的revision,在相同revision的多个key上，更新不会分裂为几个事件列表。



### 7. Lease

租约(Lease)是一种检查客户端活跃度的机制，Lease机制被用于授权进行同步等操作，分布式锁等场景。



#### 1. 获取租约

通过LeaseGrant API获取租约。

```go
type LeaseGrantResponse struct {
	*pb.ResponseHeader
	ID    LeaseID
	TTL   int64
	Error string
}
```

* ID：服务端授予的ID

* TTL：服务端为该Lease选取的time-to-live值，单位是秒



#### 2. KeepAlives

可以通过KeepAlive为Lease续期。



