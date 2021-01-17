# 声明式API与Kubernetes编程范式

## 1. 概述

命令式命令行操作

> 即命令行中直接传递参数

```sh
$ docker service create --name nginx --replicas 2  nginx
$ docker service update --image nginx:1.7.9 nginx
```



命令式配置文件操作

> 即命令行中只指定配置文件 参数都在配置文件中

```sh
$ docker-compose -f elk.yaml up
$ kubectl create -f nginx.yaml
# 修改nginx.yaml 比如更新nginx版本号
$ kubectl replace -f nginx.yaml
```

虽然参数都放到配置文件中去了，但是 create 的时候要用create命令，更新又要用 replace 或者 update 命令。用户还是需要记住当前是什么状态。



声明式API

```sh
$ kubectl apply -f nginx.yaml
# 修改nginx.yaml 比如更新nginx版本号
$ kubectl apply -f nginx.yaml
```

不管什么状态 都是 apply，极大降低用户心智负担。

> k8s 也不管当前是什么状态 最终调整到用户指定的状态就对了。

实际上，你可以简单地理解为，kubectl replace 的执行过程，是使用新的 YAML 文件中的 API 对象，替换原有的 API 对象；而 kubectl apply，则是执行了一个对原有 API 对象的 PATCH 操作。

> 类似地，kubectl set image 和 kubectl edit 也是对已有 API 对象的修改。

这意味着 kube-apiserver 在响应命令式请求（比如，kubectl replace）的时候，一次只能处理一个写请求，否则会有产生冲突的可能。而对于声明式请求（比如，kubectl apply），**一次能处理多个写操作，并且具备 Merge 能力**。



## 2. Istio

Istio 最根本的组件，是运行在每一个应用 Pod 里的 Envoy 容器。

Istio把这个代理服务 Envoy 以 sidecar 容器的方式，运行在了每一个被治理的应用 Pod 中。

我们知道，Pod 里的所有容器都共享同一个 Network Namespace。所以，Envoy 容器就能够通过配置 Pod 里的 iptables 规则，把整个 Pod 的进出流量接管下来。

实际上，**Istio 项目使用的，是 Kubernetes 中的一个非常重要的功能，叫作 Dynamic Admission Control 或者 Initializer**。

> 新版本 Initializer 被废弃后换成了 admission hook

在 Pod 的 YAML 文件被提交给 Kubernetes 之后，Istio 要做的就是在它对应的 API 对象里自动加上 Envoy 容器的配置。

比如 YAML 文件如下

```yaml
---
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
  labels:
    app: myapp
spec:
  containers:
  - name: myapp-container
    image: busybox
    command: ['sh', '-c', 'echo Hello Kubernetes! && sleep 3600']
```

进过 Istio 配置之后

```yaml
---
apiVersion: v1
kind: Pod
metadata:
  name: myapp-pod
  labels:
    app: myapp
spec:
  containers:
  - name: myapp-container
    image: busybox
    command: ['sh', '-c', 'echo Hello Kubernetes! && sleep 3600']
  - name: envoy
    image: lyft/envoy:845747b88f102c0fd262ab234308e9e22f693a1
    command: ["/usr/local/bin/envoy"]
    ...
```

可以看到，被 Istio 处理后的这个 Pod 里，除了用户自己定义的 myapp-container 容器之外，多出了一个叫作 envoy 的容器，它就是 Istio 要使用的 Envoy 代理。



为了在 用户完全不知情的前提下完成这个操作，Istio 要做的，就是编写一个用来为 Pod“自动注入”Envoy 容器的 Initializer。

**首先，Istio 会将这个 Envoy 容器本身的定义，以 ConfigMap 的方式保存在 Kubernetes 当中。**

```yaml
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: envoy-initializer
data:
  config: |
    containers:
      - name: envoy
        image: lyft/envoy:845747db88f102c0fd262ab234308e9e22f693a1
        command: ["/usr/local/bin/envoy"]
        args:
          - "--concurrency 4"
          - "--config-path /etc/envoy/envoy.json"
          - "--mode serve"
        ports:
          - containerPort: 80
            protocol: TCP
        resources:
          limits:
            cpu: "1000m"
            memory: "512Mi"
          requests:
            cpu: "100m"
            memory: "64Mi"
        volumeMounts:
          - name: envoy-conf
            mountPath: /etc/envoy
    volumes:
      - name: envoy-conf
        configMap:
          name: envoy
```

这个 ConfigMap 的 data 部分，正是一个 Pod 对象的一部分定义。其中，我们可以看到 Envoy 容器对应的 containers 字段，以及一个用来声明 Envoy 配置文件的 volumes 字段。



Initializer 要做的工作，就是把这部分 Envoy 相关的字段，自动添加到用户提交的 Pod 的 API 对象里。可是，用户提交的 Pod 里本来就有 containers 字段和 volumes 字段，所以 Kubernetes 在处理这样的更新请求时，就必须使用类似于 git merge 这样的操作，才能将这两部分内容合并在一起。

所以说，在 Initializer 更新用户的 Pod 对象的时候，必须使用 PATCH API 来完成。**而这种 PATCH API，正是声明式 API 最主要的能力**。



