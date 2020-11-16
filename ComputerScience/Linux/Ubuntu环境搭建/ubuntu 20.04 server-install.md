# ubuntu 入门教程

## 1. Ubuntu 18.04 安装

### 下载

官网：`https://www.ubuntu.com/download/server` 这里下载的是18.04.2 TLS。

### 安装

也是使用 VMware 安装。

直接下一步下一步就 ok。

需要注意的几个点：

* 安装过程中可以配置一下镜像，阿里云镜像地址：`https://mirrors.aliyun.com/ubuntu/`
* 磁盘选择`LVM` 方便后续扩展，默认磁盘大小为4G，需要手动修改大小。



## 2. 后续

### 1.设置静态IP

> 见 Linux设置静态IP，推荐使用NAT网络模式



### 2.安装 ssh 设置 Root账户登录

> 一般都默认安装了 ssh，没有就手动安装一下

**设置 Root 账户密码**

```text
sudo passwd root
```

**切换到 Root**

```text
su
```

**设置允许远程登录 Root**

```shell
vi /etc/ssh/sshd_config
```

增加`PermitRootLogin yes   `

```shell
# Authentication:
LoginGraceTime 120
#PermitRootLogin without-password   #注释此行
PermitRootLogin yes                 #增加此行
StrictModes yes
```

**重启ssh服务**

```shell
systemctl restart ssh
```



### 3. 关闭防火墙

```shell
#ubuntu 
# 关闭并禁止开启自启动
systemctl stop ufw
systemctl disable ufw
#centos
systemctl stop firewalld
systemctl disable firewalld
```



### 4. 修改数据源

由于国内的网络环境问题，我们需要将 Ubuntu 的数据源修改为国内数据源，操作步骤如下：

> 如果前面安装时配置了就不用在改了。

**查看系统版本**

```text
lsb_release -a
```

输出结果为

```text
No LSB modules are available.
Distributor ID:	Ubuntu
Description:	Ubuntu 20.04.1 LTS
Release:	20.04
Codename:	focal
```

**注意：** Codename 为 `focal`，该名称为我们 Ubuntu 系统的版本代号，修改数据源时需要和该代号对应。

> 阿里的源可以在这里看http://mirrors.aliyun.com/ubuntu/dists/

**替换数据源**

```shell
# 先备份一个
cp -ra /etc/apt/sources.list /etc/apt/sources.list.bak
vi /etc/apt/sources.list
```

删除全部内容并修改为

```shell
#添加阿里源
deb http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse
```

**更新缓存和升级**

```shell
sudo apt-get update
sudo apt-get upgrade
```



### 5. 安装 docker 和 docker-compose

> 见 docker 安装



### 6. 修改主机名

在同一局域网中主机名不应该相同，所以我们需要做修改，下列操作步骤为修改 **18.04** 版本的 Hostname，如果是 16.04 或以下版本则直接修改 `/etc/hostname` 里的名称即可

**查看当前 Hostname**

```bash
# 查看当前主机名
hostnamectl
# 显示如下内容
   Static hostname: ubuntu
         Icon name: computer-vm
           Chassis: vm
        Machine ID: b18e930d6d6247fabedd12a40e0e0618
           Boot ID: 85e13103ced7448c9ed4a61a894efc9a
    Virtualization: vmware
  Operating System: Ubuntu 18.04.2 LTS
            Kernel: Linux 4.15.0-50-generic
      Architecture: x86-64
```

**修改 Hostname**

```bash
# 使用 hostnamectl 命令修改，其中 docker 为新的主机名
hostnamectl set-hostname docker
```

**修改 cloud.cfg**

如果 `cloud-init package` 安装了，需要修改 `cloud.cfg` 文件。该软件包通常缺省安装用于处理 cloud

```bash
# 如果有该文件
vi /etc/cloud/cloud.cfg

# 该配置默认为 false，修改为 true 即可
preserve_hostname: true
```

**验证**

```shell
root@kubernetes-master:~# hostnamectl
   Static hostname: docker
         Icon name: computer-vm
           Chassis: vm
        Machine ID: b18e930d6d6247fabedd12a40e0e0618
           Boot ID: eb1e7e196a4e4790a3e9e6cb3ae762c5
    Virtualization: vmware
  Operating System: Ubuntu 18.04.2 LTS
            Kernel: Linux 4.15.0-50-generic
      Architecture: x86-64
```
