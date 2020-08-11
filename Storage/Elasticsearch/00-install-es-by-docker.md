# Elasticsearch 安装

## 1. 环境准备

### 1. Virtual memory

Elasticsearch 使用 mmapfs 目录存储索引，但是默认操作系统对 mmap 计数限制太低了（一般都不够用），会导致内存不足。

查看当前限制

```shell
[root@iZ2zeahgpvp1oasog26r2tZ vm]# sysctl vm.max_map_count
vm.max_map_count = 65530
```

临时修改 

```shell
[root@iZ2zeahgpvp1oasog26r2tZ vm]# sysctl -w vm.max_map_count=262144
vm.max_map_count = 262144
```

永久修改

```shell
vi /etc/sysctl.cof
# 增加 如下内容
vm.max_map_count = 262144
```

```shell
#重新加载 使其生效
sysctl -p
```



一般只需要调整这一项就能启动了。

更多生产环境配置看这里[Elasticsearch 生产环境配置](http://www.lixueduan.com)



## 2. 二进制安装

### 1. Elasticsearch

> 7.0 版本开始 Elasticsearch 已经自带 JDK 了，所以不需要准备 Java 环境。

官网下载压缩文件，解压即可使用。

下载地址：

```text
https://www.elastic.co/cn/downloads/elasticsearch
```

下载后并解压，运行`bin/elasticsearch` 即可启动 elasticsearch。

> 不能用 root 账号启动 否则会报错 
>
> uncaught exception in thread [main]
> java.lang.RuntimeException: can not run elasticsearch as root

运行起来后浏览器访问 

```text
http://localhost:9200
```

 应该可以看到以下信息

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

> 如果是远程访问的话 需要修改一下配置
>
> 修改 elasticsearch/config/elasticsearch.yml
>
> ```shell
> network.host: 0.0.0.0  # 改为0.0.0.0对外开放，如对特定ip开放则改为指定ip
> discovery.seed_hosts: ["127.0.0.1"] # 修改network.host后需要同步修改这个
> ```

#### 1. 目录文件结构

| 目录    | 配置文件          | 描述                                                         |
| ------- | ----------------- | ------------------------------------------------------------ |
| bin     |                   | 脚本文件，包括启动 Elasticsearch、安装插件，运行统计数据等。 |
| config  | elasticsearch.yml | 集群配置文件                                                 |
| data    | path.data         | 数据文件                                                     |
| jdk     |                   | Java 运行环境                                                |
| lib     |                   | Java 类库                                                    |
| logs    | path.logs         | 日志文件                                                     |
| modules |                   | 包含所有 ES 模块                                             |
| plugins |                   | 包含所有已安装插件                                           |

#### 2. 插件

```shell
# 安装 分词插件`analysis-icu`
/bin/elasticsearch-pluguns install analysis-icu

# 查看插件列表
/bin/elasticsearch-pluguns list
```

#### 3. 相关命令

```shell
#启动单节点 -E 以环境变量的方式指定相关参数
bin/elasticsearch -E node.name=node0 -E cluster.name=17x -E path.data=node0_data

#安装插件
bin/elasticsearch-plugin install analysis-ik
#查看插件
bin/elasticsearch-plugin list
#查看安装的插件
GET http://localhost:9200/_cat/plugins?v

#start multi-nodes Cluster
bin/elasticsearch -E node.name=node0 -E cluster.name=17x -E path.data=node0_data
bin/elasticsearch -E node.name=node1 -E cluster.name=17x -E path.data=node1_data
bin/elasticsearch -E node.name=node2 -E cluster.name=17x -E path.data=node2_data
bin/elasticsearch -E node.name=node3 -E cluster.name=17x -E path.data=node3_data

#查看集群
GET http://localhost:9200
#查看nodes
GET _cat/nodes
GET _cluster/health
```

### 2. Kibana

同样的，官网下载压缩文件，直接解压后运行即可。

地址：

```text
https://www.elastic.co/cn/downloads/kibana
```

运气`/bin/kibana` 即可

浏览器访问`http://localhost:5601`

插件安装和 ES 很像。

```shell
bin/kibana-plugin install plugin_location
bin/kibana-plugin list
bin/kibana-plugin remove
```

## 3. Docker 安装

使用 docker-compose 快速安装

> docker-compose 安装 [看这里](https://www.lixueduan.com/categories/Docker/)

**安装这些 大概需要 4GB 内存，否则可能无法启动**。

### 1. docker-compose.yaml

`docker-compose.yaml`完整内容如下：

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

> 如果是单节点 需要配置  discovery.type = single-node 

### 2. 分词器安装

分词器安装很简单，一条命令搞定

```shell
./elasticsearch-plugin install url
```

其中 url 为对应分词器的下载地址

比如安装 ik 分词器

```shell
./elasticsearch-plugin install https://github.com/medcl/elasticsearch-analysis-ik/releases/download/v7.8.0/elasticsearch-analysis-ik-7.8.0.zip
```



常用分词器列表

* ​	IK 分词器
  * https://github.com/medcl/elasticsearch-analysis-ik
* 拼音分词器
  * https://github.com/medcl/elasticsearch-analysis-pinyin



**分词器版本需要和elasticsearch版本对应，并且安装完插件后需重启Es，才能生效**

**分词器版本需要和elasticsearch版本对应，并且安装完插件后需重启Es，才能生效**

**分词器版本需要和elasticsearch版本对应，并且安装完插件后需重启Es，才能生效**

插件安装其实就是下载 zip 包然后解压到 plugins 目录下。

Docker 安装的话可以通过 Volume 的方式放在宿主机，或者进入容器用命令行安装也是一样的。

> 命令行安装的 IK 分词器，如果有 config 目录会移动到 elasticsearch 的config 中，新目录名和分词器名一致。如 /usr/share/elasticsearch/config/analysis-ik

可以通过数据卷方式挂载到宿主机。

分词器测试 

```shell
#ik_max_word 会将文本做最细粒度的拆分
#ik_smart 会做最粗粒度的拆分
#pinyin 拼音
POST _analyze
{
  "analyzer": "ik_max_word",
  "text": ["剑桥分析公司多位高管对卧底记者说，他们确保了唐纳德·特朗普在总统大选中获胜"]
} 
```

