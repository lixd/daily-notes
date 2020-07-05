# term 和全文搜索

## 1. term

### 1. 概念

* Term 的重要性
  * **Term 是表达语意的最小单位**
  * 搜索和利用统计语言模型进行自然语言处理都需要处理 Term
* 特点
  * Term Level Query
    * Term Query
    * Range Query
    * Exists Query
    * Prefix Query
    * Wildcard Query
  * 在 ES 中，Term 查询，对输入**不做分词**。会将输入作为一个整体，在倒排索引中查找准确的词项，并且使用相关度算分公式为每个包含该词项的文档进行**相关度算分**
  * 可以通过 Constant Score 将查询**转换成一个 Filtering，避免算分，并利用缓存**，提高性能

### 2. keyword

keyword 写入的时候也是不会做分词的。

例子

```shell
# 存入 3 条数据
POST /products/_bulk
{ "index": { "_id": 1 }}
{ "productID" : "XHDK-A-1293-#fJ3","desc":"iPhone" }
{ "index": { "_id": 2 }}
{ "productID" : "KDKE-B-9947-#kL5","desc":"iPad" }
{ "index": { "_id": 3 }}
{ "productID" : "JODL-X-1937-#pV7","desc":"MBP" }
```

进行搜索

```shell
POST /products/_search
{
  "query": {
    "term": {
      "desc": {
        //"value": "iPhone"
        "value":"iphone"
      }
    }
  }
}
# 搜索 iPhone 不会返回任何结果
# 搜索 iphone 就可以搜到 
# 因为存储时 es 默认会进行分词处理，最后会转为小写，
# 但是查询的时候 指定了 term 则不会进行分词，所以只有小写时才能搜到
```

```shell
POST /products/_search
{
  "query": {
    "term": {
     # 加上 keyword就会去查询原始数据了 所以小写是查不到的
      "desc.keyword": {
        "value": "iPhone"
        //"value":"iphone"
      }
    }
  }
}
```

```shell
# 同样的 id 被分词后 直接查询是差不到的
POST /products/_search
{
  "query": {
    "term": {
      "productID": {
        "value": "XHDK-A-1293-#fJ3"
      }
    }
  }
}
# 同样需要加上 keyword
POST /products/_search
{
  //"explain": true,
  "query": {
    "term": {
      "productID.keyword": {
        "value": "XHDK-A-1293-#fJ3"
      }
    }
  }
}

```

### 3. Constant Score

* 将 Query 转换为 Filter，忽略 TF-IDF 计算，避免相关性算分的开销
* Filter 可以有效利用缓存

```shell
POST /products/_search
{
  "explain": true,
  "query": {
    "constant_score": {
      "filter": {
        "term": {
          "productID.keyword": "XHDK-A-1293-#fJ3"
        }
      }
    }
  }
}
```



## 2. 全文查询

* 基于全文本的查找
  * Match Query
  * Match Phrase Query
  * Query String Query
* 特点
  * 索引和搜索时都会进行分词，查询字符串先传递到一个合适的分词器，然后生成一个供查询的词项列表
  * 查询的时候，先**会对输入的查询进行分词**，然后每个词项逐个进行底层的查询，最终将结果进行合并。并为每个文档生成一个算分，



## 3. 结构化搜索

**结构化数据**，在Elasticsearch中叫Structured Data，用于表示**一个不可分割的值**。相对于全文本的分词处理，结构化数据本身可看成一个整体。

结构化数据包括：

* 1）日期
* 2）布尔类型
* 3）数字
* 4）分词无意义的文本，包括可枚举的文本
  * 1）颜色的种类，如：红、黄、蓝、绿、黑
  * 2）博客的标签，如：Java、Elasticsearch、C语言
  * 3）性别，如：男性、女性、保密、未知
  * 4）订单的id

因此，结构化数据的搜索叫做结构化搜索：可以做精准匹配或者部分匹配。

* 1）精准匹配使用Term查询
* 2）部分匹配使用Prefix前缀查询。

**结构化搜索的结果只有`是`和`否`两个结果。**

实际场景中，我们根据需要，可以选择是否对搜索的结果进行相关性算分。



### 练习

准备数据

