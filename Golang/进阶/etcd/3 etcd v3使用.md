# Etcd入门教程

## 1. 概述

主要是etcdclientv3的使用。

## 2. 基本操作

### 2.1 连接

```go
	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   []string{"localhost:2379"},
		DialTimeout: 5 * time.Second,
	})
```

要访问etcd第一件事就是创建client，它需要传入一个Config配置，这里传了2个选项：

- Endpoints：etcd的多个节点服务地址，因为我是单点测试，所以只传1个。
- DialTimeout：创建client的首次连接超时，这里传了5秒，如果5秒都没有连接成功就会返回err；值得注意的是，一旦client创建成功，我们就不用再关心后续底层连接的状态了，client内部会重连。

当然，如果上述err != nil，那么一般情况下我们可以选择重试几次，或者退出程序（重启）。

这里重点需要了解一下client到底长什么样：

```go
type Client struct {
    Cluster
    KV
    Lease
    Watcher
    Auth
    Maintenance

    // Username is a user name for authentication.
    Username string
    // Password is a password for authentication.
    Password string
    // contains filtered or unexported fields
}
```

Cluster、KV、Lease…，你会发现它们其实就代表了整个客户端的几大核心功能板块，分别用于：

- Cluster：向集群里增加etcd服务端节点之类，属于管理员操作。
- KV：我们主要使用的功能，即操作K-V。
- Lease：租约相关操作，比如申请一个TTL=10秒的租约。
- Watcher：观察订阅，从而监听最新的数据变化。
- Auth：管理etcd的用户和权限，属于管理员操作。
- Maintenance：维护etcd，比如主动迁移etcd的leader节点，属于管理员操作。

我们需要使用什么功能，就去获取对应的对象即可。

### 2.2 获取KV对象

实际上client.KV是一个interface，提供了关于k-v操作的所有方法：

```go
type KV interface {
	Put(ctx context.Context, key, val string, opts ...OpOption) (*PutResponse, error)

	Get(ctx context.Context, key string, opts ...OpOption) (*GetResponse, error)

	Delete(ctx context.Context, key string, opts ...OpOption) (*DeleteResponse, error)

	Compact(ctx context.Context, rev int64, opts ...CompactOption) (*CompactResponse, error)
	Do(ctx context.Context, op Op) (OpResponse, error)

	Txn(ctx context.Context) Txn
}
```

但是我们并不是直接获取client.KV来使用，而是通过一个方法来获得一个经过装饰的KV实现（内置错误重试机制的高级KV）：

```go
kv := clientv3.NewKV(cli)

func NewKV(c *Client) KV {
	api := &kv{remote: RetryKVClient(c)}
	if c != nil {
		api.callOpts = c.callOpts
	}
	return api
}
// RetryKVClient implements a KVClient.
func RetryKVClient(c *Client) pb.KVClient {
	return &retryKVClient{
		kc:     pb.NewKVClient(c.conn),
		retryf: c.newAuthRetryWrapper(c.newRetryWrapper()),
	}
}
```

接下来，我们将通过kv对象操作etcd中的数据。

#### 1. Put

```go
if putResp, err = kv.Put(ctx, "/illusory/cloud", "hello", clientv3.WithPrevKV()); err != nil {
		fmt.Println(err)
		return
	}
```

第一个参数context经常用golang的同学比较熟悉，很多API利用context实现取消操作，比如希望超过一定时间就让API立即返回，但是通常我们不需要用到。

后面2个参数分别是key和value，还记得etcd是k-v存储引擎么？对于etcd来说，key=/test/a只是一个字符串而已，但是对我们而言却可以模拟出目录层级关系，先继续往下看。

其函数原型如下：

```go
	Put(ctx context.Context, key, val string, opts ...OpOption) (*PutResponse, error)
```

除了我们传递的参数，还支持一个可变参数，主要是传递一些控制项来影响Put的行为，例如可以携带一个lease ID来支持key过期，这个后面再说。

上述Put操作返回的是PutResponse，不同的KV操作对应不同的response结构，这里顺便一提。

```go
type (
	CompactResponse pb.CompactionResponse
	PutResponse     pb.PutResponse
	GetResponse     pb.RangeResponse
	DeleteResponse  pb.DeleteRangeResponse
	TxnResponse     pb.TxnResponse
)
```

