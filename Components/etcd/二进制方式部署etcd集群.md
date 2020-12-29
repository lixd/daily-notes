## Etcd 集群部署

主要包含以下几部分:

* 1）搭建 etcd 集群
* 2）简单测试
* 3）配置 WebUI



## 1. 搭建 etcd 集群

### 1. 下载

首先下载对应操作系统的二进制文件,Github 地址如下:

```html
https://github.com/etcd-io/etcd/releases
```

Linux 则为`etcd-v3.4.14-linux-amd64.tar.gz`

解压

```sh
tar -zxvf etcd-v3.4.14-linux-amd64.tar.gz
```

将解压得到的`etcd`、`etcdctl`配置到环境变量，便于全局使用。

### 2. 配置文件

> 完整配置参数见[官方文档](https://github.com/etcd-io/etcd/blob/master/Documentation/op-guide/configuration.md)

接着创建一个配置文件`etcd.conf`:

> 虽然 etcd 配置项不多，但还是建议使用配置文件方式，便于管理

```conf
# This is the configuration file for the etcd server.

# Human-readable name for this member.
name: etcd2

# Path to the data directory.
data-dir: /var/lib/etcd

# Number of committed transactions to trigger a snapshot to disk.
snapshot-count: 10000

# Time (in milliseconds) of a heartbeat interval.
heartbeat-interval: 100

# Time (in milliseconds) for an election to timeout.
election-timeout: 1000

# Raise alarms when backend size exceeds the given quota. 0 means use the
# default quota.
quota-backend-bytes: 8589934592

# List of comma separated URLs to listen on for peer traffic.
listen-peer-urls: http://192.168.3.4:2380

# List of comma separated URLs to listen on for client traffic.
listen-client-urls: http://192.168.3.4:2379

# Maximum number of snapshot files to retain (0 is unlimited).
max-snapshots: 5

# Maximum number of wal files to retain (0 is unlimited).
max-wals: 5

# List of this member's peer URLs to advertise to the rest of the cluster.
# The URLs needed to be a comma-separated list.
initial-advertise-peer-urls: http://192.168.3.4:2380

# List of this member's client URLs to advertise to the public.
# The URLs needed to be a comma-separated list.
advertise-client-urls: http://192.168.3.4:2379

# Initial cluster configuration for bootstrapping.
initial-cluster: 'etcd1=http://192.168.3.3:2380,etcd2=http://192.168.3.4:2380,etcd3=http://192.168.3.5:2380'

# Initial cluster token for the etcd cluster during bootstrap.
initial-cluster-token: 'my-etcd'

# Initial cluster state ('new' or 'existing').
initial-cluster-state: 'new'

# Reject reconfiguration requests that would cause quorum loss.
strict-reconfig-check: false

# Accept etcd V2 client requests
enable-v2: false

# Enable runtime profiling data via HTTP server
enable-pprof: true

# Enable debug-level logging for etcd.
debug: false

logger: zap

# Specify 'stdout' or 'stderr' to skip journald logging even when running under systemd.
log-outputs: [stdout]

# Force to create a new one member cluster.
force-new-cluster: false

auto-compaction-mode: periodic
auto-compaction-retention: "1"
```

主要关注一下几个地方

* name
* listen-peer-urls
* listen-client-urls
* initial-advertise-peer-urls
* advertise-client-urls
* initial-cluster
* initial-cluster-token
* initial-cluster-state



### 3. systemd

推荐使用 `systemd` 管理集群。

```sh
[Unit]
Description=etcd server
After=network.target
 
[Service]
# 指定配置文件
Environment="OPTIONS=--config-file /usr/local/etcd/etcd.conf"
ExecStart=/usr/local/bin/etcd $OPTIONS
# 启动前创建目录或移除旧数据
ExecStartPre=/usr/bin/mkdir -p /var/lib/etcd
ExecStartPre=/usr/bin/rm -rf /var/lib/etcd/member
ExecReload=/bin/kill -HUP $MAINPID
KillMode=process
Restart=always
 
[Install]
WantedBy=multi-user.target
```







## 2. 简单测试

- 环境变量设置

  ```shell
  export ETCDCTL_API=3
  export ETCDCTL_ENDPOINTS=192.168.3.3:2380,192.168.3.4:2380,192.168.3.5:2380
  ```

- 查询集群使用情况

  ```shell
  etcdctl --write-out table endpoint status
  ```
  
- 存取键值

  ```shell
  etcdctl get key
  etcdctl put key value
  ```
  
  



## 3. WebUI

WebUI 推荐使用 etcdkeeper。



下载解压运行即可，github链接

```html
https://github.com/evildecay/etcdkeeper/releases
```

解压后得到一个`etcdkeeper`二进制文件，和 `assets`目录（静态资源），将两者放在同一目录下启动即可。

```sh
# -p 指定端口号
etcdkeeper -p 8090
```

之后即可访问`http://ip:prot`看到UI界面了。



