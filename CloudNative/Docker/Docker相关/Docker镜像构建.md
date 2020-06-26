# Docker镜像构建

## 1. Dockerfile

首先肯定是写一个Dockerfile了。

```dockerfile
FROM ubuntu:18.04
LABEL maintainer="illosory <xueduan.li@gmail.com>"
RUN apt-get update && apt-get install -y redis-server
EXPOSE 6397
ENTRYPOINT [ "/usr/bin/redis-server" ]
```



## 2. 构建

```sh
docker build -t illusory/redis:latest .
```





如果注意，会看到 `docker build` 命令最后有一个 `.`。`.` 表示当前目录，而 `Dockerfile` 就在当前目录，因此不少初学者以为这个路径是在指定 `Dockerfile` 所在路径，这么理解其实是不准确的。如果对应上面的命令格式，你可能会发现，这是在指定**上下文路径**。那么什么是上下文呢？

首先我们要理解 `docker build` 的工作原理。**Docker 在运行时分为 Docker 引擎（也就是服务端守护进程）和客户端工具**。Docker 的引擎提供了一组 REST API，被称为 [Docker Remote API](https://docs.docker.com/engine/reference/api/docker_remote_api/)，**而如 `docker`命令这样的客户端工具，则是通过这组 API 与 Docker 引擎交互，从而完成各种功能**。因此，虽然表面上我们好像是在本机执行各种 `docker` 功能，但实际上，一切都是使用的远程调用形式在服务端（Docker 引擎）完成。也因为这种 C/S 设计，让我们操作远程服务器的 Docker 引擎变得轻而易举。

所以我们在执行`docker build`命令的时候真实的时Docker引擎在工作，其中的上下文就是需要传递给Docker引擎的文件或者目录。

如果观察 `docker build` 输出，我们其实已经看到了这个发送上下文的过程：

```bash
[root@localhost tomcat]# docker build -t ishop .
Sending build context to Docker daemon 2.048 kB
...
```

可以看到`Sending build context to Docker daemon  2.048kB`。把上下文目录下的内容传递给Docker引擎。

现在就可以理解刚才的命令 `docker build -t ishop .` 中的这个 `.`，实际上是在指定上下文的目录，`docker build` 命令会将该目录下的内容打包交给 Docker 引擎以帮助构建镜像。