# CentOS 7安装Nignx教程

## 1.简介

Nginx是一款轻量级的Web服务器/反向代理服务器及电子邮件（IMAP/POP3）代理服务器，并在一个BSD-like协议下发行。由俄罗斯的程序设计师IgorSysoev所开发，供俄国大型的入口网站及搜索引擎Rambler（俄文：Рамблер）使用。其特点是占有内存少，并发能力强，事实上nginx的并发能力确实在同类型的网页服务器中表现较好。 

1.Nginx 相对于 Apache 优点：
1) 高并发响应性能非常好，官方 Nginx 处理静态文件并发 5w/s
2) 反向代理性能非常强。（可用于负载均衡）
3) 内存和 cpu 占用率低。（为 Apache 的 1/5-1/10）
4) 对后端服务有健康检查功能。
5) 支持 PHP cgi 方式和 fastcgi 方式。
6) 配置代码简洁且容易上手。 

 

2.Nginx 工作原理及安装配置

Nginx 由内核和模块组成，其中，内核的设计非常微小和简洁，完成的工作也非常简单，仅仅通过查找配置文件将客户端请求映射到一个 location block（location 是 Nginx配置中的一个指令，用于 URL 匹配），而在这个 location 中所配置的每个指令将会启动不同的模块去完成相应的工作。
Nginx 的模块从结构上分为

核心模块、基础模块和第三方模块： 

 

核心模块：HTTP 模块、 EVENT 模块和 MAIL 模块
基础模块： HTTP Access 模块、HTTP FastCGI 模块、HTTP Proxy 模块和 HTTP Rewrite模块，
第三方模块：HTTP Upstream Request Hash 模块、 Notice 模块和 HTTP Access Key模块。

3.Nignx与Appache

Nginx 的高并发得益于其采用了 epoll 模型，与传统的服务器程序架构不同，epoll 是linux 内核 2.6 以后才出现的。 Nginx 采用 epoll 模型，异步非阻塞，而 Apache 采用的是select 模型 

 

Select 特点：select 选择句柄的时候，是遍历所有句柄，也就是说句柄有事件响应时，
select 需要遍历所有句柄才能获取到哪些句柄有事件通知，因此效率是非常低。

epoll 的特点：epoll 对于句柄事件的选择不是遍历的，是事件响应的，就是句柄上事
件来就马上选择出来，不需要遍历整个句柄链表，因此效率非常高 

## 2. 下载安装

### 2.1 安装包下载

官网：`http://nginx.org/en/download.html` 这里下载的时`nginx-1.15.9.tar.gz`

上传到服务器上，这里放在了`usr/software`目录下

### 2.2 环境准备

**安装编译源码所需要的工具和库**:

```linux
# yum install gcc gcc-c++ ncurses-devel perl 
```

**安装HTTP rewrite module模块**: 

```linux
# yum install pcre pcre-devel
```

**安装HTTP zlib模块**: 

```linux
# yum install zlib gzip zlib-devel
```

### 2.3 解压安装

**解压**：

```shell
[root@localhost software]# tar -zxvf nginx-1.15.9.tar.gz -C /usr/local
//解压到/usr/local目录下
```

**配置**:

进行configure配置，检查是否报错。

```linux
[root@localhost nginx-1.15.9]# ./configure --prefix=/usr/local/nginx

//出现下面的配置摘要就算配置ok
Configuration summary
  + using system PCRE library
  + OpenSSL library is not used
  + using system zlib library

  nginx path prefix: "/usr/local/nginx"
  nginx binary file: "/usr/local/nginx/sbin/nginx"
  .....
  nginx http uwsgi temporary files: "uwsgi_temp"
  nginx http scgi temporary files: "scgi_temp"
```

**编译安装**:

```linux
[root@localhost nginx-1.15.9]# make&&make install

//出现下面的提示就算编译安装ok
make[1]: Leaving directory `/usr/local/nginx-1.15.9'

```

编译安装后多了一个``Nginx`文件夹,在`/usr/local/nginx` 内部又分为四个目录

```nginx
/usr/local/nginx
			--conf	配置文件
			--html  网页文件
			--logs  日志文件
			--sbin  主要二进制文件
```

**查看Nginx版本:**

