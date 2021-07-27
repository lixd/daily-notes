# K8S 中挂载 volume 的坑



## 常见问题

### 场景一：挂载配置文件到应用程序所在的目录

k8s 部署 YAML 文件如下：

```yaml
# httpserver 依赖的配置文件
apiVersion: v1
data:
  config.yaml: |
    port: 8080
kind: ConfigMap
metadata:
  name: httpserver-config
  namespace: default

---

# httpserver deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: httpserver
  labels:
    app: httpserver
spec:
  replicas: 1
  selector:
    matchLabels:
      app: httpserver
  template:
    metadata:
      labels:
        app: httpserver
    spec:
      volumes:
      - name: config
        configMap: 
          name: httpserver-config
      containers:
      - name: bookstore
        image: uhub.service.ucloud.cn/wangkai/httpserver:v0.0.1
        ports:
        - containerPort: 8080
        # 把配置文件挂载到 /home 目录去
        volumeMounts:
        - name: config
          mountPath: /home
```

执行这些 YAML 配置后，我们会发现程序没有启动起来，报错：`/bin/sh: /home/server: No such file or directory`。原因很简单，我们把 `config volume` 挂载到 `/home` 目录后覆盖了该目录下的文件。以至于**此时 `/home` 目录下只有 `config.yaml`，原先的二进制文件被覆盖掉了**。

解决的办法是：

* 1）把配置文件挂载到其他目录，比如 `/data`，然后修改应用程序代码，去 `/data` 目录读。
* 2）添加 `subPath` 配置，`subPath` 可以指明使用 `volume` 的一个子目录，而不是其整个根目录。

第一种办法**曲线救国**，我们使用第二种 k8s 自身的解决方案来解决问题，只需要修改几行配置即可。

```yaml
spec:
  volumes:
  - name: config
    configMap: 
      name: httpserver-config
  containers:
  - name: bookstore
    image: uhub.service.ucloud.cn/wangkai/httpserver:v0.0.1
    ports:
    - containerPort: 9090
    volumeMounts:
    - name: config
      # 在目录地址后加上文件名，与 subPath 中指定的文件名相同
      mountPath: /home/config.yaml
      # 使用 config volume 的 config.yaml 文件，而不是整个 volume
      subPath: config.yaml
```



### 场景二：同时挂 ConfigMap & Secret 到同一目录下

有些场景，我们的配置文件可能不止一个，我们的应用程序要读取当前目录下的多个配置文件，比如既有 `ConfigMap` 也有 `Secret`。Docker 是不允许多个 Volume 挂到同一目录的，此类情况也可以通过 `subPath` 得到解决。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: httpserver
  labels:
    app: httpserver
spec:
  replicas: 1
  selector:
    matchLabels:
      app: httpserver
  template:
    metadata:
      labels:
        app: httpserver
    spec:
      volumes:
      - name: db-secret
        secret:
          secretName: db-secret
      - name: config
        configMap: 
          name: httpserver-config
      containers:
      - name: httpserver
        image: uhub.service.ucloud.cn/wangkai/httpserver:v0.0.1
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /home/config.yaml
          # 只挂载 volume 的 config.yaml 而不是整个 volume
          subPath: config.yaml
        - name: db-secret
          mountPath: /home/secret.yaml
          # 只挂载 volume 的 secret.yaml 而不是整个 volume
          subPath: secret.yaml
```



## 相关知识点

### subPath

* 1）做为volumes使用时,subPath代表存储卷的子路径。
* 2）作为configmap/secret使用时,subPath代表configmap/secret的子路径

> subPath参考博客 https://soulchild.cn/1911.html

configmap：

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: config-test
data:
  config.ini: "hello"
  config.conf: "nihao"
```

单独挂载一个key为文件：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: testpod
spec:
  containers:
  - name: testc
    image: busybox
    command: ["/bin/sleep","10000"]
    # 只挂载configmap中的部分key
    volumeMounts:
      - name: config-test
        mountPath: /etc/config.ini   # 最终在容器中的文件名
        subPath: config.ini  #要挂载的confmap中的key的名称
  volumes:
    - name: config-test
      configMap:
        name: config-test
```

挂载多个key为文件：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: testpod2
spec:
  containers:
  - name: testc
    image: busybox
    command: ["/bin/sleep","10000"]
    # 分别挂载为多个文件
    volumeMounts:
      - name: config-test
        mountPath: /etc/config.ini   # 最终在容器中的文件名
        subPath: config.ini  #要挂载的confmap中的key的名称
      - name: config-test
        mountPath: /etc/config.conf   # 最终在容器中的文件名
        subPath: config.conf  #要挂载的confmap中的key的名称
  volumes:
    - name: config-test
      configMap:
        name: config-test
```

多个container挂载不同的key：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: testpod1
spec:
  containers:
  - name: testc
    imagePullPolicy: Never
    image: busybox
    command: ["/bin/sleep","10000"]
    # 这里只挂载.ini
    volumeMounts:
      - name: config-test
        mountPath: /etc/config/config.ini
        subPath: config.ini
  - name: testc1
    imagePullPolicy: Never
    image: busybox
    command: ["/bin/sleep","10000"]
    # 这里只挂载.conf
    volumeMounts:
      - name: config-test
        mountPath: /etc/config/config.conf
        subPath: config.conf
  volumes:
    - name: config-test
      configMap:
        name: config-test
        items:
        - key: config.ini
          path: config.ini
        - key: config.conf
          path: config.conf
```

