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

`INNER JOIN、JOIN、CROSS JOIN`都是一个意思。

inner join可以理解为“**有效的连接”，就是根据on后面的关联条件，两张表中都有的数据才会显示** 

```mysql
SELECT stu.name,stu.id,gra.score FROM student AS std INNER JOIN grade AS gra ON std.id=gra.student_id
```

**USING**

USING()子句要求两个表的列名必须相同

例如

```mysql
SELECT mytb1.*,mytb2.* FROM mytb1 INNER JOIN mytb2 USING(b);
```

等价于

```mysql
SELECT mytb1.*,mytb2.* FROM mytb1 INNER JOIN mytb2 ON mytb1.b=mytb2.b;
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



## 6. 子查询实现多表检索

```mysql
SELECT * FROM score WHERE event_id IN (SELECT event_id FROM grad_event WHERE category='T');
```

子查询可以返回各种不同类型的信息：

* 1.标量子查询返回一个值
* 2.列子查询返回一个由一个值或多个值构成的列
* 3.行子查询返回一个由一个值或多个值构成的行
* 4.表子查询返回一个由一个行或多个行构成的表，而行则由一个列或多个列构成。
* 5.可以用IN和NOT IN来检测给定制是否在子查询结果集里
* 6.可以用ALL、ANY、SOME把某给定值与子查询结构集进行比较
* 7.可以用EXISTS和NOT EXISTS检测子查询结果是否为空

如果把子查询用在一个会改变表内容的语句里(如DELTE、UPDATE、INSERT等等)那么MySQL会强行限制这个子查询不能查询正在被修改的那个表。



### 1. 带关系比较运算符的子查询

运算符=，<>=,>,>=,<,<=等可用来对值直接的关系进行比较

```mysql
SELECT * FORM score WHERE event_id = (SELECT event_id FROM grade_event WHERE date='2012-09-23' AND category ='Q');
```

查询得分最低的学生可能会尝试写出如下查询

```mysql
SELECT * FROM score WHERE score=MIN(score);
```

不过where条件后不能跟聚合函数，聚合函数必须在查询结果出来之后才能使用，可以改为子查询

```mysql
SELECT * FROM score WHERE score=(SELECT MIN(score) FROM score);
```

**行构造器**

如果子查询返回的结果是一个行，那么可以使用含构造器来实现一族值与子查询结果进行比较

```mysql
SELECT last_name,first_name,city,state FROm president WHERE (city,state)= (SELECT city,state FROM president WHERE last_name='Adams' AND first_name='John');
```



### 2. IN和NOT IN子查询

查询在absence中没有缺勤记录的学生和有缺勤记录的学生。

```mysql
SELECT * FROM student WHERE student_id NOT IN(SELECT student_id FROM absence);
```

```mysql
SELECT * FROM student WHERE student_id IN(SELECT student_id FROM absence);
```

返回多个列时也可以使用行构造器来比较

```mysql
SELECT last_name,first_name,city,state FROm president WHERE (city,state) IN (SELECT city,state FROM president WHERE last_name='Adams' AND first_name='John');
```

### 3. ALL、ANY和SOME子查询

运算符ALL、ANY常与某个关系比较运算符结合在一起使用，以便测试列子查询的结果。

例如:当比较值小于或等于子查询返回的每个值时<=ALL结果为真，比较值小于或等于子查询返回的任意值(某一个值)时<=ANY为真



查询最早出生的总统:

> 查询生日小于或等于表中所有生日的行，只有最早的那个出生日期才会满足这个条件(刚好等于自己)。

```mysql
SELECT last_name,first_name ,birth FROM president WHERE birth<=ALL(SELECT birth FROM president);
```

### 4. EXISTS和NOT EXISTS

运算符EXISTS和NOT EXISTS只会检查某个子查询是否返回了行，如果又返回则EXISTS结果为真，NOT EXISTS结果为假。

```mysql
SELECT EXISTS (SELECT * FROM absence);
SELECT NOT EXISTS (SELECT * FROM absence);
```

### 5. 相关子查询

相关不相关指的是子查询和外层查询的关系。

```mysql
SLECT j FROM t2 WHERE (SELECT i FROm t1 WHERE i=j);
```

子查询中引用了外层查询的数据所以叫做相关子查询。

```mysql
SELECT student_id,name FROM student WHERE EXISTS(SELECT * FROM absence WHERE absence.student_id=student.student_id);
```

上述语句将查询出在缺勤名单中的学生。

### 6. FROM子句中的子查询

子查询可以用在FROM子句中以生产某些值。



### 7. 将子查询改为连接

有大部分使用了子查询的查询命令可以改写为连接，如果子查询需要花费很长时间那么可以尝试改成连接。

查询score中的考试(不含测验)

```mysql
SELECT * FROM scroe WHERE event_id IN (SELECT event_id FROM grade_event WHERE category='T');
```

改成连接
```mysql
SELECT * FROM scroe INNER JOIN grade_event ON score.event_id=grade.event_id WHERE grade_event.category='T';
```

通常情况下符合如下所示形式的子查询
```mysql
SELECT * FROM table1
WHERE column1 NOT IN(SELECT column2 FROM table2);
```
都可以改为这样的连接查询
```mysql
SELECT table1.* FROM table1 LEFT JOIN table2 ON table1.colunm1=table2.column2 WHERE table2.column2 IS NULL;
```

即左表全查询出来，右表没有的数据就会填成NULL，然后where条件过滤掉右表中为NULL的行。



## 7. UNION实现多表检索

union可以将多个检索结果合并再一起。

有以下特性：

* 1.列名和数据类型:union后的列名取决于第一个SELECT里的列名。union中的第二个及后面的SELECT必须选取相同个数的列，但是不必具有相同的名字和数据类型(如果不一样mysql会自动类型转换)。同时列是根据相对位置进行匹配的。

例如：

```mysql
SELECT a,b FROM t1 UNION SELECT c,d FROM t2;
```

会把t1.a和t2.c作为一列，t1.b和t2.d作为一列

* 处理重复行。默认情况下union会剔除掉结果集里的重复行.

如果想保留重复行则需替换为UNION ALL。

* ORDER BY和LIMIT处理

如果想将UNION结果作为一个整体进行排序，那么需要用括号将每个SELECT语句括起来，并在最后一个SELECT后添加ORDER BY子句。因为UNION只会取第一个SELECT中的列名所以ORDER BY时也只能引用那些名字。

```mysql
#这里ORDER BY只能引用a或者b
(SELECT a,b FROM t1) UNION (SELECT c,d FROM t2) ORDER BY a;
```

类似的LIMIT如下：
```mysql
(SELECT a,b FROM t1) UNION (SELECT c,d FROM t2) LIMIT 2;
```



ORDER BY和LIMIT也可以写在SELECT的括号里单独对每个查询做限制

```mysql
(SELECT a,b FROM t1 ORDER BY a LIMIT 2) UNION (SELECT c,d FROM t2 ORDER BY c LIMIT 3);
```

也可以一起写

```mysql
(SELECT a,b FROM t1 ORDER BY a LIMIT 2) UNION (SELECT c,d FROM t2 ORDER BY c LIMIT 3) ORDER BY a LIMIT 4;
```

## 8. 多表删除和更新

有时需要根据某些行是否与另一个表里的行相匹配来删除它们，类似地也可能需要用一个表里的内容去更新另一个表。

例如:

删掉t表里id大于100的行

```mysql
DELETE FROM t WHERE id > 100;
```

多表时的情况

将t1表的中id值可以在t2表中找到的行删除

```mysql
DELETE t1 FROM t1 INNER JOIN t2 ON t1.id=t2.id;
```

DELTE可以同时删除多个表中的行

同时将t1表和t2表的中id值可以在t2表中找到的行删除

```mysql
DELETE t1,t2 FROM t1 INNER JOIN t2 ON t1.id=t2.id;
```



如果是InnoDB类型的表，那么最好的办法是在表之间建立一个外键关系，并让它包含约束条件`ON DELTE CASCADE`或者`ON UPDATE CASCADE`。



## 9. 事务

事务指的是一组SQL语句，它们是一个执行单位，且在必要时还可以取消。



一般来说，事务是必须满足4个条件（ACID）：：原子性（**A**tomicity，或称不可分割性）、一致性（**C**onsistency）、隔离性（**I**solation，又称独立性）、持久性（**D**urability）。

- **原子性：**一个事务（transaction）中的所有操作，要么全部完成，要么全部不完成，不会结束在中间某个环节。事务在执行过程中发生错误，会被回滚（Rollback）到事务开始前的状态，就像这个事务从来没有执行过一样。
- **一致性：**在事务开始之前和事务结束以后，数据库的完整性没有被破坏。这表示写入的资料必须完全符合所有的预设规则，这包含资料的精确度、串联性以及后续数据库可以自发性地完成预定的工作。
- **隔离性：**数据库允许多个并发事务同时对其数据进行读写和修改的能力，隔离性可以防止多个事务并发执行时由于交叉执行而导致数据的不一致。事务隔离分为不同级别，包括读未提交（Read uncommitted）、读提交（read committed）、可重复读（repeatable read）和串行化（Serializable）。
- **持久性：**事务处理结束后，对数据的修改就是永久的，即便系统故障也不会丢失。



> InnoDB存储引擎支持事务，MyISAM则不支持。



MySQL事务默认是自动提交,即执行一条语句后就自动提交了不会和后续语句组成一个事务。

```mysql
START TRANSACTION;#开启事务
xxxxxx;#执行具体操作
COMMIT;/ROLLBACK;#提交事务或者回滚
```



关闭自动提交模式

```mysql
SET autocommi=0;
```

关闭后则需要手动进行事务提交了，但是如果执行的是创建、修改、删除数据库或其中的对象的数据定义语言DLL语句时，在执行前会自动提交事务。

```mysql
ALTER TABLE
CREATE INDEX
DROP TABLE
...等等
```

### 1. 事务保存点

MySQL可以支持对事务进行部分回滚，具体做法是在事务里调用SAVEPOINT语句来设定一些命名标记，后续可以使用ROLLBACK来回滚到指定的标记处。

例如:

```mysql
START TRANSACTION;
INSERT INTO t VALUES(1);
SAVEPOINT mu_savepoint;#设定标记点
INSERT INTO t VALUES(2);
ROLLBACK TO SAVEPOINT mu_savepoint;#回滚到指定标记点
INSERT INTO t VALUES(3);
COMMIT;
```

最后只有1和3会被执行 因为2已结被回滚了所以以上例子可以看成如下：
```mysql
START TRANSACTION;
INSERT INTO t VALUES(1);
INSERT INTO t VALUES(3);
COMMIT;
```

### 2. 事务隔离

为了防止多客户端同时更新数据产生错误，MyISAM之类的存储引擎提供了`表级锁定`机制,虽然能解决问题但是在大量更新操作时很难提供并发性能。`InnoDB`引擎则提供了底层的锁定方式`行级锁定`，多客户端修改同一行时只有先锁定的客户端可以进行修改。



InnoDB存储引擎实现的事务隔离级别功能，能够让客户端对他们想要看到的由其他事务所做的修改类型进行控制，它提供了多种不同的隔离级别，可以允许或预防在多个事务同时运行时可能出现的各类问题。



* 1.脏读：事务A读取了事务B更新的数据，然后B回滚操作，那么A读取到的数据是脏数据
* 2.不可重复读：事务 A 多次读取同一数据，事务 B 在事务A多次读取的过程中，对数据作了更新并提交，导致事务A多次读取同一数据时，结果 不一致，**重点在于update和delete(锁行即可解决)**
* 3.幻读：系统管理员A将数据库中所有学生的成绩从具体分数改为ABCDE等级，但是系统管理员B就在这个时候插入了一条具体分数的记录，当系统管理员A改结束后发现还有一条记录没有改过来，就好像发生了幻觉一样，这就叫幻读,**重点在于insert（需要锁表解决)**

　**不可重复读和幻读最大的区别，就在于如何通过锁机制来解决他们产生的问题。 **

为了解决这些问题，InnoDB存储引擎提供了4种事务隔离级别。

| 事务隔离级别                 | 脏读 | 不可重复读 | 幻读 |
| ---------------------------- | ---- | ---------- | ---- |
| 读未提交（read-uncommitted） | 是   | 是         | 是   |
| 不可重复读（read-committed） | 否   | 是         | 是   |
| 可重复读（repeatable-read）  | 否   | 否         | 否   |
| 串行化（serializable）       | 否   | 否         | 否   |

InnoDB存储引擎默认的隔离级别是**可重复读（repeatable-read）**

修改方式如下

```mysql
#修改全局隔离级别
SET GLOBAL TRANSACTION ISOLATION LEVEL level;
#修改自身回话隔离级别
SET SESSION TRANSACTION ISOLATION LEVEL level;
#修改下一次事务的隔离级别 一次性的
SET GLOBAL TRANSACTION ISOLATION LEVEL level;
```

**事务表(InnoDB引擎)和非事务表(非InnoDB引擎)混用?**

在某个事务中修改了一个非事务表，那么就真的修改的 无法还原，因为非事务表不支持事务都是处于自动提交模式的。

## 10. 外键和引用完整性

利用外键关系，你可以在一个表里声明与另一个不要的某个索引相关联的索引。也可以把想要施加在表上的约束条件放到外键关系里，数据库会根据这个关系中的规则来维护数据的引用完整性。



比如把score表里的student_id定义为student表中的student_id列的外键。即可确保只把那些student_id存在于student表中的数据插入到score表中，可以防止为不存在的学生输入成绩的情况发生。
外键不仅可以用于insert操作，还可以用于delete和update。使用级联删除`casaded delete`可以做到删除student中某一学生时自动删除score表中相关的行。级联更新同理，更新了student表中的student_id那么score表中对应的student_id也会自动更新。
外键可以帮我们维护数据的一致性并且使用起来也很方便。

MySQL里InnoDB存储引擎提供了对外键的支持。
相关术语如下：
* 1.父表 指包含原始键值的相关表。
* 2.子表 指引用了父表中键的得相关表。
父表中的键值可以用来关联两个表。


