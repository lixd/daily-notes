# Search API

## 1. APIs

### 1. Request

```http
GET /<index>/_search
```

支持指定 不指定索引、指定单个索引、多个索引和模糊匹配索引。

| 语法                   | 范围                |
| ---------------------- | ------------------- |
| /_search               | 集群上的所有索引    |
| /index1/_search        | index1              |
| /index1,index2/_search | index1 和 index2    |
| /index*/_search        | 以 index 开头的索引 |

### 2. Payload

根据 Payload 有无可以分为两类：

* **URI Search**：Payload 为空，在 URI 中使用查询参数

* **Request Body Search**：使用 Elasticsearch 提供的，基于 JSON 格式的更加完备的 Query Domain Specific Language（DSL）

按照查询类型分，又可以分为词条（Term）查询和全文（Fulltext）查询。

* 1）词条（Term）查询 - 不分词，完全匹配
* 2）全文（Fulltext）查询
  * 匹配（Match）查询
    * 布尔（boolean）查询 - 多条件满足一个即可
    * 短语（phrase）查询 - 单词之间必须按顺序排列 不能间隔其他单词
    * 短语前缀（phrase_prefix）查询 - 除了把查询文本的最后一个分词只做前缀匹配之外，和match_phrase查询基本一样

 

**查询端点**

```shell
# 查询
GET /_search?q=user:kimchy 
# 删除查询结果
DELETE /_query?q=user:kimchy

# 用于对查询参数进行分析，并返回分析的结果
POST /_analyze?field=title -dElasticSearch Sever
# 执行查询，获取满足查询条件的文档数量
GET /_count?q=user:jim
# 用于验证指定的文档是否满足查询条件
GET index/type/1/_explain?q=message:search
```



## 2. 返回结果与相关性

### 返回结果

```shell
{
  "took" : 12, # 本次请求耗时 ms
  "hits" : {
    "total" : {
      "value" : 4675, # 符合条件的总文档数
    },
    "max_score" : 1.0,
    "hits":[ # 结果集，默认前 10 个
    	{    
        "_score" : 1.0, # 相似度得分
      },
    ]
  },
}
```

### 相关性

Information Retrieval

* Precision（查准率） - 尽可能返回较少的无关文档
  * 返回的相关文档数 / 返回的全部文档数
* Recall（查全率） - 尽可能返回较多的相关文档
  * 返回的相关文档数 / 应该返回的文档数
* Ranking - 是否能够按照相关度进行排序？

 

## 3. URI Search

* q 指定查询语句，使用 Query String Syntax
* df 默认要查询的字段，不指定时，会对所有字段进行查询，在范查询时使用
* Sort 排序 、 from 和 size 用于分页
* Profile 可以查看查询时如何被执行的

### syntax

* 指定字段 v.s 泛查询
  * **q=user:意琦行** 指定查询 user字段为 意琦行的
  * **q=意琦行&df=user** 另一种写法的指定字段查询
  * **q=意琦行** 所有字段中查询为 意琦行 的
* Term v.s Phrase
  * Beautiful Mind 等效于 Beautiful OR Mind。
  * “Beautiful Mind” 等效于 Beautiful AND Mind，Phrase 查询，还要求前后顺序保持一致
  * **添加引号后代表这是一个词，查询时 ES 不会对其进行分词**，所以会有上面的差异情况
* 分组与引号
  * q=user:意 琦 行---第一个 意 会查询 user 字段，后续的 琦 行则是全字段查询
  * q=user:(意 琦 行）加括号则当做一个分组，即 意 琦 行 都只会查询 user 字段
  * 因为 URI Search 中2.参数以KV 键值对形式拼接,**键值对以空格分隔，**所以空格之后的内容就被当做另外的 value 处理了
* 布尔操作
  * AND / OR / NOT 必须大写
  * AND 和 NOT 也可以用 `+`加号`-`减号代替，但是需要URL编码，加号为`%2B`减号就是`-`
  * q=user:(意琦行 OR 剑子仙迹)
* 范围查询
  * 区间表示：[] 闭区间，{} 开区间
  * q=year:{2019 TO 2018}
  * q=year:[* TO 2018]
* 算数符号
  * q=year:>2010
  * q=user:(>2010 AND <=2018) 
* 通配符查询
  * 效率低，占用内存大，不建议使用（特别是用作第一个条件的时候）
  * `？`问号代表 1 个字符，`*`星号代表 0 或多个字符
  * q=user:"意琦?"
  * q=user:"意*"
* 模糊匹配与近似查询
  * q=user:"意行"~N 允许单词间可以隔 N 个单词，
  * q:title:beautifl~1 单词拼写错误也能查询出来
* 正则表达式



## 4. Request Body Search

将查询语句通过 HTTP Request Body  发送给 Elasticsearch

### 基本语法

**简单例子**

```http
POST /users/_search
{
  "profile": true,
	"query": {
		"match_all": {}
	}
}
```

**分页**

```http
POST /users/_search
{
  "profile": true,
  "from": 0,
  "size": 2, 
	"query": {
		"match_all": {}
	}
}
```

排序 sort

```http
POST /users/_search
{
  "profile": true,
  "sort": [
    {
      "level": {
        "order": "desc"
      }
    }
  ], 
	"query": {
		"match_all": {}
	}
}
```



**指定返回字段** 可以使用通配符

> 比如某些字段太大了不想返回就可以过滤掉

```http
POST /users/_search
{
  "profile": true,
  "_source": ["user","title"], 
	"query": {
		"match_all": {}
	}
}
```



**脚本字段**

对返回结果进行处理后形成一个新的字段

比如以下就是对 `level`字段后加一后生成新字段`newlevel`

```shell
POST /users/_search
{
  "profile": true,
	"query": {
		"match": {
		  "user": "意琦行"
		}
	},
	"script_fields": {
	  "newlevel": {
	    "script": {
	      "lang": "painless",
	       "source": "doc['level'].value+1"
	    }
	  }
	}
}
```

### 查询表达式

**Match 匹配查询**

```shell

# 这样会查询 意 OR 琦
POST /users/_search
{
  "profile": "true", 
  "query": {
    "match": {
      "user": "意琦"
    }
  }
}
# 指定操作符即可  意 AND 琦
# 这样会查询 
POST /users/_search
{
  "profile": "true", 
  "query": {
    "match": {
      "user": {
        "query": "意琦",
        "operator": "and"
      }
    }
  }
}
```

**Match Phrase 短语查询 **

```shell
# 单词之间必须按顺序排列 不能间隔其他单词
POST /users/_search
{
  "query": {
    "match_phrase": {
      "user":"意行"
    }
  }
}
# slop:1 表示中间可以间隔一个单词
POST /users/_search
{
  "query": {
    "match_phrase": {
      "user":{
        "query": "意行",
        "slop": 1
      }
    }
  }
}
```

**Others**

**Query String**

> 类似 URI Query

```shell
POST users/_search
{
  "query": {
    "query_string": {
      "default_field": "user",
      "query": "意 AND 行"
    }
  }
}
```

**Simple Query String**

> 类似  Query String ，但是会忽略错误的语法，同时只支持部分查询语法

* 不支持 AND OR NOT，使用 `+`加号，`-`减号，`|`竖线代替
* Term 之间默认关系是 OR,可以指定 Operator

```shell
POST users/_search
{
  "query": {
    "simple_query_string": {
      "query": "意琦行",
      "fields": ["user"],
      "default_operator": "AND"
    }
  }
}
```





