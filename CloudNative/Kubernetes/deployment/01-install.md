---
title: "Kubernetes系列(一)---通过Kubeadm部署K8s集群"
description: "通过Kubeadm部署K8s集群"
date: 2021-02-20
draft: false
categories: ["Kubernetes"]
tags: ["Kubernetes"]
---

本文主要记录了如何使用 kubeadm 搭建 Kubernetes 集群。包括安装Kubeadm，初始化Master节点，配置Worker节点，安装网络插件等等。

<!--more-->

## 1. 概述

本文主要记录了如何使用 kubeadm 搭建 Kubernetes 集群。

大概有如下几个步骤：

* 1）环境准备
  * 准备好3台机器（虚拟机、云服务器都行）
  * 修改必要的系统设置
* 2）安装Kubeadm
* 3）使用Kubeadm初始化Master节点
* 4）将Worker节点加入集群
* 5）安装网络插件Calico



本教程基于以下系统及软件版本：

* Ubuntu Server X64 20.04 LTS
* kubeadm (1.19.4-00) 
*  Kubernetes version: v1.19.4
* Calico 3.16.5



## 2. 环境准备

本次使用虚拟机方式安装，采用 Ubuntu Server X64 20.04 LTS 版本。集群节点为 1 主 2 从模式，此次对虚拟机会有些基本要求，如下：

- OS：Ubuntu Server X64 20.04 LTS
- CPU：最低要求，1 CPU 2 核
- 内存：最低要求，2GB
- 磁盘：最低要求，20GB

创建三台虚拟机，分别命名如下：

- Kubernetes Master
- Kubernetes Node1
- Kubernetes Node2

> 可以先准备好基础环境，然后通过链接克隆方式创建出3台虚拟机。



### 1. 安装 ubuntu server

**下载**

下载地址`http://mirrors.aliyun.com/ubuntu-releases/`

文件`ubuntu-20.04-live-server-amd64.iso    `

>  使用的是 VMware 虚拟化软件。

**安装**

> 安装的时候可以勾选上安装 ssh 就不需要手动安装了。

安装过程需要注意的几个点：

* 安装过程中可以配置一下镜像（Mirrors Address），阿里云镜像地址：`https://mirrors.aliyun.com/ubuntu/`

具体安装教程：

```sh
https://github.com/lixd/daily-notes/blob/master/ComputerScience/Linux/Ubuntu环境搭建/ubuntu 20.04 server-install.md
```



### 2. k8s对虚拟机系统的配置

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

 修改DNS

方法一

- 停止 `systemd-resolved` 服务：`systemctl stop systemd-resolved`
- 修改 DNS：`vi /etc/resolv.conf`，将 `nameserver` 修改为如 `114.114.114.114` 可以正常使用的 DNS 地址

方法二

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



  ### 3. 创建链接克隆

在前面安装好的机器上创建 3 个`链接克隆`，用于安装 kubernetes 。

需要修改以下几个地方：

* 1）mac 地址
* 2）IP 地址
* 3）hostname

> 主要防止相同 mac 或者 ip地址导致冲突。

**1.  mac 地址**

 VMware 软件中选择虚拟机,右键设置-->网络适配器-->高级-->生成新 mac 地址

**2. IP 地址**

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



**3. hostname**

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



## 3. 安装 Kubeadm

kubeadm 是 kubernetes 的集群安装工具，能够快速安装 kubernetes 集群。

步骤如下：

* 1）安装 kubeadm，kubelet，kubectl
  * 需要在3个机器上都执行该步骤。
* 2）拉取 kubernetes 相关镜像
  * 只需要在Master节点执行即可

由于国内特殊网络环境，每一步都需要额外的配置。



### 安装 kubeadm，kubelet，kubectl

配置软件源

```bash
# 安装系统工具
apt-get update && apt-get install -y apt-transport-https
# 安装 GPG 证书
curl https://mirrors.aliyun.com/kubernetes/apt/doc/apt-key.gpg | apt-key add -
# 写入软件源；注意：我们用系统代号为 bionic，但目前阿里云不支持，所以沿用 16.04 的 xenial
cat << EOF >/etc/apt/sources.list.d/kubernetes.list
deb https://mirrors.aliyun.com/kubernetes/apt/ kubernetes-xenial main
EOF
```



安装 kubeadm，kubelet，kubectl

