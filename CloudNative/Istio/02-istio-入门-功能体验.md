# Istio 初体验

## 1. 示例

根据官方文档，安装Istio并运行示例 bookinfo 服务。

[入门](https://istio.io/latest/zh/docs/setup/getting-started)

[bookinfo 应用](https://istio.io/latest/zh/docs/examples/bookinfo)



先走完上述两个文档,然后本文后续 Demo 才能正常运行。



## 2. 配置请求路由

Istio 中主要通过更新 Virtual Service 配置进行流量切换。



**全部切换到V1**

就像下面这样:

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: productpage
spec:
  hosts:
  - productpage
  http:
  - route:
    - destination:
        host: productpage
        # 指定走 v1 版本
        subset: v1
```

把 productpage 服务切换到访问 v1 版本。



通过 kubectl apply 应用该规则，把所有服务全部指定为访问 v1 版本，使其生效。

```shell
kubectl apply -f samples/bookinfo/networking/virtual-service-all-v1.yaml
```

apply 后再次查看，确保规则生效了

```shell
kubectl get virtualservice reviews -o yaml
```



然后再次访问 bookinfo 项目，发现每次访问到的都是 v1 版本。

kiali dashbord 中看到的 graph 也全是 v1 版本。





**基于用户身份的路由**

同上，Istio 已经准备好了 对应的配置，直接应用即可

```shell
kubectl apply -f samples/bookinfo/networking/virtual-service-reviews-test-v2.yaml
```

这个虚拟服务具体配置如下：

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
    - reviews
  http:
  - match:
    - headers:
        end-user:
          exact: jason
    route:
    - destination:
        host: reviews
        subset: v2
  - route:
    - destination:
        host: reviews
        subset: v1
```

可以看到，如果是 jason 则会走 v2 版本，其他的全走 v1 版本。
测试：

* 点击以 jason 身份登录，刷新发现，出现了星级评分。

* 退出后再次刷新，星级评分消失了。

说明不同身份被路由到了不同的版本。

> 在此任务中，您首先使用 Istio 将 100% 的请求流量都路由到了 Bookinfo 服务的 `v1` 版本。然后设置了一条路由规则，它根据 `productpage` 服务发起的请求中的 `end-user` 自定义请求头内容，选择性地将特定的流量路由到了 `reviews` 服务的 `v2` 版本。



## 3. 故障注入

手动在 virtualservice中配置故障注入，以测试在故障情况下服务是否能正常运行。

### 模拟延迟

```shell
kubectl apply -f samples/bookinfo/networking/virtual-service-ratings-test-delay.yaml
```

完整 VirtualService 内容如下：

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: ratings
spec:
  hosts:
  - ratings
  http:
  # 对jason用户发起的请求，增加一个7s中的延迟
  - match:
    - headers:
        end-user:
          exact: jason
    fault:
      delay:
        percentage:
          value: 100.0
        fixedDelay: 7s
    route:
    - destination:
        host: ratings
        subset: v1
  - route:
    - destination:
        host: ratings
        subset: v1
```



### 模拟错误

也可以模拟错误，创建下面这个 VirtualService，对 jason 用户的访问 100% 概率返回 http code 500。

> 为了便于测试直接给的 100% 概率

```shell
kubectl apply -f samples/bookinfo/networking/virtual-service-ratings-test-abort.yaml
```

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: ratings
spec:
  hosts:
  - ratings
  http:
  - match:
    - headers:
        end-user:
          exact: jason
    # 或则直接返回httpStatus500
    fault:
      abort:
        percentage:
          value: 100.0
        httpStatus: 500
    route:
    - destination:
        host: ratings
        subset: v1
  - route:
    - destination:
        host: ratings
        subset: v1
```

测试：

* jason 访问会超时或直接报错
* 其他用户则能正常





## 4. 流量转移

通过不同的路由规则，可以让不同请求走不同的服务版本，这种基于权重的路由在发布新版本是就非常有用。

首先将 10% 流量切换到 v2 版本，剩下 90% 流量依旧走 v1 版本，不同版本区别如下：

* v1：review 只有分数
* v2：review 带星星评级

```bash
kubectl apply -f samples/bookinfo/networking/virtual-service-reviews-90-10.yaml
```

对应的 VirtualService 就像这样：

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
    - reviews
  http:
  - route:
    # 配置v1和v2版本流量比例
    - destination:
        host: reviews
        subset: v1
      weight: 90
    - destination:
        host: reviews
        subset: v3
      weight: 10
```



更新后如果新版本有问题则可以把流量回退到 v1 版本，若没问题则继续放大切换到 v2 版本的比例，直至全部流量切换到 v2 版本。

```bash
kubectl apply -f samples/bookinfo/networking/virtual-service-reviews-80-20.yaml
```



VirtualService 创建后，访问首页，多次刷新，偶尔能刷到 v2 版本,随着比例增加刷到新版本概率也逐渐增加。



### 和 k8s 流量管理的区别

注意，**流量迁移和使用容器编排平台的部署功能来进行版本迁移完全不同**：

* 后者使用了实例扩容来对流量进行管理。

* 使用 Istio，两个版本的 `reviews` 服务可以独立地进行扩容和缩容，而不会影响这两个服务版本之间的流量分发。

k8s 中的金丝雀发布是控制 Pod 数实现的，比如将 10％ 的流量发送到金丝雀版本（v2），v1 和 v2 的副本可以分别设置为 9 和 1。

> k8s service 是均匀转发到各个Pod，即最终比例和各个版本的Pod数比例一致。

在 Istio 则是通过控制流量路由来实现，v1 和 v2 的pod 数无关。

甚至只在部分用户中进行金丝雀发布：

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: helloworld
spec:
  hosts:
    - helloworld
  http:
    # 只有满足条件的用户才会进行金丝雀发布
    - match:
        - headers:
            cookie:
              regex: "^(.*?;)?(email=[^;]*@some-company-name.com)(;.*)?$"
      route:
        - destination:
            host: helloworld
            subset: v1
            weight: 50
        - destination:
            host: helloworld
            subset: v2
            weight: 50
    # 其他用户还是全部走的v1版本
    - route:
        - destination:
            host: helloworld
            subset: v1
```

[使用 Istio 进行金丝雀部署](https://istio.io/latest/zh/blog/2017/0.1-canary/)



## 5. 监控

Prometheus + Grafana 作为指标监控+可视化。

> [通过 Prometheus 查询度量指标](https://istio.io/latest/zh/docs/tasks/observability/metrics/querying-metrics/)
>
> [使用 Grafana 可视化指标](https://istio.io/latest/zh/docs/tasks/observability/metrics/using-istio-dashboard/)



## 6. 配置访问外部服务

服务网格中的所有出站流量都会重定向到其 Sidecar 代理，集群外部 URL 的可访问性取决于代理的配置。

默认情况下，Istio 将 Envoy 代理配置为允许传递未知服务的请求。

尽管这为入门 Istio 带来了方便，但是，通常情况下，配置更严格的控制是更可取的。

为了安全性，应该配置网格中只能访问某些指定的外部服务。



三种访问外部服务的方法：

* 1）允许 Envoy 代理将请求传递到未在网格内配置过的服务。
* 2）配置 [service entries](https://istio.io/latest/zh/docs/reference/config/networking/service-entry/) 以提供对外部服务的受控访问。
* 3）对于特定范围的 IP，完全绕过 Envoy 代理。



**Envoy 转发流量到外部服务**

Istio 安装时默认会允许 sidecar 转发全部请求外部服务的流量，通过以下命令查看：

```shell
kubectl get istiooperator installed-state -n istio-system -o jsonpath='{.spec.meshConfig.outboundTrafficPolicy.mode}'
```

如果输出是`ALLOW_ANY`或没有任何输出（默认为`ALLOW_ANY`）说明当前sidecar会转发全部访问外部的请求。

> 如果不是ALLOW_ANY 则用下面的命令更改
>
> ```shell
> istioctl install <flags-you-used-to-install-Istio> --set meshConfig.outboundTrafficPolicy.mode=ALLOW_ANY
> ```

从 `SOURCE_POD` 向外部 HTTPS 服务发出两个请求，确保能够得到状态码为 `200` 的响应：

```shell
kubectl exec "$SOURCE_POD" -c sleep -- curl -sSI https://www.baidu.com | grep  "HTTP/"; kubectl exec "$SOURCE_POD" -c sleep -- curl -sI https://www.sina.com | grep "HTTP/"
```

正常应该收到两个 200 ok。



这种访问外部服务的简单方法有一个缺点，即丢失了对外部服务流量的 Istio 监控和控制；比如，外部服务的调用没有记录到 Mixer 的日志中。



**控制对外部服务的访问**

使用 Istio `ServiceEntry` 配置，手动把外部服务注册到 Istio，这样就可以用到Istio的监控了。

就行网格内服务一样，可以通过VirtualService和DestinationRule进行控制：

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: ServiceEntry
metadata:
  name: svc-entry
spec:
  # 这个ServiceEntry表示我们可以放稳https://ext-svc.example.com就像访问网格内的服务一样
  # 因为访问外部的服务是会被限制的，而且访问外部服务用不到Istio的记录功能
  hosts:
    - ext-svc.example.com
  ports:
    - number: 443
      name: https
      protocol: HTTPS
  location: MESH_EXTERNAL
  resolution: DNS

---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: vc-entry
spec:
  hosts:
    - ext-svc.example.com
  http:
    - timeout: 3s
      route:
        - destination:
            host: ext-svc.example.com
          weight: 100
```



**直接访问外部服务**

如果要让特定范围的 IP 完全绕过 Istio，则可以配置 Envoy sidecars 让它们不[拦截](https://istio.io/latest/zh/docs/concepts/traffic-management/)外部请求。

> 这个和让 sidecar 放行请求不同，已经完全绕过 sidecar 了。

不推荐使用。

**小结**

从 Istio 网格调用外部服务的三种方法：

1. 配置 Envoy 以允许访问任何外部服务。
2. 使用 service entry 将一个可访问的外部服务注册到网格中。**这是推荐的方法**。
3. 配置 Istio sidecar 以从其重新映射的 IP 表中排除外部 IP。

第一种方法通过 Istio sidecar 代理来引导流量，包括对网格内部未知服务的调用。使用这种方法时，你将无法监控对外部服务的访问或无法利用 Istio 的流量控制功能。 要轻松为特定的服务切换到第二种方法，只需为那些外部服务创建 service entry 即可。 此过程使你可以先访问任何外部服务，然后再根据需要决定是否启用控制访问、流量监控、流量控制等功能。

第二种方法可以让你使用 Istio 服务网格所有的功能区调用集群内或集群外的服务。 在此任务中，你学习了如何监控对外部服务的访问并设置对外部服务的调用的超时规则。

第三种方法绕过了 Istio Sidecar 代理，使你的服务可以直接访问任意的外部服务。 但是，以这种方式配置代理需要了解集群提供商相关知识和配置。 与第一种方法类似，你也将失去对外部服务访问的监控，并且无法将 Istio 功能应用于外部服务的流量。





## 7. 可视化网格

默认安装了 Kiali 作为 Web 可视化界面。

> [可视化网格](https://istio.io/latest/zh/docs/tasks/observability/kiali/)

