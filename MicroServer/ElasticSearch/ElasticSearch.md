# ES

单机下的3节点(1主2从)伪集群部署。

包含了：es集群+ik分词器+kibana

## 1. 环境准备

### 1. 创建目录

```sh
/usr/local/docker
			  --/es
				/master #master节点
					--/logs #日志
					--/conf #配置文件
					--/data #数据
					--/plugins #插件
				/node1 #从节点1
				    --/logs
					--/conf
					--/data
					--/plugins
				/node2 #从节点2
					--/logs
					--/conf
					--/data
					--/plugins
```

### 2. 修改系统参数

```sh
sysctl -w vm.max_map_count=262144
```

此参数是`elasticsearch`需要修改的值，如果不修改，在生产模式下`elasticsearch`会启动失败。

## 2. 插件

### 1. ik分词器

下载地址`https://github.com/medcl/elasticsearch-analysis-ik/releases`

下载与ES版本对应的ik版本并解压到目录中，假设这里目录就叫`ik`

大概包含了这么些文件

```sh
---ik
  commons-codec-1.9.jar
  commons-logging-1.2.jar
  elasticsearch-analysis-ik-5.6.12.jar
  httpclient-4.5.2.jar
  httpcore-4.4.4.jar
  plugin-descriptor.properties
  --config
```

把`ik`上传到上面数据卷配置的`plugins`对应目录中即`/usr/local/docker/es/master/plugins`

> 这里不知道两个从节点要不要放一份 都放一份好了

最后重启ES即可。



## 3. docker-compose

### 1. docker-compose.yml



```yaml
version: '2'
services:
  elasticsearch:
    image: elasticsearch
    container_name: es-master
    hostname: es-master
    environment:
      - cluster.name=docker-cluster
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - ./master/data:/usr/share/elasticsearch/data
	  - ./master/logs:/user/share/elasticsearch/logs
	  - ./master/plugins:/usr/share/elasticsearch/plugins
    ports:
      - 9200:9200
    networks:
      - esnet
  elasticsearch2:
    image: elasticsearch
    container_name: es-node1
    hostname: es-node1
    environment:
      - cluster.name=docker-cluster
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - "discovery.zen.ping.unicast.hosts=[es-master,es-node1,es-node2]"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - ./node1/data:/usr/share/elasticsearch/data
      - ./node1/logs:/usr/share/elasticsearch/logs
	  - ./node2/plugins:/usr/share/elasticsearch/plugins
    networks:
      - esnet
  elasticsearch3:
    image: elasticsearch
    container_name: es-node2
    hostname: es-node2
    environment:
      - cluster.name=docker-cluster
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
      - "discovery.zen.ping.unicast.hosts=[es-master,es-node1,es-node2]"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - ./node2/data:/usr/share/elasticsearch/data
      - ./node2/logs:/usr/share/elasticsearch/logs
  	  - ./node2/plugins:/usr/share/elasticsearch/plugins
    networks:
      - esnet    
  kibana:
    image: kibana
    container_name: kibana
    ports:
      - 5601:5601
    environment:
      - ELASTICSEARCH_URL=http://es-master:9200
    networks:
      - esnet

volumes:
  esdata1:
    driver: local
  esdata2:
    driver: local
  esdata3:
    driver: local  
networks:
  esnet:
```



### 2. 配置说明

```sh
bootstrap.memory_lock=true
```

锁定物理内存地址，防止es内存被交换出去(默认为`false`)，也就是避免es使用swap交换分区，频繁的交换，会导致IOPS变高。

```sh
ES_JAVA_OPTS=-Xms512m -Xmx512m
```

`JVM`相关设置,最新ES版本需要jdk1.8以上环境。

```sh
memlock:
        soft: -1
        hard: -1
```

配置`memlock`最大内存地址



### 3. 启动

在`docker-compose.yml`文件所在目录执行

```sh
docker-compose up
```

不出意外的话应该可以直接启动。

需要后台运行则增加`-d`参数

```sh
docker-compose up -d
```



### 4. 访问地址

* ES: localhost:9200
* kibana:localhost:5601

外部访问带上IP即可。



## 4. 参考

`https://www.jianshu.com/p/fdfead5acc23`

`https://blog.csdn.net/weixin_45140326/article/details/98185314`