# Supervisor

## 概述

[Supervisor](http://supervisord.org/)在百度百科上给的定义是超级用户，监管员。Supervisor是一个进程管理工具，当进程中断的时候Supervisor能自动重新启动它。可以运行在各种类unix的机器上，supervisor就是用Python开发的一套通用的进程管理程序，能将一个普通的命令行进程变为后台daemon，并监控进程状态，异常退出时能自动重启。

* supervisord

运行 Supervisor 时会启动一个进程 supervisord，它负责启动所管理的进程，并将所管理的进程作为自己的子进程来启动，而且可以在所管理的进程出现崩溃时自动重启。

* supervisorctl

是命令行管理工具，可以用来执行 stop、start、restart 等命令，来对这些子进程进行管理。

supervisor是所有进程的父进程，管理着启动的子进展，supervisor以子进程的PID来管理子进程，当子进程异常退出时supervisor可以收到相应的信号量。

## 安装

Supervisor 有多种安装方式，我推荐其中最简单也是最容易安装的一种

```
apt-get -y install python-setuptools
easy_install supervisor
```

正如你所见，两条命令即完成安装

# 配置

Supervisor安装完成后，运行 `echo_supervisord_conf`。这将打印一个示例的Supervisor配置文件到您的终端。只要你能看到打印的配置文件内容。

Supervisor 不会自动生成配置文件。

请使用命令 `echo_supervisord_conf > /etc/supervisord.conf `来生成配置文件。

## 部分配置文件信息表

| 名称                       | 注释                 | 栗子                               |
| :------------------------- | :------------------- | :--------------------------------- |
| inet_http_server[port]     | 内置管理后台         | *:8888                             |
| inet_http_server[username] | 管理后台用户名       | admin                              |
| inet_http_server[password] | 管理后台密码         | admin                              |
| include[files]             | 设置进程配置文件格式 | /etc/supervisor/supervisor.d/*.ini |

# 运行

Supervisor 启动需加载配置文件

```
supervisord -c /etc/supervisor/supervisord.conf
```

停止命令是

```
supervisorctl shutdown
```

重新加载配置文件

```
supervisorctl reload
```

Supervisor 以 `[program:[your_cli_name]] `以每段进程配置文件的开头，your_cli_name 则是你的进程名称，名称会显示在Supervisor后台管理工具和Supervisor cli命令输出上。我们以运行php-fpm为例

```
[program:php7]
command=php-fpm
```

哦呦，就是酱紫简单。没有过多的废话。或者运行一段shell。

```
[program:echo]
command=sh echo.sh

--------------------------------

echo.sh

your_name="my name zhangsan" 
echo $your_name
```

当然laravel队列也是依旧简单

```
[program:laravel-worker]
command=php /home/forge/app.com/artisan queue:work sqs --sleep=3 --tries=3
```

当然这里只是简单的演示，让你可以快速上手，配置脚本内不仅仅只有command命令。
具体可见官方文档 [http://www.supervisord.org/co...](http://www.supervisord.org/configuration.html#program-x-section-settings)



## 参考

`https://segmentfault.com/a/1190000016395467`