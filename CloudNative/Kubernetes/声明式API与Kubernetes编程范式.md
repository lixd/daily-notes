# 声明式API与Kubernetes编程范式

## 1. 概述

命令式命令行操作

> 即命令行中直接传递参数

```sh
$ docker service create --name nginx --replicas 2  nginx
$ docker service update --image nginx:1.7.9 nginx
```



命令式配置文件操作

> 即命令行中只指定配置文件 参数都在配置文件中

```sh
$ docker-compose -f elk.yaml up
$ kubectl create -f nginx.yaml
# 修改nginx.yaml 比如更新nginx版本号
$ kubectl replace -f nginx.yaml
```

虽然参数都放到配置文件中去了，但是 create 的时候要用create命令，更新又要用 replace 或者 update 命令。用户还是需要记住当前是什么状态。



声明式API

```sh
$ kubectl apply -f nginx.yaml
# 修改nginx.yaml 比如更新nginx版本号
$ kubectl apply -f nginx.yaml
```

不管什么状态 都是 apply，极大降低用户心智负担。

> k8s 也不管当前是什么状态 最终调整到用户指定的状态就对了。