# Kubeadm 安装 k8s 集群

> [实战：kubeadm方式搭建k8s集群(containerd)-20211102](https://mdnice.com/writing/3e3ec25bfa464049ae173c31a6d98cf8)

> 本文将使用 VMware 以及 CentOS 7 搭建 K8s 集群。



## 1. 环境

### 硬件环境

3台虚机 2c4g,20g。(nat模式，可访问外网)

> 测试发现最低配置要求的 2G 内存不够用，部署 calico 之后直接炸了，建议分配 4g。

|    角色    |   主机名   |      ip       |
| :--------: | :--------: | :-----------: |
| master节点 | k8s-master | 192.168.2.122 |
|  node节点  | k8s-node1  | 192.168.2.123 |
|  node节点  | k8s-node2  | 192.168.2.124 |

**2、软件环境**

|    软件    |           版本            |
| :--------: | :-----------------------: |
|  操作系统  | centos7.9(其他版本未测试) |
| containerd |          v1.5.11          |
| kubernetes |          v1.23.5          |



### 环境调整

对所有节点做以下检测。

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



**关闭防火墙**

```shell
systemctl stop firewalld && systemctl disable  firewalld
systemctl stop NetworkManager && systemctl disable  NetworkManager
```



**禁用SELinux**

将 SELinux 设置为 permissive 模式（相当于将其禁用）， 这是允许容器访问主机文件系统所必需的

```bash
sudo setenforce 0
sudo sed -i 's/^SELINUX=enforcing$/SELINUX=permissive/' /etc/selinux/config
```



**允许 iptables 检查桥接流量**

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



**配置dns解析**

> 这里需要根据自己环境的节点hostname和ip来调整

```bash
# hostnamectl set-hostname xxx 修改 hostname
cat >> /etc/hosts << EOF
192.168.2.122 k8s-master
192.168.2.123 k8s-node1
192.168.2.124 k8s-node2
EOF
```



```bash
cat >> /etc/hosts << EOF
192.168.10.170 k8s-master
192.168.10.96 k8s-node1
192.168.10.51 k8s-node2
EOF
```





## 2. 安装

### 安装 kubeadm、kubelet 和 kubectl

**配置 yum 源**

官方源如下：

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



### 初始化主节点

首先导出 kubeadm 配置文件并修改

```bash
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
vim kubeadm.yml
```



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



有时候发现一直拉不下来，也没有报错，就一直搁这阻塞着，可以通过以下命令测试

```bash
# syntax: ctr --debug images pull {image}
ctr --debug images pull registry.aliyuncs.com/google_containers/kube-apiserver:v1.23.5

# 或者 crictl --debug pull {image}
crictl --debug pull registry.aliyuncs.com/google_containers/kube-controller-manager:v1.23.5
```

发现直接用 ctr images pull 可以拉下来，crictl 就不行。

```bash
for i in `kubeadm config images list --config kubeadm.yml`;do crictl pull $i;done


for i in `kubeadm config images list --config kubeadm.yml`;do ctr --debug images pull $i;done

for i in `kubeadm config images list --config kubeadm.yml`;do ctr  images pull $i;done
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





### Node节点加入集群

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



此时由于没有安装网络插件，所有节点都还处于 NotReady 状态。



### 踩坑

1）kubelet 报错找不到节点

```shell
Failed while requesting a signed certificate from the master: cannot create certificate signing request: Unauthorized
"Error getting node" err="node \"k8s-master\" not found"
```

因为第一次安装的时候生成了证书，但是第一次安装失败了，第二次安装kubeadm又生成了新证书，导致二者证书对不上，于是出现了 Unauthorized的错误，然后没有把node信息注册到api server，然后就出现了第二个错误，node not found。



每次安装失败后，尝试重新安装需要做以下几个步骤：

* 1）停止 kubelet
* 2）移除 /etc/kubenets 目录
* 3）移除 /var/lib/kubelet 目录





## 3. 安装[Calico](https://projectcalico.docs.tigera.io/getting-started/kubernetes/quickstart)

> 当前版本为 3.22

具体参考：[self-managed-onprem](https://projectcalico.docs.tigera.io/getting-started/kubernetes/self-managed-onprem/onpremises)

```bash
# 第一步获取官方给的 yaml 文件
curl https://projectcalico.docs.tigera.io/manifests/calico.yaml -O
# 第二步直接 apply
kubectl apply -f calico.yaml
```



如果不错意外的话等一会 calico 就安装好了，可以通过以下命令查看：

```bash
$ kubectl get pods -n kube-system
NAME                                       READY   STATUS    RESTARTS      AGE
calico-kube-controllers-56fcbf9d6b-h2nlf   1/1     Running   0             25m
calico-node-92rz4                          1/1     Running   1 (15m ago)   25m
calico-node-hwbk9                          1/1     Running   0             25m
coredns-6d8c4cb4d-9nfwq                    1/1     Running   1 (15m ago)   33m
coredns-6d8c4cb4d-nx6v6                    1/1     Running   1 (15m ago)   33m
```

calico 开头的以及 coredns 都跑起来就算完成。





### 踩坑

1）镜像拉取特别慢，不知道是不是网络原因，pod 一直启动不起来，手动拉取镜像只会才跑起来的。

```bash
$ cat calico.yaml |grep docker.io|awk {'print $2'}
docker.io/calico/cni:v3.22.1
docker.io/calico/cni:v3.22.1
docker.io/calico/pod2daemon-flexvol:v3.22.1
docker.io/calico/node:v3.22.1
docker.io/calico/kube-controllers:v3.22.1

# 每个节点都执行一下手动拉取
for i in `cat calico.yaml |grep docker.io|awk {'print $2'}`;do crictl pull $i;done
crictl pull docker.io/calico/cni:v3.22.1
crictl pull docker.io/calico/pod2daemon-flexvol:v3.22.1
crictl pull docker.io/calico/node:v3.22.1
crictl pull docker.io/calico/kube-controllers:v3.22.1
```



2）calico-controller 报错

```bash
Get "https://10.96.0.1:443/apis/crd.projectcalico.org/v1/clusterinformations/default": context deadline exceeded
```

一般是 calico 无法识别网卡导致的，calico 默认识别的是 eth0，如果节点上的网卡是其他名字就识别不了，导致一直无法启动。



需要修改一下 calico.yaml,指定自己的网卡名字，具体如下：

首先打开 calico.yaml

然后直接搜索 CLUSTER_TYPE，找到下面这段

```yaml
- name: CLUSTER_TYPE
   value: "k8s,bgp"
```

然后添加一个和 CLUSTER_TYPE 同级的 IP_AUTODETECTION_METHOD 字段，具体如下：

```yaml
# value 就是指定你的网卡名字，我这里网卡是ens33，然后直接配置的ens.*
- name: IP_AUTODETECTION_METHOD  
  value: "interface=ens.*"
```



3）探针检测未通过

Calico-node 报错

```bash
Readiness probe failed: calico/node is not ready: BIRD is not ready: Error querying BIRD: unable to connect to BIRDv4 socket: dial unix /var/run/calico/bird.ctl: connect: connection refused
```

Calico controller 报错

```bash
Readiness probe failed: Failed to read status file /status/status.json: unexpected end of JSON input
```

都是探针检测没通过，暂时没有解决方案。



到此整个集群就算是跑起来了。

```bash
[root@k8s-master ~]# kubectl get pods -n kube-system
NAME                                       READY   STATUS    RESTARTS        AGE
calico-kube-controllers-56fcbf9d6b-h2nlf   1/1     Running   0               12m
calico-node-92rz4                          1/1     Running   1 (3m14s ago)   12m
calico-node-hwbk9                          1/1     Running   0               12m
coredns-6d8c4cb4d-9nfwq                    1/1     Running   1 (3m14s ago)   20m
coredns-6d8c4cb4d-nx6v6                    1/1     Running   1 (3m14s ago)   20m
etcd-k8s-master                            1/1     Running   1 (3m14s ago)   20m
kube-apiserver-k8s-master                  1/1     Running   1 (3m14s ago)   20m
kube-controller-manager-k8s-master         1/1     Running   3 (3m14s ago)   20m
kube-proxy-r579m                           1/1     Running   0               19m
kube-proxy-rgtpl                           1/1     Running   1 (3m14s ago)   20m
kube-scheduler-k8s-master                  1/1     Running   3 (3m14s ago)   20m
```



## 4. 检查集群状态

检查各组件运行状态

```bash
$ kubectl get cs
Warning: v1 ComponentStatus is deprecated in v1.19+
NAME                 STATUS    MESSAGE                         ERROR
controller-manager   Healthy   ok                              
scheduler            Healthy   ok                              
etcd-0               Healthy   {"health":"true","reason":""} 
```



查看集群信息

```bash
$ kubectl cluster-info
Kubernetes control plane is running at https://192.168.2.122:6443
CoreDNS is running at https://192.168.2.122:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
```

查看节点状态

```bash
$ kubectl get nodes
NAME         STATUS   ROLES                  AGE   VERSION
k8s-master   Ready    control-plane,master   44m   v1.23.5
k8s-node1    Ready    <none>                 43m   v1.23.5
```





## 5. 运行第一个容器实例

### 1. 启动

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





### 2. 查看全部 Pods 的状态

```shell
$ kubectl get pods

# 输出如下，需要等待一小段时间，STATUS 为 Running 即为运行成功
root@docker:/usr/local/k8s/conf# kubectl get pods
NAME                                READY   STATUS              RESTARTS   AGE
nginx-deployment-66b6c48dd5-j6mnj   0/1     ContainerCreating   0          8s
nginx-deployment-66b6c48dd5-nq497   0/1     ContainerCreating   0          8s
```



### 3. 查看已部署的服务

```shell
$ kubectl get deployment

#输出如下
root@docker:/usr/local/k8s/conf# kubectl get deployment
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   2/2     2            2           27s
```



### 4. 映射服务，让用户可以访问

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





### 5. 查看已发布的服务

```shell
$ kubectl get services

#输出如下
oot@docker:/usr/local/k8s/conf# kubectl get services
NAME               TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
kubernetes         ClusterIP      10.96.0.1      <none>        443/TCP        14m
# 由此可见，Nginx 服务已成功发布并将 80 端口映射为 31644
nginx-deployment   LoadBalancer   10.96.93.238   <pending>     80:31644/TCP   27s

```



### 6. 查看服务详情

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

### 7. 验证

通过浏览器访问 Master 服务器

```shell
# 端口号为第五步中的端口号
http://192.168.2.110:31644/
```

此时 Kubernetes 会以负载均衡的方式访问部署的 Nginx 服务，能够正常看到 Nginx 的欢迎页即表示成功。容器实际部署在其它 Node 节点上，通过访问 Node 节点的 IP:Port 也是可以的。



### 8. 删除 deployment

```shell
$ kubectl delete deployment nginx-deployment

#输出如下
root@kubernetes-master:/usr/local/docker/nginx# kubectl delete deployment nginx-deployment
deployment.apps "nginx-deployment" deleted
```

### 9. 删除 services

deployment 中移除了 但是 services 中还存在，所以也需要一并删除。

```shell
$ kubectl delete service nginx-svc

#输出如下
root@kubernetes-master:/usr/local/docker/nginx# kubectl delete service nginx-deployment
service "nginx-deployment" deleted
```



