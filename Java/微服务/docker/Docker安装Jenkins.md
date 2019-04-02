#  Docker 安装 Jenkins

## docker-compose

Jenkins 是一个简单易用的持续集成软件平台，我们依然采用 Docker 的方式部署。

创建目录`/usr/local/docker/jenkins`，接着创建配置文件

`docker-compose.yml`配置文件如下：

```yml
version: '3.1'
services:
  jenkins:
    restart: always
    image: jenkinsci/jenkins
    container_name: jenkins
    ports:
      - 8080:8080
      - 50000:50000
    environment:
      TZ: Asia/Shanghai
    volumes:
      - ./data:/var/jenkins_home
```

```text
发布端口 8080
基于 JNLP 的 Jenkins 代理通过 TCP 端口 50000 与 Jenkins master 进行通信
```

安装过程中会出现 `Docker 数据卷` 权限问题，用以下命令解决：

```text
chown -R 1000 /usr/local/docker/jenkins/data
```

## 安装

在`docker-compose.yml`所在目录

```bash
$ docker-compose up
```

## 访问

浏览器访问：`ip:8080`

Jenkins 第一次启动时需要输入一个初始密码用以解锁安装流程，使用 `docker logs jenkins` 即可方便的查看到初始密码

**注意：** 安装时可能会因为网速等原因导致安装时间比较长，请大家耐心等待。如果长时间停留在安装页没反应，请尝试使用 `F5` 刷新一下。