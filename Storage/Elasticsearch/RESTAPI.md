# REST API

## 1. API 约定

### 1. 多索引

大部分 API 都支持多索引，也支持通配符等,用逗号分隔，例如

```shell
GET index1,index2,*test/_search
```

同时elasticsearch 提供了几个特殊值，用于控制通配符表达式能匹配到的索引：

* all：匹配全部索引，不填任何索引也会默认查询全部索引
* open：匹配状态为 open 的索引
* closed：匹配状态为 closed 的索引
* hidden：可以匹配到 hidden 状态的索引
* none：不接受任何通配符



### 2. 日期索引名

大部分 API 都支持 date math,格式为

```shell
<static_name{date_math_expr{date_format|time_zone}}>
```

* static_name：固定的，静态名字
* date_math_expr：日期表达式，可以计算动态的日期
* date_format：日期格式，与 Java 日期兼容
* time_zone：时区，默认是 utc



注意：

* 1）需要将date math 表达式括在尖括号内
* 2）特殊字符需要进行 URI 编码

编码规则见下表：

| 符号 | 编码  |
| ---- | ----- |
| `<`  | `%3C` |
| `>`  | `%3E` |
| `/`  | `%2F` |
| `{`  | `%7B` |
| `}`  | `%7D` |
| `|`  | `%7C` |
| `+`  | `%2B` |
| `:`  | `%3A` |
| `,`  | `%2C` |

常见表达式如下:

| Expression                              | Resolves to           |
| --------------------------------------- | --------------------- |
| `<logstash-{now/d}>`                    | `logstash-2024.03.22` |
| `<logstash-{now/M}>`                    | `logstash-2024.03.01` |
| `<logstash-{now/M{yyyy.MM}}>`           | `logstash-2024.03`    |
| `<logstash-{now/M-1M{yyyy.MM}}>`        | `logstash-2024.02`    |
| `<logstash-{now/d{yyyy.MM.dd|+12:00}}>` | `logstash-2024.03.23` |

例如，搜索过去 3 天的日志

```shell
# GET /<logstash-{now/d-2d}>,<logstash-{now/d-1d}>,<logstash-{now/d}>/_search
GET /%3Clogstash-%7Bnow%2Fd-2d%7D%3E%2C%3Clogstash-%7Bnow%2Fd-1d%7D%3E%2C%3Clogstash-%7Bnow%2Fd%7D%3E/_search
{
  "query" : {
    "match": {
      "test": "data"
    }
  }
}
```



### 3. Cron 表达式



### 4. 常用选项



#### 1. Pretty

`?pretty=true`使得返回结果更具可读性，仅在调试的时候使用。

`?format=yaml` 返回 yaml 格式

#### 2. Human readable output

`human=false` 关闭 人类友好输出，默认为false

computers:`"exists_time_in_millis": 3600000`

huamns:`"exists_time": "1h"`



#### 3. 日期

接受日期相关命令，例如

* now :当前时间
* +1h：增加一小时
* -1d：减少一天 
* /d：四舍五入到最近的一天

等等

#### 4. 结果过滤

用于过滤不需要的返回值

`filter_path`为关键字，各个参数用逗号隔开，例如

```shell
GET /_search?q=elasticsearch&filter_path=took,hits.hits._id,hits.hits._score
```

也支持通配符等



#### 5. flat settings

也是控制返回结果表现形式的，

`?flat_settings=true`开启时

```shell
{
  "twitter" : {
    "settings": {
      "index.number_of_replicas": "1",
      "index.number_of_shards": "1",
      "index.creation_date": "1474389951325",
      "index.uuid": "n6gzFZTgS664GUfx0Xrpjw",
      "index.version.created": ...,
      "index.provided_name" : "twitter"
    }
  }
}
```

`?flat_settings=false`关闭时

```shell
{
  "twitter" : {
    "settings" : {
      "index" : {
        "number_of_replicas": "1",
        "number_of_shards": "1",
        "creation_date": "1474389951325",
        "uuid": "n6gzFZTgS664GUfx0Xrpjw",
        "version": {
          "created": ...
        },
        "provided_name" : "twitter"
      }
    }
  }
}
```



#### 6. 布尔值

`"false"` 为 false

`"true"` 为 true

其他值都会出现错误。

## 2. cat APIs

查询相关信息

### 1. common

