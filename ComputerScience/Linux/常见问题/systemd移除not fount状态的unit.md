## systemd移除not fount状态的unit



1）首先需要创建一个和该服务名字一样的服务

2）systemctl daemon-reload

3）停止该服务 systemctl stop serverName

4）systemctl reset-failed

5）最后移除 server 文件