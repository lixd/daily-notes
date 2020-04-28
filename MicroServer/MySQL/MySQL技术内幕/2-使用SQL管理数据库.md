# 使用SQL管理数据库



## 2. 数据库操作

MySQL提供了几条数据库级的语句：

* USE:选定默认数据库
* CREATE DATABASE 创建数据库
* DROP DATABASE 删除数据库
* ALTER DATABASE 更改数据库全局属性



### 1. 选择数据库

```mysql
USE db_name;
```

> 每次新建连接都需要重新指定默认数据库

没有选择默认数据库时可以在语句中显式得指定数据库。

```mysql
SELECT * FROM sampdb.president;
```



### 2. 创建

```mysql
CREATE DATABASE db_name;
```

完整语法如下：

> 可以显式指定数据库的字符集和排序规则。

```mysql
CREATE DATABASE [IF NOT EXISTS] db_name [CHARACTER SET charset] [COLLATE collation];
```

例如

```mysql
CREATE DATABASE mydb CHARACTER SET utf8 COLLATE utf8-icelandic_ci;
```

**查看当前数据库的定义**

```mysql
SHOW CREATE DATABASE sampdb;

CREATE DATABASE `sampdb` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */ /*!80016 DEFAULT ENCRYPTION='N' */
```



### 3. 删除

```mysql
DROP DATABASE db_name;
```

> 不要随意使用该命令，删除后数据将永远消失。



### 4. 更改数据库

目前数据库的全局属性只包含默认字符集和排序规则。

```mysql
ALTER DATABASE [db_name] [CHARACTER SET charset] [COLLATE collation]
```

>  如果省略了表名那么`ALTER DATABASE`命令将会应用到默认数据库



## 3. 表操作

列表如下

* CREATE TABLE 创建表
* DROP TABLE 删除表
* ALTER TABLE 修改表结构
* CREATE INDEX 增加索引
* DROP INDEX 删除索引



### 1. 存储引擎

MySQL包含多种存储引擎，

| 功能         | MylSAM | MEMORY | InnoDB | Archive |
| ------------ | ------ | ------ | ------ | ------- |
| 存储限制     | 256TB  | RAM    | 64TB   | None    |
| 支持事务     | No     | No     | Yes    | No      |
| 支持全文索引 | Yes    | No     | No     | No      |
| 支持树索引   | Yes    | Yes    | Yes    | No      |
| 支持哈希索引 | No     | Yes    | No     | No      |
| 支持数据缓存 | No     | N/A    | Yes    | No      |
| 支持外键     | No     | No     | Yes    | No      |

可以根据以下的原则来选择 MySQL 存储引擎：

- 如果要提供提交、回滚和恢复的事务安全（ACID 兼容）能力，并要求实现并发控制，InnoDB 是一个很好的选择。
- 如果数据表主要用来插入和查询记录，则 MyISAM 引擎提供较高的处理效率。
- 如果只是临时存放数据，数据量不大，并且不需要较高的数据安全性，可以选择将数据保存在内存的 MEMORY 引擎中，MySQL 中使用该引擎作为临时表，存放查询的中间结果。
- 如果只有 INSERT 和 SELECT 操作，可以选择Archive 引擎，Archive 存储引擎支持高并发的插入操作，但是本身并不是事务安全的。Archive 存储引擎非常适合存储归档数据，如记录日志信息可以使用 Archive 引擎。



### 2. 创建表

```mysql
CREATE TABLE tbl_name(cloum_specs) ENGINE XXX;
```

例如

```mysql
CREATE TABLE student(
    name VARCHAR(20) NOT NULL,
    sex ENUM('F','M') NOT NULL,
    student_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    PRIMARY KEY (student_id)
) ENGINE = InnoDB;
```

#### 临时表

建表语句增加`TEMPORARY`关键字,那么服务器将创建一个临时表，在于服务器会话终止时自动消失。

```mysql
CREATE TEMPORARY TABLE tbl_name(cloum_specs) ENGINE XXX;
```

可以创建与永久表同名的临时表，这时永久表将被隐藏起来。

虽然会自动删除但是还是建议手动删掉即使释放服务器空间。

```mysql
DROP TEMPORARY TABLE;
```

删除时最好带上`TEMPORARY`关键字，否则可能会把永久表删掉了，

> 比如创建临时表后掉线了，此时临时表被服务器删除了，然后客户端自动重连上来执行DROP操作，结果把同名的永久表删除了。

#### 根据其他表或查询结果来创建表



