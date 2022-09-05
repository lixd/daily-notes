## 基于声明式API管理集群

集群管理不仅仅包括集群搭建,还有更多功能需要支持

* 集群扩缩容
* 节点健康检查和自动修复
* Kubernetes 升级
* 操作系统升级


云原生场景中集群应该按照我们的期望的状态运行，这意味着我们应该将集群管理建立在声明式 API 的基础之上。



### Cluster API

![](D:\Home\17x\Projects\daily-notes\CloudNative\camp\09-生产化集群管理\assets\management-cluster.svg)

> 图片来源：https://cluster-api.sigs.k8s.io/user/concepts.html



* Cluster API
  * 生命需要创建或删除一个集群
* Bootstrap provider
  * 生成集群证书
  * 初始化控制面
  * 加入其他控制面和节点
* Intrastructure provider
  * 基础架构，比如安装集群时需要节点，节点由谁提供
* Control Plane provider
  * 用什么方式去安装控制面



### 参与角色

* 管理集群
  * 管理 workload 集群的集群，用来存放 Cluster API 对象的地方
* Workload 集群
  * 真正开放给用户用来运行应用的集群，由管理集群管理
* Infrastructure provider
  * 提供不同云的基础架构管理，包括计算节点，网络等。目前流行的公有云多与 Cluster API 集成了。
* Bootstrap provider
  * 证书生成
  * 控制面组 件安装和初始化，监控节点的创建
  * 将主节点和计算节点加入集群
* Control plane
  * Kubernetes 控制平面组件



### 涉及模型

* Machine
  * 计算节点，用来描述可以运行 Kubernetes 组件的机器对象(注意与 Kubernetes Node )的差异
  * 一个新 Machine 被创建以后，对应的控制器会创建一个计算节点，安装好操作系统并更新 Machine 的状态
  * 当一个 Machine 被删除后，对应的控制器会删除掉该节点并回收计算资源。
  * 当 Machine 属性被更新以后(比如 Kubernetes 版本更新)，对应的控制器会删除旧节点并创建新节点
* Machine Immutability (In-place Upgrade VS. Replace)
  * 不可变基础架构
* MachineDeployment
  * 提供针对 Machine 和 MachineSet 的声明式更新，类似于 Kubernetes Deployment
* MachineSet
  * 维护一个稳定的机器集合,类似 Kubernetes ReplicaSet
* MachineHealthCheck
  * 定义节点应该被标记为不可用的条件



MachineDeployment 、MachineSet、Machine 三者关系类似于 Deployment、ReplicaSet、Pod 的关系。

> 用户创建 MachineDeployment ，MachineDeployment  Controller 创建 MachineSet，MachineSet Controller 创建 Machine ，Machine Controller 调用 Infrastructure provider API 接口创建真正的机器。



### 用 Cluster API 管理集群

Create host cluster

使用 kind 创建一个集群，作为我们的管理集群

```sh
env KIND_EXPERIMENTAL_DOCKER_NETWORK=bridge 
kind create cluster --config ./kind.conf
```

kind.conf 内容如下：

```conf
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraMounts:
    - hostPath: /var/run/docker.sock
      containerPath: /var/run/docker.sock
```



Generate cluster specs

使用 clusterctl 进行初始化，指定 infrastructure provider 为 docker

```bash
clusterctl init --infrastructure docker
```

然后生成集群 metadata 文件：

```bash
clusterctl generate cluster capi-quickstart --flavor development \
  --kubernetes-version v1.22.2 \
  --control-plane-machine-count=1 \
  --worker-machine-count=1 \
  > capi-quickstart.yaml
```

最终整个集群描述信息会存到 capi-quickstart.yaml 文件中。可以手动修改该文件的 KubeadmConfigTemplate 部分，添加 clusterConfiguration 字段以配置镜像仓库，避免拉取不到镜像。

```yaml
---
apiVersion: bootstrap.cluster.x-k8s.io/v1beta1
kind: KubeadmConfigTemplate
metadata:
  name: capi-quickstart-md-0
  namespace: default
spec:
  template:
    spec:
      joinConfiguration:
        nodeRegistration:
          kubeletExtraArgs:
            cgroup-driver: cgroupfs
            eviction-hard: nodefs.available<0%,nodefs.inodesFree<0%,imagefs.available<0%
       clusterConfiguration:
         imageRepository: registry.aliyuncs.com/google_containers
```

最后再管理集群中使用 kubectl apply  创建集群。

```sh
kubectl apply -f capi-quickstart.yaml
```

对象 apply 之后，相关的 provider 和 Controller 就会开始工作了，等一会我们的集群就会被创建出来。

Check

可以在管理集群查询相关对象状态

```sh
kubectl get cluster
kubectl get machineset
```

由于是用 docker 作为 provider 因此，会创建一些 container 来代表具体对象。

```sh
docker ps|grep control-plane
b107b11771e5        kindest/haproxy:v20210715-a6da3463   "haproxy -sf 7 -W -d…"   4 minutes ago       Up 4 minutes        40295/tcp, 0.0.0.0:40295->6443/tcp     capi-quickstart-lb
```

启动完成后可以通过 kubectl 命令拿到 worker 集群的 kubeconfig

```bash
# 记录到文件中
clusterctl get kubeconfig capi-quickstart > capi-quickstart.kubeconfig
# 指定 kubeconfig 以及 server 来查询 worker 集群中的数据
kubectl get no --kubeconfig capi-quickstart.kubeconfig --server https://127.0.0.1:40295
NAME                                    STATUS     ROLES                  AGE     VERSION
capi-quickstart-control-plane-6slwd     NotReady   control-plane,master   4m19s   v1.22.0
capi-quickstart-md-0-765cf784c5-6klwr   NotReady   <none>                 3m41s   v1.22.0
```



其他操作

比如要扩容集群的话，只需要对 machinedeployment 进行 scale 操作即可

> 就像 scale deployment 一样。

```bash
kubectl scale machinedeployment capi-quickstart-md-0 --replicas=2
```





### 日常运营中的节点问题归类

可自动修复的问题

* 计算节点 down
  * Ping不通
  * TCP probe 失败
  * 节点上的所有应用都不可达

不可自动修复的问题

* 文件系统坏
* 磁盘阵列故障
* 网盘挂载问题
* 其他硬件故障
* Kernel 出错，core dumps

其他问题

* 软件 Bug
* 进程锁死，或者 memory / CPU 竞争问题
* Kubernetes 组件出问题
  * Kubelet / Kube-proxy / Docker/ Salt





### 故障监测和自动恢复

* 当创建 Compute 节点时，允许定义 Liveness Probe
  * 当 livenessProbe 失败时，ComputeNode 的 ProbePassed 设置为 false

* 在 Prometheus 中，已经有 Node level 的 alert，抓取 Prometheus 中的 alert

* 设定自动恢复规则
  * 大多数情况下，重启大法好( 人人都是Restart operator)。
  * 如果重启不行就重装。(reprovision)
  * 重装不行就重修。( breakfix)



