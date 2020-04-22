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

### 1. bitmap实现

在官方提供插件之前一般是用bitmap实现的。

大致思路如下：

* 1.将要存入的数进行多次hash 得到多个值(降低冲突)
* 2.将bitmap中的对应位置置为1
* 3.查询时则同样进行hash 然后看bitmap中对应位置是否都为1
* 4.都为1则说明可能存在 不都为1则一定不存在

### 2. 官方插件

Redis4.0版本正式提供了布隆过滤插件使用。

需要服务器和客户端同时支持。



下载插件

```sh
https://github.com/RedisBloom/RedisBloom
```

解压并make 生成.so库

```sh
tar -zxvf v2.2.2.tar.gz
make
```

在redis配置文件(redis.conf)中加入该模块

```sh
#####################MODULES####################                                                                                                                      # Load modules at startup. If the server is not able to load modules
 
# it will abort. It is possible to use multiple loadmodule directives.
#加载BloomFilter模块
loadmodule /usr/local/soft/RedisBloom-2.2.2/redisbloom.so
```

重启redis即可。

检查是否安装成功

```sh
127.0.0.1:6379> bf.add users illusory
 
(integer) 1
 
127.0.0.1:6379> bf.exists users illusory
 
(integer) 1
 
127.0.0.1:6379> bf.exists users illusoryNew
 
(integer) 0
```

### 6. API

```sh
# 创建一个Filter 可以看成是创建一个数组
bf.reserve key error_rate initial_size
# 添加
bf.add key value
#判断是否存在
bf.exists key value
bf.madd key value1[value2...]
bf.mexists key value1[value2...]
```





