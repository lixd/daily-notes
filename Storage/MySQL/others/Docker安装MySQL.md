# DockerCompose搭建各种软件

## 1. MySQL

### 配置文件

创建一个放配置文件的目录`/usr/local/docker/mysql`

`docker-compose.yml`配置文件

#### MySQL8

```yml
version: '3.1'
services:
  db:
    image: mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: 123456
    command:
      --default-authentication-plugin=mysql_native_password
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_general_ci
      --explicit_defaults_for_timestamp=true
      --lower_case_table_names=1
    ports:
      - 3306:3306
    volumes:
      - ./data:/var/lib/mysql

  adminer:
    image: adminer
    restart: always
    ports:
      - 8080:8080
```

[更多`docker-compose.yml`点击这里](https://github.com/lixd/ymls)



### 安装

在`docker-compose.yml`所在目录

```bash
$ docker-compose up
```

**注意**：连接MySQL8配置文件中的驱动要换成`com.mysql.cj.jdbc.Driver`

