#  Persistent Volume Claim

## 1. 概述

> StatefulSet 保持Pod的存储状态主要靠PV/PVC来完成。

要在一个 Pod 里声明 Volume，只要在 Pod 里加上 spec.volumes 字段即可，**如果你并不知道有哪些 Volume 类型可以用，要怎么办呢？**

> 作为一个应用开发者，我可能对持久化存储项目（比如 Ceph、GlusterFS 等）一窍不通,自然不会编写它们对应的 Volume 定义文件。

于是**Kubernetes 项目引入 Persistent Volume Claim（PVC）和 Persistent Volume（PV）这组 API 对象，极大降低了用户声明和使用持久化 Volume 的门槛。**

* 1）Pod 中定义 Volume 只需要指定对应 PVC 即可。
* 2）PVC 对象创建后 k8s 会自动找到满足条件的 Volume 并与其绑定（实际是与 PV 绑定）。
* 3）PV 对象则描述了真正的 Volume，一般是由运维人员维护。

**PVC 与 PV 类似 接口与实现的思想**。开发者使用时只需要关心接口 即PVC ，具体实现 PV 则由运维人员维护。



## 2. 例子

有了 PVC 之后，一个开发人员想要使用一个 Volume，只需要简单的两步即可。

**第一步：定义一个 PVC，声明想要的 Volume 的属性：**

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: pv-claim
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
```

在这个 PVC 对象里，不需要任何关于 Volume 细节的字段，只有描述性的属性和定义。比如，storage: 1Gi，表示我想要的 Volume 大小至少是 1 GiB；accessModes: ReadWriteOnce，表示这个 Volume 的挂载方式是可读写，并且只能被挂载在一个节点上而非被多个节点共享。

**第二步：在应用的 Pod 中，声明使用这个 PVC：**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pv-pod
spec:
  containers:
    - name: pv-container
      image: nginx
      ports:
        - containerPort: 80
          name: "http-server"
      volumeMounts:
        - mountPath: "/usr/share/nginx/html"
          name: pv-storage
  volumes:
    - name: pv-storage
      persistentVolumeClaim:
        claimName: pv-claim
```

可以看到，在这个 Pod 的 Volumes 定义中，我们只需要声明它的类型是 persistentVolumeClaim，然后指定 PVC 的名字，而完全不必关心 Volume 本身的定义。



## 3. PV

**只要我们创建这个 PVC 对象，Kubernetes 就会自动为它绑定一个符合条件的 Volume**。

> 比如大小满足，accessModes 也满足，并不需要通过 label 来对应。

可是，这些符合条件的 Volume 又是从哪里来的呢？

答案是，它们来自于由运维人员维护的 PV（Persistent Volume）对象。接下来，我们一起看一个常见的 PV 对象的 YAML 文件：

```yaml
kind: PersistentVolume
apiVersion: v1
metadata:
  name: pv-volume
  labels:
    type: local
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce
  rbd:
    monitors:
    # 使用 kubectl get pods -n rook-ceph 查看 rook-ceph-mon- 开头的 POD IP 即可得下面的列表
    - '10.16.154.78:6789'
    - '10.16.154.82:6789'
    - '10.16.154.83:6789'
    pool: kube
    image: foo
    fsType: ext4
    readOnly: true
    user: admin
    keyring: /etc/ceph/keyring
```

可以看到，这个 PV 对象的 spec.rbd 字段，正是 Ceph RBD Volume 的详细定义。而且，它还声明了这个 PV 的容量是 10 GiB。这样，Kubernetes 就会为我们刚刚创建的 PVC 对象绑定这个 PV。



## 4. StatefulSet

PVC、PV 的设计，也使得 StatefulSet 对存储状态的管理成为了可能。

Pod 创建后 k8s 会给每个 Pod 编号， PVC 也是一样的，会有自己的编号。

```yaml
---
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
        volumeMounts:
        - name: www
          mountPath: /usr/share/nginx/html
  volumeClaimTemplates:
  - metadata:
      name: www
    spec:
      accessModes:
      - ReadWriteOnce
      resources:
        requests:
          storage: 1Gi
```

