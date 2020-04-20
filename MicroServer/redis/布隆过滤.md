# 布隆过滤

## 1. 概述

 布隆过滤器是一个神奇的数据结构，**可以用来判断一个元素是否在一个集合中**。很常用的一个功能是用来**去重**。

布隆过滤器（英语：Bloom Filter）是1970年由一个叫布隆的小伙子提出的。它实际上是一个很长的二进制向量和一系列随机映射函数。布隆过滤器可以用于检索一个元素是否在一个集合中。它的优点是空间效率和查询时间都远远超过一般的算法，缺点是有一定的误识别率和删除困难。

## 2. 原理

布隆过滤器的原理是，**当一个元素被加入集合时，通过K个散列函数将这个元素映射成一个位数组中的K个点，把它们置为1。**检索时，我们只要看看这些点是不是都是1就（大约）知道集合中有没有它了：如果这些点有任何一个0，则被检元素一定不在；如果都是1，则被检元素很可能在。这就是布隆过滤器的基本思想。

## 3. 应用场景

 那应用的场景在哪里呢？一般我们都会用来防止缓存击穿 

简单来说就是你数据库的id都是1开始然后自增的，那我知道你接口是通过id查询的，我就拿负数去查询，这个时候，会发现缓存里面没这个数据，我又去数据库查也没有，一个请求这样，100个，1000个，10000个呢？你的DB基本上就扛不住了，如果在缓存里面加上这个，是不是就不存在了，你判断没这个数据就不去查了，直接return一个数据为空不就好了嘛。

### 4. 缺点

bloom filter之所以能做到在时间和空间上的效率比较高，是因为牺牲了判断的准确率、删除的便利性

- 存在误判，可能要查到的元素并没有在容器中，但是hash之后得到的k个位置上值都是1。如果bloom filter中存储的是黑名单，那么可以通过建立一个白名单来存储可能会误判的元素。
- 删除困难。一个放入容器的元素映射到bit数组的k个位置上是1，删除的时候不能简单的直接置为0，可能会影响其他元素的判断。可以采用[Counting Bloom Filter](http://wiki.corp.qunar.com/confluence/download/attachments/199003276/US9740797.pdf?version=1&modificationDate=1526538500000&api=v2)

## 5. 实现

go版本的布隆过滤

`github.com/willf/bloom`

源码分析

结构体定义

 m是数组集合大小，而k是hash函数个数 

```go
// member of a set.
type BloomFilter struct {
    m uint
    k uint
    b *bitset.BitSet
}

// New creates a new Bloom filter with _m_ bits and _k_ hashing functions
// We force _m_ and _k_ to be at least one to avoid panics.
func New(m uint, k uint) *BloomFilter {
    return &BloomFilter{max(1, m), max(1, k), bitset.New(m)}
}

```

 这里使用了bitset作为数组实现 

```go
// A BitSet is a set of bits. The zero value of a BitSet is an empty set of length 0.
type BitSet struct {
    length uint
    set    []uint64
}

// New creates a new BitSet with a hint that length bits will be required
func New(length uint) (bset *BitSet) {
    defer recover ....
    bset = &BitSet{
        length,
        make([]uint64, wordsNeeded(length)), // 计算实际申请长度
    }
    return bset
}

```

 用int64位表示0～63个整数 

```sh
第一次add 0:
数组表示应该是1（1）
第二次add 10
数组表示应该是1024+1=1025（1000000001）
第三次add 64
因为已经大于63，所以只能新建一个int64，所以应该两个元素，1025和1
```



计算hash

```go
// Add data to the Bloom Filter. Returns the filter (allows chaining)
func (f *BloomFilter) Add(data []byte) *BloomFilter {
    h := baseHashes(data)
    for i := uint(0); i < f.k; i++ { //执行k次，一个整数用k位表示，一旦不存在，k位bit肯定不为1
        // 实现hash函数是murmurhash，https://xiaobazhang.github.io/2018/06/19/MurmurHash%E7%AE%97%E6%B3%95/
        f.b.Set(f.location(h, i))
    }
    return f
}

```

 计算碰撞率 

```go
// EstimateFalsePositiveRate returns, for a BloomFilter with a estimate of m bits
// and k hash functions, what the false positive rate will be
// while storing n entries; runs 100,000 tests. This is an empirical
// test using integers as keys. As a side-effect, it clears the BloomFilter.
func (f *BloomFilter) EstimateFalsePositiveRate(n uint) (fpRate float64) {
    rounds := uint32(100000)
    f.ClearAll()
    n1 := make([]byte, 4)
    for i := uint32(0); i < uint32(n); i++ {
        binary.BigEndian.PutUint32(n1, i)
        f.Add(n1)
    }
    fp := 0
    // test for number of rounds
    for i := uint32(0); i < rounds; i++ {
        binary.BigEndian.PutUint32(n1, i+uint32(n)+1)
        if f.Test(n1) {
            //fmt.Printf("%v failed.\n", i+uint32(n)+1)
            fp++
        }
    }
    fpRate = float64(fp) / (float64(rounds))
    f.ClearAll()
    return
}

```

 根据n和fp估算m和k 

```go
// EstimateParameters estimates requirements for m and k.
// Based on https://bitbucket.org/ww/bloom/src/829aa19d01d9/bloom.go
// used with permission.
func EstimateParameters(n uint, p float64) (m uint, k uint) {
    m = uint(math.Ceil(-1 * float64(n) * math.Log(p) / math.Pow(math.Log(2), 2)))
    k = uint(math.Ceil(math.Log(2) * float64(m) / float64(n)))
    return
}

// NewWithEstimates creates a new Bloom filter for about n items with fp
// false positive rate
func NewWithEstimates(n uint, fp float64) *BloomFilter {
    m, k := EstimateParameters(n, fp)
    return New(m, k)
}

```

