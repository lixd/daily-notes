# Linux Load Average 过高排查

## 1. 概述

Load表示是Linux系统中对当前CPU工作量的度量，简单来说就是CPU需要运行进程数量的队列长度（不是CPU使用比率，所以值是会大于1）。而Load average则是分别统计系统1分钟、5分钟、15分钟平均Load。

**Linux 上的 load average 除了包括 Running 和 Runnable process 数量之外，还包括 uninterruptible sleep 的进程数量**。

> 通常等待 I/O 设备、等待网络的时候，进程会处于 uninterruptible sleep 状态。

当平均负载远高于系统CPU数量，则意味系统负载比较重。如果1分钟负载比较低而15分钟负载比较高，则意味着系统负载将降低。反之，则意味着系统负载将越来越高。这时候我们需要关注是否某些进程消耗大量I/O，CPU或者Memory等。
Load Average的评估经常需要和当前系统CPU数量关联起来分析。

> 假设我们的系统是单核的CPU，把它比喻成是一条单向马路，把CPU任务比作汽车。当车占满整个马路的时候 load=1；当车不多的时候，load <1；当马路都站满了，而且马路外还堆满了汽车的时候，load>1。



### Load Average是如何计算出来的

无论是uptime还是top命令输入的load average其实是读取了文件/proc/loadavg:

```
# cat /proc/loadavg
18.60 18.51 17.67 2/178 11202
```



