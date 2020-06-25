# 07-第一个 Kubernetes 容器

## 1. 状态检查

### 1. 检查组件运行状态

```shell
root@kubernetes-master:~# kubectl get cs
NAME                 STATUS    MESSAGE             ERROR
scheduler            Healthy   ok                  
controller-manager   Healthy   ok                  
etcd-0               Healthy   {"health":"true"} 
```

其中 `scheduler`  为调度服务，主要作用是将 POD 调度到 Node

`controller-manager` 为自动化修复服务，主要作用是 Node 宕机后自动修复 Node 回到正常的工作状态

`etcd-0`  则是熟悉的服务注册与发现

### 2. 检查 Master 状态

```shell
root@kubernetes-master:~# kubectl cluster-info
Kubernetes master is running at https://192.168.1.113:6443
KubeDNS is running at https://192.168.1.113:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.
```



### 3. 检查 Nodes 状态

```shell
root@kubernetes-master:~# kubectl get nodes
NAME                STATUS   ROLES    AGE   VERSION
kubernetes-master   Ready    master   23h   v1.18.3
kubernetes-slave1   Ready    <none>   22h   v1.18.3
kubernetes-slave2   Ready    <none>   22h   v1.18.3
```



## 2. 运行第一个容器实例

### 1. 启动

`nginx-deployment.yaml`

```shell
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
        image: nginx:1.14.2
        ports:
        - containerPort: 80
```

创建实例

```shell
kubectl apply -f nginx-deployment.yaml

root@kubernetes-master:/usr/local/docker/nginx# kubectl apply -f nginx-deployment.yaml
deployment.apps/nginx-deployment created
```





### 2. 查看全部 Pods 的状态

```shell
kubectl get pods

# 输出如下，需要等待一小段时间，STATUS 为 Running 即为运行成功
root@kubernetes-master:/usr/local/docker/nginx# kubectl get pods
NAME                                READY   STATUS              RESTARTS   AGE
nginx-deployment-6b474476c4-lplfm   0/1     ContainerCreating   0          10s
nginx-deployment-6b474476c4-m564j   0/1     ContainerCreating   0          10s
```



### 3. 查看已部署的服务

```shell
kubectl get deployment

#输出如下
root@kubernetes-master:/usr/local/docker/nginx# kubectl get deployment
NAME               READY   UP-TO-DATE   AVAILABLE   AGE
nginx-deployment   2/2     2            2           48s
```



### 4. 映射服务，让用户可以访问

```shell
kubectl expose deployment nginx-deployment --port=80 --type=LoadBalancer

# 输出如下
root@kubernetes-master:/usr/local/docker/nginx# kubectl expose deployment nginx-deployment --port=80 --type=LoadBalancer
service/nginx-deployment exposed

```

### 5. 查看已发布的服务

```shell
kubectl get services

#输出如下
root@kubernetes-master:/usr/local/docker/nginx# kubectl get services
NAME               TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
kubernetes         ClusterIP      10.96.0.1      <none>        443/TCP        23h
# 由此可见，Nginx 服务已成功发布并将 80 端口映射为 31738
nginx-deployment   LoadBalancer   10.107.20.86   <pending>     80:32692/TCP   2m13s

```



### 6. 查看服务详情

```shell
#nginx-deployment 为服务名称
kubectl describe service nginx-deployment

#输出如下
root@kubernetes-master:/usr/local/docker/nginx# kubectl describe service nginx-deployment
Name:                     nginx-deployment
Namespace:                default
Labels:                   app=nginx
Annotations:              <none>
Selector:                 app=nginx
Type:                     LoadBalancer
IP:                       10.107.20.86
Port:                     <unset>  80/TCP
TargetPort:               80/TCP
NodePort:                 <unset>  32692/TCP
Endpoints:                172.16.8.129:80,172.16.8.130:80
Session Affinity:         None
External Traffic Policy:  Cluster
Events:                   <none>
```

### 7. 验证

通过浏览器访问 Master 服务器

```shell
http://192.168.1.113:32692/
```

此时 Kubernetes 会以负载均衡的方式访问部署的 Nginx 服务，能够正常看到 Nginx 的欢迎页即表示成功。容器实际部署在其它 Node 节点上，通过访问 Node 节点的 IP:Port 也是可以的。



## 3. 停止服务

### 1. 删除 deployment

```shell
kubectl delete deployment nginx-deployment

#输出如下
root@kubernetes-master:/usr/local/docker/nginx# kubectl delete deployment nginx-deployment
deployment.apps "nginx-deployment" deleted
```

### 2. 删除 services

deployment 中移除了 但是 services 中还存在，所以也需要一并删除。

```shell
kubectl delete service nginx-deployment

#输出如下
root@kubernetes-master:/usr/local/docker/nginx# kubectl delete service nginx-deployment
service "nginx-deployment" deleted
```

