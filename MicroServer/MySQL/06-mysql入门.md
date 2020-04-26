## 一.SQL分类

DDL:数据库定义语言,数据库/表结构 create drop alter

DML:数据操作语言,操作表数据 inset update delete

DCL:数据库控制语言,设置用户访问权限

DQL:数据查询语言,select from where

## 二.数据库操作

### 1.创建数据库

```java
//普通创建
create database databasename;
create database mydatabase;
//制定字符集和校验
create database databasename character set 字符集 collate 校验;
create database databasename character set utf8 collate utf8_bin;
```

### 2.查看所有数据库

```
//查看所有数据库
show databases;
//查看数据库定义的语句
show create database databasename;

```

### 3.修改数据库

```
alter database databasename charcater  set 字符集;
alter database mydatabase charcater  set gbk;
```

### 4.删除数据库

```
drop database databasename;
drop database mydatabase;
```

### 5.其他数据库操作

```
1.切换数据库
use databasename;
use mydatabase;
2.查看正在使用的数据库
select database();
```

## 三.表的CRUD操作

### 1.创建表

```java
create table 表名(
    列名 列的类型(长度) 约束,
    列名2 列的类型(长度) 约束
);

列的类型
java  		 sql
int   		 int
char/string  char/varchar
			char 固定长度 长度代表字符的个数
			varchar 可变长度
			char(3) 可以存入3个字符 小于3个字符会默认补上空格 占满3个
			varchar(3) 存入3个以下时 按实际长度算 不会补空格
double		double
float		float
boolean		boolean
date 		date :YYYY-MM-DD
			time :hh-mm-ss
			datetime :YYYY-MM-DD hh-mm-ss 默认值为null
			timetamp :YYYY-MM-DD hh-mm-ss 默认值为当前时间
			
			text :主要存放文本
			blob :主要存放二进制
					
约束
	主键约束:primary key
	唯一约束:unique
	非空约束:not null
	
创建表:
 	实体 学生
 	ID name sex age 
 	create table student(
	    sid int primary key,
        sname varchar(31),
        sex int,
        age int
 	);
```

### 2.查看表

```java
//查看所有表
show tables;
//查看表的定义
show create table student;
//查看表结构
desc 表名;
desc student;
```

### 3.修改表

```java
//添加列add,修改列modify,修改列名change,删除列drop,修改表名rename,修改表的字符集
//添加列add
alter table 表名 add 列名 列的类型 约束;
alter table student add grade int not null;
alter table product add pnick varchar(2) not null;
//修改列modify
alter table student modify 列名 新的列的类型 新的约束;
alter table student modify sex varchar(2);

//修改列名change
alter table student change 旧列名 新列名 列的类型 约束;
alter table student change sex gender varchar(2);
//删除列drop
alter table student drop grade;
//修改表名rename
rename table 旧表名 to 新表名; 
rename table student to mystudent;
//修改表的字符集
alter table 表名 character set 字符集;
alter table mystudent character set gbk;
```

### 4.删除表

```
drop table 表名
drop table mystudent;
```

## 四.SQL完成对表中数据的CRUD

### 1.插入数据

```java
insert into 表名(列名1,列名2,列名3) value(值1,值2,值3);
insert into student(sid,sname,gender,age)values(1,'lillusory',1,18);
//简单写法 如果所有列都要插入数据就可以省略
insert into student values(1,'lillusory',1,18);
//批量插入
insert into student values(4,'lillusory1',1,18),
(5,'lillusory2',1,18),
(6,'lillusory3',1,18),
(7,'lillusory4',1,18);
//批量插入效率高于单条插入;
```

### 2.删除

```java
delete from 表名 [where 条件]

delete from student where sid=2;
delete from student;//如果没添加条件会删除表中所有数据

//delete删除数据和truncate删除数据的区别
delete DML 一条一条删除数据;
truncate DDL 先删除表在重建表

数据比较少 delete效率高
数据多     truncate效率高
```

