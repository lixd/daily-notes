本章主要演示以下 cgroups 下各个 subsystem 的作用。

根据难易程度，依次演示了 pids 、cpu 和 memory 3 个 subsystem 的使用。



## 1. pids

**pids subsystem 功能是限制cgroup及其所有子孙cgroup里面能创建的总的task数量**。

> 注意：这里的task指通过fork和clone函数创建的进程，由于clone函数也能创建线程（在Linux里面，线程是一种特殊的进程），所以这里的task也包含线程，本文统一以进程来代表task，即本文中的进程代表了进程和线程



### 创建子cgroup

创建子cgroup，取名为test

```shell
#进入目录/sys/fs/cgroup/pids/并新建一个目录，即创建了一个子cgroup
lixd  /home/lixd $ cd /sys/fs/cgroup/pids
lixd  /sys/fs/cgroup/pids $ sudo mkdir test
```

再来看看test目录下的文件

```shell
lixd  /sys/fs/cgroup/pids $ cd test
#除了上一篇中介绍的那些文件外，多了两个文件
 lixd  /sys/fs/cgroup/pids/test $ ls
cgroup.clone_children  cgroup.procs  notify_on_release  pids.current  pids.events  pids.max  tasks
```

下面是这两个文件的含义：

* pids.current: 表示当前cgroup及其所有子孙cgroup中现有的总的进程数量
* pids.max: 当前cgroup及其所有子孙cgroup中所允许创建的总的最大进程数量



### 限制进程数

首先是将当前bash加入到cgroup中，并修改`pids.max`的值，为了便于测试，这里就限制为1：

```shell
#--------------------------第一个shell窗口----------------------
# 将当前bash进程加入到该cgroup
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/pids/test# echo $$ > cgroup.procs
#将pids.max设置为1，即当前cgroup只允许有一个进程
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/pids/test# echo 1 > pids.max
```



由于 bash 已经占用了一个进程，所以此时 bash 中已经无法创建新的进程了：

```shell
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/pids/test# ls
bash: fork: retry: Resource temporarily unavailable
bash: fork: retry: Resource temporarily unavailable
bash: fork: retry: Resource temporarily unavailable
```

创建新进程失败，于是命令运行失败，说明限制生效。

打开另一个 shell 查看

```shell
 lixd  /mnt/c/Users/意琦行 $ cd /sys/fs/cgroup/pids/test
 lixd  /sys/fs/cgroup/pids/test $ ls
cgroup.clone_children  cgroup.procs  notify_on_release  pids.current  pids.events  pids.max  tasks
 lixd  /sys/fs/cgroup/pids/test $ cat pids.current
1
```

果然，pids.current 为 1，已经到 pids.max 的限制了。



### 当前cgroup和子cgroup之间的关系

当前cgroup中的pids.current和pids.max代表了当前cgroup及所有子孙cgroup的所有进程，所以子孙cgroup中的pids.max大小不能超过父cgroup中的大小。

**如果子cgroup中的pids.max设置的大于父cgroup里的大小，会怎么样？**

答案是子cgroup中的进程不光受子cgroup限制，还要受其父cgroup的限制。



