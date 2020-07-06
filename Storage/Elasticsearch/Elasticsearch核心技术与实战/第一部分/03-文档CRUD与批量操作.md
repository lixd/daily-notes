# 文档的基本 CRUD 和批量操作

## 1. CRUD

### 1. Create

```shell
# POST 自动生成 id
POST users/_doc
{
	"firstName":"Jack",
	"lastName":"Johnson",
	"tags":["guitar","skateboard"]
}

# PUT 方法 指定 id
PUT users/_create/1
{
	"firstName":"Jack",
	"lastName":"Johnson",
	"tags":["guitar","skateboard"]
}
```

* 支持自动生成文档 ID 和指定文档 ID 两种方式
* 通过调用`POST users/_doc`系统会自动生成 文档 ID
* 使用`PUT users/_create/1` 创建时，URI 中已经显式指定 `_create(新建文档)`，此时如果该 id 的文档已经存在，则操作失败



### 2. Get

```shell
GET /users/_doc/1
```

* 找到文档，返回 HTTP 200
  * 文档元信息
    * `_index`/`_type`
      * 版本信息，同一个 Id 的文档，即使被删除， Version 也会不断增加
      * _source 中默认包含了文档的所有原始信息
* 找不到文档，返回 HTTP 404



### 3. Index

Index 和 Create 不一样的地方: 如果文档不存在，就索引新的文档。否则现有文档会被删除然后新的文档被索引，且版本信息 +1

> 感觉可以理解为 replace

```shell
PUT users/_doc/1
{
	"tags":["guitar","skateboard","reading"]
}
```



例如:

最开始 user 被 create 了，文档如下

```json
{
	"firstName":"Jack",
	"lastName":"Johnson",
	"tags":["guitar","skateboard"]
}
```

第一次被创建所以版本号为 1，

现在执行 Index ，由于 id 为 1 的文档已经存在了，所以会先删除现有的文档，然后索引新的文档，且版本号 +1。 Index 执行后文档如下:

```json
{
	"tags":["guitar","skateboard","reading"]
}
```

**Index 会直接替换，并不是更新。**



### 4. Update

Update 方法不会删除原来的文档，而是实现真正的数据会更新。

POST 方法 /Payload 需要包含在`doc`中

```shell
POST users/_update/1
{
	"doc":{
		"albums":["Albums1","Albums2"]
	}
}
```

### 5. DELETE

通过 id 删除文档。

```shell
DELETE users/_doc/1
```



### 6. 练习

```shell
# Create
PUT company/_doc/1
{
  "name": "China Mobile",
  "phone": "10086"
}

# Update
POST company/_update/1
{
  "doc": {
      "name": "China Mobile 5G",
      "phone": "1008611"
  }
}

# Get
GET company/_doc/1

# Delete
DELETE company/_doc/1
```



## 2. 批量操作

### 1. Bulk API

#### 1. 概述

* 支持在一次 API 调用中，对不同的索引进行操作。

* 支持四种类型操作
  * Index
  * Create
  * Update
  * Delete
* 可以在 URI 中指定 Index，也可以在请求的 Payload 中指定
* 操作中单条操作失败，并不会影响其他操作
* 返回结果包括了每一条操作的结果

#### 2. 标准语法

```shell
action and meta_data \n
optional source \n

action and meta_data \n
optional source \n

action and meta_data \n
optional source \n
```

两行数据构成一次操作。

* 1）第一行是操作类型可以 index，create，update，或者delete
* 2）metadata 就是文档的元数据
* 2）第二行就是我们的可选的数据体，使用这种方式批量插入的时候，我们需要设置的它的Content-Type为application/json。



> * 1）index 和 create  第二行是source数据体
> * 2）delete 没有第二行
> * 3）update 第二行可以是partial doc，upsert或者是script
>
> **注意**：由于每行必须有一个换行符，所以json格式只能在一行里面而不能使用格式化后的内容

bulk请求的路径有三种和前面的mget的请求类似：

* 1）`/_bulk` 
* 2）`/{index}/_bulk`
* 3）`/{index}/{type}/_bulk`

上面的三种格式，如果提供了index和type那么在数据体里面的action就可以不提供，同理提供了index但没有type，那么就需要在数据体里面自己添加type。

#### 3. 例子

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





### 2. 批量读取 mget

批量操作，可以减少网络连接所产生的开销，提高性能。

```shell
GET /_mget
{
    "docs" : [
        {
            "_index" : "test",
            "_type" : "_doc",
            "_id" : "1",
            "_source" : false
        },
        {
            "_index" : "test",
            "_type" : "_doc",
            "_id" : "2",
            "_source" : ["field3", "field4"]
        },
        {
            "_index" : "test",
            "_type" : "_doc",
            "_id" : "3",
            "_source" : {
                "include": ["user"],
                "exclude": ["user.location"]
            }
        }
    ]
}
```

