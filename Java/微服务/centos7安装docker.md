# docker

## 简介

作为一种新兴的虚拟化方式，Docker 跟传统的虚拟化方式相比具有众多的优势。

Docker 在容器的基础上，进行了进一步的封装，从文件系统、网络互联到进程隔离等等，极大的简化了容器的创建和维护。使得 Docker 技术比虚拟机技术更为轻便、快捷。

下面的图片比较了 Docker 和传统虚拟化方式的不同之处。传统虚拟机技术是虚拟出一套硬件后，在其上运行一个完整操作系统，在该系统上再运行所需应用进程；而容器内的应用进程直接运行于宿主的内核，容器内没有自己的内核，而且也没有进行硬件虚拟。因此容器要比传统虚拟机更为轻便。

### Docker 引擎

Docker 引擎是一个包含以下主要组件的客户端服务器应用程序。

- 一种服务器，它是一种称为守护进程并且长时间运行的程序。
- REST API用于指定程序可以用来与守护进程通信的接口，并指示它做什么。
- 一个有命令行界面 (CLI) 工具的客户端。

## 安装

### 1.yum安装

Docker 要求 CentOS 系统的内核版本高于 `3.10`，查看本页面的前提条件来验证你的CentOS 版本是否支持 Docker 。

通过 **uname -r** 命令查看你当前的内核版本

```
[root@localhost ~]#  uname -r
```

2、使用 `root` 权限登录 Centos。确保 yum 包更新到最新。

```
[root@localhost ~]# yum update
```

3、卸载旧版本(如果安装过旧版本的话)

```
[root@localhost ~]# yum remove docker  docker-common docker-selinux docker-engine
```

4、安装需要的软件包， yum-util 提供yum-config-manager功能，另外两个是devicemapper驱动依赖的

```
$ yum install -y yum-utils device-mapper-persistent-data lvm2
```

5、设置yum源

```
[root@localhost ~]#  yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
#这里可能会因为网络问题出错 可以替换成阿里的源
[root@localhost ~]# yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
```

6、可以查看所有仓库中所有docker版本，并选择特定版本安装

```
[root@localhost ~]#  yum list docker-ce --showduplicates | sort -r
```

7、安装docker

```
[root@localhost ~]#  yum install docker-ce (这样写默认安装最新版本)
[root@localhost ~]#  yum install  docker-ce-<VERSION_STRING> (指定安装版本) 
```

8、启动并加入开机启动

```
[root@localhost ~]#  sudo systemctl start docker
[root@localhost ~]#  sudo systemctl enable docker
```

9、验证安装是否成功(有client和service两部分表示docker安装启动都成功了)

```
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

### 2.使用脚本自动安装

在测试或开发环境中 Docker 官方为了简化安装流程，提供了一套便捷的安装脚本，Ubuntu 系统上可以使用这套脚本安装：

```bash
$ curl -fsSL get.docker.com -o get-docker.sh
$ sudo sh get-docker.sh --mirror Aliyun
```

执行这个命令后，脚本就会自动的将一切准备工作做好，并且把 Docker CE 的 Edge 版本安装在系统中。