### 3.更新数据

```java
update 表名 set 列名=列的值,列名2=列的值2 [where 条件]
update student set sname='张三' where sid=3;
update student set sname='张三';//如果不加条件会修改所有数据
update product set pnick='1' where pid=1;
```

### 4.查询(select控制显示的内容)

#### 1.简单查询

```java
select [distinct] [*] [列名1,列名2] from [where 条件] 


distinct:去除重复数据


//商品分类 手机数码 鞋靴箱包
分类id,分类名称,分类描述
create table category(
    cid int primary key auto_increment,
    cname varchar(31),
    cdesc varchar(31)
);

create table product(
    pid int primary key auto_increment,
   pname varchar(31),
    price int(31)
);

insert into category values(null,'手机数码','最新款的手机电脑')
    ,(null,'鞋靴箱包','鞋子包包大减价啦')
    ,(null,'香烟酒水','黄鹤楼,五粮液')
    ,(null,'瓜子花生','各种零食')
    ;

insert into product values(null,'小米4',998)
    ,(null,'小米5','999')
    ,(null,'小米6','999')
    ,(null,'小米7','1999')
    ,(null,'小米8','2999')
    ;
select * from category;
select cname,cdesc from category;
//别名查询 as 关键字 as关键字可以省略
//表别名  主要是多表查询
select c.cname,c.cdesc from category c;
//列别名 
select cname 分类名称,cdesc 分类描述 from category;

//去掉重复的值
select distinct price from product;

//select 运算查询 只是对显示的结果进行了运算
select *,price*0.98 会员价 from product;

//条件查询
select * from product where price >999;
	//where 条件写法
		<> 不等于 SQL标准写法
		!= 不等于 非标准
		select * from product where price<>1999;
查询价格在998到1999的
select * from product where price>=998 and price<=1999;
between and
select * from product where price between 998 and 1999;
查询价格小于999和大于1999的
select * from product where price <999 or price >1999;

```

#### 2.复杂查询

```java
//like 模糊查询
 	_ 代表一个字符 下划线
 	% 代表多个字符
 查出名字中带7的商品 %7%
 select * from product where pname like '%7%';
名字第二个字是米的 %_米%
     select * from product where pname like '%_米%';
//in 在某个范围内
select * from product where pid in(1,3,5);
//排序 order by
asc :ascend升序 默认的排序
desc : descend降序
查询所有商品 按照价格升降序排列
select * from product order by price;   默认是升序
select * from product order by price desc;   降序
查询出名字中带7的 按照价格降序排列
select * from product where pname like '%7%' order by price desc

//聚合函数
sum() 求和
avg() 求平均数
count() 统计数量
max() 最大值
min() 最小值
	 查询所有商品价格总和
	select sum(price) from product;
	获得商品平均价格
	select avg(price) from product;
	获得商品总数
	select count(*) from product;	
	查出价格大于平均价格的商品
	select * from product where price > (平均价格);
	select avg(price) from product 获得平均价格
	所以:
	select * from product where price > (select avg(price) from product);
//---where 条件后不能跟聚合函数
alter table product add pnumber int not null;
//分组: group by
 根据字段pnumber分组 ,分组后统计商品个数
 select pnumber,count(*) from product group by pnumber;
 根据字段pnumber分组 ,分组统计每组商品的平均价格,且平均价格大于1999的
 select pnumber,avg(price) from product group by pnumber having avg(price)>1999;

//having 关键字 可以接聚合函数 出现在分组之后
//where 关键字 不可以接聚合函数 出现在分组之前

```

#### 3.小结

```java
//SQL编写顺序
select .. from .. where .. group by .. having ..order by 
//SQL执行顺序
  from ....      where   .....  group by   ....    having   ...  select ..      order by 
先选择查哪张表	 然后添加条件	  对查询结果分组		再添加条件	控制显示那些内容 对显示的内容进行排序
//select 控制查询结果显示内容
```

