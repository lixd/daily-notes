# MongoDB全家桶



| 软件模块                      | 描述                                            |
| ----------------------------- | ----------------------------------------------- |
| mongod                        | MongoDB 数据库软件                              |
| mongo                         | MongoDB 命令行工具，管理 MongoDB 数据库         |
| mongos                        | MongoDB 路由进程，分片环境下使用                |
| **mongodump / mongorestore**  | 命令行数据库备份与恢复工具                      |
| **mongoexport / mongoimport** | CSV/JSON 导入与导出，主要用于不同系统间数据迁移 |
| Compass                       | MongoDB GUI 管理工具                            |
| Ops Manager(企业版）          | MongoDB 集群管理软件                            |
| BI Connector(企业版）         | SQL 解释器 / BI 套接件                          |
| MongoDB Charts(企业版）       | MongoDB 可视化软件                              |
| Atlas（付费及免费）           | MongoDB 云托管服务，包括永久免费云数据库        |



## mongodump / mongorestore

* 类似于 MySQL 的 dump/restore 工具
* 可以完成全库 dump：不加条件
* 也可以根据条件 dump 部分数据：-q 参数
* Dump 的同时跟踪数据变更：--oplog
* Restore 是反操作，把 mongodump 的输出导入到 mongodb

示例

```sh
mongodump -h 127.0.0.1:27017 -d test -c test
mongorestore -h 127.0.0.1:27017 -d test -c test xxx.bson
```

