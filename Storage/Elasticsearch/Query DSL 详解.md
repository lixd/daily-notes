## 0. Query DSL 概述

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

TIPS:

**影响相关度得分额放到 query context 中，其他的放到 filter context 以提升性能。**

> Use query clauses in query context for conditions which should affect the score of matching documents (i.e. how well does the document match), and use all other query clauses in filter context.





## 2. Query 分类





Elasticsearch 的 Query DSL 可以分为以下几个大类：

* match all query：查询所有
* 全文查询
  * match query
  * match phrase query
  * match phrase  prefix query
  * multi match query
  * query string query
  * simple query string query
* 词项查询
  * term query
  * terms query
  * range query
  * exits query
  * prefix query 词项前缀查询
  * wildcard query 通配符查询
  * regexp query 正则查询
  * fuzzy query 模糊查询
  * ids 根据文档id查询
* 复合查询
  * constant score query
  * bool query



## 1. 普通查询

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



## 2. 布尔查询

bool query 主要通过下列 4 个选项来构建用户想要的复杂逻辑查询，每个选项的含义如下：

**must**子句：文档必须匹配must查询条件；

**should**子句：文档应该匹配should子句查询的一个或多个；

**must_not**子句：文档不能匹配该查询条件；

**filter**子句：过滤器，文档必须匹配该过滤条件，跟must子句的唯一区别是，filter不影响查询的score；

这里需要说明的是，**每一个子查询都独自地计算文档的相关性得分**。一旦他们的得分被计算出来， bool 查询就将这些得分进行**合并**并且返回一个代表整个布尔操作的得分。

> 布尔查询嵌套结构会影响相似度算分,同一层级的权重相同。



## 3. query context & filter context

在 ES 中，提供了 Query Context和 Filter Context两种搜索：

- Query Context：查询上下文，会对搜索进行相关性算分
  - 关注点：此文档与此查询子句的匹配程度如何
  - query 上下文的条件是用来给文档打分的，匹配越好 _score 越高；
- Filter Context：过滤上下文，不需要相关性算分，能够利用缓存来获得更好的性能
  - 关注点：此文档和查询子句匹配吗
  - filter 的条件只产生两种结果：符合与不符合，后者被过滤掉。



当用户输入多个条件进行查询的时候，可以使用 bool 查询，在 bool 查询中：

* `filter` 和 `must_not` 属于 Filter Context，不会对算分结果产生影响；
* `must` 和 `should` 属于 Query Context，会对结果算分产生影响。

而且 filter context 会缓存，并且不计算得分，所以效率高于 query context。

filter context 有3种：

*  1）bool query 中的 `filter` 和 `must_not` 
* 2） constant_score 中的 filter 参数
* 3） filter 聚合查询



简单来说就是：**不满足 filter context 的文档不会被返回，满足 filter context 的根据 query context 计算得分，按顺序返回。**

使用建议：

> Use query clauses in query context for conditions which should affect the score of matching documents (i.e. how well does the document match), and use all other query clauses in filter context.



[must_not 和 filter 的区别](https://stackoverflow.com/questions/47226479/difference-between-must-not-and-filter-in-elasticsearch)

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



