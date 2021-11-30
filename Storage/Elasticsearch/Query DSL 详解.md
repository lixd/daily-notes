## 1. Query DSL 概述

> [官方文档 Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html)

Elasticsearch 基于JSON提供完整的查询DSL来定义查询。

> DSL(Domain Specific Language)：领域特定语言



### 查询语句组成

一个查询可由两部分子句构成：

* Leaf query clauses 叶子查询字句：Leaf query clauses 在指定的字段上查询指定的值, 如：match, term or range queries. 叶子子句可以单独使用.
* Compound query clauses 复合查询子句：以逻辑方式组合多个叶子、复合查询为一个查询



### 相关度得分

相关度得分：文档和查询语句的匹配程度。

默认情况下，ES 的返回结果会根据文档的相关度得分进行排序。



### Query and Filter Context

一个查询子句的行为取决于它是用在 query context 还是 filter context 中：

* **Query context 查询上下文**：用在查询上下文中的子句关注‘这个文档有多匹配这个查询’，会参与相关性评分。
  * 查询上下文由 query 元素表示。
* **Filter context 过滤上下文**：用在过滤上下文中的子句只关注 ‘这个文档是否匹配这个查询’，不参与相关性评分。
  * 过滤上下文由 filter 元素或 bool 中的 must not 表示。
  * 被频繁使用的 filter context 子句将被 ES 自动缓存，来提高查询性能。

Example：

```go
GET /_search
{
  "query": { 
    "bool": { 
      # query context
      "must": [
        { "match": { "title":   "Search"        }},
        { "match": { "content": "Elasticsearch" }}
      ],
      #  filter context  
      "filter": [ 
        { "term":  { "status": "published" }},
        { "range": { "publish_date": { "gte": "2015-01-01" }}}
      ]
    }
  }
}
```

该 query 同时包含了 query context 和 filter context。

首先会过滤掉不满足  filter context 子句的文档，然后剩余文档根据 query context 子句计算相关度得分，并按照排序返回。

简单来说就是：**不满足 filter context 的文档不会被返回，满足 filter context 的根据 query context 计算得分，按顺序返回。**

使用建议：

**影响相关度得分的查询放到 query context 中，其他的放到 filter context 以提升性能。**

> Use query clauses in query context for conditions which should affect the score of matching documents (i.e. how well does the document match), and use all other query clauses in filter context.





## 2. Query 分类

* Compound queries：复合查询
  * bool query
  * boosting query
  * constant_score query
  * dis_max query
  * funcation_score query

* Full text queries：全文查询
  * intervals query
  * match query
  * match_bool_prefix query
  * match_phrase query
  * match_phrase_prefix query
  * multi_match query
  * combined_fields query
  * query_string query
  * simple_query_string query



## 3. Compound queries

### bool query

bool query 主要通过下列 4 个选项来构建用户想要的复杂逻辑查询，每个选项的含义如下：

