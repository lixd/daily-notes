# 对象与 Nested 对象

# ES 中处理关联关系

* 关系型数据库，一般会考虑 Normalize（范式） 数据；在 Elasticsearch 中，往往会考虑 Denormalize 数据（反范式）
  * Denormalize 的好处：读取速度变快 、无需表连接、无需行锁
* Elasticsearch 并不擅长处理关联关系。我们一般采用以下四种方法处理关联
  * 对象类型
  * 嵌套对象（Nested Object）
  * 父子关联关系（Parent / Child）
  * 应用端关联



  

## Nested 数据类型

* Nested 数据类型允许对象数组中的对象被独立索引
* 使用 nested 和 properties 关键字，将所有 actors 索引到多个分隔的文档
* 在内部，Nested 文档会被保存在两个 Lucene 文档中，在查询时做 Join 处理

**需要在 Mapping 中设置**

```shell
# 创建 Nested 对象 Mapping
PUT my_movies
{
      "mappings" : {
      "properties" : {
        "actors" : {
          # 指定为 nested 对象
          "type": "nested",
          "properties" : {
            "first_name" : {"type" : "keyword"},
            "last_name" : {"type" : "keyword"}
          }},
        "title" : {
          "type" : "text",
          "fields" : {"keyword":{"type":"keyword","ignore_above":256}}
        }
      }
    }
}
```



**Nested 对象聚合操作**

```shell
# 普通 aggregation不工作
POST my_movies/_search
{
  "size": 0,
  "aggs": {
    "NAME": {
      "terms": {
        "field": "actors.first_name",
        "size": 10
      }
    }
  }
}
# 需要使用 Nested Aggregation
POST my_movies/_search
{
  "size": 0,
  "aggs": {
    "actors": {
      "nested": {
        "path": "actors"
      },
      "aggs": {
        "actor_name": {
          "terms": {
            "field": "actors.first_name",
            "size": 10
          }
        }
      }
    }
  }
}
```



## 文档的父子关系



### Parent / Child

* 对象和 Nested 对象的局限性
  * 每次更新，需要重新索引整个对象（包括根对象和嵌套对象）
* ES 提供了 类似关系型数据库中 Join 的实现。使用 Join 数据类型实现，可以通过维护 Parent/Child 的关系，从而分离两个对象
  * 父文档 和 子文档是两个独立的文档
  * 更新父文档无需重新索引整个文档，子文档被添加、更新、删除也不会影响到父文档和其他子文档



### 设置 Mapping

```shell
# 设定 Parent/Child Mapping
PUT my_blogs
{
  "settings": {
    "number_of_shards": 2
  },
  "mappings": {
    "properties": {
      "blog_comments_relation": {
      	# join 类型表明是父子关系
        "type": "join",
        # blog 为父文档名
        # comment 为子文档名
        "relations": {
          "blog": "comment"
        }
      },
      "content": {
        "type": "text"
      },
      "title": {
        "type": "keyword"
      }
    }
  }
}
```

### 索引父文档

```shell
#索引父文档
PUT my_blogs/_doc/blog1
{
  "title":"Learning Elasticsearch",
  "content":"learning ELK @ geektime",
  # 这里的 blog 就是 Mapping 中定义的父文档 叫 blog
  "blog_comments_relation":{
    "name":"blog"
  }
}
```

### 索引子文档

```shell
#索引子文档 指定routing=blog1 确保父子文档索引到同一个分片上
PUT my_blogs/_doc/comment1?routing=blog1
{
  "comment":"I am learning ELK",
  "username":"Jack",
  # comment 也是 Mapping 中定义的 子文档 
  # parent 指定具体哪个文档是该文档的父文档
  "blog_comments_relation":{
    "name":"comment",
    "parent":"blog1"
  }
}
```



* 父文档、子文档必须在同一分片
  * 确保查询 join 的性能
* 当指定子文档的时候，必须指定它的父文档 id
  * 使用 route参数来保证，分片到相同分片

### 嵌套对象 v.s 父子文档

|          | Nested Object                        | Parent / Child                         |
| -------- | ------------------------------------ | -------------------------------------- |
| 优点     | 文档存储在一起，读取性能高           | 父子文档可以独立更新                   |
| 缺点     | 更新嵌套的子文档时，需要更新整个文档 | 需要额外的内存维护关系。读取性能相对差 |
| 适用场景 | 子文档偶尔更新，以查询为主           | 子文档更新频繁                         |



### 练习

```shell
DELETE my_blogs

# 设定 Parent/Child Mapping
PUT my_blogs
{
  "settings": {
    "number_of_shards": 2
  },
  "mappings": {
    "properties": {
      "blog_comments_relation": {
        "type": "join",
        "relations": {
          "blog": "comment"
        }
      },
      "content": {
        "type": "text"
      },
      "title": {
        "type": "keyword"
      }
    }
  }
}


#索引父文档
PUT my_blogs/_doc/blog1
{
  "title":"Learning Elasticsearch",
  "content":"learning ELK @ geektime",
  "blog_comments_relation":{
    "name":"blog"
  }
}

#索引父文档
PUT my_blogs/_doc/blog2
{
  "title":"Learning Hadoop",
  "content":"learning Hadoop",
    "blog_comments_relation":{
    "name":"blog"
  }
}


#索引子文档
PUT my_blogs/_doc/comment1?routing=blog1
{
  "comment":"I am learning ELK",
  "username":"Jack",
  "blog_comments_relation":{
    "name":"comment",
    "parent":"blog1"
  }
}

#索引子文档
PUT my_blogs/_doc/comment2?routing=blog2
{
  "comment":"I like Hadoop!!!!!",
  "username":"Jack",
  "blog_comments_relation":{
    "name":"comment",
    "parent":"blog2"
  }
}

#索引子文档
PUT my_blogs/_doc/comment3?routing=blog2
{
  "comment":"Hello Hadoop",
  "username":"Bob",
  "blog_comments_relation":{
    "name":"comment",
    "parent":"blog2"
  }
}

# 查询所有文档
POST my_blogs/_search
{

}


#根据父文档ID查看
GET my_blogs/_doc/blog2

# Parent Id 查询
POST my_blogs/_search
{
  "query": {
    "parent_id": {
      "type": "comment",
      "id": "blog2"
    }
  }
}

# Has Child 查询,返回父文档
POST my_blogs/_search
{
  "query": {
    "has_child": {
      "type": "comment",
      "query" : {
                "match": {
                    "username" : "Jack"
                }
            }
    }
  }
}


# Has Parent 查询，返回相关的子文档
POST my_blogs/_search
{
  "query": {
    "has_parent": {
      "parent_type": "blog",
      "query" : {
                "match": {
                    "title" : "Learning Hadoop"
                }
            }
    }
  }
}



#通过ID ，访问子文档
GET my_blogs/_doc/comment3
#通过ID和routing ，访问子文档
GET my_blogs/_doc/comment3?routing=blog2

#更新子文档
PUT my_blogs/_doc/comment3?routing=blog2
{
    "comment": "Hello Hadoop??",
    "blog_comments_relation": {
      "name": "comment",
      "parent": "blog2"
    }
}
```