你可以通过IDE跳转到PutResponse，详细看看有哪些可用的信息：

```go
type PutResponse struct {
	Header *ResponseHeader `protobuf:"bytes,1,opt,name=header" json:"header,omitempty"`
	// if prev_kv is set in the request, the previous key-value pair will be returned.
	PrevKv *mvccpb.KeyValue `protobuf:"bytes,2,opt,name=prev_kv,json=prevKv" json:"prev_kv,omitempty"`
}
```

Header里保存的主要是本次更新的revision信息，而PrevKv可以返回Put覆盖之前的value是什么（目前是nil，后面会说原因），打印给大家看看：

```go
cluster_id:16331561280905954307 member_id:9359753661018847437 revision:6 raft_term:7
```

记得，我们需要判断err来确定操作是否成功。

我们再Put其他2个key，用于后续演示：

```go
	// 再写一个孩子
	kv.Put(context.TODO(),"/illusory/wind"", "world")

	// 再写一个同前缀的干扰项
	kv.Put(context.TODO(), "/illusoryxxx, "干扰")
```

现在理论上来说，`illusory`目录下有2个孩子：`cloud`与`wind`，而`/illusoryxxx`并不是。

#### 2. Get

我们可以先来读取一下`/illusory/cloud`：

```go
// 用kv获取key
	if putResp, err = kv.Put(con, "/illusory/wind", "world"); err != nil {
		fmt.Println(err)
	} 
```

其函数原型如下：

```go
	Get(ctx context.Context, key string, opts ...OpOption) (*GetResponse, error)
```

和Put类似，函数注释里提示我们可以传递一些控制参数来影响Get的行为，比如：WithFromKey表示读取从参数key开始递增的所有key，而不是读取单个key。

在上面的例子中，我没有传递opOption，所以就是获取key=/test/a的最新版本数据。

这里err并不能反馈出key是否存在（只能反馈出本次操作因为各种原因异常了），我们需要通过GetResponse（实际上是pb.RangeResponse）判断key是否存在：

```go
type RangeResponse struct {
	Header *ResponseHeader `protobuf:"bytes,1,opt,name=header" json:"header,omitempty"`
	Kvs []*mvccpb.KeyValue `protobuf:"bytes,2,rep,name=kvs" json:"kvs,omitempty"`
	More bool `protobuf:"varint,3,opt,name=more,proto3" json:"more,omitempty"`
	Count int64 `protobuf:"varint,4,opt,name=count,proto3" json:"count,omitempty"`
}
```

Kvs字段，保存了本次Get查询到的所有k-v对，因为上述例子只Get了一个单key，所以只需要判断一下len(Kvs)是否==1即可知道是否存在。

而mvccpb.KeyValue在etcd原理分析中有所提及，它就是etcd在bbolt中保存的K-v对象：

```go
type KeyValue struct {
	Key []byte `protobuf:"bytes,1,opt,name=key,proto3" json:"key,omitempty"`
	CreateRevision int64 `protobuf:"varint,2,opt,name=create_revision,json=createRevision,proto3" json:"create_revision,omitempty"`
	ModRevision int64 `protobuf:"varint,3,opt,name=mod_revision,json=modRevision,proto3" json:"mod_revision,omitempty"`
	Value []byte `protobuf:"bytes,5,opt,name=value,proto3" json:"value,omitempty"`
	Lease int64 `protobuf:"varint,6,opt,name=lease,proto3" json:"lease,omitempty"`
}
```

至于RangeResponse.More和Count，当我们使用withLimit()选项进行Get时会发挥作用，相当于翻页查询。

接下来，我们通过一个特别的Get选项，获取`/illusory`目录下的所有孩子：

```go
// 用kv获取Key 获取前缀为/illusory/的 即 /illusory/的所有孩子
	if getResp, err = kv.Get(con, "/illusory/",clientv3.WithPrefix()); err != nil {
		fmt.Println(err)
	} 
```

我们知道etcd是一个有序的k-v存储，因此/test/为前缀的key总是顺序排列在一起。

