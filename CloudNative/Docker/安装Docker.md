# docker

centos 一键安装脚本

```bash
yum remove -y docker  docker-common docker-selinux docker-engine
yum install -y yum-utils device-mapper-persistent-data lvm2
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
yum install -y docker-ce
mkdir -p /etc/docker
echo '{
  "registry-mirrors": [
    "https://ekxinbbh.mirror.aliyuncs.com"
  ]
}' > /etc/docker/daemon.json
systemctl enable docker --now
```



## 1. Docker

可以通过脚本一键安装，脚本下载命令如下：

```sh
# https://get.docker.com/
curl -fsSL get.docker.com -o get-docker.sh

# 下载后执行该脚本即可
sudo sh get-docker.sh
```

脚本需要 sudo 权限。

会自动对操作系统版本进行判断，然后选择对应的命令进行安装，比较简单。

或者根据下面的教程自己手动安装。

### 1. CentOS

> 官方文档 https://docs.docker.com/engine/install/centos/

Docker 要求 CentOS 系统的内核版本高于 `3.10`。

通过 **uname -r** 命令查看你当前的内核版本

```bash
[root@localhost ~]# uname -r
```

2、使用 `root` 权限登录 Centos。确保 yum 包更新到最新。

```bash
[root@localhost ~]# yum update
```

3、卸载旧版本(如果安装过旧版本的话)

```bash
[root@localhost ~]# yum remove -y docker  docker-common docker-selinux docker-engine
```

4、安装需要的软件包， yum-util 提供yum-config-manager功能，另外两个是devicemapper驱动依赖的

```bash
[root@localhost ~]# yum install -y yum-utils device-mapper-persistent-data lvm2
```

5、设置yum源

```bash
#这里可能会因为网络问题出错 直接替换成阿里的源
[root@localhost ~]# yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

6、可以查看所有仓库中所有docker版本，并选择特定版本安装

```shell
[root@localhost ~]# yum list docker-ce --showduplicates | sort -r
```

7、安装docker

```shell
# (这样写默认安装最新版本)
[root@localhost ~]#  yum install -y docker-ce 
# (指定安装版本) 
[root@localhost ~]#  yum install  docker-ce-<VERSION_STRING> 
```

8、启动并加入开机启动

```shell
[root@localhost ~]#  systemctl enable docker --now
```

9、验证安装是否成功(有client和service两部分表示docker安装启动都成功了

```shell
[root@localhost ~]# docker version
```

```shellClient:
 Version:           18.09.4
 API version:       1.39
 Go version:        go1.10.8
 Git commit:        d14af54266
 Built:             Wed Mar 27 18:34:51 2019
 OS/Arch:           linux/amd64
 Experimental:      false

Server: Docker Engine - Community
 Engine:
  Version:          18.09.4
  API version:      1.39 (minimum version 1.12)
  Go version:       go1.10.8
  Git commit:       d14af54
  Built:            Wed Mar 27 18:04:46 2019
  OS/Arch:          linux/amd64
  Experimental:     false
```

测试 Docker 是否安装正确

```bash
$ docker run hello-world

Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
ca4f61b1923c: Pull complete
Digest: sha256:be0cd392e45be79ffeffa6b05338b98ebb16c87b255f48e297ec7f98e123905c
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (amd64)
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker ID:
 https://cloud.docker.com/

For more examples and ideas, visit:
 https://docs.docker.com/engine/userguide/
```

若能正常输出以上信息，则说明安装成功。

### 2. Ubuntu

> 官方文档 https://docs.docker.com/engine/install/ubuntu/

Docker 的旧版本被称为 docker，docker.io 或 docker-engine 。如果已安装，请卸载它们：

```sh
$ sudo apt-get remove docker docker-engine docker.io containerd runc
```

在新主机上首次安装 Docker Engine-Community 之前，需要设置 Docker 仓库。之后，您可以从仓库安装和更新 Docker 。



1) 更新 apt 包索引。

```bash
sudo apt-get update
```

2) 安装依赖包，用于通过HTTPS来获取仓库:

```bash
sudo apt-get install -y\
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common
```

3) 添加 Docker 的官方 GPG 密钥：

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
```

9DC8 5822 9FC7 DD38 854A E2D8 8D81 803C 0EBF CD88 通过搜索指纹的后8个字符，验证您现在是否拥有带有指纹的密钥。

```bash
sudo apt-key fingerprint 0EBFCD88
sudo apt-key fingerprin F273FCD8
pub   rsa4096 2017-02-22 [SCEA]
      9DC8 5822 9FC7 DD38 854A  E2D8 8D81 803C 0EBF CD88
uid           [ unknown] Docker Release (CE deb) <docker@docker.com>
sub   rsa4096 2017-02-22 [S]
```



4) 设置软件源信息

```bash
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) \
  stable"
```

如果安装慢的话可以换国内的源,下面是中国科技大学的：

