# 基于 Docker 安装 FastDFS

## 环境准备

- libfastcommon.tar.gz
- fastdfs-5.11.tar.gz
- nginx-1.13.6.tar.gz
- fastdfs-nginx-module_v1.16.tar.gz、

## 创建工作目录

在 Linux 服务器上创建 `/usr/local/docker/fastdfs/environmen` 目录

说明：

- `/usr/local/docker/fastdfs`：用于存放 `docker-compose.yml` 配置文件及 FastDFS 的数据卷
- `/usr/local/docker/fastdfs/environment`：用于存放 `Dockerfile` 镜像配置文件及 FastDFS 所需环境

## docker-compose.yml

```yml
version: '3.1'
services:
  fastdfs:
    build: environment
    restart: always
    container_name: fastdfs
    volumes:
      - ./storage:/fastdfs/storage
    network_mode: host
```

## Dockerfile

```dockerfile
FROM centos
MAINTAINER topsale@vip.qq.com

# 更新数据源
WORKDIR /etc/yum
RUN yum update -y

# 安装依赖
#RUN yum install make gcc libpcre3-dev zlib1g-dev -y
RUN yum install git gcc gcc-c++ make automake autoconf libtool pcre pcre-devel zlib zlib-devel openssl-devel wget vim -y
FROM centos
MAINTAINER illusory

# 更新数据源
WORKDIR /etc/yum
RUN yum update -y

# 安装依赖
RUN yum install git gcc gcc-c++ make automake autoconf libtool pcre pcre-devel zlib zlib-devel openssl-devel wget vim -y
# 复制工具包
ADD fastdfs-5.11.tar.gz /usr/local/src
ADD fastdfs-nginx-module_v1.16.tar.gz /usr/local/src
ADD libfastcommon.tar.gz /usr/local/src
ADD nginx-1.13.6.tar.gz /usr/local/src

# 安装 libfastcommon
WORKDIR /usr/local/src/libfastcommon
RUN ./make.sh && ./make.sh install

# 安装 FastDFS
WORKDIR /usr/local/src/fastdfs-5.11
RUN ./make.sh && ./make.sh install

# 配置 FastDFS 跟踪器
ADD tracker.conf /etc/fdfs
RUN mkdir -p /fastdfs/tracker

# 配置 FastDFS 存储
ADD storage.conf /etc/fdfs
RUN mkdir -p /fastdfs/storage

# 配置 FastDFS 客户端
ADD client.conf /etc/fdfs

# 配置 fastdfs-nginx-module
ADD config /usr/local/src/fastdfs-nginx-module/src

# FastDFS 与 Nginx 集成
WORKDIR /usr/local/src/nginx-1.13.6
RUN ./configure --add-module=/usr/local/src/fastdfs-nginx-module/src
RUN make && make install
ADD mod_fastdfs.conf /etc/fdfs

WORKDIR /usr/local/src/fastdfs-5.11/conf
RUN cp http.conf mime.types /etc/fdfs/

# 配置 Nginx
ADD nginx.conf /usr/local/nginx/conf

COPY entrypoint.sh /usr/local/bin/
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

WORKDIR /
EXPOSE 8888
CMD ["/bin/bash"]

```

## entrypoint.sh

```bash
#!/bin/sh
/etc/init.d/fdfs_trackerd start
/etc/init.d/fdfs_storaged start
/usr/local/nginx/sbin/nginx -g 'daemon off;'
```

**注**：Shell 创建后是无法直接使用的，需要赋予执行的权限，使用 `chmod +x entrypoint.sh` 命令

## 各种配置文件说明

### tracker.conf

FastDFS 跟踪器配置，容器中路径为：/etc/fdfs，修改为：

```bash
base_path=/fastdfs/tracker
```

### storage.conf

FastDFS 存储配置，容器中路径为：/etc/fdfs，修改为：

```bash
base_path=/fastdfs/storage
store_path0=/fastdfs/storage
tracker_server=192.168.5.155:22122
http.server_port=8888
```

### client.conf

FastDFS 客户端配置，容器中路径为：/etc/fdfs，修改为：

```bash
base_path=/fastdfs/tracker
tracker_server=192.168.5.155:22122
```

### config

fastdfs-nginx-module 配置文件，容器中路径为：/usr/local/src/fastdfs-nginx-module/src，修改为：

```bash
# 修改前
CORE_INCS="$CORE_INCS /usr/local/include/fastdfs /usr/local/include/fastcommon/"
CORE_LIBS="$CORE_LIBS -L/usr/local/lib -lfastcommon -lfdfsclient"

# 修改后
CORE_INCS="$CORE_INCS /usr/include/fastdfs /usr/include/fastcommon/"
CORE_LIBS="$CORE_LIBS -L/usr/lib -lfastcommon -lfdfsclient"
```

### mod_fastdfs.conf

fastdfs-nginx-module 配置文件，容器中路径为：/usr/local/src/fastdfs-nginx-module/src，修改为：

```bash
connect_timeout=10
tracker_server=192.168.5.155:22122
url_have_group_name = true
store_path0=/fastdfs/storage
```

### nginx.conf

Nginx 配置文件，容器中路径为：/usr/local/src/nginx-1.13.6/conf，修改为：

```bash
user  root;
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
        listen       8888;
        server_name  localhost;

        location ~/group([0-9])/M00 {
            ngx_fastdfs_module;
        }

        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
}
```

## 启动容器

```bash
docker-compose up 
```

## 测试上传

### 交互式进入容器

```bash
docker exec -it fastdfs /bin/bash
```

### 测试文件上传

```bash
# /usr/bin/fdfs_upload_file 上传文件脚本
# /etc/fdfs/client.conf 配置文件
# /usr/local/src/fastdfs-5.11/INSTALL 这个是用来测试上传的文件 随便选的一个 不重要
/usr/bin/fdfs_upload_file /etc/fdfs/client.conf /usr/local/src/fastdfs-5.11/INSTALL
# 上传后服务器会返回一个文件地址 如下
group1/M00/00/00/wKgFm1yqrzGARGUCAAAeSwu9TgM6327661
```

### 服务器反馈上传地址

```bash
group1/M00/00/00/wKgFm1yqrzGARGUCAAAeSwu9TgM6327661
```

## 测试 Nginx 访问

```text
http://192.168.5.155:8888/group1/M00/00/00/wKgFm1yqrzGARGUCAAAeSwu9TgM6327661
```

