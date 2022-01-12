# Dockerfile

> 参考博客 https://dockertips.readthedocs.io/
>
> 官方文档 https://docs.docker.com/develop/develop-images/dockerfile_best-practices/

## 1. 概述

通过`Dockerfile`可能快速构建自定义镜像。

Dockerfile 是一个文本文件，其内包含了一条条的指令(Instruction)，每一条指令构建一层，因此每一条指令的内容，就是描述该层应当如何构建。有了 Dockerfile，当我们需要定制自己额外的需求时，只需在 Dockerfile 上添加或者修改指令，重新生成 image 即可，省去了敲命令的麻烦。

```sh
##  Dockerfile文件格式

# This dockerfile uses the ubuntu image
# VERSION 2 - EDITION 1
# Author: docker_user
# Command format: Instruction [arguments / command] ..
 
# 1、第一行必须指定 基础镜像信息
FROM ubuntu
 
# 2、维护者信息
MAINTAINER docker_user docker_user@email.com
 
# 3、镜像操作指令
RUN echo "deb http://archive.ubuntu.com/ubuntu/ raring main universe" >> /etc/apt/sources.list
RUN apt-get update && apt-get install -y nginx
RUN echo "\ndaemon off;" >> /etc/nginx/nginx.conf
 
# 4、容器启动执行指令
CMD /usr/sbin/nginx
```

Dockerfile 分为四部分：**基础镜像信息、维护者信息、镜像操作指令、容器启动执行指令**。一开始必须要指明所基于的镜像名称，接下来一般会说明维护者信息；后面则是镜像操作指令，例如 RUN 指令。每执行一条RUN 指令，镜像添加新的一层，并提交；最后是 CMD 指令，来指明运行容器时的操作命令。

## 2. 例子

### 1. 编写Dockerfile

```dockerfile
FROM ubuntu:18.04
LABEL maintainer="illosory <xueduan.li@gmail.com>"
RUN apt-get update && apt-get install -y redis-server
EXPOSE 6397
ENTRYPOINT [ "/usr/bin/redis-server" ]
```



**关键字解释**

- FROM 是 我们选择的 base 基础镜像
- LABEL 为 我们需要的标识，比如作者是谁
- RUN 是我们 执行的命令，必须使用连接符
- EXPOSE 暴漏的端口
- ENTRYPOINT 程序的入口

### 2. 构建镜像

```sh
docker build -t illusory/redis:latest .
```

## 3. Dockerfile 关键字

### 1. FROM

FROM 指令用于指定其后构建新镜像所使用的基础镜像。FROM 指令必是 Dockerfile 文件中的首条命令，启动构建流程后，Docker 将会基于该镜像构建新镜像，FROM 后的命令也会基于这个基础镜像，尽量使用官方发布的image作为base image,原因很简单，为了安全!

语法格式：

```dockerfile
FROM <image>
```

或

```dockerfile
FROM <image>:<tag>
```

或

```dockerfile
FROM <image>:<digest>
```

通过 FROM 指定的镜像，可以是任何有效的基础镜像。FROM 有以下限制：

- FROM 必须 是 Dockerfile 中第一条非注释命令
- 在一个 Dockerfile 文件中创建多个镜像时，FROM 可以多次出现。只需在每个新命令 FROM 之前，记录提交上次的镜像 ID。
- tag 或 digest 是可选的，如果不使用这两个值时，会使用 latest 版本的基础镜像



### 2.  MAINTAINER/LABEL

MAINTAINER 指令设置生成镜像的 Author 字段。LABEL 指令是一个更加灵活的版本，你应该使用 LABEL。因为 LABEL 可以设置你需要的任何元数据，并且可以轻松查看，例如使用docker inspect。推荐将所有的元数据通过一条LABEL指令指定，以免生成过多的中间镜像。

```sh
LABEL version="1.0" description="测试Dockerfile" by="illusory"
```

指定后可以通过docker inspect查看：

```json
docker inspect itbilu/test
"Labels": {
    "version": "1.0",
    "description": "测试Dockerfile",
    "by": "illusory"
},
```

要设置与 MAINTAINER 字段对应的标签，你可以使用:

```dockerfile
LABEL maintainer="xueduan.li@gmail.com"
```



### 3. RUN

在镜像的构建过程中(docker build)执行特定的命令，并生成一个中间镜像。每一次`RUN`都会使镜像增加一层(类似commit)，如果使用 `&&` 连接，将只有一层。

语法格式：

```dockerfile
#shell格式
RUN <command>
#exec格式
RUN ["executable", "param1", "param2"]
```

