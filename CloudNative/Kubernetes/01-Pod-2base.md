# Pod 对象

> [官方文档](https://kubernetes.io/docs/concepts/workloads/pods/)



## 2. Pod 基本概念

Pod 扮演的是传统部署环境里“虚拟机”的角色。所以凡是调度、网络、存储，以及安全相关的属性，基本上是 Pod 级别的。

> 这些属性的共同特征是，它们描述的是“机器”这个整体

### 1. Fields

**NodeSelector **：是一个供用户将 Pod 与 Node 进行绑定的字段。

```yaml
apiVersion: v1
kind: Pod
...
spec:
 nodeSelector:
   disktype: ssd
```

**NodeName**：Pod具体调度到的节点。

一旦 Pod 的这个字段被赋值，Kubernetes 项目就会被认为这个 Pod 已经经过了调度，调度的结果就是赋值的节点名字。所以，这个字段一般由调度器负责设置，但用户也可以设置它来“骗过”调度器，当然这个做法一般是在测试或者调试的时候才会用到。

**HostAliases**：定义了 Pod 的 hosts 文件（比如 /etc/hosts）里的内容

```yaml
apiVersion: v1
kind: Pod
...
spec:
  hostAliases:
  - ip: "10.1.2.3"
    hostnames:
    - "foo.remote"
    - "bar.remote"
...
```

这样，这个 Pod 启动后，/etc/hosts 文件的内容将如下所示：

```sh
cat /etc/hosts
# Kubernetes-managed hosts file.
127.0.0.1 localhost
...
10.244.135.10 hostaliases-pod
10.1.2.3 foo.remote
10.1.2.3 bar.remote
```

最后两行就是通过 hostnames 指定的。

> 如果要修改hostname 一定要通过HostAliases指定



**凡是跟容器的 Linux Namespace 相关的属性和Pod 中的容器要共享宿主机的 Namespace，也一定是 Pod 级别的**。

这个原因也很容易理解：Pod 的设计，就是要让它里面的容器尽可能多地共享 Linux Namespace，仅保留必要的隔离和限制能力。

比如下面的Pod定义：

Pod中的容器共享PID Namespace，而且会共享宿主机的Network、IPC 和 PID Namespace。

```yaml
---
apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  # 共享PID Namespace
  shareProcessNamespace: true
  # 共享宿主机的 Network、IPC 和 PID Namespace
  hostNetwork: true
  hostIPC: true
  hostPID: true
  containers:
  - name: nginx
    image: nginx
  - name: shell
    image: busybox
    stdin: true
    tty: true
```



**Containers**

Pod 中最重要的字段当然是**Containers**了。

**首先，是 ImagePullPolicy 字段**，它定义了镜像拉取的策略，默认是 Always即每次创建 Pod 都重新拉取一次镜像。

**其次，是 Lifecycle 字段。**它定义的是 Container Lifecycle Hooks，在容器状态发生变化时触发一系列“钩子”。

```yaml
---
apiVersion: v1
kind: Pod
metadata:
  name: lifecycle-demo
spec:
  containers:
  - name: lifecycle-demo-container
    image: nginx
    lifecycle:
      postStart:
        exec:
          command: ["/bin/sh", "-c", "echo Hello from the postStart handler > /usr/share/message"]
      preStop:
        exec:
          command: ["/usr/sbin/nginx","-s","quit"]
```

postStart 容器启动后通过 echo 命令写入一段欢迎信息。

> 执行在 Docker 容器 ENTRYPOINT 执行之后，但不保证严格顺序，也就是说，在 postStart 启动时，ENTRYPOINT 有可能还没有结束。

preStop 容器被杀死之前（比如，收到了 SIGKILL 信号）调用 nginx 退出命令，优雅停止。

> 而需要明确的是，preStop 操作的执行，是同步的。所以，它会**阻塞**当前的容器杀死流程，直到这个 Hook 定义操作完成之后，才允许容器被杀死，这跟 postStart 不一样。



### 2. Status

Pod 生命周期的变化，主要体现在 Pod API 对象的 Status 部分，这是它除了 Metadata 和 Spec 之外的第三个重要字段。其中，pod.status.phase，就是 Pod 的当前状态，它有如下几种可能的情况：

1. **Pending**。这个状态意味着，Pod 的 YAML 文件已经提交给了 Kubernetes，API 对象已经被创建并保存在 Etcd 当中。但是，这个 Pod 里有些容器因为某种原因而不能被顺利创建。比如，调度不成功。
2. **Running**。这个状态下，Pod 已经调度成功，跟一个具体的节点绑定。它包含的容器都已经创建成功，并且至少有一个正在运行中。
3. **Succeeded**。这个状态意味着，Pod 里的所有容器都正常运行完毕，并且已经退出了。这种情况在运行一次性任务时最为常见。
4. **Failed**。这个状态下，Pod 里至少有一个容器以不正常的状态（非 0 的返回码）退出。这个状态的出现，意味着你得想办法 Debug 这个容器的应用，比如查看 Pod 的 Events 和日志。
5. **Unknown**。这是一个异常状态，意味着 Pod 的状态不能持续地被 kubelet 汇报给 kube-apiserver，这很有可能是主从节点（Master 和 Kubelet）间的通信出现了问题。



更进一步地，Pod 对象的 Status 字段，还可以再细分出一组 Conditions。这些细分状态的值包括：`PodScheduled`、`Ready`、`Initialized`，以及 `Unschedulable`。它们主要用于描述造成当前 Status 的具体原因是什么。

比如，Pod 当前的 Status 是 Pending，对应的 Condition 是 Unschedulable，这就意味着它的调度出现了问题。

