# http 模块

## 1. 配置冲突 Nginx 如何处理的

* 1）**nginx 配置大致结构**

```shell
main
http{
	upstream{}
	split_clients{}
	map{}
	geo{}
	server{
		if(){}
		location{
			limit_except{}
		}
		location{
			location{}
		}
	}
	server{
	
	}
}
```

比较重要的是其中的`http`、`server`、`location`3 个。

* 2）**指令的 content**

```shell
Syntax log_format name [esapce=default|json|node] string...;
Default log_format combined ...;
Context http

Syntax access_log path [format [buffer=size] [gzip=[level]][flush=time][if=condition]]
Syntax access_log off;
Default access_log logs/access.log combined ...;
Context http,server,location,if in location,limit_except;
```

可以看到其中`access_log`命令的 Content 比`log_format`命令多一些，如果配置放在错误的 Context 中会直接报错。



* 3）**指令合并**
  * 值指令 - 存储配置文件的值
    * 可以合并
    * 例如 root、access_log、gzip 等
  * 动作指令 - 指定行为
    * 不可以合并
    * 例如 rewrite、proxy_pass
    * 生效阶段 server_rewrite 阶段、rewrite 阶段、content 阶段



**值指令继承规则**

* 1）子配置不存在时，直接使用父配置。

* 2）子配置存在时，直接覆盖父配置。

例如:

```shell
server{
	listen 8080;
	root /home/17x/nginx/html;
	access_log logs/17x_access.log main;
	location /test{
		# 这里有子配置 则会覆盖父配置
		root /home/17x/nginx/test;
		access_log logs/17x_access_test.log main;
	}
	location /lib{
		alias /lib/;
	}
	location /{
		#这里未指定 root or alisa 
		#所以会使用父配置 root /home/17x/nginx/html;
	}
}
```



## 2. 指令详解

### 1. listen

* Syntax
  * `listen address[:port] [bind][ipv6only=on]`
  * `listen port [bind][ipv6only=on]`
  * `listen unix:path [bind]`
* Default
  * `lsten *:80|*:8080`
* Context
  * server

例如：

```shell
listen Unix:/var/run/nginx.sock;
listen 127.0.0.1:8080;
# 默认会使用 8080 端口
listen 127.0.0.1;
listen 8080;
listen *:8080;
listen localhost:8080 bind;
# 使用 ipv6
listen [::]:8080 ipv6only=on;
lsten [::1];

```



### 2. 正则表达式

**元字符**

| 代码 | 说明                            |
| ---- | ------------------------------- |
| `.`  | 匹配 `除换行符以外的任意字符`   |
| `\w` | 匹配 `字母、数字、下划线、汉字` |
| `\s` | 匹配 `任意的空白符`             |
| `\d` | 匹配 `数字`                     |
| `\b` | 匹配 `单词的开始或结束`         |
| `^`  | 匹配 `字符串的开始`             |
| `$`  | 匹配 `字符串的结束`             |

**重复**

| 代码    | 说明           |
| ------- | -------------- |
| `*`     | 0 次 或 更多次 |
| `+`     | 1 次 或 更多次 |
| `？`    | 0 次 或 1 次   |
| `{n}`   | n 次           |
| `{n,}`  | n 次 或 更多次 |
| `{n,m}` | n 次 到 m 次   |



### 3. server_name

* 1）**泛域名**
  * 如`server_name *.nginx.org` 或者`server_name www.nginx.*`
  * `*`星号只能出现在最前 or 最后 且只能出现一次，`*.xxx.*`这样是不行的
* 2）**正则表达式**
  * 例如`server_name www.nginx.org ~^www\d+.nginx\.org$`
* 3） **主域名**
  * Syntax
    * `server_name_in_redirect on|off;`
  * Default
    * `server_name_in_redirect off;`
  * Context
    * http、server、location

例子如下

```shell
server{
	# 第一个为主域名 即 primary.nginx.org
	server_name primary.nginx.org second.nginx.org;
	server_name_in_redirect off;
	return 302 /redirect;
}
```

`server_name_in_redirect off;` off 的时候主域名是不生效的。

