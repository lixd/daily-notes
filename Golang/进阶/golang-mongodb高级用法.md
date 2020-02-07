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



## 写法

多个`filter`条件时可以用`bson.M`直接添加

```go
var filter = bson.M{"_id": _id}
filter["status"] = bson.M{"$ne": 1}
filter["create"] = bson.M{"$gte": 1580292861}
...
```

