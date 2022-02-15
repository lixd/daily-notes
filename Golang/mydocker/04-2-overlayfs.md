# overlayfs

## 1. 概述

Docker 在使用镜像启动一个容器时，会新建2个layer: write layer和 container-init layer。

write layer是容器唯一的 可读写层；而 container-init layer 是为容器新建的只读层，用来存储容器启动时传入的系统信息(不过在实际的场景下，它们并不是以write layer和container-init layer命名的)。最后把write layer、container-init layer 和相关镜像的 layers 都 mount 到一个 mnt 目录下，然后把这个 mnt 目录作为容器启动的根目录。

之前章节已经实现了使用宿主机 /root/busybox 目录作为文件的根目录，但在容器内对文件的操作仍然会直接影响到宿主机的 /root/busybox 目录。本节要进一步进行容器和镜像隔离，实现在容器中进行的操作不会对镜像产生任何影响的功能。

主要是使用 overlayfs。

> 若对 overlayfs 不了解，可以先查一下这个 [ufs-1-初体验](https://github.com/lixd/daily-notes/blob/master/Golang/mydocker/%E5%9F%BA%E7%A1%80%E7%9F%A5%E8%AF%86/3-ufs-1%E5%88%9D%E4%BD%93%E9%AA%8C.md)。



## 2. 实现

overlayfs 包括 lower、upper、merged 和 work 4个目录。

> 其中 lower 层不会被修改，所有修改都发送在 upper 层中，而 merged 则作为 mount 点， work 目录则是 overlayfs 内部使用。

在本实现中使用 busybox 目录作为 lower 目录。

另外需要创建 upper、work和 merged 等三个目录备用。



### NewWorkSpace 

NewWorkSpace 函数是用来创建容器文件系统的，它包括 createLower、createDirs和mountOverlayFS。

* createLower 函数新建 busybox 文件夹，将 busybox.tar 解压到 busybox 目录下，作为容器的只读层。
* createDirs函数创建了以个名为 upper 的文件夹，作为容器唯一的可写层。
* mountOverlayFS 函数中，首先创建了 merged 文件夹，作为挂载点，然后把 busybox、upper 挂载到 merged 目录。

最后 NewParentProcess 函数中将容器使用的宿主机目录 root/busybox 替换成／root/merged。

```go
// NewWorkSpace Create an Overlay2 filesystem as container root workspace
func NewWorkSpace(rootURL string, mntURL string) {
	createLower(rootURL)
	createDirs(rootURL)
	mountOverlayFS(rootURL, mntURL)
}

// createLower 将busybox作为overlayfs的lower层
func createLower(rootURL string) {
	// 把busybox作为overlayfs中的lower层
	busyboxURL := rootURL + "busybox/"
	busyboxTarURL := rootURL + "busybox.tar"
	// 检查是否已经存在busybox文件夹
	exist, err := PathExists(busyboxURL)
	if err != nil {
		log.Infof("Fail to judge whether dir %s exists. %v", busyboxURL, err)
	}
	// 不存在则创建目录并将busybox.tar解压到busybox文件夹中
	if !exist {
		if err := os.Mkdir(busyboxURL, 0777); err != nil {
			log.Errorf("Mkdir dir %s error. %v", busyboxURL, err)
		}
		if _, err := exec.Command("tar", "-xvf", busyboxTarURL, "-C", busyboxURL).CombinedOutput(); err != nil {
			log.Errorf("Untar dir %s error %v", busyboxURL, err)
		}
	}
}

// createDirs 创建overlayfs需要的的upper、worker目录
func createDirs(rootURL string) {
	upperURL := rootURL + "upper/"
	if err := os.Mkdir(upperURL, 0777); err != nil {
		log.Errorf("mkdir dir %s error. %v", upperURL, err)
	}
	workURL := rootURL + "work/"
	if err := os.Mkdir(workURL, 0777); err != nil {
		log.Errorf("mkdir dir %s error. %v", workURL, err)
	}
}

// mountOverlayFS 挂载overlayfs
func mountOverlayFS(rootURL string, mntURL string) {
	// mount -t overlay overlay -o lowerdir=lower1:lower2:lower3,upperdir=upper,workdir=work merged
	// 创建对应的挂载目录
	if err := os.Mkdir(mntURL, 0777); err != nil {
		log.Errorf("Mkdir dir %s error. %v", mntURL, err)
	}
	// 拼接参数
	// e.g. lowerdir=/root/busybox,upperdir=/root/upper,workdir=/root/merged
	dirs := "lowerdir=" + rootURL + "busybox" + ",upperdir=" + rootURL + "upper" + ",workdir=" + rootURL + "work"
	// dirs := "dirs=" + rootURL + "writeLayer:" + rootURL + "busybox"
	cmd := exec.Command("mount", "-t", "overlay", "overlay", "-o", dirs, mntURL)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		log.Errorf("%v", err)
	}
}
```

接下来，在 NewParentProcess 函数中将容器使用的宿主机目录／root/busybox 替换成root/mnt 。这样 ，使用 OverlayFS 系统启动容器的代码就完成了。

```go
func NewParentProcess(tty bool) (*exec.Cmd, *os.File) {
	// 省略其他代码
	cmd.ExtraFiles = []*os.File{readPipe}
	mntURL := "/root/merged/"
	rootURL := "/root/"
	NewWorkSpace(rootURL, mntURL)
	cmd.Dir = mntURL
	return cmd, writePipe
}
```



### DeleteWorkSpace 

Docker 会在删除容器的时候，把容器对应 WriteLayer 和 Container-init Layer 删除，而保留镜像所有的内容。本节中在容器退出的时候也会删除 upper、work 和 merged 目录只保留作为镜像的 lower 层目录即 busybox。

DeleteWorkSpace 函数包括 umountOverlayFS 和 deleteDirs。

* 首先，在 umountOverlayFS 函数中 umount merged 目录，然后删除 merged 目录。
* 接着，在 deleteDirs 函数中删除 upper 和 work 文件夹。这样容器对文件系统的更改，就都已经抹去了。

```go
// DeleteWorkSpace Delete the AUFS filesystem while container exit
func DeleteWorkSpace(rootURL string, mntURL string) {
	umountOverlayFS(mntURL)
	deleteDirs(rootURL)
}

func umountOverlayFS(mntURL string) {
	cmd := exec.Command("umount", mntURL)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		log.Errorf("%v", err)
	}
	if err := os.RemoveAll(mntURL); err != nil {
		log.Errorf("Remove dir %s error %v", mntURL, err)
	}
}

func deleteDirs(rootURL string) {
	writeURL := rootURL + "upper/"
	if err := os.RemoveAll(writeURL); err != nil {
		log.Errorf("Remove dir %s error %v", writeURL, err)
	}
	workURL := rootURL + "work"
	if err := os.RemoveAll(workURL); err != nil {
		log.Errorf("Remove dir %s error %v", workURL, err)
	}
}

func PathExists(path string) (bool, error) {
	_, err := os.Stat(path)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

```





## 3. 测试

首先将`busybox.tar` 放到 /root 目录下：

```shell
$ ls
busybox.tar
```

然后启动我们的容器

```shell
$ sudo ./mydocker run -it /bin/sh
{"level":"info","msg":"command all is /bin/sh","time":"2022-02-14T20:58:04+08:00"}
{"level":"info","msg":"init come on","time":"2022-02-14T20:58:04+08:00"}
{"level":"info","msg":"Current location is /root/merged","time":"2022-02-14T20:58:04+08:00"}
{"level":"info","msg":"Find path /bin/sh","time":"2022-02-14T20:58:04+08:00"}
```

再次查看宿主机的 /root 目录：

```shell
root@DESKTOP-9K4GB6E:~# ls
busybox  busybox.tar  merged  upper  work
```

可以看到，多了几个目录：busybox、merged、upper、work。



在容器中新建一个文件：

```shell
/ # touch /tmp/17x.txt
/ # ls tmp/
17x.txt
```

然后切换到宿主机：

```shell
$ ls busybox/tmp/
(empty)
$ ls merged/tmp/
17x.txt
$ ls upper/tmp
17x.txt
```

可以发现，这个新创建的文件居然不在 busybox 目录，而是在 upper 中，然后 merged 目录中也可以看到。

> 这就是 overlayfs 的作用了。没有修改 busybox，而是 upper 中复制了 tmp 目录，并创建了对应文件。

在容器中执行 exit 退出容器，然后再次查看宿主机上的 root 文件夹内容。 upper、work 和 merged 目录被删除，作为镜像的 busybox 层仍然保留，并且内容未被修改。

```shell
root@DESKTOP-9K4GB6E:~# ls
busybox  busybox.tar
```



