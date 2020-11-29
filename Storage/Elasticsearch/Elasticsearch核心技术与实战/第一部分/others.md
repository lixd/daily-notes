## 5. REST API

Index 相关 API

```shell
#查看索引相关信息
GET kibana_sample_data_ecommerce

#查看索引的文档总数
GET kibana_sample_data_ecommerce/_count

#查看前10条文档，了解文档格式
POST kibana_sample_data_ecommerce/_search
{
}

#_cat indices API
#查看indices
GET /_cat/indices/kibana*?v&s=index

#查看状态为绿的索引
GET /_cat/indices?v&health=green

#按照文档个数排序
GET /_cat/indices?v&s=docs.count:desc

#查看具体的字段
GET /_cat/indices/kibana*?pri&v&h=health,index,pri,rep,docs.count,mt

#How much memory is used per index?
GET /_cat/indices?v&h=i,tm&s=tm:desc
```

## 6. 分布式特性

* Elasticsearch 分布式架构的好处
  * 存储的水平扩容
  * 提高系统的可用性，部分节点停止服务，整个集群的服务不受影响
* Elasticsearch 的分布式架构
  * 不同的集群通过不同的名字来区分，默认名字为 elasticsearch
  * 通过配置文件修改，或者在命令行中`-E cluster.name=xxx`来进行设定
  * 一个集群可以有一个或多个节点

## 3. 常见错误返回

| 问题         | 原因               |
| ------------ | ------------------ |
| 无法连接     | 网络故障或集群挂了 |
| 连接无法关闭 | 网络故障或节点出错 |
| 429          | 集群过于繁忙       |
| 4xx          | 请求体格式有错     |
| 500          | 集群内部错误       |

