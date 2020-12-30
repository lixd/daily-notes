# ConfigMap、Secret



## 1. 概述

ConfigMap顾名思义，是用于保存配置数据的键值对，可以用来保存单个属性，也可以保存配置文件。

Secret可以为Pod提供密码、Token、私钥等敏感数据；对于一些非敏感数据，比如应用的配置信息，则可以使用ConfigMap。

> 官方文档：[Secret](https://kubernetes.io/docs/concepts/configuration/secret/)，[ConfigMap](https://kubernetes.io/docs/concepts/configuration/configmap/)



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
- 使用 Volume 将 ConfigMap 作为文件或目录挂载

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
      image: busybox
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

通过 `env`单个指定或者通过`envFrom`直接加载整个 configmap

根据以上 yaml 文件创建 pod 并查看日志

```sh
$ kubectl apply -f cm.yaml
# 查看日志 会打印出一堆环境变量 其中就有我们指定的 configmap
$ kubectl logs test-pod
log_level=INFO
CUSTOM_FIRST=hello world
CUSTOM_SECOND=hello configmap
```



**使用 Volume 将 ConfigMap 作为文件或目录挂载**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
spec:
  containers:
  - image: busybox
    name: app
    volumeMounts:
    - mountPath: /etc/foo
      name: foo
      readOnly: true
    args:
    - /bin/sh
    - -c
    - sleep 10; touch /tmp/healthy; sleep 30000
  volumes:
  - name: foo
    configMap:
      name: cm1
```

 进入 pod 查看，会在前面指定的 /etc/foo 目录下创建 configmap中的文件

```sh
$ kubectl apply -f cm2.pod.yaml 
# 进入 pod 查看，会在前面指定的 /etc/foo 目录下创建 configmap中的文件
$ kubectl exec -it test-pod sh
$ cd /etc/foo/
$ ls
first   second
$ cat first 
hello world
```



## 3. Secret

Secret 和 Configmap 类似，不过 Secret 是加密后的，一般用于存储敏感数据，如 比如密码，token，密钥等。

Secret有三种类型：

* 1）**Opaque**：base64 编码格式的 Secret，用来存储密码、密钥等；但数据也可以通过base64 –decode解码得到原始数据，所以加密性很弱。

* 2）**Service Account**：用来访问Kubernetes API，由Kubernetes自动创建，并且会自动挂载到Pod的 /run/secrets/kubernetes.io/serviceaccount 目录中。

* 3）**kubernetes.io/dockerconfigjson** ： 用来存储私有docker registry的认证信息。





### 1. 创建

Secret 同样有多种创建方式

* 1）**yaml 描述文件**：事先写好标准的secret的yaml文件，然后kubectl create -f 创建
* 2）**--from-file**：通过指定目录或文件创建，将一个或多个配置文件创建为一个Secret
* 3）**--from-literal**：通过直接在命令行中通过 key-value 字符串方式指定configmap参数创建

**yaml 描述文件**



```sh
$ kubectl apply -f secret.yaml 
secret/mysecret created

# describe 或者 get 命令不会直接显示 secret 中的内容
$ kubectl get secret mysecret -o go-template='{{.data}}'
map[hello:d29ybGQ=
```



`secret.yaml `内容如下：

> **注意**：通过yaml创建Opaque类型的Secret值需要base64编码

```sh
$ echo -n 'world'|base64
d29ybGQ=
```

```yaml
#secret.yaml
---
apiVersion: v1
kind: Secret
metadata: 
  name: mysecret
type: Opaque
data:  
  hello: d29ybGQ=
```



**--from-file**

直接从文件创建，默认 key 为文件名

```sh
$ cat hello.txt 
world
# generic 表示创建普通 secret
$ kubectl create secret generic s1 --from-file=hello.txt 
secret/s1 created
$ kubectl get secrets
NAME                                              TYPE                                  DATA   AGE
s1                                                Opaque                                1     20s
# describe 或者 get 命令不会直接显示 secret 中的内容
$ kubectl get secret s1 -o go-template='{{.data}}'
map[hello.txt:d29ybGQK]
```



**--from-literal**

字符串方式可以手动指定 key、value

```sh
$ kubectl create secret generic s2 --from-literal=hello=world
secret/s2 created
$ kubectl get secret s1 -o go-template='{{.data}}'
map[hello:d29ybGQ=]
```



### 2. 使用

同样有两种方式：

- 将 Secret 中的数据设置为环境变量
- 使用 Volume 将 Secret 作为文件或目录挂载





**用作环境变量**

> 和 configmap 类似，把 configMapKeyRef 替换成 secretKeyRef 即可,同时 secret 是单个的，所以也去掉了批量获取的 envFrom 字段。

```yaml
# secret-env.yaml
---
apiVersion: v1
kind: Pod
metadata:
  name: test-secret-env-pod
spec:
  containers:
    - name: test-container
      image: busybox
      command: [ "/bin/sh", "-c", "env" ]
      env:
        - name: CUSTOM_HELLO
          valueFrom:
            secretKeyRef:
              name: s2
              key: hello
  restartPolicy: Never
```



运行pod并查看打印出来的环境变量

```sh
$ kubectl apply -f secret-env.yaml 
pod/test-secret-env-pod created

$ kubectl logs test-secret-env-pod
CUSTOM_HELLO=world
```





**Volume 挂载方式**

```yaml
# secret.pod.yaml
---
apiVersion: v1
kind: Pod
metadata:
  name: test-secret-pod
spec:
  containers:
  - name: test-secret
    image: busybox
    args:
    - sleep
    - "3600"
    volumeMounts:
    - name: config
      mountPath: "/etc/foo"
      readOnly: true
  volumes:
  - name: config
    projected:
      sources:
      - secret:
          name: mysecret
```



创建Pod后进入容器查看，可以看到在指定目录`/etc/foo`中存在我们指定的secret中的内容`hello`

```sh
$ kubectl exec -it test-secret-pod sh
/ # ls
bin   dev   etc   home  proc  root  sys   tmp   usr   var
$ cd etc/foo/
$ ls
hello
$ cat hello 
world
```

