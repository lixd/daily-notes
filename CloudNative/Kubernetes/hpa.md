# Horizontal Pod Autoscaler

## 1. 概述

HPA：Pod 水平自动伸缩

**HPA 通过监控分析一些控制器控制的所有 Pod 的负载变化情况来确定是否需要调整 Pod 的副本数量**

具体如下图所示：

![](assets/hpa-arch.png)



## 2. 算法

**比如CPU 超过 50% 就扩容，指的是 超过请求量的50%。**

```yaml
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
        image: k8s.gcr.io/hpa-example
        ports:
        - containerPort: 80
        resources:
          limits:
            cpu: 500m
          requests:
            cpu: 200m
```

如这个 yaml 文件 CPU request 为 200m，如果 HPA 设置为 CPU 50%。

则当前 Pod CPU 超过 200m*50%=100m 就会产生扩容，反之会缩容。



### 采集周期

**延迟队列**

HPA控制器并不监控底层的各种informer比如Pod、Deployment、ReplicaSet等资源的变更，而是**每次处理完成后都将当前HPA对象重新放入延迟队列中**，从而触发下一次的检测，如果你没有修改默认这个时间是15s, 也就是说再进行一次一致性检测之后，即时度量指标超量也至少需要15s的时间才会被HPA感知到

Pod 水平自动扩缩器的实现是一个控制回路，由控制器管理器的 `--horizontal-pod-autoscaler-sync-period` 参数指定周期（**默认值为 15 秒**）。如果需要设置horizontal-pod-autoscaler-sync-period可以在Master Node上的/etc/default/kube-controller-manager中修改。

> 即每个周期 15s。

**监控时间序列窗口**

每个周期内，控制器管理器根据每个 HorizontalPodAutoscaler 定义中指定的指标查询资源利用率。 

> 控制器管理器可以从资源度量指标 API（按 Pod 统计的资源用量）和自定义度量指标 API（其他指标）获取度量值。

在从metrics server获取pod监控数据的时候，HPA控制器会获取最近5分钟的数据(硬编码)并从中获取最近1分钟(硬编码)的数据来进行计算，相当于取最近一分钟的数据作为样本来进行计算。

> 注意这里的1分钟是指的监控数据中最新的那边指标的前一分钟内的数据，而不是当时间



**稳定性与延迟**

前面提过延迟队列会每15s都会触发一次HPA的检测，那如果1分钟内的监控数据有所变动，则就会产生很多scale更新操作，从而导致对应的控制器的副本时数量的频繁的变更， 为了保证对应资源的稳定性， HPA控制器在实现上加入了一个延迟时间，即在该时间窗口内会保留之前的决策建议，然后根据当前所有有效的决策建议来进行决策，从而保证期望的副本数量尽量小的变更，保证稳定性



### 算法细节

```
期望副本数 = ceil[当前副本数 * (当前指标 / 期望指标)]
```

例如，当前度量值为 `400m`，目标设定值为 `200m`，那么由于 `400.0/200.0 == 2.0`， 副本数量将会翻倍。 如果当前指标为 `100m`，副本数量将会减半，因为`100.0/100.0 == 0.5`。 如果计算出的扩缩比例接近 1.0 （根据`--horizontal-pod-autoscaler-tolerance` 参数全局配置的容忍值，默认为 0.1）， 将会放弃本次扩缩。

如果创建 HorizontalPodAutoscaler 时指定了多个指标， 那么会按照每个指标分别计算扩缩副本数，取最大值进行扩缩。 

### 冷却

当使用 Horizontal Pod Autoscaler 管理一组副本扩缩时， 有可能因为指标动态的变化造成副本数量频繁的变化，有时这被称为 *抖动（Thrashing）*。

从 v1.6 版本起，集群操作员可以调节某些 `kube-controller-manager` 的全局参数来 缓解这个问题。

从 v1.12 开始，算法调整后，扩容操作时的延迟就不必设置了。

- `--horizontal-pod-autoscaler-downscale-stabilization`: `kube-controller-manager` 的这个参数表示缩容冷却时间。 即自从上次缩容执行结束后，多久可以再次执行缩容，默认时间是 5 分钟(`5m0s`)。



## 参考

`https://cloud.tencent.com/developer/article/1648364`

`https://segmentfault.com/a/1190000018141551`

`https://kubernetes.io/zh/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/`

`https://kubernetes.io/zh/docs/tasks/run-application/horizontal-pod-autoscale/`