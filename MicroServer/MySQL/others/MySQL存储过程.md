# MySQL存储过程

## 1. 存储过程简介

**存储过程是可编程的函数，在数据库中创建并保存，可以由SQL语句和控制结构组成**。当想要在不同的应用程序或平台上执行相同的函数，或者封装特定功能时，存储过程是非常有用的。数据库中的存储过程可以看做是对编程中面向对象方法的模拟，它允许控制数据的访问方式。

SQL语句需要先编译然后执行，而存储过程（Stored Procedure）是一组为了完成特定功能的SQL语句集，经编译后存储在数据库中，用户通过指定存储过程的名字并给定参数（如果该存储过程带有参数）来调用执行它。

简单的说，就是一组SQL语句集，功能强大，可以实现一些比较复杂的逻辑功能，类似于JAVA语言中的方法；

> 存储过程跟触发器有点类似，都是一组SQL集，但是存储过程是主动调用的，且功能比触发器更加强大，触发器是某件事触发后自动调用；

## 2. 存储过程的优缺点

### 2.1 优点

1.**增强SQL语言的功能和灵活性**：存储过程可以用控制语句编写，有很强的灵活性，可以完成复杂的判断和较复杂的运算。

2.**标准组件式编程**：存储过程被创建后，可以在程序中被多次调用，而不必重新编写该存储过程的SQL语句。而且数据库专业人员可以随时对存储过程进行修改，对应用程序源代码毫无影响。

3.**较快的执行速度**：如果某一操作包含大量的Transaction-SQL代码或分别被多次执行，那么存储过程要比批处理的执行速度快很多。因为存储过程是预编译的。在首次运行一个存储过程时查询，优化器对其进行分析优化，并且给出最终被存储在系统表中的执行计划。而批处理的Transaction-SQL语句在每次运行时都要进行编译和优化，速度相对要慢一些。

4.**减少网络流量：**针对同一个数据库对象的操作（如查询、修改），如果这一操作所涉及的Transaction-SQL语句被组织进存储过程，那么当在客户计算机上调用该存储过程时，网络中传送的只是该调用语句，从而大大减少网络流量并降低了网络负载。

5.**作为一种安全机制来充分利用：**通过对执行某一存储过程的权限进行限制，能够实现对相应的数据的访问权限的限制，避免了非授权用户对数据的访问，保证了数据的安全。

### 2.2 缺点

1.可移植性差

2.对于很简单的sql语句， 存储过程没有优势

3.如果存储过程中不一定会减少网络传输（包含的sql数量并不多， 并且执行很快，就没必要了）

4.如果只有一个用户使用数据库， 那么存储过程对于安全也没什么影响

5.团队开发时需要先统一标准， 否则后期维护是个麻烦

6.在大并发量访问的情况下， 不宜写过多涉及运算的存储过程

7.业务逻辑复杂时， 特别是涉及到对很大的表进行操作的时候， 不如在前端先简化业务逻辑

## 3. 存储过程语法

### 3.1 基本语法

**CREATE PROCEDURE**  **过程名([[IN|OUT|INOUT] 参数名 数据类型[,[IN|OUT|INOUT] 参数名 数据类型…]]) [特性 ...] 过程体**

例如：

```sql
-- 存储过程
-- 将语句的结束符号从分号;临时改为两个//(可以是自定义) 让编译器把两个"//"之间的内容当做存储过程的代码，不会执行这些代码
DELIMITER // 
-- 创建存储过程 名称为 add_sum
CREATE PROCEDURE add_sum(IN a INT,IN b INT,OUT c INT)
-- 过程体开始
BEGIN
-- SET 赋值
 SET c=a+b;
-- 过程体结束
END
//  -- 存储过程结束
DELIMITER ; -- 将分隔符还原为分号 ；
-- 调用存储过程
SET @a=1;
SET @b=2;
CALL add_sum(@a,@b,@c);
SELECT @c AS SUM; -- 输出为3
```

MySQL默认以";"为分隔符，如果没有声明分隔符，则编译器会把存储过程当成SQL语句进行处理，因此编译过程会报错。

