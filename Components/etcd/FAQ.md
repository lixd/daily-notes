## etcd 使用遇到的问题

### 1 空间不足

```sh
Server register error: etcdserver: mvcc: database space exceeded
```

#### 原因分析

etcd服务未设置自动压缩参数（auto-compact）

etcd 默认不会自动 compact，需要设置启动参数，或者通过命令进行compact，如果变更频繁建议设置，否则会导致空间和内存的浪费以及错误。Etcd v3 的默认的 backend quota 2GB，如果不 compact，boltdb 文件大小超过这个限制后，就会报错：”Error: etcdserver: mvcc: database space exceeded”，导致数据无法写入。

5、整合压缩、碎片整理：

1) 获取当前etcd数据的修订版本(revision)

```sh
rev=$(ETCDCTL_API=3 etcdctl –endpoints=:2379 endpoint status –write-out=”json” | egrep -o ‘”revision”:[0-9]*’ | egrep -o ‘[0-9]*’)
```

2) 整合压缩旧版本数据

```sh
ETCDCTL_API=3 etcdctl compact $rev
```

3) 执行碎片整理

```sh
ETCDCTL_API=3 etcdctl defrag
```

4) 解除告警

```sh
ETCDCTL_API=3 etcdctl alarm disarm
```

5) 备份以及查看备份数据信息

```sh
ETCDCTL_API=3 etcdctl snapshot save backup.db
ETCDCTL_API=3 etcdctl snapshot status backup.db
```

