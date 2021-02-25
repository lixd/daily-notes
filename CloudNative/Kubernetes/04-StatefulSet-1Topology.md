# StatefulSet

> [StatefulSet 官方文档](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)

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



接下来，我们再试着以 DNS 的方式，访问一下这个 Headless Service：

```sh
$ kubectl run -i --tty --image busybox:1.28.4 dns-test --restart=Never --rm /bin/sh 
```

通过这条命令，我们启动了一个一次性的 Pod，因为–rm 意味着 Pod 退出后就会被删除掉。然后，在这个 Pod 的容器里面，我们尝试用 nslookup 命令，解析一下 Pod 对应的 Headless Service：

```sh
$ kubectl run -i --tty --image busybox:1.28.4 dns-test --restart=Never --rm /bin/sh 
/ # nslookup web-0.nginx
Server:    172.21.0.10
Address 1: 172.21.0.10 kube-dns.kube-system.svc.cluster.local

Name:      web-0.nginx
Address 1: 172.20.0.174 web-0.nginx.default.svc.cluster.local
/ # nslookup web-1.nginx
Server:    172.21.0.10
Address 1: 172.21.0.10 kube-dns.kube-system.svc.cluster.local

Name:      web-1.nginx
Address 1: 172.20.0.15 web-1.nginx.default.svc.cluster.local
```

从 nslookup 命令的输出结果中，我们可以看到，在访问 web-0.nginx 的时候，最后解析到的，正是 web-0 这个 Pod 的 IP 地址；而当访问 web-1.nginx 的时候，解析到的则是 web-1 的 IP 地址。

时候，如果你在另外一个 Terminal 里把这两个“有状态应用”的 Pod 删掉：

```sh
$ kubectl delete pod -l app=nginx
pod "web-0" deleted
pod "web-1" deleted

```

然后，再在当前 Terminal 里 Watch 一下这两个 Pod 的状态变化，就会发现一个有趣的现象：

```sh
$ kubectl get pod -w -l app=nginx
NAME    READY   STATUS    RESTARTS   AGE
web-0   0/1     Terminating   0          11s
web-0   0/1     Terminating   0          11s
web-0   0/1     Pending       0          0s
web-0   0/1     Pending       0          0s
web-0   0/1     ContainerCreating   0          1s
web-0   1/1     Running             0          1s
web-1   0/1     Terminating         0          17s
web-1   0/1     Terminating         0          17s
web-1   0/1     Pending             0          0s
web-1   0/1     Pending             0          0s
web-1   0/1     ContainerCreating   0          0s
web-1   1/1     Running             0          1s
```

可以看到，当我们把这两个 Pod 删除之后，Kubernetes 会按照原先编号的顺序，创建出了两个新的 Pod。并且，Kubernetes 依然为它们分配了与原来相同的“网络身份”：web-0.nginx 和 web-1.nginx。**通过这种严格的对应规则，StatefulSet 就保证了 Pod 网络标识的稳定性**。

> 比如，如果 web-0 是一个需要先启动的主节点，web-1 是一个后启动的从节点，那么只要这个 StatefulSet 不被删除，你访问 web-0.nginx 时始终都会落在主节点上，访问 web-1.nginx 时，则始终都会落在从节点上，这个关系绝对不会发生任何变化。

所以，如果我们再用 nslookup 命令，查看一下这个新 Pod 对应的 Headless Service 的话：

```sh
$ kubectl run -i --tty --image busybox:1.28.4 dns-test --restart=Never --rm /bin/sh
If you don't see a command prompt, try pressing enter.
/ # nslookup web-0.nginx
Server:    172.21.0.10
Address 1: 172.21.0.10 kube-dns.kube-system.svc.cluster.local

Name:      web-0.nginx
Address 1: 172.20.0.18 web-0.nginx.default.svc.cluster.local
/ # nslookup web-1.nginx
Server:    172.21.0.10
Address 1: 172.21.0.10 kube-dns.kube-system.svc.cluster.local

Name:      web-1.nginx
Address 1: 172.20.0.176 web-1.nginx.default.svc.cluster.local
```

我们可以看到，在这个 StatefulSet 中，这两个新 Pod 的“网络标识”（比如：web-0.nginx 和 web-1.nginx），再次解析到了正确的 IP 地址（比如：web-0 Pod 的 IP 地址 172.21.0.10）。

通过这种方法，Kubernetes 就成功地将 Pod 的拓扑状态（比如：哪个节点先启动，哪个节点后启动），按照 Pod 的“名字 + 编号”的方式固定了下来。此外，Kubernetes 还为每一个 Pod 提供了一个固定并且唯一的访问入口，即：这个 Pod 对应的 DNS 记录。

这些状态，在 StatefulSet 的整个生命周期里都会保持不变，绝不会因为对应 Pod 的删除或者重新创建而失效。

不过，尽管 web-0.nginx 这条记录本身不会变，但它解析到的 Pod 的 IP 地址，并不是固定的。这就意味着，**对于“有状态应用”实例的访问，你必须使用 DNS 记录或者 hostname 的方式，而绝不应该直接访问这些 Pod 的 IP 地址**。



## 4. 小结

StatefulSet 这个控制器的主要作用之一，就是使用 Pod 模板创建 Pod 的时候，对它们进行**编号**，并且按照编号顺序逐一完成创建工作。而当 StatefulSet 的“控制循环”发现 Pod 的“实际状态”与“期望状态”不一致，需要新建或者删除 Pod 进行“调谐”的时候，它会严格按照这些 Pod 编号的顺序，逐一完成这些操作。

所以，StatefulSet 其实可以认为是对 Deployment 的改良。与此同时，通过 Headless Service 的方式，StatefulSet 为每个 Pod 创建了一个固定并且稳定的 DNS 记录，来作为它的访问入口。