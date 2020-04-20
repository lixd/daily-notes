# Redis 进阶

## 1. Hyperloglog



 HyperLogLog 是用来做基数统计的算法，HyperLogLog 的优点是，在输入元素的数量或者体积非常非常大时，计算基数所需的空间总是固定 的、并且是很小的。

在 Redis 里面，每个 HyperLogLog 键只需要花费 12 KB 内存，就可以计算接近 2^64 个不同元素的基 数。这和计算基数时，元素越多耗费内存就越多的集合形成鲜明对比。

* 基数不大，数据量不大就用不上，会有点大材小用浪费空间
* 有局限性，就是只能统计基数数量，而没办法去知道具体的内容是什么
* 和bitmap相比，属于两种特定统计情况，简单来说，HyperLogLog 去重比 bitmap 方便很多
* 一般可以bitmap和hyperloglog配合使用，bitmap标识哪些用户活跃，hyperloglog计数

## 2. API

```sh
#添加指定元素到 HyperLogLog 中
#影响基数估值则返回1否则返回0
PFADD key element [element ...]

#返回给定 HyperLogLog 的基数估算值。
#白话就叫做去重值 带有 0.81% 标准错误（standard error）的近似值
PFCOUNT key [key ...]

#将多个 HyperLogLog 合并为一个 HyperLogLog
PFMERGE destkey sourcekey [sourcekey ...]
```

## 3. 使用

统计 APP或网页 的一个页面，每天有多少用户点击进入的次数。同一个用户的反复点击进入记为 1 次。

```go
// 判定当前元素是否存在
直接添加PFADD 如果影响基数估值则返回1否则返回0
```



```go
func RedisHyperLogLog() {
	var (
		key    = "clickStatics"
		userId = 10010
	)
	// 删除旧测试数据
	rc.Del(key)
	for i := 10000; i < 10010; i++ {
		rc.PFAdd(key, i)
	}
	// 判定当前元素是否存在
	// PFAdd添加后对基数值产生影响则返回1 否则返回0
	res := rc.PFAdd(key, userId)
	if err := res.Err(); err != nil {
		logrus.Errorf("err :%v", )
		return
	}
	if res.Val() != 1 {
		logrus.Println("该用户已统计")
	} else {
		logrus.Println("该用户未统计")
	}
}
```

## 4. 源码

```cpp
// 密集模式添加元素
int hllDenseAdd(uint8_t *registers, unsigned char *ele, size_t elesize) {
    uint8_t oldcount, count;
    long index;

    // 计算该元素第一个1出现的位置
    count = hllPatLen(ele,elesize,&index);
    // 得到第index个桶内的count值
    HLL_DENSE_GET_REGISTER(oldcount,registers,index);
    if (count > oldcount) {
        // 如果比现有的最大值还大，则添加该值到数据部分
        HLL_DENSE_SET_REGISTER(registers,index,count);
        return 1;
    } else {
        // 如果小于现有的最大值，则不做处理，因为不影响基数
        return 0;
    }
}
// 用于计算hash后的值中，第一个出现1的位置
int hllPatLen(unsigned char *ele, size_t elesize, long *regp) {
    uint64_t hash, bit, index;
    int count;
    // 利用MurmurHash64A哈希函数来计算该元素的hash值
    hash = MurmurHash64A(ele,elesize,0xadc83b19ULL);
    // 计算应该放在哪个桶
    index = hash & HLL_P_MASK;
    // 为了保证循环能够终止
    hash |= ((uint64_t)1<<63); 
    bit = HLL_REGISTERS;
    // 存储第一个1出现的位置
    count = 1;
    // 计算count
    while((hash & bit) == 0) {
        count++;
        bit <<= 1;
    }
    *regp = (int) index;
    return count;
}
```

