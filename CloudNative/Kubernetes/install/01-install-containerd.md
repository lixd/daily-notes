# containerd

> containerd 官方文档 [getting-started](https://github.com/containerd/containerd/blob/c76559a6a965c6f606c4f6d1a68f38610961dfb1/docs/getting-started.md)
>
> k8s 官方文档  [container-runtimes#containerd](https://kubernetes.io/zh/docs/setup/production-environment/container-runtimes/#containerd)
>
> [centos 二进制方式安装 containerd](https://mdnice.com/writing/46edb87626804f339b6fe3aaf3c1769c)



## 1. 安装 containerd

安装和配置的先决条件：

```shell
cat <<EOF | sudo tee /etc/modules-load.d/containerd.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter

# 设置必需的 sysctl 参数，这些参数在重新启动后仍然存在。
cat <<EOF | sudo tee /etc/sysctl.d/99-kubernetes-cri.conf
net.bridge.bridge-nf-call-iptables  = 1
net.ipv4.ip_forward                 = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF

# 应用 sysctl 参数而无需重新启动
sudo sysctl --system
```



### yum 方式

安装`yum-utils`包（提供`yum-config-manager` 实用程序）并设置**稳定**的存储库。

> 这部分参考如何安装 Docker：[在 CentOS 上安装 Docker 引擎](https://docs.docker.com/engine/install/centos/)，安装的时候只安装 containerd 即可。

```shell
sudo yum install -y yum-utils


sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo
# 这里可以替换成阿里的源 
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
   
yum install containerd -y
```



### 二进制方式

这里我使用的系统是 `CentOS 7.9`，首先需要安装 **libseccomp** 依赖。

先查看系统有没有libseccomp软件包，centos 7.9 默认安装了 2.3 版本，不过太旧了需要升级

```bash
[root@k8s-1 ~]# rpm -qa | grep libseccomp
libseccomp-2.3.1-4.el7.x86_64
```



```bash
# 卸载原来的
[root@k8s-1 ~]# rpm -e libseccomp-2.3.1-4.el7.x86_64 --nodeps
#下载高于2.4以上的包
[root@k8s-1 ~]# wget http://rpmfind.net/linux/centos/8-stream/BaseOS/x86_64/os/Packages/libseccomp-2.5.1-1.el8.x86_64.rpm

#安装
[root@k8s-1 ~]# rpm -ivh libseccomp-2.5.1-1.el8.x86_64.rpm 
#查看当前版本
[root@k8s-1 ~]# rpm -qa | grep libseccomp
libseccomp-2.5.1-1.el8.x86_64
```

然后去 containerd 的 [release](https://github.com/containerd/containerd/releases) 页面下载对应的压缩包。

有两种压缩包

* [containerd-1.5.11-linux-amd64.tar.gz](https://github.com/containerd/containerd/releases/download/v1.5.11/containerd-1.5.11-linux-amd64.tar.gz)
  * 单独的 containerd
* [cri-containerd-cni-1.5.11-linux-amd64.tar.gz](https://github.com/containerd/containerd/releases/download/v1.5.11/cri-containerd-cni-1.5.11-linux-amd64.tar.gz)
  * containerd + runC

安装了 containerd 也要安装 runC，所以这里直接下载第二个打包好的就行。

```bash
wget https://github.com/containerd/containerd/releases/download/v1.5.11/cri-containerd-cni-1.5.11-linux-amd64.tar.gz
```

可以通过 tar 的 `-t` 选项直接看到压缩包中包含哪些文件：

```bash
[root@localhost ~]# tar -tf cri-containerd-cni-1.5.11-linux-amd64.tar.gz
etc/
etc/cni/
etc/cni/net.d/
etc/cni/net.d/10-containerd-net.conflist
etc/systemd/
etc/systemd/system/
etc/systemd/system/containerd.service
etc/crictl.yaml
usr/
usr/local/
usr/local/bin/
usr/local/bin/containerd-shim-runc-v2
usr/local/bin/containerd-shim
usr/local/bin/crictl
usr/local/bin/ctr
usr/local/bin/containerd-shim-runc-v1
usr/local/bin/containerd
usr/local/bin/ctd-decoder
usr/local/bin/critest
usr/local/bin/containerd-stress
usr/local/sbin/
usr/local/sbin/runc
...
```

可以看到里面有 containerd 和 runc ，而且目录也是对应的，直接解压到各个目录中去，不用收到配置环境变量了都。

```bash
tar -C / -zxvf cri-containerd-cni-1.5.11-linux-amd64.tar.gz
```



## 2. 修改配置

配置 containerd：

```shell
sudo mkdir -p /etc/containerd
# 生成默认配置文件并写入到 config.toml 中
containerd config default | sudo tee /etc/containerd/config.toml
```



**使用 `systemd` cgroup 驱动程序**

> 注意：cri 使用的 cgroup 和 kubelet 使用的 cgroup 最好是一致的，如果使用 kubeadm 安装的那么 kubelet 也默认使用 systemd cgroup。

结合 `runc` 使用 `systemd` cgroup 驱动，在 `/etc/containerd/config.toml` 中设置

```toml
vim /etc/containerd/config.toml

# 把配置文件中的 SystemdCgroup 修改为 true
[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
  ...
  [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
    SystemdCgroup = true
```

```BASH
#一键替换
sed 's/SystemdCgroup = false/SystemdCgroup = true/g' /etc/containerd/config.toml
```



用国内源替换 containerd 默认的 sand_box 镜像，编辑 /etc/containerd/config.toml 

```shell
[plugins]
  .....
  [plugins."io.containerd.grpc.v1.cri"]
  	...
	sandbox_image = "registry.aliyuncs.com/google_containers/pause:3.5"
```

```bash
#一键替换
# 需要对路径中的/ 进行转移，替换成\/
sed 's/k8s.gcr.io\/pause/registry.aliyuncs.com\/google_containers\/pause/g' /etc/containerd/config.toml
```



**配置镜像加速器地址**

然后再为镜像仓库配置一个加速器，需要在 cri 配置块下面的 `registry` 配置块下面进行配置 `registry.mirrors`：（注意缩进）

> 比较麻烦，只能手动替换了

> 镜像来源：[ registry-mirrors](https://github.com/muzi502/registry-mirrors)

```bash
[plugins."io.containerd.grpc.v1.cri".registry]
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
  # 添加下面两个配置
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
      endpoint = ["https://ekxinbbh.mirror.aliyuncs.com"]
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."k8s.gcr.io"]
      endpoint = ["https://gcr.k8s.li"]
```



## 3. 测试

启动 containerd

```shell
systemctl daemon-reload
systemctl enable containerd --now
```

验证

启动完成后就可以使用 containerd 的本地 CLI 工具 `ctr` 和了，比如查看版本：

```
ctr version
```



## 4. Other

### crictl 和 ctr

* `ctr` 是 containerd 的一个客户端工具。
* `crictl` 是 CRI 兼容的容器运行时命令行接口，可以使用它来检查和调试 k8s 节点上的容器运行时和应用程序。
  * 安装 k8s 时会顺带被安装上


`ctr -v` 输出的是 containerd 的版本，`crictl -v` 输出的是当前 k8s 的版本，从结果显而易见你可以认为 crictl 是用于 k8s 的。



### crictl 配置

安装 containerd 后执行 crictl 命令一直报 endpoint 错误，可以在 /etc/crictl.yaml 文件中配置对应的 endpoint。

```
cat > /etc/crictl.yaml << EOF
runtime-endpoint: unix:///run/containerd/containerd.sock
EOF
```

后续执行就正常了。

