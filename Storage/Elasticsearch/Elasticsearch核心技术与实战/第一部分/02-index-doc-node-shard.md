# Elasticsearch 基本概念

本文主要记录了 Elasticsearch 中的基本概念，包括 文档、索引、节点、分片等。



## 1. 文档

* Elasticsearch 是面向文档的，文档是所有可搜索数据的最小单位。

* 文档会被序列化成 JSON 格式，保存在 Elasticsearch 中

* 每个文档都有一个 Unique ID

  * 你可以自己指定 ID
  * 或者通过 Elasticsearch 自动生成

* 一篇文档包含了一系列的字段

* JSON 文档格式灵活，不需要预先定义格式

  * 字段类型可以指定或 Elasticsearch 自动推算
  * 支持数组、嵌套

* 元数据 用于标注文档的相关信息

  * _index 文档所属的索引名
  * _type 文档所属的类型名
  * _id 文档唯一 id
  * _source 文档的原始 JSON 数据
  * _all 整合所有字段内容到该字段，已废弃
  * _version 文档的版本信息
  * _score 相关性打分

  

## 2. 索引

* Index 索引是文档的容器，是一类文档的集合。
  * Index 体现了逻辑空间的概念：每个索引都有自己的 Mapping 定义，用于定义包含的文档的字段名和字段类型
  * Shard 体现了物理空间的概念：索引中的数据分散在 Shard 上
* 索引的 Mapping 与 Setting
  * Mapping 定义文档字段的类型
  * Setting 定义不同的数据分布（例如分片数配置）

**索引的不同语义**

* 名词: 一个 Elasticsearch 集群中可以创建很多个不同的索引
* 动词：保存一个文档到 Elasticsearch 的过程也叫索引(indexing)
  * ES 中创建一个倒排索引的过程
* 名词：一个 B 树索引，一个倒排索引

**抽象与类比**

> 一个不恰当的比喻

| RDBMS  | Elasticsearch |
| ------ | ------------- |
| Table  | Index(Type)   |
| Row    | Document      |
| Cloumn | Filed         |
| Schema | Mapping       |
| SQL    | DSL           |



## 3. 节点

* 节点是一个 Elasticsearch 的实例
  * 本质上就是一个 Java 进程
  * 一台机器上可以运行多个 Elasticsearch 进程，但生产环境一般建议只运行一个
* 每个节点都有名字，通过配置文件配置，或者启动的时候`-E node.name=xxx` 指定
* 每一个节点启动后会分配一个 UID，保存在 data 目录下 



### 1. 角色

ES 中节点按角色不同可以分为多种类型。

1. Master-eligible nodes
2. Master Node
3. Data Node
4. Coordinating Node
5. Hot Node
6. Warm Node
7. Machine Learning Node、



**Master-eligible nodes & Master Node**

* Master-eligible 节点可以参加选主流程，成为 Master 节点

* 每个节点启动后，默认就是一个 Master-eligible 节点
  * 可以设置 node.master:false 来禁止
* 当第一个节点启动的时候，它会将自己选举成为 Master 节点
* 每个节点上都保存了集群的状态，但**只有 Master 节点才能修改集群的状态信息**
  * 任意节点都能修改信息会导致数据的不一致性
  * 集群状态（Cluster State）维护了一个集群中必要的信息
    * 所有的节点信息
    * 所有的索引和其他相关的 Mapping 与 Setting 信息
    * 分片的路由信息

**Data Node & CoordinatingNode**

* Data Node
  * 可以保存数据的节点叫做 Data Node
  * 负责保存分片数据，在数据扩展上起到了至关重要的作用
* CoordinatingNode
  * 负责接受 Client 的请求，将请求分发到合适的节点，最终把结果汇集到一起
  * 每个节点都默认起到了 Coordinating Node 的职责

**其他节点**

* Hot & Warm Node
  * 不同硬件配置的 Data Node，用来实现 Hot & Warm 架构，降低集群部署的成本。
* Machine Learning Node
  * 负责跑机器学习的 Job，用来做异常检测
* Tribe Node
  *  Tribe Node 连接到不同的 Elasticsearch 集群，并且支持将这些集群当成一个单独的集群处理
  * 5.3 开始使用 Cross Cluster Search 代替该类型节点

​	

### 2. 节点角色配置

* 开发环境中一个节点可以承担多种角色
* **生产环境中，应该设置单一的角色的节点（dedicate node）**

**配置选项**

| 节点类型          | 配置参数    | 默认值                                                       |
| ----------------- | ----------- | ------------------------------------------------------------ |
| master eligible   | node.master | true                                                         |
| data              | node.data   | true                                                         |
| ingest            | node.ingest | true                                                         |
| coordinating only | 无          | 每个节点默认都是 coordinating 节点，设置其他类型全部为 false |
| machine learning  | node.ml     | true (需 enable x-pack)                                      |



## 4. 分片

分片又可分为 Primary Shard 和 Replica Shard。

**Primary Shard**

主分片（Primary Shard），用以解决数据水平扩展的问题。通过主分片，可以将数据分布到集群内的所有节点之上

* 一个分片是一个运行的 Lucene 的实例
* 主分片数在索引创建时指定，后续不允许修改，除非 Reindex

**Replica Shard**

副本（Replica Shard）用以解决数据高可用的问题，是主分片的拷贝

* 副本分片数可以动态地调整
* 增加副本数，还可以在一定程度上提高服务的可用性（读取的吞吐）

**分片配置**

对于生产环境中分片的设定，需要提前做好容量规划，7.0 开始默认主分片设置成1 ，解决了 over-sharding 的问题。

* 分片数设置过小
  * 导致后续无法增加节点实现水平扩展
  * 当个分片的数据量太大，导致数据重新分配耗时
* 分片数设置过大
  * 影响搜索结果的相关性打分，影响统计结果的准确性
  * 单个节点上过多的分片，会导致资源浪费，同时也会影响性能

**集群的健康状况**

```http
GET _cluster/health
{
  "cluster_name" : "myes",
  "status" : "green",
  "timed_out" : false,
  "number_of_nodes" : 3,
  "number_of_data_nodes" : 3,
  "active_primary_shards" : 9,
  "active_shards" : 18,
  "relocating_shards" : 0,
  "initializing_shards" : 0,
  "unassigned_shards" : 0,
  "delayed_unassigned_shards" : 0,
  "number_of_pending_tasks" : 0,
  "number_of_in_flight_fetch" : 0,
  "task_max_waiting_in_queue_millis" : 0,
  "active_shards_percent_as_number" : 100.0
}
```

* Green - 主分片与副本都正常分配

* Yellow - 主分片全部正常分片，有副本分片未能正常分配

* Red - 有主分片未能分配
  * 例如。在服务器的磁盘容量超过 85% 时，去创建了一个新的索引
