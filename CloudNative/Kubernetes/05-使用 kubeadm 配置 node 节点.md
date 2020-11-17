# 使用 kubeadm 配置 slave 节点

## 概述

将 node节点加入到集群中很简单，只需要在 node 节点上安装 kubeadm，kubectl，kubelet 三个工具，然后使用 `kubeadm join` 命令加入即可。

## 将 slave 加入到集群

```bash
# 这就是前面安装Master节点时日志中的提示
kubeadm join 192.168.2.110:6443 --token abcdef.0123456789abcdef \
    --discovery-token-ca-cert-hash sha256:1a76f9a88d7aa3a0def97ec7f57c2d4c5f342be4270e96f08a0140eddf0b4e1f 

# 安装成功将看到如下信息
root@docker:/usr/local/k8s# kubeadm join 192.168.2.110:6443 --token abcdef.0123456789abcdef \
>     --discovery-token-ca-cert-hash sha256:1a76f9a88d7aa3a0def97ec7f57c2d4c5f342be4270e96f08a0140eddf0b4e1f
[preflight] Running pre-flight checks
	[WARNING IsDockerSystemdCheck]: detected "cgroupfs" as the Docker cgroup driver. The recommended driver is "systemd". Please follow the guide at https://kubernetes.io/docs/setup/cri/
[preflight] Reading configuration from the cluster...
[preflight] FYI: You can look at this config file with 'kubectl -n kube-system get cm kubeadm-config -oyaml'
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
[kubelet-start] Writing kubelet environment file with flags to file "/var/lib/kubelet/kubeadm-flags.env"
[kubelet-start] Starting the kubelet
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

在 master 节点执行如下命令：

```bash
kubectl get nodes

# 可以看到 两个node节点 成功加入集群
root@docker:/usr/local/k8s# kubectl get nodes
NAME                STATUS     ROLES    AGE   VERSION
kubernetes-master   NotReady   master   15m   v1.19.4
kubernetes-node1    NotReady   <none>   49s   v1.19.4
kubernetes-node2    NotReady   <none>   43s   v1.19.4
```

## 查看 pod 状态





```bash
$ kubectl get pod -n kube-system -o wide

root@kubernetes-master:/usr/local/docker/kubernetes# kubectl get pod -n kube-system -o wide
NAME                                        READY   STATUS    RESTARTS   AGE   IP              NODE                NOMINATED NODE   READINESS GATES
coredns-7ff77c879f-g8s2r                    0/1     Pending   0          19m   <none>          <none>              <none>           <none>
coredns-7ff77c879f-l6grx                    0/1     Pending   0          19m   <none>          <none>              <none>           <none>
etcd-kubernetes-master                      1/1     Running   0          19m   192.168.1.113   kubernetes-master   <none>           <none>
kube-apiserver-kubernetes-master            1/1     Running   0          19m   192.168.1.113   kubernetes-master   <none>           <none>
kube-controller-manager-kubernetes-master   1/1     Running   0          19m   192.168.1.113   kubernetes-master   <none>           <none>
kube-proxy-wlpfh                            1/1     Running   0          60s   192.168.1.115   kubernetes-slave2   <none>           <none>
kube-proxy-zckm2                            1/1     Running   0          19m   192.168.1.113   kubernetes-master   <none>           <none>
kube-proxy-zhc7s                            1/1     Running   0          55s   192.168.1.114   kubernetes-slave1   <none>           <none>
kube-scheduler-kubernetes-master            1/1     Running   0          19m   192.168.1.113   kubernetes-master   <none>           <none>

```

由此可以看出 coredns 尚未运行，此时我们还需要安装网络插件。



```shell
You should now deploy a pod network to the cluster.
Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
  https://kubernetes.io/docs/concepts/cluster-administration/addons/
```

