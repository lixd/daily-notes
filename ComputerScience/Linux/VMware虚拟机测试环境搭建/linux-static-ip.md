# linux 设置静态 IP

## ubuntu 

> 适用于 18.04、20.04

相关配置文件在`/etc/netplan`目录下，当前机器上的文件名为`50-cloud-init.yaml`

注意这里的配置文件名未必和你机器上的相同，请根据实际情况修改。

```shell
cd /etc/netplan
sudo vi 50-cloud-init.yaml
```

修改内容如下：

```yaml
network:
  ethernets: 
    ens33: 
      # 关闭DHCP服务
      dhcp4: false
      dhcp6: false
      # IP
      addresses:
        - 192.168.2.99/24
      # 网关  
      gateway4: 192.168.2.2
      # DNS
      nameservers:
        addresses:
          - 114.114.114.114 
  version: 2
```

使配置生效 `netplan apply`

## centos

> 适用于 CentOS7

默认网卡设备文件存放于`/etc/sysconfig/network-scripts/`

当然不一定都叫`ifcfg-ens33`这个名字 

```sh
vi /etc/sysconfig/network-scripts/ifcfg-ens33
```

修改如下内容

```sh
BOOTPROTO=static #设置网卡引导协议为 静态
ONBOOT=yes #设置网卡启动方式为 开机启动 并且可以通过系统服务管理器 systemctl 控制网卡
```

新增如下内容

```sh
IPADDR=192.168.2.111 #IP
NETMASK=255.255.255.0 #子网掩码
GATEWAY=192.168.2.2 #网关
DNS1=8.8.8.8
DNS2=114.114.114.114
```

设置这 IP 网关等参数要根据你当前所处的网络环境。

保存退出重启网络服务即可

```sh
systemctl restart network
```

