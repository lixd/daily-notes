# Linux下安装MongoDB

## 1. 下载安装包

下载压缩包： `mongodb-linux-x86_64-4.0.5.tgz`

网址：`https://www.mongodb.com/download-center/community`

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/software-install/mongodb4.0.png)

## 2. 解压文件

解压

```xml
# tar zxvf mongodb-linux-x86_64-4.0.5.tgz
```

复制到/usr/local/mongodb 目录下

```xml
# cp mongodb-linux-x86_64-4.0.5 /usr/local/mongodb -r
```

## 3. 初始化

 在/usr/local/mongodb目录下

创建文件夹data，然后在data下创建文件夹db

```xml
# mkdir data
# cd data/
# mkdir db
```

 在/usr/local/mongodb目录下

创建文件夹log，然后在log下创建文件mongodb.log

```xml
# mkdir log
# cd log/
# vim mongodb.log
```

这里创建后需要赋权

```xml
# chmod 777 mongodb.log
```

 在/usr/local/mongodb目录下

创建文件夹conf ，然后在conf 下创建文件mongod.conf

```xml
# mkdir conf
# cd conf/
# vim mongodb.conf
```

配置文件中添加以下内容：

```xml
# mongod.conf

# for documentation of all options,see:
# http://docs.mongodb.org/manual/reference/configuration-options/

# where to write logging data.
systemLog:
  destination: file
  logAppend: true
  path: /usr/local/mongodb/log/mongod.log

# where and how to store data.
storage:
  dbPath: /usr/local/mongodb/data
  journal:
    enabled: true

# how the process runs
processManagement:
  fork: true
  pidFilePath: /usr/local/mongodb/mongod.pid

# network interfaces
net:
  port: 27017
  bindIp: 127.0.0.1
```

到这里，目录大概是这样的

```xml
mongodb
  -bin
  -data
    -db  -->这个也是文件夹
  -log
    -mongodb.log  --日志文件
  -conf
    -mongodb.conf  -->配置文件
```



## 4. 启动

#### 启动mongodb 

有两种方式 一种是带配置文件启动 一种是直接带配置信息启动

```xml
# ./mongod -f /usr/local/mongodb/conf/mongodb.conf

# ./mongod -dbpath=/usr/local/mongodb/data -logpath=/usr/local/mongodb/mongodb.log -logappend -port=27017 -fork 
```

#### 登录

```xml
# ./mongo
```

#### 停止 

可以直接kill进程 但不推荐

在登录数据库后使用以下命令来关闭

```xml
> use admin
> db.shutdownServer()
```

## 参考

`https://blog.csdn.net/hwm_life/article/details/82317750`