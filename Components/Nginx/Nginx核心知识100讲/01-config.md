# Nginx config

## 1. 概述



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



### 2.autoindex

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



### 4. log

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





### 6. GoAccess

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





