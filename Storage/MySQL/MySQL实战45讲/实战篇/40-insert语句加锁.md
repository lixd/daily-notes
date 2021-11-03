# insert语句的锁为什么这么多？

## insert … select 语句

 表 t 和 t2 的表结构、初始化数据语句如下，今天的例子我们还是针对这两个表展开。

```mysql
CREATE TABLE `t` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `c` int(11) DEFAULT NULL,
  `d` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `c` (`c`)
) ENGINE=InnoDB;

insert into t values(null, 1,1);
insert into t values(null, 2,2);
insert into t values(null, 3,3);
insert into t values(null, 4,4);

create table t2 like t
```

现在，我们一起来看看为什么在可重复读隔离级别下，binlog_format=statement 时执行：

```mysql
insert into t2(c,d) select c,d from t;
```

其实，这个问题我们需要考虑的还是**日志和数据的一致性**。我们看下这个执行序列：

| SessionA                       | SessionB                                |
| ------------------------------ | --------------------------------------- |
| insert into t values(-1,-1,-1) | insert into t2(c,d) select c,d, from t; |

如果 session B 先执行，由于这个语句对表 t 主键索引加了 (-∞,1]这个 next-key lock，会在语句执行完成后，才允许 session A 的 insert 语句执行。

但如果没有锁的话，就可能出现 session B 的 insert 语句先执行，但是后写入 binlog 的情况。于是，在 binlog_format=statement 的情况下，binlog 里面就记录了这样的语句序列：

```mysql
insert into t values(-1,-1,-1);
insert into t2(c,d) select c,d from t;
```

这个语句到了备库执行，就会把 id=-1 这一行也写到表 t2 中，出现主备不一致。



## insert 循环写入

如果现在有这么一个需求：要往表 t2 中插入一行数据，这一行的 c 值是表 t 中 c 值的最大值加 1。

此时，我们可以这么写这条 SQL 语句 ：

```mysql
insert into t2(c,d)  (select c+1, d from t force index(c) order by c desc limit 1);
```

这个语句的加锁范围，就是表 t 索引 c 上的 (3,4]和 (4,supremum]这两个 next-key lock，以及主键索引上 id=4 这一行。

那么，如果我们是要把这样的一行数据插入到表 t 中的话：

```mysql
insert into t(c,d)  (select c+1, d from t force index(c) order by c desc limit 1);
```

该语句执行流程如下：

* 1）创建临时表，表里有两个字段 c 和 d。
* 2）按照索引 c 扫描表 t，依次取 c=4、3、2、1，然后回表，读到 c 和 d 的值写入临时表。这时，Rows_examined=4。
* 3）由于语义里面有 limit 1，所以只取了临时表的第一行，再插入到表 t 中。这时，Rows_examined 的值加 1，变成了 5。

也就是说，这个语句会导致在表 t 上做全表扫描，并且会给索引 c 上的所有间隙都加上共享的 next-key lock。

> 至于这个语句的执行为什么需要**临时表**，原因是这类一边遍历数据，一边更新数据的情况，如果读出来的数据直接写回原表，就可能在遍历过程中，读到刚刚插入的记录，新插入的记录如果参与计算逻辑，就跟语义不符。

于实现上这个语句没有在子查询中就直接使用 limit 1，从而导致了这个语句的执行需要遍历整个表 t。它的优化方法也比较简单，就是用前面介绍的方法：

* 1）先 insert into 到临时表 temp_t，这样就只需要扫描一行；
* 2）然后再从表 temp_t 里面取出这行数据插入表 t1。

```mysql
create temporary table temp_t(c int,d int) engine=memory;
insert into temp_t  (select c+1, d from t force index(c) order by c desc limit 1);
insert into t select * from temp_t;
drop table temp_t;
```



## insert 唯一键冲突

对于有唯一键的表，插入数据时出现唯一键冲突也是常见的情况了。

| SessionA                                                     | SessionB                                    |
| ------------------------------------------------------------ | ------------------------------------------- |
| insert into t values(10,10,10);                              |                                             |
| begin;<br/>insert into t values(11,10,10);<br/>(Duplicate entry '10' for key 'c') |                                             |
|                                                              | insert into t values(12,9,9);<br/>(blocked) |

这个例子也是在可重复读（repeatable read）隔离级别下执行的。可以看到，session B 要执行的 insert 语句进入了锁等待状态。

也就是说，session A 执行的 insert 语句，发生唯一键冲突的时候，并不只是简单地报错返回，还**在冲突的索引上加了锁**。我们前面说过，一个 next-key lock 就是由它右边界的值定义的。这时候，session A 持有索引 c 上的 (5,10]共享 next-key lock（读锁）。

> 至于为什么要加这个读锁，其实我也没有找到合理的解释。从作用上来看，这样做可以避免这一行被别的事务删掉。



### 死锁

|      | SessionA                                   | SessionB                        | SessionC                        |
| ---- | ------------------------------------------ | ------------------------------- | ------------------------------- |
| T1   | begin;<br/>insert into t values(null,5,5); |                                 |                                 |
| T2   |                                            | insert into t values(null,5,5); | insert into t values(null,5,5); |
| T3   | rollback;                                  |                                 | (Deadlock found)                |

在 session A 执行 rollback 语句回滚的时候，session C 几乎同时发现死锁并返回。

* 在 T1 时刻，启动 session A，并执行 insert 语句，此时在索引 c 的 c=5 上加了记录锁。注意，这个索引是唯一索引，因此退化为记录锁。
* 在 T2 时刻，session B 要执行相同的 insert 语句，发现了唯一键冲突，加上读锁；同样地，session C 也在索引 c 上，c=5 这一个记录上，加了读锁。
* T3 时刻，session A 回滚。这时候，session B 和 session C 都试图继续执行插入操作，都要加上写锁。两个 session 都要等待对方的行锁，所以就出现了死锁。



### insert into … on duplicate key update

上面这个例子是主键冲突后直接报错，如果是改写成

```mysql
insert into t values(11,10,10) on duplicate key update d=100; 
```

的话，就会给索引 c 上 (5,10] 加一个排他的 next-key lock（写锁）。

**insert into … on duplicate key update 这个语义的逻辑是，插入一行数据，如果碰到唯一键约束，就执行后面的更新语句。**

> 如果有多个列违反了唯一性约束，就会按照索引的顺序，修改跟第一个索引冲突的行



## 小结

insert … select 是很常见的在两个表之间拷贝数据的方法。你需要注意，在可重复读隔离级别下，这个语句会给 select 的表里扫描到的记录和间隙加读锁。

而如果 insert 和 select 的对象是同一个表，则有可能会造成循环写入。这种情况下，我们需要引入用户临时表来做优化。

insert 语句如果出现唯一键冲突，会在冲突的唯一值上加共享的 next-key lock(S 锁)。因此，碰到由于唯一键约束导致报错后，要尽快提交或回滚事务，避免加锁时间过长。