* **must**：文档必须匹配 must 查询条件,并影响相关性得分。
* **filter**：`  过滤器，文档必须匹配该过滤条件，跟 must 子句的唯一区别是，filter 不影响查询的 score；
* **should**：文档应该匹配 should 子句查询的一个或多个，影响得分。
  * 可以通过`minimum_should_match`参数指定，文档必须匹配的的子句数量或者百分比
* **must_not**：文档不能匹配该查询条件，不影响得分

这里需要说明的是，**每一个子查询都独自地计算文档的相关性得分**。一旦他们的得分被计算出来， bool 查询就将这些得分进行**合并**并且返回一个代表整个布尔操作的得分。

> 布尔查询嵌套结构会影响相似度算分,同一层级的权重相同。

**各个子句的区别**

|          | Context | 是否计算得分 | 匹配的文档是否出现在结果中 | 完全匹配 |
| -------- | ------- | ------------ | -------------------------- | -------- |
| must     | Query   | Yes          | Yes                        | Yes      |
| should   | Query   | Yes          | Yes                        | No       |
| filter   | Filter  | No           | Yes                        | Yes      |
| must_not | Filter  | No           | No                         | Yes      |

* must 和 should 类似，不过must为完全匹配，必须满足所有条件才行，should则是匹配任意一个(或多个)就行。
* filter 和 must_not 也类似，只是二者的判断是相反的，可以理解为 must_not = !filter.
* 然后 must 和 must_not 也类似，只是 must_not 不计算得分
* 最终，好像这4个其实都差不了太多。。。
* 最大差距应该是 ES 会自动缓存常用的 Filter Context 以提升性能



**查询命名**

可以给每个查询指定一个名字，这样在返回结果中可以看到每个文档具体是匹配到的哪些查询子句。

```http
GET /_search
{
  "query": {
    "bool": {
      "should": [
        { "match": { "name.first": { "query": "shay", "_name": "first" } } },
        { "match": { "name.last": { "query": "banon", "_name": "last" } } }
      ],
      "filter": {
        "terms": {
          "name.last": [ "banon", "kimchy" ],
          "_name": "test"
        }
      }
    }
  }
}
```





Example：

```http
POST _search
{
  "query": {
    "bool" : {
      "must" : {
        "term" : { "user.id" : "kimchy" }
      },
      "filter": {
        "term" : { "tags" : "production" }
      },
      "must_not" : {
        "range" : {
          "age" : { "gte" : 10, "lte" : 20 }
        }
      },
      "should" : [
        { "term" : { "tags" : "env1" } },
        { "term" : { "tags" : "deployed" } }
      ],
      "minimum_should_match" : 1,
      "boost" : 1.0
    }
  }
}
```





### boosting query

boosting query 中包含 `positive` query 和 `negative` query。

boosting query 同样返回匹配 `positive` query的文档，而同时还匹配到`negative` query的文档则会扣分。

> 比如查询苹果手机的时候，水果的那个苹果就应该降低得分，尽量不返回。



Example

```http
GET /_search
{
  "query": {
    "boosting": {
      "positive": {
        "term": {
          "text": "apple"
        }
      },
      "negative": {
        "term": {
          "text": "pie tart fruit crumble tree"
        }
      },
      "negative_boost": 0.5
    }
  }
}
```



**相关参数**

* `positive` query ：和普通查询一样，用于匹配目标文档。
*  `negative` query：降低匹配该查询的文档的相关性得分。
  * negative_boost：0~1 浮点数，用于设置扣分幅度。

### Constant score query

和普通查询类似，不过不在根据文档内容计算相识度得分，而是在查询中统一指定一个得分。而且只能用 filter query。



Example

```http
GET /_search
{
  "query": {
    "constant_score": {
      "filter": {
        "term": { "user.id": "kimchy" }
      },
      "boost": 1.2
    }
  }
}
```



**相关参数**

* filter：具体过滤条件，Constant score query 只能使用 filter 子句。
* boost（可选值）：指定文档得分，为浮点数，默认1.0。





### Disjunction max query

最佳字段查询。可以指定多个 query，取得分最高的一个作为文档最终得分，必须匹配 1 个或更多的 query 子句，该文档才会被返回。

> 和 should 类似，都是多个 query 子句，不过二者计分方式不同。should 为累计得分,dis max 为最佳得分。

[Disjunction max query 适用场景](https://zhuanlan.zhihu.com/p/397612358)



Example

```http
GET /_search
{
  "query": {
    "dis_max": {
      "queries": [
        { "term": { "title": "Quick pets" } },
        { "term": { "body": "Quick pets" } }
      ],
      "tie_breaker": 0.7
    }
  }
}
```



**相关参数**

* queries：query 数组，包含一个或多个查询子句。
* tie_breaker（可选值）：0~1 的浮点数，用于增加同时匹配多个 query 的文档得分。

tie_breaker 计算公式：

* 1）提取出最高得分
* 2）将其他 query 子句的得分乘以 tie_breaker
* 3）累计1和2中的得分





### [Function score query](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-function-score-query.html)

允许用户在检索中灵活修改文档 score，来实现自己干预结果排名的目的。

它提供了以下几种类型的计算分值的函数：

- script_score
  - 自定义脚本以计算得分
- weight
  - 分数乘以权重得到最终得分
  - 假设 weight：5，那么最终得分就是乘以5
- random_score
  - 随机生成0~1的得分
  - 它有一个非常有用的特性是可以通过`seed`属性设置一个随机种子，该函数保证**在随机种子相同时返回值也相同**，这点使得它可以轻松地实现对于用户的**个性化推荐**。
- field_value_factor
  - 根据某个字段的值来计算得分，类似于 script_score，不过却避免了脚本的开销
- 衰减函数：线性函数（linear）、以 e 为底的指数函数（Exp）和高斯函数（gauss）
  - 同样以某个字段的值为标准，距离某个值越近得分越高
  - 这个函数可以很好的应用于数值、日期和地理位置类型
  - 原点（`origin`）：该字段最理想的值，这个值可以得到满分（1.0）
  - 偏移量（`offset`）：与原点相差在偏移量之内的值也可以得到满分
  - 衰减规模（`scale`）：当值超出了原点到偏移量这段范围，它所得的分数就开始进行衰减了，衰减规模决定了这个分数衰减速度的快慢
  - 衰减值（`decay`）：该字段可以被接受的值（默认为 0.5），相当于一个分界点，具体的效果与衰减的模式有关
  - 购物时，假设理想价格为50，这个值就作为原点，但是并不是非50元不买，而是会划分一个范围，比如 45~55，正负5就是偏移量。



Example

单个使用

```http
GET /_search
{
  "query": {
    "function_score": {
      "query": { "match_all": {} },
      "boost": "5",
      "random_score": {}, 
      "boost_mode": "multiply"
    }
  }
}
```

多个一起使用

```http
GET /_search
{
  "query": {
    "function_score": {
      "query": { "match_all": {} },
      "boost": "5", 
      "functions": [
        {
          "filter": { "match": { "test": "bar" } },
          "random_score": {}, 
          "weight": 23
        },
        {
          "filter": { "match": { "test": "cat" } },
          "weight": 42
        }
      ],
      "max_boost": 42,
      "score_mode": "max",
      "boost_mode": "multiply",
      "min_score": 42
    }
  }
}
```



script_score

```http
GET /_search
{
  "query": {
    "function_score": {
      "query": {
        "match": { "message": "elasticsearch" }
      },
      "script_score": {
        "script": {
          "source": "Math.log(2 + doc['my-int'].value)"
        }
      }
    }
  }
}
```



random_score

```http
GET /_search
{
  "query": {
    "function_score": {
      "random_score": {
        "seed": 10,
        "field": "_seq_no"
      }
    }
  }
}
```



field_value_factor

```http
# 以下查询对应的评分公式：sqrt(1.2 * doc['my-int'].value)
GET /_search
{
  "query": {
    "function_score": {
      "field_value_factor": {
        "field": "my-int",
        "factor": 1.2,
        "modifier": "sqrt",
        "missing": 1
      }
    }
  }
}
```



## 4. Full text queries

### intervals-query

intervals query 允许用户精确控制查询词在文档中出现的先后关系，实现了对terms顺序、terms之间的距离以及它们之间的包含关系的灵活控制。



Example

> This search would match a `my_text` value of `my favorite food is cold porridge` but not `when it's cold my favorite food is porridge`.

