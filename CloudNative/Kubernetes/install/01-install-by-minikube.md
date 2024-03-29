# minikube



需要先 [安装 kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)

> 实际就是下载二进制文件配置环境变量



> [官方文档](https://minikube.sigs.k8s.io/docs/start/)
>
> [阿里云团队文档](https://github.com/AliyunContainerService/minikube/wiki)



`minikube start`执行报错，提示不能用 root 账号：

```shell
[root@zhangpeilei ~]# minikube start --driver=docker
😄  minikube v1.22.0 on Centos 7.8.2003 (amd64)
✨  Using the docker driver based on user configuration
🛑  The "docker" driver should not be used with root privileges.
💡  If you are running minikube within a VM, consider using --driver=none:
📘    https://minikube.sigs.k8s.io/docs/reference/drivers/none/

❌  Exiting due to DRV_AS_ROOT: The "docker" driver should not be used with root privileges.

```

解决方案:

```shell
# 强制安装
minikube start --force=true --driver=docker
```



镜像下载慢，可以使用阿里云镜像：

```shell
minikube start --image-mirror-country=cn
```

> 这样会走 dockerhub 镜像，还是慢的话可以配置 docker 镜像加速器。



启动管理面板，会在浏览器打开管理页面。

```bash
minukube dashboard
```





安装 iotio

[官方文档](https://istio.io/latest/zh/docs/setup/getting-started/)

下载的时候很慢，直接取 github release 界面下载也是一样的。

其他的照着文档一步步来就行。

最后只能本地访问，要远程访问的话可以加个Nginx。

