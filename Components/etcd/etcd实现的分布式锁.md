# etcd分布式锁





```go
package lock

import "fmt"

// etcd v3分布式锁实现

type Session struct {
	client *v3.Client
	opts   *sessionOptions
	id     v3.LeaseID

	cancel context.CancelFunc
	donec  <-chan struct{}
}

// Mutex implements the sync Locker interface with etcd
type Mutex struct {
	s *Session //上面的Session struct

	pfx   string //前缀
	myKey string //key
	myRev int64  //Revision
	hdr   *pb.ResponseHeader
}

func NewMutex(s *Session, pfx string) *Mutex {
	return &Mutex{s, pfx + "/", "", -1, nil}
}

// Lock locks the mutex with a cancelable context. If the context is canceled
// while trying to acquire the lock, the mutex tries to clean its stale lock entry.
func (m *Mutex) Lock(ctx context.Context) error {
	s := m.s //上面的Session struct
	client := m.s.Client()

	//m.pfx是前缀，比如"/mylock/"
	//s.Lease()是一个64位的整数值，etcd v3引入了lease（租约）的概念，concurrency包基于lease封装了session，
	//每一个客户端都有自己的lease，也就是说每个客户端都有一个唯一的64位整形值
	//m.myKey类似于"/mylock/12345"
	m.myKey = fmt.Sprintf("%s%x", m.pfx, s.Lease())

	// 这里用到了事务

	//接下来的这部分实现了如果不存在这个key，则将这个key写入到etcd，如果存在则读取这个key的值这样的功能。
	//下面这一句，是构建了一个compare的条件，比较的是key的createRevision(createRevision是表示这个key创建时被分配的这个序号,当key不存在时，createRevision是0。)
	cmp := v3.Compare(v3.CreateRevision(m.myKey), "=", 0)
	// 设置值
	put := v3.OpPut(m.myKey, "", v3.WithLease(s.Lease()))
	// 获取值
	get := v3.OpGet(m.myKey)
	// 获取锁的拥有者
	getOwner := v3.OpGet(m.pfx, v3.WithFirstCreate()...)
	// 如果revision为0(即当前key不存在 说明没有其他人获取锁)，则存入(自己获取锁)，否则获取(用于后续的监听)
	resp, err := client.Txn(ctx).If(cmp).Then(put, getOwner).Else(get, getOwner).Commit()
	if err != nil {
		return err
	}
	// 本次操作的revision
	m.myRev = resp.Header.Revision
	// 操作失败，则获取else返回的值，即已有的revision
	if !resp.Succeeded {
		// Responses[0] 为上面事务中Then操作或Else操作的第一个返回值
		// 这里是事务失败了所以是Else操作的第一个返回值
		m.myRev = resp.Responses[0].GetResponseRange().Kvs[0].CreateRevision
	}
	// Responses[1]则为第二个返回值 Then操作或Else操作第二个值都是getOwner所以不用判断直接取
	// 这里会返回这个key的各个版本 ownerKey[0]则是最旧的一个
	ownerKey := resp.Responses[1].GetResponseRange().Kvs
	if len(ownerKey) == 0 || ownerKey[0].CreateRevision == myRev {
		// 如果ownerKey数组为空或则最旧的那个就是当前自己的 那就算获取锁成功了 直接返回
		m.hdr = resp.Header
		return nil
		//成功获取锁
	}

	// 到这里说明获取锁失败了 m.myRev就是现在这个key最新的revision
	//
	hdr, werr = waitDeletes(ctx, client, m.pfx, m.myRev-1)

	// release lock key if wait failed
	if werr != nil {
		m.Unlock(client.Ctx())
	} else {
		m.hdr = hdr
	}
	return werr
}

// waitDeletes efficiently waits until all keys matching the prefix and no greater
// than the create revision.
func waitDeletes(ctx context.Context, client *v3.Client, pfx string, maxCreateRev int64) (*pb.ResponseHeader, error) {
	//WithLastCreate 获取最新的 WithMaxCreateRev(maxCreateRev) 这就是前面传过来的revision(当前版本-1) 获取比这个版本大的记录
	// 可能在这段时间之内锁被释放了 然后又有另外的client获取了锁 所以要获取最新的和当前版本-1之间的所有值
	// 即当前版本为2 那么这里就获取大于1的和最新的 这之间的
	getOpts := append(v3.WithLastCreate(), v3.WithMaxCreateRev(maxCreateRev))
	for {
		resp, err := client.Get(ctx, pfx, getOpts...)
		if err != nil {
			return nil, err
		}
		if len(resp.Kvs) == 0 {
			return resp.Header, nil
		}
		// 这里resp.Kvs[0]就是当前最最最最新的了
		lastKey := string(resp.Kvs[0].Key)
		// 然后又调用了一个方法 
		if err = waitDelete(ctx, client, lastKey, resp.Header.Revision); err != nil {
			return nil, err
		}
	}
}

func waitDelete(ctx context.Context, client *v3.Client, key string, rev int64) error {
	cctx, cancel := context.WithCancel(ctx)
	defer cancel()

	var wr v3.WatchResponse
	// 这里就对这个key添加watcher
	wch := client.Watch(cctx, key, v3.WithRev(rev))
	for wr = range wch {
		for _, ev := range wr.Events {
			// 一直阻塞到这个key被删除之后就返回
			if ev.Type == mvccpb.DELETE {
				return nil
			}
		}
	}
	if err := wr.Err(); err != nil {
		return err
	}
	if err := ctx.Err(); err != nil {
		return err
	}
	return fmt.Errorf("lost watcher waiting for delete")
}

```

