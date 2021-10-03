

# slow query

开启 slow query 功能后，MySQL 会记录慢查询日志，便于分析。

> 以下教程基于 MySQL 8.0.20 版本。

## 1. 基本使用

首先开启 slow query 功能，并设置对应的阈值，最后将日志记录方式修改为 TABLE，记录到数据表中便于查询。

```mysql
set global log_output='TABLE'; -- 开启慢日志,纪录到 mysql.slow_log 表
set global slow_launch_time=2; -- 设置超过2秒的查询为慢查询
set global slow_query_log='ON';-- 打开慢日志记录
```

然后就是查询慢日志了

```mysql
select convert(sql_text using utf8) sql_text from mysql.slow_log; -- 查询慢sql的 日志
select * from mysql.slow_log;
```

最后用完之后可以关闭 slow query 功能。

```mysql
set global slow_query_log='OFF'; -- 如果不用了记得关上日志
```



## 2. 相关设置

### 相关变量

```mysql
show variables like 'slow%'; -- 可以用这个查询slow query相关变量
```

```mysql
mysql> show variables like 'slow%';
+---------------------+--------------------------------------+
| Variable_name       | Value                                |
+---------------------+--------------------------------------+
| slow_launch_time    | 0                                    | 
| slow_query_log      | ON                                   |
| slow_query_log_file | /var/lib/mysql/dccd867f607f-slow.log |
+---------------------+--------------------------------------+
```

* slow_launch_time 记录阈值，超过改阈值(秒)的查询都会被记下来
* slow_query_log 是否开启慢查询记录功能
* slow_query_log_file 记录慢查询的文件，也可以通过设置将慢查询记录到数据表中。



### 输出方式

```mysql
show variables like 'log_output%';  -- 可以用这个查询slow query 的输出方式
```

```mysql
mysql> show variables like 'log_output%';
+---------------+-------+
| Variable_name | Value |
+---------------+-------+
| log_output    | FILE  |
+---------------+-------+
1 row in set (0.00 sec)
-- 说明当前 slow query log 还是记录到文件中的
```
