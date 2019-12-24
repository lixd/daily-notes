## Elasticsearch



## 1. 概述

单机下的3节点伪集群部署。

包含了：es集群+ik分词器+kibana+head插件。

## 2. 环境准备

### 1. jdk

需要jdk1.8及以上。

### 2. docker-compose

基于`docker-compsoe`编排，所以需要`docker`+`docker-compose`

### 3. 创建目录

**一定要先创建目录**

**一定要先创建目录**

**一定要先创建目录**

**虽然在没有目录的情况下启动会自动创建对应目录但是真正写入数据时会出现权限问题**。

目录结构如下

```sh
/usr/local/docker
├── es
│ 	├── /data # 数据文件
│	│	  ├─/node1 
│	│	  ├─/node2
│	│     ├─/node3 
│	├── /logs # 日志文件
│	│	  ├─/node1 
│	│	  ├─/node2
│	│	  ├─/node3 
│	├── /conf # 配置文件  暂时没用到 大多数都是用的默认配置
│	│	  ├─/node1 
│	│	  ├─/node2
│	│	  ├─/node3
│   ├── /plugins # 插件 这个就不用分节点存了。。
│	│	├─/elasticsearch-analysis-ik-6.7.0 #暂时只用到了分词器
└── docker-compose.yml # docker-compose配置文件
```

对应目录创建命令

```sh
mkdir -p es/{data,logs,conf}/{node1,node2,node3} es/plugins
```

### 4. 系统变量调整

调整用户内存

> 否则启动时可能会出现用户拥有的内存权限太小,至少需要262144的问题

```sh
$ sysctl -w vm.max_map_count=262144
```

## 3. docker-compose.yml

### 1. docker-compose.yml

```yaml
version: '2'
services:
 elasticsearch1:
   image: elasticsearch:6.7.0
   container_name: es1
   environment:
     - cluster.name=docker-cluster
     - node.name=es1
     - bootstrap.memory_lock=true
     - http.cors.enabled=true
     - http.cors.allow-origin=*
     - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
     - "discovery.zen.ping.unicast.hosts=es1,es2,es3"
   ulimits:
     memlock:
       soft: -1
       hard: -1
   volumes:
      - ./data/node1:/usr/share/elasticsearch/data
      - ./logs/node1:/user/share/elasticsearch/logs
      - ./plugins:/usr/share/elasticsearch/plugins
   ports:
     - 9200:9200
     - 9300:9300
   networks:
     - esnet
 elasticsearch2:
   image: elasticsearch:6.7.0
   container_name: es2
   environment:
     - cluster.name=docker-cluster
     - node.name=es2
     - bootstrap.memory_lock=true
     - http.cors.enabled=true
     - http.cors.allow-origin=*
     - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
     - "discovery.zen.ping.unicast.hosts=es1,es2,es3"
   ulimits:
     memlock:
       soft: -1
       hard: -1
   volumes:
      - ./data/node2:/usr/share/elasticsearch/data
      - ./logs/node2:/user/share/elasticsearch/logs
      - ./plugins:/usr/share/elasticsearch/plugins
   ports:
      - 9201:9200
      - 9301:9300
   networks:
     - esnet
 elasticsearch3:
   image: elasticsearch:6.7.0
   container_name: es3
   environment:
     - cluster.name=docker-cluster
     - node.name=es3
     - bootstrap.memory_lock=true
     - http.cors.enabled=true
     - http.cors.allow-origin=*
     - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
     - "discovery.zen.ping.unicast.hosts=es1,es2,es3"
   ulimits:
     memlock:
       soft: -1
       hard: -1
   volumes:
      - ./data/node3:/usr/share/elasticsearch/data
      - ./logs/node3:/user/share/elasticsearch/logs
      - ./plugins:/usr/share/elasticsearch/plugins
   ports:
      - 9202:9200
      - 9302:9300
   networks:
     - esnet

 kibana:
   image: 'kibana:6.7.0'
   container_name: kibana
   environment:
     SERVER_NAME: kibana.local
     ELASTICSEARCH_URL: http://es1:9200
     I18N_LOCALE: zh-CN
   ports:
     - '5601:5601'
   networks:
     - esnet

 headPlugin:
   image: 'mobz/elasticsearch-head:5'
   container_name: head
   ports:
     - '9100:9100'
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

`docker-compose.yml`文件的一些简单说明。

> 网上查到大部分都是直接给一个`docker-compose.yml`文件 什么说明都没有 关键还有很多错的 emmm 萌新表示瑟瑟发抖 

```yaml
version: '2' 
```

`docker-compose`的版本

```yaml
services:
 elasticsearch1:
```

其中的`elasticsearch1`就是启动的服务的名字 可以随意填写 主要是方便自己看，知道这段代码启动的是一个什么东西。

```yaml
 image: elasticsearch:6.7.0
