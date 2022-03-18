# VLAN & VxLAN

> [图文并茂VLAN详解，让你看一遍就理解VLAN](https://blog.51cto.com/u_6930123/2115373)
>
> [什么是VXLAN](https://support.huawei.com/enterprise/zh/doc/EDOC1100087027)
>
> [解读VXLAN](http://www.h3c.com/cn/d_201811/1131076_30005_0.htm)
>
> [路由表(RIB表、FIB表)、ARP表、MAC表整理](https://blog.csdn.net/s2603898260/article/details/117201453)
>
> [VXLAN vs VLAN](https://zhuanlan.zhihu.com/p/36165475)



## 1. 概述

VxLAN 核心就是 Mac in UDP，发送方将二层数据包封装到 UDP 包中，通过三层 IP 网络进行传递，接收方再将具体数据从 UDP 包中解出来，从而实现基于三层网络的`大二层网络`。



至于为什么用 UDP 封装而不是 TCP 或者 IP。

要扩大二层网络，那么只能封装成上层的数据，比如三层或者四层，一共有 3个 选择，IP、TCP、UDP。

> 这里是指的 OSI 7层模型中的二三四层。



IP 层没有端口传输时遇到NAT无法穿透，因此排除，TCP 头部比较大，而且是可靠的，相对 UDP 来说会慢一些，因此最终选择了 UDP。

> 至于可靠性的话就得由业务数据保证，而且 VxLAN 一般用在数据中心，出问题的概率比外面公网会小很多。