```bash
# 安装
apt-get update  
apt-get install -y kubelet kubeadm kubectl

# 安装过程如下，注意 kubeadm 的版本号
root@docker:~# apt-get install -y kubelet kubeadm kubectl
Reading package lists... Done
Building dependency tree       
Reading state information... Done
The following additional packages will be installed:
  conntrack cri-tools ebtables kubernetes-cni socat
Suggested packages:
  nftables
The following NEW packages will be installed:
  conntrack cri-tools ebtables kubeadm kubectl kubelet kubernetes-cni socat
0 upgraded, 8 newly installed, 0 to remove and 124 not upgraded.
Need to get 68.5 MB of archives.
After this operation, 292 MB of additional disk space will be used.
Get:1 http://mirrors.aliyun.com/ubuntu focal/main amd64 conntrack amd64 1:1.4.5-2 [30.3 kB]
Get:2 https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial/main amd64 cri-tools amd64 1.13.0-01 [8,775 kB]
Get:3 http://mirrors.aliyun.com/ubuntu focal/main amd64 ebtables amd64 2.0.11-3build1 [80.3 kB]
Get:4 http://mirrors.aliyun.com/ubuntu focal/main amd64 socat amd64 1.7.3.3-2 [323 kB]
Get:5 https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial/main amd64 kubernetes-cni amd64 0.8.7-00 [25.0 MB]
Get:6 https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial/main amd64 kubelet amd64 1.19.4-00 [18.2 MB]
Get:7 https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial/main amd64 kubectl amd64 1.19.4-00 [8,347 kB]
Get:8 https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial/main amd64 kubeadm amd64 1.19.4-00 [7,759 kB]
Fetched 68.5 MB in 5s (14.0 MB/s)    
Selecting previously unselected package conntrack.
(Reading database ... 71123 files and directories currently installed.)
Preparing to unpack .../0-conntrack_1%3a1.4.5-2_amd64.deb ...
Unpacking conntrack (1:1.4.5-2) ...
Selecting previously unselected package cri-tools.
Preparing to unpack .../1-cri-tools_1.13.0-01_amd64.deb ...
Unpacking cri-tools (1.13.0-01) ...
Selecting previously unselected package ebtables.
Preparing to unpack .../2-ebtables_2.0.11-3build1_amd64.deb ...
Unpacking ebtables (2.0.11-3build1) ...
Selecting previously unselected package kubernetes-cni.
Preparing to unpack .../3-kubernetes-cni_0.8.7-00_amd64.deb ...
Unpacking kubernetes-cni (0.8.7-00) ...
Selecting previously unselected package socat.
Preparing to unpack .../4-socat_1.7.3.3-2_amd64.deb ...
Unpacking socat (1.7.3.3-2) ...
Selecting previously unselected package kubelet.
Preparing to unpack .../5-kubelet_1.19.4-00_amd64.deb ...
Unpacking kubelet (1.19.4-00) ...
Selecting previously unselected package kubectl.
Preparing to unpack .../6-kubectl_1.19.4-00_amd64.deb ...
Unpacking kubectl (1.19.4-00) ...
Selecting previously unselected package kubeadm.
Preparing to unpack .../7-kubeadm_1.19.4-00_amd64.deb ...
Unpacking kubeadm (1.19.4-00) ...
Setting up conntrack (1:1.4.5-2) ...
Setting up kubectl (1.19.4-00) ...
Setting up ebtables (2.0.11-3build1) ...
Setting up socat (1.7.3.3-2) ...
Setting up cri-tools (1.13.0-01) ...
Setting up kubernetes-cni (0.8.7-00) ...
Setting up kubelet (1.19.4-00) ...
Created symlink /etc/systemd/system/multi-user.target.wants/kubelet.service → /lib/systemd/system/kubelet.service.

# 注意这里的版本号，我们使用的是 kubernetes v1.19.4
Setting up kubeadm (1.19.4-00) ...
Processing triggers for man-db (2.9.1-1) ...
```



```shell
# 设置 kubelet 自启动，并启动 kubelet
systemctl enable kubelet && systemctl start kubelet
```



- kubeadm：用于初始化 Kubernetes 集群
- kubectl：Kubernetes 的命令行工具，主要作用是部署和管理应用，查看各种资源，创建，删除和更新组件
- kubelet：主要负责启动 Pod 和容器



### 拉取镜像

**配置 kubeadm**

安装 kubernetes 主要是安装它的各个镜像，而 kubeadm 已经为我们集成好了运行 kubernetes 所需的基本镜像。

> 由于网络问题，同样需要修改为阿里云提供的镜像服务。

创建并修改配置

```bash
# 导出配置文件
# 目录：`/usr/local/k8s`
kubeadm config print init-defaults --kubeconfig ClusterConfiguration > kubeadm.yml
```

