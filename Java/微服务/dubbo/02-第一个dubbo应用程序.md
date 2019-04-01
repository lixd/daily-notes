# 第一个dubbo应用程序

## 1. 创建API

创建一个名为 `hello-dubbo-service-user-api` 的项目，该项目只负责**定义接口**

`pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.illusory</groupId>
    <artifactId>hello-dubbo-service-user-api</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>jar</packaging>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <java.version>1.8</java.version>
    </properties>
</project>
```

### 定义服务接口

```java
package com.funtl.hello.dubbo.service.user.api;

public interface UserService {
    String sayHi();
}
```

## 2. 创建Provider

创建一个名为 `hello-dubbo-service-user-provider` 的项目，该项目主要用于实现接口,对外提供服务

### POM

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.illusory</groupId>
    <artifactId>hello-dubbo-service-user-provider</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>jar</packaging>

    <name>hello-dubbo-service-user-provider</name>
    <description>Demo project for Spring Boot</description>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.0.6.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <java.version>1.8</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        <dependency>
            <groupId>com.alibaba.boot</groupId>
            <artifactId>dubbo-spring-boot-starter</artifactId>
            <version>0.2.0</version>
        </dependency>
        <dependency>
            <groupId>com.alibaba.boot</groupId>
            <artifactId>dubbo-spring-boot-actuator</artifactId>
            <version>0.2.0</version>
        </dependency>
<!--这个就是前面创建的API项目-->
        <dependency>
            <groupId>com.illusory</groupId>
            <artifactId>hello-dubbo-service-user-api</artifactId>
            <version>1.0.0-SNAPSHOT</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <mainClass>com.illusory.hello.dubbo.service.user.provider.HelloDubboServiceUserProviderApplication</mainClass>
                </configuration>
            </plugin>
        </plugins>
    </build>

</project>
```

主要增加了以下依赖：

- `com.alibaba.boot:dubbo-spring-boot-starter:0.2.0`：Dubbo Starter，0.2.0 版本支持 Spring Boot 2.x，是一个长期维护的版本。注：0.1.0 版本已经不推荐使用了，是个短期维护的版本，如果你还在用旧版，请大家尽快升级。
- `com.alibaba.boot:dubbo-spring-boot-actuator:0.2.0`：Dubbo 的服务状态检查
- `com.illusory-dubbo-service-user-api:1.0.0-SNAPSHOT`：刚才创建的接口项目，如果无法依赖别忘记先 `mvn clean install` 到本地仓库。

### 通过 `@Service` 注解实现服务提供方

```java
package com.illusory.hello.dubbo.service.user.provider.api.impl;

import com.alibaba.dubbo.config.annotation.Service;
import com.funtl.hello.dubbo.service.user.api.UserService;

@Service(version = "${user.service.version}")
public class UserServiceImpl implements UserService {
    @Override
    public String sayHi() {
        return "Hello Dubbo";
    }
}
```

### Application

```java
package com.illusory.hello.dubbo.service.user.provider;

import com.alibaba.dubbo.container.Main;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HelloDubboServiceUserProviderApplication {
    public static void main(String[] args) {
        SpringApplication.run(HelloDubboServiceUserProviderApplication.class, args);
        // 启动 Provider 容器，注意这里的 Main 是 com.alibaba.dubbo.container 包下的
        Main.main(args);
    }
}
```

### application.yml

```yml
# Spring boot application
spring:
  application:
    name: hello-dubbo-service-user-provider

# UserService service version
user:
  service:
    version: 1.0.0

# Dubbo Config properties
dubbo:
  ## Base packages to scan Dubbo Component：@com.alibaba.dubbo.config.annotation.Service
  scan:
    basePackages: com.funtl.hello.dubbo.service.user.provider.api
  ## ApplicationConfig Bean
  application:
    id: hello-dubbo-service-user-provider
    name: hello-dubbo-service-user-provider
    qos-port: 22222
    qos-enable: true
  ## ProtocolConfig Bean
  protocol:
    id: dubbo
    name: dubbo
    port: 12345
    status: server
  ## RegistryConfig Bean
  registry:
    id: zookeeper
    address: zookeeper://192.168.10.131:2181?backup=192.168.10.131:2182,192.168.10.131:2183

