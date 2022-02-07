# docker 是如何使用 overlays 的

## 1. 概述

每一个Docker image都是由一系列的read-only layers组成：

* image layers的内容都存储在Docker hosts filesystem的/var/lib/docker/aufs/diff目录下
* 而/var/lib/docker/aufs/layers目录则存储着image layer如何堆栈这些layer的metadata。



docker支持多种graphDriver，包括vfs、devicemapper、overlay、overlay2、aufs等等，其中最常用的就是aufs了，但随着linux内核3.18把overlay纳入其中，overlay的地位变得更重。

`docker info`命令可以查看docker的文件系统。

```sh
$ docker info 
# ...
 Storage Driver: overlay2
#...
```

比如这里用的就是 overlay2.

## 2. 演示

**以构建镜像方式演示以下 docker 是如何使用 overlayfs 的。**

先拉一下 Ubuntu:20.04 的镜像：

```shell
$ docker pull ubuntu:20.04
20.04: Pulling from library/ubuntu
Digest: sha256:626ffe58f6e7566e00254b638eb7e0f3b11d4da9675088f4781a50ae288f3322
Status: Downloaded newer image for ubuntu:20.04
docker.io/library/ubuntu:20.04
```



然后写个简单的 Dockerfile ：

```dockerfile
 FROM ubuntu:20.04

 RUN echo "Hello world" > /tmp/newfile
```

开始构建：

```shell
$ docker build -t hello-ubuntu .
Sending build context to Docker daemon  2.048kB
Step 1/2 : FROM ubuntu:20.04
 ---> ba6acccedd29
Step 2/2 : RUN echo "Hello world" > /tmp/newfile
 ---> Running in ee79bb9802d0
Removing intermediate container ee79bb9802d0
 ---> 290d8cc1f75a
Successfully built 290d8cc1f75a
Successfully tagged hello-ubuntu:latest
```

查看构建好的镜像：

```shell
$ docker images
REPOSITORY                                             TAG            IMAGE ID       CREATED          SIZE
hello-ubuntu                                           latest         290d8cc1f75a   13 minutes ago   72.8MB
ubuntu                                                 20.04          ba6acccedd29   3 months ago     72.8MB
```

使用`docker history`命令，查看镜像使用的 image layer 情况：

```shell
$ docker history hello-ubuntu
IMAGE          CREATED          CREATED BY                                      SIZE      COMMENT
290d8cc1f75a   22 seconds ago   /bin/sh -c echo "Hello world" > /tmp/newfile    12B       
ba6acccedd29   3 months ago     /bin/sh -c #(nop)  CMD ["bash"]                 0B        
<missing>      3 months ago     /bin/sh -c #(nop) ADD file:5d68d27cc15a80653…   72.8MB
```

> missing ”标记的 layer ，是自 Docker 1.10 之后，一个镜像的 image layer image history 数据都存储在 个文件中导致的，这是 Docker 官方认为 正常行为。

可以看到，290d8cc1f75a 这一层在最上面，只用了 12Bytes，而下面的两层都是共享的，这也证明了AUFS是如何高效使用磁盘空间的。

然后去找一下具体的文件：

docker默认的存储目录是`/var/lib/docker`,具体如下：

```shell
[root@iZ2zefmrr626i66omb40ryZ docker]$ ls -al
total 24
drwx--x--x  13 root root   167 Jul 16  2021 .
drwxr-xr-x. 42 root root  4096 Oct 13 15:07 ..
drwx--x--x   4 root root   120 May 24  2021 buildkit
drwx-----x   7 root root  4096 Jan 17 20:25 containers
drwx------   3 root root    22 May 24  2021 image
drwxr-x---   3 root root    19 May 24  2021 network
drwx-----x  53 root root 12288 Jan 17 20:25 overlay2
drwx------   4 root root    32 May 24  2021 plugins
drwx------   2 root root     6 Jul 16  2021 runtimes
drwx------   2 root root     6 May 24  2021 swarm
drwx------   2 root root     6 Jan 17 20:25 tmp
drwx------   2 root root     6 May 24  2021 trust
drwx-----x   5 root root   266 Dec 29 14:31 volumes
```

在这里，我们只关心`image`和`overlay2`就足够了。

* image：镜像相关
* overlay2：docker 文件所在目录，也可能不叫这个名字，具体和文件系统有关，比如可能是 aufs 等。

先看 `image`目录：

docker会在`/var/lib/docker/image`目录下按每个存储驱动的名字创建一个目录，如这里的`overlay2`。

```shell
[root@iZ2zefmrr626i66omb40ryZ docker]$ cd image/
[root@iZ2zefmrr626i66omb40ryZ image]$ ls
overlay2
# 看下里面有哪些文件
[root@iZ2zefmrr626i66omb40ryZ image]$ tree -L 2 overlay2/
overlay2/
├── distribution
│   ├── diffid-by-digest
│   └── v2metadata-by-diffid
├── imagedb
│   ├── content
│   └── metadata
├── layerdb
│   ├── mounts
│   ├── sha256
│   └── tmp
└── repositories.json
```

