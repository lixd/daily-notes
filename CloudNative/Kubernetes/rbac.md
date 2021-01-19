# K8s 权限控制 RBAC

## 1. 概述

 **Kubernetes 项目中，负责完成授权（Authorization）工作的机制，就是 RBAC：基于角色的访问控制（Role-Based Access Control）。**

基本概念：
* Role：角色，它其实是一组规则，定义了一组对 Kubernetes API 对象的操作权限。
* Subject：被作用者，既可以是“人”，也可以是“机器”，也可以是你在 Kubernetes 里定义的“用户”。
* RoleBinding：定义了“被作用者”和“角色”的绑定关系。

RBAC API 声明了四种 Kubernetes 对象：Role、ClusterRole、RoleBinding 和 ClusterRoleBinding。你可以像使用其他 Kubernetes 对象一样， 通过类似 `kubectl` 这类工具来创建或者更新对象。

> 其中 Role 和 RoleBinding 作用在某个 namespace，ClusterRole和ClusterRoleBinding 则作用在整个集群。



> [Kubernetes官方文档](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)

## 2. 基本概念

### 1. Role

Role 本身就是一个 Kubernetes 的 API 对象，定义如下所示：

```yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: mynamespace
  name: example-role
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
```

首先，这个 Role 对象指定了它能产生作用的 `Namepace `是：mynamespace。

Namespace 是 Kubernetes 项目里的一个逻辑管理单位。不同 Namespace 的 API 对象，在通过 kubectl 命令进行操作的时候，是互相隔离开的。

然后，这个 Role 对象的 `rules` 字段，就是它所定义的权限规则。在上面的例子里，这条规则的含义就是：允许“被作用者”，对 mynamespace 下面的 Pod 对象，进行 GET、WATCH 和 LIST 操作。



### 2. RoleBinding 

通过 RoleBinding  将某个 Role 绑定到具体的 Subject 上，这样就实现了给 Subject 指定权限。

RoleBinding 本身也是一个 Kubernetes 的 API 对象。它的定义如下所示：

```yaml
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: example-rolebinding
  namespace: mynamespace
subjects:
- kind: User
  name: example-user
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: Role
  name: example-role
  apiGroup: rbac.authorization.k8s.io
```

可以看到，这个 RoleBinding 对象里定义了一个 `subjects `字段，即“被作用者”。它的类型是 User，即 Kubernetes 里的用户。这个用户的名字是 example-user。

可是，在 Kubernetes 中，其实并没有一个叫作 `User` 的 API 对象。而且，我们在前面和部署使用 Kubernetes 的流程里，既不需要 User，也没有创建过 User。

**这个 User 到底是从哪里来的呢？**

实际上，Kubernetes 里的“User”，也就是“用户”，只是一个授权系统里的逻辑概念。它需要通过外部认证服务，比如 Keystone，来提供。或者，你也可以直接给 APIServer 指定一个用户名、密码文件。

当然，在大多数私有的使用环境中，我们只要使用 Kubernetes 提供的**内置`用户`**，就足够了。

接下来，我们会看到一个 roleRef 字段。正是通过这个字段，RoleBinding 对象就可以直接通过名字，来引用我们前面定义的 Role 对象（example-role），从而定义了“被作用者（Subject）”和“角色（Role）”之间的绑定关系。

> Role 和 RoleBinding 对象都是 Namespaced 对象（Namespaced Object），它们对权限的限制规则仅在它们自己的 Namespace 内有效，roleRef 也只能引用当前 Namespace 里的 Role 对象。



### 3. ClusterRole/RoleBinding 

**对于非 Namespaced（Non-namespaced）对象（比如：Node），或者，某一个 Role 想要作用于所有的 Namespace 的时候，我们又该如何去做授权呢？**

这时候，我们就必须要使用 ClusterRole 和 ClusterRoleBinding 这两个组合了。这两个 API 对象的用法跟 Role 和 RoleBinding 完全一样。只不过，它们的定义里，没有了 Namespace 字段，如下所示：

