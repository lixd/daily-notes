# Analyzer 分词

## 1. 概述

* Analysis - 文本分析是把全文本转换为一些列单词（term/token）的过程，也叫分词。

* Analysis 是通过 Analyzer 来实现的
  * 可使用 Elasticsearch 内置的分析器 / 或者按需定制化分析器
* 除了在数据写入时转换词条，匹配 Query 语句时也需要用相同的分析器对查询语句进行分析
* 分词器是专门处理分词的组件，Analyzer 由三部分组成
  * Character Filters（针对初始文本处理，例如去除 html ）、Tokenizer（按照规则切分为单词）、Token Filter（将切分的单词进行加工，小写，删除 stopwords，增加同义词）





## 2. Elasticsearch 内置分词器

* Standard Analyzer - 默认分词器，按词切分，小写处理
* SimPIe Analyzer - 按照非字母切分（符号被过滤），小写处理
* Stop Analyzer - 小写处理，停用词过滤（the，a，is）
* Whitespace Analyzer - 按照空格切分，不转小写
* Keyword Analyzer - 不分词，直接将输入当作输出
* Patter Analyzer - 正则表达式，默认\W+(非字符分隔)
* Language - 提供了 30 多种常见语言的分词器 
* Customer Analyzer - 自定义分词器



## 3. Analyzer API

1）直接指定 Analyzer 进行测试

```json
GET /_analyze
{
	"analyzer":"standard",
    "text":"Mastering Elasticsearch,elasticsearch in Action"
}
```

2）指定索引的字段进行测试

```json
POST books/_analyze
{
    "field":"title",
    "text":"Mastering Elasticsearch"
}
```

3）自定义分词器进行测试

```json
POST /_analyze
{
    "tokenizer":"standard",
    "filter":["lowercase"],
    "text":"Mastering Elasticsearch"
}
```



## 中文分词

推荐 IK 分词器

```text
https://github.com/medcl/elasticsearch-analysis-ik
```

