# Linux安装MySQL

本章主要讲了如何通过解压方式在Linux下安装MySQL.

<!-- more-->

> 点击阅读更多Linux入门系列文章[我的个人博客-->幻境云图](https://www.lixueduan.com/categories/Linux/)

软件统一放在`/usr/software`下 解压后放在单独的文件夹下`/usr/local/java`/`/usr/local/mysql`

安装包下载`mysql-5.7.24-linux-glibc2.12-x86_64.tar`

网址`https://dev.mysql.com/downloads/mysql/5.7.html#downloads`

![mysql](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/software-install/mysql5.7-down.png)

## 1. 安装依赖

  `yum install -y cmake make gcc gcc-c++ libaio ncurses ncurses-devel`

## 2. 解压文件

1.压缩包上传到虚拟机`/usr/software目录下`

2.解压文件 `tar zxvf mysql-5.7.24-linux-glibc2.12-x86_64.tar.gz  `

3.将解压后的文件移动到`/usr/local/mysql`,命令`mv mysql-5.7.24-linux-glibc2.12-x86_64 /usr/local/mysql`

## 3. 添加用户和赋权

1.添加用户和用户组

给mysql赋权的用户必须对当前目录具有读写权限，但是一般不用root账户，所以创建一个用户mysql。

执行命令：创建用户组mysql`groupadd mysql``

创建用户也叫mysql ``useradd -r -g mysql mysql`  命令中第一个mysql是用户，第二个mysql是用户组。

2.给用户赋权限

 一定保证当前是在`/usr/local/mysql` 目录下

给用户组赋权限 命令：`chgrp -R mysql.`  mysql是用户组名

给用户赋权限 命令：`chown -R mysql.   ` 这个mysql是用户名

## 4. 数据库初始化

安装数据库 : `bin/mysqld --initialize --user=mysql --basedir=/usr/local/mysql --datadir=/usr/local/mysql/data`  这里会生成临时密码，后边有用

执行以下命令创建RSA private key ：`bin/mysql_ssl_rsa_setup --datadir=/usr/local/mysql/data`

## 5. 配置my.cnf

`vim /etc/my.cnf` 内容如下：

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

命令:

`cp /usr/local/mysql/support-files/mysql.server  /etc/init.d/mysqld`

`vim /etc/init.d/mysqld`

添加以下内容，在46行

```java
 basedir=/usr/local/mysql
 datadir=/usr/local/mysql/data
```

## 6. 修改密码

启动mysql   

`service mysqld start`

 加入开机起动    

`chkconfig --add mysqld`

登录修改密码 

mysql -uroot -p 上面初始化时的密码

>  如果出现错误 需要添加软连接  ln -s /usr/local/mysql/bin/mysql /usr/bin

>  如果出现`Access denied for user 'root'@'localhost' (using password: YES)`应该是密码错了，直接强行修改密码好了。先停掉mysql. `service mysql stop`

然后修改配置文件 命令：`vim /etc/my.cnf` 

在[mysqld]后面任意一行添加`skip-grant-tables`用来跳过密码验证的过程

接下来我们需要重启MySQL 命令 `/etc/init.d/mysqld restart`

重启之后输入命令`mysql`即可进入mysql了，然后开始修改密码。

```mysql
use mysql;
# 这里修改密码的命令在5.7以上和5.7以下是不同的 需要注意
update user set authentication_string=passworD("你的密码") where user='root';
flush privileges;
quit
```

完成后可以把配置文件中的跳过密码验证去掉。

然后就可以正常使用啦。

## 参考

`https://blog.csdn.net/z13615480737/article/details/80019881`