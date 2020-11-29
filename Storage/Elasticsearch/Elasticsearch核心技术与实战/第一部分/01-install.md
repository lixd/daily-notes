# Elasticsearch 安装

使用 docker-compose 快速安装

docker-compose 安装 [看这里](https://www.lixueduan.com/categories/Docker/)



## 1. elasticsearch

### 1. 环境准备

调整最大虚拟内存，否则会遇到如下问题

> max virtual memory areas vm.max_map_count [65530] is too low, increase to at least [262144]

```sh
# 临时修改 重启后失效
$ sysctl -w vm.max_map_count=262144

# 永久修改 直接改配置文件
$ vim /etc/sysctl.conf
# 增加下面这句 然后重启
vm.max_map_count=262144
```

**安装这些 大概需要 4GB 内存，否则可能无法启动**。

创建相关文件夹，在 docker-compose.yml 文件所在目录创建如下文件夹

```shell
# 插件目录 把下载的插件解压后放进去
$ mkdir plugins
# 为了解决权限问题 直接给了 777 的权限
$ mkdir -m 777 -p node1/{data,logs} node2/{data,logs} node3/{data,logs}
```

创建 docker 网络

```shell
$ docker network create elk
```

### 2. docker-compose.yml

```yml
version: '3.2'
services:
  elasticsearch:
    image: elasticsearch:7.8.0
    container_name: elk-es1
    environment:
      # JVM 参数
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      # 集群名称
      - cluster.name=myes
      # 当前节点名称
      - node.name=elk-es1
      # 配置集群中所有节点信息
      - discovery.seed_hosts=elk-es1,elk-es2,elk-es3
      # 配置有资格参与 master 选举的节点
      - cluster.initial_master_nodes=elk-es1,elk-es2,elk-es3
      # 开启内存锁定以提升性能
      - bootstrap.memory_lock=true
    # 取消 memlock 配合前面的内存锁定功能
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      # 将数据挂载到宿主机实现持久化
      - ./node1/data:/usr/share/elasticsearch/data
      - ./node1/logs:/usr/share/elasticsearch/logs
      # 插件只需要其中一个节点有就行
      - ./plugins:/usr/share/elasticsearch/plugins
    ports:
      - 9200:9200
  elasticsearch2:
    image: elasticsearch:7.8.0
    container_name: elk-es2
    environment:
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - cluster.name=myes
      - node.name=elk-es2
      - discovery.seed_hosts=elk-es1,elk-es2,elk-es3
      - cluster.initial_master_nodes=elk-es1,elk-es2,elk-es3
      - bootstrap.memory_lock=true
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - ./node2/data:/usr/share/elasticsearch/data
      - ./node2/logs:/usr/share/elasticsearch/logs
  elasticsearch3:
    image: elasticsearch:7.8.0
    container_name: elk-es3
    environment:
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - cluster.name=myes
      - node.name=elk-es3
      - discovery.seed_hosts=elk-es1,elk-es2,elk-es3
      - cluster.initial_master_nodes=elk-es1,elk-es2,elk-es3
      - bootstrap.memory_lock=true
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - ./node3/data:/usr/share/elasticsearch/data
      - ./node3/logs:/usr/share/elasticsearch/logs
      - ./plugins:/usr/share/elasticsearch/plugins
# 指定使用外部名叫 elk 的 docker 网络
networks:
  default:
    external:
      name: elk
```

访问地址为`http://localhost:9200`

### 3. 插件

插件安装其实就是下载 zip 包然后解压到 plugins 目录下。Docker 安装则通过 Volume 的方式挂载目录即可。

> 比如 ik 分词器下载下来是一个`elasticsearch-analysis-ik-7.8.0.zip`,只需要要解压后的`elasticsearch-analysis-ik-7.8.0`整个目录拷贝到 plugins 目录下即可。

**分词器版本需要和 elasticsearch 版本对应，并且安装完插件后需重启 ES，才能生效**

常用分词器列表

* IK 分词器---`https://github.com/medcl/elasticsearch-analysis-ik`
* 拼音分词器---`https://github.com/medcl/elasticsearch-analysis-pinyin`



分词器测试 

```shell
# 查看插件列表
GET /_cat/plugins
#ik_max_word 会将文本做最细粒度的拆分 ik_smart 会做最粗粒度的拆分
POST _analyze
{
  "analyzer": "ik_max_word",
  "text": ["剑桥分析公司多位高管对卧底记者说，他们确保了唐纳德·特朗普在总统大选中获胜"]
} 
```





## 2. Kibana

Kibana 需要依赖 ES，所以放在 ES 之后后面启动。



### docker-compose.yml

```yml
version: '3.2'
services:
  kibana:
    image: kibana:7.8.0
    container_name: elk-kibana
    environment:
      - elasticsearch.hosts="elk-es:9200"
      - i18n.locale="zh-CN"
    ports:
      - 5601:5601

networks:
  default:
    external:
      name: es
```

访问地址为`http://localhost:5601`

## 3. cerebro

cerebro 是一个简单的 ES 集群监控工具，安装后方便查询集群状况。

```yml
version: '3.2'
services:
  # cerebro 是一个简单的 ES 监控工具
  cerebro:
    image: lmenezes/cerebro:0.9.2
    container_name: cerebro
    ports:
      - "9000:9000"
    command:
      - -Dhosts.0.host=http://elk-es1:9200

networks:
  default:
    external:
      name: elk
```

访问地址为`http://localhost:9000`

