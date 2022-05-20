# ceph

[cephadm](https://docs.ceph.com/en/latest/cephadm/install/)

[cephadm部署ceph集群](https://blog.csdn.net/networken/article/details/106870859)

[如何在 CentOS 7 上搭建 Ceph 分布式存储集群](https://www.howtoforge.com/tutorial/how-to-build-a-ceph-cluster-on-centos-7/)

[centos7.8安装ceph-13.2.10-mimic （非常详细）](https://blog.csdn.net/weixin_42126962/article/details/108932303)

使用 cephadm 安装 ceph 集群。

> 操作系统：Centos 7.9
>
> 硬件：4C8G 100G SSD



### REQUIREMENTS

- Python 3
  - [Centos7安装Python3的方法](https://www.cnblogs.com/FZfangzheng/p/7588944.html)
  - [CentOS7 yum 安装python3](https://blog.csdn.net/wudinaniya/article/details/103713514)
  - 另外使用 yum 安装 ceph 时会自动安装 python3
- Systemd
- Podman or Docker for running containers
  - 这里用的是 Docker

- Time synchronization (such as chrony or NTP)
- LVM2 for provisioning storage devices



### install docker



### install cephadm

使用 dnf 来安装，没有的话先安装 dnf

```bash
yum install -y dnf
```

```bash
dnf search release-ceph
dnf install --assumeyes centos-release-ceph-quincy
dnf install --assumeyes cephadm
```



### bootstrap

创建新Ceph群集的第一步是在Ceph群集的第一台主机上运行cephadm bootstrap命令。在Ceph集群的第一台主机上运行cephadm bootstrap命令会创建Ceph集群的第一个“monitor daemon”

```bash
cephadm bootstrap --mon-ip 192.168.10.3
```

> 过程中会去拉取镜像( quay.io/ceph/ceph)，可能会比较慢,耐心等待或者提前准备好镜像。

此命令将：

- 在本地主机上为新群集创建监视器和管理器守护程序。
- 为Ceph集群生成一个新的SSH密钥，并将其添加到root用户的/root/.ssh/authorized_keys 文件
- 将公钥的副本写入/etc/ceph/ceph.pub
- 将最小配置文件写入/etc/ceph/ceph.conf. 需要此文件才能与新群集通信
- 写一份client.admin管理（特权！）/etc/ceph/ceph.client.admin.keyring的密钥
- 将_admin标签添加到引导主机。默认情况下，任何带有此标签的主机（也）都将获得/etc/ceph/ceph.conf和/etc/ceph/ceph.client.admin.keyring的副本



最后输出如下：

```bash
Ceph Dashboard is now available at:

             URL: https://ceph-1:8443/
            User: admin
        Password: afintmz5y8

You can access the Ceph CLI with:

        sudo /usr/sbin/cephadm shell --fsid d446c4d4-d712-11ec-befb-fa163e4eaba5 -c /etc/ceph/ceph.conf -k /etc/ceph/ceph.client.admin.keyring

Please consider enabling telemetry to help improve Ceph:

        ceph telemetry on

For more information see:

        https://docs.ceph.com/docs/master/mgr/telemetry/

Bootstrap complete.
```



默认在 8443 端口运行了一个 dashboard。

```bash
             URL: https://ceph-1:8443/
            User: admin
        Password: afintmz5y8
```



### 启用 ceph cli

有三种方式

1）该命令在安装了所有 Ceph 软件包的容器中启动 bash shell,在新的 bash shell 就可以使用 ceph cli 了

```bash
cephadm shell
```

2）同方式 1，不过是直接将命令传递给 shell

```bash
cephadm shell -- ceph -v
cephadm shell -- ceph status
```

3）直接在宿主机安装 ceph 命令

```bash
cephadm add-repo --release quincy
cephadm install ceph-common
```

这步可能会安装失败，还是用 方式 1 或者 2 吧。。



### [cephadm-adding-hosts](https://docs.ceph.com/en/latest/cephadm/host-management/#cephadm-adding-hosts)

接下来，将所有主机添加到集群。

待添加的主机也需要满足前面提到的要求，并且需要配置 ssh 免密登陆。

```bash
ceph orch host add $hostname $ip
```

```bash
[ceph: root@ceph-1 /]# ceph orch host add ceph-2 192.168.10.201
Added host 'ceph-2'
[ceph: root@ceph-1 /]# ceph orch host add ceph-3 192.168.10.102
Added host 'ceph-3'
```

删除主机也很简单

```bash
ceph orch host drain *<host>*
```



