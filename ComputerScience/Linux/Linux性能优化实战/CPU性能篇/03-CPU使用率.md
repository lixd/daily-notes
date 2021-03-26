# CPU使用率

## 1. 概述

top 命令各个数值含义：

* user（通常缩写为 us），代表用户态 CPU 时间。注意，它不包括下面的 nice 时间，但包括了 guest 时间。
* nice（通常缩写为 ni），代表低优先级用户态 CPU 时间，也就是进程的 nice 值被调整为 1-19 之间时的 CPU 时间。这里注意，nice 可取值范围是 -20 到 19，数值越大，优先级反而越低。
* system（通常缩写为 sys），代表内核态 CPU 时间。
* idle（通常缩写为 id），代表空闲时间。注意，它不包括等待 I/O 的时间（iowait）。
* iowait（通常缩写为 wa），代表等待 I/O 的 CPU 时间。
* irq（通常缩写为 hi），代表处理硬中断的 CPU 时间。
* softirq（通常缩写为 si），代表处理软中断的 CPU 时间。
* steal（通常缩写为 st），代表当系统运行在虚拟机中的时候，被其他虚拟机占用的 CPU 时间。
* guest（通常缩写为 guest），代表通过虚拟化运行其他操作系统的时间，也就是运行虚拟机的 CPU 时间。
* guest_nice（通常缩写为 gnice），代表以低优先级运行虚拟机的时间。



而我们通常所说的 CPU 使用率，就是除了空闲时间外的其他时间占总 CPU 时间的百分比，用公式来表示就是：
$$
CPU 使用率=1-\frac{CPU空闲时间}{总CPU时间}
$$

当然 /proc/stat 中的数据计算出来的是开机以来的平均CPU使用率，没有参考价值。

性能工具一般都会取间隔一段时间（比如 3 秒）的两次值，作差后，再计算出这段时间内的平均 CPU 使用率：
$$
平均CPU使用率=1-\frac{空闲时间new-空闲时间old}{总CPU时间new-总CPU时间old}
$$
这个公式，就是我们用各种性能工具所看到的 CPU 使用率的实际计算方法。



CPU使用率计算公式：

```sh
1-(CPU空闲时间new-空闲时间old)
```



## 2. 分析

### top

使用 top、ps 可以方便的查看 CPU 使用率。

* top 显示了系统总体的 CPU 和内存使用情况，以及各个进程的资源使用情况。
* ps 则只显示了每个进程的资源使用情况。



```sh
$ top
top - 09:12:23 up 76 days, 23:49,  1 user,  load average: 0.00, 0.03, 0.01
Tasks:  90 total,   1 running,  53 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.0 us,  0.0 sy,  0.0 ni,100.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
```

第三行 %Cpu(s) 则是CPU使用率。不过需要注意，top 默认显示的是所有 CPU 的平均值，这个时候你只需要按下数字 1 ，就可以切换到每个 CPU 的使用率了。

### pidstat

到这里我们可以发现， top 并没有细分进程的用户态 CPU 和内核态 CPU。

要查看每个进程的详细情况就要用到 pidstat 命令。

pidstat 显示就比较详细了：

* 用户态 CPU 使用率 （%usr）；
* 内核态 CPU 使用率（%system）；
* 运行虚拟机 CPU 使用率（%guest）；
* 等待 CPU 使用率（%wait）；
* 以及总的 CPU 使用率（%CPU）。

最后的 Average 部分，还计算了 5 组数据的平均值。

```sh
$ pidstat 1 5
Linux 4.19.91-22.al7.x86_64 (iZ2ze50cewx2ym32xtt8z2Z) 	03/26/2021 	_x86_64_	(1 CPU)

09:14:24 AM   UID       PID    %usr %system  %guest    %CPU   CPU  Command
09:14:25 AM     0       544    1.01    0.00    0.00    1.01     0  tuned
09:14:25 AM     0      1279    0.00    1.01    0.00    1.01     0  /usr/local/clou

...
Average:      UID       PID    %usr %system  %guest    %CPU   CPU  Command
Average:        0       318    0.00    0.20    0.00    0.20     -  jbd2/vda1-8
Average:        0       544    0.20    0.00    0.00    0.20     -  tuned
Average:        0      1279    0.00    0.20    0.00    0.20     -  /usr/local/clou

```

### perf 

通过 top、ps、pidstat 等工具，你能够轻松找到 CPU 使用率较高（比如 100% ）的进程。

如何在更进一步，找到对应的函数呢？

推荐使用 perf 工具。perf 是 Linux 2.6.31 以后内置的性能分析工具。

```sh
#centos安装
sudo yum install perf
```



```sh
# -g开启调用关系分析，-p指定pid
perf top -g -p <pid>
```

进入终端后，按方向键切换到 对应进程，再按下回车键展开该进程的调用关系。这里就可以看到最终是哪个函数在消耗CPU了。

相关命令

```sh
# 记录调用关系到文件
perf record
# 从文件中读取调用关系
perf report xxx
```



## 3. 小结

CPU 使用率是最直观和最常用的系统性能指标，更是我们在排查性能问题时，通常会关注的第一个指标。

所以我们更要熟悉它的含义，尤其要弄清楚用户（%user）、Nice（%nice）、系统（%system） 、等待 I/O（%iowait） 、中断（%irq）以及软中断（%softirq）这几种不同 CPU 的使用率。比如说：



* 用户 CPU 和 Nice CPU 高，说明用户态进程占用了较多的 CPU，所以应该着重排查进程的性能问题。
* 系统 CPU 高，说明内核态占用了较多的 CPU，所以应该着重排查内核线程或者系统调用的性能问题。
* I/O 等待 CPU 高，说明等待 I/O 的时间比较长，所以应该着重排查系统存储是不是出现了 I/O 问题。
* 软中断和硬中断高，说明软中断或硬中断的处理程序占用了较多的 CPU，所以应该着重排查内核中的中断服务程序。



具体排查步骤

* 1）top 找到占用CPU高的进程
* 2）pidstat 查看具体CPU使用情况
* 3）perf 找到消耗CPU的具体函数