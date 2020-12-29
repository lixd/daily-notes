# ConfigMap、Secret



## 1. 概述

ConfigMap顾名思义，是用于保存配置数据的键值对，可以用来保存单个属性，也可以保存配置文件。

Secret可以为Pod提供密码、Token、私钥等敏感数据；对于一些非敏感数据，比如应用的配置信息，则可以使用ConfigMap。



## 2. ConfigMap

### 1. 创建

可以使用 `kubectl create configmap` 从以下多种方式创建 ConfigMap。

* 1）**yaml 描述文件**：事先写好标准的configmap的yaml文件，然后kubectl create -f 创建
* 2）**--from-file**：通过指定目录或文件创建，将一个或多个配置文件创建为一个ConfigMap
* 3）**--from-literal**：通过直接在命令行中通过 key-value 字符串方式指定configmap参数创建
* 4）**--from-env-file**：从 env 文件读取配置信息并创建为一个ConfigMap

**yaml 描述文件**

```sh
$ kubectl create -f configmap.yaml 
configmap/test-conf created
$ kubectl get configmaps
NAME        DATA   AGE
cm1   1      8s
$ kubectl describe configmap test-conf
Name:         cm1
Namespace:    default
Labels:       <none>
Annotations:  <none>

Data
====
user:
----
name: "17x"
github: "https://github.com/lixd"
blog: "https://www.lixueduan.com"
Events:  <none>
```

`configmap.yaml` 如下:

```yaml
apiVersion: v1
kind: ConfigMap
metadata: 
  name: cm1
  namespace: default
data:
  user: |+
    name: "17x"
    github: "https://github.com/lixd"
    blog: "https://www.lixueduan.com"
```



**--from-file**

* 1）单文件

```sh
$ kubectl create configmap cm2 --from-file=conf-17x.yaml 
configmap/cm1 created
$ kubectl get configmaps
NAME   DATA   AGE
cm2    1      17s
$ kubectl get configmap cm2 -o go-template='{{.data}}'
map[user:name: "17x"
github: "https://github.com/lixd"
blog: "https://www.lixueduan.com"]
```

配置文件如下

```yaml
User: "17x"
Github: "https://github.com/lixd"
Blog: "https://www.lixueduan.com"
```

* 2）目录

```sh
# 从 conf 目录下多个文件读取配置信息
$ kubectl create configmap cm3 --from-file=conf
configmap/cm3 created
$ kubectl get configmaps
NAME        DATA   AGE
cm3         2      8s
$ kubectl get configmap cm3 -o go-template='{{.data}}'
map[conf1.yaml:User: "17x"
Github: "https://github.com/lixd"
Blog: "https://www.lixueduan.com"
 conf2.yaml:User: "17x"
Github: "https://github.com/lixd"
Blog: "https://www.refersmoon.com"
```





**--from-literal**

> 每个 --from-literal 对应一个信息条目。

```sh
$ kubectl create configmap cm4 --from-literal=name="17x" --from-literal=blog="https://www.lixueduan.com"
configmap "cm4" created
$ kubectl get configmap cm4 -o go-template='{{.data}}'
map[blog:https://www.lixueduan.com name:17x][root@iZ2ze9ebgot9h2acvk4uabZ configmap]
```



**--from-env-file**

```sh
$ kubectl create configmap cm5 --from-env-file=conf.env 
configmap/cm5 created
$ kubectl get configmap cm5 -o go-template='{{.data}}'
map[blog:https://www.lixueduan.com github:https://github.com/lixd name:17x]
```

`conf.env`文件如下

> 语法为 key=value

```env
name=17x
github=https://github.com/lixd
blog=https://www.lixueduan.com
```



### 2. 使用

Pod 可以通过三种方式来使用 ConfigMap，分别为：

- 将 ConfigMap 中的数据设置为环境变量
- 将 ConfigMap 中的数据设置为命令行参数
- 使用 Volum e将 ConfigMap 作为文件或目录挂载

**注意！！**

- ConfigMap 必须在 Pod 使用它之前创建
- 使用 envFrom 时，将会自动忽略无效的键
- Pod 只能使用同一个命名空间的 ConfigMap



**用作环境变量**



```sh
$ kubectl create configmap cm1 --from-literal=first="hello world" --from-literal=second="hello configmap"
$ kubectl create configmap env-cm --from-literal=log_level=INFO
```



```yaml
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
spec:
  containers:
    - name: test-container
      image: gcr.io/google_containers/busybox
      command: [ "/bin/sh", "-c", "env" ]
      env:
        - name: CUSTOM_FIRST
          valueFrom:
            configMapKeyRef:
              name: cm1
              key: first
        - name: CUSTOM_SECOND
          valueFrom:
            configMapKeyRef:
              name: cm1
              key: second
      envFrom:
        - configMapRef:
            name: env-cm
  restartPolicy: Never
```

