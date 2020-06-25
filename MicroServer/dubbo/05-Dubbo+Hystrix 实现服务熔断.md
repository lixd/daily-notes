### 测试熔断器

此时我们再次请求服务提供者，浏览器会报 500 异常

```text
Exception to show hystrix enabled.
```

# Dubbo + Hystrix 实现服务熔断

## 熔断器简介

在微服务架构中，根据业务来拆分成一个个的服务，服务与服务之间可以通过 `RPC` 相互调用。为了保证其高可用，单个服务通常会集群部署。由于网络原因或者自身的原因，服务并不能保证 100% 可用，如果单个服务出现问题，调用这个服务就会出现线程阻塞，此时若有大量的请求涌入，`Servlet` 容器的线程资源会被消耗完毕，导致服务瘫痪。服务与服务之间的依赖性，故障会传播，会对整个微服务系统造成灾难性的严重后果，这就是服务故障的 **“雪崩”** 效应。

为了解决这个问题，业界提出了熔断器模型。

Netflix 开源了 Hystrix 组件，实现了熔断器模式，Spring Cloud 对这一组件进行了整合,Dubbo中也可以使用Hystrix 组件实现服务熔断。

在微服务架构中，一个请求需要调用多个服务是非常常见的，较底层的服务如果出现故障，会导致连锁故障。当对特定的服务的调用的不可用达到一个阀值（Hystrix 是 **5 秒 20 次**） 熔断器将会被打开。

熔断器打开后，为了避免连锁故障，通过 `fallback` 方法可以直接返回一个固定值。

## Dubbo Provider 中使用熔断器

### 在 `pom.xml` 中增加依赖

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-hystrix</artifactId>
    <version>2.0.1.RELEASE</version>
</dependency>
```

### 在 Application 中增加 `@EnableHystrix` 注解

```java
package com.illusory.hello.dubbo.service.user.provider;

import com.alibaba.dubbo.container.Main;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.hystrix.EnableHystrix;

@EnableHystrix
@SpringBootApplication
public class HelloDubboServiceUserProviderApplication {
    public static void main(String[] args) {
        SpringApplication.run(HelloDubboServiceUserProviderApplication.class, args);
        Main.main(args);
    }
}
```

### 在 Service 中增加 `@HystrixCommand` 注解

在调用方法上增加 `@HystrixCommand` 配置，此时调用会经过 Hystrix 代理

```java
package com.illusory.hello.dubbo.service.user.provider.api.impl;

import com.alibaba.dubbo.config.annotation.Service;
import com.funtl.hello.dubbo.service.user.api.UserService;
import com.netflix.hystrix.contrib.javanica.annotation.HystrixCommand;
import com.netflix.hystrix.contrib.javanica.annotation.HystrixProperty;
import org.springframework.beans.factory.annotation.Value;

@Service(version = "${user.service.version}")
public class UserServiceImpl implements UserService {

    @Value("${dubbo.protocol.port}")
    private String port;

    @HystrixCommand(commandProperties = {
            @HystrixProperty(name = "circuitBreaker.requestVolumeThreshold", value = "10"),
            @HystrixProperty(name = "execution.isolation.thread.timeoutInMilliseconds", value = "2000")
    })
    @Override
    public String sayHi() {
//        return "Hello Dubbo, i am from port:" + port;
        throw new RuntimeException("Exception to show hystrix enabled.");
    }
}
```

### 测试熔断器

此时我们再次请求服务提供者，浏览器会报 500 异常

```text
Exception to show hystrix enabled.
```

## Dubbo Consumer 中使用熔断器

### 在 `pom.xml` 中增加依赖

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-hystrix</artifactId>
    <version>2.0.1.RELEASE</version>
</dependency>
```

### 在 Application 中增加 `@EnableHystrix` 注解

```java
package com.illusory.hello.dubbo.service.user.consumer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.hystrix.EnableHystrix;

@EnableHystrix
@SpringBootApplication
public class HelloDubboServiceUserConsumerApplication {
    public static void main(String[] args) {
        SpringApplication.run(HelloDubboServiceUserConsumerApplication.class, args);
    }
}
```

### 在调用方法上增加 `@HystrixCommand` 注解，并指定 `fallbackMethod` 方法

```java
package com.illusory.hello.dubbo.service.user.consumer.controller;

import com.alibaba.dubbo.config.annotation.Reference;
import com.funtl.hello.dubbo.service.user.api.UserService;
import com.netflix.hystrix.contrib.javanica.annotation.HystrixCommand;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    @Reference(version = "${user.service.version}")
    private UserService userService;

    @HystrixCommand(fallbackMethod = "hiError")
    @RequestMapping(value = "hi")
    public String sayHi() {
        return userService.sayHi();
    }

    public String hiError() {
        return "Hystrix fallback";
    }
}
```

### 测试熔断器

此时我们再次请求服务提供者，浏览器会显示：

```text
Hystrix fallback
```

至此，Dubbo + Hystrix 配置完成

## 总结

* 1.Provider和Consumer都要依赖Hystrix组件
* 2.Provider中配置Hystrix具体信息，比如熔断阈值等
* 3.Consumer中配置服务调用失败后的fallback方法。
* 4.当Provider中阈值被达到时触发服务熔断，Consumer中的请求会直接调用fallback方法以降低Provider并发压力。

