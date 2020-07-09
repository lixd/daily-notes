# other config

## 1. Master Eligible Node

Master Eligible Node 不能直接删除，必须保持移除后还有超过一半的 Master Eligible Node 在集群中。

删除前可以先把该节点设置为 非Master Eligible Node，使用 如下 API，然后等待 Elasticsearch 自动进行调整

之后就可以删除了。

```shell
# Add node to voting configuration exclusions list and wait for the system
# to auto-reconfigure the node out of the voting configuration up to the
# default timeout of 30 seconds
POST /_cluster/voting_config_exclusions?node_names=node_name

# Add node to voting configuration exclusions list and wait for
# auto-reconfiguration up to one minute
POST /_cluster/voting_config_exclusions?node_names=node_name&timeout=1m
```

列表中最多存10个值，所以需要注意删除

```shell
# Wait for all the nodes with voting configuration exclusions to be removed from
# the cluster and then remove all the exclusions, allowing any node to return to
# the voting configuration in the future.
DELETE /_cluster/voting_config_exclusions

# Immediately remove all the voting configuration exclusions, allowing any node
# to return to the voting configuration in the future.
DELETE /_cluster/voting_config_exclusions?wait_for_removal=false
```



## remote cluster

> There are two modes for remote cluster connections: [sniff mode](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-remote-clusters.html#sniff-mode) and [proxy mode](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-remote-clusters.html#proxy-mode).

连接远程集群的时候包括两种模式，嗅探模式和代理模式。

### sniff mode

嗅探模式，是默认的连接模式。

就是直连。随便指定一个集群中的节点，然后会自动嗅探集群中的其他节点（默认会找出3个网关节点）。

* 网关节点要求
  * 必须是可以直接连接的。
  * 必须和集群中所有节点兼容（版本问题）
    * 因为网关节点需要访问到集群中的所有节点
  * 不能是 master 节点
  * 可以手动指定，但是也要满足前面几个要求





### proxy mode

代理模式。即先访问代理节点，由代理节点访问集群。需要手动配置。

同样需要满足版本兼容性问题。



### Configuring remote clusters

例如

```shell
cluster:
    remote:
        cluster_one: 
            seeds: 127.0.0.1:9300 
            transport.ping_schedule: 30s 
        cluster_two: 
            mode: sniff 
            seeds: 127.0.0.1:9301 
            transport.compress: true 
            skip_unavailable: true 
        cluster_three: 
            mode: proxy 
            proxy_address: 127.0.0.1:9302 
```

cluster_one，cluster_two，cluster_three是集群的别名，随意起的。

默认是`mode: sniff `,所以 cluster_one 中没有配置也可以。

`cluster_three`指定为代理模式`mode: proxy `,同时配置了一个`proxy_address: 127.0.0.1:9302 `



`transport.compress: true`开启压缩，只会影响发送到该集群的请求。如果入站请求被压缩，那么 ES 会把响应也进行压缩。