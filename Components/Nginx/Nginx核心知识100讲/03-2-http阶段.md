# Nginx http 处理 11 阶段

## 1. 处理http 请求头部的流程

![](D:\Home\17x\Projects\daily-notes\Components\Nginx\Nginx核心知识100讲\assets\nginx接收请求事件模块.png)

![](D:\Home\17x\Projects\daily-notes\Components\Nginx\Nginx核心知识100讲\assets\nginx接收请求http模块.png)



## 2. http 11 个阶段

![](D:\Home\17x\Projects\daily-notes\Components\Nginx\Nginx核心知识100讲\assets\nginx-http请求处理11阶段.png)

具体如下，从上到下，依次执行。

| 阶段           | 相关模块                       |
| -------------- | ------------------------------ |
| POST_READ      | realip                         |
| SERVER_REWRITE | rewrite                        |
| FIND_CONFIG    |                                |
| REWRITE        | rewrite                        |
| POST_REWRITE   |                                |
| PREACCESS      | limit_conn,limit_req           |
| ACCESS         | auth_basic,access,auth_request |
| POST_ACCESS    |                                |
| PRECONTENT     | try_files                      |
| CONTENT        | index,autoindex,concat         |
| LOG            | access_log                     |



![](D:\Home\17x\Projects\daily-notes\Components\Nginx\Nginx核心知识100讲\assets\nginx-http请求处理11阶段顺序.png)

### 1. postread 阶段 

#### 如何获取真实IP

postread 阶段 realip 模块（获取用户真实 IP）

* TCP 连接 四元组（src ip,src port,dst ip,dst port）
* HTTP 头部 X-Forwarded-For 用于传递 IP
* HTTP 头部 X-Real-IP 用于传递用户 IP
* 网络中存在需要反向代理



具体连接如下

```shell
用户（内网 IP 192.168.1.1）
	↓
	↓
ADSL（运营商公网 IP 115.115.115.115）
	↓
	↓
CDN（假设需要回源 IP 地址 1.1.1.1）
	↓ X-Forwarded-For:115.115.115.115
	↓ X-Real-IP:115.115.115.115
某反向代理（IP 地址 2.2.2.2）
	↓ X-Forwarded-For:115.115.115.115,1,1,1,1
	↓ X-Real-IP:115.115.115.115
Nginx（需要获取用户真实 IP）
    ↓ 
    ↓
```

很明显，如果按照这个链路，最后 nginx 获取到的 ip 肯定是反向代理的 ip 即 2.2.2.2

但是有了 HTTP 头部的 X-Forwarded-For 或者 X-Real-IP 一层一层地传递过来就有可能获取到用户真实 IP 了



#### realip 模块

**拿到 真实 IP 后如何使用**

`realip`模块拿到 真实 ip 后会覆盖这两个值`binary_remote_addr`和`remote_addr`。

> 这两个值最开始就是与 Nginx 直接连接的 ip ，前面例子中就是 反向代理服务器的 ip

由 realip 模块更新后就是用户真实 ip 了。这样后续的模块做连接限制（limit_conn）才有意义。

**变量**

realip模块 默认不会编译进 Nginx，需要在编译时指定`--with-http_realip_module`启用功能。

realip模块由于覆盖了`binary_remote_addr`和`remote_addr`两个值，所以也提供了两个新的变量（realip_remote_addr，realip_remote_port）来存储原来的旧值，即与 nginx 直接连接的服务器 ip



#### realIP 指令

##### set_real_ip_form

指定只处理 哪些 ip 发起的请求 比如 指定只处理集群中的某几台机器。

Syntax: **set_real_ip_form ** address|CIDR|unix;
Default: -
Context:http,server,location



##### real_ip_header

指定去哪里获取真实 IP 默认为 X-Real-IP 如果指定为 X-Forwarded-For 则会取最后一个 IP
Syntax: **real_ip_header** field|X-Real-IP|X-Forwarded-For|proxy_protocol;
Default: real_ip_header  X-Real-IP
Context:http,server,location



##### real_ip_recursive

是否开启环回地址 开启后 如果前面 real_ip_header 设置的是 X-Forwarded-For
并且 X-Forwarded-For 中取去的真实地址（即最后一个地址）是当前机器的地址，那么会舍弃掉该地址，再去取X-Forwarded-For中取前面一个地址作为真实 IP。

