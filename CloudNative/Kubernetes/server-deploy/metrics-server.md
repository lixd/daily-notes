# metrics-server 部署

部署其实很简单，官方仓库提供了 yaml 文件，apply 一下即可。

```Bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/download/v0.6.1/components.yaml
```

如果一切正常的话就搞定，但是不出意外的话肯定会出意外。



## 镜像问题

官方仓库提供的 yaml 使用的是 gcr 中的镜像，国内基本用不了，需要换成其他地方的，比如 dockerhub

```Bash
# 从官方仓库获取yaml文件
curl https://github.com/kubernetes-sigs/metrics-server/releases/download/v0.6.1/components.yaml -o metrics-server.yaml
# 替换镜像，这里是在 dockerhub 找了一个 0.6.1的镜像
sed -i 's/k8s.gcr.io\/metrics-server\/metrics-server:v0.6.1/dyrnq\/metrics-server:v0.6.1/' metrics-server.yaml
```



## 证书问题

解决镜像问题后，总算可以跑起来了，但是又出现了新的问题

```Bash
x509: cannot validate certificate for 192.168.10.11 because it doesn't contain any IP SANs" node="vpa"
```

具体见 Issue [#196](https://github.com/kubernetes-sigs/metrics-server/issues/196)

metrics-server 尝试访问 Kubelet API，但 TLS 连接失败，因为节点的 IP 不是证书 SAN 的一部分。

Why？

因为 Kubelet 证书是自签名的，所以它们不是由 Kubernetes CA 签名的。因此，节点的 InternalIP 不是证书 SAN 的一部分。

有两种方式解决这个问题：

* 1）跳过 TLS
  * 测试环境推荐使用，比较简单
* 2）为 kubelet 申请证书



### 跳过 TLS

在 metrics-server container 启动参数中增加 flag` --kubelet-insecure-tls` 以跳过 tls,yaml 修改如下：

```YAML
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server
  namespace: kube-system
spec:
  selector:
    matchLabels:
      k8s-app: metrics-server
  strategy:
    rollingUpdate:
      maxUnavailable: 0
  template:
    metadata:
      labels:
        k8s-app: metrics-server
    spec:
      containers:
      - args:
        - --cert-dir=/tmp
        - --secure-port=4443
        - --kubelet-insecure-tls # 增加该 flag
        - --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname
        - --kubelet-use-node-status-port
        - --metric-resolution=15s
        image: dyrnq/metrics-server:v0.6.1
```



### 申请证书

参考官方文档：[kubeadm-certs#kubelet-serving-certs](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/#kubelet-serving-certs)

#### 创建集群时统一处理

如果是用 kubeadm 部署的集群，那么可以在执行 kubeadm init 之前修改 kubeadm 配置文件，在 KubeletConfiguration 段落中增加 **`serverTLSBootstrap`**`: `**`true`** 配置以开启 kubelet tls。

```YAML
apiVersion: kubeadm.k8s.io/v1beta3
kind: ClusterConfiguration
---
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
serverTLSBootstrap: true
```

这样 kubeadm init bootstrap 的 master 和 worker 节点的 kubelet 都会自动申请 tls 证书。



#### 创建集群后挨个节点修改

如果集群已经存在了，那么只能挨个节点修改了。

在每个节点上，编辑 kubelet 配置文件 `/var/lib/kubelet/config.yaml`添加 `serverTLSBootstrap: true`字段并重新启动 kubelet`systemctl restart kubelet`。

> 不同方式安装的集群可能 kubelet 配置文件位置不一样，需要自行确定。



如果是 kubeadm 方式创建的集群还可以做以下操作：

在 `kube-system` 命名空间中查找并编辑`kubelet-config-{version}` 格式的 ConfigMap，同样增加 `serverTLSBootstrap: true` 配置。这样后续 join 的节点 kubeadm 就会自动处理了。

```bash
kubectl -n kube-system edit cm kubelet-config-1.23
```



#### 通过证书申请

执行上述步骤后，kubelet 在启动时会申请证书，还需要手动通过该申请才行。

查看申请请求

```Bash
[root@vpa ~]# kubectl get csr
NAME        AGE   SIGNERNAME                                    REQUESTOR         REQUESTEDDURATION   CONDITION
csr-gfbvf   2s    kubernetes.io/kubelet-serving                 system:node:vpa   <none>              Pending
csr-wwzq7   95m   kubernetes.io/kube-apiserver-client-kubelet   system:node:vpa
```

批准申请

```Bash
[root@vpa ~]# kubectl certificate approve csr-gfbvf
certificatesigningrequest.certificates.k8s.io/csr-gfbvf approved
[root@vpa ~]# kubectl get csr
NAME        AGE   SIGNERNAME                                    REQUESTOR         REQUESTEDDURATION   CONDITION
csr-gfbvf   20s   kubernetes.io/kubelet-serving                 system:node:vpa   <none>              Approved,Issued
csr-wwzq7   95m   kubernetes.io/kube-apiserver-client-kubelet   system:node:vpa   <none>              Approved,Issued
```

此时 metrics-server 就可以用 tls 方式启动了。



## 测试 metrics-server

metrics-server 启动后就可以使用 kubectl top 功能了

```Bash
[root@vpa ~]# kubectl top node
NAME   CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%   
vpa    258m         6%     3096Mi          39%
```