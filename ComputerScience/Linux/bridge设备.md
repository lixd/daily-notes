# Linux bridge 设备

> [Linux虚拟网络设备之bridge(桥)](https://segmentfault.com/a/1190000009491002)
>
> [linux bridge实践](https://zhuanlan.zhihu.com/p/339070912)



## 1. 什么是bridge？

首先，bridge是一个**虚拟网络设备**，所以具有网络设备的特征，可以配置IP、MAC地址等；其次，bridge是一个**虚拟交换机**，和物理交换机有类似的功能。

> 可以简单理解成交换机。

对于普通的网络设备来说，只有两端，从一端进来的数据会从另一端出去，如物理网卡从外面网络中收到的数据会转发给内核协议栈，而从协议栈过来的数据会转发到外面的物理网络中。

而bridge不同，bridge有多个端口，数据可以从任何端口进来，进来之后从哪个口出去和物理交换机的原理差不多，要看mac地址。



## 2. 相关命令

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
