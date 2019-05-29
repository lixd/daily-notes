# ubuntu 设置静态 IP

## ubuntu 18.04

编辑 `vi /etc/netplan/50-cloud-init.yaml` 配置文件，注意这里的配置文件名未必和你机器上的相同，请根据实际情况修改。修改内容如下：

```yaml
network:
    ethernets:
        ens33: #配置的网卡名称 ip addr 命令查看
          dhcp4: false
          dhcp6: false
          addresses: [192.168.1.6/24] #设置本机IP及掩码
          gateway4: 192.168.1.1 #设置网关 和宿主机相同
          nameservers:
            addresses: [114.114.114.114] #设置DNS
    version: 2
```

使配置生效 `netplan apply`

## ubuntu 12.04

在vmware 的桥接模式下，设置ubuntu 的静态IP 地址。

直接打开  /etc/network/interfaces 文件，该文件在开始时，只有以下内容

```
auto lo
iface lo inet loopback
```

然后直接在文件的后面增加设置，修改后的内容变为

```
auto lo
iface lo inet loopback

auto eth0
iface eth0 inet static
address 192.168.31.99
netmask 255.255.255.0
gateway 192.168.31.1
dns-nameservers 211.136.20.203
```

读者们要注意的，eth0 这个参数，应该和读者自己的机器ifconfig 输出相符，dns-nameservers 参数是一定要设置的，否则会无法上网。

## ubuntu 14.04

直接打开  /etc/network/interfaces 文件，该文件在开始时，只有以下内容

```
auto lo
iface lo inet loopback
```

然后直接在文件的后面增加设置，修改后的内容变为

```
auto lo
iface lo inet loopback

auto eth0
iface eth0 inet static
address 192.168.31.99
netmask 255.255.255.0
gateway 192.168.31.1
dns-nameservers 211.136.20.203
```

读者们要注意的，eth0 这个参数，应该和读者自己的机器ifconfig 输出相符，dns-nameservers 参数是一定要设置的，否则会无法上网。

在 ubuntu 14.04 中，前面的设置和 ubuntu 12.04 相同，但是还需要再修改一个文件`/etc/NetworkManager/NetworkManager.conf`，将里面的 `managed` 参数设置为true，然后重启机器即可。



## ubuntu 16.04

首先需要修改 /etc/network/interfaces

增加

```
auto ens33
iface ens33 inet static
address 192.168.88.181
netmask 255.255.255.0
gateway 192.168.88.2
```

（注意，ubuntu 16之后的网卡名字不再是 eth0 之类，而是其他名字，例如作者这里就是 ens33，还有 dns-server 这一行一定要写，否则会设置失败）

修改/etc/NetworkManager/NetworkManager.conf 文件，将 managed 设置为 true

设置 /etc/resolvconf/resolv.conf.d/base，增加

```
nameserver 223.5.5.5
nameserver 223.6.6.6
```

因为机器在重启后，真正读取dns 的配置是在 /etc/resolv.conf，但是 /etc/resolv.conf 的数据来源于 /etc/resolvconf/resolv.conf.d/base

用户可以通过以下命令查看 /etc/resolvconf/resolv.conf.d/base 的值是否被刷到 /etc/resolv.conf 上

```
resolvconf -u
```

重启网络服务

```
/etc/init.d/networking restart
```

## 参考

`https://www.cnblogs.com/longronglang/p/6832137.html`

`https://www.cnblogs.com/dsdr/p/6143706.html`

`http://blog.sina.com.cn/s/blog_5373bcf40102xk5g.html`

`https://www.cnblogs.com/chenfool/p/7985909.html`