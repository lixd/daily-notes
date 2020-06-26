# Linux namespace



## 1. network namespace

查看`network namespace`列表

```sh
sudo ip netns list
# 添加一个叫test1的network namespace
sudo ip netns add test1 
# 删除
sudo ip netns del test1 
#查看link列表
sudo ip link

```

添加两个的`network namespace`

```sh
sudo ip netns add test1 
sudo ip netns add test2
```

再次查看`network namespace`列表,添加成功

```sh
sudo ip netns list
test1 test2
```

查看`test1` 中的`link`列表,只有一个`link`并且还是`DOWN`状态的

```sh
sudo ip netns exec test1 ip link

1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state DOWN mode DEFAULT group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
```

up link

```sh
sudo ip netns exec test1 ip link set dev lo up
```

再次查看,发现并没有成功启动 反而变成`UNKNOW`状态了

```sh
sudo ip netns exec test1 ip link

1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOW mode DEFAULT group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
```



单独的一个`network namespace`无法up起来 必须要一对(两个)才行。

可以通过`Veth pari`来连接两个`network namespace`。这就是为什么创建的容器是可以互相连通的。

## 2. Veth pair

```sh
sudo ip link add veth-test1 type veth peer name veth-test2
```

创建两个Veth pair

```sh
sudo ip link add veth-test1 type veth peer name veth-test2
```

再次查看`link`列表 可以发现多了两个`link`

```sh
$ sudo ip link

1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: ens33: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
    link/ether 00:0c:29:9c:5c:e3 brd ff:ff:ff:ff:ff:ff
3: veth-test2@veth1-test1: <BROADCAST,MULTICAST,M-DOWN> mtu 1500 qdisc noop state DOWN mode DEFAULT group default qlen 1000
    link/ether 36:87:40:36:f9:9a brd ff:ff:ff:ff:ff:ff
4: veth1-test1@veth-test2: <BROADCAST,MULTICAST,M-DOWN> mtu 1500 qdisc noop state DOWN mode DEFAULT group default qlen 1000
    link/ether 4e:87:69:66:35:69 brd ff:ff:ff:ff:ff:ff
```

接下来将`veth` 添加到`network namespace`中去

```sh
sudo ip link set veth-test1 netns test1
sudo ip link set veth-test2 netns test2
```

查看是否添加成功,可以看到多出来了一个`link` 

```sh
 sudo ip netns exec test1 ip link

1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: veth-test1@if9: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN mode DEFAULT group default qlen 1000
    link/ether 76:34:ae:8d:e5:ae brd ff:ff:ff:ff:ff:ff link-netnsid 0
```



现在只是添加了`veth`但是还没有分配IP，接下来开始分配IP。

```sh
sudo ip netns exec test1 ip addr add 192.168.1.1/24 dev veth-test1
sudo ip netns exec test2 ip addr add 192.168.1.2/24 dev veth-test2
```

添加后再次查看,发现还是没有IP。

```sh
sudo ip netns exec test1 ip link

1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: veth-test1@if9: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN mode DEFAULT group default qlen 1000
    link/ether 76:34:ae:8d:e5:ae brd ff:ff:ff:ff:ff:ff link-netnsid 0
```

那就先up之后再看

```sh
sudo ip netns exec test1 ip link set dev veth-test1 up
sudo ip netns exec test1 ip link set dev veth-test2 up
```

查看状态,可以看到现在已经UP起来了

```sh
sudo ip netns exec test1 ip link

1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN mode DEFAULT group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: veth-test1@if10: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP mode DEFAULT group default qlen 1000
    link/ether 7e:87:11:40:f5:ce brd ff:ff:ff:ff:ff:ff link-netnsid 0
```

查看IP，为`192.168.1.1`说明添加成功

```sh
sudo ip netns exec test1 ip addr
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: veth-test1@if10: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether 7e:87:11:40:f5:ce brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 192.168.1.1/24 scope global veth-test2
       valid_lft forever preferred_lft forever
    inet6 fe80::7c87:11ff:fe40:f5ce/64 scope link 
       valid_lft forever preferred_lft forever
```

测试是否连通,在test1中ping 192.168.1.2(test2)

```sh
sudo ip netns exec test1 ping 192.168.1.2
PING 192.168.1.2 (192.168.1.2) 56(84) bytes of data.
64 bytes from 192.168.1.2: icmp_seq=1 ttl=64 time=0.453 ms
64 bytes from 192.168.1.2: icmp_seq=2 ttl=64 time=0.027 ms
64 bytes from 192.168.1.2: icmp_seq=3 ttl=64 time=0.027 ms
^C
--- 192.168.1.2 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2056ms
rtt min/avg/max/mdev = 0.027/0.169/0.453/0.200 ms
```
说明连接成功了。
两个docker容器之间能够连通 大致也是这个原理。

## 3. Container

docker容器之间通信和上面的原理大致相同。也是使用`veth pair`进行连接。

假设当前有两个容器,A和B。

与前面唯一不同的一点就是，这里不是A与B直接相连。

而是A与docker网络相连，同时B也是docker网络相连。这样间接的连通两个容器。