所以要事先用`DELIMITER //`声明当前的分隔符，可以自定义。让编译器把两个`//`之间的内容当做存储过程的代码，不会执行这些代码；结束后使用`DELIMITER ;`把分隔符还原。

可以添加创建者信息

DEFINER：创建者；

```sql
DELIMITER //
CREATE DEFINER=`az`@`localhost` PROCEDURE `test23`(IN s INT)
BEGIN
SET s=1;
END
//
DELIMITER ;
```

**MYSQL 存储过程中的关键语法**

声明语句结束符，可以自定义:

```
DELIMITER $$
或
DELIMITER //
```

声明存储过程:

```
CREATE PROCEDURE demo_in_parameter(IN p_in int)       
```

存储过程开始和结束符号:

```
BEGIN .... END    
```

变量赋值:

```
SET @p_in=1  
```

变量定义:

```
DECLARE l_int int unsigned default 4000000; 
```

创建mysql存储过程、存储函数:

```
create procedure 存储过程名(参数)
```

存储过程体:

```
create function 存储函数名(参数)
```

调用存储过程：

```sql
call sp_name[(传参)];
```

### 3.2 存储过程体

过程体的开始与结束使用`BEGIN`与`END`进行标识。

①如果过程没有参数，也必须在过程名后面写上小括号

　　　　例：`CREATE PROCEDURE sp_name ([proc_parameter[,...]]) ……`

②确保参数的名字不等于列的名字，否则在过程体中，参数名被当做列名来处理

- 存储过程体包含了在过程调用时必须执行的语句，例如：dml、ddl语句，if-then-else和while-do语句、声明变量的declare语句等
- 过程体格式：以begin开始，以end结束(可嵌套)

```
BEGIN
　　BEGIN
　　　　BEGIN
　　　　　　statements; 
　　　　END
　　END
END
```

**注意：**每个嵌套块及其中的每条语句，必须以分号结束，表示过程体结束的begin-end块(又叫做复合语句compound statement)，则不需要分号。

**为语句块贴标签:**

```
[begin_label:] BEGIN
　　[statement_list]
END [end_label]
```

例如：

```sql
label1: BEGIN
　　label2: BEGIN
　　　　label3: BEGIN
　　　　　　statements; 
　　　　END label3 ;
　　END label2;
END label1
```

标签有两个作用：

- 1、增强代码的可读性
- 2、在某些语句(例如:leave和iterate语句)，需要用到标签

### 3.3 参数

存储过程根据需要可能会有输入、输出、输入输出参数，如果有多个参数用","分割开。MySQL存储过程的参数用在存储过程的定义，共有三种参数类型,IN,OUT,INOUT:

* **IN：**参数的值必须在调用存储过程时指定，在存储过程中修改该参数的值不能被返回，为默认值

* **OUT**:该值可在存储过程内部被改变，并可返回

* **INOUT**:调用时指定，并且可被改变和返回

#### 1.IN参数例子

```sql
DELIMITER //
  CREATE PROCEDURE in_param(IN p_in int)
    BEGIN
    SELECT p_in;
    SET p_in=2;
    SELECT p_in;
    END;
    //
DELIMITER ;
-- 调用
SET @p_in=1; -- 这里@p_in为1
CALL in_param(@p_in); -- 这里 修改@p_in值为2
SELECT @p_in; -- 查询@p_in值依旧为1
```

**p_in 在存储过程中被修改，但并不影响 @p_id 的值，因为前者为局部变量、后者为全局变量。**

```sql
-- 此语句的意思就是根据where条件uid=1查询user表，得到的行数存入变量u_count中（给变量赋值）
select count(*) into u_count from user where uid=1;
```

#### 2.OUT参数例子

```sql
#存储过程
DELIMITER // -- 将语句的结束符号从分号;临时改为两个//(可以是自定义) 让编译器把两个"//"之间的内容当做存储过程的代码，不会执行这些代码
CREATE PROCEDURE out_param(OUT p_out  INT)
BEGIN
SELECT p_out ;
 SET p_out =999;
END
//  -- 存储过程结束
DELIMITER ; -- 将分隔符还原为分号 ；
SET @p_out=111;
CALL out_param(@p_out); -- 因为out是向调用者输出参数，不接收输入的参数，所以存储过程里的p_out为null
SELECT @p_out; -- 调用了out_param存储过程，输出参数，改变了p_out变量的值
```

