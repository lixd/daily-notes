# etcd 优化调整

## 目的
让 etcd 能在中等 IO 环境中稳定运行：
1. **调优**：单独盘 / 软件优先级 / etcd 参数调配 / 高 IO 比如 registry 服务不要和 etcd 放一起等
2. **监控**：如果发现 IOPS 等指标有问题，要在 etcd 部署或运行时告警
3. **恢复**：etcd 崩了要能尽量自动化修复

## 调优

### 调整优先级

#### IO 优先级
使用 `ionice` 调整 etcd 的 io 优先级。

**查看当前优先级：**
```bash
sudo ionice -p $(pgrep etcd)
```

输出如下：
```plaintext
[root@test-cmy-3 kube-prometheus]# sudo ionice -p $(pgrep etcd)
none: prio 0
```

表示当前 etcd 进程没有设置优先级，使用以下命令将其调整到最高优先级：
```bash
sudo ionice -c2 -n0 -p $(pgrep etcd)
```

调整后再次查看：
```bash
[root@test-cmy-3 kube-prometheus]# sudo ionice -p $(pgrep etcd)
best-effort: prio 0
```

出现 `best-effort` 说明调整已经生效。

#### CPU 优先级
CPU 优先级也可以调整。

**查看当前 etcd 进程 CPU nice 值：**
```bash
[root@test-cmy-3 kube-prometheus]# ps -p $(pgrep etcd) -o nice
 NI
  0
```

说明当前进程 nice 值为 0，将其调整到 -20：
```bash
sudo renice -n -20 -P $(pgrep etcd)
```

输出如下：
```bash
[root@test-cmy-3 kube-prometheus]# sudo renice -n -20  $(pgrep etcd)
1689 (process ID) old priority -20, new priority -20
```

再次查看：
```bash
[root@test-cmy-3 kube-prometheus]# ps -p $(pgrep etcd) -o nice
 NI
-20
```

为 -20，说明调整已经生效。

#### 网络优化
如果 etcd leader 服务于大量并发的客户端请求，可能由于网络拥塞而延迟处理 follower 节点的请求。这表现为 follower 节点上的发送缓冲区错误消息：

etcd 日志：
```plaintext
dropped MsgProp to 247ae21ff9436b2d since streamMsg's sending buffer is full
dropped MsgAppResp to 247ae21ff9436b2d since streamMsg's sending buffer is full
```

新版本中的日志为：
```plaintext
dropped Raft message since sending buffer is full
```

这些错误可以通过使 etcd member 之间的流量优先于其 client 流量来解决。在 Linux 上，可以通过使用 `tc` 来调整对等流量的优先级：
```bash
tc qdisc add dev eth0 root handle 1: prio bands 3
tc filter add dev eth0 parent 1: protocol ip prio 1 u32 match ip sport 2380 0xffff flowid 1:1
tc filter add dev eth0 parent 1: protocol ip prio 1 u32 match ip dport 2380 0xffff flowid 1:1
tc filter add dev eth0 parent 1: protocol ip prio 2 u32 match ip sport 2379 0xffff flowid 1:1
tc filter add dev eth0 parent 1: protocol ip prio 2 u32 match ip dport 2379 0xffff flowid 1:1
```

以上命令创建一个根队列，接管所有流量，并将 2380 端口优先级设置为高于 2379 端口，使得 etcd 能优先处理 follower 节点请求，至于非 etcd 流量则默认进入最低优先级队列。

添加之后查看：
```bash
[root@etcd-1 ~]# tc qdisc show dev eth0
qdisc prio 1: root refcnt 2 bands 3 priomap  1 2 2 2 1 2 0 0 1 1 1 1 1 1 1 1
[root@etcd-1 ~]#
[root@etcd-1 ~]# tc filter show dev eth0
filter parent 1: protocol ip pref 1 u32 chain 0
filter parent 1: protocol ip pref 1 u32 chain 0 fh 800: ht divisor 1
filter parent 1: protocol ip pref 1 u32 chain 0 fh 800::800 order 2048 key ht 800 bkt 0 flowid 1:1 not_in_hw
  match 094c0000/ffff0000 at 20
filter parent 1: protocol ip pref 1 u32 chain 0 fh 800::801 order 2049 key ht 800 bkt 0 flowid 1:1 not_in_hw
  match 0000094c/0000ffff at 20
filter parent 1: protocol ip pref 2 u32 chain 0
filter parent 1: protocol ip pref 2 u32 chain 0 fh 801: ht divisor 1
filter parent 1: protocol ip pref 2 u32 chain 0 fh 801::800 order 2048 key ht 801 bkt 0 flowid 1:1 not_in_hw
  match 094b0000/ffff0000 at 20
filter parent 1: protocol ip pref 2 u32 chain 0 fh 801::801 order 2049 key ht 801 bkt 0 flowid 1:1 not_in_hw
  match 0000094b/0000ffff at 20
```

