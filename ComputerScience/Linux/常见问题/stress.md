# Stress

## 1. 概述

stress是Linux的一个压力测试工具，可以对CPU、Memory、IO、磁盘进行压力测试。

安装

```sh
$ sudo yum install stress
```

命令 

`stress [OPTION [ARG]]`

* -c, --cpu N
  * 产生N个进程，每个进程都循环调用sqrt函数产生CPU压力。
* -i, --io N
  * 产生N个进程，每个进程循环调用sync将内存缓冲区内容写到磁盘上，产生IO压力。
  * 通过系统调用sync刷新内存缓冲区数据到磁盘中，以确保同步。如果缓冲区内数据较少，写到磁盘中的数据也较少，不会产生IO压力。在SSD磁盘环境中尤为明显，很可能iowait总是0，却因为大量调用系统调用sync，导致系统CPU使用率sys 升高。
* -m, --vm N
  * 产生N个进程，每个进程循环调用malloc/free函数分配和释放内存。
  *  --vm-bytes B：指定分配内存的大小
  *   --vm-stride B：不断的给部分内存赋值，让COW(Copy On Write)发生
  *   --vm-hang N ：指示每个消耗内存的进程在分配到内存后转入睡眠状态N秒，然后释放内存，一直重复执行这个过程
  * -vm-keep：一直占用内存不释放，区别于不断的释放和重新分配(默认是不断释放并重新分配内存)
* -d, --hdd N
  * 产生N个不断执行write和unlink函数的进程(创建文件，写入内容，删除文件)
  *  --hdd-bytes B：指定文件大小
  *  --hdd-noclean：不要将写入随机ASCII数据的文件Unlink
* -t, --timeout N：在N秒后结束程序 
* --backoff N：等待N微秒后开始运行
* -q, --quiet：程序在运行的过程中不输出信息
* -n, --dry-run：输出程序会做什么而并不实际执行相关的操作
* --version：显示版本号
  * -v, --verbose：显示详细的信息



## 2. 常用命令 

### 1. CPU测试

```sh
stress -c 2 --timeout 60s
```

开启2个CPU进程执行sqrt计算，60秒后结束。

会有两个 CPU 跑满。

> 可以使用 top mpstat 等命令查看

```sh
$ mpstat -P ALL 1 10
01:36:05 PM  CPU    %usr   %nice    %sys %iowait    %irq   %soft  %steal  %guest  %gnice   %idle
01:36:06 PM  all   58.08    0.00    1.01    0.00    0.00    0.00    0.00    0.00    0.00   40.91
01:36:06 PM    0   22.22    0.00    3.03    0.00    0.00    0.00    0.00    0.00    0.00   74.75
01:36:06 PM    1  100.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00
01:36:06 PM    2  100.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00    0.00
01:36:06 PM    3    8.25    0.00    1.03    0.00    0.00    0.00    0.00    0.00    0.00   90.72
```



### 2. 内存测试

```sh
stress --vm 2 --vm-bytes 1G --vm-hang 100 --timeout 100s
```

开启2个进程分配内存，每次分配1GB内存，保持100秒后释放，100秒后退出。

> 可以使用 top free  vmstat 等命令查看

```sh
$ free -h
              total        used        free      shared  buff/cache   available
Mem:           7.6G        4.8G        2.1G         35M        737M        2.4G
Swap:            0B          0B          0B

$ vmstat -S m 1 10
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 1  0      0   2269     49    735    0    0    26    23    0    0  2  1 97  0  0
 0  0      0   2269     50    735    0    0   112     0 1324 1866  3  1 96  0  0
 0  0      0   2268     50    735    0    0     0    40 2686 3681  6  1 93  0  0
 0  0      0   2269     50    735    0    0     0    64 2202 2913  5  1 94  0  0
```



### 3.  IO测试

#### -i

```sh
stress -i 2 --timeout 60s
```

开启2个IO进程，执行sync系统调用，刷新内存缓冲区到磁盘。

> 可以通过iotop、iostat、vmstat 等命令查看

```sh
$ vmstat 1 10
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 2  1      0 4279996  68512 743204    0    0    26    23    0    0  2  1 97  0  0
 0  2      0 4279644  68772 743192    0    0     0   692 15078 32269  2 38 50 10  0
 2  0      0 4275560  69052 743196    0    0     0   696 15553 31915  9 36 46  9  0
 2  0      0 4277552  69304 743192    0    0     0   632 16578 35725  1 39 52  8  0
 2  0      0 4277720  69564 743188    0    0     0   616 15969 33925  9 39 44  7  0
 1  1      0 4278168  69800 743204    0    0     4   576 14831 32531  1 38 53  8  0

```

