# 内存大页机制

部分场景下内存大页并不会提升性能，反而会降低性能，所以建议根据情况：**关闭内存大页机制**。

> 一般 Redis MongoDB 都建议关闭。



首先，我们要先排查下内存大页。命令如下:

```sh
cat /sys/kernel/mm/transparent_hugepage/enabled
# [always] 被框起来的这个就是当前的状态
[always] madvise never
```

各选项的含义如下：

* [always] 表示 THP 启用了
* [never] 表示 THP 禁用
* [madvise] 表示（只在MADV_HUGEPAGE标志的VMA中使用 THP



如果执行结果是 always，就表明内存大页机制被启动了；如果是 never，就表示，内存大页机制被禁止。



在实际生产环境中部署时，我建议你不要使用内存大页机制，关闭操作也很简单，只需要执行下面的命令就可以了：

```sh
echo never > /sys/kernel/mm/transparent_hugepage/enabled
cat /sys/kernel/mm/transparent_hugepage/enabled
# 可以看到现在被框起来的是 never 说明修改生效了
always madvise [never]
```



> 但是，这种方式如果重启服务器，进行的配置内容就恢复原状。