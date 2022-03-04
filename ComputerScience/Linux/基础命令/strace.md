# Strace

## 1. 概述

在 Linux 系统中，**strace 命令是一个集诊断、调试、统计与一体的工具**，可用来追踪调试程序，能够与其他命令搭配使用。

```shell
$ man strace
 strace - trace system calls and signals
 ...
```



安装方式如下

```shell
$ sudo apt-get install strace	#Debian/Ubuntu 
# yum install strace		#RHEL/CentOS
```



常见用法：

追踪指定PID即子进程，并将输出重定向到文件。

```shell
$ strace -p [pid] -f -ff -o file.name
```





## 2. 常用参数

常用参数含义如下，更多请参考`man`手册。

* -p：根据PID跟踪指定进程
* -c：系统调用统计汇总信息
* -e trace=xxx,xxx：指定只追踪哪些系统调用
* -i：打印系统调用入口指令指针
* -t：打印系统时间（秒级）
  * -tt：微秒级
  * -ttt：微秒级，时间戳方式
* -r：打印系统调用间隔时间
* -T：打印系统调用耗时
* -o：输出重定向到文件
* -f：追踪子进程
* -ff：如果提供-o filename,则所有进程的跟踪结果输出到相应的filename.pid中,pid是各进程的进程号



其他：

* -q：禁止输出关于脱离的消息.
* -x 以十六进制形式输出非标准字符串 
* -xx 所有字符串以十六进制形式输出. 
* -a column 设置返回值的输出位置.默认 为40. 
* -e expr  指定一个表达式,用来控制如何跟踪
  * 比较复杂，后续单独说明
* -s strsize :指定输出的字符串的最大长度.默认为32.文件名一直全部输出 
* -u username :以username 的UID和GID执行被跟踪的命令



`-e expr`具体说明：

格式如下: 

```shell
[qualifier=][!]value1[,value2]... 
```

* qualifier 只能是 trace, abbrev, verbose, raw, signal, read, write, fault, inject kvm其中之一，默认为 trace。
* value 是用来限定的符号或数字.
* 感叹号则是取反。

> 注意有些 shell 会使用 ! 来执行历史记录里的命令,所以要转义一下。

.例如: 

* `- e open` 等价于 `-e trace=open`,表示只跟踪 open 调用;
* 而`-etrace!=open`表示跟踪除了 open 以外的其他调用.

> 有两个特殊的符号 all 和 none. 





## 3. 常用参数演示

### 1. 直接追踪命令

直接使用 strace 来追踪某个命令，比如追踪 ls 命令：

```shell
$ strace ls
```

或者别的程序，比如下面的 helloworld：

```c
#include <stdio.h>

int main() {
  char *str = "Hello, World\n";
  printf("%s", str);
  return 0;
}
```

```shell
$ gcc -o helloworld helloworld.c 
$ strace ./helloworld 
```

输出如下：

```shell
execve("./helloworld", ["./helloworld"], 0x7ffca8898540 /* 27 vars */) = 0
brk(NULL)                               = 0x145c000
arch_prctl(0x3001 /* ARCH_??? */, 0x7fff922b84a0) = -1 EINVAL (Invalid argument)
access("/etc/ld.so.preload", R_OK)      = -1 ENOENT (No such file or directory)
openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
fstat(3, {st_mode=S_IFREG|0644, st_size=35362, ...}) = 0
mmap(NULL, 35362, PROT_READ, MAP_PRIVATE, 3, 0) = 0x7f72da950000
close(3)                                = 0
openat(AT_FDCWD, "/lib64/libc.so.6", O_RDONLY|O_CLOEXEC) = 3
read(3, "\177ELF\2\1\1\3\0\0\0\0\0\0\0\0\3\0>\0\1\0\0\0\2009\2\0\0\0\0\0"..., 832) = 832
fstat(3, {st_mode=S_IFREG|0755, st_size=5993088, ...}) = 0
mmap(NULL, 8192, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0x7f72da94e000
mmap(NULL, 3942432, PROT_READ|PROT_EXEC, MAP_PRIVATE|MAP_DENYWRITE, 3, 0) = 0x7f72da36e000
mprotect(0x7f72da527000, 2097152, PROT_NONE) = 0
mmap(0x7f72da727000, 24576, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_FIXED|MAP_DENYWRITE, 3, 0x1b9000) = 0x7f72da727000
mmap(0x7f72da72d000, 14368, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_FIXED|MAP_ANONYMOUS, -1, 0) = 0x7f72da72d000
close(3)                                = 0
arch_prctl(ARCH_SET_FS, 0x7f72da94f500) = 0
mprotect(0x7f72da727000, 16384, PROT_READ) = 0
mprotect(0x600000, 4096, PROT_READ)     = 0
mprotect(0x7f72da959000, 4096, PROT_READ) = 0
munmap(0x7f72da950000, 35362)           = 0
fstat(1, {st_mode=S_IFCHR|0620, st_rdev=makedev(136, 0), ...}) = 0
brk(NULL)                               = 0x145c000
brk(0x147d000)                          = 0x147d000
brk(NULL)                               = 0x147d000
write(1, "Hello, World\n", 13Hello, World
)          = 13
exit_group(0)                           = ?
+++ exited with 0 +++

```

