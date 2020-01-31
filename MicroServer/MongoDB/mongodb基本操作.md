# MongoDB基础操作





### $setOnInsert upsert:true

在mongo中，有一个命令非常的方便，就是upsert，顾名思义就是update+insert的作用

根据条件判断有无记录，有的话就更新记录，没有的话就插入一条记录

upsert:true:如果要更新的文档不存在的话会插入一条新的记录

$setOnInsert操作符会将指定的值赋值给指定的字段，如果要更新的文档存在那么$setOnInsert操作符不做任何处理；

> 比如实现更新数据，如果一些需要更新的，就用$set更新，如果有些如创建日期这种字段，那么使用$setOnInsert设置

```sh
	filter := bson.M{
		"name":"tom"
	}

	update := bson.M{
		"$set": bson.M{
			"updateTime": 12346,
		},
		"$setOnInsert": bson.M{
			"createTime": 12345,
		},
	}
	opts := options.Update().SetUpsert(true)
	_, err = c.GetColl().UpdateOne(context.Background(), filter, update, opts)
```

当`"name":"tom"`这条数据存在时则更新`updateTime`字段为12346，若不存在则会创建一条新数据、

**会包含`filter`,`$set`,`$setInInsert`三个地方指定的所有数据**

```sh
{
 name:"tom",
 updateTime: 12346,
 createTime: 12345,
}
```

`opts := options.Update().SetUpsert(true)`必须 指定`upsert=true`,否则`$setOnInsert`无效

注意:$set和$setOnIsert 不能对同一字段使用,