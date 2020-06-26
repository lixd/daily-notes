# docker网络



## 问题

在移除docker网络时报错如下

```sh
[root@iZ2ze78em53s7ii5ok4gbxZ es]# docker network ls
NETWORK ID          NAME                DRIVER              SCOPE
1d76a9283f48        bridge              bridge              local
e8c500e10cd5        es_esnet            bridge              local
47b6abbdf679        host                host                local
e99fcd61a121        none                null                local

[root@iZ2ze78em53s7ii5ok4gbxZ es]# docker network rm es_esnet
Error response from daemon: error while removing network: network es_esnet id e8c500e10cd5a7ea08bf905b0550d224137dccb674bbad40074541bd1450557e has active endpoints
```



## 解决

直接强制删除 

```sh
[root@iZ2ze78em53s7ii5ok4gbxZ es]# docker network rm -f es_esnet
```

通过这个是可以解决前面的问题的，具体原因可以接着往后看。



## 具体流程

```sh
Error response from daemon: error while removing network has active endpoints
```

提示该网络还有活动端点无法移除。

接着通过`inspect`命令查看具体情况

```sh
[root@iZ2ze78em53s7ii5ok4gbxZ es]# docker network inspect es_esnet
[
    {
        "Name": "es_esnet",
        "Id": "e8c500e10cd5a7ea08bf905b0550d224137dccb674bbad40074541bd1450557e",
        "Created": "2019-12-30T10:31:33.816942353+08:00",
        "Scope": "local",
        "Driver": "bridge",
        "EnableIPv6": false,
        "IPAM": {
            "Driver": "default",
            "Options": null,
            "Config": [
                {
                    "Subnet": "172.18.0.0/16",
                    "Gateway": "172.18.0.1"
                }
            ]
        },
        "Internal": false,
        "Attachable": true,
        "Ingress": false,
        "ConfigFrom": {
            "Network": ""
        },
        "ConfigOnly": false,
        "Containers": {
            "5d826ad49414102265b5f878df7edafaee6be7288189814c0021f07485f55c46": {
                "Name": "es1",
                "EndpointID": "0dbb6009a37338c095978ec0fc817c870bc52a39553523dd0c47e8a919835e23",
                "MacAddress": "02:42:ac:12:00:04",
                "IPv4Address": "172.18.0.4/16",
                "IPv6Address": ""
            }
        },
        "Options": {},
        "Labels": {
            "com.docker.compose.network": "esnet",
            "com.docker.compose.project": "es",
            "com.docker.compose.version": "1.25.0"
        }
    }
]
```

可以看到有一个叫`es1`的容器还连接着这个网络。

那就用`disconnet`命令断开连接呗
```sh
[root@iZ2ze78em53s7ii5ok4gbxZ es]# docker network disconnect es_esnet es1
Error response from daemon: No such container: es1
```

提示没有这个容器。

```sh
[root@iZ2ze78em53s7ii5ok4gbxZ es]# docker ps -a
```

`docker ps -a`查看确实没有这个容器。

网上查了下原因如下

> 这是一个陈旧的端点,就算容器已经删除了 还是可以看到此端点。

那只能`disconnet -f`强制断开连接了。

```sh
[root@iZ2ze78em53s7ii5ok4gbxZ es]# docker network disconnect -f es_esnet es1
```

ok

然后移除网络

```sh
[root@iZ2ze78em53s7ii5ok4gbxZ es]# docker network rm es_esnet
```

## 问题如何出现的

问题的起因是有个容器一直关不了。

试了`docker stop`or`docker kill`都没有反应

查看了启动时也没有加`--restart=always`这些参数,所以也不存在一直重启的问题

脑子一抽直接`docker rm -f`了

容器倒是删掉了 但是又出现了前面这个问题 。