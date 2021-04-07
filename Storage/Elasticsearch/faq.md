# Elasticsearch 常见问题

## 1. 解决Elasticsearch索引只读（read-only）

通过Kibana创建Index Pattern的时候一直显示创建中，查看日志发现报错了。

```sh
{"error":{"root_cause":[{"type":"cluster_block_exception","reason":"blocked by: [FORBIDDEN/12/index read-only / allow delete (api)];"}],"type":"
cluster_block_exception","reason":"blocked by: [FORBIDDEN/12/index read-only / allow delete (api)];"},"status":403}
Caused by: org.elasticsearch.ElasticsearchStatusException: Elasticsearch exception [type=cluster_block_exception, reason=blocked by: [FORBIDDEN/
12/index read-only / allow delete (api)];]
```

索引进入了只读状态,此时将不能更新索引，只能查询和删除。

### 原因

Elasticsearch在磁盘不足时会自动切换到自读状态，防止数据异常。

> [官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-cluster.html#disk-based-shard-allocation)

默认阈值是 85% 和 90 %，95%。

当为85%时：Elasticsearch不会将碎片分配给磁盘使用率超过85%的节点（ cluster.routing.allocation.disk.watermark.low）

当为90%时：Elasticsearch尝试重新分配给磁盘低于使用率90%的节点（cluster.routing.allocation.disk.watermark.high）

当为95%时：Elasticsearch执行只读模块（cluster.routing.allocation.disk.watermark.flood_stage）

### 解决

* 1）扩大磁盘或者删除部分历史索引
* 2）重置该只读索引块



```sh
#某一个索引重置只读模块
PUT /twitter/_settings
{
  "index.blocks.read_only_allow_delete": null
}

#所有索引重置只读模块
PUT /_all/_settings
{
  "index.blocks.read_only_allow_delete": null
}
PUT /_cluster/settings
{
  "persistent" : {
    "cluster.blocks.read_only" : false
  }
}
```



修改默认设置



```sh
#可以修改为具体的磁盘空间值，也可以修改为百分之多少临时修改
PUT _cluster/settings
{
  "transient": {
    "cluster.routing.allocation.disk.watermark.low": "100gb",
    "cluster.routing.allocation.disk.watermark.high": "50gb",
    "cluster.routing.allocation.disk.watermark.flood_stage": "10gb",
    "cluster.info.update.interval": "1m"
  }
}
#永久修改
PUT _cluster/settings
{
  "persistent": {
    "cluster.routing.allocation.disk.watermark.low": "100gb",
    "cluster.routing.allocation.disk.watermark.high": "50gb",
    "cluster.routing.allocation.disk.watermark.flood_stage": "10gb",
    "cluster.info.update.interval": "1m"
  }
}
```

