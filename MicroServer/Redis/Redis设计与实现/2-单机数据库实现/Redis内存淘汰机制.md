# Redis **内存淘汰机制** 

## 1. 过期策略

内存淘汰机制前需要先了解一下Redis的`过期策略`。

**Redis**的过期策略，是有**定期删除+惰性删除**两种。

定期好理解，默认100ms就随机抽一些设置了过期时间的key，去检查是否过期，过期了就删了。

**为啥不扫描全部设置了过期时间的key呢？ **

假如Redis里面所有的key都有过期时间，都扫描一遍？那太恐怖了，而且我们线上基本上也都是会设置一定的过期时间的。全扫描跟你去查数据库不带where条件不走索引全表扫描一样，100ms一次，Redis累都累死了。

**如果一直没随机到很多key，里面不就存在大量的无效key了？ **

好问题，**惰性删除**，见名知意，惰性嘛，我不主动删，我懒，我等你来查询了我看看你过期没，过期就删了还不给你返回，没过期该怎么样就怎么样。

**最后就是如果的如果，定期没删，我也没查询，那可咋整？**

所以就需要内存淘汰机制了

## 2. 内存淘汰机制

**noeviction**:返回错误当内存限制达到并且客户端尝试执行会让更多内存被使用的命令（大部分的写入指令，但DEL和几个例外）

**allkeys-lru**: 尝试回收最少使用的键（LRU），使得新添加的数据有空间存放。

**volatile-lru**: 尝试回收最少使用的键（LRU），但仅限于在过期集合的键,使得新添加的数据有空间存放。

**allkeys-random**: 回收随机的键使得新添加的数据有空间存放。

**volatile-random**: 回收随机的键使得新添加的数据有空间存放，但仅限于在过期集合的键。

**volatile-ttl**: 回收在过期集合的键，并且优先回收存活时间（TTL）较短的键,使得新添加的数据有空间存放。

如果没有键满足回收的前提条件的话，策略**volatile-lru**, **volatile-random**以及**volatile-ttl**就和noeviction 差不多了。

 在我看来按选择时考虑三个因素：随机、Key最近被访问的时间 、Key的过期时间(TTL) 



### Redis中LRU策略的实现

#### 方案一

LRU啊，记录下每个key 最近一次的访问时间（比如unix timestamp），unix timestamp最小的Key，就是最近未使用的，把这个Key移除。看下来一个HashMap就能搞定啊。是的，但是首先需要存储每个Key和它的timestamp。其次，还要比较timestamp得出最小值。代价很大，不现实啊。 

#### 方案二

第二种方法：换个角度，不记录具体的访问时间点(unix timestamp)，而是记录idle time：idle time越小，意味着是最近被访问的。

 用一个双向链表(linkedlist)把所有的Key链表起来，如果一个Key被访问了，将就这个Key移到链表的表头，而要移除Key时，直接从表尾移除。 



#### redis方案一

 但是在redis中，并没有采用这种方式实现，它嫌`LinkedList占用的空间太大了`。Redis并不是直接基于字符串、链表、字典等数据结构来实现KV数据库，而是在这些数据结构上创建了一个对象系统Redis Object。

在redisObject结构体中定义了一个长度24bit的`unsigned`类型的字段，用来存储对象`最后一次被命令程序访问的时间`：

毕竟，并不需要一个完全准确的LRU算法，就算移除了一个最近访问过的Key，影响也不太。 

最初Redis是这样实现的：

随机选三个Key，把idle time最大的那个Key移除。后来，把3改成可配置的一个参数，默认为N=5：`maxmemory-samples 5`

 就是这么简单，简单得让人不敢相信了，而且十分有效。但它还是有缺点的：每次随机选择的时候，并没有利用**历史信息**。在每一轮移除(evict)一个Key时，随机从N个里面选一个Key，移除idle time最大的那个Key；下一轮又是随机从N个里面选一个Key...有没有想过：在上一轮移除Key的过程中，其实是知道了N个Key的idle time的情况的，那我能不能在下一轮移除Key时，利用好上一轮知晓的一些信息？ 

#### redis方案二

于是Redis又做出了`改进`：采用缓冲池(pooling)

当每一轮移除Key时，拿到了这个N个Key的idle time，如果它的idle time比 pool 里面的 Key的idle time还要大，就把它添加到pool里面去。这样一来，每次移除的Key并不仅仅是随机选择的N个Key里面最大的，而且还是pool里面idle time最大的，并且：pool 里面的Key是经过多轮比较筛选的，它的idle time 在概率上比随机获取的Key的idle time要大，可以这么理解：pool 里面的Key 保留了"历史经验信息"。



