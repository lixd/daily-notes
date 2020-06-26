# JOIN

## 1. 概述

SQL有两个主要的标准，分别是SQL92和SQL99。92和99代表了标准提出的时间，SQL92就是92年提出的标准规范。当然除了SQL92和SQL99以外，还存在SQL-86、SQL-89、SQL:2003、SQL:2008、SQL:2011和SQL:2016等其他的标准。

实际上最重要的SQL标准就是SQL92和SQL99。一般来说SQL92的形式更简单，但是写的SQL语句会比较长，可读性较差。而SQL99相比于SQL92来说，语法更加复杂，但`可读性`更强。

> 推荐使用 SQL99 标准



## 2. JOIN

SQL92 和 SQL99 在 内连接 写法上的一些区别。

### 1. CROSS JOIN

```mysql
# SQL92
SELECT * FROM player, team
# SQL99
SELECT * FROM player CROSS JOIN team
```

多表连接

```mysql
# SQL92
SELECT * FROM t1,t2,t3
# SQL99
SELECT * FROM t1 CROSS JOIN t2 CROSS JOIN t3
```



### 2. NATURAL JOIN

`NATURAL JOIN`译作`自然连接`  SQL99 中新增的，和 SQL92 中的等值连接差不多。

```mysql
# SQL92
player_id, a.team_id, player_name, height, team_name FROM player as a, team as b WHERE a.team_id = b.team_id
# SQL99
SELECT player_id, team_id, player_name, height, team_name FROM player NATURAL JOIN team 
```

实际上，在 SQL99 中用 NATURAL JOIN 替代了 `WHERE player.team_id = team.team_id`。



### 3. ON 条件

同样是 SQL99 中新增的。

SQL92 中多表连接直接使用`,`逗号进行连接，条件也直接使用`WHERE`。

```mysql
SELECT * FROM A,B WHERE xxx
```

```mysql
SELECT p.player_name, p.height, h.height_level
FROM player AS p, height_grades AS h
WHERE p.height BETWEEN h.height_lowest AND h.height_highest
```

SQL99 中则使用 JOIN 表示连接, ON 表示条件。

```mysql
SELECT * FROM A JOIN B ON xxx
```

```mysql
SELECT p.player_name, p.height, h.height_level
FROM player as p JOIN height_grades as h
ON height BETWEEN h.height_lowest AND h.height_highest
```



### 4. USING连接

> USING 就是等值连接的一种简化形式,SQL99 中新增的。

当我们进行连接的时候，可以用 USING 指定数据表里的同名字段进行等值连接。

```mysql
SELECT player_id, team_id, player_name, height, team_name FROM player JOIN team USING(team_id)
```

同时使用`JOIN USING`可以简化`JOIN ON`的等值连接，它与下面的 SQL 查询结果是相同的:

```mysql
SELECT player_id, player.team_id, player_name, height, team_name FROM player JOIN team ON player.team_id = team.team_id
```




### 5. SELF JOIN

> 自连接的原理在 SQL92 和 SQL99 中都是一样的，只是表述方式不同。

```mysql
# SQL92 
SELECT b.player_name, b.height FROM player as a , player as b WHERE a.player_name = '布雷克-格里芬' and a.height < b.height
# SQL99
SELECT b.player_name, b.height FROM player as a JOIN player as b ON a.player_name = '布雷克-格里芬' and a.height < b.height
```



## 3. 小结

在 SQL92 中进行查询时，会把所有需要连接的表都放到 FROM 之后，然后在 WHERE 中写明连接的条件。比如：

```mysql
SELECT ...
FROM table1 t1, table2 t2, ...
WHERE ...
```



而 SQL99 在这方面更灵活，它不需要一次性把所有需要连接的表都放到 FROM 之后，而是采用 JOIN 的方式，每次连接一张表，可以多次使用 JOIN 进行连接。

另外，我建议多表连接使用 SQL99 标准，因为层次性更强，可读性更强，比如：

```mysql
SELECT ...
FROM table1
    JOIN table2 ON ...
        JOIN table3 ON ...
```

SQL99 采用的这种嵌套结构非常清爽，即使再多的表进行连接也都清晰可见。如果你采用 SQL92，可读性就会大打折扣。

最后一点就是，SQL99 在 SQL92 的基础上提供了一些特殊语法，比如`NATURAL JOIN`和`JOIN USING`。它们在实际中是比较常用的，省略了 ON 后面的等值条件判断，让 SQL 语句更加简洁。






## 4. 参考

`https://blog.csdn.net/Saintyyu/article/details/100170320`