- RUN 命令将在当前 image 中执行任意合法命令并提交执行结果。命令执行提交后，就会自动执行 Dockerfile 中的下一个指令。
- 层级 RUN 指令和生成提交是符合 Docker 核心理念的做法。它允许像版本控制那样，在任意一个点，对 image 镜像进行定制化构建。
- RUN 指令创建的中间镜像会被缓存，并会在下次构建中使用。如果不想使用这些缓存镜像，可以在构建时指定 `--no-cache` 参数，如：`docker build --no-cache`。



```sh
RUN apt-get update && apt-get install -y perl \
    pwgen --no-install-recommends && rm -rf \
    /var/lib/apt/lists/*  # 注意清理cache
```

> 为了无用分层，为了美观，合并多条命令为一条，如果复杂的RUN请使用反斜线换行!

### 4. WORKDIR

设定当前工作目录,类似 `cd` 命令,通过WORKDIR设置工作目录后，Dockerfile 中其后的命令 RUN、CMD、ENTRYPOINT、ADD、COPY 等命令都会在该目录下执行。

```sh
WORKDIR /test    # 如果没有test文件夹将会自动创建
WORKDIR demo
RUN pwd          # 输出结果应该是/test/demo
```

> 在使用的时候注意尽量不要用RUN cd，而是使用WORKDIR，并且路径尽量使用绝对路径，避免出错。

### 5.  COPY

**COPY 文件夹的时候最外层文件夹会被丢弃，要保留的话只能在目标路径增加一层。**

```dockerfile
COPY  ./conf/folder /root/conf/folder
```



```sh
COPY <源路径>... <目标路径>
COPY ["<源路径1>",... "<目标路径>"]
```

COPY 指令将从构建上下文目录中 <源路径> 的文件/目录复制到新的一层的镜像内的`<目标路径>`位置。比如：

```dockerfile
COPY package.json /usr/src/app/
```

`<源路径>`可以是多个，甚至可以是通配符，其通配符规则要满足 Go 的 filepath.Match 规则，如：

```
COPY hom* /mydir/
COPY hom?.txt /mydir/
```

`<目标路径>`可以是容器内的绝对路径，也可以是相对于工作目录的相对路径（工作目录可以用 WORKDIR 指令来指定）。目标路径不需要事先创建，如果目录不存在会在复制文件前先行创建缺失目录。

此外，还需要注意一点，**使用 COPY 指令，源文件的各种元数据都会保留。比如读、写、执行权限、文件变更时间等**。这个特性对于镜像定制很有用。特别是构建相关文件都在使用 Git 进行管理的时候。



### 6. ADD

更高级的复制文件,ADD 指令和 COPY 的格式和性质基本一致。但是在 COPY 基础上增加了一些功能。

- 解压压缩文件并把它们添加到镜像中
- 从 url 拷贝文件到镜像中

格式：

```
ADD <源路径>... <目标路径>
ADD ["<源路径>",... "<目标路径>"]
```

**注意**
如果 docker 发现文件内容被改变，则接下来的指令都不会再使用缓存。关于复制文件时需要处理的/，基本跟正常的 copy 一致

```sh
ADD test.tar.gz / # 添加到根目录并解压，这是与COPY的区别
```

- 解压压缩文件并把它们添加到镜像中
- 从 url 拷贝文件到镜像中(官方不推荐)

docker 官方建议我们当需要从远程复制文件时，最好使用 curl 或 wget 命令来代替 ADD 命令。原因是，当使用 ADD 命令时，会创建更多的镜像层，当然镜像的 size 也会更大。

```dockerfile
ADD http://example.com/big.tar.xz /usr/src/things/
RUN tar -xJf /usr/src/things/big.tar.xz -C /usr/src/things
RUN make -C /usr/src/things all
```

如果使用下面的命令，不仅镜像的层数减少，而且镜像中也不包含 big.tar.xz 文件：

```dockerfile
RUN mkdir -p /usr/src/things \
    && curl -SL http://example.com/big.tar.xz \
    | tar -xJC /usr/src/things \
    && make -C /usr/src/things all
```

看起来只有在解压压缩文件并把它们添加到镜像中时才需要 ADD 命令！

### 7. ENV

设置环境变量。

格式有两种：

```dockerfile
ENV <key> <value>
ENV <key1>=<value1> <key2>=<value2>...
```

这个指令很简单，就是设置环境变量而已，无论是后面的其它指令，如 RUN，还是运行时的应用，都可以直接使用这里定义的环境变量。

