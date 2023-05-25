# 自动扩缩容 hpa

## 横向伸缩和纵向伸缩

**应用扩容是指在应用接收到的并发请求已经处于其处理请求极限边界的情形下，扩展处理能力而确保应用高可用的技术手段。**

* Horizontal Scaling
  * 所谓横向伸缩是指通过增加应用实例数量分担负载的方式来提升应用整体处理能力的方式
* Vertical Scaling
  * 所谓纵向伸缩是指通过增加单个应用实例资源以提升单个实例处理能力，进而提升应用整体处理能力的方式



## hpa

**HPA (Horizontal Pod Autoscaler)是Kubernetes的一种资源对象**，能够根据某些指标对在statefulSet、replicaSet、 deployment 等集合中的Pod数量进行横向动态伸缩，使运行在上面的服务对指标的变化有一定的自适应能力。

* 因节点计算资源固定，当Pod调度完成并运行以后，动态调整计算资源变得较为困难，因为横向扩展具有更大优势, HPA是扩展应用能力的第一选择。
* 多个冲突的HPA同时创建到同一个应用的时候会有无法预期的行为，因此需要小心维护HPA规则。
* HPA依赖于Metrics- Server。

```yaml
apiVersion: autoscaling/v1
kind: HorizontalPodAutoscaler
metadata:
  name: php-apache
  namespace: default
spec:
  # HPA能修改的最大和最新Pod数
  maxReplicas: 10
  minReplicas: 1
  # HPA的伸缩对象描述，HPA会动态修改该对象的Pod数
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: php-apache
  targetCPUUtilizationPercentage: 50
```

v2 版本 hpa：

```yaml
apiVersion: autoscaling/v2beta2
kind: HorizontalPodAutoscaler
metadata:
  name: php-apache
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: php-apache
  minReplicas: 1
  maxReplicas: 10
  #metrics定义扩容的逻辑
  metrics:
      # Resource类型的指标只支持Utilization和AverageValue类型的目标值
      # Pods 指标类型下只支持AverageValue类型的目标值
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50
```





## 算法细节

HPA 算法非常简单，公式如下：

**期望副本数=ceil[当前副本数*(当前指标/期望指标)]**

* 期望指标：pod 中定义的 resource.request 值
* 当前指标：metrics-server 采集到的数据



例如当前度量值为200m,目标设定值为100m,那么由于200.0/100.0== 2.0，副本数量将会翻倍。

如果当前指标为50m,副本数量将会减半，因为50.0/100.0==0.5。

如果计算出的扩缩比例接近1.0 (根据--horizontal-pod-autoscaler-tolerance 参数全局配置的容忍值，默认为0.1),将会放弃本次扩缩。



## 冷却/延迟支持

当使用Horizontal Pod Autoscaler管理一组副本扩缩时，有可能因为指标动态的变化造成副本数量频繁的变化，有时这被称为**抖动(Thrashing) **。

--horizontal-pod-autoscaler-downscale-stabilization:设置缩容冷却时间窗口长度。

水平Pod扩缩器能够记住过去建议的负载规模,并仅对此时间窗口内的最大规模执行操作。
**默认值是5分钟(5m0s)**



## 滚动升级时扩缩


当你为一个 Deployment 配置自动扩缩时，你要为每个 Deployment 绑定一个 HorizontalPodAutoscaler。

HorizontalPodAutoscaler 管理 Deployment 的 replicas 字段。
Deployment Controller 负责设置下层 ReplicaSet 的 replicas 字段，以便确保在上线及后续过程副本个数合适。



**想一想:为什么 deploymentSpec 中的 replicas 字段的类型为 *int,而不是 int ?**





## HPA 存在的问题

基于指标的弹性有滞后效应，因为弹性控制器操作的链路过长。

从应用负载超出阈值到HPA完成扩容之间的时间差包括:

* 应用指标数据已经超出阈值;
* HPA 定期执行指标收集滞后效应;
* HPA控制Deployment进行扩容的时间;
* Pod调度，运行时启动挂载存储和网络的时间;
* 应用启动到服务就绪的时间。



**很可能在突发流量出现时，还没完成弹性扩容，既有的服务实例已经被流量击垮。**





## demo

php-apache.yaml:

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
        image: cncamp/hpa-example
        ports:
        - containerPort: 80
        resources:
          limits:
            cpu: 500m
          requests:
            cpu: 200m
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

```



hpav2.yaml：

```yaml
apiVersion: autoscaling/v2beta2
kind: HorizontalPodAutoscaler
metadata:
  name: php-apache
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: php-apache
  minReplicas: 1
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 50
```

创建pod和 hpa对象

```bash
kubectl create -f php-apache.yaml
kubectl create -f hpav2.yaml
```

给pod加压

```bash
kubectl run -i --tty load-generator --rm --image=busybox --restart=Never -- /bin/sh -c "while sleep 0.01; do wget -q -O- http://php-apache; done"
```



在另外的窗口观察pod情况

```bash
watch kubectl top pods
```