```mysql
CREATE TABLE tbl_name LIKE tbl_name;
```

会根据原有表来创建一个表。

```mysql
CREATE TABLE tbl_name SELECT xxx;
```

根据SELECT查询结果创建表。

> 默认情况下这种形式创建的表不会复制任何列属性 比如ANTO_INCREMENT复制过去后插入数据时也不会自增
>
> 同时也不糊复制任何的索引。

#### 分区表

MySQL支持表分区，从而让表的内容分散存储在不同的物理存储位置。对表存储进行分区后得到分区表，使用分区表有很多好处:

* 表存储分布在多个设备上，可以通过I/O并行机制来缩短访问时间。

创建分区表和只需要在普通建表语句后加上`PARTITION BY`子句(它会定义一个可以把行分配到各个分区的分区函数)，以及一些与分区有关的选项，分区函数可以根据范围、值列表或者散列值来分配各行。

例如：

通过时间对日志进去分区。

```mysql
CREATE TABLE log_partition(
	dt DATETIME NOT NULL,
    info VARCHAR(100) NOT NULL,
    INDEX(dt)
)
PARTITION BY RANGE(YEAR(dt))(
	PARTITION p1 VALUES LESS THAN (2011),
    PARTITION p2 VALUES LESS THAN (2011),
    PARTITION p3 VALUES LESS THAN (2011),
    PARTITION pmax VALUES LESS THAN MAXVALUE
);
```



### 3. 删除表

```mysql
DROP TABLE tbl_name;
```

也可以同时删除多个表

```mysql
DROP TABLE tbl_name1，tbl_name2,...;
```

防止表不存在时删除报错可以加上`IF EXISTS`

```mysql
DROP TABLE IF EXISTS tbl_name;
```

如果只想删除临时表则使用`TEMPORARY`关键字

```mysql
DROP TEMPORARY TABLE tbl_name;
```



### 4. 索引表

MySQL提供了多种灵活的索引创建办法：

* 1.可以对单个列或多个列建立索引
* 2.索引可以包含唯一值也可以包含重复值
* 3.可以为同一个表创建多个索引以优化不同类型的查询
* 4.除`ENUM`和`SET`以外的字符串类型，可以利用列的前缀创建索引。

#### 1. 创建索引

MySQL可以创建多种类型的索引

* 1.唯一索引：对于单列索引不允许出现重复值，对于多列索引不允许出现重复组合值
* 2.常规(非唯一性)索引：它可以让你获得索引的好处但是可能会出现重复值得情况
* 3.FULLTEXT索引：用于全文检索。
* 4.SPATIAL索引：只适用于包含空间值得MyISAM表
* 5.HASH索引：这是MEMORY表的默认索引类型

可以在创建表时包含索引定义

```mysql
CREATE TABLE ...INDEX(col_name)
```

也可以为以存在的表添加索引:

使用`ALTER TABLE`或`CREATE INDEX`

> MySQL内部会把CREATE INDEX语句隐射为ALTER TABLE操作

`ALTER TABLE`比`CREATE INDEX`更加灵活，他可以创建各种类型的索引：

```mysql
ALTER TABLE tbl_name ADD index_type index_name(index_columns);
```

其中`tbl_name`是要添加索引的那个表的名字，`index_columns`是要进行索引的列(如果有多个用逗号隔开)，`index_name`是可选的，没有的话MySQL会根据第一个索引列的名字选取一个名字。

例如：

```mysql
ALTER TABLE student ADD UNIQUE index_score(score);
```

#### 2. 删除索引

删除索引可以使用`DROP INDEX`或者`ALTER TABLE`

```mysql
DROP INDEX index_name ON tbl_name;
ALTER TABLE tbl_name DROP INDEX index_name;
```

同样的`DROP INDEX`语句在内部会被隐射为`ALTER TABLE`操作。

### 5. 更改表结构

`ALTER TABLE`是一条万能型的语句，拥有许多用途。

比如用于更改表结构

```mysql
ALTER TABLE tbl_name action,[action]...;
```

action指的是对表所做的修改，可以同时带上多个动作。

#### 1. 更改列的数据类型

可以使用`MODIFY`或者`CHANGE`子句

```mysql
ALTER TABLE mytb1 MODIFY i MEDIUMINT UNSIGNED;
ALTER TABLE mytb1 CHANGE i i MEDIUMINT UNSIGNED;
```

使用`CHANGE`时把列名写了两遍是因为`CHANGE`子句可能修改列名，所以这里的两个i第一个是旧列名 第二个是新列名。