```dockerfile
ENV VERSION=1.0 DEBUG=on \
    NAME="Happy Feet"
```

这个例子中演示了如何换行，以及对含有空格的值用双引号括起来的办法，这和 Shell 下的行为是一致的。

### 8. EXPOSE

为构建的镜像设置监听端口，使容器在运行时监听。格式：

```dockerfile
EXPOSE <port> [<port>...]
```

**EXPOSE 只是声明运行容器时提供的服务端口，这仅仅是一个声明**，在运行容器的时候并不会因为这个声明就会开启端口服务，**你依旧需要使用 -P 或者 -p 参数映射端口**。

> 在 Dockerfile 中写这样的端口声明有助于使用者理解这个镜像开放哪些服务端口，以便配置映射。

### 9. VOLUME

VOLUME用于创建挂载点，即向基于所构建镜像创始的容器添加卷：

```dockerfile
VOLUME ["/data"]
# 在宿主机的/var/lib/docker目录下创建一个data文件夹并把它链接到容器中的/data目录
```

一个卷可以存在于一个或多个容器的指定目录，该目录可以绕过联合文件系统，并具有以下功能：

- 卷可以容器间共享和重用
- 容器并不一定要和其它容器共享卷
- 修改卷后会立即生效
- 对卷的修改不会对镜像产生影响
- 卷会一直存在，直到没有任何容器在使用它

VOLUME 让我们可以将源代码、数据或其它内容添加到镜像中，而又不并提交到镜像中，并使我们可以多个容器间共享这些内容。

> 如果 Dockerfile 中有指定 Volume，那么每次删除容器(Volume不会被删除)后重新启动都会创建一个新的Volume，需要在 docker run 中通过 -v 参数指定一个固定名字才能复用。

就算 Dockerfile 中不指定 Volume 也可以在启动时通过 -v 参数手动指定，Dockerfile 中的 Volume 关键字主要是防止启动的时候忘了加 -v 参数，最后导致数据丢失的一个保底。

> 所有不管有没有 Volume ，需要持久化的时候都建议手动 -v 指定。



### 10. CMD

类似于 RUN 指令，用于运行程序，但二者运行的时间点不同；RUN在镜像构建时(docker build)执行,CMD 在容器启动时(docker run) 运行

CMD 有以下三种格式：

```dockerfile
CMD ["executable","param1","param2"]
CMD ["param1","param2"]
CMD command param1 param2
```

省略可执行文件的 exec 格式，这种写法使 CMD 中的参数当做 ENTRYPOINT 的默认参数，此时 ENTRYPOINT 也应该是 exec 格式，具体与 ENTRYPOINT 的组合使用，参考 ENTRYPOINT。



### 11. ENTRYPOINT 

ENTRYPOINT 用于给容器配置一个可执行程序。也就是说，每次使用镜像创建容器时，通过 ENTRYPOINT 指定的程序都会被设置为默认程序。ENTRYPOINT 有以下两种形式：

```dockerfile
ENTRYPOINT ["executable", "param1", "param2"]
ENTRYPOINT command param1 param2
```

ENTRYPOINT 与 CMD 非常类似，不同的是通过`docker run`执行的命令不会覆盖 ENTRYPOINT，而`docker run`命令中指定的任何参数，都会被当做参数再次传递给 ENTRYPOINT。Dockerfile 中只允许有一个 ENTRYPOINT 命令，多指定时会覆盖前面的设置，而只执行最后的 ENTRYPOINT 指令。

`docker run`运行容器时指定的参数都会被传递给 ENTRYPOINT ，且会覆盖 CMD 命令指定的参数。如，执行`docker run <image> -d`时，-d 参数将被传递给入口点。

也可以通过`docker run --entrypoint`重写 ENTRYPOINT 入口点。

如：可以像下面这样指定一个容器执行程序：

```dockerfile
ENTRYPOINT ["/usr/bin/nginx"]
```

完整构建代码：

```dockerfile
# Version: 0.0.3
FROM ubuntu:16.04
MAINTAINER 何民三 "cn.liuht@gmail.com"
RUN apt-get update
RUN apt-get install -y nginx
RUN echo 'Hello World, 我是个容器' \ 
   > /var/www/html/index.html
ENTRYPOINT ["/usr/sbin/nginx"]
EXPOSE 80
```

使用docker build构建镜像，并将镜像指定为 itbilu/test：

```ssh
docker build -t="itbilu/test" .
```

构建完成后，使用itbilu/test启动一个容器：

```ssh
docker run -i -t  itbilu/test -g "daemon off;"
```

