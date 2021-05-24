#  etcd 租约Lease

## 1. 概述

Lease 顾名思义，client 和 etcd server 之间存在一个约定，内容是 etcd server 保证在约定的有效期内（TTL），不会删除你关联到此 Lease 上的 key-value。

若你未在有效期内续租，那么 etcd server 就会删除 Lease 和其关联的 key-value。

> 可以简单理解为 key 的有效期。

Lease，是基于主动型上报模式提供的一种活性检测机制。