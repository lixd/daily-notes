# Nginx 配置

## 1. 配置冲突 Nginx 如何处理的

### nginx 配置大致结构

```conf
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

**指令的 content**

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



### 指令合并

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
# 可以监听sock地址
listen Unix:/var/run/nginx.sock;
# IP+端口
listen 127.0.0.1:8080;
# 不写端口时默认会使用 8080 端口
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



`\` 转义符号：取消元字符的特殊含义

`()`：分组与取值



```conf
原始url：/admin/website/article/35/change/uploads/party/5.jpg
转换后的url：/static/uploads/party/5.jpg

匹配原始url的正则表达式：
/^\/admin\/website\/article\/(\d+)\/change\/uploads\/(\w+)\/(\w+)\.(png|jpg|gif|jpeg|bmp)$/

rewrite^/admin/website/solution/(\d+)/change/uploads/(.*)\.(png|jpg|gif|jpeg|bmp)$/static/uploads/$2/$3.$4 last;
```





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
  * 4）按文件中的顺序匹配正则表达式域名
  * 5）default server
    * 默认情况下 第一个 server 就是 default server
    * 或者 listen 中 指定为 default 这样 listen 所属的 server 就是 default server

