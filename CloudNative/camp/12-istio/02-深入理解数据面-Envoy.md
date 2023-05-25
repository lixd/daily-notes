## 深入理解数据面 Envoy

### 主流七层代理比较

|                     | Envoy                                                        | Ngnix                                                        | HA Proxy                     |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ---------------------------- |
| HTTP/2              | 对HTTP/2有最完整的支持，同时upstream和downstream HTTP/2      | 从1.9.5开始有限支持HTTP/2，只在 upstream 支持 HTTP/2,downstream 依然是 HTTP/1.1 | 不支持HTTP/2                 |
| Rate Limit          | 通过插件支持限流                                             | 支持基于配置的限流，只支持基于源IP的限流                     |                              |
| ACL                 | 基于插件实现四层ACL                                          | 基于源/目标地址实现ACL                                       |                              |
| Connection draining | 支持 hot reload,并且通过 share memory 实现 connection draining 的功能 | Nginx Plus收费版支持connection draining                      | 支持热启动，但不保证丢弃连接 |



### Envoy 的优势

**性能**

* 在具备大量特性的同时，Envoy提供极高的吞吐量和低尾部延迟差异，而CPU和RAM消耗
  却相对较少。

**可扩展性**

* Envoy在L4和L7都提供了丰富的可插拔过滤器能力，使用户可以轻松添加开源版本中没有的功能。

**API可配置性**

* Envoy提供了一组可以通过控制平面服务实现的管理 API。如果控制平面实现所有的 API,则可以使用通用引导配置在整个基础架构上运行 Envoy。所有进一步的配置更改通过管理服务器以无缝方式动态传送，因此 Envoy 从不需要重新启动。这使得 Envoy 成为通用数据平面,当它与一个足够复杂的控制平面相结合时，会极大的降低整体运维的复杂性。



### Envoy 线程模型

* **Envoy采用单进程多线程模式:**
  * 主线程负责协调;
  * 子线程负责监听过滤和转发。

* 当某连接被监听器接受，那么该连接的全部生命周期会与某线程绑定。
* Envoy 基于非阻塞模式(Epoll) 。
* **建议 Envoy 配置的 worker 数量与 Envoy 所在的硬件线程数一致。**




### Envoy 架构

![](D:\Home\17x\Projects\daily-notes\CloudNative\camp\12-istio\assets\envoy-arch.png)







### v1 API 的缺点和 v2 的引入

**v1 API仅使用JSON/REST,本质上是轮询**。这有几个缺点:

* 尽管Envoy在内部使用的是JSON模式，但API本身并不是强类型，而且安全实现它们的通用服务器也很难。
* 虽然轮询工作在实践中是很正常的用法，但更强大的控制平面更喜欢streaming API,当其就绪后，可以将更新推送给每个Envoy。这可以将更新传播时间从30-60秒降低到250-500毫秒，即使在极其庞大的部署中也是如此。

**v2 API具有以下属性**

* 新的 API 模式使用 proto3 指定,并同时以 gRPC 和 REST + JSON/YAML 端点实现。
* 它们被定义在一个名为 envoy-api 的新的专用源代码仓库中。proto3 的使用意味着这些 API 是强类型的，同时仍然通过 proto3 的JSON/YAML 表示来支持 JSON/YAML 变体。
* 专用存储仓库的使用意味着项目可以更容易的使用API并用gRPC支持的所有语言生成存根(实际上,对于希望使用它的用户，我们将继续支持基于 REST 的 JSON/YAML 变体)。





### xDS - Envoy的发现机制

**Endpoint Discovery Service (EDS)**

* 这是 v1 SDS API 的替代品。此外, gRPC的双向流性质将允许将负载/健康信息报告回管理服务器，为将来的全局负载均衡功能开启门。

**Cluster Discovery Service (CDS)**

* 和v1没有实质性变化。

**Route Discovery Service (RDS)**

* 和v1没有实质性变化。

**Listener Discovery Service (LDS)**

* 和 v1 的唯一主要变化是：现在允许监听器定义多个并发过滤栈,这些过滤栈可以基于一-组监听器路由规则(例如，SNI,源/目的地IP匹配等)来选择。这是处理“原始目的地”策略路由的更简洁的方式，这种路由是透明数据平面解决方案(如lstio)所需要的。

**Secret Discovery Service (SDS)**

一个专用的API来传递TLS密钥材料。这将解耦通过LDS/CDS发送主要监听器、集群配置和通过专用密钥管理系统发送秘钥素材。

**Health Discovery Service (HDS)**

* 该 API 将允许 Envoy 成为分布式健康检查网络的成员。中央健康检查服务可以使用一组 Envoy 作为健康检查终点并将状态报告回来，从而缓解 N^2 健康检查问题，这个问题指的是其间的每个 Envoy 都可能需要对每个其他 Envoy 进行健康检查。

**Aggregated Discovery Service (ADS)**

* 总的来说，Envoy 的设计是最终一致的。这意味着默认情况下，每个管理 API 都并发运行，并且不会相互交互。在某些情况下，一次一个管理服务器处理单个 Envoy 的所有更新是有益的(例如，如果需要对更新进行排序以避免流量下降)。此 API 允许通过单个管理服务器的单个 gRPC 双向流对所有其他 API 进行编组，从而实现确定性排序。





LDS 用于发现监听哪些端口，比如 80 端口，而 RDS 则是路由信息，一个端口下的服务根据不同url会进行不同的路由跳转。

CDS 可以简单理解为 k8s 里的 service，而 EDS 则是每个 service 里的 endpoint。

ADS 用于将 N 个 xDS 的信息聚合后一起下发，以提升效率。

> EDS 除外，因为 EDS 比较独立而且比较轻量





### Envoy 的过滤器模式

![](D:\Home\17x\Projects\daily-notes\CloudNative\camp\12-istio\assets\envoy-filter.png)