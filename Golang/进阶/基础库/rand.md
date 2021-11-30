# Rand 包

## 基本使用

### 例子

**不设置随机种子**

不设置随机种子,比如下面这个例子

> 每轮10个随机数都是按照 1779185060 这个顺序出现

```go
func randOne() {
   for i := 0; i < 10; i++ {
      fmt.Print(rand.Intn(10))
   }
}
```

说明由默认随机种子生成的随机序列就是`1779185060 `.

**每轮设置同样的种子**

每轮设置同样的种子,例子如下：

> 每轮10个随机数都是按照 4879849558 这个顺序出现

```go
func randTwo() {
	rand.Seed(10)
	for i := 0; i < 10; i++ {
		fmt.Print(rand.Intn(10))
	}
}
```

**每次设置同样的随机种子**

每次设置同样的随机种子，例子如下：

> 每次随机值都为4

```go
func randThree() {
	for i := 0; i < 10; i++ {
		rand.Seed(10)
		fmt.Print(rand.Intn(10))
	}
}
```

根据前面 每轮设置同样的种子 例子可知，对应的随机序列为 4879849558 ，这里每次都设置随机种子，所以每次都是第一次随机，于是都取到了第一个数，即4。



**正确姿势**

想要每次随机值不同，只能每轮设置不同的种子，然后每次随机的时候取随机序列中的不同位置的值。

或者每次随机都设置不同的种子，取随机序列的第一位。

很明显每轮设置不同的种子比较科学。



### 小结

```go
rand.Seed(time.Now().UnixNano())
```

rand.Seed() 方法根据随机种子生成一个随机序列，比如0123456789..

然后每次随机的时候都会从这个序列中取值，比如这里第一次随机值就是0，第二次就是1，以此类推。

指定的种子一致，或者不指定种子(即使用默认值)都会导致生成的随机序列相同。

因此虽然每次遍历的的值不同，但是整个序列必定是相同的。即知道第一个数之后肯定能猜到后续的随机数。



推荐使用方式：

* 1）**全局设定一个随机种子**。这样程序运行时获取到的随机数都是不一样的。重启后设定了另一个随机种子，所以整个随机序列又会不一样了。
* 2）每次都设定不同的随机种子。可以但没必要，如果高并发的情况下可能会出现相同的值。



**建议：程序启动时初始化设定一次随机种子即可，比如直接把当前纳秒时间戳当做随机数种子。**





## 分析

### 源码

math/rand 源码其实很简单, 就两个比较重要的函数

```go
func (rng *rngSource) Seed(seed int64) {
 rng.tap = 0
 rng.feed = rngLen - rngTap

 //...
 x := int32(seed)
 for i := -20; i < rngLen; i++ {
  x = seedrand(x)
  if i >= 0 {
   var u int64
   u = int64(x) << 40
   x = seedrand(x)
   u ^= int64(x) << 20
   x = seedrand(x)
   u ^= int64(x)
   u ^= rngCooked[i]
   rng.vec[i] = u
  }
 }
}
```

这个函数就是在设置 seed, 其实就是对 rng.vec 各个位置设置对应的值. rng.vec 的长度为 607.

```go
func (rng *rngSource) Uint64() uint64 {
 rng.tap--
 if rng.tap < 0 {
  rng.tap += rngLen
 }

 rng.feed--
 if rng.feed < 0 {
  rng.feed += rngLen
 }

 x := rng.vec[rng.feed] + rng.vec[rng.tap]
 rng.vec[rng.feed] = x
 return uint64(x)
}
```

我们在使用不管调用 Intn(), Int31n() 等其他函数, 最终调用到就是这个函数. 可以看到每次调用就是利用 rng.feed、rng.tap 从 rng.vec 中取到两个值相加的结果返回了. 同时还是这个结果又重新放入 rng.vec.

在这里需要注意使用 rng.go 的 rngSource 时, 由于 rng.vec 在获取随机数时会同时设置 rng.vec 的值, 当多 goroutine 同时调用时就会有数据竞争问题. math/rand 采用在调用 rngSource 时加锁  sync.Mutex 解决.

```go
func (r *lockedSource) Uint64() (n uint64) {
 r.lk.Lock()
 n = r.src.Uint64()
 r.lk.Unlock()
 return
}
```

另外我们能直接使用 `rand.Seed()`, `rand.Intn(100)`, 是因为 math/rand 初始化了一个全局的 globalRand 变量.

```go
var globalRand = New(&lockedSource{src: NewSource(1).(*rngSource)})

func Seed(seed int64) { globalRand.Seed(seed) }

func Uint32() uint32 { return globalRand.Uint32() }
```

需要注意到由于调用 rngSource 加了锁, 所以直接使用 `rand.Int32()` 会导致全局的 goroutine 锁竞争, 所以在高并发场景时, 当你的程序的性能是卡在这里的话, 你需要考虑利用 `New(&lockedSource{src: NewSource(1).(*rngSource)})` 为不同的模块生成单独的 rand. 不过根据目前的实践来看, 使用全局的 globalRand 锁竞争并没有我们想象中那么激烈.  使用 New 生成新的 rand 里面是有坑的, 开篇的 panic 就是这么产生的, 后面具体再说.



### 种子的作用

在使用 math/rand 的时候, 一定需要通过调用 rand.Seed 来设置种子, 其实就是给 rng.vec 的 607 个槽设置对应的值. 通过上面的源码那可以看出来, rand.Seed 会调用一个 seedrand 的函数, 来计算对应槽的值.

```go
func seedrand(x int32) int32 {
 const (
  A = 48271
  Q = 44488
  R = 3399
 )

 hi := x / Q
 lo := x % Q
 x = A*lo - R*hi
 if x < 0 {
  x += int32max
 }
 return x
}
```

> 这个函数的计算结果并不是随机的, 而是根据 seed 实际算出来的. 另外这个函数并不是随便写的, 是有相关的数学证明的.

这也导致了相同的 seed, 最终设置到 rng.vec里面的值是相同的, 通过 Intn 取出的也是相同的值



### 加锁

为什么 math/rand 需要加锁呢?

大家都知道 math/rand 是伪随机的, 但是在设置完 seed 后, rng.vec 数组的值基本上就确定下来了, 这明显就不是随机了, 为了增加随机性, 通过 Uint64() 获取到随机数后, 还会重新去设置 rng.vec. 由于存在并发获取随机数的需求, 也就有了并发设置 rng.vec 的值, 所以需要对 rng.vec 加锁保护.