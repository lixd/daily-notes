# MySQL 选错索引

选择索引是优化器的工作。

而优化器选择索引的目的，是找到一个最优的执行方案，并用**最小的代价**去执行语句。

在数据库里面，**扫描行数是影响执行代价的因素之一**。扫描的行数越少，意味着访问磁盘数据的次数越少，消耗的 CPU 资源越少。

> 当然，扫描行数并不是唯一的判断标准，优化器还会结合是否使用临时表、是否排序等因素进行综合判断。



**扫描行数是怎么判断的？**

MySQL 在真正开始执行语句之前，并不能精确地知道满足这个条件的记录有多少条，而**只能根据统计信息来估算记录数**。这个统计信息就是索引的`区分度`。显然，一个索引上不同的值越多，这个索引的区分度就越好。

而一个索引上不同的值的个数，我们称之为`基数`（cardinality）。也就是说，这个**基数越大，索引的区分度越好**。

**采样统计**

采样统计的时候，InnoDB 默认会在索引树上选择 N 个页，统计这些索引树上的不同值，得到一个平均值，然后乘以这个索引的页面数，就得到了这个索引的基数。

而数据表是会持续更新的，索引统计信息也不会固定不变。所以，当变更的数据行数超过 1/M 的时候，会自动触发重新做一次索引统计。

在 MySQL 中，有两种存储索引统计的方式，可以通过设置参数 `innodb_stats_persistent` 的值来选择：

* 设置为 on 的时候，表示统计信息会持久化存储。这时，默认的 N 是 20，M 是 10。
* 设置为 off 的时候，表示统计信息只存储在内存中。这时，默认的 N 是 8，M 是 16。由于是采样统计，所以不管 N 是 20 还是 8，这个基数都是很容易不准的。

