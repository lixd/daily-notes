

# 安装 kubeadm

## 概述

kubeadm 是 kubernetes 的集群安装工具，能够快速安装 kubernetes 集群。

## 配置软件源

```bash
# 安装系统工具
apt-get update && apt-get install -y apt-transport-https
# 安装 GPG 证书
curl https://mirrors.aliyun.com/kubernetes/apt/doc/apt-key.gpg | apt-key add -
# 写入软件源；注意：我们用系统代号为 bionic，但目前阿里云不支持，所以沿用 16.04 的 xenial
cat << EOF >/etc/apt/sources.list.d/kubernetes.list
> deb https://mirrors.aliyun.com/kubernetes/apt/ kubernetes-xenial main
> EOF
```

## 安装 kubeadm，kubelet，kubectl

```bash
# 安装
apt-get update  
apt-get install -y kubelet kubeadm kubectl

# 安装过程如下，注意 kubeadm 的版本号
root@ubuntu:~# apt-get install -y kubelet kubeadm kubectl
Reading package lists... Done
Building dependency tree       
Reading state information... Done
The following additional packages will be installed:
  conntrack cri-tools ebtables kubernetes-cni socat
Suggested packages:
  nftables
The following NEW packages will be installed:
  conntrack cri-tools ebtables kubeadm kubectl kubelet kubernetes-cni socat
0 upgraded, 8 newly installed, 0 to remove and 30 not upgraded.
Need to get 52.1 MB of archives.
After this operation, 275 MB of additional disk space will be used.
Get:1 https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial/main amd64 cri-tools amd64 1.13.0-00 [8,776 kB]
Get:2 http://mirrors.aliyun.com/ubuntu focal/main amd64 conntrack amd64 1:1.4.5-2 [30.3 kB]
Get:3 http://mirrors.aliyun.com/ubuntu focal/main amd64 ebtables amd64 2.0.11-3build1 [80.3 kB]
Get:4 http://mirrors.aliyun.com/ubuntu focal/main amd64 socat amd64 1.7.3.3-2 [323 kB]
Get:5 https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial/main amd64 kubernetes-cni amd64 0.7.5-00 [6,473 kB]
Get:6 https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial/main amd64 kubelet amd64 1.18.3-00 [19.4 MB]
Get:7 https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial/main amd64 kubectl amd64 1.18.3-00 [8,821 kB]
Get:8 https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial/main amd64 kubeadm amd64 1.18.3-00 [8,163 kB]
Fetched 52.1 MB in 6s (8,202 kB/s)                                                                                                     
Selecting previously unselected package conntrack.
(Reading database ... 71080 files and directories currently installed.)
Preparing to unpack .../0-conntrack_1%3a1.4.5-2_amd64.deb ...
Unpacking conntrack (1:1.4.5-2) ...
Selecting previously unselected package cri-tools.
Preparing to unpack .../1-cri-tools_1.13.0-00_amd64.deb ...
Unpacking cri-tools (1.13.0-00) ...
Selecting previously unselected package ebtables.
Preparing to unpack .../2-ebtables_2.0.11-3build1_amd64.deb ...
Unpacking ebtables (2.0.11-3build1) ...
Selecting previously unselected package kubernetes-cni.
Preparing to unpack .../3-kubernetes-cni_0.7.5-00_amd64.deb ...
Unpacking kubernetes-cni (0.7.5-00) ...
Selecting previously unselected package socat.
Preparing to unpack .../4-socat_1.7.3.3-2_amd64.deb ...
Unpacking socat (1.7.3.3-2) ...
Selecting previously unselected package kubelet.
Preparing to unpack .../5-kubelet_1.18.3-00_amd64.deb ...
Unpacking kubelet (1.18.3-00) ...
Selecting previously unselected package kubectl.
Preparing to unpack .../6-kubectl_1.18.3-00_amd64.deb ...
Unpacking kubectl (1.18.3-00) ...
Selecting previously unselected package kubeadm.
Preparing to unpack .../7-kubeadm_1.18.3-00_amd64.deb ...
Unpacking kubeadm (1.18.3-00) ...
Setting up conntrack (1:1.4.5-2) ...
Setting up kubectl (1.18.3-00) ...
Setting up ebtables (2.0.11-3build1) ...
Setting up socat (1.7.3.3-2) ...
Setting up cri-tools (1.13.0-00) ...
Setting up kubernetes-cni (0.7.5-00) ...
Setting up kubelet (1.18.3-00) ...
Created symlink /etc/systemd/system/multi-user.target.wants/kubelet.service → /lib/systemd/system/kubelet.service.
# 注意这里的版本号，我们使用的是 kubernetes v1.18.3
Setting up kubeadm (1.18.3-00) ...
Processing triggers for man-db (2.9.1-1) ...

```



