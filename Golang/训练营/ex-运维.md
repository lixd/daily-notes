

## 运维相关

## 一图流

![](assets/ex/linux_observability_tools.png)





### 1. 常见命令

### top

如果 sys 高 usr 低有两种情况：

* 1）应用程序优化到了极致，所以 usr 占用低，剩下的系统调用无法优化导致 sys 高
* 2）应用程序基本没有优化，大量的系统调用导致 sys 很高

wa iowait,IO导致CPU等待的世界

si 软中断，网卡接收到网络包之后会发起软中断，然后CPU去处理网络包，一般网络程序都会导致 si 比较高。

问题：如果将 si 均衡到多CPU，如果某个CPU的si 都100%了，肯定会导致性能严重下降，需要优化使得程序能利用多个CPU。

* 1）RPS： 简单来讲，RPS就是让网卡使用多核CPU的，是在系统层实现了分发和均衡。
* 2）网卡多队列：传统方法就是网卡多队列（RSS，需要硬件和驱动支持）



### nmon

nmon 推荐使用这个工具来监控。

按 k 查看 内核信息

Context：上下文切换，如果很高要么是 syscall 很多，要么是启了很多线程

Interrupts：中断

按 n 查看网络信息

主要关注 packin 和 packout





### nload

用于监控 网卡实时流量，非常方便。



基本语法是：

```
nload
nload device
nload [options] device1 device2
```



```
$ nload
$ nload eth0
$ nload em0 em2
```

nload 命令一旦执行就会开始监控网络设备，你可以使用下列快捷键操控 nload 应用程序。

1. 你可以按键盘上的 ← → 或者 Enter/Tab 键在设备间切换。
2. 按 F2 显示选项窗口。
3. 按 F5 将当前设置保存到用户配置文件。
4. 按 F6 从配置文件重新加载设置。
5. 按 q 或者 Ctrl+C 退出 nload。



### tcpflow

抓包工具，可以解析出一部分到终端，非常方便。

tcpdump 如果带 body 需要抓包后放在 wireshark 里分析，比较麻烦。

```sh
# 监听http
tcpflow -e http
```



### 查看网络问题

* 1） ifconfig 查看 有没有 errors 包
* 2）dmesg -T 查看错误信息
* 3）直接查看 /var/log/messages 文件看有没有报错信息
* 4）netstat -s 查看有没有 TCP 重传包
* 5）ss -s 查看连接数量





## 2.小结

命令汇总

* iostat：关注 r/s w/s %util
  * iostst -x 1
* iotop：直接明了的找出 io 被那个进程吃掉的
* lsof -p $pid 查看进程打开的文件数
* strace -p $pid 追踪某个进程的系统调用
* perf ：查询性能瓶颈的利器
* free：查看内存
  * buff/cache：buff 给写操作的，cache 是给读操作的
* ethtool -i eth0：查看网卡信息



