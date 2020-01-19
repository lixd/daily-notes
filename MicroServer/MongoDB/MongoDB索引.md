# MongoDB 索引

MySQL官方对索引的定义为：索引（Index）是帮助MySQL高效获取数据的数据结构。提取句子主干，就可以得到索引的本质：**索引是数据结构**。

## 1.概述

索引最常用的比喻就是书籍的目录，查询索引就像查询一本书的目录。本质上目录是将书中一小部分内容信息（比如题目）和内容的位置信息（页码）共同构成，而由于信息量小（只有题目），所以我们可以很快找到我们想要的信息片段，再根据页码找到相应的内容。同样索引也是只保留某个域的一部分信息（建立了索引的field的信息），以及对应的文档的位置信息。
 假设我们有如下文档（每行的数据在MongoDB中是存在于一个Document当中）

| 姓名 | id   | 部门 | city      | score |
| ---- | ---- | ---- | --------- | ----- |
| 张三 | 2    | xxx  | Beijing   | 90    |
| 李四 | 1    | xxx  | Shanghai  | 70    |
| 王五 | 3    | xxx  | guangzhou | 60    |

假如我们想找id为2的document(即张三的记录)，如果没有索引，我们就需要扫描整个数据表，然后找出所有为2的document。当数据表中有大量documents的时候，这个时间就会非常长（从磁盘上查找数据还涉及大量的IO操作)。建立索引后会有什么变化呢？MongoDB会将id数据拿出来建立索引数据，如下

| 索引值 | 位置 |
| ------ | ---- |
| 1      | pos2 |
| 2      | pos1 |
| 3      | pos3 |

这样我们就可以通过扫描这个小表找到document对应的位置。

## 2. 分类

### 1. 单字段索引 （Single Field Index）

是最普通的索引，单键索引不会自动创建。

```sh
 # 为id field建立索引，1表示升序，-1表示降序，没有差别
db.employee.createIndex({'id': 1})
```



### 2. 多键索引

多键索引与单键索引区别在于多键索引的值具有多个记录，是一个数组

```swift
{"name" : "jack", "age" : 19, habbit: ["football, runnning"]}
db.person.createIndex( {habbit: 1} )  // 自动创建多key索引
db.person.find( {habbit: "football"} )
```

### 3. 复合索引

即同时为多个字段建立索引。

```sh
db.collection.createIndex({'id': 1, 'city': 1, 'score': 1}) 
```

先根据`id`排序，`id`相同在根据`city`排序 最后在根据`score`排序

索引field的先后顺序很关键，影响有两方面：

1. MongoDB在复合索引中是根据prefix排序查询，就是说排在前面的可以单独使用。我们创建一个如下的索引

```bash
db.collection.createIndex({'id': 1, 'city': 1, 'score': 1}) 
```

我们如下的查询可以利用索引

```ruby
db.collection.find({'id': xxx})
db.collection.find({'id': xxx, 'city': xxx})
db.collection.find({'id': xxx, 'city':xxx, 'score': xxxx})
```

但是如下的查询无法利用该索引

```ruby
db.collection.find({'city': xxx})
db.collection.find({'city':xxx, 'score': xxxx})
```

还有一种特殊的情况，就是如下查询：

```bash
db.collection.find({'id': xxx, 'score': xxxx})
```

这个查询也可以利用索引的前缀'id'来查询，但是却不能针对score进行查询，你可以说是部分利用了索引，因此其效率可能不如如下索引：

```bash
db.collection.createIndex({'id': 1, 'score': 1}) 
```

2.过滤出的document越少的field越应该放在前面，比如此例中id如果是唯一的，那么就应该放在最前面，因为这样通过id就可以锁定唯一一个文档。而如果通过city或者score过滤完成后还是会有大量文档，这就会影响最终的性能。

索引的排序顺序不同

复合索引最末尾的field，其排序顺序不同对于MongoDB的查询排序操作是有影响的。
 比如：

```css
db.events.createIndex( { username: 1, date: -1 } )
```

这种情况下， 如下的query可以利用索引：

```css
db.events.find().sort( { username: 1, date: -1 } )
```

但是如下query则无法利用index进行排序

```css
db.events.find().sort( { username: 1, date: 1 } )
```

### 4.其它类型索引

另外，MongoDB中还有其它如哈希索引，地理位置索引以及文本索引，主要用于一些特定场景，具体可以参考官网，在此不再详解



## 3. 索引属性

索引主要有以下几个属性:

- unique：这个非常常用，用于限制索引的field是否具有唯一性属性，即保证该field的值唯一
- partial：很有用，在索引的时候只针对符合特定条件的文档来建立索引，如下

```php
db.restaurants.createIndex(
   { cuisine: 1, name: 1 },
   { partialFilterExpression: { rating: { $gt: 5 } } } //只有当rating大于5时才会建立索引
)
```

这样做的好处是，我们可以只为部分数据建立索引，从而可以减少索引数据的量，除节省空间外，其检索性能也会因为较少的数据量而得到提升。

- sparse：可以认为是partial索引的一种特殊情况，由于MongoDB3.2之后已经支持partial属性，所以建议直接使用partial属性。
- TTL。 可以用于设定文档有效期，有效期到自动删除对应的文档。



### explain

可以通过explain结果来分析性能