withPrefix实际上会转化为范围查询，它根据前缀/illusory/生成了一个key range，[“/illusory/”, “/illusory0”)，为什么呢？因为比/大的字符是’0’，所以以/illusory0作为范围的末尾，就可以扫描到所有的/illusory/打头的key了。

在之前，我Put了一个/illusoryxxx干扰项，因为不符合/illusory/前缀（注意末尾的/），所以就不会被这次Get获取到。但是，如果我查询的前缀是/illusory，那么/illusoryxxx也会被扫描到，这就是etcd k-v模型导致的，编程时一定要特别注意。

#### 3. 获取Lease对象

和获取KV对象一样，通过下面代码获取它：

```go
lease := clientv3.NewLease(client)
```



```go
type Lease interface {
	Grant(ctx context.Context, ttl int64) (*LeaseGrantResponse, error)

	Revoke(ctx context.Context, id LeaseID) (*LeaseRevokeResponse, error)

	TimeToLive(ctx context.Context, id LeaseID, opts ...LeaseOption) (*LeaseTimeToLiveResponse, error)

	Leases(ctx context.Context) (*LeaseLeasesResponse, error)

	KeepAlive(ctx context.Context, id LeaseID) (<-chan *LeaseKeepAliveResponse, error)

	KeepAliveOnce(ctx context.Context, id LeaseID) (*LeaseKeepAliveResponse, error)

	Close() error
}
```

Lease提供了几个功能：

- Grant：分配一个租约。
- Revoke：释放一个租约。
- TimeToLive：获取剩余TTL时间。
- Leases：列举所有etcd中的租约。
- KeepAlive：自动定时的续约某个租约。
- KeepAliveOnce：为某个租约续约一次。
- Close：貌似是关闭当前客户端建立的所有租约。

#### 4. Grant与TTL

要想实现key自动过期，首先得创建一个租约，它有10秒的TTL：

```go
grantResp, err := lease.Grant(context.TODO(), 10)
```

grantResp中主要使用到了ID，也就是租约ID：

```go
type LeaseGrantResponse struct {
	*pb.ResponseHeader
	ID    LeaseID
	TTL   int64
	Error string
}
```

接下来，我们用这个租约来Put一个会自动过期的Key：

```go
	// 用client也可以设置key，kv是client的一个结构，因此可以使用其方法
	if putResp, err = kv.Put(context.TODO(), "/illusory/cloud/x", "ok", clientv3.WithLease(leaseResp.ID)); err != nil {
		fmt.Println(err)
	}
```

这里特别需要注意，有一种情况是在Put之前Lease已经过期了，那么这个Put操作会返回error，此时你需要重新分配Lease。

当我们实现服务注册时，需要主动给Lease进行续约，这需要调用`KeepAlive`/`KeepAliveOnce`，

* KeepAlive:自动定时的续约某个租约。 
* KeepAliveOnce:为某个租约续约一次

```go
	// 主动给Lease进行续约
	if keepAliveChan, err := client.KeepAlive(context.TODO(), leaseResp.ID); err != nil { // 有协程来帮自动续租，每秒一次。
		fmt.Println(err)
	}
```

keepResp结构如下：

```go
// LeaseKeepAliveResponse wraps the protobuf message LeaseKeepAliveResponse.
type LeaseKeepAliveResponse struct {
	*pb.ResponseHeader
	ID  LeaseID
	TTL int64
}
```

KeepAlive和Put一样，如果在执行之前Lease就已经过期了，那么需要重新分配Lease。Etcd并没有提供API来实现原子的Put with Lease。

#### 5. Op

Op字面意思就是”操作”，Get和Put都属于Op，只是为了简化用户开发而开放的特殊API。

实际上，KV有一个Do方法接受一个Op：

```go
	// Do applies a single Op on KV without a transaction.
	// Do is useful when creating arbitrary operations to be issued at a
	// later time; the user can range over the operations, calling Do to
	// execute them. Get/Put/Delete, on the other hand, are best suited
	// for when the operation should be issued at the time of declaration.
	Do(ctx context.Context, op Op) (OpResponse, error)
```

其参数Op是一个抽象的操作，可以是Put/Get/Delete…；而OpResponse是一个抽象的结果，可以是PutResponse/GetResponse…

