# RabbitMQ

## 1. Erlang安装

### 1.1 下载

安装RabbitMQ之前需要先安装Erlang.

下载地址：`http://www.erlang.org/downloads`

文件`otp_src_21.2.tar.gz`

### 1.2 解压

将压缩包上传到虚拟机中，我是放在/usr/software目录下的

`# tar xvf otp_src_21.2.tar.gz`  解压文件

创建erlang安装目录： /usr/local/opt/erlang

`# cp -r otp_src_21.2 /usr/local/opt/erlang/`将文件复制进去

### 1.3 编译

进入到/usr/local/opt/erlang目录下

配置安装路径编译代码：`# ./configure --prefix=/usr/local/opt/erlang`

`# make && make install` 执行编译

### 1.4 环境变量配置

配置Erlang环境变量,`# vi /etc/profile` 添加以下内容

```xml
export PATH=$PATH:/usr/local/opt/erlang/bin
```

 `# source/etc/profile `使得文件生效

验证erlang是否安装成功：erl

退出erl:halt();



## 2. RabbitMQ安装

### 2.1 下载 

地址：`http://www.rabbitmq.com/releases/rabbitmq-server`

文件：`rabbitmq-server-generic-unix-3.6.15.tar.xz`



### 2.2 解压

文件是xz格式的，解压后得到tar格式文件。

`# xz -d rabbitmq-server-generic-unix-3.6.15.tar.xz`

`# tar -xvf rabbitmq-server-generic-unix-3.6.15.tar`

### 2.3 环境变量配置

添加环境变量：export PATH=$PATH:/opt/rabbitmq/sbin

环境变量生效：source  /etc/profile

### 2.4 使用

进入sbin 启动服务：./rabbitmq-server -detached

查看服务状态：./rabbitmqctl status

关闭服务：./rabbitmqctl stop 

