# specify-analyzer

[官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/specify-analyzer.html)

specify-analyzer for index or fields。



for a field

在 mapping 中指定。

```http
PUT my-index-000001
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "whitespace"
      }
    }
  }
}
```



for an index

直接在 index settings 中指定

default 指定 索引时的 analyzer  default_search 则指定搜索时的 analyzer

> 最佳实践：索引时存储最细粒度分词 搜索时则用粗粒度

```http
PUT my-index-000001
{
  "settings": {
    "analysis": {
      "analyzer": {
        "default": {
          "type": "ik_max_word"
        },
         "default_search": {
          "type": "ik_mark"
        }
      }
    }
  }
}
```

