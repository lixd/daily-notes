# MySQL并发事务限制

## undolog 限制

同时还有很重要的一点就是，**一个 undolog segment 只能同时被一个事务使用**。也就是说 InnoDB 存储引擎的并发事务数还会受到 undolog segment 数量限制。

那么 undolog segment 数量到底有多少呢？

公式如下：

```mysql
(innodb_page_size / 16) * innodb_rollback_segments * number of undo tablespaces 
```



- 1）**undo tablespace**

undo tablespace 默认是 2（MySQL8.0）,可以通过如下语法进行增删

```mysql
# 增加 名字比较是 xxx.ibu
CREATE UNDO TABLESPACE tablespace_name ADD DATAFILE 'file_name.ibu';
# 删除（需要先设置为不活跃状态）
ALTER UNDO TABLESPACE tablespace_name SET INACTIVE;
DROP UNDO TABLESPACE tablespace_name;
```



- 2）**rollback segment**

rollback segment 由参数`innodb_rollback_segments` 设置，每个 undo tablespace 最大支持 128 个 rollback segment。

- 3）**undolog segment**

undolog segment 个数则由 InnoDB PageSize 决定，具体为 `pagesize / 16`,所以默认 pagesize 16K 能存储 1024 个undolog segment 。

> 需要注意的是，执行 INSERT 操作会占用一个 undolog segment，如果同时还执行 UPDATE（UPDATE、DELETE）则还会占用一个。



## 2. 线程数限制

innodb_thread_concurrency 限制最大线程数，一旦并发线程数达到这个值，InnoDB 在接收到新请求的时候，就会进入等待状态，直到有线程退出。

```mysql
set global innodb_thread_concurrency=3;
```

这样最多同时处理3个请求。