输出比较多，先看简单的：

比如 这里的 write 对应系统调用 sys_write，write 函数是 glibc 库包装好的系统调用函数，就是往屏幕上输出。

> 也就是程序中打印的 Hello, World。



### 2. -p 指定PID追踪

对应已经运行中的程序可以通过**` -p`** 参数指定 PID 进行追踪：

新窗口执行一个长期运行的命令，比如 top

```shell
$ top
```

然后在另一个窗口追踪该命令

```shell
# 找到top命令对应的PID
$ ps aux|grep top
root     27028  0.0  0.2  63904  4308 pts/1    S+   09:22   0:00 top
root     27034  0.0  0.0  12108   968 pts/0    S+   09:22   0:00 grep --color=auto top
$ strace -p 27028
```

> 输出太多就不贴上来了

strace 命令执行后会一直追踪该PID并将输出打印到屏幕，可以用<Ctrl+C>退出追踪。



### 3. -c 获取系统调用汇总数据

指定**`-c `**标记可以打印出对应进程的系统调用汇总信息。

```shell
[root@iZ2zefmrr626i66omb40ryZ tmp]# strace -c ls
aufs  helloworld  helloworld.c	overlayfs
% time     seconds  usecs/call     calls    errors syscall
------ ----------- ----------- --------- --------- ----------------
 33.48    0.000077          38         2           getdents64
 26.09    0.000060           2        26           close
 12.61    0.000029           1        25           fstat
 12.17    0.000028          14         2           ioctl
 10.00    0.000023          23         1           write
  5.65    0.000013           0        37        13 openat
  0.00    0.000000           0        16           read
  0.00    0.000000           0         6           lseek
  0.00    0.000000           0        32           mmap
  0.00    0.000000           0        14           mprotect
  0.00    0.000000           0         1           munmap
  0.00    0.000000           0         3           brk
  0.00    0.000000           0         2           rt_sigaction
  0.00    0.000000           0         1           rt_sigprocmask
  0.00    0.000000           0         2         1 access
  0.00    0.000000           0         1           execve
  0.00    0.000000           0         2         2 statfs
  0.00    0.000000           0         2         1 arch_prctl
  0.00    0.000000           0         1           futex
  0.00    0.000000           0         1           set_tid_address
  0.00    0.000000           0         1           set_robust_list
  0.00    0.000000           0         1           prlimit64
------ ----------- ----------- --------- --------- ----------------
100.00    0.000230                   179        17 total
```





对于 -p 方式的追踪则有一点不同,以上述 top 命令PID为例：

```shell
$ strace -c -p 27028
strace: Process 27028 attached
```

执行后 strace 命令会一直阻塞在这里，不会有任何输出<Ctrl+C>退出后则会打印出汇总信息。

```shell
^Cstrace: Process 27028 detached
% time     seconds  usecs/call     calls    errors syscall
------ ----------- ----------- --------- --------- ----------------
 27.87    0.058425          12      4826           read
 26.81    0.056222          12      4522           openat
 22.33    0.046810          10      4522           close
 12.38    0.025961          11      2242           stat
  3.40    0.007130          10       684           alarm
  2.31    0.004851          10       456           fcntl
  2.20    0.004606          10       456           rt_sigaction
  1.35    0.002825          74        38           getdents64
  0.53    0.001112          11        98           write
  0.47    0.000975           8       114           lseek
  0.16    0.000333          17        19        19 access
  0.11    0.000222           5        38           fstat
  0.09    0.000199          10        19           pselect6
------ ----------- ----------- --------- --------- ----------------
100.00    0.209671                 18034        19 total

```



