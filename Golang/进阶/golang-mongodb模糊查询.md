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

option的值包含：

- i(不区分大小写)，
- m(当使用^与$符号模糊匹配时，作用于屏蔽中间的换行符) ,
- x(忽略注释，以#开头 /n结尾)，
- s(允许所有字符包括换行符参与模糊匹配)

对比

| MySQL                                          | MongoDB                                 |
| ---------------------------------------------- | --------------------------------------- |
| select * from student where name like ‘%jack%’ | db.student.find({name:{$regex:/jack/}}) |
| select * from student where name regexp ‘jack’ | db.student.find({name:/jack/})          |

