# Rocky 8 使用 cephadm 安装 Ceph 16.2 
## 前言
Ceph 是一款分布式存储系统，支持三种存储方式：对象存储、块存储和文件存储。Ceph 的部署工具有很多，但是 Ceph v15.2 (Octopus) 开始推荐使用 cephadm 和 rook。其中 rook 是针对 kubernetes 的 ceph 部署工具，不在本例范围。

cephadm 为单独部署工具，使用容器化技术进行集群部署和管理，容器技术目前支持使用 docker 和 podman，本例以 podman 为例进行部署。本例以 Ceph v16.2 (Pacific) 为例进行安装演示。

## 环境说明
Rocky 8 (Minimal Install)
```
# cat cat /etc/system-release
Rocky Linux release 8.6 (Green Obsidian)
```

Ceph 分布式存储集群中一般分为两种类型主机: MON （Monitor）监控节点 和 OSD (Object Storage Device) 对象存储设备节点。Ceph 存储集群最少需要一个 MON 和 两个 OSD （作为复制）组成。

生产环境里一般 MON 节点是 3 或 5 个， OSD 节点是越多越好，而且这两种节点应在不同主机安装，但是本例为实验目的，就安装在一起了。

本例环境信息如下

| Hostname | IP Addr | CPU | Memory | Disk | Role |
| --- | --- | --- | --- | --- | --- |
| ceph-1 | 172.16.150.192、192.168.100.93 | 4 | 8G | vda(100G)、vdb(100G) | bootstrap |
| ceph-2 | 172.16.150.183、192.168.100.176 | 4 | 8G | vda(100G)、vdb(100G) |  |
| ceph-3 | 172.16.150.193、192.168.100.244 | 4 | 8G | vda(100G)、vdb(100G) |  |

每个虚拟机配置两块网卡（172.16.150.0/24 作为 Ceph 集群的 public 网络、192.168.100.0/24 作为 Ceph 集群的 cluster 网络）和两块硬盘（vda 安装操作系统、vdb 作为 Ceph OSD 磁盘）。

