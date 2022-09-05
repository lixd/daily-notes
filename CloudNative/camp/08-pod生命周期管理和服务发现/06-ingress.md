# Ingress

### k8s 中的负载均衡技术

基于L4 的服务

* 基于 iptables/ipvs 的分布式四层负载均衡技术
* 多种 Load Balancer Provider 提供与企业现有 ELB 的整合
* kube- proxy 基于 iptables rules 为 Kubernetes 形成全局统一的 distributed load balancer
* kube- proxy 是一种 mesh, Internal Client 无论通过 podip, nodeport还 是 LB VIP 都经由 kube-proxy 跳转至 pod
* 属于 Kubernetes core

基于L7 的 Ingress

* 基于七层应用层,提供更多功能
* TLS termination
* L7 path forwarding
* URL/http header rewrite
* 与采用 7 层软件紧密相关



### Service 和 Ingress 对比

基于 L4 的服务

* 每个应用独占 ELB,浪费资源
* 为每个服务动态创建 DNS 记录，频繁的 DNS 更新
* 支持 TCP 和 UDP，业务部门需要启动 HTTPS 服务，自己管理证书

基于 L7 的 Ingress

* 多个应用共享 ELB，节省资源
* 多个应用共享一个Domain,可采用静态 DNS 配置
* TLS termination 发生在 Ingress 层，可集中管理证书
* 更多复杂性，更多的网络 hop
  
  

![](D:/Home/17x/Projects/daily-notes/CloudNative/camp/08-pod生命周期管理和服务发现/assets/service&Ingress.png)



### Ingress

Ingress

* Ingress 是一层代理
* 负责根据 hostname 和 path 将流量转发到不同的服务上，使得一个负载均衡器用于多个后台应
* Kubernetes Ingress Spe c是转发规则的集合

Ingress Controller

* 确保实际状态( Actual)与期望状态(Desired) 一致的Control Loop
* Ingress Controller确保
  * 负载均衡配置
  * 边缘路由配置
  * DNS配置



拿 Nginx Ingress 举例。

Ingress Controller  的作用就是监听集群中的 ingress 对象配置，并生成 nginx.conf 配置文件，然后调用 nginx reload 命令重新加载配置文件。

