# MySQL JOIN

## 1. LEFT JOIN

At the parser stage, queries with right outer join operations are converted to equivalent queries containing only left join operations. In the general case, the conversion is performed such that this right join:

```mysql
(T1, ...) RIGHT JOIN (T2, ...) ON P(T1, ..., T2, ...)
```

Becomes this equivalent left join:

```mysql
(T2, ...) LEFT JOIN (T1, ...) ON P(T1, ..., T2, ...)
```

**在 MySQL 的执行引擎 SQL解析阶段，都会将 right join 转换为 left join**

**解释**

因为Mysql只实现了nested-loop算法，该算法的核心就是外表驱动内表

```mysql
for each row in t1 matching range {
  for each row in t2 matching reference key {
    for each row in t3 {
      if row satisfies join conditions, send to client
    }
  }
}
```

由此可知，它必须要保证外表先被访问。

## 2. INNER JOIN

All inner join expressions of the form T1 INNER JOIN T2 ON P(T1,T2) are replaced by the list T1,T2,  and P(T1,T2) being joined as a conjunct to the WHERE condition (or to the join condition of the embedding join, if there is any)

INNER JOIN

```mysql
FROM (T1, ...) INNER JOIN (T2, ...) ON P(T1, ..., T2, ...)
```

转换为如下：

```mysql
FROM (T1, ..., T2, ...) WHERE P(T1, ..., T2, ...)
```

**相当于将 INNER JOIN 转换成了  CROSS JOIN**

由于在 MySQL 中`JOIN`、`CROSS JOIN`、`INNER JOIN`是等效的,所以这样转换是没有问题的。

> In MySQL, `JOIN`, `CROSS JOIN`, and `INNER JOIN` are syntactic equivalents (they can replace each other). In standard SQL, they are not equivalent. `INNER JOIN` is used with an `ON` clause, `CROSS JOIN` is used otherwise.
>
> 官网文档: https://dev.mysql.com/doc/refman/8.0/en/join.html

## 3. LEFT JOIN to INNER JOIN

Mysql引擎在一些特殊情况下，会将left join转换为inner join。

```mysql
SELECT * 
FROM T1 
	LEFT JOIN T2 ON P1(T1,T2)
WHERE P(T1,T2) AND R(T2)
```

这里涉及到两个问题：1.为什么要做这样的转换？2.什么条件下才可以做转换？

首先，做转换的目的是为了提高查询效率。在上面的示例中，where条件中的R(T2)原本可以极大地过滤不满足条件的记录，但由于nested loop算法的限制，只能先查T1，再用T1驱动T2。当然，不是所有的left join都能转换为inner join，这就涉及到第2个问题。如果你深知left join和inner join的区别就很好理解第二个问题的答案（不知道两者区别的请自行百度）：

left join是以T1表为基础，让T2表来匹配，对于没有被匹配的T1的记录，其T2表中相应字段的值全为null。也就是说，left join连表的结果集包含了T1中的所有行记录。与之不同的是，inner join只返回T1表和T2表能匹配上的记录。也就是说，相比left join，inner join少返回了没有被T2匹配上的T1中的记录。那么，如果where中的查询条件能保证返回的结果中一定不包含不能被T2匹配的T1中的记录，那就可以保证left join的查询结果和inner join的查询结果是一样的，在这种情况下，就可以将left join转换为inner join。

我们再回过头来看官网中的例子：

```mysql
T2.B IS NOT NULL
T2.B > 3
T2.C <= T1.C
T2.B < 2 OR T2.C > 1
```



如果上面的R(T2)是上面的任意一条，就能保证inner join的结果集中一定没有不能被T2匹配的T1中的记录。以T2.B > 3为例，对于不能被T2匹配的T1中的结果集，其T2中的所有字段都是null，显然不满足T2.B > 3。

相反，以下R(T2)显然不能满足条件，原因请自行分析：

```mysql
T2.B IS NULL
T1.B < 3 OR T2.B IS NOT NULL
T1.B < 3 OR T2.B > 3
```



## 参考

`https://blog.csdn.net/Saintyyu/article/details/100170320`