# mysql explain 中的 type 字段 详解

## 1. 概述

官方文档

```text
https://dev.mysql.com/doc/refman/8.0/en/explain-output.html
```

MySQL 版本

```mysql
mysql> select version();
+-----------+
| version() |
+-----------+
| 8.0.20    |
+-----------+
1 row in set (0.00 sec)
```

随便放个结果，要讲的就是这里这个`type`

```mysql
mysql> explain select * from heros where id = 10000;
+----+-------------+-------+------------+-------+---------------+---------+---------+-------+------+----------+-------+
| id | select_type | table | partitions | type  | possible_keys | key     | key_len | ref   | rows | filtered | Extra |
+----+-------------+-------+------------+-------+---------------+---------+---------+-------+------+----------+-------+
|  1 | SIMPLE      | heros | NULL       | const | PRIMARY       | PRIMARY | 4       | const |    1 |   100.00 | NULL  |
+----+-------------+-------+------------+-------+---------------+---------+---------+-------+------+----------+-------+
1 row in set, 1 warning (0.00 sec)
```



`type`官方描述为`连接类型`，不过感觉`访问类型`比较合适。



## 2. 详解

### 1. system

> The table has only one row (= system table). This is a special case of the [`const`](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html#jointype_const) join type.

触发条件：表只有一行，这是一个`const` type 的特殊情况。



### 2. const

> The table has at most one matching row, which is read at the start of the query. Because there is only one row, values from the column in this row can be regarded as constants by the rest of the optimizer. [`const`](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html#jointype_const) tables are very fast because they are read only once.

触发条件：最多只有一行匹配。

> const is used when you compare all parts of a PRIMARY KEY or UNIQUE index to constant values. In the following queries, tbl_name can be used as a const table:

当你使用主键或者唯一索引的时候，就是`const`类型，比如下面这两种查询

```mysql
# 单一主键
SELECT * FROM tbl_name WHERE primary_key=1;
# 联合主键
SELECT * FROM tbl_name WHERE primary_key_part1=1 AND primary_key_part2=2;
```



### 3. eq_ref

> One row is read from this table for each combination of rows from the previous tables. Other than the system and const types, this is the best possible join type. It is used when all parts of an index are used by the join and the index is a PRIMARY KEY or UNIQUE NOT NULL index.

触发条件：只匹配到一行的时候。除了`system`和`const`之外，这是最好的连接类型了。当我们使用`主键索引`或者`唯一索引`的时候，且这个索引的所有组成部分都被用上，才能是该类型。

> [`eq_ref`](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html#jointype_eq_ref) can be used for indexed columns that are compared using the `=` operator. The comparison value can be a constant or an expression that uses columns from tables that are read before this table. In the following examples, MySQL can use an [`eq_ref`](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html#jointype_eq_ref) join to process *`ref_table`*:

在对已经建立索引列进行`=`操作的时候，`eq_ref`会被使用到。比较值可以使用一个常量也可以是一个表达式。这个表达示可以是其他的表的行。

```mysql
# 多表关联查询，单行匹配
SELECT * FROM ref_table,other_table
  WHERE ref_table.key_column=other_table.column;

# 多表关联查询，联合索引，多行匹配
SELECT * FROM ref_table,other_table
  WHERE ref_table.key_column_part1=other_table.column
  AND ref_table.key_column_part2=1;
```



### 4. ref

> All rows with matching index values are read from this table for each combination of rows from the previous tables. [`ref`](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html#jointype_ref) is used if the join uses only a leftmost prefix of the key or if the key is not a `PRIMARY KEY` or `UNIQUE` index (in other words, if the join cannot select a single row based on the key value). If the key that is used matches only a few rows, this is a good join type.

与 eq_ref 类似，但用到的不是`主键索引`或者`唯一索引`，只是普通索引。

> All rows with matching index values are read

因为只是普通索引，所以**列不是唯一的，只能把所有行都读出来进行匹配**。

> [`ref`](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html#jointype_ref) can be used for indexed columns that are compared using the `=` or `<=>` operator. In the following examples, MySQL can use a [`ref`](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html#jointype_ref) join to process *`ref_table`*:

在对已经建立索引列进行`=`或者`<=>`操作的时候，`ref`会被使用到。与`eq_ref`不同的是匹配到了多行

```mysql
# 根据索引（非主键，非唯一索引），匹配到多行
SELECT * FROM ref_table WHERE key_column=expr;

# 多表关联查询，单个索引，多行匹配
SELECT * FROM ref_table,other_table
  WHERE ref_table.key_column=other_table.column;

# 多表关联查询，联合索引，多行匹配
SELECT * FROM ref_table,other_table
  WHERE ref_table.key_column_part1=other_table.column
  AND ref_table.key_column_part2=1;
```



### 5. fulltext

> The join is performed using a `FULLTEXT` index.

全文检索



### 6. ref_or_null

> This join type is like [`ref`](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html#jointype_ref), but with the addition that MySQL does an extra search for rows that contain `NULL` values. This join type optimization is used most often in resolving subqueries.

这个查询类型和`ref`很像，但是 MySQL 会额外查询包含`NULL`值的行。这种类型常见于解析子查询的优化。

```mysql
SELECT * FROM ref_table
  WHERE key_column=expr OR key_column IS NULL;
```



### 7. index_merge

> This join type indicates that the Index Merge optimization is used. In this case, the `key` column in the output row contains a list of indexes used, and `key_len` contains a list of the longest key parts for the indexes used. For more information, see [Section 8.2.1.3, “Index Merge Optimization”](https://dev.mysql.com/doc/refman/8.0/en/index-merge-optimization.html).





### 8. unique_subquery

> This type replaces [`eq_ref`](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html#jointype_eq_ref) for some `IN` subqueries of the following form:

将某些关联查询替换为子查询。

```mysql
value IN (SELECT primary_key FROM single_table WHERE some_expr)
```

> [`unique_subquery`](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html#jointype_unique_subquery) is just an index lookup function that replaces the subquery completely for better efficiency.

`unique_subquery`只是一个索引查找函数，它可以完全替代子查询以提高效率



### 9. index_subquery

> This join type is similar to [`unique_subquery`](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html#jointype_unique_subquery). It replaces `IN` subqueries, but it works for nonunique indexes in subqueries of the following form:

和`unique_subquery`类似，但是它在子查询里使用的是非唯一索引。

```mysql
value IN (SELECT key_column FROM single_table WHERE some_expr)
```



### 10. range

> Only rows that are in a given range are retrieved, using an index to select the rows. The `key` column in the output row indicates which index is used. The `key_len` contains the longest key part that was used. The `ref` column is `NULL` for this type.

只有给定范围内的行才能被检索，使用索引来查询出多行。 输出行中的`key`决定了会使用哪个索引。 `key_len`列表示使用的最长的 key 部分。 这个类型的`ref`列是NULL。

> [`range`](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html#jointype_range) can be used when a key column is compared to a constant using any of the [`=`](https://dev.mysql.com/doc/refman/8.0/en/comparison-operators.html#operator_equal), [`<>`](https://dev.mysql.com/doc/refman/8.0/en/comparison-operators.html#operator_not-equal), [`>`](https://dev.mysql.com/doc/refman/8.0/en/comparison-operators.html#operator_greater-than), [`>=`](https://dev.mysql.com/doc/refman/8.0/en/comparison-operators.html#operator_greater-than-or-equal), [`<`](https://dev.mysql.com/doc/refman/8.0/en/comparison-operators.html#operator_less-than), [`<=`](https://dev.mysql.com/doc/refman/8.0/en/comparison-operators.html#operator_less-than-or-equal), [`IS NULL`](https://dev.mysql.com/doc/refman/8.0/en/comparison-operators.html#operator_is-null), [`<=>`](https://dev.mysql.com/doc/refman/8.0/en/comparison-operators.html#operator_equal-to), [`BETWEEN`](https://dev.mysql.com/doc/refman/8.0/en/comparison-operators.html#operator_between), [`LIKE`](https://dev.mysql.com/doc/refman/8.0/en/string-comparison-functions.html#operator_like), or [`IN()`](https://dev.mysql.com/doc/refman/8.0/en/comparison-operators.html#operator_in) operators:

```mysql
# 常量比较，可能会返回多行
SELECT * FROM tbl_name
  WHERE key_column = 10;

# 范围查找
SELECT * FROM tbl_name
  WHERE key_column BETWEEN 10 and 20;

# 范围查找
SELECT * FROM tbl_name
  WHERE key_column IN (10,20,30);

# 多条件加范围查找
SELECT * FROM tbl_name
  WHERE key_part1 = 10 AND key_part2 IN (10,20,30);
```



### 11. index

> The `index` join type is the same as [`ALL`](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html#jointype_all), except that the index tree is scanned. This occurs two ways:
>
> - If the index is a covering index for the queries and can be used to satisfy all data required from the table, only the index tree is scanned. In this case, the `Extra` column says `Using index`. An index-only scan usually is faster than [`ALL`](https://dev.mysql.com/doc/refman/8.0/en/explain-output.html#jointype_all) because the size of the index usually is smaller than the table data.
> - A full table scan is performed using reads from the index to look up data rows in index order. `Uses index` does not appear in the `Extra` column.
>
> MySQL can use this join type when the query uses only columns that are part of a single index.

全索引扫描和`all`类似，区别是`index`扫描的时候索引树。以下两种情况会触发：

1. 如果索引是查询的覆盖索引，就是说索引查询的数据可以满足查询中所需的所有数据，则只扫描索引树，不需要回表查询。 在这种情况下，explain 的 `Extra` 列的结果是 `Using index`。仅索引扫描通常比ALL快，因为索引的大小通常小于表数据。
2. 全表扫描会按索引的顺序来查找数据行。使用索引不会出现在`Extra`列中。



### 12.all

全表扫描，这就不用看了，优化潜力巨大。。



## 3. 小结

像

```mysql
select * from table where a = '1' and b > ‘2’  and c='3' 
```

这种类型的 sql 语句，在 a、b 走完索引后，c 肯定是无序了，所以 c 就没法走索引，因为此时数据库会觉得还不如全表扫描 c 字段来的快。





一般来说，需保证查询至少达到`range`级别，最好能达到`ref`。

explain（执行计划）包含的信息十分的丰富，着重关注以下几个字段信息。

①id，select子句或表执行顺序，id相同，从上到下执行，id不同，id值越大，执行优先级越高。

②type，type主要取值及其表示sql的好坏程度（由好到差排序）：system>const>eq_ref>ref>range>index>ALL。保证range，最好到ref。

③key，实际被使用的索引列。

④ref，关联的字段，常量等值查询，显示为const，如果为连接查询，显示关联的字段。

⑤Extra，额外信息，使用优先级Using index>Using filesort（九死一生）>Using temporary（十死无生）。