# QuickStart

## 1. 流程

* 1）创建 Index（Settings & Mappings）
* 2）导入数据
* 3）CRUD
* 4）索引别名

> 本教程基于Elasticsearch7.x版本



## 2. Start

### 1. Mapping

自定义 Mapping 有两种方法

* 1）可以参考 API，纯手写
* 2）为了减少输入的工作量，减少出错概率，可以依照以下步骤
  * 创建一个临时的 Index，写入一些样本数据
  * 通过 访问 Mapping API 获得该临时文件的动态 Mapping 定义
  * 修改自动创建的 Mapping（比如自动推断的类型可能不正确等），使用该配置创建你的索引
  * 删除临时索引

> **注意：**Mapping 一旦定义，后续无法修改，所以一开始就要设置好。

直接写入测试数据

```shell
POST sites_v1/_doc
{
  "id":"mock id",
  "keywords":["search"],
  "host":"baidu.com"
}
```

未指定 Mapping 写入数据的时候，Elasticsearch 会根据写入的文档来自动生成 Mapping。

查看一下生成的 Mapping

```shell
# 查看自动生成的 Mapping
GET sites_v1/_mapping
# 结果如下
{
  "sites" : {
    "mappings" : {
      "properties" : {
        "host" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "id" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        },
        "keywords" : {
          "type" : "text",
          "fields" : {
            "keyword" : {
              "type" : "keyword",
              "ignore_above" : 256
            }
          }
        }
      }
    }
  }
}

```

假设自动生成的 Mapping 有的字段类型识别错了，那就在这个基础上手动修改，不用每个字段都去写了。

假设 这个自动生成的 Mapping 不是很满意，那就手动改一下

```shell
# 删除 Index
DELETE sites_v1

# 修改后指定 Mapping
PUT sites_v1
{
  "mappings": {
    "properties": {
      "host": {
        "type": "keyword"
      },
      "id": {
        "type": "keyword"
      },
      "keywords": {
        "type": "text"
      }
    }
  }
}
```



### 2. Settings

一般创建索引时需要在`Settings`中手动指定主分片与副本分片数。

```sh
 "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 1
    }
```

删除索引后重新创建，可以和Mapping一起设置。

```shell
# 删除索引后重新创建
DELETE sites_v1
PUT sites_v1
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1
  },
  "mappings": {
    "properties": {
      "host": {
        "type": "keyword"
      },
      "id": {
        "type": "keyword"
      },
      "keywords": {
        "type": "text"
      }
    }
  }
}
```

对于生产环境中分片的设定，需要提前做好容量规划

* 分片数设置过小
  * 导致后续无法增加节点实现水平扩展
  * 当个分片的数据量太大，导致数据重新分配耗时
* 分片数设置过大，（7.0 开始默认主分片设置成1 ，解决了 over-sharding 的问题）
  * 影响搜索结果的相关性打分，影响统计结果的准确性
  * 单个节点上过多的分片，会导致资源浪费，同时也会影响性能



### 3. 分词器

需要单独安装。

```shell
# 需要先 close Index
POST sites_v1/_close
# 为 Index 单独指定分词器
PUT sites_v1/_settings
{
  "index":{
    "analysis.analyzer.default.type":"ik_max_word",
    "analysis.search_analyzer.default.type":"ik_smart"
  }
}
# 然后继续开启
POST sites_v1/_open
```



### 4. 写入数据

使用批量操作`_bulk`写入部分数据

```shell
#写入部分数据
 POST sites_v1/_bulk
{"index":{"_id":"1"}}
{"id":"1","keywords":["golang"],"host":"golang.org"}
{"index":{"_id":"2"}}
{"id":"2","keywords":["java"],"host":"java.com"}
{"index":{"_id":"3"}}
{"id":"3","keywords":["cpp"],"host":"cplusplus.com"}
```





## 3. 其他

### 1. 索引别名

建议为所有的 Index 都指定一个别名，后续可以进行索引的平滑切换。

比如创建的 Index 名为`sites_v1`，通过如下请求添加了一个别名`sites`。

```shell
# alias 指定别名 
POST _aliases
{
    "actions": [
        { "add": {
            "alias": "sites",
            "index": "sites_v1"
        }}
    ]
}
```

后续就能通过`sites`来访问索引`sites_v1`了。

由于 Mapping 设置之后就不能改了，所以假如某天需要调整 Mapping 就只能创建一个新的 Index。

比如叫做`sites_v2`，然后只需要把`sites_v2`别名设置为`sites`就能直接不做任何改动的情况下平滑过渡到新 Index。

```shell
# alias 指定别名到新 Index 同时移除旧的 
POST _aliases
{
    "actions": [
        { "add": {
            "alias": "sites",
            "index": "sites_v2"
        },
        "remove": {
            "alias": "sites",
            "index": "sites_v1"
        }}
    ]
}
```

