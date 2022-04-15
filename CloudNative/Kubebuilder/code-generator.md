# Code Generator

[code-generator-crd](https://xieys.club/code-generator-crd/)

[kubernetes-deep-dive-code-generation-customresources](https://cloud.redhat.com/blog/kubernetes-deep-dive-code-generation-customresources)

[kubernetes开发教程(4)--自动代码生成](https://haojianxun.github.io/2019/09/10/kubernetes%E5%BC%80%E5%8F%91%E6%95%99%E7%A8%8B(4)%E8%87%AA%E5%8A%A8%E4%BB%A3%E7%A0%81%E7%94%9F%E6%88%90/)







## 1. 概述

在 kubernetes 开发早期 , 随着越来越多的资源被加进系统, 越来越多的代码不得不被重写。 这个时候代码生成使得代码的维护更加容易 , 在早起是用 [Gengo library](https://github.com/kubernetes/gengo) 之后在 gengo 的基础上, kubernetes 发展出了[*k8s.io/code-generator*](https://github.com/kubernetes/code-generator) 它是一个代码生成器的集合。



其中有4个标准的代码生成器

- deepcopy-gen
  - 生成`func` `(t *T)` `DeepCopy()` `*T` 
  - 和`func` `(t *T)` `DeepCopyInto(*T)`方法
- client-gen
  - 创建类型化客户端集合(typed client sets)
- informer-gen
  - 为CR创建一个informer , 当CR有变化的时候, 这个informer可以基于事件接口获取到信息变更
- lister-gen
  - 为CR创建一个listers , 就是为`GET` and `LIST`请求提供read-only caching layer

后面2个是构建controller的基础。



使用案例

```bash
../../k8s.io/code-generator/generate-groups.sh all \
    github.com/programming-kubernetes/cnat/cnat-client-go/pkg/generated
    github.com/programming-kubernetes/cnat/cnat-client-go/pkg/apis \
    cnat:v1alpha1 \
    --output-base "${GOPATH}/src" \
    --go-header-file "hack/boilerplate.go.txt"
```

让我们先看看上述脚本后面跟的几个参数

- 第二个参数是要生成的clients, listers, and informers的包名
- 第三个参数是API group的包
- 第四个参数是API 组及其版本
- 将 –output-base 作为标志传递给所有生成器，以定义在其中找到给定包的基目录
- – go-header-file 使我们能够将版权标头放入生成的代码中

有些生成器(如 deepcopy-gen)直接在 API group包中创建文件,这些文件遵循标准的命名方案，并生成一个 *zz_generated.*前缀，以便很容易从版本控制系统中排除它们



## 2. 用Tag控制生成器

虽然一些代码生成器行为是通过前面描述的命令行标志(特别是要处理的包)来控制的，但是更多的属性是**通过 Go 文件中的标记**来控制的。

这里有2种形式的tag:

- Global tags  声明在 **doc.go**上方进行标记
- Local tags 声明在 struct 结构体上方进行标记



### Global Tags

global tags 被写在 doc.go 中 , 典型的 `pkg/apis/group/version/doc.go` 文件长这样:

```go
// +k8s:deepcopy-gen=package

// Package v1 is the v1alpha1 version of the API.
// +groupName=cnat.programming-kubernetes.info
package v1alpha1
```



第一个标记：**`// +k8s:deepcopy-gen=package`**告诉 deepcopy-gen 默认情况下为该包中的每个类型创建深层复制方法。 

* 开启后，如果您的类型不需要深度拷贝,那么您可以使用本地标签`// +k8s:deepcopy-gen=false` 
* 如果不开启，某个类型需要 DeepCopy 方法也通过 `// +k8s:deepcopy-gen=true` 开启

第二个标记：**`// +groupName=example.com`** 定义了完全限定的 API 组名。 如果 Go 父包名称与组名称不匹配，则此标记是必需的。

使用`// +groupName` tag , client generator将使用正确的 HTTP 路径`/apis/foo.project.example.com`来生成客户端。



### Local Tags

本地标记可以直接写在 API 类型之上，也可以写在 API 类型之上的第二个注释块中 , 比如下面的例子.

```go
// +genclient
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

// At runs a command at a given schedule.
type At struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`

    Spec   AtSpec   `json:"spec,omitempty"`
    Status AtStatus `json:"status,omitempty"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

// AtList contains a list of At
type AtList struct {
    metav1.TypeMeta `json:",inline"`
    metav1.ListMeta `json:"metadata,omitempty"`
    Items           []At `json:"items"`
}

//...
```



#### deepcopy-gen Tags

将本地标签`//` `+k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object`放在顶级 API 类型之上表示需要实现`k8s.io/apimachinery/pkg/runtime.Object`这个接口，,这告诉 deepcopy-gen 为运行时创建这样一个方法,叫DeepCopyObject()。





#### client-gen Tags

`// +genclient`:它告诉 client-gen 为此类型创建一个客户机 , 但是他不能置于list类型之上。

当然还有其他例子, 用法

* **// +genclient:noStatus**：生成不带`UpdateStatus`方法的 client 代码
* **// +genclient:nonNamespaced**：生成的 HTTP 路径不带 namespace（一般用于集群资源），这必须与 CRD 清单中的范围设置相匹配。





对于特殊用途的客户机，您可能还希望详细控制提供哪些 HTTP 方法。 你可以通过使用几个标签来做到这一点，例如:

```bash
// +genclient:noVerbs
// +genclient:onlyVerbs=create,delete
// +genclient:skipVerbs=get,list,create,update,patch,delete,watch
// +genclient:method=Create,verb=create,
// result=k8s.io/apimachinery/pkg/apis/meta/v1.Status
```

对于`// +genclient:method=`标记,一个常见的情况是添加一个方法来缩放资源 , 如果CR启用 / Scale 子资源,下面的标签创建了相应的客户端方法

```
// +genclient:method=GetScale,verb=get,subresource=scale,\
//    result=k8s.io/api/autoscaling/v1.Scale
// +genclient:method=UpdateScale,verb=update,subresource=scale,\
//    input=k8s.io/api/autoscaling/v1.Scale,result=k8s.io/api/autoscaling/v1.Scale
```

第一个标签创建 getter `GetScale` , 第二个创建 setter `UpdateScale`



#### informer-gen and lister-gen

代码自动生成会生成对应类型的专门informer和lister的



## boilerplate.go.txt

生成代码之前，还要准备一个代码文件模板，`hack/boilerplate.go.txt`，模板中的内容会在生成的代码文件中出现，大概就是下面这样的 Copyright：

```go
/*
Copyright The Kubernetes Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
```





## 4. 小结

Code Generator 使用流程：

* 1）定义好结构，写好注释标记
* 2）使用 code-generator 进行代码自动生成，生成需要的 informer、lister、clientset。