### 4. -i 打印指令指针

通过**`-i`**标记可以打印出执行系统调用入口指令指针。

```shell
$ strace -i ls
[00007f087807182b] execve("/usr/bin/ls", ["ls"], 0x7ffe4761a198 /* 27 vars */) = 0
[00007fb553130cfb] brk(NULL)            = 0x556bfa0c7000
[00007fb55312fac5] arch_prctl(0x3001 /* ARCH_??? */, 0x7ffdd240ee30) = -1 EINVAL (Invalid argument)
[00007fb5531319cb] access("/etc/ld.so.preload", R_OK) = -1 ENOENT (No such file or directory)
[00007fb553131af1] openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
[00007fb553131917] fstat(3, {st_mode=S_IFREG|0644, st_size=35362, ...}) = 0
[00007fb553131d07] mmap(NULL, 35362, PROT_READ, MAP_PRIVATE, 3, 0) = 0x7fb553335000
[00007fb5531319fb] close(3)  
```

> 最前面一列就是指令指针了，例如 [00007f087807182b] 。



### 5. -t 打印系统时间

通过**`-t`**标记可以把每一行的时间打印出来，便于分析。

> -t：秒级
> -tt：微秒级. 
> -ttt：微秒级,时间戳方式显示

```shell
$ strace -t ls
09:45:18 execve("/usr/bin/ls", ["ls"], 0x7ffe93e88498 /* 27 vars */) = 0
09:45:18 brk(NULL)                      = 0x558aa2dad000
09:45:18 arch_prctl(0x3001 /* ARCH_??? */, 0x7ffe7f64ba50) = -1 EINVAL (Invalid argument)
09:45:18 access("/etc/ld.so.preload", R_OK) = -1 ENOENT (No such file or directory)
09:45:18 openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
09:45:18 fstat(3, {st_mode=S_IFREG|0644, st_size=35362, ...}) = 0
09:45:18 mmap(NULL, 35362, PROT_READ, MAP_PRIVATE, 3, 0) = 0x7f2388692000
09:45:18 close(3)  
```



### 6. -r 打印相对时间

可以通过**`-r`**标记打印每个系统调用间的相对时间。

> 和 -t 标记打印系统时间相比 -r 直接打印间隔时间则比较直观。

```sh
$ strace -r ls
     0.000000 execve("/usr/bin/ls", ["ls"], 0x7ffd062ccfb8 /* 27 vars */) = 0
     0.000452 brk(NULL)                 = 0x55c4778bc000
     0.000050 arch_prctl(0x3001 /* ARCH_??? */, 0x7ffd79519620) = -1 EINVAL (Invalid argument)
     0.000098 access("/etc/ld.so.preload", R_OK) = -1 ENOENT (No such file or directory)
     0.000040 openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
     0.000023 fstat(3, {st_mode=S_IFREG|0644, st_size=35362, ...}) = 0
     0.000023 mmap(NULL, 35362, PROT_READ, MAP_PRIVATE, 3, 0) = 0x7f351b3d6000
     0.000021 close(3)  
```



### 7. -T 打印系统调用耗时

通过**`-T`**标记可以打印出每个系统调用花费的时间。

> 注：-r为系统调用间隔时间，这里-T是系统调用耗时，二者是不一样的。

```shell
$ strace -T ls
execve("/usr/bin/ls", ["ls"], 0x7ffe80aa6918 /* 27 vars */) = 0 <0.000334>
brk(NULL)                               = 0x556704b44000 <0.000005>
arch_prctl(0x3001 /* ARCH_??? */, 0x7ffca4d64710) = -1 EINVAL (Invalid argument) <0.000020>
access("/etc/ld.so.preload", R_OK)      = -1 ENOENT (No such file or directory) <0.000015>
openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3 <0.000047>
fstat(3, {st_mode=S_IFREG|0644, st_size=35362, ...}) = 0 <0.000037>
mmap(NULL, 35362, PROT_READ, MAP_PRIVATE, 3, 0) = 0x7fc7b73c6000 <0.000037>
close(3)                                = 0 <0.000031>
```

最后一列就是该系统调用的耗时，比如第一行的 execve 系统调用耗时就是 <0.000334>。



### 8. -e 追踪指定系统调用

通过**`-e trace=xxx`**参数可以指定要追踪的系统调用。过滤掉其他干扰信息，便于分析问题。

