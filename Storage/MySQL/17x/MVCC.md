# MySQL MVCC

## 1. 概念

版本链

数据格式

```shell
data1|data2|...datan|TRX_ID|ROLL_PTR
```

* TRX_ID：事务ID
* ROLL_PTR：回滚指针，指向前一个版本



查询时会有一个 read_view，由查询时所有未提交事务的id数组（其中最小的记作min_id）和当前已创建的最大事务id+1（记作max_id）组成。

版本链比较规则：

* 1）如果（trx_id<min_id）,表示这个版本事务已提交，数据可见
* 2）如果（min_id<=trx_id<=max_id）
  * 情况1：如果trx_id不在id数组中，说明是由还未提交的事务生成的，数据不可见（当前了，对同一个session是可见的）
  * 情况2：若 trx_id 不在数组中，表示这个版本是有已经提交的事务生成的，数据可见。
* 3）如果（max_id<trx_id）,表示这个版本是由将来（这里的将来是相对于当前事务来说的）启动的事务生成的，数据肯定可见。

**所以查询时就根据这个规则，顺着版本链，把不可见的过滤掉，出现的第一个可见数据就是结果。**

**删除比较特殊，可以认为是update的特殊情况**，会把当前版本链上的最新数据复制一份，然后trx_id、roll_pointer还是一样的更新，同时会在该条记录的头信息（record_header）里的删除标志位（delete_flag）置为 true，用于表示当前记录已经被删除了，在查询时如果查询到该条记录，发现delete_flag为true，意味着数据已经被删除，则不返回数据。



read_view是针对全表的，session级别的。

> 例如在查询A表时会生成一个read_view，然后在同一个session中查询B表会使用前面生成的readview，不会针对B表生成新的。