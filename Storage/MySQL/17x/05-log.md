# MySQL log

## 1. 概述

Binlog 归档日志（不包括select语句）

* 二进制日志

* MySQL Server 层实现，各个引擎共用‘
* BinLog 逻辑日志 ，记录的是一条语句的原始逻辑
* Binlog不限大小，追加写入，不会覆盖以前的日志

RedoLog 重做日志

* 物理日志

## 2. Bin Log

* 1）开启 bin-log

```mysql
show variables like '%log_bin%';

mysql> show variables like '%log_bin%';
+---------------------------------+-----------------------------+
| Variable_name                   | Value                       |
+---------------------------------+-----------------------------+
| log_bin                         | ON                          |
| log_bin_basename                | /var/lib/mysql/binlog       |
| log_bin_index                   | /var/lib/mysql/binlog.index |
| log_bin_trust_function_creators | OFF                         |
| log_bin_use_v1_row_events       | OFF                         |
| sql_log_bin                     | ON                          |
+---------------------------------+-----------------------------+
```

参数解释

* log_bin=ON --表示 binlog 日志开启的
* log_bin_basename -- binlog日志的基本文件名，后面会追加标识来表示每一个文件，如 binlog.00001
* log_bin_index -- binlog文件的索引文件，这个文件管理了所有的binlog文件的目录

```shell
root@280247fb6d68:/var/lib/mysql# cat binlog.index 
./binlog.000007
./binlog.000008
./binlog.000009
./binlog.000010
```

查看binlog,需要用到 MySQL 提供了工具`mysqlbinlog`

```shell
/usr/bin/mysqlbinlog --no-defaults binlog.000010
```

里面的内容的话也不容易看懂，主要关注以下几点

* 1）end_log_pos -- 恢复时可以指定恢复哪几段的数据
* 2）SET TIMESTAMP=1597133850/*!*/; 也可以根据时间恢复
* 3）BEGIN.....COMMIT；标志着一个事务的开始到结束,如下：

```mysql
BEGIN
/*!*/;
# at 4426
#200811  8:17:30 server id 1  end_log_pos 4495 CRC32 0x9f97295b         Table_map: `sampdb`.`users` mapped to number 115
# at 4495
#200811  8:17:30 server id 1  end_log_pos 4563 CRC32 0xf280ad29         Write_rows: table id 115 flags: STMT_END_F

BINLOG '
GlQyXxMBAAAARQAAAI8RAAAAAHMAAAAAAAEABnNhbXBkYgAFdXNlcnMABwMSEhIPAw8HAAAA/QL9
Ai4BAYACASFbKZef
GlQyXx4BAAAARAAAANMRAAAAAHMAAAAAAAEAAgAH/wgBAAAAmacXBF6ZpxcEXgQAcm9vdBcAAAAG
ADEyMzQ1NimtgPI=
'/*!*/;
# at 4563
#200811  8:17:30 server id 1  end_log_pos 4594 CRC32 0x0a032380         Xid = 355
COMMIT/*!*/;
```



根据整个binlog文件恢复

```mysql
# root 为用户名 sampdb为数据库名
/usr/bin/mysqlbinlog --no-defaults binlog.000010|mysql -u root -p sampdb;
```

恢复到指定位置段

```mysql
/usr/bin/mysqlbinlog --no-defaults --start-position="50"  --stop-position ="100" binlog.000010|mysql -u root -p sampdb;
```

恢复指定时间段数据

```mysql
/usr/bin/mysqlbinlog --no-defaults --start-date="2020-08-17 20:00:00" --stop-date="2020-08-17 21:00:00" binlog.000010|mysql -u root -p sampdb;
```



## 3. Redolog

* 记录InnoDB存储引擎的事务日志
* MySQL的WAL（Write-Ahead-Log）
* 文件名：ib_logfile*



同样的，文件在`/var/lib/mysql`目录下，包含`ib_logfile0`、`ib_logfile1`两个文件（可设置）。

采用循环写入方式，当文件0写满时切换到文件1继续写入，同时会有检查机制，会自动擦除已经写入磁盘的日志。当所有日志文件都写满时，MySQL会停下来，把redolog中的数据都同步到磁盘上之后再继续工作。

* writepos 当前记录的位置，循环边写边后移
* checkpoint 当前要擦除的位置，循环边擦除边后移



设置

* innodb_flush_log_at_trx_commit -- redolog 落盘机制（commit 时如何将log buffer 中的日志刷入 log file 中）， 0 、1、2三个值可选（默认为1）
  * 具体顺序为：1.从log buffer写入到 os buffer，然后调用系统的 fsync写入到磁盘。
  * `0`代表当提交事务时，并不将事务的重做日志写入磁盘上的日志文件，而是等待主线程每秒的刷新。
  * `1`是在commit时将重做日志缓冲同步写到磁盘；

  * `2`是重做日志异步写到磁盘，即不能完全保证commit时肯定会写入重做日志文件，只是有这个动作。

```mysql
mysql> select @@global.innodb_flush_log_at_trx_commit;
+-----------------------------------------+
| @@global.innodb_flush_log_at_trx_commit |
+-----------------------------------------+
|                                       1 |
+-----------------------------------------+
```

