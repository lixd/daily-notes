# UpdateByQuery&ReindexAPI

## 1. 概述

一般在以下几种情况时，我们需要重建索引

* 索引的 Mappings 发生变更：字段类型更改，分词器及字典更新
* 索引的 Settings 发生变更：索引的主分片数发生改变
* 集群内，集群间需要做数据迁移

Elasticsearch 内置的两种重建索引API

* UpdateByQuery：在现有索引上重建
* Reindex：在其他索引上重建





## 2. UpdateByQuery

在 索引已经存在后，**Mapping增加子字段**，后续写入的数据会增加子字段，但是前面已经写入的数据都会没有这个子字段，所以可能无法被搜索到。

这个时候就可以使用`UpdateByQuery`,按照最新的 Mapping 来重建索引。

```shell
# 不指定任何条件，Update 所有文档
POST blogs/_update_by_query
{

}
```



## 3. Reindex

**修改字段类型**

ES 不允许在原有的 Mapping 上对字段类型进行修改，只能创建新的索引，并且设定正确的字段类型，再重新导入数据

```shell
# 创建新的索引并且设定新的Mapping
PUT blogs_fix/
{
  "mappings": {
        "properties" : {
        "content" : {
          "type" : "text",
          "fields" : {
            "english" : {
              "type" : "text",
              "analyzer" : "english"
            }
          }
        },
        "keyword" : {
          "type" : "keyword"
        }
      }    
  }
}

# Reindx API
# 从旧索引中把数据写入到新索引中
POST  _reindex
{
  "source": {
    "index": "blogs"
  },
  "dest": {
    "index": "blogs_fix"
  }
}
```



* Reindex API 支持把文档从一个索引拷贝到另一个索引
* 使用 Reindex API 的一些场景
  * 修改索引的主分片数
  * 改变字段的 Mapping 中的字段类型
  * 集群内数据迁移、跨集群的数据迁移



**注意**

* Reindex 要求文档 的`_source`字段是 enabled 的
* 需要提前创建好 index



### OP Type

有时候迁移后的索引可能也会存在一些数据，直接覆盖肯定是不行的。

设置 `op_type`为`create`后 reindex 只会创建不存在的文档，已存在的文档就不会写入。

```shell
# user2中存在的文档则不会写入
POST  _reindex
{
  "source": {
    "index": "user"
  },
  "dest": {
    "index": "user2",
    "op_type": "create"
  }
}
```





### 跨集群 Reindex

```shell
POST _reindex
{
	"source":{
		"remote":{
			"host":"http://otherhost:9200"
		},
		"index":"source",
		"size":100,
		"qyery":{
			"match":{
				"test":"data"
			}
		}
	},
	"dest":{
		"index":"dest"
	}
}
```

同时需要修改 elasticsearch.yml，并重启节点

```shell
reindex.remote.whitelist:"otherhost:9200,another:9200"
```

