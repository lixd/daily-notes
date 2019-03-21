# MySQL触发器

## 1. 简介
触发器：`trigger`，是指事先为某张表绑定一段代码，当表中的某些内容发生改变（增、删、改）的时候，系统会自动触发代码并执行。

触发器包含三个要素，分别为

* 事件类型：增删改，即`insert`、`delete`和`update`；
* 触发时间：事件类型前和后，即`before`和`after`；
* 触发对象：表中的每一条记录（行），即`整张表`。

每张表只能拥有一种触发时间的一种事件类型的触发器，即每张表最多可以拥有 6 种触发器。

## 2. 触发器操作

### 1. 创建触发器

```mysql
-- 创建触发器基本语法
-- 创建触发器
CREATE TRIGGER trigger_name trigger_time trigger_event ON tbl_name FOR EACH ROW trigger_stmt
    参数：
    trigger_time是触发程序的动作时间。它可以是 before 或 after，以指明触发程序是在激活它的语句之前或之后触发。
    trigger_event指明了激活触发程序的语句的类型
        INSERT：将新行插入表时激活触发程序
        UPDATE：更改某一行时激活触发程序
        DELETE：从表中删除某一行时激活触发程序
    tbl_name：监听的表，必须是永久性的表，不能将触发程序与TEMPORARY表或视图关联起来。
    trigger_stmt：当触发程序激活时执行的语句。执行多个语句，可使用BEGIN...END复合语句结构
-- ---创建触发器---
delimiter 自定义符号 -- 临时修改语句结束符，在后续语句中只有遇到自定义符号才会结束语句
create trigger + 触发器名称 + 触发时间 + 事件类型 on 表名 for each row
begin -- 代表触发器内容开始
-- 触发器内容主体，每行用分号结尾
end -- 代表触发器内容结束
自定义符号 -- 用于结束语句
delimiter ; -- 恢复语句结束符
```

为商品表创建触发器下单时，商品表库存减少；退单时，商品表库存增加。

```mysql
-- 创建触发器
DELIMITER // -- 临时修改语句结束符
CREATE TRIGGER after_insert AFTER INSERT ON orders FOR EACH ROW
BEGIN -- 触发器内容开始
	-- 触发器内容主体，每行用分号结尾
	UPDATE goods SET inventory = inventory - 1 WHERE id = 1;
END -- 触发器内容结束
// -- 结束语句
DELIMITER ; -- 恢复语句结束符
```

### 2. 查询触发器

```mysql
-- 查询库中所有的触发器
-- 基本语法 show triggers + [like 'pattern'];
show triggers;

-- 查询创建触发器的语句
-- 基本语法：show create trigger + 触发器名称;
show create trigger after_insert

-- 查询触发器详细信息
-- 所有的触发器都会被系统保持到information_schema.triggers这张表中
select * from information_schema.triggers
```

### 3. 删除触发器

**触发器不能修改，只能删除**。因此，当我们需要修改触发器的时候，唯一的方法就是：先删除，后新增。

```mysql
-- 基本语法 drop trigger + 触发器名称;
-- 删除触发器
drop trigger after_insert;
```

### 4. NEW 与 OLD 详解

无论触发器是否触发，只要当某种操作准备执行，系统就会将当前操作的记录的当前状态和即将执行之后的状态分别记录下来，供触发器使用。

`MySQL `中定义了 `NEW `和 `OLD`，用来表示**触发器所在表中触发了触发器的那一行数据**。
具体地：

* 在 `INSERT `型触发器中，`NEW `用来表示将要（`BEFORE`）或已经（`AFTER`）插入的`新数据`；

* 在 `UPDATE `型触发器中，`OLD `用来表示将要或已经被修改的`原数据`，NEW 用来表示将要或已经修改为的`新数据`；

* 在 `DELETE `型触发器中，`OLD `用来表示将要或已经被删除的`原数据`；

**另外，OLD 是只读的，而 NEW 则可以在触发器中使用 SET 赋值，这样不会再次触发触发器，造成循环调用（如每插入一个学生前，都在其学号前加“2013”）**。

无论`OLD`还是 `NEW`，都代表记录本身，而且任何一条记录除了有数据，还有字段名。因此，使用`OLD`和 `NEW`的方法就是：

```mysql
-- 基本语法： NEW.columnName （columnName 为相应数据表某一列名）
NEW.goods_number
```

上述触发器修改后如下：

```mysql
DELIMITER //
CREATE TRIGGER after_insert_new AFTER INSERT ON orders FOR EACH ROW
BEGIN
UPDATE goods SET inventory=inventory-NEW.goods_number WHERE id=NEW.goods_id;
END
//
DELIMITER ;
```

### 5.触发器的执行顺序

我们建立的数据库一般都是 InnoDB 数据库，其上建立的表是事务性表，也就是事务安全的。这时，若SQL语句或触发器执行失败，MySQL 会回滚事务，有：

* ①如果 BEFORE 触发器执行失败，SQL 无法正确执行。
* ②SQL 执行失败时，AFTER 型触发器不会触发。
* ③AFTER 类型的触发器执行失败，SQL 会回滚。

## 3. 触发器优点

- 1.安全性。可以基于数据库的值使用户具有操作数据库的某种权利。

  \# 可以基于时间限制用户的操作，例如不允许下班后和节假日修改数据库数据。

  \# 可以基于数据库中的数据限制用户的操作，例如不允许股票的价格的升幅一次超过10%。

- 2.审计。可以跟踪用户对数据库的操作。   

  \# 审计用户操作数据库的语句。

  \# 把用户对数据库的更新写入审计表。

- 3.实现复杂的数据完整性规则

  \# 实现非标准的数据完整性检查和约束。触发器可产生比规则更为复杂的限制。与规则不同，触发器可以引用列或数据库对象。例如，触发器可回退任何企图吃进超过自己保证金的期货。

  \# 提供可变的缺省值。

- 4.实现复杂的非标准的数据库相关完整性规则。触发器可以对数据库中相关的表进行连环更新。例如，在auths表author_code列上的删除触发器可导致相应删除在其它表中的与之匹配的行。

  \# 在修改或删除时级联修改或删除其它表中的与之匹配的行。

  \# 在修改或删除时把其它表中的与之匹配的行设成NULL值。

  \# 在修改或删除时把其它表中的与之匹配的行级联设成缺省值。

  \# 触发器能够拒绝或回退那些破坏相关完整性的变化，取消试图进行数据更新的事务。当插入一个与其主健不匹配的外部键时，这种触发器会起作用。例如，可以在books.author_code 列上生成一个插入触发器，如果新值与auths.author_code列中的某值不匹配时，插入被回退。

- 5.同步实时地复制表中的数据。

- 6.自动计算数据值，如果数据的值达到了一定的要求，则进行特定的处理。例如，如果公司的帐号上的资金低于5万元则立即给财务人员发送警告数据。

## 4. 总结



**触发器是基于行触发的**，所以删除、新增或者修改操作可能都会激活触发器，所以不要编写过于复杂的触发器，也不要增加过多的触发器，这样会对数据的插入、修改或者删除带来比较严重的影响，同时也会带来可移植性差的后果，所以在设计触发器的时候一定要有所考虑。

**触发器是一种特殊的存储过程，它在插入，删除或修改特定表中的数据时触发执行，它比数据库本身标准的功能有更精细和更复杂的数据控制能力**。



## 参考

`https://www.cnblogs.com/CraryPrimitiveMan/p/4206942.html`

`https://blog.csdn.net/qq_35246620/article/details/78946070`

`https://www.cnblogs.com/phpper/p/7587031.html`