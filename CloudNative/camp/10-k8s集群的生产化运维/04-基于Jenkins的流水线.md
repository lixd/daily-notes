# 基于 Jenkins 的流水线



Jenkins 因为退出比较早，因此在同类产品中占有率最高，但这不是云原生推荐的方式。



### 持续集成容器化

所谓持续集成容器化就是把 Jenkins 各个组件以容器化方式运行。

但是该方式会存在一个问题，Jenkins slave 以容器方式运行，但是 slave 在执行流水线时可能需要 build docker 镜像，这就涉及到一个**Docker in Docker** 的问题。

* 最主要解决的问题是保证 CI 构建环境和开发构建环境的统
* 使用容器作为标准的构建环境，将代码库作为 Volume 挂载进构建容器。
* 由于构建结果是 Docker 镜像，所以要在构建容器中执行"docker build"命令，需要注意 Docker in Docker 的问题。



### DinD 问题

关于 Docker in Docker 有多种方法

**方法1: docker in docker**

* 早期尝试
  * https://github.com/jpetazzo/dind (achived)

* 官方支持
  * https://hub.docker.com/_/docker/
  * `docker run --privileged -d docker:dind`

该方式可能引入的问题：

https://jpetazzo.github.io/2015/09/03/do-not-use-docker-in-docker-for-ci/

> if your use case really absolutely mandates Docker-in-Docker, have a look at sysbox, it
> might be what you need.



**方法2: mount host docker.socket**

```bash
docker run -v /var/run/ docker.sock:/var/run/docker.sock ...
```

通过 -v 方式，将宿主机的 docker.sock 挂载到容器里，这样容器里的程序就可以调用外部宿主机上的 Docker 来进行 docker build 了。

> 这样存在安全问题，容器内的程序拿到 docker.sock 后就可以进行很多操作了，比如直接把 slave 容器删了



**方法3：kaniko**

https://github.com/GoogleContainerTools/kaniko

Google 提供的一个工具

```bash
docker run -ti --rm -v `pwd`:/workspace -v `pwd`/config.json:/kaniko/.docker/config.json:ro gcr.io/kaniko-project/executor:latest --dockerfile=Dockerfile --destination=yourimagename
```





###  构建基于Kubernetes的Jenkins Pipeline



**1）image 准备：基于Jenkins官方Image安装自定义插件**

* https://github.com/jenkinsci/kubernetes-plugin
  * 默认安装 Kubernetes plugin
* https://github.com/jenkinsci/docker-inbound-agent
  * 如果需要做 docker build,则需要自定义 Dockerfile,安装 docker binary,并且把 host 的.
    docker.socket mount 进 container
  * 这里就是后续Cloud Provider PodTemplate 中配置的镜像，Jenkins 使用该镜像才拥有 docker build 的能力。

**2）Jenkins配置的保存**

* 需要创建 PVC,以便保证在 jenkins master pod 出错时，新的 kubernetes pod 可以 mount 同样的工作目录,
  保证配置不丢失
* 可以通过 jenkins scm plugin 把 jenkins配置保存至 GitHub

**3）创建Kubernetes spec**





### Jenkins Cloud provider 配置

**就是把 k8s 相关权限配置给 Jenkins，后续 Jenkins 跑任务时直接在 k8s 中起 Pod 来跑。**

* 在 Jenkins System Config 选择点击 Cloud,并选择 kubernetes
* 创建 Kubernetes ServiceAccount,并在 kubernetes 对应的 namespace 授予 namespace
  admin 权限
* 指定 Jenkins slave 的 image
* 按需指定 volume mount,如需在 slave container 内部执行 docker 命令，则需要 mount
  /var/run/docker.sock

**详细配置流程：**

菜单 Manage Jenkins -> Manage Node and Cloud -> Configure Cloud

* Add a new cloud: Kubernetes
  * Kubernetes URL: https:/ /kubernetes.default
  * Kubernetes Namespace: default
  * Credentials: Add->Jenkins->Kind: Kubernetes Service Account
  * Test connection
  * Jenkins URL: http://jenkins
* PodTemplate
  * Labels: **jnlp-slave**
  * Add Container //新版本Jenkins会默认用社区镜像启动 jnlp slave, 可以通过定义同名容器覆盖
    * Name: **jnlp**
    * Image: cncamp/inbound-agent 
    * Command: ""
    * Arguments to pass to the command: ${computer.jnlpmac} ${computer.name}
* save



### 创建Jenkins Job

* Git Integration
  * Jenkins webhook on Github
  * Git review / merge Bot
* Build job
  * Git clone code
  * Build binary
  * Build Docker image
  * Push Docker image to hub

* Testing
  * UT/ UT Coverage
  * E2E
    * Conformance
    * Conformance Slow 
  * LnP




### Jenkins 练习

1）创建Jenkins Master

```bash
kubectl apply -f jenkins.yaml
kubectl apply -f sa.yaml
```

> Jenkins.yaml &  sa.yaml 具体文件内容见附录

2）等待 Jenkins-0 pod运行，查看日志查找 root 密码

```bash
kubectl logs -f Jenkins-0
```

3）查看 Jenkins Service 的 NodePort,登录 Jenkins console

```bash
http://$ip:<nodePort>
```


输入 root 密码并创建管理员用户，登录

4）安装Kubernetes插件

* 菜单Manage Jenkins->Manage Plugins->Available	
* 查找并安装 Kubernetes 相关插件
  * 选择Kubernetes，点击install without restart
* 等待安装完成

5）创建一个任务进行测试

* Dashboard->Create a Job->Freestyle project
*  Restrict where this project can be run
  * Label Expression: **jnlp-slave**
* Build->Add build step->Execute shell
  * 添加一个简单的脚本，作为本次测试任务
  * echo hello world
* Build Now
* 到 k8s 中查看 jenkins slave pod: 

```bash
kubectl get pod
jnlp-hpsqb 1/1 Running 0
```

* 查看job log

```bash
Building remotely on jnlp-hpsqb (inlp-slave) in workspace
/home/jenkins/ agent/workspace/test [test] $ /bin/sh -xe
/tmp/jenkins4853086890420857212.sh + echo hello world hello world Finished: SUCCESS
```







## 附录

### jenkins.yaml

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: jenkins
spec:
  selector:
    matchLabels:
      name: jenkins
  serviceName: jenkins
  replicas: 1
  template:
    metadata:
      name: jenkins
      labels:
        name: jenkins
    spec:
      terminationGracePeriodSeconds: 10
      serviceAccountName: jenkins
      containers:
        - name: jenkins
          image: jenkins/jenkins:lts-alpine
          ports:
            - containerPort: 8080
            - containerPort: 50000
---
apiVersion: v1
kind: Service
metadata:
  name: jenkins
spec:
  selector:
    name: jenkins
  ports:
    - name: http
      port: 80
      targetPort: 8080
      protocol: TCP
    - name: agent
      port: 50000
      protocol: TCP
  type: NodePort
```



### sa.yaml

```yaml
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: jenkins

---
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: jenkins
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["create","delete","get","list","patch","update","watch"]
- apiGroups: [""]
  resources: ["pods/exec"]
  verbs: ["create","delete","get","list","patch","update","watch"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get","list","watch"]
- apiGroups: [""]
  resources: ["events"]
  verbs: ["watch"]
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: jenkins
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: jenkins
subjects:
- kind: ServiceAccount
  name: jenkins
```