**接下来，Istio 将一个编写好的 Initializer，作为一个 Pod 部署在 Kubernetes 中。**

```yaml
---
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: envoy-initializer
  name: envoy-initializer
spec:
  containers:
    - name: envoy-initializer
      image: envoy-initializer:0.0.1
      imagePullPolicy: Always
```

其中的 envoy-initializer:0.0.1 镜像就是一个事先编写好的“自定义控制器”（Custom Controller）。



控制器控制的就是当前Pod是否被初始化过(即添加 Envoy 容器)，没有就进行初始化。伪代码如下

```go
for {
  // 获取新创建的Pod
  pod := client.GetLatestPod()
  // Diff一下，检查是否已经初始化过
  if !isInitialized(pod) {
    // 没有？那就来初始化一下
    doSomething(pod)
  }
}
```



```go

func doSomething(pod) {
  // 首先从 ConfigMap 中获取数据
  cm := client.Get(ConfigMap, "envoy-initializer")
  // 然后创建 Pod
  newPod := Pod{}
  newPod.Spec.Containers = cm.Containers
  newPod.Spec.Volumes = cm.Volumes

  // 生成patch数据
  patchBytes := strategicpatch.CreateTwoWayMergePatch(pod, newPod)

  // 发起PATCH请求，修改这个pod对象
  client.Patch(pod.Name, patchBytes)
}
```

这样，一个用户提交的 Pod 对象里，就会被自动加上 Envoy 容器相关的字段。



当然，Kubernetes 还允许你通过配置，来指定要对什么样的资源进行这个 Initialize 操作，比如下面这个例子：

```yaml
---
apiVersion: admissionregistration.k8s.io/v1alpha1
kind: InitializerConfiguration
metadata:
  name: envoy-config
initializers:
  // 这个名字必须至少包括两个 "."
  - name: envoy.initializer.kubernetes.io
    rules:
      - apiGroups:
          - "" // 前面说过， ""就是core API Group的意思
        apiVersions:
          - v1
        resources:
          - pods
```

这个配置，就意味着 Kubernetes 要对所有的 Pod 进行这个 Initialize 操作，并且，我们指定了负责这个操作的 Initializer，名叫：envoy-initializer。

而一旦这个 InitializerConfiguration 被创建，Kubernetes 就会把这个 Initializer 的名字，加在所有新创建的 Pod 的 Metadata 上，格式如下所示：

```yaml
---
apiVersion: v1
kind: Pod
metadata:
  initializers:
    pending:
      - name: envoy.initializer.kubernetes.io
  name: myapp-pod
  labels:
    app: myapp
...
```

这个 Metadata，正是接下来 Initializer 的控制器判断这个 Pod 有没有执行过自己所负责的初始化操作的重要依据（也就是前面伪代码中 isInitialized() 方法的含义）。

**这也就意味着，当你在 Initializer 里完成了要做的操作后，一定要记得将这个 metadata.initializers.pending 标志清除掉。这一点，你在编写 Initializer 代码的时候一定要非常注意。**

此外，除了上面的配置方法，你还可以在具体的 Pod 的 **Annotation** 里添加一个如下所示的字段，从而声明要使用某个 Initializer：

```yaml
kind: Pod
metadata
  annotations:
    "initializer.kubernetes.io/envoy": "true"
    ...
```

在这个 Pod 里，我们添加了一个 Annotation，写明： initializer.kubernetes.io/envoy=true。这样，就会使用到我们前面所定义的 envoy-initializer 了。

### 小结

* 1）Istio 通过 sidecar 方式在 Pod 中运行 Envoy 容器，从而修改 Pod中的 iptables 规则以达到接管Pod 中的所有流量。
  * Pod 共享 namespace 所以可以实现该功能。
* 2）通过 Kubernetes 的 `Dynamic Admission Control(Initializer)`功能实现用户无感知的情况下在用户提交的 Pod 中增加 Envoy 容器相关配置。
* 3）在Kubernetes 集群中运行自定义Pod(其实是一个自定义控制器)，已达到对所有Pod都增加 Envoy容器配置的效果。





## 3. 小结

**Istio 项目的核心，就是由无数个运行在应用 Pod 中的 Envoy 容器组成的服务代理网格。**

而这个机制得以实现的原理，正是借助了 Kubernetes 能够对 API 对象进行在线更新的能力，这也正是 **Kubernetes“声明式 API”**的独特之处：

* 1）首先，所谓“声明式”，指的就是我只需要提交一个定义好的 API 对象来“声明”，我所期望的状态是什么样子。
* 2）其次，“声明式 API”允许有多个 API 写端，以 PATCH 的方式对 API 对象进行修改，而无需关心本地原始 YAML 文件的内容。
* 3）最后，也是最重要的，有了上述两个能力，Kubernetes 项目才可以基于对 API 对象的增、删、改、查，在完全无需外界干预的情况下，完成对“实际状态”和“期望状态”的调谐（Reconcile）过程。

**声明式 API，才是 Kubernetes 项目编排能力“赖以生存”的核心所在**