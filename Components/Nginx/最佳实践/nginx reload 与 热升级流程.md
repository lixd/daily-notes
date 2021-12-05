## 1. reload 重载配置文件真相

**具体流程**

* 1）向 Master 进程发送 HUP 信号（reload 命令）
* 2）Master 进程校验配置文件语法是否正确
* 3）Master 进程打开新的监听端口（如果配置文件中新增了监听端口的话）
* 4）Master 进程用新的配置启动新的 Worker 子进程
* 5）Master 进程向老的 Worker 进程发送 QUIT 信号（quit 优雅退出）
* 6）老的 Worker 进程关闭监听句柄，处理完当前连接后结束进程

Nginx 为了保证平滑，所以必须先启动新的 Worker 进程，然后优雅关闭老的 Worker 进程。





**可能会出现的问题**: 新 Worker 进程启动后，新的请求都由新 Worker 来处理了，但是如果旧的请求一直处理不完，旧 Worker 就会一直存在。

于是 Nginx 新版本提供了配置项，可以指定新 Worker 启动后老 Worker 最长还运行多久，时间到了会直接结束旧 Worker。



## 2. 热升级流程

通过热升级，可以再不停机的情况下更新 Nginx。

**具体流程**

* 1）将旧 Nginx 文件换成新 Nginx 文件（注意备份）（`cp -f`才能覆盖正在使用中的文件）
* 2）向 Master 进程发送 `USR2 `信号（kill pid -USR2）
* 3）Master 进程修改 PID 文件名，增加后缀 `.oldbin`
* 4）Master 进程用新的 Nginx 文件启动新的 Master 进程
  * 此时也会生成 pid 文件，所以上一步先给老的pid文件增加了后缀
* 5）向老 Master 进程发送 WINCH 信号，关闭老 Worker 进程（pid 存在 .oldbin文件中 或者通过 ps 查看）
* 6）验证新版本是否正常
  * 验证没问题后，向旧Master进程发送QUIT信号，旧Master退出
  * 回滚情形：向旧master发送HUP，拉起新的 worker ,向新的master发送QUIT，让新 master 和 worker 一起退出



