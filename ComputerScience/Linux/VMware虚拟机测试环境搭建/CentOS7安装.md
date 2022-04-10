# CentOS 7 测试环境搭建

## 1. 安装

首先使用 VMware 安装 CentOS 7 虚拟机。

VMware 下载地址及许可证见

> 链接：https://pan.baidu.com/s/1ZXKDPEzft8zrR35AUUKLbA 
> 提取码：6666

ISO 文件下载地址见 [centos.org](http://isoredirect.centos.org/centos/7/isos/x86_64/)，推荐使用 [aliyun 镜像](http://mirrors.aliyun.com/centos/7.9.2009/isos/x86_64/)



## 2. 配置

### 设置静态IP

> VMware 网络推荐使用NAT模式

1）首先将虚拟机设置成 NAT 模式。

<img src="./assets/vm-set-nat.png" style="zoom:67%;" />



2）打开 vmware，点击“编辑”下的“虚拟网络编辑器”，设置NAT参数。

<img src="./assets/vm-config-nat.png" style="zoom:67%;" />



* 1）将主机虚拟适配器连接到此网络**打钩**
* 2）子网IP固定格式一般为`192.168.X.0`，**x 不要和宿主机相同**，我这里宿主机IP是192.168.1.3，所以虚拟机子网IP我选的是192.168.2.0。子网掩码默认`255.255.255.0`
* 3）网关IP一般设置为`192.168.X.2`，X和子网IP中的X一致。

3）设置虚拟机中的IP。

根据步骤而可知：

* 子网IP网段：192.168.2.0/24，这里就取个 192.168.2.111吧。
* 网关：192.168.2.2
* 子网掩码：255.255.255.0



> 适用于 CentOS7

默认网卡设备文件存放于`/etc/sysconfig/network-scripts/`

当然不一定都叫`ifcfg-ens33`这个名字 

```sh
vi /etc/sysconfig/network-scripts/ifcfg-ens33
```

修改如下内容

```sh
BOOTPROTO=static #设置网卡引导协议为 静态
ONBOOT=yes #设置网卡启动方式为 开机启动 并且可以通过系统服务管理器 systemctl 控制网卡
```

新增如下内容

```sh
IPADDR=192.168.2.111 #IP
NETMASK=255.255.255.0 #子网掩码
GATEWAY=192.168.2.2 #网关
DNS1=8.8.8.8
DNS2=114.114.114.114
```

设置这 IP 网关等参数要根据你当前所处的网络环境。

保存退出重启网络服务即可

```sh
systemctl restart network
```



### ssh root 登录

默认情况下无法使用 root 账号登录。



**设置允许远程登录 Root**

```shell
vi /etc/ssh/sshd_config
```

增加`PermitRootLogin yes   `

```shell
# Authentication:
LoginGraceTime 120
PermitRootLogin yes                 #接触此行
StrictModes yes
```

**重启ssh服务**

```shell
systemctl restart ssh
```



### 关闭防火墙

```shell
#centos
systemctl stop firewalld
systemctl disable firewalld
```



### 替换yum源

1）备份(针对所有CentOS可用，备份文件在当前路径下)

```shell
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
```



2 ）下载新的CentOS-Base.repo 到/etc/yum.repos.d/

阿里云源

```shell
wget -O /etc/yum.repos.d/CentOS-Base.repo http://mirrors.aliyun.com/repo/Centos-7.repo
```



3）更新软件包缓存

```shell
yum makecache
```



### 修改主机名

在同一局域网中主机名最好都不同，所以我们需要做修改。

**查看当前 Hostname**

```shell
$ hostnamectl
   Static hostname: localhost.localdomain
         Icon name: computer-vm
           Chassis: vm
        Machine ID: d9be835d9ac243298b0f3657c5363887
           Boot ID: a0a245bb1dc34b56939243e5b7920941
    Virtualization: vmware
  Operating System: CentOS Linux 7 (Core)
       CPE OS Name: cpe:/o:centos:centos:7
            Kernel: Linux 3.10.0-1160.el7.x86_64
      Architecture: x86-64
```

**修改 Hostname**

```bash
# 使用 hostnamectl 命令修改，其中 docker 为新的主机名
hostnamectl set-hostname docker
```



## 3. 软件安装

至此一个最基本的环境就准备好了，如果需要其他软件可以从当前虚拟机克隆镜像出去单独安装。



### 镜像克隆

需要先关闭目标虚拟机才能进行克隆。

克隆完成后需要配置新的IP并重新随机一个MAC地址，避免冲突。

随机MAC具体位置：设置-->网络-->高级里面，如下图所示：

<img src="assets/vm-gen-mac.png" style="zoom:50%;" />



修改IP见第二部分的设置静态IP，具体命令如下：

```shell
vi /etc/sysconfig/network-scripts/ifcfg-ens33
```

修改IP后重启网络服务。

```shell
systemctl restart network
```



然后可以创建个快照，后续安装错了可以直接恢复。
