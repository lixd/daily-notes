# Docker 安装Nginx

## 1. 安装

### docker-compose.yml

我们使用 Docker 来安装和运行 Nginx，在 `/usr/local/docker/nginx` 目录下创建 `docker-compose.yml` 配置文件，`docker-compose.yml` 配置如下：

```yml
version: '3.1'
services:
  nginx:
    restart: always
    image: nginx
    container_name: nginx
    ports:
      - 80:80
      - 8080:8080
    volumes:
      - ./conf/nginx.conf:/etc/nginx/nginx.conf
      - ./wwwroot:/usr/share/nginx/wwwroot
```

由于配置了数据卷，启动时若文件不存在时会自动创建同名文件夹，但我们需要的是文件，所以先手动创建一下文件。

在 `/usr/local/docker/nginx/conf` 目录下创建 `nginx.conf` 配置文件

### 启动

在`docker-compose.yml`所在目录启动Docker。

```bash
docker-compose up -d
```

由于没有配置文件这里不会真的启动成功。

## 2. 基于端口的虚拟主机配置

### 需求

- Nginx 对外提供 80 和 8080 两个端口监听服务
- 请求 80 端口则请求 html80 目录下的 html
- 请求 8080 端口则请求 html8080 目录下的 html

### 创建目录及文件

在 `/usr/local/docker/nginx/wwwroot` 目录下创建 `html80` 和 `html8080` 两个目录，并分辨创建两个 index.html 文件

### 配置虚拟主机

修改 `/usr/local/docker/nginx/conf` 目录下的 nginx.conf 配置文件：

```bash
# 启动进程,通常设置成和 CPU 的数量相等
worker_processes  1;

events {
    # epoll 是多路复用 IO(I/O Multiplexing) 中的一种方式
    # 但是仅用于 linux2.6 以上内核,可以大大提高 nginx 的性能
    use epoll;
    # 单个后台 worker process 进程的最大并发链接数
    worker_connections  1024;
}

http {
    # 设定 mime 类型,类型由 mime.type 文件定义
    include       mime.types;
    default_type  application/octet-stream;

    # sendfile 指令指定 nginx 是否调用 sendfile 函数（zero copy 方式）来输出文件，对于普通应用，
    # 必须设为 on，如果用来进行下载等应用磁盘 IO 重负载应用，可设置为 off，以平衡磁盘与网络 I/O 处理速度，降低系统的 uptime.
    sendfile        on;
    
    # 连接超时时间
    keepalive_timeout  65;
    # 设定请求缓冲
    client_header_buffer_size 2k;

    # 配置虚拟主机 192.168.5.211
    server {
	# 监听的ip和端口，配置 192.168.5.211:80
        listen       80;
	# 虚拟主机名称这里配置ip地址
        server_name  192.168.5.211;
	# 所有的请求都以 / 开始，所有的请求都可以匹配此 location
        location / {
	    # 使用 root 指令指定虚拟主机目录即网页存放目录
	    # 比如访问 http://ip/index.html 将找到 /usr/local/docker/nginx/wwwroot/html80/index.html
	    # 比如访问 http://ip/item/index.html 将找到 /usr/local/docker/nginx/wwwroot/html80/item/index.html

            root   /usr/share/nginx/wwwroot/html80;
	    # 指定欢迎页面，按从左到右顺序查找
            index  index.html index.htm;
        }

    }
    # 配置虚拟主机 192.168.5.211
    server {
        listen       8080;
        server_name  192.168.5.211;

        location / {
            root   /usr/share/nginx/wwwroot/html8080;
            index  index.html index.htm;
        }
    }
}
```

## 3. 基于域名的虚拟主机配置

### 需求

- 两个域名指向同一台 Nginx 服务器，用户访问不同的域名显示不同的网页内容
- 两个域名是 `admin.service.illusory.com `和 `admin.web.illusory.com`
- Nginx 服务器使用虚拟机 192.168.5.211

### 配置 Windows Hosts 文件

- 通过 host 文件指定 `admin.service.illusory.com` 和`admin.service.illusory.com`对应 192.168.5.211 虚拟机：
- 修改 window 的 hosts 文件：（C:\Windows\System32\drivers\etc）

### 创建目录及文件

在 `/usr/local/docker/nginx/wwwroot` 目录下创建 `htmlservice` 和 `htmlweb` 两个目录，并分辨创建两个 index.html 文件

### 配置虚拟主机

```bash
user  nginx;
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;

    keepalive_timeout  65;
    server {
        listen       80;
        server_name  admin.service.illusory.com;
        location / {
            root   /usr/share/nginx/wwwroot/htmlservice;
            index  index.html index.htm;
        }

    }

    server {
        listen       80;
        server_name  admin.service.illusory.com;

        location / {
            root   /usr/share/nginx/wwwroot/htmlweb;
            index  index.html index.htm;
        }
    }
}
```