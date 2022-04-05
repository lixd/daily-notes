# CentOS 7 安装 openvswitch



> [官方文档-Installing Open vSwitch](https://docs.openvswitch.org/en/latest/intro/install/#installing-open-vswitch)
>
> [Open vSwitch(OVS)学习系列(01)：在centos7和centos8中安装OVS](https://blog.csdn.net/weixin_42072280/article/details/119764004)
>
> [CentOS 7 安装 Open vSwitch](https://zhuanlan.zhihu.com/p/63114462)

# 1. 概述

官方提供了两种安装方式：

* Installation from Source：从源码构建安装
* Installation from Packages：通过包管理工具安装，比如 yum install

本文使用的是 CentOS 7 系统，测试安装当前的最新版本（2.17.0）OpenvSwitch。

```shell
$ cat /etc/redhat-release
CentOS Linux release 7.9.2009 (Core)
```



### 简单安装

官方提供的安装方式都挺复杂的，网上找了个简单的，以下安装基于 CentOS7

```shell
# 将OpenStack存储库添加到CentOS 7
yum install -y epel-release
yum install -y centos-release-openstack-train

# 在CentOS 7/RHEL 7系统上安装Open vSwitch     
# 注意：需要按两次y表示确认
yum install openvswitch libibverbs

# 启动并启用openvswitch服务   查看其状态
systemctl enable --now openvswitch
systemctl status openvswitch
```



可以看到 openvswitch 已经在运行了：

```shell
$ systemctl status openvswitch
● openvswitch.service - Open vSwitch
   Loaded: loaded (/usr/lib/systemd/system/openvswitch.service; enabled; vendor preset: disabled)
   Active: active (exited) since Mon 2022-04-04 07:23:33 EDT; 3s ago
  Process: 3700 ExecStart=/bin/true (code=exited, status=0/SUCCESS)
 Main PID: 3700 (code=exited, status=0/SUCCESS)

Apr 04 07:23:33 localhost.localdomain systemd[1]: Starting Open vSwitch...
Apr 04 07:23:33 localhost.localdomain systemd[1]: Started Open vSwitch.
```



```shell
# 检查ovs-vsctl命令是否可用
ovs-vsctl show
# 安装完毕后，检查OVS运行情况
ps -ae | grep ovs
# 查看版本信息
ovs-vsctl --version
ovs-appctl --version
ovs-ofctl --version   # 查看支持的OpenFlow版本
```



```shell
# 如果计划使用配置Open vSwitch，则可以选择安装os-net-config
yum install os-net-config
```







## 2. [yum 安装](Installation from Packages)

我们用的 CentOS 和 RHEL 的  yum 源是通用的，所以这里就照着[Fedora, RHEL 7.x Packaging for Open vSwitch](https://docs.openvswitch.org/en/latest/intro/install/fedora/#fedora-rhel-7-x-packaging-for-open-vswitch) 安装即可。



```shell
yum install @'Development Tools' rpm-build yum-utils
```



## 3. [源码安装](https://docs.openvswitch.org/en/latest/intro/install/#installation-from-source)



先下载源码，具体版本及对应链接见 [这里](https://www.openvswitch.org/download/)

```shell
wget https://www.openvswitch.org/releases/openvswitch-2.17.0.tar.gz
```

然后解压

```shell
tar -zxvf openvswitch-2.17.0.tar.gz
```





### 安装依赖

```shell
yum install make gcc build-essential libssl-dev libcap-ng-dev python3.4
```





