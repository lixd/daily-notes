# FAQ



> [官方文档](https://kubernetes.io/zh/docs/concepts/workloads/pods/pod-lifecycle/)



## Pod的终止过程

* 1）用户删除 Pod

* 2）Pod 进入 Terminating 状态;

* - 与此同时，k8s 会从对应的 service 上移除该 Pod 对应的endpoint
  - 与此同时，针对有 preStop hook 的容器，kubelet 会调用每个容器的 preStop hook，假如 preStop hook 的运行时间超出了 grace period（默认30秒），kubelet 会发送 SIGTERM 并再等 2 秒;
  - 与此同时，针对没有 preStop hook 的容器，kubelet 发送 SIGTERM

- 3）grace period 超出之后，kubelet 发送 SIGKILL 干掉尚未退出的容器

kubelet 向runtime发送信号，最终runtime会将信号发送给容器中的主进程。

> 所以在程序中监听该信号可以实现优雅关闭。

