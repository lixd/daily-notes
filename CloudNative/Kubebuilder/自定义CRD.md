# 自定义 CRD 教程

[Kubernetes中自定义Controller](https://mdnice.com/writing/96db31f3c4e14fe281531b8cae1ca51d)



>[使用 CustomResourceDefinition 扩展 Kubernetes API](https://kubernetes.io/zh/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/)
>
>[k8s自定义controller三部曲之一:创建CRD（Custom Resource Definition）](https://blog.csdn.net/boling_cavalry/article/details/88917818)
>
>[k8s自定义controller三部曲之二:自动生成代码](https://blog.csdn.net/boling_cavalry/article/details/88924194)
>
>[k8s自定义controller三部曲之三：编写controller代码](https://blog.csdn.net/boling_cavalry/article/details/88934063)





## 1. 概述

自定义 CRD 大致可以分为以下 3 步：

* 1）创建 CRD
* 2）生成代码
* 3）编写 Controller



## 2. 创建 CRD

###  student.yaml

然后创建一个 student.yaml，内容如下：

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  # metadata.name的内容是由"复数名.分组名"构成，如下，students是复数名，lixd是分组名
  name: students.lixd
spec:
  # 分组名，在REST API中也会用到的，格式是: /apis/分组名/CRD版本
  group: lixd
  # list of versions supported by this CustomResourceDefinition
  versions:
    - name: v1
      # 每个版本都可以通过服务标志启用/禁用。
      served: true
      # 必须将一个且只有一个版本标记为存储版本。
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                name:
                  type: string
                school:
                  type: string
  # 范围是属于namespace的
  scope: Namespaced
  names:
    # 复数名
    plural: students
    # 单数名
    singular: student
    # 类型名
    kind: Student
    # 简称，就像service的简称是svc
    shortNames:
    - stu
```



然后部署这个 crd

```bash
$ kubectl apply -f crd-student.yaml 
customresourcedefinition.apiextensions.k8s.io/students.lixd created
```



后续如果发起对类型为 Student 的对象的处理，k8s 的 api server 就能识别到该对象类型了，如下所示，可以用 kubectl get crd 和 kubectl describe crd stu 命令查看更多细节。

> 其中 stu 是在 student.yaml 中定义的 shortNames。



也可以直接去访问 etcd，查看在 etcd 里是个什么样子的：

先安装 etcdctl

```bash
$ wget https://github.91chi.fun//https://github.com//etcd-io/etcd/releases/download/v3.5.3/etcd-v3.5.3-linux-amd64.tar.gz
$ tar -zxvf etcd-v3.5.3-linux-amd64.tar.gz
$ cd etcd-v3.5.3-linux-amd64
$ cp etcdctl /usr/local/bin/
```

然后执行查询

```bash
$ ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt --key=/etc/kubernetes/pki/etcd/healthcheck-client.key get /registry/apiextensions.k8s.io/customresourcedefinitions/students.lixd --prefix
# 输出内容太多，这里就就不贴了
```



### 创建 stduent 对象

在前面部署完 crd-student.yaml  之后，k8s 已经认识 student 这个对象了，因此我们可以直接通过 k8s api 创建 student 对象，就像创建一个 pod 或者 deployment 等内置对象一样。



定义一个 object-student.yaml 文件，内容如下：

```yaml
apiVersion: lixd/v1
kind: Student # kind 就是我们前面定义的类型
metadata:
  name: object-student
spec:
  name: "张三"
  school: "深圳中学"
```

然后用 apply 命令部署一下：

```bash
kubectl apply -f object-student.yaml
```

查看一下刚部署 student 对象

```bash
[root@master custom_controller]# kubectl get stu
NAME             AGE
object-student   15s
```



直接去 etcd 查看

```bash
ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/healthcheck-client.crt --key=/etc/kubernetes/pki/etcd/healthcheck-client.key get /registry/lixd/students/default/object-student --print-value-only

```

> Key 格式：/registry/{group}/{名称复数}/{namespace}/{对象名字}

至此，自定义 API 对象（也就是 CRD）就创建成功了，此刻我们只是让 k8s 能识别到 Student这个对象的身份，但是当我们创建 Student 对象的时候，还没有触发任何业务（相对于创建Pod 对象的时候，会触发 kubelet 在 node 节点创建 docker 容器），这也是后面的章节要完成的任务。





## 3. 生成代码

### controller workflow 

controller  workflow 如下：

![](assets/k8s-workflow.png)

controller 的开发还是比较复杂的，为了简化我们开发，k8s 的大师们利用自动代码生成工具将 controller 之外的事情都做好了，我们只要专注于 controller 的开发就好。



我们要做的事就是编写 API 对象 Student 相关的声明的定义代码，然后用代码生成工具结合这些代码，自动生成 Client、Informet、WorkQueue 相关的代码；



### 准备文件

创建项目文件夹 k8s_customize_controller，以及 crd 相关的三层目录：

```shell
mkdir -p pkg/apis/crd
```

在新建的 lixd 目录下创建文件 register.go，内容如下：

```go
package crd

const (
        GroupName = "bolingcavalry.k8s.io"
        Version   = "v1"
)

```

在 bolingcavalry 目录下创建名为**v1**的文件夹；

在 v1 文件夹下创建文件 doc.go，内容如下：

```go
// +k8s:deepcopy-gen=package

// +groupName=lixueduan.com
package v1

```

两行注释主要用于生成代码：

* 一个是声明为整个 v1 包下的类型定义生成 DeepCopy 方法
* 另一个声明了这个包对应的 API 的组名，和 CRD 中的组名一致；

> 请注意，此注释必须位于正上方的注释块中package



在 v1 文件夹下创建文件 types.go，里面定义了 Student 对象的具体内容：

**对于任何 CustomResource 都必须定义单数（xxx）和复数（xxxList）两个结构体**，在本例中就是 Student 和 StudentList。

```go
package v1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// +genclient
// +genclient:noStatus
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

type Student struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`
	Spec              StudentSpec `json:"spec"`
}

type StudentSpec struct {
	Name   string `json:"name"`
	School string `json:"school"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

// StudentList is a list of Student resources
type StudentList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata"`

	Items []Student `json:"items"`
}
```

然后也是一些注释，用于生成相关的代码。

* `+genclient`：告诉 client-gen 为这种类型创建一个客户端.
  * 就是生成 clientset 部分代码

* `+genclient:noStatus`：告诉client-gen 这种类型没有通过/status子资源使用规范状态分离。生成的客户端将没有该UpdateStatus方法（client-gen 会盲目地生成该方法，知道Status在你的结构中找到一个字段）。
* `+k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object`：生成 DeepCopyIObject  方法。



在 v1 目录下创建 register.go 文件，此文件的作用是通过 addKnownTypes 方法使得 client 可以知道 Student 类型的 API 对象：

```go
package v1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"

	"k8s_customize_controller/pkg/apis/bolingcavalry"
)

var SchemeGroupVersion = schema.GroupVersion{
	Group:   bolingcavalry.GroupName,
	Version: bolingcavalry.Version,
}

var (
	SchemeBuilder = runtime.NewSchemeBuilder(addKnownTypes)
	AddToScheme   = SchemeBuilder.AddToScheme
)

func Resource(resource string) schema.GroupResource {
	return SchemeGroupVersion.WithResource(resource).GroupResource()
}

func Kind(kind string) schema.GroupKind {
	return SchemeGroupVersion.WithKind(kind).GroupKind()
}

func addKnownTypes(scheme *runtime.Scheme) error {
	scheme.AddKnownTypes(
		SchemeGroupVersion,
		&Student{},
		&StudentList{},
	)

	// register the type in the scheme
	metav1.AddToGroupVersion(scheme, SchemeGroupVersion)
	return nil
}

```

到此，为自动生成代码做的准备工作已经完成了，后续开始生成代码。

> 此时 addKnownTypes 方法会报错，因为还没有生成相关代码，不用担心。

当前项目结构如下所示：

```bash
code-generator
└── pkg
    └── apis
        └── lixd
            ├── register.go
            └── v1
                ├── doc.go
                ├── register.go
                └── types.go
```



### 代码生成

需要用到`k8s.io/code-generator` 这个库里面的脚本来生成代码，需要先拉取一下这个库。

```bash
$ go get -u k8s.io/code-generator
```

然后找到具体位置，一般是在 `$GOPATH/pkg/mod/k8s.io/code-generator@{version}`目录下

```bash
/home/lixd/go/pkg/mod/k8s.io/code-generator@v0.23.5
```

通过脚本生成相关代码

```bash
/home/lixd/go/pkg/mod/k8s.io/code-generator@v0.23.5/generate-groups.sh
```

该脚本需要 4 个参数，参数含义以及参数具体顺序如下：

* **generators**：指定需要生成的内容
  * deepcopy,defaulter,client,lister,informer  中的一个或者多个，以逗号隔开
  * 或者 all，全部生成
* **output-package**：输出 package 名字
  * 比如 github.com/example/project/pkg/generated
* **apis-package**：the external types dir
  * 比如： github.com/example/api
* **groups-versions**： api resource 的 group 和 version 字段
  * 比如 groupA:v1,v2 groupB:v1 groupC:v2 这样



这里是直接把脚本复制到项目根目录下的 hack 目录来了：

```bash
./hack/generate-groups.sh all i-controller/pkg/client i-controller/pkg/apis lixd:v1 
```

参数解释：

* all：指定生成所有的内容，包括 deepcopy,defaulter,client,lister,informer
* code-generator/pkg/client：其他内容生成到 client 目录
* code-generator/pkg/apis：类型生成到 apis 目录
* "crd:v1"：指定 group 为 crd.lixueduan.com，version 为 v1

指令命令后，不出意外的话会输出以下内容：

```bash
Generating deepcopy funcs
Generating clientset for crd.lixueduan.com:v1 at code-generator/pkg/client/clientset
Generating listers for crd.lixueduan.com:v1 at code-generator/pkg/client/listers
Generating informers for crd.lixueduan.com:v1 at code-generator/pkg/client/informers
```

相关代码会生成到 **$GOPATH/src** 目录下。

相关代码会生成到 **$GOPATH/src** 目录下。

相关代码会生成到 **$GOPATH/src** 目录下。

在本例中就是生成到了`/home/lixd/go/src/code-generator/pkg/apis` 和`/home/lixd/go/src/code-generator/pkg/client`这两个目录下。



生成后的一个项目结构是这样的：

```bash
└── pkg
    ├── apis
    │   └── lixd
    │       ├── register.go
    │       └── v1
    │           ├── doc.go
    │           ├── register.go
    │           ├── types.go
    │           └── zz_generated.deepcopy.go
    └── client
        ├── clientset
        │   └── versioned
        │       ├── clientset.go
        │       ├── doc.go
        │       ├── fake
        │       │   ├── clientset_generated.go
        │       │   ├── doc.go
        │       │   └── register.go
        │       ├── scheme
        │       │   ├── doc.go
        │       │   └── register.go
        │       └── typed
        │           └── lixd
        │               └── v1
        │                   ├── doc.go
        │                   ├── fake
        │                   │   ├── doc.go
        │                   │   ├── fake_lixd_client.go
        │                   │   └── fake_student.go
        │                   ├── generated_expansion.go
        │                   ├── lixd_client.go
        │                   └── student.go
        ├── informers
        │   └── externalversions
        │       ├── factory.go
        │       ├── generic.go
        │       ├── internalinterfaces
        │       │   └── factory_interfaces.go
        │       └── lixd
        │           ├── interface.go
        │           └── v1
        │               ├── interface.go
        │               └── student.go
        └── listers
            └── lixd
                └── v1
                    ├── expansion_generated.go
                    └── student.go

```



apis 里面多了一个 zz_generated.deepcopy.go，就是 DeepCopy 代码文件。

然后多了一个 client 目录，里面包含了 clientset、informers、listers 相关的代码。

后续就可以开始写 controller 相关逻辑了。

## 4. 创建 controller

Controller 的逻辑其实是很简单的：监听 CRD 实例（以及关联的资源）的 CRUD 事件，然后执行相应的业务逻辑。

### signals

不过在此之前把处理系统信号量的辅助类先写好，然后在 main.go 中会用到。

在 pkg 下面创建 signals 目录。

> 这部分直接去官方 demo [sample-controller](https://github.com/kubernetes/sample-controller) 中拷贝一份过来，有特殊需求在改一下就行了。



### controller.go

在项目根目录创建 controller.go，开始编写 controller 核心逻辑。

```go
package main

import (
	"fmt"
	"time"

	"github.com/golang/glog"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/util/runtime"
	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/scheme"
	typedcorev1 "k8s.io/client-go/kubernetes/typed/core/v1"
	"k8s.io/client-go/tools/cache"
	"k8s.io/client-go/tools/record"
	"k8s.io/client-go/util/workqueue"

	bolingcavalryv1 "i-controller/pkg/apis/lixd/v1"
	clientset "i-controller/pkg/client/clientset/versioned"
	studentscheme "i-controller/pkg/client/clientset/versioned/scheme"
	informers "i-controller/pkg/client/informers/externalversions/lixd/v1"
	listers "i-controller/pkg/client/listers/lixd/v1"
)

const controllerAgentName = "student-controller"

const (
	SuccessSynced = "Synced"

	MessageResourceSynced = "Student synced successfully"
)

// Controller is the controller implementation for Student resources
type Controller struct {
	// kubeclientset is a standard kubernetes clientset
	kubeclientset kubernetes.Interface
	// studentclientset is a clientset for our own API group
	studentclientset clientset.Interface

	studentsLister listers.StudentLister
	studentsSynced cache.InformerSynced

	workqueue workqueue.RateLimitingInterface

	recorder record.EventRecorder
}

// NewController returns a new student controller
func NewController(
	kubeclientset kubernetes.Interface,
	studentclientset clientset.Interface,
	studentInformer informers.StudentInformer) *Controller {

	utilruntime.Must(studentscheme.AddToScheme(scheme.Scheme))
	glog.V(4).Info("Creating event broadcaster")
	eventBroadcaster := record.NewBroadcaster()
	eventBroadcaster.StartLogging(glog.Infof)
	eventBroadcaster.StartRecordingToSink(&typedcorev1.EventSinkImpl{Interface: kubeclientset.CoreV1().Events("")})
	recorder := eventBroadcaster.NewRecorder(scheme.Scheme, corev1.EventSource{Component: controllerAgentName})

	controller := &Controller{
		kubeclientset:    kubeclientset,
		studentclientset: studentclientset,
		studentsLister:   studentInformer.Lister(),
		studentsSynced:   studentInformer.Informer().HasSynced,
		workqueue:        workqueue.NewNamedRateLimitingQueue(workqueue.DefaultControllerRateLimiter(), "Students"),
		recorder:         recorder,
	}

	glog.Info("Setting up event handlers")
	// Set up an event handler for when Student resources change
	studentInformer.Informer().AddEventHandler(cache.ResourceEventHandlerFuncs{
		AddFunc: controller.enqueueStudent,
		UpdateFunc: func(old, new interface{}) {
			oldStudent := old.(*bolingcavalryv1.Student)
			newStudent := new.(*bolingcavalryv1.Student)
			if oldStudent.ResourceVersion == newStudent.ResourceVersion {
				// 版本一致，就表示没有实际更新的操作，立即返回
				return
			}
			controller.enqueueStudent(new)
		},
		DeleteFunc: controller.enqueueStudentForDelete,
	})

	return controller
}

// Run 在此处开始controller的业务
func (c *Controller) Run(parallel int, stopCh <-chan struct{}) error {
	defer runtime.HandleCrash()
	defer c.workqueue.ShutDown()

	glog.Info("开始controller业务，开始一次缓存数据同步")
	if ok := cache.WaitForCacheSync(stopCh, c.studentsSynced); !ok {
		return fmt.Errorf("failed to wait for caches to sync")
	}

	glog.Info("worker启动")
	for i := 0; i < parallel; i++ {
		go wait.Until(c.runWorker, time.Second, stopCh)
	}

	glog.Info("worker已经启动")
	<-stopCh
	glog.Info("worker已经结束")

	return nil
}

func (c *Controller) runWorker() {
	for c.processNextWorkItem() {
	}
}

// 取数据处理
func (c *Controller) processNextWorkItem() bool {

	obj, shutdown := c.workqueue.Get()

	if shutdown {
		return false
	}

	// We wrap this block in a func so we can defer c.workqueue.Done.
	err := func(obj interface{}) error {
		defer c.workqueue.Done(obj)
		var key string
		var ok bool

		if key, ok = obj.(string); !ok {

			c.workqueue.Forget(obj)
			runtime.HandleError(fmt.Errorf("expected string in workqueue but got %#v", obj))
			return nil
		}
		// 在syncHandler中处理业务
		if err := c.syncHandler(key); err != nil {
			return fmt.Errorf("error syncing '%s': %s", key, err.Error())
		}

		c.workqueue.Forget(obj)
		glog.Infof("Successfully synced '%s'", key)
		return nil
	}(obj)

	if err != nil {
		runtime.HandleError(err)
		return true
	}

	return true
}

// 处理
func (c *Controller) syncHandler(key string) error {
	// Convert the namespace/name string into a distinct namespace and name
	namespace, name, err := cache.SplitMetaNamespaceKey(key)
	if err != nil {
		runtime.HandleError(fmt.Errorf("invalid resource key: %s", key))
		return nil
	}

	// 从缓存中取对象
	student, err := c.studentsLister.Students(namespace).Get(name)
	if err != nil {
		// 如果Student对象被删除了，就会走到这里，所以应该在这里加入执行
		if errors.IsNotFound(err) {
			glog.Infof("Student对象被删除，请在这里执行实际的删除业务: %s/%s ...", namespace, name)

			return nil
		}

		runtime.HandleError(fmt.Errorf("failed to list student by: %s/%s", namespace, name))

		return err
	}

	glog.Infof("这里是student对象的期望状态: %#v ...", student)
	glog.Infof("实际状态是从业务层面得到的，此处应该去的实际状态，与期望状态做对比，并根据差异做出响应(新增或者删除)")

	c.recorder.Event(student, corev1.EventTypeNormal, SuccessSynced, MessageResourceSynced)
	return nil
}

// 数据先放入缓存，再入队列
func (c *Controller) enqueueStudent(obj interface{}) {
	var key string
	var err error
	// 将对象放入缓存
	if key, err = cache.MetaNamespaceKeyFunc(obj); err != nil {
		runtime.HandleError(err)
		return
	}

	// 将key放入队列
	c.workqueue.AddRateLimited(key)
}

// 删除操作
func (c *Controller) enqueueStudentForDelete(obj interface{}) {
	var key string
	var err error
	// 从缓存中删除指定对象
	key, err = cache.DeletionHandlingMetaNamespaceKeyFunc(obj)
	if err != nil {
		runtime.HandleError(err)
		return
	}
	// 再将key放入队列
	c.workqueue.AddRateLimited(key)
}

```



上述代码有以下几处关键点：

* 1）创建 controller 的 NewController 方法中，定义了收到 Student 对象的增删改消息时的具体处理逻辑，除了同步本地缓存，就是将该对象的 key 放入消息中；
* 2）实际处理消息的方法是 syncHandler，这里面可以添加实际的业务代码，来响应 Student 对象的增删改情况，达到业务目的；

### main.go

在项目根目录创建 main.go。

```go
package main

import (
	"flag"
	"time"

	"github.com/golang/glog"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"

	clientset "i-controller/pkg/client/clientset/versioned"
	informers "i-controller/pkg/client/informers/externalversions"
	"i-controller/pkg/signals"
)

var (
	masterURL  string
	kubeconfig string
)

func init() {
	flag.StringVar(&kubeconfig, "kubeconfig", "", "Path to a kubeconfig. Only required if out-of-cluster.")
	flag.StringVar(&masterURL, "master", "", "The address of the Kubernetes API server. Overrides any value in kubeconfig. Only required if out-of-cluster.")
	flag.Parse()
}

func main() {
	// 处理信号量
	stopCh := signals.SetupSignalHandler()

	// 处理入参
	cfg, err := clientcmd.BuildConfigFromFlags(masterURL, kubeconfig)
	if err != nil {
		glog.Fatalf("Error building kubeconfig: %s", err.Error())
	}

	kubeClient, err := kubernetes.NewForConfig(cfg)
	if err != nil {
		glog.Fatalf("Error building kubernetes clientset: %s", err.Error())
	}

	studentClient, err := clientset.NewForConfig(cfg)
	if err != nil {
		glog.Fatalf("Error building example clientset: %s", err.Error())
	}

	studentInformerFactory := informers.NewSharedInformerFactory(studentClient, time.Second*30)

	// 得到controller
	controller := NewController(kubeClient, studentClient,
		studentInformerFactory.Lixd().V1().Students())

	// 启动informer
	go studentInformerFactory.Start(stopCh)

	// controller开始处理消息
	if err = controller.Run(2, stopCh); err != nil {
		glog.Fatalf("Error running controller: %s", err.Error())
	}
}

```





## 5. 测试

运行 controller，连接到 k8s 环境，然后手动添加删除自定义资源，观察 controller 输出的日志是否符合需求。

```bash
$ go run main.go controller.go -kubeconfig={kubeconfig配置文件} -alsologtostderr=true
```

然后打开新窗口，创建 student 对象,new-student.yaml 内容如下：

```yaml
apiVersion: lixueduan.com/v1
kind: Student
metadata:
  name: new-student
spec:
  name: "李四"
  school: "深圳小学"

```

```bash
$ kubectl apply -f new-student.yaml
```

查看 controller 控制台打印的日志。

然后删除该对象，再次观察 controller 控制台日志

```bash
$ kubectl delete -f new-student.yaml
```



## 6. 小结

CRD 编写流程如下：

* 1）创建CRD（Custom Resource Definition），令k8s明白我们自定义的API对象；
* 2）编写代码，将 CRD 的情况写入对应的代码中，然后通过自动代码生成工具，将 controller 之外的informer，client 等内容较为固定的代码通过工具生成；
* 3）编写 controller，在里面判断实际情况是否达到了 API 对象的声明情况，如果未达到，就要进行实际业务处理，而这也是 controller 的通用做法；

实际编码过程并不复杂，需要动手编写的文件如下：

```bash
├── controller.go
├── main.go
└── pkg
    ├── apis
    │   └── lixd
    │       ├── register.go
    │       └── v1
    │           ├── doc.go
    │           ├── register.go
    │           └── types.go
    └── signals
        ├── signal.go
        ├── signal_posix.go
        └── signal_windows.go
```

