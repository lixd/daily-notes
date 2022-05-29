# 使用 kubeadm 创建 k8s 集群(containerd)

>  k8s 官方文档：[使用 kubeadm 创建集群](https://kubernetes.io/zh/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/)



本文主要分为以下几个部分：

* 1）安装 containerd(所有节点)
* 2）安装 kubeadm、kubelet、kubectl(所有节点)
* 3）初始化 master 节点(k8s-1)
* 4）加入到集群(k8s-2,k8s-3)
* 5）部署 calico(k8s-1)
* 6）k8s 简单体验(k8s-1)



本次实验用到的机器如下：

| 主机名 | 系统版本   | 内核版本 | 配置 |      ip       |  角色  |
| :----: | ---------- | -------- | ---- | :-----------: | :----: |
| k8s-1  | CentOS 7.9 | 5.18     | 2C4G | 192.168.2.131 | master |
| k8s-2  | CentOS 7.9 | 5.18     | 2C4G | 192.168.2.132 | worker |
| k8s-3  | CentOS 7.9 | 5.18     | 2C4G | 192.168.2.133 | worker |

> Linux Kernel 版本需要 **4.x** 以上,否则 calico 可能无法正常启动。

软件版本

* containerd：1.5.11
  * libseccomp 2.5.1
* k8s：1.23.5
  * kubeadm
  * kubelet
  * kubectl
* calico：3.22 

> 不同版本可能存在不兼容情况，安装时请注意。



## 0. 安装 containerd

> 在**所有节点**上执行该步骤

> containerd 官方文档 [getting-started](https://github.com/containerd/containerd/blob/c76559a6a965c6f606c4f6d1a68f38610961dfb1/docs/getting-started.md)
>
> k8s 官方文档  [container-runtimes#containerd](https://kubernetes.io/zh/docs/setup/production-environment/container-runtimes/#containerd)

### 1. 安装

安装和配置的先决条件：

```shell
cat <<EOF | sudo tee /etc/modules-load.d/containerd.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

# 设置必需的 sysctl 参数，这些参数在重新启动后仍然存在。
cat <<EOF | sudo tee /etc/sysctl.d/99-kubernetes-cri.conf
net.bridge.bridge-nf-call-iptables  = 1
net.ipv4.ip_forward                 = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF

# 应用 sysctl 参数而无需重新启动
sudo sysctl --system
```



#### yum 方式

安装`yum-utils`包（提供`yum-config-manager` 实用程序）并设置**稳定**的存储库。

> 这部分参考如何安装 Docker：[在 CentOS 上安装 Docker 引擎](https://docs.docker.com/engine/install/centos/)，安装的时候只安装 containerd 即可。

```shell
sudo yum install -y yum-utils


sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo
# 这里可以替换成阿里的源 
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
   
yum install containerd -y
```



#### 二进制方式

这里我使用的系统是 `CentOS 7.9`，首先需要安装 `libseccomp` 依赖。

先查看系统有没有 libseccomp 软件包

```bash
[root@k8s-1 ~]# rpm -qa | grep libseccomp
libseccomp-2.3.1-4.el7.x86_64
```

centos 7.9 默认安装了 2.3 版本，不过太旧了需要升级

```bash
# 卸载原来的
[root@k8s-1 ~]# rpm -e libseccomp-2.3.1-4.el7.x86_64 --nodeps
#下载高于2.4以上的包
[root@k8s-1 ~]# wget http://rpmfind.net/linux/centos/8-stream/BaseOS/x86_64/os/Packages/libseccomp-2.5.1-1.el8.x86_64.rpm

#安装
[root@k8s-1 ~]# rpm -ivh libseccomp-2.5.1-1.el8.x86_64.rpm 
#查看当前版本
[root@k8s-1 ~]# rpm -qa | grep libseccomp
libseccomp-2.5.1-1.el8.x86_64
```

然后去 containerd 的 [release](https://github.com/containerd/containerd/releases) 页面下载对应的压缩包。

有两种压缩包

* [containerd-1.5.11-linux-amd64.tar.gz](https://github.com/containerd/containerd/releases/download/v1.5.11/containerd-1.5.11-linux-amd64.tar.gz)
  * 单独的 containerd
* [cri-containerd-cni-1.5.11-linux-amd64.tar.gz](https://github.com/containerd/containerd/releases/download/v1.5.11/cri-containerd-cni-1.5.11-linux-amd64.tar.gz)
  * containerd + runC

安装了 containerd 也要安装 runC，所以这里直接下载第二个打包好的就行。

```bash
wget https://github.com/containerd/containerd/releases/download/v1.5.11/cri-containerd-cni-1.5.11-linux-amd64.tar.gz
```

可以通过 tar 的 `-t` 选项直接看到压缩包中包含哪些文件：

```bash
[root@localhost ~]# tar -tf cri-containerd-cni-1.5.11-linux-amd64.tar.gz
etc/
etc/cni/
etc/cni/net.d/
etc/cni/net.d/10-containerd-net.conflist
etc/systemd/
etc/systemd/system/
etc/systemd/system/containerd.service
etc/crictl.yaml
usr/
usr/local/
usr/local/bin/
usr/local/bin/containerd-shim-runc-v2
usr/local/bin/containerd-shim
usr/local/bin/crictl
usr/local/bin/ctr
usr/local/bin/containerd-shim-runc-v1
usr/local/bin/containerd
usr/local/bin/ctd-decoder
usr/local/bin/critest
usr/local/bin/containerd-stress
usr/local/sbin/
usr/local/sbin/runc
...
```

可以看到里面有 containerd 和 runc ，而且目录也是设置好了的，直接解压到各个目录中去，甚至不用手动配置环境变量。

```bash
tar -C / -zxvf cri-containerd-cni-1.5.11-linux-amd64.tar.gz
```



### 2. 修改配置

生成默认 containerd 配置文件

```shell
sudo mkdir -p /etc/containerd
# 生成默认配置文件并写入到 config.toml 中
containerd config default | sudo tee /etc/containerd/config.toml
```



**使用 `systemd` cgroup 驱动程序**

> 注意：cri 使用的 cgroup 和 kubelet 使用的 cgroup 最好是一致的，如果使用 kubeadm 安装的那么 kubelet 也默认使用 systemd cgroup。

结合 `runc` 使用 `systemd` cgroup 驱动，在 `/etc/containerd/config.toml` 中设置

```toml
vim /etc/containerd/config.toml

# 把配置文件中的 SystemdCgroup 修改为 true
[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
  ...
  [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
    SystemdCgroup = true
```

```BASH
#一键替换
sed 's/SystemdCgroup = false/SystemdCgroup = true/g' /etc/containerd/config.toml
```



用国内源替换 containerd 默认的 sand_box 镜像，编辑 /etc/containerd/config.toml 

```shell
[plugins]
  .....
  [plugins."io.containerd.grpc.v1.cri"]
  	...
	sandbox_image = "registry.aliyuncs.com/google_containers/pause:3.5"
```

```bash
#一键替换
# 需要对路径中的/ 进行转移，替换成\/
sed 's/k8s.gcr.io\/pause/registry.aliyuncs.com\/google_containers\/pause/g' /etc/containerd/config.toml
```



**配置镜像加速器地址**

然后再为镜像仓库配置一个加速器，需要在 cri 配置块下面的 `registry` 配置块下面进行配置 `registry.mirrors`：（注意缩进）

> 比较麻烦，只能手动替换了

> 镜像来源：[ registry-mirrors](https://github.com/muzi502/registry-mirrors)

```bash
[plugins."io.containerd.grpc.v1.cri".registry]
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
  # 添加下面两个配置
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
      endpoint = ["https://ekxinbbh.mirror.aliyuncs.com"]
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."k8s.gcr.io"]
      endpoint = ["https://gcr.k8s.li"]
```



### 3. 测试

启动 containerd

```shell
systemctl daemon-reload
systemctl enable containerd --now
```

启动完成后就可以使用 containerd 的本地 CLI 工具 `ctr` 和了，比如查看版本：

```
ctr version
```



## 1. 环境准备

> 在**所有节点**上执行该步骤

**确保每个节点上主机名、 MAC 地址和 product_uuid 的唯一性 **

* MAC 地址
  * ip link 或 ifconfig -a 来获取网络接口的 MAC 地址
  * 在 VMware 设置--> 网络 --> 高级界面为虚拟机随机生成mac地址 

* hostnamectl status 查看主机名
  * hostnamectl set-hostname xxx 修改主机名
* sudo cat /sys/class/dmi/id/product_uuid 查看 product_uuid 



### 关闭交换空间

> 不关则会出现以下错误：failed to run Kubelet: running with swap on is not supported, please disable swap! 

```shell
sudo swapoff -a
sed -ri 's/.*swap.*/#&/' /etc/fstab
```



### 关闭防火墙

```shell
systemctl stop firewalld && systemctl disable  firewalld
systemctl stop NetworkManager && systemctl disable  NetworkManager
```



### 禁用SELinux

将 SELinux 设置为 permissive 模式（相当于将其禁用）， 这是允许容器访问主机文件系统所必需的

```bash
sudo setenforce 0
sudo sed -i 's/^SELINUX=enforcing$/SELINUX=permissive/' /etc/selinux/config
```



### 允许 iptables 检查桥接流量

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



### 配置 hosts

> 这里需要根据自己环境的节点hostname和ip来调整

```bash
# hostnamectl set-hostname xxx 修改 hostname
cat >> /etc/hosts << EOF
192.168.2.131 k8s-1
192.168.2.132 k8s-2
192.168.2.133 k8s-3
EOF
```



## 2. 安装

### 2.1 安装 kubeadm、kubelet 和 kubectl

> 在**所有节点**上执行该步骤

**配置 yum 源**

官网提供的 google 源一般用不了，这里直接换成阿里的源：

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
# 由于官网未开放同步方式, 替换成阿里源后可能会有索引 gpg 检查失败的情况, 这时请带上`--nogpgcheck`选项安装
# 指定安装 1.23.5 版本
sudo yum install -y kubelet-1.23.5 kubeadm-1.23.5 kubectl-1.23.5 --disableexcludes=kubernetes --nogpgcheck
```

kubelet 设置开机启动

```shell
sudo systemctl enable kubelet --now 
```



### 2.2 初始化主节点

> 在 **k8s-1** 上执行该步骤

#### 生成 kubeadm.yaml 文件

首先导出 kubeadm 配置文件并修改

```bash
kubeadm config print init-defaults --kubeconfig ClusterConfiguration > kubeadm.yml
```

然后对配置文件做以下修改：

* **nodeRegistration.criSocket**：默认还是用的docker，由于我们用的是 containerd，所以需要改一下
* **nodeRegistration.name**：节点名，改成主节点的主机名（即 k8s-1） 
* **localAPIEndpoint.advertiseAddress**：这个就是 apiserver 的地址，需要修改为主节点的 IP
* **imageRepository**：镜像仓库，默认是国外的地址，需要替换成国内源
* **kubernetesVersion**：调整版本号和之前安装的 kubeadm 一致
* **networking.podSubnet**：新增子网信息，固定为 192.168.0.0/16，主要方便后续安装 calico

具体如下：

```bash
vim kubeadm.yml
```

修改后 yaml 如下：

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
  advertiseAddress: 192.168.2.131
  bindPort: 6443
nodeRegistration:
  # 修改为 containerd
  criSocket: /run/containerd/containerd.sock
  imagePullPolicy: IfNotPresent
  # 节点名改成主节点的主机名
  name: k8s-1
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

kubernetesVersion: 1.24.1
networking:
  # 新增该配置 固定为 192.168.0.0/16，用于后续 Calico网络插件
  podSubnet: 192.168.0.0/16
  dnsDomain: cluster.local
  serviceSubnet: 10.96.0.0/12
scheduler: {}
```



#### 拉取镜像

查看所需镜像列表

```bash
kubeadm config images list --config kubeadm.yml
```

输出如下，包含了 k8s 需要的各个组件：

```bash
[root@k8s-1 ~]# kubeadm config images list --config kubeadm.yml
registry.aliyuncs.com/google_containers/kube-apiserver:v1.23.5
registry.aliyuncs.com/google_containers/kube-controller-manager:v1.23.5
registry.aliyuncs.com/google_containers/kube-scheduler:v1.23.5
registry.aliyuncs.com/google_containers/kube-proxy:v1.23.5
registry.aliyuncs.com/google_containers/pause:3.6
registry.aliyuncs.com/google_containers/etcd:3.5.1-0
registry.aliyuncs.com/google_containers/coredns:v1.8.6
```



先手动拉取镜像

```shell
kubeadm config images pull --config kubeadm.yml
```



有时候发现一直拉不下来，也没有报错，就一直搁这阻塞着，可以通过以下命令测试

```bash
# ctr --debug images pull {image}
ctr --debug images pull registry.aliyuncs.com/google_containers/kube-apiserver:v1.23.5

# 或者 crictl --debug pull {image}
crictl --debug pull registry.aliyuncs.com/google_containers/kube-controller-manager:v1.23.5
```

最后发现直接用 ctr images pull 可以拉下来，crictl 就不行，那就有 ctr 来拉取吧，脚本如下：

```bash
for i in `kubeadm config images list --config kubeadm.yml`;do ctr images pull $i;done
```



#### 执行初始化

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
# 执行下面的命令配置 kubeconfig
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
# node 节点加入集群需要执行如下指令
Then you can join any number of worker nodes by running the following on each as root:

kubeadm join 192.168.2.131:6443 --token abcdef.0123456789abcdef \
	--discovery-token-ca-cert-hash sha256:d53020265c2bae4f691258966b3d35f99a9cc2dc530514888d85e916b2844525 
```

按照提示配置 kubeconfig

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

查看以下 node 状态

```bash
[root@k8s-1 ~]# kubectl get node
NAME    STATUS     ROLES           AGE    VERSION
k8s-1   NotReady   control-plane   109s   v1.23.5
```

状态为 NotReady，因为此时还没有安装网络插件。

### 2.3 Node节点加入集群

> 在 k8s-2 和 k8s-3 上执行该步骤，将节点加入到集群中。

将 worker 加入到集群中很简单，只需要在对应节点上安装 kubeadm，kubectl，kubelet 三个工具，然后使用 `kubeadm join` 命令加入即可。

先在 k8s-2 节点执行

```bash
# 这就是前面安装Master节点时日志中的提示
kubeadm join 192.168.2.131:6443 --token abcdef.0123456789abcdef \
	--discovery-token-ca-cert-hash sha256:d53020265c2bae4f691258966b3d35f99a9cc2dc530514888d85e916b2844525 
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
[root@k8s-1 ~]# kubectl get nodes
NAME    STATUS     ROLES           AGE     VERSION
k8s-1   NotReady   control-plane   3m46s   v1.23.5
k8s-2   NotReady   <none>          20s     v1.23.5
```



然后把 k8s-3 也加进来

```bash
[root@k8s-1 ~]# kubectl get nodes
NAME    STATUS     ROLES           AGE     VERSION
k8s-1   NotReady   control-plane   3m46s   v1.23.5
k8s-2   NotReady   <none>          20s     v1.23.5
k8s-3   NotReady   <none>          17s     v1.23.5
```



到此基本安装完成，后续就是部署 calico 了。

此时由于没有安装网络插件，所有节点都还处于 NotReady 状态。



### 2.4 FAQ

1）kubelet 报错找不到节点

```shell
Failed while requesting a signed certificate from the master: cannot create certificate signing request: Unauthorized
"Error getting node" err="node \"k8s-master\" not found"
```

因为第一次安装的时候生成了证书，但是第一次安装失败了，第二次安装 kubeadm 又生成了新证书，导致二者证书对不上，于是出现了 Unauthorized 的错误，然后没有把 node 信息注册到 api server，然后就出现了第二个错误，node not found。

每次安装失败后，都需要执行 kubeadm reset 重置环境。





## 3. 安装[Calico](https://projectcalico.docs.tigera.io/getting-started/kubernetes/quickstart)

> 当前版本为 3.22

具体参考：[self-managed-onprem](https://projectcalico.docs.tigera.io/archive/v3.22/getting-started/kubernetes/self-managed-onprem/onpremises)



### 3.1 下载配置文件并拉取镜像

> **所有节点**都需要执行该步骤

第一步获取官方给的 yaml 文件

```bash
curl https://projectcalico.docs.tigera.io/archive/v3.22/manifests/calico.yaml -O
```



可能是网络问题，导致 calico 相关镜像一直拉取超时，最终 pod 无法启动，所以建议提前手动拉取镜像。

> 手动拉取也很慢，不过最终还是会成功，不过直接超时报错。

查看一共需要哪些镜像

```bash
[root@k8s-1 ~]# cat calico.yaml |grep docker.io|awk {'print $2'}
docker.io/calico/cni:v3.23.1
docker.io/calico/cni:v3.23.1
docker.io/calico/node:v3.23.1
docker.io/calico/kube-controllers:v3.23.1
```

手动拉取

```bash
for i in `cat calico.yaml |grep docker.io|awk {'print $2'}`;do ctr images pull $i;done
```

最后查看一下，确定是否拉取下来了

```bash
[root@k8s-2 ~]# ctr images ls
REF                                       TYPE                                                      DIGEST                                                                  SIZE      PLATFORMS                                          LABELS 
docker.io/calico/cni:v3.23.1              application/vnd.docker.distribution.manifest.list.v2+json sha256:26802bb7714fda18b93765e908f2d48b0230fd1c620789ba2502549afcde4338 105.4 MiB linux/amd64,linux/arm/v7,linux/arm64,linux/ppc64le -      
docker.io/calico/kube-controllers:v3.23.1 application/vnd.docker.distribution.manifest.list.v2+json sha256:e8b2af28f2c283a38b4d80436e2d2a25e70f2820d97d1a8684609d42c3973afb 53.8 MiB  linux/amd64,linux/arm/v7,linux/arm64,linux/ppc64le -      
docker.io/calico/node:v3.23.1             application/vnd.docker.distribution.manifest.list.v2+json sha256:d2c1613ef26c9ad43af40527691db1f3ad640291d5e4655ae27f1dd9222cc380 73.0 MiB  linux/amd64,linux/arm/v7,linux/arm64,linux/ppc64le -  
```



### 3.2 配置网卡名

> 在 **k8s-1** 上执行该步骤

calico 默认会找 **eth0 **网卡，如果当前机器网卡不是这个名字，可能会无法启动，需要处理一下	

```BASH
[root@k8s-1 ~]# ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: ens33: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
```

我这里是 ens33，不符合默认条件，需要修改 calico.yaml 手动指定一下。

```bash
vi calico.yaml
```

然后直接搜索 CLUSTER_TYPE，找到下面这段

```yaml
- name: CLUSTER_TYPE
   value: "k8s,bgp"
```

然后添加一个和 CLUSTER_TYPE 同级的 **IP_AUTODETECTION_METHOD **字段，具体如下：

```yaml
# value 就是指定你的网卡名字，我这里网卡是 ens33，然后直接配置的通配符 ens.*
- name: IP_AUTODETECTION_METHOD  
  value: "interface=ens.*"
```



### 3.3 部署

> 在 **k8s-1 **上执行该步骤

```BASH
kubectl apply -f calico.yaml
```

如果不错意外的话等一会 calico 就安装好了，可以通过以下命令查看：

```bash
[root@k8s-1 ~]# kubectl get pods -A
NAMESPACE     NAME                                       READY   STATUS    RESTARTS        AGE
kube-system   calico-kube-controllers-6c75955484-hhvh6   1/1     Running   0               7m37s
kube-system   calico-node-5xjqd                          1/1     Running   0               7m37s
kube-system   calico-node-6lnd6                          1/1     Running   0               7m37s
kube-system   calico-node-vkgfr                          1/1     Running   0               7m37s
kube-system   coredns-6d8c4cb4d-8gxsf                    1/1     Running   0               20m
kube-system   coredns-6d8c4cb4d-m596j                    1/1     Running   0               20m
kube-system   etcd-k8s-1                                 1/1     Running   0               20m
kube-system   kube-apiserver-k8s-1                       1/1     Running   0               20m
kube-system   kube-controller-manager-k8s-1              1/1     Running   1 (6m16s ago)   20m
kube-system   kube-proxy-5qj6j                           1/1     Running   0               20m
kube-system   kube-proxy-rhwb7                           1/1     Running   0               20m
kube-system   kube-proxy-xzswm                           1/1     Running   0               20m
kube-system   kube-scheduler-k8s-1                       1/1     Running   1 (5m56s ago)   20m
```

calico 开头的以及 coredns 都跑起来就算完成。



```bash
kubectl get pod ${POD_NAME} -n ${NAMESPACE} -o yaml | kubectl replace --force -f -
```

```bash
kubectl get pod calico-node-68fnx -n kube-system -o yaml | kubectl replace --force -f -
kubectl get pod calico-node-5d6zb -n kube-system -o yaml | kubectl replace --force -f -
kubectl get pod calico-kube-controllers-56cdb7c587-blc9l -n kube-system -o yaml | kubectl replace --force -f -
```



### 3.4 FAQ

calico controller 无法启动，报错信息如下：

```bash
client.go 272: Error getting cluster information config ClusterInformation="default" error=Get "https://10.96.0.1:443/apis/crd.projectcalico.org/v1/clusterinformations/default": context deadline exceeded
```

解决方案

查看对应 pod 日志发现有一个错误，提示内核版本过低，需要 4.x 版本才行。于是更新内核版本只会就可以了

> 写本文时安装的是 5.18 版本内核，所有应该不会出现这个问题。



## 4. 检查集群状态

> 在 **k8s-1** 上执行该步骤

检查各组件运行状态

```bash
[root@k8s-1 ~]# kubectl get cs
Warning: v1 ComponentStatus is deprecated in v1.19+
NAME                 STATUS    MESSAGE                         ERROR
controller-manager   Healthy   ok                              
scheduler            Healthy   ok                              
etcd-0               Healthy   {"health":"true","reason":""} 
```



查看集群信息

```bash
[root@k8s-1 ~]# kubectl cluster-info
Kubernetes control plane is running at https://192.168.2.131:6443
CoreDNS is running at https://192.168.2.131:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
```



查看节点状态

```bash
[root@k8s-1 ~]# kubectl get nodes
NAME    STATUS   ROLES                  AGE   VERSION
k8s-1   Ready    control-plane,master   22m   v1.23.5
k8s-2   Ready    <none>                 21m   v1.23.5
k8s-3   Ready    <none>                 21m   v1.23.5
```



## 5. 运行第一个容器实例

> 在 **k8s-1** 上执行该步骤

### 5.1 创建Deployment

`nginx-deployment.yaml` 文件内容如下：

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
[root@k8s-1 ~]# kubectl apply -f nginx-deployment.yaml
deployment.apps/nginx-deployment created
```



查看 pod

```shell
$ kubectl get pods

# 输出如下，需要等待一小段时间，STATUS 为 Running 即为运行成功
[root@k8s-1 ~]# kubectl get pods
NAME                               READY   STATUS              RESTARTS   AGE
nginx-deployment-79fccc485-7czxp   0/1     ContainerCreating   0          37s
nginx-deployment-79fccc485-hp565   0/1     ContainerCreating   0          37s
```



查看 deployment

```shell
[root@k8s-1 ~]# kubectl get deployment
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   2/2     2            2           50s
```



### 5.2 创建 Service

> 创建一个 service

```bash
[root@k8s-1 ~]# kubectl expose deployment nginx-deployment --port=80 --type=LoadBalancer --name=nginx-svc
service/nginx-deployment exposed
```



也可以通过 配置文件方式创建，`nginx-vc.yaml` 文件内容如下：

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-svc
  labels:
    name: nginx-svc
spec:
  type: LoadBalancer      
  ports:
  - port: 80         
    targetPort: 80  
    protocol: TCP
  selector:
    app: nginx         
```

```bash
kubectl apply -f nginx-svc.yaml
```



查看 service

```shell
[root@k8s-1 ~]# kubectl get services
NAME               TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)        AGE
kubernetes         ClusterIP      10.96.0.1        <none>        443/TCP        25m
# 由此可见，Nginx 服务已成功发布并将 80 端口映射为 30842
nginx-deployment   LoadBalancer   10.102.137.171   <pending>     80:30842/TCP   40s

```

查看 service 详情

```shell
[root@k8s-1 ~]# kubectl describe service nginx-deployment
Name:                     nginx-deployment
Namespace:                default
Labels:                   app=nginx
Annotations:              <none>
Selector:                 app=nginx
Type:                     LoadBalancer
IP Family Policy:         SingleStack
IP Families:              IPv4
IP:                       10.102.137.171
IPs:                      10.102.137.171
Port:                     <unset>  80/TCP
TargetPort:               80/TCP
NodePort:                 <unset>  30842/TCP
Endpoints:                192.168.13.65:80,192.168.200.193:80
Session Affinity:         None
External Traffic Policy:  Cluster
Events:                   <none>

```

### 5.3 验证

通过浏览器访问任意服务器

```shell
# 端口号为第五步中的端口号
http://192.168.2.131:30842/
```

此时 Kubernetes 会以负载均衡的方式访问部署的 Nginx 服务，能够正常看到 Nginx 的欢迎页即表示成功。容器实际部署在其它 Node 节点上，通过访问 Node 节点的 IP:Port 也是可以的。



### 5.4 重置环境

删除 deployment

```shell
[root@k8s-1 ~]# kubectl delete deployment nginx-deployment
deployment.apps "nginx-deployment" deleted
```

删除 services

deployment 移除了 但是 services 中还存在，所以也需要一并删除。

```shell
[root@k8s-1 ~]# kubectl delete service nginx-svc
service "nginx-deployment" deleted
```



至此，实验完成，感谢阅读~
