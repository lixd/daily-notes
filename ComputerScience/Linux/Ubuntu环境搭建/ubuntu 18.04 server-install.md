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

## 2. 使用 Root 用户

在实际生产操作中，我们基本上都是使用超级管理员账户操作 Linux 系统，也就是 Root 用户，Linux 系统默认是关闭 Root 账户的，我们需要为 Root 用户设置一个初始密码以方便我们使用。

### 设置 Root 账户密码

```text
sudo passwd root
```

### 切换到 Root

```text
su
```

### 设置允许远程登录 Root

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

重启服务

```shell
systemctl restart ssh
```



## 3. 修改数据源

由于国内的网络环境问题，我们需要将 Ubuntu 的数据源修改为国内数据源，操作步骤如下：

如果前面安装时配置了就不用在改了。

### 查看系统版本

```text
lsb_release -a
```

输出结果为

```text
No LSB modules are available.
Distributor ID:	Ubuntu
Description:	Ubuntu 18.04.2 LTS
Release:	18.04
Codename:	bionic
```

**注意：** Codename 为 `bionic`，该名称为我们 Ubuntu 系统的名称，修改数据源需要用到该名称

### 编辑数据源

```shell
vi /etc/apt/sources.list
```

删除全部内容并修改为

```shell
deb http://mirrors.aliyun.com/ubuntu/ xenial main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ xenial-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ xenial-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ xenial-backports main restricted universe multiverse
```

### 更新数据源

```text
apt-get update
```

## 修改主机名

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



## 5. APT 命令

### 5.1 常用 APT 命令

#### 安装软件包

```text
apt-get install packagename
```

#### 删除软件包

```text
apt-get remove packagename
```

#### 更新软件包列表

```text
apt-get update
```

#### 升级有可用更新的系统（慎用）

```text
apt-get upgrade
```

### 5.2 其它 APT 命令

#### 搜索

```text
apt-cache search package
```

#### 获取包信息

```text
apt-cache show package
```

#### 删除包及配置文件

```text
apt-get remove package --purge
```

#### 了解使用依赖

```text
apt-cache depends package
```

#### 查看被哪些包依赖

```text
apt-cache rdepends package
```

#### 安装相关的编译环境

```text
apt-get build-dep package
```

#### 下载源代码

```text
apt-get source package
```

#### 清理无用的包

```text
apt-get clean && apt-get autoclean
```

#### 检查是否有损坏的依赖

```text
apt-get check
```

