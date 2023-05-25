# centos 安装 ceph 集群

## 准备工作

### 资源要求

3 台机器，主节点需要 1C2G，其他节点 1C1G 也勉强能跑，然后**都需要外挂磁盘**才行。



### 节点环境准备

#### 添加 ceph yum源

```Bash
# 三台节点都执行
cat > /etc/yum.repos.d/ceph.repo <<EOF
[noarch] 
name=Ceph noarch 
baseurl=https://mirrors.aliyun.com/ceph/rpm-nautilus/el7/noarch/ 
enabled=1 
gpgcheck=0 

[x86_64] 
name=Ceph x86_64 
baseurl=https://mirrors.aliyun.com/ceph/rpm-nautilus/el7/x86_64/ 
enabled=1 
gpgcheck=0
EOF
```



#### 修改 hostname

```Bash
# 第一台节点
hostnamectl set-hostname node1
# 第二台节点
hostnamectl set-hostname node2
# 第三台节点
hostnamectl set-hostname node3
```

并配置好 hosts

```Bash
# 三台节点都执行
cat >> /etc/hosts <<EOF
192.168.10.17 node1
192.168.10.84 node2
192.168.10.18 node3
EOF
```

配置免密登录

```Bash
ssh-keygen
ssh-copy-id root@node1
ssh-copy-id root@node2
ssh-copy-id root@node3
```



```Bash
# 三台节点执行

systemctl disable --now firewalld

setenforce 0

sed -i 's/^SELINUX=.*/SELINUX=disabled/' /etc/selinux/config

yum install -y chrony epel-release wget yum-utils

systemctl enable --now chronyd

yum install -y openssl-devel openssl-static zlib-devel lzma tk-devel xz-devel bzip2-devel ncurses-devel gdbm-devel readline-devel sqlite-devel gcc libffi-devel lvm2
```



```Bash
# 三台节点执行

wget https://www.python.org/ftp/python/3.7.0/Python-3.7.0.tgz

tar -xvf Python-3.7.0.tgz

mv Python-3.7.0 /usr/local && cd /usr/local/Python-3.7.0/

./configure

make

make install

ln -s /usr/local/Python-3.7.0/python /usr/bin/python3
```



```Bash
# 三台节点执行

cd

yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

yum makecache fast

yum install docker-ce-19.03.9 -y

mkdir /etc/docker

echo '{"registry-mirrors": ["http://hub-mirror.c.163.com"]}'>/etc/docker/daemon.json

systemctl enable --now docker
```

#### 手动拉取镜像

安装前先手动拉镜像，不然后续会等很久

```Bash
docker pull quay.io/prometheus/alertmanager:v0.20.0

docker pull quay.io/prometheus/node-exporter:v0.18.1

docker pull quay.io/ceph/ceph:v15

docker pull quay.io/ceph/ceph-grafana:6.7.4

docker pull quay.io/prometheus/prometheus:v2.18.1
```



```Bash
# 第一台节点执行

curl https://raw.githubusercontent.com/ceph/ceph/v15.2.1/src/cephadm/cephadm -o cephadm

chmod +x cephadm

./cephadm add-repo --release octopus

./cephadm install

which cephadm

cephadm --help

# ip 改为 node1 ip

cephadm bootstrap --mon-ip 192.168.10.17
```

输出如下

```Bash
Ceph Dashboard is now available at:



         URL: https://node1:8443/

        User: admin

    Password: s6j3fehvhf



You can access the Ceph CLI with:



    sudo /usr/sbin/cephadm shell --fsid 352b387e-4e89-11ec-814b-fa163ee89d02 -c /etc/ceph/ceph.conf -k /etc/ceph/ceph.client.admin.keyring



....
```



```Bash
# 在 node1 上执行

mkdir -p /etc/ceph

touch /etc/ceph/ceph.conf

alias ceph='cephadm shell -- ceph'

cephadm add-repo --release octopus

cephadm install ceph-common
```



把 ceph key 复制到另外两个节点

```Bash
# 在 node1 上执行

ssh-copy-id -f -i /etc/ceph/ceph.pub root@node2

ssh-copy-id -f -i /etc/ceph/ceph.pub root@node3
# 在 node1 上执行

ceph orch host add node2 192.168.10.84

ceph orch host add node3 192.168.10.18

ceph orch host ls
```



```Bash
# 在 node1 上执行

ceph orch host label add node1 mon

ceph orch host label add node2 mon

ceph orch host label add node3 mon

ceph orch apply mon node1

ceph orch apply mon node2

ceph orch apply mon node3
```



