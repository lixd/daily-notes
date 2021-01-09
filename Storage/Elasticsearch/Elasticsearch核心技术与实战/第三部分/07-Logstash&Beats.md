# Logstash & Beats

## Logstash

* Pipeline
  * 包含了 input-filter-output 三个阶段的处理流程
  * 插件生命周期管理
  * 队列管理
* Logstash Event
  * 数据在内部流转时的具体表现形式。数据在 Input 阶段被转换为 Event，在 output 被转化成目标格式数据
  * Event 其实是一个 Java Object，在配置文件中，对 Event 的属性进行增删改查



具体配置

```conf
input { stdin { } }

filter {
  grok {
    match => { "message" => "%{COMBINEDAPACHELOG}" }
  }
  date {
    match => [ "timestamp" , "dd/MMM/yyyy:HH:mm:ss Z" ]
  }
}

output {
  stdout { codec => rubydebug }
}
```



### 2. 使用

官方文档

```shell
https://www.elastic.co/guide/en/logstash/current/getting-started-with-logstash.html
```





## Beats

https://www.elastic.co/guide/en/beats/metricbeat/current/metricbeat-getting-started.html



### 1. Install

```shell
curl -L -O https://artifacts.elastic.co/downloads/beats/metricbeat/metricbeat-7.8.0-linux-x86_64.tar.gz
tar xzvf metricbeat-7.8.0-linux-x86_64.tar.gz
```

### 2. Config

开启想要的 modules

```shell
# 查看 当前的 modules
./metricbeat modules list
# 开启指定 modules
./metricbeat modules enable kibana 
./metricbeat modules enable elasticsearch 
```

配置 kibana elasticsearch 访问地址

```shell
vim metricbeat.yml

# 修改如下内容 没有密码可以不填
output.elasticsearch:
  hosts: ["myEShost:9200"]
  username: "filebeat_internal"
  password: "YOUR_PASSWORD" 
setup.kibana:
  host: "mykibanahost:5601"
  username: "my_kibana_user"  
  password: "YOUR_PASSWORD"
```



### 3. dashboards

开启 kibana 中的 dashboards

```shell
# 确保当前 kibana 和 elasticsearch 在运行
./metricbeat setup --dashboards
```



### 4. start

```shell
./metricbeat -e
```



### 5. view

然后就可以在 dashboards 里查看统计信息了。