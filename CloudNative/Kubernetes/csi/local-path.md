# local-path

## 1. 概述

> 官方仓库 [local-path-provisioner](https://github.com/rancher/local-path-provisioner)
>
> Dynamically provisioning persistent local storage with Kubernetes

rancher 开源的一个支持 CSI 但是使用 local-path 的项目。借助该项目我们可以像使用 CSI 一样使用 local-path。

> 便于测试。



## 2. 安装

官方提供了一键安装命令，具体如下：

```bash
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.24/deploy/local-path-storage.yaml
```



安装好之后只会启动一个 pod

```bash
kubectl -n local-path-storageget po
local-path-storage   local-path-provisioner-67f5f9cb7b-2gzll    1/1     Running   0          9m30s
```

不过在创建 pvc 时会启动一个临时 pod 来创建 pvc

```bash
local-path-storage   helper-pod-create-pvc-a74c12f5-f5f9-49cd-b918-db6ba6ac6ed3   0/1     ContainerCreating   0          52s
```

提供的 StorageClass 如下

```bash
[root@outer-4 ~]# kubectl get sc
NAME         PROVISIONER             RECLAIMPOLICY   VOLUMEBINDINGMODE      ALLOWVOLUMEEXPANSION   AGE
local-path   rancher.io/local-path   Delete          WaitForFirstConsumer   false                  11m
```





## 3. 测试

创建一个 pvc 看下能否动态的创建出 pv 并进行绑定

```yaml
cat > testpv.yaml <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: test
spec:
  storageClassName: local-path
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Mi
EOF
```

```bash
kubectl apply -f testpv.yaml
```

查看 pvc

```bash
[root@outer-4 ~]# k get pvc
NAME        STATUS    VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
test        Pending                                                                        local-path     8m8s
```

可以看到 pvc 还处于 Pending 状态，因为这个是 local path，必须等 pod 调度到对应的节点之后才能创建 pv 出来，否则可能 pod 会调度到其他节点，导致无法启动。

创建一个 redis 测试一下

```yaml
cat > testpod.yaml << EOF
apiVersion: v1
kind: Pod
metadata:
  name: task-pv-pod
spec:
  volumes:
    - name: task-pv-storage
      persistentVolumeClaim:
        claimName: task-pv-claim
  containers:
    - name: task-pv-container
      image: nginx
      ports:
        - containerPort: 80
          name: "http-server"
      volumeMounts:
        - mountPath: "/usr/share/nginx/html"
          name: task-pv-storage
EOF
```

```bash
kubectl apply -f testpod.yaml
```

再次查看,pvc 已经 Bound 了

```bash
[root@outer-4 ~]# k get pvc
NAME        STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
test        Bound    pvc-03563d01-36e0-4a22-942f-0b26a45025e2   100Mi      RWO            local-path     8m30s
```





