# Aggregate



## match



## group

将document分组，用作统计结果

> `_id`字段表示你要基于哪个字段来进行分

```d

    db.Ubisoft.aggregate([ // aggregate方法接收的是一个数组
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

