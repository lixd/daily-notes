# MySQL主从复制

`https://www.cnblogs.com/sustudy/p/4174189.html`

## 1. 环境准备

先准备两台虚拟机，且安装好mysql。必须保证两台机器上的mysql中数据是一致的，不然主从复制时可能会出现问题。

## 2. 配置

在默认情况下，MySQL的配置文件是`/etc/my.cnf`,首先修改Mater主机的配置文件，

```linux
[root@localhost bin]# vim /etc/my.cnf
```

在``/etc/my.cnf`文件中的“[mysqld]”段添加如下内容：

```shell
#节点标识，主、从节点不能相同，必须全局唯一
server-id=1
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
server-id=2
master-host=192.168.1.111
#master主机账号
master-user=mstest    
#master主机密码 用来登录数据库
master-password=123456 
master-port=3306
master-connect-retry=60
#复制过滤选项，可以过滤不需要复制的数据库或表，例如“mysql.%”表示不复制MySQL库下的所有对象
replicate-wild-ignore-table=mysql.%
replicate-wild-ignore-table=information_schema.%
# 指定需要复制的数据库或表,与上面
replicate-wild-do-table=test.%
```

## 3. 创建复制用户

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
 | mysql-bin.000001 |     442  |              |                  |
 +------------------+----------+--------------+------------------+
```

然后在`slave`的MySQL库中将`mster`设为自己的主服务器，操作如下：

    ```mysql
mysql> change master to master_host='192.168.5.154',master_user='repl_user',master_password='root',master_log_file='mysql-bin.000001',master_log_pos=442;
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
             Slave_IO_Running: No
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