可以通过一些函数来分配Op：

```go
func OpDelete(key string, opts …OpOption) Op
func OpGet(key string, opts …OpOption) Op
func OpPut(key, val string, opts …OpOption) Op
func OpTxn(cmps []Cmp, thenOps []Op, elseOps []Op) Op
```



其实和直接调用KV.Put，KV.GET没什么区别。

下面是一个例子：

```go
// 给key设置新的value并返回设置之前的值
op := clientv3.OpPut("/illusory/cloud", "newKey", clientv3.WithPrevKV())
response, err := kv.Do(context.TODO(), op)
```

把这个op交给Do方法执行，返回的opResp结构如下：

```go
type OpResponse struct {
	put *PutResponse
	get *GetResponse
	del *DeleteResponse
	txn *TxnResponse
}
```

你的操作是什么类型，你就用哪个指针来访问对应的结果，仅此而已。

#### 6. Txn事务

etcd中事务是原子执行的，只支持if … then … else …这种表达，能实现一些有意思的场景。

首先，我们需要开启一个事务，这是通过KV对象的方法实现的：

```go
	// 开启事务
	txn := kv.Txn(context.TODO())
```

我写了如下的测试代码，Then和Else还比较好理解，If是比较陌生的。

```go
	// 如果/illusory/cloud的值为hello则获取/illusory/cloud的值 否则获取/illusory/wind的值
	txnResp, err := txn.If(clientv3.Compare(clientv3.Value("/illusory/cloud"), "=", "hello")).
		Then(clientv3.OpGet("/illusory/cloud")).
		Else(clientv3.OpGet("/illusory/wind", clientv3.WithPrefix())).
		Commit()
```

我们先看下Txn支持的方法：

```go
type Txn interface {
	// If takes a list of comparison. If all comparisons passed in succeed,
	// the operations passed into Then() will be executed. Or the operations
	// passed into Else() will be executed.
	If(cs ...Cmp) Txn

	// Then takes a list of operations. The Ops list will be executed, if the
	// comparisons passed in If() succeed.
	Then(ops ...Op) Txn

	// Else takes a list of operations. The Ops list will be executed, if the
	// comparisons passed in If() fail.
	Else(ops ...Op) Txn

	// Commit tries to commit the transaction.
	Commit() (*TxnResponse, error)
}
```

Txn必须是这样使用的：If(满足条件) Then(执行若干Op) Else(执行若干Op)。

If中支持传入多个Cmp比较条件，如果所有条件满足，则执行Then中的Op（上一节介绍过Op），否则执行Else中的Op。

在我的例子中只传入了1个比较条件：

```go
txn.If(clientv3.Compare(clientv3.Value("/illusory/cloud"), "=", "hello"))
```

`Value(“/illusory/cloud”)`是指`key=/illusory/cloud`对应的`value`，它是条件表达式的”主语”，类型是Cmp：

```go
func Value(key string) Cmp {
	return Cmp{Key: []byte(key), Target: pb.Compare_VALUE}
}
```

这个`Value(“/illusory/cloud”)`返回的Cmp表达了：”/illusory/cloud这个key对应的value”。

接下来，利用Compare函数来继续为”主语”增加描述，形成了一个完整条件语句，即”/illusory/cloud"i这个key对应的value”必须等于”hello”。

Compare函数实际上是对Value返回的Cmp对象进一步修饰，增加了”=”与”hello”两个描述信息：

```go
func Compare(cmp Cmp, result string, v interface{}) Cmp {
	var r pb.Compare_CompareResult

	switch result {
	case "=":
		r = pb.Compare_EQUAL
	case "!=":
		r = pb.Compare_NOT_EQUAL
	case ">":
		r = pb.Compare_GREATER
	case "<":
		r = pb.Compare_LESS
	default:
		panic("Unknown result op")
	}

	cmp.Result = r
	switch cmp.Target {
	case pb.Compare_VALUE:
		val, ok := v.(string)
		if !ok {
			panic("bad compare value")
		}
		cmp.TargetUnion = &pb.Compare_Value{Value: []byte(val)}
	case pb.Compare_VERSION:
		cmp.TargetUnion = &pb.Compare_Version{Version: mustInt64(v)}
	case pb.Compare_CREATE:
		cmp.TargetUnion = &pb.Compare_CreateRevision{CreateRevision: mustInt64(v)}
	case pb.Compare_MOD:
		cmp.TargetUnion = &pb.Compare_ModRevision{ModRevision: mustInt64(v)}
	case pb.Compare_LEASE:
		cmp.TargetUnion = &pb.Compare_Lease{Lease: mustInt64orLeaseID(v)}
	default:
		panic("Unknown compare type")
	}
	return cmp
}
```

