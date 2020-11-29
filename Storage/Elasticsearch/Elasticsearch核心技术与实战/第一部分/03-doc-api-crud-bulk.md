# Document API

> 官方文档 https://www.elastic.co/guide/en/elasticsearch/reference/7.10/docs.html

**所有操作都由 Request 和 Payload 两部分组成，其中部分 API Payload 可省略。**

## 1. Single document APIs

### 1. Index

将文档写入 ES。分为 Index 和 Create 两种操作。

Request

```json
# 一般也把 _doc endpoint 称为 index（动词）
PUT /<index>/_doc/<_id>
POST /<index>/_doc/

# 以下两个方法测试发现效果是一样的
# _create 则是 create
PUT /<index>/_create/<_id>
POST /<index>/_create/<_id>
```

* Index
  * `PUT /<index>/_doc/<_id>`
  * `POST /<index>/_doc/`
* Create
  * `PUT /<index>/_create/<_id>`
  * `POST /<index>/_create/<_id>`



两个参数分别为：

* Index：指定索引，如果索引不存在会自动创建。
* _id：指定新建文档 ID。

两个 endpoint 的区别：

* _create：只会在指定文档不存在时才创建，存在则报错（put if absent）。
* _doc : 指定文档存在则删除并写入新文档。

可选参数

* op_type（可取值如下）
  * index：将本次操作转为 index（指定ID时默认为index，未指定则为create）。
  * create：将本次操作转为 create。

```json
# 二者是等价的
PUT /<index>/_doc/<_id>?op_type=create
PUT /<index>/_create/<_id>
```



example：

```shell
# index PUT 方法 指定 id
PUT users/_doc/1
{
  "user": "意琦行",
  "title": "绝代剑宿",
  "summary": "古岂无人，孤标凌云谁与朋。高冢笑卧，天下澡雪任琦行。"
}
{
  "_index" : "users",
  "_type" : "_doc",
  "_id" : "1",
  "_version" : 1,
  "result" : "created",
  "_shards" : {
    "total" : 2,
    "successful" : 1,
    "failed" : 0
  },
  "_seq_no" : 0,
  "_primary_term" : 1
}

# create 通过 op_type 转为 create
PUT users/_doc/1?op_type=create
{
  "user": "意琦行",
  "title": "绝代剑宿",
  "summary": "古岂无人，孤标凌云谁与朋。高冢笑卧，天下澡雪任琦行。"
}
{
  # 转为 create 后报错，因为id=1的文档已经存在了
  "error" : {
    "root_cause" : [
      {
        "type" : "version_conflict_engine_exception",
        "reason" : "[1]: version conflict, document already exists (current version [1])",
        "index_uuid" : "g9A1EI7ZT7W93Hf96wEt-g",
        "shard" : "0",
        "index" : "users"
      }
    ],
    "type" : "version_conflict_engine_exception",
    "reason" : "[1]: version conflict, document already exists (current version [1])",
    "index_uuid" : "g9A1EI7ZT7W93Hf96wEt-g",
    "shard" : "0",
    "index" : "users"
  },
  "status" : 409
}

```



**使用建议**

只使用`PUT /<index>/_doc/<_id>` 就行了，如果数据中有唯一ID（比如数据库主键之类的）则不建议使用 ES 自动生成 ID，可能会产生一些重复数据，如果实在没有那就只能用自增ID了。

* Create
  * `PUT /<index>/_doc/<_id>?op_type=create`
* Index 
  * `PUT /<index>/_doc/<_id>`



### 2. Get

检索文档信息。

Request

```shell
# 返回元数据+source字段
GET <index>/_doc/<_id>
HEAD <index>/_doc/<_id>

# _source 只返回文档source字段
GET <index>/_source/<_id>
HEAD <index>/_source/<_id>
```

两种 Method 的区别：

* GET：检索文档及内容

* HEAD：检测文档是否存在

  

两种 endpoint 区别

* _doc：返回元数据+source字段
* _sources：只返回文档source字段



**参数**

* _source
  * 设置是否返回 source 字段（默认返回）
  * `GET twitter/_doc/0?_source=false`
* _source_includes / _source_excludes
  * 指定 source 字段中要返回或不返回的字段
  * `GET users/_doc/1?_source_includes=title`



Examples

