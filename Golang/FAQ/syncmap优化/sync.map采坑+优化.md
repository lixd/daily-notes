# Sync.Map 采坑 + 优化

## 1. 采坑

> 分析之后主要还是自己使用的姿势不对，导致的坑，并不是库的问题。

背景：

之前用了 sync.map 来记录每个会员的请求次数之类的信息。

map key 为会员id+时间戳(string) value 则为请求次数(*int)



```go
var smap sync.Map

func Inc(userID string, inc int64) {
	store, loaded := smap.LoadOrStore(userID, &inc)
	if loaded {
		count := store.(*int64)
		atomic.AddInt64(count, inc)
	}
}

func Collect() {
	smap.Range(func(key, value interface{}) bool {
		// xxx
		return true
	})
}
```



请求时通过 Inc 方法记录请求次数，然后定时调用 Collect 方法扫描并收集统计数据并进行存储。



测试发现CPU占用比较多，于是使用 pprof 分析了一下，发现大部分CPU消耗在了 sync.Map,特别是`LoadOrStore`方法。

查阅 sync.Map 源码后定位大大致问题，每次调用 Inc 方法都会执行 LoadOrStore 从 sync.map 中取值，如果从 read map中没有找到就会去 dirty map 中找，但是会加锁（mutex），按照现在这种用法基本大部分时间都会加锁，导致性能很差。



![](before-sync.map.svg)



## 2. 优化

舍弃 sync.map 使用 读写锁进行优化。

```
唯一的冲突点: inc 时会读取，如果没有值时会执行写入操作，扫描后会执行删除操作，将key移除。
```

所以使用 读写锁 将这两个地方处理一下就行了。

```go
type localNew struct {
	m  map[string]*int64
	rw sync.RWMutex
}

func (l *localNew) inc(key string, inc int64) {
	l.rw.RLock()
	value := l.m[key]
	if value != nil { // 有值则+1后返回
		atomic.AddInt64(value, inc)
		l.rw.RUnlock()
		return
	}
	// 如果value为空则需要写入 这里需要加写锁
	// 由于不能锁升级(比如直接将读锁升级为写锁)，所以只能释放读锁后加写锁
	l.rw.RUnlock()
	l.rw.Lock()
	value2 := l.m[key] // double check 防止获取写锁这段时间里其他 goroutine 一直把值写入了
	if value2 != nil {
		atomic.AddInt64(value2, inc)
		l.rw.Unlock()
		return
	}
	l.m[key] = &inc
	l.rw.Unlock() // 释放写锁
}

func (l *localNew) scan() {
	// 扫描之前加写锁
	l.rw.Lock()
	// 然后复制map
	cp := make(map[string]int64)
	deepCopy(l.m, cp)

	// 在把原来的map重新复制
	ne := make(map[string]*int64, 1000)
	l.m = ne
	l.rw.Unlock() // 直接解锁
	// 	后续慢慢的遍历扫描即可
}
```



优化后基本性能提升了一半，K8s 中相关的 Pod 数量直接降了 一半。