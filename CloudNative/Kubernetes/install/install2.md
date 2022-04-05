# Kubeadm 安装 k8s 集群

> [实战：kubeadm方式搭建k8s集群(containerd)-20211102](https://mdnice.com/writing/3e3ec25bfa464049ae173c31a6d98cf8)

> 本文将使用 VMware 以及 CentOS 7 搭建 K8s 集群。



**1、硬件环境**

3台虚机 2c2g,20g。(nat模式，可访问外网)

|    角色    |   主机名   |      ip       |
| :--------: | :--------: | :-----------: |
| master节点 | k8s-master | 192.168.2.122 |
|  node节点  | k8s-node1  | 192.168.2.123 |
|  node节点  | k8s-node2  | 192.168.2.124 |

**2、软件环境**

|    软件    |               版本               |
| :--------: | :------------------------------: |
|  操作系统  | centos7.9(其他centos7.x版本也行) |
| containerd |             v1.5.11              |
| kubernetes |             v1.23.5              |



## 1. 环境准备

首先需要3台Linux主机，至少两核CPU以及2G内存。

> 一般是安装好一台之后，克隆出另外两台。



**确保每个节点上主机名、 MAC 地址和 product_uuid 的唯一性 **

* MAC 地址
  * ip link 或 ifconfig -a 来获取网络接口的 MAC 地址
  * 在 VMware 设置--> 网络 --> 高级界面为虚拟机随机生成mac地址 

* hostnamectl status 查看主机名
  * hostnamectl set-hostname xxx 修改主机名
* sudo cat /sys/class/dmi/id/product_uuid 查看 product_uuid 



**关闭交换空间**

> 不关则会出现以下错误：failed to run Kubelet: running with swap on is not supported, please disable swap! 

```shell
sudo swapoff -a
sed -ri 's/.*swap.*/#&/' /etc/fstab
```



关闭防火墙

```shell
systemctl stop firewalld && systemctl disable  firewalld
systemctl stop NetworkManager && systemctl disable  NetworkManager
```





**[允许 iptables 检查桥接流量](https://kubernetes.io/zh/docs/setup/production-environment/tools/kubeadm/install-kubeadm/#%E5%85%81%E8%AE%B8-iptables-%E6%A3%80%E6%9F%A5%E6%A1%A5%E6%8E%A5%E6%B5%81%E9%87%8F)**

确保 `br_netfilter` 模块被加载。

```bash
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
br_netfilter
EOF

cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
sudo sysctl --system
```



### 配置dns解析

```bash
cat >> /etc/hosts << EOF
192.168.2.122 k8s-master
192.168.2.123 k8s-node1
192.168.2.124 k8s-node2
EOF
```





### 安装 kubeadm、kubelet 和 kubectl

```shell
# 将 SELinux 设置为 permissive 模式（相当于将其禁用）， 这是允许容器访问主机文件系统所必需的
sudo setenforce 0
sudo sed -i 's/^SELINUX=enforcing$/SELINUX=permissive/' /etc/selinux/config
```

然后配置 yum 源：

```bash
cat <<EOF | sudo tee /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://packages.cloud.google.com/yum/repos/kubernetes-el7-\$basearch
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
exclude=kubelet kubeadm kubectl
EOF
```

官网提供的 google 源一般用不了，建议换成阿里的源

```shell
cat <<EOF | sudo tee /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=http://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=http://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg
        http://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
exclude=kubelet kubeadm kubectl
EOF
```

然后执行安装

```bash
# --disableexcludes 禁掉除了kubernetes之外的别的仓库
sudo yum install -y kubelet kubeadm kubectl --disableexcludes=kubernetes
```

ps: 由于官网未开放同步方式, 替换成阿里源后可能会有索引 gpg 检查失败的情况, 这时请带上`--nogpgcheck`选项安装：

```shell
sudo yum install -y kubelet kubeadm kubectl --disableexcludes=kubernetes --nogpgcheck
```



输出如下：

```bash
...

Dependencies Resolved

================================================================================
 Package                    Arch       Version             Repository      Size
================================================================================
Installing:
 kubeadm                    x86_64     1.23.5-0            kubernetes     9.0 M
 kubectl                    x86_64     1.23.5-0            kubernetes     9.5 M
 kubelet                    x86_64     1.23.5-0            kubernetes      21 M
Installing for dependencies:
 conntrack-tools            x86_64     1.4.4-7.el7         base           187 k
 cri-tools                  x86_64     1.23.0-0            kubernetes     7.1 M
 kubernetes-cni             x86_64     0.8.7-0             kubernetes      19 M
 libnetfilter_cthelper      x86_64     1.0.0-11.el7        base            18 k
 libnetfilter_cttimeout     x86_64     1.0.0-7.el7         base            18 k
 libnetfilter_queue         x86_64     1.0.2-2.el7_2       base            23 k
 socat                      x86_64     1.7.3.2-2.el7       base           290 k

Transaction Summary
================================================================================
Install  3 Packages (+7 Dependent packages)
...
```

说明我们安装的是 1.23.5 版本。

kubelet 设置自启

```shell
sudo systemctl enable --now kubelet
```



### 使用 kubeadm 创建集群



```bash
# 导出配置文件 这里暂时放到 /usr/local/k8s目录下
kubeadm config print init-defaults --kubeconfig ClusterConfiguration > kubeadm.yml
```

然后对配置文件做以下修改：

* **nodeRegistration.criSocket**：默认还是用的docker，由于我们用的是 containerd，所以需要改一下
* **nodeRegistration.name**：节点名，改成主节点的主机名（即 k8s-master） 

* **localAPIEndpoint.advertiseAddress**：这个就是apiserver的地址，需要修改为主节点的IP
* **imageRepository**：镜像仓库，默认是国外的地址，需要替换成国内源
* **kubernetesVersion**：调整版本号和之前安装的 kubeadm 一致
* **networking.podSubnet**：新增子网信息，固定为 192.168.0.0/16，主要方便后续安装 calico

具体如下：

```bash
apiVersion: kubeadm.k8s.io/v1beta3
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
  # 修改为主节点IP地址
  advertiseAddress: 192.168.2.121
  bindPort: 6443
nodeRegistration:
  # cri 改成 containerd
  criSocket: /run/containerd/containerd.sock
  imagePullPolicy: IfNotPresent
  # 节点名改成主节点的主机名
  name: k8s-master
  taints: null
---
apiServer:
  timeoutForControlPlane: 4m0s
apiVersion: kubeadm.k8s.io/v1beta3
certificatesDir: /etc/kubernetes/pki
clusterName: kubernetes
controllerManager: {}
dns: {}
etcd:
  local:
    dataDir: /var/lib/etcd
# 换成国内的源
imageRepository: registry.aliyuncs.com/google_containers
kind: ClusterConfiguration
# 修改版本号 必须对应
kubernetesVersion: 1.23.5
networking:
  # 新增该配置 固定为 192.168.0.0/16，用于后续 Calico网络插件
  podSubnet: 192.168.0.0/16
  dnsDomain: cluster.local
  serviceSubnet: 10.96.0.0/12
scheduler: {}
```



```bash
# 查看所需镜像列表
kubeadm config images list --config kubeadm.yml

# 可以看到，几个组件都在这里，
registry.aliyuncs.com/google_containers/kube-apiserver:v1.23.5
registry.aliyuncs.com/google_containers/kube-controller-manager:v1.23.5
registry.aliyuncs.com/google_containers/kube-scheduler:v1.23.5
registry.aliyuncs.com/google_containers/kube-proxy:v1.23.5
registry.aliyuncs.com/google_containers/pause:3.6
registry.aliyuncs.com/google_containers/etcd:3.5.1-0
registry.aliyuncs.com/google_containers/coredns:v1.8.6
```



```shell
# 拉取镜像
kubeadm config images pull --config kubeadm.yml

# 输出如下
[config/images] Pulled registry.aliyuncs.com/google_containers/kube-apiserver:v1.23.5
[config/images] Pulled registry.aliyuncs.com/google_containers/kube-controller-manager:v1.23.5
[config/images] Pulled registry.aliyuncs.com/google_containers/kube-scheduler:v1.23.5
[config/images] Pulled registry.aliyuncs.com/google_containers/kube-proxy:v1.23.5
[config/images] Pulled registry.aliyuncs.com/google_containers/pause:3.6
[config/images] Pulled registry.aliyuncs.com/google_containers/etcd:3.5.1-0
[config/images] Pulled registry.aliyuncs.com/google_containers/coredns:v1.8.6
```



镜像拉取下来后就可以开始安装了

执行以下命令初始化主节点，该命令指定了初始化时需要使用的配置文件，其中添加 `--experimental-upload-certs` 参数可以在后续执行加入节点时自动分发证书文件。追加的 `tee kubeadm-init.log` 用以输出日志。

```bash
# /usr/local/k8s 目录下执行
# --config=kubeadm.yml 指定配置文件
# --experimental-upload-certs 更新证书
# tee kubeadm-init.log 将日志保存到文件
kubeadm init --config=kubeadm.yml --upload-certs | tee kubeadm-init.log
```





输出如下：

```bash
# 出现这个就说明安装成功了
Your Kubernetes control-plane has initialized successfully!
# 执行下面的命令配置kubectl
To start using your cluster, you need to run the following as a regular user:

  mkdir -p $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config

Alternatively, if you are the root user, you can run:

  export KUBECONFIG=/etc/kubernetes/admin.conf
# 配置 pod 网络的命令
You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/
# node节点加入集群需要执行如下指令
Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 192.168.2.122:6443 --token abcdef.0123456789abcdef \
	--discovery-token-ca-cert-hash sha256:2256a84d98fa36bece8ec78d3e140a6c8ddb9c9c736aa373df91bcd29fd6e8bd 

```



```bash
[root@localhost k8s]# kubectl get nodes
NAME         STATUS     ROLES                  AGE    VERSION
k8s-master   NotReady   control-plane,master   2m1s   v1.23.5
```





## Node节点

将 node节点加入到集群中很简单，只需要在 node 节点上安装 kubeadm，kubectl，kubelet 三个工具，然后使用 `kubeadm join` 命令加入即可。

```bash
# 这就是前面安装Master节点时日志中的提示
kubeadm join 192.168.2.122:6443 --token abcdef.0123456789abcdef \
	--discovery-token-ca-cert-hash sha256:2256a84d98fa36bece8ec78d3e140a6c8ddb9c9c736aa373df91bcd29fd6e8bd 
```

输出如下：

```bash
This node has joined the cluster:
* Certificate signing request was sent to apiserver and a response was received.
* The Kubelet was informed of the new secure connection details.

Run 'kubectl get nodes' on the control-plane to see this node join the cluster.
```



在 master 节点查询

```bash
[root@localhost k8s]# kubectl get nodes
NAME         STATUS     ROLES                  AGE    VERSION
k8s-master   NotReady   control-plane,master   14m    v1.23.5
k8s-node1    NotReady   <none>                 107s   v1.23.5
```



然后把node2也加进来

```bash
[root@localhost lib]# kubectl get nodes
NAME         STATUS     ROLES                  AGE    VERSION
k8s-master   NotReady   control-plane,master   20m    v1.23.5
k8s-node1    NotReady   <none>                 7m5s   v1.23.5
k8s-node2    NotReady   <none>                 6s     v1.23.5
```



到此基本安装完成，后续就是部署 calico 了。



## 踩坑

1）containerd 没有配置镜像导致无法拉取 mainfest 文件，然后无法启动容器。

后续配置上即行了。



2）kubelet 报错找不到节点

```shell
Failed while requesting a signed certificate from the master: cannot create certificate signing request: Unauthorized
"Error getting node" err="node \"k8s-master\" not found"
```

因为第一次安装的时候生成了证书，但是第一次安装失败了，第二次安装kubeadm又生成了新证书，导致二者证书对不上，于是出现了 Unauthorized的错误，然后没有把node信息注册到api server，然后就出现了第二个错误，node not found。



每次安装失败后，尝试重新安装需要做以下几个步骤：

* 1）停止 kubelet
* 2）移除 /etc/kubenets 目录
* 3）移除 /var/lib/kubelet 目录





## [Calico](https://projectcalico.docs.tigera.io/getting-started/kubernetes/quickstart)

> 当前版本为 3.22

第一步

```bash
kubectl create -f https://projectcalico.docs.tigera.io/manifests/tigera-operator.yaml
```

第二步

```bash
kubectl create -f https://projectcalico.docs.tigera.io/manifests/custom-resources.yaml
```



[self-managed-onprem](https://projectcalico.docs.tigera.io/getting-started/kubernetes/self-managed-onprem/onpremises)

```bash
curl https://projectcalico.docs.tigera.io/manifests/calico.yaml -O
kubectl apply -f calico.yaml
```

