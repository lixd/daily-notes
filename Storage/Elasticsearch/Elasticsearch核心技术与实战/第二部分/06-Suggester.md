# Term&Phrase Suggester

## 1. 概述

用户在搜索的时候，可能会根据用户的输入返回一些搜索建议，比如用户输入拼写错误后提示正确的拼写等。

原理 ：**将输入的文本分解为 token，然后在索引的字典里查找相似的 Term**

根据不同的场景，elasticsearch 设计了 4 种类别的 Suggesters
* Term & Phrase Suggester
* Complete & Context Suggester

## 1. Term Suggester

> [测试数据](https://github.com/geektime-geekbang/geektime-ELK/blob/master/part-2/4.11-Term%26PhraseSuggester/README.md)

* Suggester 就是一种特殊类型的搜索。text 里是调用时候提供的文本，通常来自于用户界面上用户输入的内容
* 用户输入的 Lucen 是一个错误的拼写
* 会到指定的字段 body 上搜索，当无法搜索到结果时（missing），返回建议的词



```shell
POST /articles/_search
{
  "size": 1,
  "query": {
    "match": {
      "body": "lucen rock"
    }
  },
  "suggest": {
    "term-suggestion": {
      "text": "lucen rock",
      "term": {
        "suggest_mode": "missing",
        "field": "body"
      }
    }
  }
}
```

* 每个建议都包含了一个算分，相似性是通过 Levensherin Edit Distance 算法实现。核心思想就是 一个词改动多少字符就可以和另外一个词一致。提供了很多可选参数来控制相似性的模糊程度，例如 max_edits
* Missing Mode
  * Missing - 只有索引中不存在时吗，才提供建议
  * Popular -推荐出现频率更高的词
  * Always -无论是否存在，都提供建议



## 2. Phrase Suggester

* 在 Term Suggester 基础上增加了一些额外逻辑
* 一些参数
  * Suggest Mode - missing、popular、always
  * Max Errors - 最多可以拼错的 Terms 数
  * Condifence - 限制返回结果数，默认为 1

```http
POST /articles/_search
{
  "suggest": {
    "my-suggestion": {
      "text": "lucne and elasticsear rock hello world ",
      "phrase": {
        "field": "body",
        "max_errors":2,
        "confidence":0,
        "direct_generator":[{
          "field":"body",
          "suggest_mode":"always"
        }],
        "highlight": {
          "pre_tag": "<em>",
          "post_tag": "</em>"
        }
      }
    }
  }
}
```



## 3. Completion Suggester（自动补全）

*  自动完成（Auto Complete）的功能，用户每输入一个字符，就需要即时发生一个查询请求到后端查找匹配项。
* 对性能要求比较苛刻。**ES 采用了不同的数据结构**，将 Analyzer 的数据编码成 **FST** 和索引一起存放，**FST 会被 ES 整个加载进内存**，速度很快。
* FST 只能用于**前缀查找**

由于使用的是不同的数据结构，所以在**创建 Mapping 时就必须把需要自动补全的字段类型设置为 `completion`**。一般是额外增加一个字段，而不是修改原有字段类型。

```http
PUT articles
{
  "mappings": {
    "properties": {
      "title_for_completion":{
        "type": "completion"
      }
    }
  }
}
```



> [测试数据]([https://github.com/geektime-geekbang/geektime-ELK/blob/master/part-2/4.12-%E8%87%AA%E5%8A%A8%E8%A1%A5%E5%85%A8%E4%B8%8E%E5%9F%BA%E4%BA%8E%E4%B8%8A%E4%B8%8B%E6%96%87%E7%9A%84%E6%8F%90%E7%A4%BA/README.md](https://github.com/geektime-geekbang/geektime-ELK/blob/master/part-2/4.12-自动补全与基于上下文的提示/README.md))

```shell
POST articles/_search?pretty
{
  "size": 0,
  "suggest": {
    "article-suggester": {
      "prefix": "elk ",
      "completion": {
        "field": "title_for_completion"
      }
    }
  }
}
```



## 4. Context Suggester

为文档写入上下文信息，搜索时根据不同上下文返回不同搜索结果。

可以定义两种类型的 Context
* Category - 任意的字符串
* Geo - 地理位置信息

**具体步骤**

1. 定制一个 Mapping
2. 索引数据，并且为每个文档加入 Context 信息
3. 结合 Context 进行 Suggestion 查询

**定制 Mapping**

```http
创建索引
PUT comments 
# 增加了一个类型为 category 名字为comment_category 的 context 信息
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
```



**索引数据，并且为每个文档加入 Context 信息**

```http
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

**结合 Context 进行 Suggestion 查询**

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

