# Linux iostat

## 1. 概述

```sh
iostat - Report Central Processing Unit (CPU) statistics and input/output statistics for devices and partitions.
```

iostat 主要用于分析系统整体的磁盘IO性能（-d参数），当然也可以查看CPU使用情况（-c参数）。

> iostat属于sysstat软件包。可以用yum install sysstat 直接安装。

它提供了每个磁盘的使用率、IOPS、吞吐量等各种常见的性能指标，当然，这些指标实际上来自  /proc/diskstats。

命令格式：

```sh
iostat[参数][时间][次数]
```



命令参数：

- -C 显示CPU使用情况
- -d 显示磁盘使用情况
- -k 以 KB 为单位显示
- -m 以 M 为单位显示
- -N 显示磁盘阵列(LVM) 信息
- -n 显示NFS 使用情况
- -p[磁盘] 显示磁盘和分区的情况
- -t 显示终端和CPU的信息
- -x 显示详细信息
- -V 显示版本信息



## 2. 指标含义

iostat 的输出界面如下:

```sh
# -dx表示显示所有磁盘I/O的指标
$ iostat -dx 1
Linux 3.10.0-957.21.3.el7.x86_64 (iZ2ze9ebgot9h2acvk4uabZ) 	04/07/2021 	_x86_64_	(4 CPU)

Device:         rrqm/s   wrqm/s     r/s     w/s    rkB/s    wkB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
vda               0.04     6.76    2.30    8.56   108.33   104.04    39.13     0.09   11.66   26.52    7.67   0.64   0.69

Device:         rrqm/s   wrqm/s     r/s     w/s    rkB/s    wkB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
vda               0.00     5.00    0.00   22.00     0.00   108.00     9.82     0.01    0.41    0.00    0.41   0.23   0.50

Device:         rrqm/s   wrqm/s     r/s     w/s    rkB/s    wkB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
vda               0.00     3.00    0.00   23.00     0.00    96.00     8.35     0.01    0.35    0.00    0.35   0.22   0.50

```

各指标具体含义如下：

* rrqm/s、wrqm/s：每秒合并的读、写请求数
  * 当系统调用需要读取数据的时候，VFS将请求发到各个FS，如果FS发现不同的读取请求读取的是相同Block的数据，FS会将这个请求合并Merge
* r/s、w/s :每秒发送给磁盘的读、写请求数（合并之后的请求数）
* rkB/s、wkB/s：每秒从磁盘读取、写入的数据量（单位为KB）
* avgrq-sz：平均请求扇区的大小
* avgqu-sz：平均请求队列的长度
* r_await、w_await：每个读、写请求处理完成的平均等待时间
* await：每个I/O请求的平均处理时间
* svctm：处理I/O请求所需的平均时间
* %util：磁盘处理I/O的时间百分比

这些指标中，你要注意：

* %util  ，就是磁盘 I/O 使用率；
* r/s+  w/s  ，就是 IOPS；
* rkB/s+wkB/s ，就是吞吐量；
* r_await+w_await ，就是响应时间。

根据这些指标基本就能分析出是否存在磁盘I/O问题。



## 3. 常见用法

查看I/O

```sh
iostat -dx 1
```

查看CPU

```sh
iostat -c 1
```

Linux 手册

```sh
man iostat
```

