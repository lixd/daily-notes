# ELK 日志管理



## 1. Filebeat 执行流程

* 定义数据采集
  * Prospector 配置 ，filebeat.yml 文件
* 建立数据模型
  * Index Template
* 建立数据处理流程
  * Ingest Pipeline
* 存储并提供可视化分析
  * ES + Kibana Dashboard