```yaml
# 修改配置为如下内容
apiVersion: kubeadm.k8s.io/v1beta1
bootstrapTokens:
- groups:
  - system:bootstrappers:kubeadm:default-node-token
  token: abcdef.0123456789abcdef
  ttl: 24h0m0s
  usages:
  - signing
  - authentication
kind: InitConfiguration
localAPIEndpoint:
  # 修改为`主节点` IP
  advertiseAddress: 192.168.1.113
  bindPort: 6443
nodeRegistration:
  criSocket: /var/run/dockershim.sock
  name: kubernetes-master
  taints:
  - effect: NoSchedule
    key: node-role.kubernetes.io/master
---
apiServer:
  timeoutForControlPlane: 4m0s
apiVersion: kubeadm.k8s.io/v1beta1
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controlPlaneEndpoint: ""
controllerManager: {}
dns:
  type: CoreDNS
etcd:
  local:
    dataDir: /var/lib/etcd
# 国内不能访问 Google，修改为阿里云
imageRepository: registry.aliyuncs.com/google_containers
kind: ClusterConfiguration
# 修改版本号 必须对应
kubernetesVersion: v1.19.4
networking:
  # 新增该配置 用于后续 Calico网络插件
  podSubnet: 192.168.0.0/16
  dnsDomain: cluster.local
  serviceSubnet: 10.96.0.0/12
scheduler: {}
---
```



**查看和拉取镜像**

```bash
# 查看所需镜像列表
kubeadm config images list --config kubeadm.yml

root@docker:/usr/local/k8s# kubeadm config images list --config kubeadm.yml
W1117 12:44:57.356057    5431 configset.go:348] WARNING: kubeadm cannot validate component configs for API groups [kubelet.config.k8s.io kubeproxy.config.k8s.io]
registry.aliyuncs.com/google_containers/kube-apiserver:v1.19.1
registry.aliyuncs.com/google_containers/kube-controller-manager:v1.19.1
registry.aliyuncs.com/google_containers/kube-scheduler:v1.19.1
registry.aliyuncs.com/google_containers/kube-proxy:v1.19.1
registry.aliyuncs.com/google_containers/pause:3.2
registry.aliyuncs.com/google_containers/etcd:3.4.13-0
registry.aliyuncs.com/google_containers/coredns:1.7.0
```



```shell
# 拉取镜像
kubeadm config images pull --config kubeadm.yml

root@docker:/usr/local/k8s# kubeadm config images pull --config kubeadm.yml
W1117 12:42:04.719464    5083 configset.go:348] WARNING: kubeadm cannot validate component configs for API groups [kubelet.config.k8s.io kubeproxy.config.k8s.io]
[config/images] Pulled registry.aliyuncs.com/google_containers/kube-apiserver:v1.19.4
[config/images] Pulled registry.aliyuncs.com/google_containers/kube-controller-manager:v1.19.4
[config/images] Pulled registry.aliyuncs.com/google_containers/kube-scheduler:v1.19.4
[config/images] Pulled registry.aliyuncs.com/google_containers/kube-proxy:v1.19.4
[config/images] Pulled registry.aliyuncs.com/google_containers/pause:3.2
[config/images] Pulled registry.aliyuncs.com/google_containers/etcd:3.4.13-0
[config/images] Pulled registry.aliyuncs.com/google_containers/coredns:1.7.0
```



## 4. 搭建Kubernetes集群

> 本节操作只需要在主节点执行。

### 初始化主节点

执行以下命令初始化主节点，该命令指定了初始化时需要使用的配置文件，其中添加 `--experimental-upload-certs` 参数可以在后续执行加入节点时自动分发证书文件。追加的 `tee kubeadm-init.log` 用以输出日志。

```shell
# /usr/local/docker/kubernetes目录下执行
# --config=kubeadm.yml 指定配置文件
# --experimental-upload-certs 更新证书
# tee kubeadm-init.log 将日志保存到文件
$ kubeadm init --config=kubeadm.yml --upload-certs | tee kubeadm-init.log
```



