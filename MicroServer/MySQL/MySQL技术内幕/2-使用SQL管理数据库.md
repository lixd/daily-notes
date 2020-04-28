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

**临时表**

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

**根据其他表或查询结果来创建表**



```mysql
CREATE TABLE ...LIKE
```

会根据原有表来创建一个表。

```mysql
CREATE TABLE ...SELECT
```

根据SELECT查询结果创建表。

> 默认情况下这种形式创建的表不会复制任何列属性 比如ANTO_INCREMENT复制过去后插入数据时也不会自增
>
> 同时也不糊复制任何的索引。