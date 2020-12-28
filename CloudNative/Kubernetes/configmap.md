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



```yaml
apiVersion: v1
kind: ConfigMap
metadata: 
  name: test-conf
  namespace: default
data:
  17x: |+
    User: "17x"
    Github: "https://github.com/lixd"
    Blog: "https://www.lixueduan.com"
```



```sh
$ kubectl create -f configmap.yaml 
configmap/test-conf created
$ kubectl get configmaps
NAME        DATA   AGE
test-conf   1      8s
$ kubectl describe test-conf
error: the server doesn't have a resource type "test-conf"
$ kubectl describe configmap test-conf
Name:         test-conf
Namespace:    default
Labels:       <none>
Annotations:  <none>

Data
====
17x:
----
User: "17x"
Github: "https://github.com/lixd"
Blog: "https://www.lixueduan.com"

Events:  <none>
```





**--from-file**

单文件

```sh
$ kubectl create configmap cm1 --from-file=conf-17x.yaml 
configmap/cm1 created
$ kubectl get configmaps
NAME   DATA   AGE
cm1    1      17s
$ kubectl describe cm1
error: the server doesn't have a resource type "cm1"
$ kubectl describe configmap cm1
Name:         cm1
Namespace:    default
Labels:       <none>
Annotations:  <none>

Data
====
conf-17x.yaml:
----
User: "17x"
Github: "https://github.com/lixd"
Blog: "https://www.lixueduan.com"

Events:  <none>
```

配置文件如下

```yaml
User: "17x"
Github: "https://github.com/lixd"
Blog: "https://www.lixueduan.com"
```

