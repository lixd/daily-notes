## veth-pair

### veth-pair

顾名思义，veth-pair 就是一对的虚拟设备接口，和 tap/tun 设备不同的是，它都是成对出现的。一端连着协议栈，一端彼此相连着。

一般用于跨 namespace 通信。

> Linux 中默认不同 net namespace 设备无法通信。



### 网络命名空间

为了支持网络协议栈的多个实例，Linux在网络栈中引入了网络命名空间。这些独立的协议栈被隔离到不同的命名空间中。

> 处理不同网络命令空间中的



### Demo

本次演示中，先创建一个网络命名空间，然后创建一个 veth 设备对，将设备对分别切换到不同的命名空间中，实现不同命名空间的互相通信。



准备一个 net namespace

```sh
# 1创建 namespace
$ ip netns add netns1
# 查询
$ ip netns list
netns1 (id: 0)
```





创建两个Veth设备对

```sh
$ ip link add veth0 type veth peer name veth1
# 查询
$ ip link show
```

此时两个 veth 都在默认 net namespace中，为了测试，先将其中一个切换到 netns1

```sh
$ ip link set veth1 netns netns1
# 此时再看就只能看到一个了
$ ip link show
# 去 netns 中查询
$ ip netns exec netns1 ip link show
```

至此，两个不同的命名空间各自有一个Veth，不过还不能通信，因为我们还没给它们分配IP

```sh
$ ip netns exec netns1 ip addr add 10.1.1.1/24 dev veth1
$ ip addr add 10.1.1.2/24 dev veth0
```

再启动它们

```sh
$ ip netns exec netns1 ip link set dev veth1 up
$ ip link set dev veth0 up
```

现在两个网络命名空间可以互相通信了

```sh
$ ping 10.1.1.1
```



至此，Veth设备对的基本原理和用法演示结束。

> Docker 内部，Veth设备对也是连通容器与宿主机的主要网络设备。



### 查看对端设备

由于 Veth 设备对被移动到另一个命名空间后在当前命名空间中就看不到了。

那么该如何知道这个Veth设备的另一端在哪儿呢？

可以使用 ethtool 工具来查看：

```sh
$ ip netns exec netns1 ethtool -S veth1
NIC statistics:
     peer_ifindex: 8
     // 省略其他结果
```

peer_ifindex 就是另一端的接口设备的序列号，这里是 8。

然后在到默认命名空间取看 序列化8代表的是什么设备：

```sh
$ ip link | grep 8
8: veth0@if7: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN mode DEFAULT group default qlen 1000
    link/ether 52:53:24:06:77:f8 brd ff:ff:ff:ff:ff:ff link-netns netns1
```

可以看到 序列号8的设备就是 veth0，它的另一端就是 netns1 中的 veth1，它们互为 peer。