```shell
# 设置 kubelet 自启动，并启动 kubelet
systemctl enable kubelet && systemctl start kubelet
```



- kubeadm：用于初始化 Kubernetes 集群
- kubectl：Kubernetes 的命令行工具，主要作用是部署和管理应用，查看各种资源，创建，删除和更新组件
- kubelet：主要负责启动 Pod 和容器

# 配置 kubeadm

## 概述

安装 kubernetes 主要是安装它的各个镜像，而 kubeadm 已经为我们集成好了运行 kubernetes 所需的基本镜像。但由于国内的网络原因，在搭建环境时，无法拉取到这些镜像。此时我们只需要修改为阿里云提供的镜像服务即可解决该问题。

## 创建并修改配置

```bash
# 导出配置文件
# 目录：`/usr/local/docker/kubernetes`
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
  # 修改为主节点 IP
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
kubernetesVersion: v1.18.3
networking:
  dnsDomain: cluster.local
  # 配置成 Calico 的默认网段
  podSubnet: "192.168.0.0/16"
  serviceSubnet: 10.96.0.0/12
scheduler: {}
---
# 开启 IPVS 模式
apiVersion: kubeproxy.config.k8s.io/v1alpha1
kind: KubeProxyConfiguration
featureGates:
  SupportIPVSProxyMode: true
mode: ipvs
```

## 查看和拉取镜像

```bash
# 查看所需镜像列表
kubeadm config images list --config kubeadm.yml

root@kubernetes-master:/usr/local/docker/kubernetes# kubeadm config [kubelet.config.k8s.io kubeproxy.config.k8s.io]
registry.aliyuncs.com/google_containers/kube-apiserver:v1.18.3
registry.aliyuncs.com/google_containers/kube-controller-manager:v1.18.3
registry.aliyuncs.com/google_containers/kube-scheduler:v1.18.3
registry.aliyuncs.com/google_containers/kube-proxy:v1.18.3
registry.aliyuncs.com/google_containers/pause:3.2
registry.aliyuncs.com/google_containers/etcd:3.4.3-0
registry.aliyuncs.com/google_containers/coredns:1.6.7

```



```shell
# 拉取镜像
kubeadm config images pull --config kubeadm.yml

root@kubernetes-master:/usr/local/docker/kubernetes# kubeadm config images pull --config kubeadm.yml
[kubelet.config.k8s.io kubeproxy.config.k8s.io]
[config/images] Pulled registry.aliyuncs.com/google_containers/kube-apiserver:v1.18.3
[config/images] Pulled registry.aliyuncs.com/google_containers/kube-controller-manager:v1.18.3
[config/images] Pulled registry.aliyuncs.com/google_containers/kube-scheduler:v1.18.3
[config/images] Pulled registry.aliyuncs.com/google_containers/kube-proxy:v1.18.3
[config/images] Pulled registry.aliyuncs.com/google_containers/pause:3.2
[config/images] Pulled registry.aliyuncs.com/google_containers/etcd:3.4.3-0
[config/images] Pulled registry.aliyuncs.com/google_containers/coredns:1.6.7
```

