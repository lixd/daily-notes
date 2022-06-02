# CSI&NFS

## 1. CSI

在 k8s 中使用 NFS 作为存储。

需要一个 CSI 插件，官方提供了一个 [nfs-subdir-external-provisioner](https://github.com/kubernetes-sigs/nfs-subdir-external-provisioner) 用于支持 NFS。

> 需要了解 PV、PVC、StorageClass、CSI 等概念。



大致逻辑为 创建 PVC 后 k8s 会寻找匹配的 PV，若没有则会根据 PVC 中指定的 StorageClass 创建一个 PV，并进行绑定。

而光有一个 StorageClass 肯定是没法创建 PV 的，所以还需要一个 CSI 插件和 StorageClass 配合。比如这里用NFS 那么 CSI 插件就是前面提到的 nfs-subdir-external-provisioner。

由于不同的底层存储实现不一样，因此每个存储都需要开发自己的 CSI 插件。



具体怎么用，github repo 上有教程的，这里贴一下。

1）确定 NFS 服务器能够访问

2）下载 github repo deploy 目录下的 yaml 文件，这里直接 clone 整个仓库

```bash
git clone git@github.com:kubernetes-sigs/nfs-subdir-external-provisioner.git
```

3）apply rbac.yaml，为 CSI 授权。

```bash
# 把 yaml 文件里的 namespace 替换成当前 namespace
$ NS=$(kubectl config get-contexts|grep -e "^\*" |awk '{print $5}')
$ NAMESPACE=${NS:-default}
$ sed -i'' "s/namespace:.*/namespace: $NAMESPACE/g" ./deploy/rbac.yaml ./deploy/deployment.yaml
# 然后 apply 完事
$ kubectl create -f deploy/rbac.yaml
```

4）启动 CSI，以 deployment 方式把 CSI 部署在 k8s 集群里

具体 deploy/deployment.yaml 文件内容如下：

```yaml
kind: Deployment
apiVersion: apps/v1
metadata:
  name: nfs-client-provisioner
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nfs-client-provisioner
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: nfs-client-provisioner
    spec:
      serviceAccountName: nfs-client-provisioner
      containers:
        - name: nfs-client-provisioner
          # 镜像换成国内的地址
          #image: k8s.gcr.io/sig-storage/nfs-subdir-external-provisioner:v4.0.2
          image: docker.io/easzlab/nfs-subdir-external-provisioner:v4.0.2
          volumeMounts:
            - name: nfs-client-root
              mountPath: /persistentvolumes
          env:
            - name: PROVISIONER_NAME
              value: k8s-sigs.io/nfs-subdir-external-provisioner
            - name: NFS_SERVER
              value: <NFS 服务地址>
            - name: NFS_PATH
              value: <NFS 共享目录>
      volumes:
        - name: nfs-client-root
          nfs:
            server: <NFS 服务地址>
            path: /var/nfs
```

```bash
$ kubectl apply -f deployment.yaml
```



5）部署 StorageClass

deploy/class.yaml 文件内容如下

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nfs-client
# provisioner 需要和上面 deployment中的 PROVISIONER_NAME env 匹配
provisioner: k8s-sigs.io/nfs-subdir-external-provisioner 
parameters:
  archiveOnDelete: "false"
reclaimPolicy: "Retain"
mountOptions:
  - timeo=60 
  - retrans=3
```

StorageClass 支持参数如下：

***Parameters:\***

| Name            | Description                                                  | Default                                                      |
| --------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| onDelete        | If it exists and has a delete value, delete the directory, if it exists and has a retain value, save the directory. | will be archived with name on the share: `archived-<volume.Name>` |
| archiveOnDelete | If it exists and has a false value, delete the directory. if `onDelete` exists, `archiveOnDelete` will be ignored. | will be archived with name on the share: `archived-<volume.Name>` |
| pathPattern     | Specifies a template for creating a directory path via PVC metadata's such as labels, annotations, name or namespace. To specify metadata use `${.PVC.<metadata>}`. Example: If folder should be named like `<pvc-namespace>-<pvc-name>`, use `${.PVC.namespace}-${.PVC.name}` as pathPattern. | n/a                                                          |



6）测试

创建一个 pvc 以及一个 pod

```bash
$ kubectl create -f deploy/test-claim.yaml -f deploy/test-pod.yaml
```

正常应该自动创建 PV 并绑定到这个 PVC，最后挂载到 Pod 里，Pod 会创建一个叫 SUCCESS 的文件，检查 NFS 服务器上是否存在这个文件。

然后删除 Pod 和 PVC

```bash
kubectl delete -f deploy/test-pod.yaml -f deploy/test-claim.yaml
```

删除后去 NFS 中查看 SUCCESS 这个目录被删除没有，因为之前配置的 onDelete 是 delete，因此正常情况下会被删除。

7）部署自己的 PVC

```yaml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: test-claim
  annotations:
    nfs.io/storage-path: "test-path" # not required, depending on whether this annotation was shown in the storage class description
spec:
  # storageClassName 需要和上面创建的 StorageClass 一样才能绑定上
  storageClassName: nfs-client
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 1Mi
```





## 2. 原理

[kubernetes/k8s CSI 分析 - 容器存储接口分析](https://xie.infoq.cn/article/5cd26c1b24c5665820411bb5a)

至此 kubelet 为 Pod 挂载的原理和流程也一目了然，其实很简单的逻辑，大致可以分为

- **Attach 阶段**：kubelet 使用 systemd-run 单独起一个临时的 systemd scope 来运行后端存储的客户端比如（ nfs 、gluster、ceph），将这些存储挂载到 `/var/lib/kubelet/pods/<Pod的ID>/volumes/kubernetes.io~<Volume类型>/<Volume名字>`
- **Mount 阶段**：容器启动的时候通过 bind mount 的方式将 `/var/lib/kubelet/pods/<Pod的ID>/volumes/kubernetes.io~<Volume类型>/<Volume名字>` 这个目录挂载到容器内。这一步相当于使用 `docker run -v /var/lib/kubelet/pods/<Pod的ID>/volumes/kubernetes.io~<Volume类型>/<Volume名字>:/<容器内的目标目录> 我的镜像` 启动一个容器。