```shell
# v 显示详细信息
GET /_cat/master?v
# help 显示帮助信息
GET /_cat/master?help
# h 强制只显示指定的列
GET /_cat/nodes?h=ip,port,heapPercent,name
# bytes=b 指定用字节为单位显示
GET /_cat/indices?bytes=b&s=store.size:desc&v
# s 排序，多列用逗号分隔
GET _cat/templates?v&s=order:desc,index_patterns
```

### 2. list

```shell
# 别名列表
GET /_cat/aliases/<alias>
GET /_cat/aliases

# 磁盘 
GET /_cat/allocation/<node_id>
GET /_cat/allocation

# 文档总数
GET /_cat/count/<index>
GET /_cat/count

# fielddata
GET /_cat/fielddata/<field>
GET /_cat/fielddata

# health
GET /_cat/health

# indices 信息
GET /_cat/indices/<index>
GET /_cat/indices

# master 节点信息
GET /_cat/master

# nodeattrs 自定义参数
GET /_cat/nodeattrs

# 所有节点信息
GET /_cat/nodes?v

# 集群级别异步任务信息
GET /_cat/pending_tasks

# 插件列表
GET /_cat/plugins

# 分片恢复信息
GET /_cat/recovery/<index>
GET /_cat/recovery

# 快照列表
GET /_cat/repositories
# 快照信息
GET /_cat/snapshots/<repository>

# 分片信息
GET /_cat/shards/<index>
GET /_cat/shards

# 底层Lucene 的 segments 信息
GET /_cat/segments/<index>
GET /_cat/segments

# 当前集群中正在执行的任务
GET /_cat/tasks

# 索引模板
GET /_cat/templates/<template_name>
GET /_cat/templates

# 每个节点线程池统计信息
GET /_cat/thread_pool/<thread_pool>
GET /_cat/thread_pool
```



## 3. cluster APIs

集群相关 API

### 1. NodeFilter

有些可以在节点子集上运行，可以通过 node filter节点过滤器来指定这些子集。

节点过滤器例子：

```shell
# If no filters are given, the default is to select all nodes
GET /_nodes
# Explicitly select all nodes
GET /_nodes/_all
# Select just the local node
GET /_nodes/_local
# Select the elected master node
GET /_nodes/_master
# Select nodes by name, which can include wildcards
GET /_nodes/node_name_goes_here
GET /_nodes/node_name_goes_*
# Select nodes by address, which can include wildcards
GET /_nodes/10.0.0.3,10.0.0.4
GET /_nodes/10.0.0.*
# Select nodes by role
GET /_nodes/_all,master:false
GET /_nodes/data:true,ingest:true
GET /_nodes/coordinating_only:true
GET /_nodes/master:true,voting_only:false
# Select nodes by custom attribute (e.g. with something like `node.attr.rack: 2` in the configuration file)
GET /_nodes/rack:2
GET /_nodes/ra*:2
GET /_nodes/ra*:2*
```



### 2. List

```shell
# 集群中分片分配说明
GET /_cluster/allocation/explain

# 集群设置
GET /_cluster/settings

# 集群健康状况
GET _cluster/health/<index>

# 集群相关元数据
GET /_cluster/state/<metrics>/<index>

# 集群统计信息
GET /_cluster/stats
GET /_cluster/stats/nodes/<node_filter>

# 返回有关功能信息，例如各功能调用次数
GET /_nodes/usage
GET /_nodes/<node_id>/usage
GET /_nodes/usage/<metric>
GET /_nodes/<node_id>/usage/<metric>

# 返回节点中的 hot_threads
GET /_nodes/ hot_threads
GET /_nodes/<node_id>/hot_threads

# 集群节点信息 会所有信息
GET /_nodes
GET /_nodes/<node_id>
# 指定只查询某一信息 如 plugins
GET /_nodes/<metric>
GET /_nodes/<node_id>/<metric>

# 集群节点统计信息
GET /_nodes/stats
GET /_nodes/<node_id>/stats
GET/_nodes/stats/<metric>
GET/_nodes/<node_id>/stats/<metric>
GET /_nodes/stats/<metric>/<index_metric>
GET /_nodes/<node_id>/stats/<metric>/<index_metric>

# 集群级别的任务
GET /_cluster/pending_tasks

# 远程集群信息
GET /_remote/info

# 集群中正在执行的任务信息
GET /_tasks/<task_id>
GET /_tasks
```

### 3. Update

