# Search Template



## 1. Search Template

* elasticsearch 的查询语句
  * 对相关性算分 / 查询性能都至关重要
* 开发初期，虽然可以明确查询参数，但是往往还不能最终定义查询的 DSL 具体结构
  * 通过 Search Template 定义一个 Contract
* 各司其职，解耦
  * 开发人员、搜索工程师、性能工程师

> 具体语法 https://www.elastic.co/guide/en/elasticsearch/reference/7.8/search-template.html

```shell
# 创建一个搜索模板
POST _scripts/tmdb
{
  "script": {
    "lang": "mustache",
    "source": {
      "_source": [
        "title","overview"
      ],
      "size": 20,
      "query": {
        "multi_match": {
          "query": "{{q}}",
          "fields": ["title","overview"]
        }
      }
    }
  }
}

GET _scripts/tmdb
# 搜索的时候指定用这个模板即可，其他的不用变
POST tmdb/_search/template
{
    "id":"tmdb",
    "params": {
        "q": "basketball with cartoon aliens"
    }
}
```

这样对模板的修改并不会影响到查询。



## 2. Index Alias

实现零停机运维

比如每天都会安装当天日期创建一个新的索引,但是程序中不想经常去修改 endpoint，就可以通过别名解决问题。

```shell
# 指定别名到 具体索引
POST _aliases
{
	"actions": [
		"add": {
			"index": "commments-2020-07-06",
			"alias": "comments-today"
		}
	]
}
# 使用别名进行查询 等同于使用 真正的索引名进行查询
POST comments-today/_doc/1
{
	"movie": "The Matrix",
	"rating": "5",
	"comment": "Neo is the one!"
}
```

