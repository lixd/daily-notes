# Linux bridge 设备

Bridge 虚拟设备是用来桥接的网络设备，它相当于现实世界中的交换机，可以连接不同的网络设备，当请求到达 Bridge 设备时，可以通过报文中的 Mac 地址进行广播或转发。

例如，我们可以创建一个 Bridge 设备来连接 Namespace 中的网络设备和宿主机上的网络。

```shell
#创建veth设备并将一端移动到指定Namespace中
$ sudo ip netns add ns1
$ sudo ip link add veth0 type veth peer name veth1
$ sudo ip link set veth1 netns ns1
# 先安装bridge-utils
$ sudo apt-get install bridge-utils
#创建网桥,
$ sudo brctl addbr br0
#挂载网络设备
$ sudo brctl addif br0 eth0
$ sudo brctl addif br0 veth0
```



[linux bridge实践](