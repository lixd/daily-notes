

# Elasticsearch 安装

## 1. 环境准备

Elasticsearch 使用 mmapfs 目录存储索引，但是默认操作系统对 mmap 计数限制太低了（一般都不够用），会导致内存不足。

查看当前限制

```shell
$ sudo sysctl vm.max_map_count
vm.max_map_count = 65530
```

临时修改 

```shell
$ sudo sysctl -w vm.max_map_count=262144
vm.max_map_count = 262144
```

永久修改

```shell
$ sudo vi /etc/sysctl.cof
# 增加 如下内容
vm.max_map_count = 262144
```

```shell
#重新加载 使其生效
$ sudo sysctl -p
```

一般只需要调整这一项就能启动了。

更多生产环境配置看这里[Elasticsearch 生产环境配置](http://www.lixueduan.com)

## 2. docker-compose.yaml

使用 docker-compose 快速安装

> docker-compose 安装 [看这里](https://www.lixueduan.com/categories/Docker/)

**安装这些 大概需要 4GB 内存，否则可能无法启动**。

手动创建一个 docker 网络

```shell
$ docker network create elk
```

同时需要创建对应目录并授予访问权限。

### 1. Elasticsearch

```yml
version: '3.2'
services:
  elasticsearch:
    image: elasticsearch:7.8.0
    container_name: elk-es
    environment:
      # 开启内存锁定
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      # 指定单节点启动
      - discovery.type=single-node
    ulimits:
      # 取消内存相关限制  用于开启内存锁定
      memlock:
        soft: -1
        hard: -1
    volumes:
      - ./data:/usr/share/elasticsearch/data
      - ./logs:/usr/share/elasticsearch/logs
      - ./plugins:/usr/share/elasticsearch/plugins
    ports:
      - 9200:9200

networks:
  default:
    external:
      name: elk
```



### 2. cerebro

cerebro 是一个简单的 ES 集群监控工具

```yml
version: '3.2'
services:
  cerebro:
    image: lmenezes/cerebro:0.9.2
    container_name: cerebro
    ports:
      - "9000:9000"
    command:
      - -Dhosts.0.host=http://elk-es:9200

networks:
  default:
    external:
      name: elk
```



### 3. Kibana

```yml
version: '3.2'
services:
  kibana:
    image: kibana:7.8.0
    container_name: elk-kibana
    environment:
      ELASTICSEARCH_HOSTS: http://elk-es:9200
      I18N_LOCALE: zh-CN
    ports:
      - 5601:5601

networks:
  default:
    external:
      name: elk
```

## 3. 分词器

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

* IK 分词器 `https://github.com/medcl/elasticsearch-analysis-ik`
* 拼音分词器`https://github.com/medcl/elasticsearch-analysis-pinyin`

**分词器版本需要和elasticsearch版本对应，并且安装完插件后需重启Es，才能生效**

**分词器版本需要和elasticsearch版本对应，并且安装完插件后需重启Es，才能生效**

**分词器版本需要和elasticsearch版本对应，并且安装完插件后需重启Es，才能生效**

插件安装其实就是下载 zip 包然后解压到 plugins 目录下。大概是这样的：

```sh
plugins/
└── elasticsearch-analysis-ik-7.8.0
    ├── commons-codec-1.9.jar
    ├── commons-logging-1.2.jar
    ├── config
    │   ├── extra_main.dic
    │   ├── extra_single_word.dic
    │   ├── extra_single_word_full.dic
    │   ├── extra_single_word_low_freq.dic
    │   ├── extra_stopword.dic
    │   ├── IKAnalyzer.cfg.xml
    │   ├── main.dic
    │   ├── preposition.dic
    │   ├── quantifier.dic
    │   ├── stopword.dic
    │   ├── suffix.dic
    │   └── surname.dic
    ├── elasticsearch-analysis-ik-7.8.0.jar
    ├── httpclient-4.5.2.jar
    ├── httpcore-4.4.4.jar
    ├── plugin-descriptor.properties
    └── plugin-security.policy
```



**Docker 安装的话可以通过 Volume 的方式放在宿主机，或者进入容器用命令行安装也是一样的。**

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

