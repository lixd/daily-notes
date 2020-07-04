# Search API

## 1. 概述

* URI Search
  * 在 URI 中使用查询参数
* Request Body Search
  * 使用 Elasticsearch 提供的，基于 JSON 格式的更加完备的 Query Domain Specific Language（DSL）

## 2. 详情

### 0. 指定索引

| 语法                   | 范围                |
| ---------------------- | ------------------- |
| /_search               | 集群上的所有索引    |
| /index1/_search        | index1              |
| /index1,index2/_search | index1 和 index2    |
| /index*/_search        | 以 index 开头的索引 |

### 1. URI 查询

* 使用`q`，指定查询字符串
* `query string syntax`，KV 键值对

```shell
GET kibana_sample_data_ecommerce/_search?q=customer_first_name:Eddie

# 查询 customer_first_name 叫做 Eddie 的客户
```

### 2. Request Body

```shell
POST kibana_sample_data_ecommerce/_search
{
	"profile": true,
	"query": {
		"match_all": {}
	}
}
```



### 3. 返回结果

```shell
{
  "took" : 12, # 本次请求耗时 ms
  "timed_out" : false,
  "_shards" : {
    "total" : 1,
    "successful" : 1,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : {
      "value" : 4675, # 符合条件的总文档数
      "relation" : "eq"
    },
    "max_score" : 1.0,
    "hits":[
    	{
        "_index" : "kibana_sample_data_ecommerce",
        "_type" : "_doc",
        "_id" : "JQ-W83IBZKoskNHA_XXX",
        "_score" : 1.0, # 相似度得分
        "_source" : {
          "category" : [
            "Men's Shoes",
            "Men's Clothing"
          ]
          },
      },
    ] # 结果集，默认前 10 个
  },
    "profile":[]
}
```



### 4. 相关性

Information Retrieval

* Precision（查准率） - 尽可能返回较少的无关文档
  * 返回的相关文档数 / 返回的全部文档数
* Recall（查全率） - 尽可能返回较多的相关文档
  * 返回的相关文档数 / 应该返回的文档数
* Ranking - 是否能够按照相关度进行排序？



## 3. 练习

```shell
#URI Query
GET kibana_sample_data_ecommerce/_search?q=customer_first_name:Eddie
GET kibana*/_search?q=customer_first_name:Eddie
GET /_all/_search?q=customer_first_name:Eddie


#REQUEST Body
POST kibana_sample_data_ecommerce/_search
{
	"profile": true,
	"query": {
		"match_all": {}
	}
}

```





## 4. URI Search

* q 指定查询语句，使用 Query String Syntax
* df 默认自动，不指定时，会对所有字段进行查询
* Sort 排序 、 from 和 size 用于分页
* Profile 可以查看查询时如何被执行的



* 指定字段 v.s 泛查询
  * q=title:2012 指定查询 title 字段为 2012
  * q=2012 查询所有为 2012 的
* Term v.s Phrase
  * Beautiful Mind 等效于 Beautiful OR Mind。
  * “Beautiful Mind” 等效于 Beautiful AND Mind，Phrase 查询，还要求前后顺序保持一致
  * 引号引起来之后代表这是一个词了，查询时不会在进行分词
* 分组与引号
  * title:(Beautiful AND Mind) Term Query 需要加括号
  * title:"Beautiful Mind" Phrase Query 则加引号
* 布尔操作
  * AND / OR / NOT 或者 && /||/
    * 必须大写
    * title:(matrix NOT reloaded)
* 分组
  * `+`加号 表示 must
  * `-`减号 表示 must_not
  * title:(+matrix -reloaded)
* 范围查询
  * 区间表示：[] 闭区间，{} 开区间
    * year:{2019 TO 2018}
    * year:[* TO 2018]
* 算数符号
  * year:>2010
  * year:(>2010 && <=2018)
  * year:(+>2010 +<=2018) 同样的 可以和加号一起使用 
* 通配符查询（效率低，占用内存大，不建议使用，特别是放在最前面的情况）
  * `？`问号代表 1 个字符，`*`星号代表 0 或多个字符
    * title:mi?d
    * title:be*
* 正则表达式
  * title:[bt]oy
* 模糊匹配与近似查询
  * title:befutifl~1 单词写错了也能查询出来
  * title:"lord rings"~2 单词不一定需要连续在一起也能查询出来



## 5. Request Body Search

将查询语句通过 HTTP Request Body  发送给 Elasticsearch

**简单例子**

```shell
POST /movies,404_idx/_search
{
  "profile": true,
	"query": {
		"match_all": {}
	}
}

```

**分页**

```shell
POST /kibana_sample_data_ecommerce/_search
{
  "from":10,
  "size":20,
  "query":{
    "match_all": {}
  }
}
```

**指定返回字段** 可以使用通配符

```shell
POST kibana_sample_data_ecommerce/_search
{
  "_source":["order_date","name*"],
  "query":{
    "match_all": {}
  }
}

```



**脚本字段**

对返回结果进行处理后形成一个新的字段

比如以下就是对 `order_date`字段后拼接上`hello`字符形成新字段`new_field`

```shell
GET kibana_sample_data_ecommerce/_search
{
  "script_fields": {
    "new_field": {
      "script": {
        "lang": "painless",
        "source": "doc['order_date'].value+'hello'"
      }
    }
  },
  "query": {
    "match_all": {}
  }
}
```

**查询表达式 Match**

```shell
# 这样会查询 last OR christmas
POST movies/_search
{
  "query": {
    "match": {
      "title": "last christmas"
    }
  }
}
# 指定操作符即可 
POST movies/_search
{
  "query": {
    "match": {
      "title": {
        "query": "last christmas",
        "operator": "and"
      }
    }
  }
}
```

**短语查询 Match Phrase**

```shell
# 单词之间必须按顺序排列 不能间隔其他单词
POST movies/_search
{
  "query": {
    "match_phrase": {
      "title":{
        "query": "one love"
      }
    }
  }
}
# slop:1 表示中间可以间隔一个单词
POST movies/_search
{
  "query": {
    "match_phrase": {
      "title":{
        "query": "one love",
        "slop": 1
      }
    }
  }
}
```





## 6. Query String Query & Simple Query String Query

**Query String Query**

类似 URI Query



```shell
POST users/_search
{
  "query": {
    "query_string": {
      "default_field": "name",
      "query": "Ruan AND Yiming"
    }
  }
}

```



**Simple Query String Query**

类似  Query String ，但是会忽略错误的语法，同时只支持部分查询语法

* 不支持 AND OR NOT，会把这几个当做字符串处理
* Term 之间默认关系是 OR,可以指定 Operator
* 支持部分逻辑
  * `+`加号代替AND
  * `|`代替 OR
  * `-`减号代替 NOT



```shell
POST users/_search
{
  "query": {
    "simple_query_string": {
      "query": "Ruan Yiming",
      "fields": ["name"],
      "default_operator": "AND"
    }
  }
}
```





