

本文主要简单介绍了`MongoDB`，同时讲述了 `MongoDB`的基础语法。

<!--more-->



## 1. 概述

MongoDB 是一个基于分布式文件存储的数据库。由 C++ 语言编写。旨在为 WEB 应用提供可扩展的高性能数据存储解决方案。

MongoDB 是一个介于关系数据库和非关系数据库之间的产品，是非关系数据库当中功能最丰富，最像关系数据库的。

## 连接

标准 URI 连接语法：

```go
mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]

mongodb://admin:123456@192.168.0.138:27017/admin
```

- **mongodb://** 这是固定的格式，必须要指定。
- **username:password@** 可选项，如果设置，在连接数据库服务器之后，驱动都会尝试登陆这个数据库
- **host1** 必须的指定至少一个host, host1 是这个URI唯一要填写的。它指定了要连接服务器的地址。如果要连接复制集，请指定多个主机地址。
- **portX** 可选的指定端口，如果不填，默认为27017
- **/database** 如果指定username:password@，连接并验证登陆指定数据库。若不指定，默认打开 test 数据库。
- **?options** 是连接选项。如果不使用/database，则前面需要加上/。所有连接选项都是键值对name=value，键值对之间通过&或;（分号）隔开

## 数据库

#### 创建数据库

MongoDB 创建数据库的语法格式如下：

```
use DATABASE_NAME
```

如果数据库不存在，则创建数据库，否则切换到指定数据库

刚创建的数据库并不在数据库的列表中`show dbs`， 要显示它，需要至少插入一个文档，空的数据库是不显示出来的。

**注**：MongoDB 中默认的数据库为 test，如果你没有创建新的数据库，集合将存放在 test 数据库中。

### 查看数据库

`show dbs` 查看所有的数据库

`db` 查看当前所在数据库

#### 删除数据库

MongoDB 删除数据库的语法格式如下：

```mysql
db.dropDatabase()
```

**删除当前数据库**，默认为 test，你可以使用 db 命令查看当前数据库名。

## 集合

### 创建集合

语法格式：

```mysql
db.createCollection(name, options)
# 创建固定集合 mycol，整个集合空间大小 6142800 KB, 文档最大个数为 10000 个。
db.createCollection("mycol", { capped : true, autoIndexId : true, size : 
   6142800, max : 10000 } )
```

参数说明：

- name: 要创建的集合名称
- options: 可选参数, 指定有关内存大小及索引的选项

options 可以是如下参数：

| 字段          | 类型 | 描述                                                         |
| :------------ | :--- | :----------------------------------------------------------- |
| `capped`      | 布尔 | （可选）如果为 true，则创建固定集合。固定集合是指有着固定大小的集合，当达到最大值时，它会自动覆盖最早的文档。 **当该值为 true 时，必须指定 size 参数。** |
| `autoIndexId` | 布尔 | （可选）如为 true，自动在 _id 字段创建索引。默认为 false。   |
| `size`        | 数值 | （可选）为固定集合指定一个最大值（以字节计）。 **如果 capped 为 true，也需要指定该字段。** |
| `max`         | 数值 | （可选）指定固定集合中包含文档的最大数量。                   |

在插入文档时，MongoDB首先检查上限集合`capped`字段的大小，然后检查`max`字段。

在 MongoDB 中，你不需要创建集合。当你插入一些文档时，MongoDB 会自动创建集合。

```mysql
# 自动创建集合 mycol2
> db.mycol2.insert({"name" : "菜鸟教程"})
> show collections
mycol2
```

### 查看集合

在数据库中，我们可以先通过 **show collections** 命令查看已存在的集合：

### 删除集合

集合删除语法格式如下：

```mysql
#如果成功删除选定集合，则 drop() 方法返回 true，否则返回 false。
db.collection.drop() 

# 删除集合myCollection
db.mycol.drop()
```

## 数据类型

MongoDB 中可以使用的类型如下表所示：

