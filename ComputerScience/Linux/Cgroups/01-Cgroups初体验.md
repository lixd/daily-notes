# Cgroups

## 1. 概述

Linux Cgroups 就是 Linux 内核中用来为进程设置资源限制的一个重要功能。

> Linux Cgroups 的全称是 Linux Control Group。

**它最主要的作用，就是限制一个进程组能够使用的资源上限**，包括 CPU、内存、磁盘、网络带宽等等。



在 Linux 中，Cgroups 给用户暴露出来的操作接口是文件系统，即它以文件和目录的方式组织在操作系统的 /sys/fs/cgroup 路径下。

展示相关文件

```shell
mount -t cgroup
# 结果大概是这样的
cgroup on /sys/fs/cgroup/systemd type cgroup (rw,nosuid,nodev,noexec,relatime,xattr,release_agent=/usr/lib/systemd/systemd-cgroups-agent,name=systemd)
cgroup on /sys/fs/cgroup/net_cls,net_prio type cgroup (rw,nosuid,nodev,noexec,relatime,net_prio,net_cls)
cgroup on /sys/fs/cgroup/memory type cgroup (rw,nosuid,nodev,noexec,relatime,memory)
cgroup on /sys/fs/cgroup/devices type cgroup (rw,nosuid,nodev,noexec,relatime,devices)
cgroup on /sys/fs/cgroup/cpu,cpuacct type cgroup (rw,nosuid,nodev,noexec,relatime,cpuacct,cpu)
cgroup on /sys/fs/cgroup/cpuset type cgroup (rw,nosuid,nodev,noexec,relatime,cpuset)
cgroup on /sys/fs/cgroup/perf_event type cgroup (rw,nosuid,nodev,noexec,relatime,perf_event)
cgroup on /sys/fs/cgroup/freezer type cgroup (rw,nosuid,nodev,noexec,relatime,freezer)
cgroup on /sys/fs/cgroup/blkio type cgroup (rw,nosuid,nodev,noexec,relatime,blkio)
cgroup on /sys/fs/cgroup/hugetlb type cgroup (rw,nosuid,nodev,noexec,relatime,hugetlb)
cgroup on /sys/fs/cgroup/pids type cgroup (rw,nosuid,nodev,noexec,relatime,pids)

```

可以看到，在`/sys/fs/cgroup` 下面有很多诸如 cpuset、cpu、 memory 这样的子目录，也叫子系统。也就是这台机器当前可以被 Cgroups 进行限制的资源种类。

比如，对 CPU 子系统来说，我们就可以看到如下几个配置文件，这个指令是：

```shell
ls /sys/fs/cgroup/cpu
# 目录下大概有这么一些内容
assist                 cgroup.event_control  cgroup.sane_behavior  cpuacct.stat   cpuacct.usage_percpu  cpu.cfs_quota_us  cpu.rt_runtime_us  cpu.stat  notify_on_release  system.slice
cgroup.clone_children  cgroup.procs                 cpuacct.usage  cpu.cfs_period_us     cpu.rt_period_us  cpu.shares      release_agent      tasks
```



## 2. 限制CPU使用

而这样的配置文件又如何使用呢？

你需要在对应的子系统下面创建一个目录，比如，我们现在进入 /sys/fs/cgroup/cpu 目录下：

```shell
[root@iz2ze0ephck4d0aztho5r5z cpu]# mkdir container
[root@iz2ze0ephck4d0aztho5r5z cpu]# ls container/
cgroup.clone_children  cgroup.event_control  cgroup.procs  cpuacct.stat  cpuacct.usage  cpuacct.usage_percpu  cpu.cfs_period_us  cpu.cfs_quota_us  cpu.rt_period_us  cpu.rt_runtime_us  cpu.shares  cpu.stat  notify_on_release  tasks
```

这个目录就称为一个“控制组”。你会发现，操作系统会在你新创建的 container 目录下，自动生成该子系统对应的资源限制文件。

现在，我们在后台执行这样一条脚本:

```shell
$ while : ; do : ; done &
[1] 27218
```

显然，它执行了一个死循环，可以把计算机的 CPU 吃到 100%，根据它的输出，我们可以看到这个脚本在后台运行的进程号（PID）是 27218。

