# Namespace 初体验

Docker 基础知识之 Namespace 篇。

主要内容为：

* 1）Namespace 介绍
* 2）Go 语言操作 Namespace 演示



## 1. Namespace 概述

### 简介

**Linux Namespace 是 Linux 提供的一种内核级别环境隔离的方法**，使得处于不同 namespace 的进程拥有独立的全局系统资源，改变一个 namespace 中的系统资源只会影响当前 namespace 里的进程，对其他 namespace 中的进程没有影响。

> Namespace 就是对资源的隔离



目前，Linux 内核里面实现了 8 种不同类型的 namespace。

| 分类                   | 系统调用参数    | 隔离内容                             | 相关内核版本                                                 |
| ---------------------- | --------------- | ------------------------------------ | ------------------------------------------------------------ |
| **Mount namespaces**   | CLONE_NEWNS     | Mount points                         | [Linux 2.4.19](https://lwn.net/2001/0301/a/namespaces.php3)  |
| **UTS namespaces**     | CLONE_NEWUTS    | Hostname and NIS domain name         | [Linux 2.6.19](https://lwn.net/Articles/179345/)             |
| **IPC namespaces**     | CLONE_NEWIPC    | System V IPC, POSIX message queues   | [Linux 2.6.19](https://lwn.net/Articles/187274/)             |
| **PID namespaces**     | CLONE_NEWPID    | Process IDs                          | [ Linux 2.6.24](https://lwn.net/Articles/259217/)            |
| **Network namespaces** | CLONE_NEWNET    | Network devices, stacks, ports, etc. | [始于Linux 2.6.24 完成于 Linux 2.6.29](https://lwn.net/Articles/219794/) |
| **User namespaces**    | CLONE_NEWUSER   | User and group IDs                   | [始于 Linux 2.6.23 完成于 Linux 3.8)](https://lwn.net/Articles/528078/) |
| **Cgroup namespace**   | CLONE_NEWCGROUP | Cgroup root directory                | [Linux 4.6](https://lkml.org/lkml/2016/3/18/564)             |
| **Time namespace**     | CLONE_NEWTIME   | Boot and monotonic                   | [Linux 5.6](https://www.phoronix.com/scan.php?page=news_item&px=Time-Namespace-In-Linux-5.6) |

> **注意：** 由于 Cgroup namespace 在 4.6 的内核中才实现，并且和 cgroup v2 关系密切，现在普及程度还不高，比如 docker 现在就还没有用它。



### 相关API

和 namespace 相关的函数只有四个，这里简单的看一下：

* clone
* setns
* unshare
* ioctl_ns



[clone](https://man7.org/linux/man-pages/man2/clone.2.html)： 创建一个新的进程并把他放到新的namespace中：

```c
 int clone(int (*fn)(void *), void *stack, int flags, void *arg, ...
                 /* pid_t *parent_tid, void *tls, pid_t *child_tid */ );

flags： 
    指定一个或者多个上面的CLONE_NEW*（当然也可以包含跟namespace无关的flags）， 
    这样就会创建一个或多个新的不同类型的namespace， 
    并把新创建的子进程加入新创建的这些namespace中。
```



[setns](https://man7.org/linux/man-pages/man2/setns.2.html)： 将当前进程加入到已有的namespace中

```c
int setns(int fd, int nstype);

fd： 
    指向/proc/[pid]/ns/目录里相应namespace对应的文件，
    表示要加入哪个namespace

nstype：
    指定namespace的类型（上面的任意一个CLONE_NEW*）：
    1. 如果当前进程不能根据fd得到它的类型，如fd由其他进程创建，
    并通过UNIX domain socket传给当前进程，
    那么就需要通过nstype来指定fd指向的namespace的类型
    2. 如果进程能根据fd得到namespace类型，比如这个fd是由当前进程打开的，
    那么nstype设置为0即可
```



[unshare](https://man7.org/linux/man-pages/man2/unshare.2.html): 使当前进程退出指定类型的 namespace，并加入到新创建的 namespace（相当于创建并加入新的namespace）

```c
int unshare(int flags);

flags：
    指定一个或者多个上面的CLONE_NEW*，
    这样当前进程就退出了当前指定类型的namespace并加入到新创建的namespace
```



[ioctl_ns](https://man7.org/linux/man-pages/man2/ioctl_ns.2.html)：查询 namespace 信息。

```c
new_fd = ioctl(fd, request);
fd: 指向/proc/[pid]/ns/目录里相应namespace对应的文件
request: 
	NS_GET_USERNS: 返回指向拥有用户的文件描述符namespace fd引用的命名空间
    NS_GET_PARENT: 返回引用父级的文件描述符由fd引用的命名空间的命名空间。
```



**clone 和 unshare 的区别**

clone 和 unshare 的功能都是创建并加入新的 namespace， 他们的区别是：

- unshare 是使当前进程加入新的 namespace
- clone 是创建一个新的子进程，然后让子进程加入新的 namespace，而当前进程保持不变



### 查看进程所属的 namespaces

系统中的每个进程都有 `/proc/[pid]/ns/` 这样一个目录，里面包含了这个进程所属 namespace 的信息，里面每个文件的描述符都可以用来作为 setns 函数(后面会介绍)的参数。

```shell
#查看当前bash进程所属的namespace
 lixd  ~  ls -l /proc/$$/ns
total 0
lrwxrwxrwx 1 lixd lixd 0 Jan  6 19:00 cgroup -> 'cgroup:[4026531835]'
lrwxrwxrwx 1 lixd lixd 0 Jan  6 19:00 ipc -> 'ipc:[4026532227]'
lrwxrwxrwx 1 lixd lixd 0 Jan  6 19:00 mnt -> 'mnt:[4026532241]'
lrwxrwxrwx 1 lixd lixd 0 Jan  6 19:00 net -> 'net:[4026531992]'
lrwxrwxrwx 1 lixd lixd 0 Jan  6 19:00 pid -> 'pid:[4026532243]'
lrwxrwxrwx 1 lixd lixd 0 Jan  6 19:00 pid_for_children -> 'pid:[4026532243]'
lrwxrwxrwx 1 lixd lixd 0 Jan  6 19:00 user -> 'user:[4026531837]'
lrwxrwxrwx 1 lixd lixd 0 Jan  6 19:00 uts -> 'uts:[4026532242]'
```

以`ipc:[4026532227]`为例，ipc 是 namespace 的类型，4026532227 是 inode number。

**如果两个进程的 ipc namespace 的 inode number一样，说明他们属于同一个 namespace**，这条规则对其他类型的 namespace 也同样适用。



### namespace limit

`/proc/sys/user` 目录中公开了对各种命名空间数量的限制，具体如下：

```shell
$ tree /proc/sys/user/
/proc/sys/user/
├── max_cgroup_namespaces
├── max_inotify_instances
├── max_inotify_watches
├── max_ipc_namespaces
├── max_mnt_namespaces
├── max_net_namespaces
├── max_pid_namespaces
├── max_user_namespaces
└── max_uts_namespaces

$ cat /proc/sys/user/max_pid_namespaces
6784
```



### namespace lifetime

当一个 namespace 中的所有进程都结束或者移出该 namespace 时，该 namespace 将会被销毁。

不过也有一些特殊情况，可以再没有进程的时候保留 namespace：

* 存在打开的 FD，或者对 `/proc/[pid]/ns/*` 执行了 bind mount
* 存在子 namespace
* 它是一个拥有一个或多个非用户 namespace 的 namespace。
* 它是一个 PID namespace，并且有一个进程通过 `/proc/[pid]/ns/pid_for_children` 符号链接引用了这个 namespace。
* 它是一个 Time namespace，并且有一个进程通过 `/proc/[pid]/ns/time_for_children` 符号链接引用了这个 namespace。
* 它是一个 IPC namespace，并且有一个 mqueue 文件系统的 mount 引用了该 namespace
* 它是一个 PIDnamespace，并且有一个 proc 文件系统的 mount 引用了该 namespace  



## 2. Go 演示

### UTS

**UTS Namespace主要用来隔离nodename和domainname两个系统标识**。在UTS Namespace里面，每个Namespace允许有自己的hostname.

以下程序展示了如何在 Go 中切换 UTS Namespace。

```go
// 注: 运行时需要 root 权限。
func main() {
	cmd := exec.Command("bash")
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWUTS,
	}

	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		log.Fatalln(err)
	}
}
```



运行并测试

```shell
DESKTOP-9K4GB6E# go run main.go
root@DESKTOP-9K4GB6E:/home/lixd/projects/docker/mydocker#
```

运行后会进入了一个新的 shell 环境。



查看以下是否真的进入了新的 UTS Namespace。

首先使用` pstree`查看进程关系：

```shell
root@DESKTOP-9K4GB6E:/home/lixd/projects/docker/mydocker# pstree -pl
init(1)─┬─init(1272)───init(1273)───server(1274)─┬─{server}(1282)
        │                                        ├─{server}(1283)
        │                                        ├─{server}(1284)
        │                                        ├─{server}(1285)
        │                                        ├─{server}(1286)
        │                                        ├─{server}(1287)
        │                                        ├─{server}(1288)
        │                                        └─{server}(1289)
        ├─init(3701)───init(3702)───zsh(3703)───su(7520)───bash(7521)───zsh(7575)───go(8104)─┬─main(8182)─┬─bash(8187)───pstree(8194)
        │                                                                                    │            ├─{main}(8183)
        │                                                                                    │            ├─{main}(8184)
        │                                                                                    │            ├─{main}(8185)
        │                                                                                    │            └─{main}(8186)
        │                                                                                    ├─{go}(8105)
        │                                                                                    ├─{go}(8106)
        │                                                                                    ├─{go}(8107)
        │                                                                                    ├─{go}(8108)
        │                                                                                    ├─{go}(8109)
        │                                                                                    ├─{go}(8110)
        │                                                                                    ├─{go}(8111)
        │                                                                                    ├─{go}(8112)
        │                                                                                    ├─{go}(8117)
        │                                                                                    └─{go}(8143)
        ├─init(3763)───init(3764)───zsh(3765)
        ├─init(5171)───init(5172)───fsnotifier-wsl(5173)
        ├─init(7459)───init(7460)───bash(7461)───su(7476)───bash(7477)
        ├─{init}(5)
        └─{init}(6)
```

主要关注这条：

```shell
├─init(3701)───init(3702)───zsh(3703)───su(7520)───bash(7521)───zsh(7575)───go(8104)─┬─main(8182)─┬─bash(8187)
```

main 程序 pid 为 8182,后续新创建的 bash pid 为 8187，现在查看二者 uts 是否相同即可：

```shell
root@DESKTOP-9K4GB6E:/home/lixd/projects/docker/mydocker# readlink /proc/8182/ns/uts
uts:[4026532242]
root@DESKTOP-9K4GB6E:/home/lixd/projects/docker/mydocker# readlink /proc/8187/ns/uts
uts:[4026532386]
```

可以发现二者确实不在一个 UTS Namespace 中。由于 UTS Namespace hostname 做了隔离 所以在这个环境内修改 hostname 应该不影响外部主机， 下面来做 下实验。

在这个新的 bash 环境中修改 hostname

```shell
root@DESKTOP-9K4GB6E:/home/lixd/projects/docker/mydocker# hostname bash
root@DESKTOP-9K4GB6E:/home/lixd/projects/docker/mydocker# hostname
bash
```

新开一个在宿主机上查看 hostname：

```shell
 lixd  ~ $ hostname
DESKTOP-9K4GB6E
```

可以看到外部的 hostname 并没有被修改影响，由此可了解 UTS Namespace 的作用。



### IPC

**IPC Namespace 用来隔离 sys V IPC和 POSIX message queues**。每个 IPC Namespace 都有自己的 Sys V IPC 和 POSIX message queues。

微调一下程序，只是修改了 Cloneflags，新增了 CLONE_NEWIPC，表示同时创建 IPC Namespace。

```go
// 注: 运行时需要 root 权限。
func main() {
	cmd := exec.Command("bash")
	cmd.SysProcAttr = &syscall.SysProcAttr{
		// Cloneflags: syscall.CLONE_NEWUTS,
		Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWIPC,
	}

	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		log.Fatalln(err)
	}
}
```



运行并测试：

```shell
# 先查看宿主机上的 ipc message queue
DESKTOP-9K4GB6E# ipcs -q
------ Message Queues --------
key        msqid      owner      perms      used-bytes   messages

# 然后创建一个 
DESKTOP-9K4GB6E# ipcmk -Q
Message queue id: 0
# 再次查看，发现有了
DESKTOP-9K4GB6E# ipcs -q
------ Message Queues --------
key        msqid      owner      perms      used-bytes   messages
0x70ffd07c 0          root       644        0            0
```

运行程序进入新的 shell

```shell
DESKTOP-9K4GB6E# go run main.go
root@DESKTOP-9K4GB6E:/home/lixd/projects/docker/mydocker# ipcs -q
------ Message Queues --------
key        msqid      owner      perms      used-bytes   messages
```

可以发现，在新的 Namespace 中已经看不到宿主机上的 message queue 了。说明 IPC Namespace 创建成功，IPC 已经被隔离。



### PID

**PID Namespace是用来隔离进程ID的**。同样一个进程在不同的PID Namespace里可以拥有不同的PID。这样就可以理解，在docker container 里面，使用ps -ef经常会发现，在容器内，前台运行的那个进程PID是1，但是在容器外，使用ps -ef会发现同样的进程却有不同的PID，这就是PID Namespace做的事情。

再次调整程序，增加 PID flags：

```go
// 注: 运行时需要 root 权限。
func main() {
	cmd := exec.Command("bash")
	cmd.SysProcAttr = &syscall.SysProcAttr{
		// Cloneflags: syscall.CLONE_NEWUTS,
		// Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWIPC,
		Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWIPC | syscall.CLONE_NEWPID,
	}

	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		log.Fatalln(err)
	}
}
```



运行并测试：

```shell
DESKTOP-9K4GB6E# go run main.go
root@DESKTOP-9K4GB6E:/home/lixd/projects/docker/mydocker# pstree -pl
init(1)─┬─init(1272)───init(1273)───server(1274)─┬─{server}(1282)
        │                                        ├─{server}(1283)
        │                                        ├─{server}(1284)
        │                                        ├─{server}(1285)
        │                                        ├─{server}(1286)
        │                                        ├─{server}(1287)
        │                                        ├─{server}(1288)
        │                                        └─{server}(1289)
        ├─init(3701)───init(3702)───zsh(3703)───su(7520)───bash(7521)───zsh(7575)───go(9103)─┬─main(9184)─┬─bash(9189)───pstree(9196)
        │                                                                                    │            ├─{main}(9185)
        │                                                                                    │            ├─{main}(9186)
        │                                                                                    │            ├─{main}(9187)
        │                                                                                    │            └─{main}(9188)
        │                                                                                    ├─{go}(9104)
        │                                                                                    ├─{go}(9105)
        │                                                                                    ├─{go}(9106)
        │                                                                                    ├─{go}(9107)
        │                                                                                    ├─{go}(9108)
        │                                                                                    ├─{go}(9109)
        │                                                                                    ├─{go}(9110)
        │                                                                                    ├─{go}(9111)
        │                                                                                    ├─{go}(9112)
        │                                                                                    └─{go}(9120)
        ├─init(3763)───init(3764)───zsh(3765)
        ├─init(5171)───init(5172)───fsnotifier-wsl(5173)
        ├─init(7459)───init(7460)───bash(7461)───su(7476)───bash(7477)
        ├─init(8201)───init(8202)───zsh(8203)
        ├─{init}(5)
        └─{init}(6)
```

可以看到 main 函数 pid 为 9184，而新开的 bash pid 为 9189。

然后再新开的 bash 中查看自己的 pid：

> 这里只能使用 `echo $$` 命令查看，ps、top 等命令会查看到其他 Namespace 中的信息。

```shell
root@DESKTOP-9K4GB6E:/home/lixd/projects/docker/mydocker# echo $$
1
```

发现 pid 是1，说明再新开的 PID Namespace 中只有一个 bash 这个进程，而且被伪装成了 1 号进程。



### Mount

**Mount Namespace用来隔离各个进程看到的挂载点视图**。在不同Namespace的进程中，看到的文件系统层次是不一样的。 在Mount Namespace中调用mount()和umount()仅仅只会影响当前Namespace内的文件系统，而对全局的文件系统是没有影响的。

看到这里，也许就会想到chroot()，它也是将某一个子目录变成根节点。但是，Mount Namespace不仅能实现这个功能，而且能以更加灵活和安全的方式实现。

> 需要注意的是，Mount Namespace 的 flag 是`CLONE_NEWNS`,直接是 NEWNS 而不是 NEWMOUNT,因为 Mount Namespace 是 Linux 中实现的第一个 Namespace，当时也没想到后续会有很多类型的 Namespace 加入。

再次修改代码，增加 Mount Namespace 的 flag

```go
	cmd.SysProcAttr = &syscall.SysProcAttr{
		// Cloneflags: syscall.CLONE_NEWUTS,
		// Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWIPC,
		// Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWIPC | syscall.CLONE_NEWPID,
		Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWIPC | syscall.CLONE_NEWPID | syscall.CLONE_NEWNS,
	}
```



运行并测试：

首先运行程序并在新的 bash 环境中查看 /proc

```shell
DESKTOP-9K4GB6E# go run main.go
root@DESKTOP-9K4GB6E:/home/lixd/projects/docker/mydocker# ls /proc
1     3764  7476  9476       cmdline    driver       kallsyms     loadavg  net           swaps        vmallocinfo
1272  3765  7477  9557       config.gz  execdomains  kcore        locks    pagetypeinfo  sys          vmstat
1273  5171  7520  9562       consoles   filesystems  key-users    mdstat   partitions    sysvipc      zoneinfo
1274  5172  7521  9569       cpuinfo    fs           keys         meminfo  sched_debug   thread-self
3701  5173  7575  acpi       crypto     interrupts   kmsg         misc     schedstat     timer_list
3702  7459  8201  buddyinfo  devices    iomem        kpagecgroup  modules  self          tty
3703  7460  8202  bus        diskstats  ioports      kpagecount   mounts   softirqs      uptime
3763  7461  8203  cgroups    dma        irq          kpageflags   mtrr     stat          version
```

可以看到，有一大堆文件，这是因为现在查看到的其实是宿主机上的 /proc 目录。

现在把 proc 目录挂载到当前 Namespace 中来：

```shell
root@DESKTOP-9K4GB6E:/home/lixd/projects/docker/mydocker# mount -t proc proc /proc

root@DESKTOP-9K4GB6E:/home/lixd/projects/docker/mydocker# ls /proc
1          cmdline    diskstats    interrupts  key-users    loadavg  mounts        schedstat  sysvipc      vmallocinfo
10         config.gz  dma          iomem       keys         locks    mtrr          self       thread-self  vmstat
acpi       consoles   driver       ioports     kmsg         mdstat   net           softirqs   timer_list   zoneinfo
buddyinfo  cpuinfo    execdomains  irq         kpagecgroup  meminfo  pagetypeinfo  stat       tty
bus        crypto     filesystems  kallsyms    kpagecount   misc     partitions    swaps      uptime
cgroups    devices    fs           kcore       kpageflags   modules  sched_debug   sys        version
```

可以看到，少了一些文件，少的主要是数字命名的目录，因为当前 Namespace 下没有这些进程，自然就看不到对应的信息了。

此时就可以通过 ps 命令来查看了：

```shell
root@DESKTOP-9K4GB6E:/home/lixd/projects/docker/mydocker# ps -ef
UID        PID  PPID  C STIME TTY          TIME CMD
root         1     0  0 13:13 pts/2    00:00:00 bash
root        11     1  0 13:13 pts/2    00:00:00 ps -ef
```

可以看到，在当前 Namespace 中 bash 为 1 号进程。

这就说明，**当前 Mount Namespace 中的 mount 和外部是隔离的，mount 操作并没有影响到外部**，Docker volume 也是利用了这个特性。



### User

User Narespace 主要是隔离用户的用户组ID。也就是说，一个进程的 UserID 和GroupID 在不同的 User Namespace 中可以是不同的。比较常用的是，在宿主机上以一个非root用户运行创建一个User Namespace,然后在User Namespace里面却映射成root用户。这意味着，这个进程在User Namespace里面有root 权限，但是在User Namespace外面却没有root 的权限。

从Linux Kernel 3.8开始，非root进程也可以创建UserNamespace,并且此用户在Namespace里面可以被映射成root，且在Namespace内有root权限。



再次修改代码，增加 User Namespace 的 flag：

```go
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWIPC | syscall.CLONE_NEWPID | syscall.CLONE_NEWNS | syscall.CLONE_NEWUSER,
	}
```



运行并测试：

首先在宿主机上查看一个 user 和 group：

```shell
DESKTOP-9K4GB6E# id
uid=0(root) gid=0(root) groups=0(root)
```

可以看到，此时是 root 用户。

运行程序，进入新的 bash 环境：

```shell
DESKTOP-9K4GB6E# go run main.go
nobody@DESKTOP-9K4GB6E:/home/lixd/projects/docker/mydocker$ id
uid=65534(nobody) gid=65534(nogroup) groups=65534(nogroup)
```

可以看到，UID 是不同的，说明 User Namespace 生效了。



### Network

Network Namespace 是用来隔离网络设备、IP 地址端口等网络栈的 Namespace。Network Namespace 可以让每个容器拥有自己独立的(虛拟的)网络设备，而且容器内的应用可以绑定到自己的端口，每个 Namespace 内的端口都不会互相冲突。在宿主机上搭建网桥后，就能很方便地实现容器之间的通信，而且不同容器上的应用可以使用相同的端口。



再次修改代码，增加 Network Namespace 的 flag：

```go
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWIPC | syscall.CLONE_NEWPID | syscall.CLONE_NEWNS | 
			syscall.CLONE_NEWUSER | syscall.CLONE_NEWNET,
	}
```



运行并测试：

首先看一下宿主机上的网络设备：

```shell
DESKTOP-9K4GB6E# ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: bond0: <BROADCAST,MULTICAST,MASTER> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether 22:2f:1f:8e:f7:72 brd ff:ff:ff:ff:ff:ff
3: dummy0: <BROADCAST,NOARP> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether 7e:46:8b:04:23:81 brd ff:ff:ff:ff:ff:ff
4: tunl0@NONE: <NOARP> mtu 1480 qdisc noop state DOWN group default qlen 1000
    link/ipip 0.0.0.0 brd 0.0.0.0
5: sit0@NONE: <NOARP> mtu 1480 qdisc noop state DOWN group default qlen 1000
    link/sit 0.0.0.0 brd 0.0.0.0
6: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000
    link/ether 00:15:5d:6e:f2:65 brd ff:ff:ff:ff:ff:ff
    inet 172.18.167.21/20 brd 172.18.175.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::215:5dff:fe6e:f265/64 scope link
       valid_lft forever preferred_lft forever
```

有 lo、eth0 等6 个设备。

然后运行程序：

```shell
DESKTOP-9K4GB6E# go run main.go
nobody@DESKTOP-9K4GB6E:/home/lixd/projects/docker/mydocker$ ip addr
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: tunl0@NONE: <NOARP> mtu 1480 qdisc noop state DOWN group default qlen 1000
    link/ipip 0.0.0.0 brd 0.0.0.0
3: sit0@NONE: <NOARP> mtu 1480 qdisc noop state DOWN group default qlen 1000
    link/sit 0.0.0.0 brd 0.0.0.0
```

可以发现，新的 Namespace 中只有3个设备了，说明 Network Namespace 生效了。



## 3. 小结

* 1）本质：Linux Namespace 是 Linux 提供的一种内核级别环境隔离的方法，本质就是对全局系统资源的一种封装隔离。
* 2）使用：Namespace API 一共 4个，最常用的就是 clone，而 Go 已经把 clone 调用给封装好了，使用时只需要传入不同参数即可控制创建不同 Namespace。





## 4. 参考文档

- [overview of Linux namespaces](https://man7.org/linux/man-pages/man7/namespaces.7.html)
- [Namespaces in operation, part 1: namespaces overview](https://lwn.net/Articles/531114/)
- [Linux namespaces](https://www.wikiwand.com/en/Linux_namespaces)
- [Linux_namespaces](https://en.wikipedia.org/wiki/Linux_namespaces)
- [DOCKER基础技术：LINUX NAMESPACE（上）](https://coolshell.cn/articles/17010.html)
- [DOCKER基础技术：LINUX NAMESPACE（下）](https://coolshell.cn/articles/17029.html)
