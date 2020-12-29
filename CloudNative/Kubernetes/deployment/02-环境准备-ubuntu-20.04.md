# 环境准备

## 0. 概述

> 原文 https://www.funtl.com/zh/service-mesh-kubernetes

本次安装采用 Ubuntu Server X64 20.04 LTS 版本安装 kubernetes 集群环境，集群节点为 1 主 2 从模式，此次对虚拟机会有些基本要求，如下：

- OS：Ubuntu Server X64 20.04 LTS
- CPU：最低要求，1 CPU 2 核
- 内存：最低要求，2GB
- 磁盘：最低要求，20GB

创建三台虚拟机，分别命名如下：

- Kubernetes Master
- Kubernetes Node1
- Kubernetes Node2



## 1. 安装 ubuntu server

### 1. 下载

下载地址`http://mirrors.aliyun.com/ubuntu-releases/`

文件`ubuntu-20.04-live-server-amd64.iso    `

>  使用的是 VMware

### 2. 安装

> 安装的时候可以勾选上安装 ssh 就不需要手动安装了。

安装过程需要注意的几个点：

* 安装过程中可以配置一下镜像（Mirrors Address），阿里云镜像地址：`https://mirrors.aliyun.com/ubuntu/`

> [具体安装过程及docker安装](https://github.com/lixd/daily-notes/blob/master/ComputerScience/Linux/Ubuntu环境搭建/ubuntu 20.04 server-install.md)



### 3. k8s对虚拟机系统的配置

> 几台机器都需要做的操作统一在这里处理了

关闭交换空间

```shell
sudo swapoff -a
```

避免开机启动交换空间

```shell
vi /etc/fstab
注释掉有swap的行
```

关闭防火墙

```shell
systemctl stop ufw
systemctl disable ufw
```
修改 cloud.cfg（如果有该文件）

> 如果 `cloud-init package` 安装了，需要修改 `cloud.cfg` 文件。该软件包通常缺省安装用于处理 cloud

```shell
vi /etc/cloud/cloud.cfg

#该配置默认为 false，修改为 true 即可
preserve_hostname: true
```



   

## 3. 克隆

在前面安装好的机器上创建 3 个`链接克隆`，用于安装 kubernetes 。

### 1.  mac 地址

 VMware 软件中选择虚拟机,右键设置-->网络适配器-->高级-->生成新 mac 地址

### 2. IP 地址

编辑 `vi /etc/netplan/50-cloud-init.yaml` 配置文件,修改内容如下：

> 注意这里的配置文件名未必和你机器上的相同，请根据实际情况修改。

```shell
vi /etc/netplan/50-cloud-init.yaml
```

其中`addresses`即为 ip 地址

```shell
# This is the network config written by 'subiquity'
network:
  ethernets:
    ens33:
      addresses:
      - 192.168.2.110/24
      gateway4: 192.168.2.2
      nameservers:
        addresses:
        - 8.8.8.8
  version: 2
```

应用使配置生效 

```shell
netplan apply
```



### 3. hostname

1) 查看

```shell
# 查看当前主机名
root@docker:~# hostnamectl
# 显示如下内容
   Static hostname: docker
         Icon name: computer-vm
           Chassis: vm
        Machine ID: a517a1a3a7c8433a8f6c988bd9f38b92
           Boot ID: ad5d1ad492e242bc9f58984cdb0dda46
    Virtualization: vmware
  Operating System: Ubuntu 20.04 LTS
            Kernel: Linux 5.4.0-33-generic
      Architecture: x86-64

```

2) 修改

> 这步不需要在这台机器上做 在克隆出来的另外机器上改即可,随便改成什么都行
>
> 这里分别是:kubernetes-master kubernetes-node1 kubernetes-node2

```shell
# 使用 hostnamectl 命令修改，其中 kubernetes-master 为新的主机名
root@docker:~# hostnamectl set-hostname kubernetes-master
```

### 4. 修改DNS

#### 方法一

- 停止 `systemd-resolved` 服务：`systemctl stop systemd-resolved`
- 修改 DNS：`vi /etc/resolv.conf`，将 `nameserver` 修改为如 `114.114.114.114` 可以正常使用的 DNS 地址

#### 方法二

```bash
vi /etc/systemd/resolved.conf
```

添加 DNS

```shell
#  This file is part of systemd.
# 
#  systemd is free software; you can redistribute it and/or modify it
#  under the terms of the GNU Lesser General Public License as published by
#  the Free Software Foundation; either version 2.1 of the License, or
#  (at your option) any later version.
#
# Entries in this file show the compile time defaults.
# You can change settings by editing this file.
# Defaults can be restored by simply deleting this file.
#
# See resolved.conf(5) for details

[Resolve]
DNS=114.114.114.114
#FallbackDNS=
#Domains=
#LLMNR=no
#MulticastDNS=no
#DNSSEC=no
#DNSOverTLS=no
#Cache=yes
#DNSStubListener=yes
#ReadEtcHosts=yes
~                   
```