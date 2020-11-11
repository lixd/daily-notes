# Prometheus 部署

## 1. Prometheus

将Prometheus和alertmanager部署在一起

```shell
./prometheus
   ---docker-compose.yml
   ---prometheus.yml
   /alertmanager
     ---config.yml
```



### docker-compose.yml

```yml
version: '3.2'
services:
  # prometheus metrics收集
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: always
    command:
      - --config.file=/etc/prometheus/prometheus.yml
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
    ports:
      - 9090:9090
  # alertManager 监控报警
  alertmanager:
    image: prom/alertmanager
    container_name: alertmanager
    restart: always
    command:
      - --config.file=/etc/alertmanager/config.yml
      - --storage.path=/alertmanager
    volumes:
      - ./alertmanager/:/etc/alertmanager/
    ports:
      - 9093:9093

networks:
  default:
    external:
      name: prometheus

```



### prometheus.yml

prometheus配置，主要是一些采集任务

```yml
# 全局配置
global:
  # 数据采集间隔
  scrape_interval: 5s
  # 监控检查间隔
  evaluation_interval: 5s

# 报警规则
rule_files:
# - "first.rules"
# - "second.rules"

# 采集任务
scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets:
          - prometheus:9090
  - job_name: cadvisor
    static_configs:
      - targets:
          - cadvisor:8080
  - job_name: node-exporter
    static_configs:
      - targets:
          - node-exporter:9101
```



### config.yml

```yml
# 全局配置项
global:
  resolve_timeout: 5m #处理超时时间，默认为5min
  smtp_smarthost: 'smtp.sina.com:25' # 邮箱smtp服务器代理
  smtp_from: '******@sina.com' # 发送邮箱名称
  smtp_auth_username: '******@sina.com' # 邮箱名称
  smtp_auth_password: '******' # 邮箱密码或授权码  wechat_api_url: 'https://qyapi.weixin.qq.com/cgi-bin/' # 企业微信地址
# 定义模板信心templates:  - 'template/*.tmpl'
# 定义路由树信息
route:
  group_by: ['alertname'] # 报警分组依据
  group_wait: 10s # 最初即第一次等待多久时间发送一组警报的通知
  group_interval: 10s # 在发送新警报前的等待时间
  repeat_interval: 1m # 发送重复警报的周期 对于email配置中，此项不可以设置过低，否则将会由于邮件发送太多频繁，被smtp服务器拒绝
  receiver: 'email' # 发送警报的接收者的名称，以下receivers name的名称

# 定义警报接收者信息
receivers:
  - name: 'email' # 警报
    email_configs: # 邮箱配置
      - to: '******@163.com'  # 接收警报的email配置   
```



### 监控程序

跑两个监控程序为 Prometheus 提供数据。



#### cadvisor

采集监控容器相关数据。

```yml
version: '3.2'
services:
  # cadvisor 容器状态监控
  cadvisor:
    image: google/cadvisor:latest
    container_name: cadvisor
    ports:
      - 8090:8080
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:rw
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro

networks:
  default:
    external:
      name: prometheus
```



#### node-exporter

采集监控服务器相关数据。

```yml
version: '3.2'
services:
  # node-exporter 服务器状态监控
  node-exporter:
    image: prom/node-exporter
    restart: always
    container_name: node-exporter
    ports:
      - 9101:9100

networks:
  default:
    external:
      name: prometheus
```



## 2. grafana

```yml
version: '3.2'
services:
  grafana:
    image: grafana/grafana
    container_name: grafana
    restart: always
    ports:
      - 3000:3000
networks:
  default:
    external:
      name: prometheus

# 默认账号密码都为admin
```



进入 grafana UI 界面后将 Prometheus设置为数据源即可。

> https://blog.51cto.com/msiyuetian/2369130