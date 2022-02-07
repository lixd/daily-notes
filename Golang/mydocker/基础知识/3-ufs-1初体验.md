# UFS

## 1. 概述

### Union File System

Union File System ，简称 UnionFS 是一种为 Linux FreeBSD NetBSD 操作系统设计的，把其他文件系统联合到一个联合挂载点的文件系统服务。

它使用 branch 不同文件系统的文件和目录“透明地”覆盖，形成 个单一一致的文件系统。这些branches或者是read-only或者是read-write的，所以当对这个虚拟后的联合文件系统进行写操作的时候，系统是真正写到了一个新的文件中。看起来这个虚拟后的联合文件系统是可以对任何文件进行操作的，但是其实它并没有改变原来的文件，这是因为unionfs用到了一个重要的资管管理技术叫写时复制。

**写时复制（copy-on-write，下文简称CoW）**，也叫隐式共享，是一种对可修改资源实现高效复制的资源管理技术。它的思想是，如果一个资源是重复的，但没有任何修改，这时候并不需要立即创建一个新的资源；这个资源可以被新旧实例共享。创建新资源发生在第一次写操作，也就是对资源进行修改的时候。通过这种资源共享的方式，可以显著地减少未修改资源复制带来的消耗，但是也会在进行资源修改的时候增减小部分的开销。

**举个例子**

假设我们存在2个目录X,Y，里面分别有A，B文件，那么UFS的作用就是将这两个目录合并，并且重新挂载的Z上,这样在Z目录上就可以同时看到A和B文件。这就是联合文件系统，目的就是**将多个文件联合在一起成为一个统一的视图**。

然后我们在Z目录中删除B文件，同时，在A文件中增加一些内容，如添加Hello字符串。此时可以发现，X内的A文件新增了Hello,并且新增了一条B被删除的记录，但是Y中的B并没有任何变化。这是UFS的一个重要特性。**在所有的联合起来的目录中，只有第一个目录是有写的权限**，即我们不管如何的去对Z进行修改操作，都只能对第一个联合进来的X修改，对Y是没有权限修改的。

但是如果我们在Z中对Y中的文件进行了修改，它虽然没有权限去修改Y目录中的文件，但是它会在第一层目录添加一个记录来记录更改内容。



Union File System 也叫 UnionFS，最主要的功能是将多个不同位置的目录联合挂载（union mount）到同一个目录下。比如，我现在有两个目录 A 和 B，它们分别有两个文件：

```shell
$ tree
.
├── A
│  ├── a
│  └── x
└── B
  ├── b
  └── x
```

然后，我使用联合挂载的方式，将这两个目录挂载到一个公共的目录 C 上：

```shell
$ mkdir C
$ mount -t aufs -o dirs=./A:./B none ./C
```

这时，我再查看目录 C 的内容，就能看到目录 A 和 B 下的文件被合并到了一起：

```shell
$ tree ./C
./C
├── a
├── b
└── x
```

可以看到，在这个合并后的目录 C 里，有 a、b、x 三个文件，并且 x 文件只有一份。这，就是“合并”的含义。此外，如果你在目录 C 里对 a、b、x 文件做修改，这些修改也会在对应的目录 A、B 中生效。





### AUFS

AuFS 的全称是 Another UnionFS，后改名为 Alternative UnionFS，再后来干脆改名叫作 Advance UnionFS。AUFS完全重写了早期的UnionFS 1.x，其主要目的是为了可靠性和性能，并且引入了一些新的功能，比如可写分支的负载均衡。AUFS的一些实现已经被纳入UnionFS 2.x版本。



### overlay2

Overlayfs是一种类似aufs的一种堆叠文件系统，于2014年正式合入Linux-3.18主线内核，目前其功能已经基本稳定（虽然还存在一些特性尚未实现）且被逐渐推广，特别在容器技术中更是势头难挡。

Overlayfs是一种堆叠文件系统，它依赖并建立在其它的文件系统之上（例如ext4fs和xfs等等），并不直接参与磁盘空间结构的划分，仅仅将原来底层文件系统中不同的目录进行“合并”，然后向用户呈现。

