# Nginx config

## 1. 概述

### 主要应用场景

* 1）静态资源服务
  * 通过本地文件系统提供服务
* 2）反向代理服务
  * Nginx的强大性能
  * 缓存
  * 负载均衡
* 3）API服务
  * OpenResty

### 历史背景

Nginx 为什么会出现？

* 互联网的数据量快速增长
  * 互联网的快速普及
  * 全球化
  * 物联网
* 摩尔定律：硬件性能提升
* 低效的 Apache
  * 一个连接对应一个进程



### 主要优点

* 1）高并发、高性能
* 2）可扩展性好
* 3）高可靠
* 4）热部署
* 5）BSD许可证



### 版本选择

* Nginx
  * 开源版：nginx.org
  * 商业版：nginx.com
* 阿里巴巴 Tengine
  * 在阿里巴巴这个生态下，经历了非常严苛的考验，很多特性领先于Nginx的官方版本，所以Tengine修改了Nginx主干代码，框架被修改以后，Tengine遇到了问题，无法与Nginx官方版本同步升级
* OpenResty
  * 开源版：openresty.org
  * 商业版：openresty.com

一般使用开源版即可。



### 文件夹组成

```sh
auto：编译相关配置
CHANGES：更新日志
CHANGES.ru：更新日志-俄语版
conf：配置文件
configure：编译配置
contrib：语法
html
LICENSE
Makefile
man：用户手册
objs：编译中间文件
README
src：源码
```





### 组成部分

* Nginx 二进制可执行文件
  * 由各个模块源码编译出的一个文件
* nginx.conf 配置文件
  * 控制 nginx 行为
* access.log 访问日志
  * 记录每一条 http 请求信息
* error.log 错误日志
  * 定位问题



### 配置语法

* 1）配置文件由指令与指令块构成
* 2）每条指令以；分号结尾，指令与参数间以空格符号分隔
* 3）指令块以｛｝大括号将多条指令组织在一起
* 4）include语句允许组合多个配置文件以提升可维护性
* 5）使用#符号添加注释，提高可读性
* 6）使用$符号使用变量
* 7）部分指令的参数支持正则表达式



### Nginx 命令行

* 格式：nginx -s reload

* 帮助：-? -h

* 使用指定的配置文件：-c

* 指定配置指令：-g

* 指定运行目录：-p

* 发送信号：-s

  * 立刻停止服务：stop

    优雅的停止服务：quit

    重载配置文件：reload

    重新开始记录日志文件：reopen

* 测试配置文件是否有语法错误：-t -T

* 打印nginx的版本信息、编译信息等：-v -V



## 2. 常用配置

### 0. root & alias

nginx指定文件路径有两种方式root和alias，指令的使用方法和作用域：

```shell
[root]
语法：root path
默认值：root html
配置段：http、server、location、if

[alias]
语法：alias path
配置段：location
```

**主要区别**

在于nginx如何解释location后面的uri，这会使两者分别以不同的方式将请求映射到服务器文件上。
root 的处理结果是：`root路径 ＋ location路径`
alias 的处理结果是：使用 alias 路径替换 location 路径

**alias后面必须要用“/”结束**，否则会找不到文件的，而root则可有可无。

```shell
location /website {
	root  /www/root/html/;
}
# 最终地址为 /www/root/html/website
```

```shell
location /website {
	alias  /www/root/html/;
}
# 最终地址为 /www/root/html
```





### 1. gzip

对传输的文件进行压缩，以提高传输效率。

```shell
# 开启gzip
gzip on;

# 启用gzip压缩的最小文件，小于设置值的文件将不会压缩
gzip_min_length 1k;

# gzip 压缩级别，1-10，数字越大压缩的越好
gzip_comp_level 2;

# 进行压缩的文件类型。javascript有多种形式。其中的值可以在 mime.types 文件中找到。
gzip_types text/plain application/javascript application/x-javascript text/css application/xml text/javascript application/x-httpd-php image/jpeg image/gif image/png;

# 是否在http header中添加Vary: Accept-Encoding，建议开启
gzip_vary on;

# 禁用IE 6 gzip
gzip_disable "MSIE [1-6]\.";
```



