# Mapping

## 1. 定义

Mapping 类似数据库中的 schema 的定义，作用如下

* 定义索引中的字段名称
* 定义字段的数据类型，例如字符串，数字，布尔...
* 字段，倒排索引的相关配置，（Analyzed or Not Analyzed，Analyzer）



Mapping  会把 JSON 文档映射成 Lucene 所需要的的扁平格式

一个 Mapping 属于一个索引的 Type

* 每个文档都属于一个 Type
* 一个 Type 有一个 Mapping 定义
* 7.0 开始，不需要在 Mapping 定义中指定 type 信息

## 2. 字段类型

* 简单类型
  * Text / Keyword
  * Date
  * Integer / Floating
  * Boolean
  * IPv4 & IPv6
* 复杂类型 - 对象和嵌套对象
  * 对象类型 / 嵌套类型
* 特殊类型
  * geo_point &geo_shape / percolator

## 3. Dynamic Mapping

* 写入文档的时候，如果索引不存在，会自动创建索引
* Dynamic Mapping 机制，使得我们无需手动定义 Mapping，Elasticsearch 会自动根据文档信息，推算出字段的类型
* 但是有时候会推算的不对，例如地理位置信息
* 当类型设置不对时，会导致一些功能无法正常使用，例如 Range 查询

```shell
# 查看 movies 索引的 mapping 信息
GET movies/_mapping
```

### 1. 类型自动识别

| JSON 类型 | Elasticsearch 类型                                           |
| --------- | ------------------------------------------------------------ |
| 字符串    | 1）匹配日期格式，设置成 Date 2）配置数字设置为 float 或者 long，该选项默认关闭 3）设置为 Text，并且增加 Keyword子字段 |
| 布尔值    | boolean                                                      |
| 浮点数    | float                                                        |
| 整数      | long                                                         |
| 对象      | Object                                                       |
| 数组      | 由第一个非空数值的类型所决定                                 |
| 空值      | 忽略                                                         |

例子

```shell
#写入文档，查看 Mapping
PUT mapping_test/_doc/1
{
  "firstName":"Chan",
  "lastName": "Jackie",
  "loginDate":"2018-07-24T10:29:48.103Z"
}

#查看 Mapping文件
GET mapping_test/_mapping
```

复杂一点的

```shell
#Delete index
DELETE mapping_test

#dynamic mapping，推断字段的类型
PUT mapping_test/_doc/1
{
    "uid" : "123",
    "isVip" : false,
    "isAdmin": "true",
    "age":19,
    "heigh":180
}

#查看 Dynamic
GET mapping_test/_mapping

```

### 2. 能否更改 Mapping 的字段类型

* 两种情况
  * 新增加字段
    * Dynamic 设置为 true 时，一旦有新增字段的文档写入，Mapping 也同时被更新
    * Dynamic 设置为 false 时，Mapping 不会被更新，新增字段的数据无法被索引，但是信息会出现在`_source`字段中
    * Dynamic 设置为 Strict 时，文档写入会失败
  * 修改已有字段，一旦已经有数据写入，就不再支持修改字段定义
    * 因为 Lucene 实现的倒排索引，一旦生成后，就不允许修改
  * 如果希望改变字段类型，必须调用 Reindex API，重建索引
* 原因
  * 如果修改了字段的数据类型，会导致已经被索引的数据无法被搜索
  * 但是如果是增加新的字段，就不会有这样的影响



```shell
# 修改 Dynamic Mapping 值
PUT movies/_mapping
{
  "dynamic": false
}

```

Dynamic Mapping 值不同的情况下，写入**新增字段**文档的情况变化

| DynamicMapping | true | false | scrict |
| -------------- | ---- | ----- | ------ |
| 文档可索引     | YES  | YES   | NO     |
| 字段可索引     | YES  | NO    | NO     |
| Mapping 被更新 | YES  | NO    | NO     |

例如:

```shell
#默认Mapping支持dynamic，写入的文档中加入新的字段
PUT dynamic_mapping_test/_doc/1
{
  "newField":"someValue"
}

#该字段可以被搜索，数据也在_source中出现
POST dynamic_mapping_test/_search
{
  "query":{
    "match":{
      "newField":"someValue"
    }
  }
}


#修改为dynamic false
PUT dynamic_mapping_test/_mapping
{
  "dynamic": false
}

#新增 anotherField
PUT dynamic_mapping_test/_doc/10
{
  "anotherField":"someValue"
}


#该字段不可以被搜索，因为dynamic已经被设置为false
POST dynamic_mapping_test/_search
{
  "query":{
    "match":{
      "anotherField":"someValue"
    }
  }
}

get dynamic_mapping_test/_doc/10

#修改为strict
PUT dynamic_mapping_test/_mapping
{
  "dynamic": "strict"
}



#写入数据出错，HTTP Code 400
PUT dynamic_mapping_test/_doc/12
{
  "lastField":"value"
}

DELETE dynamic_mapping_test
```