#### 3.INOUT输入参数

```sql
-- 存储过程
DELIMITER // -- 将语句的结束符号从分号;临时改为两个//(可以是自定义) 让编译器把两个"//"之间的内容当做存储过程的代码，不会执行这些代码
CREATE PROCEDURE inout_param(INOUT p_inout  INT)
BEGIN
 SELECT p_inout ;
 SET p_inout =999;
 SELECT p_inout ;
END
//  -- 存储过程结束
DELIMITER ; -- 将分隔符还原为分号 ；
SET @p_inout=111;
CALL inout_param(@p_inout);  -- 能接受输入的值 查询结果为111
SELECT @p_inout; -- 存储过程修改了值 所以结果为999
```

**注意：**

1、如果过程没有参数，也必须在过程名后面写上小括号例：

```
CREATE PROCEDURE sp_name ([proc_parameter[,...]]) ……
```

2、确保参数的名字不等于列的名字，否则在过程体中，参数名被当做列名来处理

**建议：**

- 输入值使用in参数。
- 返回值使用out参数。
- inout参数就尽量的少用。

### 3.4 变量

#### 1变量定义

局部变量声明一定要放在存储过程体的开始：

```
DECLAREvariable_name [,variable_name...] datatype [DEFAULT value];
```

其中，datatype 为 MySQL 的数据类型，如: int, float, date,varchar(length)

例如:

```sql
DECLARE l_int int unsigned default 4000000;  
DECLARE l_numeric number(8,2) DEFAULT 9.95;  
DECLARE l_date date DEFAULT '1999-12-31';  
DECLARE l_datetime datetime DEFAULT '1999-12-31 23:59:59';  
DECLARE l_varchar varchar(255) DEFAULT 'This will not be padded';`
```

#### 2 变量赋值

```
SET 变量名 = 表达式值 [,variable_name = expression ...]
```

#### 3 用户变量

```sql
SET @ValueName=value; 

SET @uid=123;
```

**注意:**

- 1、用户变量名一般以@开头
- 2、滥用用户变量会导致程序难以理解及管理

### 3.5 存储过程控制语句

#### 1. 变量作用域

内部的变量在其作用域范围内享有更高的优先权，当执行到 end。变量时，内部变量消失，此时已经在其作用域外，变量不再可见了，应为在存储过程外再也不能找到这个申明的变量，但是你可以通过 out 参数或者将其值指派给会话变量来保存其值。

#### 2.条件语句

#####  1.if-then-else 语句

```sql
DROP PROCEDURE IF EXISTS myif;  -- 删除存储过程myif 如果存在
DELIMITER //
CREATE PROCEDURE myif(IN a INT)
BEGIN
DECLARE msg VARCHAR(30);
IF a = 0 THEN
	SET msg='a is 0';
ELSEIF a = 1 THEN 
	SET msg='a is 1';
ELSE 
	SET msg='a is others,not 0 or 1';
END IF;
SELECT msg;
END
//
DELIMITER ;

CALL myif(2); -- 调用
```

##### 2.case语句：

```sql
DROP PROCEDURE IF EXISTS mycase;
DELIMITER //
CREATE PROCEDURE mycase(IN a INT)
BEGIN
DECLARE msg VARCHAR(30); -- 定义变量
CASE a
WHEN 0 THEN
	SET msg='a is 0';
WHEN 1 THEN
	SET msg='a is 1';
ELSE  -- 相当于switch中的default
	SET msg='a is others,not 0 or 1';
SELECT msg;
END CASE;
END 
//
DELIMITER ;