_source 指定返回结果中需要哪些字段。

```shell
# false 直接一个都不保留
 "_source" : false
# 默认是 include
"_source" : ["field3", "field4"]
# include 和 exclude 分开写
"_source" : {
     "include": ["user"],
     "exclude": ["user.location"]
}
```





两种写法

* 1）`GET /_mget`
* 2）`GET /<index>/_mget`

如果 这里指定了 index ，后续 docs 中就不用指定了。



### 3. 批量搜索 msearch

```shell
POST kibana_sample_data_ecommerce/_msearch
{}
{"query" : {"match_all" : {}},"size":1}
{"index" : "kibana_sample_data_flights"}
{"query" : {"match_all" : {}},"size":2}
```



### 4. 注意事项

调用 API 时每次不要传递过大的数据，否则会对集群产生较大压力，造成性能下降。

> 默认限制为 100M，一般建议 15M 以内。



## 3. 常见错误返回

| 问题         | 原因               |
| ------------ | ------------------ |
| 无法连接     | 网络故障或集群挂了 |
| 连接无法关闭 | 网络故障或节点出错 |
| 429          | 集群过于繁忙       |
| 4xx          | 请求体格式有错     |
| 500          | 集群内部错误       |



## 4. 练习

```shell
############Create Document############
#create document. 自动生成 _id
POST users/_doc
{
	"user" : "Mike",
    "post_date" : "2019-04-15T14:12:12",
    "message" : "trying out Kibana"
}

#create document. 指定Id。如果id已经存在，报错
PUT users/_doc/1?op_type=create
{
    "user" : "Jack",
    "post_date" : "2019-05-15T14:12:12",
    "message" : "trying out Elasticsearch"
}

#create document. 指定 ID 如果已经存在，就报错
PUT users/_create/1
{
     "user" : "Jack",
    "post_date" : "2019-05-15T14:12:12",
    "message" : "trying out Elasticsearch"
}

### Get Document by ID
#Get the document by ID
GET users/_doc/1


###  Index & Update
#Update 指定 ID  (先删除，在写入)
GET users/_doc/1

PUT users/_doc/1
{
	"user" : "Mike"

}


#GET users/_doc/1
#在原文档上增加字段
POST users/_update/1/
{
    "doc":{
        "post_date" : "2019-05-15T14:12:12",
        "message" : "trying out Elasticsearch"
    }
}



### Delete by Id
# 删除文档
DELETE users/_doc/1


### Bulk 操作
#执行两次，查看每次的结果

#执行第1次
POST _bulk
{ "index" : { "_index" : "test", "_id" : "1" } }
{ "field1" : "value1" }
{ "delete" : { "_index" : "test", "_id" : "2" } }
{ "create" : { "_index" : "test2", "_id" : "3" } }
{ "field1" : "value3" }
{ "update" : {"_id" : "1", "_index" : "test"} }
{ "doc" : {"field2" : "value2"} }


#执行第2次
POST _bulk
{ "index" : { "_index" : "test", "_id" : "1" } }
{ "field1" : "value1" }
{ "delete" : { "_index" : "test", "_id" : "2" } }
{ "create" : { "_index" : "test2", "_id" : "3" } }
{ "field1" : "value3" }
{ "update" : {"_id" : "1", "_index" : "test"} }
{ "doc" : {"field2" : "value2"} }

### mget 操作
GET /_mget
{
    "docs" : [
        {
            "_index" : "test",
            "_id" : "1"
        },
        {
            "_index" : "test",
            "_id" : "2"
        }
    ]
}


#URI中指定index
GET /test/_mget
{
    "docs" : [
        {

            "_id" : "1"
        },
        {

            "_id" : "2"
        }
    ]
}


GET /_mget
{
    "docs" : [
        {
            "_index" : "test",
            "_id" : "1",
            "_source" : false
        },
        {
            "_index" : "test",
            "_id" : "2",
            "_source" : ["field3", "field4"]
        },
        {
            "_index" : "test",
            "_id" : "3",
            "_source" : {
                "include": ["user"],
                "exclude": ["user.location"]
            }
        }
    ]
}

### msearch 操作
POST kibana_sample_data_ecommerce/_msearch
{}
{"query" : {"match_all" : {}},"size":1}
{"index" : "kibana_sample_data_flights"}
{"query" : {"match_all" : {}},"size":2}


### 清除测试数据
#清除数据
DELETE users
DELETE test
DELETE test2
```