```json
# 查看全部信息
GET users/_doc/1
{
  "_index" : "users",
  "_type" : "_doc",
  "_id" : "1",
  "_version" : 1,
  "_seq_no" : 0,
  "_primary_term" : 1,
  "found" : true,
  "_source" : {
    "user" : "意琦行",
    "title" : "绝代剑宿",
    "summary" : "古岂无人，孤标凌云谁与朋。高冢笑卧，天下澡雪任琦行。"
  }
}
# 不返回 source 字段
GET users/_doc/1?_source=false
{
  "_index" : "users",
  "_type" : "_doc",
  "_id" : "1",
  "_version" : 1,
  "_seq_no" : 0,
  "_primary_term" : 1,
  "found" : true
}
# 只返回 source 字段
GET users/_source/1
{
  "user" : "意琦行",
  "title" : "绝代剑宿",
  "summary" : "古岂无人，孤标凌云谁与朋。高冢笑卧，天下澡雪任琦行。"
}
# 检测文档是否存在
HEAD users/_doc/1
200 - OK
```

### 3. DELETE

通过 id 删除文档。

Request

```shell
DELETE /<index>/_doc/<_id>
```

```json
DELETE users/_doc/2
{
  "_index" : "users",
  "_type" : "_doc",
  "_id" : "2",
  "_version" : 2,
  "result" : "deleted",
  "_shards" : {
    "total" : 2,
    "successful" : 2,
    "failed" : 0
  },
  "_seq_no" : 2,
  "_primary_term" : 1
}
```



### 4. Update

Request

```shell
POST /<index>/_update/<_id>
```

Payload

```json
{
 "doc":{},
 "upsert":{},
 "script":{},
 "scripted_upsert": true
}
```

* doc 更新内容（必选项）
* upsert 若文档不存在则用 upsert  中的内容来创建文档
* script 使用脚本来更新文档
* scripted_upsert 若文档是通过 upsert  创建的是否需要执行更新脚本



example

```shell
# 对于存在的字段会更新，不存在则会添加。
POST users/_update/1
{
   "doc": {
      "title": "尘外孤标",
      "arms": "澡雪"
   }
}
{
  "_index" : "users",
  "_type" : "_doc",
  "_id" : "1",
  "_version" : 7,
  "result" : "updated",
  "_shards" : {
    "total" : 2,
    "successful" : 2,
    "failed" : 0
  },
  "_seq_no" : 8,
  "_primary_term" : 1
}

# 文档不存在则创建文档
POST users/_update/2
{
  "doc": {}, 
   "upsert": {
     "user": "意琦行",
     "title": "绝代剑宿",
     "summary": "古岂无人，孤标凌云谁与朋。高冢笑卧，天下澡雪任琦行。"
   }
}
{
  "_index" : "users",
  "_type" : "_doc",
  "_id" : "2",
  "_version" : 1,
  "result" : "created",
  "_shards" : {
    "total" : 2,
    "successful" : 2,
    "failed" : 0
  },
  "_seq_no" : 11,
  "_primary_term" : 1
}

# 删除字段
POST users/_update/1
{
  "script" : "ctx._source.remove(\"arms\")"
}
{
  "_index" : "users",
  "_type" : "_doc",
  "_id" : "1",
  "_version" : 8,
  "result" : "updated",
  "_shards" : {
    "total" : 2,
    "successful" : 2,
    "failed" : 0
  },
  "_seq_no" : 10,
  "_primary_term" : 1
}

```



## 2. Multi-document APIs

调用 API 时每次不要传递过大的数据，否则会对集群产生较大压力，造成性能下降。

> 默认限制为 100M，一般建议 15M 以内。

### 1. Bulk API

* 支持在一次 API 调用中，对不同的索引进行操作。

* 支持四种类型操作
  * Index
  * Create
  * Update
  * Delete
* 可以在 URI 中指定 Index，也可以在请求的 Payload 中指定
* 操作中单条操作失败，并不会影响其他操作
* 返回结果包括了每一条操作的结果

Request

```shell
POST /_bulk
POST /<index>/_bulk
```

Payload

**请求一行，请求体一行，不能换行。**

```shell
action and meta_data \n
optional source \n

action and meta_data \n
optional source \n
```

两行数据构成一次操作。

* 1）第一行是操作类型可以 index，create，update，或者delete
* 2）metadata 就是文档的元数据
* 3）第二行就是我们的可选的数据体，使用这种方式批量插入的时候，我们需要设置的它的Content-Type为application/json。

如果 URI 中提供了 index 和 type 那么在数据体里面的 action 就可以不提供，同理提供了 index 但没有 type，那么就需要在数据体里面自己添加 type。

