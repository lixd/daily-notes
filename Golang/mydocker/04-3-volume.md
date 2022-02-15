# 实现 volume 数据卷

## 1. 概述

上一节实现了使用 OverlayFS 包装 busybox，从而实现容器和镜像的分离。但是一旦容器退出，容器可写层的所有内容都会被删除。

*那么，如果用户需要持久化容器里的部分数据该怎么办呢?*

volume 就是用来解决这个问题的。

本节将会介绍如何实现将宿主机的目录作为数据卷挂载到容器中，并且在容器退出后，数据卷中的内容仍然能够保存在宿主机上。

**主要依赖于 linux 的 bind mount 功能，将一个目录挂载到另外一个目录上。**

```shell
mount -o bind /hostURL /containerURL
```



## 2. 实现

在之前的基础上熟悉绑定宿主即文件夹到容器数据卷的功能。

### runCommand

首先在 runCommand 命令中添 -v 标签，以接收 -v 参数。

```go
var runCommand = cli.Command{
	Name: "run",
	Usage: `Create a container with namespace and cgroups limit
			mydocker run -it [command]`,
	Flags: []cli.Flag{
		cli.BoolFlag{
			Name:  "it", // 简单起见，这里把 -i 和 -t 参数合并成一个
			Usage: "enable tty",
		},
		cli.StringFlag{
			Name:  "mem", // 为了避免和 stress 命令的 -m 参数冲突 这里使用 -mem,到时候可以看下解决冲突的方法
			Usage: "memory limit",
		},
		cli.StringFlag{
			Name:  "cpu",
			Usage: "cpu quota",
		},
		cli.StringFlag{
			Name:  "cpuset",
			Usage: "cpuset limit",
		},
		cli.StringFlag{
			Name:  "v",
			Usage: "volume",
		},
	},
	/*
		这里是run命令执行的真正函数。
		1.判断参数是否包含command
		2.获取用户指定的command
		3.调用Run function去准备启动容器:
	*/
	Action: func(context *cli.Context) error {
		if len(context.Args()) < 1 {
			return fmt.Errorf("missing container command")
		}

		var cmdArray []string
		for _, arg := range context.Args() {
			cmdArray = append(cmdArray, arg)
		}

		tty := context.Bool("it")
		resConf := &subsystems.ResourceConfig{
			MemoryLimit: context.String("mem"),
			CpuSet:      context.String("cpuset"),
			CpuCfsQuota: context.Int("cpu"),
		}
		volume := context.String("v")
		Run(tty, cmdArray, resConf, volume)
		return nil
	},
}
```

在 Run 函数中，把 volume 传给创建容器的 NewParentProcess 函数和删除容器文件系统的 DeleteWorkSpace 函数。

```go
func Run(tty bool, comArray []string, res *subsystems.ResourceConfig, volume string) {
	parent, writePipe := container.NewParentProcess(tty,volume)
	if parent == nil {
		log.Errorf("New parent process error")
		return
	}
	if err := parent.Start(); err != nil {
		log.Errorf("Run parent.Start err:%v", err)
	}
	// 创建cgroup manager, 并通过调用set和apply设置资源限制并使限制在容器上生效
	cgroupManager := cgroups.NewCgroupManager("mydocker-cgroup")
	defer cgroupManager.Destroy()
	_ = cgroupManager.Set(res)
	_ = cgroupManager.Apply(parent.Process.Pid, res)
	// 再子进程创建后才能通过管道来发送参数
	sendInitCommand(comArray, writePipe)
	_ = parent.Wait()
	mntURL := "/root/merged/"
	rootURL := "/root/"
	container.DeleteWorkSpace(rootURL, mntURL, volume)
}
```



### NewWorkSpace

在原有创建过程中增加以下流程：

* 1）首先判断 volume 是否为空，如果是，就表示用户并没有使用挂载标签，结束创建过程。
* 2）如果不为空，则使用 volumeUrlExtract 函数解析 volume 字符串。
* 3）当 volumeUrlExtract 函数返回的字符数组长度为 2，并且数据元素均不为空的时候，则执行 mountVolume 函数来挂载数据卷。
* 4）否则，提示用户创建数据卷输入值不对。

```go
func NewWorkSpace(rootURL, mntURL, volume string) {
	createLower(rootURL)
	createDirs(rootURL)
	mountOverlayFS(rootURL, mntURL)
	if volume != "" {
		volumeURLs := volumeUrlExtract(volume)
		if len(volumeURLs) == 2 && volumeURLs[0] != "" && volumeURLs[1] != "" {
			mountVolume(rootURL, mntURL, volumeURLs)
			log.Infof("volumeURL:%q", volumeURLs)
		} else {
			log.Infof("volume parameter input is not correct.")
		}
	}
}
```



```go
// volumeUrlExtract 通过冒号分割解析volume目录，比如 -v /tmp:/tmp
func volumeUrlExtract(volume string) []string {
	var volumeURLs []string
	volumeURLs = strings.Split(volume, ":")
	return volumeURLs
}

```



挂载数据卷的过程如下。

* 1）首先，读取宿主机文件目录URL， 创建宿主机文件目录(root$ {parentUrl}) 
* 2）然后，读取容器挂载点URL,在容器文件系统里创建挂载点(oot/mnt$ {containerUr})。
* 3）最后，把宿主机文件目录挂载到容器挂载点。这样启动容器的过程，对数据卷的处理也就完成了。



