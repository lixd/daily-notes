## 4层代理

Nginx 中的 4层代理称作 stream 模块。之前提到的 proxy 模块则是 7层代理。



### stream 模块处理请求流程

处理请求流程及对应模块：

* POST_ACCEPT
  * realip
* PREACCESS
  * limit_conn
* ACCESS
  * access
* SSL
  * ssl
* PREREAD
  * ssl_preread
* CONTENT
  * return,stream_proxy
* LOG
  * access_log







Syntax: **stream** { ... }

Default: —

Context: main



Syntax: **server** { ... }

Default: —

Context: stream



Syntax: **listen** address:port [ssl] [udp] [proxy_protocol] [backlog=number] [rcvbuf=size] [sndbuf=size] [bind] [ipv6only=on|off] [reuseport] [so_keepalive=on|off|[keepidle]:[keepintvl]:[keepcnt]];

Default: —

Context: server



### 相关变量



**传输层相关变量**



| 变量名               | 含义                                                      |
| -------------------- | --------------------------------------------------------- |
| binary_remote_addr   | 客户端地址的整型格式,对于IPv4是4字节,对于IPv6是16字节     |
| connection           | 递增的连接序号                                            |
| remote_addr          | 客户端地址                                                |
| remote_port          | 客户端端口                                                |
| proxy_protocol _addr | 若使用了proxy_ protocol协议则返回协议中的地址,否则返回空  |
| proxy_ protocol_port | 若使用了proxy_ protocol协议则返回协议中的端口，否则返回空 |
| protocol             | 传输层协议,值为TCP或者UDP                                 |
| server_addr          | 服务器端地址                                              |
| server_port          | 服务器端端口                                              |
| bytes_received       | 从客户端接收到的字节数                                    |
| bytes_sent           | 已经发送到客户端的字节数                                  |



status：状态码

* 200：session 成功结束
* 400：客户端数据无法解析，例如proxy_protocol协议的格式不正确
* 403：访问权限不足被拒绝，例如access模块限制了客户端IP地址
* 500：服务器内部代码错误
* 502：无法找到或者连接上游服务器
* 503：上游服务不可用



**Nginx 系统变量**



| 变量名        | 含义                                                         |
| ------------- | ------------------------------------------------------------ |
| time_local    | 以本地时间标准输出的当前时间, 例如14/Nov/2018:15:55:37 +0800 |
| time_iso8601  | 使用ISO 8601标准输出的当前时间,例如2018-11-14T15:55:37+08:00 |
| nginx_version | Nginx版本号                                                  |
| pid           | 所属worker进程的进程id                                       |
| pipe          | 使用了管道则返回 p（字符p） ,否则返回 .（一个点）            |
| hostname      | 所在服务器的主机名,与hostname命令输出-一致                   |
| msec          | 1970年1月1日到现在的时间,单位为秒,小数点后精确到毫秒         |





### Content阶段-return模块



Syntax: **return** *value*;

Default: —

Context: server





### proxy_protocol 协议

由于 TCP 中不能像 HTTP 一样通过 header 来存放代理信息，所以必须在数据头部加一段来存放代理信息。

Nginx 具体处理流程如下：

![](D:/Home/17x/Projects/daily-notes/Components/Nginx/Nginx核心知识100讲/assets/nginx-stream-处理proxy-protocol流程.png)

Syntax: **proxy_protocol_timeout** timeout;

Default: proxy_protocol_timeout 30s; 

Context: stream, server

作用：指定读取proxy_protocol 超时时间

**proxy_protocol 协议具体格式**

**v1 协议**

* PROXY TCP4 202.112.144.236 10.210.12.10 5678 80\r\n
* PROXY TCP6 2001:da8:205::100 2400:89c0:2110:1::21632480\r\n
* PROXY UKNOWN\r\n



**v2协议**

* 12字节签名: \r\n\r\n\0\r\nQUIT\n
* 4位协议版本号: 2
* 4位命令: 0表示LOCAL，1表示PROXY , nginx仅支持 PROXY
* 4位地址族: 1表示IPV4 , 2表示IPV6 
* 4位传输层协议: 1表示TCP , 2表示UDP , nginx仅支持TCP协议
* 2字节地址长度





### post_accept 阶段-realip模块

**功能:**

通过proxy_ protocol协议取出客户端真实地址，并写入remote_addr及
remote_port变量。同时新增了realip_remote_addr和realip_remote_port这两个变量来保留
TCP连接中获得的原始地址。

**模块:**

ngx_ stream_ realip_ module ，通过--with-stream_realip_module启用功能



Syntax: **set_real_ip_from** *address* | *CIDR* | unix:;

Default: —

Context: stream, server

作用：指定只处理 哪些 ip 发起的请求 比如 指定只处理集群中的某几台机器。



### PREACCESS 阶段-limit_conn模块

