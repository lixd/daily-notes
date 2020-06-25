# Dubbo入门教程

## 0. 架构变化

#### 单一应用架构

当网站流量很小时，只需一个应用，将所有功能都部署在一起，以减少部署节点和成本。此时，用于简化增删改查工作量的数据访问框架(ORM)是关键。

#### 垂直应用架构

当访问量逐渐增大，单一应用增加机器带来的加速度越来越小，将应用拆成互不相干的几个应用，以提升效率。此时，用于加速前端页面开发的Web框架(MVC)是关键。

#### 分布式服务架构

当垂直应用越来越多，应用之间交互不可避免，将核心业务抽取出来，作为独立的服务，逐渐形成稳定的服务中心，使前端应用能更快速的响应多变的市场需求。此时，用于提高业务复用及整合的分布式服务框架(RPC)是关键。

#### 流动计算架构

当服务越来越多，容量的评估，小服务资源的浪费等问题逐渐显现，此时需增加一个调度中心基于访问压力实时管理集群容量，提高集群利用率。此时，用于提高机器利用率的资源调度和治理中心(SOA)是关键。

#### 架构中的问题：

**(1) 当服务越来越多时，服务URL配置管理变得非常困难，F5硬件负载均衡器的单点压力也越来越大。**

此时需要一个服务注册中心，动态的注册和发现服务，使服务的位置透明。

并通过在消费方获取服务提供方地址列表，实现软负载均衡和Failover，降低对F5硬件负载均衡器的依赖，也能减少部分成本。

**(2) 当进一步发展，服务间依赖关系变得错踪复杂，甚至分不清哪个应用要在哪个应用之前启动，架构师都不能完整的描述应用的架构关系。**

这时，需要自动画出应用间的依赖关系图，以帮助架构师理清理关系。

**(3) 接着，服务的调用量越来越大，服务的容量问题就暴露出来，这个服务需要多少机器支撑？什么时候该加机器？**

为了解决这些问题，第一步，要将服务现在每天的调用量，响应时间，都统计出来，作为容量规划的参考指标。

其次，要可以动态调整权重，在线上，将某台机器的权重一直加大，并在加大的过程中记录响应时间的变化，直到响应时间到达阀值，记录此时的访问量，再以此访问量乘以机器数反推总容量。

## 1.  SOA与RPC

### 1. SOA

SOA全英文是Service-Oriented Architecture，中文意思是中文面向服务编程，是一种思想，一种方法论，一种分布式的服务架构。

#### 用途

​     用途：SOA解决多服务凌乱问题，SOA架构解决数据服务的复杂程度，同时SOA又有一个名字，叫做服务治理。

当我们的项目比较小时，我们只有一个系统，并且把他们写到一起，放在一个服务器上，但是随着平台越来越大，数据量越来越大，我们不得不通过分库，把多个模块的数据库分别放在对应得服务器上，每个模块调用自己的子系统即可。

   随着我们系统的进一步复杂度的提升，我们不得不进一步对系统的性能进行提升，我们将多个模块分成多个子系统，多个子系统直接互相调用（因为SOA一般用于大型项目，比较复杂，所以一般总系统不会再集成，会拆分多个，分别做成服务，相互调用）。当我们的电商UI进行一个下订单的任务时，多个服务直接互相调用，系统通过数据总线，分别调用对于的子系统即可。

#### 优点 

  1、降低用户成本，用户不需要关心各服务之间是什么语言的、不需要知道如果调用他们，只要通过统一标准找数据总线就可以了。

 2、程序之间关系服务简单

 3、识别哪些程序有问题（挂掉）

缺点：提升了系统的复杂程度，性能有相应影响。

### 2. RPC

*RPC*（Remote Procedure Call）—远程过程调用，它是一种通过网络从远程计算机程序上请求服务，而不需要了解底层网络技术的协议。

客户端通过互联网调用远程服务器，不知道服务器具体实现，只知道远程服务器提供了什么方法。

RPC最大优点就是安全。

## 3. Dubbo

### 3.1 简介

Apache Dubbo (incubating) |ˈdʌbəʊ| 是一款高性能、轻量级的开源Java RPC框架，它提供了三大核心能力：面向接口的远程方法调用，智能容错和负载均衡，以及服务自动注册和发现。

**Dubbo是一个分布式服务框架,解决了上面的所面对的问题，Dubbo的架构如图所示：**