```shell
#继续使用上面的两个窗口
#--------------------------第二个shell窗口----------------------
#将pids.max设置成2
dev@dev:/sys/fs/cgroup/pids/test$ echo 2 > pids.max
#在test下面创建一个子cgroup
dev@dev:/sys/fs/cgroup/pids/test$ mkdir subtest
dev@dev:/sys/fs/cgroup/pids/test$ cd subtest/
#将subtest的pids.max设置为5
dev@dev:/sys/fs/cgroup/pids/test/subtest$ echo 5 > pids.max
#将当前bash进程加入到subtest中
dev@dev:/sys/fs/cgroup/pids/test/subtest$ echo $$ > cgroup.procs
#--------------------------第三个shell窗口----------------------
#重新打开一个bash窗口，看一下test和subtest里面的数据
#test里面的数据如下：
dev@dev:~$ cd /sys/fs/cgroup/pids/test
dev@dev:/sys/fs/cgroup/pids/test$ cat pids.max
2
#这里为2表示目前test和subtest里面总的进程数为2
dev@dev:/sys/fs/cgroup/pids/test$ cat pids.current
2
dev@dev:/sys/fs/cgroup/pids/test$ cat cgroup.procs
3083

#subtest里面的数据如下：
dev@dev:/sys/fs/cgroup/pids/test$ cat subtest/pids.max
5
dev@dev:/sys/fs/cgroup/pids/test$ cat subtest/pids.current
1
dev@dev:/sys/fs/cgroup/pids/test$ cat subtest/cgroup.procs
3185
#--------------------------第一个shell窗口----------------------
#回到第一个窗口，随便运行一个命令，由于test里面的pids.current已经等于pids.max了，
#所以创建新进程失败，于是命令运行失败，说明限制生效
dev@dev:/sys/fs/cgroup/pids/test$ ls
-bash: fork: retry: No child processes
-bash: fork: retry: No child processes
-bash: fork: retry: No child processes
-bash: fork: retry: No child processes
-bash: fork: Resource temporarily unavailable
#--------------------------第二个shell窗口----------------------
#回到第二个窗口，随便运行一个命令，虽然subtest里面的pids.max还大于pids.current，
#但由于其父cgroup “test”里面的pids.current已经等于pids.max了，
#所以创建新进程失败，于是命令运行失败，说明子cgroup中的进程数不仅受自己的pids.max的限制，还受祖先cgroup的限制
dev@dev:/sys/fs/cgroup/pids/test/subtest$ ls
-bash: fork: retry: No child processes
-bash: fork: retry: No child processes
-bash: fork: retry: No child processes
-bash: fork: retry: No child processes
-bash: fork: Resource temporarily unavailable
```



### pids.current > pids.max的情况

并不是所有情况下都是pids.max >= pids.current，在下面两种情况下，会出现pids.max < pids.current 的情况：

* 设置pids.max时，将其值设置的比pids.current小
* 将其他进程加入到当前cgroup有可能会导致pids.current > pids.max
  * 因为 pids.max 只会在当前cgroup中的进程fork、clone的时候生效，将其他进程加入到当前cgroup时，不会检测pids.max，所以可能触发这种情况



### 小结

总的来说，pids subsystem 是比较简单的。



## 2. cpu