```bash
# 输出如下
root@docker:/usr/local/k8s# kubeadm init --config=kubeadm.yml --upload-certs | tee kubeadm-init.log
W1117 12:50:51.960255    6705 configset.go:348] WARNING: kubeadm cannot validate component configs for API groups [kubelet.config.k8s.io kubeproxy.config.k8s.io]
[init] Using Kubernetes version: v1.19.4
[preflight] Running pre-flight checks
	[WARNING IsDockerSystemdCheck]: detected "cgroupfs" as the Docker cgroup driver. The recommended driver is "systemd". Please follow the guide at https://kubernetes.io/docs/setup/cri/
[preflight] Pulling images required for setting up a Kubernetes cluster
[preflight] This might take a minute or two, depending on the speed of your internet connection
[preflight] You can also perform this action in beforehand using 'kubeadm config images pull'
[certs] Using certificateDir folder "/etc/kubernetes/pki"
[certs] Generating "ca" certificate and key
[certs] Generating "apiserver" certificate and key
[certs] apiserver serving cert is signed for DNS names [kubernetes kubernetes-master kubernetes.default kubernetes.default.svc kubernetes.default.svc.cluster.local] and IPs [10.96.0.1 192.168.2.110]
[certs] Generating "apiserver-kubelet-client" certificate and key
[certs] Generating "front-proxy-ca" certificate and key
[certs] Generating "front-proxy-client" certificate and key
[certs] Generating "etcd/ca" certificate and key
[certs] Generating "etcd/server" certificate and key
[certs] etcd/server serving cert is signed for DNS names [kubernetes-master localhost] and IPs [192.168.2.110 127.0.0.1 ::1]
[certs] Generating "etcd/peer" certificate and key
[certs] etcd/peer serving cert is signed for DNS names [kubernetes-master localhost] and IPs [192.168.2.110 127.0.0.1 ::1]
[certs] Generating "etcd/healthcheck-client" certificate and key
[certs] Generating "apiserver-etcd-client" certificate and key
[certs] Generating "sa" key and public key
[kubeconfig] Using kubeconfig folder "/etc/kubernetes"
[kubeconfig] Writing "admin.conf" kubeconfig file
[kubeconfig] Writing "kubelet.conf" kubeconfig file
[kubeconfig] Writing "controller-manager.conf" kubeconfig file
[kubeconfig] Writing "scheduler.conf" kubeconfig file
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Starting the kubelet
[control-plane] Using manifest folder "/etc/kubernetes/manifests"
[control-plane] Creating static Pod manifest for "kube-apiserver"
[control-plane] Creating static Pod manifest for "kube-controller-manager"
[control-plane] Creating static Pod manifest for "kube-scheduler"
[etcd] Creating static Pod manifest for local etcd in "/etc/kubernetes/manifests"
[wait-control-plane] Waiting for the kubelet to boot up the control plane as static Pods from directory "/etc/kubernetes/manifests". This can take up to 4m0s
[apiclient] All control plane components are healthy after 8.502052 seconds
[upload-config] Storing the configuration used in ConfigMap "kubeadm-config" in the "kube-system" Namespace
[kubelet] Creating a ConfigMap "kubelet-config-1.19" in namespace kube-system with the configuration for the kubelets in the cluster
[upload-certs] Storing the certificates in Secret "kubeadm-certs" in the "kube-system" Namespace
[upload-certs] Using certificate key:
50e89b238e308fe05ef39904452b8115674b96217489f93ec6558144c8834ace
[mark-control-plane] Marking the node kubernetes-master as control-plane by adding the label "node-role.kubernetes.io/master=''"
[mark-control-plane] Marking the node kubernetes-master as control-plane by adding the taints [node-role.kubernetes.io/master:NoSchedule]
[bootstrap-token] Using token: abcdef.0123456789abcdef
[bootstrap-token] Configuring bootstrap tokens, cluster-info ConfigMap, RBAC Roles
[bootstrap-token] configured RBAC rules to allow Node Bootstrap tokens to get nodes
[bootstrap-token] configured RBAC rules to allow Node Bootstrap tokens to post CSRs in order for nodes to get long term certificate credentials
[bootstrap-token] configured RBAC rules to allow the csrapprover controller automatically approve CSRs from a Node Bootstrap Token
[bootstrap-token] configured RBAC rules to allow certificate rotation for all node client certificates in the cluster
[bootstrap-token] Creating the "cluster-info" ConfigMap in the "kube-public" namespace
[kubelet-finalize] Updating "/etc/kubernetes/kubelet.conf" to point to a rotatable kubelet client certificate and key
[addons] Applied essential addon: CoreDNS
[addons] Applied essential addon: kube-proxy
# 出现这个就说明安装成功了
Your Kubernetes control-plane has initialized successfully!
# 需要集群的话 还需要执行下面的命令
To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config
# 配置 pod 网络的命令
You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/

Then you can join any number of worker nodes by running the following on each as root:
# node节点加入集群需要执行如下指令
kubeadm join 192.168.2.110:6443 --token abcdef.0123456789abcdef \
    --discovery-token-ca-cert-hash sha256:1a76f9a88d7aa3a0def97ec7f57c2d4c5f342be4270e96f08a0140eddf0b4e1f 
```

> 注意：如果安装 kubernetes 版本和下载的镜像版本不统一则会出现 `timed out waiting for the condition` 错误。中途失败或是想修改配置可以使用 `kubeadm reset` 命令重置配置，再做初始化操作即可。



### 配置 kubectl

```bash
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config

# 修改文件所有者（非 ROOT 用户才需要执行）
chown $(id -u):$(id -g) $HOME/.kube/config
```

验证是否成功

```bash
kubectl get nodes

# 能够打印出节点信息即表示成功
root@docker:/usr/local/k8s# kubectl get nodes
NAME                STATUS     ROLES    AGE     VERSION
kubernetes-master   NotReady   master   4m17s   v1.19.4
```

