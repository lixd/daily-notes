# Eureka注册中心

## 1. Eureka简介

Eureka 是 Netflix 出品的用于实现服务注册和发现的工具。 Spring Cloud 集成了 Eureka，并提供了开箱即用的支持。其中， Eureka 又可细分为 Eureka Server 和 Eureka Client。

## 2. Eureka三种角色

Eureka Server

通过Register，Get，Renew等接口提供服务的注册和发现。

Application Server

服务提供方

把自身的服务实例注册到Rureka Server中

Application Client

服务调用方

通过Eureka Server获取服务列表，调用服务。

## 3. 入门

### 1. 创建项目

首先创建一个简单的SpringBoot项目。

### 2.添加依赖

修改pom.xml文件

添加`spring-cloud-starter`和`spring-cloud-starter-netflix-eureka-server` 和一个 `dependencyManagement`用来表名SpringCloud的版本

```xml

    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-server</artifactId>
        </dependency>
    </dependencies>  

<dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.cloud</groupId>
                <artifactId>spring-cloud-dependencies</artifactId>
                <version>${spring-cloud.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
```

### 3. 修改启动类

在启动类上添加`@EnableEurekaServer`注解，表明这是一个EurekaServer

```java
@EnableEurekaServer
@SpringBootApplication
public class EurekaServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }

}
```

### 4. 全局配置文件

配置文件中配置以下端口号，同时关闭`register-with-eureka`和`fetch-registry`.由于这个项目是EurekaServer的同时也是一个服务，然后会尝试将自己注册到EurekaServer上去，emmm.

```yaml
server:
  port: 8761

eureka:
  client:
    #是否将自己注册到EurekaServer中
    register-with-eureka: false
    #是否从Eureka-Server中获取服务注册信息
    fetch-registry: false
```

### 5. EurekaServer服务管理平台

配置好后就可以运行了，成功开启后可以通过浏览器访问管理平台`http://localhost:8761/`

