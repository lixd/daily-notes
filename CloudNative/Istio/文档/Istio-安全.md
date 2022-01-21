# Isito 安全

[官方文档-security](https://istio.io/latest/docs/concepts/security)

## 1. 概述

Isito 安全分为 认证、授权两部分。

### 身份

身份是安全基础设施中的基本概念。

Istio 中有一个 identity 的概念，用于标记服务基本信息。 workload 交互时需要先根据 Id 来交换证书。

> 在 Kubernetes 环境中 ID 为 serviceAccount。



### 证书管理

Istio 中通过 X.509 证书为每个工作负载提供强身份认证。和 Envoy 一起运行的   Istio agents 和 Istiod 一起提供了证书、秘钥的分发、更新等工作。

> 对用户来说这些都是无感知的，极大降低了维护难度。

![身份配置工作流](assets/Identity Provisioning Workflow.svg)



具体 workflow 如上图所示：

* 1）Istiod 运行了一个 gRPC 服务用于接收 CSRs( [certificate signing requests](https://en.wikipedia.org/wiki/Certificate_signing_request) )
* 2）启动时，Istio agent 会生成一个私钥和对应 CSR，然后将 CSR 和凭证发送到 Istiod 进行签名。
* 3）istiod 中的 CA 验证 CSR 中携带的凭证。在验证通过之后，它对 CSR 进行签名以生成证书。
* 4）当 workload 启动时，Envoy 通过[secret discovery service (SDS)](https://www.envoyproxy.io/docs/envoy/latest/configuration/security/secret#secret-discovery-service-sds) API向 istio-agent 请求证书和私钥
* 5）Istio agent 把之前从 Istiod 处收到的证书和私钥发送给 Envoy
* 6）Istio agent 还会监控 workload 证书的过期时间，会重复上述工作以实现证书和秘钥的轮换。





## 2. 认证

Istio 提供了以下两种认证：

* Peer authentication：对等认证，服务和服务之间进行认证
* Request authentication：请求认证，面向终端用户，使用JWT进行认证
  * 同时也支持接入其他第三方Auth



### 对等认证



**对等认证 TLS 需要 `PeerAuthentication` 和`DestinationRule`两者配合进行设置。**

> 由于二者都可以配置 TLS，导致容易产生误解。

二者配置的 TLS 差异如下：

- `PeerAuthentication` 用于配置 Sidecar 接收的 mTLS 流量类型。
  - 开启后，若外部请求未使用TLS则会被拒绝
- `DestinationRule` 用于配置 Sidecar 发送的 TLS 流量类型。
  - 如果不配置出流量TLS，则可能会被`PeerAuthentication`拦截，导致网格内服务无法明文调用。

出于安全考虑，Istio 希望在网格中也全部使用 mTLS，因此提供了**`Auto mTLS`**功能，如果`DestinationRule`中没有显式配置 TLS，则会自动使用 mTLS。



#### Authentication

* Mutual TLS authentication
  * Istio 中在客户端 Sidecar 和服务端 Sidecar 建立 mTLS。

* Permissive mode
  * 宽容模式下同时允许密文和明文传输。
  * 在服务迁移时由于无法同时全部开启 TLS，所以宽容模式很有必要。





### 请求认证



## 3. 授权

