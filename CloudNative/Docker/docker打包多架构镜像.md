# docker 打包多架构镜像

> [Faster Multi-Platform Builds: Dockerfile Cross-Compilation Guide](https://www.docker.com/blog/faster-multi-platform-builds-dockerfile-cross-compilation-guide/)
>
> [多架构镜像三部曲](https://blog.csdn.net/mycosmos/article/details/123587243)
>
> [关于 Golang 多平台打包发布这件事](https://ameow.xyz/archives/go-multiplatform-docker)



## 1. 何为多架构镜像？

**何为多架构镜像？**

多架构（multi-architecture）镜像允许某个服务镜像使用一个名称关联多个不同架构功能相同的镜像。即一个镜像 TAG 中可以同时包含不同 CPU 架构、操作系统信息。

> 类似这种 [lixd96/etcd:3.5.5](https://hub.docker.com/layers/lixd96/etcd/3.5.5/images/sha256-338945cce041a3c8d849dbe020fde032a3c56b95705b524f485d11ea7d728bb2?context=explore)

拉取镜像时可以通过 **--platform** 来拉取指定架构的镜像

```bash
docker pull --platform arm64 lixd96/etcd:3.5.5
docker pull --platform amd64 lixd96/etcd:3.5.5
```

> 不指定时 docker 就会自动拉取当前平台架构的版本

**为什么需要多架构镜像？**

在企业实际业务容器化过程中会遇到同一个服务构建的镜像需要运行在不同的 CPU 架构服务器上，比较常遇到的是 ARM 架构（如 arm64/v8）和 X86 架构（amd64）。

**对于一个服务组件构建两个及以上的镜像 TAG 是非常不便于管理的，在这种情况下使用多架构镜像是非常不错的选择。**

不然就要维护多个 tag，就像这样[lixd96/etcd:3.5.5-amd64](https://hub.docker.com/layers/lixd96/etcd/3.5.5-amd64/images/sha256-338945cce041a3c8d849dbe020fde032a3c56b95705b524f485d11ea7d728bb2?context=explore)、[lixd96/etcd:3.5.5-arm64](https://hub.docker.com/layers/lixd96/etcd/3.5.5-arm64/images/sha256-43c6b811cd8faf88f3d27b725b99f3b3eacc7ba58580a341ec554c544acd472b?context=explore)，还是挺麻烦的。



## 2. 如何构建多架构镜像

一般情况下 docker 提供的构建多架构镜像有两种方式：

* 1） 手动组合
  * docker manifest create
* 2）自动创建
  * docker buildx --platform xxx



### 2.1 手动组合 docker manifest

多架构镜像实际就是维护的一个 mainfest 文件，在这个 manifest 文件里引用不同架构的镜像即可组合成一个多架构镜像。

比如这里有两个不同架构的镜像：

* [lixd96/etcd:3.5.5-amd64](https://hub.docker.com/layers/lixd96/etcd/3.5.5-amd64/images/sha256-338945cce041a3c8d849dbe020fde032a3c56b95705b524f485d11ea7d728bb2?context=explore)
* [lixd96/etcd:3.5.5-arm64](https://hub.docker.com/layers/lixd96/etcd/3.5.5-arm64/images/sha256-43c6b811cd8faf88f3d27b725b99f3b3eacc7ba58580a341ec554c544acd472b?context=explore)

我们就可以通过一个 manifest 文件将二者进行组合，具体操作方式如下：

标准语法为：

```bash
docker manifest create MANIFEST_LIST MANIFEST [MANIFEST...]
```

* MANIFEST：MANIFEST 是在 image layer 上的一层抽象，可以理解为一个镜像(名字+tag)就是一个 MANIFEST
* MANIFEST_LIST： MANIFEST_LIST 就是多个 MANIFEST 的集合，也就是这里的 多架构镜像，即把不同架构的镜像(MANIFEST)组合在一起。

具体用起来的话就是这样的：

```bash
docker manifest create 组合后的镜像 用于组合的镜像1 用于组合的镜像2 ... 用于组合的镜像n
```

例如：

```bash
docker manifest create lixd96/etcd:3.5.5 lixd96/etcd:3.5.5-amd64 lixd96/etcd:3.5.5-arm64
```

> 注意：用于组合的镜像需要先推送到 dockerhub 才行。

然后再把这个 manifest 推送到 dockerhub 即可

```Bash
docker manifest push lixd96/etcd:3.5.5
```

这样，一个多架构的镜像就创建好了。

最后还可以移除本地的 manifest

```bash
docker manifest rm lixd96/etcd:3.5.5
```



### 2.2 buildx

就像 go 语言可以使用交叉编译，在 win 下编译出 linux 版本的二进制文件一样，docker 也提供了 buildx 工具来构建多架构镜像。

Buildx 是一个 Docker CLI 插件，它扩展了 docker build 命令的镜像构建功能，完整的支持 Moby BuildKit builder 工具包提供的特性。也提供了与 docker build 相似的操作体验，并提供了许多新构建特性，比如多架构镜像构建，以及并发构建等。

> 同时Buildx 工具提供 `docker buildx imagetools` 工具来提供和 `docker manifest` 类似的命令。



与 docker manifest 在本地构建出 manifests list 后 push 到远程 Registry 仓库的方式不同，**docker buildx imagetools 是直接在远程 Registry 仓库中构建，构建过程并不保存在本地**。

buildx 也提供了 docker buildx imagetools inspect 命令来查看远程 Registry 仓库中 manifests list 的信息。



#### 开启 buildx

首先我们需要开启 buildx 功能，在新版 docker 中是自动开启的，旧版则需要手动开启。

Buildx 限制和应对：

* Docker 版本限制。使用 buildx 作为 docker CLI 插件需要 **Docker版本 >= 19.03 **。
* Linux 内核版本限制。**要求 Linux kernel >= 4.8**。
  

需要注意的是，即便内核版本大于 `Linux kernel >= 4.8`，也有可能还没有开启内核相关的特性支持，可以通过如下方法来快速配置：

```bash
docker run --privileged --rm tonistiigi/binfmt --install all
```



#### 修改 Dockerfile

同时还需要修改 Dockerfile 以支持多架构镜像的构建,完整 Dockerfile 如下：

```dockerfile
FROM --platform=${BUILDPLATFORM}  golang:1.19 as build
ARG TARGETOS
ARG TARGETARCH
ENV GOPROXY=https://goproxy.cn
WORKDIR /gobuild
COPY  main.go  .
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build main.go

FROM --platform=${TARGETPLATFORM} alpine:3.16.3
WORKDIR /root
COPY --from=build /gobuild/main .
ENTRYPOINT  ["./main"]
```



有几个改动点：

* 1）拉取镜像时指定编译平台，--platform=${BUILDPLATFORM} 
  * 这个应该不用指定也行，默认会拉取当前平台的
* 2）go build 时通过 ARG 指定对应的 TARGETOS 和 TARGETARCH 进行交叉编译
* 3）运行环境指定为目标平台，--platform=${TARGETPLATFORM}





#### 构建镜像

一切都准备好就可以开始构建镜像了。

首先需要登录,便于后续可以直接把构建好的镜像推送到 dockerhub

```bash
docker login
```

然后开始构建，语法和 docker build 类似

```bash
docker buildx build --platform linux/amd64,linux/arm64 --push --file ./Dockerfile -t lixd96/test:0.0.1 .
```

* --platform：指定要构建的架构
* --push：指定构建完成直接推送到 dockerhub



## 3. 小结

简单总结一下，构建多架构镜像有两种方式

* docker manifest creat
* docker buildx build

一般是对于不同的架构需要使用不同 dockerfile 单独构建镜像的话只能使用方式一。

如果不同架构能用统一的 Dockerfile 那么建议使用 buildx。

