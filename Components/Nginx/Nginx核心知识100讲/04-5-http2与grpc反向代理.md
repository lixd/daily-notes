## http2

### 主要特性

* **传输数据量大幅减少**
  * 以二进制方式传输
  * 标头压缩
* **多路复用及相关功能**
  * 消息优先级
* **服务器消息推送**
  * 并行推送

### 核心概念



* 连接Connection: 1个TCP连接, 包含一个或者多个Stream

* 数据流Stream:一个双向通讯数据流，包含多条Message
* 消息Message:对应HTTP1中的请求或者响应,包含一条或者多条Frame
* 数据帧Frame:最小单位，以二进制压缩格式存放HTTP1中的内容



### 协议分层

![](D:/Home/17x/Projects/daily-notes/Components/Nginx/Nginx核心知识100讲/assets/nginx-http2-协议分层.png)

http1.1 中的消息存到 http2.0中会分成 HEADERS frame 和 DATA frame 两个 frame。

另外 HTTP2 必须在 TLS 层之上，即必须使用https。



### 多路复用

![](D:/Home/17x/Projects/daily-notes/Components/Nginx/Nginx核心知识100讲/assets/nginx-http2-多路复用.png)



* 一个 Connection 上可以有多个 Stream。
* 而每个 Stream 上也可以并行的发送请求。
* HTTP2 自带了拥塞控制算法，每个连接最大使用的带宽是逐渐增加的。
  * 即连接新创建时带宽给的比较小，然后慢慢的会提升达到带宽上限
  * 如果频繁新建连接就会导致带宽一直受限。



### 传输时无序，接收时组装

![](D:/Home/17x/Projects/daily-notes/Components/Nginx/Nginx核心知识100讲/assets/nginx-http2-传输无序-接收时组装.png)



### 数据优先级

![](D:/Home/17x/Projects/daily-notes/Components/Nginx/Nginx核心知识100讲/assets/nginx-http2-数据优先级.png)



### 标头压缩

![](D:/Home/17x/Projects/daily-notes/Components/Nginx/Nginx核心知识100讲/assets/nginx-http2-标头压缩.png)

请求1发送了完整的标头，请求2则只需要发送有变化的标题即可。



### nginx 使用http2

模块:

* ngx_http_v2_module, 通过--with-http_v2_module编译nginx加入http2协议的支持。

功能:

* 对客户端使用http2协议提供基本功能

前提:

* 开启TLS/SSL协议

使用方法:

* listen 443 ssl http2;





### nginx 推送资源

Syntax：**http2_push** uri|off;

Default：http2_push off;

Context：http,server,location

作用：通过配置文件的方式指定给客户端推送什么资源，具体用法如下：

```conf
location / {
	http2_push /a.txt
	http2_push /b.png
}
```

在很多情况下，列出您希望推送到NGINX配置文件中的资源是不方便的，甚至是不可能的。

出于这个原因，NGINX也支持拦截[`Link`预加载头](https://w3c.github.io/preload/#server-push-http-2)的约定，然后推送这些头中标识的资源。

Syntax：**http2_push_preload** on|off;

Default：http2_push_preload off；

Context：http,server,location

作用：开启预加载，开启后Nginx会拦截Link预加载头，然后推送这写头中的资源给客户端。

> 一般是上游服务器响应中带上对应请求头，Link：style.css，这样nginx 就会推送style.css 给客户端。



例如，当NGINX作为代理服务器（用于HTTP，FastCGI或其他流量类型）运行时，上游服务器可以`Link`为其响应添加如下标题：

```sh
Link: </style.css>; as=style; rel=preload
```

NGINX拦截这个头并开始服务器推送/style.css。`Link`标题中的路径必须是绝对路径 - 不支持像./style.css这样的相对路径。该路径可以选择包含查询字符串。

要推送多个对象，可以提供多个`Link`标题，或者更好的是，将所有对象包含在逗号分隔的列表中：

```
Link: </style.css>; as=style; rel=preload, </favicon.ico>; as=image; rel=preload
```



### 其他指令

**最大并行推送数**

Syntax: **http2_max_concurrent_pushes** *number*;

Default: http2_max_concurrent_pushes 10; 

Context: http, server

**超时控制**

Syntax: **http2_recv_timeout** *time*;

Default: http2_recv_timeout 30s; 

Context: http, server



Syntax: **http2_idle_timeout** *time*;

Default: http2_idle_timeout 3m; 

Context: http, server



**并发请求控制**

Syntax: **http2_max_concurrent_pushes** *number*;

Default: http2_max_concurrent_pushes 10; 

Context: http, server



Syntax: **http2_max_concurrent_streams** *number*;

Default: http2_max_concurrent_streams 128; 

Context: http, server



Syntax: **http2_max_field_size** *size*;

Default: http2_max_field_size 4k; 

Context: http, server



**连接最大处理请求数**

Syntax: **http2_max_requests** *number*;

Default: http2_max_requests 1000; 

Context: http, server



Syntax: **http2_chunk_size** *size*;

Default: http2_chunk_size 8k; 

Context: http, server, location



**设置响应包体的分片大小**

Syntax: **http2_chunk_size** *size*;

Default: http2_chunk_size 8k; 

Context: http, server, location



**缓冲区大小设置**

Syntax: **http2_recv_buffer_size** *size*;

Default: http2_recv_buffer_size 256k; 

Context: http



Syntax: **http2_max_header_size** *size*;

Default: http2_max_header_size 16k; 

Context: http, server



Syntax: **http2_body_preread_size** *size*;

Default: http2_body_preread_size 64k; 

Context: http, server





## gRPC 反向代理

模块：

* ngx_http_grpc_module ,通过--without-http_grpc_module禁用

* 依赖ngx_http_v2_module模块



### 指令

整体指令和 http proxy 模块基本一致，只需要换一个前缀即可。

![](D:/Home/17x/Projects/daily-notes/Components/Nginx/Nginx核心知识100讲/assets/nginx-grpc-http反向代理指令对比1.png)

![](D:/Home/17x/Projects/daily-notes/Components/Nginx/Nginx核心知识100讲/assets/nginx-grpc-http反向代理指令对比2.png)

