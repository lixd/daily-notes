# Docker安装Tomcat

## docker-compose

创建一个放配置文件的目录`/usr/local/docker/tomcat`

`docker-compose.yml`配置文件

```yml
Docker Compose 实战 Tomcat
version: '3.1'
services:
  tomcat:
    restart: always
    image: tomcat
    container_name: tomcat
    ports:
      - 8080:8080
    volumes:
      - /usr/local/docker/tomcat/webapps/test:/usr/local/tomcat/webapps/test
    environment:
      TZ: Asia/Shanghai
```

### 安装

在`docker-compose.yml`所在目录

```bash
$ docker-compose up
```