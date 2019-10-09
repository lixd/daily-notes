# etcd原理分析

## 1. etcd与zookeeper比较

### 1.1 CAP原则

**zookeeper和etcd都是强一致的（满足CAP的CP）**，意味着无论你访问任意节点，都将获得最终一致的数据视图。这里最终一致比较重要，因为zk使用的paxos和etcd使用的raft都是quorum机制（大多数同意原则），所以部分节点可能因为任何原因延迟收到更新，但数据将最终一致，高度可靠。

### 1.2 逻辑结构

**zk从逻辑上来看是一种目录结构，而etcd从逻辑上来看就是一个k-v结构**。但是有意思的是，etcd的key可以是任意字符串，所以仍旧可以模拟出目录，例如：key=/a/b/c，那这是否意味着etcd无法表达父子关系呢？

当然不是，etcd在存储上实现了key有序排列，因此/a/b，/a/b/c，/a/b/d在存储中顺序排列的，通过定位到key=/a/b并依次顺序向后扫描，就会遇到/a/b/c与/a/b/d这两个孩子，从而一样可以实现父子目录关系，所以我们在设计模型与使用etcd时仍旧沿用zookeeper的目录表达方式。

***结论：etcd本质上是一个有序的k-v存储。***

### 1.3 临时节点

在实现服务发现时，我们一般都会用到zk的临时节点，只要客户端与zk之间的session会话没有中断（过期），那么创建的临时节点就会存在。当客户端掉线一段时间，对应的zk session会过期，那么对应的临时节点就会被自动删除。

在etcd中并没有临时节点的概念，但是支持lease租约机制。什么叫lease？其实就是etcd支持申请定时器，比如：可以申请一个TTL=10秒的lease（租约），会返回给你一个lease ID标识定时器。你可以在set一个key的同时携带lease ID，那么就实现了一个自动过期的key。在etcd中，一个lease可以关联给任意多的Key，当lease过期后所有关联的key都将被自动删除。

那么如何实现临时节点呢？首先申请一个TTL=N的lease，然后set一个key with lease作为自己的临时节点，在程序中定时的为lease（租约）进行续约，也就是重置TTL=N，这样关联的key就不会过期了。

### 1.4 事件模型

在我们用zk实现服务发现时，我们一般会`getChildrenAndWatch`来获取一个目录下的所有在线节点，这个API会先获取当前的孩子列表并同时原子注册了一个观察器。每当zk发现孩子有变动的时候，就会发送一个通知事件给客户端（同时关闭观察器），此时我们会再次调用getChildrenAndWatch再次获取最新的孩子列表并重新注册观察器。

简单的来说，zk提供了一个原子API，它先获取当前状态，同时注册一个观察器，当后续变化发生时会发送一次通知到客户端：获取并观察->收到变化事件->获取并观察->收到变化事件->….，如此往复。

zk的事件模型非常可靠，不会出现发生了更新而客户端不知道的情况，但是特点也很明显：

- 事件不包含数据，仅仅是通知变化。
- 多次连续的更新，通知会合并成一个；即，客户端收到通知再次拉取数据，会跳过中间的多个版本，只拿到最新数据。

这些特点并不是缺点，因为一般应用只关注最新状态，并不关注中间的连续变化。

那么etcd的事件模型呢？在现在，你只需要记住etcd的事件是包含数据的，并且通常情况下连续的更新不会被合并通知，而是逐条通知到客户端。

***具体etcd事件模型如何工作，要求对etcd的k-v存储原理先做了解，所以接下来我会结合一些简单的源码，说一下etcd的存储模型，最后再来说它的事件模型。***



## 2. etcd原理分析

### 2.0 名字由来