| **类型**                | **数字** | **备注**                                                     |
| :---------------------- | :------- | :----------------------------------------------------------- |
| Double                  | 1        | 用于存储双精度浮点数                                         |
| String                  | 2        | MongoDB中的字符串必须为 UTF-8                                |
| Object                  | 3        | 此数据类型用于嵌入式文档。                                   |
| Array                   | 4        | 用于将数组或列表或多个值存储到一个键中                       |
| Binary data             | 5        | 用于存储二进制数据                                           |
| Undefined               | 6        | 已废弃。                                                     |
| Object id               | 7        | 用于存储文档的ID                                             |
| Boolean                 | 8        | 此类型用于存储布尔值(`true` / `false`)值。                   |
| Date                    | 9        | 用于以UNIX时间格式存储当前日期或时间                         |
| Null                    | 10       | 此类型用于存储`Null`值。                                     |
| Regular Expression      | 11       | 用于存储正则表达式                                           |
| JavaScript              | 13       | 用于存储JavaScript代码                                       |
| Symbol                  | 14       | 该数据类型与字符串相同; 但是，通常保留用于使用特定符号类型的语言。 |
| JavaScript (with scope) | 15       |                                                              |
| 32-bit integer          | 16       | 此类型用于存储数值。 整数可以是`32`位或`64`位，具体取决于服务器。 |
| Timestamp               | 17       | `ctimestamp`，当文档被修改或添加时，可以方便地进行录制。     |
| 64-bit integer          | 18       | 此类型用于存储数值。 整数可以是`32`位或`64`位，具体取决于服务器。 |
| Min key                 | 255      | Query with `-1`.此类型用于将值与最小和最大`BSON`元素进行比较 |
| Max key                 | 127      | 此类型用于将值与最小和最大`BSON`元素进行比较                 |



## 文档

### 插入文档

#### insert()

MongoDB 使用 `insert()` 或 `save()` 方法向集合中插入文档，语法如下：

```mysql
db.COLLECTION_NAME.insert(document)
```

```mysql
# 实例
> db.mycol1.insert({title:"first document",detail:"this is my first document in mongodb",time:"2019-5-24 15:54"})
# 插入成功
> WriteResult({ "nInserted" : 1 })
```

以上实例中 mycol1是我们的集合名，如果该集合不在该数据库中， MongoDB 会自动创建该集合并插入文档。

我们也可以将数据定义为一个变量，如下所示：

```mysql
# 定义变量
> document=({title:"second document",detail:"this is my second document in mongodb",time:"2019-5-24 15:57"})
{
	"title" : "second document",
	"detail" : "this is my second document in mongodb",
	"time" : "2019-5-24 15:57"
}
# 执行插入操作
> db.mycol1.insert(document)
WriteResult({ "nInserted" : 1 })

```

#### insertOne()/insertMany()

-  db.collection.insertOne():向指定集合中插入一条文档数据
-  db.collection.insertMany():向指定集合中插入多条文档数据

```mysql
#  插入单条数据

> var document = db.collection.insertOne({"a": 3})
> document
{
        "acknowledged" : true,
        "insertedId" : ObjectId("571a218011a82a1d94c02333")
}

#  插入多条数据
> db.mycol1.insertMany([{a:"1"},{b:"2"}])
{
	"acknowledged" : true,
	"insertedIds" : [
		ObjectId("5ce7a4b1306737bece79d696"),
		ObjectId("5ce7a4b1306737bece79d697")
	]
}

```

### 更新文档

MongoDB 使用 **update()** 和 **save()** 方法来更新集合中的文档。

#### update() 方法

update() 方法用于更新已存在的文档。语法格式如下：

```mysql
db.collection.update(
   <query>,
   <update>,
   {
     upsert: <boolean>,
     multi: <boolean>,
     writeConcern: <document>
   }
)
```

**参数说明：**

- **query** : update的查询条件，**类似sql update查询内where后面的**。
- **update** : update的对象和一些更新的操作符（如$,$inc...）等，也可以理解为sql update查询内set后面的
- **upsert** : 可选，这个参数的意思是，如果不存在update的记录，是否插入objNew,true为插入，默认是false，不插入。
- **multi** : 可选，mongodb 默认是false,只更新找到的第一条记录，如果这个参数为true,就把按条件查出来多条记录全部更新。
- **writeConcern** :可选，抛出异常的级别。

```mysql
 > db.mycol1.update({title:"first document"},{$set:{title:"first document new"}})
```

以上语句只会修改第一条发现的文档，如果你要修改多条相同的文档，则需要设置 multi 参数为 true。

