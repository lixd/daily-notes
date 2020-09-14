# MongoDB 慢日志查询

## 1. 概述

MongoDB 支支持对DB的请求进行 Profiling，目前支持3种级别的 Profiling。

- 0） 不开启profiling
- 1） 将处理时间超过某个阈值(默认100ms)的请求都记录到DB下的system.profile集合 （类似于mysql、redis的slowlog）
- 2） 将所有的请求都记录到DB下的system.profile集合（生产环境慎用）

通常，生产环境建议使用1级别的profiling，并根据自身需求配置合理的阈值，用于监测慢请求的情况，并及时的做索引优化。

## 2. 开启方式

* 1）服务端 

可以在服务端启动的时候加上该参数，–profile=级别。

* 2）客户端

也可以通过客户端`db.setProfilingLevel(级别)` 命令来实时配置。

可以通过`db.getProfilingLevel()`命令来获取当前的Profile级别。

数为1的时候，默认的慢命令是大于100ms，当然也可以进行设置

```javascript
# syntax db.setProfilingLevel(level,slowms);
# 自定义慢日志时间 比如 120ms
db.setProfilingLevel(1,120);
```



## 3. 慢日志查询

Mongodb Profile 记录是直接存在系统db里的，记录位置 system.profile ，我们只要查询这个Collection的记录就可以获取到我们的 Profile 记录了。

```javascript
db.system.profile.find();
```

```javascript
{
    "op" : "command",
    "ns" : "xxx",
    "command" : {},
    "keysExamined" : 0,
    "docsExamined" : 375476,
    "hasSortStage" : true,
    "numYield" : 2945,
    "nreturned" : 101,
    "queryHash" : "D8347982",
    "planCacheKey" : "511282C7",
    "responseLength" : 11724,
    "protocol" : "op_msg",
    "millis" : 4383,
    "planSummary" : "COLLSCAN",
    "ts" : ISODate("2020-09-14T02:57:36.449Z"),
    "storage" : {
        "data" : {
            "bytesRead" : NumberLong(8705720677),
            "timeReadingMicros" : NumberLong(25521726)
        },
        "timeWaitingMicros" : {
            "cache" : NumberLong(17)
        }
    },
}
```

几个重要参数：

* 1）ts --命令执行时间
* 2）millis --执行耗时（ms）
* 3）nreturned --返回的文档条数
* 4）command --具体命令
* 5）keysExamined--索引扫描行数
* 6）docsExamined--文档扫描行数
* 7）storage.data.bytesRead --从磁盘读取到缓存的数据大小（byte）
* 8）storage.data.timeReadingMicros --读取数据耗时（微秒）

> 官方文档 https://docs.mongodb.com/manual/reference/database-profiler/

另一种更简单的方法,可以格式化显示出原始 SQL

```javascript
show profile
```