```

指定使用哪个镜像

> ES不同版本间还是有一定差距的 最后明确指定版本号

```yaml
container_name: es1
```

容器名字,同时在同一个`docker-network`中可以使用容器名字当做`ip`用

```sh
  environment:
     - cluster.name=docker-cluster
     - node.name=es1
     - bootstrap.memory_lock=true
     - http.cors.enabled=true
     - http.cors.allow-origin=*
     - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
```

`  environment 用于指定环境参数 这里没有用配置文件 就把要修改的几个值写这儿了`

```sh
- cluster.name=docker-cluster
```

指定ES集群名字,不指定时系统默认为`elasticsearch`。启动ES时,集群名字相同的会自动加入组成一个集群。

```sh
- node.name=es1
```

es节点名字

```sh
- bootstrap.memory_lock=true
```

启动后是否锁定内存，提高ES的性能。

```sh
     - http.cors.enabled=true
     - http.cors.allow-origin=*
```

设置运行跨域,主要用户head插件访问,否则head插件访问不了



```yaml
- "ES_JAVA_OPTS=-Xms512m -Xmx512m"
```

指定JVM参数。机器配置低就稍微调小一点,一般512够用了。



```sh
- "discovery.zen.ping.unicast.hosts=es1"
```

设置集群内节点的主机,设置一台的话这台默认成为master节点，写多个的话自动选取。

```sh
- "discovery.zen.ping.unicast.hosts=es1,es2,es3"
# es1,es2,es3为容器名,同一docker网络内可以使用container_name代替 也可以写成ip:port
```





```yaml
   ulimits:
     memlock:
       soft: -1
       hard: -1
```

解除内存限制相关设置，不设置可能会出现以下问题

> [unknown] Unable to lock JVM Memory: error=12, reason=Cannot allocate memory
> [unknown] This can result in part of the JVM being swapped out.
> [unknown] Increase RLIMIT_MEMLOCK, soft limit: 65536, hard limit: 65536
> [unknown] These can be adjusted by modifying /etc/security/limits.conf, for example: allow user 'elasticsearch' mlockall 
>
> elasticsearch soft memlock unlimited
> elasticsearch hard memlock unlimited
> [[unknown] If you are logged in interactively, you will have to re-login for the new limits to take effect.



```yaml
   volumes:
      - ./data/node1:/usr/share/elasticsearch/data
      - ./logs/node1:/user/share/elasticsearch/logs
      - ./plugins:/usr/share/elasticsearch/plugins
```

挂载数据卷。暂时使用了`data`、`logs`、`plugins`这几个,需要的话可以把`config`加上

`- ./config/node1/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml`



```yaml
   ports:
      - 9202:9200
      - 9302:9300
```

指定端口号,由于是在一台机器上跑的，所以把端口号改一下，es的`9200`分别映射到宿主机的`9200、9201、9202`,

`9300`则分别映射到`9300、9301、9302`。

> 其中9200是es的http访问端口
>
> 9300是用于同步数据的tcp端口



```yaml
   networks:
     - esnet
```

配置docker网络



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

ES:

```sh
192.168.0.2:9200
```

kibana:

```sh
192.168.0.2:5601
```

head:

```sh
 192.168.0.2:9100
```

查看集群状态:

```sh
http://192.168.0.2:9200/_cat/health?v
```

> 记得改成对应的IP

## 4. FAQ

### 1. 权限问题

启动前没有创建对应文件夹导致。

```sh
 [0.001s][error][logging] Error opening log file 'logs/gc.log': Permission denied 
```

添加权限即可

```sh
# 给data和logs目录775权限
sudo chmod -R 775 /data
# 修改文件归属者
sudo chown -R 1000:1000 /data
```

### 2. 插件问题

最开始添加ik分词器的时候数据卷是这样写的

```yaml
 - ./plugins/elasticsearch-analysis-ik-6.7.0:/usr/share/elasticsearch/plugins
```

启动时报错如下

```text
es3   Caused by: java.nio.file.FileSystemException: /usr/share/elasticsearch/plugins/plugin-descriptor.properties/plugin-descriptor.properties: Not a directory
```

**解决办法**

最后发现是目录位置写错了,只需要指定plugins目录就行了

```sh
 - ./plugins:/usr/share/elasticsearch/plugins
```

改成这样即可，ES启动时会自动加载`plugins`目录下的插件,应该是把里面的每一个文件夹都当做一个插件的。

### 3. Kibana

Kibana的设置es地址的字段好像有两个。`ELASTICSEARCH_URL`和`ELASTICSEARCH_HOSTS`。

试了下这两个都能连上，不知道具体有什么区别。



## 5. Other

网上文章真的大部分都是一样的,你抄我 我抄你。但是这样也不是不能接受， 这样说不定能让更多人看到。

但是有的完全都是错的，自己都没跑过就放上去真的好嘛..



## 6. 参考

`https://www.jianshu.com/p/fdfead5acc23`

`https://blog.csdn.net/weixin_45140326/article/details/98185314`