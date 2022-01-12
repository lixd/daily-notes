# Isito 安全

## 1. 概述

Isito 安全分为 认证、授权两部分。

## 2. 认证

### 对等认证



**对等认证 TLS 需要 `PeerAuthentication` 和`DestinationRule`两者配合进行设置。**

> 由于二者都可以配置 TLS，导致容易产生误解。

二者配置的 TLS 差异如下：

- `PeerAuthentication` 用于配置 Sidecar 接收的 mTLS 流量类型。
  - 开启后，若外部请求未使用TLS则会被拒绝
- `DestinationRule` 用于配置 Sidecar 发送的 TLS 流量类型。
  - 如果不配置出流量TLS，则可能会被`PeerAuthentication`拦截，导致网格内服务无法明文调用。

出于安全考虑，Istio 希望在网格中也全部使用 mTLS，因此提供了**`Auto mTLS`**功能，如果`DestinationRule`中没有显式配置 TLS，则会自动使用 mTLS。



### 请求认证



## 3. 授权

