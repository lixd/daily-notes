# MySQL主从复制

## 1. 简介

### 1.1 什么是主从复制?
主从复制，是用来建立一个和主数据库完全一样的数据库环境，称为从数据库；主数据库一般是准实时的业务数据库。
### 1.2 主从复制的作用

* 1.做数据的热备，作为后备数据库，主数据库服务器故障后，可切换到从数据库继续工作，避免数据丢失。
* 2.架构的扩展。业务量越来越大，I/O访问频率过高，单机无法满足，此时做多库的存储，降低磁盘I/O访问的频率，提高单个机器的I/O性能。
* 3.读写分离，使数据库能支撑更大的并发。在报表中尤其重要。由于部分报表sql语句非常的慢，导致锁表，影响前台服务。如果前台使用master，报表使用slave，那么报表sql将不会造成前台锁，保证了前台速度。

### 1.3 主从复制的原理

1.数据库有个`bin-log`二进制文件，记录了所有sql语句。
2.我们的目标就是把主数据库的`bin-log`文件的sql语句复制过来。
3.让其在从数据的`relay-log`重做日志文件中再执行一次这些sql语句即可。
4.下面的主从配置就是围绕这个原理配置

### 1.4 大致流程

* 1.binlog输出线程:每当有从库连接到主库的时候，主库都会创建一个线程然后发送binlog内容到从库。在从库里，当复制开始的时候，从库就会创建两个线程进行处理：
* 2.从库I/O线程:当START SLAVE语句在从库开始执行之后，从库创建一个I/O线程，该线程连接到主库并请求主库发送binlog里面的更新记录到从库上。从库I/O线程读取主库的binlog输出线程发送的更新并拷贝这些更新到本地文件，其中包括relay log文件。
* 3.从库的SQL线程:从库创建一个SQL线程，这个线程读取从库I/O线程写到relay log的更新事件并执行。

可以知道，**对于每一个主从复制的连接，都有三个线程**。拥有多个从库的主库为每一个连接到主库的从库创建一个binlog输出线程，每一个从库都有它自己的I/O线程和SQL线程。

### 1.5 具体流程

* 步骤一：主库db的更新事件(update、insert、delete)被写到binlog
* 步骤二：从库发起连接，连接到主库
* 步骤三：此时主库创建一个binlog dump thread线程，把binlog的内容发送到从库
* 步骤四：从库启动之后，创建一个I/O线程，读取主库传过来的binlog内容并写入到relay log.
* 步骤五：还会创建一个SQL线程，从relay log里面读取内容，从Exec_Master_Log_Pos位置开始执行读取到的更新事件，将更新内容写入到slave的db.

### 1.6 问题

#### 数据丢失与复制延迟

- 主库宕机后，数据可能丢失
- 从库只有一个SQL Thread，主库写压力大，复制很可能延时

#### 解决方法

- 半同步复制—解决数据丢失的问题
- 并行复制—-解决从库复制延迟的问题

#### 半同步复制原理
1.事务在主库写完binlog后需要从库返回一个已接受，才放回给客户端；
2.5.5集成到mysql，以插件的形式存在，需要单独安装
3.确保事务提交后binlog至少传输到一个从库
4.不保证从库应用完成这个事务的binlog
5.性能有一定的降低

6.网络异常或从库宕机，卡主库，直到超时或从库恢复 

#### 并行复制
社区版5.6中新增
并行是指从库多线程apply binlog库级别并行应用binlog，同一个库数据更改还是串行的(5.7版并行复制基于事务组)设置
设置sql线程数为10
`set global slave_parallel_workers=10;`

## 2. 环境准备

### 1. 所需环境

先准备两台虚拟机，且安装好mysql。必须保证两台机器上的mysql中数据是一致的，不然主从复制时可能会出现问题。

如果两台机器数据不一致，比如先有主机后加的从机，此时可以先复制主机数据到从机，在配置主从复制。

### 2. 手动同步数据库

先在主机上执行以下SQL，锁定表中数据。

```mysql
mysql> flush table with read lock;
Query OK, 0 rows affected (0.01 sec)
```

**不要退出这个终端，否则这个锁就失效了**。在不退出终端的情况下，再开启一个终端直接打包压缩数据文件或使用mysqldump工具导出数据。这里通过打包mysql文件来完成数据的备份，操作过程如下：

一、导出数据库
1、导出数据和表结构：

```shell
# 格式：mysqldump -u用户名 -p密码 数据库名 > 数据库名.sql
# /usr/local/mysql/bin/   mysqldump -uroot -proot test > test.sql
```

2、只导出表结构：

