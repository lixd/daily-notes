# 用 Go 语言实现通过cgroup限制容器的资源



## Docker 是如何使用 cgroup 的

我们知道 Docker 是通过 Cgroups 实现容器资源限制和监控的，那么具体是怎么用的呢？

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

说明 docker 是未每个容器创建了一个子 cgroup 来单独限制。

```shell
[root@iZ2zefmrr626i66omb40ryZ docker]# cd da82f9ebd384730dda7f831b4331c9e55893c100c83c0c9b0ce112436aa93416/
[root@iZ2zefmrr626i66omb40ryZ da82f9ebd384730dda7f831b4331c9e55893c100c83c0c9b0ce112436aa93416]# cat memory.limit_in_bytes 
134217728
[root@iZ2zefmrr626i66omb40ryZ da82f9ebd384730dda7f831b4331c9e55893c100c83c0c9b0ce112436aa93416]# 
```

可以发现，这里面限制的内存 134217728/1024/1024 刚好就是我们指定的 128M。



所以 docker 使用 cgroup 其实很简单，就是根据用户指定的参数创建对应的 cgroup 限制。



## Go 语言中使用 cgroup

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