```http
POST _search
{
  "query": {
    "intervals" : {
      "my_text" : {
        "all_of" : {
          "ordered" : true,
          "intervals" : [
            {
              "match" : {
                "query" : "my favorite food",
                "max_gaps" : 0,
                "ordered" : true
              }
            },
            {
              "any_of" : {
                "intervals" : [
                  { "match" : { "query" : "hot water" } },
                  { "match" : { "query" : "cold porridge" } }
                ]
              }
            }
          ]
        }
      }
    }
  }
}
```





### Match

> https://www.jianshu.com/p/8175a101623e

Match Query 是最常用的 Full Text Query 。无论需要查询什么字段， `match` 查询都应该会是首选的查询方式。它既能处理全文字段，又能处理精确字段。

> The `match` query is the standard query for performing a full-text search, including options for fuzzy matching.



Example

```http
# 无任何参数
GET /_search
{
  "query": {
    "match": {
      "message": { # 查询字段
        "query": "this is a test" # 查询内容
      }
    }
  }
}

# 模糊查询
GET /_search
{
  "query": {
    "match": {
      "message": {
        "query": "this is a testt",
        "fuzziness": "AUTO"
      }
    }
  }
}

# zero_terms_query
GET /_search
{
  "query": {
    "match": {
      "message": {
        "query": "to be or not to be",
        "operator": "and",
        "zero_terms_query": "all"
      }
    }
  }
}
```



**相关参数**



* field：指定查询字段

parameters：修饰参数
  * **query**：具体查询
  * analyzer(Optional, string)：指定分词器，将 query 中的内容进行分词
  * **auto_generate_synonyms_phrase_query **(Optional, Boolean)：同义词，默认为 true。
  * **fuzziness**(Optional, string)：允许基于编辑距离的模糊查询，可选值 0、1、2 或者 AUTO，推荐使用 AUTO。
  * max_expansions (Optional, integer) ：terms 最大扩张数，默认 50.
      * 一般是前缀查询时用，根据指定前缀，最多会匹配50个结果
  * prefix_length(Optional, integer)：模糊匹配的开始字符数，限制从哪儿开始可以模糊匹配，默认为0。
  * fuzzy_transpositions(Optional, Boolean)：模糊匹配是否包括换位，如 ab->ba，默认为 true。
  * fuzzy_rewrite(Optional, string) ：指定重写查询的方法。
  * lenient(Optional, Boolean) ：是否忽略格式错误，比如提供一个text类型query去查询numeric 字段，默认 false
  * operator(Optional, string) ：查询逻辑，
      * `OR` **(Default)**：分词结果中匹配任意一个即可
      * `AND`：必须全匹配才行
