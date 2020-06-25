# ubuntu 设置静态 IP

## ubuntu 18.04、20.04

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
        ens33: #配置的网卡名称 ip addr 命令查看
          dhcp4: false
          dhcp6: false
          addresses: [192.168.1.99/24] #设置本机IP及掩码
          gateway4: 192.168.1.1 #设置网关 和宿主机相同
          nameservers:
            addresses: [114.114.114.114] #设置DNS
    version: 2
```

使配置生效 `netplan apply`


