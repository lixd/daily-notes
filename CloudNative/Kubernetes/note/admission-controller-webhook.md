# Admission Controller

## 概述

官方文档

[使用准入控制器](https://kubernetes.io/zh/docs/reference/access-authn-authz/admission-controllers/#validatingadmissionwebhook)

[动态准入控制](https://kubernetes.io/zh/docs/reference/access-authn-authz/extensible-admission-controllers/)

[深度剖析Kubernetes动态准入控制之Admission Webhooks_weixin_34218579的博客-CSDN博客](https://blog.csdn.net/weixin_34218579/article/details/92574399)

[自定义 Kubernetes 准入控制器](https://blog.opskumu.com/kubernetes-mutating-webhook.html)

Admission controller 是一段代码，它会在请求通过认证和授权之后、对象被持久化之前拦截到达 API 服务器的请求。



k8s 中有很多内置的 admission，具体见 [admission list](https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/#what-does-each-admission-controller-do) ，

Admission 按照行为可以分为 mutatingad admission 和 validatingad mission。虽然已经内置了很多 admission 了，但是肯定也不能满足所有需求，所以官方新增了**通过 webhook 方式动态扩展的 admission**。

具体接入功能由内置的两个 admission 实现：

- mutatingadmissionwebhook

- validatingadmissionwebhook

这两个 webhook admission 就是用于扩展动态 admission 的。

以 webhook 的形式指定新的 admission，然后再执行内置的这两个 admission 时就以 http 请求形式调用我们动态扩展的 admission。





## 自定义 webhook admission

webhook 处理由 apiserver 发送的 `AdmissionReview` 请求，并且将其决定 作为 `AdmissionReview` 对象以相同版本发送回去。



Admission 执行顺序如下：

![img](assets/admission-controller-phases.png)

当 API 请求进入时，mutating 和 validating 控制器使用配置中的外部 webhooks 列表并发调用，规则如下：

- 如果所有的 webhooks 批准请求，准入控制链继续流转

- 如果有任意一个 webhooks 阻止请求，那么准入控制请求终止，并返回第一个 webhook 阻止的原因。其中，多个 webhooks 阻止也只会返回第一个 webhook 阻止的原因

- 如果在调用 webhook 过程中发生错误，那么请求会被终止或者忽略 webhook

Admission webhooks 可以使用如下几个场景：

- 通过 mutating webhook 注入 side-car 到 Pod（istio 的 side-car 就是采用这种方式注入的）

- 限制项目使用某个资源（如限制用户创建的 Pod 使用超过限制的资源等）

- 自定义资源的字段复杂验证（如 CRD 资源相关字段的规则验证等）



## Demo

1.定义一个 HTTP Server

```Go
func(v1.AdmissionReview) *v1.AdmissionResponse
```

2.生成自签名证书，生成 CA 证书，然后用 CA 签名一个 Server 证书，后续会使用 service 进行访问，所以证书的 SN 需要指定成 service 的 dns 记录，格式为 {svcname}.{namespace}.svc

2.1 http server 启用 tls

3.服务打包，以 deployment 方式运行到 k8s 中，并使用 service 暴露端口。

4.配置 admission config，其中需要指定 ca 证书用于校验 webhook 的证书是否有效。以及指定什么资源，什么动作需要走这个 webhook。

> 这里需要把ca的base64值证书设置给对应的MutatingWebhookConfiguration和ValidatingWebhookConfiguration的caBundle字段。这里就不详细赘述了,说明一下ca证书如何获取。



```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingWebhookConfiguration
metadata:
  name: pod-admission-webhook
webhooks:
- name: pod-admission-webhook.kube-system.svc
  clientConfig:
    caBundle: <ca base64>
    service:
      name: pod-admission-webhook
      namespace: kube-system
      path: "/mutate-pod"
  rules:
  - operations: ["CREATE"]
    apiGroups: [""]
    apiVersions: ["v1"]
    resources: ["pods"]
  failurePolicy: Fail
  namespaceSelector:
    matchLabels:
      pod-admission-webhook-injection: enabled
  sideEffects: None
  admissionReviewVersions: ["v1", "v1beta1"]
```



完整代码见：[admission-webhook-example](https://github.com/lixd/admission-webhook-example)





## 部署

