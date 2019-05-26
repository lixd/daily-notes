# 使用 kubeadm 配置 slave 节点

## 概述

将 slave 节点加入到集群中很简单，只需要在 slave 服务器上安装 kubeadm，kubectl，kubelet 三个工具，然后使用 `kubeadm join` 命令加入即可。准备工作如下：

- 修改主机名
- 配置软件源
- 安装三个工具

## 将 slave 加入到集群

```bash
# 这就是前面安装Master节点时日志中的提示
kubeadm join 192.168.1.6:6443 --token abcdef.0123456789abcdef \
    --discovery-token-ca-cert-hash sha256:b3e208b8f585608c9a093622b5aeb7441abb3199db93ab99ca7b33ecda29f736 

# 安装成功将看到如下信息
[preflight] Running pre-flight checks
        [WARNING IsDockerSystemdCheck]: detected "cgroupfs" as the Docker cgroup driver. The recommended driver is "systemd". Please follow the guide at https://kubernetes.io/docs/setup/cri/
[preflight] Reading configuration from the cluster...
[preflight] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -oyaml'
[kubelet-start] Downloading configuration for the kubelet from the "kubelet-config-1.14" ConfigMap in the kube-system namespace
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Activating the kubelet service
[kubelet-start] Waiting for the kubelet to perform the TLS Bootstrap...

This node has joined the cluster:
* Certificate signing request was sent to apiserver and a response was received.
* The Kubelet was informed of the new secure connection details.

Run 'kubectl get nodes' on the control-plane to see this node join the cluster.
```

说明：

- token
  - 可以通过安装 master 时的日志查看 token 信息
  - 可以通过 `kubeadm token list` 命令打印出 token 信息
  - 如果 token 过期，可以使用 `kubeadm token create` 命令创建新的 token
- discovery-token-ca-cert-hash
  - 可以通过安装 master 时的日志查看 sha256 信息
  - 可以通过 `openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -hex | sed 's/^.* //'` 命令查看 sha256 信息

## 验证是否成功

回到 master 服务器

```bash
kubectl get nodes

# 可以看到 slave 成功加入 master
NAME                STATUS     ROLES    AGE   VERSION
kubernetes-master   NotReady   master   19m   v1.14.2
kubernetes-slave1   NotReady   <none>   30s   v1.14.2
kubernetes-slave2   NotReady   <none>   37s   v1.14.2

```

## 查看 pod 状态

```bash
kubectl get pod -n kube-system -o wide

NAME                                        READY   STATUS              RESTARTS   AGE   IP            NODE                NOMINATED NODE   READINESS GATES
coredns-8686dcc4fd-pwd4d                    0/1     Pending             0          20m   <none>        <none>              <none>           <none>
coredns-8686dcc4fd-t2h92                    0/1     Pending             0          20m   <none>        <none>              <none>           <none>
etcd-kubernetes-master                      1/1     Running             0          19m   192.168.1.6   kubernetes-master   <none>           <none>
kube-apiserver-kubernetes-master            1/1     Running             0          19m   192.168.1.6   kubernetes-master   <none>           <none>
kube-controller-manager-kubernetes-master   1/1     Running             0          19m   192.168.1.6   kubernetes-master   <none>           <none>
kube-proxy-46r7l                            0/1     ContainerCreating   0          84s   192.168.1.8   kubernetes-slave2   <none>           <none>
kube-proxy-jhbll                            0/1     ContainerCreating   0          77s   192.168.1.7   kubernetes-slave1   <none>           <none>
kube-proxy-s24tc                            1/1     Running             0          20m   192.168.1.6   kubernetes-master   <none>           <none>
kube-scheduler-kubernetes-master            1/1     Running             0          19m   192.168.1.6   kubernetes-master   <none>           <none>

```

由此可以看出 coredns 尚未运行，此时我们还需要安装网络插件。