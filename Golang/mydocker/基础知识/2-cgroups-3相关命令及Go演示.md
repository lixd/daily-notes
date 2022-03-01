# cgroup 相关操作

## 1. hierarchy 

### 创建

由于 Linux Cgroups 是基于内核中的 cgroup virtual filesystem 的，所以创建 hierarchy 其实就是将其挂载到指定目录。



语法为: `mount -t cgroup -o subsystems name /cgroup/name`

* 其中 subsystems 表示需要挂载的 cgroups 子系统
* /cgroup/name 表示挂载点（一般为具体目录）

这条命令同在内核中创建了一个 hierarchy 以及一个默认的 root cgroup。

例如：

```shell
$ mkdir cg1
$ mount -t cgroup -o cpuset cg1 ./cg1
```

比如以上命令就是挂载一个 cg1 的 hierarchy 到 ./cg1 目录，如果指定的 hierarchy 不存在则会新建。

> hierarchy 创建的时候就会就会自动创建一个 cgroup 以作为 cgroup树中的 root 节点。



### 删除

删除 hierarchy 则是卸载。

语法为：`umount /cgroup/name`

* /cgroup/name 表示挂载点（一般为具体目录）

例如：

```shell
$ umount ./cg1
```

以上命令就是卸载 ./cg1 这个目录上挂载的 hierarchy，也就是前面挂载的 cg。

> hierarchy 卸载后，相关的 cgroup 都会被删除。
>
> 不过 cg1 目录需要手动删除。



### 文件含义

hierarchy 挂载后会生成一些文件，具体如下：

> 为了避免干扰，未关联任何 subsystem

```shell
$ mkdir cg1
$ mount -t cgroup -o none,name=cg1 cg1 ./cg1
$ tree cg1
cg1
├── cgroup.clone_children
├── cgroup.procs
├── cgroup.sane_behavior
├── notify_on_release
├── release_agent
└── tasks
```

具体含义如下：

