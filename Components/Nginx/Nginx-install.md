# Nginx安装



## 1. 编译安装

### 1. 安装包下载

官网：

```sh
http://nginx.org/en/download.html
```

这里下载的是`nginx-1.19.0.tar.gz`。

直接右键复制下载链接 用`wget` 下载到服务器

```sh
$ wget http://nginx.org/download/nginx-1.19.0.tar.gz
```



### 2. 环境准备

**安装编译源码所需要的工具和库**:

```sh
$ yum install -y gcc gcc-c++
```

**安装pcre软件包（使nginx支持http rewrite模块）**

```sh
$ yum install -y pcre pcre-devel
```

**安装 openssl-devel（使 nginx 支持 ssl）**

```sh
$ yum install -y openssl openssl-devel 
```

**安装zlib**

```sh
$ yum install -y zlib zlib-devel gd gd-devel
```



### 3. 解压安装

**解压**：

```shell
$ tar -zxvf nginx-1.19.0.tar.gz
```

**配置**:

进行configure配置，检查是否报错。

```sh
$ cd nginx-1.19.0/
$ ./configure --prefix=/usr/local/nginx
```

如果需要使用 HTTPS 则必须在编译时增加 SSL 模块，对应命令如下：

```sh
$ ./configure --prefix=/usr/local/nginx --with-http_stub_status_module --with-http_ssl_module
```



```sh
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

```sh
$ make && make install

//出现下面的提示就算编译安装ok
make[1]: Leaving directory `/usr/local/nginx-1.19.0'
```

编译安装后多了一个`Nginx`文件夹,在`/usr/local/nginx` 内部又分为四个目录

```nginx
/nginx
    ├── conf 配置文件
    │   ├── .....
    │   ├── mime.types
    │   ├── mime.types.default
    │   ├── nginx.conf
    │   ├── nginx.conf.default
        ├── .....
    ├── html 网页文件
    │   ├── 50x.html
    │   └── index.html
    ├── logs 日志文件
    └── sbin 主要二进制文件
```

**查看Nginx版本:**

```shell
$ /usr/local/nginx/sbin/nginx -v
nginx version: nginx/1.19.0
```

到这里``Nginx`安装就结束了。



### 4. 常用命令

```sh
 # 以默认配置文件启动
/usr/local/nginx/sbin/nginx
# 指定配置文件启动
/usr/local/nginx/sbin/nginx -c /usr/local/nginx/conf/nginx.conf 
 # 重新载入配置文件
/usr/local/nginx/sbin/nginx -s reload  
 # 重启 Nginx
/usr/local/nginx/sbin/nginx -s reopen  
 # 停止 Nginx
/usr/local/nginx/sbin/nginx -s stop    
```



## 2. Docker 安装

这里通过`docker-compose`安装

### 1. 目录结构

```sh
/usr/local/docker/nginx
					--/conf/nginx.conf # 配置文件
					--/html # 存静态文件的目录
					--/certs # 存放ssl证书
					--/log # 日志
					--docker-compose.yml # 启动文件
```





### 2. docker-compose.yml

```yml
version: '3.0'

services:
  nginx:
    restart: always
    image: nginx
    ports:
      - 80:80
      - 443:443
    volumes:
      - ./conf/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./logs:/var/log/nginx
      - ./html:/var/html #把外部存静态文件的目录映射到容器内部 nginx.conf文件就指定加载这个目录下的静态文件
      - ./certs:/var/certs 
```

### 3. nginx.conf

```sh
 server {
        listen       80;
        server_name  localhost;

        location / {
        	# 这里需要指定成和docker-compose.yml中设置的目录一直 这里是/var/html
            root  /var/html;
            index  index.html index.htm;
        }

        #error_page  404              /404.html;

        # redirect server error pages to the static page /50x.html
        #
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   /var/html;
        }

}

# HTTPS server
    #
    #server {
    #    listen       443 ssl;
    #    server_name  localhost;

    #    ssl_certificate      cert.pem;
    #    ssl_certificate_key  cert.key;

    #    ssl_session_cache    shared:SSL:1m;
    #    ssl_session_timeout  5m;

    #    ssl_ciphers  HIGH:!aNULL:!MD5;
    #    ssl_prefer_server_ciphers  on;

    #    location / {
    #        root   /html;
    #        index  index.html index.htm;
    #    }
    #}
```

