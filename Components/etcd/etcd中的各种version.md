# etcd 中的各种 Version 的具体含义

集群层面的：

* Revision：etcd 集群中的版本号，全局递增，每次执行更新Key的操作时+1
  * 集群启动时为1，第一次 PUT 后变成2，此时key的版本号也是2



Key 层面的：

* Version：key 被修改的次数
* ModVersion：key 最后一次被修改时 etcd 集群中的版本号
  * 修改后的版本号
* CreateVersion：key 创建时 etcd 集群中的版本号
  * 修改后的版本号



Demo

启动初始化后 Revision =1

写入一个Key

```sh
put hello world
```

PUT 操作后Revision变成2,

hello 的version信息如下：

* Version：1
* ModVersion：2
* CreateVersion：2

