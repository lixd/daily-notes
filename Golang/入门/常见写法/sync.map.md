# sync map



### 问题1

**今天的问题是：并发安全字典对键的类型有要求吗？**

有要求。键的实际类型不能是函数类型、字典类型和切片类型。

**解析**

 我们都知道，Go 语言的原生字典的键类型不能是函数类型、字典类型和切片类型。

由于并发安全字典内部使用的存储介质正是原生字典，又因为它使用的原生字典键类型也是可以包罗万象的`interface{}`，所以，我们绝对不能带着任何实际类型为函数类型、字典类型或切片类型的键值去操作并发安全字典。

由于这些键值的实际类型只有在程序运行期间才能够确定，所以 Go 语言编译器是无法在编译期对它们进行检查的，不正确的键值实际类型肯定会引发 panic。

因此，我们在这里首先要做的一件事就是：**一定不要违反上述规则**。我们应该在每次操作并发安全字典的时候，都去显式地检查键值的实际类型。无论是存、取还是删，都应该如此。



### 问题2

**怎样保证并发安全字典中的键和值的类型正确性？**

简单地说，可以使用`类型断言表达式`或者`反射操作`来保证它们的类型正确性。

为了进一步明确并发安全字典中键值的实际类型，这里大致有两种方案可选。

**第一种方案是，让并发安全字典只能存储某个特定类型的键**

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

**并发安全字典如何做到尽量避免使用锁？**

sync.Map 的原理很简单，使用了`空间换时间策略`，通过冗余的两个数据结构(read、dirty),实现加锁对性能的影响。
通过引入两个 map 将读写分离到不同的 map，其中 read map 提供并发读和已存元素原子写，而dirty map则负责读写。
这样read map就可以在不加锁的情况下进行并发读取,当read map中没有读取到值时,再加锁进行后续读取,并累加未命中数。
当未命中数大于等于dirty map长度,将dirty map上升为read map。
从结构体的定义可以发现，虽然引入了两个map，但是底层数据存储的是指针，指向的是同一份值。





## 2. 原理解析

![](../img/syncmap.jpg)



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

### 方法源码分析



#### Load

```go
func (m *Map) Load(key interface{}) (value interface{}, ok bool) {
    // 第一次检测元素是否存在
    read, _ := m.read.Load().(readOnly)
    e, ok := read.m[key]
    if !ok && read.amended {
        // 为dirty map 加锁
        m.mu.Lock()
        // 第二次检测元素是否存在，主要防止在加锁的过程中,dirty map转换成read map,从而导致读取不到数据
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
    // 元素不存在直接返回
    if !ok {
        return nil, false
    }
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

read map主要用于读取，每次Load都先从read读取，当read中不存在且amended为true，就从dirty读取数据 。无论dirty map中是否存在该元素，都会执行missLocked函数，该函数将misses+1，当`m.misses > len(m.dirty)`时，便会将dirty复制到read，此时再将dirty置为nil,misses=0。

#### Store

```go
func (m *Map) Store(key, value interface{}) {
    // 如果read存在这个键，并且这个entry没有被标记删除，尝试直接写入,写入成功，则结束
    // 第一次检测
    read, _ := m.read.Load().(readOnly)
    if e, ok := read.m[key]; ok && e.tryStore(&value) {
        return
    }
    // dirty map锁
    m.mu.Lock()
    // 第二次检测
    read, _ = m.read.Load().(readOnly)
    if e, ok := read.m[key]; ok {
        // unexpungelocc确保元素没有被标记为删除
        // 判断元素被标识为删除
        if e.unexpungeLocked() {
            // 这个元素之前被删除了，这意味着有一个非nil的dirty，这个元素不在里面.
            m.dirty[key] = e
        }
        // 更新read map 元素值
        e.storeLocked(&value)
    } else if e, ok := m.dirty[key]; ok {
        // 此时read map没有该元素，但是dirty map有该元素，并需修改dirty map元素值为最新值
        e.storeLocked(&value)
    } else {
        // read.amended==false,说明dirty map为空，需要将read map 复制一份到dirty map
        if !read.amended {
            m.dirtyLocked()
            // 设置read.amended==true，说明dirty map有数据
            m.read.Store(readOnly{m: read.m, amended: true})
        }
        // 设置元素进入dirty map，此时dirty map拥有read map和最新设置的元素
        m.dirty[key] = newEntry(value)
    }
    // 解锁，有人认为锁的范围有点大，假设read map数据很大，那么执行m.dirtyLocked()会耗费花时间较多，完全可以在操作dirty map时才加锁，这样的想法是不对的，因为m.dirtyLocked()中有写入操作
    m.mu.Unlock()
}
```

尝试存储元素

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

unexpungelocc确保元素没有被标记为删除。如果这个元素之前被删除了，它必须在未解锁前被添加到dirty map上。

```go
func (e *entry) unexpungeLocked() (wasExpunged bool) {
    return atomic.CompareAndSwapPointer(&e.p, expunged, nil)
}
```

从read map复制到dirty map。

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

删除元素,采用延迟删除，当read map存在元素时，将元素置为nil，只有在提升dirty的时候才清理删除的数,延迟删除可以避免后续获取删除的元素时候需要加锁。当read map不存在元素时，直接删除dirty map中的元素

```GO
func (m *Map) Delete(key interface{}) {
    // 第一次检测
    read, _ := m.read.Load().(readOnly)
    e, ok := read.m[key]
    if !ok && read.amended {
        m.mu.Lock()
        // 第二次检测
        read, _ = m.read.Load().(readOnly)
        e, ok = read.m[key]
        if !ok && read.amended {
            // 不论dirty map是否存在该元素，都会执行删除
            delete(m.dirty, key)
        }
        m.mu.Unlock()
    }
    if ok {
        // 如果在read中，则将其标记为删除（nil）
        e.delete()
    }
}
```

元素值置为nil

```go
func (e *entry) delete() (hadValue bool) {
    for {
        p := atomic.LoadPointer(&e.p)
        if p == nil || p == expunged {
            return false
        }
        if atomic.CompareAndSwapPointer(&e.p, p, nil) {
            return true
        }
    }
}
```

#### Range

```go
func (m *Map) Range(f func(key, value interface{}) bool) {
    // 第一检测
    read, _ := m.read.Load().(readOnly)
    // read.amended=true,说明dirty map包含所有有效的元素（含新加，不含被删除的），使用dirty map
    if read.amended {
        // 第二检测
        m.mu.Lock()
        read, _ = m.read.Load().(readOnly)
        if read.amended {
            // 使用dirty map并且升级为read map
            read = readOnly{m: m.dirty}
            m.read.Store(read)
            m.dirty = nil
            m.misses = 0
        }
        m.mu.Unlock()
    }
    // 一贯原则，使用read map作为读
    for k, e := range read.m {
        v, ok := e.load()
        // 被删除的不计入
        if !ok {
            continue
        }
        // 函数返回false，终止
        if !f(k, v) {
            break
        }
    }
}
```

### 小结

经过了上面的分析可以得到,sync.Map并不适合同时存在大量读写的场景,大量的写会导致read map读取不到数据从而加锁进行进一步读取,同时dirty map不断升级为read map。 从而导致整体性能较低,特别是针对cache场景.针对append-only以及大量读,少量写场景使用sync.Map则相对比较合适。



sync.Map没有提供获取元素个数的Len()方法，不过可以通过Range()实现。

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



原文:`https://segmentfault.com/a/1190000015242373`