```linux
[root@localhost nginx]# /usr/local/nginx/sbin/nginx -v
nginx version: nginx/1.15.9
//这里是Nginx 1.15.9
```

到这里``Nginx`安装就结束了。

## 3. 基本使用

### 3.1 启动

```linux
[root@localhost sbin]# /usr/local/nginx/sbin/nginx

//这里如果没有报错就说明启动成功了
```

查看

```linux
[root@localhost sbin]# ps aux|grep nginx
root      98830  0.0  0.0  20552   616 ?        Ss   09:57   0:00 nginx: master process /usr/local/nginx/sbin/nginx
nobody    98831  0.0  0.1  23088  1392 ?        S    09:57   0:00 nginx: worker process
root      98839  0.0  0.0 112708   976 pts/1    R+   09:57   0:00 grep --color=auto nginx
```

可以看到Nginx有两个进程，一个`master进程`一个`worker进程`.

同时浏览器已经可以访问了:直接访问IP地址即可`http://192.168.5.154/`

显示如下：

```java
Welcome to nginx!
If you see this page, the nginx web server is successfully installed and working. Further configuration is required.

For online documentation and support please refer to nginx.org.
Commercial support is available at nginx.com.

Thank you for using nginx.
```

说明`Nginx`确实已经启动了。

### 3.2 常用命令

```linux
[root@localhost sbin]# /usr/local/nginx/sbin/nginx -s reload   # 重新载入配置文件

[root@localhost sbin]# /usr/local/nginx/sbin/nginx -s reopen   # 重启 Nginx

[root@localhost sbin]# /usr/local/nginx/sbin/nginx -s stop     # 停止 Nginx
```

## 4. 虚拟主机配置

在前面启动Nignx后，Nginx目录下会多出几个文件夹

```nginx
/usr/local/nginx
			--conf	配置文件
			--html  网页文件
			--logs  日志文件
			--sbin  主要二进制文件

			--client_body_temp
			--fastcgi_temp
			--proxy_temp
			--scgi_temp
			--uwsgi_temp
```

不过这些`temp`文件夹都不是重点。

### 4.1 配置文件

这里讲解一下`conf`里的配置文件，有很多配置文件，重点看` nginx.conf`.

```nginx
/usr/local/nginx/conf
		-- fastcgi.conf
		-- fastcgi.conf.default
 		-- fastcgi_params
		-- fastcgi_params.default
		-- koi-utf
 		-- koi-win
 		-- mime.types
 		-- mime.types.default
 		-- nginx.conf  # 重点关心这个
 		-- nginx.conf.default
		-- scgi_params
		-- scgi_params.default
 		-- uwsgi_params
		-- uwsgi_params.default
 		--win-utf
```

### 4.2 nginx.conf

看一下默认的`nginx.conf`

```nginx
[root@localhost conf]# vim nginx.conf
//默认配置如下：

#可以指定用户 不过无所谓
#user  nobody;   

#nginx工作进程,一般设置为和cpu核数一样
worker_processes  1; 

#错误日志存放目录 
#error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;

#进程pid存放位置
#pid        logs/nginx.pid;


events {
    # 单个CPU最大连接数
    worker_connections  1024;
}

# http 这里重点
http {
    #文件扩展名与类型映射表
    include       mime.types;
    
    #默认文件类型
    default_type  application/octet-stream;
    
	#设置日志模式
    #log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
    #                  '$status $body_bytes_sent "$http_referer" '
    #                  '"$http_user_agent" "$http_x_forwarded_for"';

    #access_log  logs/access.log  main;
    
  	#开启高效传输模式  
    sendfile        on;
    
    # 激活tcp_nopush参数可以允许把httpresponse header和文件的开始放在一个文件里发布
    # 积极的作用是减少网络报文段的数量
    #tcp_nopush     on;
    
	#连接超时时间，单位是秒
    #keepalive_timeout  0;
    keepalive_timeout  65;
    
    #开启gzip压缩功能
    #gzip  on;
    
	#基于域名的虚拟主机
    server {
        #监听端口
        listen       80;
        #域名
        server_name  localhost;
        #字符集
	    #charset koi8-r;
         
	    #nginx访问日志 这里的main就是上面配置的那个log_format  main 
        #access_log  logs/host.access.log  main;
        
	    #location 标签
        #这里的/表示匹配根目录下的/目录
        location / {
            #站点根目录，即网站程序存放目录
		   #就是上面的四个文件夹中的html文件夹
            root   html;
            #首页排序 默认找index.html 没有在找index.htm
            index  index.html index.htm;
        }
	    # 错误页面
        #error_page  404              /404.html;

        # redirect server error pages to the static page /50x.html
        #错误页面 错误码为500 502 503 504时 重定向到50x.html
        error_page   500 502 503 504  /50x.html;
	    #location 标签
        #这里的表示匹配根目录下的/50x.html
        location = /50x.html {
            root   html;
        }

        # proxy the PHP scripts to Apache listening on 127.0.0.1:80
        #
        #location ~ \.php$ {
        #    proxy_pass   http://127.0.0.1;
        #}

        # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
        #
        #location ~ \.php$ {
        #    root           html;
        #    fastcgi_pass   127.0.0.1:9000;
        #    fastcgi_index  index.php;
        #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
        #    include        fastcgi_params;
        #}

        # deny access to .htaccess files, if Apache's document root
  # concurs with nginx's one
        #
        #location ~ /\.ht {
        #    deny  all;
        #}
    }

```

