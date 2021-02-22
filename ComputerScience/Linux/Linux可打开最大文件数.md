# Linux最大可打开文件数

## 1. 概述

在Linux下有时会遇到`socket/file: can't open so many files`的问题。其实Linux是有文件句柄限制的，而且Linux默认一般都是1024（阿里云主机默认是65535）。在生产环境中很容易达到这个值，因此这里就会成为系统的瓶颈。

最大可打开文件数限制和以下参数有关

* 1）file_max
* 2）nr_open
* 3）ulimit -n



## 2. 参数详解

### 1. file_max

```sh
/proc/sys/fs/file-max
This  file defines a system-wide limit on the number of open files for all processes. 
```



`file_max`用于限制**整个系统**能够分配的文件句柄数。

`file-nr`总共有3个数据组成： 

* 第一列表示当前已分配且正在使用的文件句柄数；
*  第二列表示已分配但目前未使用的文件句柄数（当前操作系统一般不会用到此特性了，因此值一般为0）；
*  第三列一般表示为最大的文件句柄数，通常等于`file-max`。



我们可以通过如下命令来查看这些值：

```sh
# cat /proc/sys/fs/file-max
1584856

# cat /proc/sys/fs/file-nr
1984    0       1584856
```



### 2. nr_open

```sh
This denotes the maximum number of file-handles a process can
allocate. Default value is 1024*1024 (1048576) which should be
enough for most machines. Actual limit depends on RLIMIT_NOFILE
resource limit.
```

**单个进程**可以分配的最大文件描述符。默认值为1024*1024 (1048576), 这对于大多数机器是够用的。

可以通过通过如下命令来查看：

```sh
# cat /proc/sys/fs/nr_open
1048576
```



### 3. ulimit -n

```sh
Provides control over the resources available to the shell and to processes started by it, 
on systems that allow such control
```

`ulimit -n`提供了使用shell来控制资源数量的方法。关于`ulimit -n`,需要注意如下两点：

- 提供对shell及其启动的进程的可用资源（包括文件句柄，进程数量，core文件大小等）的控制
- 这是进程级别的，也就是说系统中某个session及其启动的每个进程能打开多少个文件描述符，能fork出多少个子进程等。

我们可以通过`ulimit -a`或者`ulimit -n`来进行查看：

```sh
[root@iZ2ze2m9cbk2et61zx1pl5Z ~]# ulimit -a
core file size          (blocks, -c) 0
data seg size           (kbytes, -d) unlimited
scheduling priority             (-e) 0
file size               (blocks, -f) unlimited
pending signals                 (-i) 29968
max locked memory       (kbytes, -l) 64
max memory size         (kbytes, -m) unlimited
open files                      (-n) 65535
pipe size            (512 bytes, -p) 8
POSIX message queues     (bytes, -q) 819200
real-time priority              (-r) 0
stack size              (kbytes, -s) 8192
cpu time               (seconds, -t) unlimited
max user processes              (-u) 29968
virtual memory          (kbytes, -v) unlimited
file locks                      (-x) unlimited
[root@iZ2ze2m9cbk2et61zx1pl5Z ~]#  ulimit -n
65535
```

### 4.进程限制

可以通过如下命令查看某个进程的限制：

```sh
# cat /proc/{pid}/limits
[root@iZ2ze2m9cbk2et61zx1pl5Z ~]# cat /proc/2445069/limits
Limit                     Soft Limit           Hard Limit           Units     
Max cpu time              unlimited            unlimited            seconds   
Max file size             unlimited            unlimited            bytes     
Max data size             unlimited            unlimited            bytes     
Max stack size            8388608              unlimited            bytes     
Max core file size        unlimited            unlimited            bytes     
Max resident set          unlimited            unlimited            bytes     
Max processes             unlimited            unlimited            processes 
Max open files            1048576              1048576              files     
Max locked memory         65536                65536                bytes     
Max address space         unlimited            unlimited            bytes     
Max file locks            unlimited            unlimited            locks     
Max pending signals       29968                29968                signals   
Max msgqueue size         819200               819200               bytes     
Max nice priority         0                    0                    
Max realtime priority     0                    0                    
Max realtime timeout      unlimited            unlimited            us  
```

其中的`Max open files `就是当前进程的具体限制。

也可以直接通过`setrlimit`函数修改限制。

```
// set resource limit
int setrlimit(int resource, const struct rlimit *rlim);
```

## 3. 修改

### 修改Shell级限制

**1) 临时生效**

```sh
# ulimit -SHn 10000
```

其实ulimit 命令还分软限制和硬限制，加`-H`就是硬限制，加`-S`就是软限制。默认显示的是软限制，如果运行`ulimit`命令修改时没有加上`-H`或`-S`，就是两个参数一起改变。

> 硬限制就是实际的限制，而软限制是警告限制，它只会给出警告。

`soft limit`必须小于等于`hard limit`。

**2) 永久生效**

要想ulimits 的数值永久生效，必须修改配置文件/etc/security/limits.conf 在该配置文件中添加

```sh
* soft nofile 65535

* hard nofile 65535  
```

上面`*`表示所用的用户。

注意： 有时`*`指定所有用户可能在不重启机器的情况下并不能生效， 此时可能需要指定具体的用户，例如root用户

```sh
root soft nofile 1800000
root hard nofile 2000000
```



### 修改系统级限制

**1） 修改file-max**

- 临时生效方法（重启机器后会失效）

```sh
# echo  6553560 > /proc/sys/fs/file-max
```

- 永久生效方法： 修改/etc/sysctl.conf文件，加入

```sh
fs.file-max = 6553560 
```

**2) 修改nr_open**

另外,我们可能还需要修改`nr_open`:

- 临时生效方法（重启机器会失效）

```sh
# echo 2000000 > /proc/sys/fs/nr_open
```

- 永久生效方法: 修改/etc/sysctl.conf文件，加入

```sh
fs.nr_open = 2000000
```

也可以通过如下命令来修改：

```sh
# sysctl -w fs.nr_open=2000000
```



## 4. 小结 

进程的最大FD数会受到`ile_max`、`nr_open`、`ulimit -n`这三个值限制。

查看FD占用数top10：

```sh
# 进程打开的FD
lsof -n| awk '{print $3}'|sort|uniq -c|sort -nr|head -10
# 用户打开的FD
lsof -n| awk '{print $2}'|sort|uniq -c|sort -nr|head -10
# 命令打开的FD
lsof -n| awk '{print $1}'|sort|uniq -c|sort -nr|head -10
```