这里的关键地方是`imagedb`和`layerdb`目录，看这个目录名字，很明显就是专门用来存储元数据的地方。

* layerdb：docker image layer 信息
* imagedb：docker image 信息

因为 docker image 是由 layer 组成的，而 layer 也已复用，所以分成了 layerdb 和 imagedb。

先去 imagedb 看下刚才构建的镜像：

```shell
$  cd overlay2/imagedb/content/sha256
$ ls
[root@iZ2zefmrr626i66omb40ryZ sha256]# ls
0c7ea9afc0b18a08b8d6a660e089da618541f9aa81ac760bd905bb802b05d8d5  61ad638751093d94c7878b17eee862348aa9fc5b705419b805f506d51b9882e7 
// .... 省略
b20b605ed599feb3c4757d716a27b6d3c689637430e18d823391e56aa61ecf01
60d84e80b842651a56cd4187669dc1efb5b1fe86b90f69ed24b52c37ba110aba  ba6acccedd2923aee4c2acc6a23780b14ed4b8a5fa4e14e252a23b846df9b6c1
```

可以看到，都是 64 位的ID，这些就是具体镜像信息，刚才构建的镜像ID为`290d8cc1f75a`,所以就找`290d8cc1f75a`开头的文件：

```shell
[root@iZ2zefmrr626i66omb40ryZ sha256]$ cat 290d8cc1f75a4e230d645bf03c49bbb826f17d1025ec91a1eb115012b32d1ff8 
{"architecture":"amd64","config":{"Hostname":"","Domainname":"","User":"","AttachStdin":false,"AttachStdout":false,"AttachStderr":false,"Tty":false,"OpenStdin":false,"StdinOnce":false,"Env":["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"],"Cmd":["bash"],"Image":"sha256:ba6acccedd2923aee4c2acc6a23780b14ed4b8a5fa4e14e252a23b846df9b6c1","Volumes":null,"WorkingDir":"","Entrypoint":null,"OnBuild":null,"Labels":null},"container":"ee79bb9802d0ff311de6d606fad35fa7e9ab0c1cb4113837a50571e79c9454df","container_config":{"Hostname":"","Domainname":"","User":"","AttachStdin":false,"AttachStdout":false,"AttachStderr":false,"Tty":false,"OpenStdin":false,"StdinOnce":false,"Env":["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"],"Cmd":["/bin/sh","-c","echo \"Hello world\" \u003e /tmp/newfile"],"Image":"sha256:ba6acccedd2923aee4c2acc6a23780b14ed4b8a5fa4e14e252a23b846df9b6c1","Volumes":null,"WorkingDir":"","Entrypoint":null,"OnBuild":null,"Labels":null},"created":"2022-01-17T12:25:14.91890037Z","docker_version":"20.10.6","history":[{"created":"2021-10-16T00:37:47.226745473Z","created_by":"/bin/sh -c #(nop) ADD file:5d68d27cc15a80653c93d3a0b262a28112d47a46326ff5fc2dfbf7fa3b9a0ce8 in / "},{"created":"2021-10-16T00:37:47.578710012Z","created_by":"/bin/sh -c #(nop)  CMD [\"bash\"]","empty_layer":true},{"created":"2022-01-17T12:25:14.91890037Z","created_by":"/bin/sh -c echo \"Hello world\" \u003e /tmp/newfile"}],"os":"linux","rootfs":{"type":"layers","diff_ids":["sha256:9f54eef412758095c8079ac465d494a2872e02e90bf1fb5f12a1641c0d1bb78b","sha256:b3cce2ce0405ffbb4971b872588c5b7fc840514b807f18047bf7d486af79884c"]}}
```

这就是 image 的 metadata，这里主要关注 rootfs：

```shell
# 和 docker inspect 命令显示的内容差不多
// ...
"rootfs":{"type":"layers","diff_ids":
[
"sha256:9f54eef412758095c8079ac465d494a2872e02e90bf1fb5f12a1641c0d1bb78b",
"sha256:b3cce2ce0405ffbb4971b872588c5b7fc840514b807f18047bf7d486af79884c"
]
}
// ...
```

可以看到rootfs的diff_ids是一个包含了两个元素的数组，这两个元素就是组成hello-ubuntu镜像的两个Layer的**`diffID`**。从上往下看，就是底层到顶层，也就是说`9f54eef412...`是image的最底层。

然后根据 layerID 去`layerdb`目录寻找对应的 layer：

```shell
[root@iZ2zefmrr626i66omb40ryZ overlay2]# tree -L 2 layerdb/
layerdb/
├── mounts
├── sha256
└── tmp
```

在这里我们只管`mounts`和`sha256`两个目录，先打印以下 sha256 目录

