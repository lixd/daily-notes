# MongoDB Change Stream

## 1. 概述

Change Stream是MongoDB用于实现变更追踪的解决方案,类似于关系数据库的触发器，但原理不完全相同。

|          | ChangeStream         | 触发器           |
| -------- | -------------------- | ---------------- |
| 触发方式 | 异步                 | 同步（事务保证） |
| 触发位置 | 应用回调事件         | 数据库触发器     |
| 触发次数 | 每个订阅事件的客户端 | 1次（触发器）    |
| 故障恢复 | 从上次断点重新触发   | 事务回滚         |





## 2. 实现原理

Change Stream是基于oplog实现的。它在oplog上开启-一个tailable
cursor 来追踪所有复制集上的变更操作，最终调用应用中定义的回调函数。

被追踪的变更事件主要包括:

* insert/update/delete：插入、更新、删除;
* drop：集合被删除;
* rename：集合被重命名;
* dropDatabase：数据库被删除;
* invalidate： drop/rename/ dropDatabase将导致invalidate被触发,
  并关闭change stream;


Change Stream只推送已经在**大多数节点**上提交的变更操作。即“可重复读”的变更。这个验证是通过{readConcern: "majority" } 实现的。因此:

* **未开启majority readConcern的集群无法使用Change Stream**
* 当集群无法满足{w:“majority" }时，不会触发Change Stream (例如PSA架构中的S因故障宕机)。





## 3. 使用场景

* 跨集群的变更复制一一 在源集群中订阅Change Stream,一旦得到任何变更立即写入目标集群。
* 微服务联动一 当一个微服务变更数据库时，其他微服务得到通知并做出相应的变更。
* 其他任何需要系统联动的场景。

> 不推荐在业务相关地方使用，不好维护。



## 4. 注意事项

* Change Stream依赖于oplog, 因此中断时间不可超过oplog回收的最大时间窗;
  * oplog只会保留固定大小，超过后则虎移除，如果这部分没有触发到Change Stream 则会丢失掉。
* 在执行update操作时，如果只更新了部分数据，那么Change Stream通知的也是增量部分;
* 同理，删除数据时通知的仅是删除数据的. _id。