> 可以指定多个，用逗号隔开。

```shell
$ strace -e trace=read,ioctl ls
```

演示：

```shell
$ strace -e trace=read,ioctl ls
read(3, "\177ELF\2\1\1\0\0\0\0\0\0\0\0\0\3\0>\0\1\0\0\0\240z\0\0\0\0\0\0"..., 832) = 832
read(3, "\4\0\0\0\20\0\0\0\5\0\0\0GNU\0\2\0\0\300\4\0\0\0\3\0\0\0\0\0\0\0", 32) = 32
read(3, "\4\0\0\0\20\0\0\0\5\0\0\0GNU\0\2\0\0\300\4\0\0\0\3\0\0\0\0\0\0\0", 32) = 32
read(3, "\177ELF\2\1\1\0\0\0\0\0\0\0\0\0\3\0>\0\1\0\0\0\220\30\0\0\0\0\0\0"..., 832) = 832
read(3, "\4\0\0\0\20\0\0\0\5\0\0\0GNU\0\2\0\0\300\4\0\0\0\3\0\0\0\0\0\0\0", 32) = 32
read(3, "\4\0\0\0\20\0\0\0\5\0\0\0GNU\0\2\0\0\300\4\0\0\0\3\0\0\0\0\0\0\0", 32) = 32
read(3, "\177ELF\2\1\1\3\0\0\0\0\0\0\0\0\3\0>\0\1\0\0\0\2009\2\0\0\0\0\0"..., 832) = 832
read(3, "\177ELF\2\1\1\0\0\0\0\0\0\0\0\0\3\0>\0\1\0\0\0P#\0\0\0\0\0\0"..., 832) = 832
read(3, "\4\0\0\0\20\0\0\0\5\0\0\0GNU\0\2\0\0\300\4\0\0\0\3\0\0\0\0\0\0\0", 32) = 32
read(3, "\4\0\0\0\20\0\0\0\5\0\0\0GNU\0\2\0\0\300\4\0\0\0\3\0\0\0\0\0\0\0", 32) = 32
read(3, "\177ELF\2\1\1\0\0\0\0\0\0\0\0\0\3\0>\0\1\0\0\0\220\20\0\0\0\0\0\0"..., 832) = 832
read(3, "\177ELF\2\1\1\0\0\0\0\0\0\0\0\0\3\0>\0\1\0\0\0000o\0\0\0\0\0\0"..., 832) = 832
read(3, "nodev\tsysfs\nnodev\trootfs\nnodev\tr"..., 1024) = 399
read(3, "", 1024)                       = 0
read(3, "# Locale name alias data base.\n#"..., 4096) = 2997
read(3, "", 4096)                       = 0
ioctl(1, TCGETS, {B38400 opost isig icanon echo ...}) = 0
ioctl(1, TIOCGWINSZ, {ws_row=56, ws_col=241, ws_xpixel=0, ws_ypixel=0}) = 0
aufs  helloworld  helloworld.c	overlayfs
+++ exited with 0 +++
```



### 9. -o 输出到文件

通过**`-o`**参数可以把输出重定向到文件。

```shell
$ strace -o debug.txt ls
$ cat debug.txt
[root@iZ2zefmrr626i66omb40ryZ tmp]# cat debug.txt 
execve("/usr/bin/ls", ["ls"], 0x7ffe647213d0 /* 27 vars */) = 0
brk(NULL)                               = 0x55e3c98bd000
arch_prctl(0x3001 /* ARCH_??? */, 0x7ffcb2a76450) = -1 EINVAL (Invalid argument)
access("/etc/ld.so.preload", R_OK)      = -1 ENOENT (No such file or directory)
openat(AT_FDCWD, "/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
fstat(3, {st_mode=S_IFREG|0644, st_size=35362, ...}) = 0
mmap(NULL, 35362, PROT_READ, MAP_PRIVATE, 3, 0) = 0x7fb71db8b000
close(3) 
...
```



### 10. -f 追踪子进程

strace 默认只追踪主进程，可以通过**`-f`**参数指定追踪子进程，如果是通过**`-o`**输出到文件还可以用**`-ff`**把不同子进程的调用信息写入到filename.pid中,pid是各进程的进程号。

```shell
$ strace -f -ff -o debug.txt ls
$ ls
debug.txt.31282
```

> ls 是单进程的所以只有一个文件，如果是多进程程序则会有多个。