```go
func mountVolume(rootURL string, mntURL string, volumeURLs []string) {
	// 第0个元素为宿主机目录
	parentUrl := volumeURLs[0]
	if err := os.Mkdir(parentUrl, 0777); err != nil {
		log.Infof("mkdir parent dir %s error. %v", parentUrl, err)
	}
	// 第1个元素为容器目录
	containerUrl := volumeURLs[1]
	// 拼接并创建对应的容器目录
	containerVolumeURL := mntURL + containerUrl
	if err := os.Mkdir(containerVolumeURL, 0777); err != nil {
		log.Infof("mkdir container dir %s error. %v", containerVolumeURL, err)
	}
	// 通过bind mount 将宿主机目录挂载到容器目录
	// mount -o bind /hostURL /containerURL
	cmd := exec.Command("mount", "-o", "bind", parentUrl, containerVolumeURL)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		log.Errorf("mount volume failed. %v", err)
	}
}
```



### DeleteWorkSpace

删除容器文件系统时，先判断是否挂载了 volume，如果挂载了则删除时则需要先 umount volume。

```go
func DeleteWorkSpace(rootURL, mntURL, volume string) {
	// 如果指定了volume则需要先umount volume
	if volume != "" {
		volumeURLs := volumeUrlExtract(volume)
		length := len(volumeURLs)
		if length == 2 && volumeURLs[0] != "" && volumeURLs[1] != "" {
			umountVolume(mntURL, volumeURLs)
		}
	}
	// 然后umount整个容器的挂载点
	umountOverlayFS(mntURL)
	// 最后移除相关文件夹
	deleteDirs(rootURL)
}
```



## 3.测试

下面来验证一下程序的正确性。 

### 挂载不存在的目录

第一个实验是把一个宿主机上不存在的文件目录挂载到容器中。

首先还是要在 root 目录准备好 busybox.tar,作为我们的镜像只读层。

```shell
$ ls
busybox.tar
```

启动容器，把宿主机的 /rootvolume 挂载到容器的 /containerVolume 目录下。

```shell
$ sudo ./mydocker run -it -v /root/volume:containerVolume /bin/sh
{"level":"info","msg":"createLower","time":"2022-02-15T20:40:13+08:00"}
{"level":"info","msg":"mountOverlayFS cmd:/usr/bin/mount -t overlay overlay -o lowerdir=/root/busybox,upperdir=/root/upper,workdir=/root/work /root/merged","time":"2022-02-15T20:40:13+08:00"}
{"level":"info","msg":"mountVolume","time":"2022-02-15T20:40:13+08:00"}
{"level":"info","msg":"volumeURL:[/root/volume containerVolume]","time":"2022-02-15T20:40:13+08:00"}
{"level":"info","msg":"command all is /bin/sh","time":"2022-02-15T20:40:13+08:00"}
{"level":"info","msg":"init come on","time":"2022-02-15T20:40:13+08:00"}
{"level":"info","msg":"Current location is /root/merged","time":"2022-02-15T20:40:13+08:00"}
{"level":"info","msg":"Find path /bin/sh","time":"2022-02-15T20:40:13+08:00"}
```



新开一个窗口，查看宿主机 /root 目录：

```shell
root@DESKTOP-9K4GB6E:~# ls
busybox  busybox.tar  merged  upper  volume  work
```

多了几个目录，其中 volume 就是我们启动容器是指定的 volume 在宿主机上的位置。

同样的，容器中也多了 containerVolume 目录：

```shell
/ # ls
bin              dev              home             root             tmp              var
containerVolume  etc              proc             sys              usr
```

现在往 containerVolume 目录写入一个文件

```shell
/ # touch containerVolume/17x.txt
/ # ls containerVolume/
17x.txt
```

然后查看宿主机的 volume 目录：

```shell
root@DESKTOP-9K4GB6E:~# ls volume/
17x.txt
```

可以看到，文件也在。



然后测试退出容器后是否能持久化。

退出容器：

```shell
/ # exit
```

宿主机中再次查看 volume 目录：

```shell
root@DESKTOP-9K4GB6E:~# ls volume/
17x.txt
```

文件还在，说明我们的 volume 功能是正常的。



### 挂载以存在目录

第二次实验是测试挂载一个已经存在的目录，这里就把刚才创建的 volume 目录再挂载一次：

```shell
$ sudo ./mydocker run -it -v /root/volume:containerVolume /bin/sh
[sudo] password for lixd:
{"level":"info","msg":"createLower","time":"2022-02-15T20:57:27+08:00"}
{"level":"info","msg":"mountOverlayFS cmd:/usr/bin/mount -t overlay overlay -o lowerdir=/root/busybox,upperdir=/root/upper,workdir=/root/work /root/merged","time":"2022-02-15T20:57:27+08:00"}
{"level":"info","msg":"mountVolume","time":"2022-02-15T20:57:27+08:00"}
{"level":"info","msg":"mkdir parent dir /root/volume error. mkdir /root/volume: file exists","time":"2022-02-15T20:57:27+08:00"}
{"level":"info","msg":"volumeURL:[/root/volume containerVolume]","time":"2022-02-15T20:57:27+08:00"}
{"level":"info","msg":"command all is /bin/sh","time":"2022-02-15T20:57:27+08:00"}
{"level":"info","msg":"init come on","time":"2022-02-15T20:57:27+08:00"}
{"level":"info","msg":"Current location is /root/merged","time":"2022-02-15T20:57:27+08:00"}
{"level":"info","msg":"Find path /bin/sh","time":"2022-02-15T20:57:27+08:00"}
```

然后更新文件内容并退出:

```shell
/ # echo 123 >> containerVolume/17x.txt
/ # cat containerVolume/17x.txt
123
/ # exit
```

在宿主机上查看：

```shell
root@DESKTOP-9K4GB6E:~# cat volume/17x.txt
123
```



至此，说明我们的 volume 功能是正常的。