```mysql
 > db.mycol1.update({title:"first document"},{$set:{title:"first document new"}},{multi:true})
# 通过`{title:"first document"}`来查找要修改的文档，然后通过`{$set:{title:"first document new"}}`对文档做修改，`{multi:true}`表明只要满足条件的文档都修改，默认只修改第一条。
```

#### 更新操作符

##### $set

当想更改用户的兴趣资料时，使用"$set" 然后将要更新的内容作为键“hobby”的值（下面的示例中将数组作为键值）：

```mysql
db.users.update({"_id" : ObjectId("51826852c75fdd1d8b805801")}, {"$set" : {"hobby" :["swimming","basketball"]}} )
```

##### $unset

若要完全删除键“hobby”,使用“$unset”即可：

```mysql
db.users.update({"_id" : ObjectId("51826852c75fdd1d8b805801")},{"$unset" : {"hobby" :1 }} )
```

##### $inc

"$inc"修改器用来增加已有键的值，或者在键不存在时创建一个键。$inc就是专门来增加（和减少）数字的。"$inc"只能用于整数、长整数或双精度浮点数。要是用在其他类型的数据上就会导致操作失败。

例如毎次有人访问该博文，该条博文的浏览数就加1，用键"pageviews"保存浏览数信息。下面使用"$inc”修改器增加"pageviews"的值 

```mysql
db.posts.update({"_id" : ObjectId("5180f1a991c22a72028238e4")}, {"$inc":{"pageviews":1}})
```

上面执行update时如果将键值设置为n,那么就表示该键的值增加n(n可以为负数)。

##### $rename

$rename操作符可以重命名字段名称，新的字段名称不能和文档中现有的字段名相同。如果文档中存在A、B字段，将B字段重命名为A,$rename会将A字段和值移除掉，然后将B字段名改为A.

集合students中的一条文档数据：

```mysql
{ "_id": 1, "nickname": [ "The American Cincinnatus", "The American Fabius" ], "cell": "555-555-5555", "name": { "first" : "george", "last" : "washington" } }
```

将集合中"nickname"字段名重命名为“alias”、"cell"字段名重命名为"mobile"：

```mysql
db.students.update( { _id: 1 }, { $rename: { 'nickname': 'alias', 'cell': 'mobile' } } )
```

$rename操作符也可以将子文档中键值移到其他子文档中。

```mysql
db.students.update( { _id: 1 }, { $rename: { "name.last": "contact.lname" } } )
```

我们将名为name的子文档中的last字段，重名为“lname”,同时将其移动到子文档contact中，若contact字段不存在，数据库会新建该字段。

若指定的字段在集合中不存在，$rename操作符将不会有任何影响。

##### `.`操作符

当重命名子文档字段名时需要使用"."操作符，格式：值为该子文档的字段名.子文档中字段名。

```mysql
db.students.update( { _id: 1 }, { $rename: { "name.first": "name.fname" } } )
```

执行上面的更新操作将name字段的值中first字段重命名为fname.

##### upsert

upsert是一种特殊的更新操作，不是一个操作符。（upsert = up[date]+[in]sert）

##### setOnInsert



##### $push

使用"$push"对该文档添加一条评论信息。

```mysql
db.posts.update({"title":"MongoDB"},{$push:{"comments":{"name":"egger","content":"thks!"}}})
```

##### $pull

$pull修饰符会删除掉数组中符合条件的元素

```mysql
{ $pull: { <field1>: <value|condition>, <field2>: <value|condition>, ... } }  
```

```mysql
-- 执行前
{ _id: 1, votes: [ 3, 5, 6, 7, 7, 8 ] }  

-- 执行
db.profiles.update( { _id: 1 }, { $pull: { votes: { $gte: 6 } } } )   

-- 执行后
{ _id: 1, votes: [  3,  5 ] } 
```





#### save() 方法

save() 方法通过传入的文档来替换已有文档。语法格式如下：

```mysql
db.collection.save(
   <document>,
   {
     writeConcern: <document>
   }
)

```

**参数说明：**

- **document** : 文档数据。
- **writeConcern** :可选，抛出异常的级别。

MongoDB save()方法的基本语法如下所示：

