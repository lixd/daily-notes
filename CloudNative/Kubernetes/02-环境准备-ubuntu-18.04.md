# Kubernetes 安装前的准备

## 概述

本次安装采用 Ubuntu Server X64 18.04 LTS 版本安装 kubernetes 集群环境，集群节点为 1 主 2 从模式，此次对虚拟机会有些基本要求，如下：

- OS：Ubuntu Server X64 18.04 LTS（16.04 版本步骤相同，再之前则不同）
- CPU：最低要求，1 CPU 2 核
- 内存：最低要求，2GB
- 磁盘：最低要求，20GB

创建三台虚拟机，分别命名如下：

- Ubuntu Server 18.04 X64 Kubernetes Master
- Ubuntu Server 18.04 X64 Kubernetes Slave1
- Ubuntu Server 18.04 X64 Kubernetes Slave2

## 对虚拟机系统的配置

- 关闭交换空间：`sudo swapoff -a`
- 避免开机启动交换空间：注释掉 `/etc/fstab` 中的 `swap`
- 关闭防火墙：`ufw disable`

## 使用 APT 安装 Docker

### 安装

```bash
# 更新软件源
sudo apt-get update
# 安装所需依赖
sudo apt-get -y install apt-transport-https ca-certificates curl software-properties-common
# 安装 GPG 证书
curl -fsSL http://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo apt-key add -
# 新增软件源信息
sudo add-apt-repository "deb [arch=amd64] http://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable"
# 再次更新软件源
sudo apt-get -y update
# 安装 Docker CE 版
sudo apt-get -y install docker-ce
```

### 验证

```bash
docker version
Client:
 Version:           18.09.6
 API version:       1.39
 Go version:        go1.10.8
 Git commit:        481bc77
 Built:             Sat May  4 02:35:57 2019
 OS/Arch:           linux/amd64
 Experimental:      false

Server: Docker Engine - Community
 Engine:
  Version:          18.09.6
  API version:      1.39 (minimum version 1.12)
  Go version:       go1.10.8
  Git commit:       481bc77
  Built:            Sat May  4 01:59:36 2019
  OS/Arch:          linux/amd64
  Experimental:     false
```

### 配置加速器

对于使用 **systemd** 的系统，请在 `/etc/docker/daemon.json` 中写入如下内容（如果文件不存在请新建该文件）

这里可以选择阿里云的镜像加速器。

```json
{
  "registry-mirrors": [
    "https://registry.docker-cn.com"
  ]
}

{
  "registry-mirrors": [
    "https://ekxinbbh.mirror.aliyuncs.com"
  ]
}
```

> 注意，一定要保证该文件符合 JSON 规范，否则 Docker 将不能启动。

验证加速器是否配置成功：

```bash
sudo systemctl restart docker
docker info
...
# 出现如下语句即表示配置成功
Registry Mirrors:
 https://registry.docker-cn.com/
...
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
# 使用 hostnamectl 命令修改，其中 kubernetes-master 为新的主机名
hostnamectl set-hostname kubernetes-master
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

```bash
root@kubernetes-master:~# hostnamectl
   Static hostname: kubernetes-master
         Icon name: computer-vm
           Chassis: vm
        Machine ID: b18e930d6d6247fabedd12a40e0e0618
           Boot ID: eb1e7e196a4e4790a3e9e6cb3ae762c5
    Virtualization: vmware
  Operating System: Ubuntu 18.04.2 LTS
            Kernel: Linux 4.15.0-50-generic
      Architecture: x86-64

```