## 2. upstream 模块

### upstream、server 指令



**upstream**：用于配置上游服务，后续 proxy 模块中通过 name 来指定使用那个上游服务。

Syntax：**upstream** name {...}

Default：---

Context：http



**server**：用于在 upstream 模块中指定一个具体的上游服务器。

Syntax：**server** address [parameters];

Default：---

Context：upstream



**server 功能**

指定一组上游服务器地址,其中,地址可以是域名、IP地址或者unix socket地址。可以在域名或者IP地址后加端口,如果不加端口, 那么默认使用80端口。



**server 通用参数**

* backup：指定当前server为备份服务，仅当非备份server不可用时，请求才会转发到该server
* down：标识某台服务已经下线，不在提供服务。



### 加权 Round-Robin 算法

以加权轮询的方式访问server指令指定的上游服务。集成在Nginx的upstream框架中

相关指令：

* **weight**：服务访问的权重，默认为1
* **max_conns**：server 的最大并发连接数，仅作用于单个 worker，默认为0，即不限制
* **max fails**：在fail_ timeout时间段内,最大的失败次数。当达到最大失败时,会在fail_ timeout秒内这台server不允许再次被选择。

* **fail_timeout**：单位为秒,默认值为10秒。具有2个功能。
  * 指定一段时间内,最大的失败次数max_ fails。
  * 到达max_ fails后 ,该server不能访问的时间。

在 fail_timeout 时间内，出现了 max_fails 次请求失败时，就会标记为服务不可用，再 fail_timeout 时间内，都不会给这个服务器转发流量。到下一个时间周期时又会重新开始计数。

> 比如 fail_timeout = 10s，max_fails = 3，3秒钟请求了这个服务3次，都失败了，那么后续7秒就不会给这个服务器转发流量了，等下一个10秒又会重新计数。





### 对上游服务使用 keepalive 长连接

**功能**

通过复用连接，降低nginx与上游服务器建立、关闭连接的消耗，提升吞吐量的同时降低时延

**模块**

ngx_http_upstream_keepalive_module,默认编译进nginx,通过--without-http_upstream_keepalive_module移除

**需要对对上游连接的http头部做以下两个设定：**

* proxy_http_version 1.1; 
  * 因为http1.0是不支持keepalive的，所以需要改成1.1

* proxy_set_header Connection "";
  * 为了防止用户发过来的是keepalive是 close，手动设置向上游发送 Connection。





### upstream_keepalive 指令

**keepalive**：指定最多保持多少个连接。

Syntax：**keepalive** connections；

Default：-

Context：upstream



**keepalive_requests**：每个连接最多完成多少个请求。

Syntax：**keepalive_requests** number；

Default：keepalive_requests 100；

Context：upstream



**keepalive_timeout**：连接空闲时最多保留多长时间。

Syntax：**keepalive_timeout** timeout;

Default：keepalive_timeout 60s；

Context：upstream



### resolver 指定DNS

指定上游服务域名解析。

Syntax：**resolver** address ...[valid=time] [ipv6=on|off];

Default：-

Context：http,server,location



Syntax：**resolver_timeout** time;

Default：resolver_timeout 30；

Context：http,server,location



### 示例

```conf
# 配置 upstream，内部有两个 server
upstream rrups {
	server 120.0.0.1:8011 weight=2 max_conns=2 max_fails=2 fail_timeout=5;
	server 127.0.0.1:8012
	keepalive 32;
}

server {
	server_name rrups.example.com
	
	location / {
		# 指定代理到 rrups 
		proxy_pass http://rrups;
		# 设置两个 header 以完美运行 keepalive
		proxy_http_version 1.1; 
		proxy_set_header COnnection "";
	}
}
```





### upstream_ip_hash 模块

基于客户端 IP地址的 Hash 算法实现负载均衡。

**功能**

以客户端的IP地址作为hash算法的关键字,映射到特定的上游服务器中。

* 对IPV4地址使用前3个字节作为关键字,对IPV 6则使用完整地址
* 可以使用round-robin算法的参数。
* 可以基于realip模块修改用于执行算法的IP地址

**模块**

ngx_http_upstream_ip_hash_ module，通过--without-http_ upstream_ip_hash_module禁用模块。



Syntax：**ip_hash**； // 通过该指令指定使用 ip hash 算法

Default: --

Context：upstream



### upstream_hash 模块

基于任意关键字实现 Hash 算法的负载均衡。

**功能**

通过指定关键字作为hash key ,基于hash算法映射到特定的上游服务器中。

* 关键字可以含有变量、字符串。
* 可以使用round-robin算法的参数。



**模块**

ngx_http_upstream_hash_module ,通过--without-http_upstream_hash_module禁用模块。

Syntax：**hash** key [consistent]; // consistent 表示使用一致性hash算法。

Default：--

Context：upstream

示例：hash $request_uri; // 根据 uri 进行 hash。





### upstream_least_conn 模块

优先选择连接最少的上游服务器。

**功能**

从所有上游服务器中,找出当前并发连接数最少的一个,将请求转发到它。

> 如果出现多个最少连接服务器的连接数都是一样的, 使用round-robin算法。

**模块**

ngx_http_upstream_least_conn_module，通过--without-http_upstreamleast_conn_module 禁用模块

Syntax：**least_conn**

Default: --

Context：upstream



### upstream_zone 模块

使用共享内存使负载均衡策略对所有 worker 进程生效。

**功能**

分配出共享内存,将其他 upstream 模块定义的负载均衡策略数据、运行时每个上游服务的状态数据存放在共享内存上,以对所有 nginx worker 进程生效。

**模块**

ngx_http_upstream_ zone _module，通过\--

without-http_upstream_zone_module 禁用模块。

Syntax：**zone** name [size];

Default：--

Context：upstream



### upstream 模块间的顺序

```c
ngx_module_t *ngx_modules[] = {
… … &ngx_http_upstream_hash_module, &ngx_http_upstream_ip_hash_module, &ngx_http_upstream_least_conn_module, &ngx_http_upstream_random_module, &ngx_http_upstream_keepalive_module, &ngx_http_upstream_zone_module,
… …
};
```

从上到下执行，zone 模块因为要存储其他 upstream 模块产生的数据，所以放在最后。



### upstream 模块的变量

| 变量名                   | 含义                                                         |
| ------------------------ | ------------------------------------------------------------ |
| upstream_addr            | 上游服务器的IP地址，格式为可读的字符串，例如127.0.0.1:8012   |
| upstream_connect_time    | 与上游服务器建立连接消耗的时间，单位为秒，小数点精确到毫秒   |
| upstream_header_time     | 接收上游服务器发回响应中http头部消耗的时间，单位为秒，小数点精确到毫秒 |
| upstream_response_time   | 接收完整的上游服务响应所消耗的时间，单位为秒，小数点精确到毫秒 |
| upstream_http_名称       | 从上游服务器返回的响应头部的值，如 upstream_http_myheader 则是响应头部中的 myheader 字段的值。 |
| upstream_bytes_received  | 从上游服务接收到的响应长度，单位为字节                       |
| upstream_response_length | 从上游服务返回的响应包体长度，单位为字节                     |
| upstream_status          | 上游服务返回的HTTP响应中的状态码，如果未连接上，该变量值为502 |
| upstream_cookie_名称     | 从上游服务器返回的响应头Set-Cookie中取出的cookie值           |
| upstream_trailer_名称    | 从上游服务的响应尾部取到的值                                 |