查看一下CPU占用

```shell
$ top

PID USER      PR  NI    VIRT    RES    SHR S %CPU %MEM     TIME+ COMMAND    
27218 root      20   0  115680    672    152 R 99.9  0.0   2:07.07 bash                                                  
```

果然这个PID=27218的进程占用了差不多100%的CPU。

结下来我们就通过Cgroups对其进行限制，这里就用前面创建的 container这个“控制组”。

我们可以通过查看 container 目录下的文件，看到 container 控制组里的 CPU quota 还没有任何限制（即：-1），CPU period 则是默认的 100  ms（100000  us）：

```shell
$ cat /sys/fs/cgroup/cpu/container/cpu.cfs_quota_us 
-1
$ cat /sys/fs/cgroup/cpu/container/cpu.cfs_period_us 
100000
```

接下来，我们可以通过修改这些文件的内容来设置限制。比如，向 container 组里的 cfs_quota 文件写入 20 ms（20000 us）：

```shell
$ echo 20000 > /sys/fs/cgroup/cpu/container/cpu.cfs_quota_us
```

这样意味着在每 100  ms 的时间里，被该控制组限制的进程只能使用 20  ms 的 CPU 时间，也就是说这个进程只能使用到 20% 的 CPU 带宽。

接下来，我们把被限制的进程的 PID 写入 container 组里的 tasks 文件，上面的设置就会对该进程生效了：

```shell
$ echo 27218 > /sys/fs/cgroup/cpu/container/tasks 
```

使用 top 指令查看一下

```shell
$ top

PID USER      PR  NI    VIRT    RES    SHR S %CPU %MEM     TIME+ COMMAND    
27218 root      20   0  115680    672    152 R 20 0.0   2:07.07 bash                                                  
```

果然CPU被限制到了20%.

除 CPU 子系统外，Cgroups 的每一个子系统都有其独有的资源限制能力，比如：

* blkio，为块设备设定I/O 限制，一般用于磁盘等设备；
* cpuset，为进程分配单独的 CPU 核和对应的内存节点；
* memory，为进程设定内存使用的限制。

**Linux Cgroups 的设计还是比较易用的，简单粗暴地理解呢，它就是一个子系统目录加上一组资源限制文件的组合。**



而对于 Docker 等 Linux 容器项目来说，它们只需要在每个子系统下面，为每个容器创建一个控制组（即创建一个新目录），然后在启动容器进程之后，把这个进程的 PID 填写到对应控制组的 tasks 文件中就可以了。

而至于在这些控制组下面的资源文件里填上什么值，就靠用户执行 docker run 时的参数指定了，比如这样一条命令：

```shell
$ docker run -it --cpu-period=100000 --cpu-quota=20000 ubuntu /bin/bash
```

在启动这个容器后，我们可以通过查看 Cgroups 文件系统下，CPU 子系统中，“docker”这个控制组里的资源限制文件的内容来确认：

```shell
$ cat /sys/fs/cgroup/cpu/docker/5d5c9f67d/cpu.cfs_period_us 
100000
$ cat /sys/fs/cgroup/cpu/docker/5d5c9f67d/cpu.cfs_quota_us 
20000
```



### 删除子系统

删除子系统只需要删除对应的目录即可。

> 如果当前子系统下还有进程则无法删除，需要先关闭进程。



## 3. 子系统分类

好了，有了以上的感性认识我们来，我们来看看control group有哪些子系统：

- blkio — 这个子系统为块设备设定输入/输出限制，比如物理设备（磁盘，固态硬盘，USB 等等）。
- cpu — 这个子系统使用调度程序提供对 CPU 的 cgroup 任务访问。
- cpuacct — 这个子系统自动生成 cgroup 中任务所使用的 CPU 报告。
- cpuset — 这个子系统为 cgroup 中的任务分配独立 CPU（在多核系统）和内存节点。
- devices — 这个子系统可允许或者拒绝 cgroup 中的任务访问设备。
- freezer — 这个子系统挂起或者恢复 cgroup 中的任务。
- memory — 这个子系统设定 cgroup 中任务使用的内存限制，并自动生成内存资源使用报告。
- net_cls — 这个子系统使用等级识别符（classid）标记网络数据包，可允许 Linux 流量控制程序（tc）识别从具体 cgroup 中生成的数据包。
- net_prio — 这个子系统用来设计网络流量的优先级
- hugetlb — 这个子系统主要针对于HugeTLB系统进行限制，这是一个大页文件系统。