**功能:**
限制客户端的并发连接数。使用变量自定义限制依据,基于共享内存所有worker
进程同时生效。

**模块:**

ngx_stream_limit_conn_module ,通过--without-stream_limit_conn_module禁用模块

> 用法和HTTP模块中的limit_conn非常相似



Syntax: **limit_conn_zone** key zone=name:size;

Default: —

Context: stream

作用：定义一块共享内存

* key 为客户端唯一标识，一般使用IP来标识客户端
* zone 为创建一块空间来存储数据，冒号后面为该空间的大小

Syntax: **limit_conn** zone number;

Default: —

Context: stream, server

作用：具体使用，指定达到多少后就开始限制



Syntax: **limit_conn_log_level** info | notice | warn | error;

Default: limit_conn_log_level error; 

Context: stream, server

作用：指定客户端被限制后打印的日志等级


### ACCESS阶段-access 模块

**功能:**
根据客户端地址( realip模块可以修改地址)决定连接的访问权限

**模块:**

ngx_stream_access_module ,通过--without-stream_access_module禁用模块



Syntax: **allow** address | CIDR | unix: | all;

Default: —

Context: stream, server

Syntax: **deny** address | CIDR | unix: | all;

Default: —

Context: stream, server



### LOG阶段-stream_log 模块

Syntax: 

**access_log** path *format* [buffer=*size*] [gzip[=l*evel*]] [flush=*time*] [if=*condition*];

**access_log** off;

Default: access_log off; 

Context: stream, server

作用：指定日志位置和格式



Syntax: **log_format** name [escape=default|json|none] *string* ...;

Default: —

Context: stream

作用：指定日志格式



Syntax: 

**open_log_file_cache** max=*N* [inactive=*time*] [min_uses=*N*] [valid=*time*];

**open_log_file**_**cache** off;

Default: open_log_file_cache off; 

Context: stream, server

作用：同时写入到多个日志文件时的句柄优化



### stream 中的ssl

**功能:**

使stream反向代理对下游支持TLS/SSL协议

**模块:**

ngx_ stream ssl module ,默认不编译进nginx ,通过--with-stream_ssl_module加入



具体命令和 http 中的 ssl 模块基本一直，就不重复记录。



### preread 阶段-ssl_preread

**模块**

stream_ ssl_ preread_ module, 使用--with-stream_ ssl_ preread_ module启用模块
**功能**

解析下游TLS证书中信息， 以变量方式赋能其他模块。

**提供变量**

* $ssl_preread_protocol
  * 客户端支持的TLS版本中最高的版本，例如TLSv1.3
* $ssl_preread_server_name
  * 从SNI中获取到的服务器域名
* $ssl_preread_alpn_protocols
  * 通过ALPN中获取到的客户端建议使用的协议，例如h2,http/1.1






Syntax: **preread_buffer_size** *size*;

Default: preread_buffer_size 16k; 

Context: stream, server

Syntax: **preread_timeout** *timeout*;

Default: preread_timeout 30s; 

Context: stream, server

Syntax: **ssl_preread** on | off;

Default: ssl_preread off; 

Context: stream, server

作用：是否开启ssl_preread功能





### stream_proxy 模块

模块

* ngx_ stream_ proxy_ module ,默认在Nginx中

功能

* 提供TCP/UDP协议的反向代理
* 支持与上游的连接使用TLS/SSL协议
* 支持与上游的连接使用proxy protocol协议



**对上下游限速**

Syntax: **proxy_download_rate** rate;

Default: proxy_download_rate 0; 

Context: stream, server

作用：限制Nginx读取上游服务数据的速度





Syntax: **proxy_upload_rate** rate;

Default: proxy_upload_rate 0; 

Context: stream, server

作用：限制Nginx读取客户端数据的速度，或者说是客户端上传数据到Nginx的速度。



其他指令和 http proxy 类似，这里也不重复记录。

![](D:/Home/17x/Projects/daily-notes/Components/Nginx/Nginx核心知识100讲/assets/nginx-stream-反向代理指令.png)





### UDP 反向代理

Syntax: **proxy_requests** number;

Default: proxy_requests 0; 

Context: stream, server

作用：指定一次会话session中最多 从客户端接收到多少报文就结束session：

* 仅会话结束时才 会记录access日志
* 同一个会话中，nginx使用同一端口连接上游服务
* 设置为0表示不限制，每次请求都会记录access日志





Syntax: **proxy_responses** number;

Default: —

Context: stream, server

作用：指定对应一个请求报文，上游应返回多少个响应报文。与proxy_ timeout结合使用,控制上游服务是否不可用。





### 透传IP地址方案



* proxy_protocol协议
* 修改IP报文
  * 步骤
    * 修改IP报文中的源地址
    * 修改路由规则
  * 方案
    * IP地址透传：经由nginx转发上游返回的报文给客户端(TCP/UDP)
    * DSR：上游直接发送报文给客户端(仅UDP)