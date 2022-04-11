# 自定义 dns 服务

> [官方文档-dns-custom-nameservers/](https://kubernetes.io/zh/docs/tasks/administer-cluster/dns-custom-nameservers/)



从 Kubernetes v1.12 开始，CoreDNS 是推荐的 DNS 服务器。



## CoreDNS

CoreDNS 是模块化且可插拔的 DNS 服务器，每个插件都为 CoreDNS 添加了新功能。 可以通过维护 [Corefile](https://coredns.io/2017/07/23/corefile-explained/)（CoreDNS 配置文件），来定制其行为。 集群管理员可以修改 CoreDNS Corefile 的 ConfigMap，以更改服务发现的工作方式。

配置文件格式如下：

```yamnl
ZONE:[PORT] {
    [PLUGIN]...
}
```

* **ZONE** defines the zone this server. The optional **PORT** defaults to 53
* **PLUGIN** defines the [plugin(s)](https://coredns.io/plugins) we want to load



在 Kubernetes 中，CoreDNS 配置使用 ConfigMap 存储，默认 Corefile 配置如下：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: coredns
  namespace: kube-system
data:
  Corefile: |
    .:53 {
        errors
        health {
            lameduck 5s
        }
        ready
        kubernetes cluster.local in-addr.arpa ip6.arpa {
           pods insecure
           fallthrough in-addr.arpa ip6.arpa
           ttl 30
        }
        prometheus :9153
        forward . /etc/resolv.conf
        cache 30
        loop
        reload
        loadbalance
    } 
```

`.:53`：`.`表示这是 root 域，然后端口号是 53。

花括号里的就是 CoreDNS 加载的插件：

- [errors](https://coredns.io/plugins/errors/)：错误记录到标准输出。
- [health](https://coredns.io/plugins/health/)：在 http://localhost:8080/health 处提供 CoreDNS 的健康报告。
- [ready](https://coredns.io/plugins/ready/)：在端口 8181 上提供的一个 HTTP 末端，当所有能够 表达自身就绪的插件都已就绪时，在此末端返回 200 OK。
- [kubernetes](https://coredns.io/plugins/kubernetes/)：CoreDNS 将基于 Kubernetes 的服务和 Pod 的 IP 答复 DNS 查询。你可以在 CoreDNS 网站阅读[更多细节](https://coredns.io/plugins/kubernetes/)。 你可以使用 `ttl` 来定制响应的 TTL。默认值是 5 秒钟。TTL 的最小值可以是 0 秒钟， 最大值为 3600 秒。将 TTL 设置为 0 可以禁止对 DNS 记录进行缓存。
  - `pods insecure` 选项是为了与 kube-dns 向后兼容。你可以使用 `pods verified` 选项，该选项使得 仅在相同名称空间中存在具有匹配 IP 的 Pod 时才返回 A 记录。如果你不使用 Pod 记录，则可以使用 `pods disabled` 选项。

- [prometheus](https://coredns.io/plugins/prometheus/)：CoreDNS 的度量指标值以 [Prometheus](https://prometheus.io/) 格式在 http://localhost:9153/metrics 上提供。
- [forward](https://coredns.io/plugins/forward/): 不在 Kubernetes 集群域内的任何查询都将转发到 预定义的解析器 (/etc/resolv.conf).
- [cache](https://coredns.io/plugins/cache/)：启用前端缓存。
- [loop](https://coredns.io/plugins/loop/)：检测到简单的转发环，如果发现死循环，则中止 CoreDNS 进程。
- [reload](https://coredns.io/plugins/reload)：允许自动重新加载已更改的 Corefile。 编辑 ConfigMap 配置后，请等待两分钟，以使更改生效。
- [loadbalance](https://coredns.io/plugins/loadbalance)：这是一个轮转式 DNS 负载均衡器， 它在应答中随机分配 A、AAAA 和 MX 记录的顺序。





## forward 插件

CoreDNS 能够使用 [forward 插件 ](https://coredns.io/plugins/forward/)配置存根域和上游域名服务器。

如果集群操作员在 10.150.0.1 处运行了 [Consul](https://www.consul.io/) 域名服务器， 且所有 Consul 名称都带有后缀 `.consul.local`。要在 CoreDNS 中对其进行配置， 集群管理员可以在 CoreDNS 的 ConfigMap 中创建加入以下字段。

```conf
consul.local:53 {
        errors
        cache 30
        forward . 10.150.0.1
    }
```

这样以`consul.local`为后缀的域名解析都会转发到 10.150.0.1,也就是 Consul 域服务器。

如果要显式强制所有非集群 DNS 查找通过特定的域名服务器（位于 172.16.0.1），可将 `forward` 指向该域名服务器，而不是 `/etc/resolv.conf`。

```
forward .  172.16.0.1
```