### 4.3 基本配置

上面的配置文件好像挺长的，其实最重要的就那么几个。

```nginx
http{
    keepalive_timeout  65;
    server{
        listen 80; //端口号
        server_name localhost; //域名
        location \ {
            root html; //网站根目录
            index index.html; //网站首页
        }  
        access_log  logs/host.access.log  main; //访问日志
        error page 500 error.html; //错误页面
    }
}
```

## 5. 日志文件

再看一下Nginx目录结构

```nginx
/usr/local/nginx
			--conf	配置文件
			--html  网页文件
			--logs  日志文件
			--sbin  主要二进制文件
```

### 5.1 查看日志

前面看了`conf配置文件`，这里看下`logs日志文件`;

```nginx
/usr/local/nginx/logs
		-- access.log #访问日志
 		-- error.log  #错误日志
 		-- nginx.pid  #存放Nginx当前进程的pid
```

`nginx.pid` 存放Nginx当前进程的pid

```nginx
[root@localhost logs]# cat nginx.pid
98830
[root@localhost logs]# ps aux|grep nginx
root      98830  0.0  0.0  20552   616 ?        Ss   09:57   0:00 nginx: master process /usr/local/nginx/sbin/nginx
nobody    98831  0.0  0.1  23088  1636 ?        S    09:57   0:00 nginx: worker process
root     105254  0.0  0.0 112708   976 pts/1    R+   11:02   0:00 grep --color=auto nginx
```

`access.log` 访问日志

```nginx
[root@localhost logs]# tail -f -n 20  access.log

192.168.5.199 - - [04/Mar/2019:10:02:10 +0800] "GET / HTTP/1.1" 200 612 "-" "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.119 Safari/537.36"
192.168.5.199 - - [04/Mar/2019:10:02:10 +0800] "GET /favicon.ico HTTP/1.1" 404 555 "http://192.168.5.154/" "Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.119 Safari/537.36"
```

### 5.2 日志分割

Nginx日志都会存在一个文件里，随着时间推移，这个日志文件会变得非常大，分析的时候很难操作，所以需要对日志文件进行分割，可以根据访问量来进行选择：如按照天分割、或者半天、小时等。

建议使用shell脚本方式进行切割日志 。

#### 1. 编写脚本

脚本如下：

