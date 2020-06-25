# MongoDB基础操作





### $setOnInsert upsert:true

在mongo中，有一个命令非常的方便，就是upsert，顾名思义就是update+insert的作用

根据条件判断有无记录，有的话就更新记录，没有的话就插入一条记录

upsert:true:如果要更新的文档不存在的话会插入一条新的记录

`$setOnInsert`操作符会将指定的值赋值给指定的字段，如果要更新的文档存在那么`$setOnInsert`操作符不做任何处理；

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

当`"name":"tom"`这条数据存在时则更新`updateTime`字段为12346，若不存在则会创建一条新数据。**这条新数据会包含`filter`,`$set`,`$setInInsert`三个地方指定的所有数据**

```sh
{
 name:"tom",
 updateTime: 12346,
 createTime: 12345,
}
```

`opts := options.Update().SetUpsert(true)`必须 指定`upsert=true`,否则`$setOnInsert`无效

注意:`$set`和`$setOnIsert` 不能对同一字段使用,



go代码

```go
func (ui *userInfo) Upsert(req *model.UserInfoReq) error {
	var filter bson.M
	if len(req.ID) != 0 {
		objId, err := primitive.ObjectIDFromHex(req.ID)
		if err != nil {
			return err
		}
		filter = bson.M{
			"_id": objId,
		}
	}

	update := bson.M{
		"$setOnInsert": bson.M{
			"CreateTime": time.Now().Unix(),
		},
		"$set": bson.M{
			"UserName":   req.UserName,
			"Password":   req.Password,
			"Age":        req.Age,
			"Phone":      req.Phone,
			"UpdateTime": time.Now().Unix(),
		},
	}
	opts := options.Update().SetUpsert(true)
	_, err := ui.GetColl().UpdateOne(context.Background(), filter, update, opts)
	if err != nil {
		logrus.Error(err)
	}
	return nil
}

```

根据id来查找文档。

最开始新建的时候id为空 肯定找不到所以会新建。

新建之后带着id就能查找到文档了 就会执行update。

