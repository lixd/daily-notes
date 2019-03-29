# 搭建Nexus

## 1. 简介

Nexus 是一个强大的仓库管理器，极大地简化了内部仓库的维护和外部仓库的访问。

2016 年 4 月 6 日 Nexus 3.0 版本发布，相较 2.x 版本有了很大的改变：

- 对低层代码进行了大规模重构，提升性能，增加可扩展性以及改善用户体验。
- 升级界面，极大的简化了用户界面的操作和管理。
- 提供新的安装包，让部署更加简单。
- 增加对 Docker, NeGet, npm, Bower 的支持。
- 提供新的管理接口，以及增强对自动任务的管理。

## 2. 基于 Docker 安装 Nexus

### 1. 下载

```bash 
$ docker pull sonatype/nexus3
```

### 2.配置文件

`docker-compose.yml`配置如下：

```yml
version: '3.1'
services:
  nexus:
    restart: always
    image: sonatype/nexus3
    container_name: nexus
    ports:
      - 8081:8081
    volumes:
      - /usr/local/docker/nexus/data:/nexus-data
```

### 3. 启动

```bash
$ docker-compose up
```

这里有个小问题，启动的时候提示没有data目录的权限，所以需要先加上权限后在启动。

```bash
$ chmod 777 data
```

## 4. 使用

地址：`http://ip:port/`

用户名：admin 

密码：admin123

