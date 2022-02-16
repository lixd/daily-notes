# mount

本篇将介绍一些比较实用的mount用法，包括挂载内核中的虚拟文件系统、loop device和 bind mount。

> [Linux mount （第一部分）](https://segmentfault.com/a/1190000006878392)
>
> [Linux mount （第二部分 - Shared subtrees）](https://segmentfault.com/a/1190000006899213)
>
> [mount](https://man7.org/linux/man-pages/man8/mount.8.html)
>
> [umount](https://man7.org/linux/man-pages/man8/umount.8.html)



## 1. 基本语法

mount命令的标准格式如下

```shell
 mount -t type -o options device dir
```

- device: 要挂载的设备（必填）。有些文件系统不需要指定具体的设备，这里可以随便填一个字符串
- dir: 挂载到哪个目录（必填）
- type： 文件系统类型（可选）。大部分情况下都不用指定该参数，系统都会自动检测到设备上的文件系统类型
- options： 挂载参数（可选），一般分为两类。
  - 一类是 Linux VFS 所提供的通用参数，就是每个文件系统都可以使用这类参数，详情请参考 [FILESYSTEM-INDEPENDENT MOUNT OPTIONS](https://man7.org/linux/man-pages/man8/mount.8.html)。
  - 另一类是每个文件系统自己支持的特有参数，这个需要参考每个文件系统的文档，如btrfs支持的参数可以在 [这里](https://btrfs.readthedocs.io/en/latest/btrfs-man5.html) 找到。



取消挂载则是 umount。



## 2. 演示

### 挂载虚拟文件系统

proc、tmpfs、sysfs、devpts 等都是 Linux 内核映射到用户空间的虚拟文件系统，他们不和具体的物理设备关联，但他们具有普通文件系统的特征，应用层程序可以像访问普通文件系统一样来访问他们。

```shell
#将内核的proc文件系统挂载到/mnt，
#这样就可以在/mnt目录下看到系统当前运行的所有进程的信息，
#由于proc是内核虚拟的一个文件系统，并没有对应的设备，
#所以这里-t参数必须要指定，不然mount就不知道要挂载啥了。
#由于没有对应的源设备，这里none可以是任意字符串，
#取个有意义的名字就可以了，因为用mount命令查看挂载点信息时第一列显示的就是这个字符串。
dev@ubuntu:~$ sudo mount -t proc none /mnt

#在内存中创建一个64M的tmpfs文件系统，并挂载到/mnt下，
#这样所有写到/mnt目录下的文件都存储在内存中，速度非常快，
#不过要注意，由于数据存储在内存中，所以断电后数据会丢失掉
dev@ubuntu:~$ sudo mount -t tmpfs -o size=64m tmpfs /mnt
```



### 挂载 [loop device](https://en.wikipedia.org/wiki/Loop_device)

在 Linux中，硬盘、光盘、软盘等都是常见的块设备，他们在 Linux 下的目录一般是 /dev/hda1, /dev/cdrom, /dev/sda1，/dev/fd0 这样的。而 loop device 是虚拟的块设备，主要目的是让用户可以像访问上述块设备那样访问一个文件。

 loop device 设备的路径一般是 /dev/loop0, dev/loop1, ...等，具体的个数跟内核的配置有关，Ubuntu16.04 下面默认是 8个，如果 8个 都被占用了，那么就需要修改内核参数来增加 loop device 的个数。



#### ISO文件

需要用到 loop device 的最常见的场景是 mount 一个 ISO 文件，示例如下

```shell
#利用mkisofs构建一个用于测试的iso文件
dev@ubuntu:~$ mkdir -p iso/subdir01
dev@ubuntu:~$ mkisofs -o ./test.iso ./iso

#mount ISO 到目录 /mnt
dev@ubuntu:~$ sudo mount ./test.iso /mnt
mount: /dev/loop0 is write-protected, mounting read-only

#mount成功，能看到里面的文件夹
dev@ubuntu:~$ ls /mnt
subdir01

#通过losetup命令可以看到占用了loop0设备
dev@ubuntu:~$ losetup -a
/dev/loop0: []: (/home/dev/test.iso)
```



#### 虚拟硬盘

loop device 另一种常用的用法是虚拟一个硬盘。

比如我想尝试下 btrfs 这个文件系统，但系统中目前的所有分区都已经用了，里面都是有用的数据，不想格式化他们，这时虚拟硬盘就有用武之地了，示例如下：

```shell
#因为btrfs对分区的大小有最小要求，所以利用dd命令创建一个128M的文件
dev@ubuntu:~$ dd if=/dev/zero bs=1M count=128 of=./vdisk.img

#在这个文件里面创建btrfs文件系统
#有些同学可能会想，硬盘一般不都是先分区再创建文件系统的吗？
#是的，分区是为了方便磁盘的管理，
#但对于文件系统来说，他一点都不关心分区的概念，你给他多大的空间，他就用多大的空间，
#当然这里也可以先用fdisk在vdisk.img中创建分区，然后再在分区上创建文件系统，
#只是这里的虚拟硬盘不需要用作其他的用途，为了方便，我就把整个硬盘全部给btrfs文件系统，
dev@ubuntu:~$ mkfs.btrfs ./vdisk.img
#这里会输出一些信息，提示创建成功

#mount虚拟硬盘
dev@ubuntu:~$ sudo mount ./vdisk.img /mnt/

#在虚拟硬盘中创建文件成功
dev@ubuntu:~$ sudo touch /mnt/aaaaaa
dev@ubuntu:~$ ls /mnt/
aaaaaa

#加上刚才上面mount的iso文件，我们已经用了两个loop device了
dev@ubuntu:~$ losetup -a
/dev/loop0: []: (/home/dev/test.iso)
/dev/loop1: []: (/home/dev/vdisk.img)
```





### 挂载多个设备到一个文件夹

Linux 下支持将多个设备挂载到一个文件夹，默认会用后面的 mount 覆盖掉前面的mount，只有当 umount 后面的 device 后，原来的 device 才看的到。 

看下面的例子：

```shell
#先umount上面的iso和vdisk.img
dev@ubuntu:~$ sudo umount ./test.iso
dev@ubuntu:~$ sudo umount ./vdisk.img

#在/mnt目录下先创建一个空的test文件夹
dev@ubuntu:~$ sudo mkdir /mnt/test
dev@ubuntu:~$ ls /mnt/
test

#mount iso文件
dev@ubuntu:~$ sudo mount ./test.iso /mnt
#再看/mnt里面的内容，已经被iso里面的内容给覆盖掉了
dev@ubuntu:~$ ls /mnt/
subdir01

#再mount vdisk.img
dev@ubuntu:~$ sudo mount ./vdisk.img /mnt/
#再看/mnt里面的内容，已经被vdisk.img里面的内容给覆盖掉了
dev@ubuntu:~$ ls /mnt/
aaaaaa

#通过mount命令可以看出，test.iso和vdisk.img都mount在了/mnt
#但我们在/mnt下只能看到最后一个mount的设备里的东西
dev@ubuntu:~$ mount|grep /mnt
/home/dev/test.iso on /mnt type iso9660 (ro,relatime)
/home/dev/vdisk.img on /mnt type btrfs (rw,relatime,space_cache,subvolid=5,subvol=/)

#umount /mnt，这里也可以用命令sudo umount ./vdisk.img，一样的效果
dev@ubuntu:~$ sudo umount /mnt
#test.iso文件里面的东西再次出现了
dev@ubuntu:~$ ls /mnt/
subdir01

#再次umount /mnt，这里也可以用命令sudo umount ./test.iso，一样的效果
dev@ubuntu:~$ sudo umount /mnt
#最开始/mnt目录里面的文件可以看到了
dev@ubuntu:~$ ls /mnt/
test
```

有了这个功能，平时挂载设备的时候就不用专门去创建空目录了，随便找个暂时不用的目录挂上去就可以了。



### 挂载一个设备到多个目录

当然我们也可以把一个设备mount到多个文件夹，这样在多个文件夹中都可以访问该设备中的内容。

```shell
#新建两目录用于挂载点
dev@ubuntu:~$ sudo mkdir /mnt/disk1 /mnt/disk2
#将vdisk.img依次挂载到disk1和disk2
dev@ubuntu:~$ sudo mount ./vdisk.img /mnt/disk1
dev@ubuntu:~$ sudo mount ./vdisk.img /mnt/disk2

#这样在disk1下和disk2下面都能看到相同的内容
dev@ubuntu:~$ tree /mnt
/mnt
├── disk1
│   └── aaaaaa
└── disk2
    └── aaaaaa

#在disk1下创建一个新文件
dev@ubuntu:~$ sudo touch /mnt/disk1/bbbbbb
#这个文件在disk2下面也能看到
dev@ubuntu:~$ tree /mnt
/mnt
├── disk1
│   ├── aaaaaa
│   └── bbbbbb
└── disk2
    ├── aaaaaa
    └── bbbbbb
```



## 3. 其他功能

### bind mount

bind mount 会将源目录绑定到目的目录，然后在目的目录下就可以看到源目录里的文件。

> docker volume 就是借助该功能实现的。

```shell
#准备要用到的目录
dev@ubuntu:~$ mkdir -p bind/bind1/sub1
dev@ubuntu:~$ mkdir -p bind/bind2/sub2
dev@ubuntu:~$ tree bind
bind
├── bind1
│   └── sub1
└── bind2
    └── sub2

#bind mount后，bind2里面显示的就是bind1目录的内容
dev@ubuntu:~$ sudo mount --bind ./bind/bind1/ ./bind/bind2
dev@ubuntu:~$ tree bind
bind
├── bind1
│   └── sub1
└── bind2
    └── sub1
```



### bind mount单个文件

我们也可以bind mount单个文件，这个功能尤其适合需要在不同版本配置文件之间切换的时候。

```shell
#创建两个用于测试的文件
dev@ubuntu:~$ echo aaaaaa > bind/aa
dev@ubuntu:~$ echo bbbbbb > bind/bb
dev@ubuntu:~$ cat bind/aa
aaaaaa
dev@ubuntu:~$ cat bind/bb
bbbbbb

#bind mount后，bb里面看到的是aa的内容
dev@ubuntu:~$ sudo mount --bind ./bind/aa bind/bb
dev@ubuntu:~$ cat bind/bb
aaaaaa

#即使我们删除aa文件，我们还是能够通过bb看到aa里面的内容
dev@ubuntu:~$ rm bind/aa
dev@ubuntu:~$ cat bind/bb
aaaaaa

#umount bb文件后，bb的内容出现了，不过aa的内容再也找不到了
dev@ubuntu:~$ sudo umount bind/bb
dev@ubuntu:~$ cat bind/bb
bbbbbb
```



### readonly bind

我们可以在bind的时候指定readonly，这样原来的目录还是能读写，但目的目录为只读。

> 比如 docker 挂载 volume 时可以指定 ro 或者 rw 权限，就是通过这个实现的

```shell
#通过readonly的方式bind mount
dev@ubuntu:~$ sudo mount -o bind,ro ./bind/bind1/ ./bind/bind2
dev@ubuntu:~$ tree bind
bind
├── bind1
│   └── sub1
└── bind2
    └── sub1

#bind2目录为只读，没法touch里面的文件
dev@ubuntu:~$ touch ./bind/bind2/sub1/aaa
touch: cannot touch './bind/bind2/sub1/aaa': Read-only file system

#bind1还是能读写
dev@ubuntu:~$ touch ./bind/bind1/sub1/aaa

#我们可以在bind1和bind2目录下看到刚创建的文件
dev@ubuntu:~$ tree bind
bind
├── bind1
│   └── sub1
│       └── aaa
└── bind2
    └── sub1
        └── aaa
```



### move一个挂载点到另一个地方

move操作可以将一个挂载点移动到别的地方，这里以bind mount为例来演示，当然其他类型的挂载点也可以通过move操作来移动。

```shell
#umount上面操作所产生的挂载点
dev@ubuntu:~$ sudo umount /home/dev/bind/bind1
dev@ubuntu:~$ sudo umount /home/dev/bind/bind2

#bind mount
dev@ubuntu:~$ sudo mount --bind ./bind/bind1/ ./bind/bind2/
dev@ubuntu:~$ ls ./bind/bind*
./bind/bind1:
sub1

./bind/bind2:
sub1

#move操作要求mount point的父mount point不能为shared。
#在这里./bind/bind2/的父mount point为'/'，所以需要将'/'变成private后才能做move操作
#关于shared、private的含义将会在下一篇介绍
dev@ubuntu:~$ findmnt -o TARGET,PROPAGATION /
TARGET PROPAGATION
/      shared
dev@ubuntu:~$ sudo mount --make-private /
dev@ubuntu:~$ findmnt -o TARGET,PROPAGATION /
TARGET PROPAGATION
/      private

#move成功，在mnt下能看到bind1里面的内容
dev@ubuntu:~$ sudo mount --move ./bind/bind2/ /mnt
dev@ubuntu:~$ ls /mnt/
sub1
#由于bind2上的挂载点已经被移动到了/mnt上，于是能看到bind2目录下原来的文件了
dev@ubuntu:~$ ls ./bind/bind2/
sub2
```


## 4. Shared subtrees

简单点说，[Shared subtrees](https://www.kernel.org/doc/Documentation/filesystems/sharedsubtree.txt) 就是一种控制子挂载点能否在其他地方被看到的技术，它只会在bind mount和mount namespace中用到，属于不怎么常用的功能。

本篇将以 bind mount 为例对 Shared subtrees 做一个简单介绍。



回想一下上面的 bind mount 部分，如果 bind 在一起的两个目录下的子目录再挂载了设备的话，他们之间还能相互看到子目录里挂载的内容吗？ 

比如在第一个目录下的子目录里面再 mount 了一个设备，那么在另一个目录下面能看到这个 mount 的设备里面的东西吗？

答案是要看 bind mount 的 propagation type。那什么是 propagation type呢？

peer group 和 propagation type 都是随着 shared subtrees 一起被引入的概念，下面分别对他们做一个介绍。

### 相关概念

#### peer group

peer group就是一个或多个挂载点的集合，他们之间可以共享挂载信息。目前在下面两种情况下会使两个挂载点属于同一个peer group（前提条件是挂载点的propagation type是shared）

- 利用mount --bind命令，将会使源和目的挂载点属于同一个peer group，当然前提条件是‘源’必须要是一个挂载点。
- 当创建新的mount namespace时，新namespace会拷贝一份老namespace的挂载点信息，于是新的和老的namespace里面的相同挂载点就会属于同一个peer group。



#### propagation type

每个挂载点都有一个propagation type标志, 由它来决定当一个挂载点的下面创建和移除挂载点的时候，是否会传播到属于相同peer group的其他挂载点下去，也即同一个peer group里的其他的挂载点下面是不是也会创建和移除相应的挂载点.现在有4种不同类型的propagation type：

- MS_SHARED: 从名字就可以看出，挂载信息会在同一个peer group的不同挂载点之间共享传播. 当一个挂载点下面添加或者删除挂载点的时候，同一个peer group里的其他挂载点下面也会挂载和卸载同样的挂载点
- MS_PRIVATE: 跟上面的刚好相反，挂载信息根本就不共享，也即private的挂载点不会属于任何peer group
- MS_SLAVE: 跟名字一样，信息的传播是单向的，在同一个peer group里面，master的挂载点下面发生变化的时候，slave的挂载点下面也跟着变化，但反之则不然，slave下发生变化的时候不会通知master，master不会发生变化。
- MS_UNBINDABLE: 这个和MS_PRIVATE相同，只是这种类型的挂载点不能作为bind mount的源，主要用来防止递归嵌套情况的出现。这种类型不常见，本篇将不介绍这种类型，有兴趣的同学请参考 [这里的例子](https://lwn.net/Articles/690679/)。

还有一些概念需要澄清一下：

- propagation type是挂载点的属性，每个挂载点都是独立的
- 挂载点是有父子关系的，比如挂载点 `/`和`/mnt/cdrom`，`/mnt/cdrom`是 `/` 的子挂载点，`/`是`/mnt/cdrom`的父挂载点
- 默认情况下，如果父挂载点是 MS_SHARED，那么子挂载点也是MS_SHARED 的，否则子挂载点将会是 MS_PRIVATE，跟爷爷挂载点没有关系



### 示例

这里将只演示bind mount的情况，mount namespace的情况请参考[这里](https://segmentfault.com/a/1190000006912742)

#### 准备环境

```shell
#准备4个虚拟的disk，并在上面创建ext2文件系统，用于后续的mount测试
dev@ubuntu:~$ mkdir disks && cd disks
dev@ubuntu:~/disks$ dd if=/dev/zero bs=1M count=32 of=./disk1.img
dev@ubuntu:~/disks$ dd if=/dev/zero bs=1M count=32 of=./disk2.img
dev@ubuntu:~/disks$ dd if=/dev/zero bs=1M count=32 of=./disk3.img
dev@ubuntu:~/disks$ dd if=/dev/zero bs=1M count=32 of=./disk4.img
dev@ubuntu:~/disks$ mkfs.ext2 ./disk1.img
dev@ubuntu:~/disks$ mkfs.ext2 ./disk2.img
dev@ubuntu:~/disks$ mkfs.ext2 ./disk3.img
dev@ubuntu:~/disks$ mkfs.ext2 ./disk4.img
#准备两个目录用于挂载上面创建的disk
dev@ubuntu:~/disks$ mkdir disk1 disk2
dev@ubuntu:~/disks$ ls
disk1  disk1.img  disk2  disk2.img  disk3.img  disk4.img

#确保根目录的propagation type是shared，
#这一步是为了保证大家的操作结果和示例中的一样
dev@ubuntu:~/disks$ sudo mount --make-shared /
```

#### 查看propagation type和peer group

默认情况下，子挂载点会继承父挂载点的propagation type

```shell
#显式的以shared方式挂载disk1
dev@ubuntu:~/disks$ sudo mount --make-shared ./disk1.img ./disk1
#显式的以private方式挂载disk2
dev@ubuntu:~/disks$ sudo mount --make-private ./disk2.img ./disk2

#mountinfo比mounts文件包含有更多的关于挂载点的信息
#这里sed主要用来过滤掉跟当前主题无关的信息
#shared:105表示挂载点/home/dev/disks/disk1是以shared方式挂载，且peer group id为105
#而挂载点/home/dev/disks/disk2没有相关信息，表示是以private方式挂载
dev@ubuntu:~/disks$ cat /proc/self/mountinfo |grep disk | sed 's/ - .*//'
164 24 7:1 / /home/dev/disks/disk1 rw,relatime shared:105
173 24 7:2 / /home/dev/disks/disk2 rw,relatime

#分别在disk1和disk2目录下创建目录disk3和disk4，然后挂载disk3，disk4到这两个目录
dev@ubuntu:~/disks$ sudo mkdir ./disk1/disk3 ./disk2/disk4
dev@ubuntu:~/disks$ sudo mount ./disk3.img ./disk1/disk3
dev@ubuntu:~/disks$ sudo mount ./disk4.img ./disk2/disk4

#查看挂载信息，第一列的数字是挂载点ID，第二例是父挂载点ID，
#从结果来看，176和164的类型都是shared，而179和173的类型都是private的，
#说明在默认mount的情况下，子挂载点会继承父挂载点的propagation type
dev@ubuntu:~/disks$ cat /proc/self/mountinfo |grep disk| sed 's/ - .*//'
164 24 7:1 / /home/dev/disks/disk1 rw,relatime shared:105 
173 24 7:2 / /home/dev/disks/disk2 rw,relatime 
176 164 7:3 / /home/dev/disks/disk1/disk3 rw,relatime shared:107 
179 173 7:4 / /home/dev/disks/disk2/disk4 rw,relatime 
```



#### shared 和 private mount

```shell
#umount掉disk3和disk4，创建两个新的目录bind1和bind2用于bind测试
dev@ubuntu:~/disks$ sudo umount /home/dev/disks/disk1/disk3
dev@ubuntu:~/disks$ sudo umount /home/dev/disks/disk2/disk4
dev@ubuntu:~/disks$ mkdir bind1 bind2

#bind的方式挂载disk1到bind1，disk2到bind2
dev@ubuntu:~/disks$ sudo mount --bind ./disk1 ./bind1
dev@ubuntu:~/disks$ sudo mount --bind ./disk2 ./bind2

#查看挂载信息，显然默认情况下bind1和bind2的propagation type继承自父挂载点24(/)，都是shared。
#由于bind2的源挂载点disk2是private的，所以bind2没有和disk2在同一个peer group里面，
#而是重新创建了一个新的peer group，这个group里面就只有它一个。
#因为164和176都是shared类型且是通过bind方式mount在一起的，所以他们属于同一个peer group 105。
dev@ubuntu:~/disks$ cat /proc/self/mountinfo |grep disk| sed 's/ - .*//'
164 24 7:1 / /home/dev/disks/disk1 rw,relatime shared:105 
173 24 7:2 / /home/dev/disks/disk2 rw,relatime 
176 24 7:1 / /home/dev/disks/bind1 rw,relatime shared:105 
179 24 7:2 / /home/dev/disks/bind2 rw,relatime shared:109 

#ID为24的挂载点为根目录的挂载点
dev@ubuntu:~/disks$ cat /proc/self/mountinfo |grep ^24| sed 's/ - .*//'
24 0 252:0 / / rw,relatime shared:1

#这时disk3和disk4目录都是空的
dev@ubuntu:~/disks$ ls bind1/disk3/
dev@ubuntu:~/disks$ ls bind2/disk4/
dev@ubuntu:~/disks$ ls disk1/disk3/
dev@ubuntu:~/disks$ ls disk2/disk4/

#重新挂载disk3和disk4
dev@ubuntu:~/disks$ sudo mount ./disk3.img ./disk1/disk3
dev@ubuntu:~/disks$ sudo mount ./disk4.img ./disk2/disk4

#由于disk1/和bind1/属于同一个peer group，
#所以在挂载了disk3后，在两个目录下都能看到disk3下的内容
dev@ubuntu:~/disks$ ls disk1/disk3/
lost+found
dev@ubuntu:~/disks$ ls bind1/disk3/
lost+found

#而disk2/是private类型的，所以在他下面挂载disk4不会通知bind2，
#于是bind2下的disk4目录是空的
dev@ubuntu:~/disks$ ls disk2/disk4/
lost+found
dev@ubuntu:~/disks$ ls bind2/disk4/
dev@ubuntu:~/disks$

#再看看disk3，虽然182和183的父挂载点不一样，但由于他们父挂载点属于同一个peer group，
#且disk3是以默认方式挂载的，所以他们属于同一个peer group
dev@ubuntu:~/disks$ cat /proc/self/mountinfo |egrep "disk3"| sed 's/ - .*//'
182 164 7:3 / /home/dev/disks/disk1/disk3 rw,relatime shared:111 
183 176 7:3 / /home/dev/disks/bind1/disk3 rw,relatime shared:111 

#umount bind1/disk3后，disk1/disk3也相应的自动umount掉了
dev@ubuntu:~/disks$ sudo umount bind1/disk3
dev@ubuntu:~/disks$ cat /proc/self/mountinfo |grep disk3
dev@ubuntu:~/disks$
```



#### slave mount

```shell
#umount除disk1的所有其他挂载点
dev@ubuntu:~/disks$ sudo umount ./disk2/disk4
dev@ubuntu:~/disks$ sudo umount /home/dev/disks/bind1
dev@ubuntu:~/disks$ sudo umount /home/dev/disks/bind2
dev@ubuntu:~/disks$ sudo umount /home/dev/disks/disk2
#确认只剩disk1
dev@ubuntu:~/disks$ cat /proc/self/mountinfo |grep disk| sed 's/ - .*//'
164 24 7:1 / /home/dev/disks/disk1 rw,relatime shared:105 

#分别显式的用shared和slave的方式bind disk1
dev@ubuntu:~/disks$ sudo mount --bind --make-shared ./disk1 ./bind1
dev@ubuntu:~/disks$ sudo mount --bind --make-slave ./bind1 ./bind2

#164、173和176都属于同一个peer group，
#master:105表示/home/dev/disks/bind2是peer group 105的slave
dev@ubuntu:~/disks$ cat /proc/self/mountinfo |grep disk| sed 's/ - .*//'
164 24 7:1 / /home/dev/disks/disk1 rw,relatime shared:105 
173 24 7:1 / /home/dev/disks/bind1 rw,relatime shared:105 
176 24 7:1 / /home/dev/disks/bind2 rw,relatime master:105 

#mount disk3到disk1的子目录disk3下
dev@ubuntu:~/disks$ sudo mount ./disk3.img ./disk1/disk3/
#其他两个目录bin1和bind2里面也挂载成功，说明master发生变化的时候，slave会跟着变化
dev@ubuntu:~/disks$ cat /proc/self/mountinfo |grep disk| sed 's/ - .*//'
164 24 7:1 / /home/dev/disks/disk1 rw,relatime shared:105 
173 24 7:1 / /home/dev/disks/bind1 rw,relatime shared:105 
176 24 7:1 / /home/dev/disks/bind2 rw,relatime master:105 
179 164 7:2 / /home/dev/disks/disk1/disk3 rw,relatime shared:109 
181 176 7:2 / /home/dev/disks/bind2/disk3 rw,relatime master:109 
180 173 7:2 / /home/dev/disks/bind1/disk3 rw,relatime shared:109 

#umount disk3，然后mount disk3到bind2目录下
dev@ubuntu:~/disks$ sudo umount ./disk1/disk3/
dev@ubuntu:~/disks$ sudo mount ./disk3.img ./bind2/disk3/

#由于bind2的propagation type是slave，所以disk1和bind1两个挂载点下面不会挂载disk3
#从179的类型可以看出，当父挂载点176是slave类型时，默认情况下其子挂载点179是private类型
dev@ubuntu:~/disks$ cat /proc/self/mountinfo |grep disk| sed 's/ - .*//'
164 24 7:1 / /home/dev/disks/disk1 rw,relatime shared:105 
173 24 7:1 / /home/dev/disks/bind1 rw,relatime shared:105 
176 24 7:1 / /home/dev/disks/bind2 rw,relatime master:105 
179 176 7:2 / /home/dev/disks/bind2/disk3 rw,relatime -
```

如果用到了bind mount和mount namespace，在挂载设备的时候就需要注意一下父挂载点是否和其他挂载点有peer group关系，如果有且父挂载点是shared，就说明你挂载的设备除了在当前挂载点可以看到，在父挂载点的peer group的下面也可以看到。