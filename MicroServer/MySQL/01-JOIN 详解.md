# SQL JOIN 详解

## 1. 概述

### 1. SQL 标准

根据 SQL 标准不同，JOIN 也有一定的差异。

SQL92 标准支持 `笛卡尔积`、`等值连接`、`非等值连接`、`外连接`、`自连接`。

SQL99 标准支持 `交叉连接`、`自然连接`、`ON 连接`、 `USING 连接`、`外连接`、`自连接`。



### 2. 理解

> 以下是自己的理解，可能存在错误或不准确的地方。如果发现问题希望一定指正，3q。

**笛卡尔积**

首先 笛卡尔积 就是把 两张表每一行 一一对应起来形成新表。

> 假设 A 表有 M 行 B 表有 N 行，那么 JOIN 后形成的 笛卡尔积 就有 M*N 条记录。

其余的 `内连接`、`外连接`都是在 这个笛卡尔积的基础上进行过滤。

```mysql
SELECT *
FROM A 
	XXX JOIN B ON yyy
WHERE zzz
```

`XXX JOIN`可以替换为`INNER JOIN`、`LEFT JOIN`、`RIGHT JOIN`、`FULL JOIN`等等。

**隐式条件**

在选择使用什么 JOIN 的时候就包含了一个 `隐式条件`。

比如 INNER JOIN 只会返回两表中能关联的数据。

LEFT JOIN 就会返回左表全部数据，如果右表有关联数据就返回关联数据，没有就返回 NULL。

其他同理。

**显式条件**

同时`ON` 后面还可以跟条件用于过滤，这个算是显式条件。



### 3. 例子

这里是用的 MySQL 8.0 

```mysql
SELECT VERSION()
8.0.20
```

准备数据，两张简单的表。

```mysql
CREATE TABLE a(
id int PRIMARY key AUTO_INCREMENT,
value varchar(24) NOT NULL
) ENGINE = INNODB;

CREATE TABLE b(
id int PRIMARY key AUTO_INCREMENT,
value varchar(24) NOT NULL
) ENGINE = INNODB;

INSERT INTO a VALUES(1,'a'),(2,'b'),(3,'c')
INSERT INTO b VALUES(1,'c'),(2,'d'),(3,'e')

mysql> select * from a;
+----+-------+
| id | value |
+----+-------+
|  1 | a     |
|  2 | b     |
|  3 | c     |
+----+-------+
3 rows in set (0.00 sec)

mysql> select * from b;
+----+-------+
| id | value |
+----+-------+
|  1 | c     |
|  2 | d     |
|  3 | e     |
+----+-------+
3 rows in set (0.00 sec)
```





下列语句 结果是一样的。

```mysql
SELECT * FROM a INNER JOIN b;
SELECT * FROM a CROSS JOIN b;
SELECT * FROM a JOIN b;

SELECT * FROM a LEFT JOIN b ON 1=1;
SELECT * FROM a RIGHT JOIN b ON 1=1;
```

结果如下

```mysql
mysql> SELECT * FROM a RIGHT JOIN b ON 1=1;
+------+-------+----+-------+
| id   | value | id | value |
+------+-------+----+-------+
|    3 | c     |  1 | c     |
|    2 | b     |  1 | c     |
|    1 | a     |  1 | c     |
|    3 | c     |  2 | d     |
|    2 | b     |  2 | d     |
|    1 | a     |  2 | d     |
|    3 | c     |  3 | e     |
|    2 | b     |  3 | e     |
|    1 | a     |  3 | e     |
+------+-------+----+-------+
9 rows in set (0.00 sec)
```

说明各种 JOIN 都是在 笛卡尔积 基础上进行过滤的。

由于没有显式条件 所以 隐式条件的作用也体现不出现

增加一个条件

```mysql
SELECT * FROM a INNER JOIN b ON a.value=b.value;
SELECT * FROM a LEFT JOIN b ON a.value=b.value;
SELECT * FROM a RIGHT JOIN b ON a.value=b.value;
```

结果如下

```mysql
mysql> SELECT * FROM a INNER JOIN b ON a.value=b.value;
+----+-------+----+-------+
| id | value | id | value |
+----+-------+----+-------+
|  3 | c     |  1 | c     |
+----+-------+----+-------+
1 row in set (0.00 sec)
mysql> SELECT * FROM a LEFT JOIN b ON a.value=b.value;
+----+-------+------+-------+
| id | value | id   | value |
+----+-------+------+-------+
|  1 | a     | NULL | NULL  |
|  2 | b     | NULL | NULL  |
|  3 | c     |    1 | c     |
+----+-------+------+-------+
3 rows in set (0.00 sec)

mysql> SELECT * FROM a RIGHT JOIN b ON a.value=b.value;
+------+-------+----+-------+
| id   | value | id | value |
+------+-------+----+-------+
|    3 | c     |  1 | c     |
| NULL | NULL  |  2 | d     |
| NULL | NULL  |  3 | e     |
+------+-------+----+-------+
3 rows in set (0.00 sec)
```





