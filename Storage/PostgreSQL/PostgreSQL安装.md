

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



