# ubuntu 入门教程

## Ubuntu 18.04 安装

### 下载

官网：`https://www.ubuntu.com/download/server` 这里下载的是18.04.2 TLS。

### 安装

也是使用 VMware 安装。

直接下一步下一步就 ok。

需要注意的几个点：

* 安装过程中可以配置一下镜像，阿里云镜像地址：`http://mirrors.aliyun.com/ubuntu/`
* 磁盘选择`LVM` 方便后续扩展，默认磁盘大小为4G，需要修改小。

## 修改数据源

由于国内的网络环境问题，我们需要将 Ubuntu 的数据源修改为国内数据源，操作步骤如下：

如果前面安装时配置了就不用在改了。

### 查看系统版本

```text
lsb_release -a
```

输出结果为

```text
No LSB modules are available.
Distributor ID:	Ubuntu
Description:	Ubuntu 18.04.2 LTS
Release:	18.04
Codename:	bionic
```

**注意：** Codename 为 `bionic`，该名称为我们 Ubuntu 系统的名称，修改数据源需要用到该名称

### 编辑数据源

```shell
vi /etc/apt/sources.list
```

删除全部内容并修改为

```shell
deb http://mirrors.aliyun.com/ubuntu/ xenial main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ xenial-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ xenial-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ xenial-backports main restricted universe multiverse
```

### 更新数据源

```text
apt-get update
```

## 常用 APT 命令

### 安装软件包

```text
apt-get install packagename
```

### 删除软件包

```text
apt-get remove packagename
```

### 更新软件包列表

```text
apt-get update
```

### 升级有可用更新的系统（慎用）

```text
apt-get upgrade
```

## 其它 APT 命令

### 搜索

```text
apt-cache search package
```

### 获取包信息

```text
apt-cache show package
```

### 删除包及配置文件

```text
apt-get remove package --purge
```

### 了解使用依赖

```text
apt-cache depends package
```

### 查看被哪些包依赖

```text
apt-cache rdepends package
```

### 安装相关的编译环境

```text
apt-get build-dep package
```

### 下载源代码

```text
apt-get source package
```

### 清理无用的包

```text
apt-get clean && apt-get autoclean
```

### 检查是否有损坏的依赖

```text
apt-get check
```