Syntax: **real_ip_recursive** on|off;
Default: real_ip_header off;
Context:http,server,location

例子：

off 时：X-Forwarded-For为1.1.1.1，2.2.2.2，取出来的 realIP 就是 2.2.2.2。

on 时：由于2.2.2.2时当前机器IP，所以会被舍弃掉，最终取到的就是 1.1.1.1。



### 2. rewrite 阶段 

#### 1. return 指令

Rewrite 模块执行后就直接返回了，后续模块则没有机会执行。

```shell
Syntax: return code[text];
		return code URL;
		return URL;
Default: -
Context: server,location,if
```

返回状态码

* Nginx 自定义
  * 444 - 关闭连接
  * 设置这个状态码表示 nginx 立即关闭连接，不再向用户返回任何数据
  * 这个是 Nginx 自定义的状态码，不会真的返回给用户
* HTTP 1.0 标准
  * 301 - http1.0 永久重定向
  * 302 - 临时重定向，禁止被缓存
* HTTP 1.1 标准
  * 303 - 临时重定向，允许改变方法，禁止被缓存
  * 307 - 临时重定向，不允许改变方法，禁止被缓存
  * 308 - 永久重定向，不允许改变方法



#### 2. error_page

用于修改返回状态码

Syntax: **error_page** code...[=[response]] uri;
Default: -
Context: http,server,location,if in location



例如

```shell
# 遇到 404 时重定向到 404.html 页面
error_page 404 /404.html;
# 多个状态码统一处理
error_page 500 502 503 504 /50x.html;
# 把 404 状态码 替换为 200，同时返回 empty.gif
error_page 404 =200 /empty.gif
```



**return 与 location 块下的 return 指令关系**

```shell
server{
	listen 8080;
	root /html;
	error_page 404 /403.html;
	#return 405;
	location{
		#return 404 "find nothing!\n";
	}
}
# 此时访问一个不存在的页面 会根据 error_page 404 /403.html; 重定向到 403 页面
```





```shell
server{
	listen 8080;
	root /html;
	error_page 404 /403.html;
	#return 405;
	location{
		return 404 "find nothing!\n";
	}
}
# 此时则会根据 return 404 "find nothing!\n"; 直接返回 find nothing!
```



```shell
server{
	listen 8080;
	root /html;
	error_page 404 /403.html;
	return 405;
	location{
		return 404 "find nothing!\n";
	}
}
# 此时会根据 return 405; 返回405页面。
```



#### 3. rewrite 指令

##### 1. rewrite

```shell
Syntax: rewrite regex replacement[flag];
Default -
Context: server,location,if
```

* 1）**将 regex 指定的 url 替换为 replacement 这个新 url**
  * 可以使用正在表达式及变量提取
* 2）**当 replacement 以 http://、https://、$schema 等开头时，直接返回 302 重定向**
* 3）**替换后的 url 根据 flag 指定的方式进行处理**
  * --last：用 replacement 这个URI 进行新的 location 匹配
  * --break： break 指令停止当前脚本命令的执行，等价于独立的 break 指令
  * --redirect：返回 302 重定向
  * --permanent：返回 301 重定向

其中 第三条中的`redirect`或`permanent`是大于第二条的。

例子

```shell
server{
	root html/;
	location /first{
		rewrite /first(.*) /second$1 last;
		return 200 'first!';
	}
	location /second{
        rewrite /second(.*) /thrid&1 break;
        return 200 'second!';
	}
	location /thrid{
		return 200 'thrid!';
	}
}
```

目录结构

```shell
html/
	--first/
	    --1.txt
    --/second/
	    --2.txt
    --/third/
	    --3.txt
```

如果访问`first/2.txt`

首先匹配到`location /first`,然后`rewrite /first(.*) /second$1 last;` 将 uri 中的 first 替换为 second，然后 flag 为 last 表示再次执行匹配,后续的`return 200 'first!';`也不会执行了。

接着使用当前的新 uri（second/2.txt）继续匹配，此时会匹配到`location /second`,执行`rewrite /second(.*) /thrid&1 break;` uri 中 second 替换为 thrid，最后 flag 为 break 停止脚本命令，所以后续的` return 200 'second!';`也不会执行，此时 也会进行按照新 uri（thrid/3.txt）进行匹配。

