# Function Score Query 优化算分

## 1. 算分与排序

* elasticsearch 默认会以文档的相关度算分进行排序
* 可以通过指定一个或者多个字段进行排序
* 使用相关度算分（score）排序，不能满足某些特定条件
  * 无法针对相关度，对排序实现更多的控制



## 2. Function Score Query

* 可以在查询结束后，对每一个匹配的文档进行一系列的重新算分，根据新生成的分数进行排序。
* 提供了机制默认的计算分值的函数
  * Weight - 为每一个文档设置一个简单而不被规范化的权重
  * Field Value Factor - 使用该数值来修改 _score，例如将 `热度` 和 `点赞数` 作为算分的参考因素
  * Random Score - 为每一个用户使用一个不同的，随机算分结果
  * 衰减函数 - 以某个字段的值为标准，距离某个值越接近，得分越高
  * Script Score - 自定义脚本完全控制所需逻辑

## 3. 例子

将投票数作为算分的参考因素，能够将点赞多的 blog ，放在搜索列表相对靠前的位置。同时搜索的评分，还是要作为排序的主要依据。

* 新的算分 = 旧算分 * 投票数（指定字段）
  * 投票数为 0  一直排最后
  * 投票数很大 不怎么相关也会排到前面



```shell
# 将投票数作为算分的参考因素
POST /blogs/_search
{
  "query": {
    "function_score": {
      "query": {
        "multi_match": {
          "query":    "popularity",
          "fields": [ "title", "content" ]
        }
      },
      "field_value_factor": {
        "field": "votes"
      }
    }
  }
}
```

### 使用Modifier 平滑曲线

* 新的算分 = 旧算分 * log(投票数)

```shell
POST /blogs/_search
{
  "query": {
    "function_score": {
      "query": {
        "multi_match": {
          "query":    "popularity",
          "fields": [ "title", "content" ]
        }
      },
      "field_value_factor": {
        "field": "votes",
        "modifier": "log1p"
      }
    }
  }
}
```

### 引入 Factor

* 新的算分 = 旧算分 * log(1+factor*投票数)

```shell
POST /blogs/_search
{
  "query": {
    "function_score": {
      "query": {
        "multi_match": {
          "query":    "popularity",
          "fields": [ "title", "content" ]
        }
      },
      "field_value_factor": {
        "field": "votes",
        "modifier": "log1p" ,
        "factor": 0.1
      }
    }
  }
}
```



### Boost Mode 和 Max Boost

* Boost Mode
  * Multiply - 算分与函数值的乘积
  * Sum - 算分与函数的和
  * Min / Max - 算分与函数取最小 / 最大值
  * Replace - 使用函数值代替算分
* Max Boost - 将算分控制在一个最大值

```shell
POST /blogs/_search
{
  "query": {
    "function_score": {
      "query": {
        "multi_match": {
          "query":    "popularity",
          "fields": [ "title", "content" ]
        }
      },
      "field_value_factor": {
        "field": "votes",
        "modifier": "log1p" ,
        "factor": 0.1
      },
      "boost_mode": "sum",
      "max_boost": 3
    }
  }
}
```



### 一致性随机函数

* 使用场景 - 网站的广告需要提高展现率
* 具体需求 - 让每个用户能看到不同的随机排名，但是也希望同一个用户访问时，结果的相对顺序，保持一致（Consistently Random）

```shell
# seed 变化后结果就会变化 seed 保持一致则结果也一致
# 比如把 userId 作为 seed 则每个用户会保持一致 不同用户结果又会不同
POST /blogs/_search
{
  "query": {
    "function_score": {
      "random_score": {
        "seed": 911119
      }
    }
  }
}
```

