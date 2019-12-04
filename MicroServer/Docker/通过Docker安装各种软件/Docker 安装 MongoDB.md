# Docker 安装 MongoDB

### 拉取镜像

```shell
docker pull mongodb
```

### 环境准备

```shell
/usr/local/docker/mongodb/data //数据
/usr/local/docker/mongodb/backup //备份
/usr/local/docker/mongodb/conf  //配置文件
```

配置文件

```shell
# mongodb.conf
logappend=true
# bind_ip=127.0.0.1
port=27017 
fork=false
noprealloc=true
# 是否开启身份认证
auth=false
```

`fork=false`是否后台运行 必须为false 否则无法启动容器

### 启动容器

```shell
docker run --name mongodb -v \
/usr/local/docker/mongodb/data:/data/db -v \
/usr/local/docker/mongodb/backup:/data/backup -v \
/usr/local/docker/mongodb/conf:/data/configdb -p \27017:27017 -d mongo \
-f /data/configdb/mongodb.conf \
--auth
# 命令说明
容器命名mongodb，
数据库数据文件挂载到/usr/local/docker/mongodb/data
备份文件挂载到/usr/local/docker/mongodb/backup
启动的配置文件目录挂载到容器的/usr/local/docker/mongodb/conf
--auth开启身份验证。
-f /data/configdb/mongodb.conf 以配置文件启动 
# mongod启动命令是在容器内执行的，因此使用的配置文件路径是相对于容器的内部路径。
```



### docker-compose

```yml
version: '3'
  services:  mongodb:    
    container_name: mymongo    
    image: "mongo:latest"    
    ports: 
      - "27017:27017"    
    restart: always    
    command: --auth --storageEngine wiredTiger

```

## 添加用户

进入容器

```shell
docker exec -it mongodb bash
```

进入 MongoDB

```shell
mongo
```

 创建用户

```shell
# 进入 admin 的数据库
use admin
# 创建管理员用户
db.createUser(
   {
     user: "admin",
     pwd: "123456",
     roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
   }
 )
 # 创建有可读写权限的用户. 对于一个特定的数据库, 比如'demo'
 db.createUser({
     user: 'puuguser',
     pwd: '123456',
     roles: [{role: "readWrite", db "demo"}]
 })
```



增加数据库和用户

```sh
mongo host:port
```

进入mongo shell

```sh
# 进入 admin 的数据库
use admin
# admin账号授权 只有admin才能创建用户
db.auth("admin","123456")

use newdb
 db.createUser({
     user: 'newuser',
     pwd: '123456',
     roles: [{role: "readWrite", db "newdb"}]
 })
```

