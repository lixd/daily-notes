# 基于extended-resource扩展节点资源

### 扩展资源

扩展资源是 kubernetes.io 域名之外的标准资源名称。它们使得集群管理员能够颁布非 Kubernetes 内置资源，而用户可以使用他们。

自定义扩展资源无法使用 kubernetes.io 作为资源域名



### 管理扩展资源

节点级扩展资源

* 节点级扩展资源绑定到节点

设备插件管理的资源
* 发布在各节点.上由设备插件所管理的资源，如GPU,智能网卡等



### 为节点配置资源

* 集群操作员可以向 API 服务器提交 PATCH HTTP 请求，以在集群中节点的 status.capacity 中为其配置可用数量。
* 完成此操作后，节点的 status.capacity 字段中将包含新资源。
* kubelet 会异步地对 status.allocatable 字段执行自动更新操作，使之包含新资源。
* 调度器在评估 Pod 是否适合在某节点上执行时会使用节点的 status.allocatable 值，在更新节点容量使之包含新资源之后和请求该资源的第一个 Pod 被调度到该节点之间，可能会有短暂的延迟。

```bash
curl --key admin.key --cert admin.crt --header "Content-Type: application/json-patch+json" \
--request PATCH -k \
--data '[{"op": "add", "path": "/status/capacity/cncamp.com~1reclaimed-cpu", "value": "2"}]' \
https://192.168.34.2:6443/api/v1/nodes/cadmin/status
```



### 使用扩展资源

向内置资源一样设置 resources.request 和 resources.limit 即可。

```yaml
    spec:
      containers:
        - name: nginx
          image: nginx
          resources:
            limits:
              cncamp.com/reclaimed-cpu: 3
            requests:
              cncamp.com/reclaimed-cpu: 3
```

需要注意的是：扩展资源是不支持驱逐策略的。



### 集群层面的资源扩展

可选择由默认调度器管理资源，默认调度器像管理其他资源一样管理扩展资源

* Request 与 Limit 必须一致，因为 Kubernetes 无法确保扩展资源的超售

更常见的场景是，由调度器扩展程序(Scheduler Extenders)管理，这些程序处理资源消耗和资源配额

* 修改调度器策略配置 ignoredByScheduler 字段可配置调度器不要检查自定义资源



```yaml
{
"kind": "Policy",
"apiVersion": "v1",
"extenders":[
{
    "urlPrefix": "<extender-endpoint>",
    "bindVerb": "bind",
    "managedResources":[
        {
            "name" : "example. com/ foo",
            "ignoredByScheduler": true
        }
    ]
  }
 }
}
```





**比如一个系统中，白天用户业务请求量大，大部分节点资源都被消耗了，到了晚上请求量降低后，大部分资源又空闲出来了，但是 Pod 启动的时候 request 了比较高的值，导致其他 Pod 其实也无法调度上去。**

如何解决该场景下的资源浪费问题？

方案一：让业务 Pod 降低 request，这样可能会导致业务 Pod 不够稳定，request 资源少了，如果请求量上来可能资源就不够了。

方案二：在晚上把节点上空闲的资源添加成扩展资源，让 Job 来消耗这些扩展资源，这样白天业务 Pod 占用量大的时候控制器自动把扩展资源调小，能跑到该 Pod 上的 Job 就少，等闲置时大量 Job 就可以再这些 Node 上运行了。

> 怎么优点闲时流量包的味道，不过这个是动态的。

例如：云服务器有一个**竞价购买**方式，谁给钱高谁就能运行，当有更高的出价时你的服务立马会被驱逐，不能保证这个实例你可以一直持有。

为什么会有这种模式呢？

因为云产商需要保证高可用，每个可用区必须有部分闲置节点，以便在用户购买的节点出问题时能立马替换上去，或者用户扩容时能有新节点补充，而这部分闲置节点空着也是空着，不如搞个竞价模式还是产生一点价值。

> 竞价模式可以任意驱逐，因此有用户的节点出现问题时或扩容时，直接从竞价区腾一台服务器过去就可以了。

