# etcd watch机制

## 1. 概述

为了避免客户端的反复轮询， etcd 提供了 event 机制 客户端可以订阅一系

列的 event ，用于 watch 某些 key 。当这些被 watch key 更新时， etcd 就

会通知客户端。 etcd 能够保证在操作发生后再发送 event ，所以客户端收

到 event后一定可以看到更新的状态。

## 2. etcd v3 watch机制优化

etcd v3 watch 机制在 etcd v2 的基础上做了很多改进，一个显著的优化是

减小了每个 watch 所带来的资源消耗，从而能够支持更大规模的 watch

etcd v3 API 采用了 gRPC ，而 gRPC 又利用了 HTTP/2 TCP 链接多路复

用（ multiple stream per tcp connection ），这样同一个 Client 的不同 

watch 可以共享同一个 TCP 连接。

## 3. 具体逻辑

etcd 会保存每个客户端发来的 watch 请求， watch 请求可以关注一个 

key(单key)，或者一个 key 前缀(区间)，所以 watch Group 包含两种

Watcher:

* 一种是 key Watchers ，数据结构是每个 key 对应一组 Watcher ；
* 另外一种是range Watchers ，数据结构是一个线段树，可以方便地通过区间查找到对应的Watcher。



etcd 会有一个线程持续不断地遍历所有的 watch 请求，每个 watch 对象都

会负责维护其监控的 key 事件，看其推送到了哪个 revision。

etcd 会根据这个`revision.main ID`去bbolt 中继续向后遍历。 

> bbolt类似于 leveldb ，是一个按 key 有序排列的 Key-Value(K-V)引擎

bbolt 中的key 是由`revision.main+revision sub`组成的，所以遍历就会

依次经过历史上发生过的所有事务(tx)的记录。

对于遍历经过的每个 K-V, etcd 会反序列化其中的 value ，判断其中的 key 

是否为 watch 请求关注的 key ，如果是就发送给客户端。



## 4. 源码分析

具体代码如下：

```go
func (s *watchableStore) syncWatchersLoop() {
	defer s.wg.Done()

	for {
		s.mu.RLock()
		st := time.Now()
		lastUnsyncedWatchers := s.unsynced.size()
		s.mu.RUnlock()

		unsyncedWatchers := 0
		// 判断如果又未同步的watcher就调用 s.syncWatchers()
		if lastUnsyncedWatchers > 0 {
			unsyncedWatchers = s.syncWatchers()
		}
		syncDuration := time.Since(st)

		waitDuration := 100 * time.Millisecond
		// more work pending?
		if unsyncedWatchers != 0 && lastUnsyncedWatchers > unsyncedWatchers {
			// be fair to other store operations by yielding time taken
			waitDuration = syncDuration
		}

		select {
		case <-time.After(waitDuration):
		case <-s.stopc:
			return
		}
	}
}
```

for循环中不断调用`s.syncWatchers()`方法

```go
// syncWatchers syncs unsynced watchers by:
//	1. choose a set of watchers from the unsynced watcher group
//	2. iterate over the set to get the minimum revision and remove compacted watchers
//	3. use minimum revision to get all key-value pairs and send those events to watchers
//	4. remove synced watchers in set from unsynced group and move to synced group
func (s *watchableStore) syncWatchers() int {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.unsynced.size() == 0 {
		return 0
	}

	s.store.revMu.RLock()
	defer s.store.revMu.RUnlock()

	// in order to find key-value pairs from unsynced watchers, we need to
	// find min revision index, and these revisions can be used to
	// query the backend store of key-value pairs
	curRev := s.store.currentRev
	compactionRev := s.store.compactMainRev

	wg, minRev := s.unsynced.choose(maxWatchersPerSync, curRev, compactionRev)
	minBytes, maxBytes := newRevBytes(), newRevBytes()
	revToBytes(revision{main: minRev}, minBytes)
	revToBytes(revision{main: curRev + 1}, maxBytes)

	// UnsafeRange returns keys and values. And in boltdb, keys are revisions.
	// values are actual key-value pairs in backend.
	tx := s.store.b.ReadTx()
	tx.Lock()
	revs, vs := tx.UnsafeRange(keyBucketName, minBytes, maxBytes, 0)
	evs := kvsToEvents(wg, revs, vs)
	tx.Unlock()

	var victims watcherBatch
	wb := newWatcherBatch(wg, evs)
	for w := range wg.watchers {
		w.minRev = curRev + 1

		eb, ok := wb[w]
		if !ok {
			// bring un-notified watcher to synced
			s.synced.add(w)
			s.unsynced.delete(w)
			continue
		}

		if eb.moreRev != 0 {
			w.minRev = eb.moreRev
		}

		if w.send(WatchResponse{WatchID: w.id, Events: eb.evs, Revision: curRev}) {
			pendingEventsGauge.Add(float64(len(eb.evs)))
		} else {
			if victims == nil {
				victims = make(watcherBatch)
			}
			w.victim = true
		}

		if w.victim {
			victims[w] = eb
		} else {
			if eb.moreRev != 0 {
				// stay unsynced; more to read
				continue
			}
			s.synced.add(w)
		}
		s.unsynced.delete(w)
	}
	s.addVictim(victims)

	vsz := 0
	for _, v := range s.victims {
		vsz += len(v)
	}
	slowWatcherGauge.Set(float64(s.unsynced.size() + vsz))

	return s.unsynced.size()
}
```

sync Watchers()函数 每次都会从所有的 Watcher 中选出一批 Watcher 进行批处理（组成 group ，称为 watchGroup ），在这批 Watcher 中将观察到的最小的 revision.main ID 作为 bbolt 的遍历起始位置。 

> 如果为每个Watcher 单独遍历 bbolt 并从中挑选出属于自己关注的 key ，那么性能就太差了通过一次性遍历，处理多个 Watcher ，显然可以有效减少遍历的次数。

遍历 bblot时 JSON 会反序列化每个 mvccpb.KeyValue 结构， 判断其中的

key 是否属于 watch Group 关注的 key ，而这是由 kvsToEvents 函数完成的

```go
// kvsToEvents gets all events for the watchers from all key-value pairs
func kvsToEvents(wg *watcherGroup, revs, vals [][]byte) (evs []mvccpb.Event) {
	for i, v := range vals {
		var kv mvccpb.KeyValue
		if err := kv.Unmarshal(v); err != nil {
			plog.Panicf("cannot unmarshal event: %v", err)
		}
		// 如果没有watcher关心这个key就直接返回
		if !wg.contains(string(kv.Key)) {
			continue
		}
		// 判断本次是什么类型的event
		ty := mvccpb.PUT
		if isTombstone(revs[i]) {
			ty = mvccpb.DELETE
			// patch in mod revision so watchers won't skip
			kv.ModRevision = bytesToRev(revs[i]).main
		}
		evs = append(evs, mvccpb.Event{Kv: &kv, Type: ty})
	}
	return evs
}
```

