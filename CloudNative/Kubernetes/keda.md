# KEDA：基于事件驱动的自动弹性伸缩

## 1. 什么是 KEDA

**KEDA：Kubernetes-based Event Driven Autoscaler.**

KEDA是一种基于事件驱动对 K8S 资源对象扩缩容的组件。非常轻量、简单、功能强大，不仅支持基于 CPU / MEM 资源和基于 Cron 定时 HPA 方式，同时也支持各种事件驱动型 HPA，比如 MQ 、Kafka 等消息队列长度事件，Redis 、URL Metric 、Promtheus 数值阀值事件等等事件源(Scalers)。

## 2. 为什么需要 KEDA

**k8s 官方早就推出了 HPA，为什么我们还需要 KEDA 呢？**

HPA 在经过三个大版本的演进后当前支持了Resource、Object、External、Pods 等四种类型的指标，演进历程如下：

* **autoscaling/v1**：只支持基于CPU指标的缩放
* **autoscaling/v2beta1**：支持Resource Metrics（资源指标，如pod的CPU）和Custom Metrics（自定义指标）的缩放
* **autoscaling/v2beta2**：支持Resource Metrics（资源指标，如pod的CPU）和Custom Metrics（自定义指标）和 ExternalMetrics（额外指标）的缩放。

如果需要基于其他地方如 Prometheus、Kafka、云供应商或其他事件上的指标进行伸缩，那么可以通过 v2beta2 版本提供的 external metrics 来实现。

* 通过 metrics adaptor 将从prometheus 中拿到的指标转换为 HPA 能够识别的格式，以此来实现基于 prometheus 指标的弹性伸缩
* 然后应用需要实现 metrics 接口或者对应的 exporter 来将指标暴露出来

可以看到， HPA v2beta2 版本就可以实现基于外部指标弹性伸缩，只是实现上比较麻烦，**KEDA 的出现主要是为了解决**HPA 无法基于灵活的事件源进行伸缩**的这个问题。**

>  毕竟 KEDA 从名字上就体现出了事件驱动。

KEDA 则可以简化这个过程，使用起来更加方便，而且 KEDA 已经内置了几十种常见的 Scaler 可以直接使用。

## 3. KEDA 是什么工作的

keda 架构图 https://keda.sh/docs/2.10/concepts/#architecture

KEDA 由以下组件组成：

- Scaler：连接到外部组件（例如 Prometheus 或者 RabbitMQ) 并获取指标（例如，待处理消息队列大小） ）获取指标
- Metrics Adapter： 将 Scaler 获取的指标转化成 HPA 可以使用的格式并传递给 HPA Controller：负责创建和更新一个 HPA 对象，并负责扩缩到零 
- keda operator：负责创建维护 HPA 对象资源，同时激活和停止 HPA 伸缩。在无事件的时候将副本数降低为 0 (如果未设置 minReplicaCount 的话)
- metrics server: 实现了 HPA 中 external metrics，根据事件源配置返回计算结果。

> HPA 控制了副本 1->N 和 N->1 的变化。keda 控制了副本 0->1 和 1->0 的变化（起到了激活和停止的作用，对于一些消费型的任务副本比较有用，比如在凌晨启动任务进行消费）



## 4. Demo