至此主节点配置完成

如果`kubectl get node`卡住 可能是docker容器没起来，`docker ps`查看一下，或者`kubeadm rest`重置后再次安装。

### 重置

如果中途出现问题，推荐直接重置，具体如下：

```shell
#重置
$ kubeadm reset
# 将$HOME/.kube文件移除
$ rm -rf $HOME/.kube
#然后重新执行初始化（记得先把 kubeadm-init.log 文件删掉）
$ rm -rf kubeadm-init.log
$ kubeadm init --config=kubeadm.yml --upload-certs | tee kubeadm-init.log
```



### kubeadm init 的执行过程

- init：指定版本进行初始化操作
- preflight：初始化前的检查和下载所需要的 Docker 镜像文件
- kubelet-start：生成 kubelet 的配置文件 `var/lib/kubelet/config.yaml`，没有这个文件 kubelet 无法启动，所以初始化之前的 kubelet 实际上启动不会成功
- certificates：生成 Kubernetes 使用的证书，存放在 `/etc/kubernetes/pki` 目录中
- kubeconfig：生成 KubeConfig 文件，存放在 `/etc/kubernetes` 目录中，组件之间通信需要使用对应文件
- control-plane：使用 `/etc/kubernetes/manifest` 目录下的 YAML 文件，安装 Master 组件
- etcd：使用 `/etc/kubernetes/manifest/etcd.yaml` 安装 Etcd 服务
- wait-control-plane：等待 control-plan 部署的 Master 组件启动
- apiclient：检查 Master 组件服务状态。
- uploadconfig：更新配置
- kubelet：使用 configMap 配置 kubelet
- patchnode：更新 CNI 信息到 Node 上，通过注释的方式记录
- mark-control-plane：为当前节点打标签，打了角色 Master，和不可调度标签，这样默认就不会使用 Master 节点来运行 Pod
- bootstrap-token：生成 token 记录下来，后边使用 `kubeadm join` 往集群中添加节点时会用到
- addons：安装附加组件 CoreDNS 和 kube-proxy



## 5. 配置 Worker 节点

将 Worker 节点加入到集群中很简单，只需要在 Worker 节点上安装 kubeadm，kubectl，kubelet 三个工具，然后使用 `kubeadm join` 命令加入即可。

### 加入集群

```bash
# 这就是前面安装Master节点时日志中的提示
kubeadm join 192.168.2.110:6443 --token abcdef.0123456789abcdef \
    --discovery-token-ca-cert-hash sha256:1a76f9a88d7aa3a0def97ec7f57c2d4c5f342be4270e96f08a0140eddf0b4e1f 

# 安装成功将看到如下信息
root@docker:/usr/local/k8s# kubeadm join 192.168.2.110:6443 --token abcdef.0123456789abcdef \
>     --discovery-token-ca-cert-hash sha256:1a76f9a88d7aa3a0def97ec7f57c2d4c5f342be4270e96f08a0140eddf0b4e1f
[preflight] Running pre-flight checks
	[WARNING IsDockerSystemdCheck]: detected "cgroupfs" as the Docker cgroup driver. The recommended driver is "systemd". Please follow the guide at https://kubernetes.io/docs/setup/cri/
[preflight] Reading configuration from the cluster...
[preflight] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -oyaml'
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Starting the kubelet
[kubelet-start] Waiting for the kubelet to perform the TLS Bootstrap...

This node has joined the cluster:
* Certificate signing request was sent to apiserver and a response was received.
* The Kubelet was informed of the new secure connection details.

Run 'kubectl get nodes' on the control-plane to see this node join the cluster.
```

说明：

- token
  - 可以通过安装 master 时的日志查看 token 信息
  - 可以通过 `kubeadm token list` 命令打印出 token 信息
  - 如果 token 过期，可以使用 `kubeadm token create` 命令创建新的 token
- discovery-token-ca-cert-hash
  - 可以通过安装 master 时的日志查看 sha256 信息
  - 可以通过 `openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -hex | sed 's/^.* //'` 命令查看 sha256 信息

### 校验是否成功

在 master 节点执行如下命令：

```bash
kubectl get nodes

# 可以看到 两个node节点 成功加入集群
root@docker:/usr/local/k8s# kubectl get nodes
NAME                STATUS     ROLES    AGE   VERSION
kubernetes-master   NotReady   master   15m   v1.19.4
kubernetes-node1    NotReady   <none>   49s   v1.19.4
kubernetes-node2    NotReady   <none>   43s   v1.19.4
```

查看 pod 状态

