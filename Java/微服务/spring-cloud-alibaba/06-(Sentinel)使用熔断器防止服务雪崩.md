# 使用熔断器防止服务雪崩

## 概述

在微服务架构中，根据业务来拆分成一个个的服务，服务与服务之间可以通过 `RPC` 相互调用，在 Spring Cloud 中可以用 `RestTemplate + LoadBalanceClient` 和 `Feign` 来调用。为了保证其高可用，单个服务通常会集群部署。由于网络原因或者自身的原因，服务并不能保证 100% 可用，如果单个服务出现问题，调用这个服务就会出现线程阻塞，此时若有大量的请求涌入，`Servlet` 容器的线程资源会被消耗完毕，导致服务瘫痪。服务与服务之间的依赖性，故障会传播，会对整个微服务系统造成灾难性的严重后果，这就是服务故障的 **“雪崩”** 效应。

为了解决这个问题，业界提出了熔断器模型。

阿里巴巴开源了 Sentinel 组件，实现了熔断器模式，Spring Cloud 对这一组件进行了整合。

较底层的服务如果出现故障，会导致连锁故障。当对特定的服务的调用的不可用达到一个阀值熔断器将会被打开。

熔断器打开后，为了避免连锁故障，通过 `fallback` 方法可以直接返回一个固定值。

## 什么是 Sentinel

随着微服务的流行，服务和服务之间的稳定性变得越来越重要。 Sentinel 以流量为切入点，从流量控制、熔断降级、系统负载保护等多个维度保护服务的稳定性。

## Sentinel 的特征

- **丰富的应用场景：** Sentinel 承接了阿里巴巴近 10 年的 **双十一大促流量** 的核心场景，例如秒杀（即突发流量控制在系统容量可以承受的范围）、消息削峰填谷、实时熔断下游不可用应用等。
- **完备的实时监控：** Sentinel 同时提供实时的监控功能。您可以在控制台中看到接入应用的单台机器秒级数据，甚至 500 台以下规模的集群的汇总运行情况。
- **广泛的开源生态：** Sentinel 提供开箱即用的与其它开源框架/库的整合模块，例如与 Spring Cloud、Dubbo、gRPC 的整合。您只需要引入相应的依赖并进行简单的配置即可快速地接入 Sentinel。
- **完善的 SPI 扩展点：** Sentinel 提供简单易用、完善的 SPI 扩展点。您可以通过实现扩展点，快速的定制逻辑。例如定制规则管理、适配数据源等

## Feign 中使用 Sentinel

如果要在您的项目中引入 Sentinel，使用 group ID 为 `org.springframework.cloud` 和 artifact ID 为 `spring-cloud-starter-alibaba-sentinel` 的 starter。

```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-sentinel</artifactId>
</dependency>
```

Sentinel 适配了 Feign 组件。但默认是关闭的。需要在配置文件中配置打开它，在配置文件增加以下代码：

```yaml
feign:
  sentinel:
    enabled: true
```

### 在 Service 中增加 fallback 指定类

```java
package com.illusory.hello.spring.cloud.alibaba.nacos.consumer.feign.service;

import com.illusory.hello.spring.cloud.alibaba.nacos.consumer.feign.fallback.EchoServiceFallback;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * @author illusoryCloud
 * @version 1.0.0
 * @date 2019/4/2 23:31
 */
@FeignClient(value = "nacos-provider", fallback = EchoServiceFallback.class)
public interface EchoService {
    @GetMapping(value = "/nacos/{message}")
    String echo(@PathVariable String message);
}
```

### 创建熔断器类并实现对应的 Feign 接口

```java
package com.illusory.hello.spring.cloud.alibaba.nacos.consumer.feign.fallback;

import com.illusory.hello.spring.cloud.alibaba.nacos.consumer.feign.service.EchoService;

/**
 * @author illusoryCloud
 * @version 1.0.0
 * @date 2019/4/3 21:50
 */
public class EchoServiceFallback implements EchoService {
    @Override
    public String echo(String message) {
        return "请求失败，请检查您的网络";
    }
}
```

## 测试熔断器

此时我们关闭服务提供者，再次请求 `http://localhost:9092/nacos/hi` 浏览器会显示：

```html
请求失败，请检查您的网络
```

