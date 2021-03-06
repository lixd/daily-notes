# MySQL视图

## 1. 简介

### 1. 什么是视图

　**视图**是一个**虚拟表**（非真实存在），其本质是【根据SQL语句获取**动态**的数据集，并为其命名】，用户使用时只需使用【名称】即可获取结果集，并可以将其当作表来使用。

　　通过视图，可以展现基表的部分数据；视图数据来自定义视图的查询中使用的表，使用视图动态生成。

基表：用来创建视图的表叫做基表base table

### 2.视图优点

* 1.简单：使用视图的用户完全不需要关心后面对应的表的结构、关联条件和筛选条件，对用户来说已经是过滤好的复合条件的结果集。
* 2.安全：使用视图的用户只能访问他们被允许查询的结果集，对表的权限管理并不能限制到某个行某个列，但是通过视图就可以简单的实现。
* 3.数据独立：一旦视图的结构确定了，可以屏蔽表结构变化对用户的影响，源表增加列对视图没有影响；源表修改列名，则可以通过修改视图来解决，不会造成对访问者的影响。

**总而言之，使用视图的大部分情况是为了保障数据安全性，提高查询效率**。

## 2. 视图操作

### 1. 创建视图

```mysql
CREATE [OR REPLACE] [ALGORITHM = {UNDEFINED | MERGE | TEMPTABLE}]
    VIEW view_name [(column_list)]
    AS select_statement
   [WITH [CASCADED | LOCAL] CHECK OPTION]
   
```

* **OR REPLACE**：表示替换已有视图
* **ALGORITHM**：表示视图选择算法
  * **UNDEFINED(默认算法)**：由MySQL自动选择要使用的算法 ；
  * **merge合并算法** :系统先将视图对应的`select`语句与外部查询视图的`select`语句进行合并，然后再执行。此算法比较高效，且在未定义算法的时候，经常会默认选择此算法。；
  * **temptable临时表算法**: 系统先执行视图的`select`语句，后执行外部查询语句。
* **select_statement**：表示select语句
* **[WITH [CASCADED | LOCAL] CHECK OPTION]**：表示视图在更新时保证在视图的权限范围之内
  * **cascade**: 是默认值，表示更新视图的时候，要满足视图和表的相关条件
  * **local**: 表示更新视图的时候，要满足该视图定义的一个条件即可

TIPS：**推荐使用`WHIT [CASCADED|LOCAL] CHECK OPTION`选项，可以保证数据的安全性 **.

基本格式：

```mysql
create view <视图名称>[(column_list)]
as select语句
with check option;
```

```mysql
mysql> create view v_F_players(编号,名字,性别,电话)
    -> as
    -> select PLAYERNO,NAME,SEX,PHONENO from PLAYERS
    -> where SEX='F'
    -> with check option;
```

```mysql
CREATE 
	ALGORITHM = UNDEFINED 
	DEFINER = `root`@`localhost` 
	SQL SECURITY DEFINER 
VIEW `view_emplyee` 
AS 
	SELECT a.`name` AS '员工',b.`name`AS '领导' FROM t_emplyee a LEFT JOIN t_emplyee b 
ON a.`bossId`=b.`id` ORDER BY b.`id` ASC
```

其中，`select`语句可以是普通查询，也可以是连接查询、联合查询、子查询等。

此外，视图根据数据的来源，可以分为单表视图和多表视图：

- 单表视图：基表只有一个；
- 多表视图：基表至少两个。

我们也可以认为：**创建视图，就是给一条select语句起别名，或者说是封装select语句**。

### 2. 查询视图

```mysql
-- 查看数据库中所建立的所有视图
SHOW TABLE STATUS WHERE COMMENT='view';
-- 指查看视图的结构
show create view + 视图名;
-- 由于视图是一张虚拟表，因此表的所用查询语句，都适用于视图
desc + 视图名;
show tables + 视图名;
show create table + 视图名;
```



### 3. 修改视图

```mysql
-- 修改视图
-- 格式：ALTER VIEW 视图名称 AS 新的SQL语句
alter view tb1 as select * from student where gender='女';
```

### 4. 删除视图

```mysql
-- 删除视图
-- 格式：DROP VIEW 视图名称
drop view tb1;
```

## 3. 视图数据操作

### 新增数据

在这里，新增数据就是指通过视图直接对基表进行数据的新增操作。

- **限制 1**：多表视图不能进行新增数据。

- **限制 2**：可以向单表视图新增数据，但视图中包含的字段必须有基表中所有不能为空的字段。

### 删除数据

与新增数据类似，

- 多表视图不能删除数据；
- 单表视图可以删除数据。

### 更新数据

理论上，无论多表视图还是单表视图，都可以进行数据的更新。

此外，更新视图数据并不总是成功的，这是因为有**更新限制**的存在。那么何为更新限制呢？

- 更新限制：`with check option`，如果创建视图的时候，设置了某个字段的限制，那么对视图进行更新操作的时候，系统就会进行验证，要保证更新之后，数据依然可以被查出来，否则不让更新。



## 4. 总结

* 视图可以节省 SQL 语句，将一条复杂的查询语句用视图来进行封装，以后可以直接对视图进行操作；
* 数据安全，视图操作主要是针对查询的，如果对视图结构进行处理，例如删除，并不会影响基表的数据；
* 视图往往在大型项目中使用，而且是多系统使用，可以对外提供有用的数据，但是隐藏关键（或无用）的数据；
* 视图是对外提供友好型的，不同的视图提供不同的数据，就如专门对外设计的一样；
* 视图可以更好（或者说，容易）的进行权限控制。

## 参考

`https://blog.csdn.net/qq_35246620/article/details/77823968 `

`https://www.cnblogs.com/geaozhang/p/6792369.html`