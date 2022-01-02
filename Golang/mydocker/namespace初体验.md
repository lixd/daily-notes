# Namespace 初体验

## 1. 概述

Docker 主要依赖于 namespace、cgroups 和 UnionFS 技术，而 Docker 是由 Go 编写的，本栏目主要是记录了用 Go 编写一个自己的 Docker。

该章节主要为 Go 中操作 namespace 的演示。



## 2. 示例

### UTS Namespace

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





### IPC Namespace

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



### PID Namespace

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



### Mount Namespace

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





### User Namespace

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





### Network Namespace

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

创建 Namespace 其实很简单，只需要一个系统调用即可。

而 Go 中也直接把 clone 调用给封装好了，只需要传入不同参数即可控制创建不同 Namespace。