其中 spec.volumeClaimTemplates 类似于 Deployment 中的 Pod 模板，由这个 StatefulSet 管理的 Pod 都会根据这个模板创建出对应的 PVC。

这个自动创建的 PVC，与 PV 绑定成功后，就会进入 Bound 状态，这就意味着这个 Pod 可以挂载并使用这个 PV 了。



比如：根据 StatefulSet 创建了两个 Pod,web-0,web-1, 创建的PVC也是有编号的，www-web-0，www-web-1。

> 名字主要由 metadata.name 配置，编号则从0开始递增



首先，当你把一个 Pod，比如 web-0，删除之后，这个 Pod 对应的 PVC 和 PV，并不会被删除，而这个 Volume 里已经写入的数据，也依然会保存在远程存储服务里。

此时，StatefulSet 控制器发现，一个名叫 web-0 的 Pod 消失了。所以，控制器就会重新创建一个新的、名字还是叫作 web-0 的 Pod 来，“纠正”这个不一致的情况。

需要注意的是，在这个新的 Pod 对象的定义里，它声明使用的 PVC 的名字，还是叫作：www-web-0。这个 PVC 的定义，还是来自于 PVC 模板（volumeClaimTemplates），这是 StatefulSet 创建 Pod 的标准流程。

所以，在这个新的 web-0 Pod 被创建出来之后，Kubernetes 为它查找名叫 www-web-0 的 PVC 时，就会直接找到旧 Pod 遗留下来的同名的 PVC，进而找到跟这个 PVC 绑定在一起的 PV。

这样，新的 Pod 就可以挂载到旧 Pod 对应的那个 Volume，并且获取到保存在 Volume 里的数据。通过这种方式，Kubernetes 的 StatefulSet 就实现了对应用存储状态的管理。

**小结**

**首先，StatefulSet 的控制器直接管理的是 Pod。**

StatefulSet 里的不同 Pod 实例，不再像 ReplicaSet 中那样都是完全一样的，而是有了细微区别的。比如，每个 Pod 的 hostname、名字等都是不同的、携带了编号的。而 StatefulSet 区分这些实例的方式，就是通过在 Pod 的名字里加上事先约定好的编号

**其次，Kubernetes 通过 Headless Service，为这些有编号的 Pod，在 DNS 服务器中生成带有同样编号的 DNS 记录。**

只要 StatefulSet 能够保证这些 Pod 名字里的编号不变，那么 Service 里类似于 web-0.nginx.default.svc.cluster.local 这样的 DNS 记录也就不会变，而这条记录解析出来的 Pod 的 IP 地址，则会随着后端 Pod 的删除和再创建而自动更新。这当然是 Service 机制本身的能力，不需要 StatefulSet 操心。

**最后，StatefulSet 还为每一个 Pod 分配并创建一个同样编号的 PVC。**

这样，Kubernetes 就可以通过 Persistent Volume 机制为这个 PVC 绑定上对应的 PV，从而保证了每一个 Pod 都拥有一个独立的 Volume。

即使 Pod 被删除，它所对应的 PVC 和 PV 依然会保留下来。所以当这个 Pod 被重新创建出来之后，Kubernetes 会为它找到同样编号的 PVC，挂载这个 PVC 对应的 Volume，从而获取到以前保存在 Volume 里的数据。



## 5. StatefulSet 总结

**StatefulSet 其实就是一种特殊的 Deployment，而其独特之处在于，它的每个 Pod 都被编号了**。而且，这个编号会体现在 Pod 的名字和 hostname 等标识信息上，这不仅代表了 Pod 的创建顺序，也是 Pod 的重要网络标识（即：在整个集群里唯一的、可被访问的身份）。

有了这个编号后，StatefulSet 就使用 Kubernetes 里的两个标准功能：**Headless Service **和 **PV/PVC**，实现了对 Pod 的**拓扑状态**和**存储状态**的维护。

* 1）StatefulSet 为Pod编号
* 2）Headless Service 根据编号为Pod创建DNS记录，作为固定的访问入口
* 3）PV/PVC 根据编号将Pod和对应Volume绑定，由于是远程Volume所以Pod重启也不会让Volume丢失。

