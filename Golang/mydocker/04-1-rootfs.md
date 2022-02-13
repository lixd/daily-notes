# 挂载rootfs

## 1. 概述

前面使用了 Namespace 和 Cgroups 技术创建了一个简单的容器，但是大家应该可以发现，容器内的目录还是当前运行程序的目录。而且如果运行一下 mount 命令可以看到继承自父进程的所有挂载点，这貌似和平常使用的容器表现不同。

因为这里缺少了镜像这么一个重要的特性。Docker 镜像可以说是一项伟大的创举，它使得容器传递和迁移更加简单，那么这一节会做一个简单的镜像，让容器跑在有镜像的环境中。



## 2. 使用 busybox 创建容器

Docker 镜像包含了文件系统，所以可以直接运行，我们这里就先弄个简单的，**先在宿主机上某一个目录上准备一个精简的文件系统，然后容器运行时挂载这个目录作为 rootfs**。



### 准备 busybox

首先使用一个最精简的镜像一busybox 来作为我们的文件系统。busybox 是一个集合了非常多 UNIX 工具的箱子，它可以提供非常多在 UNIX 环境下经常使用的命令，可以说 busybox 提供了一个非常完整而且小巧的系统。本小会先使用它来作为第一个容器内运行的文件系统。



获得 busybox 文件系统的 rootfs 很简单，可以使用 docker export 将一个镜像打成一个 tar包。
首先做如下操作。

首先拉取镜像并运行

```shell
$ docker pull busybox
$ docker run -d busybox top -d
```

然后用 export 命令导出成一个 tar 包并解压

```shell
$ docker export -o busybox.tar [containerID]
$ tar -xvf busybox.tar -C busybox/
```

这样就得到了 busybox 文件系统的 rootfs ，可以把这个作为我们的文件系统使用。

大概是这样的：

```shell
$ ls -l
total 48
drwxr-xr-x 2 lixd lixd 12288 Dec 30 05:12 bin
drwxr-xr-x 4 lixd lixd  4096 Feb 10 20:17 dev
drwxr-xr-x 3 lixd lixd  4096 Feb 10 20:17 etc
drwxr-xr-x 2 lixd lixd  4096 Dec 30 05:12 home
drwxr-xr-x 2 lixd lixd  4096 Feb 10 20:17 proc
drwx------ 2 lixd lixd  4096 Dec 30 05:12 root
drwxr-xr-x 2 lixd lixd  4096 Feb 10 20:17 sys
drwxr-xr-x 2 lixd lixd  4096 Dec 30 05:12 tmp
drwxr-xr-x 3 lixd lixd  4096 Dec 30 05:12 usr
drwxr-xr-x 4 lixd lixd  4096 Dec 30 05:12 var
```



### 挂载文件系统pivot_root

把之前的 busybox rootfs 放到`/root/busybox` 目录下备用。

然后调用`pivot_root` 系统调用来切换整个系统的 rootfs，配合上 `/root/busybox` 来实现一个类似镜像的功能。

`pivot_root` 是一个系统调用，主要功能是去改变当前的 root 文件系统。pivot_root 可以将当前进程的 root 文件系统移动到 put_old 文件夹中，然后使 new_root 成为新的 root 文件系统。

> 注意：new_root 和 put_old 不能同时存在当前 root 的同一个文件系统中。

pivotroot 和 chroot 的主要区别是：

* pivot_root 是把整个系统切换到一个新的 root 目录，会移除对之前 root 文件系统的依赖，这样你就能够 umount 原先的 root 文件系统。

* 而 chroot 是针对某个进程，系统的其他部分依旧运行于老的 root 目录中。



具体实现如下：

```go

/**
Init 挂载点
*/
func setUpMount() {
	pwd, err := os.Getwd()
	if err != nil {
		log.Errorf("Get current location error %v", err)
		return
	}
	log.Infof("Current location is %s", pwd)
	pivotRoot(pwd)

	// mount proc
	defaultMountFlags := syscall.MS_NOEXEC | syscall.MS_NOSUID | syscall.MS_NODEV
	syscall.Mount("proc", "/proc", "proc", uintptr(defaultMountFlags), "")

	syscall.Mount("tmpfs", "/dev", "tmpfs", syscall.MS_NOSUID|syscall.MS_STRICTATIME, "mode=755")
}

func pivotRoot(root string) error {
	/**
	  为了使当前root的老root和新root不在同一个文件系统下，我们把root重新mount了一次
	  bind mount是把相同的内容换了一个挂载点的挂载方法
	*/
	if err := syscall.Mount(root, root, "bind", syscall.MS_BIND|syscall.MS_REC, ""); err != nil {
		return errors.Wrap(err, "mount rootfs to itself")
	}
	// 创建 rootfs/.pivot_root 存储 old_root
	pivotDir := filepath.Join(root, ".pivot_root")
	if err := os.Mkdir(pivotDir, 0777); err != nil {
		return err
	}
	// pivot_root 到新的rootfs, 现在老的 old_root 是挂载在rootfs/.pivot_root
	// 挂载点现在依然可以在mount命令中看到
	if err := syscall.PivotRoot(root, pivotDir); err != nil {
		return fmt.Errorf("pivot_root %v", err)
	}
	// 修改当前的工作目录到根目录
	if err := syscall.Chdir("/"); err != nil {
		return fmt.Errorf("chdir / %v", err)
	}

	pivotDir = filepath.Join("/", ".pivot_root")
	// umount rootfs/.pivot_root
	if err := syscall.Unmount(pivotDir, syscall.MNT_DETACH); err != nil {
		return fmt.Errorf("unmount pivot_root dir %v", err)
	}
	// 删除临时文件夹
	return os.Remove(pivotDir)
}
```

然后再 build cmd 的时候指定：

```go
func NewParentProcess(tty bool) (*exec.Cmd, *os.File) {
	cmd := exec.Command("/proc/self/exe", "init")
	// .. 省略其他代码
    // 指定 cmd 的工作目录为我们前面准备好的用于存放busybox rootfs的目录
	cmd.Dir = "/root/busybox"
	return cmd, writePipe
}
```



到此这一小节就完成了，测试一下。



## 3. 测试

```shell
$ go build .
$ sudo ./mydocker run -it /bin/ls
{"level":"info","msg":"command all is /bin/ls","time":"2022-02-10T20:30:02+08:00"}
{"level":"info","msg":"init come on","time":"2022-02-10T20:30:02+08:00"}
{"level":"info","msg":"Current location is /root/busybox","time":"2022-02-10T20:30:02+08:00"}
{"level":"info","msg":"Find path /bin/ls","time":"2022-02-10T20:30:02+08:00"}
bin   dev   etc   home  proc  root  sys   tmp   usr   var
```

可以看到，现在打印出来的就是`/root/busybox` 目录下的内容了，说明我们的 rootfs 切换完成。