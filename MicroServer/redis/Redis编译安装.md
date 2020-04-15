### 环境准备

由于 redis 是用 C 语言开发，安装之前必先确认是否安装 gcc 环境（gcc -v），如果没有安装，执行以下命令进行安装

```
$ yum install -y gcc
```

### 下载

```
$ wget http://download.redis.io/releases/redis-5.0.7.tar.gz
$ tar -zxvf redis-5.0.7.tar.gz
```

### 编译

```
$ cd redis-5.0.7
$ make
```

### 安装

指定安装目录

```
make install PREFIX=/usr/local/redis
```

### 修改配置文件

可以在源码中复制一份配置文件出来。

> cp /usr/local/redis/redis-5.0.7/redis.conf /usr/local/redis/redis.conf

1.设置密码

```
requirepass password
```

2.bind

```
bind 0.0.0.0
```

3.后台运行

```
daemonize yes
```

### 启动

```
/usr/local/redis/bin/redis-server /usr/local/redis/redis.conf
```

### 停止

```
/usr/local/redis/bin/redis-cli -a 'password'  -h 127.0.0.1 -p 6379 shutdown
```

### 添加自启动

编写service文件

```
vi /usr/lib/systemd/system/redisd.service
```

内容如下

```
[Unit]
Description=redis-server
Documentation=https://redis.io/
After=network.target

[Service]
Type=forking
ExecStart=/usr/local/redis/bin/redis-server /usr/local/redis/redis.conf
ExecStop=/usr/local/redis/bin/redis-cli -a 'p!iw6&eg'  -h 127.0.0.1 -p 6379 shutdown
#Restart=always
#Restart=on-failure

[Install]
WantedBy=multi-user.target
```

重新加载并添加到自启动

```
systemctl daemon-reload
# 添加到开机自启动
systemctl enable redisd.service
systemctl start redisd.service
systemctl stop redisd.service
```

