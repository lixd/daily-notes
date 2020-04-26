# MySQL 技巧

## 1.join 从句

1.内连接代替not in

```sql
Select username from user where not in (select uname from customer)
Select username from user left join customer where customer.uname is not NULL;
//左连接查询出的结果若右表中不存在则会表示为NULL，使用where customer.uname is not NULL即可排除
//虽然结果相同 但是not in 不会走索引 效率比较低
```

显示(explicit) inner join

```sql
select * from
table a inner join table b
on a.id = b.id;
```

隐式(implicit) inner join

```sql
select a.*, b.*
from table a, table b
where a.id = b.id;
```

## 2.CASE

Case具有两种格式。简单Case函数和Case搜索函数。 
--简单Case函数 
CASE sex 
         WHEN '1' THEN '男' 
         WHEN '2' THEN '女' 
ELSE '其他' END 
--Case搜索函数 
CASE WHEN sex = '1' THEN '男' 
         WHEN sex = '2' THEN '女' 
ELSE '其他' END 

## 3.存储过程

简单的说，就是一组SQL语句集，功能强大，可以实现一些比较复杂的逻辑功能，类似于JAVA语言中的方法；

ps:存储过程跟触发器有点类似，都是一组SQL集，但是存储过程是主动调用的，且功能比触发器更加强大，触发器是某件事触发后自动调用；

SQL语句需要先编译然后执行，而存储过程（Stored Procedure）是一组为了完成特定功能的SQL语句集，经编译后存储在数据库中，用户通过指定存储过程的名字并给定参数（如果该存储过程带有参数）来调用执行它。

存储过程是可编程的函数，在数据库中创建并保存，可以由SQL语句和控制结构组成。当想要在不同的应用程序或平台上执行相同的函数，或者封装特定功能时，存储过程是非常有用的。数据库中的存储过程可以看做是对编程中面向对象方法的模拟，它允许控制数据的访问方式。

存储过程的优点：

(1).**增强SQL语言的功能和灵活性**：存储过程可以用控制语句编写，有很强的灵活性，可以完成复杂的判断和较复杂的运算。

(2).**标准组件式编程**：存储过程被创建后，可以在程序中被多次调用，而不必重新编写该存储过程的SQL语句。而且数据库专业人员可以随时对存储过程进行修改，对应用程序源代码毫无影响。

(3).**较快的执行速度**：如果某一操作包含大量的Transaction-SQL代码或分别被多次执行，那么存储过程要比批处理的执行速度快很多。因为存储过程是预编译的。在首次运行一个存储过程时查询，优化器对其进行分析优化，并且给出最终被存储在系统表中的执行计划。而批处理的Transaction-SQL语句在每次运行时都要进行编译和优化，速度相对要慢一些。

(4).减少网络流量：针对同一个数据库对象的操作（如查询、修改），如果这一操作所涉及的Transaction-SQL语句被组织进存储过程，那么当在客户计算机上调用该存储过程时，网络中传送的只是该调用语句，从而大大减少网络流量并降低了网络负载。

(5).作为一种安全机制来充分利用：通过对执行某一存储过程的权限进行限制，能够实现对相应的数据的访问权限的限制，避免了非授权用户对数据的访问，保证了数据的安全。

## 语法

**CREATE PROCEDURE**  **过程名([[IN|OUT|INOUT] 参数名 数据类型[,[IN|OUT|INOUT] 参数名 数据类型…]]) [特性 ...] 过程体**

```sql
#存储过程
DELIMITER // #将语句的结束符号从分号;临时改为两个//(可以是自定义)
CREATE PROCEDURE add_sum(IN a INT,IN b INT,OUT c INT)
BEGIN
 SET c=a+b;
END
//  # 存储过程结束
DELIMITER ; # 将分隔符还原为分号 ；
# 调用存储过程
SET @a=1;
SET @b=2;
CALL add_sum(@a,@b,@c);
SELECT @c AS SUM; #输出为3
```

MySQL默认以";"为分隔符，如果没有声明分割符，则编译器会把存储过程当成SQL语句进行处理，因此编译过程会报错，所以要事先用“DELIMITER //”声明当前段分隔符，让编译器把两个"//"之间的内容当做存储过程的代码，不会执行这些代码；“DELIMITER ;”的意为把分隔符还原。

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



**参数**

存储过程根据需要可能会有输入、输出、输入输出参数，如果有多个参数用","分割开。MySQL存储过程的参数用在存储过程的定义，共有三种参数类型,IN,OUT,INOUT:

**IN：**参数的值必须在调用存储过程时指定，在存储过程中修改该参数的值不能被返回，为默认值

**OUT**:该值可在存储过程内部被改变，并可返回

**INOUT**:调用时指定，并且可被改变和返回

**过程体**

过程体的开始与结束使用BEGIN与END进行标识。

①如果过程没有参数，也必须在过程名后面写上小括号

　　　　例：CREATE PROCEDURE sp_name ([proc_parameter[,...]]) ……

　　②确保参数的名字不等于列的名字，否则在过程体中，参数名被当做列名来处理

### IN参数例子

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
#调用
SET @p_in=1;
CALL in_param(@p_in);
SELECT @p_in;
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
create function 存储函数名(参数
```

调用存储过程：

```sql
call sp_name[(传参)];
```

**存储过程体**

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

为语句块贴标签:

```
[begin_label:] BEGIN
　　[statement_list]
END [end_label]
```

例如：

label1: BEGIN 　　label2: BEGIN 　　　　label3: BEGIN 　　　　　　statements;  　　　　END label3 ; 　　END label2; END label1

标签有两个作用：

- 1、增强代码的可读性
- 2、在某些语句(例如:leave和iterate语句)，需要用到标签





```sql
# 此语句的意思就是根据where条件uid=1查询user表，得到的行数存入变量u_count中（给变量赋值）
select count(*) into u_count from user where uid=1;
```

### if

```sql
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

CALL myif(2);
msg
a is others,not 0 or 1
```

