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
      - ./configdb:/data/configdb
```



### 3. 配置文件

```conf
systemLog:
    quiet: false
    path: /data/logs/mongod.log
    logAppend: false
    destination: file
processManagement:
    fork: true
    pidFilePath: /data/mongodb/mongod.pid
net:
    bindIp: 0.0.0.0
    port: 27017
    maxIncomingConnections: 65536
    wireObjectCheck: true
    ipv6: false   
storage:
    dbPath: /data/db
    indexBuildRetry: true
    journal:
        enabled: true
    directoryPerDB: false
    engine: mmapv1
    syncPeriodSecs: 60
    mmapv1:
        quota:
            enforced: false
            maxFilesPerDB: 8
        smallFiles: true   
        journal:
            commitIntervalMs: 100
    wiredTiger:
        engineConfig:
            cacheSizeGB: 2 # 内存限制2GB
            journalCompressor: snappy
            directoryForIndexes: false   
        collectionConfig:
            blockCompressor: snappy
        indexConfig:
            prefixCompression: true
operationProfiling:
    slowOpThresholdMs: 100
    mode: off
```



### 4. 启动

```sh
docker-compose up
```





## 2. 添加用户

> 到这里已经可以通过可视化客户端直接连上了
> 账号密码就是前面yaml文件中指定的root 123456



MongoDB 没有默认用户，所以需要手动创建用户,这里有是因为镜像中已经帮我们添加了。

> 登录进入MongoDB Shell之后虽然不需要授权，但是什么操作都做不了，会提示没有权限。唯一能做的就是创建一个超级管理员账号。

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

 

```shell
# 进入 admin 的数据库
use admin
# 授权 yaml 文件里指定的user和pwd
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
     user: 'zzra',
     pwd: '123456',
     roles: [{role: "readWrite", db: "spider"}]
 })
 # 退出mongo
 exit
```

退出容器

```sh
$ exit
```