## 步骤
### 准备主机（三个主机都执行）
```console
[root@ceph-1/2/3 ~]# dnf update
[root@ceph-1/2/3 ~]# dnf -y install python3 podman chrony
[root@ceph-1/2/3 ~]# systemctl enable chronyd && systemctl start chronyd
[root@ceph-1/2/3 ~]# cat <<EOF > /etc/hosts
172.16.150.192 ceph-1
172.16.150.183 ceph-2
172.16.150.193 ceph-3
EOF
```
默认 chronyd 使用外网的 ntp 服务器，也可通过配置 `/etc/chrony.conf` 使用内网 ntp 服务器，具体可参考网上资料。
### 确认主机准备好（三个主机都执行）
```console
[root@ceph-1/2/3 ~]# curl --silent --remote-name --location https://github.com/ceph/ceph/raw/pacific/src/cephadm/cephadm
[root@ceph-1/2/3 ~]# chmod +x cephadm
[root@ceph-1/2/3 ~]# ./cephadm add-repo --release pacific
[root@ceph-1/2/3 ~]# ./cephadm install
[root@ceph-1/2/3 ~]# cephadm prepare-host
```
若主机已准备好，执行 `cephadm prepare-host` 后会输出如下信息。
```text
Verifying podman|docker is present...
Verifying lvm2 is present...
Verifying time synchronization is in place...
Unit chronyd.service is enabled and running
Repeating the final host check...
podman (/usr/bin/podman) version 3.3.1 is present
systemctl is present
lvcreate is present
Unit chronyd.service is enabled and running
Host looks OK
```
### 通过 cephadm 引导集群（只在 bootstrap 节点上执行，本例为 ceph-1）
```console
[root@ceph-1 ~]# cat <<EOF >  ~/ceph.conf
[global]
public network = 172.16.150.0/24
cluster network = 192.168.100.0/24
osd pool default size = 3
osd pool default min size = 2
EOF
[root@ceph-1 ~]# cephadm bootstrap --config ~/ceph.conf --mon-ip 172.16.150.192
```
若 `cephadm bootstrap` 引导成功，会输出如下的信息。
```text
Verifying podman|docker is present...
Verifying lvm2 is present...
Verifying time synchronization is in place...
Unit chronyd.service is enabled and running
Repeating the final host check...
podman (/usr/bin/podman) version 4.0.2 is present
systemctl is present
lvcreate is present
Unit chronyd.service is enabled and running
Host looks OK
Cluster fsid: 7d12cd92-1877-11ed-b597-fa163e6f0da6
Verifying IP 172.16.150.192 port 3300 ...
Verifying IP 172.16.150.192 port 6789 ...
Mon IP `172.16.150.192` is in CIDR network `172.16.150.0/24`
Mon IP `172.16.150.192` is in CIDR network `172.16.150.0/24`
Internal network (--cluster-network) has not been provided, OSD replication will default to the public_network
Pulling container image quay.io/ceph/ceph:v16...
Ceph version: ceph version 16.2.10 (45fa1a083152e41a408d15505f594ec5f1b4fe17) pacific (stable)
Extracting ceph user uid/gid from container image...
Creating initial keys...
Creating initial monmap...
Creating mon...
Waiting for mon to start...
Waiting for mon...
mon is available
Assimilating anything we can from ceph.conf...
Generating new minimal ceph.conf...
Restarting the monitor...
Setting mon public_network to 172.16.150.0/24
Wrote config to /etc/ceph/ceph.conf
Wrote keyring to /etc/ceph/ceph.client.admin.keyring
Creating mgr...
Verifying port 9283 ...
Waiting for mgr to start...
Waiting for mgr...
mgr not available, waiting (1/15)...
mgr not available, waiting (2/15)...
mgr not available, waiting (3/15)...
mgr is available
Enabling cephadm module...
Waiting for the mgr to restart...
Waiting for mgr epoch 5...
mgr epoch 5 is available
Setting orchestrator backend to cephadm...
Generating ssh key...
Wrote public SSH key to /etc/ceph/ceph.pub
Adding key to root@localhost authorized_keys...
Adding host ceph-1...
Deploying mon service with default placement...
Deploying mgr service with default placement...
Deploying crash service with default placement...
Deploying prometheus service with default placement...
Deploying grafana service with default placement...
Deploying node-exporter service with default placement...
Deploying alertmanager service with default placement...
Enabling the dashboard module...
Waiting for the mgr to restart...
Waiting for mgr epoch 9...
mgr epoch 9 is available
Generating a dashboard self-signed certificate...
Creating initial admin user...
Fetching dashboard port number...
Ceph Dashboard is now available at:

             URL: https://ceph-1:8443/
            User: admin
        Password: 4gq03t40y9

Enabling client.admin keyring and conf on hosts with "admin" label
Enabling autotune for osd_memory_target
You can access the Ceph CLI as following in case of multi-cluster or non-default config:

        sudo ./cephadm shell --fsid 7d12cd92-1877-11ed-b597-fa163e6f0da6 -c /etc/ceph/ceph.conf -k /etc/ceph/ceph.client.admin.keyring

Or, if you are only running a single cluster on this host:

        sudo ./cephadm shell 

Please consider enabling telemetry to help improve Ceph:

        ceph telemetry on

For more information see:

        https://docs.ceph.com/en/pacific/mgr/telemetry/

Bootstrap complete.
```
### 查看集群信息

1. 进入 `cephadm shell` 命令模式
```console
[root@ceph-1 ~]# cephadm shell
```
2. 查看版本信息
```
[ceph: root@ceph-1 /]# ceph -v
ceph version 16.2.10 (45fa1a083152e41a408d15505f594ec5f1b4fe17) pacific (stable)
```
3. 查看编排服务状态
```
[ceph: root@ceph-1 /]# ceph orch status
Backend: cephadm
Available: Yes
Paused: No
```
4. 查看容器部署情况
```console
[ceph: root@ceph-1 /]# ceph orch ls
NAME           PORTS        RUNNING  REFRESHED  AGE  PLACEMENT
alertmanager   ?:9093,9094      1/1  2s ago     2m   count:1
crash                           1/1  2s ago     2m   *
grafana        ?:3000           1/1  2s ago     2m   count:1
mgr                             1/2  2s ago     2m   count:2
mon                             1/5  2s ago     2m   count:5
node-exporter  ?:9100           1/1  2s ago     2m   *
prometheus     ?:9095           1/1  2s ago     2m   count:1
```
5. 查看容器进程
```console
[ceph: root@ceph-1 /]# ceph orch ps
NAME                 HOST   PORTS        STATUS          REFRESHED   AGE  MEM USE  MEM LIM  VERSION  IMAGE ID      CONTAINER ID
alertmanager.ceph1   ceph1  *:9093,9094  running (107s)    36s ago    3m    14.7M        -  0.20.0   0881eb8f169f  3fd92369ad05
crash.ceph1          ceph1               running (3m)      36s ago    3m    6953k        -  16.2.7   cc266d6139f4  7b0cb81a82b6
grafana.ceph1        ceph1  *:3000       running (104s)    36s ago    2m    27.9M        -  6.7.4    557c83e11646  841ac47ee29a
mgr.ceph1.jhzbvt     ceph1  *:9283       running (4m)      36s ago    4m     436M        -  16.2.7   cc266d6139f4  9415d4d83d3e
mon.ceph1            ceph1               running (4m)      36s ago    4m    42.9M    2048M  16.2.7   cc266d6139f4  3f363410d2a1
node-exporter.ceph1  ceph1  *:9100       running (2m)      36s ago    2m    8456k        -  0.18.1   e5a616e4b9cf  9bfd6a8485f9
prometheus.ceph1     ceph1  *:9095       running (117s)    36s ago  117s    27.4M        -  2.18.1   de242295e225  ac00e5fb6eb8
```
6. 查看 Ceph 整体状态

