# MVCC

## 1. 概述

etcd v2是一个内存数据库，整个数据库拥有一个Stop-the-World的大锁，通过锁机制来解决并发带来的数据竞争。但是有如下的缺点：

* 1.锁的粒度不好控制，每次都会锁整个数据库
* 2.写锁和读锁相互阻塞。
* 3.前面的事务会阻塞后面的事务，对并发性能影响很大。



于是v3则采用了MVCC，以一种优雅的方式解决了锁带来的问题。

执行写操作或删除操作时不会再原数据上修改而是创建一个新版本。

这样并发的读取操作仍然可以读取老版本的数据，写操作也可以同时进行。

**这个模式的好处在于读操作不再阻塞，事实上根本就不需要锁。**

> 客户端读key的时候指定一个版本号，服务端保证返回比这个版本号更新的数据，但不保证返回最新的数据。



**MVCC能最大化地实现高效地读写并发，尤其是高效地读，非常适合`读多写少`的场景。**



## 2. etcd v2 存储机制

etcd v2 是一个纯内存数据库，写操作先通过 Raft 复制日志文件，复制成功后将数据写人内存。整个数据库在内存中是一个简单的树结构，并未实时地将数据写人磁盘。

持久化是靠快照来实现的，具体实现就是将整个内存中的数据复制一份出来，然后序列化成 JSON ，写入磁盘中，成为一个快照。做快照的时候使用的是复制出来的数据库，客户端的读写请求依旧落在原始的数据库上，这样才能实现做快照的操作才不会阻塞客户端的读写请求。

## 3. etcd v3数据模型
etcd v3 将数据存储在一个多版本的持久化 key-value 存储里面。值得注意的是，作为 key value 存储的 etcd 会将数据存储在另一个 key-value 数据库中。当持久键值存储的值发生变化时，持久化键值存储将保存先前版本的键值对，etcd 后台的键值存储实际上是不可变的， etcd 操作不会就地更新结构，而是始终生成一个更新之后的结构。 发生修改后， key 先前版本的所有值仍然可以访问和 watch 为了防止数据存储随着时间的推移无限期增长，并且为了维护旧版本， etcd 可能 压缩（删除） key 的旧版本数据。
> 每次修改都是复制一份在修改 同时保存了一份数据的多个版本
> 
### 1. 逻辑视图
etcd v3 存储的逻辑视图是 个扁平的二进制键空 该键空间对 key有一个词法排序索引，因此范围查询的成本很低。
etcd 的键空间可维护多个 revision 每个原子的修改操作（例如，一个事务操作可能包含多个操作）都会在键空间上创建一个新的 revision 之前 revision的所有数据均保持不变 旧版本（ version ）的 key 仍然可以通过之前的 revision进行访问。


### 2. 物理视图

etcd 将物理数据存储为一棵持久`B+树`中的键值对。为了高效，每个

revision 存储状态都只包含相对于之前 revision 的增量。 一个 revision 可能对应于树中的多个 key。



B＋树中键值对的 key即revision, revision 元组（ main, sub ），其中main 是该 revision 的主版本号， sub 是同一revision 的副版本号，其用于区分 一个 revision 不同 key。

B＋树按 key 字典字节序进行排序 这样， etcd revision 增量的范围查询（ range query ，即从某个 revision 另一个 revision ）会很快一一因为我们

记录了从一个特定 rev ision revision 的修改量。



etcd v3 还在内存中维护了一个基于 树的二级索引来加快对 key 的范围查询。该B树的 key 是向用户暴露 etcd v3 存储的 key ，而该B树索引的value 则是一个指向上文讨论的持久化 B＋树的增量的指针

### 3. Revision说明


* **Revision **:是etcd集群中的**全局版本号**(可以起到逻辑时钟的作用)，不针对单个key。
* **ModRevision **:是当前key**最后一次修改时的全局Revision**(针对单个key)
* **Version **：是**单个Key**的修改次数(单调递增)



例如：

```sh
#集群启动后revision为0 这是put一个key
etcdctl put firstKey first
#vision如下 此时3个都为1
revision:1
mod_revision:1
version:1
#然后又put了另一个key
etcdctl put secondKey second
#vision如下
#当前全局版本号为2 这个key最后一次修改是全局版本号为2的时候 只修改了1次
revision:2
mod_revision:2
version:1
#再看第一个key的vision
#当前全局版本号为2 这个key最后一次修改是全局版本号为1的时候 只修改了1次
revision:2
mod_revision:1
version:1
```

## 4. etcd MVCC实现

