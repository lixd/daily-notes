# Bucket&Metric聚合分析及嵌套聚合

## 1. 概述

* Metric - 一些系列的统计方法（SQL 中的聚合函数 Max、Avg等等）
* Bucket - 一组满足条件的文档（SQL 中的分组 GROUP BY）



## 2. Aggregation 语法

Aggregation 属于 Search 的一部分。一般情况下，建议将其 Size 指定为 0。

```shell
# 与 query 同级
"aggregations" : {
	# 自定义 聚合名字
    "<aggregation_name>" : {
    	# 自定义 Type 和 Body
        "<aggregation_type>" : {
            <aggregation_body>
        }
        [,"meta" : {  [<meta_data_body>] } ]?
        # 子聚合查询
        [,"aggregations" : { [<sub_aggregation>]+ } ]?
    }
    # 可以包含多个统计的聚合查询
    [,"<aggregation_name_2>" : { ... } ]*
}
```



例子

> [数据列表]([https://github.com/geektime-geekbang/geektime-ELK/blob/master/part-2/6.1-Bucket%26Metric%E8%81%9A%E5%90%88%E5%88%86%E6%9E%90%E5%8F%8A%E5%B5%8C%E5%A5%97%E8%81%9A%E5%90%88/README.md](https://github.com/geektime-geekbang/geektime-ELK/blob/master/part-2/6.1-Bucket%26Metric聚合分析及嵌套聚合/README.md))

```shell
# 多个 Metric 聚合，找到最低最高和平均工资
POST employees/_search
{
  "size": 0,
  "aggs": {
  	# 聚合名字 max_salary
    " max_salary": {
     # Type 为 max
      "max": {
       # Body 为  "field": "salary"
         "field": "salary"
      }
    },
    "min_salary": {
      "min": {
        "field": "salary"
      }
    },
    "avg_salary": {
      "avg": {
        "field": "salary"
      }
    }
  }
}
```



### 1. Metric Aggregation

* 单值分析 ：只输出一个分析结果
  * min、max、avg、sum
  * Cardinality（类似 SQL 中的 distinct Count）
* 多值分析：输出多个分析结果
  * stats，extended stats
    * stats同时输出多个单值分析，包好 count，min，max，avg，sum等
  * percentile，percentile rank
  * top hits（排在前面的示例 ）



### 2. Bucket Aggregation

* 按照一定的规则，将文档分片到不同的桶中，从而达到分类的目的。
* ES 提供的一些常见的 Bucket Aggregation
  * Terms
    * 根据某个字段字段分组
  * 数字类型
    * Range / Data Range 
    * Histogram / Data Histogram 
* 支持嵌套：也就是在桶里再做分桶



#### Terms Aggregation

* 字段需要打开 Fielddata，才能进行 Terms Aggregation
  * Keyword 默认支持 fielddata
  * Text 类型需要在 Mapping 中 enable。会按照分词后的结果进行分



**根据 job.keyword 分桶**

```shell
# 对keword 进行聚合
POST employees/_search
{
  "size": 0,
  "aggs": {
    "jobs": {
      "terms": {
        "field":"job.keyword"
      }
    }
  }
}
```

**根据 job 分桶**

```shell
# 直接对 job 分桶 失败 因为 job 是 text 类型 且没有打开 fielddata
POST employees/_search
{
  "size": 0,
  "aggs": {
    "jobs": {
      "terms": {
        "field":"job"
      }
    }
  }
}
# 设置 mapping 打开 fielddata
PUT employees/_mapping
{
  "properties" : {
    "job":{
       "type":     "text",
       "fielddata": true
    }
  }
}
# 再次分桶就可以了，但是和 对 keyword 分桶结果不一致
# 因为 text 类型是分词后再进行分桶的
```



例子

```shell
# 指定size，不同工种中，年纪最大的3个员工的具体信息
POST employees/_search
{
  "size": 0,
  "aggs": {
  	# 先对工作进行分桶
    "jobs": {
      "terms": {
        "field":"job.keyword"
      },
      # 接着子聚合中排序 取前 3 
      "aggs":{
        "old_employee":{
          "top_hits":{
            "size":3,
            "sort":[
              {
                "age":{
                  "order":"desc"
                }
              }
            ]
          }
        }
      }
    }
  }
}
```

#### 优化 Terms 聚合的性能

可以打开`eager_global_ordinals`参数，开启预加载。

```shell
eager_global_ordinalsPUT index
{
	“mappings": {
		"propertites": {
			"foo": {
				"type": "keyword",
				"eager_global_ordinals": true 
			}
		}
	}
}
```

开启该参数后，ES 会自动将新写入的数据的 Terms 加载到 Cache 中。

什么时候该开启

* 1）Terms 查询频繁，且对性能有要求
* 2）同时这个索引有新文档不断的写入



### Range & Histogram 聚合

* 按照数字的范围，进行分桶
* 在 Range Aggregation  中，可以自定义 Key



例子

```shell
# salary range
POST employees/_search
{
  "size": 0,
  "aggs":{
    "salary_ranges":{
      "range":{
        "field": "salary",
        "ranges":[
          {
            "key": "<10000",
            "from": 0,
            "to": 10000
          },
          {
            "key": "10000~20000",
            "from": 10000,
            "to": 20000
          },
          {
            "key": ">20000",
            "from": 20000
          }
          ]
      }
    }
  }
}
```

工资直方图

```shell
#Salary Histogram,工资0到10万，以 5000一个区间进行分桶
POST employees/_search
{
  "size": 0,
  "aggs": {
    "salary_histrogram": {
      "histogram": {
        "field":"salary",
        "interval":5000,
        "extended_bounds":{
          "min":0,
          "max":100000
        }
      }
    }
  }
}
```



## 3. Bucket + Metric aggregation

* Bucket 聚合分析允许通过添加**子聚合**分析来进一步分析，子聚合分析可以是
  * Bucket
  * Metric



例子1

```shell

# 嵌套聚合1，按照工作类型分桶，并统计工资信息
POST employees/_search
{
  "size": 0,
  "aggs": {
    "Job_salary_stats": {
      "terms": {
        "field": "job.keyword"
      },
      "aggs": {
        "salary": {
          "stats": {
            "field": "salary"
          }
        }
      }
    }
  }
}
```



例子2

```shell
# 多次嵌套。根据工作类型分桶，然后按照性别分桶，计算工资的统计信息
POST employees/_search
{
  "size": 0,
  "aggs": {
    "Job_gender_stats": {
      "terms": {
        "field": "job.keyword"
      },
      "aggs": {
        "gender_stats": {
          "terms": {
            "field": "gender"
          },
          "aggs": {
            "salary_stats": {
              "stats": {
                "field": "salary"
              }
            }
          }
        }
      }
    }
  }
}
```

