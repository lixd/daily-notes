---
title: "数据库连接池该怎么设置?记一次由连接池引发的事故。"
description: "数据库连接池对性能的影响及其正确设置姿势"
date: 2021-01-23 22:00:00
draft: false
tags: ["Redis"]
categories: ["Redis"]
---

本文主要记录了一次由 Redis 连接池设置不当引发的事故及其排查和解决过程，同时也记录了数据库连接池的正确设置姿势。

<!--more-->

## 1. 结论

### 内存数据库

像 Redis、Memcache 等内存数据库，因为所有请求直接在内存中完成所以处理速度很快。

具体计算公式如下：

```sh
最大连接数 = 最大并发量 / (1000ms / 每次请求耗时ms)
```

所以我们需要知道集群最大并发量和应用中每次请求Redis来回的耗时。

[Redis官网](https://redis.io/topics/benchmarks) 提供了压测工具。

```sh
root@redis://usr/sbin# redis-benchmark -q -n 100000
PING_INLINE: 66269.05 requests per second
PING_BULK: 68634.18 requests per second
SET: 68399.45 requests per second
GET: 67567.57 requests per second
INCR: 68259.38 requests per second
LPUSH: 67704.80 requests per second
RPUSH: 68259.38 requests per second
LPOP: 68399.45 requests per second
RPOP: 68399.45 requests per second
SADD: 68399.45 requests per second
HSET: 67567.57 requests per second
SPOP: 66844.91 requests per second
LPUSH (needed to benchmark LRANGE): 50505.05 requests per second
LRANGE_100 (first 100 elements): 65146.58 requests per second
LRANGE_300 (first 300 elements): 67204.30 requests per second
LRANGE_500 (first 450 elements): 67340.07 requests per second
LRANGE_600 (first 600 elements): 67294.75 requests per second
MSET (10 keys): 61576.36 requests per second
```

在我自己的小霸王服务器上都能用 六七万并发，所以单节点10W妥妥的有了。

假设每次请求：来回网络延迟 + redis 处理耗时 为 1ms。

那么 最大连接数 = 10W / (1000ms / 1ms) = 100，即同时用 100个连接就能达到 Redis QPS峰值，发挥出全部性能。



**建议：最好能自己测试一下，实在测不了建议设置在 200 作用。**

> 一般 Redis可用连接数都是按W计算的，稍微分配大一点也没什么问题，如果太小了就会无法发挥出 Redis 全部性能。



### 磁盘数据库

像 MySQL、PostgreSQL、Oracle 这样将数据存在磁盘上的数据库，由于磁盘I/O的存在，请求处理比较慢，连接池不能设置得像内存数据库那么大。

PostgreSQL 提供了一个公式：

```sh
connections = ((core_count * 2) + effective_spindle_count)
```

如果说你的服务器 CPU 是 4核 的，连接池大小应该为 `((4*2)+1)=9`。取个整, 我们就设置为 10 吧。

具体测试数据：[HikariCP 测试数据](https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing)



## 2. 问题背景

最近处理了一个线上事故，就是由数据库连接池设置不当引发的。

具体为，某一天的某一个时间点，客户开始反应接口响应很慢：

* 大部分请求会直接阻塞到超时。
* 小部分请求是响应比较慢；

然后就开始了排查之旅。



## 3. 排查过程

### 寻找问题

发现问题后，立马查看了监控、日志、链路追踪信息，具体如下：

**服务器监控**

* CPU、内存 飙升到 80% 左右，平常只有 20~30%
* 负载直接到了 60，还只是4核CPU的机器，可以简单理解为：一般负载超过CPU核数就比较高了。

![ecs-cpu][ecs-cpu]

![ecs-mem][ecs-mem]

![ecs-load][ecs-load]





**日志**

* 服务A：调用服务B超时
* 服务B：调用服务C超时
* 服务C：调用服务N超时 + 小部分 redis: connection pool timeout。
* ...省略部分服务
* 服务N：大量 redis: connection pool timeout



**链路追踪**

* 大部分接口都是到了超时时间(3S)才返回。



### 定位问题

将各个服务日志连起来查看后，问题都指向了 Redis，于是立马去查了 Redis 监控。

结果发现一切正常，然后就去查了 redis 驱动的源码，看下这个错误提示是什么情况下出现的：

```sh
redis: connection pool timeout
```



```go
// Get 函数用于从Pool取一个 conn
func (p *ConnPool) Get() (*Conn, error) {
	if p.closed() {
		return nil, ErrClosed
	}

	err := p.waitTurn()
	if err != nil {
		return nil, err
	}
// 省略
}
```

```go
func (p *ConnPool) waitTurn() error {
   select {
   case p.queue <- struct{}{}:
      return nil
   default:
      timer := timers.Get().(*time.Timer)
      timer.Reset(p.opt.PoolTimeout)

      select {
      case p.queue <- struct{}{}:
         if !timer.Stop() {
            <-timer.C
         }
         timers.Put(timer)
         return nil
      case <-timer.C:
         timers.Put(timer)
         atomic.AddUint32(&p.stats.Timeouts, 1)
         return ErrPoolTimeout
      }
   }
}
```

其中 waitTurn 函数返回的 ErrPoolTimeout 定义如下：

```go
var ErrPoolTimeout = errors.New("redis: connection pool timeout")
```



那么问题就很明显了，从 Redis 连接池里拿 conn 的时候超时，原因可能有下面几个：

* 1）**连接池设置太小**，连接被其他Goroutine拿去使用了，没有来得及归还；
* 2）Redis 性能瓶颈，导致每次请求要很长时间；
* 3）网络延迟过大，同样有可能导致每次请求要很长时间。



由于 Redis 监控一切正常，同时应用是在内网环境，网络延迟也特别低，所以是第一点可能性更高。

然后立马查看了配置文件，果然，Redis 连接池只分配了 10个，然后超时时间居然是 10秒。将 Redis 连接池数量调大之后，一切问题都解决了。



### 具体分析

既然知道问题是 Redis 连接池设置太小了，那么一切都解释得通了。

* 1）连接池过小导致大部分请求阻塞在获取连接这一步，一直阻塞到超时，打印错误日志并返回；
* 2）该超时时间 10s 远大于设置的接口超时时间 3s，所以在阻塞 3s 后时候上游接口已经超时返回了；
* 3）最终导致每个接口需要阻塞3s才返回。
* 4）提现在服务器上就是：CPU、内存、负载飙升。



之前由于并发量不是很高，10 个连接池也刚好能处理过来，最近并发量上升后该问题就暴露出来了。



**为什么有小部分请求能响应？**

由于是部署在 Kubernetes 集群中的，同时为每个 Pod 配置了 资源上限request 和 limit。cpu 都还好，到达上限后只会让应用跑得慢一点。但是内存就不一样了，超过之后直接 OOM，Pod 被强制 KIll 掉。

Pod 重启后最初到达的部分请求可以获取到 Redis 连接，能正常返回。后续请求只能阻塞到超时了。



补上两个 Redis 的 QPS 统计信息：

修改之前：

![redis-qps-old][redis-qps-old]

调整连接池大小后：

![redis-qps-new][redis-qps-new]

可以看到，性能确实是被连接池给限制了，所以出现了这次事故。



## 4. 小结

* 1）连接池对性能影响很大，不能随意设置。
* 2）K8s 中 Pod 资源限制需要合理分配，特别是内存，可以先设置大一点，然后根据统计数据逐渐调整到合适的值。
* 3）APM 系统很重要
  * logging：日志收集系统让你在出问题时不用去每台服务器上慢慢翻日志。
  * tracing：链路追踪系统可以让你清楚的看到系统间各个服务的调用情况。
  * metrics：监控系统各个指标，便于分析问题。
* 4）配置中心：微服务一定要有一个配置中心，统一存放配置，否则很难维护。



## 5. 参考

`https://redis.io/topics/benchmarks`

`https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing`

`https://zhuanlan.zhihu.com/p/105845455`



[ecs-cpu]:https://github.com/lixd/blog/raw/master/images/redis/connections/ecs-cpu.png
[ecs-mem]:https://github.com/lixd/blog/raw/master/images/redis/connections/ecs-mem.png
[ecs-load]:https://github.com/lixd/blog/raw/master/images/redis/connections/ecs-load.png
[redis-qps-old]:https://github.com/lixd/blog/raw/master/images/redis/connections/redis-qps-old.png
[redis-qps-new]:https://github.com/lixd/blog/raw/master/images/redis/connections/redis-qps-new.png

