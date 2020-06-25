# MongoDB复制数据库和集合

## 1. 复制数据库

`Command`

在`Todb`即需要复制数据到的那个数据库中执行该命令。

```mysql
db.copyDatabase(fromdb,todb,fromhost,username,password,mechanism)
```

后面四个选项可选：

* **fromhost**: 源db的主机地址，如果在同一个mongod实例内可以省略；
* **username**: 如果开启了验证模式，需要源DB主机上的MongoDB实例的用户名；
* **password**: 同上，需要对应用户的密码；
* **mechanism**: fromhost验证username和password的机制，有：`MONGODB-CR`、`SCRAM-SHA-1`两种。



```go
db.copyDatabase("fromdb","todb","192.168.1.1","fromdbusername","fromdbpassword","SCRAM-SHA-1")
```

## 2. 复制Collection

`Command`

在`Todb`即需要复制数据到的那个数据库中执行该命令。

```mysql
db.cloneCollection(fromdb, collection, query)
```



```go
db.cloneCollection("fromdb", "user", "{"age":{"gt":2}}")
```