#### 2. 修改存储引擎

```mysql
ALTER TABLE tbl_name ENGINE=engine_name;
```

其中`engine_name`是一个诸如`InnoDB`、`MyISAM`之类的名字，不区分大小写。



#### 3. 重新命名表

```mysql
ALTER TABLE tbl_name RENAME TO new_tbl_name;
```

也可以使用`RENAME TABLE`子句

```mysql
RENAME TABLE t1 TO t1new,t2 TO t2new;
```

`RENAME TABLE`可以一次性修改多个表名，但`ALTER TABLE`不行。

显式指定数据库名可以将表移动到不同的数据库去

```mysql
ALTER TABLE sampdb.t RENAME TO test.t;
```

或者

```mysql
RENAME TABLE sampdb.t TO test.t;
```

## 4. 获取数据库元数据

MySQL提供了多种获取数据库元数据的方法。

* 1.各种SHOW语句,SHOW DATABASES,SHOW TABLES等
* 2.INFORMATION_SCHMEA数据库里面的表
* 3.命令行程序如：mysqlshow或mysqldump



### 1. SHOW

```mysql
#查看数据库和建库语句
SHOW DATABASES;
SHOW CREATE DATABASE db_name;
#查看表和建表语句
SHOW TABLES;
SHOW TABLES FROM db_name;
SHOW CREATE TABLE tbl_name;
#查看表里的列或索引
SHOW COLUMNS FORM tbl_name;
SHOW INDEX FROM tbl_name;
```

语句`DESCRIBE tbl_name`和`EXPLAIN tbl_name`与`SHOW COLUMNS FROM tbl_name`是一个意思。



```mysql
#显示数据库里的表描述信息
SHOW TABLES STATUS;
SHOW TABLE STATUS FROM db_name;
```

某些SHOW语句还可以带上一条`LIKE 'pattern'`子句来模糊查询。

例如：

查询某个表是否存在

```mysql
SHOW TABLES LIKE 'tbl_name';
```



### 2. INFORMATION_SCHMEA

获取元数据的另一个办法是访问`INFORMATION_SCHMEA`库。



### 3. 命令行

```sh
#列出所有数据库
% mysqlshow
#列出所有表
% mysqlshow db_name
#显示表里的列信息
% mysqlshow db_name tbl_name
#显示表里的索引信息
% mysqlshow --keys db_name tbl_name
#显示所有表的描述信息
% mysqlshow --status db_name

#查看表结构(与SHOW CREATE TABLE很像)
% mysqldump --no-data db_name[tbl_name]
```



## 5. join实现多表检索

SELECT语句的基本语法

```mysql
SELECT select_list #所选择的列
FROM table_list   #要查询的那些表
WHERE row_constraint  #行必须满足的条件
GROUP BY grouping_columns #结果如何分组
ORDER BY sorting_columns #结果如何排序
HAVING group_constraint #分组必须满足的条件
LIMIT count; #限制结果里的行数
```



### 1. 内连接

`INNER JOIN`

inner join可以理解为“**有效的连接”，就是根据on后面的关联条件，两张表中都有的数据才会显示** 

```mysql
SELECT stu.name,stu.id,gra.score FROM student AS std INNER JOIN grade AS gra ON std.id=gra.student_id
```

### 2. 左连接

`LEFT JOIN`

 left join：理解为“主全显,后看on”(主表数据不受影响)，即主表全显示，连接后的表看on后面的选择条件，left join后面的条件，并不会影响左表的数据显示，左表数据会全部显示出来，连接的表如果没有数据，则全部显示为null 

### 3. 右连接

`RIGHT JOIN`

 right join理解为“主看on,后全显”(右表数据不受影响)，即右表数据全部显示，主表数据看on后面的选择条件 



### 4. ON和WHERE

```mysql
SELECT stu.name,stu.id,gra.score FROM student AS std LEFT JOIN grade AS gra ON std.id=gra.student_id AND gra.score IS NOT NULL
```

```mysql
SELECT stu.name,stu.id,gra.score FROM student AS std LEFT JOIN grade AS gra ON std.id=gra.student_id WHERE gra.score IS NOT NULL
```

其中`ON`后的条件时用于**限制连接**的,即左连接时用于限制右表，右连接时用于限制左表。

`WHERE`条件则是对**连接后形成的新表**进行限制。

> inner join时由于on同时可以限制左表和右表 所以on和where的效果是一样的