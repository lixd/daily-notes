# Term&Phrase Suggester

## 1. 概述

用户在搜索的时候，可能会根据用户的输入返回一些搜索建议，比用用户输入拼写错误后提示正确的拼写等。

* 搜索引擎中类似的功能，Elasticsearch 中是通过 Suggester API 实现的
* 原理 - 将输入的文本分解为 token，然后在索引的字典里查找相似的 Term
* 根据不同的场景，elasticsearch 设计了 4 种类别的Suggesters
  * Term & Phrase Suggester
  * Complete & Context Suggester

## 1. Term Suggester

> [测试数据](https://github.com/geektime-geekbang/geektime-ELK/blob/master/part-2/4.11-Term%26PhraseSuggester/README.md)

* Suggester 就是一种特殊类型的搜索。text 里是调用时候提供的文本，通常来自于用户界面上用户输入的内容
* 用户输入的 Lucen 是一个错误的拼写
* 会到指定的字段 body 上搜索，当无法搜索到结果时（missing），返回建议的词



```shell
POST articles/_search?pretty
{
  "size": 0,
  "suggest": {
    "article-suggester": {
      "prefix": "elk ",
      "completion": {
        "field": "title_completion"
      }
    }
  }
}
```

* 每个建议都包含了一个算分，相似性是通过 Levensherin Edit Distance 算法实现。核心思想就是 一个词改动多少字符就可以和另外一个词一直。提供了很多可选参数来控制相似性的模糊程度，例如 max_edits
* Missing MOde
  * Missing - 只有索引中不存在时吗，才提供建议
  * Popular -推荐出现频率更高的词
  * Always -无论是否存在，都提供建议



## 2. Phrase Suggester

* 在 Term Suggester 基础上增加了一些额外逻辑
* 一些参数
  * Suggest Mode - missing、popular、always
  * Max Errors - 最多可以拼错的 Terms 数
  * Condifence - 限制返回结果数，默认为 1



## 3. Completion Suggester（自动补全）

*  Completion Suggester 提供了 自动完成（Auto Complete）的功能。用户每输入一个字符，就需要即时发生一个查询请求到后端查找匹配项
* 对性能要求比较苛刻。Elasticsearch 采用了不同的数据结构，并非通过倒排索引来完成，而是将 Analyzer 的数据编码成 FST 和索引一起存放，FST 会被 ES 整个加载进内存，速度很快。
* FST 只能用于前缀查找

> [测试数据]([https://github.com/geektime-geekbang/geektime-ELK/blob/master/part-2/4.12-%E8%87%AA%E5%8A%A8%E8%A1%A5%E5%85%A8%E4%B8%8E%E5%9F%BA%E4%BA%8E%E4%B8%8A%E4%B8%8B%E6%96%87%E7%9A%84%E6%8F%90%E7%A4%BA/README.md](https://github.com/geektime-geekbang/geektime-ELK/blob/master/part-2/4.12-自动补全与基于上下文的提示/README.md))

```shell
POST articles/_search?pretty
{
  "size": 0,
  "suggest": {
    "article-suggester": {
      "prefix": "elk ",
      "completion": {
        "field": "title_completion"
      }
    }
  }
}
```



## 4. Context Suggester

* Completion Suggester 的扩展
* 可以在搜索中加入更多的上下文信息，例如 输入 star
  * 咖啡相关 - 建议 Starbucks
  * 电影相关 - 建议 star wars



* 可以定义两种类型的 Context
  * Category - 任意的字符串
  * Geo - 地理位置信息
* 实现 Context Suggester 的具体步骤
  * 定制一个 Mapping
  * 索引数据，并且为每个文档加入 Context 信息
  * 结合 Context 进行 Suggestion 查询



```shell
# 指定上下文为 coffee
POST comments/_search
{
  "suggest": {
    "MY_SUGGESTION": {
      "prefix": "sta",
      "completion":{
        "field":"comment_autocomplete",
        "contexts":{
          "comment_category":"coffee"
        }
      }
    }
  }
}
```



数据

```shell
DELETE comments
PUT comments
PUT comments/_mapping
{
  "properties": {
    "comment_autocomplete":{
      "type": "completion",
      "contexts":[{
        "type":"category",
        "name":"comment_category"
      }]
    }
  }
}

POST comments/_doc
{
  "comment":"I love the star war movies",
  "comment_autocomplete":{
    "input":["star wars"],
    "contexts":{
      "comment_category":"movies"
    }
  }
}

POST comments/_doc
{
  "comment":"Where can I find a Starbucks",
  "comment_autocomplete":{
    "input":["starbucks"],
    "contexts":{
      "comment_category":"coffee"
    }
  }
}

```

