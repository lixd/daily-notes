# Aggregate



## match

过滤条件

```go
db.UserInfo.aggregate([ 
        {
            $match: {
               "Status":1
            },
        }
    ]) 

// 指定只查询Status为1的
bson.M{"$match": bson.M{"Status": 1}},
```



## group

将document分组，用作统计结果

> `_id`字段表示你要基于哪个字段来进行分组

```d

    db.UserInfo.aggregate([ // aggregate方法接收的是一个数组
        {
            $group: {
                _id: '$time', 
                num: {$sum: 1}
            }
        }
    ])
    // 这里的_id字段表示你要基于哪个字段来进行分组(即制定字段值相同的为一组)，这里的$time就表示要基于time字段来进行分组

    // 下面的num字段的值$sum: 1表示的是获取满足time字段相同的这一组的数量乘以后面给定的值(本例为1，那么就是同组的数量)。
```





##  demo

```go
// QueryActive 查询生效的个数
func (m *mAdList) QueryActive(adType int) ([]QueryActive, error) {
	var (
		list = make([]QueryActive, 0)
		item = QueryActive{}
	)

	pip := bson.A{
		bson.M{"$match": bson.M{"Status": madvert.StatusActive}},
		bson.M{"$group": bson.M{"_id": "$AdType", "Count": bson.M{"$sum": 1}}},
	}
	cursor, err := m.GetColl().Aggregate(context.Background(), pip)
	if err != nil {
		if err != mongo.ErrNoDocuments {
			logrus.WithFields(logrus.Fields{"Scenes": mAdListTag + "查询生效个数失败"}).Error(err)
		}
		return list, err
	}
	defer cursor.Close(context.Background())
	for cursor.Next(context.Background()) {
		if err := cursor.Decode(&item); err != nil {
			logrus.WithFields(logrus.Fields{"Scenes": "decode error"}).Error(err)
			continue
		}
		list = append(list, item)
	}
	return list, nil
}
```

