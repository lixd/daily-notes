# Nginx 变量

## 1. nginx 变量的运行原理

Nginx 中的变量实现分为两个模块：

* 变量的提供模块
* 变量的使用模块



变量的提供模块主要包含两个部分：

* 解析出变量的方法：即如何去取到给定变量名对应的值。
  * 比如$host 变量解析方法就是去找Header中的Host字段对应的值。
* 变量名：将上述取到的变量赋值给变量名

使用变量的模块则根据变量名从提供变量的模块这里拿到对应的值。



### 变量的特性



* 惰性求值：只有变量被使用的时候才会去求值。
  * 所以定义很多变量，只要不使用其实对性能是没有影响的。
* 惰性求值导致变量是时刻变化的，取到的变量值其实只是使用的那一刻的变量的值
  * 比如所限速模块，rate 变量是一直在根据我们的响应数据大小变化的，取到的变量值只代表取的那一刻是这个值。



## 2. 相关变量

### http 请求相关变量



| 变量名         | 含义                                                         |
| -------------- | ------------------------------------------------------------ |
| arg_参数名     | URL 中某个具体参数的值                                       |
| args           | 全部 URL 参数                                                |
| query_string   | 与 args 完全相同                                             |
| is_args        | 如果请求 URL 中有参数则返回问号`?`否则返回空                 |
| content_length | HTTP 请求中标识包体长度的 Content-Length 头部的值            |
| content_type   | 标识包体长度的 Content-Type 头部的值                         |
| uri            | 请求的 URI（不包括域名），（不同于URL，uri 不包含?后的参数） |
| document_uri   | 与 uri 完全相同                                              |
| request_uri    | 请求的 URL（不包括域名），（包括 URI 及完整的参数）          |
| scheme         | 协议名，例如 HTTP 或者 HTTPS                                 |
| request_mothed | 请求方法，例如 GET 或 POST                                   |
| request_length | 所有请求内容的大小，包括请求行、头部、包体等                 |
| remote_user    | 由 HTTP Basic Authentication 协议传入的用户名                |



**request_body_file**：临时存放请求包体的文件

* 如果包体非常小则不会存文件
* client_body_in_file_only：可以强制所有包体存入文件，且可决定是否删除



**request_body**：请求中的包体，这个变量当且仅当使用反向代理，且设定用内存暂存包体时才有效。

**request**：原始的 url 请求，含有方法和协议版本，例如 GET / ?a=1&b=2 HTTP/1.1



**host**：主机名，因为取值方式问题，比较容易引发歧义：

* 先从请求行中取
* 如果含有 Host 头部，则用其值替换掉请求行中的主机名
* 如果前两者都取不到，则使用匹配上的 server_name



一般为 **http_头部名字** 来获取一个具体的头部的值，会直接从 http header 中取值，不过也存在一些特殊请求：

* 特殊情况：以下几个变量 Nginx 会做特殊处理
  * http_host
  * http_user_agent
  * http_referer
  * http_via
  * http_x_forwarded_for
  * http_cookie
* 通用：剩下的变量都是直接从 header 中取值





### tcp 连接相关变量

| 变量名              | 含义                                                         |
| ------------------- | ------------------------------------------------------------ |
| remote_addr         | 客户端IP地址,字符串形式，可读性更好                          |
| binary_remote_addr  | 客户端地址的整形格式，对于 IPv4是4字节，IPv6是16字节，比remote_addr省空间 |
| remote_port         | 客户端端口                                                   |
| connection          | 递增的连接序号                                               |
| server_addr         | 服务端IP地址                                                 |
| server_port         | 服务端端口                                                   |
| server_protocol     | 服务端协议,例如 HTTP/1.1                                     |
| connection_requests | 当前连接上执行过的请求书，对Keepalive有意义                  |
| proxy_protocol_addr | 若使用了 proxy_protocol 协议，则返回协议中的地址，否则返回空 |
| proxy_protocol_port | 若使用了 proxy_protocol 协议，则返回协议中的端口，否则返回空 |
| TCP_INFO            | tcp内核层参数，包括$tcpinfo_rtt,$tcpinfo_rttvar, $tcpinfo_send_cwnd,$tcpinfo_rcv_space. |





### 请求处理过程中产生的变量



| 变量名             | 含义                                                         |
| ------------------ | ------------------------------------------------------------ |
| request_time       | 请求处理到现在的耗时，单位为秒，小数点精确到毫秒             |
| server_name        | 匹配上本次请求的 server_name                                 |
| https              | 若开启 TLS/SSL 则返回on，否则返回空                          |
| request_completion | 若请求处理完成返回OK，否则返回空                             |
| request_id         | 以16进制输出的请求标识id，该id共含有16个字节，是随机生成的   |
| request_filename   | 该变量返回URL对应的磁盘文件系统待访问文件的完整路径          |
| document_root      | 由URI和root/alias规则生成的文件夹路径                        |
| realpath_root      | 同 document_root，不过会将其中的软连接换成真实路径           |
| limit_rate         | 返回客户端响应时的速度上限值，单位为每秒字节数，可以通过 set 指令修改对请求产生效果 |



 

### 发送 HTTP 响应时的变量

| 变量名            | 含义                     |
| ----------------- | ------------------------ |
| body_bytes_sent   | 响应中 body 包体的长度   |
| bytes_sent        | 全部 http 响应的长度     |
| status            | http 响应中的返回码      |
| sent_trailer_名字 | 把响应结尾内容里的值返回 |





### nginx 系统变量



| 变量名        | 含义                                                         |
| ------------- | ------------------------------------------------------------ |
| time_local    | 以本地时间标准输出的当前时间，例如14/Nov/2021:11:12:13 +0800 |
| time_iso8601  | 使用 ISO 8601 标准输出的当前时间，例如2021-11-12T11：:1：13+08:00 |
| nginx_version | Nginx 版本号                                                 |
| pid           | 所属 woker 进程的 进程id                                     |
| pipe          | 使用了管道则返回`p`,否则返回`.`                              |
| hostname      | 所在服务器的主机名，与 hostname 命令输出一致                 |
| msec          | 1970年1月1日到现在的时间，单位为秒，小数点精确到毫秒         |
