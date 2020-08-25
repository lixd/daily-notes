## RabbitMQ + Websocket

## 1. 概述

通过 RabbitMQ Web STOMP plugin 可以实现在 websocket 连接上发送 STOMP 消息。

浏览器通过 websocket 将消息发送到 插件，插件根据消息中的 topic 信息再将消息推送到 RabbitMQ 中。

插件也会读取 RabbitMQ 中的消息并通过 websocket 推送至浏览器。



## 2. 安装

这里通过 docker-compose 安装

```yml
version: '3'
services:
  rabbitmq:
    hostname: myrabbitmq
    image: rabbitmq:management
    environment:
      - RABBITMQ_DEFAULT_USER=myrabbitmq
      - RABBITMQ_DEFAULT_PASS=myrabbitmq
    ports:
      - 15672:15672
      - 5672:5672
      - 15674:15674
      - 15670:15670
    restart: always
    volumes:
      - ./data:/var/lib/rabbitmq
      - ./enabled-plugins:/etc/rabbitmq/enabled_plugins
```

 enabled-plugins 用于指定RabbitMQ中开启插件,内容格式如下：

```shell
[rabbitmq_management,rabbitmq_prometheus,rabbitmq_web_stomp,rabbitmq_web_stomp_examples].
```



`rabbitmq_web_stomp` 插件则是 websocket 与 RabbitMQ之间的桥梁，端口号15674

`rabbitmq_web_stomp_examples`插件则提供了一个例子，端口号15670.





## 3. 测试

前端代码

```html
<!-- include the client library -->
<script src="mqttws31.js"></script>

<script>
    const wsbroker = '47.93.123.142';  //mqtt websocket enabled broker
    const wsport = 15675; // port for above

    const client = new Paho.MQTT.Client(wsbroker, wsport, "/ws",
        "q-stomp");

    client.onConnectionLost = function (responseObject) {
        console.log("CONNECTION LOST - " + responseObject.errorMessage);
    };

    client.onMessageArrived = function (message) {
        console.log("RECEIVE ON " + message.destinationName + " PAYLOAD " + message.payloadString);
    };

    const options = {
        timeout: 3,
        keepAliveInterval: 30,
        onSuccess: function () {
            console.log("CONNECTION SUCCESS");
            client.subscribe('mq/rabbit/stomp',null);
        },
        onFailure: function (message) {
            console.log("CONNECTION FAILURE - " + message.errorMessage);
        },
        userName: "guest",
        password: "guest"
    };

    if (location.protocol == "https:") {
        options.useSSL = true;
    }

    client.connect(options);

    function send() {
        client.send("mq/rabbit/stomp", "my msg", 1, false)
    }
</script>
```

