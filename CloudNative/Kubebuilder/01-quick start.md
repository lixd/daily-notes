# Kubebuilder Quick Start

> [kubebuilder 官方文档](https://book.kubebuilder.io/introduction.html)

## 1. 概述

### CRD



### Kubebuilder

便于开发 CRD 的一个 SDK。



## 2. Start

### Installation

Realease 页面下载对应操作系统和架构的文件即可。

比如 Linux amd64 架构对应的文件

```shell
wget https://github.com/kubernetes-sigs/kubebuilder/releases/download/v3.2.0/kubebuilder_linux_amd64
```

然后改个名字

```shell
mv kubebuilder_linux_amd64 kubebuilder
```

最后添加可执行权限，并移动到 bin 目录下便于使用。

```shell
chmod +x kubebuilder && mv kubebuilder /usr/local/bin/
```



### Create a Project

执行以下 3 条命令即可自动创建一个项目脚手架。

```shell
mkdir -p ~/projects/guestbook
cd ~/projects/guestbook
kubebuilder init --domain my.domain --repo my.domain/guestbook
```

> 这里需要下载一些 sigs.k8s.io 中的包，如果下载不了的话请先配置 GOPROXY。

输出如下：

```shell
lixd  ~/projects/guestbook $ kubebuilder init --domain lixueduan.com --repo lixueduan.com/guestbook

Writing kustomize manifests for you to edit...
Writing scaffold for you to edit...
Get controller runtime:
$ go get sigs.k8s.io/controller-runtime@v0.10.0
Update dependencies:
$ go mod tidy
Next: define a resource with:
$ kubebuilder create api
```

> 可以看到再最后打印出了一个提示信息
>
> Next: define a resource with:
> $ kubebuilder create api
>
> 告诉我们下一步就是创建 api 。



先看下生成的项目长什么样，具体结构如下：

```shell
 lixd  ~/projects $ tree guestbook
guestbook
├── Dockerfile
├── Makefile
├── PROJECT
├── config
│   ├── default
│   │   ├── kustomization.yaml
│   │   ├── manager_auth_proxy_patch.yaml
│   │   └── manager_config_patch.yaml
│   ├── manager
│   │   ├── controller_manager_config.yaml
│   │   ├── kustomization.yaml
│   │   └── manager.yaml
│   ├── prometheus
│   │   ├── kustomization.yaml
│   │   └── monitor.yaml
│   └── rbac
│       ├── auth_proxy_client_clusterrole.yaml
│       ├── auth_proxy_role.yaml
│       ├── auth_proxy_role_binding.yaml
│       ├── auth_proxy_service.yaml
│       ├── kustomization.yaml
│       ├── leader_election_role.yaml
│       ├── leader_election_role_binding.yaml
│       ├── role_binding.yaml
│       └── service_account.yaml
├── go.mod
├── go.sum
├── hack
│   └── boilerplate.go.txt
└── main.go
```



### Create an API

```shell
kubebuilder create api --group webapp --version v1 --kind Guestbook
```

注意：
* 控制台会提醒是否创建资源(Create Resource [y/n])，输入y

* 接下来控制台会提醒是否创建控制器(Create Controller [y/n])，输入y

具体如下：

```shell
 lixd  ~/projects/guestbook $ kubebuilder create api --group webapp --version v1 --kind Guestbook
Create Resource [y/n]
y
Create Controller [y/n]
y
Writing kustomize manifests for you to edit...
Writing scaffold for you to edit...
api/v1/guestbook_types.go
controllers/guestbook_controller.go
Update dependencies:
$ go mod tidy
Running make:
$ make generate
go: creating new go.mod: module tmp
Downloading sigs.k8s.io/controller-tools/cmd/controller-gen@v0.7.0
go get: added gopkg.in/yaml.v2 v2.4.0
go get: added gopkg.in/yaml.v3 v3.0.0-20210107192922-496545a6307b
go get: added k8s.io/api v0.22.2
go get: added k8s.io/apiextensions-apiserver v0.22.2
go get: added k8s.io/apimachinery v0.22.2
go get: added k8s.io/klog/v2 v2.9.0
go get: added k8s.io/utils v0.0.0-20210819203725-bdf08cb9a70a
go get: added sigs.k8s.io/controller-tools v0.7.0
go get: added sigs.k8s.io/structured-merge-diff/v4 v4.1.2
go get: added sigs.k8s.io/yaml v1.2.0
/home/lixd/projects/guestbook/bin/controller-gen object:headerFile="hack/boilerplate.go.txt" paths="./..."
Next: implement your new API and generate the manifests (e.g. CRDs,CRs) with:
$ make manifests
```



再看一下项目发生了什么变化：

```shell
 ✘ lixd  ~/projects $ tree guestbook
guestbook
├── Dockerfile
├── Makefile
├── PROJECT
├── api
│   └── v1
│       ├── groupversion_info.go
│       ├── guestbook_types.go
│       └── zz_generated.deepcopy.go
├── bin
│   └── controller-gen
├── config
│   ├── crd
│   │   ├── kustomization.yaml
│   │   ├── kustomizeconfig.yaml
│   │   └── patches
│   │       ├── cainjection_in_guestbooks.yaml
│   │       └── webhook_in_guestbooks.yaml
│   ├── default
│   │   ├── kustomization.yaml
│   │   ├── manager_auth_proxy_patch.yaml
│   │   └── manager_config_patch.yaml
│   ├── manager
│   │   ├── controller_manager_config.yaml
│   │   ├── kustomization.yaml
│   │   └── manager.yaml
│   ├── prometheus
│   │   ├── kustomization.yaml
│   │   └── monitor.yaml
│   ├── rbac
│   │   ├── auth_proxy_client_clusterrole.yaml
│   │   ├── auth_proxy_role.yaml
│   │   ├── auth_proxy_role_binding.yaml
│   │   ├── auth_proxy_service.yaml
│   │   ├── guestbook_editor_role.yaml
│   │   ├── guestbook_viewer_role.yaml
│   │   ├── kustomization.yaml
│   │   ├── leader_election_role.yaml
│   │   ├── leader_election_role_binding.yaml
│   │   ├── role_binding.yaml
│   │   └── service_account.yaml
│   └── samples
│       └── webapp_v1_guestbook.yaml
├── controllers
│   ├── guestbook_controller.go
│   └── suite_test.go
├── go.mod
├── go.sum
├── hack
│   └── boilerplate.go.txt
└── main.go
```



具体如下：

* 新增了 /api/v1 目录
* 新增 /bin 目录
* config 目录下新增 /config/crd 和  /config/samples
* 新增 /controllers 目录



同时根据提示，下一步就是生成 manifests：

> Next: implement your new API and generate the manifests (e.g. CRDs,CRs) with:
> $ make manifests



```shell
 lixd  ~/projects/guestbook $ make manifests

/home/lixd/projects/guestbook/bin/controller-gen rbac:roleName=manager-role crd webhook paths="./..." output:crd:artifacts:config=config/crd/bases
```

可以看到，在 /config/crd/bases 目录下生成了一个`webapp.my.domain_guestbooks.yaml` 文件。



到此，一个简单的 CRD 就完成了，接下来开始测试。

### Test It Out

首先需要一个 Kubernetes 环境用于测试，单节点即可。

> 保证当前 kubebuilder 所在的机器可以正常连上 k8s 环境。
>
> kubebuilder 会默认使用当前 kubeconfig 文件中的上下文指定的 k8s 环境。也就是执行`kubectl cluster-info` 命令查到的那个集群。



安装 CRDs 到集群中

```shell
make install
```

具体如下:

```shell
 lixd  ~/projects/guestbook $ make install
/home/lixd/projects/guestbook/bin/controller-gen rbac:roleName=manager-role crd webhook paths="./..." output:crd:artifacts:config=config/crd/bases
go: creating new go.mod: module tmp
Downloading sigs.k8s.io/kustomize/kustomize/v3@v3.8.7
go get: added sigs.k8s.io/kustomize/cmd/config v0.8.5
go get: added sigs.k8s.io/kustomize/kustomize/v3 v3.8.7
go get: added sigs.k8s.io/kustomize/kyaml v0.9.4
go get: added sigs.k8s.io/structured-merge-diff/v3 v3.0.0
go get: added sigs.k8s.io/yaml v1.2.0
/home/lixd/projects/guestbook/bin/kustomize build config/crd | kubectl apply -f -
customresourcedefinition.apiextensions.k8s.io/guestbooks.webapp.my.domain configured
```



运行 controller（为了便于查看日志，这里是前台运行，后续操作可以新开一个终端）

```shell
make run
```

具体如下：

```shell
 lixd  ~/projects/guestbook $ make run
/home/lixd/projects/guestbook/bin/controller-gen rbac:roleName=manager-role crd webhook paths="./..." output:crd:artifacts:config=config/crd/bases
/home/lixd/projects/guestbook/bin/controller-gen object:headerFile="hack/boilerplate.go.txt" paths="./..."
go fmt ./...
go vet ./...
go run ./main.go
2021-12-30T19:58:11.858+0800    INFO    controller-runtime.metrics      metrics server is starting to listen    {"addr": ":8080"}
2021-12-30T19:58:11.858+0800    INFO    setup   starting manager
2021-12-30T19:58:11.859+0800    INFO    starting metrics server {"path": "/metrics"}
2021-12-30T19:58:11.859+0800    INFO    controller.guestbook    Starting EventSource    {"reconciler group": "webapp.my.domain", "reconciler kind": "Guestbook", "source": "kind source: /, Kind="}
2021-12-30T19:58:11.859+0800    INFO    controller.guestbook    Starting Controller     {"reconciler group": "webapp.my.domain", "reconciler kind": "Guestbook"}
2021-12-30T19:58:11.960+0800    INFO    controller.guestbook    Starting workers        {"reconciler group": "webapp.my.domain", "reconciler kind": "Guestbook", "worker count": 1}
```

到此，我们的 controller 就成功运行起来了。



### Install Instances of Custom Resources

就是通过 kubectl 把我们的自定义资源允许起来：

```shell
kubectl apply -f config/samples/
```

> 如果没有 config/samples/ 目录，检查下创建API的时候是否选择Y了。



具体如下:

```shell
 lixd  ~/projects/guestbook $ kubectl apply -f config/samples/
guestbook.webapp.my.domain/guestbook-sample created
```

查看下是否真的运行起来了：

```shell
 lixd  ~/projects/guestbook $ kubectl get guestbook
NAME               AGE
guestbook-sample   43s
```

> ok，正常启动了。

注意：这里用的是 kubectl get guestbook 命令，而不是 kubectl get pods。

我们定义的 CR 也是一个和 Pod 同级的资源。

通过` kubectl api-resources`可以看到我们自定义的 guestbook：

```shell
 lixd  ~/projects/guestbook $ kubectl api-resources
NAME                              SHORTNAMES   APIVERSION                             NAMESPACED   KIND
bindings                                       v1                                     true         Binding
componentstatuses                 cs           v1                                     false        ComponentStatus
configmaps                        cm           v1                                     true         ConfigMap
endpoints                         ep           v1                                     true         Endpoints
// .... 省略
guestbooks                                     webapp.my.domain/v1                    true         Guestbook

```



### Run it On the Cluster

之前我们的 controller 都是在本地运行的，这里把 controller 打包成镜像，也放到 k8s 集群中去运行。



先是打包镜像：

```shell
make docker-build IMG=guestbook:0.1
```

具体如下：

```shell
 ✘ lixd  ~/projects/guestbook $ make docker-build IMG=guestbook:0.1
/home/lixd/projects/guestbook/bin/controller-gen rbac:roleName=manager-role crd webhook paths="./..." output:crd:artifacts:config=config/crd/bases
/home/lixd/projects/guestbook/bin/controller-gen object:headerFile="hack/boilerplate.go.txt" paths="./..."
go fmt ./...
go vet ./...
go: creating new go.mod: module tmp
Downloading sigs.k8s.io/controller-runtime/tools/setup-envtest@latest
go get: installing executables with 'go get' in module mode is deprecated.
        To adjust and download dependencies of the current module, use 'go get -d'.
        To install using requirements of the current module, use 'go install'.
        To install ignoring the current module, use 'go install' with a version,
        like 'go install example.com/cmd@latest'.
        For more information, see https://golang.org/doc/go-get-install-deprecation
        or run 'go help get' or 'go help install'.
go get: added github.com/go-logr/logr v1.2.0
go get: added github.com/go-logr/zapr v1.2.0
go get: added github.com/spf13/afero v1.6.0
go get: added github.com/spf13/pflag v1.0.5
go get: added go.uber.org/atomic v1.7.0
go get: added go.uber.org/multierr v1.6.0
go get: added go.uber.org/zap v1.19.1
go get: added golang.org/x/text v0.3.6
go get: added sigs.k8s.io/controller-runtime/tools/setup-envtest v0.0.0-20211208212546-f236f0345ad2
KUBEBUILDER_ASSETS="/home/lixd/.local/share/kubebuilder-envtest/k8s/1.22.1-linux-amd64" go test ./... -coverprofile cover.out
?       my.domain/guestbook     [no test files]
?       my.domain/guestbook/api/v1      [no test files]
ok      my.domain/guestbook/controllers 6.562s  coverage: 0.0% of statements
docker build -t guestbook:0.1 .
[+] Building 21.3s (4/4) FINISHED
 => [internal] load build definition from Dockerfile                                                               0.0s
 => => transferring dockerfile: 821B                                                                               0.0s
 => [internal] load .dockerignore                                                                                  0.0s
 => => transferring context: 35B                                                                                   0.0s
 => ERROR [internal] load metadata for gcr.io/distroless/static:nonroot                                           21.2s
 => [internal] load metadata for docker.io/library/golang:1.16                                                    15.3s
------
 > [internal] load metadata for gcr.io/distroless/static:nonroot:
------
failed to solve with frontend dockerfile.v0: failed to create LLB definition: failed to do request: Head "https://gcr.io/v2/distroless/static/manifests/nonroot": dial tcp 74.125.23.82:443: connect: connection refused
make: *** [Makefile:74: docker-build] Error 1
```

可以看到，由于国内的网络问题，下载不了 `gcr.io`上的东西，直接报错了，看了下 Dockerfile 做以下几个修改即可：

```dockerfile
# Build the manager binary
FROM golang:1.16 as builder
# 1. 设置GOPROXY，否则大概率卡在拉包环节
ENV GOPROXY=https://goproxy.cn

WORKDIR /workspace
# Copy the Go Modules manifests
COPY go.mod go.mod
COPY go.sum go.sum
# cache deps before building and copying source so that we don't need to re-download as much
# and so that source changes don't invalidate our downloaded layer
RUN go mod download

# Copy the go source
COPY main.go main.go
COPY api/ api/
COPY controllers/ controllers/

# Build
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -o manager main.go

# Use distroless as minimal base image to package the manager binary
# Refer to https://github.com/GoogleContainerTools/distroless for more details

# 2.把gcr.io中的镜像替换成dockerhub上的，需要配置一个docker加速器，不然也可能会很慢。
#FROM gcr.io/distroless/static:nonroot
FROM katanomi/distroless-static:nonroot
WORKDIR /
COPY --from=builder /workspace/manager .
USER 65532:65532

ENTRYPOINT ["/manager"]
```

主要有两个改动：

* 1）设置GOPROXY，否则大概率卡在拉包环节`ENV GOPROXY=https://goproxy.cn`
* 2）把gcr.io中的镜像替换成dockerhub上的，`FROM gcr.io/distroless/static:nonroot`-->`FROM katanomi/distroless-static:nonroot`
  * 需要配置一个docker加速器，不然也可能会很慢。



再次尝试具体如下：

```shell
 ✘ lixd  ~/projects/guestbook $ make docker-build IMG=guestbook:0.1
/home/lixd/projects/guestbook/bin/controller-gen rbac:roleName=manager-role crd webhook paths="./..." output:crd:artifacts:config=config/crd/bases
/home/lixd/projects/guestbook/bin/controller-gen object:headerFile="hack/boilerplate.go.txt" paths="./..."
go fmt ./...
go vet ./...
KUBEBUILDER_ASSETS="/home/lixd/.local/share/kubebuilder-envtest/k8s/1.22.1-linux-amd64" go test ./... -coverprofile cover.out
?       my.domain/guestbook     [no test files]
?       my.domain/guestbook/api/v1      [no test files]
ok      my.domain/guestbook/controllers 6.110s  coverage: 0.0% of statements
docker build -t guestbook:0.1 .
[+] Building 58.7s (17/17) FINISHED
 => [internal] load build definition from Dockerfile                                                               0.0s
 => => transferring dockerfile: 892B                                                                               0.0s
 => [internal] load .dockerignore                                                                                  0.0s
 => => transferring context: 35B                                                                                   0.0s
 => [internal] load metadata for docker.io/katanomi/distroless-static:nonroot                                     15.3s
 => [internal] load metadata for docker.io/library/golang:1.16                                                    11.6s
 => [stage-1 1/3] FROM docker.io/katanomi/distroless-static:nonroot@sha256:be5d77c62dbe7fedfb0a4e5ec2f91078080800  0.0s
 => [builder 1/9] FROM docker.io/library/golang:1.16@sha256:5bc0b18148c628bf34fcba977f27479f08a9fc289df84346d697c  0.0s
 => [internal] load build context                                                                                  0.0s
 => => transferring context: 91.70kB                                                                               0.0s
 => CACHED [builder 2/9] WORKDIR /workspace                                                                        0.0s
 => CACHED [builder 3/9] COPY go.mod go.mod                                                                        0.0s
 => CACHED [builder 4/9] COPY go.sum go.sum                                                                        0.0s
 => [builder 5/9] RUN go mod download                                                                             17.2s
 => [builder 6/9] COPY main.go main.go                                                                             0.0s
 => [builder 7/9] COPY api/ api/                                                                                   0.0s
 => [builder 8/9] COPY controllers/ controllers/                                                                   0.0s
 => [builder 9/9] RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -o manager main.go                        25.8s
 => CACHED [stage-1 2/3] COPY --from=builder /workspace/manager .                                                  0.0s
 => exporting to image                                                                                             0.0s
 => => exporting layers                                                                                            0.0s
 => => writing image sha256:c9bb76c936133b73511dae42fbe64694c7bd76ffbc43c91d5382281f440f48ec                       0.0s
 => => naming to docker.io/library/guestbook:0.1                                                                   0.0s

Use 'docker scan' to run Snyk tests against images to find vulnerabilities and learn how to fix them
```

花了1分钟时间，总算是build完成了。

```shell
REPOSITORY                                                       TAG                                                     IMAGE ID       CREATED          SIZE
guestbook                                                        0.1                                                     c9bb76c93613   52 minutes ago   47.7MB
```



然后部署

> 如果是部署到其他集群，还需要先把镜像push上去，这里是本地跑，所以就省略了这步。

```shell
make deploy IMG=guestbook:0.1
```



具体如下：

```shell
 lixd  ~/projects/guestbook  make deploy IMG=guestbook:0.1
/home/lixd/projects/guestbook/bin/controller-gen rbac:roleName=manager-role crd webhook paths="./..." output:crd:artifacts:config=config/crd/bases
cd config/manager && /home/lixd/projects/guestbook/bin/kustomize edit set image controller=guestbook:0.1
/home/lixd/projects/guestbook/bin/kustomize build config/default | kubectl apply -f -
namespace/guestbook-system created
customresourcedefinition.apiextensions.k8s.io/guestbooks.webapp.my.domain configured
serviceaccount/guestbook-controller-manager created
role.rbac.authorization.k8s.io/guestbook-leader-election-role created
clusterrole.rbac.authorization.k8s.io/guestbook-manager-role created
clusterrole.rbac.authorization.k8s.io/guestbook-metrics-reader created
clusterrole.rbac.authorization.k8s.io/guestbook-proxy-role created
rolebinding.rbac.authorization.k8s.io/guestbook-leader-election-rolebinding created
clusterrolebinding.rbac.authorization.k8s.io/guestbook-manager-rolebinding created
clusterrolebinding.rbac.authorization.k8s.io/guestbook-proxy-rolebinding created
configmap/guestbook-manager-config created
service/guestbook-controller-manager-metrics-service created
deployment.apps/guestbook-controller-manager created
```

可以看到创建了一大推东西，其中还创建了一个新的 namaspace。

那就去这个 namaspace 看下，controller 跑起来没有：

```shell
 ✘ lixd  ~/projects/guestbook $ kubectl get pods -n guestbook-system
NAME                                            READY   STATUS             RESTARTS   AGE
guestbook-controller-manager-7f94898cdc-67blj   1/2     ImagePullBackOff   0          2m26s
```

我去，镜像拉不下来，查看具体情况

```shell
 lixd  ~/projects/guestbook $ kubectl describe pod guestbook-controller-manager-7f94898cdc-67blj -n guestbook-system
Name:         guestbook-controller-manager-7f94898cdc-67blj
Namespace:    guestbook-system
Priority:     0
// 省略...
Events:
  Type     Reason     Age                   From               Message
  ----     ------     ----                  ----               -------
  Normal   Scheduled  2m59s                 default-scheduler  Successfully assigned guestbook-system/guestbook-controller-manager-7f94898cdc-67blj to docker-desktop
  Normal   Pulled     2m43s                 kubelet            Container image "guestbook:0.1" already present on machine
  Normal   Created    2m42s                 kubelet            Created container manager
  Normal   Started    2m42s                 kubelet            Started container manager
  Warning  Failed     2m14s                 kubelet            Failed to pull image "gcr.io/kubebuilder/kube-rbac-proxy:v0.8.0": rpc error: code = Unknown desc = Error response from daemon: Get "https://gcr.io/v2/": dial tcp 142.250.157.82:443: i/o timeout
  Normal   Pulling    109s (x3 over 2m58s)  kubelet            Pulling image "gcr.io/kubebuilder/kube-rbac-proxy:v0.8.0"
  Warning  Failed     94s (x2 over 2m43s)   kubelet            Failed to pull image "gcr.io/kubebuilder/kube-rbac-proxy:v0.8.0": rpc error: code = Unknown desc = Error response from daemon: Get "https://gcr.io/v2/": net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers)
  Warning  Failed     94s (x3 over 2m43s)   kubelet            Error: ErrImagePull
  Warning  Failed     69s (x6 over 2m42s)   kubelet            Error: ImagePullBackOff
  Normal   BackOff    56s (x7 over 2m42s)   kubelet            Back-off pulling image "gcr.io/kubebuilder/kube-rbac-proxy:v0.8.0"
```

可以看到，又是拉`gcr.io`上的镜像超时。。

在 dockerhub 找了下，有热心网友分享的镜像，这里也替换以下,修改以下文件

`config\default\manager_auth_proxy_patch.yaml` 中的镜像：

```yaml
# This patch inject a sidecar container which is a HTTP proxy for the
# controller manager, it performs RBAC authorization against the Kubernetes API using SubjectAccessReviews.
apiVersion: apps/v1
kind: Deployment
metadata:
  name: controller-manager
  namespace: system
spec:
  template:
    spec:
      containers:
      - name: kube-rbac-proxy
        # 替换 gcr 镜像
        #image: gcr.io/kubebuilder/kube-rbac-proxy:v0.8.0
        image: garyellis/kube-rbac-proxy:v0.8.0
// 省略...
```



替换后再次尝试

```shell
make deploy IMG=guestbook:0.1
```

查看运行情况

```shell
 ✘ lixd  ~/projects/guestbook $ kubectl get pods -n guestbook-system
NAME                                           READY   STATUS    RESTARTS   AGE
guestbook-controller-manager-59b964448-5dwv2   2/2     Running   0          3m9s
```

看下日志

```shell
 ✘ lixd  ~/projects/guestbook $ kubectl describe pod guestbook-controller-manager-59b964448-5dwv2 -n guestbook-system
Name:         guestbook-controller-manager-59b964448-5dwv2
Events:
  Type    Reason     Age    From               Message
  ----    ------     ----   ----               -------
  Normal  Scheduled  2m23s  default-scheduler  Successfully assigned guestbook-system/guestbook-controller-manager-59b964448-5dwv2 to docker-desktop
  Normal  Pulling    2m22s  kubelet            Pulling image "garyellis/kube-rbac-proxy:v0.8.0"
  Normal  Pulled     34s    kubelet            Successfully pulled image "garyellis/kube-rbac-proxy:v0.8.0" in 1m47.1412253s
  Normal  Created    34s    kubelet            Created container kube-rbac-proxy
  Normal  Started    34s    kubelet            Started container kube-rbac-proxy
  Normal  Pulled     34s    kubelet            Container image "guestbook:0.1" already present on machine
  Normal  Created    34s    kubelet            Created container manager
  Normal  Started    34s    kubelet            Started container manager
```



可算是跑起来了。



### Uninstall CRDs

使用以下命令即可将其中集群中移除

```shell
make uninstall
```

具体如下：

```shell
 lixd  ~/projects/guestbook $ make uninstall
/home/lixd/projects/guestbook/bin/controller-gen rbac:roleName=manager-role crd webhook paths="./..." output:crd:artifacts:config=config/crd/bases
/home/lixd/projects/guestbook/bin/kustomize build config/crd | kubectl delete --ignore-not-found=false -f -
customresourcedefinition.apiextensions.k8s.io "guestbooks.webapp.my.domain" deleted
```





### Undeploy controller

将 controller 移除也很简单

```shell
make undeploy
```



具体如下：

```shell
 lixd  ~/projects/guestbook  make undeploy
/home/lixd/projects/guestbook/bin/kustomize build config/default | kubectl delete --ignore-not-found=false -f -
namespace "guestbook-system" deleted
serviceaccount "guestbook-controller-manager" deleted
role.rbac.authorization.k8s.io "guestbook-leader-election-role" deleted
clusterrole.rbac.authorization.k8s.io "guestbook-manager-role" deleted
clusterrole.rbac.authorization.k8s.io "guestbook-metrics-reader" deleted
clusterrole.rbac.authorization.k8s.io "guestbook-proxy-role" deleted
rolebinding.rbac.authorization.k8s.io "guestbook-leader-election-rolebinding" deleted
clusterrolebinding.rbac.authorization.k8s.io "guestbook-manager-rolebinding" deleted
clusterrolebinding.rbac.authorization.k8s.io "guestbook-proxy-rolebinding" deleted
configmap "guestbook-manager-config" deleted
service "guestbook-controller-manager-metrics-service" deleted
deployment.apps "guestbook-controller-manager" deleted
Error from server (NotFound): error when deleting "STDIN": customresourcedefinitions.apiextensions.k8s.io "guestbooks.webapp.my.domain" not found
make: *** [Makefile:101: undeploy] Error 1
```

> 报了个错，说是找不到 `guestbooks.webapp.my.domain`这个 crd，看来是卸载早了，应该先 undeploy 在 uninstall 了。





## 3. 小结

虽然一句代码没写，不过也算是体验了一把 CRD 了，后续教程看起来大概能有个印象了。

整个过程中，最大的问题就是网络。。
