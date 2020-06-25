# Docker主要执行流程

## Docker Stop主要流程

* 1.Docker 通过containerd向容器主进程发送SIGTERM信号后等待一段时间后，如果从containerd收到了容器退出消息那么容器退出成功。
* 2.在上一步中，如果等待超时，那么Docker将使用Docker kill 方式试图终止容器



## Docker Kill主要流程

* 1.Docker引擎通过containerd使用SIGKILL发向容器主进程，等待一段时间后，如果从containerd收到容器退出消息，那么容器Kill成功
* 2.在上一步中如果等待超时，Docker引擎将跳过Containerd自己亲自动手通过kill系统调用向容器主进程发送SIGKILL信号。如果此时kill系统调用返回主进程不存在，那么Docker kill成功。否则引擎将一直死等到containerd通过引擎，容器退出。



## Docker stop中存在的问题

在上文中我们看到Docker stop首先间接向容器主进程发送sigterm信号试图通知容器主进程优雅退出。**但是容器主进程如果没有显示处理sigterm信号的话，那么容器主进程对此过程会不会有任何反应，此信号被忽略了** 这里和常规认识不同，在常规想法中任何进程的默认sigterm处理应该是退出。**但是namespace中pid==1的进程，sigterm默认动作是忽略。也即是容器首进程如果不处理sigterm，那么此信号默认会被忽略，**这就是很多时候Docker Stop不能立即优雅关闭容器的原因——因为容器主进程根本没有处理SIGTERM

> 特别指出linux上全局范围内pid=1的进程，不能被sigterm、sigkill、sigint终止
> 进程组首进程退出后，子进程收到sighub



## 在docker pidnamespace共享特性下容器对信号的响应

在k8s的pod下常见的场景，pause容器和其他容器共享pid namespace（pause容器pidnamespace共享给相同pod下其他容器使用）。

pause容器退出后，其他容器也会退出（pause容器如果收到SIGTERM并退出了，那么其他容器也会退出）；

直接给其他容器发送SIGTERM信号，pause容器不会收到SIGTERM。



# 总结

- 容器主进程最好需要自己处理SIGTERM信号，因为这是你优雅退出的机会。如果你不处理，那么在Docker stop里你会收到Kill，你未保存的数据就会直接丢失掉。
- Docker stop和Docker kill返回并不意味着容器真正退出成功了，必须通过docker ps查看。
- 对于通过restful与docker 引擎链接的客户端，需要在docker stop和kill restful请求链接上加上超时。对于docker cli用户，需要有另外的机制监控Docker stop或Docker kill命令超时卡死
- 处于D状态卡死的进程，内核无法杀死，docker系统也救不了它。只有重启系统才能清除。