```bash
$ kubectl get pod -n kube-system -o wide

root@kubernetes-master:/usr/local/docker/kubernetes# kubectl get pod -n kube-system -o wide
NAME                                        READY   STATUS    RESTARTS   AGE   IP              NODE                NOMINATED NODE   READINESS GATES
coredns-7ff77c879f-g8s2r                    0/1     Pending   0          19m   <none>          <none>              <none>           <none>
coredns-7ff77c879f-l6grx                    0/1     Pending   0          19m   <none>          <none>              <none>           <none>
etcd-kubernetes-master                      1/1     Running   0          19m   192.168.1.113   kubernetes-master   <none>           <none>
kube-apiserver-kubernetes-master            1/1     Running   0          19m   192.168.1.113   kubernetes-master   <none>           <none>
kube-controller-manager-kubernetes-master   1/1     Running   0          19m   192.168.1.113   kubernetes-master   <none>           <none>
kube-proxy-wlpfh                            1/1     Running   0          60s   192.168.1.115   kubernetes-slave2   <none>           <none>
kube-proxy-zckm2                            1/1     Running   0          19m   192.168.1.113   kubernetes-master   <none>           <none>
kube-proxy-zhc7s                            1/1     Running   0          55s   192.168.1.114   kubernetes-slave1   <none>           <none>
kube-scheduler-kubernetes-master            1/1     Running   0          19m   192.168.1.113   kubernetes-master   <none>           <none>
```

由此可以看出 coredns 尚未运行，此时我们还需要安装网络插件。

```shell
You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/
```



## 6. 配置网络插件

### 1. 概述

容器网络是容器选择连接到其他容器、主机和外部网络的机制。容器的 runtime 提供了各种网络模式，每种模式都会产生不同的体验。例如，Docker 默认情况下可以为容器配置以下网络：

- **none：** 将容器添加到一个容器专门的网络堆栈中，没有对外连接。
- **host：** 将容器添加到主机的网络堆栈中，没有隔离。
- **default bridge：** 默认网络模式。每个容器可以通过 IP 地址相互连接。
- **自定义网桥：** 用户定义的网桥，具有更多的灵活性、隔离性和其他便利功能。



**CNI**

CNI(Container Network Interface) 是一个标准的，通用的接口。在容器平台，Docker，Kubernetes，Mesos 容器网络解决方案 flannel，calico，weave。只要提供一个标准的接口，就能为同样满足该协议的所有容器平台提供网络功能，而 CNI 正是这样的一个标准接口协议。

**CNI 插件列表**

CNI 的初衷是创建一个框架，用于在配置或销毁容器时动态配置适当的网络配置和资源。插件负责为接口配置和管理 IP 地址，并且通常提供与 IP 管理、每个容器的 IP 分配、以及多主机连接相关的功能。容器运行时会调用网络插件，从而在容器启动时分配 IP 地址并配置网络，并在删除容器时再次调用它以清理这些资源。

运行时或协调器决定了容器应该加入哪个网络以及它需要调用哪个插件。然后，插件会将接口添加到容器网络命名空间中，作为一个 veth 对的一侧。接着，它会在主机上进行更改，包括将 veth 的其他部分连接到网桥。再之后，它会通过调用单独的 IPAM（IP地址管理）插件来分配 IP 地址并设置路由。

在 Kubernetes 中，kubelet 可以在适当的时间调用它找到的插件，为通过 kubelet 启动的 pod进行自动的网络配置。

Kubernetes 中可选的 CNI 插件如下：

- Flannel
- Calico
- Canal
- Weave

**什么是 Calico**

Calico 为容器和虚拟机提供了安全的网络连接解决方案，并经过了大规模生产验证（在公有云和跨数千个集群节点中），可与 Kubernetes，OpenShift，Docker，Mesos，DC / OS 和 OpenStack 集成。

Calico 还提供网络安全规则的动态实施。使用 Calico 的简单策略语言，您可以实现对容器，虚拟机工作负载和裸机主机端点之间通信的细粒度控制。

### 2. 安装网络插件 Calico

参考官方文档安装：`https://docs.projectcalico.org/getting-started/kubernetes/quickstart`

> 当前最新版本号为 3.16.5

**只需要安装在 master 节点即可。**

```shell
# 第一步
$ kubectl create -f https://docs.projectcalico.org/manifests/tigera-operator.yaml

# 输出如下
root@docker:/usr/local/k8s# kubectl create -f https://docs.projectcalico.org/manifests/tigera-operator.yaml
namespace/tigera-operator created
podsecuritypolicy.policy/tigera-operator created
serviceaccount/tigera-operator created
customresourcedefinition.apiextensions.k8s.io/bgpconfigurations.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/bgppeers.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/blockaffinities.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/clusterinformations.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/felixconfigurations.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/globalnetworkpolicies.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/globalnetworksets.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/hostendpoints.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/ipamblocks.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/ipamconfigs.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/ipamhandles.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/ippools.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/kubecontrollersconfigurations.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/networkpolicies.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/networksets.crd.projectcalico.org created
customresourcedefinition.apiextensions.k8s.io/installations.operator.tigera.io created
customresourcedefinition.apiextensions.k8s.io/tigerastatuses.operator.tigera.io created
clusterrole.rbac.authorization.k8s.io/tigera-operator created
clusterrolebinding.rbac.authorization.k8s.io/tigera-operator created
deployment.apps/tigera-operator created
```



