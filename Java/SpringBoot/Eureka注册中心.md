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

### 2. 添加依赖

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

## 4.搭建高可用Eureka注册中心(集群)

### 1. 创建项目

同上，创建一个SpringBoot项目,添加SpringCloud和Eureka，启动类中开启Eureka。

### 2. 配置文件

在搭建集群是需要添加多个配置文件，并且使用SpringBoot的多环境配置方式，为集群每一个节点添加一个配置文件。正常情况下一般是多台电脑部署，这里是一台电脑上运行多个项目，所以端口号改了下。

eureka1

```yaml
server:
  port: 8761
eureka:
  instance:
    #eureka实例名称 尽量与配置文件一致
    hostname: eureka1
  client:
    #是否将自己注册到EurekaServer中
    registerWithEureka: false
    #是否从Eureka-Server中获取服务注册信息
    fetchRegistry: false
    serviceUrl:
      #服务注册中心地址，指向另一个注册中心
      defaultZone: http://localhost:8762/
```

eureka2

```yaml
server:
  port: 8762
eureka:
  instance:
    #eureka实例名称 尽量与配置文件一致
    hostname: eureka2
  client:
    #是否将自己注册到EurekaServer中
    registerWithEureka: false
    #是否从Eureka-Server中获取服务注册信息
    fetchRegistry: false
    serviceUrl:
      #服务注册中心地址，指向另一个注册中心
      defaultZone: http://localhost:8761/

```

然后运行两个项目。就可以访问了`http://localhost:8761/`

## 5. 在高可用Eureka注册中心创建provider服务

### 1.创建项目

同上

### 2.修改pom文件

和注册中心差不多，但是这里的`eureka-client`换成为`eureka-client`

```xml
 <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-netflix-eureka-client</artifactId>
</dependency>
```

### 3.修改启动类

在启动类上添加`@EnableEurekaClient`注解，表明这是一个EurekaClient

### 4.全局配置文件

其中需要将服务注册到Eureka集群的所有节点中

```yaml
server:
  port: 8763
eureka:
  client:
    serviceUrl:
      #服务注册中心地址，需要向所有的两个节点注册
      defaultZone: http://localhost:8761/,http://localhost:8762/

```



## 6.Eureka注册中心架构

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/springboot/eureka_architecture.png)上图为Eureka官方wiki的架构图。

`Eureka Server`：注册中心集群

`us-east-xxx`：集群所在的区域

`Application Service`：服务提供者

`Application Clien`t：服务消费者

`Eureka Client`：Eureka客户端



`Register(服务注册)`:把自己的IP和端口号注册给Eureka。

`Renew(服务续约)`：发送心跳包，每30秒发送一次。告诉Eureka自己还活着。
`Cancel(服务下线)`：当provider关闭时会向Eureka发送消息，把自己从服务列表中刪除。 防止consumer调用到不存在的服务。
`Get Registry(获取服务注册列表)`：获取其他服务列表。
`Replicate(集群中数据同步)`：eureka集群中的数据复制与同步。
`Make Remote Call(远程调用)`:完成服务的远程调用。

### 同区域的服务注册与调用过程

us-east-1c区域代表了同区域内的服务注册与调用过程。

1. Application Service启动后向Eureka Server注册中心注册服务，包括IP、Port、服务名等信息。
2. Application Client启动后从Eureka Server拉取注册列表。
3. Application Client发起远程调用的时候优先调用本区域内的Application Service。如果本区内没有可用的Application Service，才会发起对其他区内的Service调用。

### 不同区域的服务注册与调用过程

三个区域us-east-1c,us-east-1d,us-east-1e结合在一起代表了不同区域内的服务注册与调用过程。

1. us-east-1c内的Application Service启动后，向本区内的Eureka Server注册服务信息。并跟本区内的Eureka Server维持心跳续约。
2. Eureka Server会将服务信息同步至相邻的us-east-1d的Eureka Server以及us-east-1e的Eureka Server
3. us-east-1e内的Application Service启动后，向本区内的Eureka Server注册服务信息。并跟本区内的Eureka Server维持心跳续约。
4. Eureka Server会将服务信息同步至相邻的us-east-1d的Eureka Server以及us-east-1c的Eureka Server
5. us-east-1d内的Application Client启动后，从本区内的Eureka Server拉取注册列表。
6. us-east-1d内的Application Client发起远程调用时，会先检索本区有没有可用的Application Service，如果没有就会通过某种算法调用us-east-1c或us-east-1e中的Application Service服务。

## 7.CAP定理

分布式系统（distributed system）正变得越来越重要，大型网站几乎都是分布式的。

分布式系统的最大难点，就是各个节点的状态如何同步。CAP 定理是这方面的基本定理，也是理解分布式系统的起点。

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/springboot/cap.jpg)

1998年，加州大学的计算机科学家 Eric Brewer 提出，分布式系统有三个指标。