```shell
# 格式：mysqldump -u用户名 -p密码 -d 数据库名 > 数据库名.sql
# /usr/local/mysql/bin/   mysqldump -uroot -proot -d test > test.sql
```

具体如下：

```linux
#创建保存备份文件的文件夹
[root@localhost ~]# mkdir -p /usr/local/mysql/data/backup    
#创建备份文件
[root@localhost ~]# /usr/local/mysql/bin/mysqldump -uroot -p 'root' --events -A -B |gzip >/usr/local/mysql/data/backup/mysql_bak.$(date +%F).sql.gz
# 用scp将备份文件复制到从机上
[root@localhost ~]# scp /usr/local/mysql/data/backup/mysql_bak.2019-03-12.sql.gz root@192.168.5.151:/usr/local/mysql/data/backup
```

备份结束后，解锁主库，恢复读写

```mysql
mysql> unlock tables;
Query OK, 0 rows affected (0.00 sec)
```

从库进行同步：

```MYSQL
# 解压
[root@localhost backup]# gunzip mysql_bak.2019-03-12.sql.gz 
[root@localhost backup]# mysql -uroot -p  <mysql_bak.2019-03-12.sql
```

或者用另一种同步方法：

```MYSQL
#1.首先建空数据库
mysql>create database abc;
#2.选择数据库
mysql>use abc;
#3.设置数据库编码
mysql>set names utf8;
#4.导入数据（注意sql文件的路径）
mysql>source /usr/local/mysql/data/backup/mysql_bak.2019-03-12.sql;
```

## 3. 搭建主从复制

### 3.1 修改配置文件

在默认情况下，MySQL的配置文件是`/etc/my.cnf`,首先修改Mater主机的配置文件，

```linux
[root@localhost bin]# vim /etc/my.cnf
```

在``/etc/my.cnf`文件中的“[mysqld]”段添加如下内容：

```shell
#节点标识，主、从节点不能相同，必须全局唯一 一般填ip最后几位
server-id=153
#开启MySQL的binlog日志功能。“mysql-bin”表示日志文件的命名格式
#生成文件名为mysql-bin.000001、mysql-bin.000002等的日志文件
log-bin=mysql-bin
#定义relay-log日志文件的命名格式
relay-log=mysql-relay-bin
#复制过滤选项，可以过滤不需要复制的数据库或表，例如“mysql.%”表示不复制MySQL库下的所有对象
replicate-wild-ignore-table=mysql.%
replicate-wild-ignore-table=information_schema.%
# 指定需要复制的数据库或表 test数据库下的所有表都复制
replicate-wild-do-table=test.%
```

接着修改slave从机的配置文件

```shell
#节点标识，主、从节点不能相同，必须全局唯一 一般填ip最后几位
server-id=151
#开启MySQL的binlog日志功能。“mysql-bin”表示日志文件的命名格式
#生成文件名为mysql-bin.000001、mysql-bin.000002等的日志文件
log-bin=mysql-bin
#定义relay-log日志文件的命名格式
relay-log=mysql-relay-bin
#复制过滤选项，可以过滤不需要复制的数据库或表，例如“mysql.%”表示不复制MySQL库下的所有对象
replicate-wild-ignore-table=mysql.%
replicate-wild-ignore-table=information_schema.%
# 指定需要复制的数据库或表,与上面
replicate-wild-do-table=test.%
```

这里需要注意的是，不要在主库上使用binlog-do-db或binlog-ignore-db选项，也不要在从库上使用replicate-do-db或replicate-ignore-db选项，因为这样可能产生跨库更新失败的问题。推荐在从库使用replicate-wild-do-table和replicate-wild-ignore-table两个选项来解决复制过滤问题。

### 3.2 创建复制用户

首先在`mater`的MySQL库中创建复制用户，操作过程如下：

```mysql
[root@localhost bin]# /etc/init.d/mysqld restart
#@ 前面的那个是 用户名 后面的是主机地址 %表示所有 最后的root是密码
mysql> grant replication slave on *.* to 'repl_user'@'%' identified by 'root';
Query OK, 0 rows affected (0.01 sec)
mysql> show master status;
 +------------------+----------+--------------+------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB |
 +------------------+----------+--------------+------------------+
 | mysql-bin.000001 |     686  |              |                  |
 +------------------+----------+--------------+------------------+