```bash
sudo add-apt-repository "deb [arch=amd64] https://mirrors.ustc.edu.cn/docker-ce/linux/ubuntu \
$(lsb_release -cs) stable"
```



5) 更新并安装 Docker CE

```bash
sudo apt-get -y update
# 默认会安装最新版本
sudo apt-get -y install docker-ce
```

6) 测试 Docker 是否安装成功，输入以下指令，打印出版本信息则安装成功:

```bash
docker version
```



7) 添加当前用户到 docker 用户组，可以不用 sudo 运行 docker（可选）

> Docker的守护线程绑定的是unix socket，而不是TCP端口，这个套接字默认属于root，其他用户可以通过sudo去访问这个套接字文件。所以docker服务进程都是以root账户运行。
>
> 解决的方式是创建docker用户组，把应用用户加入到docker用户组里面。只要docker组里的用户都可以直接执行docker命令。

```shell
# 创建 docker 用户组 
# 一般安装的时候就已经创建好了 会提示已存在
sudo groupadd docker
# 将自己加入到 docker 用户组
# sudo usermod -aG docker $USER
sudo usermod -aG docker lixd
# 重启 docker
sudo systemctl restart docker
# 给docker.sock添加权限 每次重启docker后都需要重新添加权限。。
sudo chmod a+rw /var/run/docker.sock
```



## 2. 配置Docker镜像加速器

> 鉴于国内网络问题，后续拉取 Docker 镜像十分缓慢，强烈建议安装 Docker 之后配置 `国内镜像加速`。

### 1. 添加镜像源

对于Ubuntu 16.04+、Debian 8+、CentOS 7等使用systemd的系统修改如下：

在`/etc/docker/daemon.json`中新增以下内容（如果文件不存在请新建该文件）：

>  推荐使用阿里云镜像加速器 
>
>  路径：登录阿里云-->控制台-->产品与服务-->容器镜像服务-->镜像中心-->镜像加速器

```json
vi /etc/docker/daemon.json

{
  "registry-mirrors": [
    "https://ekxinbbh.mirror.aliyuncs.com"
  ]
}

```

> 注意，一定要保证该文件符合 json 规范，否则 Docker 将不能启动。



```bash
mkdir -p /etc/docker &&  echo '{
  "registry-mirrors": [
    "https://ekxinbbh.mirror.aliyuncs.com"
  ]
}' > /etc/docker/daemon.json
```



### 2.检查加速器是否生效

重新启动 Docker 服务。

```bash
[root@localhost ~]#  systemctl daemon-reload
[root@localhost ~]#  systemctl restart docker
```
配置加速器之后，如果拉取镜像仍然十分缓慢，请手动检查加速器配置是否生效

在命令行执行 `docker info`，如果从结果中看到了如下内容，说明配置成功。

```bash
$ docker info|grep 'Registry Mirrors' -A 1
Registry Mirrors:
   https://ekxinbbh.mirror.aliyuncs.com/
```

## 3. Docker Compose

### 1. 简介

Docker Compose 是 Docker 官方编排（Orchestration）项目之一，负责快速的部署分布式应用。

其代码目前在 `https://github.com/docker/compose`上开源。

`Compose` 定位是 「定义和运行多个 Docker 容器的应用（Defining and running multi-container Docker applications）」，其前身是开源项目 Fig。

它允许用户通过一个单独的 `docker-compose.yml` 模板文件（YAML 格式）来定义一组相关联的应用容器为一个项目（project）。

`Compose` 中有两个重要的概念：

- 服务 (`service`)：一个应用的容器，实际上可以包括若干运行相同镜像的容器实例。
- 项目 (`project`)：由一组关联的应用容器组成的一个完整业务单元，在 `docker-compose.yml` 文件中定义。

`Compose` 的默认管理对象是项目，通过子命令对项目中的一组容器进行便捷地生命周期管理。

`Compose` 项目由 Python 编写，实现上调用了 Docker 服务提供的 API 来对容器进行管理。因此，只要所操作的平台支持 Docker API，就可以在其上利用 `Compose` 来进行编排管理。

### 2. 安装

在 Linux 上的也安装十分简单，从 [官方 GitHub Release](https://github.com/docker/compose/releases) 处直接下载编译好的二进制文件即可。

例如，在 Linux 64 位系统上直接下载对应的二进制包。

> GitHub 下载慢可以使用该镜像 http://get.daocloud.io/

```bash
# 第一步 下载二进制文件到/usr/local/bin/位置
$ curl -L https://github.com/docker/compose/releases/download/1.24.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
# 第二步 赋予可执行权限
$ chmod +x /usr/local/bin/docker-compose

#查看版本号
$ docker-compose version
```

### 3. 卸载

如果是二进制包方式安装的，删除二进制文件即可。

```bash
$ sudo rm /usr/local/bin/docker-compose
```