> - Consistency
> - Availability
> - Partition tolerance

它们的第一个字母分别是 C、A、P。

Eric Brewer 说，这三个指标不可能同时做到。这个结论就叫做 CAP 定理。

### 1.Partition tolerance

先看 Partition tolerance，中文叫做"分区容错"。

大多数分布式系统都分布在多个子网络。每个子网络就叫做一个区（partition）。分区容错的意思是，区间通信可能失败。比如，一台服务器放在中国，另一台服务器放在美国，这就是两个区，它们之间可能无法通信。

一般来说，分区容错无法避免，因此可以认为 CAP 的 P 总是成立。CAP 定理告诉我们，剩下的 C 和 A 无法同时做到。

> 分布式系统应该一直持续运行，即使在不同节点间同步数据的时候，出现了大量的数据丢失或者数据同步延迟。 
>
> 换句话说，分区容忍性是站在分布式系统的角度，对访问本系统的客户端的再一种承诺：我会一直运行，不管我的内部出现何种数据同步问题，强调的是不挂掉。

### 2.Consistency

Consistency 中文叫做"一致性"。意思是，写操作之后的读操作，必须返回该值。举例来说，某条记录是 v0，用户向 G1 发起一个写操作，将其改为 v1。

> 对于任何从客户端发达到分布式系统的数据读取请求，要么读到最新的数据要么失败。换句话说，一致性是站在分布式系统的角度，对访问本系统的客户端的一种承诺：要么我给您返回一个错误，要么我给你返回绝对一致的最新数据，不难看出，其强调的是数据正确。

### 3. Availability

Availability 中文叫做"可用性"，意思是只要收到用户的请求，服务器就必须给出回应。

> 对于任何求从客户端发达到分布式系统的数据读取请求，都一定会收到数据，不会收到错误，但不保证客户端收到的数据一定是最新的数据。换句话说，可用性是站在分布式系统的角度，对访问本系统的客户的另一种承诺：我一定会给您返回数据，不会给你返回错误，但不保证数据最新，强调的是不出错。

### 4.结论

对于一个分布式系统而言，P是前提，必须保证，因为只要有网络交互就一定会有延迟和数据丢失，这种状况我们必须接受，必须保证系统不能挂掉。试想一下，如果稍微出现点数据丢包，我们的整个系统就挂掉的话，我们为什么还要做分布式呢？所以，按照CAP理论三者中最多只能同时保证两者的论断，对于任何分布式系统，设计时架构师能够选择的只有C或者A，要么保证数据一致性（保证数据绝对正确），要么保证可用性（保证系统不出错）。

## 8.ZooKeeper与Eureka区别

著名的CAP理论指出，一个分布式系统不可能同时满足C(一致性)、A(可用性)和P(分区容错性)。由于分区容错性在是分布式系统中必须要保证的，因此我们只能在A和C之间进行权衡。在此Zookeeper保证的是CP, 而Eureka则是AP。

### 1. Zookeeper保证CP

Zookeeper保证CP,C是因为Zookeeper是主从结构，一个主节点，其他都是从节点。leader节点down掉了，则会再次进行leader选举。正因为每次对服务的注册都在一个设备上完成，所以`保证了一致性`。其中所有数据都是从leader中复制到从节点，在复制的这段时间服务时不可用的。所以Zookeeper放弃了A,保证了CP

当向注册中心查询服务列表时，我们可以容忍注册中心返回的是几分钟以前的注册信息，但不能接受服务直接down掉不可用。也就是说，服务注册功能对可用性的要求要高于一致性。但是zk会出现这样一种情况，当master节点因为网络故障与其他节点失去联系时，剩余节点会重新进行leader选举。问题在于，选举leader的时间太长，30 ~ 120s, 且选举期间整个zk集群都是不可用的，这就导致在选举期间注册服务瘫痪。在云部署的环境下，因网络问题使得zk集群失去master节点是较大概率会发生的事，虽然服务能够最终恢复，但是漫长的选举时间导致的注册长期不可用是不能容忍的。

### 2. Eureka保证AP

Eureka看明白了这一点，因此在设计时就优先保证可用性。Eureka各个节点都是平等的，几个节点挂掉不会影响正常节点的工作，剩余的节点依然可以提供注册和查询服务。而Eureka的客户端在向某个Eureka注册或如果发现连接失败，则会自动切换至其它节点，只要有一台Eureka还在，就能保证注册服务可用(`保证可用性`)，只不过查到的信息可能不是最新的(`不保证强一致性`)。除此之外，Eureka还有一种自我保护机制，如果在15分钟内超过85%的节点都没有正常的心跳，那么Eureka就认为客户端与注册中心出现了网络故障，此时会出现以下几种情况： 

