# Mapping 数据建模最佳实践

## 1. 字段建模

主要考虑以下几个方面：

* 1）字段类型 
* 2）是否要搜索及分词 
* 3）是否要聚合及排序 
* 4）是否要额外的存储



### 1. 字段类型 

**Text&keyword**

* Text
  * 用于全文本字段，文本**会被分词**
  * 默认不支持聚合分析及排序（需要设置 fielddata 为 true）
* Keyword
  * 用于 id，枚举及**不需要分词**的文本。例如电话号码，email地址，邮编，性别等
  * 适用于 Filter（精确匹配），Sorting和Aggregation
* 设置多字段类型
  * 默认会为文本类型设置成 text，并且设置一个 keyword的子字段
  
  * ```conf
          "title": {
            "type": "text",
            "fields": {
              "keyword": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          }
    ```
  
  * 在处理人类语言时，通过增加`英文`、`拼音`和`标准`分词器，提高搜索结构

**结构化数据**

* 数值类型
  * 尽量选择贴近的类型。例如能用 byte 就不要用 long
* 枚举类型
  * 设置为 keyword。即便是数字，也应该设置成 keyword，获取更好的性能
* 其他
  * 日期、布尔、地理信息



### 2. 检索

* 如不需要检索、排序和聚合
  * Enable 设置成 false
* 如不需要检索
  * Index 设置成 false
* 对需要检索的字段，可以通过如下配置，设定存储粒度
  * Index options / norms：不需要归一化数据时，可以关闭



### 3. 聚合及排序

* 如不需要检索、排序和聚合
  * Enable 设置成 false
* 如不需要排序或者聚合分析功能
  * Doc_values / fielddata 设置成 false
* **更新**、**聚合**查询频繁的 keyword 类型的字段
  * 推荐将 **eager_global_ordinals** 设置为 true



### 4. 额外存储

* 是否需要专门存储当前字段数据
  * Store 设置成 true，可以存储该字段的原始内容
  * 一般结合 _source 的 enabled 为 false 时候使用
* Disable _source：节约磁盘，适用于指标型数据
  * 一般建议先考虑增加压缩比
  * 无法看到_source 字段，无法做 Reindex，无法做 Update



### 5. number 和 keyword

为了满足数值类型的范围查询要求，在 Lucene6.0（ES 5.0）及之后使用的是Block k-d tree(类似于B+树)实现。

> 之前的版本还是用的倒排索引。

倒排索引在内存里维护了词典 (Term Dictionary)和文档列表(Postings List)的映射关系，倒排索引本身对于精确匹配查询是非常快的，直接从字典表找到term，然后就直接找到了posting list。

> 即倒排索引效率高于 k-d tree

**所以对于不需要范围查询，只会进行精确匹配的数值类型也可以设置为 keyword 类型，以提升效率。**

参考文章：

> https://blog.csdn.net/pony_maggie/article/details/112796329
>
> https://elasticsearch.cn/article/446



## 2. 最佳实践



### 1. 如何处理关联关系

* 优先考虑 Denormalization
* 当数据包含多数值对象，同时有查询需求 使用 Nested 嵌套对象
* 关联文档更新非常频繁时推荐 Parent / Child 父子文档



### 2.  避免过多字段

* 一个文档中，最好避免大量的字段
  * 过多的字段不容易维护
  * Mapping 信息保存在 Cluster State 中，数据量过大，对集群性能会有影响（Cluster State 信息需要和所有的节点同步）
  * 删除或者修改数据需要 reindex
* 默认最大字段数是 1000，可以设置`index.mapping.total_fields.limt`限定最大字段数

**什么原因会导致文档中有成百上千的字段？**

* Dynamic（生产环境中，尽量不要打开 Dynamic）
  * true - 未知字段会被自动加入
  * false - 新字段不会被索引，但是会被保存在_source
  * strict - 新增字段不会被索引，文档写入失败
* Strict
  * 可以控制到字段级别



### 3. 避免正则查询

**问题**

* 正则，通配符查询，前缀查询数据 Term 查询，**但是性能不够好**
* 特别是将通配符放在开头，会导致性能的灾难

**案例**

* 文档中某个字段包含了 ES 的版本信息，例如 `version:"7.1.0"`
* 比如使用通配符查询版本号第二位为 1 的文档

**解决方案**

将版本号拆分为 `marjor`、`minor`、`hot_fix`，查询时就可以指定查询了。



### 4. 避免空值引起的聚合不准

```shell
# 写入两条数据 其中一条为 null
PUT ratings/_doc/1
{
 "rating":5
}
PUT ratings/_doc/2
{
 "rating":null
}
```

```shell
# 聚合结果  avg 很明显应该是 2.5 的 但是这里的结果却是 5 。
POST ratings/_search
{
  "size": 0,
  "aggs": {
    "avg": {
      "avg": {
        "field": "rating"
      }
    }
  }
}
```

解决办法，为字段设置默认值

```shell
PUT ratings
{
  "mappings": {
      "properties": {
        "rating": {
          "type": "float",
          "null_value": 1.0
        }
      }
    }
}
```



### 5. 将索引的 Mapping 加入 Meta 信息

Mapping 的设置非常重要，需要从两个维度进行考虑

* 功能：搜索，聚合，排序
* 性能：存储的开销；内存的开销；搜索的性能

Mappings 设置是一个迭代的过程

* 加入新字段很容易（必要时需要 update_by_query）
* 更新删除字段不允许（需要 Reindex 重建索引）
* 最好能对 Mapping  加入 Meta 信息，更好的进行版本管理
* 可以考虑将 Mapping 文件上传 git 进行管理



## 3. 使用建议

推荐的 Mapping 创建步骤如下：

1. 创建一个临时的 Index，写入一些样本数据，利用 Dynamic Mapping 机制自动生成 Mapping
2. 通过 访问 Mapping API 获得该临索引件的动态 Mapping 定义
3. 修改自动创建的 Mapping（比如自动推断的类型可能不正确等），使用该配置创建你的索引
4. 删除临时索引



```json
PUT article_v1
{
  "mappings": {
    "properties": {
      "classify": {
        "type": "text"
      },
      "describe": {
        "type": "text"
      },
      "process": {
        "type": "long"
      },
      "questionNum": {
        "type": "long"
      },
      "status": {
        "type": "long"
      },
      "tid": {
        "type": "keyword"
      },
      "title": {
        "type": "text",
        "fields": {
          "keyword": {
            "type": "keyword",
            "ignore_above": 256
          }
        }
      }
    }
  }
}
```