最后匹配到`location /thrid` 执行`return 200 'thrid!';` 返回 thrid！并结束。



##### 2. rewrite_log

开启 rewrite 日志后，每次的 rewrite 都会出现在日志中。

```shell
rewrite_log on;
```



##### 3. if

rewrite 模块中的 if

```shell
Syntax: if(condition){}
Default -
Context: server,location
```

括号中 condition 条件为 真 则执行大括号中的指令；遵循值指令继承原则。



* 1）检查变量为空或者值是否为 0，直接使用
* 2）将变量与字符串做匹配，使用 = 或者 !=
* 3）将变量与正则表达式做匹配
  * 大小写不敏感 ~ 或者 !~
  * 大小写敏感 ~* 或者 !~*
* 4）检查文件是否存在，使用 -f 或者 !-f
* 5）检查目录是否存在，使用 -d 或者 !-d
* 6）检查文件、目录、软链接是否存在，使用 -e 或者 !-e
* 7）检查文件是否为可执行文件，使用 -x 或者 !-x



### 3. find_config 阶段

该阶段主要根据 nginx 的location配置进行匹配，查找最终会进入那个 location。

####  location 设置方式

location  仅匹配 URI，忽略参数，location 的几种配置方式：

* 前缀字符串
  * 常规
  * = ：精确匹配
  * ^~：匹配上该条规则后不再进行正则表达式匹配
* 正则表达式
  * ~：大小写敏感的正则匹配
  * ~*：忽略大小写的正则匹配

* 合并连续的`/`符号
  * merge_slashes on
* 用于内部跳转的命名 location
  * @

#### location 匹配规则



![](D:\Home\17x\Projects\daily-notes\Components\Nginx\Nginx核心知识100讲\assets\location匹配顺序.png)



### 4. preaccess 阶段

#### limit_req 模块

**如何限制每个客户端的每秒请求数？**

> **ngin_http_ limit_ req_ module 模块。**

生效阶段: NGX_ HTTP_ PREACCESS PHASE阶段

模块: http_ limit_ req_ module

默认编译进nginx ,通过. without-http_ limit_ req_ module禁用功能

生效算法: leaky bucket算法

生效范围:

* 全部worker进程(基于共享内存)
* 进入preaccess阶段前不生效
* 限制的有效性取决于key的设计:依赖postread阶段的realip模块取到真实ip

* 用于限制客户端处理请求的**平均速率**
  * 比如限制1分钟处理两个请求，实际上是每隔30秒才会处理一个请求
* 使用共享内存,对所有worker子进程生效
* 限流算法：leaky_bucket 漏桶算法

> 默认编译进nginx ,如果不需要可以通过--without-http_ limit_req_module禁用





* **limit_req_zone**

  * 语法：limit_req_zone key zone = name:size rate = rate

  * 默认上下文

  * 示例：limit_req_zone $binary_remote_addr zone=reqLimiter:10m rate=2r/m

  * rate=2r/m 表示限制每分钟两个请求，实现为30秒只会处理一个请求，并不是一分钟内可以处理2请求，必须要间隔30秒才行

    

* **limit_req_status**：指定被限速后返回的http code；

* **limit_req_log_level**：指定连接被限速后记录的日志等级



* **limit_req**：真正设置限速的地方

  * 语法：limit_req zone=name [burst=number] [nodelay|delay=number]

  * burst：漏桶算法中的桶容量

  * 示例：limit_req zone=reqLimiter；

  * 示例：limit_req zone=reqLimiter brust=5 nodelay；表示单客户端并发请求在5以内都会不延迟，直接处理；

    

**burst=5**：burst 为爆发的意思，这个配置的意思是设置一个大小为5的缓冲区当有大量请求（爆发）过来时，超过了访问频次限制的请求可以先放到这个缓冲区内等待，但是这个等待区里的位置只有5个，超过的请求会直接报503的错误然后返回。
nodelay：
如果设置，会在瞬时提供处理(burst + rate)个请求的能力，请求超过（burst + rate）的时候就会直接返回503，永远不存在请求需要等待的情况。（这里的rate的单位是：r/s）
如果没有设置，则所有请求会依次等待排队。





#### limit_conn 模块

**如何限制每个客户端得到并发连接数？**

> **ngx_http_limit_conn_module 模块**

