# kata container 安装



## 0. 环境准备

用的是 VMware 跑的虚拟机，CentOS 7，2C4G。

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

官方推荐的两种安装方式：

* [Official packages](https://github.com/kata-containers/kata-containers/tree/main/docs/install#official-packages)
  * 对于CentOS需要8.0及以上版本才行
* [Snap Installation](https://github.com/kata-containers/kata-containers/tree/main/docs/install#snap-installation)
  * 只要支持 snap 的 linux 发行版就行

这里用的是 CentOS7 所以只能选择 snap 方式安装。

### [安装 snap](https://snapcraft.io/docs/installing-snap-on-centos)

```bash
# 安装 EPEL
yum install epel-release
# 安装 snapd
yum install snapd
# 添加snap启动通信 socket
systemctl enable --now snapd.socket
# 创建链接（snap软件包一般安装在/snap目录下）
ln -s /var/lib/snapd/snap /snap
```



### 安装 kata containers

然后安装 kata containers

```bash
sudo snap install kata-containers --stable --classic
```

有时候会出现下面这个错：

```bash
error: too early for operation, device not yet seeded or device model not acknowledged
```

应该是还在初始化，等一会在安装即可。



安装好创建了软链接方便使用

```bash
sudo ln -s /snap/kata-containers/current/usr/bin/kata-runtime /usr/bin/kata-runtime
```

```bash
$ kata-runtime -v
kata-runtime  : 2.4.0
   commit   : 0ad6f05dee04dec2a653806dc7d84d2bebf50175
   OCI specs: 1.0.2-dev
```



### 配置 kata

```bash
sudo mkdir -p /etc/kata-containers
sudo cp /snap/kata-containers/current/usr/share/defaults/kata-containers/configuration.toml /etc/kata-containers/
# 可以自定义配置，需要需要的话
vim /etc/kata-containers/configuration.toml
```

和 shim v2 集成，创建一个软链接到`/usr/local/bin/`目录便于 containerd 能找到

```bash
sudo ln -sf /snap/kata-containers/current/usr/bin/containerd-shim-kata-v2 /usr/local/bin/containerd-shim-kata-v2
```



### 测试

安装后二进制文件在`/snap/kata-containers/current/usr/bin`目录，测试一下系统是否支持

```bash
# 添加个软链接方便使用
sudo ln -sf /snap/kata-containers/current/usr/bin/kata-runtime /usr/bin/kata-runtime
kata-runtime check
WARN[0000] Not running network checks as super user      arch=amd64 name=kata-runtime pid=5848 source=runtime
System is capable of running Kata Containers
System can currently create Kata Containers
```



### 删除

```bash
sudo snap remove kata-containers
```



## 2. 使用 containerd 运行kata容器

### 配置 containerd

[Install Kata Containers with containerd](https://github.com/kata-containers/kata-containers/blob/main/docs/install/container-manager/containerd/containerd-install.md)

具体怎么安装 containerd 就不写了。

需要先配置 containerd，containerd 默认配置文件在`/etc/containerd/config.toml`，需要增加以下内容：

> 注意空格对齐

```bash
[plugins]
  [plugins."io.containerd.grpc.v1.cri"]
    [plugins."io.containerd.grpc.v1.cri".containerd]
      [plugins."io.containerd.grpc.v1.cri".containerd.runtimes]
        [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.kata]
          runtime_type = "io.containerd.kata.v2"
```

其他的默认都有主要就是加了这一段

```bash
        [plugins."io.containerd.grpc.v1.cri".containerd.runtimes.kata]
          runtime_type = "io.containerd.kata.v2"
```

配置好后重启containerd

```bash
systemctl restart containerd
```



### 测试

接着测试一下

```bash
image="docker.io/library/busybox:latest"
sudo ctr image pull "$image"
sudo ctr run --runtime "io.containerd.kata.v2" --rm -t "$image" test-kata uname -r
```

正常情况会打印出内核版本号。

测试的时候出现了点问题：

```bash
failed to create shim: /etc/kata-containers/configuration.toml: host system doesn't support vsock: stat /dev/vhost-vsock: no such file or directory: unknown
```

具体解决方案见 FAQ。

### FAQ

Q1：`ctr run `报错ctr: failed to create shim: /etc/kata-containers/configuration.toml: host system doesn't support vsock: stat /dev/vhost-vsock: no such file or directory: unknown

A：缺少模块，加载一下即可

```bash
modprobe vhost-vsock
```

> 好像是每次重启完虚拟机都要执行一下。



Q2: `modprobe vhost-vsock`报错如下“ERROR: could not insert 'vhost_vsock': Device or resource busy”

A: 原因是linux 检测到在 vmware 环境中运行时，会加载一些 vmware 的模块并使用 vsock 从而产生了冲突，关闭重启即可

```bash
sudo tee /etc/modprobe.d/blacklist-vmware.conf << EOF
blacklist vmw_vsock_virtio_transport_common
blacklist vmw_vsock_vmci_transport
EOF
```

修改后重启机器。



Q3：ctr: failed to create shim: Failed to Check if grpc server is working: rpc error: code = DeadlineExceeded desc = timed out connecting to vsock 3405979552:1024: unknown

A：内核版本问题，从3.10版本升级到5.17后就可以了，具体见[#1631](https://github.com/kata-containers/kata-containers/issues/1631)

> [Linux 升级内核步骤](https://www.jianshu.com/p/01da982ce8d3)



## 3. Run Kata Containers with Kubernetes

[Run Kata Containers with Kubernetes](https://github.com/kata-containers/kata-containers/blob/main/docs/how-to/run-kata-with-k8s.md#create-runtime-class-for-kata-containers)

直接用 containerd 运行没问题了，现在测试一下和 k8s 集成。

> 需要先有个 k8s 集群，然后每个节点上都装了 kata 并配置了 containerd。

### runtimeClass

k8s 在 1.12 版本增加了新的资源对象`RuntimeClass`用于指定单个 Pod 的 runtime。

```bash
$ cat > runtime.yaml <<EOF
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: kata
handler: kata
EOF

$ sudo -E kubectl apply -f runtime.yaml
```



### run

Create an pod configuration that using Kata Containers runtime。

> If a pod has the `runtimeClassName` set to `kata`, the CRI plugin runs the pod with the [Kata Containers runtime](https://github.com/kata-containers/kata-containers/blob/main/src/runtime/README.md).

```bash
cat << EOF | tee nginx-kata.yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-kata
spec:
  runtimeClassName: kata
  containers:
  - name: nginx
    image: nginx

EOF
```

Create the pod

```
$ sudo -E kubectl apply -f nginx-kata.yaml
```

Check pod is running

```
$ sudo -E kubectl get pods
```

Check hypervisor is running

```
$ ps aux | grep qemu
```

输出如下：

> 多个节点的话，需要先确定 pod 是运行再哪个节点上的。

```bash
$ ps aux | grep qemu
root       9052  0.0  0.0  76416  1516 ?        Sl   00:39   0:00 /snap/kata-containers/current/usr/libexec/kata-qemu/virtiofsd --syslog -o cache=auto -o no_posix_lock -o source=/run/kata-containers/shared/sandboxes/bf62e0d4a09cc09c4723ceab9294449ab64432c1d673e773b1ce9d325c29f264/shared --fd=3 -f --thread-pool-size=1 -o announce_submounts
root       9058  0.9  3.4 2536944 138560 ?      Sl   00:39   0:01 /var/lib/snapd/snap/kata-containers/2167/usr/bin/qemu-system-x86_64 -name sandbox-bf62e0d4a09cc09c4723ceab9294449ab64432c1d673e773b1ce9d325c29f264 -uuid 0860b829-52e8-4dd8-bb91-ee2b1d9d8dfb -machine q35,accel=kvm,kernel_irqchip=on,nvdimm=on -cpu host,pmu=off -qmp unix:/run/vc/vm/bf62e0d4a09cc09c4723ceab9294449ab64432c1d673e773b1ce9d325c29f264/qmp.sock,server=on,wait=off -m 2048M,slots=10,maxmem=4925M -device pci-bridge,bus=pcie.0,id=pci-bridge-0,chassis_nr=1,shpc=off,addr=2,io-reserve=4k,mem-reserve=1m,pref64-reserve=1m -device virtio-serial-pci,disable-modern=true,id=serial0 -device virtconsole,chardev=charconsole0,id=console0 -chardev socket,id=charconsole0,path=/run/vc/vm/bf62e0d4a09cc09c4723ceab9294449ab64432c1d673e773b1ce9d325c29f264/console.sock,server=on,wait=off -device nvdimm,id=nv0,memdev=mem0,unarmed=on -object memory-backend-file,id=mem0,mem-path=/var/lib/snapd/snap/kata-containers/2167/usr/share/kata-containers/kata-containers.img,size=134217728,readonly=on -device virtio-scsi-pci,id=scsi0,disable-modern=true -object rng-random,id=rng0,filename=/dev/urandom -device virtio-rng-pci,rng=rng0 -device vhost-vsock-pci,disable-modern=true,vhostfd=3,id=vsock-2263420620,guest-cid=2263420620 -chardev socket,id=char-35af28c3fba3844b,path=/run/vc/vm/bf62e0d4a09cc09c4723ceab9294449ab64432c1d673e773b1ce9d325c29f264/vhost-fs.sock -device vhost-user-fs-pci,chardev=char-35af28c3fba3844b,tag=kataShared -netdev tap,id=network-0,vhost=on,vhostfds=4,fds=5 -device driver=virtio-net-pci,netdev=network-0,mac=3e:0f:e9:ab:1b:5b,disable-modern=true,mq=on,vectors=4 -rtc base=utc,driftfix=slew,clock=host -global kvm-pit.lost_tick_policy=discard -vga none -no-user-config -nodefaults -nographic --no-reboot -daemonize -object memory-backend-file,id=dimm1,size=2048M,mem-path=/dev/shm,share=on -numa node,memdev=dimm1 -kernel /var/lib/snapd/snap/kata-containers/2167/usr/share/kata-containers/vmlinux-5.15.26.container -append tsc=reliable no_timer_check rcupdate.rcu_expedited=1 i8042.direct=1 i8042.dumbkbd=1 i8042.nopnp=1 i8042.noaux=1 noreplace-smp reboot=k console=hvc0 console=hvc1 cryptomgr.notests net.ifnames=0 pci=lastbus=0 root=/dev/pmem0p1 rootflags=dax,data=ordered,errors=remount-ro ro rootfstype=ext4 quiet systemd.show_status=false panic=1 nr_cpus=2 systemd.unit=kata-containers.target systemd.mask=systemd-networkd.service systemd.mask=systemd-networkd.socket scsi_mod.scan=none -pidfile /run/vc/vm/bf62e0d4a09cc09c4723ceab9294449ab64432c1d673e773b1ce9d325c29f264/pid -smp 1,cores=1,threads=1,sockets=2,maxcpus=2
root       9061  0.0  0.3 2468496 12440 ?       Sl   00:39   0:00 /snap/kata-containers/current/usr/libexec/kata-qemu/virtiofsd --syslog -o cache=auto -o no_posix_lock -o source=/run/kata-containers/shared/sandboxes/bf62e0d4a09cc09c4723ceab9294449ab64432c1d673e773b1ce9d325c29f264/shared --fd=3 -f --thread-pool-size=1 -o announce_submounts

```



### delete

```
sudo -E kubectl delete -f nginx-kata.yaml
```
