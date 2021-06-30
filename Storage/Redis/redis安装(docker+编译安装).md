# Docker安装Redis

## 1. 编译安装

### 1. 环境准备

由于 redis 是用 C 语言开发，安装之前必先确认是否安装 gcc 环境（gcc -v），如果没有安装，执行以下命令进行安装

```sh
$ yum install -y gcc
```

### 2. 编译安装

#### 1. 下载源码

直接去官网下载最新的版本即可

```sh
$ wget http://download.redis.io/releases/redis-5.0.7.tar.gz
$ tar -zxvf redis-5.0.7.tar.gz
```

#### 2. 编译

```sh
$ cd redis-5.0.7
$ make
```

#### 3. 安装

```sh
# PREFIX指定安装路径
make --PREFIX=/usr/local/redis install
```

### 3. 修改配置文件

可以在源码中复制一份配置文件出来。

**一般只需要修改下面这三个地方**

```sh
#设置密码
requirepass password
#开放远程访问
bind 0.0.0.0
# 后台运行
daemonize yes
```



### 4. 使用

```sh
# 启动
/usr/local/redis/bin/redis-server /usr/local/redis/redis.conf
# 停止 记得替换密码
/usr/local/redis/bin/redis-cli -a '{password}'  -h 127.0.0.1 -p 6379 shutdown
```



### 5. 添加systemd管理

编写`service`文件

```sh
vi /usr/lib/systemd/system/redisd.service
```

内容如下

```sh
[Unit]
Description=redis-server
Documentation=https://redis.io/
After=network.target

[Service]
Type=forking
ExecStart=/usr/local/redis/bin/redis-server /usr/local/redis/redis.conf
# 记得替换密码
ExecStop=/usr/local/redis/bin/redis-cli -a '{password}'  -h 127.0.0.1 -p 6379 shutdown
#Restart=always
#Restart=on-failure

[Install]
WantedBy=multi-user.target
```

重新加载并添加到自启动

```sh
systemctl daemon-reload
# 添加到开机自启动
systemctl enable redisd.service
systemctl start redisd.service
systemctl stop redisd.service
```

## 2. Docker一键安装

> 需要先安装docker和docker-compose

### 1. 目录结构

```sh
/redis
├── conf
│   └── redis.conf
├── data
└── docker-compose.yaml
```

### 2. docker-compose.yml

```yml
version: '3'
services:  
  redis:  
    hostname: redis
    image: redis
    container_name: redis
    restart: unless-stopped
    command: redis-server /etc/redis.conf # 启动redis命令
    environment:
      - TZ=Asia/Shanghai
      - LANG=en_US.UTF-8
    volumes:
      - /etc/localtime:/etc/localtime:ro # 设置容器时区与宿主机保持一致
      - ./data:/data
      - ./conf/redis.conf:/etc/redis.conf
    ports:
        - "6379:6379"
```

### 3. 配置文件

去官网上下载一份最新的配置文件 然后改一改就好了。

>  官网地址:`https://redis.io/topics/config `
>
>  wget https://raw.githubusercontent.com/redis/redis/6.0/redis.conf

**`daemonize yes`必须改成`daemonize no` **

> 不然容器启动不了

**`bind 127.0.0.1`改成`bind 0.0.0.0`或注释掉**

> 不然其他机器访问不了



### 4. 启动

```sh
#在docker-compose.yml文件所在目录执行才可以
# 启动 -d参数后台启动
docker-compose up -d
#停止
docker-compose down
```

问题

> Fatal error, can't open config file '/etc/redis.conf
>
> 出现该问题是应该配置文件目录权限问题 修改一下即可
>
> chmod 666 /conf -R