AUFS 只是 Docker 使用的存储驱动的一种，除了 AUFS 之外，Docker 还支持了不同的存储驱动，包括 `aufs`、`devicemapper`、`overlay2`、`zfs` 和 `vfs` 等等，在最新的 Docker 中，`overlay2` 取代了 `aufs` 成为了推荐的存储驱动，但是在没有 `overlay2` 驱动的机器上仍然会使用 `aufs` 作为 Docker 的默认驱动。



简单的总结为以下3点：

（1）上下层同名目录合并；

（2）上下层同名文件覆盖；

（3）lower dir文件写时拷贝。

这三点对用户都是不感知的。

假设我们有 dir1和dir2两个目录：

```shell
  dir1                    dir2
    /                       /
      a                       a
      b                       c
```

然后我们可以把 dir1 和 dir2 挂载到 dir3上，就像这样：

```shell
 dir3
    /
      a
      b
      c
```

需要注意的是：在 overlay 中 dir1 和 dir2 是有上下关系的。lower 和 upper 目录不是完全一致，有一些区别，具体见下一节。



## 2. overlayfs 演示



### 环境准备

具体演示如下：

创建一个如下结构的目录：

```shell
.
├── lower
│   ├── a
│   └── c
├── merged
├── upper
│   ├── a
│   └── b
└── work
```

具体命令如下：

```shell
$ mkdir ./{merged,work,upper,lower}
$ touch ./upper/{a,b}
$ touch ./lower/{a,c}
```

然后进行 mount 操作：

```shell
# -t overlay 表示文件系统为 overlay
# -o lowerdir=./lower,upperdir=./upper,workdir=./work 指定 lowerdir、upperdir以及 workdir这3个目录。
# 其中 lowerdir 是自读的，upperdir是可读写的，
$ sudo mount \
            -t overlay \
            overlay \
            -o lowerdir=./lower,upperdir=./upper,workdir=./work \
            ./merged
```

此时目录结构如下：

```shell
.
├── lower
│   ├── a
│   └── c
├── merged
│   ├── a
│   ├── b
│   └── c
├── upper
│   ├── a
│   └── b
└── work
    └── work
```

可以看到，merged 目录已经可以同时看到 lower和upper中的文件了，而由于文件a同时存在于lower和upper中，因此被覆盖了，只显示了一个a。





### 修改文件

虽然 lower 和 upper 中的文件都出现在了 merged 目录，但是二者还是有区别的。

lower 为底层目录，只提供数据，不能写。

upper 为上层目录，是可读写的。



测试：

```shell
# 分别对 merged 中的文件b和c写入数据
# 其中文件 c 来自 lower，b来自 upper
$ echo "will-persist"  > ./merged/b
$ echo "wont-persist"  > ./merged/c
```

修改后从 merged 这个视图进行查看：

```shell
$ cat ./merged/b
will-persist
$ cat ./merged/c
wont-persist
```

可以发现，好像两个文件都被更新了，难道上面的结论是错的？

再从 upper 和 lower 视角进行查看：

```shell
$ cat ./upper/b
will-persist
$ cat ./lower/c
(empty)
```

可以发现 lower 中的文件 c 确实没有被改变。

那么 merged 中查看的时候，文件 c 为什么有数据呢？



由于 lower 是不可写的，因此采用了 CoW 技术，在对 c 进行修改时，复制了一份数据到 overlay 的 upperdir，即这里的 upper 目录，进入 upper 目录查看是否存在 c 文件：

```shell
[root@iZ2zefmrr626i66omb40ryZ upper]$ ll
total 8
-rw-r--r-- 1 root root  0 Jan 18 18:50 a
-rw-r--r-- 1 root root 13 Jan 18 19:10 b
-rw-r--r-- 1 root root 13 Jan 18 19:10 c
[root@iZ2zefmrr626i66omb40ryZ upper]$ cat c 
wont-persist
```



> 从 lower copy 到 upper，也叫做 copy_up



### 删除文件

首先往 lower 中增加文件 f