采用"pool"，把一个全局排序问题 转化成为了 局部的比较问题。(尽管排序本质上也是比较，囧)。要想知道idle time 最大的key，精确的LRU需要对全局的key的idle time排序，然后就能找出idle time最大的key了。但是可以采用一种近似的思想，即随机采样(samping)若干个key，这若干个key就代表着全局的key，把samping得到的key放到pool里面，每次采样之后更新pool，使得pool里面总是保存着随机选择过的key的idle time最大的那些key。需要evict key时，直接从pool里面取出idle time最大的key，将之evict掉。这种思想是很值得借鉴的。



### Redis中的LFU策略

redis4.0中新增了LFU策略。

LFU算法的思路是： 我们记录下来每个（被缓存的/出现过的）数据的请求频次信息，如果一个请求的请求次数多，那么它就很可能接着被请求。

在数据请求模式比较稳定（没有对于某个数据突发的高频访问这样的不稳定模式）的情况下，LFU的表现还是很不错的。在数据的请求模式大多不稳定的情况下，LFU一般会有这样一些问题：

* 1）微博热点数据一般只是几天内有较高的访问频次，过了这段时间就没那么大意义去缓存了。但是因为在热点期间他的频次被刷上去了，之后很长一段时间内很难被淘汰；
* 2）如果采用只记录缓存中的数据的访问信息，新加入的高频访问数据在刚加入的时候由于没有累积优势，很容易被淘汰掉；
* 3）如果记录全部出现过的数据的访问信息，会占用更多的内存空间。

#### 近似计数算法

Redis记录访问次数使用了一种近似计数算法——`Morris算法`。Morris算法利用随机算法来增加计数，在Morris算法中，计数不是真实的计数，它代表的是实际计数的量级。

算法的思想是这样的：算法在需要增加计数的时候通过随机数的方式计算一个值来判断是否要增加，算法控制 **在计数越大的时候，得到结果“是”的几率越小**

这个算法的特点是能够用一个较小的数表示一个很大的量级，所以对于Redis来说统计频次不需要太多空间和内容，只需要一个不那么大的数就行（这个特性解决了前面说的LFU的常见问题3）。

。正好，Redis的LRU算法实现里，用了一个24位的`redisObject->lru`字段，拿到LFU中正好合用。Redis没有全部用掉这24位，只拿了其中8位用来做计数，剩下的16位另作别用。

```sh
 *          16 bits      8 bits
 *     +----------------+--------+
 *     + Last decr time | LOG_C  |
 *     +----------------+--------+
```

8个bit位最大为255，从Redis文档中贴出来的数据（如下表）可以看到，不同的factor的值能够控制计数代表的量级的范围，当factor为100时，能够最大代表10M，也就是千万级别的命中数。

| factor | 100hits | 1000 hits | 100k hits | 1M hit | 10M hits |
| ------ | ------- | --------- | --------- | ------ | -------- |
| 0      | 104     | 255       | 255       | 255    | 255      |
| 1      | 18      | 49        | 255       | 255    | 255      |
| 10     | 10      | 18        | 142       | 255    | 255      |
| 100    | 8       | 11        | 49        | 143    | 255      |



redis中访问计数并不是只增不减的，对于长时间未访问的数据,会逐步降低其访问计数,这样就解决了问题一。

同时对于新插入的数据默认访问计数是从5开始的，这样就保证了不会刚加进来访问计数还是0，然后下一秒就被移除了，问题二也解决了。



#### 具体实现

Redis中关于缓存淘汰的核心源码都在evict.c文件中，其中实现LFU的主要方法是：LFUGetTimeInMinutes、LFUTimeElapsed、LFULogIncr、LFUDecrAndReturn。下面具体来说：

Redis中实现LFU算法的时候，有这个两个重要的可配置参数：

server.lfu_log_factor : 能够影响计数的量级范围，即上表中的factor参数；
server.lfu_decay_time: 控制LFU计数衰减的参数。

##### 访问计数

```c
/* Logarithmically increment a counter. The greater is the current counter value
 * the less likely is that it gets really implemented. Saturate it at 255. */
uint8_t LFULogIncr(uint8_t counter) {
    if (counter == 255) return 255;
    double r = (double)rand()/RAND_MAX;
    double baseval = counter - LFU_INIT_VAL;
    if (baseval < 0) baseval = 0;
    double p = 1.0/(baseval*server.lfu_log_factor+1);
    if (r < p) counter++;
    return counter;
}
```

