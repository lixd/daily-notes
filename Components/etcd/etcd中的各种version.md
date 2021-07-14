# etcd 中的各种 Version 的具体含义

集群层面的：

* Revision：etcd 集群中的版本号，全局递增，每次执行 update 操作时+1



Key 层面的：

* Version：key 被修改的次数
* ModVersion：key 最后一次被修改时 etcd 集群中的版本号
* CreateVersion：key 创建时 etcd 集群中的版本号

