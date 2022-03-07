# 创建Bridge网络

## 1. 概述

这一节将实现通过 `mydocker network create -d bridge testnet `的方式创建和配置 Linux Bridge ，供容器的网络端点挂载，即实现 NetworkDriver 接口的 Create 方法。



## 2. 实现

### Create

```go
func (d *BridgeNetworkDriver) Create(subnet string, name string) (*Network, error) {
	ip, ipRange, _ := net.ParseCIDR(subnet)
	ipRange.IP = ip
	n := &Network{
		Name:    name,
		IPRange: ipRange,
		Driver:  d.Name(),
	}
	err := d.initBridge(n)
	if err != nil {
		return nil, errors.Wrapf(err, "Failed to create bridge network")
	}
	return n, err
}
```



###  Linux Bridge 初始化流程

Linux Bridge 初始化流程如下：

* 1）创建 Bridge 虚拟设备
* 2）设置 Bridge 设备地址和路由
* 3）启动 Bridge 设备
* 4）设置 iptables SNAT 规则



```go
func (d *BridgeNetworkDriver) initBridge(n *Network) error {
	bridgeName := n.Name
	// 1）创建 Bridge 虚拟设备
	if err := createBridgeInterface(bridgeName); err != nil {
		return errors.Wrapf(err, "Failed to create bridge %s", bridgeName)
	}

	// 2）设置 Bridge 设备地址和路由
	gatewayIP := *n.IPRange
	gatewayIP.IP = n.IPRange.IP

	if err := setInterfaceIP(bridgeName, gatewayIP.String()); err != nil {
		return errors.Wrapf(err, "Error set bridge ip: %s on bridge: %s", gatewayIP.String(), bridgeName)
	}
	// 3）启动 Bridge 设备
	if err := setInterfaceUP(bridgeName); err != nil {
		return errors.Wrapf(err, "Failed to set %s up", bridgeName)
	}

	// 4）设置 iptables SNAT 规则
	if err := setupIPTables(bridgeName, n.IPRange); err != nil {
		return errors.Wrapf(err, "Failed to set up iptables for %s", bridgeName)
	}

	return nil
}
```



#### 创建 bridge 虚拟设备

主要实现下面这个命令

```shell
$ ip link add xxx
```



```go
// createBridgeInterface 创建Bridge设备
func createBridgeInterface(bridgeName string) error {
	// 先检查是否己经存在了这个同名的Bridge设备
	_, err := net.InterfaceByName(bridgeName)
	// 如果已经存在或者报错则返回创建错
	// errNoSuchInterface这个错误未导出也没提供判断方法，只能判断字符串了。。
	if err == nil || !strings.Contains(err.Error(), "no such network interface") {
		return err
	}

	// create *netlink.Bridge object
	la := netlink.NewLinkAttrs()
	la.Name = bridgeName
	// 使用刚才创建的Link的属性创netlink Bridge对象
	br := &netlink.Bridge{LinkAttrs: la}
	// 调用 net link Linkadd 方法，创 Bridge 虚拟网络设备
	// netlink.LinkAdd 方法是用来创建虚拟网络设备的，相当于 ip link add xxxx
	if err = netlink.LinkAdd(br); err != nil {
		return errors.Wrapf(err, "create bridge %s error", bridgeName)
	}
	return nil
}
```



#### 设置 Bridge 设备的地址和路由

```shell
$ ip addr add xxx
```

```go
func setInterfaceIP(name string, rawIP string) error {
   retries := 2
   var iface netlink.Link
   var err error
   for i := 0; i < retries; i++ {
      // 通过LinkByName方法找到需要设置的网络接口
      iface, err = netlink.LinkByName(name)
      if err == nil {
         break
      }
      log.Debugf("error retrieving new bridge netlink link [ %s ]... retrying", name)
      time.Sleep(2 * time.Second)
   }
   if err != nil {
      return errors.Wrap(err, "abandoning retrieving the new bridge link from netlink, Run [ ip link ] to troubleshoot")
   }
   // 由于 netlink.ParseIPNet 是对 net.ParseCIDR一个封装，因此可以将 net.PareCIDR中返回的IP进行整合
   // 返回值中的 ipNet 既包含了网段的信息，192 168.0.0/24 ，也包含了原始的IP 192.168.0.1
   ipNet, err := netlink.ParseIPNet(rawIP)
   if err != nil {
      return err
   }
   // 通过  netlink.AddrAdd给网络接口配置地址，相当于ip addr add xxx命令
   // 同时如果配置了地址所在网段的信息，例如 192.168.0.0/24
   // 还会配置路由表 192.168.0.0/24 转发到这 testbridge 的网络接口上
   addr := &netlink.Addr{IPNet: ipNet}
   return netlink.AddrAdd(iface, addr)
}
```