etcd 内部使用BoltDB存储数据。BoltDB 只提供简单的 key value 存储，没有其他的特性，因此 BoltDB 可以做到代码精简(小于3KB。质量高，非常适合以BoltDB 为基础在其之上构建更加复杂的数据库功能。 

### 1. 数据存储

> 由于 BoltDB 的设计适合“读多写少”的场 ，因此其也非常适合于 etcd。

**BoltDB 中存储的 key是`reversion`, value 则是`etcd 自己的 key-value组合`，也就是说 etcd BoltDB 中保存每个版本，从而实现多版本机制。**
例如：

```sh
etcdctl txn <<<'
put key1 "v1" put key2 "v2"
'
```
再次更新这两个key
```sh
etcdctl txn <<<'
put key1 "v11" put key2 "v22"
'
```
那么此时BoltDB中包含了4条数
```sh
rev={3 0},key=key1,value="v1"
rev={3 1},key=key2,value="v2"
rev={4 0},key=key1,value="v11"
rev={4 1},key=key2,value="v22"
```

同一个事务的mainID是相同的，每进行一次操作suIDv会加1。第一次更新`mainID=3 subID=0` 第二次则`mainID=3 subID=1`。

### 2. Compact

不过，这样的实现方式有一个很明显的问题，如果保存所有历史版本会导致数据库越来越大所以etcd提供了删除旧版本数据的方法:`Compact`。

用户可以通过命令行工具即配置选项`手动`或`定时`的压缩老版本数据。

### 3. 查询

BoltDB中查询数据只能通过`reversion`,但是客户端都是通过key来查询的。所以etcd在内存中还维护了一个`kvindex`,保存的就是 key reversion 之前的映射关系，用来加速查询。

kvindex 是基于 Google 开源的 Golang的B树实现的，也就是前文提到etcd v3 在内存中维护的二级索引。

**这样当客户端通 key查询value 的时候， 会先在 `kvindex` 中查询这个 key 的所有 `revision` ，然后再通过revision去BoltDB 查询数据。**



## 5. MVCC源码分析

### 1. revision

```go
type revision struct {
	main int64
	sub int64
}
```

每一个revision 都由( main ID, sub ID)唯一标识，它也是实现 etcd v3的基础。

**同一事务共享maiID,但事务中的每次操作(PUT、DELETE)subID会递增(从0开始)。**



内存索引

```go
type keyIndex struct {
	key         []byte // 
	modified    revision // the main rev of the last modification
	generations []generation
}
```

* key字段为用户原始key

* modified记录了最后一次修改对应的revision

* generations字段则存储了多版本信息

```go
// generation contains multiple revisions of a key.
type generation struct {
	ver     int64
	created revision // when the generation is created (put in first revision).
	revs    []revision
}
```

姑且将 generations[i]称为i代， 当key被首次创建的时候就会创建generations[0]，如果删除了在创建就是generations[1]。

created 段记录了引起 key 创建的 revision 信息。

用户继续更新这个 key 的时候， generations[0] .revs 数组会不断追加记录本次revision 信息(main,sub)

最后，在 bbolt 储的 value 这样 JSON 序列化后的 构，包括key 创建时的 revision （对应于某一代generation created ）、本次更新的版subID(Version ver)、 LeaseID等。

> ver字段是什么？



### 2. key和revision映射关系

etcd中的value是保存到BoltDB中的。在BoltDB中每个revision都将作为key，**将序列化(revision.main+revision.sub)作为key**，同时在内存中维护了kvindex保存key和revision之间的映射关系。



etcd v3中key和revision的映射关系索引表接口如下:

```go
type index interface {
	Get(key []byte, atRev int64) (rev, created revision, ver int64, err error)
	Range(key, end []byte, atRev int64) ([][]byte, []revision)
	Revisions(key, end []byte, atRev int64) []revision
	Put(key []byte, rev revision)
	Tombstone(key []byte, rev revision) error
	RangeSince(key, end []byte, rev int64) []revision
	Compact(rev int64) map[revision]struct{}
	Keep(rev int64) map[revision]struct{}
	Equal(b index) bool

	Insert(ki *keyIndex)
	KeyIndex(ki *keyIndex) *keyIndex
}

type treeIndex struct {
	sync.RWMutex
	tree *btree.BTree
}
```



因此， 我们先通过内存中的B树在` keylndex.generations[0].revs `中找到最后一条revision ，即可去 BoltDB 取与该 key 对应的 最新 value 。

另外 etcd v3 支持按 key 的前缀进行查询的功能，其实也就是在遍历B树(kvindex)的同时根据revision去BoltDB 获取用户的 value。

### 3. 从BoltDB中读取Key的Value值

BoltDB 存储的 key是revision, value 是这样一个JSON序列化后的结构： key、 value 、该 value 在某个 generation 的版本号， 此外还包括创建该

key时 etcd的revision 、本次更新时 etcd的 revision 、租约 ID 等，具体代码如下所示：

```go
type KeyValue struct {
	Key []byte 
	CreateRevision int64 
	ModRevision int64 
	Version int64 
	Value []byte 
	Lease   int64   
}
```

rangeKeys()是对 key 进行范围查询，查询的时候指定一个版本号(curRev ),etcd 则从底层的 BoltDB 中读取比 curRev 更新的数据，主要流程具体如下：

先判断 curRev 数据是否都已经被删除了，(etcd会定期回收旧版本数据) 如果 curRev 小于上一次垃圾 回收的版本号tr. s. compactMainRev ，则直接返回错误。否则就从内存的索引中查询到该 key大于 curRev 的版本号，再去 BoltDB 中读取数据 ，返回给客户端即可。

具体代码如下：

```go
//github.com/coreos/etcd@v3.3.17+incompatible/mvcc/kvstore_txn.go
func (tr *storeTxnRead) rangeKeys(key, end []byte, curRev int64, ro RangeOptions) (*RangeResult, error) {
	rev := ro.Rev
	if rev > curRev {
		return &RangeResult{KVs: nil, Count: -1, Rev: curRev}, ErrFutureRev
	}
	if rev <= 0 {
		rev = curRev
	}
	 // 这里如果当前查询的版本号比compactMainRev小说明这个版本已经被回收了 直接返回错误
	if rev < tr.s.compactMainRev {
		return &RangeResult{KVs: nil, Count: -1, Rev: 0}, ErrCompacted
	}
	// 否则就查询比当前版本号大的所有版本号
	revpairs := tr.s.kvindex.Revisions(key, end, int64(rev))
	if len(revpairs) == 0 {
		return &RangeResult{KVs: nil, Count: 0, Rev: curRev}, nil
	}
	if ro.Count {
		return &RangeResult{KVs: nil, Count: len(revpairs), Rev: curRev}, nil
	}

	limit := int(ro.Limit)
	if limit <= 0 || limit > len(revpairs) {
		limit = len(revpairs)
	}

	kvs := make([]mvccpb.KeyValue, limit)
	revBytes := newRevBytes()
	// 然后根据上面查到的版本号循环去BlotDB中查询value
	for i, revpair := range revpairs[:len(kvs)] {
		revToBytes(revpair, revBytes)
		_, vs := tr.tx.UnsafeRange(keyBucketName, revBytes, nil, 0)
		if len(vs) != 1 {
			plog.Fatalf("range cannot find rev (%d,%d)", revpair.main, revpair.sub)
		}
		if err := kvs[i].Unmarshal(vs[0]); err != nil {
			plog.Fatalf("cannot unmarshal event: %v", err)
		}
	}
	return &RangeResult{KVs: kvs, Count: len(revpairs), Rev: curRev}, nil
}
```

  

### 4. 压缩历史版本

如果我们持续更新 key ，那么 generations[0] .revs 就会一直变大，遇到这种情况该怎么办呢？在多版本中，一般采用`compact`来压缩历史版本，即历史版本达到一定的数 ，会删除一些历史版本 ，只保存最近的一些版本。

官方例子如下：
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
//
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

大概就是：

```go
//首先对同一个key(foo)执行以下5个操作
1.put
2.put
3.delete
4.put
5.delete
//那么此时这个key对应的keyIndex结构如下：
// key: "foo" 原始key
// rev: 5   修改次数
// generations: 历史版本信息
//    {empty}
//    {4.0, 5.0(t)}
//    {1.0, 2.0, 3.0(t)}
5.0(t)和3.0(t) 括号中的t表示该key被删除了
generations以新建开始删除结束，由于删除了两次所以会出现两个，最后删除了没有新建所以第三个还是空的

然后开始压缩
// compact(2) 压缩版本2之前的 即版本1
// generations:
//    {empty}
//    {4.0, 5.0(t)}
//    {2.0, 3.0(t)}
generation[0]里的1.0不见了
// compact(4)压缩4以前的 即1、2、3
// generations:
//    {empty}
//    {4.0, 5.0(t)}
generation[0]为空所以直接被删掉了
// compact(5):
// generations:
//    {empty} -> key SHOULD be removed.
compact(5)压缩后按道理应该是这样的：
// generations:
//    {empty}
//    {5.0(t)}
但是5.0是delete操作 key都没了所以不会被保存 
// compact(6):
// generations:
//    {empty} -> key SHOULD be removed.
这两个压缩后generations都为空了 所以整个key都将remove。

```



### 5. 小结

etcd v3 MVCC 实现的基本原则就是：内存B树维护的是keyIndex,即用户 key到revision的映射，而revision又可以映射到磁盘 bbolt 的用户value中。

```sh
#通过key找到revision 然后根据revision在磁盘中查询对应的value
key-->kvindex-->revision-->bolt-->value
```



## 6. 为什么选择BoltDB

底层的存储引擎一般包含如下三大类的选择：

* SQL Lite等SQL数据库
* LevelDB和RocksDB
* LMDB和BoltDB

其中 SQL Lite 支持 ACID 事务，定位是**提供高效灵活的 SQL 查询语句支持**，可以支持复杂的联表查询等。

Leve IDB RocksDB 分别是 Google、Facebook 开发的存储引擎，其底层实现原理都是 

`log-structured merge-tree(LSM tree)`，特别**适合`写多读少`和`随机写多`的场景**。

LMDB、BoltDB 则是基于B树和 mmap 的数据库，基本原理是用 mmap

将磁盘的 page 映射到内存的 page ，而操作系统则是通过 COW (copy-on-write) 技术进行 page 管理，通过 cow 技术，系统可实现无锁的读写并发，但是无法实现无锁的写写并发，这就注定了这类数据库读性能超高，但写性能一般，因此**非常适合于 `读多写少`的场景**。 **同时 BoltDB 支持完全可序列化的 ACID事务** 因此最适合作为 etcd 的底层存储引擎。