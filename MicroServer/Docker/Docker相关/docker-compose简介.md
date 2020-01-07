# docker-compose

## 1. 概述

Docker Compose是一个工具

这个工具可以通过一个`yml`文件定义多容器的`docker`应用

通过一条命令就可以根据`yml`文件的定义去创建或者管理多个容器

## 2.docker-compose.yml

### 0. 版本

推荐使用`version3`.虽然现在`version2`也可以继续使用.

两版本最大不同是：`version2`只能用于单机部署，`version3`可以用于多机。

### 1. Services

一个`service`代表一个`container`，这个`container`可以`dockerhub`的`image`来创建 或者从本地`Dockerfile ` `build`出来的`image`来创建

`Service`的启动类似`docker run `我们可以给其指定`network`和`Volume` 所以可以给`service`指定`network`和`Volume`的引用；

### 2.volumes

用于指定数据卷,类似于参数`-v`

### 3. networks

用于指定docker网络。类似于参数`--network`

### 4. example

```yaml
version: '3'

services:

  wordpress:
    image: wordpress
    ports:
      - 8080:80
    environment:
      WORDPRESS_DB_HOST: mysql
      WORDPRESS_DB_PASSWORD: root
    networks:
      - my-bridge

  mysql:
    image: mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: wordpress
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - my-bridge
  web:
    build:
      content: .
      dockerfile: Dockerfile
    ports:
      -8080:8080
      
volumes:
  mysql-data:

networks:
  my-bridge:
    driver: bridge
```



其中包含两个`container`，一个`WordPress` 一个`MySQL`

两个容器都使用同一个网络`my-bridge`

```yaml
version: '3'

services:
  mysql:
    networks:
      - my-bridge

networks:
  my-bridge:
    driver: bridge
```

可以看到首选在`services`中的`networks`处指定使用网络`my-bridge`

然后在`networks`中指定网络`my-bridge`为`bridge`桥接网络

>  这里如果`driver`不指定的话默认为`bridge`



`volumes`同理

```sh
version: '3'

services:
  mysql:
    volumes:
      - mysql-data:/var/lib/mysql
volumes:
  mysql-data:
```

首选在`services`中的`volumes`处指定使用引用数据卷`mysql-data`,将容器内的`/var/lib/mysql`目录挂载到数据卷`mysql-data`

然后在`volumes`中创建数据卷`mysql-data`



同时也可以使用本地`Dockerfile`进行build`构建镜像来运行

```sh
  web:
    build:
      content: .
      dockerfile: Dockerfile
    ports:
      -8080:8080
```

`content: .`表示在当前目录进行build操作。

`dockeerfile: Dockerfile`表示`dockerfile`文件名为`Dockerfile`

如果yml文件中包含需要先build的镜像可以在执行`docker-compose up`命令前执行`docker-compose build`先把镜像构建好之后再启动
同时如果dockerfile发生变化之后需要`docker-compose build`重新build镜像才行，否则直接启动还是使用的旧镜像。


## 3. 基本使用

### 1. 安装

在 Linux 上的也安装十分简单，从 [官方 GitHub Release](https://github.com/docker/compose/releases) 处直接下载编译好的二进制文件即可。

例如，在 Linux 64 位系统上直接下载对应的二进制包。

```sh
# curl下载
$ curl -L https://github.com/docker/compose/releases/download/1.24.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
# 添加可执行权限
$ chmod +x /usr/local/bin/docker-compose
```

### 2. 基本使用

启动

```sh
# -f参数指定yml文件 默认是docker-compose.yml
docker-compose up 
```

停止

```sh
docker-compose stop
```

停止并删除(容器 网络 数据卷等)

```sh
docker-compose down
```

查看容器列表

```sh
docker-compose ps
```



进入容器

```sh
# 不用想docker一样填容器ID了 这里直接使用yml文件中指定的servicename即可
docker-compose exec serviceName bash
eg:docker-compose exec mysql bash
```



## 4. 水平拓展

当一个容器压力很大时，使用`docker-compose`的`--scale`参数可以很方便的水平拓展多个容器。

```sh
#--scale表示要启动多个 serviceName即yml中指定的名字 count为想要启动的容器个数
docker-compose up --scale serviceName=count -d
# 即表示把yml中指定的名字叫做web的service启动3个
eg:docker-compose up --scale web=3 -d
```

但是直接启动时会报错，因为在yml文件中指定了端口的，即当前启动的3台容器都要绑定到同一个端口 这肯定不行，所以需要将yml文件中的`ports`去掉。

>  不光可以增加，也可以减少。
>
> docker-compose up --scale web=3 -d 启动3个之后再执行
>
> docker-compose up --scale web=2 -d 则会关掉一个