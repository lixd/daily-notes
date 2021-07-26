---
title: "Kubernetes系列教程(八)---Deployment"
description: "Kubernetes Deployment 详解"
date: 2021-06-22
draft: false
categories: ["Kubernetes"]
tags: ["Kubernetes"]
---

本文主要讲解了 Kubernetes 中最常见的控制器 Deployment。

<!--more-->

## 1. 概述

看完之前对 Pod 相关文章后，你应该知道了**Pod 这个看似复杂的 API 对象，实际上就是对容器的进一步抽象和封装而已**

> [Kubernetes系列教程(七)---Pod 之(1) 为什么需要 Pod](https://www.lixueduan.com/post/kubernetes/07-pod-1-why/)
>
> [Kubernetes系列教程(七)---Pod 之(2) Pod 基本概念与生命周期](https://www.lixueduan.com/post/kubernetes/07-pod-2-baselifecycle/)



Deployment 是 Kubernetes 中最常见的控制器，实际上它是一个**两层控制器**。

* 首先，它通过 **ReplicaSet 的个数**来描述应用的版本；

* 然后，它再通过 **ReplicaSet 的属性**（比如 replicas 的值），来保证 Pod 的副本数量。

> 注：Deployment 控制 ReplicaSet（版本），ReplicaSet 控制 Pod（副本数）。这个两层控制关系一定要牢记。

Deployment 是 Kubernetes 编排能力的一种提现，通过 Deployment 我们可以让 Pod 稳定的维持在指定的数量，除此之外还有滚动更新、版本回滚等功能。



## 2. Controller

前面介绍 Kubernetes 架构的时候，曾经提到过一个叫作 kube-controller-manager 的组件。实际上，这个组件，就是一系列控制器的集合。我们可以查看一下 Kubernetes 项目的 pkg/controller 目录：

```sh
$ cd kubernetes/pkg/controller/
$ ls -d */              
deployment/             job/                    podautoscaler/          
cloud/                  disruption/             namespace/              
replicaset/             serviceaccount/         volume/
cronjob/                garbagecollector/       nodelifecycle/          replication/            statefulset/            daemon/
...
```

这个目录下面的每一个控制器，都以独有的方式负责某种编排功能。而我们的 Deployment，正是这些控制器中的一种。

实际上，这些控制器之所以被统一放在 pkg/controller 目录下，就是因为它们都遵循 Kubernetes 项目中的一个通用编排模式，即：**控制循环（control loop）**。

```sh
// 伪代码如下
for {
  实际状态 := 获取集群中对象X的实际状态（Actual State）
  期望状态 := 获取集群中对象X的期望状态（Desired State）
  if 实际状态 == 期望状态{
    什么都不做
  } else {
    执行编排动作，将实际状态调整为期望状态
  }
}
```

> 具体实现中，实际状态往往来自于 Kubernetes 集群本身。而期望状态，一般来自于用户提交的 YAML 文件。



## 3. Deployment

回顾一下nginx的例子

```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 2
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.7.9
        ports:
        - containerPort: 80
```

这个 Deployment 定义的编排动作非常简单，即：确保携带了 app=nginx 标签的 Pod 的个数，永远等于 spec.replicas 指定的个数，即 2 个。

> 这就意味着，如果在这个集群中，携带 app=nginx 标签的 Pod 的个数大于 2 的时候，就会有旧的 Pod 被删除；反之，就会有新的 Pod 被创建。

接下来，以 Deployment 为例，我和你简单描述一下它对控制器模型的实现：

* 1）Deployment 控制器从 Etcd 中获取到所有携带了“app: nginx”标签的 Pod，然后统计它们的数量，这就是实际状态；
* 2）Deployment 对象的 Replicas 字段的值就是期望状态；
* 3）Deployment 控制器将两个状态做比较，然后根据比较结果，确定是创建 Pod，还是删除已有的 Pod。

可以看到，一个 Kubernetes 对象的主要编排逻辑，实际上是在第三步的“对比”阶段完成的。这个操作，通常被叫作**调谐（Reconcile）**。这个调谐的过程，则被称作**“Reconcile Loop”（调谐循环）**或者**“Sync Loop”（同步循环）**。

而调谐的最终结果，往往都是对被控制对象的某种写操作。比如，增加 Pod，删除已有的 Pod，或者更新 Pod 的某个字段。

**这也是 Kubernetes 项目“面向 API 对象编程”的一个直观体现。**

> 其实，像 Deployment 这种控制器的设计原理，就是 **用一种对象管理另一种对象”的“艺术”**。

其中，这个控制器对象本身，负责定义被管理对象的期望状态。比如，Deployment 里的 replicas=2 这个字段。

而被控制对象的定义，则来自于一个“模板”。比如，Deployment 里的 template 字段。

```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  selector:
    matchLabels:
      app: nginx
  replicas: 2
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.7.9
        ports:
        - containerPort: 80
```

可以看到，Deployment 这个 template 字段里的内容，跟一个标准的 Pod 对象的 API 定义，丝毫不差。而所有被这个 Deployment 管理的 Pod 实例，其实都是根据这个 template 字段的内容创建出来的。

像 Deployment 定义的 template 字段，在 Kubernetes 项目中有一个专有的名字，叫作 PodTemplate（Pod 模板）。

**类似 Deployment 这样的一个控制器，实际上都是由上半部分的控制器定义（包括期望状态），加上下半部分的被控制对象的模板组成的。**

*Kubernetes 使用的这个“控制器模式”，跟我们平常所说的“事件驱动”，有什么区别和联系呢？*

> 事件往往是一次性的，如果操作失败比较难处理，但是控制器是循环一直在尝试的，最终达到一致，更符合kubernetes 声明式API。



## 4. ReplicaSet

Deployment 看似简单，但实际上，它实现了 Kubernetes 项目中一个非常重要的功能：Pod 的“水平扩展 / 收缩”（horizontal scaling out/in）。

举个例子，如果你更新了 Deployment 的 Pod 模板（比如，修改了容器的镜像），那么 Deployment 就需要遵循一种叫作“滚动更新”（rolling update）的方式，来升级现有的容器。

而这个能力的实现，依赖的是 Kubernetes 项目中的一个非常重要的概念（API 对象）：ReplicaSet。

```yaml
---
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: nginx-set
  labels:
    app: nginx
spec:
  replicas: 3
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
        image: nginx:1.7.9
```

从这个 YAML 文件中，我们可以看到，**一个 ReplicaSet 对象，其实就是由副本数目的定义和一个 Pod 模板组成的**。不难发现，它的定义其实是 Deployment 的一个子集。

**更重要的是，Deployment 控制器实际操纵的，正是这样的 ReplicaSet 对象，而不是 Pod 对象。**

具体如图所示:

![replicaset][replicaset]



ReplicaSet 负责通过“控制器模式”，保证系统中 Pod 的个数永远等于指定的个数（比如，3 个）。这也正是 Deployment 只允许容器的 restartPolicy=Always 的主要原因：只有在容器能保证自己始终是 Running 状态的前提下，ReplicaSet 调整 Pod 的个数才有意义。

伸缩

```sh
$ kubectl scale deployment nginx-deployment --replicas=4
deployment.apps/nginx-deployment scaled
```



### 滚动更新

**将一个集群中正在运行的多个 Pod 版本，交替地逐一升级的过程，就是“滚动更新”。**

先将新版本的V2从0个扩容到1个Pod，接着将旧版本的V1 从3个缩容到2个，这样慢慢的最后V1缩为0个，V2扩到3个。

> 滚动更新好处就是，即使V2版本出现异常，此时也会有两个V1版本在运行，然后用户可以手动处理这种情况，比如停止更新或者回滚到V1版本



![replicaset-roll-update][replicaset-roll-update]

如上所示，Deployment 的控制器，实际上控制的是 ReplicaSet 的数目，以及每个 ReplicaSet 的属性。而一个应用的版本，对应的正是一个 ReplicaSet；

这个版本应用的 Pod 数量，则由 ReplicaSet 通过它自己的控制器（ReplicaSet Controller）来保证。通过这样的多个 ReplicaSet 对象，Kubernetes 项目就实现了对多个“应用版本”的描述。



### 回滚

首先，我需要使用 `kubectl rollout history` 命令，查看每次 Deployment 变更对应的版本

```sh
$ kubectl rollout history deployment/nginx-deployment
deployments "nginx-deployment"
REVISION    CHANGE-CAUSE
1           kubectl create -f nginx-deployment.yaml --record
2           kubectl edit deployment/nginx-deployment
3           kubectl set image deployment/nginx-deployment nginx=nginx:1.91
```

然后，我们就可以在 `kubectl rollout undo` 命令行最后，加上要回滚到的指定版本的版本号，就可以回滚到指定版本了。

```sh
$ kubectl rollout undo deployment/nginx-deployment --to-revision=2
deployment.extensions/nginx-deployment
```





## 5. 参考

`深入剖析Kubernetes`

`https://kubernetes.io/docs/concepts/workloads/controllers/deployment/`





[replicaset]:https://github.com/lixd/blog/raw/master/images/kubernetes/deployment/replicaset.jpg
[replicaset-roll-update]:https://github.com/lixd/blog/raw/master/images/kubernetes/deployment/replicaset-roll-update.jpg

