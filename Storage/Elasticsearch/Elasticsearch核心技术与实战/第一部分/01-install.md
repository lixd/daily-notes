# Elasticsearch 安装

## 1. Elasticsearch

### 1. 安装

7.0 版本开始已经自带 JDK 了，不需要准备 Java 环境。

下载压缩文件，解压即可使用。

官网

```text
https://www.elastic.co/cn/downloads/elasticsearch
```

下载后并解压，执行`bin/elasticsearch` 即可启动 elasticsearch。

> 不能用 root 启动 否则会报错 
>
> uncaught exception in thread [main]
> java.lang.RuntimeException: can not run elasticsearch as root

运行起来后浏览器访问  `http://localhost:9200` 应该可以看到以下信息

```json
{
  "name" : "docker",
  "cluster_name" : "elasticsearch",
  "cluster_uuid" : "QWvfb7QyQr2rbdOO7iMFcg",
  "version" : {
    "number" : "7.8.0",
    "build_flavor" : "default",
    "build_type" : "tar",
    "build_hash" : "757314695644ea9a1dc2fecd26d1a43856725e65",
    "build_date" : "2020-06-14T19:35:50.234439Z",
    "build_snapshot" : false,
    "lucene_version" : "8.5.1",
    "minimum_wire_compatibility_version" : "6.8.0",
    "minimum_index_compatibility_version" : "6.0.0-beta1"
  },
  "tagline" : "You Know, for Search"
}

```

> 如果是远程访问的话 还需要做其他配置才行。



### 2. 目录文件结构

| 目录    | 配置文件          | 描述                                                         |
| ------- | ----------------- | ------------------------------------------------------------ |
| bin     |                   | 脚本文件，包括启动 Elasticsearch、安装插件，运行统计数据等。 |
| config  | elasticsearch.yml | 集群配置文件                                                 |
| JDK     |                   | Java 运行环境                                                |
| data    | path.data         | 数据文件                                                     |
| lib     |                   | Java 类库                                                    |
| logs    | path.logs         | 日志文件                                                     |
| modules |                   | 包含所有 ES 模块                                             |
| plugins |                   | 包含所有已安装插件                                           |

### 3. 配置

修改 JVM 相关配置，配置文件在`config/jvm.options`

* 1） Xms 和 Xmx 设置成一样
* 2） Xmx 不要超过机器内存的 50%
* 3）不要超过 30GB

### 4. 插件

```shell
# 安装 分词插件`analysis-icu`
/bin/elasticsearch-pluguns install analysis-icu

# 查看插件列表
/bin/elasticsearch-pluguns list
```

### 5. 相关命令

```shell
#启动单节点
bin/elasticsearch -E node.name=node0 -E cluster.name=geektime -E path.data=node0_data

#安装插件
bin/elasticsearch-plugin install analysis-icu
#查看插件
bin/elasticsearch-plugin list
#查看安装的插件
GET http://localhost:9200/_cat/plugins?v

#start multi-nodes Cluster
bin/elasticsearch -E node.name=node0 -E cluster.name=geektime -E path.data=node0_data
bin/elasticsearch -E node.name=node1 -E cluster.name=geektime -E path.data=node1_data
bin/elasticsearch -E node.name=node2 -E cluster.name=geektime -E path.data=node2_data
bin/elasticsearch -E node.name=node3 -E cluster.name=geektime -E path.data=node3_data

#查看集群
GET http://localhost:9200
#查看nodes
GET _cat/nodes
GET _cluster/health
```



## 2. Kibana

### 1. 安装

同样的，下载压缩文件，直接解压后运行即可。

官网

```text
https://www.elastic.co/cn/downloads/kibana
```

运气`/bin/kibana` 即可

浏览器访问`http://localhost:5601`

### 2. 插件

同样的，和 ES 很像。

```shell
bin/kibana-plugin install plugin_location
bin/kibana-plugin list
bin/kibana-plugin remove
```

## 3. Docker 安装

使用 docker-compose 快速安装

docker-compose 安装 [看这里](https://www.lixueduan.com/categories/Docker/)

### 1. 环境准备

调整用户内存

> 否则启动时可能会出现用户拥有的内存权限太小,至少需要262144的问题

```sh
# 临时修改 重启后失效
$ sysctl -w vm.max_map_count=262144

# 永久修改 直接改配置文件
grep vm.max_map_count /etc/sysctl.conf
vm.max_map_count=262144
```

**安装这些 大概需要 4GB 内存，否则可能无法启动**。

### 2. docker-compose.yaml

```yaml
version: '2.2'
services:
  # cerebro 是一个简单的 ES 监控工具
  cerebro:
    image: lmenezes/cerebro:0.9.2
    container_name: cerebro
    ports:
      - "9000:9000"
    command:
      - -Dhosts.0.host=http://elasticsearch:9200
    networks:
      - es7net
  kibana:
    image: docker.elastic.co/kibana/kibana:7.8.0
    container_name: kibana7
    environment:
      - I18N_LOCALE=zh-CN
      - XPACK_GRAPH_ENABLED=true
      - TIMELION_ENABLED=true
      - XPACK_MONITORING_COLLECTION_ENABLED="true"
    ports:
      - "5601:5601"
    networks:
      - es7net
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.8.0
    container_name: es7_01
    environment:
      - cluster.name=dockeres
      - node.name=es7_01
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - discovery.seed_hosts=es7_01,es7_02
      - cluster.initial_master_nodes=es7_01,es7_02
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - es7data1:/usr/share/elasticsearch/data
    ports:
      - 9200:9200
    networks:
      - es7net
  elasticsearch2:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.8.0
    container_name: es7_02
    environment:
      - cluster.name=dockeres
      - node.name=es7_02
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - discovery.seed_hosts=es7_01,es7_02
      - cluster.initial_master_nodes=es7_01,es7_02
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - es7data2:/usr/share/elasticsearch/data
    networks:
      - es7net

volumes:
  es7data1:
    driver: local
  es7data2:
    driver: local

networks:
  es7net:
    driver: bridge
```
