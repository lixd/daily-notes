# 如何使用性能分析工具定位SQL执行慢的原因？

## 数据库服务器的优化步骤

一般分为 观察，行动两步

![](images/sql-optimize.png)



如果**存在周期性波动**，有可能是周期性节点的原因，比如双十一、促销活动等。这样的话，我们可以通过A1这一步骤解决，也就是**加缓存**，或者更改缓存失效策略。



## 使用慢查询定位执行慢的SQL

好慢询可以帮我们找到执行慢的SQL，在使用前，我们需要先看下慢查询是否已经开启，使用下面这条命令即可：

```mysql
mysql > show variables like '%slow_query_log';
```

我们能看到`slow_query_log=OFF`，也就是说慢查询日志此时是关上的。我们可以把慢查询日志打开，注意设置变量值的时候需要使用global，否则会报错：

```mysql
mysql > set global slow_query_log='ON';
```

接下来我们来看下慢查询的时间阈值设置，使用如下命令：

```mysql
mysql > show variables like '%long_query_time%';
```

这里如果我们想把时间缩短，比如设置为3秒（默认是 10 秒），可以这样设置：

```mysql
mysql > set global long_query_time = 3;
```

> mysql 8.0 测试好像修改不了 todo

我们可以使用MySQL自带的mysqldumpslow工具统计慢查询日志（这个工具是个Perl脚本，你需要先安装好Perl）。

mysqldumpslow命令的具体参数如下：

- -s：采用order排序的方式，排序方式可以有以下几种。分别是c（访问次数）、t（查询时间）、l（锁定时间）、r（返回记录）、ac（平均查询次数）、al（平均锁定时间）、ar（平均返回记录数）和at（平均查询时间）。其中at为默认排序方式。
- -t：返回前N条数据 。
- -g：后面可以是正则表达式，对大小写不敏感。

比如我们想要按照查询时间排序，查看前两条SQL语句，这样写即可：

```mysql
perl mysqldumpslow.pl -s t -t 2 "C:\ProgramData\MySQL\MySQL Server 8.0\Data\DESKTOP-4BK02RP-slow.log"
```

## 如何使用EXPLAIN查看执行计划

定位了查询慢的SQL之后，我们就可以使用EXPLAIN工具做针对性的分析，比如我们想要了解product_comment和user表进行联查的时候所采用的的执行计划，可以使用下面这条语句：

```mysql
EXPLAIN SELECT comment_id, product_id, comment_text, product_comment.user_id, user_name FROM product_comment JOIN user on product_comment.user_id = user.user_id 
```

EXPLAIN可以帮助我们了解数据表的读取顺序、SELECT子句的类型、数据表的访问类型、可使用的索引、实际使用的索引、使用的索引长度、上一个表的连接匹配条件、被优化器查询的行的数量以及额外的信息（比如是否使用了外部排序，是否使用了临时表等）等。

数据表的访问类型所对应的type列是我们比较关注的信息。type可能有以下几种情况：

| type        | 说明                                                         |
| ----------- | ------------------------------------------------------------ |
| all         | 全表扫描                                                     |
| index       | 全索扫描                                                     |
| range       | 对索引列进行范围查询                                         |
| index_merge | 合并索引，使用多个单列索引搜索                               |
| ref         | 根据索引查找一个或多个值                                     |
| eq_ref      | 搜索是使用 primary key 或 unique 类型,常用于多表联查         |
| const       | 常量，表最多有一个匹配行，因为只有一行，在这行的列值可被优化器认为是常数 |
| system      | 系统，表只有一行（一般用于 MyISAM 或 Memory 表）。是 const 连接类型的特例。 |

在这些情况里，all是最坏的情况，因为采用了全表扫描的方式。index和all差不多，只不过index对索引表进行全扫描，这样做的好处是不再需要对数据进行排序，但是开销依然很大。如果我们在Extral列中看到Using index，说明采用了索引覆盖，也就是索引可以覆盖所需的SELECT字段，就不需要进行回表，这样就减少了数据查找的开销。

## 用SHOW PROFILE查看SQL的具体执行成本

SHOW PROFILE相比EXPLAIN能看到更进一步的执行解析，包括SQL都做了什么、所花费的时间等。默认情况下，profiling是关闭的，我们可以在会话级别开启这个功能。

```mysql
mysql > show variables like 'profiling';
```

通过设置`profiling='ON'`来开启show profile：

```mysql
mysql > set profiling = 'ON';
```

我们可以看下当前会话都有哪些profiles，使用下面这条命令：

```mysq
mysql > show profiles;
```

查看指定的Query ID的开销，比如`show profile for query 2`查询结果是一样的。在SHOW PROFILE中我们可以查看不同部分的开销，比如cpu、block.io等：

> 不过SHOW PROFILE命令将被弃用，我们可以从information_schema中的profiling数据表进行查看。