1. Eureka不再从注册列表中移除因为长时间没收到心跳而应该过期的服务 
2. Eureka仍然能够接受新服务的注册和查询请求，但是不会被同步到其它节点上(即保证当前节点依然可用) 
3. 当网络稳定时，当前实例新的注册信息会被同步到其它节点中

因此， Eureka可以很好的应对因网络故障导致部分节点失去联系的情况，而不会像zookeeper那样使整个注册服务瘫痪。



## 9.优雅的关闭服务

### 1.Eureka服务自我保护机制

#### 1.自我保护的条件

默认情况下，当`eureka server`在一定时间内没有收到实例的心跳，便会把该实例从注册表中删除（默认是90秒），但是，如果短时间内丢失大量的实例心跳，便会触发eureka server的自我保护机制.

收不到心跳包有两种情况:

* 1.微服务真的出现问题了

* 2.微服务与Eureka之间网络出现异常

通常（微服务的自身故障关闭）只会导致个别服务出现故障，不会出现大面积故障。而网络异常会导致EurekaServer短时间内无法接收到大量的心跳包。

考虑到这种情况，Eureka设置了一个阈值，当`15分钟`内收到的心跳数大量减少时，低于`85%`时会触发该保护机制。可以在eureka管理界面看到Renews threshold和Renews(last min)，当后者（最后一分钟收到的心跳数）小于前者（心跳阈值）的时候，触发保护机制，会出现红色的警告：

`EMERGENCY!EUREKA MAY BE INCORRECTLY CLAIMING INSTANCES ARE UP WHEN THEY'RE NOT.RENEWALS ARE LESSER THAN THRESHOLD AND HENCE THE INSTANCES ARE NOT BEGING EXPIRED JUST TO BE SAFE.`

从警告中可以看到，eureka认为虽然收不到实例的心跳，但它认为实例还是健康的，eureka会保护这些实例，不会把它们从注册表中删掉。

#### 2.自我保护机制的好处

该保护机制的目的是避免网络连接故障，在发生网络故障时，微服务和注册中心之间无法正常通信，但服务本身是健康的，不应该注销该服务，如果eureka因网络故障而把微服务误删了，那即使网络恢复了，该微服务也不会重新注册到eureka server了，因为只有在微服务启动的时候才会发起注册请求，后面只会发送心跳和服务列表请求，这样的话，该实例虽然是运行着，但永远不会被其它服务所感知。所以，eureka server在短时间内丢失过多的客户端心跳时，会进入自我保护模式，该模式下，eureka会保护注册表中的信息，不在注销任何微服务，当网络故障恢复后，eureka会自动退出保护模式。自我保护模式可以让集群更加健壮。

#### 3.关闭自我保护

但是我们在开发测试阶段，需要频繁地重启发布，如果触发了保护机制，则旧的服务实例没有被删除，这时请求有可能跑到旧的实例中，而该实例已经关闭了，这就导致请求错误，影响开发测试。所以，在开发测试阶段，我们可以`关闭自我保护模式`，只需在eureka server配置文件中加上如下配置即可：

`eureka.server.enable-self-preservation=false`

但在生产环境，不会频繁重启，所以，一定要把自我保护机制打开，否则网络一旦中断，就无法恢复。

### 2.优雅地关闭服务

1.不需要关闭自我保护

2.需要添加`actuator.jar`包

pom文件中,这个依赖中就包含了该jar包

```xml
		<dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-starter-eureka-server</artifactId>
        </dependency>
```

3.修改全局配置文件

```properties
#启用shutdown
endpoints.shutdown.enabled=true
#禁用密码验证
endpoints.shutdown.sensitive=false
```

4.发送一个关闭服务的URL请求

URL: `http://IP地址:端口号/shutdown`,如`http://localhost:8080/shutdown`,  必须用`POST请求`

在服务器上利用curl发送shutdown命令

```
curl -X POST http://localhost:8080/shutdown
或者
curl -d "" http://localhost:8080/shutdown
```

## 10Eureka注册中心安全认证

### 1.添加依赖

```xml
<dependency>
   <groupId>org.springframework.boot</groupId>
   <artifactId>spring-boot-starter-security</artifactId>
</dependency>

```

### 2.修改全局配置文件

```yaml
 #http basic的安全认证
 security.basic.enabled: true                  #开启认证
 security.user.name: userName             #你的用户名
 security.user.password: password        #你的密码
```

设置后每次访问服务或者注册服务时都会需要输入密码。那么问题来了，Eureka集群中节点之间的通信，也要我们输入密码的。这就emmmm,

### 3.修改service-url

修改application.yml中的service-url

形式为下面的模式:

格式：`eureka.client.serviceUrl.defaultZone=http://username:password@localhost:9090/eureka/`

例如：`eureka.client.serviceUrl.defaultZone=http://${userName}:${password}@localhost:9090/eureka/`

注意：不关是EurekaServer项目需要修改，其他需要注册到Eureka上的服务也需要修改。

