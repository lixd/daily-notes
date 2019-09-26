# Systemd

## 1. 概述

Systemd它的设计目标是，`为系统的启动和管理提供一套完整的解决方案`。

根据 Linux 惯例，字母`d`是守护进程（daemon）的缩写。 Systemd 这个名字的含义，就是它要守护整个系统。

## 2. 常用命令

unit文件路径`/usr/lib/systemd/system`

每一个 Unit 都有一个配置文件，告诉 Systemd 怎么启动这个 Unit 。

Systemd 默认从目录`/etc/systemd/system/`读取配置文件。但是，里面存放的大部分文件都是符号链接，指向目录`/usr/lib/systemd/system/`，真正的配置文件存放在那个目录。

`systemctl enable`命令用于在上面两个目录之间，建立符号链接关系。

```sh
$ sudo systemctl enable clamd@scan.service
# 等同于
$ sudo ln -s '/usr/lib/systemd/system/clamd@scan.service' '/etc/systemd/system/multi-user.target.wants/clamd@scan.service'
```

如果配置文件里面设置了开机启动，`systemctl enable`命令相当于激活开机启动。

与之对应的，`systemctl disable`命令用于在两个目录之间，撤销符号链接关系，相当于撤销开机启动。

> ```bash
> $ sudo systemctl disable clamd@scan.service
> ```

配置文件的后缀名，就是该 Unit 的种类，比如`sshd.socket`。如果省略，Systemd 默认后缀名为`.service`，所以`sshd`会被理解成`sshd.service`。

### 基本命令

```go
// 运行 停止 查看状态
systemctl start xxx.service
systemctl stop xxx.service
systemctl status xxx.service

//杀死一个服务的所有子进程
systemctl kill xxx.service
//重新加载一个服务的配置文件
systemctl reload xxx.service
//重载所有修改过的配置文件
systemctl daemon-reload

systemctl reset-failed
//列出正在运行的 Unit
systemctl list-units 
```



### 其他命令

```sh


# 列出所有Unit，包括没有找到配置文件的或者启动失败的
$ systemctl list-units --all

# 列出所有没有运行的 Unit
$ systemctl list-units --all --state=inactive

# 列出所有加载失败的 Unit
$ systemctl list-units --failed

# 列出所有正在运行的、类型为 service 的 Unit
$ systemctl list-units --type=service


# 立即启动一个服务
$ sudo systemctl start apache.service

# 立即停止一个服务
$ sudo systemctl stop apache.service

# 重启一个服务
$ sudo systemctl restart apache.service

# 杀死一个服务的所有子进程
$ sudo systemctl kill apache.service

# 重新加载一个服务的配置文件
$ sudo systemctl reload apache.service

# 重载所有修改过的配置文件
$ sudo systemctl daemon-reload

# 显示某个 Unit 的所有底层参数
$ systemctl show httpd.service

# 显示某个 Unit 的指定属性的值
$ systemctl show -p CPUShares httpd.service

# 设置某个 Unit 的指定属性
$ sudo systemctl set-property httpd.service CPUShares=500

# 查看配置文件详情
$ systemctl cat atd.service
```



## 3. 编写unit文件

第一步：准备一个shell脚本

```sh
vim /root/name.sh
```

     #!/bin/bash
            echo `hostname`>/tmp/name.log
第二步：创建unit文件     

 ```sh
  # vim my.service
 ```

```sh
[Unit]
        Description=this is my first unit file

        [Service]
        Type=oneshot
        ExecStart=/bin/bash /root/name.sh

        [Install]
        WantedBy=multi-user.target
```

​     

```sh
 # mv my.service /usr/lib/systemd/system
```

第三步：将我的unit文件注册到systemd中

```sh
   # systemctl enable my.service
```

第四步：查看该服务的状态

```sh
    # systemctl status my.service
```



[Unit]区块通常是配置文件的第一个区块，用来定义Unit的元数据，以及配置与其他Unit的关系,它的主要字段如下：

```
Description：简单描述
Documentation：服务的启动文件和配置文件
Requires：当前Unit依赖的其他Unit，如果它们没有运行，当前Unit会启动失败
Wants：与当前Unit配合的其他Unit，如果它们没有运行，不影响当前Unit的启动
BindsTo：与Requires类似，它指定的Unit如果退出，会导致当前Unit停止运行
Before：如果该字段指定的Unit也要启动，那么必须在当前Unit之后启动
After：如果该字段指定的Unit也要启动，那么必须在当前Unit之前启动
Conflicts：这里指定的Unit不能与当前Unit同时运行
Condition...：当前Unit运行必须满足的条件，否则不会运行
Assert...：当前Unit运行必须满足的条件，否则会报启动失败
```

[Service]区块配置，只有Service类型的Unit才有这个区块，它的主要字段如下：

```
Type：定义启动时的进程行为，它有以下几种值。
Type=simple：默认值，执行ExecStart指定的命令，启动主进程
Type=forking：以fork方式从父进程创建子进程，之后父进程会退出，子进程成为主进程
Type=oneshot：一次性进程，Systemd会等当前服务退出，再继续往下执行
Type=dbus：当前服务通过D-Bus启动
Type=notify：当前服务启动完毕，会通知Systemd，再继续往下执行
Type=idle：若有其他任务，则其他任务执行完毕，当前服务才会运行
ExecStart：启动当前服务的命令
ExecStartPre：启动当前服务之前执行的命令
ExecStartPost：启动当前服务之后执行的命令
ExecReload：重启当前服务时执行的命令
ExecStop：停止当前服务时执行的命令
ExecStopPost：停止当其服务之后执行的命令
RestartSec：自动重启当前服务间隔的秒数
Restart：定义何种情况Systemd会自动重启当前服务，可能的值包括always（总是重启）、on-success、on-failure、on-abnormal、on-abort、on-watchdog
TimeoutSec：定义Systemd停止当前服务之前等待的秒数
Environment：指定环境变量
```

[Install]通常是配置文件的最后一个区块，用来定义运行模式（Target）、Unit别名等设置，以及是否开机启动，它的主要字段如下：

```
WantedBy：它的值是一个或多个Target，当前Unit激活时（enable）时，符号链接会放入/etc/systemd/system目录下面以Target名+.wants后缀构成的子目录中
RequiredBy：它的值是一个或多个Target，当前Unit激活时，符号链接会放入/etc/systemd/system目录下面以Target名+.required后缀构成的子目录中
Alias：当前Unit可用于启动的别名
Also：当前Unit激活（enable）时，会被同时激活的其他Unit
```



## 4. 问题

服务启动后找不到配置文件，项目中配置文件写的相对路径时找不到，只能写成绝对路径。

解决办法：在[Service]区块添加`WorkingDirectory=xxx`即可指定项目路径

```sh
#配置文件位置 /usr/local/projects/hello/conf/config.json
hellod.service中添加WorkingDirectory

[Service]
WorkingDirectory=/usr/local/projects/hello

#项目中指定配置文件路径 /conf/config.json 这样即可
```



## 5. 参考

`https://www.freedesktop.org/software/systemd/man/systemd.exec.html`

`http://www.ruanyifeng.com/blog/2016/03/systemd-tutorial-commands.html`