## 4. 显式 Mapping 定义

```shell
PUT users
{
    "mappings" : {
      // define your mapping here
    }
}
```



### 1. 自定义 Mapping

可以参考 API，纯手写

为了减少输入的工作量，减少出错概率，可以依照以下步骤

1. 创建一个临时的 Index，写入一些样本数据
2. 通过 访问 Mapping API 获得该临时文件的动态 Mapping 定义
3. 修改自动创建的 Mapping（比如自动推断的类型可能不正确等），使用该配置创建你的索引
4. 删除临时索引



### 2. 控制当前字段是否被索引

* Index - 控制当前字段是否被索引。 默认为 true

```shell
PUT users
{
    "mappings" : {
      "properties" : {
        "firstName" : {
          "type" : "text"
        },
        "lastName" : {
          "type" : "text"
        },
        "mobile" : {
          "type" : "text",
          "index": false # 不可被索引
        }
      }
    }
}
```



### 3. Index Options

* 四种不同级别的 Index Options 配置，可以控制倒排索引记录的内容
  * docs - 记录 doc id
  * freqs - 记录 doc id 和 term frequencies
  * positions - 记录 doc id 、term frequencies、term positions
  * offsets -  doc id 、term frequencies、term positions、character offsets
* Text 类型默认记录 positions，其他默认为 docs
* 记录内容越多，占用存储空间越大



### 4. Null Value

* 需要对 NULL 值实现搜索
* 只有 Keyword 类型支持设定Null_Value

```shell
PUT users
{
    "mappings" : {
      "properties" : {
        "firstName" : {
          "type" : "text"
        },
        "lastName" : {
          "type" : "text"
        },
        "mobile" : {
          "type" : "keyword",
          "null_value": "NULL" #设定 Null_Value
        }

      }
    }
}
```

### 5. copy to

* _all 字段 在 elasticsearch 7 中 被 copy_to 替代
* 用于满足一些特定的搜索需求
* copy_to 将字段的数值拷贝到目标字段，实现类似 _all 的作用
* copy_to 的目标字段不出现在 _source 中



```shell
# 这里的 fullName 字段会同时包含 firstName 和 lastName
PUT users
{
  "mappings": {
    "properties": {
      "firstName":{
        "type": "text",
        "copy_to": "fullName"
      },
      "lastName":{
        "type": "text",
        "copy_to": "fullName" # copy_to
      }
    }
  }
}
```



### 6. 数组类型

* Elasticsearch 中不提供专门的数值类型。但是任何字段，都可以包含多个相同类型的数值	

```shell
PUT users/_doc/1
{
  "name":"onebird",
  "interests":"reading"
}

PUT users/_doc/1
{
  "name":"twobirds",
  "interests":["reading","music"]
}
```



### 7. 练习

```shell
#设置 index 为 false
DELETE users
PUT users
{
    "mappings" : {
      "properties" : {
        "firstName" : {
          "type" : "text"
        },
        "lastName" : {
          "type" : "text"
        },
        "mobile" : {
          "type" : "text",
          "index": false
        }
      }
    }
}

PUT users/_doc/1
{
  "firstName":"Ruan",
  "lastName": "Yiming",
  "mobile": "12345678"
}

POST /users/_search
{
  "query": {
    "match": {
      "mobile":"12345678"
    }
  }
}

#设定Null_value
DELETE users
PUT users
{
    "mappings" : {
      "properties" : {
        "firstName" : {
          "type" : "text"
        },
        "lastName" : {
          "type" : "text"
        },
        "mobile" : {
          "type" : "keyword",
          "null_value": "NULL"
        }

      }
    }
}

PUT users/_doc/1
{
  "firstName":"Ruan",
  "lastName": "Yiming",
  "mobile": null
}


PUT users/_doc/2
{
  "firstName":"Ruan2",
  "lastName": "Yiming2"

}

GET users/_search
{
  "query": {
    "match": {
      "mobile":"NULL"
    }
  }

}

#设置 Copy to
DELETE users
PUT users
{
  "mappings": {
    "properties": {
      "firstName":{
        "type": "text",
        "copy_to": "fullName"
      },
      "lastName":{
        "type": "text",
        "copy_to": "fullName"
      }
    }
  }
}
PUT users/_doc/1
{
  "firstName":"Ruan",
  "lastName": "Yiming"
}

GET users/_search?q=fullName:(Ruan Yiming)

POST users/_search
{
  "query": {
    "match": {
       "fullName":{
        "query": "Ruan Yiming",
        "operator": "and"
      }
    }
  }
}

#数组类型
PUT users/_doc/1
{
  "name":"onebird",
  "interests":"reading"
}

PUT users/_doc/1
{
  "name":"twobirds",
  "interests":["reading","music"]
}

POST users/_search
{
  "query": {
		"match_all": {}
	}
}

GET users/_mapping
```



