# Elasticsearch Suggester

## 1. 概述

[官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/7.10/search-suggesters.html)

Elasticsearch 设计了 4 种 Suggester

- Term Suggester
- Phrase Suggester
- Completion Suggester
- Context Suggester



大致使用流程：

* 1）创建mapping时增加suggestion字段
* 2）搜索时指定该字段提供suggestion建议



### Term Suggester

term 词项建议器，对给入的文本进行分词，为每个词进行模糊查询提供词项建议。**对于在索引中存在词默认不提供建议词**，不存在的词则根据模糊查询结果进行排序后取一定数量的建议词。

| 字段         | 解释                                                         |
| ------------ | ------------------------------------------------------------ |
| text         | 指定搜索文本                                                 |
| field        | 获取建议词的搜索字段                                         |
| analyzer     | 指定分词器                                                   |
| size         | 每个词返回的最大建议词数                                     |
| sort         | 如何对建议词进行排序，可用选项：score- 先按评分排序，再按文档频率排序 、term顺序排；frequency：先按文档频率排序，再按频繁、term顺序排。 |
| suggest_mode | 建议模式，控制提供建议词的方式。missing - 仅在搜索的词项在索引中不存在时才提供建议词，默认值。popular - 仅建议文档频率比搜索词项高的词。always- 总是提供匹配的建议词 |

### phrase suggester

phrase 短语建议，在term的基础上，会考量多个term之间的关系，比如是否同时出现在索引的原文里，相邻程度，以及词频等



### Completion suggester 

针对自动补全场景而设计的建议器。此场景下用户每输入一个字符的时候，就需要即时发送一次查询请求到后端查找匹配项，在用户输入速度较高的情况下对后端响应速度要求比较苛刻。

> **因此实现上它和前面两个Suggester采用了不同的数据结构，索引并非通过倒排来完成，而是将analyze过的数据编码成FST和索引一起存放。对于一个open状态的索引，FST会被ES整个装载到内存里的，进行前缀查找速度极快。但是FST只能用于前缀查找，这也是Completion Suggester的局限所在**

**为了使用自动补全，索引中用来提供补全建议的字段需特殊设计，字段类型为 completion**。

```shell
# 在 Mapping 中添加如下字段， suggest 为字段名，可以自定义,后续使用suggest时会在该字段中寻找建议词
"suggest" : {
"type" : "completion"
},
```



### Context Suggester

根据上下文提供建议，需要在索引文档时，写入每个文档的 上下文才行。

> 同样的词在不同环境下意思肯定也不一样。例如水果中的苹果和 苹果手机





## 2. 例子

主要分为两部分：

* 1）创建mapping时增加suggestion字段
* 2）搜索时指定该字段提供suggestion建议

这里主要演示 Completion suggester 用于搜索时的自动补全。

### 创建索引

```go
PUT /suggester_ik_test
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
      "title": {
        "type": "keyword"
      },
      "tag_suggest": {
        "type": "completion",
        "analyzer": "ik_max_word",
        "search_analyzer": "ik_max_word"
      }
    }
  }
}
```

其中的 tag_suggest 就是用于查询建议的字段：

```go
"tag_suggest": {
    "type": "completion",
    "analyzer": "ik_max_word",
    "search_analyzer": "ik_max_word"
}
```

为了保证查询效率，ES使用 FST 来存储数据，所以 mapping 中字段 type 必须设置为 completion。



### 添加数据

添加时可以为每个内容指定权限，就像这样：

```go
"tag_suggest": [
    {
        "input": "Nevermind",
        "weight": 10
    },
    {
        "input": "Nirvana",
        "weight": 5
    }
]
```

也可以多个值用同样的权限

```go
"tag_suggest": [
    {
        "input": ["Nevermind","Nirvana"],
        "weight": 10
    }
]
```

或者不指定权限，使用简写

```go
"tag_suggest": ["Nevermind","Nirvana"]
```





