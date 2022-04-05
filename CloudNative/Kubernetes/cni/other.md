# CNI 

> [CNI简介](https://www.bilibili.com/video/BV1uL411A7KP)





cni 配置文件目录

```shell
/etc/cni/net.d
```





## 常见 CNI

CNI 有20多个实现了，不过我们也不可能每个都去学一遍，所以只需要了解几个主流的就行。

> 具体列表见 [https://www.cni.dev](https://www.cni.dev/docs/)



### [Flannel](https://github.com/flannel-io/flannel)

* Developed by CoreOS
* Simplest, oldest and most mature CNI, easy to install and configure
* Supports VXLAN, UDP and host-gw
* The default and recommended approach is to use VXLAN
* **Do not support Network Policy**



### [Calico](https://github.com/projectcalico/calico)

* Calico in 2020: The World's Most Popular Kubernetes Networking and Security solution
  https://www.tigera.io/blog/calico-in-2020-the-worlds-most-popular-kubernetes-cni/

* Reputation for being **reliable, flexible, and supporting high performance** networks
* Uses the **BGP** protocol to move network packets between nodes in its default configuration with IP in IP for encapsulation
* no additional encap, improves performance
* simplifies troubleshooting
* **Support Network Policy - based on iptables**
* Support integration with ISTIO
* **Calico is best known for its performance, flexibility, and power**



### [Cilium](https://github.com/cilium/cilium)

* Leverages **eBPF** to address the networking challenges of container workloads such as scalability, security and visibility
* Cilium capabilities include identity-aware security, multi-cluster routing, transparent encryption, API-aware visibility/filtering, and service-mesh acceleration
* **Network Policy - based on eBPF**
* Service & Load balancing
* Visibility: Flow & Policy logging
* Ops & Metrics
* Support integration with ISTIO
* Google adopted Cilium as GKE Dataplane V2



### 对比

#### VXLAN VS BGP

* VXLAN 有封包解包消耗，吞吐量不如 BGP
* 排查问题上， BGP 更简单，直接，VXLAN 还需要解包后才能分析



#### iptables VS eBPF

iptables 存在的问题：

* **规则匹配时延**：
  * 拿 Service 举例：每个 Kubernetes Service 的虚 IP 都会在 kube-services 下对应一条链。Iptables 的规则匹配是线性的，匹配的时间复杂度是 O(N)。
  * iptables 规则在 1W 条左右时匹配耗时毫秒级，就也还好
* **规则更新时延**
  * 首先，Iptables 的规则更新是全量更新，即使 --no--flush 也不行（--no--flush 只保证 iptables-restore 时不删除旧的规则链）。
  * 再者，kube-proxy 会周期性的刷新 Iptables 状态：先 iptables-save 拷贝系统 Iptables 状态，然后再更新部分规则，最后再通过 iptables-restore 写入到内核。当规则数到达一定程度时，这个过程就会变得非常缓慢。
  * 另外，时延还和系统当前内存使用量密切相关。因为 Iptables 会整体更新 Netfilter 的规则表，而一下子分配较大的内核内存（>128MB）就会出现较大的时延。
  * 5K service(40K 规则)，增加一条 iptables 规则，耗时 11min
  * 20K service(160K规则)，增加一条 iptables 规则，耗时 5h
* **可扩展性**
  * 我们知道当系统中的 Iptables 数量很大时，更新会非常慢。同时因为全量提交的过程中做了保护，所以会出现 kernel lock，这时只能等待。
* **可用性**
  *  服务扩容/缩容时， Iptables规则的刷新会导致连接断开，服务不可用。



> 参考文章：[华为云---在 K8S 大规模场景下 Service 性能如何优化？](https://bbs.huaweicloud.com/blogs/175469)



***那么 Iptables 的规则更新，究竟慢在哪里呢？***

出现如此高时延的原因有很多，在不同的内核版本下也有一定的差异。

* 首先，Iptables 的规则更新是全量更新，即使 --no--flush 也不行（--no--flush 只保证 iptables-restore 时不删除旧的规则链）。
* 再者，kube-proxy 会周期性的刷新 Iptables 状态：先 iptables-save 拷贝系统 Iptables 状态，然后再更新部分规则，最后再通过 iptables-restore 写入到内核。当规则数到达一定程度时，这个过程就会变得非常缓慢。
* 另外，时延还和系统当前内存使用量密切相关。因为 Iptables 会整体更新 Netfilter 的规则表，而一下子分配较大的内核内存（>128MB）就会出现较大的时延。



| Service基数         | 1    | 5000  | 20000  |
| ------------------- | ---- | ----- | ------ |
| Rules基数           | 8    | 40000 | 160000 |
| 增加1条iptables规则 | 50us | 11min | 5hour  |
| 增加1条IPVS规则     | 30us | 50us  | 70us   |

通过观察上图很容易发现：

• 增加 Iptables 规则的时延，随着规则数的增加呈“指数”级上升；

• 当集群中的 Service 达到 2 万个时，新增规则的时延从 50us 变成了 5 小时；

• 而增加 IPVS 规则的时延始终保持在 100us 以内，几乎不受规则基数影响。这中间的微小差异甚至可以认为是系统误差。





eBPF

简单理解就是 eBPF 可以根据配置的各种转发规则，直接在内核中生成对应代码，流量过来的时候执行一下这段代码即可。这样就省去了 iptables 的各种表各种链的匹配过程。

> eBPF 背后的思想其实就是：与其把数据包复制到用户空间执行用户态程序过滤，不如把过滤程序灌进内核去,直接在内核完成过滤。



### 小结

Flannel 作为第一个出现的 CNI， 最简单也最稳定，不过有两个缺点：

* VXLAN 实现有性能损耗
* 不支持 Network Policy

所以现在用的不多，不过也可以学习入门。

现在比较主流的是 Calico，使用 BGP 实现，性能上更好，而且也支持 Network Policy。

最后 Cilium 属于是后起之秀，也支持 Network Policy，另外采用的是 eBPF，性能上可能更上一层楼，是 Calico 的强力竞争对手。

> 国外的 Google GKE 就是采用的 Cilium，国内腾讯也是用的 Cilium。





## Benchmark

> 完整测试结果见：[Benchmark results of Kubernetes network plugins (CNI) over 10Gbit/s network (Updated: August 2020)](https://itnext.io/benchmark-results-of-kubernetes-network-plugins-cni-over-10gbit-s-network-updated-august-2020-6e1b757b9e49)

汇总结果如下：

![](https://www.tigera.io/app/uploads/2020/11/CNI-benchmark-comparison_Aug2020.png)





Cilium VS Calico :[CNI Benchmark: Understanding Cilium Network Performance](https://cilium.io/blog/2021/05/11/cni-benchmark)









## 转发流程



查看Node分配的网段

```shell
kubectl get node node01 -o yaml | grep -i cidr -C 10
kubectl get node node01 -o json | jq '.spec.podCIDR'
```



然后具体的网段就是在初始化集群的时候收到指定的了。

```shell
sudo kubeadm init \
-- opiserver- advertise-address: $IP \
--imoge-repository registry ，aliyuncs. com/ google containers \
--service-cidr-10.96.0.0/12 \
-- pod-networl-cidr 10.244.0.0/16 \
--apiserver.cert-extro-sans=master
```

然后最终指定的这个网段信息会存在 kube-controller-manager.yaml 文件中：

```shell
cat /etc/kubernetes/manifests/kube-controller-manager.yaml
```

也可以通过查日志的方式找到网段

```shell
cat /var/log/calico/cni/cni.log
```





容器中的网卡名字`eth0@if7`具体含义：

* eth0：这块网卡的名字
* if7：表示该网卡和外部宿主机上的 7 号设备关联



宿主机会开启一个 Proxy ARP，给容器中发起的 ARP 一个假的回复，然后容器收到宿主机回复的 MAC 地址后就封包然后把数据发到这个MAC地址，实际上是由宿主机来收到这个包，然后进行后续处理。

