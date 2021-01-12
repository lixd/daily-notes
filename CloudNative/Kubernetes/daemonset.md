# DaemonSet



## 1. 概述

DaemonSet 的主要作用，是让你在 Kubernetes 集群里，运行一个 Daemon Pod。

这个 Pod 有如下三个特征：

* 1）这个 Pod 运行在 Kubernetes 集群里的每一个节点（Node）上；
* 2）每个节点上只有一个这样的 Pod 实例；
* 3）当有新的节点加入 Kubernetes 集群后，该 Pod 会自动地在新节点上被创建出来；而当旧节点被删除后，它上面的 Pod 也相应地会被回收掉。

常用场景：

* 1）各种网络插件的 Agent 组件，都必须运行在每一个节点上，用来处理这个节点上的容器网络；
* 2）各种存储插件的 Agent 组件，也必须运行在每一个节点上，用来在这个节点上挂载远程存储目录，操作容器的 Volume 目录；
* 3）各种监控组件和日志组件，也必须运行在每一个节点上，负责这个节点上的监控信息和日志搜集。



> k8s 日志收集中就以一种通过 DaemonSet 方式进行日志收集的。

更重要的是，跟其他编排对象不一样，**DaemonSet 开始运行的时机，很多时候比整个 Kubernetes 集群出现的时机都要早**。





## 2. 分析

DaemonSet YAML 文件如下：

```yaml

apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd-elasticsearch
  namespace: kube-system
  labels:
    k8s-app: fluentd-logging
spec:
  selector:
    matchLabels:
      name: fluentd-elasticsearch
  template:
    metadata:
      labels:
        name: fluentd-elasticsearch
    spec:
      tolerations:
      - key: node-role.kubernetes.io/master
        effect: NoSchedule
      containers:
      - name: fluentd-elasticsearch
        image: k8s.gcr.io/fluentd-elasticsearch:1.20
        resources:
          limits:
            memory: 200Mi
          requests:
            cpu: 100m
            memory: 200Mi
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
      terminationGracePeriodSeconds: 30
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
```

DaemonSet 跟 Deployment 其实非常相似，只不过是没有 replicas 字段。



### 1. 控制器

DaemonSet 又是如何保证每个 Node 上有且只有一个被管理的 Pod 呢？

DaemonSet Controller，首先从 Etcd 里获取所有的 Node 列表，然后遍历所有的 Node。这时，它就可以很容易地去检查，当前这个 Node 上是不是有一个携带了 name=fluentd-elasticsearch 标签的 Pod 在运行。

而检查的结果，可能有这么三种情况：

* 1）没有这种 Pod，那么就意味着要在这个 Node 上创建这样一个 Pod；
* 2）有这种 Pod，但是数量大于 1，那就说明要把多余的 Pod 从这个 Node 上删除掉；
* 3）正好只有一个这种 Pod，那说明这个节点是正常的。



### 2. nodeAffinity

删除节点（Node）上多余的 Pod ，直接调用 Kubernetes API 。

在指定的节点（Node）上创建 Pod，则是使用的 **nodeAffinity**，通过指定节点亲和性来实现。

> nodeSelector 其实已经是一个将要被废弃的字段了，具体 nodeAffinity 见亲和性章节。

DaemonSet Controller 会在创建 Pod 的时候，自动在这个 Pod 的 API 对象里，加上这样一个 nodeAffinity 定义，就能实现在指定的节点（Node）上创建 Pod。

> 当然，DaemonSet 并不需要修改用户提交的 YAML 文件里的 Pod 模板，而是在**向 Kubernetes 发起请求之前**，直接修改根据模板生成的 Pod 对象。



### 3. tolerations

k8s 会对不可用的 Node 进行污点标记，比如节点不可调度就标记 unschedulable，网络不可用则是network-unavailable 等等。

在正常情况下，被标记了 unschedulable “污点”的 Node，是不会有任何 Pod 被调度上去的（effect: NoSchedule）。

于是，DaemonSet 为了保证每个节点上都会被调度一个 Pod，需要突破这个限制。

所以，DaemonSet 还会给这个 Pod 自动加上另外一个与调度相关的字段，叫作 tolerations。这个字段意味着这个 Pod，会“容忍”（Toleration）某些 Node 的“污点”（Taint）。

```yaml
---
apiVersion: v1
kind: Pod
metadata:
  name: with-toleration
spec:
  tolerations:
  - key: node.kubernetes.io/unschedulable
    operator: Exists
    effect: NoSchedule
```

这样就保证了每个节点上都会被调度一个 Pod。当然，如果这个节点有故障的话，这个 Pod 可能会启动失败，而 DaemonSet 则会始终尝试下去，直到 Pod 启动成功。

> 根据节点的污点不同，容忍也要做对应调整，比如安装网络插件之前由于网络不可用，所以会被标记 network-unavailable 污点，通过 DaemonSet 安装网络插件则需要容忍network-unavailable。



## 3. ControllerRevision

Deployment 管理版本，靠的是“一个版本对应一个 ReplicaSet 对象”。可是，DaemonSet 控制器操作的直接就是 Pod，不可能有 ReplicaSet 这样的对象参与其中。

那么，它的这些版本又是如何维护的呢？

Kubernetes v1.7 之后添加了一个 API 对象，名叫 ControllerRevision，专门用来记录某种 Controller 对象的版本。



`kubectl apply -f `创建 DaemonSet 对象的时候，ControllerRevision 就会把 DaemonSet 的 API 对象存储下来。

`kubectl rollout undo` 回滚的时候就从 ControllerRevision  里读出旧的 API 对象，然后进行替换。

这也是为什么，在执行完这次回滚完成后，你会发现，DaemonSet 的 Revision 并不会从 Revision=2 退回到 1，而是会增加成 Revision=3。这是因为，一个新的 ControllerRevision 被创建了出来。



## 4. 小结

* 1）DaemonSet 直接读取 etcd 中的数据，获取到所有 Node 信息。

* 2）通过 nodeAffinity 和 Toleration 保证了每个节点上有且只有一个 Pod。
* 3）通过 ControllerRevision，来保存和管理自己对应的“版本”。