```yaml
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: example-clusterrole
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
```

```yaml
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: example-clusterrolebinding
subjects:
- kind: User
  name: example-user
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: example-clusterrole
  apiGroup: rbac.authorization.k8s.io
```

上面的例子里的 ClusterRole 和 ClusterRoleBinding 的组合，意味着名叫 example-user 的用户，拥有对所有 Namespace 里的 Pod 进行 GET、WATCH 和 LIST 操作的权限。

verbs 字段所有可选值

```yaml
# Kubernetes v1.1.1 版本
verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
```



### 4. ServiceAccount

而正如我前面介绍过的，在大多数时候，我们其实都不太使用“用户”这个功能，而是直接使用 Kubernetes 里的“内置用户”。这个由 Kubernetes 负责管理的“内置用户”，正是我们前面曾经提到过的：ServiceAccount。

定义如下：

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  namespace: mynamespace
  name: example-sa
```

一个最简单的 ServiceAccount 对象只需要 Name 和 Namespace 这两个最基本的字段。

ServiceAccount 也是 subject 中的一种。





### 5. 用户组

**除了前面使用的“用户”（User），Kubernetes 还拥有“用户组”（Group）的概念，也就是一组“用户”的意思。**

实际上，一个 ServiceAccount，在 Kubernetes 里对应的“用户”的名字是：

```sh
system:serviceaccount:<Namespace名字>:<ServiceAccount名字>
```

而它对应的内置“用户组”的名字，就是：

```sh
system:serviceaccounts:<Namespace名字>
```

**这两个对应关系，请你一定要牢记**。

比如，现在我们可以在 RoleBinding 里定义如下的 subjects：



```yaml
subjects:
- kind: Group
  name: system:serviceaccounts:mynamespace
  apiGroup: rbac.authorization.k8s.io
```

这就意味着这个 Role 的权限规则，作用于 mynamespace 里的所有 ServiceAccount。这就用到了“用户组”的概念。

而下面这个例子：

```yaml
subjects:
- kind: Group
  name: system:serviceaccounts
  apiGroup: rbac.authorization.k8s.io
```

就意味着这个 Role 的权限规则，作用于整个系统里的所有 ServiceAccount。



### 6. 系统保留ClusterRole

**在 Kubernetes 中已经内置了很多个为系统保留的 ClusterRole，它们的名字都以 system: 开头**。你可以通过 kubectl get clusterroles 查看到它们。

比如 system:kube-scheduler 则是 Kubernetes 调度器使用的。

除此之外，Kubernetes 还提供了四个预先定义好的 ClusterRole 来供用户直接使用：

* cluster-admin
* admin
* edit
* view



通过它们的名字，你应该能大致猜出它们都定义了哪些权限。比如，这个名叫 view 的 ClusterRole，就规定了被作用者只有 Kubernetes API 的只读权限。

 cluster-admin 角色，对应的是整个 Kubernetes 项目中的最高权限（verbs=*）请你务必要谨慎而小心地使用。

```sh
$ kubectl describe clusterrole cluster-admin -n kube-system
Name:         cluster-admin
Labels:       kubernetes.io/bootstrapping=rbac-defaults
Annotations:  rbac.authorization.kubernetes.io/autoupdate: true
PolicyRule:
  Resources  Non-Resource URLs  Resource Names  Verbs
  ---------  -----------------  --------------  -----
  *.*        []                 []              [*]
             [*]                []              [*]
```



## 3. 例子

首先定义一个 ServiceAccount

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  namespace: mynamespace
  name: example-sa
```

然后定义一个 role

```yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: mynamespace
  name: example-role
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "watch", "list"]
```

最后，我们通过编写 RoleBinding 的 YAML 文件，来为这个 ServiceAccount 分配权限：

