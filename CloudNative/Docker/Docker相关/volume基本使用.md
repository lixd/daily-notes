# Volume

## 1. 概述

[官方文档](https://docs.docker.com/engine/reference/commandline/volume_create/)

volume（卷）用来存储docker持久化的数据，其实就是一个主机上的一个目录，由docker统一管理。

volume 分为匿名卷和实名卷。其实匿名卷和实名卷基本可以看成是一个东西，只是匿名卷名字由docker随机命名，并且可以随容器的销毁而销毁而已（如果在创建容器是添加了-rm参数）。



## 2. 基本命令

volume 相关命令：



```shell
  create      Create a volume
  inspect     Display detailed information on one or more volumes
  ls          List volumes
  prune       Remove all unused local volumes
  rm          Remove one or more volumes
```

* 1）**create 创建数据卷**

```shell
[root@iZ2ze9ebgot9h2acvk4uabZ ~]# docker volume create test_volume
test_volume
```

* 2）**ls 查看数据卷列表**

```shell
[root@iZ2ze9ebgot9h2acvk4uabZ ~]# docker volume ls
DRIVER              VOLUME NAME
local               test_volume
```

* 3）**inspect 查看数据卷具体信息**

```shell
[root@iZ2ze9ebgot9h2acvk4uabZ ~]# docker volume inspect test_volume
[
    {
        "CreatedAt": "2020-07-06T15:57:52+08:00",
        "Driver": "local",
        "Labels": {},
        # 这就是具体的存放路径 所有 volume 都存放在 /var/lib/docker/volumes/下面
        "Mountpoint": "/var/lib/docker/volumes/test_volume/_data",
        "Name": "test_volume",
        "Options": {},
        "Scope": "local"
    }
]
```

* 4）**rm 移除数据卷**

```shell
# 移除后会同步删除对应的文件夹
[root@iZ2ze9ebgot9h2acvk4uabZ es]# docker volume rm test_volume
test_volume
```

* 5）**prune 移除所有未使用的数据卷**

```shell
[root@iZ2ze9ebgot9h2acvk4uabZ volumes]# docker volume prune
WARNING! This will remove all local volumes not used by at least one container.
Are you sure you want to continue? [y/N] y
Deleted Volumes:
test_volume

Total reclaimed space: 0B
```



## 3. docker 中使用

```shell
# 需要先创建数据卷
$ docker volume create hello
hello
# 使用的时候用 -v 参数指定 syntax：-v vloume_name:dir_in_container
# 这里就是 用 hello 数据卷与容器中的 /word 目录做映射
$ docker run -d -v hello:/world busybox ls /world
```



## 4. compose 中使用

compose 中有两种方式

* 1）显式路径

```yml
version: '3.1'
services:
  db:
    image: mysql:8
    ports:
      - 3306:3306
    volumes:
      - ./data:/var/lib/mysql
```

`./data:/var/lib/mysql`显式指定将`./data`目录与容器中的`/var/lib/mysql`映射。



* 2）使用卷标

```yml
version: '3.1'
services:
  db:
    image: mysql:8
    ports:
      - 3306:3306
    volumes:
      - mysql:/var/lib/mysql
volumes:
  mysql:
```

将卷标 mysql 对应的路径映射到`/var/lib/mysql`。数据卷 mysql 对应的路径可以通过前面的命令（docker volume inspect volume_name）查看。

启动时，如果数据卷不存在会自动创建。