```mysql
> db.mycol1.find()
{ "_id" : ObjectId("5ce7a4b1306737bece79d696"), "a" : "1" }
> db.COLLECTION_NAME.save({_id:ObjectId(),NEW_DATA})

# 修改"_id":ObjectId("5ce7a4b1306737bece79d696" 这条文档
> db.mycol1.save({"_id":ObjectId("5ce7a4b1306737bece79d696"),a:"new 1"})
WriteResult({ "nMatched" : 1, "nUpserted" : 0, "nModified" : 1 })

> db.mycol1.find()
{ "_id" : ObjectId("5ce7a4b1306737bece79d696"), "a" : "new 1" }
```

### 删除文档

MongoDB remove()函数是用来移除集合中的数据。在执行remove()函数前先执行find()命令来判断执行的条件是否正确，这是一个比较好的习惯。

**注**：remove() 方法已经过时了，现在官方推荐使用 `deleteOne()` 和 `deleteMany()` 方法。

#### remove

```mysql
db.collection.remove(
   <query>,
   {
     justOne: <boolean>,
     writeConcern: <document>
   }
)
```

**参数说明：**

- **query** :（可选）删除的文档的条件。
- **justOne** : （可选）如果设为 true 或 1，则只删除一个文档，如果不设置该参数，或使用默认值 false，则删除所有匹配条件的文档。
- **writeConcern** :（可选）抛出异常的级别。

```mysql
# 插入两条相同数据
> db.mycol1.insert({title:"test"})
> db.mycol1.insert({title:"test"})
> db.mycol1.find()
{ "_id" : ObjectId("5ce7a805306737bece79d698"), "title" : "test" }
{ "_id" : ObjectId("5ce7a806306737bece79d699"), "title" : "test" }
# 删除
> db.mycol1.remove({title:"test"})
# 删了两条数据
WriteResult({ "nRemoved" : 2 })

```

如果你只想删除第一条找到的记录可以设置 justOne 为 1，如下所示：

```mysql
>db.COLLECTION_NAME.remove(DELETION_CRITERIA,1)
```

如果你想删除所有数据，可以使用以下方式（类似常规 SQL 的 truncate 命令）：

```mysql
>db.col.remove({})
```

#### delete

语法类似

```mysql
db.collection.deleteOne(
   <query>
)
db.collection.deleteMany(
   <query>
)
```

如删除集合下全部文档：

```mysql
db.inventory.deleteMany({})
```

删除 status 等于 A 的全部文档：

```mysql
db.inventory.deleteMany({ status : "A" })
```

删除 status 等于 D 的一个文档：

```mysql
db.inventory.deleteOne( { status: "D" } )
```

### 查询文档

MongoDB 查询文档使用 find() 方法。

find() 方法以非结构化的方式来显示所有文档。

MongoDB 查询数据的语法格式如下：

```mysql
>db.collection.find(query, projection)
```

- **query** ：可选，使用查询操作符指定查询条件
- **projection** ：可选，使用投影操作符指定返回的键。查询时返回文档中所有键值， 只需省略该参数即可（默认省略）。

如果你需要以易读的方式来读取数据，可以使用 pretty() 方法，语法格式如下：

```mysql
>db.col.find().pretty()
```

`pretty()` 方法以`格式化`的方式来显示所有文档。

```mysql
> db.mycol1.find()
{ "_id" : ObjectId("5ce7a339306737bece79d694"), "title" : "first document new", "detail" : "this is my first document in mongodb", "time" : "2019-5-24 15:54" }
{ "_id" : ObjectId("5ce7a41c306737bece79d695"), "title" : "second document", "detail" : "this is my second document in mongodb", "time" : "2019-5-24 15:57" }
{ "_id" : ObjectId("5ce7a4b1306737bece79d696"), "a" : "new 1" }
{ "_id" : ObjectId("5ce7a4b1306737bece79d697"), "b" : "2" }
{ "_id" : "5ce7a4b1306737bece79d697", "a" : "new 1" }

# 格式化查询
> db.mycol1.find().pretty()
{
	"_id" : ObjectId("5ce7a339306737bece79d694"),
	"title" : "first document new",
	"detail" : "this is my first document in mongodb",
	"time" : "2019-5-24 15:54"
}
{
	"_id" : ObjectId("5ce7a41c306737bece79d695"),
	"title" : "second document",
	"detail" : "this is my second document in mongodb",
	"time" : "2019-5-24 15:57"
}
{ "_id" : ObjectId("5ce7a4b1306737bece79d696"), "a" : "new 1" }
{ "_id" : ObjectId("5ce7a4b1306737bece79d697"), "b" : "2" }
{ "_id" : "5ce7a4b1306737bece79d697", "a" : "new 1" }
```

