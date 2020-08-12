# DockerCompose 安装 MySQL

## MySQL8

`docker-compose.yml`配置文件

```yml
version: '3.1'
services:
  db:
    image: mysql:8
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: 123456
    command:
      --default-authentication-plugin=mysql_native_password
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_general_ci
      --explicit_defaults_for_timestamp=true
      --lower_case_table_names=1
      --max_allowed_packet=128M
    ports:
      - 3306:3306
    volumes:
      - ./data:/var/lib/mysql

  adminer:
    image: adminer
    restart: always
    ports:
      - 9090:8080
```

## 启动

在`docker-compose.yml`所在目录执行以下命令启动

```bash
# -d 后台守护态运行
$ docker-compose up -d
```

**注意**：连接MySQL8配置文件中的驱动要换成`com.mysql.cj.jdbc.Driver`

