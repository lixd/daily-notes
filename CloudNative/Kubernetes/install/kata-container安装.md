# kata container 安装



## 0. 环境准备

kata 需要使用 vm，因此宿主机需要支持虚拟化才行。

> VMware 安装的虚拟机需要先开启**嵌套虚拟化**功能，然后 Windows 下真的 HyperV 和 VMware 又冲突，需要先把 HyperV 关掉。

```bash
Win10专业版解决方法：
1、控制面板—程序——打开或关闭Windows功能，取消勾选Hyper-V，确定禁用Hyper-V服务。
2、之后重新启动计算机，再运行VM虚拟机即可。
Win10家庭版解决方法：
1、按下WIN+R打开运行，然后输入services.msc回车；
2、在服务中找到 HV主机服务，双击打开设置为禁用；

3.再打开Windows PowerShell（管理员）
4、运行命令：bcdedit /set hypervisorlaunchtype off

然后重启电脑。
```





## 1. 安装

[CentOS 官方安装文档](https://github.com/kata-containers/kata-containers/blob/main/docs/install/centos-installation-guide.md)

Install the Kata Containers components with the following commands:

```bash
sudo -E dnf install -y centos-release-advanced-virtualization
sudo -E dnf module disable -y virt:rhel
source /etc/os-release
cat <<EOF | sudo -E tee /etc/yum.repos.d/kata-containers.repo
  [kata-containers]
  name=Kata Containers
  baseurl=http://mirror.centos.org/\$contentdir/\$releasever/virt/\$basearch/kata-containers
  enabled=1
  gpgcheck=1
  skip_if_unavailable=1
  EOF
sudo -E dnf install -y kata-containers
```

官方的试了下好像不行，用的是下面这个：

> [Kata的安装使用和遇到的问题](https://juejin.cn/post/6935408631793844260)

```bash
source /etc/os-release
sudo yum -y install yum-utils
ARCH=$(arch)
BRANCH="${BRANCH:-master}"
sudo -E yum-config-manager --add-repo "http://download.opensuse.org/repositories/home:/katacontainers:/releases:/${ARCH}:/${BRANCH}/CentOS_${VERSION_ID}/home:katacontainers:releases:${ARCH}:${BRANCH}.repo"
sudo -E yum -y install kata-runtime kata-proxy kata-shim
```

注意：BRANCH对应的系统，有些版本不是那么全，笔者使用是master对应的没有centos7，报了404，因此使用的是“stable-1.10”。

执行以下命令重新安装：

```bash
sudo -E yum-config-manager --add-repo "http://download.opensuse.org/repositories/home:/katacontainers:/releases:/${ARCH}:/stable-1.10/CentOS_${VERSION_ID}/home:katacontainers:releases:${ARCH}:stable-1.10.repo"
sudo -E yum -y install kata-runtime kata-proxy kata-shim
```





验证是否安装完成

```bash
sudo kata-runtime kata-check

System is capable of running Kata Containers
System can currently create Kata Containers

```





## FAQ

Q: 报错如下“ERROR: could not insert 'vhost_vsock': Device or resource busy”

A: 原因是linux 检测到在 vmware 环境中运行时，会加载一些 vmware 的模块并使用 vsock 从而产生了冲突，关闭即可

```bash
sudo tee /etc/modprobe.d/blacklist-vmware.conf << EOF
blacklist vmw_vsock_virtio_transport_common
blacklist vmw_vsock_vmci_transport
EOF
```



# Install Kata Containers with containerd

[Install Kata Containers with containerd](https://github.com/kata-containers/kata-containers/blob/main/docs/install/container-manager/containerd/containerd-install.md)

下载kata二进制包

```bash
xz -d kata-static-2.3.2-x86_64.tar.xz

tar xvf kata-static-2.3.2-x86_64.tar -C /
```



/opt/kata/bin下面把 containerd-shim-kata-v2和kata-runtime复制/usr/local/bin目录