```shell
#!/bin/sh
#根路径
BASE_DIR=/usr/local/nginx
#最开始的日志文件名
BASE_FILE_NAME_ACCESS=access.log
BASE_FILE_NAME_ERROR=error.log
BASE_FILE_NAME_PID=nginx.pid
#默认日志存放路径
DEFAULT_PATH=$BASE_DIR/logs
#日志备份根路径
BASE_BAK_PATH=$BASE_DIR/datalogs

BAK_PATH_ACCESS=$BASE_BAK_PATH/access
BAK_PATH_ERROR=$BASE_BAK_PATH/error

#默认日志文件路径+文件名
DEFAULT_FILE_ACCESS=$DEFAULT_PATH/$BASE_FILE_NAME_ACCESS
DEFAULT_FILE_ERROR=$DEFAULT_PATH/$BASE_FILE_NAME_ERROR
#备份时间
BAK_TIME=`/bin/date -d yesterday +%Y%m%d%H%M`
#备份文件 路径+文件名
BAK_FILE_ACCESS=$BAK_PATH_ACCESS/$BAK_TIME-$BASE_FILE_NAME_ACCESS
BAK_FILE_ERROR=$BAK_PATH_ERROR/$BAK_TIME-$BASE_FILE_NAME_ERROR
        
# 打印一下备份文件 
echo access.log备份成功：$BAK_FILE_ACCESS
echo error.log备份成功：$BAK_FILE_ERROR

#移动文件
mv $DEFAULT_FILE_ACCESS $BAK_FILE_ACCESS
mv $DEFAULT_FILE_ERROR $BAK_FILE_ERROR

#向nginx主进程发信号重新打开日志
kill -USR1 `cat $DEFAULT_PATH/$BASE_FILE_NAME_PID`

```

 其实很简单，主要步骤如下：

* 1.移动日志文件：这里已经将日志文件移动到``datalogs`目录下了，但Nginx还是会继续往这里面写日志
* 2.发送`USR1`命令：告诉Nginx把日志写到``Nginx.conf`中配置的那个文件中，这里会重新生成日志文件

具体如下：

* **第一步**:就是重命名日志文件，不用担心重命名后nginx找不到日志文件而丢失日志。在你未重新打开原名字的日志文件前(即执行第二步之前)，nginx还是会向你重命名的文件写日志，Linux是靠`文件描述符`而不是`文件名`定位文件。
* **第二步**:向nginx主进程发送`USR1信号`。nginx主进程接到信号后会从配置文件中读取日志文件名称，重新打开日志文件(以配置文件中的日志名称命名)，并以工作进程的用户作为日志文件的所有者。重新打开日志文后，nginx主进程会关闭重名的日志文件并通知工作进程使用新打开的日志文件。(就不会继续写到前面备份的那个文件中了)工作进程立刻打开新的日志文件并关闭重名名的日志文件。然后你就可以处理旧的日志文件了。

#### 2. 赋权

```nginx
[root@localhost sbin]# chmod 777 log.sh 
```

将`log.sh`脚本设置为可执行文件

#### 3. 执行

设置一个定时任务用于周期性的执行该脚本

`cron`是一个linux下的定时执行工具，可以在无需人工干预的情况下运行作业。

```shell
service crond start   //启动服务

service crond stop    //关闭服务

service crond restart  //重启服务

service crond reload  //重新载入配置

service crond status  //查看服务状态 
```

**设置定时任务**：

```nginx
[root@localhost datalogs]# crontab -e

*/1 * * * * sh /usr/local/nginx/sbin/log.sh
```

`*/1 * * * *`： 为定时时间 这里为了测试 是设置的每分钟执行一次；

`0 2 * * * ` :每天凌晨两点执行

`sh` ：为任务类型 这里是一个sh脚本

`/usr/local/nginx/sbin/log.sh` ：为脚本路径

## 6.cron表达式

### 6.1 基本语法

　cron表达式代表一个时间的集合，使用6个空格分隔的字段表示：

| 字段名            | 是否必须 | 允许的值        | 允许的特定字符 |
| ----------------- | -------- | --------------- | -------------- |
| 秒(Seconds)       | 是       | 0-59            | * / , -        |
| 分(Minute)        | 是       | 0-59            | * / , -        |
| 时(Hours)         | 是       | 0-23            | * / , -        |
| 日(Day of month)  | 是       | 1-31            | * / , - ?      |
| 月(Month)         | 是       | 1-12 或 JAN-DEC | * / , -        |
| 星期(Day of week) | 否       | 0-6 或 SUM-SAT  | * / , - ?      |

注：月(Month)和星期(Day of week)字段的值不区分大小写，如：SUN、Sun 和 sun 是一样的。 

**星期字段没提供相当于`*`**

**一般只需要写5位就行了。即 `分 时 日 月 周`**