CGroup有下述术语：

- **任务（Tasks）**：就是系统的一个进程。
- **控制组（Control Group）**：一组按照某种标准划分的进程，比如官方文档中的Professor和Student，或是WWW和System之类的，其表示了某进程组。Cgroups中的资源控制都是以控制组为单位实现。一个进程可以加入到某个控制组。而资源的限制是定义在这个组上，就像上面示例中我用的haoel一样。简单点说，cgroup的呈现就是一个目录带一系列的可配置文件。
- **层级（Hierarchy）**：控制组可以组织成hierarchical的形式，既一颗控制组的树（目录结构）。控制组树上的子节点继承父结点的属性。简单点说，hierarchy就是在一个或多个子系统上的cgroups目录树。
- **子系统（Subsystem）**：一个子系统就是一个资源控制器，比如CPU子系统就是控制CPU时间分配的一个控制器。子系统必须附加到一个层级上才能起作用，一个子系统附加到某个层级以后，这个层级上的所有控制族群都受到这个子系统的控制。Cgroup的子系统可以有很多，也在不断增加中。



## 4. 存在的问题

Cgroups 对资源的限制能力也有很多不完善的地方，被提及最多的自然是 /proc 文件系统的问题。

**问题**

如果在容器里执行 top 指令，就会发现，它显示的信息居然是宿主机的 CPU 和内存数据，而不是当前容器的数据。

造成这个问题的原因就是，/proc 文件系统并不知道用户通过 Cgroups 给这个容器做了什么样的资源限制，即：/proc 文件系统不了解 Cgroups 限制的存在。

**解决方案**

使用 `lxcfs`

top 是从 /prof/stats 目录下获取数据，所以道理上来讲，容器不挂载宿主机的该目录就可以了。lxcfs就是来实现这个功能的，做法是把宿主机的 /var/lib/lxcfs/proc/memoinfo 文件挂载到Docker容器的/proc/meminfo位置后。容器中进程读取相应文件内容时，LXCFS的FUSE实现会从容器对应的Cgroup中读取正确的内存限制。从而使得应用获得正确的资源约束设定。kubernetes环境下，也能用，以ds 方式运行 lxcfs ，自动给容器注入争取的 proc 信息。



## 5. 参数

### CPU

cpu子系统限制对CPU的访问，每个参数独立存在于cgroups虚拟文件系统的伪文件中，参数解释如下：

- **cpu.shares**: cgroup对时间的分配。比如cgroup A设置的是1，cgroup B设置的是2，那么B中的任务获取cpu的时间，是A中任务的2倍。

- **cpu.cfs_period_us**: 完全公平调度器的调整时间配额的周期。

- **cpu.cfs_quota_us**: 完全公平调度器的周期当中可以占用的时间。

- **cpu.stat** 统计值

- - nr_periods 进入周期的次数
  - nr_throttled 运行时间被调整的次数
  - throttled_time 用于调整的时间



cpu.shares 主要是完全公平调度的情况下，对cpu时间进行分配，比如A、B、C按照 1:2:1 设置cpu.shares，那么在3个进程都跑满的情况下，CPU 占用就是1:2:1这个比例，但是如果只有A再跑，其他都闲着，那么A完全可以把所有CPU都占用了。

cpu.cfs_quota_us 设置最大能占用的CPU数。

cpu.shares 则设置大家都跑满的时候获取到的CPU比例。

在之前例子中给每个进程设置最大CPU为0.5个，然后share是1:2:1，宿主机一个1个CPU。都跑满的情况下cpu占用情况就是0.25：0.5:0.25这样。

即**CPU资源有限的情况下，具体CPU获取由cpu.shares限制，CPU充足时由cpu.cfs_quota_us限制。**