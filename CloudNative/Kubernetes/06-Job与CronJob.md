# Job CronJob

> [Job 官方文档](https://kubernetes.io/docs/concepts/workloads/controllers/job/)

## 1. 概述

根据作业的不同，可以将其分为 LRS（Long Running Service）和 Batch Jobs 两种作业形态。

Deployment、StatefulSet，以及 DaemonSet 都是用于编排 LRS 业务。

而 `离线业务`则使用 Job 或者 CronJob 进行编排。

> 离线业务 执行完成就自动退出了，如果还用 Deployment 之类进行编排的话，就会出现 Pod 被反复重启的情况。计算完成-->退出容器-->Pod被重启-->计算完成



## 2. 详解

Job YAML 定义文件如下：

```YAML
---
apiVersion: batch/v1
kind: Job
metadata:
  name: pi
spec:
  template:
    spec:
      containers:
      - name: pi
        image: resouer/ubuntu-bc 
        command: ["sh", "-c", "echo 'scale=10000; 4*a(1)' | bc -l "]
      restartPolicy: Never
  backoffLimit: 4
```

这个 Pod 启动后会执行 command 属性指定的命令，计算完成就自动退出。

同样的 `spce.template` 就是 Pod 模板。

 **restartPolicy**：重启策略。

* 如果 restartPolicy=Never，那么离线作业失败后 Job Controller 就会不断地尝试创建一个新 Pod
* 如果 restartPolicy=OnFailure，那么离线作业失败后，Job Controller 就不会去尝试创建新的 Pod。而是不断地尝试重启 Pod 里的容器。

> 事实上，restartPolicy 在 Job 对象里只允许被设置为 Never 和 OnFailure；而在 Deployment 对象里，restartPolicy 则只允许被设置为 Always。

**spec.backoffLimit**：最大重启次数

为了防止 restartPolicy 被无限尝试下去。所以，我们就在 Job 对象的 `spec.backoffLimit` 字段里定义了重试次数为 4（即，backoffLimit=4），而这个字段的默认值是 6。

**spec.activeDeadlineSeconds**：最长运行时间

同时 `spec.activeDeadlineSeconds` 字段可以设置 Pod 最长运行时间，防止出现任务卡死的情况。

比如下面这个 YAML 现在了Pod 最多重启5次，最多运行 200秒。

```yaml
spec:
 backoffLimit: 5
 activeDeadlineSeconds: 200
```



**并行控制**

在 Job 对象中，负责并行控制的参数有两个：

* 1）**spec.parallelism**，它定义的是一个 Job 在任意时间最多可以启动多少个 Pod 同时运行；
* 2）**spec.completions**，它定义的是 Job 至少要完成的 Pod 数目，即 Job 的最小完成数。

最多同时运行 spec.parallelism 个Pod，当 spec.completions 个Pod 成功完成后就退出当前 Job。

比如下面这个 YAML

```yaml
spec:  
  parallelism: 2  
  completions: 4
```

这样，我们就指定了这个 Job 最大的并行数是 2，而最小的完成数是 4。

### 例子

完整 YAML 文件如下：

```yaml
---
apiVersion: batch/v1
kind: Job
metadata:
  name: pi
spec:
  parallelism: 2
  completions: 4
  template:
    spec:
      containers:
      - name: pi
        image: resouer/ubuntu-bc
        command: ["sh", "-c", "echo 'scale=5000; 4*a(1)' | bc -l "]
      restartPolicy: Never
  backoffLimit: 4
  activeDeadlineSeconds: 200
```



创建 Job 对象

```sh
$ kubectl apply -f job.yaml
job.batch/pi created
```

查看 Job 状态，其中 COMPLETIONS 0/4 就是yaml文件中指定的值一共要完成 4个,当前只完成了 0个。

```sh
$ kubectl get jobs
NAME   COMPLETIONS   DURATION   AGE
pi     0/4           3s         3s
```

查看 Pod，发现同时启动了两个 Pod ，因为 spec.parallelism 限制为2。

```sh
$ kubectl get jobs
NAME       READY   STATUS    RESTARTS   AGE
pi-cpgb7   1/1     Running   0          38s
pi-tpl7b   1/1     Running   0          38s
```

继续观察Pod信息，可以看到当有一个 Pod 完成计算进入 Completed 状态时，就会有一个新的 Pod 被自动创建出来。

> spec.parallelism 限制为2,同时运行的两个Pod中有一个完成后并行数就减少为1，所以又可以启动一个 Pod了。

```sh
$ kubectl get pods
NAME       READY   STATUS              RESTARTS   AGE
pi-2b6hl   0/1     ContainerCreating   0          1s
pi-cpgb7   0/1     Completed           0          40s
pi-tpl7b   1/1     Running             0          40s
```

继续观察Pod，这里需要注意 当前只有一个 Pod 处于 Running 状态，但是却没有新的Pod被启动起来。spec.parallelism 限制的是2，按理说可以在启动一个Pod 才对啊？

```sh
$ kubectl get pods
NAME       READY   STATUS      RESTARTS   AGE
pi-2b6hl   0/1     Completed   0          45s
pi-cpgb7   0/1     Completed   0          84s
pi-jnhmc   1/1     Running     0          33s
pi-tpl7b   0/1     Completed   0          84s
```



因为 completions 设置的是4，现在已经完成 3个了，还差一个。所以此时最多只能启动一个Pod。

具体公式如下：

```sh
需要创建的 Pod 数目 = 最终需要的 Pod 数目 - 实际在 Running 状态 Pod 数目 - 已经成功退出的 Pod 数目
```

最后 4 个Pod都计算完成，成功退出 ，这个Job就算是完成了。

```sh
$ kubectl get pods
NAME       READY   STATUS      RESTARTS   AGE
pi-2b6hl   0/1     Completed   0          89s
pi-cpgb7   0/1     Completed   0          2m8s
pi-jnhmc   0/1     Completed   0          77s
pi-tpl7b   0/1     Completed   0          2m8s
$ kubectl get jobs
NAME   COMPLETIONS   DURATION   AGE
pi     4/4           99s        16m
```

### 小结

首先，Job Controller 控制的对象，直接就是 Pod。

其次，Job Controller 在控制循环中进行的调谐（Reconcile）操作，是根据实际在 Running 状态 Pod 的数目、已经成功退出的 Pod 的数目，以及 parallelism、completions 参数的值共同计算出在这个周期里，应该创建或者删除的 Pod 数目，然后调用 Kubernetes API 来执行这个操作。

```sh
需要创建的 Pod 数目 = 最终需要的 Pod 数目 - 实际在 Running 状态 Pod 数目 - 已经成功退出的 Pod 数目
```

以之前例子为例：

最开始时

```sh
需要创建的 Pod 数目=4-0-0=4
```

所以需要创建 4 个 Pod，然后更新 parallelism 限制为2，则一次性创建了两个Pod。

最后完成3个Pod后

```sh
需要创建的 Pod 数目=4-0-3=1
```

此时就只需要创建一个 Pod 了，虽然 parallelism  可以同时运行两个，但是已经没必要了。

类似地，如果在这次调谐周期里，Job Controller 发现实际在 Running 状态的 Pod 数目，比 parallelism 还大，那么它就会删除一些 Pod，使两者相等。

综上所述，Job Controller 实际上控制了，作业执行的**并行度**，以及总共需要完成的**任务数**这两个重要参数。

> 而在实际使用时，你需要根据作业的特性，来决定并行度（parallelism）和任务数（completions）的合理取值。



## 3. 常见用法

### 1. Job 模板

**第一种用法，也是最简单粗暴的用法：外部管理器 +Job 模板。**

把 Job 的 YAML 文件定义为一个“模板”，然后用一个外部工具控制这些“模板”来生成 Job。

Job 模板定义如下：

```yaml
---
apiVersion: batch/v1
kind: Job
metadata:
  name: process-item-$ITEM
  labels:
    jobgroup: jobexample
spec:
  template:
    metadata:
      name: jobexample
      labels:
        jobgroup: jobexample
    spec:
      containers:
      - name: c
        image: busybox
        command: ["sh", "-c", "echo Processing item $ITEM && sleep 5"]
      restartPolicy: Never
```

注意点：

* 1）创建 Job 时，替换掉 $ITEM 这样的变量；
* 2）所有来自于同一个模板的 Job，都有一个 jobgroup: jobexample 标签，也就是说这一组 Job 使用这样一个相同的标识。

替换变量，方法很多，直接用shell 也可以实现

```sh
$ mkdir ./jobs
$ for i in apple banana cherry
do
  cat job-tmpl.yaml | sed "s/\$ITEM/$i/" > ./jobs/job-$i.yaml
done
```

这样，一组来自于同一个模板的不同 Job 的 yaml 就生成了。接下来，你就可以通过一句 kubectl create 指令创建这些 Job 了：

```sh
$ kubectl create -f ./jobs
$ kubectl get pods -l jobgroup=jobexample
NAME                        READY     STATUS      RESTARTS   AGE
process-item-apple-kixwv    0/1       Completed   0          4m
process-item-banana-wrsf7   0/1       Completed   0          4m
process-item-cherry-dnfu9   0/1       Completed   0          4m
```

这种用法就是：**分别处理各个 Job**。

### 2. 固定任务数

比如，我们这个计算 Pi 值的例子，就是这样一个典型的、拥有固定任务数目（completions=4）的应用场景。

这样就不关心 parallelism。并行执行或者串行执行都可以。

作为用户，我只关心最终一共有completions=4个计算任务启动并且退出，只要这个目标达到，我就认为整个 Job 处理完成了。

> 这里就是每个Pod计算出Pi的值然后退出即可。

这种用法就是：**将 completions 作为 Job 完成依据**。

### 3. 指定并行度

第三种用法，也是很常用的一个用法：指定并行度（parallelism），但不设置固定的 completions 的值。

伪代码如下：

```go
for !queue.IsEmpty() {
  task := queue.Pop()
  process(task)
}
print("Queue empty, exiting")
exit
```

由于任务数目的总数不固定，所以每一个 Pod 必须能够知道，自己什么时候可以退出。比如，在这个例子中，我简单地以“队列为空”，作为任务全部完成的标志。所以说，这种用法，对应的是“任务总数不固定”的场景。

这种用法就是：**将 Pod  都退出作为 Job 完成依据**，具体逻辑需要放在 Pod 里。

## 4. CronJob

顾名思义，CronJob 描述的，正是**定时任务**。它的 API 对象，如下所示：

```yaml
---
apiVersion: batch/v1beta1
kind: CronJob
metadata:
  name: hello
spec:
  schedule: "*/1 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: hello
            image: busybox
            args:
            - /bin/sh
            - -c
            - date; echo Hello from the Kubernetes cluster
          restartPolicy: OnFailure
```

可以看到其中有一个`spec.jobTemplate` 这个就和前面的 Job 对象是一样的。

所以**CronJob 是一个 Job 对象的控制器（Controller）**

没错，**CronJob 与 Job 的关系，正如同 Deployment 与 ReplicaSet 的关系一样**。

**CronJob 是一个专门用来管理 Job 对象的控制器**。

> 用一个对象控制另一个对象，是 Kubernetes 编排的精髓所在。

只不过，它创建和删除 Job 的依据，是 schedule 字段定义的、一个标准的Unix Cron格式的表达式。

需要注意的是，由于定时任务的特殊性，很可能某个 Job 还没有执行完，另外一个新 Job 就产生了。这时候，你可以通过 spec.concurrencyPolicy 字段来定义具体的处理策略。

* 1）concurrencyPolicy=Allow，这也是默认情况，这意味着这些 Job 可以同时存在；
* 2）concurrencyPolicy=Forbid，这意味着不会创建新的 Pod，该创建周期被跳过；
* 3）concurrencyPolicy=Replace，这意味着新产生的 Job 会替换旧的、没有执行完的 Job。

而如果某一次 Job 创建失败，这次创建就会被标记为“miss”。当在指定的时间窗口内，miss 的数目达到 100 时，那么 CronJob 会停止再创建这个 Job。

这个时间窗口，可以由 spec.startingDeadlineSeconds 字段指定。比如 startingDeadlineSeconds=200，意味着在过去 200 s 里，如果 miss 的数目达到了 100 次，那么这个 Job 就不会被创建执行了。



## 5. 参考