## MongoDB 与 关系型数据库的语句比较

### Where 语句

如果你熟悉常规的 SQL 数据，通过下表可以更好的理解 MongoDB 的条件语句查询：

#### 等于

```mysql
# 格式：{<key>:<value>}
db.col.find({"title":"first document"}).pretty() ---> where title = 'first document'

```

#### 小于

```mysql
# 格式：{<key>:{$lt:<value>}}
db.col.find({"likes":{$lt:50}}).pretty() ---> where likes < 50
```

#### 小于或等于

```mysql
# 格式： {<key>:{$lte:<value>}}
db.col.find({"likes":{$lte:50}}).pretty() --->where likes <= 50
```

#### 大于

```mysql
# 格式： {<key>:{$gt:<value>}}
db.col.find({"likes":{$gt:50}}).pretty() ---> where likes > 50
```

#### 大于或等于

```mysql
# 格式： {<key>:{$gte:<value>}}
db.col.find({"likes":{$gte:50}}).pretty() ---> where likes >= 50
```

#### 不等于

```mysql
# 格式： {<key>:{$ne:<value>}}	
db.col.find({"likes":{$ne:50}}).pretty() ---> where likes != 50
```

#### 例子

```mysql
> db.mycol1.find()
{ "_id" : ObjectId("5ce7af1a75e9cc4d54d3c5b7"), "score" : 10 }
{ "_id" : ObjectId("5ce7af1c75e9cc4d54d3c5b8"), "score" : 20 }
{ "_id" : ObjectId("5ce7af1f75e9cc4d54d3c5b9"), "score" : 30 }
{ "_id" : ObjectId("5ce7af2575e9cc4d54d3c5ba"), "score" : 40 }
{ "_id" : ObjectId("5ce7af2875e9cc4d54d3c5bb"), "score" : 50 }
{ "_id" : ObjectId("5ce7af2b75e9cc4d54d3c5bc"), "score" : 60 }
{ "_id" : ObjectId("5ce7af2d75e9cc4d54d3c5bd"), "score" : 70 }
{ "_id" : ObjectId("5ce7af2f75e9cc4d54d3c5be"), "score" : 80 }
{ "_id" : ObjectId("5ce7af3175e9cc4d54d3c5bf"), "score" : 90 }
{ "_id" : ObjectId("5ce7af3475e9cc4d54d3c5c0"), "score" : 100 }
# 查询“score”大于80的
> db.mycol1.find({"score":{$gt:80}})
{ "_id" : ObjectId("5ce7af3175e9cc4d54d3c5bf"), "score" : 90 }
{ "_id" : ObjectId("5ce7af3475e9cc4d54d3c5c0"), "score" : 100 }
# 查询“score”小于21的
> db.mycol1.find({"score":{$lt:21}})
{ "_id" : ObjectId("5ce7af1a75e9cc4d54d3c5b7"), "score" : 10 }
{ "_id" : ObjectId("5ce7af1c75e9cc4d54d3c5b8"), "score" : 20 }

```

### MongoDB  AND 条件

MongoDB 的 find() 方法可以传入多个键(key)，每个键(key)以逗号隔开，即常规 SQL 的 AND 条件。

语法格式如下：

```mysql
>db.col.find({key1:value1, key2:value2}).pretty()
# score=92 AND age=23
> db.mycol1.find({"score":92,"age":23})
{ "_id" : ObjectId("5ce7b0b075e9cc4d54d3c5c1"), "score" : 92, "age" : 23 }

```

### MongoDB OR 条件

MongoDB OR 条件语句使用了关键字 **$or**,语法格式如下：

```mysql
>db.col.find(
   {
      $or: [
         {key1: value1}, {key2:value2}
      ]
   }
).pretty()
```



