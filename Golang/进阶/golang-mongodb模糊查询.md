# MongoDB模糊查询

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

