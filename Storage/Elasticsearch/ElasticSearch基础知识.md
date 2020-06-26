## ES基础知识



## 1. 常用命令

### 1. _cat

```sh
v@v-ubuntu:/usr/local/docker$ curl localhost:9200/_cat
=^.^=
/_cat/allocation
/_cat/shards
/_cat/shards/{index}
/_cat/master
/_cat/nodes
/_cat/indices
/_cat/indices/{index}
/_cat/segments
/_cat/segments/{index}
/_cat/count
/_cat/count/{index}
/_cat/recovery
/_cat/recovery/{index}
/_cat/health
/_cat/pending_tasks
/_cat/aliases
/_cat/aliases/{alias}
/_cat/thread_pool
/_cat/plugins
/_cat/fielddata
/_cat/fielddata/{fields}
/_cat/nodeattrs
/_cat/repositories
/_cat/snapshots/{repository}
```



### 2. verbose

每个命令都支持使用`?v`参数，来显示详细的信息：

```sh
v@v-ubuntu:/usr/local/docker$ curl localhost:9200/_cat/health?v
epoch      timestamp cluster        status node.total node.data shards pri relo init unassign pending_tasks max_task_wait_time active_shards_percent
1576565256 06:47:36  docker-cluster green           3         3      8   4    0    0        0             0                  -                100.0%
```

URL中_cat表示查看信息，health表明返回的信息为集群健康信息，?v表示返回详细信息


### 3. help

每个命令都支持使用help参数，来输出可以显示的列：

```sh
v@v-ubuntu:/usr/local/docker$ curl localhost:9200/_cat/health?help
epoch                 | t,time                                   | seconds since 1970-01-01 00:00:00  
timestamp             | ts,hms,hhmmss                            | time in HH:MM:SS                   
cluster               | cl                                       | cluster name                       
status                | st                                       | health status                      
node.total            | nt,nodeTotal                             | total number of nodes              
node.data             | nd,nodeData                              | number of nodes that can store data
shards                | t,sh,shards.total,shardsTotal            | total number of shards             
pri                   | p,shards.primary,shardsPrimary           | number of primary shards           
relo                  | r,shards.relocating,shardsRelocating     | number of relocating nodes         
init                  | i,shards.initializing,shardsInitializing | number of initializing nodes       
unassign              | u,shards.unassigned,shardsUnassigned     | number of unassigned shards        
pending_tasks         | pt,pendingTasks                          | number of pending tasks            
max_task_wait_time    | mtwt,maxTaskWaitTime                     | wait time of longest task pending  
active_shards_percent | asp,activeShardsPercent                  | active number of shards in percent 
```



### 4. headers

通过h参数，可以指定输出的字段：

```sh
v@v-ubuntu:/usr/local/docker$ curl localhost:9200/_cat/master?v
id                     host       ip         node
HvZ-ylHbRBqqRbYEar-68A 172.31.0.3 172.31.0.3 es1
v@v-ubuntu:/usr/local/docker$ curl localhost:9200/_cat/master?h=ip,node
172.31.0.3 es1
```



### 5. 数字类型的格式化

很多的命令都支持返回可读性的大小数字，比如使用mb或者kb来表示。

```sh
v@v-ubuntu:/usr/local/docker$ curl localhost:9200/_cat/indices?v
health status index                           uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   .kibana_task_manager            5GAVVm9UTUKs2LM8vbAb-g   1   1          2            0     19.3kb         12.5kb
green  open   .kibana_1                       jc6n1Aj9TtqoIBEK1mnKCQ   1   1          4            1     39.4kb         19.7kb
green  open   .monitoring-es-6-2019.12.17     9c7KUTd6S9GUf_4I6pJCig   1   1       2907           16      6.2mb            3mb
green  open   .monitoring-kibana-6-2019.12.17 fa_JVlpVSkm3Ua5WmP2Dxg   1   1        294            0    852.8kb        426.4kb
```





查看集群的索引数。

```sh
http://192.168.0.2:9200/_cat/indices?v
```

* 查看集群所在磁盘的分配状况

```sh
http://192.168.0.2:9200/_cat/allocation?v
```

* 查看集群的节点

```sh
http://192.168.0.2:9200/_cat/nodes?v
```

* 查看集群的其它信息。

```sh
http://192.168.0.2:9200/_cat/
```

通过上面的链接，其实，我们就相当于获得查看集群信息的目录。

```sh
/_cat/allocation
/_cat/shards
/_cat/shards/{index}
/_cat/master
/_cat/nodes
/_cat/tasks
/_cat/indices
/_cat/indices/{index}
/_cat/segments
/_cat/segments/{index}
/_cat/count
/_cat/count/{index}
/_cat/recovery
/_cat/recovery/{index}
/_cat/health
/_cat/pending_tasks
/_cat/aliases
/_cat/aliases/{alias}
/_cat/thread_pool
/_cat/thread_pool/{thread_pools}
/_cat/plugins
/_cat/fielddata
/_cat/fielddata/{fields}
/_cat/nodeattrs
/_cat/repositories
/_cat/snapshots/{repository}
/_cat/templates
```



## 2. 节点

ES集群中节点分为master node和data node。

你配置的时候，是配置多个node变成master eligible node，但是只是说，从这些master eligible node选举一个node出来作为master node，其他master eligible node只是接下来有那个master node故障的时候，接替他的资格，但是还是作为data node去使用的。

data node则相反只能是data node无法选举成为master node。

**master eligible node，同时也是data node**

> 一般建议master eligible node给3个即可：node.master: true，node.data: false
> 剩下的node都设置为data node：node.master: false，node.data: true
>
> 
>
> 但是如果一个小集群，就10个以内的节点，那就所有节点都可以作为master eligible node以及data node即可，超过10个node的集群再单独拆分master和data node吧





## 参考

`https://blog.csdn.net/qa76774730/article/details/82778715`

`https://www.jianshu.com/p/c63816fb17ae`