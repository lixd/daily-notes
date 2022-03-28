# ping 和 traceroute



## 1. ping

 ICMP协议是Internet控制报文协议，通常被认为是IP层的组成部分。它传递差错报文以及其它需要注意的信息。ICMP协议通常被IP层或更高层协议使用。

Ping命令是ICMP协议的一个使用范例。**Ping命令主要是用于测试网络连通性**。

### 实现原理

**主要实现原理**：Ping程序通过发送回显请求报文，然后接收远程主机的回显应答报文，通过分析回显应答报文就可知道两台主机的网络连通性。

> 如果主机禁 ping 则无法使用，可以换成 telnet。



### 参数

ping详细参数如下：

> 一般 -c 和 -f 比较常用。

|        参数         | 详解                                                         |
| :-----------------: | :----------------------------------------------------------- |
|         -a          | Audible ping.                                                |
|         -A          | 自适应ping，根据ping包往返时间确定ping的速度；               |
|         -b          | 允许ping一个广播地址；                                       |
|         -B          | 不允许ping改变包头的源地址；                                 |
|    **-c count**     | ping指定次数后停止ping；                                     |
|         -d          | 使用Socket的SO_DEBUG功能；                                   |
|    -F flow_label    | 为ping回显请求分配一个20位的“flow label”，如果未设置，内核会为ping随机分配； |
|       **-f**        | 极限检测，快速连续ping一台主机，ping的速度达到100次每秒；    |
|     -i interval     | 设定间隔几秒发送一个ping包，默认一秒ping一次；               |
|    -I interface     | 指定网卡接口、或指定的本机地址送出数据包；                   |
|     -l preload      | 设置在送出要求信息之前，先行发出的数据包；                   |
|         -L          | 抑制组播报文回送，只适用于[ping](http://aiezu.com/article/linux_ping_command.html)的目标为一个组播地址 |
|         -n          | 不要将ip地址转换成主机名；                                   |
|     -p pattern      | 指定填充ping数据包的十六进制内容，在诊断与数据有关的网络错误时这个选项就非常有用，如：“-p ff”； |
|         -q          | 不显示任何传送封包的信息，只显示最后的结果                   |
|       -Q tos        | 设置Qos(Quality of Service)，它是ICMP数据报相关位；可以是十进制或十六进制数，详见rfc1349和rfc2474文档； |
|         -R          | 记录ping的路由过程(IPv4 only)； 注意：由于IP头的限制，最多只能记录9个路由，其他会被忽略； |
|         -r          | 忽略正常的路由表，直接将数据包送到远端主机上，通常是查看本机的网络接口是否有问题；如果主机不直接连接的网络上，则返回一个错误。 |
|      -S sndbuf      | Set socket sndbuf. If not specified, it is selected to buffer not more than one packet. |
|    -s packetsize    | 指定每次ping发送的数据字节数，默认为“56字节”+“28字节”的ICMP头，一共是84字节； 包头+内容不能大于65535，所以最大值为65507（linux:65507, windows:65500）； |
|       -t ttl        | 设置TTL(Time To Live)为指定的值。该字段指定IP包被路由器丢弃之前允许通过的最大网段数； |
| -T timestamp_option | 设置IP timestamp选项,可以是下面的任何一个： 　　'tsonly' (only timestamps) 　　'tsandaddr' (timestamps and addresses) 　　'tsprespec host1 [host2 [host3]]' (timestamp prespecified hops). |
|       -M hint       | 设置MTU（最大传输单元）分片策略。 可设置为： 　　'do'：禁止分片，即使包被丢弃； 　　'want'：当包过大时分片； 　　'dont'：不设置分片标志（DF flag）； |
|       -m mark       | 设置mark；                                                   |
|         -v          | 使ping处于verbose方式，它要ping命令除了打印ECHO-RESPONSE数据包之外，还打印其它所有返回的ICMP数据包； |
|         -U          | Print full user-to-user latency (the old behaviour). Normally ping prints network round trip time, which can be different f.e. due to DNS failures. |
|     -W timeout      | 以毫秒为单位设置ping的超时时间；                             |
|     -w deadline     | deadline；                                                   |

参考内容：http://ss64.com/bash/ping.html



### 输出分析

下面为简单的 ping 产生的响应内容

```shell
$ ping -c 2 www.baidu.com
PING www.a.shifen.com (110.242.68.3) 56(84) bytes of data.
64 bytes from 110.242.68.3 (110.242.68.3): icmp_seq=1 ttl=50 time=14.1 ms
64 bytes from 110.242.68.3 (110.242.68.3): icmp_seq=2 ttl=50 time=14.1 ms

--- www.a.shifen.com ping statistics ---
2 packets transmitted, 2 received, 0% packet loss, time 2ms
rtt min/avg/max/mdev = 14.051/14.080/14.110/0.122 ms

```

返回内容具体的含义如下：

- `www.a.shifen.com (110.242.68.3):`ping目标主机的域名和IP（ping会自动将域名转换为IP）
- `56(84) bytes of data:`不带包头的包大小和带包头的包大小（参考“-s”参数）
- `icmp_seq=1 ttl=50 time=14.1 ms:`
  - icmp_seq：ping序列，从1开始；
  - ttl：剩余的ttl；
  - time: 响应时间,数值越小，联通速度越快；
- `2 packets transmitted, 2 received, 0% packet loss, time 2ms:`发出去的包数，返回的包数，丢包率，耗费时间；
- `rtt min/avg/max/mdev = 14.051/14.080/14.110/0.122 ms:`最小/最大/平均响应时间和本机硬件耗费时间； 





## 2. traceroute

通过 traceroute 我们可以知道信息从你的计算机到互联网另一端的主机是走的什么路径。

> print the route packets trace to network host.



### 实现原理

**Traceroute 程序的设计是利用 ICMP 及 IP header 的 TTL（Time To Live）栏位（field）。**

首先，traceroute 送出一个 TTL 是 1 的 IP datagram（其实，每次送出的为 3 个 40字节 的包，包括源地址，目的地址和包发出的时间标签）到目的地，当路径上的第一个路由器（router）收到这个datagram时，它将TTL减1。此时，TTL变为0了，所以该路由器会将此datagram丢掉，并送回一个「ICMP time exceeded」消息（包括发 IP 包的源地址，IP 包的所有内容及路由器的 IP 地址），traceroute 收到这个消息后，便知道这个路由器存在于这个路径上。

接着 traceroute 再送出另一个 TTL 是 2  的 datagram，发现第 2 个路由器，

如此重复下去

traceroute 每次将送出的 datagram 的 TTL 加 1 来发现另一个路由器，这个重复的动作一直持续到某个 datagram 抵达目的地。

当 datagram 到达目的地后，该主机并不会送回 ICMP time exceeded 消息，因为它已是目的地了，***那么 traceroute 如何得知目的地到达了呢？***

Traceroute 在送出 UDP datagrams 的时候，它所选择送达的 port number 是一个一般应用程序都不会用的号码（30000 以上），所以当此 UDP datagram 到达目的地后该主机会送回一个「ICMP port unreachable」的消息，而当traceroute 收到这个消息时，便知道目的地已经到达了。所以 traceroute 在Server 端也是没有所谓的 Daemon 程式。

Traceroute 提取发 ICMP TTL 到期消息设备的 IP 地址并作域名解析。每次 ，Traceroute 都打印出一系列数据,包括所经过的路由设备的域名及 IP地址,三个包每次来回所花时间。



### 参数

安装命令如下：

```shell
$ yum install -y traceroute
```

**命令格式：**

```shell
traceroute [参数][主机]
```



**命令参数：**

* -d 使用Socket层级的排错功能。
* -f 设置第一个检测数据包的存活数值TTL的大小。
* -F 设置勿离断位。
* -g 设置来源路由网关，最多可设置8个。
* -i 使用指定的网络界面送出数据包。
* -I 使用ICMP回应取代UDP资料信息。
* **-m：**设置检测数据包的最大存活数值TTL的大小。
* **-n：**直接使用IP地址而非主机名称。
* -p 设置UDP传输协议的通信端口。
* -r 忽略普通的Routing Table，直接将数据包送到远端主机上。
* -s 设置本地主机送出数据包的IP地址。
* -t 设置检测数据包的TOS数值。
* -v 详细显示指令的执行过程。
* -w 设置等待远端主机回报的时间。
* -x 开启或关闭数据包的正确性检验。





### 输出分析

```shell
$ traceroute www.baidu.com
traceroute to www.baidu.com (103.235.46.39), 30 hops max, 60 byte packets
 1  10.247.212.94 (10.247.212.94)  12.240 ms  12.214 ms *
 2  * * *
 3  10.36.51.137 (10.36.51.137)  3.076 ms 10.36.51.129 (10.36.51.129)  3.112 ms 10.36.51.185 (10.36.51.185)  1.157 ms
 4  10.54.154.182 (10.54.154.182)  1.338 ms 47.246.116.66 (47.246.116.66)  1.350 ms 47.246.116.54 (47.246.116.54)  1.098 ms
 5  47.246.115.102 (47.246.115.102)  2.042 ms 47.246.115.106 (47.246.115.106)  1.430 ms 116.251.86.202 (116.251.86.202)  5.191 ms
 6  p55967.hkg.equinix.com (119.27.63.97)  7.644 ms  6.551 ms s55967.hkg.equinix.com (119.27.63.98)  2.773 ms
 7  180.76.0.18 (180.76.0.18)  3.088 ms 180.76.0.2 (180.76.0.2)  3.101 ms 180.76.0.18 (180.76.0.18)  3.462 ms
 8  180.76.0.7 (180.76.0.7)  2.294 ms 180.76.0.21 (180.76.0.21)  4.483 ms  3.820 ms
 9  * * *
10  * * *
11  * * *
12  * * *
13  * * *
14  * * *
15  * * *
16  * * *
17  * * *
18  * * *
19  * * *
20  * * *
21  * * *
22  * * *
23  * * *
24  * * *
25  * * *
26  * * *
27  * * *
28  * * *
29  * * *
30  * * *
```

记录按序列号从1开始，每个纪录就是一跳 ，每跳表示一个网关。

> 默认只会走 30 跳，可以通过 **-m 参数**指定。

然后结果中有些主机名，可以通过 **-n 参数**使其只显示 IP。

我们看到每行有三个时间，单位是 ms，这个是探测数据包向每个网关发送三个数据包后，网关响应后返回的时间。

> 因为有时候每次走的路由是不同的，所以也会出现每行3个IP的情况。

另外输出中有一些是星号，因为有些节点把 UDP 数据包屏蔽了，所以没有返回ICMP。