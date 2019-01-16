# Linux安装MySQL

本章主要讲了如何通过解压方式在Linux下安装MySQL.

`#`为Linux命令

`mysql`则是mysql下的命令

<!-- more-->

> 点击阅读更多Linux入门系列文章[我的个人博客-->幻境云图](https://www.lixueduan.com/categories/Linux/)

软件统一放在`/usr/software`下 解压后放在单独的文件夹下`/usr/local/java`/`/usr/local/mysql`

安装包下载`mysql-5.7.24-linux-glibc2.12-x86_64.tar`

网址`https://dev.mysql.com/downloads/mysql/5.7.html#downloads`

![mysql](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/software-install/mysql5.7-down.png)

## 1. 安装依赖

  ```xml
# yum install -y cmake make gcc gcc-c++ libaio ncurses ncurses-devel
  ```

## 2. 解压文件

压缩包上传到虚拟机`/usr/software目录下`,进入这个目录

解压文件

```xml
# tar zxvf mysql-5.7.24-linux-glibc2.12-x86_64.tar.gz
```

将解压后的文件移动到`/usr/local/mysql`

```xml
# mv mysql-5.7.24-linux-glibc2.12-x86_64 /usr/local/mysql
```

## 3. 添加用户和赋权

1.添加用户和用户组

给mysql赋权的用户必须对当前目录具有读写权限，但是一般不用root账户，所以创建一个用户mysql。

执行命令：创建用户组mysql`groupadd mysql``

创建用户也叫mysql 

```xml
// 命令中第一个mysql是用户，第二个mysql是用户组。
# useradd -r -g mysql mysql 
```

2.给用户赋权限

 一定保证当前是在`/usr/local/mysql` 目录下

给用户组赋权限

```xml
//mysql是用户组名
# chgrp -R mysql.
```

给用户赋权限  

```xml
//这个mysql是用户名
#  chown -R mysql. 
```

## 4. 数据库初始化

安装数据库 : 

```xml
// 这里会生成临时密码，后边有用
# bin/mysqld --initialize --user=mysql --basedir=/usr/local/mysql --datadir=/usr/local/mysql/data
```

执行以下命令创建RSA private key ：

```xml
# bin/mysql_ssl_rsa_setup --datadir=/usr/local/mysql/data
```

## 5. 配置my.cnf

```xml
# vim /etc/my.cnf
```

 内容如下：

```java
[mysqld]
character_set_server=utf8
init_connect='SET NAMES utf8'
basedir=/usr/local/mysql
datadir=/usr/local/mysql/data
socket=/tmp/mysql.sock
#不区分大小写 (sql_mode=NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES 这个简单来说就是sql语句是否严格)
lower_case_table_names = 1
log-error=/var/log/mysqld.log
pid-file=/usr/local/mysql/data/mysqld.pid   
```



```xml
# cp /usr/local/mysql/support-files/mysql.server  /etc/init.d/mysqld
# vim /etc/init.d/mysqld
```

添加以下内容，在46行

```java
 basedir=/usr/local/mysql
 datadir=/usr/local/mysql/data
```

## 6. 修改密码

启动mysql   

```xml
# service mysqld start
```

 加入开机起动    

```xml
# chkconfig --add mysqld
```

登录修改密码 

```xml
# mysql -uroot -p 上面初始化时的密码
```

如果出现错误 需要添加软连接 

```xml
 # ln -s /usr/local/mysql/bin/mysql /usr/bin
```

如果出现`Access denied for user 'root'@'localhost' (using password: YES)`应该是密码错了，直接强行修改密码好了。先停掉mysql. 

```xml
# service mysql stop
```

然后修改配置文件 

```
# vim /etc/my.cnf
```

在[mysqld]后面任意一行添加`skip-grant-tables`用来跳过密码验证的过程

接下来我们需要重启MySQL 

 ```xml
# /etc/init.d/mysqld restart
 ```

重启之后输入命令`mysql`即可进入mysql了，然后开始修改密码。

```mysql
mysql> use mysql;
# 这里修改密码的命令在5.7以上和5.7以下是不同的 需要注意
mysql> update user set authentication_string=passworD("你的密码") where user='root';
flush privileges;
mysql> quit
```

完成后可以把配置文件中的跳过密码验证去掉。

然后就可以正常使用啦。

## 7. 外部访问

首先进入mysql，

```xml
# mysql -u root -p
```

接着创建远程连接 MySQL 的用户 mysql命令

```mysql
-- 创建用户、密码及权限范围 第一个 roo t为用户名 @后为适用的主机，‘%’表示所有电脑都可以访问连接，第二个 root 为密码
mysql> GRANT ALL PRIVILEGES ON *.* TO 'root'@'192.168.1.3' IDENTIFIED BY 'root' WITH GRANT OPTION;  
-- 立即生效
mysql> flush privileges;
```

查看数据库用户：

```mysql
-- 使用 mysql 库
mysql> use mysql;
-- 查看用户
mysql> SELECT DISTINCT CONCAT('User: [', user, '''@''', host, '];') AS USER_HOST FROM user;  
-- 查看端口
mysql> show global variables like 'port';
--mysql 默认端口为3306
```

解决防火墙问题

防火墙默认只开放了22端口，要访问数据库要么关掉防火墙要么修改配置文件，开放3306端口

修改防火墙配置： 命令

```xml
# vim /etc/sysconfig/iptables
```

添加以下内容

```xml
-A INPUT -m state --state NEW -m tcp -p tcp --dport 3306 -j ACCEPT
```

然后重启防火墙

```
# service iptables restart
```

最后查看服务器IP

```xml
# ip a
```

到这里应该就可以通过IP和端口号远程连接服务器上的MySQL了。

## 8. 问题

mysql中执行命令出现以下错误：

```error
ERROR 1820 (HY000): You must reset your password using ALTER USER statement before executing this statement.
```

解决： 修改用户密码

```mysql
mysql> alter user 'root'@'localhost' identified by '你的密码'; 
```

## 参考

`https://blog.csdn.net/z13615480737/article/details/80019881`

`https://www.cnblogs.com/goodcheap/p/7103049.html`