* minimum_should_match(Optional, string) ：指定最少需要匹配的query子句数
* zero_terms_query(Optional, string)：分词后的 token 全部被 analyzer 过滤掉后的处理逻辑，比如查询词由stop word组成，stop analyzer分词后会把stop word全部过滤掉，此时 token 为空了，该参数主要用于控制此时的返回值：
  * `none` **(Default)**：不返回任何文档
  * `all`：返回所有文档






### Match boolean prefix query

和 bool 查询差不多，可以看做是一种简单写法



```http
GET /_search
{
  "query": {
    "match_bool_prefix" : {
      "message" : "quick brown f"
    }
  }
}
```

上述查询和下面这个 bool query 是一样的

```http
GET /_search
{
  "query": {
    "bool" : {
      "should": [
        { "term": { "message": "quick" }},
        { "term": { "message": "brown" }},
        { "prefix": { "message": "f"}}
      ]
    }
  }
}
```



可以看到，首先是进行分词，分词后使用 should 构建多个查询，然后最后一个查询为 prefix 查询。



### Match phrase query

短语查询。

match_phrase的分词结果必须在text字段分词中**`都包含`**，而且顺序必须相同，而且必须**`都是连续`**的。



```http
GET /_search
{
  "query": {
    "match_phrase": {
      "message": {
        "query": "this is a test",
        "analyzer": "my_analyzer" # 可选值
      }
    }
  }
}
```







### Match phrase prefix query

和Match phrase query差不多，不过最后一个短语支持前缀查询。

```http
GET /_search
{
  "query": {
    "match_phrase_prefix": {
      "message": {
        "query": "quick brown f"
      }
    }
  }
}
```



**相关参数**

* slop：每个短语之间允许间隔的token数，默认为0.



### Combined fields query

联合字段查询,可以同时查询多个字段。

```http
GET /_search
{
  "query": {
    "combined_fields" : {
      "query":      "database systems",
      "fields":     [ "title", "abstract", "body"],
      "operator":   "and"
    }
  }
}
```





### Multi-match query

和联合字段查询类似，不过可以指定 type 字段以控制查询的执行逻辑。

```http
GET /_search
{
  "query": {
    "multi_match" : {
      "query":      "brown fox",
      "type":       "best_fields",
      "fields":     [ "subject", "message" ],
      "tie_breaker": 0.3
    }
  }
}
```



type 取值：

* best_fields  　（默认）查找与任何字段匹配的文档，但使用最佳字段中的_score
* most_fields　　查找与任何字段匹配的文档，并联合每个字段的_score.
* cross_fields　　采用相同分析器处理字段，就好像他们是一个大的字段。在每个字段中查找每个单词。
* phrase　　　　在每个字段上运行match_phrase查询并和每个字段的_score组合。
* phrase_prefix   在每个字段上运行match_phrase_prefix查询并和每个字段的_score组合。







### Query string query

和 match 类似，不过 Query string query 只能查询 text 类型字段。

```http
GET /_search
{
  "query": {
    "query_string": {
      "query": "(new york city) OR (big apple)",
      "default_field": "content"
    }
  }
}
```





## TODO

| 关键词              | keyword类型        | text类型                                                     | 是否分词 | 备注 |
| ------------------- | ------------------ | ------------------------------------------------------------ | -------- | ---- |
| term                | 完全匹配           | 查询条件**`必须都是`**text分词中的，且不能多余，多个分词时**`必须连续`**，顺序不能颠倒。 | 否       |      |
| match               | 自动转为 term 查询 | match分词结果和text的分词结果**`至少一个`**相同即可，**`不考虑顺序`** | 是       |      |
| match_phrase        | 完全匹配           | match_phrase的分词结果必须在text字段分词中**`都包含`**，而且顺序必须相同，而且必须**`都是连续`**的。 | 是       |      |
| match_phrase_prefix | 完全匹配           | 在`match_phrase`的基础上，它支持对短语的最后一个词进行前缀匹配 |          |      |
| query_string        | 完全匹配           | 只能查询 text类型。query_string中的分词结果**`至少有一个`**在text字段的分词结果中，**`不考虑顺序`** | 是       |      |

所有对`keyword`的查询，都是不会进行分词的。

match 和 query_string 很像，只是 query_string 只能查询 string

match_phrase 就像是分词版的 term 查询。