```mysql
# score=89 or age=23
> db.mycol1.find({$or:[{"score":89},{"age":23}]})
{ "_id" : ObjectId("5ce7b0b075e9cc4d54d3c5c1"), "score" : 92, "age" : 23 }
{ "_id" : ObjectId("5ce7b12a75e9cc4d54d3c5c2"), "score" : 89, "age" : 23 }

```

### AND 和 OR 联合使用

```mysql
# where age<25 AND (score = 92 OR score = 89)
> db.mycol1.find({"age":{$lt:25},$or:[{"score":89},{"score":92}]})
{ "_id" : ObjectId("5ce7b0b075e9cc4d54d3c5c1"), "score" : 92, "age" : 23 }
{ "_id" : ObjectId("5ce7b12a75e9cc4d54d3c5c2"), "score" : 89, "age" : 23 }
```

## 模糊查询

查询 title 包含"教"字的文档：

```
db.col.find({title:/教/})
```

查询 title 字段以"教"字开头的文档：

```
db.col.find({title:/^教/})
```

查询 title字段以"教"字结尾的文档：

```
db.col.find({title:/教$/})
```

查询title 字段是 string 类型的

```mysql
db.mycol1.find({"title" : {$type : 'string'}})
```



## 条件操作符

```
$gt -------- greater than  >

$gte --------- gt equal  >=

$lt -------- less than  <

$lte --------- lt equal  <=

$ne ----------- not equal  !=

$eq  --------  equal  =
```

## MongoDB Limit与Skip方法

### MongoDB Limit() 方法

如果你需要在MongoDB中读取指定数量的数据记录，可以使用MongoDB的Limit方法，limit()方法接受一个数字参数，该参数指定从MongoDB中读取的记录条数。

limit()方法基本语法如下所示：

```mysql
>db.COLLECTION_NAME.find().limit(NUMBER)
# 查询 score 大于40 的 前5条数据
>db.mycol1.find({"score":{$gt:40}}).limit(5)

{ "_id" : ObjectId("5ce7af2875e9cc4d54d3c5bb"), "score" : 50 }
{ "_id" : ObjectId("5ce7af2b75e9cc4d54d3c5bc"), "score" : 60 }
{ "_id" : ObjectId("5ce7af2d75e9cc4d54d3c5bd"), "score" : 70 }
{ "_id" : ObjectId("5ce7af2f75e9cc4d54d3c5be"), "score" : 80 }
{ "_id" : ObjectId("5ce7af3175e9cc4d54d3c5bf"), "score" : 90 }
```

### MongoDB Skip() 方法

我们除了可以使用limit()方法来读取指定数量的数据外，还可以使用skip()方法来跳过指定数量的数据，skip方法同样接受一个数字参数作为跳过的记录条数。

skip() 方法脚本语法格式如下：

```mysql
>db.COLLECTION_NAME.find().limit(NUMBER).skip(NUMBER)
# 查询 score 大于40 的 前5条数据 跳过第一条数据 可以看到前面的第一条数据50 没有了
> db.mycol1.find({"score":{$gt:40}}).limit(5).skip(1)
{ "_id" : ObjectId("5ce7af2b75e9cc4d54d3c5bc"), "score" : 60 }
{ "_id" : ObjectId("5ce7af2d75e9cc4d54d3c5bd"), "score" : 70 }
{ "_id" : ObjectId("5ce7af2f75e9cc4d54d3c5be"), "score" : 80 }
{ "_id" : ObjectId("5ce7af3175e9cc4d54d3c5bf"), "score" : 90 }
{ "_id" : ObjectId("5ce7af3475e9cc4d54d3c5c0"), "score" : 100 }

```

## MongoDB 排序

在 MongoDB 中使用 `sort()` 方法对数据进行排序，sort() 方法可以通过参数指定排序的字段，并使用 1 和 -1 来指定排序的方式，其中 `1` 为`升序`排列，而 `-1` 是用于`降序`排列。

sort()方法基本语法如下所示：

