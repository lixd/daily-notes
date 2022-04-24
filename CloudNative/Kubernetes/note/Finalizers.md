# Finalizers

一共有两个作用：

* 1）做异步资源清理
* 2）防止资源对象被意外删除



[Finalizers](https://kubernetes.io/zh/docs/concepts/overview/working-with-objects/finalizers/)



## 1. 概述

Finalizer 是带有命名空间的键，告诉 Kubernetes 等到特定的条件被满足后， 再完全删除被标记为删除的资源。 **Finalizer 提醒 [控制器](https://kubernetes.io/zh/docs/concepts/architecture/controller/) 清理被删除的对象拥有的资源**。

在 k8s 中使用 kubectl delete 删除资源时，该资源立刻就会被移除掉。但是某些资源可能还有关联的外部资源，我们想在删除该资源时能顺便把对象关联的外部资源也删除掉，Finalizers 就是做这个事情的。



## 2. 异步资源清理流程

Finalizers 字段接受一个数组，其含义为：删除该对象之前需要把 Finalizers 数组里的资源也一并删除。

### 工作流程

Finalizers 具体工作逻辑如下：

* 创建资源时，在 `metadata.finalizers` 字段指定 Finalizers。
* 调用接口删除资源时，处理删除请求的 API 服务器会注意到 `finalizers` 字段中的值， 并进行以下操作：
  * 修改`metadata.deletionTimestamp` 字段
  * 禁止对象被删除，直到其 `metadata.finalizers` 字段为空
  * 返回 `202` 状态码（HTTP "Accepted"），表示该请求已接受
* 管理 finalizer 的控制器发现对象的 `metadata.deletionTimestamp` 被设置，意味着已经进入删除流程，于是开始处理 Finalizers
  * 每当一个 Finalizer 的条件被满足时，控制器就会从资源的 `finalizers` 字段中删除该键
  * 当 `finalizers` 字段为空时，由于之前设置了`deletionTimestamp` 字段，所以该对象会被自动删除。



### demo

比如我们在 k8s 中新增了一个自定义资源 user，创建 user 的时候会在 A、B、C 3个网站分别注册账号，那么我们在删除 user 时也想把该 user 在 A、B、C 3个网站的账号给删除掉，这里我们就可以给 user 对象的 Finalizers 字段设置为 a、b、c。

然后定义 controller 用于分别删除A、B、C 3个网站的账号。

流程如下：

* 1）用户在集群中创建了 user jack
  * 为了做到异步资源删除，在创建时把 jack 的 metadata.finalizers 字段被设置为 [a,b,c]
  * controller 监听到 jack 对象被创建，于是根据 username 和 password 分别去 A、B、C 3个网站注册了账号
* 2）用户在集群中调用 api 删除 user jack
  * K8s api 给 jack 的 metadata.deletionTimestamp 设置上值，并返回 202 状态码
  * controller 检测到 jack 的 metadata.deletionTimestamp 不为 0 后开始处理 finalizers
    * controller 删除了网站 A 的账号，把 finalizers 中的 a 移除，此时 metadata.finalizers 为 [b,c]
    * 同样的 b 和 c 也被移除，最终 metadata.finalizers 为空。
  * k8s 检测到 jack 的 metadata.deletionTimestamp 不为 0，且 metadata.finalizers  为空，移除 jack 对象。



## 3. 防止资源被删除

Finalizers 也可以用于防止资源被意外删除。

因为 k8s 不会删除 Finalizers 字段有值的资源，因此我们可以给需要保护的资源添设置上 Finalizers 值。然后只有在该对应真正被正确删除时才移除Finalizers值。



一个常见的 Finalizer 的例子是 `kubernetes.io/pv-protection`， 它用来防止意外删除 `PersistentVolume` 对象。

 当一个 `PersistentVolume` 对象被 Pod 使用时， Kubernetes 会添加 `pv-protection` Finalizer。 如果你试图删除 `PersistentVolume`，它将进入 `Terminating` 状态， 但是控制器因为该 Finalizer 存在而无法删除该资源。 

当 Pod 停止使用 `PersistentVolume` 时， Kubernetes 清除 `pv-protection` Finalizer，控制器就会删除该卷。

