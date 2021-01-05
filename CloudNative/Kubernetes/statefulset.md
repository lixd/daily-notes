# StatefulSet

## 1. 概述

Deployment 对应用做了一个简单化假设。它认为，一个应用的所有 Pod，是完全一样的。所以，它们互相之间没有顺序，也无所谓运行在哪台宿主机上。需要的时候，Deployment 就可以通过 Pod 模板创建新的 Pod；不需要的时候，Deployment 就可以“杀掉”任意一个 Pod。

实际应用中，尤其是分布式应用，它的多个实例之间，往往有依赖关系，比如：主从关系、主备关系。



StatefulSet 的设计其实非常容易理解。它把真实世界里的应用状态，抽象为了两种情况：

* 1）**拓扑状态**。这种情况意味着，应用的多个实例之间不是完全对等的关系。这些应用实例，必须按照某些顺序启动，比如应用的主节点 A 要先于从节点 B 启动。而如果你把 A 和 B 两个 Pod 删除掉，它们再次被创建出来时也必须严格按照这个顺序才行。并且，新创建出来的 Pod，必须和原来 Pod 的网络标识一样，这样原先的访问者才能使用同样的方法，访问到这个新 Pod。
* 2）**存储状态**。这种情况意味着，应用的多个实例分别绑定了不同的存储数据。对于这些应用实例来说，Pod A 第一次读取到的数据，和隔了十分钟之后再次读取到的数据，应该是同一份，哪怕在此期间 Pod A 被重新创建过。这种情况最典型的例子，就是一个数据库应用的多个存储实例。

**StatefulSet 的核心功能，就是通过某种方式记录这些状态，然后在 Pod 被重新创建时，能够为新 Pod 恢复这些状态。**



## 2. Headless Service

在开始讲述 StatefulSet 的工作原理之前，我就必须先为你讲解一个 Kubernetes 项目中非常实用的概念：Headless Service。



Service 是 Kubernetes 项目中用来将一组 Pod 暴露给外界访问的一种机制。比如，一个 Deployment 有 3 个 Pod，那么我就可以定义一个 Service。然后，用户只要能访问到这个 Service，它就能访问到某个具体的 Pod。

Service 又是如何被访问的呢？

* 1）**第一种方式，是以 Service 的 VIP（Virtual IP，即：虚拟 IP）方式。** 访问 Service IP 时，它会把请求转发到该 Service 代理的 Pod 上。

* 2）**第二种方式，就是以 Service 的 DNS 方式**。比如：这时候，只要我访问“my-svc.my-namespace.svc.cluster.local”这条 DNS 记录，就可以访问到名叫 my-svc 的 Service 所代理的某一个 Pod。

而在第二种 Service DNS 的方式下，具体还可以分为两种处理方法：

第一种处理方法，是 **Normal Service**。这种情况下，你访问“my-svc.my-namespace.svc.cluster.local”解析到的，正是 my-svc 这个 Service 的 VIP，后面的流程就跟 VIP 方式一致了。

而第二种处理方法，正是 **Headless Service**。这种情况下，你访问“my-svc.my-namespace.svc.cluster.local”解析到的，直接就是 my-svc 代理的某一个 Pod 的 IP 地址。**可以看到，这里的区别在于，Headless Service 不需要分配一个 VIP，而是可以直接以 DNS 记录的方式解析出被代理 Pod 的 IP 地址。**

下面是一个标准的 Headless Service 对应的 YAML 文件：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  ports:
  - port: 80
    name: web
  clusterIP: None
  selector:
    app: nginx
```

所谓的 Headless Service，其实仍是一个标准 Service 的 YAML 文件。只不过，它的 `clusterIP `字段的值是：`None`，即：这个 Service，没有一个 VIP 作为“头”。

当你按照这样的方式创建了一个 Headless Service 之后，它所代理的所有 Pod 的 IP 地址，都会被绑定一个这样格式的 DNS 记录，如下所示：

```sh
<pod-name>.<svc-name>.<namespace>.svc.cluster.local
```

> 有了这个“可解析身份”，只要你知道了一个 Pod 的名字，以及它对应的 Service 的名字，你就可以非常确定地通过这条 DNS 记录访问到 Pod 的 IP 地址。



## 3. 例子

StatefulSet 又是如何使用这个 DNS 记录来维持 Pod 的拓扑状态的呢？

首先需要创建一个 Headless Service。

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  ports:
  - port: 80
    name: web
  clusterIP: None
  selector:
    app: nginx
```

```sh
$ kubectl apply -f svc.yaml 
service/nginx created
```



然后在创建 StatefulSet，YAML 文件如下所示：

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: web
spec:
  serviceName: "nginx"
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
        image: nginx:1.9.1
        ports:
        - containerPort: 80
          name: web
```

和 deployment 相比多了一个`serviceName: "nginx"`。

这个字段的作用，就是告诉 StatefulSet 控制器，在执行控制循环（Control Loop）的时候，请使用 `nginx` 这个 Headless Service（就是前面创建的那个） 来保证 Pod 的“可解析身份”。

```sh
$ kubectl apply -f sts.yaml 
statefulset.apps/web created
```





然后查看启动过程

```sh
$ kubectl get service nginx
NAME    TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
nginx   ClusterIP   None         <none>        80/TCP    79s
$ kubectl get statefulset web
NAME   READY   AGE
web    0/2     20s
# 具体启动过程如下
$ kubectl get pods -w -l app=nginx
NAME    READY   STATUS              RESTARTS   AGE
web-0   0/1     ContainerCreating   0          47s
web-0   1/1     Running             0          48s
web-1   0/1     ContainerCreating   0          26s
web-1   1/1     Running             0          27s
```

可以看到两个 Pod 是按照编号顺序启动的，虽然没有指定编号，但是 k8s 自动给每一个 Pod 都加上了从0开始的顺序编号。

当这两个 Pod 都进入了 Running 状态之后，你就可以查看到它们各自唯一的“网络身份”了。我们使用 kubectl exec 命令进入到容器中查看它们的 hostname：

```sh
$ kubectl exec web-0 -- sh -c 'hostname'
web-0
$ kubectl exec web-1 -- sh -c 'hostname'
web-1
```

