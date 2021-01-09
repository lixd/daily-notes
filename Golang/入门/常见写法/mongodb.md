# MongoDB高级用法

## 1. 模糊查询

## Golang

```go
//测试模糊查询
func TestRegexQuery(t *testing.T) {
    //"$regex"表示字符串匹配，"$options": "$i"表示不区分大小写
    // 查询ImagePath中包含.png的结果
	filter := bson.M{
		"ImagePath": bson.M{
			"$regex": ".png", "$options": "$i"}}

	cursor, err := mongodb.GetImageCollection(new(systemmodel.LocusImage)).Find(context.Background(), filter)

```

## 2. 聚合查询

常见的mongo的聚合操作和mysql的查询对比：

| SQL 操作/函数 | mongodb聚合操作        |
| ------------- | ---------------------- |
| where         | $match                 |
| group by      | $group                 |
| having        | $match                 |
| select        | $project               |
| order by      | $sort                  |
| limit         | $limit                 |
| sum()         | $sum                   |
| count()       | $sum                   |
| join          | $lookup  （v3.2 新增） |

### 2.1 统计

```mysql
db.orders.aggregate( [
   {
     $group: {
        _id: null,
        count: { $sum: 1 }
     }
   }
] )

类似mysql:
SELECT COUNT(*) AS count   FROM orders
```

### 2.2 求和

```mysql
db.orders.aggregate( [
   {
     $group: {
        _id: null,
        total: { $sum: "$price" }
     }
   }
] )

类似mysql;
SELECT SUM(price) AS total  FROM orders
```

### 2.3 分组

其中`_id`为固定值 可与看做是关键字 后面的`date`才表示按照日期分组

```go
	pilepine := bson.A{
		bson.M{"$match": bson.M{"type": model.MockLogReward}},
		bson.M{"$group": bson.M{"_id": "$date", "TotalAmount": bson.M{"$sum": "$amount"}}},
		bson.M{"$sort": bson.M{"date": -1}},
	}
```



## 写法

多个`filter`条件时可以用`bson.M`直接添加

```go
var filter = bson.M{"_id": _id}
filter["status"] = bson.M{"$ne": 1}
filter["create"] = bson.M{"$gte": 1580292861}
...
```



### 聚合查询

结果直接`map[string]interface{}`在接收

```go
func (c *mockLogService) QueryStatic(count int) (float64, error) {
	pilepine := bson.A{
		bson.M{"$match": bson.M{"type": model.MockLogReward}},
		bson.M{"$group": bson.M{"_id": "$date", "TotalAmount": bson.M{"$sum": "$amount"}}},
		bson.M{"$sort": bson.M{"date": -1}},
	}

	cursor, err := c.GetColl().Aggregate(context.Background(), pilepine)
	if HandleError("err when find MockLogs", err) {
		return -1, err
	}

	if cursor.Next(context.Background()) {
		var m = make(map[string]interface{})
		err := cursor.Decode(&m)
		if HandleError("sum error", err) {
			return 0, err
		}
		return m["totalAmount"].(float64), err
	}
	if err := cursor.Err(); err != nil {
		HandleError("cursor error", err)
	}
	return 0, err
}
```

