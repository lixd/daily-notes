# JOIN

## 1. 在SQL92中是如何使用连接的

### 1. 笛卡尔积

笛卡尔乘积是一个数学运算。假设我有两个集合X和Y，那么X和Y的笛卡尔积就是X和Y的所有可能组合，也就是第一个对象来自于X，第二个对象来自于Y的所有可能。

两张表的笛卡尔积的结果:

```mysql
SELECT * FROM player, team
```

结果如下

```mysql
10001	1001	韦恩-艾灵顿	1.93	1003	亚特兰大老鹰
10001	1001	韦恩-艾灵顿	1.93	1002	印第安纳步行者
10001	1001	韦恩-艾灵顿	1.93	1001	底特律活塞
10002	1001	雷吉-杰克逊	1.91	1003	亚特兰大老鹰
10002	1001	雷吉-杰克逊	1.91	1002	印第安纳步行者
....
```



### 2. 等值连接

**两张表的等值连接就是用两张表中都存在的列进行连接**。我们也可以对多张表进行等值连接。

```mysql
SELECT player_id, player.team_id, player_name, height, team_name FROM player, team WHERE player.team_id = team.team_id
```

结果：

```mysql
10001	1001	韦恩-艾灵顿	1.93	底特律活塞
10002	1001	雷吉-杰克逊	1.91	底特律活塞
10003	1001	安德烈-德拉蒙德	2.11	底特律活塞
10004	1001	索恩-马克	2.16	底特律活塞
10005	1001	布鲁斯-布朗	1.96	底特律活塞
10006	1001	兰斯顿-加洛韦	1.88	底特律活塞
...
```



使用`别名`,让 SQL 语句更简洁。

```mysql
SELECT player_id, a.team_id, player_name, height, team_name FROM player AS a, team AS b WHERE a.team_id = b.team_id
```



### 3. 非等值连接

当我们进行多表查询的时候，如果连接多个表的条件是`等号`时，就是`等值连接`，其他的运算符连接就是非等值查询。



比如：

我们知道player表中有身高height字段，如果想要知道每个球员的身高的级别，可以采用非等值连接查询。

```mysql
SELECT p.player_name, p.height, h.height_level
FROM player AS p, height_grades AS h
WHERE p.height BETWEEN h.height_lowest AND h.height_highest
```

结果：

```mysql
韦恩-艾灵顿	1.93	B
雷吉-杰克逊	1.91	B
安德烈-德拉蒙德	2.11	A
索恩-马克	2.16	A
布鲁斯-布朗	1.96	B
兰斯顿-加洛韦	1.88	C
...
```



### 4. 外连接

**除了查询满足条件的记录以外，外连接还可以查询某一方不满足条件的记录。**

两张表的外连接，会有一张是主表，另一张是从表。如果是多张表的外连接，那么第一张表是主表，即显示全部的行，而第剩下的表则显示对应连接的信息。

> 在SQL92中采用（+）代表从表所在的位置，而且在SQL92中，只有左外连接和右外连接，没有全外连接。



什么是左外连接，什么是右外连接呢？

左外连接，就是指左边的表是主表，需要显示左边表的全部行，而右侧的表是从表。

```MYSQL
# SQL92 用 `+` 表示从表
SELECT * FROM player, team where player.team_id = team.team_id(+)
# SQL99 则用 LEFT JOIN ...ON
SELECT * FROM player LEFT JOIN team on player.team_id = team.team_id
```



右外连接同理。

```mysql
# SQL92 用 `+` 表示从表
SELECT * FROM player, team where player.team_id = team.team_id(+)
# SQL99 则用 RIGHT JOIN ...ON
SELECT * FROM player RIGHT JOIN team on player.team_id = team.team_id
```



**需要注意的是，LEFT JOIN和RIGHT JOIN只存在于SQL99及以后的标准中，在SQL92中不存在，只能用（+）表示。**

### 5. 自连接

自连接可以对多个表进行操作，也可以对同一个表进行操作。也就是说查询条件使用了当前表的字段。

比如:

我们想要查看比布雷克·格里芬高的球员都有谁，以及他们的对应身高。

```mysql
SELECT b.player_name, b.height FROM player as a , player as b WHERE a.player_name = '布雷克-格里芬' and a.height < b.height
```



##  参考

`https://blog.csdn.net/wyqwilliam/article/details/103076797`