```mysql
>db.COLLECTION_NAME.find().sort({KEY:1})
# 对 score 字段 升序排列
> db.mycol1.find({"score":{$gt:40}}).sort({"score":1})

{ "_id" : ObjectId("5ce7af2875e9cc4d54d3c5bb"), "score" : 50 }
{ "_id" : ObjectId("5ce7af2b75e9cc4d54d3c5bc"), "score" : 60 }
{ "_id" : ObjectId("5ce7af2d75e9cc4d54d3c5bd"), "score" : 70 }
{ "_id" : ObjectId("5ce7af2f75e9cc4d54d3c5be"), "score" : 80 }
{ "_id" : ObjectId("5ce7af3175e9cc4d54d3c5bf"), "score" : 90 }
{ "_id" : ObjectId("5ce7af3475e9cc4d54d3c5c0"), "score" : 100 }
# 对 score 字段 降序排列
> db.mycol1.find({"score":{$gt:40}}).sort({"score":-1})

{ "_id" : ObjectId("5ce7af3475e9cc4d54d3c5c0"), "score" : 100 }
{ "_id" : ObjectId("5ce7af3175e9cc4d54d3c5bf"), "score" : 90 }
{ "_id" : ObjectId("5ce7af2f75e9cc4d54d3c5be"), "score" : 80 }
{ "_id" : ObjectId("5ce7af2d75e9cc4d54d3c5bd"), "score" : 70 }
{ "_id" : ObjectId("5ce7af2b75e9cc4d54d3c5bc"), "score" : 60 }
{ "_id" : ObjectId("5ce7af2875e9cc4d54d3c5bb"), "score" : 50 }
```

## MongoDB 索引

索引通常能够极大的提高查询的效率，如果没有索引，MongoDB在读取数据时必须扫描集合中的每个文件并选取那些符合查询条件的记录。

**索引是特殊的数据结构**，索引存储在一个易于遍历读取的数据集合中，索引是**对数据库表中一列或多列的值进行排序的一种结构**。

### createIndex() 方法

MongoDB使用 createIndex() 方法来创建索引。

createIndex()方法基本语法格式如下所示：

```mysql
>db.collection.createIndex(keys, options)
```

语法中 Key 值为你要创建的索引字段，1 为指定按升序创建索引，如果你想按降序来创建索引指定为 -1 即可。

```mysql
>db.col.createIndex({"title":1})
```

createIndex() 方法中你也可以设置使用多个字段创建索引（关系型数据库中称作复合索引）。

```mysql
>db.col.createIndex({"title":1,"description":-1})
```

### 参数列表

createIndex() 接收可选参数，可选参数列表如下：

| Parameter          | Type          | Description                                                  |
| :----------------- | :------------ | :----------------------------------------------------------- |
| background         | Boolean       | 建索引过程会阻塞其它数据库操作，background可指定以后台方式创建索引，即增加 "background" 可选参数。 "background" 默认值为**false**。 |
| unique             | Boolean       | 建立的索引是否唯一。指定为true创建唯一索引。默认值为**false**. |
| name               | string        | 索引的名称。如果未指定，MongoDB的通过连接索引的字段名和排序顺序生成一个索引名称。 |
| dropDups           | Boolean       | **3.0+版本已废弃。**在建立唯一索引时是否删除重复记录,指定 true 创建唯一索引。默认值为 **false**. |
| sparse             | Boolean       | 对文档中不存在的字段数据不启用索引；这个参数需要特别注意，如果设置为true的话，在索引字段中不会查询出不包含对应字段的文档.。默认值为 **false**. |
| expireAfterSeconds | integer       | 指定一个以秒为单位的数值，完成 TTL设定，设定集合的生存时间。 |
| v                  | index version | 索引的版本号。默认的索引版本取决于mongod创建索引时运行的版本。 |
| weights            | document      | 索引权重值，数值在 1 到 99,999 之间，表示该索引相对于其他索引字段的得分权重。 |
| default_language   | string        | 对于文本索引，该参数决定了停用词及词干和词器的规则的列表。 默认为英语 |
| language_override  | string        | 对于文本索引，该参数指定了包含在文档中的字段名，语言覆盖默认的language，默认值为 language. |

在后台创建索引：

```mysql
db.values.createIndex({open: 1, close: 1}, {background: true})
```

通过在创建索引时加 background:true 的选项，让创建工作在后台执行

### 其他索引操作

1、查看集合索引

```mysql
db.collection.getIndexes()
```

2、查看集合索引大小

```mysql
db.collection.totalIndexSize()
```

3、删除集合所有索引

```mysql
db.collection.dropIndexes()
```

4、删除集合指定索引

```mysql
db.collection.dropIndex("索引名称")
```
