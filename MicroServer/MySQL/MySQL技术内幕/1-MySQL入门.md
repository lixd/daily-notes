# MySQL入门

## 1. MySQL教程

### 1. 连接到数据库

```sh
$ mysql -h localhost -u root -p
```

### 2. 创建数据库

```mysql
CREATE DATABASE sampdb;
#创建后设置为默认数据库
USE sampdb;
```

### 3. 创建表

```mysql
CREATE TABLE tbl_name(cloum_specs);
```

```mysql


CREATE TABLE president(
    last_name VARCHAR(15) NOT NULL,
    first_name VARCHAR(15) NOT NULL,
    suffix VARCHAR(5) NULL,
    city VARCHAR(20) NOT NULL,
    state VARCHAR(2) NOT NULL,
    birth DATE NOT NULL,
    death DATE NOT NULL
);

CREATE TABLE member(
	member_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    PRIMARY KEY (member_id),
    last_name VARCHAR(15) NOT NULL,
    first_name VARCHAR(15) NOT NULL,
    suffix VARCHAR(5)  NULL,
    expiration DATE NULL,
    email VARCHAR(100) NULL,
    street VARCHAR(50) NULL,
    city VARCHAR(50) NULL,
    state VARCHAR(2)  NULL,
    zip VARCHAR(10) NULL,
    phone VARCHAR(20) NULL,
    interests VARCHAR(255) NULL
);
```

> INT 表示该列用于存放整数
>
> UNSIGNED 表示值不能为负数
>
> AUTO_INCREMENT 自增
>
> PRIMARY KEY (member_id) 指定主键



example：

```mysql
#学生表
CREATE TABLE student(
    name VARCHAR(20) NOT NULL,
    sex ENUM('F','M') NOT NULL,
    student_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    PRIMARY KEY (student_id)
) ENGINE = InnoDB;

# grade_event
CREATE TABLE grade_event(
	date DATE NOT NULL,
    category ENUM('T','Q') NOT NULL,
    event_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    PRIMARY KEY (event_id)
) ENGINE = InnoDB;

#score
CREATE TABLE score(
	student_id INT UNSIGNED NOT NULL,
    event_id INT UNSIGNED NOT NULL,
    score int NOT NULL,
    PRIMARY KEY (event_id,student_id),
    INDEX (student_id),
    FOREIGN KEY (event_id) REFERENCES grade_event(event_id),
    FOREIGN KEY (student_id) REFERENCES student(student_id)
) ENGINE = InnoDB;

#absebce
CREATE TABLE absebce(
	student_id INT UNSIGNED NOT NULL,
    date DATE NOT NULL,
    PRIMARY KEY (student_id,date),
    FOREIGN KEY (student_id) REFERENCES student(student_id)
) ENGINE = InnoDB;
```

### 4. 添加新行

查询所有内容

```mysql
SELCT * FROM tbl_name;
# SELECT * FROM student;
```

#### 1. insert

**1. 一次性指定全部列值**

```mysql
INSERT INTO tab_name VALUES(value1,value2...);
```

例如：

```mysql
# 字符串更推荐使用单引号
INSERT INTO student VALUES('Kyle','M',NULL);
INSERT INTO grade_event VALUES('2012-09-03','Q',NULL);
```

同时插入多条数据 效率更高。

```mysql
INSERT INTO student VALUES('Avery','F',NULL),('Nathan','M',NULL);
```



**2. 命名赋值列**

当创建的行只有少数几列需要赋值时，这种方式特别有用。

```mysql
INSERT INTO tbl_name(col_name1,col_name2,...) VALUES(value1,value2,...)
```

例如：

```mysql
INSERT INTO member(last_name,first_name) VALUES('Stein','Waldo');
```

同样也可以批量插入

```mysql
INSERT INTO student(name,sex) VALUES('Abby','F'),('Joseph','M');
```
没有在INSERT语句中指定的列将被赋予默认值。



**3. 使用一系列的"列/值"形式进行赋值**

此语法使用SET子句实现，其中包含多个`clo_name=value`的赋值形式。

```MYSQL
INSERT INTO tbl_name SET col_name1=value1,col_name2=value2,...;
```

例如

```mysql
INSERT INTO member SET last_name="Stein",first_name='Waldo';
```

没有在SET语句中指定的列将被赋予默认值，这种形式无法用于一次插入多个行的情形。

### 5. 检索信息

最基本的查询语句

```mysql
SELECT * FROM tbl_name;
```

在写SELECT语句时需要先指定检索的内容，然后加上以下可选的子句，比如`FROM`、`WHERE`、`GROUP BY`、`ORDER BY`和`LIMIT`。



#### 1. FROM

当使用FROM来指定要从哪个表检索数据时，还需要这么要查看哪些列，最常见的是一个`*`作为列说明符，代表`所有列`。

```mysql
SELECT * FROM student;
SELECT name FROM student;
```



#### 2. WHERE

指定检索条件

可以使用WHERE子句限制SELECT语句检索出来的行数，指定列值所必须满足的条件。

例如：

