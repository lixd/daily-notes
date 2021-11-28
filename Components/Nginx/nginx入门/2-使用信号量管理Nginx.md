## 信号量管理 Nginx

可以通过发送信号量的方式来管理 Nginx。Nginx 的 Master 和 Worker 都可以接收信号量，但是不建议直接发给 Worker，只推荐发送信号量给 Master，然后由 Master 来管理 Worker。

> 一般 Worker 数都是和 CPU 数一致，即一个CPU绑定一个 Worker，以降低 CPU 切换带来的性能影响。

### Master



* 监控 Worker 进程
  * CHLD
* 管理 worker 进程
* 接收信号
  * TERM、INT
  * QUIT
  * HUP
  * USR1
  * USR2
  * WINCH



### Worker



* 接收信号
  * TERM、INT
  * QUIT
  * USR1
  * WINCH





### 命令行

命令行执行的命令其实也是发送了相应了信号量给 Mster。

* reload
  * HUP
* reopen
  * USR1
* stop
  * TERM
* quit
  * QUIT







**reload 重载配置文件流程**

* 1）向master进程发送HUP信号(reload命令)
* 2）master进程检查配置语法是否正确
* 3）master进程打开监听端口
  * 这一步只有在配置文件中修改或者增加了监听端口时才会有
* 4）master进程使用新的配置文件启动新的worker子进程
  * 此时新旧worker进程共存，同时处理用户请求
* 5）master进程向老的worker子进程发送QUIT信号
* 6）旧的worker进程关闭监听句柄,处理完当前连接后关闭进程

整个过程Nginx始终处于平稳运行中,实现了平滑升级,用户无感知。



**Nginx 热升级流程**

* 1）将旧的nginx文件替换成新的nginx文件

  * 注意先备份一下旧的nginx文件
  * 其他文件保持不变

* 2）向 master 进程发送 USR2 信号

* 3）master进程修改pid文件,加后缀.oldbin

  * 将旧的 pid 文件改名，给新的 nginx 让路

* 4）master进程用新nginx文件启动新master进程

  * 此时新旧master进程共存，同时处理用户请求

* 5）向旧的master进程发送WINCH信号,旧的worker子进程退出

* 6）验证新版本是否正常

  * 验证没问题后，向旧master进程发送QUIT信号，旧master退出
  * 回滚情形：向旧master发送HUP，拉起新的 worker ,向新的master发送QUIT，让新 master 和 worker 一起退出

  

  





## 







