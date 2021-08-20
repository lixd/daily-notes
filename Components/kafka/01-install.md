---
title: "Kafka(Go)教程(一)---通过docker-compose 安装 Kafka"
description: "通过docker-compose 快速安装 Kafka"
date: 2021-07-30 21:00:00
draft: false
categories: ["Kafka"]
tags: ["Kafka"]
---

本文记录了如何通过 docker-compose 快速启动 kafka，部署一套开发环境。

<!--more-->

## 1. 概述

Kafka 是由 Apache 软件基金会旗下的一个开源 `消息引擎系统`。

使用 docker-compose 来部署开发环境也比较方便，只需要提准备一个 yaml 文件即可。

> Kafka 系列相关代码见 [Github][Github]



## 2. docker-compose.yaml

完整的 `docker-compose.yaml`内容如下：

> 当前 Kafka 还依赖 Zookeeper，所以需要先启动一个 Zookeeper 。

```yaml
version: "3"
services:
  zookeeper:
    image: 'bitnami/zookeeper:latest'
    ports:
      - '2181:2181'
    environment:
      # 匿名登录--必须开启
      - ALLOW_ANONYMOUS_LOGIN=yes
    #volumes:
      #- ./zookeeper:/bitnami/zookeeper
  # 该镜像具体配置参考 https://github.com/bitnami/bitnami-docker-kafka/blob/master/README.md
  kafka:
    image: 'bitnami/kafka:latest'
    ports:
      - '9092:9092'
      - '9999:9999'
    environment:
      - KAFKA_BROKER_ID=1
      - KAFKA_CFG_LISTENERS=PLAINTEXT://:9092
      - KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://123.57.236.125:9092
      - KAFKA_CFG_ZOOKEEPER_CONNECT=zookeeper:2181
      # 允许使用PLAINTEXT协议(镜像中默认为关闭,需要手动开启)
      - ALLOW_PLAINTEXT_LISTENER=yes
      # 关闭自动创建 topic 功能
      - KAFKA_CFG_AUTO_CREATE_TOPICS_ENABLE=false
      # 全局消息过期时间 6 小时(测试时可以设置短一点)
      - KAFKA_CFG_LOG_RETENTION_HOURS=6
      # 开启JMX监控
      - JMX_PORT=9999
    #volumes:
      #- ./kafka:/bitnami/kafka
    depends_on:
      - zookeeper
  # Web 管理界面 另外也可以用exporter+prometheus+grafana的方式来监控 https://github.com/danielqsj/kafka_exporter
  kafka_manager:
    image: 'hlebalbau/kafka-manager:latest'
    ports:
      - "9000:9000"
    environment:
      ZK_HOSTS: "zookeeper:2181"
      APPLICATION_SECRET: letmein
    depends_on:
      - zookeeper
      - kafka
```



### 镜像

在 dockerhub 上 kafka 相关镜像有 `wurstmeister/kafka` 和 `bitnami/kafka` 这两个用的人比较多,大概看了下 `bitnami/kafka` 更新比较频繁所以就选这个了。

### 监控

监控的话 `hlebalbau/kafka-manager` 这个比较好用，其他的都太久没更新了。

不过 kafka-manager 除了监控外更偏向于集群管理，误操作的话影响比较大，如果有 prometheus + grafana 监控体系的直接用 [kafka_exporter](https://github.com/danielqsj/kafka_exporter) 会舒服很多。

另外 滴滴 开源的 [LogikM](https://github.com/didi/LogiKM) 看起来也不错。



### 数据卷

如果有持久化需求可以放开 yaml 文件中的 `volumes`相关配置，并创建对应文件夹同时将文件夹权限调整为 `777`。

> 因为容器内部使用 uid=1001 的用户在运行程序，容器外部其他用户创建的文件夹对 1001 来说是没有权限的。



### 目录结构

整体目录结构如下所示：

```sh
kafka
├── docker-compose.yaml
├── kafka
└── zookeeper
```



### 启动

在 `docker-compose.yaml` 文件目录下使用以下命令即可一键启动：

```sh
docker-compose up
```



## 3. 测试

启动后浏览器直接访问`localhost:9000`即可进入 Web 监控界面。



> Kafka 系列相关代码见 [Github][Github]



[github]:https://github.com/lixd/kafka-go-example