```shell
#结构化搜索，精确匹配
DELETE products
POST /products/_bulk
{ "index": { "_id": 1 }}
{ "price" : 10,"avaliable":true,"date":"2018-01-01", "productID" : "XHDK-A-1293-#fJ3" }
{ "index": { "_id": 2 }}
{ "price" : 20,"avaliable":true,"date":"2019-01-01", "productID" : "KDKE-B-9947-#kL5" }
{ "index": { "_id": 3 }}
{ "price" : 30,"avaliable":true, "productID" : "JODL-X-1937-#pV7" }
{ "index": { "_id": 4 }}
{ "price" : 30,"avaliable":false, "productID" : "QQPX-R-3956-#aD8" }
```

查询

```shell
#对布尔值 match 查询，有算分
POST products/_search
{
  "profile": "true",
  "explain": true,
  "query": {
    "term": {
      "avaliable": true
    }
  }
}


#对布尔值，通过constant score 转成 filtering，没有算分
POST products/_search
{
  "profile": "true",
  "explain": true,
  "query": {
    "constant_score": {
      "filter": {
        "term": {
          "avaliable": true
        }
      }
    }
  }
}


#数字类型 Term
POST products/_search
{
  "profile": "true",
  "explain": true,
  "query": {
    "term": {
      "price": 30
    }
  }
}

#数字类型 terms
POST products/_search
{
  "query": {
    "constant_score": {
      "filter": {
        "terms": {
          "price": [
            "20",
            "30"
          ]
        }
      }
    }
  }
}

#数字 Range 查询
GET products/_search
{
    "query" : {
        "constant_score" : {
            "filter" : {
                "range" : {
                    "price" : {
                        "gte" : 20,
                        "lte"  : 30
                    }
                }
            }
        }
    }
}


# 日期 range
POST products/_search
{
    "query" : {
        "constant_score" : {
            "filter" : {
                "range" : {
                    "date" : {
                      "gte" : "now-1y"
                    }
                }
            }
        }
    }
}



#exists查询
POST products/_search
{
  "query": {
    "constant_score": {
      "filter": {
        "exists": {
          "field": "date"
        }
      }
    }
  }
}

#处理多值字段
POST /movies/_bulk
{ "index": { "_id": 1 }}
{ "title" : "Father of the Bridge Part II","year":1995, "genre":"Comedy"}
{ "index": { "_id": 2 }}
{ "title" : "Dave","year":1993,"genre":["Comedy","Romance"] }


#处理多值字段，term 查询是包含，而不是等于
POST movies/_search
{
  "query": {
    "constant_score": {
      "filter": {
        "term": {
          "genre.keyword": "Comedy"
        }
      }
    }
  }
}


#字符类型 terms
POST products/_search
{
  "query": {
    "constant_score": {
      "filter": {
        "terms": {
          "productID.keyword": [
            "QQPX-R-3956-#aD8",
            "JODL-X-1937-#pV7"
          ]
        }
      }
    }
  }
}



POST products/_search
{
  "profile": "true",
  "explain": true,
  "query": {
    "match": {
      "price": 30
    }
  }
}


POST products/_search
{
  "profile": "true",
  "explain": true,
  "query": {
    "term": {
      "date": "2019-01-01"
    }
  }
}

POST products/_search
{
  "profile": "true",
  "explain": true,
  "query": {
    "match": {
      "date": "2019-01-01"
    }
  }
}




POST products/_search
{
  "profile": "true",
  "explain": true,
  "query": {
    "constant_score": {
      "filter": {
        "term": {
          "productID.keyword": "XHDK-A-1293-#fJ3"
        }
      }
    }
  }
}

POST products/_search
{
  "profile": "true",
  "explain": true,
  "query": {
    "term": {
      "productID.keyword": "XHDK-A-1293-#fJ3"
    }
  }
}

#对布尔数值
POST products/_search
{
  "query": {
    "constant_score": {
      "filter": {
        "term": {
          "avaliable": "false"
        }
      }
    }
  }
}

POST products/_search
{
  "query": {
    "term": {
      "avaliable": {
        "value": "false"
      }
    }
  }
}

POST products/_search
{
  "profile": "true",
  "explain": true,
  "query": {
    "term": {
      "price": {
        "value": "20"
      }
    }
  }
}

POST products/_search
{
  "profile": "true",
  "explain": true,
  "query": {
    "match": {
      "price": "20"
    }
    }
  }
}


POST products/_search
{
  "query": {
    "constant_score": {
      "filter": {
        "bool": {
          "must_not": {
            "exists": {
              "field": "date"
            }
          }
        }
      }
    }
  }
}

```

