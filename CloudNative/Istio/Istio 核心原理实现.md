# Istio 小结

Istio 主要实现流量管理，解决微服务架构下的服务通信问题。



## 1. 自动注入

主要实现为在 业务Pod中注入 Istio Sidecar 容器以接管整个集群中的全部流量。

> 自动注入功能依赖于 K8s 的 Admission Controller + 自定义 WebHook

具体为 kubectl apply 提交一个 deployment.yaml 给 api server 之前，Istio 修改了我们提交的 yaml 文件，在 Pod 中增加了自己的 sidecar 容器相关描述，这样就完成了注入。

Istio 给应用 Pod 注入的配置主要包括：

- Init 容器 istio-init ：用于 pod 中设置 iptables 端口转发
- Sidecar 容器 istio-proxy ：运行 sidecar 代理，如 Envoy 或 MOSN



Istio 注入后的 deployment.yaml，containers 部分内容截取：

```yaml
  containers:
      - image: docker.io/istio/examples-bookinfo-productpage-v1:1.15.0 # 应用镜像
        name: productpage
        ports:
        - containerPort: 9080
      - args:
        - proxy
        - sidecar
        - --domain
        - $(POD_NAMESPACE).svc.cluster.local
        - --configPath
        - /etc/istio/proxy
        - --binaryPath
        - /usr/local/bin/envoy
        - --serviceCluster
        - productpage.$(POD_NAMESPACE)
        - --drainDuration
        - 45s
        - --parentShutdownDuration
        - 1m0s
        - --discoveryAddress
        - istiod.istio-system.svc:15012
        - --zipkinAddress
        - zipkin.istio-system:9411
        - --proxyLogLevel=warning
        - --proxyComponentLogLevel=misc:error
        - --connectTimeout
        - 10s
        - --proxyAdminPort
        - "15000"
        - --concurrency
        - "2"
        - --controlPlaneAuthPolicy
        - NONE
        - --dnsRefreshRate
        - 300s
        - --statusPort
        - "15020"
        - --trust-domain=cluster.local
        - --controlPlaneBootstrap=false
        image: docker.io/istio/proxyv2:1.5.1 # sidecar proxy
        name: istio-proxy
        ports:
        - containerPort: 15090
          name: http-envoy-prom
          protocol: TCP
      initContainers:
      - command:
        - istio-iptables
        - -p
        - "15001"
        - -z
        - "15006"
        - -u
        - "1337"
        - -m
        - REDIRECT
        - -i
        - '*'
        - -x
        - ""
        - -b
        - '*'
        - -d
        - 15090,15020
        image: docker.io/istio/proxyv2:1.5.1 # init 容器
        name: istio-init
```

可以看到，注入了一个 InitContainers，而且启动命令是：

```shell
$ istio-iptables -p 15001 -z 15006 -u 1337 -m REDIRECT -i '*' -x "" -b '*' -d 15090,15020
```

很明显，是在配置 iptables。

根据 [Dockerfile](https://github.com/istio/istio/blob/master/pilot/docker/Dockerfile.proxyv2) 可知具体启动命令如下：

```dockerfile
# 前面的内容省略
# The pilot-agent will bootstrap Envoy.
ENTRYPOINT ["/usr/local/bin/pilot-agent"]
```

具体参数解析部分源码见[这里](https://github.com/istio/istio/blob/master/tools/istio-iptables/pkg/cmd/root.go#L362-L438)

大致含义为：拦截 Pod 的所有进出流量(15090,15020这两个端口的除外)，入站流量转发到 15006端口，出站流量转发到 15001 端口。

至此，Istio 已经成功拦截了 网格中的所有流量。

## 2. 自定义资源



Isito  抽象出了 Virtual Service，DestinationRule 等对象。

需要注意的是在 Istio 中创建这些对象并不像 K8s 中的 deployment 等对象一样，会启动一些 Pod，更多的只是一个逻辑上的对象，类似于一个配置文件。

所以 创建 Virtual Service 并不是真的在 K8s 上运行了一个虚拟服务，而是创建了一个资源。可以看成是 Istio 借助 CRD 来管理这些配置文件。

> Istio 没有使用自己的存储，而是共用的 k8s 中的 etcd，但是这个 etcd 并不能直接写数据，只能自定义 CRD，通过 k8s apiserver来操作，这样也能复用 k8s 中的查询展示和管理等功能。