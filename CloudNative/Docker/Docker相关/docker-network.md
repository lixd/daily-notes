# docker network

## bridge

bridge是docker中使用最多的网络,容器启动时默认就会连接到bridge0网络。连接到同一个bridge网络的多个容器之间可以通信。

### Docker link

```sh
# 通过link参数将容器和已经启动的容器连接
docker run xxxxx --link [container]
```

先启动容器test1
```sh
docker run -d --name test1  busybox /bin/sh -c "while trhe;do sleep 3600; doen"
```
接着容器test2启动时link到test1
```sh
docker run -d --name test2 --link test1 busybox /bin/sh -c "while trhe;do sleep 3600; doen"
```
然后就可以在test2中ping同test1了
> 注意link是单向的 这里只能在test2 ping test1 反过来就不行 
> test1 ping test2 必须指定test2的IP

### Container指定网络

创建docker网络

```sh
# -d参数 指定drive为bridge 网络名为my-bridge
docker network create -d bridge my-bridge

# 查看网络
docker network ls 
```



启动时连接到指定的网络

```sh
docker run -d --name test1  --network my-bridge busybox  /bin/sh -c "while trhe;do sleep 3600; doen"
```

这样就不会连接到默认网络了



将正在运行的容器连接到指定网络

```sh
docker network connect my-bridge test2
```

这样test1和test2都连接到my-bridge网络了，同时也能直接用名字互相ping了。

## none

指定为none的话就没有任何办法访问该容器。只能在本地通过exec命令进入容器。

## host

使用host的话容器不会创建独立的network 会使用主机的network。

