# Index & Reindex

一个 index 的创建过程大致如下：

* 1）配置阶段：准备好 索引名、settings、mapping 等信息
* 2）创建 index
* 3）给 index 绑定别名，程序中使用的就是这个别名

修改流程：

* 1）创建新 index
* 2）迁移数据
* 3）修改别名绑定关系，程序中不需要改动任何代码。

> 如果不使用别名，每次修改索引时都需要改代码。



## 1. 创建流程

以一个文章站的文章为例，建立一个索引。



### 1. 配置阶段

* 索引名为 article_v1、article_v2 这样, 别名就用 article。

* settings：分片和副本都用一个即可。
* mapping：



### 2. 创建 index

```json
PUT article_v1
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "default": {
          "type": "ik_max_word"
        },
        "default_search": {
          "type": "ik_smart"
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "classify": {
        "type": "text"
      },
      "describe": {
        "type": "text"
      },
      "process": {
        "type": "long"
      },
      "questionNum": {
        "type": "long"
      },
      "status": {
        "type": "long"
      },
      "tid": {
        "type": "keyword"
      },
      "title": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      }
    }
  }
}
```



### 3. 添加别名

```json
POST /_aliases
{
  "actions": [
    {
      "add": {
        "index": "article_v1",
        "alias": "article"
      }
    }
  ]
}
```





## 2. 更新流程

后续发现，前面添加的 mapping 中某个字段不对，需要更新。但是 es 中无法更新 mapping，只能新建一个。



### 1. 创建新 index

```json
PUT article_v2
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "default": {
          "type": "ik_max_word"
        },
        "default_search": {
          "type": "ik_smart"
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "classify": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      },
      "describe": {
        "type": "text"
      },
      "process": {
        "type": "long"
      },
      "questionNum": {
        "type": "long"
      },
      "status": {
        "type": "long"
      },
      "tid": {
        "type": "keyword"
      },
      "title": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      }
    }
  }
}
```





### 2. Reindex

将旧 index 中的数据导入到新 index 中去。

```json
POST _reindex
{
  "source": {
    "index": "article_v1"
  },
  "dest": {
    "index": "article_v2"
  }
}
```

**注意： _reindex 获取的索引的快照的数据，也就是说在重建索引的过程中新写入的数据可能会丢失**



业务允许的话，可以先关闭旧 index ，关闭后无法读写。

```json
# 关闭索引
POST article/_close
# 开启索引
POST article/_open
```

或者将旧index切换到 readonly 状态。

```json
PUT article/_settings
{
  "index": {
    "blocks": {
      "read_only": "true"
    }
  }
}
```



### 3. 修改别名绑定关系

将别名中旧index转到新index上。

```json
POST /_aliases
{
  "actions": [
    {
      "remove": {
        "index": "article_v1",
        "alias": "article"
      }
    },
    {
      "add": {
        "index": "article_v2",
        "alias": "article"
      }
    }
  ]
}
```