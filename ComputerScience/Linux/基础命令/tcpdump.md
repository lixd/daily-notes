# tcpdump

> [MAN PAGE OF TCPDUMP](https://www.tcpdump.org/manpages/tcpdump.1.html)
>
> [Tcpdump 示例教程](https://fuckcloudnative.io/posts/tcpdump-examples/)



常见用法

```shell
$ tcpdump tcp -i eth0 -s 0 host lixueduan.com port 80
```

* -i 指定网卡
* tcp 指定只匹配 tcp 协议
* host 指定主机名
* port 指定端口



## 1. 概述

tcpdump 命令是基于 unix 系统的命令行的数据报嗅探工具，可以抓取流动在网卡上的数据包。它的原理大概如下：**linux 抓包是通过注册一种虚拟的底层网络协议来完成对网络报文（准确的是网络设备）消息的处理权。**

当网卡接收到一个网络报文之后，它会遍历系统中所有已经注册的网络协议，如以太网协议、x25协议处理模块来尝试进行报文的解析处理。当抓包模块把自己伪装成一个网络协议的时候，系统在收到报文的时候就会给这个伪协议一次机会，让它对网卡收到的报文进行一次处理，此时该模块就会趁机对报文进行窥探，也就是啊这个报文完完整整的复制一份，假装是自己接收的报文，汇报给抓包模块。





最简单的开始捕获报文方法是直接使用tcpdump，不带任何参数：

```shell
$ tcpdump
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on eth0, link-type EN10MB (Ethernet), capture size 262144 bytes
14:48:09.511084 IP iZ2zefmrr626i66omb40ryZ.ssh > 183.69.230.170.8627: Flags [P.], seq 1272363606:1272363794, ack 420379839, win 273, length 188
14:48:09.511485 IP iZ2zefmrr626i66omb40ryZ.50547 > 100.100.2.136.domain: 57015+ PTR? 170.230.69.183.in-addr.arpa. (45)
14:48:09.511827 IP 100.100.2.136.domain > iZ2zefmrr626i66omb40ryZ.50547: 57015 NXDomain 0/1/0 (149)
14:48:09.512174 IP iZ2zefmrr626i66omb40ryZ.56690 > 100.100.2.136.domain: 13490+ PTR? 7.3.168.192.in-addr.arpa. (42)
14:48:09.512517 IP 100.100.2.136.domain > iZ2zefmrr626i66omb40ryZ.56690: 13490 NXDomain* 0/1/0 (97)
14:48:09.512647 IP iZ2zefmrr626i66omb40ryZ.ssh > 183.69.230.170.8627: Flags [P.], seq 188:368, ack 1, win 273, length 180
14:48:09.512656 IP iZ2zefmrr626i66omb40ryZ.34752 > 100.100.2.136.domain: 50718+ PTR? 136.2.100.100.in-addr.arpa. (44)
14:48:09.512820 IP 100.100.2.136.domain > iZ2zefmrr626i66omb40ryZ.34752: 50718 NXDomain* 0/1/0 (99)
14:48:09.513007 IP iZ2zefmrr626i66omb40ryZ.ssh > 183.69.230.170.8627: Flags [P.], seq 368:524, ack 1, win 273, length 156
14:48:09.513032 IP iZ2zefmrr626i66omb40ryZ.ssh > 183.69.230.170.8627: Flags [P.], seq 524:776, ack 1, win 273, length 252
10 packets captured
27 packets received by filter
0 packets dropped by kernel
```

不过由于没带参数，默认 tcpdump 会对机器上的所有数据都进行抓包，导致会打印一堆数据，基本无法分析。



## 2. 参数

tcpdump 有很多参数来控制在哪里捕获、如何捕获，以及捕获文件如何保存处理等选项，下表列出 tcpdump 的常用选项。

| 选项                | 含义                                                         |
| ------------------- | ------------------------------------------------------------ |
| -i <interface>      | 指定监听的物理网卡接口                                       |
| -s                  | 指定每个报文中截取的数据长度                                 |
| -w <filename>       | 把原始报文保存到文件中                                       |
| -c                  | 当收到指定报文个数后退出，可当作软件执行结束的条件           |
| -C                  | 指定捕获的报文文件大小。在将报文写入文件时，检查文件是否大于这个值，如果大于则关闭文件，在打开一个新的文件。新的文件和第一个保存的文件会有相同的>前缀，后续文件会从1开始增加。 |
| -n                  | 不要将 IP 地址和端口号进行转换，进行转换会耗费CPU 时间       |
| -G <rotate_seconds> | 每隔指定的时间，将捕获的报文循环保存为新文件                 |
| -D                  | 输出tcpdump可以捕获的接口列表，包含接口编号和接口名称        |
| -v                  | 当解析和打印时，输出详细的信息，例如报文的生存时间TTL，ID等IP报文选项 |
| -r                  | 从文件中读取报文，这个报文是先前使用-w选项保存的报文         |
| -Z                  | 如果tcpdump运行在root用户下，在打开捕获设备或输入文件后，保存文件使用指定的用户和用户组。 |



### -i

最常用的选项是 **-i** 来**指定监听网卡物理接口**，因为现代计算机通常有多个接口设备。

如果不指定接口，tcpdump 将在系统的所有接口列表中，寻找编号最小的，已经配置为启动的接口(回环接口除外)。

> 接口可以指定为“any”，表示捕获所有接口的报文。



### -s

常用的选项还有**-s**,**指定从每个报文中截取指定字节的数据**，默认限制为的 96 字节。

如果你仅仅对报头感兴趣，就可以不使用该选项，指定为0说明不限制报文长度，捕获整个报文。

> 一般以太网接口的 MTU 值为 1500，因此指定长度为 1500 即可。



### -n / -nn

**-n** : 单个 n 表示不解析域名，直接显示 IP；

**-nn**：两个 n 表示不解析域名和端口。

这样不仅方便查看 IP 和端口号，而且在抓取大量数据时非常高效，因为域名解析会降低抓取速度。



### -w

通常我们不在命令行进行分析，因为其输出格式有限，我们将抓包保存下来使用 wireshark 来分析，这时就用到 **-w** 选项，直接**将原始报文保存到文件中**，如果文件参数为“-”， 就写到标准输出中。

```shell
$ tcpdump -w mydump.pcap
```



### -G

每隔指定的时间，将捕获的报文循环保存为新文件,这个需要使用 **-G** 选项。需要和 **-w** 参数配合使用，并指定时间格式才能循环保存为文件，否则覆盖之前捕获的文件。常用的时间格式有以下几种。

- %d 每月中的第几天，十进制数字从01到31。
- %H表示当前的小时时间，十进制数字从00到23。
- %M表示当前的分钟时间，十进制数字从00到59。
- %S表示当前的秒时间，十进制的00到60。



比如以下命令会每 10s 生成一个新文件：

```shell
$ tcpdump  -G 10 -w mydump%d%H%M%S.pcap -Z root
```

结果如下：

```shell
$ ls
# 22150845：22号15点08分45秒
mydump22150845.pcap  mydump22150855.pcap 
```

注意：需要增加 **-Z** 参数指定 `root` 权限才行，否则会出现以下错误：

```shell
tcpdump: mydump22150612.pcap: Permission denied
```



### -Z

**-Z** 参数指定权限，默认情况下使用的是`-Z tcpdump`。

tcpdump 用户无权往 root 用户目录写数据，所以上面用 **-G** 参数将报文写入多个文件时会提示没有权限。

```shell
$ tcpdump -Z root
```





### -r

**-r** 从文件中读取报文(文件是由 **-w** 选项抓包创建的)。

```shell
$ tcpdump -r mydump22150845.pcap 
reading from file mydump22150845.pcap, link-type EN10MB (Ethernet)
15:08:46.381109 IP iZ2zefmrr626i66omb40ryZ.ssh > 183.69.230.170.8627: Flags [P.], seq 
....
```





### -e

**-e** : 显示数据链路层信息。默认情况下 tcpdump 不会显示数据链路层信息，使用 `-e` 选项可以显示源和目的 MAC 地址，以及 VLAN tag 信息。例如：

```shell
tcpdump -n -e -c 5 not ip6

tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on br-lan, link-type EN10MB (Ethernet), capture size 262144 bytes
18:27:53.619865 24:5e:be:0c:17:af > 00:e2:69:23:d3:3b, ethertype IPv4 (0x0800), length 1162: 192.168.100.20.51410 > 180.176.26.193.58695: Flags [.], seq 2045333376:2045334484, ack 3398690514, win 751, length 1108
```



### -A / -X

`-A` 表示使用 `ASCII` 字符串打印报文的全部数据，这样可以使读取更加简单，方便使用 `grep` 等工具解析输出内容。

`-X` 表示同时使用十六进制和 `ASCII` 字符串打印报文的全部数据。

这两个参数不能一起使用。

例如：

```shell
$ tcpdump -A -s0 port 80
```



### -l 行缓冲模式 

如果想实时将抓取到的数据通过管道传递给其他工具来处理，需要使用 `-l` 选项来开启行缓冲模式（或使用 `-c` 选项来开启数据包缓冲模式）。使用 `-l` 选项可以将输出通过立即发送给其他命令，其他命令会立即响应。

```shell
$ tcpdump -i eth0 -s0 -l port 80 | grep 'Server:'
```





## 3. 报文匹配规则

tcpdump 支持根据匹配规则来抓取报文。这些匹配规则就是一些组合起来的表达式，只有当符合表达式要求的报文才会被抓取到。

> 需要指定匹配规则来减少抓取到的无效报文数量，以便于分析。



表达式由一个或多个基本元素加上连接符组成，这些基本元素也称原语，是指不可分割的最小单元。基本元素由一个ID和一个或多个修饰符组成，有3种不同类型的修饰符。



### 协议修饰符

协议修饰符，可以基于特定协议来进行过滤，可以是 ip、arp、rarp、icmp、tcp 和 udp 等协议类型。

例如：

* tcp port 21：指定匹配 tcp 协议且端口号为 21 的报文
* udp port 5060：指定匹配 udp 协议且端口号为 5060 的报文
* ...



### 类型修饰符

共 4 个类型修饰符，分别为 host、net、port 和 portrange。

* host ：指定需要捕获报文的主机或 IP 地址
* net ：指定需要捕获报文的子网
* port ：指定端口
* protrange：指定端口范围

其中，port  和 protrange 是指传输层协议 tcp 和 udp 的端口号。



**端口号可以是数字也可以是一个名称**，这个名称在 /etc/services 文件中和端口号数字相对应。

例如 port http 则匹配 80 端口的所有流量，包括 tcp 和 udp 80端口的流量



### 传输方向修饰符

传输方向修饰符包括 src 和 dst，如果没有指明方向则任何方向均匹配。

* src：指定源地址，即离开机器的报文
  * 例如：src 192.168.6.100 表示匹配源地址是 192.168.6.100 的报文
* dst：指定目的地址，即本机接收到的报文
  * 例如：dst 8.8.8.8表示匹配目的地址为8.8.8.8

传输方向修饰符不仅可以修饰地址，也可以用来修饰传输端口，比如下面的例子：

* dst port 80
* src port 80



### 集合运算符

上述的修饰符还可以和 and、or 和 not 来进行集合运算组合。集合运算符含义如下：

- and 也可以写为’ &&’，取两个集合的交集。
- or 也可以写为’||’，取两个集合的并集。
- not 也可以写为’!’，所修饰的集合取补集。



### 常见表达式

一些常见的 tcpdump 报文过滤表达式如下：

| 表达式               | 含义                                                         |
| -------------------- | ------------------------------------------------------------ |
| host github.com      | 捕获和主机 github.com 交互的数据包，包含到达和来源的报文     |
| net 191.0.0.0/24     | 捕获指定网段 191.0.0.0/24 范围内的数据包                     |
| port 20              | 捕获指定端口 20 的数据包，指定 tcp 或 udp 协议端口匹配       |
| portrange 8000-8080  | 捕获端口范围 8000-8080 的数据包                              |
| dst port 80          | 捕获目的端口为 80 的报文，包含 UDP 和 TCP 报文，dst 指明报文的方向，也可以修饰主机名和 IP 地址 |
| src 192.168.6.100    | 捕获源IP为 192.168.6.100 的报文，src 也可以修饰传输层端口号  |
| ip multicast         | IPv4 组播报文，即目标地址为组播地址的报文                    |
| arp                  | 只捕获arp协议报文，不包含IP报文                              |
| ip                   | 捕获 IP 协议报文，不包含 arp 等协议报文                      |
| tcp                  | 指定 tcp 协议                                                |
| udp                  | 指定 udp 协议                                                |
| udp port 53          | 指定 udp 协议并且端口为 53，即是DNS协议的报文                |
| port 5060 or port 53 | 指定端口为 5060 或 53 的报文，这在使用IP电话时经常用到       |
| not host github.comn | 所有非主机 github.com 的报文                                 |





## 4. 常见用法

> 更多例子见 [这里](https://fuckcloudnative.io/posts/tcpdump-examples/#4-%E4%BE%8B%E5%AD%90)

### 简单案例

要从指定网卡中捕获数据包，运行：

```shell
$ tcpdump -i eth0
```



**根据 IP 地址查看报文**

要获取指定 IP 的数据包，不管是作为源地址还是目的地址，使用下面命令：

```shell
$ tcpdump host 192.168.1.100
```

要指定 IP 地址是源地址或是目的地址则使用：

```shell
$ tcpdump src 192.168.1.100
$ tcpdump dst 192.168.1.100
```



**查看某个协议或端口号的数据包**

要查看某个协议的数据包，运行下面命令：

```text
$ tcpdump ssh
```

要捕获某个端口或一个范围的数据包，使用：

```text
$ tcpdump port 22
$ tcpdump portrange 22-125
```

我们也可以与 `src` 和 `dst` 选项连用来捕获指定源端口或指定目的端口的报文。



**将输出保存到文件**

tcpdump 的可视化输出功能有限，一种常见的做法是捕获报文并保存下来使用图形用户界面软件 wireshark 来分析。

```shell
$ tcpdump -i eth0 -s 1500 -w mydump.cap
```

* -i eth0：指定捕获网卡 eth0 的所有报文
* -s 1500 ：指定报文最大长度
* -w mydump.cap：将报文保存到文件 mydump.cap 中。





### 复杂案例

```shell
$ tcpdump -i eth0 -w aaa.pcap port 59 or port 53 or port 80 or arp or icmp
```

该命令将抓取TFTP协议、DNS协议、HTTP协议、ARP协议和ICMP协议的报文。



```shell
$ tcpdump -i eth0 -s 0 -G 1800 -c 100000000 -w /srv/mydump%d%H%M%S.pcap -Z root
```

命令其选项含义如下：

* -i eth0 指定捕获接口为eth0
* -s 0 不限制报文大小

* -G 1800 每1800秒保存一个报文，防止保存的报文文件太大。
* -c 100 000 000 指定所捕获的报文的包数共1亿，通常网络上的报文大小平均为500字节，这样保存下来的报文大约50GB。
* -Z root 使用root权限来保存。在某些系统上必须使用-Z root，否则后续的报文捕获保存



```shell
$ tcpdump -r full.pcap -C 5M -w filter.pcap -Z root
```

- -r full.pcap 从文件 full.pcap 中读取报文。
- -C 5M 指定捕获的报文文件大小为 5M 字节。如果有多个文件，则文件名后面序列号从1开始累加。
- -w filter.pcap 将文件保存为 filter.pcap.
- -Z root 使用 root 权限来保存。

如果抓取下来的是全量报文，但我们只使用一部分协议，那我们就要对报文进行过滤然后将结果保存到另外的文件。



### 常见案例

#### 提取 HTTP 用户代理

从 HTTP 请求头中提取 HTTP 用户代理：

```bash
$ tcpdump -nn -A -s1500 -l | grep "User-Agent:"
```



通过 `egrep` 可以同时提取用户代理和主机名（或其他头文件）：

```bash
$ tcpdump -nn -A -s1500 -l | egrep -i 'User-Agent:|Host:'
```



#### 只抓取 HTTP GET 和 POST 流量

抓取 HTTP GET 流量：

```bash
$ tcpdump -s 0 -A -vv 'tcp[((tcp[12:1] & 0xf0) >> 2):4] = 0x47455420'
```



也可以抓取 HTTP POST 请求流量：

```bash
$ tcpdump -s 0 -A -vv 'tcp[((tcp[12:1] & 0xf0) >> 2):4] = 0x504f5354'
```



注意：该方法不能保证抓取到 HTTP POST 有效数据流量，因为一个 POST 请求会被分割为多个 TCP 数据包。

上述两个表达式中的十六进制将会与 GET 和 POST 请求的 `ASCII` 字符串匹配。例如，`tcp[((tcp[12:1] & 0xf0) >> 2):4]` 首先会[确定我们感兴趣的字节的位置](https://security.stackexchange.com/questions/121011/wireshark-tcp-filter-tcptcp121-0xf0-24)（在 TCP header 之后），然后选择我们希望匹配的 4 个字节。



#### 提取 HTTP 请求的 URL

提取 HTTP 请求的主机名和路径：

```bash
$ tcpdump -s 0 -v -n -l | egrep -i "POST /|GET /|Host:"

tcpdump: listening on enp7s0, link-type EN10MB (Ethernet), capture size 262144 bytes
	POST /wp-login.php HTTP/1.1
	Host: dev.example.com
	GET /wp-login.php HTTP/1.1
	Host: dev.example.com
	GET /favicon.ico HTTP/1.1
	Host: dev.example.com
	GET / HTTP/1.1
	Host: dev.example.com
```



## 5. 理解 tcpdump 的输出

tcpdump 输出如下：

```shell
21:27:06.995846 IP (tos 0x0, ttl 64, id 45646, offset 0, flags [DF], proto TCP (6), length 64)
    192.168.1.106.56166 > 124.192.132.54.80: Flags [S], cksum 0xa730 (correct), seq 992042666, win 65535, options [mss 1460,nop,wscale 4,nop,nop,TS val 663433143 ecr 0,sackOK,eol], length 0

21:27:07.030487 IP (tos 0x0, ttl 51, id 0, offset 0, flags [DF], proto TCP (6), length 44)
    124.192.132.54.80 > 192.168.1.106.56166: Flags [S.], cksum 0xedc0 (correct), seq 2147006684, ack 992042667, win 14600, options [mss 1440], length 0

21:27:07.030527 IP (tos 0x0, ttl 64, id 59119, offset 0, flags [DF], proto TCP (6), length 40)
    192.168.1.106.56166 > 124.192.132.54.80: Flags [.], cksum 0x3e72 (correct), ack 2147006685, win 65535, length 0

```

最基本也是最重要的信息就是数据报的源地址/端口和目的地址/端口，上面的例子第一条数据报中，源地址 ip 是 `192.168.1.106`，源端口是 `56166`，目的地址是 `124.192.132.54`，目的端口是 `80`。 `>` 符号代表数据的方向。

此外，上面的三条数据还是 tcp 协议的三次握手过程，第一条就是 `SYN` 报文，这个可以通过 `Flags [S]` 看出。下面是常见的 TCP 报文的 Flags:

- `[S]` : SYN（开始连接）
- `[.]` : 没有 Flag
- `[P]` : PSH（推送数据）
- `[F]` : FIN （结束连接）
- `[R]` : RST（重置连接）

而第二条数据的 `[S.]` 表示 `SYN-ACK`，就是 `SYN` 报文的应答报文。