回到etcd的官方文档，在Reference下看到一个[etcd versus other key-value stores](https://coreos.com/etcd/docs/latest/learning/why.html)目录，发现了etcd的名称由来，原来它是”/etc”和”d” for distributed 的结合体， 它存的也是`大型分布式系统的配置信息`，也就是`distributed “/etc”`

### 2.1. raft协议

- 每次写入都是在一个事务（tx）中完成的。
- 一个事务（tx）可以包含若干put（写入k-v键值对）操作。
- etcd集群有一个leader，写入请求都会提交给它。
- leader先将数据保存成日志形式，并定时的将日志发往其他节点保存。
- 当超过1/2节点成功保存了日志，则leader会将tx最终提交（也是一条日志）。
- 一旦leader提交tx，则会在下一次心跳时将提交记录发送给其他节点，其他节点也会提交。
- leader宕机后，剩余节点协商找到拥有最大已提交tx ID（必须是被超过半数的节点已提交的）的节点作为新leader。

>  具体Raft协议可参考[大神制作的Raft协议动画](http://thesecretlivesofdata.com/raft/)

### 2.2 mvcc多版本

- 每个tx事务有唯一事务ID，在etcd中叫做main ID，全局递增不重复。
- 一个tx可以包含多个修改操作（put和delete），每一个操作叫做一个revision（修订），共享同一个main ID。
- 一个tx内连续的多个修改操作会被从0递增编号，这个编号叫做sub ID。
- 每个revision由（main ID，sub ID）唯一标识。

### 2.3 索引+存储

内存索引+磁盘存储value

在多版本中，每一次操作行为都被单独记录下来，保存到bbolt中。

在bbolt中，每个revision将作为key，即序列化（revision.main+revision.sub）作为key,在bbolt中存储的value是这样一个json序列化后的结构，包括key创建时的revision（对应某一代generation的created），本次更新版本，sub ID（Version ver），Lease ID（租约ID）如下：

```go
	kv := mvccpb.KeyValue{
		Key:            key,
		Value:          value,
		CreateRevision: c,
		ModRevision:    rev,
		Version:        ver,
		Lease:          int64(leaseID),
	}
```



因此，我们先通过内存btree在keyIndex.generations[0].revs中找到最后一条revision，即可去bbolt中读取对应的数据。

相应的，etcd支持按key前缀查询，其实也就是遍历btree的同时根据revision去bbolt中获取用户的value。 

```go
type keyIndex struct {
	key         []byte
	modified    revision // 最后一次修改对应的revision信息。
	generations []generation //记录多版本信息
}

// mvcc多版本
type generation struct {
	ver     int64
	created revision // 引起本次key创建的revision信息
	revs    []revision
}

type revision struct {
	main int64

	sub int64
}
```

内存索引(btree)中存放keyIndex，磁盘中存放对应的多版本数据(序列化（revision.main+revision.sub）作为key)

用户查询时去内存中(btree)中根据key找到对应的keyIndex,在keyIndex中找到最后一次revision信息 然后根据（revision.main+revision.sub）作为key去磁盘查询具体数据.



由于会存储下每个版本的数据，所以多次修改后会产生大量数据，可以使用compact 压缩清理掉太久的数据。compact(n)表示压缩掉revision.main <= n的所有历史版本



多版本总结来说：**内存btree维护的是用户key => keyIndex的映射，keyIndex内维护多版本的revision信息，而revision可以映射到磁盘bbolt中的用户value**。

### 2.4 watch

etcd的事件通知机制是基于mvcc多版本实现的。

客户端可以提供一个要监听的revision.main作为watch的起始ID，只要etcd当前的全局自增事务ID > watch起始ID，etcd就会将MVCC在bbolt中存储的所有历史revision数据，逐一顺序的推送给客户端。

zk只会提示数据有更新，由用户主动拉取最新数据，中间多版本数据无法知道。

etcd会推送每一次修改的数据给用户。



实际是etcd根据mainID去磁盘查数据，磁盘中数据以revision.main+revision.sub为key(bbolt 数据库中的key)，所以就会依次遍历出所有的版本数据。同时判断遍历到的value中的key(etcd中的key)是不是用户watch的，是则推送给用户。



这里每次都会遍历数据库性能可能会很差，实际使用时一般用户只会关注最新的revision，不会去关注旧数据。

同时也不是每个watch都会去遍历一次数据库，将多个watch作为一个watchGroup，一次遍历可以处理多个watch，判断到value中的key属于watchGroup中的某个watch关注的则返回，从而有效减少遍历次数。

## 3. 参考

`https://yuerblog.cc/2017/12/10/principle-about-etcd-v3/`

`http://www.wangjialong.cc/2017/09/27/etcd&zookeeper/#more`

`https://www.cnblogs.com/jasontec/p/9651789.html`