# Enables Dubbo All Endpoints
management:
  endpoint:
    dubbo:
      enabled: true
    dubbo-shutdown:
      enabled: true
    dubbo-configs:
      enabled: true
    dubbo-services:
      enabled: true
    dubbo-references:
      enabled: true
    dubbo-properties:
      enabled: true
  # Dubbo Health
  health:
    dubbo:
      status:
        ## StatusChecker Name defaults (default : "memory", "load" )
        defaults: memory
        ## StatusChecker Name extras (default : empty )
        extras: load,threadpool
```

## 3.创建Consumer

创建一个名为 `hello-dubbo-service-user-consumer` 的项目，该项目用于消费接口（调用接口)

### POM

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.illusory</groupId>
    <artifactId>hello-dubbo-service-user-consumer</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>jar</packaging>

    <name>hello-dubbo-service-user-consumer</name>
    <description>Demo project for Spring Boot</description>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.0.6.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <java.version>1.8</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        <dependency>
            <groupId>com.alibaba.boot</groupId>
            <artifactId>dubbo-spring-boot-starter</artifactId>
            <version>0.2.0</version>
        </dependency>
        <dependency>
            <groupId>com.alibaba.boot</groupId>
            <artifactId>dubbo-spring-boot-actuator</artifactId>
            <version>0.2.0</version>
        </dependency>

        <dependency>
            <groupId>com.illusory</groupId>
            <artifactId>hello-dubbo-service-user-api</artifactId>
            <version>1.0.0-SNAPSHOT</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <mainClass>com.illusory.hello.dubbo.service.user.consumer.HelloDubboServiceUserConsumerApplication</mainClass>
                </configuration>
            </plugin>
        </plugins>
    </build>

</project>
```

### 通过 `@Reference` 注入 `UserService`

```java
package com.illusory.hello.dubbo.service.user.consumer.controller;

import com.alibaba.dubbo.config.annotation.Reference;
import com.funtl.hello.dubbo.service.user.api.UserService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    @Reference(version = "${user.service.version}")
    private UserService userService;

    @RequestMapping(value = "hi")
    public String sayHi() {
        return userService.sayHi();
    }
}
```

### application

```java
package com.illusory.hello.dubbo.service.user.consumer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HelloDubboServiceUserConsumerApplication {
    public static void main(String[] args) {
        SpringApplication.run(HelloDubboServiceUserConsumerApplication.class, args);
    }
}
```

### application.yml

```yml
# Spring boot application
spring:
  application:
    name: hello-dubbo-service-user-consumer
server:
  port: 9090

# UserService service version
user:
  service:
    version: 1.0.0

# Dubbo Config properties
dubbo:
  scan:
    basePackages: com.funtl.hello.dubbo.service.user.consumer.controller
  ## ApplicationConfig Bean
  application:
    id: hello-dubbo-service-user-consumer
    name: hello-dubbo-service-user-consumer
  ## RegistryConfig Bean
  registry:
    id: zookeeper
    address: zookeeper://192.168.10.131:2181?backup=192.168.10.131:2182,192.168.10.131:2183

# Dubbo Endpoint (default status is disable)
endpoints:
  dubbo:
    enabled: true

management:
  server:
    port: 9091
  # Dubbo Health
  health:
    dubbo:
      status:
        ## StatusChecker Name defaults (default : "memory", "load" )
        defaults: memory
  # Enables Dubbo All Endpoints
  endpoint:
    dubbo:
      enabled: true
    dubbo-shutdown:
      enabled: true
    dubbo-configs:
      enabled: true
    dubbo-services:
      enabled: true
    dubbo-references:
      enabled: true
    dubbo-properties:
      enabled: true
  endpoints:
    web:
      exposure:
        include: "*"
```

## 4. 测试

先启动Provider然后启动Consumer，接着浏览器访问`http：//localhost：9090/hi`，同时去Admin监控中心查看是否成功注册服务。

