# CentOS 升级内核

> [Linux 升级内核步骤](https://www.jianshu.com/p/01da982ce8d3)

安装 Kata Containers 时发现内核版本过低，导致无法正常运行，于是需要升级以下内核版本，记录一下过程。

### 1）查看当前内核版本

```bash
$ uname -r
3.10.0-1160.el7.x86_64


$ uname -a
Linux k8s-node1 3.10.0-1160.el7.x86_64 #1 SMP Mon Oct 19 16:18:59 UTC 2020 x86_64 x86_64 x86_64 GNU/Linux


$ cat /etc/redhat-release 
CentOS Linux release 7.9.2009 (Core)
```



### 2）升级内核

更新yum源仓库

```ruby
$ yum -y update
```



启用 ELRepo 仓库

导入ELRepo仓库的公共密钥

```bash
rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
```

> ELRepo 仓库是基于社区的用于企业级 Linux 仓库，提供对 RedHat Enterprise (RHEL) 和 其他基于 RHEL的 Linux 发行版（CentOS、Scientific、Fedora 等）的支持。
>  ELRepo 聚焦于和硬件相关的软件包，包括文件系统驱动、显卡驱动、网络驱动、声卡驱动和摄像头驱动等。

安装ELRepo仓库的yum源

```cpp
rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-3.el7.elrepo.noarch.rpm
```



### 3）查看可用的系统内核包



```bash
$ yum --disablerepo="*" --enablerepo="elrepo-kernel" list available
Loaded plugins: fastestmirror, langpacks
Loading mirror speeds from cached hostfile
 * elrepo-kernel: mirrors.tuna.tsinghua.edu.cn
Available Packages
elrepo-release.noarch                   7.0-5.el7.elrepo           elrepo-kernel
kernel-lt.x86_64                        5.4.188-1.el7.elrepo       elrepo-kernel
kernel-lt-devel.x86_64                  5.4.188-1.el7.elrepo       elrepo-kernel
kernel-lt-doc.noarch                    5.4.188-1.el7.elrepo       elrepo-kernel
kernel-lt-headers.x86_64                5.4.188-1.el7.elrepo       elrepo-kernel
kernel-lt-tools.x86_64                  5.4.188-1.el7.elrepo       elrepo-kernel
kernel-lt-tools-libs.x86_64             5.4.188-1.el7.elrepo       elrepo-kernel
kernel-lt-tools-libs-devel.x86_64       5.4.188-1.el7.elrepo       elrepo-kernel
kernel-ml.x86_64                        5.17.2-1.el7.elrepo        elrepo-kernel
kernel-ml-devel.x86_64                  5.17.2-1.el7.elrepo        elrepo-kernel
kernel-ml-doc.noarch                    5.17.2-1.el7.elrepo        elrepo-kernel
kernel-ml-headers.x86_64                5.17.2-1.el7.elrepo        elrepo-kernel
kernel-ml-tools.x86_64                  5.17.2-1.el7.elrepo        elrepo-kernel
kernel-ml-tools-libs.x86_64             5.17.2-1.el7.elrepo        elrepo-kernel
kernel-ml-tools-libs-devel.x86_64       5.17.2-1.el7.elrepo        elrepo-kernel
perf.x86_64                             5.17.2-1.el7.elrepo        elrepo-kernel
python-perf.x86_64                      5.17.2-1.el7.elrepo        elrepo-kernel
```

 可以看到有 5.4和 5.17 两个版本可以安装。



### 4）安装最新版本内核

```bash
yum --enablerepo=elrepo-kernel install kernel-ml
```

> --enablerepo 选项开启 CentOS 系统上的指定仓库。默认开启的是 elrepo，这里用 elrepo-kernel 替换。



### 5）设置 grub2

内核安装好后，需要设置为默认启动选项并**重启**后才会生效。

1）查看系统上的所有可用内核：

```bash
$ sudo awk -F\' '$1=="menuentry " {print i++ " : " $2}' /etc/grub2.cfg
0 : CentOS Linux (5.17.2-1.el7.elrepo.x86_64) 7 (Core)
1 : CentOS Linux (3.10.0-1160.62.1.el7.x86_64) 7 (Core)
2 : CentOS Linux (3.10.0-1160.el7.x86_64) 7 (Core)
3 : CentOS Linux (0-rescue-d9be835d9ac243298b0f3657c5363887) 7 (Core)
```

2）设置新的内核为grub2的默认版本

 服务器上存在4 个内核，我们要使用 5.17 这个版本，可以通过 `grub2-set-default 0` 命令来设置。

> 其中 0 是上面查询出来的可用内核的序号

```cpp
grub2-set-default 0
```

3）重启

```bash
$ reboot
```

### 6）验证

```bash
$ uname -r
5.17.2-1.el7.elrepo.x86_64
```

### 

### 7）删除旧内核（可选）

查看系统中全部的内核：

```ruby
$ rpm -qa | grep kernel-
kernel-3.10.0-514.el7.x86_64
kernel-ml-4.18.7-1.el7.elrepo.x86_64
kernel-tools-libs-3.10.0-862.11.6.el7.x86_64
kernel-tools-3.10.0-862.11.6.el7.x86_64
kernel-3.10.0-862.11.6.el7.x86_64
```

方法1、yum remove 删除旧内核的 RPM 包

```csharp
$ yum remove kernel-3.10.0-514.el7.x86_64 \
kernel-tools-libs-3.10.0-862.11.6.el7.x86_64 \
kernel-tools-3.10.0-862.11.6.el7.x86_64 \
kernel-3.10.0-862.11.6.el7.x86_64
```

方法2、yum-utils 工具

安装yum-utils

```ruby
$ yum install yum-utils
```

删除旧版本

```go
package-cleanup --oldkernels
```

> 如果安装的内核不多于 3 个，yum-utils 工具不会删除任何一个。只有在安装的内核大于 3 个时，才会自动删除旧内核。