- **cgroup.clone_children**：这个文件只对cpuset subsystem有影响，当该文件的内容为1时，新创建的cgroup将会继承父cgroup的配置，即从父cgroup里面拷贝配置文件来初始化新cgroup，可以参考[这里](https://lkml.org/lkml/2010/7/29/368)
- **cgroup.procs**：当前cgroup中的所有**进程**ID，系统不保证ID是顺序排列的，且ID有可能重复
- **cgroup.sane_behavior**：具体功能不详，可以参考[这里](https://lkml.org/lkml/2014/7/2/684)和[这里](https://lkml.org/lkml/2014/7/2/686)
- **notify_on_release**：该文件的内容为1时，当cgroup退出时（不再包含任何进程和子cgroup），将调用release_agent里面配置的命令。
  - 新cgroup被创建时将默认继承父cgroup的这项配置。
- **release_agent**：里面包含了cgroup退出时将会执行的命令，系统调用该命令时会将相应cgroup的相对路径当作参数传进去。 
  - 注意：这个文件只会存在于root cgroup下面，其他cgroup里面不会有这个文件。
  - 相当于配置一个回调用于清理资源。
- **tasks**：当前cgroup中的所有**线程**ID，系统不保证ID是顺序排列的

> cgroup.procs 和 tasks 的区别见 cgroup 操作章节。



### release_agent

当一个cgroup里没有进程也没有子cgroup时，release_agent将被调用来执行cgroup的清理工作。

具体操作流程：

* 首先需要配置 notify_on_release 以开启该功能。
* 然后将脚本内容写入到 release_agent 中去。
* 最后cgroup退出时（不再包含任何进程和子cgroup）就会执行 release_agent  中的命令。



```shell
#创建新的cgroup用于演示
dev@ubuntu:~/cgroup/demo$ sudo mkdir test
#先enable release_agent
dev@ubuntu:~/cgroup/demo$ sudo sh -c 'echo 1 > ./test/notify_on_release'

#然后创建一个脚本/home/dev/cgroup/release_demo.sh，
#一般情况下都会利用这个脚本执行一些cgroup的清理工作，但我们这里为了演示简单，仅仅只写了一条日志到指定文件
dev@ubuntu:~/cgroup/demo$ cat > /home/dev/cgroup/release_demo.sh << EOF
#!/bin/bash
echo \$0:\$1 >> /home/dev/release_demo.log
EOF

#添加可执行权限
dev@ubuntu:~/cgroup/demo$ chmod +x ../release_demo.sh

#将该脚本设置进文件release_agent
dev@ubuntu:~/cgroup/demo$ sudo sh -c 'echo /home/dev/cgroup/release_demo.sh > ./release_agent'
dev@ubuntu:~/cgroup/demo$ cat release_agent
/home/dev/cgroup/release_demo.sh

#往test里面添加一个进程，然后再移除，这样就会触发release_demo.sh
dev@ubuntu:~/cgroup/demo$ echo $$
27597
dev@ubuntu:~/cgroup/demo$ sudo sh -c 'echo 27597 > ./test/cgroup.procs'
dev@ubuntu:~/cgroup/demo$ sudo sh -c 'echo 27597 > ./cgroup.procs'

#从日志可以看出，release_agent被触发了，/test是cgroup的相对路径
dev@ubuntu:~/cgroup/demo$ cat /home/dev/release_demo.log
/home/dev/cgroup/release_demo.sh:/test
```





## 2. cgroup

### 创建

创建cgroup很简单，在父cgroup或者hierarchy 目录下新建一个目录就可以了。

> 具体层级关系就和目录层级关系一样。

```shell
# 创建子cgroup cgroup-cpu
$ mkdir cgroup-cpu
$ cd cgroup-cpu
# 创建cgroup-cpu的子cgroup
$ mkdir cgroup-cpu-1
```



### 删除

删除也很简单，删除对应**目录**即可。

> 注意：是删除目录 rmdir，而不是递归删除目录下的所有文件。

如果有多层 cgroup 则需要先删除子 cgroup，否则会报错：

```shell
$ rmdir cgroup-cpu
# 如果cgroup中有进程正在本限制，也会出现这个错误，需要先停掉对应进程，或者把进程移动到另外的 cgroup 中(比如父cgroup)
rmdir: failed to remove 'cgroup-cpu': Device or resource busy
```

先删除子 cgroup 就可以了：

```shell
$ rmdir cg1
$ cd ../
$ rmdir cgroup-cpu
```



也可以借助 libcgroup  工具来创建或删除。

使用 libcgroup 工具前，请先安装 libcgroup 和 libcgroup-tools 数据包

redhat系统安装：

```shell
$ yum install libcgroup
$ yum install libcgroup-tools
```

ubuntu系统安装:

```shell
$ apt-get install cgroup-bin
# 如果提示cgroup-bin找不到，可以用 cgroup-tools 替换
$ apt-get install cgroup-tools
```

具体语法：

```shell
# controllers就是subsystem
# path可以用相对路径或者绝对路径
$ cgdelete controllers:path
```

例如：

```shell
$ cgcreate cpu:./mycgroup
$ cgdelete cpu:./mycgroup
```



### 添加进程

创建新的cgroup后，就可以往里面添加进程了。注意下面几点：

- 在一颗cgroup树里面，**一个进程必须要属于一个cgroup**。
  - 所以不能凭空从一个cgroup里面删除一个进程，只能将一个进程从一个cgroup移到另一个cgroup
- 新创建的子进程将会自动加入父进程所在的cgroup。
  - 这也就是 tasks 和 cgroup.proc 的区别。
- 从一个cgroup移动一个进程到另一个cgroup时，只要有目的cgroup的写入权限就可以了，系统不会检查源cgroup里的权限。
- 用户只能操作属于自己的进程，不能操作其他用户的进程，root账号除外。



```shell
#--------------------------第一个shell窗口----------------------
#创建一个新的cgroup
dev@ubuntu:~/cgroup/demo$ sudo mkdir test
dev@ubuntu:~/cgroup/demo$ cd test

#将当前bash加入到上面新创建的cgroup中
dev@ubuntu:~/cgroup/demo/test$ echo $$
1421
dev@ubuntu:~/cgroup/demo/test$ sudo sh -c 'echo 1421 > cgroup.procs'
#注意：一次只能往这个文件中写一个进程ID，如果需要写多个的话，需要多次调用这个命令

#--------------------------第二个shell窗口----------------------
#重新打开一个shell窗口，避免第一个shell里面运行的命令影响输出结果
#这时可以看到cgroup.procs里面包含了上面的第一个shell进程
dev@ubuntu:~/cgroup/demo/test$ cat cgroup.procs
1421

#--------------------------第一个shell窗口----------------------
#回到第一个窗口，随便运行一个命令，比如 top
dev@ubuntu:~/cgroup/demo/test$ top
#这里省略输出内容

#--------------------------第二个shell窗口----------------------
#这时再在第二个窗口查看，发现top进程自动加入了它的父进程（1421）所在的cgroup
dev@ubuntu:~/cgroup/demo/test$ cat cgroup.procs
1421
16515
dev@ubuntu:~/cgroup/demo/test$ ps -ef|grep top
dev      16515  1421  0 04:02 pts/0    00:00:00 top
dev@ubuntu:~/cgroup/demo/test$

#在一颗cgroup树里面，一个进程必须要属于一个cgroup，
#所以我们不能凭空从一个cgroup里面删除一个进程，只能将一个进程从一个cgroup移到另一个cgroup，
#这里我们将1421移动到root cgroup
dev@ubuntu:~/cgroup/demo/test$ sudo sh -c 'echo 1421 > ../cgroup.procs'
dev@ubuntu:~/cgroup/demo/test$ cat cgroup.procs
16515
#移动1421到另一个cgroup之后，它的子进程不会随着移动

#--------------------------第一个shell窗口----------------------
##回到第一个shell窗口，进行清理工作
#先用ctrl+c退出top命令
dev@ubuntu:~/cgroup/demo/test$ cd ..
#然后删除创建的cgroup
dev@ubuntu:~/cgroup/demo$ sudo rmdir test
```



### cgroup.procs vs tasks



```shell
#创建两个新的cgroup用于演示
dev@ubuntu:~/cgroup/demo$ sudo mkdir c1 c2

#为了便于操作，先给root账号设置一个密码，然后切换到root账号
dev@ubuntu:~/cgroup/demo$ sudo passwd root
dev@ubuntu:~/cgroup/demo$ su root
root@ubuntu:/home/dev/cgroup/demo#

#系统中找一个有多个线程的进程
root@ubuntu:/home/dev/cgroup/demo# ps -efL|grep /lib/systemd/systemd-timesyncd
systemd+   610     1   610  0    2 01:52 ?        00:00:00 /lib/systemd/systemd-timesyncd
systemd+   610     1   616  0    2 01:52 ?        00:00:00 /lib/systemd/systemd-timesyncd
#进程610有两个线程，分别是610和616

#将616加入c1/cgroup.procs
root@ubuntu:/home/dev/cgroup/demo# echo 616 > c1/cgroup.procs
#由于cgroup.procs存放的是进程ID，所以这里看到的是616所属的进程ID（610）
root@ubuntu:/home/dev/cgroup/demo# cat c1/cgroup.procs
610
#从tasks中的内容可以看出，虽然只往cgroup.procs中加了线程616，
#但系统已经将这个线程所属的进程的所有线程都加入到了tasks中，
#说明现在整个进程的所有线程已经处于c1中了
root@ubuntu:/home/dev/cgroup/demo# cat c1/tasks
610
616

#将616加入c2/tasks中
root@ubuntu:/home/dev/cgroup/demo# echo 616 > c2/tasks

#这时我们看到虽然在c1/cgroup.procs和c2/cgroup.procs里面都有610，
#但c1/tasks和c2/tasks中包含了不同的线程，说明这个进程的两个线程分别属于不同的cgroup
root@ubuntu:/home/dev/cgroup/demo# cat c1/cgroup.procs
610
root@ubuntu:/home/dev/cgroup/demo# cat c1/tasks
610
root@ubuntu:/home/dev/cgroup/demo# cat c2/cgroup.procs
610
root@ubuntu:/home/dev/cgroup/demo# cat c2/tasks
616
#通过tasks，我们可以实现线程级别的管理，但通常情况下不会这么用，
#并且在cgroup V2以后，将不再支持该功能，只能以进程为单位来配置cgroup

#清理
root@ubuntu:/home/dev/cgroup/demo# echo 610 > ./cgroup.procs
root@ubuntu:/home/dev/cgroup/demo# rmdir c1
root@ubuntu:/home/dev/cgroup/demo# rmdir c2
root@ubuntu:/home/dev/cgroup/demo# exit
exit
```

结论：将线程ID加到 cgroup1的 cgroup.procs 时，会把线程对应进程ID加入 cgroup.procs 且还会把当前进程下的全部线程ID加入到 tasks 中。

> 这里看起来，进程和线程好像效果是一样的。

区别来了，如果此时把某个线程ID移动到另外的 cgroup2 的 tasks 中，会自动把 线程ID对应的进程ID加入到 cgroup2 的 cgroup.procs 中，且只把对应线程加入 tasks 中。

此时 cgroup1和cgroup2 的  cgroup.procs 都包含了同一个进程ID，但是二者的 tasks 中却包含了不同的线程ID。

这样就实现了**线程粒度的控制**。但通常情况下不会这么用，并且在cgroup V2以后，将不再支持该功能，只能以进程为单位来配置cgroup。





## 3. 演示

### Docker 是如何使用 cgroup 的

我们知道 Docker 是通过 Cgroups 实现容器资源限制和监控的，那么具体是怎么用的呢？

先启动一个容器：

```shell
[root@iZ2zefmrr626i66omb40ryZ memory]# docker run -itd -m 128m nginx
da82f9ebd384730dda7f831b4331c9e55893c100c83c0c9b0ce112436aa93416
```

这里通过`docker run -m`参数设置了内存限制。

实际上 docker 会在 memory cgroup 上创建一个叫 docker 的子 cgroup

```shell
$ ls -l /sys/fs/cgroup/memory/docker/
-rw-r--r-- 1 root root 0 Jan  6 19:53 cgroup.clone_children
--w--w--w- 1 root root 0 Jan  6 19:53 cgroup.event_control
-rw-r--r-- 1 root root 0 Jan  6 19:53 cgroup.procs
# 可以发现这一长串ID和创建容器时打印的是一致的
drwxr-xr-x 2 root root 0 Jan  6 19:56 da82f9ebd384730dda7f831b4331c9e55893c100c83c0c9b0ce112436aa93416
# 省略其他文件
```

说明 docker 是为每个容器创建了一个子 cgroup 来单独限制。

```shell
[root@iZ2zefmrr626i66omb40ryZ docker]# cd da82f9ebd384730dda7f831b4331c9e55893c100c83c0c9b0ce112436aa93416/
[root@iZ2zefmrr626i66omb40ryZ da82f9ebd384730dda7f831b4331c9e55893c100c83c0c9b0ce112436aa93416]# cat memory.limit_in_bytes 
134217728
[root@iZ2zefmrr626i66omb40ryZ da82f9ebd384730dda7f831b4331c9e55893c100c83c0c9b0ce112436aa93416]# 
```

可以发现，这里面限制的内存 134217728/1024/1024 刚好就是我们指定的 128M。



所以 docker 使用 cgroup 其实很简单，就是根据用户指定的参数创建对应的 cgroup 限制。



### Go Demo

其实挺简单的，就是用 Go 翻译了一遍上面的命令。

具体代码如下：

```go
// cGroups cGroups初体验
func cGroups() {
	// /proc/self/exe是一个符号链接，代表当前程序的绝对路径
	if os.Args[0] == "/proc/self/exe" {
		// 第一个参数就是当前执行的文件名，所以只有fork出的容器进程才会进入该分支
		fmt.Printf("容器进程内部 PID %d\n", syscall.Getpid())
		// 需要先在宿主机上安装 stress 比如 apt-get install stress
		cmd := exec.Command("sh", "-c", `stress --vm-bytes 200m --vm-keep -m 1`)
		cmd.SysProcAttr = &syscall.SysProcAttr{}
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			fmt.Println(err)
			os.Exit(1)
		}
	} else {
		// 主进程会走这个分支
		cmd := exec.Command("/proc/self/exe")
		cmd.SysProcAttr = &syscall.SysProcAttr{Cloneflags: syscall.CLONE_NEWUTS | syscall.CLONE_NEWNS | syscall.CLONE_NEWPID}
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Start(); err != nil {
			fmt.Println(err)
			os.Exit(1)
		}
		// 得到 fork 出来的进程在外部namespace 的 pid
		fmt.Println("fork 进程 PID：", cmd.Process.Pid)
		// 在默认的 memory cgroup 下创建子目录，即创建一个子 cgroup
		err := os.Mkdir(filepath.Join(cgroupMemoryHierarchyMount, "testmemorylimit"), 0755)
		if err != nil {
			fmt.Println(err)
		}
		// 	将容器加入到这个 cgroup 中，即将进程PID加入到cgroup下的 cgroup.procs 文件中
		err = ioutil.WriteFile(filepath.Join(cgroupMemoryHierarchyMount, "testmemorylimit", "cgroup.procs"),
			[]byte(strconv.Itoa(cmd.Process.Pid)), 0644)
		if err != nil {
			fmt.Println(err)
			os.Exit(1)
		}
		// 	限制进程的内存使用，往 memory.limit_in_bytes 文件中写入数据
		err = ioutil.WriteFile(filepath.Join(cgroupMemoryHierarchyMount, "testmemorylimit", "memory.limit_in_bytes"),
			[]byte("100m"), 0644)
		if err != nil {
			fmt.Println(err)
			os.Exit(1)
		}
		cmd.Process.Wait()
	}
}
```

首先是一个 if 判断，区分主进程和子进程，分别执行不同逻辑。

* 主进程：fork出子进程，并创建 cgroup，然后将子进程加入该 cgrouop
* 子进程：执行 stress 命令，以消耗内存，便于查看 memory cgroup 的效果

运行并测试：

```shell
lixd  ~/projects/docker/mydocker main $ go build main.go
lixd  ~/projects/docker/mydocker main $ sudo ./main
fork 进程 PID： 21827
当前进程 pid 1
stress: info: [7] dispatching hogs: 0 cpu, 0 io, 1 vm, 0 hdd
```

根据输出可以知道，我们 fork 出的进程，pid 为 21827。

通过`pstree -pl`查看进程关系：

```shell
$pstree -pl
init(1)─┬─init(8)───init(9)───fsnotifier-wsl(10)
        ├─init(12)───init(13)─┬─exe(20618)─┬─sh(20623)───stress(20624)───stress(20625)
        │                     │            ├─{exe}(20619)
        │                     │            ├─{exe}(20620)
        │                     │            ├─{exe}(20621)
        │                     │            └─{exe}(20622)
└─zsh(14)───sudo(21821)───main(21822)─┬─exe(21827)─┬─sh(21832)───stress(21833)───stress(21834)
```



可以看到 21827 进程 最终启动了一个 21834 的 stress 进程。

`top`查看以下内存占用：

```shell
  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
21834 root      20   0  208664 101564    272 D  35.2   1.3   0:14.38 stress
```

可以看到 RES 101564，也就是刚好100M，说明我们的 cgroup 是有效果的。





## 4. 小结

本文主要介绍了 hierarchy  和 cgroup 相关的操作，如创建删除。

接着介绍了 hierarchy 中各个文件含义，重点包括 release_agent 的作用以及 cgroup.procs 和 tasks 的区别。

最后简答介绍了 Docker 是如何使用 cgroup 的，并提供了一个简单的 Go 语言操作 cgroup demo。





## 5. 参考

[cgroups(7) — Linux manual page](https://man7.org/linux/man-pages/man7/cgroups.7.html)

[Linux Cgroup系列（02）：创建并管理cgroup](https://segmentfault.com/a/1190000007241437)