需要一个 k8s 集群，没有的话可以参考 [Kubernetes教程(十一)---使用 KubeClipper 通过一条命令快速创建 k8s 集群](https://www.lixueduan.com/posts/kubernetes/11-install-by-kubeclipper/) 快速创建一个。

### KEDA 安装

这里使用 Helm 安装

```Bash
helm repo add kedacore https://kedacore.github.io/charts
helm repo update
helm install keda kedacore/keda --namespace keda --create-namespace --version v2.9
```

> 默认会安装最新版本，对 k8s 版本有要求，当前最新 2.10 需要 k8s 1.24，这边 k8s 是 1.23.6 因此手动安装 KEDA 2.9 版本。

安装完成后会启动两个 pod,能正常启动则算是安装成功。

```Bash
[root@mcs-1 ~]# kubectl -n keda get po
NAME                                               READY   STATUS    RESTARTS   AGE
keda-operator-94b754f55-4tzqm                      1/1     Running   0          21m
keda-operator-metrics-apiserver-655d49f694-7wsww   1/1     Running   0          21m
```



### metrics-server

由于 KEDA 也需要 HPA 配合使用，因此需要安装 metrics-server。

> apply 以下 yaml 即可完成 metrics-server 部署

```yaml
cat > metrics-server.yaml << EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  labels:
    k8s-app: metrics-server
    rbac.authorization.k8s.io/aggregate-to-admin: "true"
    rbac.authorization.k8s.io/aggregate-to-edit: "true"
    rbac.authorization.k8s.io/aggregate-to-view: "true"
  name: system:aggregated-metrics-reader
rules:
- apiGroups:
  - metrics.k8s.io
  resources:
  - pods
  - nodes
  verbs:
  - get
  - list
  - watch
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  labels:
    k8s-app: metrics-server
  name: system:metrics-server
rules:
- apiGroups:
  - ""
  resources:
  - nodes/metrics
  verbs:
  - get
- apiGroups:
  - ""
  resources:
  - pods
  - nodes
  verbs:
  - get
  - list
  - watch
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server-auth-reader
  namespace: kube-system
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: extension-apiserver-authentication-reader
subjects:
- kind: ServiceAccount
  name: metrics-server
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server:system:auth-delegator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:auth-delegator
subjects:
- kind: ServiceAccount
  name: metrics-server
  namespace: kube-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  labels:
    k8s-app: metrics-server
  name: system:metrics-server
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:metrics-server
subjects:
- kind: ServiceAccount
  name: metrics-server
  namespace: kube-system
---
apiVersion: v1
kind: Service
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server
  namespace: kube-system
spec:
  ports:
  - name: https
    port: 443
    protocol: TCP
    targetPort: https
  selector:
    k8s-app: metrics-server
---
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    k8s-app: metrics-server
  name: metrics-server
  namespace: kube-system
spec:
  selector:
    matchLabels:
      k8s-app: metrics-server
  strategy:
    rollingUpdate:
      maxUnavailable: 0
  template:
    metadata:
      labels:
        k8s-app: metrics-server
    spec:
      containers:
      - args:
        - --cert-dir=/tmp
        - --secure-port=4443
        - --kubelet-insecure-tls
        - --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname
        - --kubelet-use-node-status-port
        - --metric-resolution=15s
        image: dyrnq/metrics-server:v0.6.1
        imagePullPolicy: IfNotPresent
        livenessProbe:
          failureThreshold: 3
          httpGet:
            path: /livez
            port: https
            scheme: HTTPS
          periodSeconds: 10
        name: metrics-server
        ports:
        - containerPort: 4443
          name: https
          protocol: TCP
        readinessProbe:
          failureThreshold: 3
          httpGet:
            path: /readyz
            port: https
            scheme: HTTPS
          initialDelaySeconds: 20
          periodSeconds: 10
        resources:
          requests:
            cpu: 100m
            memory: 200Mi
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          runAsUser: 1000
        volumeMounts:
        - mountPath: /tmp
          name: tmp-dir
      nodeSelector:
        kubernetes.io/os: linux
      priorityClassName: system-cluster-critical
      serviceAccountName: metrics-server
      volumes:
      - emptyDir: {}
        name: tmp-dir
---
apiVersion: apiregistration.k8s.io/v1
kind: APIService
metadata:
  labels:
    k8s-app: metrics-server
  name: v1beta1.metrics.k8s.io
spec:
  group: metrics.k8s.io
  groupPriorityMinimum: 100
  insecureSkipTLSVerify: true
  service:
    name: metrics-server
    namespace: kube-system
  version: v1beta1
  versionPriority: 10
EOF
```

```bash
kubectl apply -f metrics-server.yaml
```

测试使用正常运行

```bash 
[root@demo ~]# kubectl top node
NAME   CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
demo   585m         14%    4757Mi          60%
```



### 扩缩容测试

#### Deployment

部署一个 php-apache 服务作为工作负载

```bash 
cat > deploy.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: php-apache
spec:
  selector:
    matchLabels:
      run: php-apache
  replicas: 1
  template:
    metadata:
      labels:
        run: php-apache
    spec:
      containers:
      - name: php-apache
        image: deis/hpa-example
        ports:
        - containerPort: 80
        resources:
          limits:
            cpu: 100m
          requests:
            cpu: 20m
---
apiVersion: v1
kind: Service
metadata:
  name: php-apache
  labels:
    run: php-apache
spec:
  ports:
  - port: 80
  selector:
    run: php-apache
EOF
```

```bash
kubectl apply -f deploy.yaml
```



#### ScaledObject

检测 cpu 压力进行扩缩容

```bash
cat > so.yaml <<EOF
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: cpu
  namespace: default
spec:
  scaleTargetRef:
    name: php-apache
    apiVersion: apps/v1
    kind: Deployment
  triggers:
  - type: cpu
    metadata:
      type: Utilization
      value: "50"
EOF
```

```bash
kubectl apply -f so.yaml
```

#### 测试扩缩容

开始请求，增加压力

```Bash
clusterIP=$(kubectl get svc php-apache -o jsonpath='{.spec.clusterIP}')
while sleep 0.01; do wget -q -O- http://$clusterIP; done
```

过一会就能看到 pod 数在增加

```Bash
[root@mcs-1 keda]# kubectl get po
NAME                         READY   STATUS    RESTARTS   AGE
php-apache-95cc776df-5grp6   1/1     Running   0          2m52s
php-apache-95cc776df-85jpd   1/1     Running   0          33s
php-apache-95cc776df-cxdlr   1/1     Running   0          48s
php-apache-95cc776df-gr4nh   1/1     Running   0          33s
php-apache-95cc776df-hs5xs   1/1     Running   0          48s
php-apache-95cc776df-jrt7h   1/1     Running   0          48s
php-apache-95cc776df-sddpq   1/1     Running   0          33s
```

实际上并不是 KEDA 直接调整了 pod 的数量，KEDA 只是创建了一个 HPA 对象出来

相关日志如下

```Bash
[root@test ~]#kubectl -n keda logs -f keda-operator-94b754f55-4tzqm
2023-05-15T08:53:57Z        INFO        Creating a new HPA        {"controller": "scaledobject", "controllerGroup": "keda.sh", "controllerKind": "ScaledObject", "ScaledObject": {"name":"cpu","namespace":"default"}, "namespace": "default", "name": "cpu", "reconcileID": "8bd04ba9-f100-49c1-9f28-ae28e55ae9eb", "HPA.Namespace": "default", "HPA.Name": "keda-hpa-cpu"}
2023-05-15T08:53:57Z        INFO        cpu_memory_scaler        trigger.metadata.type is deprecated in favor of trigger.metricType        {"type": "ScaledObject", "namespace": "default", "name": "cpu"}
```

查看创建出来的 HPA

```Bash
[root@mcs-1 ~]# kubectl get hpa
NAME           REFERENCE               TARGETS    MINPODS   MAXPODS   REPLICAS   AGE
keda-hpa-cpu   Deployment/php-apache   151%/50%   1         100       6          37m
```

然后停止请求，等压力下降后，hpa 会自动将 pod 数进行回收。

```Bash
[root@mcs-1 ~]# kubectl get po
NAME                          READY   STATUS    RESTARTS   AGE
php-apache-57fcc894d5-6ssc7   1/1     Running   0          78m
[root@mcs-1 ~]# kubectl get hpa
NAME           REFERENCE               TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
keda-hpa-cpu   Deployment/php-apache   0%/50%    1         100       1          65m
```



### 自定义指标弹性伸缩

上面一个 Demo 非常简单，其实直接用 HPA 也能实现，并不能完全体现出 KEDA 的作用。

假设，现在我们有这么一个场景，运行的业务是生产者消费者模型，消费者从 Kafka 里拿消息进行消费，然后希望根据 Kafka 里堆积的消息数来对消费者 deployment 做一个弹性伸缩。

如果使用 HPA 的话也可以实现，但是很麻烦，而 KDEA 则非常简单了，KEDA 内置了[ kakfa scaler](https://keda.sh/docs/2.10/scalers/apache-kafka/)，直接使用即可。

KEDA 的 kafka scaler 工作流程如下：

- 当没有待处理的消息时，KEDA 可以根据 minReplica 集将部署缩放到 0 或 1。
- 当消息到达时，KEDA 会检测到此事件并激活部署。
- 当部署开始运行时，其中一个容器连接到 Kafka 并开始拉取消息。
- 随着越来越多的消息到达 Kafka Topic，KEDA 可以将这些数据提供给 HPA 以推动横向扩展。
- 当消息被消费完之后，KEDA 可以根据 minReplica 集将部署缩放到 0 或 1。



配置如下

```yaml
triggers:
- type: kafka
  metadata:
    bootstrapServers: kafka.svc:9092
    consumerGroup: my-group
    topic: test-topic
    lagThreshold: '100'
    activationLagThreshold: '3'
    offsetResetPolicy: latest
    allowIdleConsumers: false
    scaleToZeroOnInvalidOffset: false
    excludePersistentLag: false
    version: 1.0.0
    partitionLimitation: '1,2,10-20,31'
    tls: enable
    sasl: plaintext
```

暂时关注前面几个参数即可：

* 其中 bootstrapServers、consumerGroup、topic 都是 kafka 信息
* lagThreshold 则是扩容的阈值，当消息延迟大于这个阈值时就会对 deployment 进行扩容。

