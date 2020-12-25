# 07-第一个 Kubernetes 容器

## 1. 状态检查

### 1. 检查组件运行状态

```shell
root@kubernetes-master:~# kubectl get cs
NAME                 STATUS      MESSAGE                                                                                       ERROR
scheduler            Unhealthy   Get "http://127.0.0.1:10251/healthz": dial tcp 127.0.0.1:10251: connect: connection refused   
controller-manager   Healthy     Get "http://127.0.0.1:10251/healthz": dial tcp 127.0.0.1:10251: connect: connection refused     etcd-0               Healthy     {"health":"true"}
```

> 出现这种情况，是 `/etc/kubernetes/manifests`下的 `kube-controller-manager.yaml` 和 `kube-scheduler.yaml` 设置的默认端口是0，在文件中注释掉就可以了。
>
> [参考](https://blog.csdn.net/cymm_liu/article/details/108458197)



```shell
vim /etc/kubernetes/manifests/kube-scheduler.yaml

apiVersion: v1
kind: Pod
metadata:
  creationTimestamp: null
  labels:
    component: kube-scheduler
    tier: control-plane
  name: kube-scheduler
  namespace: kube-system
spec:
  containers:
  - command:
    - kube-scheduler
    - --authentication-kubeconfig=/etc/kubernetes/scheduler.conf
    - --authorization-kubeconfig=/etc/kubernetes/scheduler.conf
    - --bind-address=127.0.0.1
    - --kubeconfig=/etc/kubernetes/scheduler.conf
    - --leader-elect=true
    # 注释掉这个
      # - --port=0
```

`kube-controller-manager.yaml`文件同理。



* `scheduler`  为调度服务，主要作用是将 POD 调度到 Node
* `controller-manager` 为自动化修复服务，主要作用是 Node 宕机后自动修复 Node 回到正常的工作状态
* `etcd-0`  则是熟悉的服务注册与发现

### 2. 检查 Master 状态

```shell
$ kubectl cluster-info
root@docker:/etc/kubernetes/manifests# kubectl cluster-info
Kubernetes master is running at https://192.168.2.110:6443
KubeDNS is running at https://192.168.2.110:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
```



### 3. 检查 Nodes 状态

```shell
$ kubectl get nodes
root@docker:/etc/kubernetes/manifests# kubectl get nodes
NAME                STATUS   ROLES    AGE   VERSION
kubernetes-master   Ready    master   12m   v1.19.4
kubernetes-node1    Ready    <none>   12m   v1.19.4
kubernetes-node2    Ready    <none>   12m   v1.19.4
```



## 2. 运行第一个容器实例

### 1. 启动

`nginx-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  # 创建2个nginx容器
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
        image: nginx:1.18.0
        ports:
        - containerPort: 80
```

创建实例

```shell
$ kubectl apply -f nginx-deployment.yaml

root@kubernetes-master:/usr/local/docker/nginx# kubectl apply -f nginx-deployment.yaml
deployment.apps/nginx-deployment created
```





### 2. 查看全部 Pods 的状态

```shell
$ kubectl get pods

# 输出如下，需要等待一小段时间，STATUS 为 Running 即为运行成功
root@docker:/usr/local/k8s/conf# kubectl get pods
NAME                                READY   STATUS              RESTARTS   AGE
nginx-deployment-66b6c48dd5-j6mnj   0/1     ContainerCreating   0          8s
nginx-deployment-66b6c48dd5-nq497   0/1     ContainerCreating   0          8s
```



### 3. 查看已部署的服务

```shell
$ kubectl get deployment

#输出如下
root@docker:/usr/local/k8s/conf# kubectl get deployment
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   2/2     2            2           27s
```



### 4. 映射服务，让用户可以访问

```shell
$ kubectl expose deployment nginx-deployment --port=80 --type=LoadBalancer
$ kubectl expose deployment hello-world --type=LoadBalancer --name=my-service
# 输出如下
root@docker:/usr/local/k8s/conf#  kubectl expose deployment nginx-deployment --port=80 --type=LoadBalancer
service/nginx-deployment exposed
```

### 5. 查看已发布的服务

```shell
$ kubectl get services

#输出如下
oot@docker:/usr/local/k8s/conf# kubectl get services
NAME               TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
kubernetes         ClusterIP      10.96.0.1      <none>        443/TCP        14m
# 由此可见，Nginx 服务已成功发布并将 80 端口映射为 31738
nginx-deployment   LoadBalancer   10.96.93.238   <pending>     80:31644/TCP   27s

```



### 6. 查看服务详情

```shell
#nginx-deployment 为服务名称
$ kubectl describe service nginx-deployment

#输出如下
root@docker:/usr/local/k8s/conf# kubectl describe service nginx-deployment
Name:                     nginx-deployment
Namespace:                default
Labels:                   app=nginx
Annotations:              <none>
Selector:                 app=nginx
Type:                     LoadBalancer
IP:                       10.96.93.238
Port:                     <unset>  80/TCP
TargetPort:               80/TCP
NodePort:                 <unset>  31644/TCP
Endpoints:                192.168.129.65:80,192.168.22.66:80
Session Affinity:         None
External Traffic Policy:  Cluster
Events:                   <none>
```

### 7. 验证

通过浏览器访问 Master 服务器

```shell
# 端口号为第五步中的端口号
http://192.168.2.110:31644/
```

此时 Kubernetes 会以负载均衡的方式访问部署的 Nginx 服务，能够正常看到 Nginx 的欢迎页即表示成功。容器实际部署在其它 Node 节点上，通过访问 Node 节点的 IP:Port 也是可以的。



## 3. 停止服务

### 1. 删除 deployment

```shell
$ kubectl delete deployment nginx-deployment

#输出如下
root@kubernetes-master:/usr/local/docker/nginx# kubectl delete deployment nginx-deployment
deployment.apps "nginx-deployment" deleted
```

### 2. 删除 services

deployment 中移除了 但是 services 中还存在，所以也需要一并删除。

```shell
$ kubectl delete service nginx-deployment

#输出如下
root@kubernetes-master:/usr/local/docker/nginx# kubectl delete service nginx-deployment
service "nginx-deployment" deleted
```

