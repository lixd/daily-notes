# sync map

> [Go sync.Map 包教包会](https://juejin.cn/post/6969204844552781855)
>
> [你不得不知道的sync.Map源码分析](https://segmentfault.com/a/1190000015242373)
>
> [看过这篇剖析，你还不懂 Go sync.Map 吗？](https://zhuanlan.zhihu.com/p/365144986)





## 1.压测与分析

Go 原生 map 不是并发安全的，在并发环境下一般有以下解决方案：

* map + Mutex
* map +RWMutex
* sync.Map



这里先给出结论：

* 读和删两方面上，sync.Map 的性能更好。
* 写这方面上，sync.Map 的效率只有其他两项的一半。

综上，在读多写少的场景下，使用 sync.Map 类型效果更好。

*对于写多读少的场景，怎么办呢？*

写多读少的场景可以采用**分段锁技术**：将 map 拆解为多个子 map，并由多个锁控制并发，从而降低锁粒度，以提高效率。



### 压测

压测代码见 [这里](https://github.com/bigwhite/experiments/tree/master/go19-examples/benchmark-for-map)

结果如下：

> BuiltinMap = Mutex + map
> BuiltinRwMap = RWMutex + map
> SyncMap = sync.Map

```shell
# 写入
BenchmarkBuiltinMapStoreParalell-4               6753177               196.1 ns/op
BenchmarkSyncMapStoreParalell-4                  3809122               351.8 ns/op
BenchmarkBuiltinRwMapStoreParalell-4             8106212               199.9 ns/op
# 查询
BenchmarkBuiltinMapLookupParalell-4              8332371               155.6 ns/op
BenchmarkBuiltinRwMapLookupParalell-4           18317394                66.74 ns/op
BenchmarkSyncMapLookupParalell-4                34709386                39.02 ns/op
# 删除
BenchmarkBuiltinMapDeleteParalell-4              7093183               170.5 ns/op
BenchmarkBuiltinRwMapDeleteParalell-4            7816269               167.1 ns/op
BenchmarkSyncMapDeleteParalell-4                31467519                42.68 ns/op
```



### 结果分析

**1） 读效率高**：采用读写分离的方式，降低锁时间，提升读性能

sync.Map 中并非单纯的 map，而是有两个 map 。

其中的 read map 可以认为就是一个缓存层，存储了“老”数据，可以进行无锁+原子操作。

而对于新写入的元素存放于 dirty map 中，并且在一定的时机下，将 dirty 中的全量数据转入到 read map 中。

所以在写入少的情景下，大部分的执行，数据都在 read map 中，结合 amended 属性查找效率高。

但是写入多的场景下，会导致 dirty map 中总有新数据，查找新数据会先后在 read map 和 dirty map 中查找，并且后者需要加锁，效率就很低。

> 因为会多查询一次 read map，然后再加锁查询 dirty map 导致性能比直接加锁还低。

同时 dirty map 也会不断触发 promoted 为 read map，整体性能很差。



**2）写入性能差**
 因为写入一定要会经过 read map，所以无论如何都比别人多一层操作；后续还要查数据情况和状态，性能开销相较更大。

另外，在新增 key 的时候，常常会伴随全量数据的复制（从read到dirty），若 map 的数据量大，效率很低。

**3）删除速度快**
 因为只是标记删除，在 promoted 的时候才真正地从 read map 中清除已删除的元素，相当于是延迟删除。



## 2. 原理解析

![](assets/syncmap.jpg)





```go
var expunged = unsafe.Pointer(new(interface{}))
type Map struct 
type readOnly struct
type entry struct
func (m *Map) Load(key interface{}) (value interface{}, ok bool)
func (m *Map) Store(key, value interface{})
func (m *Map) Delete(key interface{})
func (m *Map) Range(f func(key, value interface{}) bool)
```

这里要重点关注`readOnly.amended`、`Map.misses`和`entry.p`的数值状态, 拓扑图中,多处用于走势判断.
接下来详细列出结构体的代码和注释, 方便阅读理解拓扑图.







### 主要结构和注释

> 以下分析基于 Go1.17.5

```go
type Map struct {
    //互斥锁，用于锁定dirty map
    mu Mutex    
    
    //优先读map,支持原子操作，注释中有readOnly不是说read是只读，而是它的结构体。read实际上有写的操作
    read atomic.Value 
    
    // dirty是一个当前最新的map，允许读写
    dirty map[interface{}]*entry 
    
    // 主要记录read读取不到数据加锁读取read map以及dirty map的次数，当misses等于dirty的长度时，会将dirty复制到read
    misses int 
}

// readOnly 主要用于存储，通过原子操作存储在 Map.read 中元素。
type readOnly struct {
    // read的map, 用于存储所有read数据
    m       map[interface{}]*entry
    
    // 如果数据在dirty中但没有在read中，该值为true,作为修改标识
    amended bool 
}

// entry 为 Map.dirty 的具体map值
type entry struct {
    // nil: 表示为被删除，调用Delete()可以将read map中的元素置为nil
    // expunged: 也是表示被删除，但是该键只在read而没有在dirty中，这种情况出现在将read复制到dirty中，即复制的过程会先将nil标记为expunged，然后不将其复制到dirty
    //  其他: 表示存着真正的数据
    p unsafe.Pointer // *interface{}
}
```

1、本质上，sync.Map 就是由两个 map 组成，一个存储只读数据，一个存读写数据。

> 下文将会以 read map(即readOnly.m) 和 dirty map(即dirty) 两个名称进行阐述。

2、expunged 是占位符/哨兵值，初始化的时候随机赋值（就是一个地址值），用于标明 read map 中的 value 是否被删除。但是，删除的时候只是先将 value 置为 nil，再后续转为 expunged 值。

> 这也就是为什么sync.Map删除效率这么快





### 方法源码分析



#### Load

```go
func (m *Map) Load(key interface{}) (value interface{}, ok bool) {
    // 第一次检测元素是否存在
    read, _ := m.read.Load().(readOnly)
    e, ok := read.m[key]
    // read.amended为true表示dirty map中有新数据是read map中没有的
    // 所以这里read map miss后需要去dirty map中在查询一次
    if !ok && read.amended {
        // 为dirty map 加锁
        m.mu.Lock()
        // double check
        // 第二次检测元素是否存在，主要防止在加锁的过程中,dirty map转换成read map,从而导致本来能读到数据的情况下也去调用了m.missLocked()
        read, _ = m.read.Load().(readOnly)
        e, ok = read.m[key]
        if !ok && read.amended {
            // 从dirty map中获取是为了应对read map中不存在的新元素
            e, ok = m.dirty[key]
            // 不论元素是否存在，均需要记录miss数，以便dirty map升级为read map
            m.missLocked()
        }
        // 解锁
        m.mu.Unlock()
    }
    // 走到这里有两种情况
    // 1.read map miss,而且dirty map中也没有新数据
    // 2.read map miss,dirty map有新数据，但是查询dirty map也miss
    // 说明查询的元素真的不存在，直接返回
    if !ok {
        return nil, false
    }
    // map 中存的是一个叫 entry的结构体，其实是存的指针
    // 调用load方法根据指针找到对应数据返回回去
    return e.load()
}
```

当 miss 次数大于dirty map 长度时 dirty map 将升级为 read map。

```go
func (m *Map) missLocked() {
    // misses自增1
    m.misses++
    // 判断dirty map是否可以升级为read map
    if m.misses < len(m.dirty) {
        return
    }
    // dirty map升级为read map
    m.read.Store(readOnly{m: m.dirty})
    // dirty map 清空
    m.dirty = nil
    // misses重置为0
    m.misses = 0
}
```

元素取值

```go
func (e *entry) load() (value interface{}, ok bool) {
    p := atomic.LoadPointer(&e.p)
    // 元素不存在或者被删除，则直接返回
    if p == nil || p == expunged {
        return nil, false
    }
    return *(*interface{})(p), true
}
```

read map 主要用于读取，每次 Load 都先从 read 读取，当 read 中不存在且 amended 为true，说明 dirty map 中有新数据，可能这个元素就在 dirty map 中吗，因此就需要再去 dirty 读一次 。

这里使用了 double check 防止增加无效的 miss 数。

> 同时来了两个请求，从 read map 读都 miss 了，都需要加锁去 dirty map 读，第一个请求先获取锁，读完 dirty map 后发现 miss 次数满足条件了，于是把 dirty map 升级为 read map，如果这里不执行 double check 的话，第一个请求释放锁后第二个请求拿到锁又去 dirty map 中读，然后又把 miss +1，实际上此时 read map 已经有这个元素了，当前这个 miss 是不应该加的。

无论 dirty map 中是否存在该元素，都会执行 missLocked 函数，该函数将 misses + 1，当`m.misses > len(m.dirty)`时，便会将 dirty 复制到 read，此时再将 dirty 置为nil,misses置为0。



#### Store

```go
func (m *Map) Store(key, value interface{}) {
    // 1.如果 read map中存在，并且没有被标记删除，则尝试更新,写入成功，则结束
    read, _ := m.read.Load().(readOnly)
    if e, ok := read.m[key]; ok && e.tryStore(&value) {
        return
    }
    // dirty map锁
    m.mu.Lock()
    // 同样是double check
    read, _ = m.read.Load().(readOnly)
    if e, ok := read.m[key]; ok {
   		// 2.如果 entry 被标记 expunge，则表明 dirty 没有 key，可添加到 dirty中，并更新 entry
        if e.unexpungeLocked() {
            m.dirty[key] = e // 加入 dirty 
        }
        // 更新read map 元素值
        e.storeLocked(&value)
    } else if e, ok := m.dirty[key]; ok {
        // 此时read map没有该元素，但是dirty map有该元素，就将dirty map元素更新最新值
        e.storeLocked(&value)
    } else {  // 4. read 和 dirty都没有，为新增操作
        // read.amended==false,说明dirty map为空，需要将read map 复制一份到dirty map
        if !read.amended {
            m.dirtyLocked() // 将 read 中未删除的数据加入到 dirty 中
            // 标记 amended=true，表示 read 与 dirty 不相同
            m.read.Store(readOnly{m: read.m, amended: true})
        }
        // 设置元素进入dirty map，此时dirty map拥有read map和最新设置的元素
        m.dirty[key] = newEntry(value)
    }
    // 解锁，有人认为锁的范围有点大，假设read map数据很大，那么执行m.dirtyLocked()会耗费花时间较多，完全可以在操作dirty map时才加锁，这样的想法是不对的，因为m.dirtyLocked()中有写入操作
    m.mu.Unlock()
}
```

写入过程分为4个case：

1）read map 中若存在该 key，且没有被标记为删除状态，则直接进行 store。

> 注意：即便 m.dirty 中也有该 key，由于都是通过指针指向，所以不需要再操作 m.dirty，其 value 也会保持最新的 entry 值。

```go
func (e *entry) tryStore(i *interface{}) bool {
    // 获取对应Key的元素，判断是否标识为删除
    p := atomic.LoadPointer(&e.p)
    if p == expunged {
        return false
    }
    for {
        // cas尝试写入新元素值
        if atomic.CompareAndSwapPointer(&e.p, p, unsafe.Pointer(i)) {
            return true
        }
        // 判断是否标识为删除
        p = atomic.LoadPointer(&e.p)
        if p == expunged {
            return false
        }
    }
}
```

2）read map 中若存在该 key，但已经被标记为已删除(expunged)，说明 dirty map 中肯定不存在该 key，则在 dirty map 中写入该 key-value 对。同时，用 atomic.StorePointer 操作更新 read map 中的 key-value。

```go
func (e *entry) unexpungeLocked() (wasExpunged bool) {
    return atomic.CompareAndSwapPointer(&e.p, expunged, nil)
}

func (e *entry) storeLocked(i *interface{}) {
	atomic.StorePointer(&e.p, unsafe.Pointer(i))
}
```

3）read 中不存在该 key，但 dirty 中存在，则直接更新 dirty map。

4）read 和 dirty 都不存在该 key 时，则为新增操作。
此时会通过 dirtyLocked() 函数将 read map 中未删除的元素，导入到 dirty map 中。并设置 read. amended=true。

> 为什么要将元素复制到 dirty map？应该是为了让 dirty map 始终拥有最完整的数据，因为 miss 次数过多时会直接用 dirty map 替换 read map。

```go
func (m *Map) dirtyLocked() {
    if m.dirty != nil {
        return
    }

    read, _ := m.read.Load().(readOnly)
    m.dirty = make(map[interface{}]*entry, len(read.m))
    for k, e := range read.m {
        // 如果标记为nil或者expunged，则不复制到dirty map
        if !e.tryExpungeLocked() {
            m.dirty[k] = e
        }
    }
}
```



#### LoadOrStore

如果对应的元素存在，则返回该元素的值，如果不存在，则将元素写入到sync.Map。如果已加载值，则加载结果为true;如果已存储，则为false。



```go
func (m *Map) LoadOrStore(key, value interface{}) (actual interface{}, loaded bool) {
    // 不加锁的情况下读取read map
    // 第一次检测
    read, _ := m.read.Load().(readOnly)
    if e, ok := read.m[key]; ok {
        // 如果元素存在（是否标识为删除由tryLoadOrStore执行处理），尝试获取该元素已存在的值或者将元素写入
        actual, loaded, ok := e.tryLoadOrStore(value)
        if ok {
            return actual, loaded
        }
    }

    m.mu.Lock()
    // 第二次检测
    // 以下逻辑参看Store
    read, _ = m.read.Load().(readOnly)
    if e, ok := read.m[key]; ok {
        if e.unexpungeLocked() {
            m.dirty[key] = e
        }
        actual, loaded, _ = e.tryLoadOrStore(value)
    } else if e, ok := m.dirty[key]; ok {
        actual, loaded, _ = e.tryLoadOrStore(value)
        m.missLocked()
    } else {
        if !read.amended {
            m.dirtyLocked()
            m.read.Store(readOnly{m: read.m, amended: true})
        }
        m.dirty[key] = newEntry(value)
        actual, loaded = value, false
    }
    m.mu.Unlock()

    return actual, loaded
}
```

如果没有删除元素，tryLoadOrStore将自动加载或存储一个值。如果删除元素，tryLoadOrStore保持条目不变并返回ok= false。

```go
func (e *entry) tryLoadOrStore(i interface{}) (actual interface{}, loaded, ok bool) {
    p := atomic.LoadPointer(&e.p)
    // 元素标识删除，直接返回
    if p == expunged {
        return nil, false, false
    }
    // 存在该元素真实值，则直接返回原来的元素值
    if p != nil {
        return *(*interface{})(p), true, true
    }

    // 如果p为nil(此处的nil，并是不是指元素的值为nil，而是atomic.LoadPointer(&e.p)为nil，元素的nil在unsafe.Pointer是有值的)，则更新该元素值
    ic := i
    for {
        if atomic.CompareAndSwapPointer(&e.p, nil, unsafe.Pointer(&ic)) {
            return i, false, true
        }
        p = atomic.LoadPointer(&e.p)
        if p == expunged {
            return nil, false, false
        }
        if p != nil {
            return *(*interface{})(p), true, true
        }
    }
}
```



#### Delete

删除元素,采用延迟删除。

当 read map 存在元素时，将元素置为 nil，只有在提升 dirty 的时候才清理删除的元素，延迟删除可以避免后续获取删除的元素时候需要加锁。

当 read map 不存在元素时，直接删除 dirty map 中的元素。

新版中新增了一个 LoadAndDelete 方法，删除的同时还会返回删除前的值。

```go
func (m *Map) Delete(key interface{}) {
	m.LoadAndDelete(key)
}
func (m *Map) LoadAndDelete(key interface{}) (value interface{}, loaded bool) {
    // 查看read map中是否存在
	read, _ := m.read.Load().(readOnly)
	e, ok := read.m[key]
    // read map 不存在并且 dirty map有新值
	if !ok && read.amended {
		m.mu.Lock()
        // double check
		read, _ = m.read.Load().(readOnly)
		e, ok = read.m[key]
        // 这里还是不存在，直接从dirty map中删除一次，不管有没有
		if !ok && read.amended {
			e, ok = m.dirty[key]
			delete(m.dirty, key)
			m.missLocked() // 这里也直接记一次miss，之前版本应该是没有的
		}
		m.mu.Unlock()
	}
	if ok { // 删除
		return e.delete()
	}
	return nil, false
}
```

元素值置为nil，并返回之前的值

```go
func (e *entry) delete() (value interface{}, ok bool) {
	for {
		p := atomic.LoadPointer(&e.p)
		if p == nil || p == expunged {
			return nil, false
		}
		if atomic.CompareAndSwapPointer(&e.p, p, nil) {
			return *(*interface{})(p), true
		}
	}
}
```



#### Range

sync.Map 和普通 Map 最大区别就是在 range 上的，普通 map 可以直接 for range，sync.Map 只能用官方提供的 API 来 range。

不过该方法内部其实也是用的 for range，只不过加入了其他的一些逻辑。

```go
func (m *Map) Range(f func(key, value interface{}) bool) {
    // 首先根据read.amended判断dirty map中是否有新数据了
	read, _ := m.read.Load().(readOnly)
	if read.amended {
		m.mu.Lock()
        // double check
		read, _ = m.read.Load().(readOnly)
		if read.amended {
            // 如果有的话直接将dirty map提升为 read map
			read = readOnly{m: m.dirty}
			m.read.Store(read)
			m.dirty = nil
			m.misses = 0
		}
		m.mu.Unlock()
	}
	// 然后使用 read map进行遍历。
	for k, e := range read.m {
        // 过滤到被删除的元素
		v, ok := e.load()
		if !ok {
			continue
		}
        // 函数返回false，终止
        // 什么时候终止遍历由调用者决定
		if !f(k, v) {
			break
		}
	}
}
```

range 时过滤到被删除的元素

```go
func (e *entry) load() (value interface{}, ok bool) {
	p := atomic.LoadPointer(&e.p)
	if p == nil || p == expunged {
		return nil, false
	}
	return *(*interface{})(p), true
}
```





### 小结

sync.Map 优化点：

* 1）空间换时间。通过冗余一个read map用来做读操作，避免读写冲突。
* 2）延迟删除。 删除一个键值只是打标记，只有在提升dirty的时候才清理删除的数据。



sync.Map 没有提供获取元素个数的 Len() 方法，不过可以通过 Range() 实现。

```go
func Len(sm sync.Map) int {
    lengh := 0
    f := func(key, value interface{}) bool {
        lengh++
        return true
    }
    one:=lengh
    lengh=0
    sm.Range(f)
    if one != lengh {
        one = lengh
        lengh=0
        sm.Range(f)
        if one <lengh {
            return lengh
        }
        
    }
    return one
}
```











## 3. FAQ



### 问题1

**sync.Map 对键的类型有要求吗？**

有要求。键的实际类型不能是函数类型、字典类型和切片类型。

**解析**

 我们都知道，Go 语言的原生字典的键类型不能是函数类型、字典类型和切片类型。

由于并发安全字典内部使用的存储介质正是原生字典，又因为它使用的原生字典键类型也是可以包罗万象的`interface{}`，所以，我们绝对不能带着任何实际类型为函数类型、字典类型或切片类型的键值去操作并发安全字典。

由于这些键值的实际类型只有在程序运行期间才能够确定，所以 Go 语言编译器是无法在编译期对它们进行检查的，不正确的键值实际类型肯定会引发 panic。

因此，我们在这里首先要做的一件事就是：**一定不要违反上述规则**。我们应该在每次操作并发安全字典的时候，都去显式地检查键值的实际类型。无论是存、取还是删，都应该如此。



### 问题2

**怎样保证 sync.Map 中的键和值的类型正确性？**

简单地说，可以使用`类型断言表达式`或者`反射操作`来保证它们的类型正确性。

为了进一步明确并发安全字典中键值的实际类型，这里大致有两种方案可选。

**第一种方案是，让 sync.Map 只能存储某个特定类型的键**

比如，指定这里的键只能是`int`类型的，或者只能是字符串，又或是某类结构体。一旦完全确定了键的类型，你就可以在进行存、取、删操作的时候，使用类型断言表达式去对键的类型做检查了,或者你要是把并发安全字典封装在一个结构体类型里面，让 Go 语言编译器帮助你做类型检查。



**方案二 指定类型**

我们封装的结构体类型的所有方法，都可以与`sync.Map`类型的方法完全一致。

不过，在这些方法中，我们就需要添加一些做类型检查的代码了。另外，这样并发安全字典的键类型和值类型，必须在初始化的时候就完全确定。并且，这种情况下必须先要保证键的类型是可比较的。

```go
// 封装方法中依旧为 interface{} 通过类型比较来让其更通用, 但每次操作前的比较会损失一定的性能。
type ConcurrentMap struct {
	m         sync.Map
	keyType   reflect.Type
	valueType reflect.Type
}

func (cMap *ConcurrentMap) Load(key interface{}) (value interface{}, ok bool) {
	if reflect.TypeOf(key) != cMap.keyType {
		return
	}
	return cMap.m.Load(key)
}

func (cMap *ConcurrentMap) Store(key, value interface{}) {
	if reflect.TypeOf(key) != cMap.keyType {
		panic(fmt.Errorf("wrong key type: %v", reflect.TypeOf(key)))
	}
	if reflect.TypeOf(value) != cMap.valueType {
		panic(fmt.Errorf("wrong value type: %v", reflect.TypeOf(value)))
	}
	cMap.m.Store(key, value)
}

```



### 问题3

**sync.Map 如何做到尽量避免使用锁？**

sync.Map 的原理很简单，使用了`空间换时间策略`，通过冗余的两个数据结构(read、dirty),实现加锁对性能的影响。
通过引入两个 map 将读写分离到不同的 map，其中 read map 提供并发读和已存元素原子写，而dirty map则负责读写。
这样read map就可以在不加锁的情况下进行并发读取,当read map中没有读取到值时,再加锁进行后续读取,并累加未命中数。
当未命中数大于等于dirty map长度,将dirty map上升为read map。
从结构体的定义可以发现，虽然引入了两个map，但是底层数据存储的是指针，指向的是同一份值。