**等待5-10分钟**,到 node2 和 node3 上分别 docker ps 查看容器是否启动了

> quay.io/ceph/ceph:v15 镜像比较大，网速慢的话需要多等一会

node1 上检查一下各组件状态

```Bash
# 在 node1 上执行

ceph orch ls



NAME           RUNNING  REFRESHED  AGE  PLACEMENT  IMAGE NAME                                IMAGE ID

alertmanager       1/1  3m ago     30m  count:1    quay.io/prometheus/alertmanager:v0.20.0   0881eb8f169f

crash              3/3  5m ago     30m  *          quay.io/ceph/ceph:v15                     93146564743f

grafana            1/1  3m ago     30m  count:1    quay.io/ceph/ceph-grafana:6.7.4           557c83e11646

mgr                2/2  3m ago     30m  count:2    quay.io/ceph/ceph:v15                     93146564743f

mon                2/1  5m ago     17m  node3      quay.io/ceph/ceph:v15                     93146564743f

node-exporter      3/3  5m ago     30m  *          quay.io/prometheus/node-exporter:v0.18.1  e5a616e4b9cf

prometheus         1/1  3m ago     30m  count:1    quay.io/prometheus/prometheus:v2.18.1     de242295e225
```

所有组件都启动就算成功。



```Bash
# 在 node1 上执行



# 查看磁盘设备

ceph orch device ls 



# 全部添加为 osd,这一步也会比较慢，命令执行后会阻塞一会

ceph orch daemon add osd node1:/dev/vdb

ceph orch daemon add osd node2:/dev/vdb

ceph orch daemon add osd node3:/dev/vdb
```



```Bash
# 在 node1 上执行

ceph -s

  cluster:

    id:     54fdc000-5059-11ec-90ee-fa163e5480e1

    health: HEALTH_OK
```



### **k8s 使用 pool 池**



创建 pool

```Bash
# 'kubernetes' 为 pool 池名字  指定 pg 和 pgp 的数量

ceph osd pool create kubernetes 2 2

# 初始化 pool 池

rbd pool init kubernetes
```



```Bash
# 获取这个 pool 池的 key

ceph auth get-or-create client.kubernetes mon 'profile rbd' osd 'profile rbd pool=kubernetes' mgr 'profile rbd pool=kubernetes'
```

输出如下

```Bash
[client.kubernetes]

    key = AQDzejZjnpmfNxAAhfEbxS69NI8FC3bP4bQ4bA==
```

获取这个集群 id 和监控 ip（6789）

```Bash
ceph mon dump
```

输出如下

```Bash
dumped monmap epoch 4

epoch 4

fsid 54fdc000-5059-11ec-90ee-fa163e5480e1

last_changed 2021-11-28T16:39:28.535942+0000

created 2021-11-28T14:45:03.950016+0000

min_mon_release 15 (octopus)

0: [v2:10.0.0.199:3300/0,v1:10.0.0.199:6789/0] mon.node1

1: [v2:10.0.0.224:3300/0,v1:10.0.0.224:6789/0] mon.node2
```



参数说明

- kubernetes：pool 池名称
- key：后面的 value 是 pool 池的名称
- fsid：ceph 集群 id
- mon：集群 monitor ， 通常使用 xxx.xxx.xxx.xxx:6789, 可以使用一个或者使用多个 monitor





### FAQ

#### Cannot infer an fsid, one must be specified

执行 ceph 命令可能会出现以下错误

```Bash
ERROR: Cannot infer an fsid, one must be specified: ['28478564-4068-11ed-99e0-fa163ebb9767', '5b4b715c-4066-11ed-bdda-fa163ebb9767']
```

这时执行 ceph 命令时需要指定 fsid

```Bash
# 先去掉命令 alias

unalias ceph
```

 然后查看 ceph cluster fsid

```Bash
[root@ceph-1 ~]# ceph -s

  cluster:

    id:     28478564-4068-11ed-99e0-fa163ebb9767

    health: HEALTH_WARN

            Reduced data availability: 3 pgs inactive

            OSD count 0 < osd_pool_default_size 3



  services:

    mon: 1 daemons, quorum node1 (age 20m)

    mgr: node1.ffwtzi(active, since 19m)

    osd: 0 osds: 0 up, 0 in



  data:

    pools:   3 pools, 3 pgs

    objects: 0 objects, 0 B

    usage:   0 B used, 0 B / 0 B avail

    pgs:     100.000% pgs unknown

             3 unknown
```

最后在更新一下 alias

```Bash
alias ceph='cephadm shell --fsid 28478564-4068-11ed-99e0-fa163ebb9767 -- ceph'
```