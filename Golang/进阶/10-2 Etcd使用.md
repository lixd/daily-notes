# etcd入门教程

## 1. etcd与zookeeper比较

### 1.1 CAP原则

**zookeeper和etcd都是强一致的（满足CAP的CP）**，意味着无论你访问任意节点，都将获得最终一致的数据视图。这里最终一致比较重要，因为zk使用的paxos和etcd使用的raft都是quorum机制（大多数同意原则），所以部分节点可能因为任何原因延迟收到更新，但数据将最终一致，高度可靠。

### 1.2 逻辑结构

**zk从逻辑上来看是一种目录结构，而etcd从逻辑上来看就是一个k-v结构**。但是有意思的是，etcd的key可以是任意字符串，所以仍旧可以模拟出目录，例如：key=/a/b/c，那这是否意味着etcd无法表达父子关系呢？

当然不是，etcd在存储上实现了key有序排列，因此/a/b，/a/b/c，/a/b/d在存储中顺序排列的，通过定位到key=/a/b并依次顺序向后扫描，就会遇到/a/b/c与/a/b/d这两个孩子，从而一样可以实现父子目录关系，所以我们在设计模型与使用etcd时仍旧沿用zookeeper的目录表达方式。

***在这里，你需要记录一个结论：etcd本质上是一个有序的k-v存储。***

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

### 2.1 raft协议

etcd基于raft协议实现数据同步（K-V数据），集群由多个节点组成，zookeeper基于paxos协议。

raft协议理解起来相比paxos并没有简单到哪里，因为都很难理解。

- 每次写入都是在一个事务（tx）中完成的。
- 一个事务（tx）可以包含若干put（写入k-v键值对）操作。
- etcd集群有一个leader，写入请求都会提交给它。
- leader先将数据保存成日志形式，并定时的将日志发往其他节点保存。
- 当超过1/2节点成功保存了日志，则leader会将tx最终提交（也是一条日志）。
- 一旦leader提交tx，则会在下一次心跳时将提交记录发送给其他节点，其他节点也会提交。
- leader宕机后，剩余节点协商找到拥有最大已提交tx ID（必须是被超过半数的节点已提交的）的节点作为新leader。

这里最重要的是知道：

- raft中，后提交的事务ID>先提交的事务ID，每个事务ID都是唯一的。
- 无论客户端是在哪个etcd节点提交，整个集群对外表现出数据视图最终都是一样的。

### 2.2 k-v存储

etcd根本上来说是一个k-v存储，它在内存中维护了一个btree（B树），就和mysql的索引一样，它是有序的。

在这个btree中，key就是用户传入的原始key，而value并不是用户传入的value，具体是什么后面再说，整个k-v存储大概就是这样：

```go
type treeIndex struct {
	sync.RWMutex
	tree *btree.BTree
}
```

当存储大量的k-v时，因为用户的value一般比较大，全部放在内存btree里内存耗费过大，所以etcd将用户value保存在磁盘中。

简单的说，etcd是纯内存索引，数据在磁盘持久化，这个模型整体来说并不复杂。在磁盘上，etcd使用了一个叫做bbolt的纯K-V存储引擎（可以理解为leveldb），那么bbolt的key和value分别是什么呢？

### 2.3 mvcc多版本

之前说到，etcd在事件模型上与zk完全不同，每次数据变化都会通知，并且通知里携带有变化后的数据内容，这是怎么实现的呢？当然就是多版本了。

如果仅仅维护一个k-v模型，那么连续的更新只能保存最后一个value，历史版本无从追溯，而多版本可以解决这个问题，怎么维护多个版本呢？下面是几条预备知识：

- 每个tx事务有唯一事务ID，在etcd中叫做main ID，全局递增不重复。
- 一个tx可以包含多个修改操作（put和delete），每一个操作叫做一个revision（修订），共享同一个main ID。
- 一个tx内连续的多个修改操作会被从0递增编号，这个编号叫做sub ID。
- 每个revision由（main ID，sub ID）唯一标识。

下面是revision的定义：

```go
// A revision indicates modification of the key-value space.
// The set of changes that share same main revision changes the key-value space atomically.
type revision struct {
	// main is the main revision of a set of changes that happen atomically.
	main int64

	// sub is the the sub revision of a change in a set of changes that happen
	// atomically. Each change has different increasing sub revision in that
	// set.
	sub int64
}
```

在内存索引中，每个用户原始key会关联一个key_index结构，里面维护了多版本信息：

```go
type keyIndex struct {
	key         []byte
	modified    revision // the main rev of the last modification
	generations []generation
}
```

key字段就是用户的原始key，modified字段记录这个key的最后一次修改对应的revision信息。

多版本（历史修改）保存在generations数组中，它的定义：

```go
// generation contains multiple revisions of a key.
type generation struct {
	ver     int64
	created revision // when the generation is created (put in first revision).
	revs    []revision
}
```

我称generations[i]为第i代，当一个key从无到有的时候，generations[0]会被创建，其created字段记录了引起本次key创建的revision信息。

当用户继续更新这个key的时候，generations[0].revs数组会不断追加记录本次的revision信息（main，sub）。

在多版本中，每一次操作行为都被单独记录下来，那么用户value是怎么存储的呢？就是保存到bbolt中。

在bbolt中，每个revision将作为key，即序列化（revision.main+revision.sub）作为key。因此，我们先通过内存btree在keyIndex.generations[0].revs中找到最后一条revision，即可去bbolt中读取对应的数据。

相应的，etcd支持按key前缀查询，其实也就是遍历btree的同时根据revision去bbolt中获取用户的value。

如果我们持续更新同一个key，那么generations[0].revs就会一直变大，这怎么办呢？在多版本中的，一般采用compact来压缩历史版本，即当历史版本到达一定数量时，会删除一些历史版本，只保存最近的一些版本。

下面的是一个keyIndex在compact时，generations数组的变化：

```go
// For example: put(1.0);put(2.0);tombstone(3.0);put(4.0);tombstone(5.0) on key "foo"
// generate a keyIndex:
// key:     "foo"
// rev: 5
// generations:
//    {empty}
//    {4.0, 5.0(t)}
//    {1.0, 2.0, 3.0(t)}
//
// Compact a keyIndex removes the versions with smaller or equal to
// rev except the largest one. If the generation becomes empty
// during compaction, it will be removed. if all the generations get
// removed, the keyIndex should be removed.

// For example:
// compact(2) on the previous example
// generations:
//    {empty}
//    {4.0, 5.0(t)}
//    {2.0, 3.0(t)}
//
// compact(4)
// generations:
//    {empty}
//    {4.0, 5.0(t)}
//
// compact(5):
// generations:
//    {empty} -> key SHOULD be removed.
//
// compact(6):
// generations:
//    {empty} -> key SHOULD be removed.
```

tombstone就是指delete删除key，一旦发生删除就会结束当前的generation，生成新的generation，小括号里的(t)标识tombstone。

compact(n)表示压缩掉revision.main <= n的所有历史版本，会发生一系列的删减操作，可以仔细观察上述流程。

多版本总结来说：内存btree维护的是用户key => keyIndex的映射，keyIndex内维护多版本的revision信息，而revision可以映射到磁盘bbolt中的用户value。

最后，在bbolt中存储的value是这样一个json序列化后的结构，包括key创建时的revision（对应某一代generation的created），本次更新版本，sub ID（Version ver），Lease ID（租约ID）：

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







## 1. 概述

Etcdv3客户端的使用。

