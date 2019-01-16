# Linux下安装MongoDB

## 1. 下载安装包



## 2. 解压文件

解压并复制

## 3. 初始化

创建文件夹 data data/db

log log/mongodb.log

conf /conf/mongod.conf

## 4. 启动

启动命令

` ./mongod -dbpath=/usr/local/mongodb/data -logpath=/usr/local/mongodb/mongodb.log -logappend -port=27017 -fork `

停止

` ./mongod -shutdown -dbpath=/usr/local/mongodb/data `

连接mongodb 

` ./mongo `