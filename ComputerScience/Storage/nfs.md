## 1. NFS 安装

> 基于 CentOS 7 测试，Redhat 系列应该都行。

[Linux安装和配置NFS服务 ](https://www.htype.top/2021/827715975980)

### 什么是 NFS

NFS 即：Network File System（网络文件系统），基于内核的文件系统。

Sun 公司开发，通过使用 NFS，用户和程序可以像访问本地文件一样访问远端系统上的文件。主要用于Linux之间文件共享。

基于RPC（Remote Procedure Call Protocol 远程过程调用）实现，采用C/S模式，客户机发送一个请求信息给服务进程，然后等待访问端应答。服务端在收到信息之前会保持睡眠状态。

NFS文件系统常运用于内网，因为它部署方便、简单易用、稳定、可靠，如果是大型环境则会用到分布式文件系统比如FastDFS、HDFS、MFS。



### 安装

需要的软件包`nfs-utils`和`rpcbind`

* nfs-utils：是 NFS 服务器的主要软件包。
* rpcbind：由于 NFS 基于 RPC 服务实现所以依赖此包，一般情况下安装了 nfs-utils 后会自动安装。

```bash
yum install nfs-utils rpcbind
```



### 配置

NFS 默认使用`/etc/exports`作为配置文件，如果没有则手动创建该文件。

内容如下：

```bash
# 语法：共享目录	主机(权限) [主机2(权限)]
# 例子
/doc	*(ro,sync)
/tmp/nfs/data	*(rw,sync,no_root_squash)
```

可同时授权多个主机及权限，使用空格分隔，详细参数查询命令`man exports`。

参数解释：

- **共享目录**：需要用NFS共享出去的目录、
  - 指定需要共享给其他主机的目录，格式为绝对路径
- **主机**：指定哪些主机可以用此NFS、
  - 单个主机IP地址：192.168.0.200
  - 一个子网：192.168.0.0/24
  - 单个主机域名：[www.htype.top](http://www.htype.top/)
  - 域下的所有子域名：*.htype.top
  - 所有主机：*
- **权限**：此共享目录的权限
  - 权限里包括目录访问权限，用户映射权限等等，权限之间用`，`分隔、
  - **只读：ro**
  - **读写：rw**
  - **sync**：同步，数据同时写入内存与磁盘中，效率低，但可以保证数据的一致性（1.0.0版本后为默认）；
  - **async**：异步，数据先保存在内存中，必要时写入磁盘，可提高性能但服务器意外停止会丢失数据；
  - **all_squash**：不论登陆者以什么身份，都会被映射为匿名用户（nfsnobody）；
  - **no_all_squash**：以登陆者的身份，不做映射，包括文件所属用户和组（默认）；
  - **root_squash**：将root用户及所属组都映射为匿名用户或用户组（默认）；
  - **no_root_squash**：开放客户端使用root的身份来操作服务器文件系统，命令文档写的“主要用于无盘客户端”；
  - anonuid=xxx：所以用户都映射为匿名账户，并指定UID（用户ID）；
  - anongid=xxx：所有用户都映射为匿名账户，并指定GID（组ID）；





### 相关命令

#### 服务端

立即生效配置

```bash
exportfs -r
```

查看共享目录信息

```bash
exportfs -v
```



nfs 使用 systemd 管理，相关命令如下

```bash
systemctl enable nfs-server.service
systemctl start nfs-server.service
systemctl stop nfs-server.service
systemctl restart nfs-server.service
```



#### 客户端

查看服务器共享了哪些目录

```bash
showmount -e {serverIP}
```

挂载目录

```bash
# 语法：mount serverIP:目录 挂载点
# 将192.168.1.2的nfs共享目录/tmp/nfs/data 挂载到本地/mnt
mount 192.168.1.2:/tmp/nfs/data /mnt
```

配置开机自动挂载

```bash
vi /etc/fstab		#编辑文件#
##添加下面行：
192.168.1.2:/tmp/nfs/data	/mnt	nfs	 defaults	0 0
```

与传统挂载磁盘不同的是，需挂载的设备改成了NFS地址的方式。挂载点还是那个熟悉的挂载点。



### mountOptions

[nfs man page](https://linux.die.net/man/5/nfs)

[nfs 常用挂载选项](https://web.mit.edu/rhel-doc/5/RHEL-5-manual/Deployment_Guide-en-US/s1-nfs-client-config-options.html)

[NFS挂载参数详解及使用建议](https://blog.csdn.net/qq_43355223/article/details/122682180)

[解决NFS client配置rszie和wsize不生效](https://blog.51cto.com/lixin15/1768956)



```bash
# 语法：mount -t <nfs-type> -o <options>  <host> : </remote/export>  </local/directory>
mount -t nfs -o timeo=60 172.20.150.199:/tmp/nfs/data /tmp/nfs/mnt
```



更多信息参考`man nfs`

mount options 好像会冲突，比如默认是 hard 模式，这时候 timeo 就不会生效。



```bash
mount -t nfs -o soft,timeo=120 172.20.150.199:/tmp/nfs/data /tmp/nfs/mnt
```

测试发现并不是所有 mount options 都会生效

> soft、timeo 是生效的，单独 timeo 不生效



**可能是版本问题，挂载时指定 vers=4.0 之后其他的选项就能生效了..**

```bash
mount -t nfs -o nfsvers=4.0,timeo=60,retrans=3 172.20.150.199:/tmp/nfs/data /tmp/nfs/mnt
```



```bash
mount -t nfs4 -o sec=r 172.20.150.199:/tmp/nfs/data /tmp/nfs/mnt
```



```bash
mount -t nfs4 -o "timeo=60,retrans=3" 172.20.150.199:/tmp/nfs/data /tmp/nfs/mnt
```





```bash
# mount
mount -t nfs -o versretry=120 172.20.150.199:/tmp/nfs/data /tmp/nfs/mnt
# 查看挂载参数生效没
cat /proc/mounts | grep nfs
# 另一种查看方式
nfsstat -m 
# 卸载继续重试
umount  /tmp/nfs/mnt
```