要取消 `tc`，请执行：
```bash
tc qdisc del dev eth0 root
```

### etcd 参数调整

#### 心跳周期和选举超时
根据磁盘和网络 RTT 调整心跳周期和选举超时时间：
- **心跳周期（Heartbeat interval）**：设置为 etcd 集群多个成员之间数据往返周期的最大值，一般是 RTT 的 0.55 到 1.5 倍数，默认为 100ms。需要考虑到磁盘 IO，适当提高该值。
- **选举超时时间（Election timeout）**：一般设置为心跳周期的 10 倍左右，默认为 1s。

具体数值，依赖于下面的磁盘 IO 以及网络 RTT 测试结果。

### 磁盘 IO 测试
使用 `fio` 测试磁盘性能对于 etcd 来说是否足够。需要 `fio 3.5` 以上版本，否则报告中没有 fdatasync 的百分位数据。

```bash
mkdir test-data
fio --rw=write --ioengine=sync --fdatasync=1 --directory=test-data --size=22m --bs=2300 --name=mytest
```

**SSD 盘测试结果**：
```plaintext
fsync/fdatasync/sync_file_range:
  sync (usec): min=909, max=17413, avg=1925.82, stdev=937.06
  sync percentiles (usec):
   |  1.00th=[  988],  5.00th=[ 1057], 10.00th=[ 1106], 20.00th=[ 1156],
   | 30.00th=[ 1221], 40.00th=[ 1385], 50.00th=[ 2057], 60.00th=[ 2180],
   | 70.00th=[ 2278], 80.00th=[ 2376], 90.00th=[ 2573], 95.00th=[ 2933],
   | 99.00th=[ 6259], 99.50th=[ 7373], 99.90th=[ 9765], 99.95th=[10159],
```

**机械盘测试结果**：
```plaintext
fsync/fdatasync/sync_file_range:
  sync (usec): min=838, max=562103, avg=6233.56, stdev=19142.62
  sync percentiles (usec):
   |  1.00th=[  1090],  5.00th=[  1221], 10.00th=[  1303], 20.00th=[  1434],
   | 30.00th=[  1532], 40.00th=[  1631], 50.00th=[  1745], 60.00th=[  1876],
   | 70.00th=[  2114], 80.00th=[  2802], 90.00th=[  9110], 95.00th=[ 26084],
   | 99.00th=[102237], 99.50th=[129500], 99.90th=[200279], 99.95th=[240124],
   |

 99.99th=[392586], 99.999th=[562103]
```

#### 数据持久化策略
etcd 的数据持久化与写延迟密切相关。可以根据磁盘性能调整：
- **快照间隔（snapshot count）**：设置一个较大的数值（比如 10000），减少磁盘 IO。
- **快照前备份（pre-vote）**：启用此功能以减少不必要的选举和 I/O。
- **启用 WAL 压缩**：减少磁盘空间使用。
- **禁用自动压缩**：手动管理压缩任务。

```bash
etcd --snapshot-count=10000 --auto-compaction-mode=period --auto-compaction-retention=1 --enable-v2=true
```

### 使用专用盘
对于生产环境，建议使用独立的 SSD 或 NVMe 盘存储 etcd 数据，确保其性能。

## 监控

### 指标监控
使用 Prometheus 或其他监控系统监控 etcd 的关键指标，如：
- IOPS
- 磁盘延迟
- 网络延迟
- CPU 使用率
- 内存使用率

通过设置报警规则，提前发现问题。

### 预警设置
根据实际使用场景，设置合理的预警阈值。比如：
- IOPS 高于磁盘承受能力的 80% 时，发出警告。
- 磁盘延迟超过 50ms 时，发出警告。