```

然后在`slave`的MySQL库中将`mster`设为自己的主服务器，操作如下：

```mysql
mysql> change master to master_host='192.168.5.153',master_user='repl_user',master_password='root',master_log_file='mysql-bin.000001',master_log_pos=686;
```
注意`master_log_file`和`master_log_pos`两个选项，这两个选项的值刚好是在`master`上通过SQL语句`show master status`查询到的结果。

 接着就可以在`slave`上启动slave服务了，可执行如下SQL命令：

```mysql
mysql> start slave;
```

查看`slave`上slave的运行状态：

```mysql
mysql> show slave status\G;

*************************** 1. row ***************************
               Slave_IO_State: 
                  Master_Host: 192.168.5.154
                  Master_User: repl_user
                  Master_Port: 3306
                Connect_Retry: 60
              Master_Log_File: mysql-bin.000001
          Read_Master_Log_Pos: 442
               Relay_Log_File: mysql-relay-bin.000001
                Relay_Log_Pos: 4
        Relay_Master_Log_File: mysql-bin.000001
             Slave_IO_Running: Yes
            Slave_SQL_Running: Yes
              Replicate_Do_DB: 
          Replicate_Ignore_DB: 
           Replicate_Do_Table: 
       Replicate_Ignore_Table: 
      Replicate_Wild_Do_Table: test.%
  Replicate_Wild_Ignore_Table: mysql.%,information_schema.%
                   Last_Errno: 0
                   Last_Error: 
                 Skip_Counter: 0
          Exec_Master_Log_Pos: 442
              Relay_Log_Space: 154
              Until_Condition: None
               Until_Log_File: 
                Until_Log_Pos: 0
           Master_SSL_Allowed: No
           Master_SSL_CA_File: 
           Master_SSL_CA_Path: 
              Master_SSL_Cert: 
            Master_SSL_Cipher: 
               Master_SSL_Key: 
        Seconds_Behind_Master: NULL
Master_SSL_Verify_Server_Cert: No
                Last_IO_Errno: 1593
                Last_IO_Error: Fatal error: The slave I/O thread stops because master and slave have equal MySQL server ids; these ids must be different for replication to work (or the --replicate-same-server-id option must be used on slave but this does not always make sense; please check the manual before using it).
               Last_SQL_Errno: 0
               Last_SQL_Error: 
  Replicate_Ignore_Server_Ids: 
             Master_Server_Id: 1
                  Master_UUID: 
             Master_Info_File: /usr/local/mysql/data/master.info
                    SQL_Delay: 0
          SQL_Remaining_Delay: NULL
      Slave_SQL_Running_State: Slave has read all relay log; waiting for more updates
           Master_Retry_Count: 86400
                  Master_Bind: 
      Last_IO_Error_Timestamp: 190311 16:27:22
     Last_SQL_Error_Timestamp: 
               Master_SSL_Crl: 
           Master_SSL_Crlpath: 
           Retrieved_Gtid_Set: 
            Executed_Gtid_Set: 
                Auto_Position: 0
         Replicate_Rewrite_DB: 
                 Channel_Name: 
           Master_TLS_Version: 
1 row in set (0.00 sec)

```

这里需要重点关注的是`Slave_IO_Running`和`Slave_SQL_Running`，这两个就是在Slave节点上运行的主从复制线程，正常情况下这两个值都应该为Yes。

另外，还需要注意的是`Slave_IO_State`、`Master_Host`、`Master_Log_File`、`Read_Master_Log_Pos`、`Relay_Log_File`、`Relay_Log_Pos`和`Relay_Master_Log_File`几个选项，可以查看出MySQL复制的运行原理及执行规律。最后还有一个`Replicate_Wild_Ignore_Table`选项，这个是之前在`my.cnf`中添加过的，通过此选项的输出值可以知道过滤了哪些数据库。

到这里主从复制已经ok了。

## 4. 测试

在master上创建一个表，注意前面配置的时只复制test数据库中的数据，所以需要先建一个test数据库。

```mysql
mysql> create database test;
Query OK, 1 row affected (0.01 sec)

mysql> use test;
Database changed
mysql> CREATE TABLE users(
    -> uid INT  PRIMARY KEY,
    -> uname VARCHAR(20),
    -> sex INT,
    -> age INT
    -> );
Query OK, 0 rows affected (0.09 sec)

mysql> 

```

创建好后slave查看一下

```mysql
mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| sys                |
+--------------------+
4 rows in set (0.00 sec)

mysql> show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| performance_schema |
| sys                |
| test               |
+--------------------+
5 rows in set (0.01 sec)

```

证明主从复制已经成功了。

## 参考

`https://blog.csdn.net/darkangel1228/article/details/80004222`

`https://blog.51cto.com/superpcm/2094958`

`https://blog.csdn.net/darkangel1228/article/details/80003967`

`https://blog.csdn.net/ljw_jiawei/article/details/84188962`