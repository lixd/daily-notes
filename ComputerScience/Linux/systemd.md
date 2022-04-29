# systemd

[Systemd 入门教程：命令篇](https://www.ruanyifeng.com/blog/2016/03/systemd-tutorial-commands.html)

[Systemd 入门教程：实战篇](https://www.ruanyifeng.com/blog/2016/03/systemd-tutorial-part-two.html)

[Linux 的小伙伴 systemd 详解](https://blog.k8s.li/systemd.html)

## FAQ

**如何通过一个 systemd units 找到对应的 systemd service 配置文件**

```bash
# 语法：systemctl show {serverName} | grep -E "FragmentPath|DropInPaths"
# 例子
[root@kc1 deploy]# systemctl show kubelet|grep -E "FragmentPath|DropInPaths"
FragmentPath=/etc/systemd/system/kubelet.service
DropInPaths=/etc/systemd/system/kubelet.service.d/10-kubeadm.conf
```

此外，systemctl show 还会显示当前 server 对应的各种底层参数。

也可以使用`systemctl cat {serverNmae}` 来查询，systemctl cat {serverNmae} 会显示配置文件内容以及对应的路径

```bash
[root@kc1 deploy]# systemctl cat kubelet
# /etc/systemd/system/kubelet.service
[Unit]
Description=kubelet: The Kubernetes Node Agent
... 省略


# /etc/systemd/system/kubelet.service.d/10-kubeadm.conf
# Note: This dropin only works with kubeadm and kubelet v1.11+
[Service]
 ... 省略
Environment="KUBELET_KUBECONFIG_ARGS=--bootstrap-
ExecStart=
ExecStart=/usr/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_KUBEADM_ARGS $KUBELET_EXTRA_ARGS
```

