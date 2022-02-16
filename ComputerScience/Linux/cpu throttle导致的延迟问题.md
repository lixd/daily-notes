# cpu throttle导致的延迟问题

## 1. 概述

通过 cGroups 限制容器 CPU 使用量时，实际上限制的是对应进程的 CPU 的使用时间。

比如每次 CPU 切换周期为 100ms，**限制该进程只能使用20% CPU 实际是 100ms 的周期内，该进程只能使用 20ms**，而剩下 80ms 该进程无法使用 CPU，一直停在那里。一直到下一个周期时，该进程又可以使用 20ms。



那么问题来了，如果一个请求在21ms是过来，就需要等待80ms才能执行，因此导致接口尾延迟特别高。



内核 CFS 调度是通过 cfs_period 和 cfs_quota 两个参数来管理容器 CPU 时间片消耗的，cfs_period 一般为固定值 100 ms，cfs_quota 对应容器的 CPU Limit。例如对于一个 CPU Limit = 2 的容器，其 cfs_quota 会被设置为 200ms，表示该容器在每 100ms 的时间周期内最多使用 200ms 的 CPU 时间片，即 2 个 CPU 核心。当其 CPU 使用量超出预设的 limit 值时，容器中的进程会受内核调度约束而被限流。细心的应用管理员往往会在集群 Pod 监控中的 CPU Throttle Rate 指标观察到这一特征。



## 参考

[如何合理使用 CPU 管理策略，提升容器性能](https://mp.weixin.qq.com/s/N7UWOjqEnZ8oojWgFGBOlQ)

[cpu throttle原理浅析](https://blog.csdn.net/huang987246510/article/details/118424808)