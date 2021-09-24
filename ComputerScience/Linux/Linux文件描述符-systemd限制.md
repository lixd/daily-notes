# systemd 最大文件句柄限制

由于修改了 ulimit 之后发生进程最大能打开的句柄数还是被限制在了 `1024`个，感觉很迷惑，由于是通过 systemd 启动的进程，想着是不是和这个有关系，果然搜索了一下发现 systemd 也有自己的限制。

查看进程打开的文件句柄数

```sh
lsof -n|awk '{print $2}'|sort|uniq -c|sort -nr|more
```

lsof 不是很准确，会有重复计数，精确值可以去进程对应文件夹中看：

```sh
ls /proc/$pid/fd/ |wc -l
```





**需要修改systemd的配置文件**



# 修改systemd的配置文件

`/etc/systemd/system.conf` 找到对应的配置项目，进行修改

```sh
vim /etc/systemd/system.conf

DefaultLimitNOFILE=10240000 # 修改文件句柄的限制
DefaultLimitNPROC=10240000 # 修改进程树的限制
```



# 重载配置文件

重启可以生效配置文件，但是服务器一般不能随便重启，systemd通过的重载配置的命令，不需要重启服务器，重载之后，重启一下服务即可。

重载systemd管理配置命令：

```sh
systemctl daemon-reexec
```



也可以修改单个 service 的限制

```sh
[Unit]
# ...
[Service]
LimitNOFILE=40960 # 修改文件句柄的限制
LimitNPROC=40960 # 修改进程树的限制
# ...
[Install]
# ...
```

修改单个service文件后，直接重载一下配置文件即可

```sh
systemctl daemon-reload
```

