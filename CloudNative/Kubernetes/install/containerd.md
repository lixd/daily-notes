# containerd

## [containerd](https://kubernetes.io/zh/docs/setup/production-environment/container-runtimes/#containerd)



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



安装`yum-utils`包（提供`yum-config-manager` 实用程序）并设置**稳定**的存储库。

> 这部分参考如何安装 Docker：[在 CentOS 上安装 Docker 引擎](https://docs.docker.com/engine/install/centos/)，安装的时候只安装 containerd 即可。

```shell
sudo yum install -y yum-utils

# 这里可以替换成阿里的源 
# yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo

   
yum install containerd -y
```

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
# 把配置文件中的 SystemdCgroup 修改为 true
[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
  ...
  [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
    SystemdCgroup = true
```



用国内源替换 containerd 默认的 sand_box 镜像，编辑 /etc/containerd/config.toml 

```shell
[plugins]
  .....
  [plugins."io.containerd.grpc.v1.cri"]
  	...
	sandbox_image = "registry.aliyuncs.com/google_containers/pause:3.5"
```

**配置镜像加速器地址**

然后再为镜像仓库配置一个加速器，需要在 cri 配置块下面的 `registry` 配置块下面进行配置 `registry.mirrors`：（注意缩进）

> 镜像来源：[ registry-mirrors](https://github.com/muzi502/registry-mirrors)

```bash
$ vim /etc/containerd/config.toml

[plugins."io.containerd.grpc.v1.cri".registry]
  [plugins."io.containerd.grpc.v1.cri".registry.mirrors]
  # 添加下面两个配置
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."docker.io"]
      endpoint = ["https://ekxinbbh.mirror.aliyuncs.com"]
    [plugins."io.containerd.grpc.v1.cri".registry.mirrors."k8s.gcr.io"]
      endpoint = ["https://gcr.k8s.li"]
```



启动 containerd

```shell
systemctl daemon-reload
systemctl enable containerd --now
```



## 验证

启动完成后就可以使用 containerd 的本地 CLI 工具 `ctr` 和 `crictl` 了，比如查看版本：

```
ctr version
crictl version
```



## ctr 和 crictl

* `ctr` 是 containerd 的一个客户端工具。
* `crictl` 是 CRI 兼容的容器运行时命令行接口，可以使用它来检查和调试 k8s 节点上的容器运行时和应用程序。

`ctr -v` 输出的是 containerd 的版本，`crictl -v` 输出的是当前 k8s 的版本，从结果显而易见你可以认为 crictl 是用于 k8s 的。



### crictl 配置

安装 containerd 后执行 crictl 命令一直报 endpoint 错误，可以在/etc/crictl.yaml文件中配置对应的 endpoint。

```
cat > /etc/crictl.yaml << EOF
runtime-endpoint: unix:///run/containerd/containerd.sock
EOF
```

后续执行就正常了。