其中比较重要的两个数分别是`r`和`p`，他们的大小关系决定本次counter是否增加

```c
if (r < p) counter++;
```

首先是判断到255了就不加了

```c
 if (counter == 255) return 255;
```

然后随机得到r,可以看出取值是在0~1之间

```c
double r = (double)rand()/RAND_MAX;
```

接着计算p

```c
    double baseval = counter - LFU_INIT_VAL;
    if (baseval < 0) baseval = 0;
    double p = 1.0/(baseval*server.lfu_log_factor+1);
```

`LFU_INIT_VAL`就是前面说的新插入数据的初识counter，默认为5.

可以看出当counter衰减之后(即小于初始值5)再次访问时counter是必定会增加的。

然后设置的`lfu_log_facto`越大p就越小，counter增加得就越慢。

##### 计数初值

Redis中在创建新对象的时候，它的LFU计数值不是从0开始的，这个在`createObject`（`object.c`文件中）方法中能看到。当使用LFU的时候，它的lru值是这样初始化的：

```c
        o->lru = (LFUGetTimeInMinutes()<<8) | LFU_INIT_VAL;
```

初始计数值会直接就是LFU_INIT_VAL，也就是5，这点就是为了解决前头说到的LFU算法的第常见问题2：新增的缓存可能还没开始累积优势就被淘汰了。给新增缓存一个5的计数值，那么至少能保证新增缓存比真正冷（计数值低于5）的数据要晚淘汰。

可是初始计数值就是从5开始的，为什么会有出现计数值低于5的数据呢？这是Redis为了解决LFU解决前头说的常见问题1引入的手段 – 计数衰减。


##### 计数衰减

在缓存被访问时，会更新数据的访问计数，更新的步骤是：先在现有数据的计数上进行计数衰减，再对完成衰减后的计数进行增加。

```c
/* Return the current time in minutes, just taking the least significant
 * 16 bits. The returned time is suitable to be stored as LDT (last decrement
 * time) for the LFU implementation. */
unsigned long LFUGetTimeInMinutes(void) {
    return (server.unixtime/60) & 65535;
}

/* Given an object last access time, compute the minimum number of minutes
 * that elapsed since the last access. Handle overflow (ldt greater than
 * the current 16 bits minutes time) considering the time as wrapping
 * exactly once. */
unsigned long LFUTimeElapsed(unsigned long ldt) {
    unsigned long now = LFUGetTimeInMinutes();
    if (now >= ldt) return now-ldt;
    return 65535-ldt+now;
}

/* If the object decrement time is reached decrement the LFU counter but
 * do not update LFU fields of the object, we update the access time
 * and counter in an explicit way when the object is really accessed.
 * And we will times halve the counter according to the times of
 * elapsed time than server.lfu_decay_time.
 * Return the object frequency counter.
 *
 * This function is used in order to scan the dataset for the best object
 * to fit: as we check for the candidate, we incrementally decrement the
 * counter of the scanned objects if needed. */
unsigned long LFUDecrAndReturn(robj *o) {
    unsigned long ldt = o->lru >> 8;
    unsigned long counter = o->lru & 255;
    unsigned long num_periods = server.lfu_decay_time ? LFUTimeElapsed(ldt) / server.lfu_decay_time : 0;
    if (num_periods)
        counter = (num_periods > counter) ? 0 : counter - num_periods;
    return counter;
}

```

前面说到过Redis是使用原来用于LRU的24位的redisObject->lru中的8位来进行计数的，剩下的16位另作它用 – 用于计数值的衰减。开头说的Redis配置项 – server.lfu_decay_time，也是用于控制计数的衰减的。

server.lfu_decay_time 的代表的含义是计数衰减的周期长度，单位是分钟。当时间过去一个周期，计数值就会减1。（按照源码中注释说的，当计数值大于两倍的COUNTER_INIT_VAL时，计数值是以减半进行衰减的，小于两倍的COUNTER_INIT_VAL时每次减一。但是现在从源码看来都是直接减一的，应该这块之前这么弄有问题所以改了，注释没改）

衰减周期的计算就是redisObject->lru中那16位，它记录的就是上次进行衰减的时间。衰减周期数就等于从上次衰减到现在经过的时间除以衰减周期长度 server.lfu_decay_time。

```c
    unsigned long num_periods = server.lfu_decay_time ? LFUTimeElapsed(ldt) / server.lfu_decay_time : 0;
```

##### 具体执行

使用LFU方式进行缓存缓存淘汰，其实和使用LRU方式的执行过程基本完全一致，只是把idle换成了 255 - counter。

也是pool那一套逻辑。