生效阶段: NGX HTTP_ PREACCESS _PHASE 阶段

模块: `http_ _limit conn_ module`

默认编译进nginx ,通过`--without-http_ limit conn_ module`禁用
生效范围:

* 全部worker进程(基于共享内存)
* 进入preaccess阶段前不生效
* 限制的有效性取决于key的设计:依赖postread阶段的realip模块取到真实ip



* 用于限制客户端并发连接数
* 使用共享内存，对所有worker子进程生效。

> 默认编译进 nginx ，不需要则可以通过--without-http_ limit_ conn_ module禁用





* **limit_conn_zone**：
  * 语法 limit_conn_zone key zone=name:zise
  * key 为客户端唯一标识，一般使用IP来标识客户端
  * zone 为创建一块空间来存储数据，冒号后面为该空间的大小
  * 上下文：http
  * 示例：limit_conn_zone $binary_remote_addr zone=addr:10m
  * $binary_remote_addr 比 remote_addr 占用内存更小



* **limit_conn_status**：指定被限速后返回的http code；
  * 语法：limit_conn_status code；
  * 默认值：limit_conn_status 503；
  * 上下文：http、server、location

* **limit_conn_log_level**：指定连接被限速后记录的日志等级
  * 语法：limit_conn_log_level  info|notice|warn|error；
  * 默认值：limit_conn_log_level  error；
  * 上下文：http、server、location



* **limit_conn**：真正用来控制限速的字段
  * 语法：limit_conn zone number；
  * 其中 zone 就是前面 limit_conn_zone 中定义的 zone 的 name 字段。
  * 上下文：http、server、location
  * 示例：limit_conn addr 2；限制每个IP最多两个连接

#### FAQ

**limit_req 和 limit_conn 同时触发时，谁会生效?**

因为 limit_req 执行顺序在 limit_conn 之前，所以同时触发时 limit_req 会生效。



### 5. access 阶段

#### access 模块

**如何限制某些IP地址的访问权限**

> **access 模块**

限制特定IP或网段访问。



* **allow**：允许访问
  * 语法 allow address|CIDR|UNIX|all；
  * 上下文：http、server、location、limit_except
  * 示例：allow 192.168.0.10；
* **deny**：禁止访问
  * 语法：deny address|CIDR|UNIX|all；
  * 上下文：http、server、location、limit_except
  * 示例：deny 192.168.0.0/24;



 **allow 一定要和 deny 组合使用，并不是说没有 allow 的就不能访问。**

比如下面这个配置就是无效的，实际上所有人都能访问：

```conf
location / {
		allow 192.168.1.1;
}
```

一般是 deny 一个大范围，然后 allow 其中的一部分。

或者 deny all，然后 allow 一部分。

正确写法如下：

```conf
location / {
		allow 192.168.1.1;
		deny all;
}
```

这样就只有 192.168.1.1 能访问了。

示例：

```conf
location / {
		deny 192.168.1.1;
		allow 192.168.1.0/24;
		allow 10.1.1.0/16;
		deny all;
}
```

上述配置，首先 deny all 拒绝全部，然后放行 10.1



#### auth_basic 模块

基于 HTTP Basic Authutication 协议进行用户密码的认证。

