

### 直接安装

```sh
$ sudo apt-get update
$ sudo apt-get install postgresql postgresql-client
# -i, --login                 以目标用户身份运行一个登录 shell；可同时指定一条命令
# -u, --user=user             以指定用户或 ID 运行命令(或编辑文件)
$ sudo -i -u postgres
# 进入SQL
psql
# 退出
postgres=# \q
```

远程连接

修改文件`\data\pg_hba.conf`

```sh
1.找到
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
2.在下面再加一行
host    all             all             10.1.123.0/24            md5
注：10.1.123.0是客户端所在网段，24表示子网掩码为C类
```





### docker-compsoe

`docker-compose.yaml`



```yaml
version: '2'
services:
  postgres:
    image: postgres:latest
    container_name: pgsql
    restart: always
    privileged: true
    ports:
      - 5432:5432
    environment:
      POSTGRES_USER: postgres
      POSTGRES_DB: postgres
      POSTGRES_PASSWORD: 123456
   	  PGDATA: /var/lib/postgresql/data/pgdata
   	volumes:
      - ./data:/var/lib/postgresql/data/pgdata
```



数据路径

更改配置后需要删除data目录并重启才有效

```sh
/usr/local/docker/postgresql/data
```

启动

```sh
docker-compose up -d
```

进入容器

```sh
docker exec -it container_name psql -U username
docker exec -it pgsql psql -U puug
```

修改密码

```sh
ALTER USER postgres WITH PASSWORD 'newpwd';
```

远程连接

```text
addr:192.168.0.2:5432 
db:gin
user:postgres
pwd:123456
```



## 慢日志

默认配置文件位置

```shell
/var/lib/pgsql/10/data/postgresql.conf
```



修改配置文件

```shell
log_statement = all  #需设置跟踪所有语句，否则只能跟踪出错信息，设置跟踪的语句类型，有4种类型：none(默认), ddl, mod, all。跟踪所有语句时可设置为 "all"。
log_min_duration_statement = 5000   #milliseconds,记录执行5秒及以上的语句，跟踪慢查询语句，单位为毫秒。如设置 5000，表示日志将记录执行5秒以上的SQL语句
```

加载配置

```shell
postgres=# select pg_reload_conf();
postgres=# show log_min_duration_statement;

# 如下
postgres=# select pg_reload_conf();
 pg_reload_conf 
----------------
 t
(1 row)

postgres=# show log_min_duration_statement;
 log_min_duration_statement 
----------------------------
 100ms
(1 row)
```



查询慢日志

```mysql
# 查询执行时间超过 100ms 的
select * from pg_stat_activity where state<>'idle' and now()-query_start > interval '1 ms' order by query_start; 
```

