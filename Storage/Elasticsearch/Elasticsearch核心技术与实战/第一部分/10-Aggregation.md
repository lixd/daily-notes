# Aggregation

## 1. 什么时聚合

针对 ES 数据进行统计分析的功能。

* 实时性高

* 通过聚合，可以得到数据的概览
* 高性能，只需要一条语句，就可以从 Elasticsearch 得到分析结果



## 2. 集合分类

* 1）Bucket Aggregation --- 一些列满足特定条件的文档的集合
  * 类似于 SQL 中的 GROUP BY 分组
* 2）Metric Aggregation --- 一些数学运算，可以对文档字段进行统计分析
  * 类似于 SQL 中的聚合函数 如COUNT()、MAX()等
* 3）Pipeline Aggregation --- 对其他的聚合结果进行二次聚合
* 4）Matrix Aggregation --- 支持对多个字段的操作并提供一个结果矩阵



例子

```shell
#按照目的地进行分桶统计
GET kibana_sample_data_flights/_search
{
	"size": 0,
	"aggs":{
		"flight_dest":{
			"terms":{
				"field":"DestCountry"
			}
		}
	}
}
```

```shell
#查看航班目的地的统计信息，增加平均，最高最低价格
GET kibana_sample_data_flights/_search
{
	"size": 0,
	"aggs":{ # aggs 关键字
		"flight_dest":{ # flight_dest 自定义名字 便于区分
			"terms":{ # terms 聚合类型
				"field":"DestCountry"
			},
			"aggs":{ # 对聚合结果再次进行聚合
				"avg_price":{ 
					"avg":{ 
						"field":"AvgTicketPrice"
					}
				},
				"max_price":{
					"max":{
						"field":"AvgTicketPrice"
					}
				},
				"min_price":{
					"min":{
						"field":"AvgTicketPrice"
					}
				}
			}
		}
	}
}
```

```shell
#价格统计信息+天气信息
GET kibana_sample_data_flights/_search
{
	"size": 0,
	"aggs":{
		"flight_dest":{
			"terms":{
				"field":"DestCountry"
			},
			"aggs":{
				"stats_price":{
					"stats":{
						"field":"AvgTicketPrice"
					}
				},
				"wather":{
				  "terms": {
				    "field": "DestWeather",
				    "size": 5
				  }
				}

			}
		}
	}
}
```