```shell
# 修改分片分配
POST /_cluster/reroute

POST /_cluster/reroute
{
    "commands" : [
        {	
        	# 移动副本分配位置
            "move" : {
                "index" : "test", "shard" : 0,
                "from_node" : "node1", "to_node" : "node2"
            }
        },
        {
        	# 分配副本分配
          "allocate_replica" : {
                "index" : "test", "shard" : 1,
                "node" : "node3"
          }
        }
    ]
}
```



```shell
# 更新集群设置
PUT /_cluster/settings
# example
PUT /_cluster/settings
{
    "persistent" : {
        "indices.recovery.max_bytes_per_sec" : "50mb"
    }
}
```



```shell
# 新增或移除 master-eligible 节点

# 将 node 加入 voting_config_exclusions 列表 就会从 master-eligible 自动移除
# 可以根据 节点名或者 id 加入。
POST _cluster/voting_config_exclusions?node_names=<node_names>
POST _cluster/voting_config_exclusions?node_ids=<node_ids>
# voting_config_exclusions 列表最多 10个，所以需要定期清空
DELETE _cluster/voting_config_exclusions
```



## 4. Cross-cluster replication APIs

需要 X-Pack



## 5. Document APIs



### 1. Index

```shell
PUT /<index>/_doc/<_id>
POST /<index>/_doc/

PUT /<index>/_create/<_id>
POST /<index>/_create/<_id>
```

两个参数分别为：

* Index：指定索引，如果索引不存在会自动创建
* _id：指定新建文档 Id

两种 Method 的区别：

* PUT
  * 1）必须指定 id
  * 2）若目标文档已存在也会以当前的文档去替换
* POST
  * 1）可以省略 id，elasticsearch 会自动生成

两个 endpoint 的区别：

* _doc : 可以创建或替换文档
* _create：只能创建，文档已存在则会报错



**参数**

* routing

默认会根据 DocumentId 进行路由，创建的时候也可以手动指定，如果这里指定了，后续其他操作也要指定才行。

```shell
POST twitter/_doc?routing=kimchy
```

* timeout 

指定超时时长

```shell
POST twitter/_doc?timeout=5m
```







### 2. Get

```shell
GET <index>/_doc/<_id>
HEAD <index>/_doc/<_id>

GET <index>/_source/<_id>
HEAD <index>/_source/<_id>
```

两种 Method 的区别：

* GET：检索文档及内容
* HEAD：检测文档是否存在



**参数**

* `_source`

默认会返回_source 字段，可以手动关闭。

```shell
GET twitter/_doc/0?_source=false
```





### 3. Delete

```shell
DELETE /<index>/_doc/<_id>
```

必须指定 id。



### 4. Delete By query

删除查询到的文档。

```shell
POST /<index>/_delete_by_query
```

example

```shell
POST /twitter/_delete_by_query
{
  "query": {
    "match": {
      "message": "some message"
    }
  }
}
```



### 5. Update

```shell
POST /<index>/_update/<_id>
```

这个才是真正的更新。

example

```shell
POST users/_update/1
{
	"doc":{
		"albums":["Albums1","Albums2"]
	}
}
```



### 6. Update By Query

```shell
POST /<index>/_update_by_query
```

和 Update 类似，只是把条件换了。



### 7. mget

```shell
GET /_mget
GET /<index>/_mget
```

批量查询。



### 8. Bulk API

```shell
POST /_bulk
POST /<index>/_bulk
```

支持在一次 API 调用中，对不同的索引进行操作。

将多次操作一次发送给 ES，提升效率。

标准结构

```shell
action_and_meta_data\n
optional_source\n
action_and_meta_data\n
optional_source\n
....
action_and_meta_data\n
optional_source\n
```



### 9. Reindex

将文档从一个索引复制到另一索引。

> 要求所有文档的 _source 是开启的。
>
> 先从源索引中提取文档，然后写入目标索引。

```shell
POST _reindex
{
  "source": {
    "index": "twitter"
  },
  "dest": {
    "index": "new_twitter"
  }
}
```



### 10. Term vectors API

```shell
GET /<index>/_termvectors/<_id>
```

Retrieves information and statistics for terms in the fields of a particular document.

Term vectors：术语向量。

没看明白。。。

官方文档

```
https://www.elastic.co/guide/en/elasticsearch/reference/7.8/docs-termvectors.html#docs-termvectors-api-desc
```



### 11. ?refresh

由于文档是存在磁盘上的，所以 ES 不会每次修改都刷盘，默认情况下会 1 秒刷盘一次。

所以每次修改后需要 1 秒左右才能看到变化。

通过添加`?refresh`参数可以控制该时间。