此时访问`second.nginx.org` 会跳转到`second.nginx.org/redirect`

如果开启`server_name_in_redirect on;`

此时再次访问`second.nginx.org` 就会跳转到`primary.nginx.org/redirect`



* 4）**匹配顺序**
  * 1）精确匹配
  * 2） `*`星号在`前`的泛域名
  * 3）`*`星号在`后`的泛域名
  * 4) 按文件中的顺序匹配正则表达式域名
  * 5）default server
    * 默认情况下 第一个 server 就是 default server
    * 或者 listen 中 指定为 default 这样 listen 所属的 server 就是 default server





## 3. http 11 个阶段

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



### 1. postread 阶段 realip 模块

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



**拿到 真实 IP 后如何使用**

`realip`模块拿到 真实 ip 后会覆盖这两个值`binary_remote_addr`和`remote_addr`。

> 这两个值最开始就是与 Nginx 直接连接的 ip ，前面例子中就是 反向代理服务器的 ip

由 realip 模块更新后就是用户真实 ip 了。这样后续的模块做连接限制（limit_conn）才有意义。

**变量**

realip模块 默认不会编译进 Nginx，需要在编译时指定`--with-http_realip_module`启用功能。

realip模块由于覆盖了`binary_remote_addr`和`remote_addr`两个值，所以也提供了两个新的变量（realip_remote_addr，realip_remote_port）来存储原来的旧值，即与 nginx 直接连接的服务器 ip



**指令**

```shell
# 指定只处理 哪些 ip 发起的请求 比如 指定只处理集群中的某几台机器
Syntax: set_real_ip_form address|CIDR|unix;
Default: -
Context:http,server,location
```

```shell
# 指定去哪里获取真实 IP 默认为 X-Real-IP 如果指定为 X-Forwarded-For 则会取最后一个 IP
Syntax: real_ip_header field|X-Real-IP|X-Forwarded-For|proxy_protocol;
Default: real_ip_header  X-Real-IP
Context:http,server,location
```

```shell
# 是否开启环回地址 开启后 如果前面 real_ip_header 设置的是 X-Forwarded-For
# 如果 X-Forwarded-For 中要去的真实地址（即最后一个地址）是当前机器的地址，那么会舍弃掉，去取前面一个地址作为真实 iP
Syntax: real_ip_recursive on|off;
Default: real_ip_header off;
Context:http,server,location
```



### 2. Rewrite 模块 

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
  * 设置这个状态码表示 nginx 立即关闭连接，不在向用户返回任何数据
* HTTP 1.0 标准
  * 301 - http1.0 永久重定向
  * 302 - 临时重定向，禁止被缓存
* HTTP 1.1 标准
  * 303 - 临时重定向，允许改变方法，禁止被缓存
  * 307 - 临时重定向，不允许改变方法，禁止被缓存
  * 308 - 永久重定向，不允许改变方法



### 2. return 指令与error_page

```shell
#=[response] 用于修改返回状态码
Syntax: error_page code...[=[response]] uri;
Default: -
Context: http,server,location,if in location
```

例如

```shell
# 404 时重定向到 404.html 页面
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



### 3. rewrite 指令

#### 1. rewrite

```shell
Syntax: rewrite regex replacement[flag];
Default -
Context: server,location,if
```

* 1）将 regex 指定的 url 替换为 replacement 这个新 url
  * 可以使用正在表达式及变量提取
* 2）当 replacement 以 http://、https://、$schema 等开头时，直接返回 302 重定向、
* 3）替换后的 url 根据 flag 指定的方式进行处理
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

即使用当前的新 uri（second/2.txt）。此时会匹配到`location /second`,执行`rewrite /second(.*) /thrid&1 break;` uri 中 second 替换为 thrid，最后 flag 为 break 停止脚本命令，所以后续的` return 200 'second!';`也不会执行，此时 也会进行按照新 uri（thrid/3.txt）进行匹配。

最后匹配到`location /thrid` 执行`return 200 'thrid!';` 返回 thrid！并结束。



#### 2. rewrite_log

开启 rewrite 日志后，每次的 rewrite 都会出现在日志中。

```shell
rewrite_log on;
```



#### 3. if

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