# Kata

[kata 官方文档](https://katacontainers.io/docs/)

Why

**弥补了传统容器技术安全性的缺点**

What

kata-container 和 runC 平级，是一个 OCI。



 kata-runtime，精简过后的 containerd-shim-kata-v2 用于创建 VM，每个Pod单独一个VM，使用单独的Kernel，实现隔离。



组件：

Agent：

‘’在虚拟机内`kata-agent`作为一个daemon进程运行，并拉起容器的进程。

Kata-proxy：

`kata-proxy`提供了 `kata-shim` 和 `kata-runtime` 与VM中的`kata-agent`通信的方式，其中通信方式是使用`virtio-serial`或`vsock`，默认是使用`virtio-serial`。

> 删除不必要的间接层，社区已经去掉了 kata-proxy 组件，并在 KubernetesSIG-Node 开发者和 containerd 社区的帮助下引入了 shim-v2，从而减少了 Kata Containers 辅助进程的数量；





“面向云原生的虚拟化”，与面向虚拟机领域不同，容器领域是以应用为中心的，为了解决这种差异，社区引入了 virtio-vsock 和 virtio-fs，后续将引入更灵活的内存弹性技术virtio-mem；







virtio

virtiofsd





