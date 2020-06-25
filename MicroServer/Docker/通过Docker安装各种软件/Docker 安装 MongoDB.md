# Docker 安装 MongoDB

## 1. Docker安装

### 拉取镜像

```shell
docker pull mongo
```

### 环境准备

```shell
/usr/local/docker/mongodb/data //数据
/usr/local/docker/mongodb/backup //备份
/usr/local/docker/mongodb/conf  //配置文件
```

### 配置文件

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

## 2. docker-compose安装

### 1.目录

```sh
/usr/local/docker/mongo
                        docker-compose.yml
                        /data
                        /backup
                        /conf/mongod.conf
```

### 2. docker-compose.yml

```yml
version: '3'
services:
  mongo-db:
    image: mongo:latest
    container_name: mongodb
    #network_mode: "host"
    restart: always
    ports:
      - 27017:27017
    environment:
      TZ: Asia/Shanghai
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: 123456
    volumes:
      - /etc/localtime:/etc/localtime
      - ./data/db:/data/db
      - ./backup:/data/backup
      - ./conf:/data/configdb
     #- ./entrypoint/:/docker-entrypoint-initdb.d/
    logging:
      driver: "json-file"
      options:
        max-size: "200k"
        max-file: "10"
```

### 3. 配置文件

`mongod.conf`

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
            cacheSizeGB: 1 # 内存限制1GB
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

初始化脚本

> 暂时用不上 可以手动创建用户

```bash
#!/usr/bin/env bash
echo "Creating mongo users..."
mongo admin --host localhost -u root -p 123456 --eval "db.createUser({user: 'admin', pwd: '123456', roles: [{role: 'userAdminAnyDatabase', db: 'admin'}]});"
mongo admin -u root -p 123456 << EOF
use hi
db.createUser({user: 'test', pwd: '123456', roles:[{role:'readWrite',db:'test'}]})
EOF
echo "Mongo users created."
```



## 3. 添加用户

进入容器

```shell
# docker exec -it container_name bash
$ docker exec -it mongodb bash
```

进入 MongoDB

```shell
$ mongo
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
     user: 'test',
     pwd: '123456',
     roles: [{role: "readWrite", db: "demo"}]
 })
 
  db.createUser({
     user: 'test',
     pwd: '123456',
     roles: [{role: "readWrite", db: "vaptcha"}]
 })
 # 退出mongo
 exit
```

