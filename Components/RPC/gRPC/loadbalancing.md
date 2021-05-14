# gRPC 负载均衡

## 1. 概述

因为gRPC基于HTTP / 2构建，并且HTTP / 2设计为具有单个长期TCP连接，所有请求都在该TCP连接上进行*多路复用*-意味着多个请求可以在同一时间在同一连接上处于活动状态。

```sh
https://izsk.me/2020/01/17/grpc-service-on-kubernetes/
https://izsk.me/2020/02/18/grpc-gateway-loadbalance-on-kubernetes-and-istio/
https://pandaychen.github.io/2020/06/01/K8S-LOADBALANCE-WITH-KUBERESOLVER/
https://blog.nobugware.com/post/2019/kubernetes_mesh_network_load_balancing_grpc_services/
https://kubernetes.io/blog/2018/11/07/grpc-load-balancing-on-kubernetes-without-tears/
https://zhuanlan.zhihu.com/p/336676373
```



## 2. 方案



* 1）每次都重新建立连接，用完后关闭连接，直接从源头上解决问题。
  * ？？？这算什么方案
* 2）客户端负载均衡
* 3）服务端负载均衡







## 3. 客户端负载均衡

这也是比较容易实现的方案，具体为：[NameResolver](https://github.com/grpc/grpc/blob/master/doc/naming.md) + [load balancing policy](https://github.com/grpc/grpc/blob/master/doc/load-balancing.md)+[Headless-Service](https://kubernetes.io/docs/concepts/services-networking/service/#headless-services)。

当 gRPC 客户端想要与 gRPC 服务器进行交互时，它首先尝试通过向 resolver 发出名称解析请求来解析服务器名称，解析程序返回已解析IP地址的列表。

Kubernetes Headless-Service 在创建的时候会将该服务对应的每个 Pod IP 以 A 记录的形式存储。

常见的 gRPC 库都内置了几个负载均衡算法，比如 [gRPC-Go](https://github.com/grpc/grpc-go/tree/master/examples/features/load_balancing#pick_first) 中内置了`pick_first`和`round_robin`两种算法。

* pick_first：尝试连接到第一个地址，如果连接成功，则将其用于所有RPC，如果连接失败，则尝试下一个地址（并继续这样做，直到一个连接成功）。
* round_robin：连接到它看到的所有地址，并依次向每个后端发送一个RPC。例如，第一个RPC将发送到backend-1，第二个RPC将发送到backend-2，第三个RPC将再次发送到backend-1。



所以建立连接时只需要提供一个服务名即可，gRPC Client 会根据 DNS resolver 返回的IP列表分别建立连接，请求时使用round_robin算法进行负载均衡。

核心代码如下：

```go
	svc := "mygrpc:50051"
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	conn, err := grpc.DialContext(
		ctx,
		fmt.Sprintf("%s:///%s", "dns", svc),
		grpc.WithDefaultServiceConfig(`{"loadBalancingPolicy":"round_robin"}`), // 指定轮询负载均衡算法
		grpc.WithInsecure(),
		grpc.WithBlock(),
	)
	if err != nil {
		log.Fatal(err)
	}
```

主要是配置负载均衡算法：

```go
grpc.WithDefaultServiceConfig(`{"loadBalancingPolicy":"round_robin"}`)
```

> 网上很多比较旧的文章用的是`grpc.WithBalancerName("")`，在新版中依旧不推荐使用了。



### 存在的问题

当Pod扩缩容时 客户端可以感知到并更新连接吗？。

* Pod 缩容后，由于gRPC具有连接探活机制，会自动丢弃无效连接。

* Pod 扩容后，没有感知机制，导致后续扩容的Pod无法被请求到。

gRPC 连接默认能永久存活，如果将该值降低能改善这个问题。

在服务端做以下设置

```go
	port := conf.GetPort()
	lis, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer(grpc.KeepaliveParams(keepalive.ServerParameters{
		MaxConnectionAge:      time.Minute,
	}))
	pb.RegisterVerifyServer(s, core.Verify)
	log.Println("Serving gRPC on 0.0.0.0" + port)
	if err = s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
```

这样每分钟都会重新解析DNS并建立连接，相当于对扩容的感知只会延迟1分钟。



当然还有更好的方案，即使用第三方库：[kuberesolver](https://github.com/sercand/kuberesolver)。

通过在 client 端调用 Kubernetes API 监测Service对应的 endpoints 变化动态更新连接。

```go
// Import the module
import "github.com/sercand/kuberesolver/v3"
	
// Register kuberesolver to grpc before calling grpc.Dial
kuberesolver.RegisterInCluster()
// if schema is 'kubernetes' then grpc will use kuberesolver to resolve addresses
cc, err := grpc.Dial("kubernetes:///service.namespace:portname", opts...)
```

具体就是将 DNSresolver 替换成了自定义的kuberesolver。

同时如果 Kubernetes 集群中使用了 RBAC 授权的话需要给 client 所在Pod赋予 endpoint 资源的 get 和 watch 权限。

具体授权过程如下：

其中 apiVersion 可以通过以下命令进行查看：`kubectl api-versions`

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  namespace: vaptcha
  name: grpclb-sa
```



```yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: vaptcha
  name: grpclb-role
rules:
- apiGroups: [""]
  resources: ["endpoints"]
  verbs: ["get", "watch"]
```



```yaml
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: grpclb-rolebinding
  namespace: vaptcha
subjects:
- kind: ServiceAccount
  name: grpclb-sa
  namespace: vaptcha
roleRef:
  kind: Role
  name: grpclb-role
  apiGroup: rbac.authorization.k8s.io
```



创建对象

```sh
$ kubectl apply -f svc-account.yaml 
serviceaccount/example-sa created
$ kubectl apply -f role.yaml 
role.rbac.authorization.k8s.io/example-role created
$ kubectl apply -f role-binding.yaml 
rolebinding.rbac.authorization.k8s.io/example-rolebinding created
```





Pod 中指定权限:`serviceAccountName: grpclb-sa`

```yaml
apiVersion: v1
kind: Pod
metadata:
  namespace: mynamespace
  name: sa-token-test
spec:
  containers:
  - name: nginx
    image: nginx:1.7.9
  serviceAccountName: grpclb-sa
```



因为 kuberesolver 是直接调用 Kubernetes API 获取 endpoint 所以不需要创建 Headless Service 了，创建普通 Service 也可以。



## 4. 服务端负载均衡

todo 

## 5. 参考

`https://grpc.io/blog/grpc-load-balancing/`

`https://en.wikipedia.org/wiki/Round-robin_DNS`

`https://kubernetes.io/blog/2018/11/07/grpc-load-balancing-on-kubernetes-without-tears/`