# linux设置静态ip

> 这里说的是通过VMware虚拟机安装的情况

## centos7

默认安装好centos7之后只有`ip addr`命令可以用

默认网卡`ens33`没有配置 `ipv4`及 `ipv6`，即无法上网。

CentOS7默认网卡设备文件存放于`/etc/sysconfig/network-scripts/`

直接修改即可

当然不一定都叫`ifcfg-ens33`这个名字 

```sh
vi /etc/sysconfig/network-scripts/ifcfg-ens33
```

修改如下内容

```sh
BOOTPROTO=static #设置网卡引导协议为 静态
ONBOOT=yes #设置网卡启动方式为 开机启动 并且可以通过系统服务管理器 systemctl 控制网卡
IPADDR=192.168.1.111 #IP
NETMASK=255.255.255.0 #子网掩码
GATEWAY=192.168.1.1 #网关
DNS1=8.8.8.8
DNS2=114.114.114.114
```

设置这IP网关等参数要根据你当前所处的网络环境。

保存退出重启网络服务即可

```sh
systemctl restart network
```





