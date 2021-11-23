# Index API

* 1）Alias
* 2）Index basic
* 3）Index advanced
* 4）Index template
* 5）Mapping
* 6）Other

## 1. Alias

为索引创建或者更新别名

### 1. 方式一

```shell
# create or update
PUT /<index>/_alias/<alias>
POST /<index>/_alias/<alias>
PUT /<index>/_aliases/<alias>
POST /<index>/_aliases/<alias>
```

```shell
# delete
DELETE /<index>/_alias/<alias>
DELETE /<index>/_aliases/<alias>
```

example

```shell
PUT /logs_20302801/_alias/2030
DELETE /twitter/_alias/alias1
```

### 2. 方式二

另一种方式,在 request body 指定要执行的操作，可以一次执行多个操作。

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

### 3. 查询

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

### 4. Index alias exists

检查索引别名是否存在

```shell
HEAD /_alias/<alias>
HEAD /<index>/_alias/<alias>
```

example

```shell
HEAD /_alias/alias1
```

## 2. Index

### 1. Create index

创建一个新索引。

```shell
PUT /<index>
```

可以同时指定以下参数，也可以只指定部分：

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

### 2. Delete index

删除索引，注意：这里不能通过 alias 来删除索引。

```shell
DELETE /<index>
```

example：

```shell
DELETE /twitter
```



### 3. Update index settings

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

### 4. Get index

查询一个或多个索引的信息。

```shell
GET /<index>
```

example

```shell
GET /twitter
```

#### 1. Index exists

检查索引是否存在

```shell
HEAD /<index>
```

example

```shell
HEAD /twitter
```

#### 2. Get index alias

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

#### 3. Get index settings

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

#### 4. Get field mapping

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




## 3. Index Operator

### 1. Refresh

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

### 2. Rollover index

设定一个条件，当前索引满足该条件后，自动把当前索引的别名添加到ES自动创建的新索引上。

**注意：索引名必须以数字结尾，这样 ES 才能帮我们自动生成新的索引。**

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



### 3. Shrink index

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



### 4.Split index

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

### 5. Index recovery

反正已完成或正在进行的索引恢复任务。

```shell
GET /<index>/_recovery
GET /_recovery
```

example

```shell
GET /twitter/_recovery
```



### 6. Index segments

索引对应的 Lucene 底层 segment 相关信息

```shell
GET /<index>/_segments
GET /_segments
```

example

```shell
GET /twitter/_segments
```



### 7. Index shard stores

返回一个或多个索引中有关副本分片的存储信息

```shell
GET /<index>/_shard_stores
GET /_shard_stores
```

example

```shell
GET /twitter/_shard_stores
```

### 8. Index stats

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

### 11. Clear cache

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

### 12. Clone index

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



### 13. Close index

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

### 14. Open index

开启索引，与 close 相反。

```shell
POST /<index>/_open
```

example

```shell
POST /twitter/_open
```

## 4. Index Template

### 1. Create&Update

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

### 2. Delete index template

删除索引模板。

> index template define settings and mappings. 可以看做是创建索引时（如果索引能和模板匹配上的话）的默认值。

```shell
DELETE /_template/<index-template>
```

example:

```shell
DELETE /_template/template_1
```



### 3. 查询

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

 #### Index template exists

索引模板是否存在

```shell
HEAD /_template/<index-template>
```

example:

```shell
HEAD /_template/template_1
```

### 4. 组合模板

组合模板可以定义 settings、mappings、aliases，创建索引的时候可以自动应用。

```shell
PUT /_component_template/<component-template>
GET /_component-template/<component-template>
```



## 5. Mapping

### 1. Get mapping

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

### 2. Get field mapping

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

### 3. PUT mapping

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

## 6. Others

### 1. Analyze

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

