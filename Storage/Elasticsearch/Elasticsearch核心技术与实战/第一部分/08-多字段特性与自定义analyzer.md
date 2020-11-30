# 多字段特性

## 1. 多字段特性

**ES 支持在一个字段下创建多个子字段。**

该特性使用场景

* 增加一个 keyword 类型子字段，实现精确匹配
* 增加一个子字段，设置不同的 analyzer
  * 比如增加一个 英文的子字段，一个拼音的子字段等等，同时满足多种语言搜索
* 还支持为索引和搜索指定不同 analyzer









## 2. 自定义分词器

### 1. 概述

自定义 Character Filter + Tokenizer + Toekn Filter 组合。

> N个Character Filter +1个Tokenizer +N个Toekn Filter 

**Character Filter**

对文本预处理，但是会影响到 Tokenizer 中的 position 和 offset 信息。

ES自带的 Character Filter

* HTML strip 去除 HTML 标签

* Mapping 字符串替换

* Pattern replace 正则匹配替换

**Tokenizer **

将 Character Filter 预处理后的文本切分为词（term or token）

ES自带的 Tokenizer 

* whitespace  空格分词
* standard
* uax_url_email url或email
* pattern 正则表达式
* keyword 不做处理
* path hierarchy 文件路径

**Toekn Filter **

将 Tokenizer  输出的单词（term）进行再加工，增加、修改、删除等。

ES自带的 Tokenizer 

* Lowercase 转小写
* stop 过滤停用词
* synonym 添加近义词



```http
GET _analyze
{
  "char_filter": ["html_strip"],
  "tokenizer": "standard", 
  "filter": ["lowercase","stop"],
  "text": "The rain in Spain falls mainly on the plains."
}
```



### 2. 自定义分词器

具体语法如下

```json
PUT my_index
{
  "settings": {
    "analysis": {
      "analyzer": {
        "my_analyzer":{
          "type":"custom",
          "char_filter":["html_strip", "my_char_filter"],
          "tokenizer": "my_tokenizer",
          "filter": ["lowercase", "my_filter"]  
       }
      }, 
      "char_filter": {
        "my_char_filter":{
           "type": "mapping",
            "mappings": ["& => and"]
        }
      },
      "tokenizer": {
        "my_tokenizer":{
          "type": "pattern",
          "pattern": "[.,...!?]"
        }
      }, 
     "filter": {
       "my_filter":{
         "type": "stop",
         "stopwords": ["on the door"]
       }
     }
    }
  }
}
```

char_filter 、tokenizer和 token filter 都是可以自定义的，然后在 analyzer 里可以随意组合。

char_filter

* html_strip 去除 html 标签
* my_char_filter 将 &转为 and

tokenizer

* my_tokenizer 按照逗号句号感叹号分词

token filter

* my_filter 过滤掉 on the door。

测试

```http
POST my_index/_analyze
{
  "analyzer": "my_analyzer",
  "text": "There is a cat & a DOG<br/>,on the door. so strange!!"
}
# Response
{
  "tokens" : [
    {
      "token" : """there is a cat and a dog
""",
      "start_offset" : 0,
      "end_offset" : 27,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : " so strange",
      "start_offset" : 40,
      "end_offset" : 51,
      "type" : "word",
      "position" : 2
    }
  ]
}

```

