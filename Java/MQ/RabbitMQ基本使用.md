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

* 系统可用性降低: 本来你的系统就是正常的，然后加个消息队列进去，若消息队列挂了，系统也无法正常运行了。

* 系统复杂性增加: 要多考虑很多方面的问题，比如一致性问题、如何保证消息不被重复消费，如何保证保证消息可靠传输。因此，需要考虑的东西更多，系统复杂性增大。

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

## 参考

`https://blog.csdn.net/qq_39470733/article/details/80576013`

