# Docker 安装 MongoDB

文本主要记录了如何基于 DockerCompose 部署一个 MongoDB。

> MongoDB Atlas（`www.mongodb.com/cloud/`）允许用户在上面创建一个免费集群作为学习使用。
>
> 学习基本是够用了，不过就是国内访问延迟有点高。



> 直接安装可以查看[官方安装文档](https://docs.mongodb.com/manual/installation/)和 [生产环境配置](https://docs.mongodb.com/manual/administration/production-notes/)



## 1. Docker Compose

### 1.目录

```sh
/mongo
     ├──docker-compose.yml
     ├──/db
     ├──/backup
     ├──/configdb
        ├──mongod.conf
```

### 2. docker-compose.yml

```yml
version: '3'
services:
  mongo-db:
    image: mongo:latest
    container_name: mongodb
    restart: always
    ports:
      - 27017:27017
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: 123456
    volumes:
      - ./db:/data/db
      - ./backup:/data/backup
      #- ./configdb:/data/configdb
```

## 2. 添加用户

> 到这里已经可以通过可视化客户端直接连上了
> 账号密码就是前面yaml文件中指定的root 123456

**手动添加**

进入容器

```sh
# docker exec -it container_name /bin/bash
$ docker exec -it mongodb /bin/bash
```

进入 MongoDB Shell

```shell
$ mongo
```

 创建用户

```shell
# 进入 admin 的数据库
use admin
# 授权
db.auth('root','123456')
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
     user: 'test',
     pwd: '123456',
     roles: [{role: "readWrite", db: "demo"}]
 })
 # 退出mongo
 exit
```

退出容器

```sh
$ exit
```