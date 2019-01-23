# RabbitMQ进阶

## 1. 原理图

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

> 1）、1生产消息，发送给服务器端的。
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

## 2. 交换器

用来接收生产者发送的消息，并将这些消息`路由`给服务器中的队列。

RabbitMQ中有三种交换器：

* 1. direct(发布与订阅，完全匹配) 

* 2. fanout(广播) 
* 3. topic(主题，规则匹配)

### 2.1 direct交换器

发布订阅，完全匹配

首先创建两个SpringBoot项目，一个消费者和一个生产者。

#### 1.全局配置文件

分别修改两个项目的全局配置文件，包括rabbitmq配置和自定义的交换器，路由键，队列等属性。

consumer

```yaml
spring:
  rabbitmq:
    #RabbitMQ服务器地址和端口号 用户名等
    host: 192.168.1.111
    port: 5672
    username: xxx
    password: xxx
# 自定义属性 交换器名称
mq:
 config:
  exchange: log.direct
  queue:
    info:
     name: log.info
     routingkey: log.info.routing.key
    error:
     name: log.error
     routingkey: log.error.routing.key
```

provider

```yaml
spring:
  rabbitmq:
    #RabbitMQ服务器地址和端口号 用户名等
    host: 192.168.1.111
    port: 5672
    username: xxx
    password: xxx
# 自定义属性 交换器名称和路由键
mq:
  config:
    exchange: log.direct
    queue:
      info:
        routingkey: log.info.routing.key
      error:
        routingkey: log.error.routing.key
server:
  port: 8081
```

#### 2.消息接收者

在consumer项目中创建消息两个消息接收者 

```java
**
 * 消息接收者
 *
 * @author illusoryCloud
 * RabbitListener bindings:绑定队列
 * QueueBinding
 * @Queue value :配置队列名称
 * autoDelete:是否是一个可删除的临时队列
 * @Exchange value:交换器名称
 * type:指定具体的交换器类型
 */
@Component
@RabbitListener(
        bindings = @QueueBinding(
                value = @Queue(value = "${mq.config.queue.error.name}", autoDelete = "true"),
                exchange = @Exchange(value = "${mq.config.exchange}", type = ExchangeTypes.DIRECT),
                key = "${mq.config.queue.error.routingkey}"
        )
)
public class ErrorReceiver {
    /**
     * 接收消息的方法 采用消息队列监听机制
     *
     * @param msg 接收到的消息
     */
    @RabbitHandler
    public void process(String msg) {
        System.out.println("error接收到的消息-->" + msg);
    }
}
```

```java
/**
 * 消息接收者
 *
 * @author illusoryCloud
 * RabbitListener bindings:绑定队列
 * QueueBinding
 * @Queue value :配置队列名称
 * autoDelete:是否是一个可删除的临时队列
 * @Exchange value:交换器名称
 * type:指定具体的交换器类型
 */
@Component
@RabbitListener(
        bindings = @QueueBinding(
                value = @Queue(value = "${mq.config.queue.info.name}", autoDelete = "true"),
                exchange = @Exchange(value = "${mq.config.exchange}", type = ExchangeTypes.DIRECT),
                key = "${mq.config.queue.info.routingkey}"
        )
)
public class InfoReceiver {
    /**
     * 接收消息的方法 采用消息队列监听机制
     *
     * @param msg 接收到的消息
     */
    @RabbitHandler
    public void process(String msg) {
        System.out.println("info接收到的消息-->" + msg);
    }
}
```

#### 3.消息发送者

在provider项目中创建一个消息发送者

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
    //交换器
    @Value(value = "${mq.config.exchange}")
    private String exchange;
    //路由键
    @Value(value = "${mq.config.queue.info.routingkey}")
    private String routingKey;
    /**
     * 发送消息
     *
     * @param msg 需要发送的消息
     */
    public void send(String msg) {
        //参数一：消息队列名称
        //参数二：消息
        this.rabbitTemplate.convertAndSend(this.exchange,this.routingKey, msg);
    }
}
```

#### 4.测试

接着就可以测试了，在provider项目中创建一个测试类。

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class ProviderApplicationTests {

    @Autowired
    private Sender sender;

    @Test
    public void send(){
        sender.send("Provider");
    }
}
```

然后先运行consumer项目，然后运行测试方法。最后consumer中的info队列会收到发送的消息。因为消息发送者中配置的routingkey就是info，若修改Sender中的routingkey为error，则会由error队列收到消息。

消息的消息头中包含了一个routingkey，然后到达交换器时根据这个routingkey来选择投递到哪个队列。

### 2.2 Topic交换器

主题，规则匹配。由完全匹配换为模糊匹配` routingkey=*.log.info `这种

