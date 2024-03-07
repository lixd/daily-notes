# Istio 安装



## 1. Kubernetes 安装

可以使用 Minikube 快速搭建一个单节点的 K8s 获取直接用 Docker Desktop 提供的 K8s。

> [Minikube-官方文档](https://minikube.sigs.k8s.io/docs/start/)
>
> [Minikube-阿里云团队文档-适应国内网络环境](https://github.com/AliyunContainerService/minikube/wiki)

或者直接用 playground，比如[katacoda](https://www.katacoda.com/courses/kubernetes/playground)

> 试了下，体验不怎么好，操作起来太卡了



以下是安装过程中的常见问题：

**`minikube start`执行报错，提示不能用 root 账号：**

```shell
[root@zhangpeilei ~]# minikube start --driver=docker
😄  minikube v1.22.0 on Centos 7.8.2003 (amd64)
✨  Using the docker driver based on user configuration
🛑  The "docker" driver should not be used with root privileges.
💡  If you are running minikube within a VM, consider using --driver=none:
📘    https://minikube.sigs.k8s.io/docs/reference/drivers/none/

❌  Exiting due to DRV_AS_ROOT: The "docker" driver should not be used with root privileges.

```

解决方案:

```shell
# 强制安装
minikube start --force=true --driver=docker
```



**镜像下载慢**

解决方案：

指定使用阿里云镜像：

```shell
minikube start --image-mirror-country=cn
```

> 这样会走 dockerhub 镜像，还是慢的话可以配置 docker 镜像加速器。



k8s 安装好后，再安装一下 kubuctl 就算是完成了。

[Install and Set Up kubectl on Linux](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)





## 2. Istio 安装

具体见[官方文档](https://istio.io/latest/docs/setup/getting-started/)



### 下载 Istio

下载 Istio，可以去 [Istio release page](https://github.com/istio/istio/releases) 手动下载并解压，或者通过官方提供的脚本自动下载解压：

```shell
curl -L https://istio.io/downloadIstio | sh -
```



国内网络问题，脚本根本下载不动，只能手动下载。

```shell
version=1.20.0
wget https://github.com/istio/istio/releases/download/${version}/istio-${version}-linux-amd64.tar.gz
tar -zxvf istio-${version}-linux-amd64.tar.gz
# 进入istio
 lixd  ~/istio $ istio-1.12.1
 lixd  ~/istio/istio-1.12.1 $ l
total 40K
-rw-r--r--  1 lixd lixd  12K Dec  8 04:04 LICENSE
-rw-r--r--  1 lixd lixd 5.8K Dec  8 04:04 README.md
drwxr-x---  2 lixd lixd 4.0K Dec  8 04:04 bin
-rw-r-----  1 lixd lixd  827 Dec  8 04:04 manifest.yaml
drwxr-xr-x  5 lixd lixd 4.0K Dec  8 04:04 manifests
drwxr-xr-x 21 lixd lixd 4.0K Dec  8 04:04 samples
drwxr-xr-x  3 lixd lixd 4.0K Dec  8 04:04 tools
```

配置以下环境变量，便于使用。

```shell
export PATH=$PWD/bin:$PATH
```





### 安装 Istio

> 由于易用性的问题，Istio 废弃了以前的 Helm 安装方式，现在使用 istioctl 即可一键安装。

Istio 提供了以下配置档案（configuration profile）供不同场景使用，查看当前内置的 profile：

```shell
 lixd  ~/istio $ istioctl profile list
Istio configuration profiles:
    default
    demo
    empty
    external
    minimal
    openshift
    preview
    remote
```

具体每个 profile 包含哪些组件，可以使用`istioctl profile dump`命令查看：

```shell
$ istioctl profile dump demo
```



一键安装：

```shell
lixd  ~/istio $ istioctl install --set profile=demo
# 会打印出要安装的组件，询问是否继续 按 y 即可
This will install the Istio 1.12.1 demo profile with ["Istio core" "Istiod" "Ingress gateways" "Egress gateways"] components into the cluster. Proceed? (y/N) y
✔ Istio core installed
✔ Istiod installed
✔ Ingress gateways installed
✔ Egress gateways installed
✔ Installation complete
Making this installation the default for injection and validation.

Thank you for installing Istio 1.12.  Please take a few minutes to tell us about your install/upgrade experience!  https://forms.gle/FegQbc9UvePd4Z9z7
```

> 安装可能需要一些时间，耐心等待即可。



部署完成后，还有很重要的一步：

**给命名空间添加标签**，指示 Istio 在部署应用的时候，自动注入 Envoy 边车代理：

```shell
$ kubectl label namespace default istio-injection=enabled
namespace/default labeled
```

> 本质上该功能是利用的 Admission Controller + 自定义 WebHook 方式实现的。



### 查看

查看一下安装了写什么东西：

```shell
 lixd  ~/istio $ kubectl get ns
NAME                   STATUS   AGE
default                Active   9d
istio-system           Active   2m22s
kube-node-lease        Active   9d
kube-public            Active   9d
kube-system            Active   9d
kubernetes-dashboard   Active   9d
 lixd  ~/istio $ kubectl get pods -n istio-system
NAME                                    READY   STATUS    RESTARTS   AGE
istio-egressgateway-687f4db598-lqp4m    1/1     Running   0          2m47s
istio-ingressgateway-78f69bd5db-cvz6j   1/1     Running   0          2m47s
istiod-76d66d9876-rztzn                 1/1     Running   0          3m13s
```



CRD 情况

```shell
 lixd  ~/istio  kubectl get crds |grep istio
authorizationpolicies.security.istio.io    2022-01-08T07:28:51Z
destinationrules.networking.istio.io       2022-01-08T07:28:51Z
envoyfilters.networking.istio.io           2022-01-08T07:28:51Z
gateways.networking.istio.io               2022-01-08T07:28:51Z
istiooperators.install.istio.io            2022-01-08T07:28:51Z
peerauthentications.security.istio.io      2022-01-08T07:28:51Z
requestauthentications.security.istio.io   2022-01-08T07:28:51Z
serviceentries.networking.istio.io         2022-01-08T07:28:51Z
sidecars.networking.istio.io               2022-01-08T07:28:51Z
telemetries.telemetry.istio.io             2022-01-08T07:28:51Z
virtualservices.networking.istio.io        2022-01-08T07:28:51Z
wasmplugins.extensions.istio.io            2022-01-08T07:28:51Z
workloadentries.networking.istio.io        2022-01-08T07:28:51Z
workloadgroups.networking.istio.io         2022-01-08T07:28:51Z
```



API 资源

```shell
 ✘ lixd  ~/istio  kubectl api-resources |grep istio
wasmplugins                                    extensions.istio.io/v1alpha1           true         WasmPlugin
istiooperators                    iop,io       install.istio.io/v1alpha1              true         IstioOperator
destinationrules                  dr           networking.istio.io/v1beta1            true         DestinationRule
envoyfilters                                   networking.istio.io/v1alpha3           true         EnvoyFilter
gateways                          gw           networking.istio.io/v1beta1            true         Gateway
serviceentries                    se           networking.istio.io/v1beta1            true         ServiceEntry
sidecars                                       networking.istio.io/v1beta1            true         Sidecar
virtualservices                   vs           networking.istio.io/v1beta1            true         VirtualService
workloadentries                   we           networking.istio.io/v1beta1            true         WorkloadEntry
workloadgroups                    wg           networking.istio.io/v1alpha3           true         WorkloadGroup
authorizationpolicies                          security.istio.io/v1beta1              true         AuthorizationPolicy
peerauthentications               pa           security.istio.io/v1beta1              true         PeerAuthentication
requestauthentications            ra           security.istio.io/v1beta1              true         RequestAuthentication
telemetries                       telemetry    telemetry.istio.io/v1alpha1            true         Telemetry
```



### 验证

安装后可以验证是否安装正确。

```shell
# 先根据安装的profile导出manifest
$ istioctl manifest generate --set profile=demo > $HOME/generated-manifest.yaml
# 然后根据验证实际环境和manifest文件是否一致
$ istioctl verify-install -f $HOME/generated-manifest.yaml
# 出现下面信息则表示验证通过
✔ Istio is installed and verified successfully
```



### Dashboard

前面只安装了 Istio 的核心组件，这里把后续会用到的插件也一并安装了。

```shell
lixd  ~/istio/istio-1.12.1 $ kubectl apply -f samples/addons
 lixd  ~/istio/istio-1.12.1 $ kubectl rollout status deployment/kiali -n istio-system
Waiting for deployment "kiali" rollout to finish: 0 of 1 updated replicas are available...
deployment "kiali" successfully rolled out
```

访问 bashboard：

```shell
 lixd  ~/istio/istio-1.12.1 $ istioctl dashboard kiali
http://localhost:20001/kiali
```

> 该命令会自动打开浏览器，若失败则手动访问。



### 卸载 Istio

一键卸载 Istio 及删除所有相关资源：

```shell
$ istioctl x uninstall --purge
```



## 3. 部署 bookinfo 应用
官方提供了 bookinfo 应用来测试。



### 部署应用

```shell
$ kubectl apply -f samples/bookinfo/platform/kube/bookinfo.yaml
service/details created
serviceaccount/bookinfo-details created
deployment.apps/details-v1 created
service/ratings created
serviceaccount/bookinfo-ratings created
deployment.apps/ratings-v1 created
service/reviews created
serviceaccount/bookinfo-reviews created
deployment.apps/reviews-v1 created
deployment.apps/reviews-v2 created
deployment.apps/reviews-v3 created
service/productpage created
serviceaccount/bookinfo-productpage created
deployment.apps/productpage-v1 created
```

创建了应用对应的 service 和 deployment。

服务启动需要一定时间，可通过以下命令进行查看：

```shell
 lixd  ~/istio/istio-1.12.1 $ kubectl get services

NAME          TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
details       ClusterIP   10.105.174.225   <none>        9080/TCP   55s
kubernetes    ClusterIP   10.96.0.1        <none>        443/TCP    9d
productpage   ClusterIP   10.109.123.88    <none>        9080/TCP   55s
ratings       ClusterIP   10.107.249.180   <none>        9080/TCP   55s
reviews       ClusterIP   10.101.204.32    <none>        9080/TCP   55s
 lixd  ~/istio/istio-1.12.1 $ kubectl get pods

NAME                              READY   STATUS            RESTARTS   AGE
details-v1-79f774bdb9-gjsmm       2/2     Running           0          59s
productpage-v1-6b746f74dc-6xv6m   0/2     PodInitializing   0          59s
ratings-v1-b6994bb9-5qdvg         2/2     Running           0          59s
reviews-v1-545db77b95-7x2rj       0/2     PodInitializing   0          59s
reviews-v2-7bf8c9648f-tcp9q       0/2     PodInitializing   0          59s
reviews-v3-84779c7bbc-45b9m       0/2     PodInitializing   0          59s
```

等 pod 都启动后，通过以下命令测试应用是否正常启动了：

```shell
 lixd  ~/istio/istio-1.12.1 $ kubectl exec "$(kubectl get pod -l app=ratings -o jsonpath='{.items[0].metadata.name}')" -c ratings -- curl -s productpage:9080/productpage | grep -o "<title>.*</title>"
# 能显示出 title 则表示正常
<title>Simple Bookstore App</title>
```





### 部署网关

此时，BookInfo 应用已经部署，但还不能被外界访问。需要借助网关才行

```shell
 lixd  ~/istio/istio-1.12.1 $ kubectl apply -f samples/bookinfo/networking/bookinfo-gateway.yaml
# 这里部署了一个网关和一个虚拟服务
gateway.networking.istio.io/bookinfo-gateway created
virtualservice.networking.istio.io/bookinfo created
```



此时在浏览器中，输入`http://localhost/productpage`应该可以访问到具体页面了。