## 2. INNER JOIN

`INNER JOIN` 一般译作`内连接`。内连接查询能将左表（表 A）和右表（表 B）中能关联起来的数据连接后返回。

![inner-join](img/inner-join.png)

![inner-join](img/inner-join-2.webp)

基本语法如下:

```mysql
SELECT * FROM A INNER JOIN B ON xxx
```



### 1. EQUI JOIN

`EQUI JOIN` 通常译作`等值连接`。

在连接条件中使用**等于号`=`**运算符比较被连接列的列值，其查询结果中列出被连接表中的所有列，**包括其中的重复列**。

```mysql
# 隐式 INNER JOIN (使用逗号分隔多个表)
SELECT p.player_id, p.player_name,p.team_id, t.team_name FROM player AS p, team AS t WHERE p.team_id = t.team_id

# 显式 INNER JOIN
SELECT p.player_id, p.player_name,p.team_id,t.team_name FROM player AS p INNER JOIN team AS t ON p.team_id = t.team_id
```

### 2. USING连接

> USING 就是等值连接的一种简化形式,SQL99 中新增的。

当我们进行连接的时候，可以用USING指定数据表里的同名字段进行等值连接。

```mysql
SELECT player_id, team_id, player_name, height, team_name FROM player JOIN team USING(team_id)
```

同时使用 JOIN USING 可以简化 JOIN ON 的等值连接，它与下面的SQL查询结果是相同的:

```mysql
SELECT player_id, player.team_id, player_name, height, team_name FROM player JOIN team ON player.team_id = team.team_id
```

### 3. NATURAL JOIN

`NATURAL JOIN` 通常译作`自然连接`，也是`EQUI JOIN`的一种，其结构使得具有相同名称的关联表的列将只出现一次。

在连接条件中使用**等于号`=`**运算符比较被连接列的列值，但它使用选择列表指出查询结果集合中所包括的列，**并删除连接表中的重复列**。

> 所谓自然连接就是在等值连接的情况下，当连接属性X与Y具有相同属性组时，把在连接结果中重复的属性列去掉。
>
> 自然连接是在广义笛卡尔积R×S中选出同名属性上符合相等条件元组，再进行投影，去掉重复的同名属性，组成新的关系。

```mysql
# SQL92 EQUI JOIN
player_id, a.team_id, player_name, height, team_name FROM player as a, team as b WHERE a.team_id = b.team_id

# SQL99 NATURAL JOIN
SELECT player_id, team_id, player_name, height, team_name FROM player NATURAL JOIN team 
```

实际上，在SQL99中用NATURAL JOIN替代了 `WHERE player.team_id = team.team_id`。



### 4. NON EQUI JOIN

`NON EQUI JOIN` 通常译作`非等值连接`

在连接条件使用**除等于运算符以外的比较运算符**比较被连接的列的列值。这些运算符包括>、>=、<=、<、!>、!<和<>。

```mysql
SELECT p.player_name, p.height, h.height_level
FROM player AS p INNER JOIN height_grades AS h
on p.height BETWEEN h.height_lowest AND h.height_highest
```



### 5. CROSS JOIN

返回左表与右表之间符合条件的记录的迪卡尔集。

![](img/cross-join-2.png)

基本语法如下:

```mysql
SELECT * FROM player CROSS JOIN team
```

> 需要注意的是 CROSS JOIN 后没有 ON 条件。

**实际上 CROSS JOIN 只是 无条件 INNER JOIN 的 专用关键字而已**



### 6. SELF JOIN

就是和自己进行连接查询，给一张表取两个不同的别名，然后附上连接条件。

比如:

我们想要查看比布雷克·格里芬高的球员都有谁，以及他们的对应身高。

正常情况下需要分两步完成：

* 1）找出布雷克·格里芬的身高信息

```mysql
SELECT height FROM player WHERE player_name =  '布雷克-格里芬'
```

* 2）根据 1 中的身高 查询出对应球员。

```mysql
SELECT player_name, height FROM player WHERE height > xxx
```

或者使用子查询

```mysql
SELECT player_name, height FROM player WHERE height > (SELECT height FROM player WHERE player_name =  '布雷克-格里芬')
```



同样的使用自连接一样可以完成该需求。

```mysql
SELECT b.player_name, b.height FROM player AS a INNER JOIN player AS b ON a.player_name = '布雷克-格里芬' AND a.height < b.height
```