在cgroup里面，跟CPU相关的子系统有 [cpusets](https://www.kernel.org/doc/Documentation/cgroup-v1/cpusets.txt)、[cpuacct ](https://www.kernel.org/doc/Documentation/cgroup-v1/cpuacct.txt)和 [cpu](https://www.kernel.org/doc/Documentation/scheduler/sched-bwc.txt)。

* 其中 cpuset 主要用于设置 CPU 的亲和性，可以限制 cgroup 中的进程只能在指定的 CPU 上运行，或者不能在指定的 CPU上运行，同时 cpuset 还能设置内存的亲和性。设置亲和性一般只在比较特殊的情况才用得着，所以这里不做介绍。

* cpuacct 包含当前 cgroup 所使用的 CPU 的统计信息，信息量较少，有兴趣可以去看看它的文档，这里不做介绍。

本节只介绍 cpu 子系统，包括怎么限制 cgroup 的 CPU 使用上限及相对于其它 cgroup 的相对值。



### 创建子 cgroup

通用是创建子目录即可。

```bash
#进入/sys/fs/cgroup/cpu并创建子cgroup
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/cpu# cd /sys/fs/cgroup/cpu
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/cpu# mkdir test
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/cpu# cd test/
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/cpu/test# ls
cgroup.clone_children  cpu.cfs_period_us  cpu.rt_period_us   cpu.shares  notify_on_release
cgroup.procs           cpu.cfs_quota_us   cpu.rt_runtime_us  cpu.stat    tasks
```

看起来文件比 memory subsystem 还是少一些。

**cpu.cfs_period_us & cpu.cfs_quota_us**：两个文件配合起来设置CPU的使用上限，两个文件的单位都是微秒（us）。

* cfs_period_us：用来配置时间周期长度
  * 取值范围为1毫秒（ms）到1秒（s）
* cfs_quota_us：用来配置当前cgroup在设置的周期长度内所能使用的CPU时间数
  * 取值大于1ms即可
  * 默认值为 -1，表示不受cpu时间的限制。

**cpu.shares**用来设置CPU的相对值（比例），并且是针对所有的CPU（内核），默认值是1024。

> 假如系统中有两个cgroup，分别是A和B，A的shares值是1024，B的shares值是512，那么A将获得1024/(1204+512)=66%的CPU资源，而B将获得33%的CPU资源。

shares有两个特点：

- 如果A不忙，没有使用到66%的CPU时间，那么剩余的CPU时间将会被系统分配给B，即B的CPU使用率可以超过33%
- 如果添加了一个新的cgroup C，且它的shares值是1024，那么A的限额变成了1024/(1204+512+1024)=40%，B的变成了20%

从上面两个特点可以看出：

- 在闲的时候，shares基本上不起作用，只有在CPU忙的时候起作用，这是一个优点。
- 由于shares是一个绝对值，需要和其它cgroup的值进行比较才能得到自己的相对限额，而在一个部署很多容器的机器上，cgroup的数量是变化的，所以这个限额也是变化的，自己设置了一个高的值，但别人可能设置了一个更高的值，所以这个功能没法精确的控制CPU使用率。



**cpu.stat**包含了下面三项统计结果：

- nr_periods： 表示过去了多少个cpu.cfs_period_us里面配置的时间周期
- nr_throttled： 在上面的这些周期中，有多少次是受到了限制（即cgroup中的进程在指定的时间周期中用光了它的配额）
- throttled_time: cgroup中的进程被限制使用CPU持续了多长时间(纳秒)



### 演示

```shell
#继续使用上面创建的子cgroup： test
#设置只能使用1个cpu的20%的时间
dev@ubuntu:/sys/fs/cgroup/cpu,cpuacct/test$ sudo sh -c "echo 50000 > cpu.cfs_period_us"
dev@ubuntu:/sys/fs/cgroup/cpu,cpuacct/test$ sudo sh -c "echo 10000 > cpu.cfs_quota_us"

#将当前bash加入到该cgroup
dev@ubuntu:/sys/fs/cgroup/cpu,cpuacct/test$ echo $$
5456
dev@ubuntu:/sys/fs/cgroup/cpu,cpuacct/test$ sudo sh -c "echo 5456 > cgroup.procs"

#在bash中启动一个死循环来消耗cpu，正常情况下应该使用100%的cpu（即消耗一个内核）
dev@ubuntu:/sys/fs/cgroup/cpu,cpuacct/test$ while :; do echo test > /dev/null; done

#--------------------------重新打开一个shell窗口----------------------
#通过top命令可以看到5456的CPU使用率为20%左右，说明被限制住了
#不过这时系统的%us+%sy在10%左右，那是因为我测试的机器上cpu是双核的，
#所以系统整体的cpu使用率为10%左右
dev@ubuntu:~$ top
Tasks: 139 total,   2 running, 137 sleeping,   0 stopped,   0 zombie
%Cpu(s):  5.6 us,  6.2 sy,  0.0 ni, 88.2 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
KiB Mem :   499984 total,    15472 free,    81488 used,   403024 buff/cache
KiB Swap:        0 total,        0 free,        0 used.   383332 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
 5456 dev       20   0   22640   5472   3524 R  20.3  1.1   0:04.62 bash

#这时可以看到被限制的统计结果
dev@ubuntu:~$ cat /sys/fs/cgroup/cpu,cpuacct/test/cpu.stat
nr_periods 1436
nr_throttled 1304
throttled_time 51542291833
```



```shell
# cfs_period_us 值为 10W
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/cpu/test# cat cpu.cfs_period_us
100000
# 往 cfs_quota_us 写入 20000，即限制只能使用20%cpu
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/cpu/test# echo 20000 > cpu.cfs_quota_us

# 新开一个窗口，运行一个死循环
$ while : ; do : ; done &
[1] 519
# top 看一下 cpu 占用率，果然是100%了

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
  519 lixd      25   5   13444   2912      0 R 100.0   0.0   0:05.66 zsh   
  

# 回到第一个shell窗口，限制当前进程的cpu使用率
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/cpu/test# echo 519 >> cgroup.procs

# 再切回第二个窗口，发现519进程的cpu已经降到20%了，说明限制生效了
  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
  519 lixd      25   5   13444   2912      0 R  20.0   0.0   0:31.86 zsh  
  
# 查看被限制的统计结果
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/cpu/test# cat cpu.stat
nr_periods 2090
nr_throttled 2088
throttled_time 166752684900
```



### 小结

使用 cgroup 限制 CPU 的使用率比较纠结，用 cfs_period_us & cfs_quota_us 吧，限制死了，没法充分利用空闲的 CPU，用 shares 吧，又没法配置百分比，极其难控制。总之，使用 cgroup 的 cpu 子系统需谨慎。





## 3. memory

相比之下 memory subsystem 就要复杂许多。



**为什么需要内存控制**

- 站在一个普通Linux开发者的角度，如果能控制一个或者一组进程所能使用的内存数，那么就算代码有bug，内存泄漏也不会对系统造成影响，因为可以设置内存使用量的上限，当到达这个值之后可以将进程重启。
- 站在一个系统管理者的角度，如果能限制每组进程所能使用的内存量，那么不管程序的质量如何，都能将它们对系统的影响降到最低，从而保证整个系统的稳定性。

**内存控制能控制些什么？**

- 限制cgroup中所有进程所能使用的物理内存总量
- 限制cgroup中所有进程所能使用的物理内存+交换空间总量(CONFIG_MEMCG_SWAP)： 一般在server上，不太会用到swap空间，所以不在这里介绍这部分内容。
- 限制cgroup中所有进程所能使用的内核内存总量及其它一些内核资源(CONFIG_MEMCG_KMEM)： 限制内核内存有什么用呢？其实限制内核内存就是限制当前cgroup所能使用的内核资源，比如进程的内核栈空间，socket所占用的内存空间等，通过限制内核内存，当内存吃紧时，可以阻止当前cgroup继续创建进程以及向内核申请分配更多的内核资源。由于这块功能被使用的较少，本篇中也不对它做介绍。



### 创建子cgroup

在/sys/fs/cgroup/memory下创建一个子目录即创建了一个子cgroup



```shell
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory# cd /sys/fs/cgroup/memory
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory# mkdir test
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory# ls test/
cgroup.clone_children           memory.kmem.tcp.max_usage_in_bytes  memory.oom_control
cgroup.event_control            memory.kmem.tcp.usage_in_bytes      memory.pressure_level
cgroup.procs                    memory.kmem.usage_in_bytes          memory.soft_limit_in_bytes
memory.failcnt                  memory.limit_in_bytes               memory.stat
memory.force_empty              memory.max_usage_in_bytes           memory.swappiness
memory.kmem.failcnt             memory.memsw.failcnt                memory.usage_in_bytes
memory.kmem.limit_in_bytes      memory.memsw.limit_in_bytes         memory.use_hierarchy
memory.kmem.max_usage_in_bytes  memory.memsw.max_usage_in_bytes     notify_on_release
memory.kmem.tcp.failcnt         memory.memsw.usage_in_bytes         tasks
memory.kmem.tcp.limit_in_bytes  memory.move_charge_at_immigrate
```

从上面ls的输出可以看出，除了每个cgroup都有的那几个文件外，和memory相关的文件还不少,这里先做个大概介绍(kernel相关的文件除外)，后面会详细介绍每个文件的作用：

```shell
 cgroup.event_control       #用于eventfd的接口
 memory.usage_in_bytes      #显示当前已用的内存
 memory.limit_in_bytes      #设置/显示当前限制的内存额度
 memory.failcnt             #显示内存使用量达到限制值的次数
 memory.max_usage_in_bytes  #历史内存最大使用量
 memory.soft_limit_in_bytes #设置/显示当前限制的内存软额度
 memory.stat                #显示当前cgroup的内存使用情况
 memory.use_hierarchy       #设置/显示是否将子cgroup的内存使用情况统计到当前cgroup里面
 memory.force_empty         #触发系统立即尽可能的回收当前cgroup中可以回收的内存
 memory.pressure_level      #设置内存压力的通知事件，配合cgroup.event_control一起使用
 memory.swappiness          #设置和显示当前的swappiness
 memory.move_charge_at_immigrate #设置当进程移动到其他cgroup中时，它所占用的内存是否也随着移动过去
 memory.oom_control         #设置/显示oom controls相关的配置
 memory.numa_stat           #显示numa相关的内存
```



### 添加进程

也是往cgroup中添加进程只要将进程号写入cgroup.procs就可以了。

```shell
#重新打开一个shell窗口，避免相互影响
root@DESKTOP-9K4GB6E:~# cd /sys/fs/cgroup/memory/test/
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# echo $$ >> cgroup.procs
#运行top命令，这样这个cgroup消耗的内存会多点，便于观察
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# top
# 后续操作不再在这个窗口进行，避免在这个bash中运行进程影响cgropu里面的进程数及相关统计
```



### 设置限额

设置限额很简单，写文件memory.limit_in_bytes就可以了。

* echo 1M > memory.limit_in_bytes：限制只能用1M内存
* echo -1 > memory.limit_in_bytes：-1则是不限制

```shell
#回到第一个shell窗口
#开始设置之前，看看当前使用的内存数量，这里的单位是字节
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# cat memory.usage_in_bytes
2379776
#设置1M的限额
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# echo 1M > memory.limit_in_bytes
#设置完之后记得要查看一下这个文件，因为内核要考虑页对齐, 所以生效的数量不一定完全等于设置的数量
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# cat memory.usage_in_bytes
950272
#如果不再需要限制这个cgroup，写-1到文件memory.limit_in_bytes即可
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# echo -1 > memory.limit_in_bytes
#这时可以看到limit被设置成了一个很大的数字
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# cat memory.limit_in_bytes
9223372036854771712
```



**如果设置的限额比当前已经使用的内存少呢？**

```shell
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# free -h
              total        used        free      shared  buff/cache   available
Mem:          7.7Gi       253Mi       7.4Gi       0.0Ki        95Mi       7.3Gi
Swap:         2.0Gi       0.0Ki       2.0Gi
# 此时用了 1232K
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# cat memory.usage_in_bytes
1232896
# 限制成500K
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# echo 500k > memory.limit_in_bytes
# 再次查看发现现在只用了401K
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# cat memory.usage_in_bytes
401408
# 发现swap多了1M，说明另外的数据被转移到swap上了
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# free -h
              total        used        free      shared  buff/cache   available
Mem:          7.7Gi       254Mi       7.4Gi       0.0Ki        94Mi       7.3Gi
Swap:         2.0Gi       1.0Mi       2.0Gi
#这个时候再来看failcnt，发现有381次之多(隔几秒再看这个文件，发现次数在增长)
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# cat memory.failcnt
381
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# cat memory.failcnt
385

#再看看memory.stat（这里只显示部分内容），发现物理内存用了400K，
#但有很多pgmajfault以及pgpgin和pgpgout，说明发生了很多的swap in和swap out
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# cat memory.stat
swap 946176 # 946K 差不多刚好是内存中少的量
pgpgin 30492
pgpgout 30443
pgfault 23859
pgmajfault 12507
```

从上面的结果可以看出，当物理内存不够时，就会触发memory.failcnt里面的数量加1，但进程不会被kill掉，那是因为内核会尝试将物理内存中的数据移动到swap空间中，从而让内存分配成功。



**如果设置的限额过小，就算swap out部分内存后还是不够会怎么样？**

```shell
#--------------------------第一个shell窗口----------------------
# 限制到100k
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# echo 100K > memory.limit_in_bytes

#--------------------------第二个shell窗口----------------------
# 尝试执行 top 发现刚运行就被Kill了
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# top
Killed
```



从上面的这些测试可以看出，一旦设置了内存限制，将立即生效，并且当物理内存使用量达到limit的时候，memory.failcnt的内容会加1，但这时进程不一定就会

被kill掉，内核会尽量将物理内存中的数据移到swap空间上去，如果实在是没办法移动了（设置的limit过小，或者swap空间不足），默认情况下，就会kill掉

cgroup里面继续申请内存的进程。





### 触发控制

通过修改`memory.oom_control`文件，可以控制 subsystem 在物理内存达到上限时的行为。文件中包含以下3个参数：

* oom_kill_disable：是否启用 oom kill
  * 0：关闭
  * 1：开启
* under_oom：表示当前是否已经进入oom状态，也即是否有进程被暂停了。
* oom_kill：oom 后是否执行 kill
  * 1：启动，oom 后直接 kill 掉对应进程
  * 2：关闭：当内核无法给进程分配足够的内存时，将会暂停该进程直到有空余的内存之后再继续运行。同时会更新 under_oom 状态
  * 注意：root cgroup的oom killer是不能被禁用的

为了演示OOM-killer的功能，创建了下面这样一个程序，用来向系统申请内存，它会每秒消耗1M的内存。

```go
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#define MB (1024 * 1024)

int main(int argc, char *argv[])
{
    char *p;
    int i = 0;
    while(1) {
        p = (char *)malloc(MB);
        memset(p, 0, MB);
        printf("%dM memory allocated\n", ++i);
        sleep(1);
    }

    return 0;
}
```

保存上面的程序到文件`~/mem-allocate.c`，然后编译并测试



```shell
#--------------------------第一个shell窗口----------------------
#编译上面的文件
dev@dev:/sys/fs/cgroup/memory/test$ gcc ~/mem-allocate.c -o ~/mem-allocate
#设置内存限额为5M
dev@dev:/sys/fs/cgroup/memory/test$ sudo sh -c "echo 5M > memory.limit_in_bytes"
#将当前bash加入到test中，这样这个bash创建的所有进程都会自动加入到test中
dev@dev:/sys/fs/cgroup/memory/test$ sudo sh -c "echo $$ >> cgroup.procs"
#默认情况下，memory.oom_control的值为0，即默认启用oom killer
dev@dev:/sys/fs/cgroup/memory/test$ cat memory.oom_control
oom_kill_disable 0
under_oom 0
#为了避免受swap空间的影响，设置swappiness为0来禁止当前cgroup使用swap
dev@dev:/sys/fs/cgroup/memory/test$ sudo sh -c "echo 0 > memory.swappiness"
#当分配第5M内存时，由于总内存量超过了5M，所以进程被kill了
dev@dev:/sys/fs/cgroup/memory/test$ ~/mem-allocate
1M memory allocated
2M memory allocated
3M memory allocated
4M memory allocated
Killed

#设置oom_control为1，这样内存达到限额的时候会暂停
dev@dev:/sys/fs/cgroup/memory/test$ sudo sh -c "echo 1 >> memory.oom_control"
#跟预期的一样，程序被暂停了
dev@dev:/sys/fs/cgroup/memory/test$ ~/mem-allocate
1M memory allocated
2M memory allocated
3M memory allocated
4M memory allocated

#--------------------------第二个shell窗口----------------------
#再打开一个窗口
dev@dev:~$ cd /sys/fs/cgroup/memory/test/
#这时候可以看到memory.oom_control里面under_oom的值为1，表示当前已经oom了
dev@dev:/sys/fs/cgroup/memory/test$ cat memory.oom_control
oom_kill_disable 1
under_oom 1
#修改test的额度为7M
dev@dev:/sys/fs/cgroup/memory/test$ sudo sh -c "echo 7M > memory.limit_in_bytes"

#--------------------------第一个shell窗口----------------------
#再回到第一个窗口，会发现进程mem-allocate继续执行了两步，然后暂停在6M那里了
dev@dev:/sys/fs/cgroup/memory/test$ ~/mem-allocate
1M memory allocated
2M memory allocated
3M memory allocated
4M memory allocated
5M memory allocated
6M memory allocated

```





```shell
# 创建上面的文件并编译
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# vim ~/mem-allocate.c
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# gcc ~/mem-allocate.c -o ~/mem-allocate
# 限制5M的上限
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# echo 5M > memory.limit_in_bytes
#将当前bash加入到test中，这样这个bash创建的所有进程都会自动加入到test中
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# echo $$ >> cgroup.procs
#默认情况下，会启用oom killer
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# cat memory.oom_control
oom_kill_disable 0
under_oom 0
oom_kill 1
#为了避免受swap空间的影响，设置swappiness为0来禁止当前cgroup使用swap
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# echo 0 > memory.swappiness
#当分配第5M内存时，由于总内存量超过了5M，所以进程被kill了
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# ~/mem-allocate
1M memory allocated
2M memory allocated
3M memory allocated
4M memory allocated
Killed
#设置oom_control为1，这样内存达到限额的时候会暂停
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# echo 1 >> memory.oom_control
#跟预期的一样，程序被暂停了
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# ~/mem-allocate
1M memory allocated
2M memory allocated
3M memory allocated
4M memory allocated

#--------------------------第二个shell窗口----------------------
#再打开一个窗口
dev@dev:~$ cd /sys/fs/cgroup/memory/test/
#这时候可以看到memory.oom_control里面under_oom的值为1，表示当前已经oom了
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# cat memory.oom_control
oom_kill_disable 1
under_oom 1
oom_kill 2
#修改test的额度为7M
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# echo 7M > memory.limit_in_bytes

# 切换会第一个窗口，发送程序又跑了两步，停在了6M
root@DESKTOP-9K4GB6E:/sys/fs/cgroup/memory/test# ~/mem-allocate
1M memory allocated
2M memory allocated
3M memory allocated
4M memory allocated
5M memory allocated
6M memory allocated
```



### 其他

#### 进程迁移（migration）

当一个进程从一个cgroup移动到另一个cgroup时，默认情况下，该进程已经占用的内存还是统计在原来的cgroup里面，不会占用新cgroup的配额，但新分配的内存会统计到新的cgroup中（包括swap out到交换空间后再swap in到物理内存中的部分）。

我们可以通过设置memory.move_charge_at_immigrate让进程所占用的内存随着进程的迁移一起迁移到新的cgroup中。

```bash
enable： echo 1 > memory.move_charge_at_immigrate
disable：echo 0 > memory.move_charge_at_immigrate
```

> 注意: 就算设置为1，但如果不是thread group的leader，这个task占用的内存也不能被迁移过去。换句话说，如果以线程为单位进行迁移，必须是进程的第一个线程，如果以进程为单位进行迁移，就没有这个问题。

当memory.move_charge_at_immigrate被设置成1之后，进程占用的内存将会被统计到目的cgroup中，如果目的cgroup没有足够的内存，系统将尝试回收目的cgroup的部分内存（和系统内存紧张时的机制一样，删除不常用的file backed的内存或者swap out到交换空间上，请参考[Linux内存管理](https://segmentfault.com/a/1190000008125006)），如果回收不成功，那么进程迁移将失败。

> 注意：迁移内存占用数据是比较耗时的操作。



#### 移除cgroup

当memory.move_charge_at_immigrate为0时，就算当前cgroup中里面的进程都已经移动到其它cgropu中去了，由于进程已经占用的内存没有被统计过去，当前cgroup有可能还占用很多内存，当移除该cgroup时，占用的内存需要统计到谁头上呢？答案是依赖memory.use_hierarchy的值，如果该值为0，将会统计到root cgroup里；如果值为1，将统计到它的父cgroup里面。

**force_empty**

当向memory.force_empty文件写入0时（echo 0 > memory.force_empty），将会立即触发系统尽可能的回收该cgroup占用的内存。该功能主要使用场景是移除cgroup前（cgroup中没有进程），先执行该命令，可以尽可能的回收该cgropu占用的内存，这样迁移内存的占用数据到父cgroup或者root cgroup时会快些。



**memory.swappiness**

该文件的值默认和全局的swappiness（/proc/sys/vm/swappiness）一样，修改该文件只对当前cgroup生效，其功能和全局的swappiness一样，请参考[Linux交换空间](https://segmentfault.com/a/1190000008125116)中关于swappiness的介绍。

> 注意：有一点和全局的swappiness不同，那就是如果这个文件被设置成0，就算系统配置的有交换空间，当前cgroup也不会使用交换空间。



**memory.use_hierarchy**

该文件内容为0时，表示不使用继承，即父子cgroup之间没有关系；当该文件内容为1时，子cgroup所占用的内存会统计到所有祖先cgroup中。

如果该文件内容为1，当一个cgroup内存吃紧时，会触发系统回收它以及它所有子孙cgroup的内存。

> 注意: 当该cgroup下面有子cgroup或者父cgroup已经将该文件设置成了1，那么当前cgroup中的该文件就不能被修改。

```bash
#当前cgroup和父cgroup里都是1
dev@dev:/sys/fs/cgroup/memory/test$ cat memory.use_hierarchy
1
dev@dev:/sys/fs/cgroup/memory/test$ cat ../memory.use_hierarchy
1

#由于父cgroup里面的值为1，所以修改当前cgroup的值失败
dev@dev:/sys/fs/cgroup/memory/test$ sudo sh -c "echo 0 > ./memory.use_hierarchy"
sh: echo: I/O error

#由于父cgroup里面有子cgroup（至少有当前cgroup这么一个子cgroup），
#修改父cgroup里面的值也失败
dev@dev:/sys/fs/cgroup/memory/test$ sudo sh -c "echo 0 > ../memory.use_hierarchy"
sh: echo: I/O error
```



**memory.soft_limit_in_bytes**

有了hard limit（memory.limit_in_bytes），为什么还要soft limit呢？hard limit是一个硬性标准，绝对不能超过这个值，而soft limit可以被超越，既然能被超越，要这个配置还有啥用？先看看它的特点

1. 当系统内存充裕时，soft limit不起任何作用
2. 当系统内存吃紧时，系统会尽量的将cgroup的内存限制在soft limit值之下（内核会尽量，但不100%保证）

从它的特点可以看出，它的作用主要发生在系统内存吃紧时，如果没有soft limit，那么所有的cgroup一起竞争内存资源，占用内存多的cgroup不会让着内存占用少的cgroup，这样就会出现某些cgroup内存饥饿的情况。如果配置了soft limit，那么当系统内存吃紧时，系统会让超过soft limit的cgroup释放出超过soft limit的那部分内存（有可能更多），这样其它cgroup就有了更多的机会分配到内存。

从上面的分析看出，这其实是系统内存不足时的一种妥协机制，给次等重要的进程设置soft limit，当系统内存吃紧时，把机会让给其它重要的进程。

> 注意： 当系统内存吃紧且cgroup达到soft limit时，系统为了把当前cgroup的内存使用量控制在soft limit下，在收到当前cgroup新的内存分配请求时，就会触发回收内存操作，所以一旦到达这个状态，就会频繁的触发对当前cgroup的内存回收操作，会严重影响当前cgroup的性能。



**memory.pressure_level**

这个文件主要用来监控当前cgroup的内存压力，当内存压力大时（即已使用内存快达到设置的限额），在分配内存之前需要先回收部分内存，从而影响内存分配速度，影响性能，而通过监控当前cgroup的内存压力，可以在有压力的时候采取一定的行动来改善当前cgroup的性能，比如关闭当前cgroup中不重要的服务等。目前有三种压力水平：

* low
  * 意味着系统在开始为当前cgroup分配内存之前，需要先回收内存中的数据了，这时候回收的是在磁盘上有对应文件的内存数据。

* medium
  * 意味着系统已经开始频繁为当前cgroup使用交换空间了。

* critical
  * 快撑不住了，系统随时有可能kill掉cgroup中的进程。



如何配置相关的监听事件呢？和memory.oom_control类似，大概步骤如下：

1. 利用函数eventfd(2)创建一个event_fd
2. 打开文件memory.pressure_level，得到pressure_level_fd
3. 往cgroup.event_control中写入这么一串：`<event_fd> <pressure_level_fd> <level>`
4. 然后通过读event_fd得到通知

> 注意： 多个level可能要创建多个event_fd，好像没有办法共用一个（本人没有测试过）



**Memory thresholds**

我们可以通过cgroup的事件通知机制来实现对内存的监控，当内存使用量穿过（变得高于或者低于）我们设置的值时，就会收到通知。使用方法和memory.oom_control类似，大概步骤如下：

1. 利用函数eventfd(2)创建一个event_fd
2. 打开文件memory.usage_in_bytes，得到usage_in_bytes_fd
3. 往cgroup.event_control中写入这么一串：`<event_fd> <usage_in_bytes_fd> <threshold>`
4. 然后通过读event_fd得到通知



**stat file**

这个文件包含的统计项比较细，需要一些内核的内存管理知识才能看懂，这里就不介绍了（怕说错）。详细信息可以参考[Memory Resource Controller](https://www.kernel.org/doc/Documentation/cgroup-v1/memory.txt)中的“5.2 stat file”。这里有几个需要注意的地方：

- 里面total开头的统计项包含了子cgroup的数据（前提条件是memory.use_hierarchy等于1）。
- 里面的'rss + file_mapped"才约等于是我们常说的RSS（ps aux命令看到的RSS）
- 文件（动态库和可执行文件）及共享内存可以在多个进程之间共享，不过它们只会统计到他们的owner cgroup中的file_mapped去。（不确定是怎么定义owner的，但如果看到当前cgroup的file_mapped值很小，说明共享的数据没有算到它头上，而是其它的cgroup）



### 小结

本节没有介绍 swap 和 kernel 相关的内容，不过在实际使用过程中一定要留意 swap 空间，如果系统使用了交换空间，那么设置限额时一定要注意一点，那就是当 cgroup 的物理空间不够时，内核会将不常用的内存 swap out 到交换空间上，从而导致一直不触发 oom killer，而是不停的 swap out／in，导致 cgroup 中的进程运行速度很慢。

如果一定要用交换空间，最好的办法是限制 swap+物理内存 的额度，虽然我们在这篇中没有介绍这部分内容，但其使用方法和限制物理内存是一样的，只是换做写文件 memory.memsw.limit_in_bytes 罢了。



## 4. 参考

[cgroups(7) — Linux manual page](https://man7.org/linux/man-pages/man7/cgroups.7.html)

[美团技术团队---Linux资源管理之cgroups简介](https://tech.meituan.com/2015/03/31/cgroups.html)

[Red Hat---资源管理指南](https://access.redhat.com/documentation/zh-cn/red_hat_enterprise_linux/7/html/resource_management_guide/chap-introduction_to_control_groups)
