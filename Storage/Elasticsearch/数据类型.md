# Elasticsearch 数据类型

## 1. 普通数据类型

### 1. 字符串

有`text` 和 `keyword` 这两种 。

*  `text` 支持分词，用于全文搜索；
* `keyword` 不支持分词，用于聚合和排序。

### 2. 数字类型

支持 long，integer，short，byte，double，float，half_float，scaled_float。具体说明如下：

- long

带符号的64位整数，其最小值为`-2^63`，最大值为`(2^63)-1`。

- integer

带符号的32位整数，其最小值为`-2^31`，最大值为`(23^1)-1`。

- short

带符号的16位整数，其最小值为-32,768，最大值为32,767。

- byte

带符号的8位整数，其最小值为-128，最大值为127。

- double

双精度64位IEEE 754浮点数。

- float

单精度32位IEEE 754浮点数。

- half_float

半精度16位IEEE 754浮点数。

- scaled_float

缩放类型的的浮点数。需同时配置缩放因子(scaling_factor)一起使用。

对于整数类型（byte，short，integer和long）而言，我们应该选择这是足以使用的最小的类型。这将有助于索引和搜索更有效。

对于浮点类型（float、half_float和scaled_float），`-0.0`和`+0.0`是不同的值，使用`term`查询查找`-0.0`不会匹配`+0.0`，同样`range`查询中上边界是`-0.0`不会匹配`+0.0`，下边界是`+0.0`不会匹配`-0.0`。

其中`scaled_float`，比如价格只需要精确到分，`price`为`57.34`的字段缩放因子为`100`，存起来就是`5734`。优先考虑使用带缩放因子的`scaled_float`浮点类型。

### 3. 日期类型

类型为 `date` 。

JSON 本身是没有日期类型的，因此 Elasticsearch 中的日期可以是：

- 包含格式化日期的字符串。
- 一个13位long类型表示的毫秒时间戳（ milliseconds-since-the-epoch）。
- 一个integer类型表示的10位普通时间戳（seconds-since-the-epoch）。

在Elasticsearch内部，日期类型会被转换为UTC（如果指定了时区）并存储为long类型表示的毫秒时间戳。

日期类型可以使用使用`format`自定义，默认缺省值：`"strict_date_optional_time||epoch_millis"`：

​                        

```
"postdate": {
      "type": "date",
      "format": "strict_date_optional_time||epoch_millis"
    }
```

`format` 有很多内置类型，这里列举部分说明：

- strict_date_optional_time, date_optional_time

通用的ISO日期格式，其中日期部分是必需的，时间部分是可选的。例如 "2015-01-01"或"2015/01/01 12:10:30"。

- epoch_millis

13位毫秒时间戳

- epoch_second

10位普通时间戳

其中`strict_`开头的表示严格的日期格式，这意味着，年、月、日部分必须具有前置0。

> 更多日期格式详见：[https://www.elastic.co/guide/...](https://www.elastic.co/guide/en/elasticsearch/reference/6.2/mapping-date-format.html#mapping-date-format)

当然也可以自定义日期格式，例如：                    

```json
"postdate":{
      "type":"date",
      "format": "yyyy-MM-dd HH:mm:ss||yyyy-MM-dd"
    }
```

注意：如果新文档的字段的值与format里设置的类型不兼容，ES会返回失败。

### 4. 布尔类型

类型为 `boolean` 。

### 5. 二进制类型

类型为 `binary` 。

### 6. 范围类型

integer_range，float_range，long_range，double_range，date_range

## 2. 复杂类型

- 数组数据类型

在ElasticSearch中，没有专门的数组（Array）数据类型，但是，在默认情况下，任意一个字段都可以包含0或多个值，这意味着每个字段默认都是数组类型，只不过，数组类型的各个元素值的数据类型必须相同。在ElasticSearch中，数组是开箱即用的（out of box），不需要进行任何配置，就可以直接使用。，例如：

字符型数组: `[ "one", "two" ]`
整型数组：`[ 1, 2 ]`
数组型数组：`[ 1, [ 2, 3 ]]` 等价于`[ 1, 2, 3 ]`

- 对象数据类型

object 对于单个JSON对象。JSON天生具有层级关系，文档可以包含嵌套的对象。

- 嵌套数据类型

nested 对于JSON对象的数组

### Geo数据类型

- 地理点数据类型

geo_point 对于纬度/经度点

- Geo-Shape数据类型

geo_shape 对于像多边形这样的复杂形状

### 专用数据类型

- IP数据类型

ip 用于IPv4和IPv6地址

- 完成数据类型

completion 提供自动完成的建议

- 令牌计数数据类型

token_count 计算字符串中的标记数

- mapper-murmur3

murmur3 在索引时计算值的哈希值并将它们存储在索引中

- 过滤器类型

接受来自query-dsl的查询

- join 数据类型

为同一索引中的文档定义父/子关系

### 多字段

为不同目的以不同方式索引相同字段通常很有用。例如，string可以将字段映射为text用于全文搜索的keyword字段，以及用于排序或聚合的字段。或者，您可以使用standard分析仪， english分析仪和 french分析仪索引文本字段。



## 3. 元字段

### _source

这个字段用于存储原始的JSON文档内容，本身不会被索引，但是搜索的时候被返回。如果没有该字段，虽然还能正常搜索，但是返回的内容不知道对应的是什么。

### _type

ElasticSearch里面有 index 和 type 的概念：index称为索引,type为文档类型，一个index下面有多个type，每个type的字段可以不一样。这类似于关系型数据库的 database 和 table 的概念。

但是，ES中不同type下名称相同的filed最终在Lucene中的处理方式是一样的。所以后来ElasticSearch团队想去掉type，于是在6.x版本为了向下兼容，一个index只允许有一个type。

> 该字段再在6.0.0中弃用。在Elasticsearch 6.x 版本中创建的索引只能包含单个type。在5.x中创建的含有多个type的索引将继续像以前一样在Elasticsearch 6.x中运行。type 将在Elasticsearch 7.0.0中完全删除。

 7.0 之后版本的 ES 中`_type`只有一个值就是`_doc`