## 恢复

### **恢复**

恢复分为两步：

* 1）使用快照文件恢复出数据目录
* 2）使用 1 中的数据目录启动 etcd



一些环境变量，apply 到所有节点

```bash
export NAME_1=etcd1
export NAME_2=etcd2
export NAME_3=etcd3
export HOST_1=192.168.10.83
export HOST_2=192.168.10.41
export HOST_3=192.168.10.55
export CLUSTER="$NAME_1"=http://"$HOST_1":2380,"$NAME_2"=http://"$HOST_2":2380,"$NAME_3"=http://"$HOST_3":2380
export DATA_DIR_BAK=/data/etcd_bak
# 需要保证该目录为空，先删除一下
rm -rf "$DATA_DIR_BAK"
mkdir -p "$DATA_DIR_BAK"
```



到对应节点上执行命令恢复数据目录



```bash
# 恢复第一个节点
etcdutl snapshot restore test.db \
--name="$NAME_1" \
--data-dir="$DATA_DIR_BAK" \
--initial-cluster "$CLUSTER" \
--initial-cluster-token="$TOKEN" \
--initial-advertise-peer-urls http://"$HOST_1":2380
 
 
# 恢复第二个节点
etcdutl snapshot restore test.db \
--name="$NAME_2" \
--data-dir="$DATA_DIR_BAK" \
--initial-cluster "$CLUSTER" \
--initial-cluster-token="$TOKEN" \
--initial-advertise-peer-urls http://"$HOST_2":2380
  
# 恢复第三个节点
etcdutl snapshot restore test.db \
--name="$NAME_3" \
--data-dir="$DATA_DIR_BAK" \
--initial-cluster "$CLUSTER" \
--initial-cluster-token="$TOKEN" \
--initial-advertise-peer-urls http://"$HOST_3":2380
```





恢复完成后再用新的数据目录启动集群，和启动集群时的命令一模一样，只是把数据目录修改为了恢复出来的目录。



```bash
# 节点 1：启动第一个节点
etcd --name "$NAME_1"\
  --data-dir "$DATA_DIR_BAK" \
  --listen-client-urls http://"$HOST_1":2379 \
  --advertise-client-urls http://"$HOST_1":2379 \
  --listen-peer-urls http://"$HOST_1":2380 \
  --initial-advertise-peer-urls http://"$HOST_1":2380 \
  --initial-cluster "$CLUSTER" \
  --initial-cluster-token "$TOKEN" \
  --initial-cluster-state "$CLUSTER_STATE"   
  
# 节点 2：启动第二个节点
etcd --name "$NAME_2"\
  --data-dir "$DATA_DIR_BAK" \
  --listen-client-urls http://"$HOST_2":2379 \
  --advertise-client-urls http://"$HOST_2":2379 \
  --listen-peer-urls http://"$HOST_2":2380 \
  --initial-advertise-peer-urls http://"$HOST_2":2380 \
  --initial-cluster "$CLUSTER" \
  --initial-cluster-token "$TOKEN" \
  --initial-cluster-state "$CLUSTER_STATE" 
  
# 节点 3：启动第三个节点
etcd --name "$NAME_3"\
  --data-dir "$DATA_DIR_BAK" \
  --listen-client-urls http://"$HOST_3":2379 \
  --advertise-client-urls http://"$HOST_3":2379 \
  --listen-peer-urls http://"$HOST_3":2380 \
  --initial-advertise-peer-urls http://"$HOST_3":2380 \
  --initial-cluster "$CLUSTER" \
  --initial-cluster-token "$TOKEN" \
  --initial-cluster-state "$CLUSTER_STATE" 
```



## **高可用及自愈**

### **跨可用区部署**

把每个节点部署在独立的可用区，可容忍任意一个可用区故障。比如 3 节点分三个可用区，当其中一个可用区故障后不影响集群运行。

注意📢：多可用区部署会导致节点 RTT 延时增高，读性能下降。因此你需要在高可用和高性能上做取舍和平衡。



### **容器化部署**

使用 Kubernetes 容器化部署 etcd 集群。当节点出现故障时，能通过 Kubernetes 的自愈机制，实现故障自愈。

k8s worker 节点故障后，etcd pod 会调度到其他正常节点，借助 k8s 能力来实现 etcd 集群自动恢复。