### 2.autoindex 模块

列出整个目录。

```shell
  server {
        listen      8080;
        # 有中文必须指定编码 utf-8
        charset utf-8;
        location = / {
        	# 开关打开
            autoindex on;
            #默认为on，显示出文件的确切大小，单位是bytes。
 			#改为off后，显示出文件的大概大小，单位是kB或者MB或者GB
            autoindex_exact_size off;
            #默认为off，显示的文件时间为GMT时间。
            #改为on后，显示的文件时间为文件的服务器时间
            autoindex_localtime on;
        }
}
```

这样配置之后，用户在访问以`/`结尾的 URL 时就会展现出当前目录下的所有文件了。

**如果列出的文件名中有中文一定要加上：`charset utf-8;`**



### 3. 限速

```shell
 set $limit_rate 1K;
```

现在速度为 1k。

```shell
  server {
        listen      8080;
        # 有中文必须指定编码 utf-8
        charset utf-8;
        location = / {
         set $limit_rate 1K;
        }
}
```



### 4. 访问日志格式

设置日志格式

```shell
log_format  logName  logStyle;
                     	 
# 比如 
log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      	 '$status $body_bytes_sent "$http_referer" '
                     	 '"$http_user_agent" "$http_x_forwarded_for"';
```

> log_format 指定日志格式 logName 则去一个名字方便区分 最后 logStyle 则是日志的具体内容



使用

```shell
# access_log 表示这里配置的是 访问日志
# logs/access.log 指定日志文件存放路径
# main 为前面配置的 logName
access_log  logs/access.log  main;
```



例子

```shell
http {
	# 指定日志格式
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                     '"$http_user_agent" "$http_x_forwarded_for"';
	# 访问日志 可以全局配置
    access_log  logs/access.log  main;

    server {
    	# 访问日志 也可以为不同的 server 单独配置
    	access_log  logs/access.log  main;
    
        listen       443 ssl;
        server_name  lixueduan.com *.lixueduan.com;
	}
}

```



### 5. 缓存

nginx 用作反向代理的时候，对某些静态资源，可以做一个缓存，下次用户请求时可以通过去后端服务器，直接就将缓存的数据返回给用户。‘

```shell
用户-->Nginx-->Server
用户-->Nginx-->本地缓存 直接返回 减轻Server端压力
```

**proxy_cache相关功能生效的前提是，需要设置`proxy_buffering on;`**

**添加缓存**

```shell
#Sytax 	官方文档 http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_path
proxy_cache_path path [levels=levels] [use_temp_path=on|off] keys_zone=name:size [inactive=time] [max_size=size] [manager_files=number] [manager_sleep=time] [manager_threshold=time] [loader_files=number] [loader_sleep=time] [loader_threshold=time] [purger=on|off] [purger_files=number] [purger_sleep=time] [purger_threshold=time];

# 基本配置
proxy_cache_path  nginx/cache levels=1:2 keys_zone=my_cache:100m inactive=30d max_size=10g 
# 参数说明
proxy_cache_path 缓存文件路径
levels  设置缓存文件目录层次；levels=1:2 表示两级目录
keys_zone 设置缓存名字和共享内存大小.【在使用的地方要使用相同的变量名】
inactive   在指定时间内没人访问则被删除
max_size   最大缓存空间，如果缓存空间满，默认覆盖掉缓存时间最长的资源。
```

**使用缓存**

```shell
  server {
        listen      8080;
        # 有中文必须指定编码 utf-8
        charset utf-8;
        location = / {
         # proxy_cache 指定使用哪个缓存 和前面的keys_zone=my_cache对应
         proxy_cache my_cache;
         # 根据响应码设置缓存时间，超过这个时间即使缓存文件中有缓存数据，nginx也会回源请求新数据
         proxy_cache_valid 200 302 304 1d;
         #此处是托底配置 如果返回配置的错误响应码，nginx则直接取缓存文件中的旧数据返回给用户
         proxy_cache_use_stale error timeout updating http_502 http_504;
        }
}
```





### 6. GoAccess 日志解析

一个日志可视化工具。