```shell
$ cd /var/lib/docker/image/overlay2/layerdb/sha256/
$ ls
05dd34c0b83038031c0beac0b55e00f369c2d6c67aed11ad1aadf7fe91fbecda  
// ... 省略
6aa07175d1ac03e27c9dd42373c224e617897a83673aa03a2dd5fb4fd58d589f  
```

可以看到，layer 里也是 64位随机ID构成的目录，找到刚才hello-ubuntu镜像的最底层layer：

```shell
$ cd 9f54eef412758095c8079ac465d494a2872e02e90bf1fb5f12a1641c0d1bb78b
[root@iZ2zefmrr626i66omb40ryZ 9f54eef412758095c8079ac465d494a2872e02e90bf1fb5f12a1641c0d1bb78b]$ ls
cache-id  diff  size  tar-split.json.gz
```

文件含义如下：

* cache-id：为具体`/var/lib/docker/overlay2/<cache-id>`存储路径
* diff：diffID，用于计算 ChainID
* size：当前 layer 的大小



docker使用了chainID的方式来保存layer，layer.ChainID只用本地，根据layer.DiffID计算，并用于layerdb的目录名称。

chainID唯一标识了一组（像糖葫芦一样的串的底层）diffID的hash值，包含了这一层和它的父层(底层)，

* 当然这个糖葫芦可以有一颗山楂，也就是chainID(layer0)==diffID(layer0)；
* 对于多颗山楂的糖葫芦，ChainID(layerN) = SHA256hex(ChainID(layerN-1) + " " + DiffID(layerN))。

```shell
# 查看 diffID，
$ cat diff 
sha256:9f54eef412758095c8079ac465d494a2872e02e90bf1fb5f12a1641c0d1bb78b
```

由于这是 layer0,所以 chainID 就是 diffID，然后开始计算 layer1 的 chainID：

```shell
ChainID(layer1) = SHA256hex(ChainID(layer0) + " " + DiffID(layer1))
```

layer0的 chainID就是`9f54...`,而 layer1的 diffID 根据 rootfs 中的数组可知，为`b3cce...`

计算ChainID：

```shell
$ echo -n "sha256:9f54eef412758095c8079ac465d494a2872e02e90bf1fb5f12a1641c0d1bb78b sha256:b3cce2ce0405ffbb4971b872588c5b7fc840514b807f18047bf7d486af79884c" | sha256sum| awk '{print $1}'
6613b10b697b0a267c9573ee23e54c0373ccf72e7991cf4479bd0b66609a631c
```

> 一定注意要加上 “sha256:”和中间的空格“ ” 这两部分。

因此 layer1的 chainID 就是`6613...`

```shell
$ cd /var/lib/docker/image/overlay2/layerdb/sha2566613b10b697b0a267c9573ee23e54c0373ccf72e7991cf4479bd0b66609a631c
# 根据这个大小可以知道，就是hello-ubuntu 镜像的最上面层 layer
[root@iZ2zefmrr626i66omb40ryZ 6613b10b697b0a267c9573ee23e54c0373ccf72e7991cf4479bd0b66609a631c]$ cat size 
12
# 查看 cache-id 找到 文件系统中的具体位置
[root@iZ2zefmrr626i66omb40ryZ 6613b10b697b0a267c9573ee23e54c0373ccf72e7991cf4479bd0b66609a631c]$ cat cache-id 
83b569c0f5de093192944931e4f41dafb2d7f80eae97e4bd62425c20e2079f65
```

进入具体目录：



```shell
# 进入刚才生成的目录
$ cd /var/lib/docker/overlay2/83b569c0f5de093192944931e4f41dafb2d7f80eae97e4bd62425c20e2079f65
[root@iZ2zefmrr626i66omb40ryZ 83b569c0f5de093192944931e4f41dafb2d7f80eae97e4bd62425c20e2079f65]# ls -al
total 24
drwx-----x  4 root root    55 Jan 17 20:25 .
drwx-----x 53 root root 12288 Jan 17 20:25 ..
drwxr-xr-x  3 root root    17 Jan 17 20:25 diff
-rw-r--r--  1 root root    26 Jan 17 20:25 link
-rw-r--r--  1 root root    28 Jan 17 20:25 lower
drwx------  2 root root     6 Jan 17 20:25 work
# 查看 diff 目录
[root@iZ2zefmrr626i66omb40ryZ 
83b569c0f5de093192944931e4f41dafb2d7f80eae97e4bd62425c20e2079f65]$ cd diff/
[root@iZ2zefmrr626i66omb40ryZ diff]$ ls
tmp
[root@iZ2zefmrr626i66omb40ryZ diff]$ cd tmp/
[root@iZ2zefmrr626i66omb40ryZ tmp]$ ls
newfile
[root@iZ2zefmrr626i66omb40ryZ tmp]# cat newfile 
Hello world
```

可以看到，我们新增的 newfile 就在这里。

