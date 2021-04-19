# ConfigMap 存储配置文件

## 1. 概述

应用程序容器化后配置文件也需要进行调整。

最简单的就是打包镜像时将配置文件一并打包进行。

> 虽然能用但是很不方便，每次修改配置文件都需要重新打包镜像。现在看起来显得很傻。



实际上，Kubernetes 的 `ConfigMap` 或 `Secret` 是非常好的配置管理机制。

启动 Pod 时将 ConfigMap 和 Secret 以数据卷或者环境变量方式加载到Pod中即可。

ConfigMap模块会自动更新Pod中的ConfigMap。

Go 语言中的配置文件管理库 viper 可以监听配置文件变化实现热更新。

> 不过只能发现是哪个文件变化，不知道具体修改内容。

最好将不同模块的配置文件分成多个文件。这样监听到对应模块配置文件变化后在调用一次对应的初始化方法即可。

同时 ConfigMap 挂载的Pod中之后，每个Key都会生成一个对应的文件就更加方便Viper监听了。

如何使用viper监听多个配置文件？





## 2. 相关

```sh
https://aleiwu.com/post/configmap-hotreload/
https://aleiwu.com/post/configmap-rollout-followup/#helm-%E5%92%8C-kustomize-%E7%9A%84%E5%AE%9E%E8%B7%B5%E6%96%B9%E5%BC%8F
```