Cmp可以用于描述”key=xxx的yyy属性，必须=、!=、<、>，kkk值”，比如：

- key=xxx的value，必须!=，hello。
- key=xxx的create版本号，必须=，11233。
- key=xxx的lease id，必须=，12319231231238。

经过Compare函数修饰的Cmp对象，内部包含了完整的条件信息，传递给If函数即可。

类似于Value的函数用于指定yyy属性，有这么几个方法：

```go
func CreateRevision(key string) Cmp：key=xxx的创建版本必须满足…
func LeaseValue(key string) Cmp：key=xxx的Lease ID必须满足…
func ModRevision(key string) Cmp：key=xxx的最后修改版本必须满足…
func Value(key string) Cmp：key=xxx的创建值必须满足…
func Version(key string) Cmp：key=xxx的累计更新次数必须满足…
```

最后Commit提交整个Txn事务，我们需要判断txnResp获知If条件是否成立：

```go
	if txnResp.Succeeded { // If = true
		fmt.Println("~~~", txnResp.Responses[0].GetResponseRange().Kvs)
	} else { // If =false
		fmt.Println("!!!", txnResp.Responses[0].GetResponseRange().Kvs)
	}
```

Succeed=true表示If条件成立，接下来我们需要获取Then或者Else中的OpResponse列表（因为可以传多个Op），可以看一下txnResp的结构：

```go
type TxnResponse struct {
	Header *ResponseHeader `protobuf:"bytes,1,opt,name=header" json:"header,omitempty"`
	// succeeded is set to true if the compare evaluated to true or false otherwise.
	Succeeded bool `protobuf:"varint,2,opt,name=succeeded,proto3" json:"succeeded,omitempty"`
	// responses is a list of responses corresponding to the results from applying
	// success if succeeded is true or failure if succeeded is false.
	Responses []*ResponseOp `protobuf:"bytes,3,rep,name=responses" json:"responses,omitempty"`
}
```

#### 7. watch

```go
	watch := client.Watch(context.Background(), "maxProcess")
	select {
	case <-watch:
		fmt.Println(client.Get(context.Background(), "maxProcess"))
	}
```



## 3. 遇到的问题

### 3.1 空间不足

```sh
Server register error: etcdserver: mvcc: database space exceeded
```

#### 原因分析

etcd服务未设置自动压缩参数（auto-compact）

etcd 默认不会自动 compact，需要设置启动参数，或者通过命令进行compact，如果变更频繁建议设置，否则会导致空间和内存的浪费以及错误。Etcd v3 的默认的 backend quota 2GB，如果不 compact，boltdb 文件大小超过这个限制后，就会报错：”Error: etcdserver: mvcc: database space exceeded”，导致数据无法写入。

5、整合压缩、碎片整理：

1) 获取当前etcd数据的修订版本(revision)

```sh
rev=$(ETCDCTL_API=3 etcdctl –endpoints=:2379 endpoint status –write-out=”json” | egrep -o ‘”revision”:[0-9]*’ | egrep -o ‘[0-9]*’)
```

2) 整合压缩旧版本数据

```sh
ETCDCTL_API=3 etcdctl compact $rev
```

3) 执行碎片整理

```sh
ETCDCTL_API=3 etcdctl defrag
```

4) 解除告警

```sh
ETCDCTL_API=3 etcdctl alarm disarm
```

5) 备份以及查看备份数据信息

```sh
ETCDCTL_API=3 etcdctl snapshot save backup.db
ETCDCTL_API=3 etcdctl snapshot status backup.db
```



## 4. 参考

`https://yuerblog.cc/2017/12/12/etcd-v3-sdk-usage/`