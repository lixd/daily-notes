# RabbitMQ使用

## 1.消息队列简介

RabbitMQ是采用Erlang语言实现AMQP（Advanced Message Queuing Protocol，高级消息队列协议）的消息中间件，它最初起源于金融系统，用于在分布式系统中存储转发消息。

MQ全称为Message Queue, 消息队列（MQ）是一种应用程序对应用程序的通信方法。应用程序通过读写出入队列的消息（针对应用程序的数据）来通信，而无需专用连接来链接它们。消息传递指的是程序之间通过在消息中发送数据进行通信，而不是通过直接调用彼此来通信，直接调用通常是用于诸如远程过程调用的技术。排队指的是应用程序通过 队列来通信。队列的使用除去了接收和发送应用程序同时执行的要求。其中较为成熟的MQ产品有IBM WEBSPHERE MQ等等。

RabbitMQ是目前非常热门的一款消息中间件，很多行业都在使用这个消息中间件，RabbitMQ凭借其高可靠、易扩展、高可用及丰富的功能特性收到很多人的青睐。

### 1.1 消息队列的优点

#### 1.解耦

传统模式:

系统间耦合性太强，系统A在代码中直接调用系统B和系统C的代码，如果将来D系统接入，系统A还需要修改代码，过于麻烦！

中间件模式:

将消息写入消息队列，需要消息的系统自己从消息队列中订阅，从而系统A不需要做任何修改。

#### 2.异步

传统模式:

一些非必要的业务逻辑以同步的方式运行，太耗费时间。

中间件模式:

将消息写入消息队列，非必要的业务逻辑以异步的方式运行，加快响应速度

#### 3.削峰

传统模式
并发量大的时候，所有的请求直接怼到数据库，造成数据库连接异常

中间件模式:

系统A慢慢的按照数据库能处理的并发量，从消息队列中慢慢拉取消息。在生产中，这个短暂的高峰期积压是允许的。

### 1.2 消息队列的缺点

分析:一个使用了MQ的项目，如果连这个问题都没有考虑过，就把MQ引进去了，那就给自己的项目带来了风险。我们引入一个技术，要对这个技术的弊端有充分的认识，才能做好预防。
从以下两个个角度来分析：

* 系统可用性降低:你想啊，本来其他系统只要运行好好的，那你的系统就是正常的。现在你非要加个消息队列进去，那消息队列挂了，你的系统不是呵呵了。因此，系统可用性降低

* 系统复杂性增加:要多考虑很多方面的问题，比如一致性问题、如何保证消息不被重复消费，如何保证保证消息可靠传输。因此，需要考虑的东西更多，系统复杂性增大。

## 2. 简单使用

### 1. 创建工程

首先创建一个简单的SpringBoot项目。

### 2. 引入依赖

在pom.xml文件中添加以下坐标，idea在创建项目时可直接选上RabbitMQ.

```xml
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-amqp</artifactId>
        </dependency>
```

### 3. 全局配置文件

application.yml配置以下内容

```yaml
spring:
  rabbitmq:
    host: 192.168.1.111
    port: 5672
    username: 前面创建的账号
    password: 前面配置的密码
```

