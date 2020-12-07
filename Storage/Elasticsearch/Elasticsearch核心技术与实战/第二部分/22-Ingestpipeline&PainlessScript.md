# Ingestpipeline&PainlessScript

## Ingest Node

* ES 5.0 后，引入了一种新的节点类型。默认配置下，每个节点都是Ingest Node
  * 具有**预处理数据**的能力，可拦截 Index 或 Bulk API 的请求
  * 对数据进行转换，并重新返回给 Index 或 Bulk API
* 无需 Logstash，就可以进行数据的预处理，例如
  * 为某个字段设置默认值；重命名某个字段的字段名；对字段值进行 Split 操作
  * 支持设置 Painless 脚本，对数据进行更加复杂的加工



### Pipeline & Processor

* Pipeline - 管道会对通过的数据（文档），按照顺序进行加工
* Processor - ES 对一些加工的行为进行了抽象包装
  * ES 有很多内置的 Processor。
  * **也支持通过插件的方式**，实现自己的 Processor



#### _simulate 测试pipeline

ES 提供了 测试 API

```shell
# 测试split tags _simulate API 模拟Pipeline
POST _ingest/pipeline/_simulate
{
 
  "pipeline": {
    "description": "to split blog tags",
    # 在数组中定义 Processor
    "processors": [
      {
        "split": {
          "field": "tags",
          "separator": ","
        }
      }
    ]
  },
  # docs 中提供测试用的 文档
  "docs": [
    {
      "_index": "index",
      "_id": "id",
      "_source": {
        "title": "Introducing big data......",
        "tags": "hadoop,elasticsearch,spark",
        "content": "You konw, for big data"
      }
    },
    {
      "_index": "index",
      "_id": "idxx",
      "_source": {
        "title": "Introducing cloud computering",
        "tags": "openstack,k8s",
        "content": "You konw, for cloud"
      }
    }
  ]
}

```



#### 定义 pipeline

```shell
# 为ES添加一个 Pipeline
PUT _ingest/pipeline/blog_pipeline
{
  "description": "a blog pipeline",
  "processors": [
      {
        "split": {
          "field": "tags",
          "separator": ","
        }
      },

      {
        "set":{
          "field": "views",
          "value": 0
        }
      }
    ]
}

#查看Pipleline
GET _ingest/pipeline/blog_pipeline


#测试pipeline blog_pipeline 为测试的 pipeline 
POST _ingest/pipeline/blog_pipeline/_simulate
{
  "docs": [
    {
      "_source": {
        "title": "Introducing cloud computering",
        "tags": "openstack,k8s",
        "content": "You konw, for cloud"
      }
    }
  ]
}
```



#### 使用 pipeline

```shell
#不使用pipeline更新数据
PUT tech_blogs/_doc/1
{
  "title":"Introducing big data......",
  "tags":"hadoop,elasticsearch,spark",
  "content":"You konw, for big data"
}

#使用pipeline更新数据
PUT tech_blogs/_doc/2?pipeline=blog_pipeline
{
  "title": "Introducing cloud computering",
  "tags": "openstack,k8s",
  "content": "You konw, for cloud"
}
```



#### 内置 processor

* Split Processor（将给定字段值拆分后组成一个数组)
* Remove / Rename Processor (移除 / 重命名字段)
* Append（增加新的值）
* Convert（类型转换）
* Data / JSON (日期格式转换)
* Fail Processor（一旦出现异常，该 Pipeline 指定的错误信息能返回给用户）
* Foreach Processor（为数组字段中的每个元素都使用一个相同的处理器）
* Grok Processor（日志的日期格式切割）
* Gsub / Join / Split（字符串替换 / 数组转字符串 /字符串转数组）
* Lowercase / Upcase （大小写转换）



#### Ingest Node v.s Logstash

|                | Logstash                                   | Ingest Node                                                |
| -------------- | ------------------------------------------ | ---------------------------------------------------------- |
| 数据输入与输出 | 支持从不同的数据源读取，并写入不同的数据源 | 支持从 ES REST API 获取数据并且写入 ES                     |
| 数据缓冲       | 实现了简单的数据队列，支持重写             | 不支持缓冲                                                 |
| 数据处理       | 支持大量的插件，也支持定制开发             | 内置的插件，可以开发 Plugin 进行扩展（Plugin更新需要重启） |
| 配置和使用     | 增加了一定的架构复杂度                     | 无需额外部署                                               |



### Painless

Painless 支持所有 Java 的数据类型及 Java API 子集。

Painless Script 具备以下特性
* 高性能 / 安全
* 支持显式类型或者动态定义类型



**用途**

* 可以对文档字段进行加工处理
  * 更新或删除字段，处理数据聚合操作
  * Script Field：对返回的字段提前进行计算
  * Function Score：对文档的算分进行处理
* 在 Ingest Pipeline 中执行脚本
* 在 Reindex API 中，Update By Query时，对数据进行处理

**语法**

| 上下文              | 语法                   |
| ------------------- | ---------------------- |
| ingestion           | ctx.field.name         |
| Update              | ctx._source.field.name |
| Search &Aggregation | doc["field name"]      |



**测试**

```shell
# 增加一个 Script Prcessor
POST _ingest/pipeline/_simulate
{
  "pipeline": {
    "description": "to split blog tags",
    "processors": [
      {
        "split": {
          "field": "tags",
          "separator": ","
        }
      },
      {
        "script": {
          "source": """
          if(ctx.containsKey("content")){
            ctx.content_length = ctx.content.length();
          }else{
            ctx.content_length=0;
          }


          """
        }
      },

      {
        "set":{
          "field": "views",
          "value": 0
        }
      }
    ]
  },

  "docs": [
    {
      "_index":"index",
      "_id":"id",
      "_source":{
        "title":"Introducing big data......",
  "tags":"hadoop,elasticsearch,spark",
  "content":"You konw, for big data"
      }
    },


    {
      "_index":"index",
      "_id":"idxx",
      "_source":{
        "title":"Introducing cloud computering",
  "tags":"openstack,k8s",
  "content":"You konw, for cloud"
      }
    }

    ]
}
```



**保存**

```shell
#保存脚本在 Cluster State
POST _scripts/update_views
{
  "script":{
    "lang": "painless",
    "source": "ctx._source.views += params.new_views"
  }
}
# 后续根据 id 进行调用
POST tech_blogs/_update/1
{
  "script": {
    "id": "update_views",
    "params": {
      "new_views":1000
    }
  }
}
```

