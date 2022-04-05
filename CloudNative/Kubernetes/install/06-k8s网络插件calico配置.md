# 网络配置

> [calico官方文档](https://docs.projectcalico.org/getting-started/kubernetes/quickstart)

## 1. 概述

容器网络是容器选择连接到其他容器、主机和外部网络的机制。容器的 runtime 提供了各种网络模式，每种模式都会产生不同的体验。例如，Docker 默认情况下可以为容器配置以下网络：

- **none：** 将容器添加到一个容器专门的网络堆栈中，没有对外连接。
- **host：** 将容器添加到主机的网络堆栈中，没有隔离。
- **default bridge：** 默认网络模式。每个容器可以通过 IP 地址相互连接。
- **自定义网桥：** 用户定义的网桥，具有更多的灵活性、隔离性和其他便利功能。



## 2. CNI

CNI(Container Network Interface) 是一个标准的，通用的接口。在容器平台，Docker，Kubernetes，Mesos 容器网络解决方案 flannel，calico，weave。只要提供一个标准的接口，就能为同样满足该协议的所有容器平台提供网络功能，而 CNI 正是这样的一个标准接口协议。



## 3.  CNI 插件列表

CNI 的初衷是创建一个框架，用于在配置或销毁容器时动态配置适当的网络配置和资源。插件负责为接口配置和管理 IP 地址，并且通常提供与 IP 管理、每个容器的 IP 分配、以及多主机连接相关的功能。容器运行时会调用网络插件，从而在容器启动时分配 IP 地址并配置网络，并在删除容器时再次调用它以清理这些资源。

运行时或协调器决定了容器应该加入哪个网络以及它需要调用哪个插件。然后，插件会将接口添加到容器网络命名空间中，作为一个 veth 对的一侧。接着，它会在主机上进行更改，包括将 veth 的其他部分连接到网桥。再之后，它会通过调用单独的 IPAM（IP地址管理）插件来分配 IP 地址并设置路由。

在 Kubernetes 中，kubelet 可以在适当的时间调用它找到的插件，为通过 kubelet 启动的 pod进行自动的网络配置。

Kubernetes 中可选的 CNI 插件如下：

- Flannel
- Calico
- Canal
- Weave

## 4. 什么是 Calico

Calico 为容器和虚拟机提供了安全的网络连接解决方案，并经过了大规模生产验证（在公有云和跨数千个集群节点中），可与 Kubernetes，OpenShift，Docker，Mesos，DC / OS 和 OpenStack 集成。

Calico 还提供网络安全规则的动态实施。使用 Calico 的简单策略语言，您可以实现对容器，虚拟机工作负载和裸机主机端点之间通信的细粒度控制。

## 5. 安装网络插件 Calico

参考官方文档安装：`https://docs.projectcalico.org/getting-started/kubernetes/quickstart`

> 当前最新版本号为 3.16.5

**只需在 master 节点执行以下命令即可。**

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

