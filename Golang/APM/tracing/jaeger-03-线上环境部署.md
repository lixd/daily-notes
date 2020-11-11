# Jaeger与Prometheus

## 1. 概述

测试部署时 all-in-one 的镜像，同时直接将数据存储在内存中，所以比较方便。

但是线上则建议单独部署各个组件和存储后端（这里采用ES存储）。

架构如下:

![](./assets/jaeger-architecture-direct.png)



![](./assets/jaeger-architecture-kafka.png)

完整架构包含如下组件：

* 1）jaeger-agent
* 2）jaeger-collector
* 3）jaeger-query
* 4）jaeger-ingester
* 5）elasticsearch
* 6）kafka





具体流程如下：

* 1）客户端通过 6831 端口上报数据给 agent
* 2）agent通过 14250 端口将数据发送给 collector
* 3）collector 将数据写入 kafka
* 4）Ingester 从 kafka中读取数据并写入存储后端
* 5）query 从存储后端查询数据并展示





暂时只部署`collector`、`agent`、`query`和`es`这四个组件。

其中`collector`、`query`和`es`可以只部署一个。

但是`agent`建议部署在每一台需要追踪的主机上。

### 1. agent

jaeger-agent 是客户端代理，需要部署在每台主机上。

| Port  | Protocol | Function                                                     |
| :---- | :------- | :----------------------------------------------------------- |
| 6831  | UDP      | 客户端上报jaeger.thrift compact协议数据，大部分客户端都使用这个 |
| 6832  | UDP      | jaeger.thrift binary协议数据。为node客户端单独开的一个端口，因为node 不支持jaeger.thrift compact协议 |
| 5778  | HTTP     | 服务器配置                                                   |
| 5775  | UDP      | zipkin.thrift compact 兼容zipkin的                           |
| 14271 | HTTP     | 健康检查和 metrics                                           |

### 2. collector

收集器，可以部署多个。收集 agent 发来的数据并写入 db 或 kafka。



| Port  | Protocol | Function                                                     |
| :---- | :------- | :----------------------------------------------------------- |
| 14250 | gRPC     | **jaeger-agent**通过该端口将收集的 span以 model.proto 格式发送到 collector |
| 14268 | HTTP     | 客户端可以通过该端口直接将 span发送到 collector。            |
| 9411  | HTTP     | 用于兼容 zipkin                                              |
| 14269 | HTTP     | 健康检查和 metrics                                           |



### 3. query

UI 界面，主要做数据展示。



| Port  | Protocol | Function                |
| :---- | :------- | :---------------------- |
| 16686 | HTTP     | 默认url localhost:16686 |
| 16686 | gRPC     | gRPC查询服务？          |
| 16687 | HTTP     | 健康检查和 metrics      |



### 4. ingester

主要从 kafka 中读取数据并写入存储后端。

| Port  | Protocol | Function           |
| :---- | :------- | :----------------- |
| 14270 | HTTP     | 健康检查和 metrics |



### 5. Storage Backends

用于存储收集的数据。

支持 Cassandra 和 Elasticsearch。



### 6.Kafka

可以在收集器和后端存储之间做缓冲。





## 2. 部署

### collector-query

这里暂时collector query放在一起。

先创建一个 docker network。

```shell
docker network create jaeger
```

然后将各个组件都放到一个网络里，这样会比较方便。

测试完成后可以把 LOG_LEVEL=debug 这个删掉。

```yml
version: '3.2'
services:
  # jaeger-collector 收集器
  jaeger-collector:
    image: jaegertracing/jaeger-collector
    container_name: jaeger-collector
    environment:
      - SPAN_STORAGE_TYPE=elasticsearch
      - ES_SERVER_URLS=http://jaeger-es:9200
      - ES_USERNAME=elastic
      - LOG_LEVEL=debug
    ports:
      - 9411:9411
      - 14250:14250
      - 14268:14268
      - 14269:14269
  # jaeger-query UI
  jaeger-query:
    image: jaegertracing/jaeger-query
    container_name: jaeger-query
    environment:
      - SPAN_STORAGE_TYPE=elasticsearch
      - ES_SERVER_URLS=http://jaeger-es:9200
      - ES_USERNAME=elastic
      - LOG_LEVEL=debug
    ports:
      - 16686:16686
      - 16687:16687

networks:
  default:
    external:
      name: jaeger
```



### es

```yml
version: '3.2'
services:
  # elasticsearch jaeger存储后端 单独部署
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.8.0
    container_name: jaeger-es
    environment:
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - discovery.type=single-node
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - ./data:/usr/share/elasticsearch/data
    ports:
      - 9201:9200

networks:
  default:
    external:
      name: jaeger
```

### kibana

为了方便管理ES中的数据还是部署一个kibana吧

> 注意：Kibana的版本必须和ES一致

```yml
version: '3.2'
services:
  # kibana 方便观察es中的数据
  kibana:
    image: 'kibana:7.8.0'
    container_name: jaeger-kibana
    environment:
      SERVER_NAME: kibana.local
      ELASTICSEARCH_HOSTS: http://jaeger-es:9200
      I18N_LOCALE: zh-en
    ports:
      - 5602:5601

networks:
  default:
    external:
      name: jaeger

```



### agent

```yml
version: '3.2'
services:
  # jaeger-agent 单独部署到各个需要采集的机器上
  jaeger-agent:
    image: jaegertracing/jaeger-agent
    container_name: jaeger-agent
    environment:
      - REPORTER_GRPC_HOST_PORT=jaeger-collector:14250
      - LOG_LEVEL=debug
    ports:
      - 5775:5775/udp
      - 5778:5778
      - 6831:6831/udp
      - 6832:6832/udp
      - 14271:14271

networks:
  default:
    external:
      name: jaeger
```

> REPORTER_GRPC_HOST_PORT 用于指定collector的地址，这里是同一个网络所以能直接通过container_name 访问。



### 问题

部署完成后测试发现远程连接服务器（123.123.123.123:6831）无法上传数据。

在服务器上（localhost:6831）使用 是可以的。





## 3. Metrics



默认情况下，Jaeger microservices以Prometheus格式公开指标。

只需要对外暴露相应端口号即可。

默认端口号如下

| Component            | Port  |
| :------------------- | :---- |
| **jaeger-agent**     | 14271 |
| **jaeger-collector** | 14269 |
| **jaeger-query**     | 16687 |
| **jaeger-ingester**  | 14270 |
| **all-in-one**       | 14269 |



也可以自定义

* 1）`--admin-http-port` 指定端口号
* 2）`--metrics-backend`指定指标数据格式，默认为Prometheus格式，可选格式为expvar.
* 3）`--metrics-http-route`指定路由，默认为`/metrics`

一般用默认格式的就可以了。

在 Prometheus 中增加相应采集任务即可。

