# MySQL入门

## 1. MySQL教程

连接到数据库

```sh
$ mysql -h localhost -u root -p
```

创建数据库

```mysql
CREATE DATABASE sampdb;
#创建后设置为默认数据库
USER sampdb;
```

创建表

```mysql
CREATE TABLE tbl_name(cloum_specs);

CREATE TABLE president(
    last_name VARCHAR(15) NOT NULL,
    first_name VARCHAR(15) NOT NULL,
    suffix VARCHAR(5) NOT NULL,
    city VARCHAR(20) NOT NULL,
    state VARCHAR(2) NOT NULL,
    birth DATE NOT NULL,
    death DATE NOT NULL
);
```

