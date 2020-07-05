# IndexTemplate和DynamicTemplate

## 1. IndexTemplate

* 1）IndexTemplate - 帮助你设定 Mappings 和 Settings，并按照一定的规则自动匹配到行创建的索引上
  * 模板仅在一个索引被新创建时，才会产生作用。修改模板时不会影响已创建的索引。
  * 可以指定多个索引模板，这些设置会被 merge 在一起
  * 可以指定 order 数组，控制 merging 过程

例如

```shell
# 第一个
PUT _template/template_default
{
  "index_patterns": ["*"], # * 代表匹配所有 Index
  "order" : 0,
  "version": 1,
  "settings": {
    "number_of_shards": 1, # 设置的具体值
    "number_of_replicas":1
  }
}

# 第二个
PUT /_template/template_test
{
    "index_patterns" : ["test*"],# 只匹配 test 开头的 索引
    "order" : 1,
    "settings" : {
    	"number_of_shards": 1,
        "number_of_replicas" : 2
    },
    "mappings" : { # 同时也可以指定 mappings
    	"date_detection": false, # 关闭日期探测
    	"numeric_detection": true # 开启数字探测
    }
}
```

* 当一个索引被新创建时
  * 1）使用默认的 Settings 和 Mappings
    * 1）先应用 order 低的 Index Template 设定
    * 2）后应用 order 高的 Index Template 设定，覆盖之前的
  * 2）应用用户指定的  Setting 和 Mapping，覆盖之前的



## 2. DynamicTemplate

* 根据 Elasticsearch 识别的数据类型，结合字段名称，来动态设置字段类型
  * 比如 将所有字符串类型都设定成 Keyword，或者关闭 Keyword 字段
  * 或者 把 is 开头的字段都设置成 boolean
  * 可以自由调整 

例如

```shell
PUT my_index
{
  "mappings": {
    "dynamic_templates": [
            {
        "strings_as_boolean": {
          "match_mapping_type":   "string",
          "match":"is*", # 把 is 开头的字段设置为 boolean
          "mapping": {
            "type": "boolean"
          }
        }
      },
      {
        "strings_as_keywords": {
          "match_mapping_type":   "string",
          "mapping": {
            "type": "keyword"
          }
        }
      }
    ]
  }
}
```

也可以根据字段名字来

```shell
PUT my_index
{
  "mappings": {
    "dynamic_templates": [
      {
        "full_name": {
          "path_match":   "name.*",
          "path_unmatch": "*.middle",
          "mapping": {
            "type":       "text",
            "copy_to":    "full_name"
          }
        }
      }
    ]
  }
}
```

