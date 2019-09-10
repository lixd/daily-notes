# Go mongodb

## 概述

第三方库：`go.mongodb.org/mongo-driver`

文档：`https://godoc.org/go.mongodb.org/mongo-driver`

## 使用

```go
UpdateOne
UpdateMany
DeleteOne
DeleteMany
FindOne
Find //many
InsertOne
InsertMany
```

## MongoDB 聚合管道（Aggregation Pipeline

### 概述

为了回应用户对简单数据访问的需求,MongoDB2.2版本引入新的功能[聚合框架](http://blog.mongodb.org/post/16015854270/operations-in-the-new-aggregation-framework)（Aggregation Framework） ，它是数据聚合的一个新框架，其概念类似于数据处理的管道。 每个文档通过一个由多个节点组成的管道，每个节点有自己特殊的功能（分组、过滤等），文档经过管道处理后，最后输出相应的结果。管道基本的功能有两个：

* 一是对文档进行“过滤”，也就是筛选出符合条件的文档;

* 二是对文档进行“变换”，也就是改变文档的输出形式。

其他的一些功能还包括按照某个指定的字段分组和排序等。而且在每个阶段还可以使用表达式操作符计算平均值和拼接字符串等相关操作。管道提供了一个MapReduce 的替代方案，MapReduce使用相对来说比较复杂，而管道的拥有固定的接口(操作符表达),使用比较简单，对于大多数的聚合任务管道一般来说是首选方法。

### 管道操作符

管道是由一个个功能节点组成的，这些节点用管道操作符来进行表示。聚合管道以一个集合中的所有文档作为开始，然后这些文档从一个操作节点 流向下一个节点 ，每个操作节点对文档做相应的操作。这些操作可能会创建新的文档或者过滤掉一些不符合条件的文档，在管道中可以对文档进行重复操作。

#### $project

数据投影，主要用于重命名、增加和删除字段

##### 1. 过滤字段

```javascript
db.getCollection('mycol3').aggregate
([
{$project:{score:1}}
])
//result
/* 1 */
{
    "_id" : ObjectId("5ceb8a5f43cacce5337227b4"),
    "score" : 80
}
```

这样文档只剩下 `_id`和`score`两个字段了，其中 1 表示保留，0 表示去掉，`_id`字段默认保留，若要去掉id可以显式指定为 0

```go
db.getCollection('mycol3').aggregate
([
{$project:{_id:0,score:1}}
])
//result
/* 1 */
{
    "score" : 80
}
```

这样只剩下`score`字段

##### 2. 算术类型表达式操作符

也可以在$project内使用算术类型表达式操作符,计算`score`字段超过基准线(60分)多少

```go
db.getCollection('mycol3').aggregate
([
    {$project:{
        score:1,
        moreScore:{$subtract:["$score",60]}}}
])
//result
/* 1 */
{
    "_id" : ObjectId("5ceb8a5f43cacce5337227b4"),
    "score" : 80,
    "moreScore" : 20.0
}
```

##### 3. 重命名字段名

除此之外使用$project还可以重命名字段名和子文档的字段名

```go
db.getCollection('mycol3').aggregate
([
    {$project:{
        myscore:"$score"
       }}
])
//result 
{
    "_id" : ObjectId("5ceb8a5f43cacce5337227b4"),
    "myscore" : 80
}
```

##### 4. 添加子文档

也可以添加子文档

```go
db.getCollection('mycol3').aggregate
([
    {$project:{
        myscore:"$score",
        child:{
            childScore:"$score"
            }
       }}
])
//result
/* 1 */
{
    "_id" : ObjectId("5ceb8a5f43cacce5337227b4"),
    "myscore" : 80,
    "child" : {
        "childScore" : 80
    }
}
```

产生了一个子文档 child ,里面包含 childScore 一个字段。

#### $match

滤波操作，筛选符合条件文档，作为下一阶段的输入，$match的语法和查询表达式(db.collection.find())的语法相同

```go
db.getCollection('mycol3').aggregate
([
    {$match:{score:{$gt:60,$lt:80}}
       }
])
//result
/* 1 */
{
    "_id" : ObjectId("5ceb8a5f43cacce5337227b5"),
    "title" : "second",
    "score" : 70
}
```

$match用于获取分数大于60并且小于80记录，然后将符合条件的记录送到下一阶段管道操作符进行处理。

####  $limit

限制经过管道的文档数量， $limit的参数只能是一个**正整数**

```go
db.getCollection('mycol3').aggregate
([
    {$limit:2}
])
//result
/* 1 */
/* 1 */
{
    "_id" : ObjectId("5ceb8a5f43cacce5337227b4"),
    "title" : "first",
    "score" : 80
}

/* 2 */
{
    "_id" : ObjectId("5ceb8a5f43cacce5337227b5"),
    "title" : "second",
    "score" : 70
}
```

这样的话经过$limit管道操作符处理后，管道内就只剩下前2个文档了

#### $skip

从待操作集合开始的位置跳过文档的数目，$skip参数也只能为一个**正整数**

```go
db.getCollection('mycol3').aggregate
([
    {$skip:2}
])
```

经过$skip管道操作符处理后，前2个文档被“过滤”掉

#### $unwind

将数组元素拆分为独立字段，将数组拆分成一个一个的数据 (相当于分组的逆操作)

##### 直接拆分

```go
// $unwind 之前
{
    "_id" : ObjectId("5ceb9c4ad086a6afaca6b743"),
    "type" : "C",
    "tags" : [ 
        "good", 
        "fun", 
        "computer"
    ]
}
//$unwind 
db.getCollection('mycol3').aggregate
([
    {$unwind:"$tags"
    }
])
// $unwind 之后
{
    "_id" : ObjectId("5ceb9c4ad086a6afaca6b743"),
    "type" : "C",
    "tags" : "good"
}
{
    "_id" : ObjectId("5ceb9c4ad086a6afaca6b743"),
    "type" : "C",
    "tags" : "fun"
}
{
    "_id" : ObjectId("5ceb9c4ad086a6afaca6b743"),
    "type" : "C",
    "tags" : "computer"
```

**注意**:有可能出现数据丢失(**字段不存在的**和**属性值为null的**数据丢失)

##### 拆分且防止数据丢失

```go
db.getCollection('mycol3').aggregate
([
    {$unwind:
       {
        path:"$tags",
        preserveNullAndEmptyArrays:true #为true表示防止空数组和null丢失
       }
    }
])
```

这样拆分时如果前数据没有拆分的这个字段或者为null也不会丢失。



**注意事项**

* a.`{$unwind:"$tags"})` 不要忘了`$`符号
* b.如果$unwind目标字段不存在的话，那么该文档将被忽略过滤掉，输出结果为空
* c.如果$unwind目标字段数组为空的话，该文档也将会被忽略。
* d.如果$unwind目标字段不是一个数组的话，将会产生错误

#### $group

数据进行分组，**$group的时候必须要指定一个_id域**，同时也可以包含一些算术类型的表达式操作符

```go
db.getCollection('mycol3').aggregate
([
  {$group:{
      _id:"$type",
      score:{$sum:"$score"}}
      }
])
//result
/* 1 */
{
    "_id" : "C",
    "score" : 250
}
/* 2 */
{
    "_id" : "Golang",
    "score" : 330
}
/* 3 */
{
    "_id" : "Java",
    "score" : 450
}
```

这里将`_id`指定为`type`,那么后续的`$sum` 对 score求和 则是以type属性分组。

如果是`$sum:1`就相当于`count(*)`，一行记录算一个

**注意事项** 

* 1.$group的输出是无序的。
* 2.$group操作目前是在**内存**中进行的，所以**不能**用它来对**大量**个数的文档进行分组。

#### $sort 

对文档按照指定字段排序

```go
db.getCollection('mycol3').aggregate
([
  {$sort:{score:1,title:-1}}
])
//对文档按照分数升序排列 按标题降序排列 1 为升序 0 为降序
```

**注意事项**

* 1.如果将$sort放到管道前面的话可以利用索引，提高效率
* 2.MongoDB 24 对内存做了优化，在管道中如果$sort出现在$limit之前的话，$sort只会对前$limit个文档进行操作，这样在内存中也只会保留前$limit个文档，从而可以极大的节省内存
* 3.$sort操作是在内存中进行的，如果其占有的内存超过物理内存的10%，程序会产生错误

#### $goNear

 $goNear会返回一些坐标值，这些值以按照距离指定点距离由近到远进行排序

#### $count

用于统计文档的数量

```go
{ ＄count: ＜string> } 
```

```go
db.getCollection('mycol3').aggregate
([
    {$match:
        {score:{$gt:50}}},
    {$count:
       "score"
    }
])
//result 18
```

查询分数大于50的记录数

### 管道表达式

`管道操作符`作为“`键`”,所对应的“`值`”叫做`管道表达式`。

例如上面例子中{$match:{status:"A"}}，`$match`称为管道操作符，而`{status:"A"}`称为管道表达式，它可以看作是管道操作符的操作数(Operand)，`每个管道表达式是一个文档结构`，它是由字段名、字段值、和一些表达式操作符组成的.

**每个管道表达式只能作用于处理`当前`正在处理的文档，而不能进行跨文档的操作**。管道表达式对文档的处理都是在`内存`中进行的。

除了能够进行累加计算的管道表达式外，其他的表达式都是无状态的，也就是不会保留上下文的信息。

累加性质的表达式操作符通常和$group操作符一起使用，来统计该组内最大值、最小值等，例如上面的例子中我们在$group管道操作符中使用了具有累加的$sum来计算总和。

#### 语法

方法1：

```
{ <operator>: [ <argument1>, <argument2> ... ] }
```

方法2：

```
{ <operator>: <argument> }
```



#### 组聚合操作符

| **Name**                                                     | **Description**                                              |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| [$addToSet](http://docs.mongodb.org/manual/reference/operator/aggregation/addToSet/#grp._S_addToSet) | 在结果文档中插入值到一个数组中，但不创建副本。url : {$addToSet : "$url"} |
| [$first](http://docs.mongodb.org/manual/reference/operator/aggregation/first/#grp._S_first) | Returns the first value in a group.                          |
| [$last](http://docs.mongodb.org/manual/reference/operator/aggregation/last/#grp._S_last) | Returns the last value in a group.                           |
| [$max](http://docs.mongodb.org/manual/reference/operator/aggregation/max/#grp._S_max) | Returns the highest value in a group.                        |
| [$min](http://docs.mongodb.org/manual/reference/operator/aggregation/min/#grp._S_min) | Returns the lowest value in a group.                         |
| [$avg](http://docs.mongodb.org/manual/reference/operator/aggregation/avg/#grp._S_avg) | Returns an average of all the values in a group.             |
| [$push](http://docs.mongodb.org/manual/reference/operator/aggregation/push/#grp._S_push) | 在结果文档中插入值到一个数组中。url : {$push: "$url"}        |
| [$sum](http://docs.mongodb.org/manual/reference/operator/aggregation/sum/#grp._S_sum) | Returns the sum of all the values in a group.                |

##### push

按照 `type` 分组 然后将 `score` 属性映射到数组中

```go
db.getCollection('mycol3').aggregate
([
 {$group:
     {_id:"$type",
      score:{$push:"$score"}
     }
  }
])
//result
{
    "_id" : "C",
    "score" : [ 
        40, 
        30,
    ]
}
{
    "_id" : "Golang",
    "score" : [ 
        60, 
        50
    ]
}
{
    "_id" : "Java",
    "score" : [ 
        80, 
        70
    ]
}
```

##### addToSet

为组里唯一的值创建一个数组，去除重复的值。

和push；类似，但是会去除重复的值。



> 以下表格来源于：`https://www.jianshu.com/p/6b19fbdec3b7`

#### 布尔值操作符

| 操作符 | 简述                                                         |
| :----- | :----------------------------------------------------------- |
| $and   | 逻辑与操作符，当他的表达式中所有值都是true的时候，才返回true。 用法：`{ $and: [ <expression1>, <expression2>, ... ] }`。 |
| $or    | 逻辑或操作符，当他的表达式中有值是true的时候，就会返回true。用法：`{ $or: [ <expression1>, <expression2>, ... ] }` |
| $not   | 取反操作符，返回表达式中取反后的布尔值。用法：`{ $not: [ <expression> ] }` |

#### 比较类型聚合操作符

| 操作符 | 简述                                                         |
| :----- | :----------------------------------------------------------- |
| $cmp   | 比较操作符，比较表达式中两个值的大小，如果第一个值小于第二个值则返回-1，相等返回0，大于返回1。用法`{ $cmp: [ <expression1>, <expression2> ] }` |
| $eq    | 比较表达式中两个是否相等，是则返回true，否则返回false。用法`{ $eq: [ <expression1>, <expression2> ] }` |
| $gt    | 比较表达式中第一个值是否大于第二个值，是则返回true，否则返回false。用法`{ $gt: [ <expression1>, <expression2> ] }` |
| $gte   | 比较表达式中第一个值是否大于等于第二个值，是则返回true，否则返回false。用法`{ $gte: [ <expression1>, <expression2> ] }` |
| $lt    | 比较表达式中第一个值是否小于第二个值，是则返回true，否则返回false。用法`{ $lt: [ <expression1>, <expression2> ] }` |
| $lte   | 比较表达式中第一个值是否小于等于第二个值，是则返回true，否则返回false。用法`{ $lte: [ <expression1>, <expression2> ] }` |
| $ne    | 比较表达式中两个是否相等，不过返回值与 ne: [ <expression1>, <expression2> ] }` |

#### 算术类型聚合操作符

| 操作符    | 简述                                                         |
| :-------- | :----------------------------------------------------------- |
| $abs      | 求绝对值操作符，于v3.2版新加入。用法：`{ $abs: <number> }`   |
| $add      | 求和操作符，返回所有表达式相加起来的结果。用法：`{ $add: [ <expression1>, <expression2>, ... ] }` |
| $ceil     | 进一法取整操作符，取 于v3.2版新加入。用法：`{ $ceil: <number> }` |
| $divide   | 求商操作符，返回表达式1除以表达式2的商。用法：`{ $divide: [ <expression1>, <expression2> ] }` |
| $subtract | 求差操作符，返回表达式1减去表达式2的结果。用法：`{ $subtract: [ <expression1>, <expression2> ] }` |
| $multiply | 求积操作符，返回所有表达式相乘的结果。用法：`{ $multiply: [ <expression1>, <expression2>, ... ] }` |
| $mod      | 求余操作符，返回所有表达式1除以表达式2所得到的余数。用法：`{ $multiply: [ <expression1>, <expression2>] }` |

#### 字符串类型聚合操作符

| 操作符       | 简述                                                         |
| :----------- | :----------------------------------------------------------- |
| $concat      | 连接操作符，将给定表达式中的字符串连接一起。用法：`{ $concat: [ <expression1>, <expression2>, ... ] }` |
| $split       | 切割操作符，用于对字符串进行分切。用法：`{ $split: [ <string expression>, <delimiter> ] }` |
| $toLower     | 用于返回字符串的小写形式。用法：`{ $toLower: <expression> }` |
| $toUpper     | 用于返回字符串的大写形式。用法：`{ $toUpper: <expression> }` |
| $substr      | 用于返回子字符串，v3.4+版本不建议使用，应该使用substrBytes或substrCP，v3.4+版本使用的话，相当于substrBytes。用法：`{ $substr: [ <string>, <start>, <length> ] }` |
| $substrBytes | 用于根据UTF-8下的字节位置返回子字符串（起始位置为0），于v3.4新增。用法：`{ $substrBytes: [ <string expression>, <byte index>, <byte count> ] }` |
| $substrCP    | 用于根据UTF-8下的Code Point位置返回子字符串（起始位置为0），于v3.4新增。用法：`{ $substrCP: [ <string expression>, <code point index>, <code point count> ] }` |

#### 日期类型聚合操作符

| 操作符        | 简述                                                         |
| :------------ | :----------------------------------------------------------- |
| $dayOfYear    | 返回一年中的一天，值在1和366（闰年）之间。用法：`{ $dayOfYear: <expression> }` |
| $dayOfMonth   | 返回一个月中的一天，值在1和31之间。用法：`{ $dayOfMonth: <expression> }` |
| $dayOfWeek    | 返回一周中的一天，值在1（周日）和7（周六）之间。用法：`{ $dayOfWeek: <expression> }` |
| $year         | 返回年份，eg:2017。用法：`{ $year: <expression> }`           |
| $month        | 返回月份，值在1和12之间。用法：`{ $month: <expression> }`    |
| $week         | 返回周 ，值在0和53之间。用法：`{ $week: <expression> }`      |
| $hour         | 返回时 ，值在0和23之间。用法：`{ $hour: <expression> }`      |
| $minute       | 返回分 ，值在0和59之间。用法：`{ $minute: <expression> }`    |
| $second       | 返回秒，值在0和60之间（闰秒）。用法：`{ $second: <expression> }` |
| $millisecond  | 返回毫秒，值在0和999之间。用法：`{ $millisecond: <expression> }` |
| $dateToString | 返回日期的字符串。用法：`{ $dateToString: { format: <formatString>, date: <dateExpression> } }` |

#### 条件类型聚合操作符

| 操作符  | 简述                                                         |
| :------ | :----------------------------------------------------------- |
| $cond   | 用法：`{ $cond: [ <boolean-expression>, <true-case>, <false-case> ] }` 或者 v2.6+还支持`{ $cond: { if: <boolean-expression>, then: <true-case>, else: <false-case-> } }` |
| $ifNull | 用法：`{ $ifNull: [ <expression>, <replacement-expression-if-null> ] }` |

**注**：以上操作符都必须在管道操作符的表达式内来使用。

### 聚合管道的优化

#### 1.$sort  +  $skip  +  $limit顺序优化

如果在执行管道聚合时，如果$sort、$skip、$limit依次出现的话，例如：

```go
{ $sort: { age : -1 } },
{ $skip: 10 },
{ $limit: 5 }
```

那么实际执行的顺序为：

```go
{ $sort: { age : -1 } },
{ $limit: 15 },
{ $skip: 10 }
```

$limit会提前到$skip前面去执行。

此时$limit = 优化前$skip+优化前$limit

这样做的好处有两个:

* 1.在经过$limit管道后，管道内的文档数量个数会“提前”减小，这样会节省内存，提高内存利用效率。
* 2.$limit提前后，$sort紧邻$limit这样的话，当进行$sort的时候当得到前“$limit”个文档的时候就会停止。

#### 2.$limit + $skip + $limit + $skip Sequence Optimization

如果聚合管道内反复出现下面的聚合序列：

```go
  { $limit: 100 },
  { $skip: 5 },
  { $limit: 10},
  { $skip: 2 }
```

首先进行局部优化为：可以按照上面所讲的先将第二个$limit提前：

```go
{ $limit: 100 },
  { $limit: 15},
  { $skip: 5 },
  { $skip: 2 }
```

进一步优化：两个**$limit**可以直接取**最小值** ，两个**$skip**可以直接**相加**:

```go
{ $limit: 15 },
  { $skip: 7 }
```

#### 3.Projection Optimization

尽早的使用$project投影，设置需要使用的字段，去掉不用的字段，可以大大减少内存。除此之外也可以过早使用

我们也应该过早使用$match、$limit、$skip操作符，他们可以提前减少管道内文档数量，减少内存占用，提供聚合效率。

除此之外，$match尽量放到聚合的第一个阶段，如果这样的话$match相当于一个按条件查询的语句，这样的话可以使用索引，加快查询效率

### 聚合管道的现在

#### 1.类型限制

在管道内不能操作 Symbol, MinKey, MaxKey, DBRef, Code, CodeWScope类型的数据( 2.4版本解除了对二进制数据的限制).

#### 2.结果大小限制

管道线的输出结果不能超过BSON 文档的大小（16M),如果超出的话会产生错误.

#### 3.内存限制

如果一个管道操作符在执行的过程中所占有的内存超过系统内存容量的10%的时候，会产生一个错误。

当$sort和$group操作符执行的时候，整个输入都会被加载到内存中，如果这些占有内存超过系统内存的%5的时候，会将一个warning记录到日志文件。同样，所占有的内存超过系统内存容量的10%的时候，会产生一个错误。

## 总结

对于大多数的聚合操作，聚合管道可以提供很好的性能和一致的接口，使用起来比较简单， 和MapReduce一样，它也可以作用于分片集合，但是输出的结果只能保留在一个文档中，要遵守BSON Document大小限制（当前是16M)。

管道对数据的类型和结果的大小会有一些限制，对于一些简单的固定的聚集操作可以使用管道，但是对于一些复杂的、大量数据集的聚合任务还是使用MapReduce。

### 聚合查询

```mysql
db.orders.aggregate([
   {
     $lookup:
       {
         from: "inventory",
         localField: "item",
         foreignField: "sku",
         as: "inventory_docs"
       }
  }
])
```

从集合order中逐个获取文档处理，拿到一个文档后，会根据localField 值 遍历 被 Join的 inventory集合（from: "inventory"），看inventory集合文档中 foreignField值是否与之相等。如果相等，就把符合条件的inventory文档  整体 内嵌到聚合框架新生成的文档中，并且新key 统一命名为 inventory_docs。考虑到符合条件的文档不唯一，这个Key对应的Value是个数组形式。原集合中Key对应的值为Null值或不存在时，需特别小心。

## 参考

`https://www.cnblogs.com/shanyou/p/3494854.html`

`https://www.jianshu.com/p/6b19fbdec3b7`