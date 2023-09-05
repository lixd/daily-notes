# Stress 模拟 CPU/Mem/IO 压力(负载)

本文主要记录如何使用 Stress 工具在 Linux 中模拟 CPU / Mem / IO / Network 压力,以进行对应测试。



## 安装 & 使用

```Bash
yum install -y epel-release  
yum install stress -y
```

相关参数使用`stress --help` 查看即可：

```Bash
-c, --cpu N            产生 N 个进程，每个进程都反复不停的计算随机数的平方根
-i, --io N             产生 N 个进程，每个进程反复调用 sync () 将内存上的内容写到硬盘上
-m, --vm N             产生 N 个进程，每个进程不断分配和释放内存
--vm-bytes B      指定分配内存的大小
--vm-stride B     不断的给部分内存赋值，让 COW (Copy On Write) 发生
--vm-hang N      指示每个消耗内存的进程在分配到内存后转入睡眠状态 N 秒，然后释放内存，一直重复执行这个过程
--vm-keep          一直占用内存，区别于不断的释放和重新分配 (默认是不断释放并重新分配内存)
-d, --hdd N           产生 N 个不断执行 write 和 unlink 函数的进程 (创建文件，写入内容，删除文件)
--hdd-bytes B  指定文件大小
-t, --timeout N       在 N 秒后结束程序        
--backoff N            等待 N 微妙后开始运行
-q, --quiet           程序在运行的过程中不输出信息
-n, --dry-run          输出程序会做什么而并不实际执行相关的操作
--version              显示版本号-v, --verbose          显示详细的信息
```

## 模拟 CPU 负载

```Bash
# 通过 -c 指定需要占用的核数，会直接占用 100%
stress -c 2
```

没有 stress 也可以使用原生命令来实现。

对随机数进行压缩与解压，需要占用几个核，就指定几组`gzip -9 | gzip -d`。 比如下面这个就会占用 2 个核：

```Bash
# 2 核
cat /dev/urandom | gzip -9 | gzip -d | gzip -9 | gzip -d  > /dev/null

# 4 核心
cat /dev/urandom | gzip -9 | gzip -d | gzip -9 | gzip -d | gzip -9 | gzip -d | gzip -9 | gzip -d  > /dev/null
```

> 测试下来不会占用到 100%，一般是 95% 左右，可以多指定几组`gzip -9 | gzip -d` 来实现 100% 占用。

## 模拟内存负载

> 注意📢：Stress 模拟内存压力同时也会占用 cpu

模拟产生 2 个进程，每个进程分配 1G 内存，持续 30s

```Bash
stress --vm 2 --vm-keep
```

## 模拟磁盘写入

```Bash
stress -d 2
```

## 模拟大量 IO 操作

```Bash
stress -i 2
```