#### 启动 Bridge 设备

```shell
$ ip link set xxx up
```



```go
func setInterfaceUP(interfaceName string) error {
	link, err := netlink.LinkByName(interfaceName)
	if err != nil {
		return errors.Wrapf(err, "error retrieving a link named [ %s ]:", link.Attrs().Name)
	}
	// 等价于 ip link set xxx up 命令
	if err = netlink.LinkSetUp(link); err != nil {
		return errors.Wrapf(err, "nabling interface for %s", interfaceName)
	}
	return nil
}
```



Linux 的网络设备只有设置成 UP 态后才能处理和转发请求。



#### 设置 iptabels Linux Bridge SNAT 规则

```shell
$ iptables -t nat -A POSTROUTING -s 172.18.0.0/24 -o eth0 -j MASQUERADE
# 语法：iptables -t nat -A POSTROUTING -s {subnet} -o {deviceName} -j MASQUERADE
```



```go
// setupIPTables 设置 iptables 对应 bridge MASQUERADE 规则
func setupIPTables(bridgeName string, subnet *net.IPNet) error {
	// 拼接命令
	iptablesCmd := fmt.Sprintf("-t nat -A POSTROUTING -s %s ! -o %s -j MASQUERADE", subnet.String(), bridgeName)
	cmd := exec.Command("iptables", strings.Split(iptablesCmd, " ")...)
	// 执行该命令
	output, err := cmd.Output()
	if err != nil {
		log.Errorf("iptables Output, %v", output)
	}
	return err
}
```

通过直接执行 iptables 命令，创建 SNAT 规则，只要是从这个网桥上出来的包，都会对其做源 IP 的转换，保证了容器经过宿主机访问到宿主机外部网络请求的包转换成机器的 IP,从而能正确的送达和接收。



### Delete

```go
// Delete 删除网络
func (d *BridgeNetworkDriver) Delete(network Network) error {
	// 根据名字找到对应的Bridge设备
	br, err := netlink.LinkByName(network.Name)
	if err != nil {
		return err
	}
	// 删除网络对应的 Lin ux Bridge 设备
	return netlink.LinkDel(br)
}
```





## 3. 测试



```shell
$ go build .
# 创建网络
$ sudo ./mydocker network create --driver bridge --subnet 192.168.10.1/24 testbridge
```

查看一下

```shell
$ sudo ./mydocker network list
NAME         IpRange           Driver
testbridge   192.168.10.1/24   bridge
```

能查询到刚才创建的网络，说明功能是正常的。

然后调用 Linux 原生命令查询数据是否正常

查看创建出的Bridge设备：

```shell
$ ip link show dev testbridge
7: testbridge: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
    link/ether fe:fe:93:4d:1f:aa brd ff:ff:ff:ff:ff:ff
```

查看IP地址

```shell
$ ip addr show dev testbridge
7: testbridge: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UNKNOWN group default qlen 1000
    link/ether fe:fe:93:4d:1f:aa brd ff:ff:ff:ff:ff:ff
    inet 192.168.10.1/24 brd 192.168.10.255 scope global testbridge
       valid_lft forever preferred_lft forever
    inet6 fe80::fcfe:93ff:fe4d:1faa/64 scope link
       valid_lft forever preferred_lft forever
```

查看路由配置

```shell
$ ip route show dev testbridge
192.168.10.0/24 proto kernel scope link src 192.168.10.1
```



查看 iptables 配置的 MASQUERADE 规则

```shell
$ sudo iptables -t nat -vnL POSTROUTING
Chain POSTROUTING (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 MASQUERADE  all  --  *      !testbridge  192.168.10.0/24      0.0.0.0/0
```

到此为止的话，都是ok的。

最后测试一下删除功能

```shell
$ sudo ./mydocker network remove testbridge
#调用list命令查看一下,已经不存在了
$ sudo ./mydocker network list
NAME        IpRange     Driver
```

然后对应的网络设备也已经删除了

```shell
$ ip addr show dev testbridge
Device "testbridge" does not exist.
```