在运行容器时，我们使用了 `-g "daemon off;"`，这个参数将会被传递给 ENTRYPOINT，最终在容器中执行的命令为 `/usr/sbin/nginx -g "daemon off;"`。



### 12. USER

USER 用于指定运行镜像所使用的用户,可以使用用户名、UID 或 GID，或是两者的组合。以下都是合法的格式：

```dockerfile
USER user
USER user:group
USER uid
USER uid:gid
USER user:gid
USER uid:group	
```

使用USER指定用户后，Dockerfile 中其后的命令 RUN、CMD、ENTRYPOINT 都将使用该用户。镜像构建完成后，通过 docker run 运行容器时，可以通过 `-u` 参数来覆盖所指定的用户。



### 13. ARG

ARG用于指定传递给构建运行时的变量：

```dockerfile
ARG <name>[=<default value>]
```

如，通过ARG指定两个变量：

```dockerfile
ARG site
ARG build_user=illusory
```

以上我们指定了 site 和 build_user 两个变量，其中 build_user 指定了默认值。在使用 docker build 构建镜像时，可以通过 `--build-arg <varname>=<value>` 参数来指定或重设置这些变量的值。

```sh
docker build --build-arg site=vaptcha.com -t illusory/test .
```

这样我们构建了 itbilu/test 镜像，其中site会被设置为 vaptcha.com，由于没有指定 build_user，其值将是默认值illusory。

> ENV(环境变量) 和 ARG(构建参数) 比较类似，但是实际上 ENV 会真正被填充到镜像的ENV中，而 ARG 只是在构建镜像时被替换，并不会真正写入到镜像中。
>
> 不过ARG的好处是可以通过 --build-arg  命令来更新，而不是去修改 Dockerfile。

### 14. ONBUILD

ONBUILD用于设置镜像触发器：

```dockerfile
ONBUILD [INSTRUCTION]
```

当所构建的镜像被用做其它镜像的基础镜像，该镜像中的触发器将会被钥触发。
如，当镜像被使用时，可能需要做一些处理：

```dockerfile
[...]
ONBUILD ADD . /app/src
ONBUILD RUN /usr/local/bin/python-build --dir /app/src
[...]
```



### 15. STOPSIGNAL

STOPSIGNAL用于设置停止容器所要发送的系统调用信号：

```dockerfile
STOPSIGNAL signal
```

所使用的信号必须是内核系统调用表中的合法的值，如：SIGKILL。



### 16. SHELL

SHELL用于设置执行命令（shell式）所使用的的默认 shell 类型：

```dockerfile
SHELL ["executable", "parameters"]
```

SHELL在Windows环境下比较有用，Windows 下通常会有 cmd 和 powershell 两种 shell，可能还会有 sh。这时就可以通过 SHELL 来指定所使用的 shell 类型：

```dockerfile
FROM microsoft/windowsservercore

# Executed as cmd /S /C echo default
RUN echo default

# Executed as cmd /S /C powershell -command Write-Host default
RUN powershell -command Write-Host default

# Executed as powershell -command Write-Host hello
SHELL ["powershell", "-command"]
RUN Write-Host hello

# Executed as cmd /S /C echo hello
SHELL ["cmd", "/S"", "/C"]
RUN echo hello
```



## 4. 原则与建议

- 容器轻量化。从镜像中产生的容器应该尽量轻量化，能在足够短的时间内停止、销毁、重新生成并替换原来的容器。
- 使用 `.gitignore`。在大部分情况下，Dockerfile 会和构建所需的文件放在同一个目录中，为了提高构建的性能，应该使用 `.gitignore` 来过滤掉不需要的文件和目录。
- 为了减少镜像的大小，减少依赖，仅安装需要的软件包。
- 一个容器只做一件事。解耦复杂的应用，分成多个容器，而不是所有东西都放在一个容器内运行。如一个 Python Web 应用，可能需要 Server、DB、Cache、MQ、Log 等几个容器。一个更加极端的说法：One process per container。
- 减少镜像的图层。不要多个 Label、ENV 等标签。
- 对续行的参数按照字母表排序，特别是使用`apt-get install -y`安装包的时候。
- 使用构建缓存。如果不想使用缓存，可以在构建的时候使用参数`--no-cache=true`来强制重新生成中间镜像。



## 参考

`https://www.cnblogs.com/ityouknow/p/8588725.html`

`https://www.cnblogs.com/sparkdev/p/9573248.html`

`https://www.cnblogs.com/klvchen/p/9238410.html`

`https://blog.csdn.net/dejunyang/article/details/91449811`