```yaml
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: example-rolebinding
  namespace: mynamespace
subjects:
- kind: ServiceAccount
  name: example-sa
  namespace: mynamespace
roleRef:
  kind: Role
  name: example-role
  apiGroup: rbac.authorization.k8s.io
```



创建这3个API对象

```sh
$ kubectl create ns mynamespace
namespace/mynamespace created
$ kubectl apply -f svc-account.yaml 
serviceaccount/example-sa created
$ kubectl apply -f role.yaml 
role.rbac.authorization.k8s.io/example-role created
$ kubectl apply -f role-binding.yaml 
rolebinding.rbac.authorization.k8s.io/example-rolebinding created
```

然后，我们来查看一下这个 ServiceAccount 的详细信息：

```sh
$ kubectl get sa -n mynamespace -o yaml
apiVersion: v1
items:
- apiVersion: v1
.......
  kind: ServiceAccount
  metadata:
    creationTimestamp: "2021-01-19T01:30:23Z"
    name: example-sa
    namespace: mynamespace
    resourceVersion: "322029205"
    .......
  secrets:
  - name: example-sa-token-wgwcg
```

可以看到，Kubernetes 会为一个 ServiceAccount 自动创建并分配一个 Secret 对象，即：上述 ServiceAcount 定义里最下面的 secrets 字段。

这个 Secret，就是这个 ServiceAccount 对应的、用来跟 APIServer 进行交互的授权文件，我们一般称它为：Token。Token 文件的内容一般是证书或者密码，它以一个 Secret 对象的方式保存在 Etcd 当中。

这时候，用户的 Pod，就可以声明使用这个 ServiceAccount 了，比如下面这个例子：

```yaml
apiVersion: v1
kind: Pod
metadata:
  namespace: mynamespace
  name: sa-token-test
spec:
  containers:
  - name: nginx
    image: nginx:1.7.9
  serviceAccountName: example-sa
```

等这个 Pod 运行起来之后，我们就可以看到，该 ServiceAccount 的 token，也就是一个 Secret 对象，被 Kubernetes 自动挂载到了容器的 /var/run/secrets/kubernetes.io/serviceaccount 目录下，如下所示：

```sh
$ kubectl describe pod sa-token-test -n mynamespace
Name:         sa-token-test
Namespace:    mynamespace
Start Time:   Tue, 19 Jan 2021 09:35:48 +0800
Containers:
  nginx:
    ....
    Mounts:
      /var/run/secrets/kubernetes.io/serviceaccount from example-sa-token-wgwcg (ro)
```

这时候，我们可以通过 kubectl exec 查看到这个目录里的文件：

```sh
$kubectl exec -it sa-token-test -n mynamespace -- /bin/bas
root@sa-token-test:/var/run/secrets/kubernetes.io/serviceaccount# ls
ca.crt	namespace  token
```

如上所示，容器里的应用，就可以使用这个 ca.crt 来访问 APIServer 了。更重要的是，此时它只能够做 GET、WATCH 和 LIST 操作。因为 example-sa 这个 ServiceAccount 的权限，已经被我们绑定了 Role 做了限制。

**如果一个 Pod 没有声明 serviceAccountName，Kubernetes 会自动在它的 Namespace 下创建一个名叫 default 的默认 ServiceAccount，然后分配给这个 Pod**。这个默认 ServiceAccount 并没有关联任何 Role。也就是说，此时它有访问 APIServer 的绝大多数权限。

> 所以，在生产环境中，我强烈建议你为所有 Namespace 下的默认 ServiceAccount，绑定一个只读权限的 Role。



## 4. 小结

1）使用 通过 role-binding 将 role 和 subject 进行关联。

2）Pod 中通过设置 spec.serviceAccountName 来指定对应的 subject，以现在 Pod 中容器的权限。

3）subject 除`用户`外还有 `用户组`的概念，通过用户组可以直接给某个 namespace下或者整个集群中的 ServiceAccount 绑定权限。

4）Kubernetes 集群有中很多系统保留和预定义 ClusterRole ，请谨慎使用。