```java
 # ┌───────────── min (0 - 59)
 # │ ┌────────────── hour (0 - 23)
 # │ │ ┌─────────────── day of month (1 - 31)
 # │ │ │ ┌──────────────── month (1 - 12)
 # │ │ │ │ ┌───────────────── day of week (0 - 6) (0 to 6 are Sunday to
 # │ │ │ │ │                  Saturday, or use names; 7 is also Sunday)
 # │ │ │ │ │
 # │ │ │ │ │
 # * * * * *  command to execute
```

### 6.2 特定字符

*  **星号(*)**:表示 cron 表达式能匹配该字段的所有值。如在第2个字段使用星号(hour)，表示每小时

* **斜线(/)**:表示增长间隔，如第1个字段(minutes) 值是 `3/1`，表示每小时的第3分钟开始执行一次，之后每隔1分钟执行一次（1,2,3,4....59都执行一次）

* **逗号(,)**:用于枚举值，如第6个字段值是 MON,WED,FRI，表示 星期一、三、五 执行。

* **连字号(-)**:表示一个范围，如第3个字段的值为 9-17 表示 9am 到 5pm 之间每个小时（包括9和17）

* **问号(?)**:只用于 日(Day of month) 和 星期(Day of week)，表示不指定值，可以用于代替 *

## 7. location语法

### 7.1 简介

`nginx.conf`大概内容如下：

```java
http{
    keepalive_timeout  65;
    server{
        listen 80; //端口号
        server_name localhost; //域名
        location \ {
            root html; //网站根目录
            index index.html; //网站首页
        }  
        access_log  logs/host.access.log  main; //访问日志
        error page 500 error.html; //错误页面
    }
}
```

其中`server`代表虚拟主机，一个虚拟主机可以配置多个`location`

`location`表示uri方法定位

基本语法如下：

* 1.location=pattern{} 静准匹配
* 2.location pattern{} 一般匹配
* 3.location~pattern{} 正则匹配

**Nginx可以对数据进行压缩，对一些图片、css、js、html等文件进行缓存，从而实现动静分离等待优化功能**。

**动态的就去访问tomcat服务器，静态的就直接访问Nginx服务器**。

location [=|~|~*|^~|@] /uri/ { … }
〖=〗 表示精确匹配，如果找到，立即停止搜索并立即处理此请求。
〖~ 〗 表示区分大小写匹配
〖~*〗 表示不区分大小写匹配
〖^~ 〗 表示只匹配字符串,不查询正则表达式。

〖@〗 指定一个命名的location，一般只用于内部重定向请求。

### 7.2 正则表达式语法：

  1.  语法格式：location [=|~|~*|^~|@]   /uri/ { … } ，
             依据不同的前缀“= ”，“^~ ”，“~ ”，“~* ”和不带任何前缀的（因为[ ] 表示可选，可以不要的），表达不同的含义, 
            简单的说尽管location 的/uri/ 配置一样，但前缀不一样，表达的是不同的指令含义。
              注意：查询字符串不在URI范围内。例如：/films.htm?fid=123 的URI 是/films.htm 。）

2.对这些不同前缀，分下类，就2 大类：
      正则location ，英文说法是location using regular expressions 
      普通location ，英文说法是location using literal strings 。
      那么其中“~ ”和“~* ”前缀表示正则location ，“~ ”区分大小写，“~* ”不区分大小写；
      其他前缀（包括：“=”，“^~ ”和“@ ”）和   无任何前缀   都属于普通location 。

详细说明：
~       区分大小写匹配

~*     不区分大小写匹配

!~      区分大小写不匹配
        !~*    不区分大小写不匹配

^      以什么开头的匹配

$      以什么结尾的匹配

*      代表任意字符


## 8 .反向代理(proxy)

### 8.1 简介

如果您的内容服务器具有必须保持安全的敏感信息，如信用卡号数据库，可在防火墙外部设置一个`代理服务器`作为`内容服务器的替身`。当外部客户机尝试访问内容服务器时，会将其送到代理服务器。实际内容位于内容服务器上，在防火墙内部受到安全保护。代理服务器位于防火墙外部，在客户机看来就像是内容服务器。