官网`http://goaccess.io/`

具体安装方法,`http://goaccess.io/download`



基于 docker 运行，只需一条 指令

```shell
cat access.log | docker run -p 7890:7890 --rm -i -e LANG=$LANG allinurl/goaccess -a -o html --log-format COMBINED --real-time-html - > ../report/report.html
```

后台运行`nohup command &`

```shell
nohup cat access.log | docker run -p 7890:7890 --rm -i -e LANG=$LANG allinurl/goaccess -a -o html --log-format COMBINED --real-time-html - > ../report/report.html &
```

然后在 nginx 中 新增一个 location 指向刚才生成的 report.html

```shell
      location /report.html{
              alias /var/report/report.html;
       }
```



重启 nginx 后即可 在线访问到了。





### 7. SSL 握手时 Nginx 的性能瓶颈

处理大文件和小文件时 Nginx 的瓶颈不一样：

* 大文件
  * 当我们处理大文件时，主要考虑对称加密算法的性能，比如说AES。
  * 当我们面对大的文件处理的时候，可以考虑是否可将AES算法替换为更有效的算法或者把密码强度调的更小一些
* 小文件
  * 当以小文件为主时，主要考验的是Nginx的非对称加密的性能，比如说RSA如果我们处于小文件比较多的情况下，重点可能就是优化椭圆曲线算法的一些密码强度是不是可以有所降低；



## 3. Openresty 初体验

基于OpenResty用Lua语言实现简单服务。

### 1. 安装

安装流程和 Nginx 是一致的,都是下载解压编译3步走。

1）下载，官网地址[openresty.org](https://openresty.org/)

```sh
$ wget https://openresty.org/download/openresty-1.19.3.2.tar.gz
```



2）解压

```sh
$ tar -zxvf openresty-1.19.3.2.tar.gz
```

目录结构如下：

```sh
bundle
configure
COPYRIGHT
patches
README.markdown
README-windows.txt
util
```

- 相比Nginx源代码目录相比少了很多东西，少了的东西在bundle目录下。build是编译后生成的目标中间文件
- 在bundle目录中有很多模块，最核心的是Nginx源代码，nginx-相应的版本中，当前的openresty基于nginx-1.15-8这个版本进行二次开发。

3）编译

> 需要OpenSSL路径或者解压编译路径

```sh
$ ./configure --prefix=/home/openresty --with-openssl=/usr/local/src/openssl-1.0.2t
$ gmake
$ gmake install
```

如果已经安装过openresty了，这个时候可以把nginx的二进制文件拷贝到openresty的nginx的sbin版本中，做一次热部署/热升级。



### 2. 添加Lua代码

在nginx.conf 中实际是可以直接添加Lua代码，但是不能把Lua的语法Lua的源代码直接放在conf中，因为nginx的解析器它的配置语法是跟Lua代码时不相同的。

在openresty的nginx lua模块中，它提供了几条指令，其中有一条指令是content_by_lua。content_by_lua是在http请求处理的内容生成阶段，我们用Lua代码来处理。



openresty的Lua模块中提供了一些API 如ngx.say，会去生成http响应，浏览器在发起http请求中，它会在User-Agent这样的head中，去添加当前浏览器的类型，我是xxx,我用了什么样的内核，用ngx.req.ge_headers把用户请求中的头部取出来，然后找出User-Agent，把User-Agent值通过这样一种文本方式返回给浏览器中


```conf
location /lua{
                default_type text/html;
                content_by_lua '
ngx.say("User-Agent: ",ngx.req.get_headers()["User-Agent"])
                ';
        }
 
        location /{
        
            alias html/asinmy;
        }
```

通过openresty的nginx lua模块，我们可以用它提供给我们的API完成很多功能，我们可以利用Lua本身的一些工具库把Lua语言添加进来参加我们生成响应的这样一个过程中。

直接使用openresty提供的API或者Lua代码生成响应，为浏览器客户端提供服务。

我们可以使用Lua语言以及提供的相应的API库直接去访 Redis,Mysql,Tomcat等这样的服务，然后把不同的响应通过程序逻辑组成相应的http响应返回给用户。