```console
[ceph: root@ceph-1 /]# ceph -s
cluster:
    id:     66dc8e50-7da4-11ec-9e9b-080027b919a0
    health: HEALTH_WARN
            OSD count 0 < osd_pool_default_size 3

  services:
    mon: 1 daemons, quorum ceph1 (age 5m)
    mgr: ceph1.jhzbvt(active, since 3m)
    osd: 0 osds: 0 up, 0 in

  data:
    pools:   0 pools, 0 pgs
    objects: 0 objects, 0 B
    usage:   0 B used, 0 B / 0 B avail
    pgs
```
### 管理集群主机
1. 向集群添加主机
```console
[ceph: root@ceph-1 /]# ceph orch host add ceph-2
[ceph: root@ceph-1 /]# ceph orch host add ceph-3
```
2. 查看集群主机
```console
[ceph: root@ceph-1 /]# ceph orch host ls
```
3. 过段时间查看容器部署情况
```console
[ceph: root@ceph-1 /]# ceph orch ls
NAME           PORTS        RUNNING  REFRESHED  AGE  PLACEMENT
alertmanager   ?:9093,9094      1/1  6m ago     55m  count:1
crash                           3/3  6m ago     55m  *
grafana        ?:3000           1/1  6m ago     55m  count:1
mgr                             2/2  6m ago     56m  count:2
mon                             3/5  6m ago     56m  count:5
node-exporter  ?:9100           3/3  6m ago     55m  *
prometheus     ?:9095           1/1  6m ago     55m  count:1
```
4. 可以查看具体的容器进程
```console
[ceph: root@ceph-1 /]# ceph orch ps
NAME                 HOST   PORTS        STATUS         REFRESHED  AGE  MEM USE  MEM LIM  VERSION  IMAGE ID      CONTAINER ID
alertmanager.ceph1   ceph1  *:9093,9094  running (21m)    16s ago  59m    23.2M        -  0.20.0   0881eb8f169f  b0768c563aa5
crash.ceph1          ceph1               running (49m)    16s ago  59m    21.1M        -  16.2.7   cc266d6139f4  d4499df1c025
crash.ceph2          ceph2               running (26m)    18s ago  26m    7226k        -  16.2.7   cc266d6139f4  194e4c9bbd7e
crash.ceph3          ceph3               running (22m)    18s ago  22m    8967k        -  16.2.7   cc266d6139f4  e511a891c88e
grafana.ceph1        ceph1  *:3000       running (49m)    16s ago  58m    87.5M        -  6.7.4    557c83e11646  9d429ed860aa
mgr.ceph1.jhzbvt     ceph1  *:9283       running (49m)    16s ago  60m     565M        -  16.2.7   cc266d6139f4  f7f8e2b2f598
mgr.ceph2.nyvgyk     ceph2  *:8443,9283  running (26m)    18s ago  26m     391M        -  16.2.7   cc266d6139f4  69d79592715b
mon.ceph1            ceph1               running (49m)    16s ago  60m     230M    2048M  16.2.7   cc266d6139f4  dd554eefde37
mon.ceph2            ceph2               running (26m)    18s ago  26m     120M    2048M  16.2.7   cc266d6139f4  a918d88f9ccb
mon.ceph3            ceph3               running (22m)    18s ago  22m     129M    2048M  16.2.7   cc266d6139f4  516ed7cd5edd
node-exporter.ceph1  ceph1  *:9100       running (49m)    16s ago  58m    31.8M        -  0.18.1   e5a616e4b9cf  c6d106db5a98
node-exporter.ceph2  ceph2  *:9100       running (24m)    18s ago  24m    14.0M        -  0.18.1   e5a616e4b9cf  9e67734ba9e4
node-exporter.ceph3  ceph3  *:9100       running (22m)    18s ago  22m    16.0M        -  0.18.1   e5a616e4b9cf  64b88ba334e2
prometheus.ceph1     ceph1  *:9095       running (21m)    16s ago  57m    56.9M        -  2.18.1   de242295e225  02c4906b7a5d
```
可以看到
* `mgr` 也到默认上限2个，部署到2个节点上 
* `mon` 也部署了3个，但默认最多是5个，所以还没到默认的上限
5. 修改 `mon` 节点到 `ceph-1`、`ceph-2`、`ceph-3`，并限定数量为3
```console
[ceph: root@ceph-1 /]# ceph orch apply mon ceph-1,ceph-2,ceph-3
[ceph: root@ceph-1 /]# ceph orch apply 3
```
6. 再次查看容器部署情况
```console
[ceph: root@ceph-1 /]# ceph orch ls
NAME           PORTS        RUNNING  REFRESHED  AGE  PLACEMENT
alertmanager   ?:9093,9094      1/1  3m ago     73m  count:1
crash                           3/3  3m ago     73m  *
grafana        ?:3000           1/1  3m ago     73m  count:1
mgr                             2/2  3m ago     73m  count:2
mon                             3/3  3m ago     2s   ceph1;ceph2;ceph3
node-exporter  ?:9100           3/3  3m ago     73m  *
prometheus     ?:9095           1/1  3m ago     73m  count:1
```
可以看到 `mon` 已经是 `3/3` 了，`PLACEMENT` 列上可以看到允许在哪台主机上
### 管理集群 OSD
绑定至 OSD 的硬盘需要具备如下条件：
* 设备必须没有分区
* 设备不得具有任何 LVM 分区
* 设备不包含文件系统
* 设备未被挂载
* 设备必须大于5G
* 设备未被其它硬盘使用
1. 列出集群上所有可用的磁盘设备
```console
[ceph: root@ceph-1 /]# ceph orch device ls
HOST   PATH      TYPE  DEVICE ID                           SIZE  AVAILABLE  REJECT REASONS
ceph-1  /dev/vdb  hdd   VBOX_HARDDISK_VB1e5ef148-884f7c83  21.4G  Yes
ceph-2  /dev/vdb  hdd   VBOX_HARDDISK_VB6aef18c7-3d8548b1  21.4G  Yes
ceph-3  /dev/vdb  hdd   VBOX_HARDDISK_VB6b51415b-6e91c2d1  21.4G  Yes
```
2. 为可用磁盘绑定 OSD
```console
[ceph: root@ceph-1 /]# ceph orch daemon add osd ceph-1:/dev/vdb
[ceph: root@ceph-1 /]# ceph orch daemon add osd ceph-2:/dev/vdb
[ceph: root@ceph-1 /]# ceph orch daemon add osd ceph-3:/dev/vdb
```
3. 查看 OSD 状态
```console
[ceph: root@ceph-1 /]# ceph osd tree
ID  CLASS  WEIGHT   TYPE NAME       STATUS  REWEIGHT  PRI-AFF
-1         0.05846  root default
-7         0.01949      host ceph-1
 2    hdd  0.01949          osd.0       up   1.00000  1.00000
-3         0.01949      host ceph-2
 1    hdd  0.01949          osd.1       up   1.00000  1.00000
-5         0.01949      host ceph-3
 0    hdd  0.01949          osd.2       up   1.00000  1.00000
```
至此 Ceph 集群基本搭建完成（mon + osd + mgr），如果需要使用高级功能则需要添加其它模块，可参考官方资料。
## 参考资料
* [Ceph docs](https://docs.ceph.com/en/latest/cephadm/install/#cephadm-deployment-scenarios)
* [Rocky 8 使用 cephadm 安装 Ceph 16.2 实验 NFS 服务](https://qizhanming.com/blog/2022/01/25/how-to-install-ceph-pacific-and-export-nfs-on-rocky-8)
* [How to uninstall ceph storage cluster](https://www.flamingbytes.com/posts/uninstall-ceph/)
