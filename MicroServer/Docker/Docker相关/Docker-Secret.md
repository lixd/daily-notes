# Docker-secret

## 概述

生产环境下，为了安全，我们不能把各项目的配置密码写入到配置文件

我们可以引入docker的secret方式保护密码。



* 存在Swarm Manager节点的Raft database中。
* Secret可以assign给一个service，这个service就能看到这个secret
* 在container内部Secret看起来像文件，实际是存在内存中的

## 基本操作

密码可以可以来自`文件`或者`标准输入`。

```sh
# 指定secret名字和密码数据来源文件
docker secret create secretName fileName
eg:docker secret create my-pw pwfile
# yourpassword就是你想设置的密码
echo yourpassword" | docker secret create my-pw2 -
```



## 使用

### 在service run中使用

```sh
#--secret指定使用哪个secret my-pw就是前面创建的secret名字
docker service create --secret my-pw
```

> 容器启动后在/run/secrets目录里就可以看到一个叫做my-pw的文件了 内容就是指定的密码
>
> 虽然看起来是一个文件 但是实际上是存在内存中的



### 在docker-compose.yml中使用

```yaml
version: '3'

services:
  mysql:
    image: mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: wordpress
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - my-bridge

volumes:
  mysql-data:

networks:
  my-bridge:
    driver: bridge
```

以前是通过环境变量`MYSQL_ROOT_PASSWORD`直接指定密码的 密码写在文件中不够安全。

```yaml
version: '3'

services:
  mysql:
    image: mysql
    environment:
      MYSQL_ROOT_PASSWORD_FILE: /run/secret/my-pw
      MYSQL_DATABASE: wordpress
    volumes:
      - mysql-data:/var/lib/mysql
    networks:
      - my-bridge

volumes:
  mysql-data:

networks:
  my-bridge:
    driver: bridge
```
可以看到现在使用的环境变量是`MYSQL_ROOT_PASSWORD_FILE` 直接指定文件了 然后刚好容器创建后指定的secret会出现在`/run/secrets`目录下 