`FROM player AS a INNER JOIN player AS b ` 这样就生成了两个虚拟表进行 INNER JOIN。

然后通过`ON`和`WHERE`两个条件`ON a.player_name = '布雷克-格里芬' AND a.height < b.height` 找到想要的记录。



## 3. OUTER JOIN

外连接包括 3 种：

* LEFT (OUTER ) JOIN 
* RIGHT  (OUTER ) JOIN
* FULL (OUTER ) JOIN

### 1. LEFT JOIN

`LEFT JOIN` 一般被译作左连接，也写作 `LEFT OUTER JOIN`。左连接查询会返回左表（表 A）中所有记录，右表中关联数据列也会被一起返回(不管右表中有没有关联的数据)。

![left-join](img/left-join.png)

![left-join](img/left-join-2.png)

基本语法如下:

```mysql
SELECT * FROM A LEFT JOIN B ON xxx
```

例如: 查询球员和队名。

```mysql
SELECT p.player_name,t.team_name FROM player AS p LEFT JOIN team AS t ON p.team_id = t.team_id
```

### 2. RIGHT JOIN

`RIGHT JOIN` 一般被译作`右连接`，也写作 `RIGHT OUTER JOIN`。右连接查询会返回右表（表 B）中所有记录，左表中找到的关联数据列也会被一起返回(不管左表中有没有关联的数据)。

![right-join](img/right-join.png)

![right-join](img/right-join-2.png)

基本语法如下:

```mysql
SELECT * FROM A RIGHT JOIN B ON xxx
```

例如: 查询球员和队名。

```mysql
SELECT p.player_name,t.team_name FROM player AS p RIGHT JOIN team AS t ON p.team_id = t.team_id
```



> LEFT JOIN 和 RIGHT JOIN 是可以转换的，主要还是根据需求来。

### 3. FULL JOIN

`FULL JOIN` 一般被译作`全连接`，在某些数据库中也叫作 `FULL OUTER JOIN`。 外连接查询能返回左右表里的所有记录，其中左右表里能关联起来的记录被连接后返回。

![full-outer-join](img/full-outer-join.png)

![full-outer-join](img/full-join-2.webp)

基本语法如下:

```mysql
SELECT * FROM A FULL OUTER JOIN B ON xxx
```

例如

```mysql
SELECT p.player_name,t.team_name FROM player AS p FULL JOIN team AS t ON p.team_id = t.team_id
```

> 当前 MySQL 还不支持 FULL OUTER JOIN,不过可以通过 LEFT JOIN+ UNION+RIGHT JOIN 实现。

## 4. 延伸用法

### 1. LEFT JOIN EXCLUDING INNER JOIN

返回左表有但右表没有关联数据的记录集。

![left-join-excluding-inner-join](img/left-join-excluding-inner-join.png)

例如:

```mysql
SELECT * FROM A INNER JOIN B ON A.id = B.id WHERE B.id IS NULL
```

主要是通过`ON`后面的`WHERE`条件进行过滤。



返回右表有但左表没有关联数据的记录集。

![right-join-excluding-inner-join](img/right-join-excluding-inner-join.png)

例如:

```mysql
SELECT * FROM A INNER JOIN B ON A.id = B.id WHERE A.id IS NULL
```

> 同 LEFT JOIN EXCLUDING INNER JOIN 只是改变了 WHERE 条件。



### 3. FULL OUTER JOIN EXCLUDING INNER JOIN

返回左表和右表里没有相互关联的记录集。
![full-outer-join-excluding-inner-join](img/full-outer-join-excluding-inner-join.png)

例如:

```mysql
SELECT * FROM A FULL OUTER JOIN B ON A.id = B.id WHERE A.id IS NULL OR B.id IS NULL
```



## 5. 小结

关于 JOIN ，SQL92 与 SQL99 在写法上有一些差异，不过内在都是相同的。

![sql-joins](img/sql-joins.jpg)



由 [C.L. Moffatt](https://www.codeproject.com/script/Membership/View.aspx?mid=5909363)提供的另一个版本

![sql-joins](img/sql-joins-m.jpg)





## 6. 参考

`https://dev.mysql.com/doc/refman/8.0/en/join.html`

`https://www.zhihu.com/question/34559578`

`https://coolshell.cn/articles/3463.html`

`https://www.w3resource.com/slides/sql-joins-slide-presentation.php`

`https://www.cnblogs.com/zxlovenet/p/4005256.html`

`https://www.w3school.com.cn/sql/sql_union.asp`

`https://mazhuang.org/2017/09/11/joins-in-sql`

`https://www.codeproject.com/Articles/33052/Visual-Representation-of-SQL-Joins`

`https://mp.weixin.qq.com/s/t8JCJSP__qh11U2zl8hCeQ`