* `?refresh=true`:操作后立即刷新主分配和副本分片，可能会导致性能下降。
* `?refresh=wait_for`：等刷盘后本次请求才返回。
* `?refresh=false`：默认值。



### 12. optimistic-concurrency-control

ES 是分布式的，且并发的，所以需要一种机制来保证旧版本文档不会覆盖新版本。

ES 中的每一个操作都会分配一个 seq ，然后根据操作序号来保证旧版本文档不会覆盖新版本。







## 6. Index API

### 1. alias

为索引创建或者更新别名

```shell
PUT /<index>/_alias/<alias>
POST /<index>/_alias/<alias>
PUT /<index>/_aliases/<alias>
POST /<index>/_aliases/<alias>
# 删除别名
DELETE /<index>/_alias/<alias>
DELETE /<index>/_aliases/<alias>
```

example

```shell
PUT /logs_20302801/_alias/2030
DELETE /twitter/_alias/alias1
```

另一种方式,在 request body 指定要执行的操作

```shell
POST /_aliases
```

example

```shell
POST /_aliases
{
    "actions" : [
        { "remove" : { "index" : "test1", "alias" : "alias1" } },
        { "add" : { "index" : "test1", "alias" : "alias2" } }
    ]
}
```





### 2. Analyze

对文本进行分析并返回结果,可以指定 analyzer（分析器）。

```shell
GET /_analyze
POST /_analyze
GET /<index>/_analyze
POST /<index>/_analyze
```

参数

* `_analyze`:endpoint
* `index`:可选，指定索引，指定后会默认使用该索引指定的分析器
* `analyzer`: 也可以手动指定分析器

example

```shell
GET /_analyze
{
  "analyzer" : "standard",
  "text" : "Quick Brown Foxes!"
}
```

可以自定义分析器,由`tokenizer`、`filter`、`char_filter`三部分组成

```shell
GET /_analyze
{
  "tokenizer" : "keyword",
  "filter" : ["lowercase"],
  "char_filter" : ["html_strip"],
  "text" : "this is a <b>test</b>"
}
```



### 3. Clear cache

清除一个或多个索引的缓存。

```shell
POST /<index>/_cache/clear
POST /_cache/clear
```

参数

* `_cache`:endpoint
* `index`:指定清空该索引缓存

example

```shell
# claer all index all cache
POST /_cache/clear
# clear custom index custom cache
POST /twitter/_cache/clear?fielddata=true  
POST /twitter/_cache/clear?query=true      
POST /twitter/_cache/clear?request=true  
```



### 4. Clone index

克隆现有索引，被克隆索引必须是`只读 read-only`的，并且 `cluster status = green`

```shell
POST /<index>/_clone/<target-index>
PUT /<index>/_clone/<target-index>
```

params：

* `_clone`:endpoint
* `index`:指定要克隆的索引
* `target-index`:克隆到的目标索引

执行过程：

* 1）创建一个和源索引相同定义的目标索引
* 2）将源索引的 segment 链接到目标索引
  * 如果文件系统不支持链接的话就会全复制，比较耗时
* 3）恢复目标索引



example

设置索引为只读

```shell
PUT /my_source_index/_settings
{
  "settings": {
    "index.blocks.write": true
  }
}
```

开始 克隆

```shell
POST /my_source_index/_clone/my_target_index
```



### 5. Close index

关闭索引，关闭状态的索引不支持读写操作，和任意需要 open 索引的操作。

> 可以在集群中设置 cluster.indices.close.enable = false 禁止关闭索引（默认是 true）

```shell
POST /<index>/_close
```

example:

```shell
POST /my_index/_close
```

The API returns following response:

```shell
{
    "acknowledged" : true,
    "shards_acknowledged" : true,
    "indices" : {
        "my_index" : {
            "closed" : true
        }
    }
}
```



### 6. Create index

创建一个新索引。

```shell
PUT /<index>
```

同时可以指定以下参数：

* Settings for the index
* Mappings for fields in the index
* Index aliases

example:

```shell
# with settins
PUT /twitter
{
    "settings" : {
        "index" : {
            "number_of_shards" : 3, 
            "number_of_replicas" : 2 
        }
    }
}
```

```shell
# with mappings
PUT /test
{
    "settings" : {
        "number_of_shards" : 1
    },
    "mappings" : {
        "properties" : {
            "field1" : { "type" : "text" }
        }
    }
}
```

