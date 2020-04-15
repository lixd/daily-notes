# Redis基础命令

## 0. Key



## 1. String

作为常规的key-value缓存应用

一个键最大能存储512MB

常用的大概有`get`、`set`、`inc`等

```sh
# 可以在设置的同时指定过期时间
SET key value (expire)
GET key
#key不存在才设置 分布式锁
SETNX key value
#所有key都不存在才设置
MSETNX key value[key value...]
#批量get set
MGET key1[key2...]
MSET key1[key2...]
#在原来的值上加或减 key不存在则会初始化为0之后执行 会返回命令执行后的值 只能在integer上操作 
INCR key
INCRBY key inc
INCRBYFLOAT key inc #增加浮点数
DECR key
DECRBY key inc
#字符串末尾追加数据
APPEEND key value
```

## 2. Hash

主要用来存储对象信息

命令都差不多 主要多了个`HLen`、`HKeys`、`HVals`、`HScan`等

常用的`hset`、`hgetall`、`HINCRBY`、`hscan`等

```sh
HSET key field value
HSETNX key field value

HGET key field
HGETALL key field

HMSET key field value[field value...]
HMGET key field[field...]

HDEL key field[field...]
HEXISTS key field

HINCRBY key field inc
HINCRBYFLOAT key field inc
# 获取hash表中字段的数量
HLEN key
# 获取hash表中所有字段
HKEYS key
# 获取hash表中所有值
HVALS key

# 扫描整个hash表 直接用keys命令可能产生阻塞
# cursor填0则表示第一次遍历 从头开始
# MATCH pattern可以模糊匹配
# count表示每次遍历的数量 不是每次返回的数量
HSCAN key cursor [MATCH pattern][Count count]
```



http://doc.redisfans.com/key/scan.html