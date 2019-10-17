# Mongodb

## 小工具

mongodb提供的一些工具

- bsondump: 可以将bson格式转化成人类可读的一些格式,例如json格式。
- mongo: 客户端命令行工具,类似sqlplus/mysql,支持js语法。
- mongod: mongodb后台服务程序,类似mysqld。
- mongodump: 将数据库数据导出为BSON文件。
- mongorestore: 将BSON文件恢复到数据库中。
- mongoexport: 将数据库中的数据导出为json或者csv格式。
- mongoimport: 将json或者csv格式数据导入到数据库中。
- mongofiles: 用于管理存储在mongodb中的GridFS实体。
- mongooplog: 用于从运行的mongod服务中拷贝运行日志到指定的服务器，主要用于增加备份。
- mongoperf: 用于检查mongoDB的I/O性能的工具。
- mongos: 是MongoDB Shard的缩写,用于数据分片,这个很重要,以后会详细介绍。
- mongosniff: 用于监控连接到mongodb的TCP/IP的所有连接,类似于tcpdump。
- mongostat: 用于监控当前的mongod状态,类似于Linux中的vmstat。
- mongotop: 提供了一个跟踪mongod数据库花费在读写数据的时间，为每个collection都会记录，默认记录时间是按秒记录。

## 常用命令

### 1. 查询所有数据库 

`show dbs`: 这条命令用于查询所有存在的数据库。

注意:mongo默认连接的数据库是test数据库,但是你发现在show dbs的时候并不能看到test,这是因为 没有数据的数据库是不会被真正创建的,如果你在test中插入一条数据,那么在show一次就可以了。

### 2. 创建数据库 

本质上来讲,Mongodb中并没有一条语句或者命令来专门创建数据库,当你使用一个数据库的时候,数据库就会被自动创建。

`use dbname`: use命令用于切换到dbname这个数据,当数据库不存在的时候,dbname的数据库会被创建(事实上现在还没有被创建,只有当有数据的时候才会被 真正创建); 如果数据库已经存在,那么就切换到当前数据库。

### 3. 删除数据库 

首先需要使用use切换到需要删除的数据库中,然后使用`db.dropDatabase()`删除当前数据库。

### 4. 克隆/复制数据库 

`db.cloneDatabase(from_hostname)`: 从另一个服务器克隆当前选择的数据库,即将IP主机中的数据库克隆到当前主机选择的数据库。

`db.copyDatabase(from_dbname, to_dbname, from_hostname)`: 将from_hostname中的from_dbname拷贝到本机的to_dbname库中。
如果复制源服务器需要验证，命令为: db.copyDatabase(from_dbname, to_dbname, from_hostname, username, password)

### 5. 整理数据库 

`db.repairDatabase()`: 能整理碎片并且还可以回收磁盘空间,对磁盘剩余空间需求很大。整理碎片能够提高性能,但是可能会存在一些坑,具体是什么 以后会介绍,慎用。

### 6. 查看当前数据库 

有两个简单命令可以查看,分别是: `db` 和 `db.getName()`。

### 7. 查看数据库状态

 `db.stats()`: 用于查看数据状态,能够得到的信息有:

```
> db.stats()
{
	"db" : "test2",
	"collections" : 0,
	"objects" : 0,
	"avgObjSize" : 0,
	"dataSize" : 0,
	"storageSize" : 0,
	"numExtents" : 0,
	"indexes" : 0,
	"indexSize" : 0,
	"fileSize" : 0,
	"ok" : 1
}
```

### 8. 查看当前db版本,查看当前db的连接机器地址

 `db.version()`: 查看mongo版本

`db.getMongo()`: 查看当前连接的mongo主机

### 9.创建索引

```go
db.集合名.createIndex({"字段名": -1 },{"name":'索引名'})
db.GenerateTask.createIndex({"CreateTime": -1 },{"name":'idx_createtime'})
```

*说明： （1）索引命名规范：idx_<构成索引的字段名>。如果字段名字过长，可采用字段缩写。*

​         *（2）字段值后面的 1 代表升序；如是 -1 代表 降序。*

2.为内嵌字段添加索引

db.*集合名*.createIndex({"*字段名*.*内嵌字段名*":1},{"name":'idx_*字段名*_*内嵌字段名*'})

 

3.通过后台创建索引

db.*集合名*.createIndex({"*字段名*":1},{"name":'idx_*字段名*',**background:true**})

 

4:组合索引

db.*集合名*.createIndex({"*字段名1*":-1,"*字段名2*":1},{"name":'idx_*字段名1*_*字段名2*',background:true})

 

5.设置TTL 索引

db.*集合名*.createIndex( { "*字段名*": 1 },{ "name":'idx_*字段名*',**expireAfterSeconds**: 定义的时间,background:true} )

  说明 ：expireAfterSeconds为过期时间（单位秒）  