```shell
# with aliases
PUT /test
{
    "aliases" : {
        "alias_1" : {},
        "alias_2" : {
            "filter" : {
                "term" : {"user" : "kimchy" }
            },
            "routing" : "kimchy"
        }
    }
}
```



### 7. Delete index

删除索引，注意：这里不能通过 别名alias 来删除索引。

```shell
DELETE /<index>
```

example：

```shell
DELETE /twitter
```



### 8. Delete index template

删除索引模板。

> index template define settings and mappings. 可以看做是创建索引时（如果索引能和模板匹配上的话）的默认值。

```shell
DELETE /_template/<index-template>
```

example:

```shell
DELETE /_template/template_1
```



### 9. Flush 

刷新一个或多个索引。ES 采用的 WAL 技术，先写 log，等存放到一定数量后再一起刷盘，以提升效率。

Flush API 则是手动调用，让 ES 进行一次刷盘。

```shell
POST /<index>/_flush
GET /<index>/_flush
POST /_flush
GET /_flush
```

example:

```shell
# flush one specific index
POST /kimchy/_flush
# flush serveral indices
POST /kimchy,elasticsearch/_flush
# flush all indices
POST /_flush
```



### 10. Force merge

在一个或多个索引的分片上强制合并。

> 每次往 ES 中新增一个文档，都会在底层 Lucene 增加一个 segment，为了不让 segment 数量太多，ES 会自动继续 merge，合并 segment。调用该 API 则手动触发 merge。

**注意**：最好是在确定不会有新数据写入之后，在进行强制合并。

```shell
POST /<index>/_forcemerge
POST /_forcemerge
```

example:

```shell
POST /twitter/_forcemerge
POST /kimchy,elasticsearch/_forcemerge
POST /_forcemerge
# 指定合并成一个 segment 因为这种基于时间的 index 过了那段时间就不会再有数据写入了
POST /logs-000001/_forcemerge?max_num_segments=1
```



### 11. Get field mapping

查看一个或多个字段的 mappings

```shell
GET /_mapping/field/<field>
GET /<index>/_mapping/field/<field>
```

example:

```shell
GET publications/_mapping/field/title
```

The API returns the following response:

```shell
{
   "publications": {
      "mappings": {
          "title": {
             "full_name": "title",
             "mapping": {
                "title": {
                   "type": "text"
                }
             }
          }
       }
   }
}
```

also can get multiple indices and fields

```shell
GET /twitter,kimchy/_mapping/field/message
GET /_all/_mapping/field/message,user.id
GET /_all/_mapping/field/*.id
```



### 12. Get index

查询一个或多个索引的信息。

```shell
GET /<index>
```

example

```shell
GET /twitter
```



### 13. Get index alias

查询一个或多个索引的别名信息。

```shell
GET /_alias
GET /_alias/<alias>
GET /<index>/_alias/<alias>
```

example:

```shell
GET /_alias/2030
GET /_alias/20*
```



### 14. Get index settings

查询索引设置信息

```shell
GET /<index>/_settings
GET /<index>/_settings/<setting>
```

example:

```shell
# multiple indices
GET /twitter,kimchy/_settings
GET /_all/_settings
GET /log_2013_*/_settings
# custom fields
GET /log_2013_-*/_settings/index.number_*
```



### 15. Get index template

查询索引模板

```shell
GET /_template/<index-template>
```

example

```shell
GET /_template/template_1
```



### 16. Get mapping

```shell
GET /_mapping
GET /<index>/_mapping
```

example

```shell
GET /twitter/_mapping
# all indices mappings
GET /_mapping
```



### 17. Index alias exists

检查索引别名是否存在

```shell
HEAD /_alias/<alias>
HEAD /<index>/_alias/<alias>
```

example

```shell
HEAD /_alias/alias1
```



### 18. Index exists

检查索引是否存在

```shell
HEAD /<index>
```

example

```shell
HEAD /twitter
```



### 19. Index recovery

反正已完成或正在进行的索引恢复任务。

```shell
GET /<index>/_recovery
GET /_recovery
```

example

```shell
GET /twitter/_recovery
```



### 20. Index segments

索引对应的 Lucene 底层 segment 相关信息

```shell
GET /<index>/_segments
GET /_segments
```

example

```shell
GET /twitter/_segments
```



### 21. Index shard stores

返回一个或多个索引中有关副本分片的存储信息

```shell
GET /<index>/_shard_stores
GET /_shard_stores
```

example

```shell
GET /twitter/_shard_stores
```

### 22. Index stats

索引统计信息

```shell
GET /<index>/_stats/<index-metric>
GET /<index>/_stats
GET /_stats
```