```go
PUT /suggester_ik_test/_create/1
{
  "title": "title1",
  "description": "description1",
  "tag_suggest": [
    {
      "input": "Nevermind",
      "weight": 10
    },
    {
      "input": "Nirvana",
      "weight": 5
    }
  ]
}


PUT /suggester_ik_test/_create/2
{
  "title": "title1",
  "description": "description1",
  "tag_suggest": [
    {
      "input": ["Nireous","Nimble"],
      "weight": 3
    }
  ]
}

PUT /suggester_ik_test/_create/3
{
  "title": "title1",
  "description": "description1",
  "tag_suggest": [
    "Nailing",
    "Naivete"
  ]
}
```



### 查询

新版取消了`_suggest` endpoint，取而代之的是在`_search` endpoint 中增加 suggest 选项以开启 suggest，具体语法如下：

```go
POST twitter/_search
{
  "query" : {
    "match": {
      "message": "tring out Elasticsearch"
    }
  },
  "suggest" : { <!-- 定义建议查询 -->
    "my-suggestion" : { <!-- 一个建议查询名 -->
      "text" : "tring out Elasticsearch", <!-- 查询文本 -->
      "term" : { <!-- 使用词项建议器 -->
        "field" : "message" <!-- 指定在哪个字段上获取建议词 -->
      }
    }
  }
}
```

当前例子中比较简单，直接省略了 query 相关的内容：

```go
GET /suggester_ik_test/_search
{
  "suggest": {
    "product_suggest": {
      "text": "n",
      "completion": {
        "field": "tag_suggest",
        "size": 10
      }
    }
  }
}
```

结果如下：

```go
{
  "took" : 0,
  "timed_out" : false,
  "_shards" : {
  },
  "hits" : {
  },
  "suggest" : {
    "tag_suggest" : [
      {
        "text" : "n",
        "offset" : 0,
        "length" : 1,
        "options" : [
          {
            "text" : "Nevermind",
            "_index" : "suggester_ik_test",
            "_type" : "_doc",
            "_id" : "1",
            "_score" : 10.0,
            "_source" : {
              "title" : "title1",
              "description" : "description1",
              "tag_suggest" : [
                {
                  "input" : "Nevermind",
                  "weight" : 10
                },
                {
                  "input" : "Nirvana",
                  "weight" : 5
                }
              ]
            }
          },
          {
            "text" : "Nimble",
            "_index" : "suggester_ik_test",
            "_type" : "_doc",
            "_id" : "2",
            "_score" : 3.0,
            "_source" : {
              "title" : "title1",
              "description" : "description1",
              "tag_suggest" : [
                {
                  "input" : [
                    "Nireous",
                    "Nimble"
                  ],
                  "weight" : 3
                }
              ]
            }
          },
          {
            "text" : "Nailing",
            "_index" : "suggester_ik_test",
            "_type" : "_doc",
            "_id" : "3",
            "_score" : 1.0,
            "_source" : {
              "title" : "title1",
              "description" : "description1",
              "tag_suggest" : [
                "Nailing",
                "Naivete"
              ]
            }
          }
        ]
      }
    ]
  }
}
```

其中`suggest.tag_suggest.options` 返回的就是相关推荐。





## 3. Golang 实现

golang 这里使用的是社区提供的库，`github.com/olivere/elastic/v7`。

> elastic 官方也推出了一个，不过感觉不是很好用

```go
func (ai *ArticleIndex) Suggestions2(word string) {
	sugName := "tag_suggest"
	suggester := elastic.NewCompletionSuggester(sugName).
		Text(word).
		Size(10).
		Field("tag_suggest")
	result, err := db.ESClient.Search("suggester_ik_test").
		Suggester(suggester).
		Do(context.Background())
	if err != nil {
		logrus.WithFields(logrus.Fields{"caller": util.CallerName(), "scenes": "搜索建议"}).Error(err)
		return
	}
    // 这里返回的是一个 map，通过suggesterName来查询
	sugList, ok := result.Suggest[sugName]
	if !ok {
		return
	}

	for _, v := range sugList {
		for _, op := range v.Options {
			fmt.Println(op.Text)
		}
	}
}
```

