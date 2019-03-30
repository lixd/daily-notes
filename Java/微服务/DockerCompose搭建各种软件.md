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

#### MySQL5.7

```yml
version: '3.1'
services:
  mysql:
    restart: always
    image: mysql:5.7.22
    container_name: mysql
    ports:
      - 3306:3306
    environment:
      TZ: Asia/Shanghai
      MYSQL_ROOT_PASSWORD: 123456
    command:
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_general_ci
      --explicit_defaults_for_timestamp=true
      --lower_case_table_names=1
      --max_allowed_packet=128M
      --sql-mode="STRICT_TRANS_TABLES,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO"
    volumes:
      - mysql-data:/var/lib/mysql

volumes:
  mysql-data:
```



### 安装

在`docker-compose.yml`所在目录

```bash
$ docker-compose up
```

## 2. Tomcat

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



```text
  <!-- 配置需要指定生成的数据库和表，% 代表所有表 -->
        <table catalog="myshop" tableName="%">
            <!-- mysql 配置 -->
            <generatedKey column="id" sqlStatement="Mysql" identity="true"/>
            <property name="ignoreQualifiersAtRuntime" value="true"/> 
        </table>
```