example:

```shell
GET /twitter/_stats
```



### 23. Index template exists

索引模板是否存在

```shell
HEAD /_template/<index-template>
```

example:

```shell
HEAD /_template/template_1
```



### 24. Open index

开启索引，与 close 相反。

```shell
POST /<index>/_open
```

example

```shell
POST /twitter/_open
```



### 25. Index Template

#### 1. PUT

创建或更新

```shell
PUT /_index_template/<index-template>
```

example

```shell
PUT /_index_template/template_1
{
  "index_patterns" : ["te*"],
  "priority" : 1,
  "template": {
    "settings" : {
      "number_of_shards" : 2
    }
  }
}
```

* `index_patterns`：索引名匹配策略
* `priority`：优先级，同时匹配多个模板时会选择优先级高的
* `template`：具体模板信息
  * settings
  * mappings
  * alias
  * 等等



#### 2. GET

查看模板信息

```shell
GET /_index_template/<index-template>
```

example

```shell
GET /_index_template/template_1
GET /_index_template/temp*
GET /_index_template
```



#### 3. 组合模板

组合模板可以定义 settings、mappings、aliases，创建索引的时候可以自动应用。

```shell
PUT /_component_template/<component-template>
GET /_component-template/<component-template>
```



### 26. PUT mapping

只能添加新字段,不能修改已存在的字段。

```shell
PUT /<index>/_mapping
PUT /_mapping
```

example

```shell
PUT /twitter/_mapping
{
  "properties": {
    "email": {
      "type": "keyword"
    }
  }
}
```

也可以同时更新多个

```shell
PUT /twitter-1,twitter-2/_mapping 
{
  "properties": {
    "user_name": {
      "type": "text"
    }
  }
}
```



### 27. Refresh

刷新一个或多个索引。

> ES 插入新文档后，一般需要 1 秒后才能被搜索到，因为 ES 默认1秒刷新1次。
>
> 刷新后只是能搜索到了，也不一定就刷盘了，刷盘是 flush.

```shell
POST <index>/_refresh
GET <index>/_refresh

POST /_refresh
GET /_refresh
```

example

```shell
POST /kimchy,elasticsearch/_refresh
POST /_refresh
```



### 28. Rollover index

设定一个条件，当前索引满足该条件后，自动把当前索引的别名添加到其他的索引上。

```shell
POST /<alias>/_rollover/<target-index>
POST /<alias>/_rollover/
```

example

```shell
PUT /logs-000001 
{
  "aliases": {
    "logs_write": {}
  }
}

# Add > 1000 documents to logs-000001

POST /logs_write/_rollover 
{
  "conditions": {
    "max_age":   "7d",
    "max_docs":  1000,
    "max_size":  "5gb"
  }
}
```

创建索引`logs-000001` 指定别名`logs_write`,当索引满足 3 个条件中的一个时就会创建新索引`logs-000002`,并将别名从旧索引移到新索引。

官方文档

```shell
https://www.elastic.co/guide/en/elasticsearch/reference/7.8/indices-rollover-index.html#indices-rollover-index
```



### 29. Shrink index

收缩索引的主分片数。

> 收缩后的主分片数必须是当前主分片数的一个因数，比如当前为 8 则收缩后的值只能是 4、2、1中选一个，15 的话就是 5、3、1.

* 当前索引必须是只读的
* 集群健康状态必须为 green
* 索引每个分片的副本分片必须在同一节点

```shell
POST /<index>/_shrink/<target-index>
PUT /<index>/_shrink/<target-index>
```

example

```shell
POST /my_source_index/_shrink/my_target_index
{
  "settings": {
    "index.number_of_replicas": 1,
    "index.number_of_shards": 1, 
    "index.codec": "best_compression" 
  },
  "aliases": {
    "my_search_indices": {}
  }
}
```



### 30.Split index

与 Shrink 相反，增加主分片数。

* 当前索引必须是只读的
* 集群健康状态必须为 green
* 新分片数必须是旧分片数的倍数

```shell
POST /<index>/_split/<target-index>
PUT /<index>/_split/<target-index>
```

example

```shell
POST /my_source_index/_split/my_target_index
{
  "settings": {
    "index.number_of_shards": 2
  }
}
```



### 31. Update index settings

实时更新索引的 settings

```shell
PUT /<index>/_settings
```

example

```shell
PUT /twitter/_settings
{
    "index" : {
        "number_of_replicas" : 2
    }
}
```

