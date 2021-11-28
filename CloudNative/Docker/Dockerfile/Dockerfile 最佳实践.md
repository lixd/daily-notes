# Dockerfile 最佳实践

建议参考一下文档：

* 1）[Dockerfile reference](https://docs.docker.com/engine/reference/builder/)
* 2）[Docker 官方镜像仓库中的 Dockerfile](https://github.com/docker-library/official-images)
  * 1）进入 library 目录，随便点开一个文件
  * 2）找到其中的`GitRepo: xxxx`
  * 3） 进入 xxxx 对应的仓库，查询其中的 Dockerfile 即可。
  * 4）官方镜像的 Dockerfile 写得都比较优雅，建议参考。



## 1. 合理使用缓存

Docker 镜像是分层的，构建时也是一层一层构建的。

如果在 build 时某层没有发生变化，那么就会直接使用上次的缓存，以提升 build 速度。



需要注意的是 如果某一层镜像发生变化后，那么该层以及后续的所有层都不能使用到缓存。

> 原因也很简单，每一层都是依赖于上一层的，如果上一层发生变化了，那么后续的自然全都不一样了。



**所以编写 Dockerfile 时可以尽量将不容易产生变化的 放到前面，容易变化的放到后面，最大程度利用到缓存来提升构建速度。**



## 2. 合理使用 .dockerignore

Docker是client-server架构，理论上Client和Server可以不在一台机器上。

在构建docker镜像的时候，需要把所需要的文件由CLI（client）发给Server，这些文件实际上就是 `build context`

```sh
$ docker image build -t demo .
Sending build context to Docker daemon  11.13MB
```

`.` 这个参数就是代表了build context 就是当前目录。此时 build 时会将当前目录的所有文件都发送到 server 端。

然而，当前目录的某些文件，我们构建这个镜像并不需要。比如：

```sh
.idea
.git
env
等等
```

和 gitignore 一样，docker 也有 .dockerignore 文件，用于指定传输时忽略的文件：

```sh'
.idea
.git
```

有了.dockerignore文件后，我们再build, build context就小了很多，4.096kB

```sh
$ docker image build -t demo .
Sending build context to Docker daemon  4.096kB
```



**建议配置`.dockerignore文件`，减少文件传输以提升 build 效率。**





## 3. 镜像的多阶段构建

假如有一个C的程序，我们想用Docker去做编译，然后执行可执行文件。

```c
#include <stdio.h>

void main(int argc, char *argv[])
{
    printf("hello %s\n", argv[argc - 1]);
}
```

构建一个Docker镜像，因为要有C的环境，所以我们选择gcc这个image

```dockerfile
FROM gcc:9.4

COPY hello.c /src/hello.c

WORKDIR /src

RUN gcc --static -o hello hello.c

ENTRYPOINT [ "/src/hello" ]
```

构建后发现镜像有 1G 多

```sh
$ docker image ls
REPOSITORY     TAG          IMAGE ID       CREATED       SIZE
hello          latest       7cfa0cbe4e2a   2 hours ago   1.14GB
gcc            9.4          be1d0d9ce039   9 days ago    1.14GB
```

实际上当我们把hello.c编译完以后，并不需要这样一个大的GCC环境，一个小的alpine镜像就可以了。

这时候我们就可以使用**多阶段构建，将编译环境和运行环境分开**。

```dockerfile
FROM gcc:9.4 AS builder

COPY hello.c /src/hello.c

WORKDIR /src

RUN gcc --static -o hello hello.c



FROM alpine:3.13.5

COPY --from=builder /src/hello /src/hello

ENTRYPOINT [ "/src/hello" ]
```

这样构建出的最终镜像就小多了

```sh
$ docker image ls
REPOSITORY     TAG          IMAGE ID       CREATED       SIZE
hello-alpine   latest       446baf852214   2 hours ago   6.55MB
hello          latest       7cfa0cbe4e2a   2 hours ago   1.14GB
demo           latest       079bae887a47   2 hours ago   125MB
gcc            9.4          be1d0d9ce039   9 days ago    1.14GB
```

可以看到这个镜像非常小，只有6.55MB。



**通过多阶段构建，将编译环境和运行环境拆分，以降低最终镜像大小。**



## 4. 尽量使用非root用户

### root 用户的危险性

> docker的root权限一直是其遭受诟病的地方

*docker的root权限有那么危险么？我们举个例子。*

假如我们有一个用户，叫 demo，它本身不具有 sudo 的权限，所以就有很多文件无法进行读写操作，比如 /root 目录它是无法查看的。



但是这个用户有执行docker的权限，也就是它在 docker 这个 group 里。

这时，我们就可以通过 Docker 做很多**越权**的事情了，比如，我们可以把这个无法查看的/root目录映射到docker container里，你就可以自由进行查看了。

```sh
[demo@docker-host vagrant]$ docker run -it -v /root/:/root/tmp busybox sh
/ # cd /root/tmp
~/tmp # ls
anaconda-ks.cfg  original-ks.cfg
~/tmp # ls -l
total 16
-rw-------    1 root     root          5570 Apr 30  2020 anaconda-ks.cfg
-rw-------    1 root     root          5300 Apr 30  2020 original-ks.cfg
~/tmp #
```



更甚至我们可以给我们自己加sudo权限。

我们现在没有sudo权限。

```sh
[demo@docker-host ~]$ sudo vim /etc/sudoers
[sudo] password for demo:
demo is not in the sudoers file.  This incident will be reported.
[demo@docker-host ~]$
```

但是我可以给自己添加。

```sh
[demo@docker-host ~]$ docker run -it -v /etc/sudoers:/root/sudoers busybox sh
/ # echo "demo    ALL=(ALL)       ALL" >> /root/sudoers
/ # more /root/sudoers | grep demo
demo    ALL=(ALL)       ALL
```

然后退出container，bingo，我们有sudo权限了。

```sh
[demo@docker-host ~]$ sudo more /etc/sudoers | grep demo
demo    ALL=(ALL)       ALL
[demo@docker-host ~]$
```



### 如何使用非 root 用户

使用非root用户来构建这个镜像，名字叫 `flask-no-root` Dockerfile如下：

```dockerfile
FROM python:3.9.5-slim

RUN pip install flask && \
    groupadd -r flask && useradd -r -g flask flask && \
    mkdir /src && \
    chown -R flask:flask /src

USER flask

COPY app.py /src/app.py

WORKDIR /src
ENV FLASK_APP=app.py

EXPOSE 5000

CMD ["flask", "run", "-h", "0.0.0.0"]
```

**首先通过groupadd和useradd创建一个flask的组和用户**

```sh
 groupadd -r flask && useradd -r -g flask flask && \
    mkdir /src && \
    chown -R flask:flask /src
```

然后**通过USER指定后面的命令要以flask这个用户的身份运行**

```dockerfile
USER flask

// ...
```

