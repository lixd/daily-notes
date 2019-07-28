# Nats入门教程

## 1. 概述

NATS是一个开源、轻量级、高性能的分布式消息中间件，实现了高可伸缩性和优雅的Publish/Subscribe模型，使用Golang语言开发。NATS的开发哲学认为高质量的QoS应该在客户端构建，故只建立了Request-Reply，不提供 1.持久化 2.事务处理 3.增强的交付模式 4.企业级队列。

## 2. 使用

### 1.基于Docker 安装服务端

```go
// 拉取镜像
> docker pull nats:latest
//运行nats
> docker run -p 4222:4222 -ti nats:latest
```

### 2. 运行服务端



### 3. 运行发布者客户端



### 4.运行订户客户端