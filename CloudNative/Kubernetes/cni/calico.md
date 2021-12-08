# Calico

> [calico网络原理分析](https://blog.csdn.net/jiang_shikui/article/details/85870560)
>
> [Calico的工作原理](https://zhuanlan.zhihu.com/p/402060452)
>
> [k8s网络之Calico网络](https://www.cnblogs.com/goldsunshine/p/10701242.html)

## 1. 概述

Calico是一个纯三层的协议，为OpenStack虚机和Docker容器提供多主机间通信。Calico不使用重叠网络比如flannel和libnetwork重叠网络驱动，它是一个纯三层的方法，使用虚拟路由代替虚拟交换，每一台虚拟路由通过BGP协议传播可达信息（路由）到剩余数据中心。



具体实现包括两种模式：

* IPIP：创建tunl0网络接口，将ip包包装在另一个ip包里，通过虚拟tunl0设备转发出去
  * 设置 CALICO_IPV4POOL_IPIP="on"
* BGP：直接使用物理机网卡作为路由器进行转发
  * 设置 CALICO_IPV4POOL_IPIP="on"



大致流程：

- 1）容器流量通过veth pair到达宿主机的网络命名空间上。
- 2）根据容器要访问的IP所在的子网CIDR和主机上的路由规则，找到下一跳要到达的宿主机IP。
- 3）流量到达下一跳的宿主机后，根据当前宿主机上的路由规则，直接到达对端容器的veth pair插在宿主机的一端，最终进入容器。

calico的各个组件通过操作linux 路由表、iptables等来控制数据包的流向，本身不接触数据包。即使停掉calico组件，只要路由表记录还在，便不影响容器通信。