可以看到 wa 列有升高，但是不多。

```sh
$ iotop
Total DISK READ :	0.00 B/s | Total DISK WRITE :     298.94 K/s
Actual DISK READ:	0.00 B/s | Actual DISK WRITE:     672.61 K/s
  TID  PRIO  USER     DISK READ  DISK WRITE  SWAPIN     IO>    COMMAND                                                          1060 be/4 root        0.00 B/s    0.00 B/s  0.00 % 28.93 % stress -i 2 --timeout 60s
 1059 be/4 root        0.00 B/s    0.00 B/s  0.00 % 16.38 % stress -i 2 --timeout 60s
```

iotop中IO压力也不大。

因为：stress -i参数表示通过系统调用sync来模拟IO问题，但sync是刷新内存缓冲区数据到磁盘中，以确保同步。

**如果内存缓冲区内没多少数据，读写到磁盘中的数据也就不多，没法产生IO压力**。使用SSD磁盘的环境中尤为明显，iowait一直为0，但因为大量系统调用，导致系统CPU使用率sys升高。



#### -hdd

```sh
stress --io 2 --hdd 2 --timeout 60s
```

开启2个IO进程，2个磁盘IO进程。

```sh
$ vmstat 1 10
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 1  3      0 2228216 100116 2754024    0    0    26    23    0    0  2  1 97  0  0
 0  3      0 2117164 100140 2862852    0    0    24 216520 3020 10198  6  3 34 57  0
 0  3      0 2066280 100148 2916020    0    0     8 184976 6422 13288  5  3 28 65  0
 0  4      0 2069792 100156 2916040    0    0     8 193988 5361 10240  3  2 17 78  0
 0  3      0 2062736 100160 2916060    0    0     4 171400 2125 5457  5  3 21 72  0
 0  3      0 2063508 100172 2916072    0    0    12 212616 1793 5607  1  2 25 72  0
$ iostat -xdm 1 10
Linux 3.10.0-957.21.3.el7.x86_64 (iZ2ze9ebgot9h2acvk4uabZ) 	02/23/2021 	_x86_64_	(4 CPU)

Device:         rrqm/s   wrqm/s     r/s     w/s    rMB/s    wMB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
vda               0.03     6.44    2.17    7.92     0.10     0.09    39.53     0.09   12.74   30.36    7.92   0.63   0.64

Device:         rrqm/s   wrqm/s     r/s     w/s    rMB/s    wMB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
vda               0.00     0.00    0.00  352.00     0.00   165.54   963.14   118.18  636.50    0.00  636.50   2.62  92.40

Device:         rrqm/s   wrqm/s     r/s     w/s    rMB/s    wMB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
vda               0.00     0.00    0.00  384.00     0.00   180.92   964.92   121.64  663.00    0.00  663.00   2.48  95.10

Device:         rrqm/s   wrqm/s     r/s     w/s    rMB/s    wMB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
vda               0.00     0.00    0.00  333.00     0.00   156.55   962.83   103.79  677.88    0.00  677.88   2.44  81.20

$ iotop
Total DISK READ :       3.33 M/s | Total DISK WRITE :      903.91 M/s
Actual DISK READ:       3.33 M/s | Actual DISK WRITE:     367.74 M/s
  TID  PRIO  USER     DISK READ  DISK WRITE  SWAPIN     IO>    COMMAND                                                       
 1253 be/4 root        0.00 B/s   548.26 M/s  0.00 % 98.94 % stress --io 2 --hdd 2 --timeout 60s
 1255 be/4 root        0.00 B/s   345.65 M/s  0.00 % 96.85 % stress --io 2 --hdd 2 --timeout 60s
 
```

可以看到，压力比之前`-i`时有明显升高。



### 4. 磁盘IO测试

```sh
stress --hdd 2 --hdd-bytes 10G
```

开启2个磁盘IO进程，每次写10GB数据到磁盘。



```sh
$ iostat -xdm 1 10
```



## 3. 常见场景

### 1.CPU密集型

* Load Average 高
* CPU 高
* iowait/wa 低

说明是CPU密集型场景，进程使用CPU密集导致CPU使用率变高、系统平均负载变高。

如果 Tasks.running 高则说明同时有多个进程在竞争CPU。



### 2.IO密集型

* Load Average 高
* CPU 低
* iowait/wa 高

说明是IO密集型场景，进程频繁进行IO操作，导致系统平均负载很高而CPU使用率不高。





