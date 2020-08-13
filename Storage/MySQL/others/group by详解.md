# Group by

## 1. 概述

 “Group By”从字面意义上理解就是根据“By”指定的规则对数据进行分组，所谓的分组就是将一个“数据集”划分成若干个“小区域”，然后针对若干个“小区域”进行数据处理。 

**group by后字段名必须要为select后的字段，查询字段和group by后字段不一致,则必须对该字段进行聚合处理(聚合函数)**

## 2. 例子



### 1. 原始表
| id   | name | age  | sex  |
| ---- | ---- | ---- | ---- |
| 1    | a    | 10   | F    |
| 2    | b    | 20   | M    |
| 3    | c    | 20   | F    |
| 4    | d    | 30   | M    |
| 5    | e    | 30   | M    |


### 2. 为什么不能用SELECT *

按照age来分组

```mysql
SELECT * FROM t GROUP BY  age
```

执行报错 为什么呢?



先手动分组看一下

| id   | name | age  |
| ---- | ---- | ---- |
| 1    | a    | 10   |
| 2,3  | b,c  | 20   |
| 4,5  | d,e  | 30   |

会发现这样分组后id和name一列会包含多个值，这肯定会报错啊。

这里可以用聚合函数比例COUNT().

稍微调整一下SQL

```mysql
SELECT COUNT(name),age FROM t GROUP BY  age
```

结果如下
| COUNT(name) | age  |
| ----------- | ---- |
| 1           | 10   |
| 2           | 20   |
| 2           | 30   |



### 3. 多字段GROUP BY

 如group by age,sex，我们可以把age和sex看成一个整体字段，以他们整体来进行分组的。 
| id   | name | age  | sex  |
| ---- | ---- | ---- | ---- |
| 1    | a    | 10   | F    |
| 2    | b    | 20   | F    |
| 3    | c    | 20   | M    |
| 4,5  | d,e  | 30   | F    |

查询结果如下

```mysql
SELECT COUNT(name),age,sex FROM t GROUP BY  age,sex
```
| COUNT(name) | age  | sex  |
| ----------- | ---- | ---- |
| 1           | 10   | F    |
| 1           | 20   | F    |
| 1           | 20   | M    |
| 2           | 30   | F    |



## 3. 其他条件

```mysql
SELECT COUNT(name) AS cn,age,sex FROM t WHERE age>10 GROUP BY  age,sex HAVING cn<2 ORDER BY age
```

* WHERE: 对查询结果进行**分组前** 如过滤掉age<=10的

* HAVING: 在**分组后**过滤数据 如过滤掉分组后cn>=2的分组

  



## 4. 参考

` https://blog.csdn.net/weixin_42724467/article/details/89378526 `

` https://www.cnblogs.com/rainman/archive/2013/05/01/3053703.html#m1 `