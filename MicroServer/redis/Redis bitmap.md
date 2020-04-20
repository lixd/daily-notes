# Redis Bitmap

## 1. 概述

BitMap，即位图，其实也就是 byte 数组，用二进制表示，只有 0 和 1 两个数字。

底层使用SDS存储。

## 2. API



```sh
#对key所存储的字符串值，获取指定偏移量上的位（bit）
getbit key offset

# 对key所存储的字符串值，设置或清除指定偏移量上的位（bit） 1. 返回值为该位在setbit之前的值 2. value只能取0或1 3. offset从0开始，即使原位图只能10位，offset可以取1000
setbit key offset value

#获取位图指定范围中位值为1的个数 如果不指定start与end，则取所有
bitcount key [start end]

#做多个BitMap的and（交集）、or（并集）、not（非）、xor（异或）操作并将结果保存在destKey中
bitop op destKey key1 [key2...]

#计算位图指定范围第一个偏移量对应的的值等于targetBit的位置 1. 找不到返回-1 2. start与end没有设置，则取全部 3. targetBit只能取0或者1
bitpos key tartgetBit [start end]
```



## 3. 基本使用

主要使用`bitmap`来实现布隆过滤。



* 1.根据hash算法确定key要映射到哪些bit上(一般为多个,越多冲突越小)
* 2.setbit 将对于的bit全置为1
* 3.查询时同样先hash,如果对应的映射不是都为1则说明该key一定不存在，都为1则说明可能存在。



## 4. 实例

```go
package main

import (
	"github.com/go-redis/redis"
	"github.com/sirupsen/logrus"
	"i-go/utils/hash"
)

type redisBloomFilter struct {
	bf *hash.BloomFilter
	rc *redis.Client
}

func NewBloomFilter(m, k uint, rc *redis.Client) *redisBloomFilter {
	bf := hash.NewBloomFilterHash(m, k)
	return &redisBloomFilter{bf: bf,
		rc: rc}
}

// Set 将data添加到当前key中
func (rbf *redisBloomFilter) Set(key string, data []byte) {
	bloomHash := rbf.bf.BloomHash(data)
	cmders, err := rbf.rc.Pipelined(func(pipeLiner redis.Pipeliner) error {
		for _, v := range bloomHash {
			pipeLiner.SetBit(key, int64(v), 1)
		}
		return nil
	})
	if err != nil {
		logrus.WithFields(logrus.Fields{"scenes": "bloom filter SetBit"}).Error(err)
	}
	logrus.Infof("pipeLine setBit res:%v", cmders)

}

// isContains 检测当前key中是否存在data
func (rbf *redisBloomFilter) isContains(key string, data []byte) bool {
	bloomHash := rbf.bf.BloomHash(data)
	cmders, err := rbf.rc.Pipelined(func(pipeLiner redis.Pipeliner) error {
		for _, v := range bloomHash {
			pipeLiner.GetBit(key, int64(v))
		}
		return nil
	})
	if err != nil {
		logrus.WithFields(logrus.Fields{"scenes": "bloom filter GetBit error"}).Error(err)
		return false
	}
	logrus.Infof("pipeLine GetBit res:%v", cmders)
	for _, v := range cmders {
		// 这里需要转成对应类型
		if v.(*redis.IntCmd).Val() != 1 {
			return false
		}
	}
	return true
}

```

