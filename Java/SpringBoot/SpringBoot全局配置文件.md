# SpringBoot全局配置文件

### 端口号配置

```properties
server.port=8888
```

### 自定义属性

application.properties中

```properties
msg=hello world
```

java文件中获取值

```java
@Value("${msg}")
private String msg;
```

### 配置变量引用

application.properties中

```properties
msg1=springboot
msg2=hello ${msg1}
```

java文件中获取值

```java
@Value("${msg2}")
private String msg;
```

###  随机值配置

application.properties中

```properties
randomnum=${random.int}
```

java文件中获取值

```java
@Value("${msg2}")
private String msg;
```

**随机值只会在开启服务时生成一次。**

例如随机端口号：

在SpringCloud微服务中，不需要记录IP和端口号，也不需要我们去维护，直接随机生成就好了。

```properties
server.port=${random.int[1024,9999]}  
# 限定为1024-9999
```

## yml配置文件

SpringBoot中新增的一种配置文件格式，具备天然的树状结构。

相比之下比较简洁。

application.yml

```yaml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/shiro?useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC
    username: root
    password: root
    type: com.alibaba.druid.pool.DruidDataSource
  http:
    encoding:
      charset: utf-8
      enabled: true

mybatis:
  mapper-locations: classpath:mapper/*.xml
  type-aliases-package: com.example.shiro.pojo
```