前面三个数字是1、5、15分钟内的平均进程数，第四数字是当前运行的进程数量（分子）和总进程数（分母），第五个数字是最后使用的进程ID。
/proc/loadavg实际上是内核schedule进程更新，通过proc fs 曝露给user的。我们通过查看一下Linux 内核源代码就可以窥探一二Load average是如何计算出来的。
[include/linux/sched/loadavg.h](https://github.com/torvalds/linux/blob/master/include/linux/sched/loadavg.h)定义了一定时间Load Average的计算算法：

```c
#define LOAD_FREQ	(5*HZ+1)	/* 5 sec intervals */
#define EXP_1		1884		/* 1/exp(5sec/1min) as fixed-point */
#define EXP_5		2014		/* 1/exp(5sec/5min) */
#define EXP_15		2037		/* 1/exp(5sec/15min) */

/*
 * a1 = a0 * e + a * (1 - e)
 */
static inline unsigned long
calc_load(unsigned long load, unsigned long exp, unsigned long active)
{
	unsigned long newload;

	newload = load * exp + active * (FIXED_1 - exp);
	if (active >= load)
		newload += FIXED_1-1;

	return newload / FIXED_1;
}
```

[kernel/sched/loadavg.c](https://github.com/torvalds/linux/blob/master/kernel/sched/loadavg.c)计算active task 数量：

```c
long calc_load_fold_active(struct rq *this_rq, long adjust)
{
	long nr_active, delta = 0;

	nr_active = this_rq->nr_running - adjust;
	nr_active += (long)this_rq->nr_uninterruptible;

	if (nr_active != this_rq->calc_load_active) {
		delta = nr_active - this_rq->calc_load_active;
		this_rq->calc_load_active = nr_active;
	}

	return delta;
}
```

更多细节可以通过查看源代码来理解。



## 2. 排查

对于cpu负载的理解，首先需要搞清楚下面几个问题：

* 1）系统load高不一定是性能有问题。
  * 因为Load高也许是因为在进行cpu密集型的计算

* 2）系统Load高不一定是CPU能力问题或数量不够。
  * 因为Load高只是代表需要运行的队列累计过多了。
  * 但队列中的任务实际可能是耗Cpu的，也可能是I/O等其他因素的。

* 3）系统长期Load高，解决办法不是一味地首先增加CPU
  * 因为Load只是表象，不是实质。
  * 增加CPU个别情况下会临时看到Load下降，但治标不治本。
* 4）在Load average 高的情况下需要鉴别系统瓶颈到底是CPU不足，还是io不够快造成或是内存不足造成的。







Load Average 过高一般可以通过以下几个方面进行排查：

* 1）CPU
* 2）Memory
* 3）IO

常用命令：

* top
* vmstat
* iostat



**性能分析信息：**

**IO/CPU/memory连锁反应**
   1.free急剧下降
   2.buff和cache被回收下降，但也无济于事
   3.依旧需要使用大量swap交换分区swpd
   4.等待进程数，b增多
   5.读写IO，bi bo增多
   6.si so大于0开始从硬盘中读取
   7.cpu等待时间用于 IO等待，wa增加
**内存不足**
   1.开始使用swpd，swpd不为0
   2.si so大于0开始从硬盘中读取
**io瓶颈**
  1.读写IO，bi bo增多超过2000
  2.cpu等待时间用于 IO等待，wa增加 超过20
  3.sy 系统调用时间长，IO操作频繁会导致增加 >30%
  4.wa io等待时间长
     iowait% <20%       良好
     iowait% <35%       一般
     iowait% >50%	 差
  5.进一步使用iostat观察
**CPU瓶颈：load,vmstat中r列**
  1.反应为CPU队列长度
  2.一段时间内，CPU正在处理和等待CPU处理的进程数之和，直接反应了CPU的使用和申请情况。
  3.理想的load average：`核数*CPU数*0.7`
     CPU个数：cat /proc/cpuinfo| grep "processor"| wc -l
     核数：grep 'core id' /proc/cpuinfo | sort -u | wc -l
  4.超过这个值就说明已经是CPU瓶颈了
**CPU瓶颈**
  1.us 用户CPU时间高超过90%



## 3. 常用命令

### top

```sh
[root@localhost ~]# top
top - 12:13:22 up 167 days, 20:47,  2 users,  load average: 0.00, 0.01, 0.05
Tasks: 272 total,   1 running, 271 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.0 us,  0.1 sy,  0.0 ni, 99.9 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
KiB Mem : 65759080 total, 58842616 free,   547908 used,  6368556 buff/cache
KiB Swap:  2097148 total,  2097148 free,        0 used. 64264884 avail Mem
................
 
对上面第三行的解释：
us（user cpu time）：用户态使用的cpu时间比
sy（system cpu time）：系统态使用的cpu时间比
ni（user nice cpu time）：用做nice加权的进程分配的用户态cpu时间比
id（idle cpu time）：空闲的cpu时间比
wa（io wait cpu time）：cpu等待磁盘写入完成时间
hi（hardware irq）：硬中断消耗时间
si（software irq）：软中断消耗时间
st（steal time）：虚拟机偷取时间
 
以上解释的这些参数的值加起来是100%。
```



### vmstat

```sh
4）vmstat
[root@localhost ~]# vmstat
procs -----------memory---------------------swap-------io---------system--------cpu-----
r  b      swpd   free    buff   cache    si   so    bi    bo     in   cs     us sy id wa st
3  0      0      1639792 724280 4854236  0    0     4     34     4    0      19 45 35  0  0
 
解释说明：
-----------------------------
procs部分的解释
r 列表示运行和等待cpu时间片的进程数，如果长期大于1，说明cpu不足，需要增加cpu。
b 列表示在等待资源的进程数，比如正在等待I/O、或者内存交换等。
-----------------------------
cpu部分的解释
us 列显示了用户方式下所花费 CPU 时间的百分比。us的值比较高时，说明用户进程消耗的cpu时间多，但是如果长期大于50%，需要考虑优化用户的程序。
sy 列显示了内核进程所花费的cpu时间的百分比。这里us + sy的参考值为80%，如果us+sy 大于 80%说明可能存在CPU不足。
wa 列显示了IO等待所占用的CPU时间的百分比。这里wa的参考值为30%，如果wa超过30%，说明IO等待严重，这可能是磁盘大量随机访问造成的，也可能磁盘或者
   磁盘访问控制器的带宽瓶颈造成的(主要是块操作)。
id 列显示了cpu处在空闲状态的时间百分比
-----------------------------
system部分的解释
in 列表示在某一时间间隔中观测到的每秒设备中断数。
cs列表示每秒产生的上下文切换次数，如当 cs 比磁盘 I/O 和网络信息包速率高得多，都应进行进一步调查。
-----------------------------
memory部分的解释
swpd 切换到内存交换区的内存数量(k表示)。如果swpd的值不为0，或者比较大，比如超过了100m，只要si、so的值长期为0，系统性能还是正常
free 当前的空闲页面列表中内存数量(k表示)
buff 作为buffer cache的内存数量，一般对块设备的读写才需要缓冲。
cache: 作为page cache的内存数量，一般作为文件系统的cache，如果cache较大，说明用到cache的文件较多，如果此时IO中bi比较小，说明文件系统效率比较好。
-----------------------------
swap部分的解释
si 由内存进入内存交换区数量。
so由内存交换区进入内存数量。
-----------------------------
IO部分的解释
bi 从块设备读入数据的总量（读磁盘）（每秒kb）。
bo 块设备写入数据的总量（写磁盘）（每秒kb）
```



### iostat

```sh
6）可以使用iostat查看IO负载
[root@localhost ~]# iostat 1 1
Linux 2.6.32-696.16.1.el6.x86_64 (nc-ftp01.kevin.cn)    2017年12月29日     _x86_64_    (4 CPU)
 
avg-cpu:  %user   %nice %system %iowait  %steal   %idle
          19.32    0.00   45.44    0.06    0.26   34.93
 
Device:            tps   Blk_read/s   Blk_wrtn/s   Blk_read   Blk_wrtn
xvda             14.17        29.94       265.17   63120486  558975100

解释说明：
avg-cpu: 总体cpu使用情况统计信息，对于多核cpu，这里为所有cpu的平均值
%user: 在用户级别运行所使用的CPU的百分比.
%nice: nice操作所使用的CPU的百分比.
%sys: 在系统级别(kernel)运行所使用CPU的百分比.
%iowait: CPU等待硬件I/O时,所占用CPU百分比.
%idle: CPU空闲时间的百分比.

Device段:各磁盘设备的IO统计信息
tps: 每秒钟发送到的I/O请求数.
Blk_read /s: 每秒读取的block数.
Blk_wrtn/s: 每秒写入的block数.
Blk_read:   读入的block总数.
Blk_wrtn:  写入的block总数.

[root@localhost ~]# iostat -x -k -d 1
Linux 2.6.32-696.el6.x86_64 (centos6-vm02)  01/04/2018  _x86_64_    (4 CPU)

Device:         rrqm/s   wrqm/s     r/s     w/s    rkB/s    wkB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
scd0              0.00     0.00    0.00    0.00     0.00     0.00     8.00     0.00    0.36    0.36    0.00   0.36   0.00
vda               0.01     0.13    0.04    0.13     0.60     0.89    18.12     0.00    2.78    0.19    3.53   2.55   0.04
dm-0              0.00     0.00    0.04    0.22     0.58     0.88    11.25     0.00    3.27    0.25    3.82   1.61   0.04
dm-1              0.00     0.00    0.00    0.00     0.00     0.00     8.00     0.00    0.13    0.13    0.00   0.04   0.00
dm-2              0.00     0.00    0.00    0.00     0.00     0.00     7.91     0.00    0.19    0.10    5.00   0.16   0.00

解释说明：
rrqm/s: 每秒对该设备的读请求被合并次数，文件系统会对读取同块(block)的请求进行合并
wrqm/s: 每秒对该设备的写请求被合并次数
r/s: 每秒完成的读次数
w/s: 每秒完成的写次数
rkB/s: 每秒读数据量(kB为单位)
wkB/s: 每秒写数据量(kB为单位)
avgrq-sz:平均每次IO操作的数据量(扇区数为单位)
avgqu-sz: 平均等待处理的IO请求队列长度
await: 平均每次IO请求等待时间(包括等待时间和处理时间，毫秒为单位)
svctm: 平均每次IO请求的处理时间(毫秒为单位)
%util: 采用周期内用于IO操作的时间比率，即IO队列非空的时间比率

如果 %util 接近 100%，说明产生的I/O请求太多，I/O系统已经满负荷，该磁盘可能存在瓶颈。
idle小于70% IO压力就较大了,一般读取速度有较多的wait。
同时可以结合vmstat 查看查看b参数(等待资源的进程数)和wa参数(IO等待所占用的CPU时间的百分比,高过30%时IO压力高)
```





## 参考

`https://www.ruanyifeng.com/blog/2011/07/linux_load_average_explained.html`

`https://www.cnblogs.com/machangwei-8/p/10388589.html`

`https://cloud.tencent.com/developer/article/1027288`