> * 1）index 和 create  第二行是source数据体
> * 2）delete 没有第二行
> * 3）update 第二行可以是partial doc，upsert或者是script
>
> **注意**：由于每行必须有一个换行符，所以json格式只能在一行里面而不能使用格式化后的内容



Examples

```shell
POST _bulk
# 请求1
{ "index" : { "_index" : "test", "_id" : "1" } }
# 请求体1
{ "field1" : "value1" } 
# 请求2 删除不需要请求体
{ "delete" : { "_index" : "test", "_id" : "2" } }
# 请求3
{ "create" : { "_index" : "test2", "_id" : "3" } }
# 请求体3
{ "field1" : "value3" }
# 请求4
{ "update" : {"_id" : "1", "_index" : "test"} }
# 请求体4
{ "doc" : {"field2" : "value2"} }
```



```json
POST /_bulk
{ "create" : { "_index" : "users", "_id" : "3" } }
{"user" : "剑子仙迹","title":"道教顶峰", "summary":"何须剑道争锋？千人指，万人封，可问江湖鼎峰；三尺秋水尘不染，天下无双。"}
{ "create" : { "_index" : "users", "_id" : "4" } }
{"user" : "疏楼龙宿","title":"儒门龙首","summary":"华阳初上鸿门红，疏楼更迭，龙麟不减风采；紫金箫，白玉琴，宫灯夜明昙华正盛，共饮逍遥一世悠然。"}
{ "create" : { "_index" : "users", "_id" : "5" } }
{ "user" : "佛剑分说", "title":"圣行者",  "summary":"杀生为护生，斩业非斩人。"}
```



### 2. mget

批量查询，和 Bulk API 类似。。

Request

```shell
GET /_mget
GET /<index>/_mget
```

Payload

```json
{
    "docs":[]
}
```



```shell
# payload 中指定 index
GET /_mget
{
    "docs" : [
        {
            "_index" : "users",
            "_id" : "1"
        },
        {
            "_index" : "users",
            "_id" : "2",
            "_source" : ["user", "title"]
        }
    ]
}

# uri 中指定 index
GET /users/_mget
{
  "docs":[
      {"_id": 1},
      {"_id": 2,
        "_source": {
           "exclude": ["summary"]
        }
      }
    ]
}
```



### 3. Update By Query

Request

```shell
POST /<index>/_update_by_query
```

Payload

```json
# query 用于过滤要更新的文档 script 则执行具体更新逻辑
{
  "query": {},
  "script": {}
}
```



Examples

```json
# 只能通过 script 进行更新
POST /users/_update_by_query
{
  "query": {
    "match": {
      "user": "意琦行"
    }
  },
  "script": {
    "source": "ctx._source['user']='瑰意琦行'",
    "lang": "painless"
  }
}
```






### 4. Delete By query

删除查询到的文档。

Request

```shell
POST /<index>/_delete_by_query
```

Payload

```json
{
  "query": {}
}
```



Examples

```shell
POST /users/_delete_by_query
{
  "query": {
    "match": {
     "title" : "尘外孤标"
    }
  }
}
{
  "took" : 698,
  "timed_out" : false,
  "total" : 1,
  "deleted" : 1, # 这里表明删除了一个文档
  "batches" : 1,
  "version_conflicts" : 0,
  "noops" : 0,
  "retries" : {
    "bulk" : 0,
    "search" : 0
  },
  "throttled_millis" : 0,
  "requests_per_second" : -1.0,
  "throttled_until_millis" : 0,
  "failures" : [ ]
}
```

### 5. Reindex

将文档从源索引复制到目标索引。

> 一般用于修改 Mapping。源索引创建后无法修改 Mapping，此时只能在创建一个索引，调整好 Mapping 后通过 Reindex 将文档拷贝到新索引。

Request

```json
POST _reindex
```

Payload

```json
{
  "source": {
    "index": "src"
  },
  "dest": {
    "index": "target"
  }
}
```



Examples

```json
POST _reindex
{
  "source": {
    "index": "users"
  },
  "dest": {
    "index": "user"
  }
}
{
  "took" : 16,
  "timed_out" : false,
  "total" : 4,
  "updated" : 3,
  "created" : 1,
  "deleted" : 0,
  "batches" : 1,
  "version_conflicts" : 0,
  "noops" : 0,
  "retries" : {
    "bulk" : 0,
    "search" : 0
  },
  "throttled_millis" : 0,
  "requests_per_second" : -1.0,
  "throttled_until_millis" : 0,
  "failures" : [ ]
}
```



