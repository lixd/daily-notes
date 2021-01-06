#  Persistent Volume Claim

## 1. 概述

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