```mysql
SELECT * FROM score WHERE score>95;

SELECT last_name,first_name FROM president WHERE last_name='ROOSEVELT';

#日期
SELECT last_name,first_name FROM president WHERE birth < '1750-1-1';

#组合
SELECT last_name,first_name FROM president WHERE birth < '1750-1-1' AND (state='VA' OR state='MA');
```



#### 3. NULL

NULL值很特殊，起含义是`无值`或`未知值`，所以不能直接和`已知值`进行比较，当然也不能和NULL自身比较。

要测试多个NULL值是否相等**必须使用`IS NULL`或者`IS NOT NULL`**而不能使用`=`、`<>`或者`!=`。
例如查找仍然健在的美国总统，起death在president表中表示为NULL。
```mysql
SELECT last_name,first_name FROM president WHERE death IS NULL;
```

MySQL中特有的比较操作符`<=>`可以用于NULL与NULL比较,类似于已知值比较中的`=`等号。

```mysql
SELECT last_name,first_name FROM president WHERE death <=> NULL;
```



#### 4. ORDER BY

对查询结果排序

ORDER BY子句的默认排序方式是升序排列，在其中的列名后面加上关键帧`ASC(升序)`或者`DESC(降序)`可以指定按升序排列还是按降序排列。



例如想让美国总统的姓名按姓的逆序(降序)排列需要使用关键字`DESC`。

```mysql
SELECT last_name,first_name FROM president ORDER BY last_name DESC;
```

可以对多列进行排序，而且每一列单独地按升序或降序排列。

```mysql
SELECT last_name,first_name FROM president ORDER BY state DESC,last_name ASC;
```

在一个列里，对于升序排列NULL值总是出现在开头，降序则出现在末尾。

为了保证NULL值持续在指定排列顺序的末尾，需要额外增加一个可以区分NULL值和非NULL值得排序列。

例如：想按death日期降序排列所有总统

```mysql
SELECT last_name,first_name FROM president ORDER BY IF(death IS NULL,0,1),state DESC,last_name ASC;
```

其中IF函数的作用是计算第一个参数给出的表达式的值，为真则返回第二个参数，为假则返回第三个参数。

#### 5. LIMIT

限制查询结果

查询结果往往有很多，如果只想看其中的一部分那么可以使用LIMIT子句。

例如：查询按出生日期排在前5位的总统

```mysql
SELECT last_name,first_name FROM president ORDER BY birth ASC LIMIT 5;
```

相反逆序排列可以得到最晚出生的5位。

```mysql
SELECT last_name,first_name FROM president ORDER BY birth DESC LIMIT 5;
```



LIMIT子句还允许从查询结果中间抽出部分行，需要两个参数：第一个从查询结果的哪一行开始，第二个需要返回的行数目。

例如：下面的语句返回的是最晚出生第11到15位的总统。

> 跳过10行 返回5行

```mysql
SELECT last_name,first_name FROM president ORDER BY birth DESC LIMIT 10,5;
```

如果想随机从表里抽取出一行或几行，可以联合使用LIMIT和ORDER BY RAND()子句。

```mysql
SELECT last_name,first_name FROM president ORDER BY RAND() LIMIT 1;
SELECT last_name,first_name FROM president ORDER BY RAND() LIMIT 3;
```



#### 6. 对输出列进行计算和命名

目前大部分查询语句都是直接通过检索表中的值来获得输出结果。

MySQL也支持根据表达式计算输出值。

例如：下列查询计算了一个简单表达式(常量)和一个复杂表达式

```mysql
SELECT 11,FORMAT(SQRT(25+13),3);
```

在表达式中也可以使用列的值进行计算

```mysql
SELECT CONCAT(first_name,' ',last_name) FROM president;
```

例子中对名字进行了格式化，通过一个空格` `连接`first_name`和`last_name`。

**别名**

如果列的名字或者表达式很长，为了是其更加可读可以利用AS name结构为该列分配另一个名字(也称`别名`)
```mysql
SELECT CONCAT(first_name,' ',last_name) AS fullName FROM president;
```
如果别名中包含空格，则必须加上引号
```mysql
SELECT CONCAT(first_name,' ',last_name) AS 'full name' FROM president;
```
在为列提供别名时可以省略关键字AS
```mysql
SELECT 1 one,2 two,3 three;
```

由于可以为列提供别名时可以省略关键字AS，所以如果指定列名查询时忘写逗号则会出现漏掉列的问题

例如：

```mysql
#能正常查询出两列数据
SELECT first_name,list_name FROM president;
```



```mysql
#只能查询出first_name  而且为first_name取了别名为list_name
SELECT first_name list_name FROM president;
```

等同于下面这样

```mysql
SELECT first_name AS list_name FROM president;
```



#### 7. 处理日期

在MySQL中日期必须是年份在最前面

例如`2020-04-26`

千万别写成`04-26-2020`

查询时可以使用整个日期
```mysql
SELECT first_name,list_name FROM president WHERE birth='1980-01-01';
```

也可以使用`YEAR()`、`MONTH()`、`DAYOFMONTH()`函数分开查询

```mysql
SELECT first_name,list_name FROM president WHERE MONTH(birth)=1 AND DAYOFMONTH(birth)=-1;
```