**![img](https://images2017.cnblogs.com/blog/784166/201708/784166-20170821143129824-377503972.png)**

### 3.2 节点角色说明

| 节点        | 角色说明                               |
| ----------- | -------------------------------------- |
| `Provider`  | 暴露服务的服务提供方                   |
| `Consumer`  | 调用远程服务的服务消费方               |
| `Registry`  | 服务注册与发现的注册中心               |
| `Monitor`   | 统计服务的调用次数和调用时间的监控中心 |
| `Container` | 服务运行容器                           |

### 3.3 调用关系说明

1. 服务容器负责启动，加载，运行服务提供者。
2. 服务提供者在启动时，向注册中心注册自己提供的服务。
3. 服务消费者在启动时，向注册中心订阅自己所需的服务。
4. 注册中心返回服务提供者地址列表给消费者，如果有变更，注册中心将基于长连接推送变更数据给消费者。使用了观察者设计模式(又叫发布/订阅设计模式>
5. 服务消费者，从提供者地址列表中，基于软负载均衡算法，选一台提供者进行调用，如果调用失败，再选另一台调用。在Consumer中使用了代理模式.创建一个Provider方类的一个代理对象.通过代理对象获取Provider中真实功能， 起到保护Provider真实功能的作用
6. 服务消费者和提供者，在内存中累计调用次数和调用时间，定时每分钟发送一次统计数据到监控中心。

Dubbo 架构具有以下几个特点，分别是连通性、健壮性、伸缩性、以及向未来架构的升级性。



## 4. 注册中心

推荐ZooKeeper

1.Zookeeper 

1.1优点:支持网络集群

1.2缺点:稳定性受限于Zookeeper

2.Redis

2.1优点:性能高.

2.2缺点:对服务器环境要求较高.

3.Multicast

3.1优点湎中心化，不需要额外安装软件.

3.2缺点:建议同机房(局域网)内使用

4.Simple

4.1适用于测试环境.不支持集群.

## 5. dubbo支持的协议

### 1. 通信协议

#### dubbo协议

　　dubbo://192.168.0.1:20188

　　默认就是走dubbo协议的，单一长连接，NIO异步通信，基于hessian作为序列化协议

　　适用的场景就是：传输数据量很小（每次请求在100kb以内），但是并发量很高



　　为了要支持高并发场景，一般是服务提供者就几台机器，但是服务消费者有上百台，可能每天调用量达到上亿次！此时用长连接是最合适的，就是跟每个服务消费者维持一个长连接就可以，可能总共就100个连接。然后后面直接基于长连接NIO异步通信，可以支撑高并发请求。

　　否则如果上亿次请求每次都是短连接的话，服务提供者会扛不住。

　　而且因为走的是单一长连接，所以传输数据量太大的话，会导致并发能力降低。所以一般建议是传输数据量很小，支撑高并发访问。

#### rmi协议

　　走java二进制序列化，多个短连接，适合消费者和提供者数量差不多，适用于文件的传输，一般较少用

#### hessian协议

　　走hessian序列化协议，多个短连接，适用于提供者数量比消费者数量还多，适用于文件的传输，一般较少用

#### http协议

　　走json序列化 

#### webservice

　　走SOAP文本序列化

### 2. 序列化协议

　　dubbo实际基于不同的通信协议，支持hessian、java二进制序列化、json、SOAP文本序列化多种序列化协议。

　　但是hessian是其默认的序列化协议。

## 6. 入门案例

官方推荐使用ZooKeeper做为dubbo的注册中心，所以在这之前需要先安装一下ZooKeeper。不了解的同学可以看这篇文章-->[ZooKeeper入门教程(一)---安装与基本使用](https://www.lixueduan.com/posts/137f5008.html)

### 1. Provider搭建

不希望Consumer知道Provider的具体实现，所以分别放在两个工程中，通过RPC框架调用。同时这样做也可以省去很多重复代码。

[Dubbo] Current Spring Boot Application is await...

### 6.1 添加依赖

先创建一个springboot工程，然后引入依赖

pom.xml

```xml
        <!--dubbo-->
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>dubbo</artifactId>
            <version>2.6.6</version>
        </dependency>
        <!--zkClient-->
        <dependency>
            <groupId>com.101tec</groupId>
            <artifactId>zkclient</artifactId>
            <version>0.11</version>
        </dependency>
        <!--暴露出去的接口-->
        <dependency>
            <groupId>com.illusory</groupId>
            <artifactId>dubbo-service</artifactId>
            <version>0.0.1-SNAPSHOT</version>
        </dependency>
```

### 6.2 接口实现
写一个简单的接口
```java
public interface DubboService {
    String sayHello(String name);
}
```
实现类
```java
public class DubboServiceImpl implements DubboService {

    @Override
    public String sayHello(String name) {
        return "hello" + name;
    }
}
```
### 3.配置文件
官方规定必须放在：classpath/META-INF/spring/*.xml--->src/main/resources//META-INF/spring/*.xml
这里是applicationContext-dubbo.xml 名称随意
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:dubbo="http://code.alibabatech.com/schema/dubbo" xsi:schemaLocation="http://www.springframework.org/schema/beans
    http://www.springframework.org/schema/beans/spring-beans.xsd
    http://code.alibabatech.com/schema/dubbo
    http://code.alibabatech.com/schema/dubbo/dubbo.xsd">
    <!-- 引入dubbo配置相关的xml的命名空间-->

    <!-- 提供方应用信息，用于计算依赖关系 -->
    <dubbo:application name="dubboservice" />
    <!--dubbo应用注册到zk的地址 -->
    <!-- 使用zookeeper注册中心暴露服务地址 -->
    　　<!--实际项目中使用properties文件的形式定义zookeeper的地址 -->
    <!--<dubbo:registry protocol="zookeeper" address="${zookeeper.address}" check="false"-->
    <!--file="dubbo.properties" />-->
    <!-- 使用multicast广播注册中心暴露服务地址 -->
    <dubbo:registry address="zookeeper://1270.0.01:2181" />
    <!-- 用dubbo协议在20880端口暴露服务 -->
    <dubbo:protocol name="dubbo" port="20880" />

    <!-- 声明需要暴露的服务接口 -->
    <dubbo:service id="dubboServiceImpl" interface="com.illusory.dubboservice.service.DubboService"
        protocol="dubbo" ref="dubboService" version="1.0" timeout="5000" />
    <!-- 具体的实现bean  一般实际项目中 不会把bean写在dubbo配置中,例如采用注解开发时,
        通过扫描的方式把bean交给spring管理,这里不需要写,直接在dubbo-service引用就好-->
    <!-- 和本地bean一样实现服务 -->
    <bean id="dubboService" class="com.illusory.dubboservice.service.impl.DubboServiceImpl" />
</beans>
```
到这里就一个简单的provider就ok了

## 7 Admin
可视化管理工具

## 8.assembly打包插件

pom.xml中添加插件
```xml
  <plugin>
                <!--坐标-->
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-assembly-plugin</artifactId>
                <!-- 配置执行器 -->
                <executions>
                    <execution>
                        <id>make-assembly</id>
                        <!-- 绑定到package生命周期阶段上 -->
                        <phase>package</phase>
                        <goals>
                            <!-- 只运行一次 -->
                            <goal>single</goal>
                        </goals>
                        <configuration>
                            <finalName>${project.name}</finalName>
                            <!--主类入口等-->
                            <archive>
                                <manifest>
                                    <addClasspath>true</addClasspath>
                                    <!-- 你的主类名 -->
                                    <mainClass>com.illusory.dubboconsumer.DubboConsumerApplication
                                    </mainClass>
                                </manifest>
                            </archive>
                            <!--配置描述文件路径-->
                            <descriptors>
                                <descriptor>src/assembly/assembly.xml</descriptor>
                            </descriptors>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
```

配置文件src/assembly/assembly.xml
```xml
<?xml version='1.0' encoding='UTF-8'?>
<assembly xmlns="http://maven.apache.org/plugins/maven-assembly-plugin/assembly/1.1.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/plugins/maven-assembly-plugin/assembly/1.1.0
                    http://maven.apache.org/xsd/assembly-1.1.0.xsd">
    <id>demo</id>
    <!--指定打包类型-->
    <formats>
        <format>jar</format>
    </formats>
    <!--定是否包含打包层目录-->
    <includeBaseDirectory>false</includeBaseDirectory>
    <!--指定要包含的文件集-->
    <fileSets>
        <!--指定要包含的目录-->
        <fileSet>
            <directory>${project.build.directory}/classes</directory>
            <!--指定当前要包含的目录的目的地。-->
            <outputDirectory>/</outputDirectory>

        </fileSet>
    </fileSets>
</assembly>
```

## SpringBoot+Dubbo

SpringBoot整合Dubbo

### 1. 添加依赖
pom.xml
具体可以参考：https://github.com/apache/incubator-dubbo-spring-boot-project
```xml
<properties>
    <spring-boot.version>2.1.1.RELEASE</spring-boot.version>
    <dubbo.version>2.7.0</dubbo.version>
</properties>
    
<dependencyManagement>
    <dependencies>
        <!-- Spring Boot -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>${spring-boot.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>

        <!-- Aapche Dubbo  -->
        <dependency>
            <groupId>org.apache.dubbo</groupId>
            <artifactId>dubbo-dependencies-bom</artifactId>
            <version>${dubbo.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>

        <dependency>
            <groupId>org.apache.dubbo</groupId>
            <artifactId>dubbo</artifactId>
            <version>${dubbo.version}</version>
            <exclusions>
                <exclusion>
                    <groupId>org.springframework</groupId>
                    <artifactId>spring</artifactId>
                </exclusion>
                <exclusion>
                    <groupId>javax.servlet</groupId>
                    <artifactId>servlet-api</artifactId>
                </exclusion>
                <exclusion>
                    <groupId>log4j</groupId>
                    <artifactId>log4j</artifactId>
                </exclusion>
            </exclusions>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <!-- Dubbo Spring Boot Starter -->
    <dependency>
        <groupId>org.apache.dubbo</groupId>
        <artifactId>dubbo-spring-boot-starter</artifactId>
        <version>2.7.0</version>
    </dependency>
    
    <dependency>
        <groupId>org.apache.dubbo</groupId>
        <artifactId>dubbo</artifactId>
    </dependency>
</dependencies>

```

### 2. Provider
首先，由服务提供方为服务消费方暴露接口 :
```java
public interface DubboService {
    String sayHello(String name);
}
```
接口实现类
```java

@Service(version = "1.0.0")
public class DubboServiceImpl implements DubboService {
    @Value("${dubbo.application.name}")
    private String serviceName;

    @Override
    public String sayHello(String name) {
        return String.format("[%s] : Hello, %s", serviceName, name);
    }
}
```
springboot配置文件
application.yml
```yaml
spring:
  # 项目名
  application:
    name: dubbo-provider-demo
dubbo:
  # dubbo应用名
  application:
    name: dubbo-provider
    # 用于配置提供服务的协议信息，协议由提供方指定，消费方被动接受
  protocol:
    name: dubbo
    port: 12345
  scan:
    # 配置dubbo组件扫描
    base-packages: com.illusory.dubboservice
    # ZooKeeper注册中心
  registry:
    address: zookeeper://192.168.5.111:2181

```
### Consumer

添加依赖
```xml
 <properties>
        <spring-boot.version>2.1.1.RELEASE</spring-boot.version>
        <dubbo.version>2.7.0</dubbo.version>
    </properties>
            <!--provider暴露出来的接口-->
            <dependency>
                <groupId>com.illusory</groupId>
                <artifactId>dubbo-service</artifactId>
                <version>0.0.1-SNAPSHOT</version>
            </dependency>
     <!-- Dubbo Spring Boot Starter -->
            <dependency>
                <groupId>org.apache.dubbo</groupId>
                <artifactId>dubbo-spring-boot-starter</artifactId>
                <version>2.7.0</version>
            </dependency>
    
            <dependency>
                <groupId>org.apache.dubbo</groupId>
                <artifactId>dubbo</artifactId>
            </dependency>
              <!--只是对版本进行管理，不会实际引入jar-->
                <dependencyManagement>
                    <dependencies>
                        <!-- Spring Boot -->
                        <dependency>
                            <groupId>org.springframework.boot</groupId>
                            <artifactId>spring-boot-dependencies</artifactId>
                            <version>${spring-boot.version}</version>
                            <type>pom</type>
                            <scope>import</scope>
                        </dependency>
            
                        <!-- Aapche Dubbo  -->
                        <dependency>
                            <groupId>org.apache.dubbo</groupId>
                            <artifactId>dubbo-dependencies-bom</artifactId>
                            <version>${dubbo.version}</version>
                            <type>pom</type>
                            <scope>import</scope>
                        </dependency>
            
                        <dependency>
                            <groupId>org.apache.dubbo</groupId>
                            <artifactId>dubbo</artifactId>
                            <version>${dubbo.version}</version>
                            <exclusions>
                                <exclusion>
                                    <groupId>org.springframework</groupId>
                                    <artifactId>spring</artifactId>
                                </exclusion>
                                <exclusion>
                                    <groupId>javax.servlet</groupId>
                                    <artifactId>servlet-api</artifactId>
                                </exclusion>
                                <exclusion>
                                    <groupId>log4j</groupId>
                                    <artifactId>log4j</artifactId>
                                </exclusion>
                            </exclusions>
                        </dependency>
                    </dependencies>
                </dependencyManagement>
```

springboot配置文件 application.yml
```yaml
spring:
  application:
    name: dubbo-comsumer-demo


```
测试类
消费者通过@Reference注入DubboService 
```java
public class TestDubbo {
    @Reference
    /**
     *   从ZooKeeper注册中心获取DubboService
     */
    private DubboService dubboServer;

    @Test
    public void test() {
        String s = dubboServer.sayHello("illusory");
        System.out.println(s);
    }
}
```

java.lang.NoClassDefFoundError: org/apache/curator/retry/ExponentialBackoffRetry

java.lang.NoClassDefFoundError: org/apache/zookeeper/Watcher

java.lang.NoClassDefFoundError: org/apache/curator/framework/recipes/cache/TreeCacheListener

Caused by: org.apache.dubbo.remoting.RemotingException: Failed to bind NettyServer on /192.168.5.191:12345, cause: Address already in use: bind



## 参考

`官方文档：http://dubbo.apache.org/zh-cn/docs/user/preface/usage.html`