```shell
# 第二步
$ kubectl create -f https://docs.projectcalico.org/manifests/custom-resources.yaml

root@docker:/usr/local/k8s# kubectl create -f https://docs.projectcalico.org/manifests/custom-resources.yaml
installation.operator.tigera.io/default created
```

查看 pods 状态，确认安装是否成功。

**必须等到所有 container 都变成 running 状态才算安装完成**

```shell
$ watch kubectl get pods --all-namespaces

# 输出如下
root@kubernetes-master:~# watch kubectl get pods --all-namespaces
Every 2.0s: kubectl get pods --all-namespaces                                                                                                                                                          kubernetes-master: Tue Nov 17 14:09:15 2020

NAMESPACE         NAME                                        READY   STATUS    RESTARTS   AGE
calico-system     calico-kube-controllers-85ff5cb957-qdb8t    0/1     Running   0          83s
calico-system     calico-node-cm8jh                           1/1     Running   0          84s
calico-system     calico-node-kgj8l                           0/1     Running   0          84s
calico-system     calico-node-ttxw6                           1/1     Running   0          84s
calico-system     calico-typha-5675bccdcd-kllkb               1/1     Running   0          84s
kube-system       coredns-6d56c8448f-64djh                    1/1     Running   0          2m36s
kube-system       coredns-6d56c8448f-qr4xv                    1/1     Running   0          2m36s
kube-system       etcd-kubernetes-master                      1/1     Running   0          2m51s
kube-system       kube-apiserver-kubernetes-master            1/1     Running   0          2m51s
kube-system       kube-controller-manager-kubernetes-master   1/1     Running   0          2m51s
kube-system       kube-proxy-5dmvp                            1/1     Running   0          2m34s
kube-system       kube-proxy-96x77                            1/1     Running   0          2m32s
kube-system       kube-proxy-gpnc5                            1/1     Running   0          2m36s
kube-system       kube-scheduler-kubernetes-master            1/1     Running   0          2m51s
tigera-operator   tigera-operator-5f668549f4-84kgn            1/1     Running   0          99s
```

至此基本环境已部署完毕。

> 如果 coredns 一直处于 Pending 状态 可能是因为前面忘记设置 podSubnet 了，暂时只能重置集群，没有找到好的解决办法。



## 7. Kubernetes上的第一个应用

### 1. 状态检查

检查集群中各节点、组件的运行情况。

检查组件运行状态

```shell
root@kubernetes-master:~# kubectl get cs
NAME                 STATUS      MESSAGE                                                                                       ERROR
scheduler            Unhealthy   Get "http://127.0.0.1:10251/healthz": dial tcp 127.0.0.1:10251: connect: connection refused   
controller-manager   Healthy     Get "http://127.0.0.1:10251/healthz": dial tcp 127.0.0.1:10251: connect: connection refused     etcd-0               Healthy     {"health":"true"}
```

> 出现这种情况，是 `/etc/kubernetes/manifests`下的 `kube-controller-manager.yaml` 和 `kube-scheduler.yaml` 设置的默认端口是0，在文件中注释掉就可以了。
>

```sh
vim /etc/kubernetes/manifests/kube-scheduler.yaml

apiVersion: v1
kind: Pod
metadata:
  creationTimestamp: null
  labels:
    component: kube-scheduler
    tier: control-plane
  name: kube-scheduler
  namespace: kube-system
spec:
  containers:
  - command:
    - kube-scheduler
    - --authentication-kubeconfig=/etc/kubernetes/scheduler.conf
    - --authorization-kubeconfig=/etc/kubernetes/scheduler.conf
    - --bind-address=127.0.0.1
    - --kubeconfig=/etc/kubernetes/scheduler.conf
    - --leader-elect=true
    # 注释掉这个
      # - --port=0
```

`kube-controller-manager.yaml`文件同理。

* `scheduler`  为调度服务，主要作用是将 POD 调度到 Node
* `controller-manager` 为自动化修复服务，主要作用是 Node 宕机后自动修复 Node 回到正常的工作状态
* `etcd-0`  则是熟悉的服务注册与发现

### 

检查 Master 状态

```shell
$ kubectl cluster-info
root@docker:/etc/kubernetes/manifests# kubectl cluster-info
Kubernetes master is running at https://192.168.2.110:6443
KubeDNS is running at https://192.168.2.110:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
```