如果不知道账号的话，可以参考我的前一篇文章[Linux下安装RabbitMQ](https://www.lixueduan.com/posts/b84a2c6c.html)

### 4. 创建消息队列

```java
/**
 * 消息队列配置
 *
 * @author illusoryCloud
 */
@Configuration
public class QueueConfig {
    /**
     * 创建队列
     *
     * @return 消息队列
     */
    @Bean
    public Queue creatQueue() {
        return new Queue("hello-mq");
    }
}
```

### 5. 消息发送者

```java
/**
 * 消息发送者
 *
 * @author illusoryCloud
 */
@Component
public class Sender {
    /**
     * 操作rabbitmq的模板
     */
    @Autowired
    private RabbitTemplate rabbitTemplate;

    /**
     * 发送消息
     *
     * @param msg 需要发送的消息
     */
    public void send(String msg) {
        //参数一：消息队列名称
        //参数二：消息
        this.rabbitTemplate.convertAndSend("hello-mq", msg);
    }
}
```

### 6. 消息接收者

```java
/**
 * 消息接收者
 *
 * @author illusoryCloud
 */
@Component
public class Receiver {
    /**
     * 接收消息的方法 采用消息队列监听机制
     * @param msg 接收到的消息
     */
    @RabbitListener(queues = {"hello-mq"})
    public void process(String msg) {
        System.out.println("接收到的消息-->"+msg);
    }
}
```

### 7. 测试

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class DemomqApplicationTests {
    @Autowired
    private Sender sender;

    @Test
    public void mqTest() {
        this.sender.send("hello RabbitMQ");
    }
}

//输出
接收到的消息-->hello RabbitMQ
```

此时可以在`http://192.168.1.111:15672/#/queues`中管理这个消息队列。

## 3. 原理图

![原理图](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/mq/rabbitmq-resouce.png)

![架构](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/mq/rabbitmq-design.png)

| 名称        | 详细信息                                                     |
| ----------- | :----------------------------------------------------------- |
| Message     | `消息`，由消息头和消息体组成。消息头由一系列可选属性组成，包括：routing-key(路由键),prinoity(相对于其他消息的优先权)，delivery-mode(指出消息可能持久性存储等). |
| Publisher   | 消息的`生产者`，向`交换器`发布消息的`客户端应用程序`         |
| Consumer    | 消息的`消费者`，从消息队列中取得消息的客户端应用程序         |
| Exchange    | `交换器`，用来接收生产者发送的消息，并将这些消息`路由`给服务器中的队列。三种常见的类型：1. direct(发布与订阅，完全匹配) 2. fanout(广播) 3. topic(主题，规则匹配) |
| Binding     | `绑定` ,用于消息队列和交换器之间的关联，一个绑定就是基于`路由键`将交换器和消息队列连接起来的路由规则，可以将交换器理解成一个由绑定构成的`路由表` |
| Queue       | `消息队列`，用来保存消息直到发送给消费者。它是消息的`容器`,也是消息的`终点`。一个消息可以投入到一个或者多个队列中，消息会一直在队列中，等待消费者连接到这个队列将其取走。 |
| Routing-key | `路由键`，RabbitMQ决定消息该投放到哪个消息队列的`规则`，队列通过路由键绑定到服务器。消息发送到MQ服务器时，消息将拥有一个路由键，即便是空的，RabbitMQ也会和绑定使用的路由键进行匹配。如果匹配，消息将会投递到该队列；如果不匹配，消息将会进入黑洞(由一个单独的队列来收集)。 |
| Connection  | `链接`，指rabbit服务器，服务建立的TCP链接。                  |
| Channel     | `信道`，是TCP里面的`虚拟链接`，TCP一旦打卡就会创建AMQP信道，无论是`发布消息`,`接收消息`,`订阅队列`这些动作都是通过信道完成的。 |
| VirtualHost | `虚拟主机`，表示一批交换器，消息队列和相关对象。虚拟主机是共享相同的身份认证的加密环境和独立服务器。**每个vhost本质上就是一个mini版的RabbitMQ服务器，拥有自己的队列，交换器，绑定和权限机制**.vhost是AMQP概念的基础，必须在链接是指定，RabbitMQ默认的vhost是`/` |
| Borker      | 表示消息队列服务器实体。                                     |

### 交换器和队列的关系

**交换器是通过`路由键`和队列绑定的。如果消息拥有的路由键跟队列和交换器的路由键匹配，那么消息就会被路由到该绑定的队列中。**

消息到队列的过程中，先经过交换器，然后交换器通过路由键匹配分发消息到具体的队列中。路由键可以理解为匹配的规则。

### 为什么需要信道，而不是TCP直接通信。

1.TCP的创建和销毁开销特别大，创建需要3次握手，销毁需要4次挥手。[若不了解的可以看这篇文章](https://www.lixueduan.com/posts/25338.html)

2.若不用信道，应用程序直接以TCP链接到rabbit，每秒成千上万的条消息就会有成千上万条链接，`造成资源的浪费`，而且`操作系统每秒处理TCP链接的数量是有限的`，会造成性能瓶颈。

3.信道的原理是`一条线程一条信道，多条线程多个信道`，多个信道共用一个TCP链接，一条TCP链接可以容纳无限的信道，即使每秒成千上万的请求也不会成为性能的瓶颈。

### 通信过程

假设P1和C1注册了相同的Broker，Exchange和Queue。P1发送的消息最终会被C1消费。基本的通信流程大概如下所示：

>   1）、1生产消息，发送给服务器端的。
>
> 2）、  ExchangeExchange收到消息，根据ROUTINKEY，将消息转发给匹配的Queue1。
>
> 3）、  Queue1收到消息，将消息发送给订阅者C1。
>
> 4）、  C1收到消息，发送ACK给队列确认收到消息。
>
> 5）、  Queue1收到ACK，删除队列中缓存的此条消息。

Consumer收到消息时需要显式的向rabbit broker发送basic.ack消息或者consumer订阅消息时设置auto_ack参数为true。在通信过程中，队列对ACK的处理有以下几种情况：

> 1）、如果consumer接收了消息，发送ack，rabbitmq会删除队列中这个消息，发送另一条消息给consumer。
>
> 2）、  如果cosumer接受了消息，但在发送ack之前断开连接，Rabbitmq会认为这条消息没有被deliver，在consumer在次连接的时候，这条消息会被redeliver。
>
> 3）、  如果consumer接受了消息，但是程序中有bug，忘记了ack，Rabbitmq不会重复发送消息。
>
> 4）、  Rabbitmq2.0.0和之后的版本支持consumer reject某条（类）消息，可以通过设置requeue参数中的reject为true达到目地，那么Rabbitmq将会把消息发送给下一个注册的consumer。



## 参考

`https://blog.csdn.net/qq_39470733/article/details/80576013`

