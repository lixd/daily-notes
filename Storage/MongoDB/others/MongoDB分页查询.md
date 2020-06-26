# MongoDB 分页查询

## 使用 skip() 和 limit() 实现

```go
//Page 1
db.users.find().limit (10)
//Page 2
db.users.find().skip(10).limit(10)
//Page 3
db.users.find().skip(20).limit(10)
........
```

抽象一下就是：检索第n页的代码应该是这样的

```go
db.users.find().skip(pagesize*(n-1)).limit(pagesize)
```

当然，这是假定在你在2次查询之间没有任何数据插入或删除操作，你的系统能么？

当然大部分oltp系统无法确定不更新，所以skip只是个玩具，没太大用

**不要轻易使用Skip来做查询，否则数据量大了就会导致性能急剧下降，这是因为Skip是一条一条的数过来的，多了自然就慢了**。

```go
db.test.sort({"amount":1}).skip(100000).limit(10)  //183ms
 
db.test.find({amount:{$gt:2399927}}).sort({"amount":1}).limit(10)  //53ms
```

**MongoDB会根据查询，来加载文档的索引和元数据到内存里，并且建议文档元数据的大小始终要保持小于机器内存，否则性能会下降。**

如果你要处理大量数据集，你需要考虑别的方案的。

## 使用 find() 和 limit() 实现

之前用skip()方法没办法更好的处理大规模数据，所以我们得找一个skip的替代方案。

为此我们想平衡查询，就考虑根据文档里有的时间戳或者id

在这个例子中，我们会通过‘_id’来处理（用时间戳也一样，看你设计的时候有没有类似created_at这样的字段）。

‘_id’是mongodb ObjectID类型的，ObjectID 使用12 字节的存储空间，每个字节两位十六进制数字，是一个24 位的字符串，包括timestamp, machined, processid, counter 等。下面会有一节单独讲它是怎么构成的，为啥它是唯一的。

使用_id实现分页的大致思路如下

* 1.在当前页内查出最后1条记录的`_id`，记为`last_id`
* 2.把记下来的`last_id`，作为查询条件，查出大于`last_id`的记录作为下一页的内容

这样来说，是不是很简单？

```go
//Page 1
db.users.find().limit(pageSize);
//Find the id of the last document in this page
last_id = ...
 
//Page 2
users = db.users.find({'_id'> last_id}). limit(10);
//Update the last id with the id of the last document in this page
last_id = ...
```



## 参考

`https://blog.csdn.net/m0_38080126/article/details/77234191`

`https://blog.csdn.net/yisun123456/article/details/78256993`