​                   当客户机向站点提出请求时，请求将转到代理服务器。然后，代理服务器通过防火墙中的特定通路，将客户机的请求发送到内容服务器。内容服务器再通过该通道将结果回传给代理服务器。代理服务器将检索到的信息发送给客户机，好像代理服务器就是实际的内容服务器。如果内容服务器返回错误消息，代理服务器会先行截取该消息并更改标头中列出的任何 URL，然后再将消息发送给客户机。如此可防止外部客户机获取内部内容服务器的重定向 URL。

​                  这样，代理服务器就在安全数据库和可能的恶意攻击之间提供了又一道屏障。与有权访问整个数据库的情况相对比，就算是侥幸攻击成功，作恶者充其量也仅限于访问单个事务中所涉及的信息。未经授权的用户无法访问到真正的内容服务器，因为防火墙通路只允许代理服务器有权进行访问。

**就是客户端先访问Nginx服务器，Nginx收到请求后再去请求内容服务器,这样中间多了一个Nginx服务器中转，会更加安全**。

### 8.2 配置

#### 1. 修改配置文件

首先需要修改`Nginx服务器`配置文件``nginx.conf`。

配置文件大概是这样的，在`server`中添加一个`location`用于中转。

```nginx
http{
    keepalive_timeout  65;
    server{
        listen 80; //端口号
        server_name localhost; //域名
        location \ {
            root html; //网站根目录
            index index.html; //网站首页
        }  
        access_log  logs/host.access.log  main; //访问日志
        error page 500 error.html; //错误页面
        #这里就是代理 通过正则表达式来匹配
        #后缀以.jsp结尾的请求都会跳转到 http://192.168.5.154:8080;
        location ~ \.jsp$ {
            proxy_pass   http://192.168.5.154:8080;
        }  
    }
}
```

#### 2. 开启内容服务器

然后在`192.168.5.154`的`8080`端口开启了一个``tomcat`,当做是真正的内容服务器，在tomcat默认的`index.jsp`中添加了一句显示IP地址的。

```jsp
<!--测试Nginx反向代理新增-->
remote ip:<%=request.getRemoteAddr()%>
```

### 8.3. 测试

然后开始访问：

首先直接访问内容服务器(Tomcat)：`192.168.5.154:8080`

```java
remote ip:192.168.5.199 
```

然后访问Nginx通过代理来访问内容服务器：`192.168.5.154/index.jsp`

```java
remote ip:192.168.5.154
```

显示远程	IP是192.168.5.154，这个刚好就是Nginx服务器的IP；

反向代理成功。

### 8.4 问题

前面设置后反向代理已经成功了,但是这样设置后，每次访问内容服务器都显示的是Nginx服务器的IP,内容服务器无法获取用户的真实IP，所以还需要进行一点修改。

#### 1. 修改

```nginx
http{
    keepalive_timeout  65;
    server{
        listen 80; //端口号
        server_name localhost; //域名
        location \ {
            root html; //网站根目录
            index index.html; //网站首页
        }  
        access_log  logs/host.access.log  main; //访问日志
        error page 500 error.html; //错误页面
        #这里就是代理 通过正则表达式来匹配
        #后缀以.jsp结尾的请求都会跳转到 http://192.168.5.154:8080;
        location ~ \.jsp$ {
            #在请求头中添加上真实的IP 
            #具体格式为 proxy_set_header 属性名 数据
            proxy_set_header X-real-ip $remote_addr
            proxy_pass   http://192.168.5.154:8080;
        }  
    }
}
```

`proxy_set_header X-real-ip $remote_addr` :Nginx服务器是知道客户端真实IP的，所以为了让内容服务器知道真实IP，只需要将真实IP添加到请求头中就可以了。

其中`X-real-ip` 是自定义的，内容服务器取数据时也使用这个`X-real-ip`

`$remote_addr` 则是获取远程客户端IP。

#### 2. 测试：

修改jsp，添加了一句代码。

```jsp
                <!--测试Nginx反向代理新增-->
 			   <!--获取请求头中的真实IP-->
                Real remote ip:<%=request.getHeader("X-real-ip")%> <br />
                remote ip/Nginx ip:<%=request.getRemoteAddr()%>
```

然后开始访问：

首先直接访问内容服务器(Tomcat)：`192.168.5.154:8080`

```java
Real remote ip:null 
remote ip/Nginx ip:192.168.5.199 
```

然后访问Nginx通过代理来访问内容服务器：`192.168.5.154/index.jsp`