检查 Nodes 状态

```shell
$ kubectl get nodes
root@docker:/etc/kubernetes/manifests# kubectl get nodes
NAME                STATUS   ROLES    AGE   VERSION
kubernetes-master   Ready    master   12m   v1.19.4
kubernetes-node1    Ready    <none>   12m   v1.19.4
kubernetes-node2    Ready    <none>   12m   v1.19.4
```



### 2. 运行第一个容器实例

**1）定义YAML文件并启动应用**

`nginx-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  # 创建2个nginx容器
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.18.0
        ports:
        - containerPort: 80
```

创建实例

```shell
$ kubectl apply -f nginx-deployment.yaml

root@kubernetes-master:/usr/local/docker/nginx# kubectl apply -f nginx-deployment.yaml
deployment.apps/nginx-deployment created
```



**2）查看全部 Pods 的状态**

```shell
$ kubectl get pods

# 输出如下，需要等待一小段时间，STATUS 为 Running 即为运行成功
root@docker:/usr/local/k8s/conf# kubectl get pods
NAME                                READY   STATUS              RESTARTS   AGE
nginx-deployment-66b6c48dd5-j6mnj   0/1     ContainerCreating   0          8s
nginx-deployment-66b6c48dd5-nq497   0/1     ContainerCreating   0          8s
```



**3. 查看已部署的服务**

```shell
$ kubectl get deployment

#输出如下
root@docker:/usr/local/k8s/conf# kubectl get deployment
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   2/2     2            2           27s
```



**4. 创建Service映射服务，让用户可以访问**

```shell
$ kubectl expose deployment nginx-deployment --port=80 --type=LoadBalancer
$ kubectl expose deployment hello-world --type=LoadBalancer --name=my-service
# 输出如下
root@docker:/usr/local/k8s/conf#  kubectl expose deployment nginx-deployment --port=80 --type=LoadBalancer
service/nginx-deployment exposed
```

也可以通过 配置文件方式创建

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: kube-node-service
  labels:
    name: kube-node-service
spec:
  type: LoadBalancer      
  ports:
  - port: 80         
    targetPort: 80  
    protocol: TCP
  selector:
    app: nginx         
```



**5. 查看已发布的服务**

```shell
$ kubectl get services

#输出如下
oot@docker:/usr/local/k8s/conf# kubectl get services
NAME               TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
kubernetes         ClusterIP      10.96.0.1      <none>        443/TCP        14m
# 由此可见，Nginx 服务已成功发布并将 80 端口映射为 31738
nginx-deployment   LoadBalancer   10.96.93.238   <pending>     80:31644/TCP   27s

```



**6. 查看服务详情**

```shell
#nginx-deployment 为服务名称
$ kubectl describe service nginx-deployment

#输出如下
root@docker:/usr/local/k8s/conf# kubectl describe service nginx-deployment
Name:                     nginx-deployment
Namespace:                default
Labels:                   app=nginx
Annotations:              <none>
Selector:                 app=nginx
Type:                     LoadBalancer
IP:                       10.96.93.238
Port:                     <unset>  80/TCP
TargetPort:               80/TCP
NodePort:                 <unset>  31644/TCP
Endpoints:                192.168.129.65:80,192.168.22.66:80
Session Affinity:         None
External Traffic Policy:  Cluster
Events:                   <none>
```

**7. 验证**

通过浏览器访问 Master 服务器

```shell
# 端口号为第五步中的端口号
http://192.168.2.110:31644/
```

此时 Kubernetes 会以负载均衡的方式访问部署的 Nginx 服务，能够正常看到 Nginx 的欢迎页即表示成功。容器实际部署在其它 Node 节点上，通过访问 Node 节点的 IP:Port 也是可以的。



### 3. 停止服务

**1. 删除 deployment**

```shell
$ kubectl delete deployment nginx-deployment

#输出如下
root@kubernetes-master:/usr/local/docker/nginx# kubectl delete deployment nginx-deployment
deployment.apps "nginx-deployment" deleted
```

**2. 删除 services**

deployment 中移除了 但是 services 中还存在，所以也需要一并删除。

```shell
$ kubectl delete service nginx-deployment

#输出如下
root@kubernetes-master:/usr/local/docker/nginx# kubectl delete service nginx-deployment
service "nginx-deployment" deleted
```



## 参考

`https://kubernetes.io/zh/docs/setup/production-environment/tools/kubeadm/install-kubeadm/`

`https://kubernetes.io/zh/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/`

`https://docs.projectcalico.org/getting-started/kubernetes/quickstart`

`https://www.funtl.com/zh/service-mesh-kubernetes`

`https://blog.csdn.net/cymm_liu/article/details/108458197`