# k8s 中的 dns 策略

> [官方文档-dns-pod-service](https://kubernetes.io/zh/docs/concepts/services-networking/dns-pod-service/)
>
> [从一次k8s容器内域名解析失败学习k8s的DNS策略](https://www.jianshu.com/p/9b34ee879bcb)
>
> [一文搞懂 Kubernetes 如何实现 DNS 解析](https://www.modb.pro/db/45521)





## resolv.conf

k8s上运行的容器，其域名解析和一般的Linux一样，都是根据 `/etc/resolv.conf` 文件进行解析。

> pod 中的 /etc/resolv.conf 由 kubelet 写入。



下面看一个开发环境某一个 pod 的`resolv.conf`内容：

```bash
$ cat nginx.yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  containers:
  - name: nginx
    image: nginx:1.20
$ kubectl apply -f nginx.yaml
```



```bash
[root@k8s-master ~]# kubectl exec -it nginx -- cat /etc/resolv.conf
search default.svc.cluster.local svc.cluster.local cluster.local
nameserver 10.96.0.10
options ndots:5
```



其中的 nameserver  指定了 Pod 的 DNS  服务器 IP 为 10.96.0.10。实际上这个 IP 就是 k8s 集群中的 dns 组件的 ServiceIP。

```bash
[root@k8s-master ~]# kubectl get svc -n kube-system
NAME       TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)                  AGE
kube-dns   ClusterIP   10.96.0.10   <none>        53/UDP,53/TCP,9153/TCP   32h
```

也就是说这个域名会被转发给 kube-dns 进行解析。

> 一般使用的都是 coredns



### FQDN

然后我们需要了解一个概念：**FQDN（Fully qualified domain name），完整域名**。

一般来说如果一个域名以`.`结束，就表示一个完整域名。比如：

* `www.abc.xyz.`就是一个`FQDN`，
* 而`www.abc.xyz`则不是`FQDN`。



### search 域

了解了这个概念之后我们就来看`search`和`options ndots`。

如果域名是 FQDN 则直接转发给 DNS 服务器进行解析。

如果不是则会根据 search 域进行组合，形成 FQDN 再转发给 DNS 服务器进行解析。

比如访问`abc.xyz`这个域名，因为它并不是一个`FQDN`，所以它会优先和`search`域中的值进行组合而变成一个`FQDN`，然后再去查询，以上文的`resolv.conf`为例，这域名会这样组合：

```css
abx.xyz.default.svc.cluster.local.
abc.xyz.svc.cluster.local.
abc.xyz.cluster.local.
abc.xyz. # 最后也会将原域名加个.不全为 FQDN
```

> pod 中的 /etc/resolv.conf 由 kubelet 写入。

而`ndots`是用来表示一个域名中`.`的个数在不小于该值的情况下会被认为是一个`FQDN`。

> 简单说这个属性用来判断一个不是以`.`结束的域名在什么条件下会被认定为是一个`FQDN`。

在这个`resolv.conf`中`ndots`为5，也就是说如果一个域名中`.`的数量大于等于5，即使域名不是以`.`结尾，也会被认定为是一个`FQDN`。

比如：

* 域名是`abc.def.ghi.jkl.mno.pqr`这个域名包含 5 个`.`即使没有以`.`结尾也算做`FQDN`，
* 而`abc.def.ghi.jkl.mno`只有 4 个 `.` 则不是`FQDN`。



**为什么在 k8s 内部只通过 service 名字就可以访问到对应的服务？**

之所以会有`search`域主要还是为了方便k8s内部服务之间的访问。

比如：k8s 在同一个`namespace`下是可以直接通过服务名称进行访问的，其原理就是会在`search`域查找，比如上面的`resolv.conf`中的一个 search 域`default.svc.cluster.local`中的 `default`其实就是当前 pod 所在的`namespace`的名称。

所以通过服务名称访问的时候，会和`search`域进行组合，这样最终域名会组合成`servicename.namespace.svc.cluster.local`。

而如果是跨`namespace`访问，则可以通过`servicename.namespace`这样的形式，在通过和`search`域组合，依然可以得到`servicename.namespace.svc.cluster.local`。



### ndots 设置

ndots 值设置比较大的时候，很多域名都不满足该条件，因此都不会被判断为 FQDN，最终 DNS 解析时都需要去和 search 域组合，导致一个域名就会产生多次 DNS 请求。

比如`/etc/resolv.conf`文件如下：

```yaml
search default.svc.cluster.local svc.cluster.local cluster.local
nameserver 10.96.0.10
options ndots:5
```

访问`www.baidu.com`的时候，由于不是 FQDN，因此会和 search 域组合后再查询:

```bash
www.baidu.com.default.svc.cluster.local.
www.baidu.com.svc.cluster.local.
www.baidu.com.cluster.local.
www.baidu.com.
```

这样一个域名就产生了 4 次 DNS 请求，而且很明显这组合出来的前面 3 个域名都是不存在的，白白增加了 DNS 解析压力。

使用建议：

* 1）如果内部服务之间请求十分频繁, 也就是我们需要经常访问`xxx.svc.cluster.local`这样的域名, 那么可以保持 ndots 较大
* 2）但是内部服务之间请求比较少时, 强烈建议调小 ndots, 以减少无用流量的产生, 减轻 dns 服务器的压力，建议改成 2 就好。



## dns 策略

k8s 中为 pod 提供了 4 个 dns 策略：

- **Default**： Pod 从运行所在的节点继承名称解析配置。
  - 就是根据宿主机的 dns 配置去解析。
- **ClusterFirst**：与配置的集群域后缀不匹配的任何 DNS 查询（例如 "www.kubernetes.io"） 都将转发到从节点继承的上游名称服务器。集群管理员可能配置了额外的存根域和上游 DNS 服务器。 
  - 这个是默认值。
- **ClusterFirstWithHostNet**：对于以 hostNetwork 方式运行的 Pod，应显式设置其 DNS 策略 "`ClusterFirstWithHostNet`"。
- **None**： 此设置允许 Pod 忽略 Kubernetes 环境中的 DNS 设置。Pod 会使用其 `dnsConfig` 字段 所提供的 DNS 设置。
  - 为 pod 自定义 dns 配置



### dnsConfig

`dnsConfig` 字段是可选的， 但是，当 Pod 的 `dnsPolicy` 设置为 "`None`" 时，必须指定 `dnsConfig` 字段。

> 为 none 时还指定 pod 就没办法进行 dns 解析了。

具有自定义 DNS 设置的 Pod 如下：

```yaml
apiVersion: v1
kind: Pod
metadata:
  namespace: default
  name: dns-example
spec:
  containers:
    - name: test
      image: nginx
  dnsPolicy: "None"
  dnsConfig:
    nameservers:
      - 1.2.3.4
    searches:
      - ns1.svc.cluster-domain.example
      - my.dns.search.suffix
    options:
      - name: ndots
        value: "2"
      - name: edns0
```

对于 Pod DNS 配置，Kubernetes 默认允许最多 6 个 搜索域（ Search Domain） 以及一个最多 256 个字符的搜索域列表。

如果启用 kube-apiserver 和 kubelet 的特性门控 `ExpandedDNSConfig`，Kubernetes 将可以有最多 32 个 搜索域以及一个最多 2048 个字符的搜索域列表。

> ExpandedDNSConfig：Kubernetes 1.22 [alpha]





## 小结

pod 同样依靠`/etc/resolv.conf`文件进行 DNS 解析，该文件由 kubelet 在创建 pod 时写入。

`/etc/resolv.conf`中指定的 nameserver 指向 kube-dns 这个 service，即最终指向 DNS 解析的服务器就是 kube-dns。

> 当前一般实现为 coredns

因为 search 域的存在，所以可以通过 service 名字访问同 namespace 下的 service。

可以为 pod 配置 dns 策略，以实现特殊需求。
