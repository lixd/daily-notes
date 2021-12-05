# Nginx 日志切割

## 1. 概述

Nginx日志都会存在一个文件里，随着时间推移，这个日志文件会变得非常大，分析的时候很难操作，所以需要对日志文件进行分割，可以根据访问量来进行选择：如按照天分割、或者半天、小时等。

大致流程如下：

* 具体日志在 logs目录下的 xxx.log
* 在logs目录下先拷贝一份放在另一个位置 mv xxx.log bak.log
* 接着执行 nginx -s reopen
* nginx 就会重新生成一个xxx.log ，原先log备份成bak.log，这样我们就实现了日志切割

建议使用shell脚本方式进行切割日志 。



## 2. 脚本

### 1. 编写脚本

脚本如下：

```shell
#!/bin/sh
#根路径
BASE_DIR=/usr/local/nginx
#最开始的日志文件名
BASE_FILE_NAME_ACCESS=access.log
BASE_FILE_NAME_ERROR=error.log
BASE_FILE_NAME_PID=nginx.pid
#默认日志存放路径
DEFAULT_PATH=$BASE_DIR/logs
#日志备份根路径
BASE_BAK_PATH=$BASE_DIR/datalogs

BAK_PATH_ACCESS=$BASE_BAK_PATH/access
BAK_PATH_ERROR=$BASE_BAK_PATH/error

#默认日志文件路径+文件名
DEFAULT_FILE_ACCESS=$DEFAULT_PATH/$BASE_FILE_NAME_ACCESS
DEFAULT_FILE_ERROR=$DEFAULT_PATH/$BASE_FILE_NAME_ERROR
#备份时间
BAK_TIME=`/bin/date -d yesterday +%Y%m%d%H%M`
#备份文件 路径+文件名
BAK_FILE_ACCESS=$BAK_PATH_ACCESS/$BAK_TIME-$BASE_FILE_NAME_ACCESS
BAK_FILE_ERROR=$BAK_PATH_ERROR/$BAK_TIME-$BASE_FILE_NAME_ERROR
        
# 打印一下备份文件 
echo access.log备份成功：$BAK_FILE_ACCESS
echo error.log备份成功：$BAK_FILE_ERROR

#移动文件
mv $DEFAULT_FILE_ACCESS $BAK_FILE_ACCESS
mv $DEFAULT_FILE_ERROR $BAK_FILE_ERROR

#向nginx主进程发信号重新打开日志
kill -USR1 `cat $DEFAULT_PATH/$BASE_FILE_NAME_PID`

```

 其实很简单，主要步骤如下：

* 1.移动日志文件：这里已经将日志文件移动到``datalogs`目录下了，但Nginx还是会继续往这里面写日志
* 2.发送`USR1`命令：告诉Nginx把日志写到``Nginx.conf`中配置的那个文件中，这里会重新生成日志文件

具体如下：

* **第一步**:就是重命名日志文件，不用担心重命名后nginx找不到日志文件而丢失日志。在你未重新打开原名字的日志文件前(即执行第二步之前)，nginx还是会向你重命名的文件写日志，Linux是靠`文件描述符`而不是`文件名`定位文件。
* **第二步**:向nginx主进程发送`USR1信号`。nginx主进程接到信号后会从配置文件中读取日志文件名称，重新打开日志文件(以配置文件中的日志名称命名)，并以工作进程的用户作为日志文件的所有者。重新打开日志文后，nginx主进程会关闭重名的日志文件并通知工作进程使用新打开的日志文件。(就不会继续写到前面备份的那个文件中了)工作进程立刻打开新的日志文件并关闭重名名的日志文件。然后你就可以处理旧的日志文件了。



### 2. 测试

```nginx
[root@localhost sbin]# sh log.sh
```

此时手动运行该脚本即可进行日志切割，但是手动太麻烦了，建议添加一个定时任务自动执行。



### 3. 定时任务

设置一个定时任务用于周期性的执行该脚本

`cron`是一个linux下的定时执行工具，可以在无需人工干预的情况下运行作业。

```shell
service crond start   //启动服务

service crond stop    //关闭服务

service crond restart  //重启服务

service crond reload  //重新载入配置

service crond status  //查看服务状态 
```

**设置定时任务**：

```nginx
[root@localhost datalogs]# crontab -e

*/1 * * * * sh /usr/local/nginx/sbin/log.sh
```

`*/1 * * * *`： 为定时时间 这里为了测试 是设置的每分钟执行一次；

`0 2 * * * ` :每天凌晨两点执行



`sh /usr/local/nginx/sbin/log.sh` ：执行 shell 脚本。