```sh
# explain 有三种模式： "queryPlanner", "executionStats", and "allPlansExecution".
# 其中最常用的就是第二种"executionStats"，它会返回具体执行的时候的统计数据
db.inventory.find(
   { quantity: { $gte: 100, $lte: 200 } }
).explain("executionStats")
```



```sh
/* 1 */
{
    "queryPlanner" : {
        "plannerVersion" : 1,
        "namespace" : "xxx",
        "indexFilterSet" : false,
        "parsedQuery" : {},
        "winningPlan" : {
            "stage" : "COLLSCAN",
            "direction" : "forward"
        },
        "rejectedPlans" : []
    },
    "serverInfo" : {
        "host" : "iZ2ze78em53s7ii5ok4gbxZ",
        "port" : 27017,
        "version" : "4.0.14",
        "gitVersion" : "1622021384533dade8b3c89ed3ecd80e1142c132"
    },
    "ok" : 1.0
}
```

其中` "stage" : "COLLSCAN",`意味着全表扫描，mongodb中一共有以下几种类型

* COLLSCAN – Collection scan 全表扫描

* IXSCAN – Scan of data in index keys 索引扫描

* FETCH – Retrieving documents 

* SHARD_MERGE – Merging results from shards

* SORT – Explicit sort rather than using index order

现在我们来创建一个索引：

```css
db.inventory.createIndex( { quantity: 1 } )
```

再来看下explain的结果

```css
db.inventory.find(
   { quantity: { $gte: 100, $lte: 200 } }
).explain("executionStats")
```

结果如下：

```objectivec
{
   "queryPlanner" : {
         "plannerVersion" : 1,
         ...
         "winningPlan" : {
               "stage" : "FETCH",
               "inputStage" : {
                  "stage" : "IXSCAN",  # 这里"IXSCAN"意味着索引扫描
                  "keyPattern" : {
                     "quantity" : 1
                  },
                  ...
               }
         },
         "rejectedPlans" : [ ]
   },
   "executionStats" : {
         "executionSuccess" : true,
         "nReturned" : 3,
         "executionTimeMillis" : 0,
         "totalKeysExamined" : 3,  # 这里nReturned、totalKeysExamined和totalDocsExamined相等说明索引没有问题，因为我们通过索引快速查找到了三个文档，且从磁盘上也是去取这三个文档，并返回三个文档。
         "totalDocsExamined" : 3,
         "executionStages" : {
            ...
         },
         ...
   },
   ...
}
```

再来看下如何通过explain来比较compound index的性能，之前我们在介绍复合索引的时候已经说过field的顺序会影响查询的效率。有时这种顺序并不太好确定（比如field的值都不是unique的），那么怎么判断哪种顺序的复合索引的效率高呢，这就像需要explain结合hint来进行分析。
 比如我们要做如下查询：

```css
db.inventory.find( {
   quantity: {
      $gte: 100, $lte: 300
   },
   type: "food"
} )
```

会返回如下文档：

```json
{ "_id" : 2, "item" : "f2", "type" : "food", "quantity" : 100 }
{ "_id" : 5, "item" : "f3", "type" : "food", "quantity" : 300 }
```

现在我们要比较如下两种复合索引

```css
db.inventory.createIndex( { quantity: 1, type: 1 } )
db.inventory.createIndex( { type: 1, quantity: 1 } )
```

分析索引 { quantity: 1, type: 1 }的情况

```css
# 结合hint和explain来进行分析
db.inventory.find(
   { quantity: { $gte: 100, $lte: 300 }, type: "food" }
).hint({ quantity: 1, type: 1 }).explain("executionStats") # 这里使用hint会强制数据库使用索引 { quantity: 1, type: 1 }
```

explain结果

```bash
{
   "queryPlanner" : {
      ...
      "winningPlan" : {
         "stage" : "FETCH",
         "inputStage" : {
            "stage" : "IXSCAN",
            "keyPattern" : {
               "quantity" : 1,
               "type" : 1
            },
            ...
            }
         }
      },
      "rejectedPlans" : [ ]
   },
   "executionStats" : {
      "executionSuccess" : true,
      "nReturned" : 2,
      "executionTimeMillis" : 0,
      "totalKeysExamined" : 5,  # 这里是5与totalDocsExamined、nReturned都不相等
      "totalDocsExamined" : 2,
      "executionStages" : {
      ...
      }
   },
   ...
}
```

再来看下索引 { type: 1, quantity: 1 } 的分析

```css
db.inventory.find(
   { quantity: { $gte: 100, $lte: 300 }, type: "food" }
).hint({ type: 1, quantity: 1 }).explain("executionStats")
```

结果如下：

```bash
{
   "queryPlanner" : {
      ...
      "winningPlan" : {
         "stage" : "FETCH",
         "inputStage" : {
            "stage" : "IXSCAN",
            "keyPattern" : {
               "type" : 1,
               "quantity" : 1
            },
            ...
         }
      },
      "rejectedPlans" : [ ]
   },
   "executionStats" : {
      "executionSuccess" : true,
      "nReturned" : 2,
      "executionTimeMillis" : 0,
      "totalKeysExamined" : 2, # 这里是2，与totalDocsExamined、nReturned相同
      "totalDocsExamined" : 2,
      "executionStages" : {
         ...
      }
   },
   ...
}
```

可以看出后一种索引的totalKeysExamined返回是2，相比前一种索引的5，显然更有效率。



## 参考

`https://www.jianshu.com/p/2b09821a365d`