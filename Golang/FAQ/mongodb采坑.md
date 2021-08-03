# mongodb go 采坑记录

## 1. cursor.Next(ctx)

```go
func (c *conf) FindMany() ([]model.Conf, error) {
	var (
		ctx  = context.Background()
		list = make([]model.Conf, 0)
	)
	filter := bson.M{}
	cursor, err := c.GetColl().Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)
	for cursor.Next(ctx) {
		item := new(model.Conf)
		if err := cursor.Decode(item); err != nil {
			continue
		}
		list = append(list, *item)
	}
	return list, nil
}
```

重点是下面这一段

```go
	for cursor.Next(ctx) {
		item := new(model.Conf)
		if err := cursor.Decode(item); err != nil {
			continue
		}
		list = append(list, *item)
	}
```

写的时候想的是如果把`item := new(model.Conf)` 放在 for 循环里面会创建多个变量，就想"优化"一下子，把创建变量提到了for循环外：

```go
	item := new(model.Conf)
	for cursor.Next(ctx) {
		if err := cursor.Decode(item); err != nil {
			continue
		}
		list = append(list, *item)
	}
```

运行了很长一段时间都没有出现问题，知道某次新增了一些字段，导致MongoDB中的不同记录的字段是不同的。

然后就悲剧了，如果记录A有10个字段，执行`cursor.Decode(item)`之后 item 里10个字段都被赋值了，然后记录B只有5个字段，再次执行`cursor.Decode(item)`之后，把item 里的5个字段更新了，但是另外5个字段，记录B里是没有的，正常情况下应该是默认值，但是在这种写法下，item 里另外5个字段是记录A的值。

导致后续逻辑出现了一些问题，找了很久才排查到 mongodb 这个写法这里来。