限制特定用户访问，[官方文档](https://nginx.org/en/docs/http/ngx_http_auth_basic_module.html)

* 基于HTTP Basic Authentication协议进行用户名密码认证
* 默认已编译进Nginx，可以通过 --without-http_ auth_basic_module禁用





* **auth_ basic**

  * 语法：auth_ basic string|off；
  * 这个 string 是给用户的提示信息，好像有的浏览器不会显示，随便填就行
  * 默认值：auth_ basic off ;
  * 上下文：http、server、location、linit_except

* **auth_basic_user_file**：指定密码文件

  * 语法：auth_basic_user_file file；

  * 默认值：无

  * 上下文：http、server、location、linit_except

    

生成密码文件工具

* 可执行程序：htpasswd
* 所属软件包：httpd-tools
* 生成新的密码文件：htpasswd -bc encrypt_ pass jack 123456
  * -c 参数表示创建的意思
* 添加新用户密码：htpasswd -b encrypt_ pass mike 123456



#### auth_request 模块



使用第三方做权限校验。默认未编译进 nginx，需要使用`--with-http_auth_request_module`手动添加。

auth_request 模块原理：收到请求后，生成子请求，通过反向代理技术把请求传递给上游服务。

具体实现：向上游服务转发的请求，如果上游服务返回的响应码是2XX，就算是认证通过了，继续执行本次请求。若上游服务返回的是 401或403，则直接将上游服务返回的响应返回给客户端。



### 

基于子请求收到的HTTP响应码做访问控制，[官方文档](https://nginx.org/en/docs/http/ngx_http_auth_request_module.html)

默认并未编译进Nginx，需要通过 -- with-http_ auth_request_module 启用



* **auth_request**
  * 语法：auth_request uri|off;
  * 通过配置 URI 进行请求转发，一般是转发到授权服务器，如果授权服务器返回授权成功后，nginx 才会执行本次请求。
  * 默认值：auth_request off；
  * 上下文：http、server、location

* **auth_request_set**
  * 语法：auth_request_set $variable value;
  * 默认值：无
  * 上下文：http、server、location



示例

```conf
server {
	server 80;
	
	location /admim {
		auth_request /auth;
		index index.html;
	}
	
	location /auth {
		proxy_pass http://192.168.1.3:8080/auth.html
	}

}
```

以上配置中，用户访问 /admin 时，需要进行授权，被转发到 /auth ，然后 /auth 中有代理到另一个接口，让用户进行校验，成功后才会返回 /admin 下的内容。





#### satisfy 模块

satisfy 模块 主要用于改变 access 阶段的几个模块的执行顺序和是否放行的最终结果。

access 阶段的模块：

* access 模块
* auth_basic 模块
* auth_request 模块
* 其他模块

satisfy 模块提供的命令如下：

Syntax: **satisfy** all | any;

Default: satisfy all; 

Context: http, server, location



参数详解：

* all：表示要access阶段所有模块都放行后，这个请求才会被放行
* any：access 阶段只有有任意一个模块放行，这个请求就会被放行



具体流程如下：

![](D:\Home\17x\Projects\daily-notes\Components\Nginx\Nginx核心知识100讲\assets\nginx-satisfy模块执行顺序.png)



* 如果某个access阶段的模块没有配置，就忽略掉，直接执行下一个 access 模块
* 如果某一个 access 模块执行结果为放行：
  * 如果 satisfy 配置为 all，表示要全部 access 模块放行，该请求才能放行，于是会继续执行下一个 access 模块
  * 如果 satisfy 配置为 any，表示只要有一个 access 模块放行，该请求就放行，此时直接跳过后续 access 模块。因为当前 access 模块放行已经满足最终的放行条件了
* 如果某一个 access 模块执行结果为拒绝：
  * 如果 satisfy 配置为 all，那么直接拒绝当前请求，已经有一个模块拒绝了，不可能满足放行条件了
  * 如果 satisfy 配置为 any，则执行下一个 access 模块，当前模块拒绝不要紧，说不定后续模块中有一个能放行，最终也可能会满足放行条件。





#### FAQ

**1）如果有 return 指令，access 还会执行吗？**

不会，return 执行顺序在 access 之前。

**2）多个 access 模块的顺序有影响吗？**

有的，具体顺序可以查看，ngx_modules.c 文件。

**3）下面的配置：输对密码，可以访问到文件吗**

```conf
location / {
		satisfy any;
		auth_basic "test auth_basic"
		auth_basic_user_file examples/auth.pass
		deny all;
}
```

可以，虽然 access 模块配置的 deny all 会拒绝请求，但是配置的是 satisfy any，只要一个模块放行就可以 了。

**4）把3中的 deny all 放到配置文件的最前面呢？**

```conf
location / {
		deny all;
		satisfy any;
		auth_basic "test auth_basic"
		auth_basic_user_file examples/auth.pass	
}
```

还是可以，配置文件中的顺序不影响模块的执行顺序。

**5）如果改为 allow all，还有机会输入密码吗？**

没有，access 模块最先执行，配置的是 satisfy any，只要一个模块放行后就直接放行了，不会执行后续 access 模块了。





### 6. precontent 阶段



#### try_files 模块

> ngx_http_try_files_modules 模块

依次试图访问多个uri对应的文件(由root或者alias指令指定),当文件存在时直接返回文件内容,如果所有文件都不存在,则按最后一个URL结果或者code返回。



Syntax：try_files ... uri; 或者  try_files ...=code;

Default: ---

Content：server，location

例如

```sh
location / {
		try_files index.html index.htm;
}
```



#### mirror 模块

> ngx_http_mirror_modle 模块，默认编译进 Nginx，通过 --without_http_mirror_module 移除模块。

实时拷贝流量，处理请求时，生成子请求访问其他服务，对子请求的返回值不做处理。

> 比如把生产环境的流量使用 mirror ，额外发送一份到 测试环境。

**mirror**：指定把流量转发到哪个URL去。

Syntax：**mirror** uri|off；

Default：mirror off；

Content：http,server,location

**mirror_request_body**：指定是否需要把 body 也转发过去。

Syntax：**mirror_request_body** on|off;

Default：mirror_request_body on;

Content：http,server,location





### 7. content 阶段



#### static 模块

root 和 alias 其实都是 static 模块中提供的指令。



Syntax：**alias** path；

Default：---

Content：location





Syntax：**root** path；

Default：---

Content：http,server,location,if in location



功能：将 url 映射为文件路径，以返回静态文件内容。

差别：root会将完整uri映射进文件路径中，alias只会将location后的URL映射到文件路径 



**static 模块提供的另外 3 个变量**



* request_filename：待访问文件的完整路径
* document_root：由 URI 和 root/alias 规则生成的文件夹路径
* realpath_root：将 document_root 中的软链接替换成真实路径



**重定向问题**

static模块实现了root/alias 功能时，发现访问目标是目录，但URL末尾未加`/`时，会返回301重定向到加 / 的uri。



重定向跳转相关的指令

**server_name_in_redirect**：返回重定向时，返回的域名是否使用 server_name 中的那个域名，为 true 时返回 server_name 中的域名。

> 会优先取请求头中的 host 作为重定向域名，没有时就用请求的这个域名，开启了 server_name 就用 server_name 中的域名。

Syntax：**server_name_in_redirect** on|off;

Default：server_name_in_redirect off；

Content：http,server,location

**port_in_redirect**：返回重定向时，是否带上端口。

Syntax：**port_in_redirect** on|off;

Default：port_in_redirect on；

Content：http,server,location

**absolute_redirect**：重定向时，是否返回绝对路径。为 true 时返回绝对路径，false 时只返回相对路径。

Syntax：**absolute_redirect** on|off;

Default：absolute_redirect on；

Content：http,server,location





#### index 模块

> ngx_http_index_module 模块

指定访问时返回 index 文件内容。

Syntax：**index** file ...;

Default：index index.html;

Content：http,server,location

可以定义多个文件，会按照先后顺序处理。优先返回第一个，如果第一个文件不存在就会去找第二个，以此类推。



#### random_index 模块

随机选择 index 指令指定的一系列 index 文件中的一个返回给用户。一般用于有多个页面时，想随机展示给用户时使用。

> ngx_http_index_module，默认不编译进 Nginx，使用 --with-http_random_index_module 编译进去。



Syntax：**random_index** on|off;

Default：random_index off；

Context：location



#### auto_index 模块

当URL以/结尾时,尝试以 html/xml/json//jsonp 等格式返回root/alias中指向目录的目录结构。一般用于文件分享平台。

> ngx_http_index_module，默认编译进 Nginx，可以使用 --without-http_autoindex_module 取消。



**autoindex**：是否开启 auto_index 模块。

Syntax：**autoindex** on|off; 

Default：autoindex off；

Content：http,server,location



**autoindex_exact_size**：是否显示绝对文件大小(字节)，关闭后会根据文件实际大小选择合适的单位(KB、MB、、GB等)，建议关闭该项以获得更友好的显示。

Syntax：**autoindex_exact_size** on|off;

Default：autoindex_exact_size on；

Content：http,server,location



**autoindex_format**：显示格式，根据需求自行调整。

Syntax：**autoindex_format** html|xml|json|jsonp;

Default：autoindex_format html；

Content：http,server,location

**autoindex_localtime**：是否显示本地实际。

Syntax：**autoindex_localtime** on|off;

Default：autoindex_localtime off；

Content：http,server,location



#### concat 模块

当页面需要访问多个小文件时,concat 模块可以把它们的内容合并到一次http响应中返回,提升性能。

> ngx_http_concat_module 由 alibaba 提供，需要手动添加到 Nginx 中去。
>
> 地址：https://github.com/alibaba/nginx-http-concat
>
> 添加到 nginx：--add-module=/path/to/nginx-http-concat



具体使用：

在uri后加上两个问号`??` ,后接多个文件，以逗号`,`分隔。如果还有参数,则在最后通过`?`添加参数,例如

```sh
# https://example.com??file1,file2,file3?params1=xxx&params2=xxx
https://g.alicdn.com/??kissy/k/6.2.4/seed-min.js,kg/global-util/1.0.7/index.min.js,tb/tracker/4.3.5/index.js,kg/tb-nav/2.5.3/index-min.js,secdev/sufei_data/3.3.5/index.js
```

相关指令：

**concat** `on` | `off`

**default:** `concat off`

**context:** `http, server, location`

是否开启该功能。



**concat_types** `MIME types`

**default:** `concat_types: text/css application/x-javascript`

**context:** `http, server, location`

只处理哪些文件。



**concat_unique** `on` | `off`

**default:** `concat_unique on`

**context:** `http, server, location`

是否只能连接同一个类型的文件，比如开启后就不能同时返回css和js文件。



**concat_delimiter**: string

**default**: NONE

**context**: `http, server, locatione`

定义分隔符，用于分隔返回的多个文件。

**concat_ignore_file_error**: `on` | `off`

**default**: off

**context**: `http, server, location`

是否忽略某些文件的错误，比如请求3个文件，有一个文件不存在，报错了，是否忽略这个错误并返回剩下的两个文件。

**concat_max_files** `number`p

**default:** `concat_max_files 10`

**context:** `http, server, location`

每次请求，最多合并多少文件。



#### FAQ

**index 模块和 auto_index 模块区别**

二者都是对返回的内容做处理。

* index 是指定返回文件
* auto_index 是在 url 以目录结尾时，根据目录中的文件结构生成一个文件并返回

由于 index 模块比 auto_index 模块先执行，所以如果目录中正好存在 index 指定的文件时，请求就直接返回了，导致 auto_index 模块没有机会执行。





### 8. log 阶段

#### log 模块

用于记录请求访问日志。将 http 请求相关信息记录到日志。

> ngx_http_log_module，该模块无法禁用。



**access 日志格式**

Syntax：**log_format** name [escape=default|json|none] string ... ;

Default：log_format combined "...";

Context：http

默认日志格式

```conf
log_format combined '$remote_addr - $remote_user [$time_local] ' 
'"$request" $status $body_bytes_sent ' '"$http_referer" 
"$http_user_agent"';
```

**配置日志文件路径**

Syntax：

**access_log** *path* [*format* [buffer=*size*] [gzip[=*level*]] [flush=*time*] [if=*condition*]];

**access_log** off;

Default：access_log logs/acccess/log combined;

Context：http, server, location, if in location, limit_except



* path路径可以包含变量
  * 加入变量后，可能每个日志都会写入到不同的文件中，为了避免打开大量文件，再不打开cache时，Nginx 每记录一条日志都需要打开、关闭日志文件。
* if通过变量值控制请求日志是否记录
* 日志缓存
  * 功能：批量将内存中的日志写入磁盘
  * 写入条件
    * 日志大小超过缓存大小
    * 达到 福禄寿指定的时间
    * worker 进程执行 reopen 命令，或者 worker 进程正在关闭
* 日志压缩
  * 功能：批量压缩内存中的日志，再写入磁盘
  * buffer 大小默认为 64KB
  * 压缩基级别默认为 1（1最快压缩率最低，9最慢压缩率最高）





**对日志文件名包含变量时的优化**
Syntax：

**open_log_file_cache** max=N [inactive=time] [min_uses=N] [valid=time]

**open_log_file_cache** off；

Default：open_log_file_cache off;

Context：http,server,location



* Max：缓存内的最大文件句柄数，超过后用 LRU 算法淘汰。
* inactive：文件被访问过后在 inactive 这段时间内不会被关闭。
* min_uses：在 inactive 时间内使用次数超过 min_uses 的才会继续保持在内存中，默认为1.
* valid：超出 valid 时间后，将对缓存的日志文件检查是否存在，默认为 60秒。
* off：关闭缓存功能

