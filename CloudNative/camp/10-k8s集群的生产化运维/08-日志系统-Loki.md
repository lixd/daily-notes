# 日志系统

### 日志系统的价值

* 分布式系统的日志查看比较复杂，因为多对节点的系统，要先找到正确的节点，才能看到想看的日志。日志系统把整个集群的日志汇总在一起，方便查看
* 因为节点上的日志滚动机制，如果有应用打印太多日志，如果没有日志系统，会导致关键日志丢失。
* 日志系统的重要意义在于解决节点出错导致不可访问，进而丢失日志的情况。



### 常用数据系统构建模式

![](assets/data-process.png)

数据收集：包括常见的推、拉模式

预处理：

* 塑形：对数据做结构化处理
* Enrich-ment：对数据做内容上的补充，比如添加一些标签之类的





### 日志收集系统 Loki 

Grafana Loki 是可以组成功能齐全的日志记录堆栈的一组组件。

* 与其他日志记录系统不同，Loki是基于仅索引有关日志的元数据的想法而构建的：标签。
* 日志数据本身被压缩并存储在对象存储(例如S3或GCS)中的块中，甚至存储在文件系统本地。
* 小索引和高度压缩的块简化了操作，并大大降低了Loki的成本。





> Loki 采集日志是和 Prometheus 采集 metrics 类似的思想,一家公司做的，一脉相承

当前 Prometheus 已经成为 K8s 指标监控的事实标准，上监控就是上 Prometheus ，上了 Prometheus 肯定上 Grafana。

当前日志系统一般是 ELK  组合，那么在已经有 Prometheus  + Grafana 的前提下有没有更好的选择呢？那就是 Grafana Loki。

> 指标监控和日志收集用一套系统，降低维护成本



### 基于 Loki 的日志收集系统

![](assets/loki-process.png)



### Loki-stack子系统

* Promtail
  * 将容器日志发送到Loki或者Grafana服务上的日志收集工具
  * 发现采集目标以及给日志流添加.上Label，然后发送给Loki
  * Promtail的服务发现是基于Prometheus的服务发现机制实现的，可以查看configmap loki-promtail了解细节
* Loki
  * Loki是可以水平扩展、高可用以及支持多租户的日志聚合系统
  * 使用和Prometheus相同的服务发现机制，将标签添加到日志流中而不是构建全文索引
  * Promtail接收到的日志和应用的metrics指标就具有相同的标签集
* Grafana
  * Grafana是一个用于监控和可视化观测的开源平台，支持非常丰富的数据源
  * 在Loki技术栈中它专门用来展示来自Prometheus和Loki等数据源的时间序列数据
  * 允许进行查询、可视化、报警等操作，可以用于创建、探索和共享数据Dashboard



### Loki 架构

![](assets/loki-arch.png)



### Loki组件

* Distributor (分配器) 
  * 分配器服务负责处理客户端写入的日志。
  * 一旦分配器接收到日志数据，它就会把它们分成若干批次，并将它们并行地发送到多个采集器去。
  * 分配器通过gRPC和采集器进行通信。
  * 它们是无状态的，基于一致性哈希，我们可以根据实际需要对他们进行扩缩容。
* Ingester (采集器)
  * 采集器服务负 责将日志数据写入长期存储的后端(DynamoDB、 S3、Cassandra等等)。
  * 采集器会校验采集的 日志是否乱序。
  * 采集器验证接收到的日志行是按照时间戳递增的顺序接收的，否则日志行将被拒绝并返回错误。
* Querier (查询器)
  * 查询器服务负责处理LogQL查询语句来评估存储在长期存储中的日志数据。





### Loki 安装

Add grafana repo

```sh
helm repo add grafana https://grafana.github.io/helm-charts
```

Install loki-stack

```sh
helm upgrade --install loki grafana/loki-stack --set grafana.enabled=true,prometheus.enabled=true,prometheus.alertmanager.persistentVolume.enabled=false,prometheus.server.persistentVolume.enabled=false
```

If you get the following error, that means your k8s version is too new to install

```
Error: unable to build kubernetes objects from release manifest: [unable to recognize "": no matches for kind "ClusterRole" in version "rbac.authorization.k8s.io/v1beta1", unable to recognize "": no matches for kind "ClusterRoleBinding" in version "rbac.authorization.k8s.io/v1beta1", unable to recognize "": no matches for kind "Role" in version "rbac.authorization.k8s.io/v1beta1", unable to recognize "": no matches for kind "RoleBinding" in version "rbac.authorization.k8s.io/v1beta1"]
```

Download loki-stack

```sh
helm pull grafana/loki-stack
tar -xvf loki-stack-*.tgz
cd loki-stack
```

Replace all `rbac.authorization.k8s.io/v1beta1` with `rbac.authorization.k8s.io/v1` by 

```sh
grep -rl "rbac.authorization.k8s.io/v1beta1" . | xargs sed -i 's/rbac.authorization.k8s.io\/v1beta1/rbac.authorization.k8s.io\/v1/g'
```

Install loki locally

```sh
helm upgrade --install loki ./loki-stack --set grafana.enabled=true,prometheus.enabled=true,prometheus.alertmanager.persistentVolume.enabled=false,prometheus.server.persistentVolume.enabled=false
```

Change the grafana service to NodePort type and access it

```sh
kubectl edit svc loki-grafana -oyaml -n default
```

And change ClusterIP type to NodePort.

Login password is in secret `loki-grafana`

```sh
kubectl get secret loki-grafana -oyaml -n default
```

Find admin-password: `xxx`

```sh
echo 'xxx' | base64 -d
```

Then you will get grafana login password, the login username is 'admin' on default.

> Note: `xxx` is the value of key `admin-password` in your yaml.

Change the grafana service to NodePort type and access it

Login password is in secret `loki-grafana`





### 在生产中的问题

* 利用率低
  * 日志大多数目的是给管理员做问题分析用的，但管理员更多的是登陆到节点或者pod里做分析，因为日志分析只是整个分析过程中的一部分，所以很多时候顺手就把日志看了
* Beats出现过锁住文件系统，docker container无法删除的情况
* 与监控系统相比，日志系统的重要度稍低
* 出现过多次因为日志滚动太快而使得日志收集占用太大网络带宽的情况

