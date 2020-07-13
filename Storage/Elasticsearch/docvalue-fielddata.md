# DocValue 和 Fielddata

## 1. 搜索与聚合

elasticsearch 为了搜索，会创建倒排索引。

但是聚合操作的时候，倒排索引不适合。

> 搜索是term到document的映射，聚合或者排序是从document到term的映射。所以要聚合，我们就得找到这个所有document的所有的term。

而正排索引就是document到term的映射，所以适合用于聚合。

## 2. Fielddata

ES 为了满足聚合，引入fielddata的数据结构，其实根据倒排索引反向出来的一个正排索引，即document到term的映射。

只要我们针对需要分词的字段设置了fielddata，就可以使用该字段进行聚合，排序等。我们设置为true之后，在索引期间，就会以列式存储在内存中。为什么存在于内存呢，因为按照term聚合，需要执行更加复杂的算法和操作，如果基于磁盘或者 OS 缓存，性能会比较差。


## 3. DocValue

我们知道fielddata堆内存要求很高，如果数据量太大，对于JVM来及回收来说存在一定的挑战。所以doc_value的出现我们可以使用磁盘存储，他同样是和fielddata一样的数据结构，在倒排索引基础上反向出来的正排索引，并且是预先构建，即在建倒排索引的时候，就会创建doc values。,这会消耗额外的存储空间，但是对于JVM的内存需求就会减少。总体来看，DocValues只是比fielddata慢一点，大概10-25%，则带来了更多的稳定性。

写入磁盘文件中，OS Cache先进行缓存，以提升访问doc value正排索引的性能，如果OS Cache内存大小不足够放得下整个正排索引，doc value，就会将doc value的数据写入磁盘文件中。


> 它是对不分词的字段，默认建立doc_values,即字段类型为keyword，他不会创建分词，就会默认建立doc_value，如果我们不想该字段参与聚合排序，我们可以设置doc_values=false，避免不必要的磁盘空间浪费。但是这个只能在索引映射的时候做，即索引映射建好之后不能修改。



## 4. 比较

### 1. 相同点

都要创建正排索引，数据结构类似于列式存储

都是为了可以聚合，排序之类的操作

### 2. 不同点

**存储索引数据的方式不一样**

fielddata: 内存存储；doc_values: OS Cache+磁盘存储

**对应的字段类型不一样**

fielddata: 对应的字段类型是text; doc_values：对应的字段类型是keyword

**针对的类型，也不一样**

field_data主要针对的是分词字段；doc_values针对大是不分词字段

**是否开启**

fielddata默认不开启；doc_values默认是开启