CALL mycase(1); -- 调用
```

##### 3.循环语句

###### 1.while ···· end while

```sql
DROP PROCEDURE IF EXISTS mywhile;
DELIMITER //
CREATE PROCEDURE mywhile(IN a INT)
BEGIN
DECLARE msg VARCHAR(30);
WHILE a>1 DO
INSERT INTO user2 VALUES(NULL,a);  -- 循环往表中插入数据
SET a=a-1; 			   -- 每次执行结束a减1
END WHILE;
END
//
DELIMITER ;
DROP PROCEDURE mywhile;

CALL mywhile(5);
```



```sql
while 条件 do
    --循环体
endwhile
```

###### 2.repeat···· end repea

它在执行操作后检查结果，而 while 则是执行前进行检查。

```sql
DROP PROCEDURE IF EXISTS myrepeat;
DELIMITER //
CREATE PROCEDURE myrepeat(IN a INT)
BEGIN
REPEAT
 INSERT INTO user2 VALUES(NULL,a);
 SET a=a-1;
 UNTIL a<1
 END REPEAT;
 END
 //
DELIMITER ;
 
CALL myrepeat(10);
```



```sql
repeat
    -- 循环体
until 循环条件  
end repeat;
```

###### 3.loop ·····endloop

-- loop 与 leave,iterate 实现循环  
-- loop 标志位无条件循环，leave 类似于break 语句，跳出循环，跳出 begin end，iterate 类似于continue ，结束本次循环

```sql
DROP PROCEDURE IF EXISTS myloop;
DELIMITER //
CREATE PROCEDURE myloop(IN a INT)
BEGIN
loop_label: LOOP
INSERT INTO user2 VALUES(NULL,a);
SET a=a-1;
IF a<1 THEN
	LEAVE loop_label;
END IF;
END LOOP;
END
//
DELIMITER ;

CALL myloop(10);
```

###### 4.LABLES 标号

标号可以用在 begin repeat while 或者 loop 语句前，语句标号只能在合法的语句前面使用。可以跳出循环，使运行指令达到复合语句的最后一步。

ITERATE 通过引用复合语句的标号,来从新开始复合语句:

```sql
DROP PROCEDURE IF EXISTS myiterate;
DELIMITER //
CREATE PROCEDURE myiterate(IN a INT)
BEGIN
loop_label: LOOP
IF a<3 THEN
	SET a=a+1;
ITERATE loop_label; -- 退出这次循环 继续下一次循环 类似于continue
END IF;
INSERT INTO user2 VALUES(NULL,a);
SET a=a+1;
IF a>=5 THEN
	LEAVE loop_label;
END IF;
END LOOP;
END
//
DELIMITER ;

CALL myiterate(1);
```

## 4. 存储过程操作语法

#### 4.1 存储过程查询

查看某个数据库下面的存储过程

```sql
-- 查询数据库中的存储过程
SELECT * FROM mysql.proc WHERE db='数据库名'; 

-- MySQL存储过程和函数的信息存储在information_schema数据库下的Routines表中。通过查询该表的记录查询信息
SELECT * FROM information_schema.routines WHERE routine_schema='数据库名';

-- 这个语句是MySQL的扩展，它返回子程序的特征，如数据库、名字、类型、创建者及创建和修改日期。PROCEDURE和FUNCTION分别表示查看存储过程和函数
SHOW PROCEDURE STATUS WHERE db='数据库名'; 
```

查看详细的存储过程

```sql
SHOW CREATE PROCEDURE 数据库.存储过程名; -- 它返回一个可用来重新创建已命名子程序的确切字符串
```

#### 4.2 修改删除

```sql
-- 修改
ALTER {PROCEDURE | FUNCTION} proc_or_func [characterustic...]

ALTER PROCEDURE 存储过程名字  
ALTER PROCEDURE inout_param  
-- 删除
DROP {PROCEDURE | FUNCTION} [IF EXISTS] proc_name

DROP PROCEDURE  inout_param;
DROP PROCEDURE IF EXISTS inout_param;
```

## 参考

`http://www.runoob.com/w3cnote/mysql-stored-procedure.html`

`https://www.2cto.com/database/201805/746743.html`

`https://www.cnblogs.com/mark-chan/p/5384139.html`