```shell
[root@iZ2zefmrr626i66omb40ryZ lower]$ echo fff >> f
[root@iZ2zefmrr626i66omb40ryZ lower]$ ls ../merged/
f
```

果然 lower 中添加后，merged 中也能直接看到了，然后再 merged 中去删除文件 f：

```shell
[root@iZ2zefmrr626i66omb40ryZ lower]$ cd ../merged/
[root@iZ2zefmrr626i66omb40ryZ merged]$ rm -rf f
# merged 中删除后 lower 中文件还在
[root@iZ2zefmrr626i66omb40ryZ merged]$ ls ../lower/
a  c  e  f
# 而 upper 中出现了一个大小为0的c类型文件f
[root@iZ2zefmrr626i66omb40ryZ merged]# ls -l ../upper/
total 0
c--------- 1 root root 0, 0 Jan 18 19:28 f
```

可以发现，overlay 中删除 lower 中的文件，其实也是在 upper 中创建一个标记，表示这个文件已经被删除了，测试一下：

```shell
[root@iZ2zefmrr626i66omb40ryZ merged]$ rm -rf ../upper/f
[root@iZ2zefmrr626i66omb40ryZ merged]$ ls
f
[root@iZ2zefmrr626i66omb40ryZ merged]$ cat f 
fff
```

把 upper 中的大小为0的f文件给删掉后，merged中又可以看到lower中 f 了，而且内容也是一样的。

说明 overlay 中的删除其实是**标记删除**。再 upper 中添加一个删除标记，这样该文件就被隐藏了，从merged中看到的效果就是文件被删除了。

> 删除文件或文件夹时，会在 upper 中添加一个同名的 `c` 标示的文件，这个文件叫 `whiteout` 文件。当扫描到此文件时，会忽略此文件名。



### 添加文件

最后再试一下添加文件

```shell
# 首先在 merged 中创建文件 g
[root@iZ2zefmrr626i66omb40ryZ merged]$ echo ggg >> g
[root@iZ2zefmrr626i66omb40ryZ merged]$ ls
g
# 然后查看 upper，发现也存在文件 g
[root@iZ2zefmrr626i66omb40ryZ merged]$ ls ../upper/
g
# 在查看内容，发送是一样的
[root@iZ2zefmrr626i66omb40ryZ merged]$ cat ../upper/g
ggg
```

说明 overlay 中添加文件其实就是在 upper 中添加文件。

测试一下删除会怎么样呢：

```shell
[root@iZ2zefmrr626i66omb40ryZ merged]$ rm -rf ../upper/g
[root@iZ2zefmrr626i66omb40ryZ merged]$ ls
f
```

把 upper 中的文件 g 删除了，果然 merged 中的文件 g 也消失了。





## 3. 容器是如何使用 overlay 的？

借助 overlay 可以很容易的实现，容器中的文件系统：

例如，假设我们有一个由两层组成的容器镜像：

```shell
   layer1:                 layer2:
    /etc                    /bin
      myconf.ini              my-binary
```

然后，在容器运行时将把这两层作为 lower 目录，创建一个空`upper`目录，并将其挂载到某个地方：

```shell
sudo mount \
            -t overlay \
            overlay \
            -o lowerdir=/layer1:/layer2,upperdir=/upper,workdir=/work \
            /merged
```

最后将`/merged`用作容器的 rootfs。

这样，容器中的文件系统就完成了。





## 4. 参考

[overlayfs实践](https://ops.tips/notes/practical-look-into-overlayfs/)

[docker-overlay2](https://www.jianshu.com/p/3826859a6d6e)

[Docker 文件系统--各种ID的计算，imageId、layerId、diffID 等](https://blog.csdn.net/u010566813/category_5690229.html)

[深入理解overlay-1-初识](https://blog.csdn.net/luckyapple1028/article/details/77916194)

[深入理解overlay-2-使用与原理分析](https://blog.csdn.net/luckyapple1028/article/details/78075358)

[overlayfs.rst](https://github.com/torvalds/linux/blob/master/Documentation/filesystems/overlayfs.rst)

[overlayfs.txt](https://www.kernel.org/doc/Documentation/filesystems/overlayfs.txt)