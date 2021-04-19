# ConfigMap 存储配置文件

## 1. 概述

应用程序容器化后配置文件也需要进行调整。

最简单的就是打包镜像时将配置文件一并打包进行。

> 虽然能用但是很不方便，每次修改配置文件都需要重新打包镜像。现在看起来显得很傻。



实际上，Kubernetes 的 `ConfigMap` 或 `Secret` 是非常好的配置管理机制。

启动 Pod 时将 ConfigMap 和 Secret 以数据卷或者环境变量方式加载到Pod中即可。

ConfigMap模块会自动更新Pod中的ConfigMap。



## 2. 相关

```sh
https://aleiwu.com/post/configmap-hotreload/
https://aleiwu.com/post/configmap-rollout-followup/#helm-%E5%92%8C-kustomize-%E7%9A%84%E5%AE%9E%E8%B7%B5%E6%96%B9%E5%BC%8F
```





## 3. Viper

Go 语言中的配置管理库 Viper 可以监听配置文件变化实现热更新。

> 不过只能发现是哪个文件变化，不知道具体修改内容。

最好将不同模块的配置文件分成多个文件。这样监听到对应模块配置文件变化后在调用一次对应的初始化方法即可。

同时 ConfigMap 挂载的Pod中之后，每个Key都会生成一个对应的文件就更加方便Viper监听了。

如何使用viper监听多个配置文件？



方案一

使用全局Viper包分别读取多个配置文件，多个配置文件内容重复则会被覆盖，同时Viper会分别监听多个文件。

> 文件变化时更新文件名初始化对应的模块

方案二

分别创建不同的 Viper 实例来读取并监听各个文件。



方案一实现比较简单，监听处根据文件名进行处理即可。

方案二则比较麻烦，需要为不同实例实现不同的监听方法，同时不同的配置文件只能从对应的viper实例中读取。

权衡后建议用方案一。

核心代码如下：

```go
func Loads(files []string) error {
	for _, file := range files {
		if runtime.GOOS == "windows" {
			file = data.Path(file)
		}
		// 初始化配置文件
		if err := initConfig(file); err != nil {
			return err
		}
		// 监控配置文件变化并热加载程序
		watchConfig()
	}
	return nil
}

// watchConfig 监控配置文件变化并热加载程序
func watchConfig() {
	viper.WatchConfig()
	viper.OnConfigChange(func(e fsnotify.Event) {
		log.Printf("Config file changed: %s", e.Name)

		prefix := utils.GetFilePrefix(e.Name)
		switch prefix {
		case conf.Elasticsearch:
			fmt.Println("elasticsearch conf changed!")
			// 配置文件更新后再次初始化
			// elasticsearch.Init()
		case conf.MongoDB:
			fmt.Println("mongo conf changed!")
		case conf.Redis:
			fmt.Println("redis conf changed!")
		case conf.Basic:
			fmt.Println("basic conf changed!")
		default:
			fmt.Println("conf changed!")
		}
	})
}

```





## 4. 例子

