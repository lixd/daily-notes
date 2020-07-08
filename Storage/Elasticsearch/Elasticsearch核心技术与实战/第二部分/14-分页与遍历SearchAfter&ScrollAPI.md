# 分页与遍历

## From 、Size

* 默认情况下，查询按照相关度算分排序，返回前 10 条记录
* 容易理解的分页方案
  * From - 开始位置
  * Size - 期望获取的文档总数

## 分布式系统 深度分页问题

* ES 天生就是分布式的。查询信息，但是数据分别保存在多个分片，多台机器上，ES 天生就需要满足排序的需要（按照相关性算分）
* 当一个查询：From =990，Size = 10
  * 会在每个分片上都先获取 990+10 总计 1000 个文档。然后通过 Coordinating Node 聚合所有结果。最后再对汇总结果排序选取前 1000 个文档。
  * 页数越深，占用内存越多。为了避免深度分页带来的内存开销。 ES 有一个设定，默认限定到 10000 个文档
    * index.max.result_window

 ## Search After 避免深度分页

* 避免深度分页的性能问题，可以实时获取下一页文档信息
  * 不支持指定页数（From）
  * 只能往下翻
* 第一步搜索需要指定 sort，并且保证值是唯一的（可以通过加入 _id 保证唯一性）
* 然后使用上一次，最后一个文档的 sort 值进行查询

> 数据库中分页也是推荐这样， skip or offset 都会消耗大量资源，直接通过上一次查询的最后一条记录来指定查询下一页数据
>
> [数据列表]([https://github.com/geektime-geekbang/geektime-ELK/blob/master/part-2/5.7-%E5%88%86%E9%A1%B5%E4%B8%8E%E9%81%8D%E5%8E%86-FromSize%26SearchAfter%26ScrollAPI/README.md](https://github.com/geektime-geekbang/geektime-ELK/blob/master/part-2/5.7-分页与遍历-FromSize%26SearchAfter%26ScrollAPI/README.md))

```shell
POST users/_search
{
    "size": 1,
    "query": {
        "match_all": {}
    },
    "sort": [
        {"age": "desc"} ,
        {"_id": "asc"}    
    ]
}
# 结果中会包含 sort
        "sort" : [
          12,
          "qg5XLnMBHpO3XRV8-aT3"
        ]
```

使用 searchAfter 时把该值作为参数传入即可

```shell
POST users/_search
{
    "size": 1,
    "query": {
        "match_all": {}
    },
    "search_after":
        [
          12,
          "qg5XLnMBHpO3XRV8-aT3"
        ],
    "sort": [
        {"age": "desc"} ,
        {"_id": "asc"}    
    ]
}
```



**Search After 是如何解决深度分页问题的**

* 假定 Size 是 10
* 当查询 990 - 1000时
* **通过唯一排序值定位**，将每次要处理的文档数都控制在 Size（10） 个



## Scroll API

* 创建一个快照，有新的数据写入后，无法被查到（因为还是在原来的快照里查询的）
* 每次查询后，输入上一次的 Scroll Id

```shell
# ?scroll=5m 创建快照并指定快照保存时间 这里是 5分钟
POST /users/_search?scroll=5m
{
    "size": 1,
    "query": {
        "match_all" : {
        }
    }
}
# 返回如下 会返回一个 _scroll_id
 "_scroll_id" : "FGluY2x1ZGVfY29udGV4dF91dWlkDXF1ZXJ5QW5kRmV0Y2gBFEpnNWNMbk1CSHBPM1hSVjg3YVcyAAAAAAAAHTQWVk12NDhTaWJTdE94UUdJeEtJZWE5Zw==",
```

下次查询则将该_scroll_id传入

```shell
POST /_search/scroll
{
    "scroll" : "1m",
    "scroll_id" : "FGluY2x1ZGVfY29udGV4dF91dWlkDXF1ZXJ5QW5kRmV0Y2gBFEpnNWNMbk1CSHBPM1hSVjg3YVcyAAAAAAAAHTQWVk12NDhTaWJTdE94UUdJeEtJZWE5Zw=="
}
```

## 不同搜索类型使用场景

* Regular
  * 需要实时获取顶部的部分文档。例如查询最新的订单
* Scroll
  * 需要全部文档，例如导出全部数据
* Pagination
  * From 和 Size
  * 如需要深度分页，则选用 Search After