# docker容器无法关闭或停止



## 问题

最近遇到了这个问题。

`docker stop`or`docker kill`都关不掉某个容器。



## 原因

### 1. 设置了重启

可能是在启动容器时指定了`-restart=always`
这样不管什么原因容器停止了都会自动重启，就算是手动`stop`也会重启,这就很离谱了。

所以一般不设置为`always`,一般用`unless-stopped`或者`on-failure`

具体几种策略如下

* **no**
  no是**默认策略**，在任何情况下都不会restart容器

* **on-failure**

on-failure表示如果容器 **exit code**异常时将restart，如果容器**exit code**正常将不做任何处理。

```sh
sudo docker run -d --name testing_restarts --restart on-failure:5 testing_restarts
```

`on-failure[:max-retries]`，max-retries表示最大重启次数。

on-failure的好处是：**如果容器以正常exit code终止，将不会 restart**

* **always**

无论容器exit code是什么，都会自动restart。列举几个场景：

> 1.容器以非正常状态码终止(如应用内存不足导致终止)
> 2.容器被正常 stopped，然后机器重启或Docker服务重启
> 3.容器在宕机在正常运行，然后重启机器或Docker服务重启

以上情况always策略都会restart容器，但是如果是 on-failure和no策略，机器被重启之后容器将无法restart。

* **unless-stopped**

**unless-stopped** 和 **always** 基本一样，只有一个场景 **unless-stopped**有点特殊：

如果容器正常stopped，然后机器重启或docker服务重启，这种情况下容器将不会被restart

### 2. 其他

还有就是可能是卡死了，无法接收指令。

这时需要重启docker服务

##  解决

强制移除容器

```sh
docker rm -f
```

这样确实是把容器移除了，但是又出现了网络问题。

见下文`docker网络移除失败`