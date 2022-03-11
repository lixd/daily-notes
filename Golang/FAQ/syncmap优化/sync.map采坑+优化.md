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



测试发现CPU占用比较多，于是使用 pprof 分析了一下，发现大部分CPU消耗在了 sync.Map的`LoadOrStore`方法。

> 后续发现Load方法比LoadOrStore快很多

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



优化后基本性能提升了一半，CPU 占用率降低40%左右。





## 3. 小结

最初使用map存在并发问题，于是直接改成sync.Map，修改后虽然没有并发问题了，但是因为锁的问题导致性能严重降低。

后续改成了map+读写锁 并发安全同时，性能大幅提升。

> 因为大部分是读操作，不会产生阻塞，只有在 scan 进行数据扫描时会阻塞一下，也改成了先复制后扫描，阻塞时间不会太长。





上面分析有点问题，todo。

## 4.具体场景

```shell
旧版方案
map存储，而且需要先从map中读取出来，然后+1之后再写回去
使用Mutex加锁保证并发安全,
问题在于：每次加锁效率太低

每次读取后+1再写回，导致读写比例50%，使用sync.map或者读写锁都不好优化
后续改为map中存储*int64，使用原子操作，atomic.AddInt64来实现自增，这样就把50%写操作给避免了，变成了100%读操作
此时即可以使用sync.map或者map+RWLock了。

数据如下：
读：RWLock-66.74 ns/op，sync.map-39.02 ns/op
写：RWLock-199.9 ns/op sync.map-351.8 ns/op
删：RWLock-167.1 ns/op sync.map-42.68 ns/op
根据测试结果，sync.map在读方面优于map+RWLock，写方面则比map+RWLock要慢。当前场景接近100%读操作，所以最终选择sync.map
具体流程为：
先load，如果有值就直接atomic.add，没有值就加锁mutex，加锁后再次load判断是否存在，双重校验保证数据不会丢失。
只判断一次存在多个请求都发现该值不存在，然后往里面写，最终前面的数据被后面的请求覆盖。
不过sync.map直接提供了LoadOrStore，如果不存在就会写入，存在就会查询出来，就省去了上面的这段逻辑。
```