```java
Real remote ip:192.168.5.199 
remote ip/Nginx ip:192.168.5.154
```

成功获取到真实IP，问题解决。

## 9. 负载均衡(upstream)

### 9.1 简介

可以在一个组织内使用多个代理服务器来平衡各 Web 服务器间的网络负载。在此模型中，可以利用代理服务器的高速缓存特性，创建一个用于负载平衡的服务器池。此时，代理服务器可以位于防火墙的任意一侧。如果 Web 服务器每天都会接收大量的请求，则可以使用代理服务器分担 Web 服务器的负载并提高网络访问效率。

​                   对于客户机发往真正服务器的请求，代理服务器起着中间调停者的作用。代理服务器会将所请求的文档存入高速缓存。如果有不止一个代理服务器，DNS 可以采用“循环复用法”选择其 IP 地址，随机地为请求选择路由。客户机每次都使用同一个 URL，但请求所采取的路由每次都可能经过不同的代理服务器。

​                   可以使用多个代理服务器来处理对一个高用量内容服务器的请求，这样做的好处是内容服务器可以处理更高的负载，并且比其独自工作时更有效率。在初始启动期间，代理服务器首次从内容服务器检索文档，此后，对内容服务器的请求数会大大下降。

**同样是客户端先访问Nginx服务器，然后Nginx服务器再根据负载均衡算法将请求分发到不同的内容服务器上**。

### 9.2 配置

同意需要修改`Nginx服务器`配置文件``nginx.conf`。

配置文件大概是这样的，在`server`中添加一个`location`用于中转。

```nginx
http{
    keepalive_timeout  65;
    #upstream 负载均衡 与server同级
    #tomcat_server 负载均衡名字 自定义的 
    #要用在下面location反向代理处 
    #poxy_pass   http://tomcat_server;
    upstream tomcat_server{
        #weight权重 max_fails 最大失败次数 超过后就认为该节点down掉了 fail_timeout 超时时间
        #192.168.5.154:8080 IP地址或者域名都可以
        server 192.168.5.154:8080 weight=1 max_fails=2 fail_timeout=30s;
        server 192.168.5.155:8080 weight=1 max_fails=2 fail_timeout=30s;
    }
    
    
    server{
        listen 80; //端口号
        server_name localhost; //域名
        location \ {
            root html; //网站根目录
            index index.html; //网站首页
        }  
        access_log  logs/host.access.log  main; //访问日志
        error page 500 error.html; //错误页面
        #proxy_pass 反向代理 通过正则表达式来匹配
        #后缀以.jsp结尾的请求都会跳转到 http://192.168.5.154:8080;
        #proxy_set_header 将真实IP添加到请求头中 传递到内容服务器
        location ~ \.jsp$ {
            proxy_set_header X-real-ip $remote_addr
            #proxy_pass   http://192.168.5.154:8080;
            #反向代理这里不光可以写IP 还可以写上面配置的负载均衡
            proxy_pass   http://tomcat_server;
        }  
    }
}
```

#### 2. 开启内容服务器

开启两个tomcat，一个是`192.168.5.154`,一个是``192.168.5.155`.

然后浏览器访问nginx服务器：`192.168.5.154/index.jsp`；

会随机跳转到两个tomcat服务器中的一个就说明负载均衡配置成功了。

## 10. Nginx中的信号量

```java
Nginx支持以下几种信号选项：

TERM，INT：       快速关闭                          　　　　                       
QUIT ：从容关闭（优雅的关闭进程,即等请求结束后再关闭）     
HUP ：平滑重启，重新加载配置文件 （平滑重启，修改配置文件之后不用重启服务器。直接kill -PUT 进程号即可）
USR1 ：重新读取日志文件，在切割日志时用途较大（停止写入老日志文件，打开新日志文件，之所以这样是因为老日志文件就算修改的文件名，由于inode的原因，nginx还会一直往老的日志文件写入数据） 
USR2 ：平滑升级可执行程序  ，nginx升级时候用                           　　　　 
WINCH ：从容关闭工作进程     
```

## 参考

`https://www.cnblogs.com/crazylqy/p/6891929.html`

`http://www.runoob.com/linux/nginx-install-setup.html`

`https://www.cnblogs.com/javahr/p/8318728.html`