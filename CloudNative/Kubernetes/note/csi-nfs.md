# CSI&NFS

## 1. NFS 安装

> 基于 CentOS 7 测试，Redhat 系列应该都行。

[Linux安装和配置NFS服务 ](https://www.htype.top/2021/827715975980)

### 什么是 NFS

NFS 即：Network File System（网络文件系统），基于内核的文件系统。

Sun 公司开发，通过使用 NFS，用户和程序可以像访问本地文件一样访问远端系统上的文件。主要用于Linux之间文件共享。

基于RPC（Remote Procedure Call Protocol 远程过程调用）实现，采用C/S模式，客户机发送一个请求信息给服务进程，然后等待访问端应答。服务端在收到信息之前会保持睡眠状态。

NFS文件系统常运用于内网，因为它部署方便、简单易用、稳定、可靠，如果是大型环境则会用到分布式文件系统比如FastDFS、HDFS、MFS。



### 安装

需要的软件包`nfs-utils`和`rpcbind`

* nfs-utils：是 NFS 服务器的主要软件包。
* rpcbind：由于 NFS 基于 RPC 服务实现所以依赖此包，一般情况下安装了 nfs-utils 后会自动安装。

```bash
yum install nfs-utils rpcbind
```



### 配置

NFS 默认使用`/etc/exports`作为配置文件，如果没有则手动创建该文件。

内容如下：

```bash
# 语法：共享目录	主机(权限) [主机2(权限)]
# 例子
/doc	*(ro,sync)
/tmp/nfs/data	*(rw,sync,no_root_squash)
```

可同时授权多个主机及权限，使用空格分隔，详细参数查询命令`man exports`。

参数解释：

- **共享目录**：需要用NFS共享出去的目录、
  - 指定需要共享给其他主机的目录，格式为绝对路径
- **主机**：指定哪些主机可以用此NFS、
  - 单个主机IP地址：192.168.0.200
  - 一个子网：192.168.0.0/24
  - 单个主机域名：[www.htype.top](http://www.htype.top/)
  - 域下的所有子域名：*.htype.top
  - 所有主机：*
- **权限**：此共享目录的权限
  - 权限里包括目录访问权限，用户映射权限等等，权限之间用`，`分隔、
  - **只读：ro**
  - **读写：rw**
  - **sync**：同步，数据同时写入内存与磁盘中，效率低，但可以保证数据的一致性（1.0.0版本后为默认）；
  - **async**：异步，数据先保存在内存中，必要时写入磁盘，可提高性能但服务器意外停止会丢失数据；
  - **all_squash**：不论登陆者以什么身份，都会被映射为匿名用户（nfsnobody）；
  - **no_all_squash**：以登陆者的身份，不做映射，包括文件所属用户和组（默认）；
  - **root_squash**：将root用户及所属组都映射为匿名用户或用户组（默认）；
  - **no_root_squash**：开放客户端使用root的身份来操作服务器文件系统，命令文档写的“主要用于无盘客户端”；
  - anonuid=xxx：所以用户都映射为匿名账户，并指定UID（用户ID）；
  - anongid=xxx：所有用户都映射为匿名账户，并指定GID（组ID）；





### 相关命令

#### 服务端

立即生效配置

```bash
exportfs -r
```

查看共享目录信息

```bash
exportfs -v
```



nfs 使用 systemd 管理，相关命令如下

```bash
systemctl enable nfs-server.service
systemctl start nfs-server.service
systemctl stop nfs-server.service
systemctl restart nfs-server.service
```



#### 客户端

查看服务器共享了哪些目录

```bash
showmount -e {serverIP}
```

挂载目录

```bash
# 语法：mount serverIP:目录 挂载点
# 将192.168.1.2的nfs共享目录/tmp/nfs/data 挂载到本地/mnt
mount 192.168.1.2:/tmp/nfs/data /mnt
```

配置开机自动挂载

```bash
vi /etc/fstab		#编辑文件#
##添加下面行：
192.168.1.2:/tmp/nfs/data	/mnt	nfs	 defaults	0 0
```

与传统挂载磁盘不同的是，需挂载的设备改成了NFS地址的方式。挂载点还是那个熟悉的挂载点。



```bash
# 语法：mount -t <nfs-type> -o <options>  <host> : </remote/export>  </local/directory>
mount -t nfs -o timeo=60 172.20.150.199:/tmp/nfs/data /tmp/nfs/mnt
```

[nfs 常用挂载选项](https://web.mit.edu/rhel-doc/5/RHEL-5-manual/Deployment_Guide-en-US/s1-nfs-client-config-options.html)

[NFS挂载参数详解及使用建议](https://blog.csdn.net/qq_43355223/article/details/122682180)

```bash
man nfs
```





```bash
mount -t nfs -o timeo=601 172.20.150.199:/tmp/nfs/data /tmp/nfs/mnt
```

测试发现并不是所有 mount options 都会生效

> soft、timeo 是生效的，单独 timeo 不生效



```bash
# 生效的参数
nfsvers

# 不生效的

```





```bash
umount  /tmp/nfs/mnt
cat /proc/mounts | grep nfs
```



[nfs man page](https://linux.die.net/man/5/nfs)

## 2. CSI

在 k8s 中使用上面安装的 NFS 作为存储。

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

