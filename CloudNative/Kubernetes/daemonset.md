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



### 控制器

DaemonSet 又是如何保证每个 Node 上有且只有一个被管理的 Pod 呢？

DaemonSet Controller，首先从 Etcd 里获取所有的 Node 列表，然后遍历所有的 Node。这时，它就可以很容易地去检查，当前这个 Node 上是不是有一个携带了 name=fluentd-elasticsearch 标签的 Pod 在运行。

而检查的结果，可能有这么三种情况：

* 1）没有这种 Pod，那么就意味着要在这个 Node 上创建这样一个 Pod；
* 2）有这种 Pod，但是数量大于 1，那就说明要把多余的 Pod 从这个 Node 上删除掉；
* 3）正好只有一个这种 Pod，那说明这个节点是正常的。





删除节点（Node）上多余的 Pod ，直接调用 Kubernetes API 。

在指定的节点（Node）上创建 Pod，则是使用的 nodeAffinity，通过指定节点亲和性来实现。

> nodeSelector 其实已经是一个将要被废弃的字段了，具体 nodeAffinity 见亲和性章节。

DaemonSet Controller 会在创建 Pod 的时候，自动在这个 Pod 的 API 对象里，加上这样一个 nodeAffinity 定义，就能实现在指定的节点（Node）上创建 Pod。



