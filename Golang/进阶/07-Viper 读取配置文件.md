# Viper 读取配置文件

```go
"mongo": {
    "appUrl": "192.168.0.138:27017",
    "username": "test",
    "password": "123456",
    "maxPoolSize": 10,
    "dbName": "vaptcha",
    "authMechanism": ""
  }
```

```go
demo
  --config.json
  --main.go

//当前文件所在上级路径一直到配置文件/文件名.后缀
	viper.SetConfigFile("demo/config.json") // 配置文件
	viper.SetConfigType("json")   // 设置配置文件格式为json
	err := viper.ReadInConfig()
	if err != nil {
		fmt.Printf("conf init err %v \n", err)
	}
	appUrl := viper.GetString("mongo.appUrl")
	// 192.168.0.138:27017 
	fmt.Printf("appurl=%v \n",appUrl)
```

## 概述

Viper是一个方便Go语言应用程序处理配置信息的库。它可以处理多种格式的配置。它支持的特性：

- 设置默认值
- 从JSON、TOML、YAML、HCL和Java properties文件中读取配置数据
- 可以监视配置文件的变动、重新读取配置文件
- 从环境变量中读取配置数据
- 从远端配置系统中读取数据，并监视它们（比如etcd、Consul）
- 从命令参数中读物配置
- 从buffer中读取
- 调用函数设置配置信息

Github：`https://github.com/spf13/viper`

## 优点

在构建现代应用程序时，您不必担心配置文件格式; 你可以专注于构建出色的软件。
Viper 可以做如下工作：

- 加载并解析JSON、TOML、YAML、HCL 或 Java properties 格式的配置文件
- 可以为各种配置项设置默认值
- 可以在命令行中指定配置项来覆盖配置值
- 提供了别名系统，可以不破坏现有代码来实现参数重命名
- 可以很容易地分辨出用户提供的命令行参数或配置文件与默认相同的区别

Viper读取配置信息的优先级顺序，从高到低，如下：

- 显式调用Set函数
- 命令行参数
- 环境变量
- 配置文件
- key/value 存储系统
- 默认值

Viper 的配置项的key不区分大小写。

## 使用

### 1. 设置默认值

默认值不是必须的，如果配置文件、环境变量、远程配置系统、命令行参数、Set函数都没有指定时，默认值将起作用。
例子:

```go
	viper.SetDefault("ContentDir", "content")
```

### 2. 读取配置文件

Viper支持JSON、TOML、YAML、HCL和Java properties文件。
Viper可以搜索多个路径，但目前单个Viper实例仅支持单个配置文件。
Viper默认不搜索任何路径。
以下是如何使用Viper搜索和读取配置文件的示例。
路径不是必需的，但最好至少应提供一个路径，以便找到一个配置文件。

```go
	viper.SetConfigName("config")         //  设置配置文件名 (不带后缀)
	viper.AddConfigPath("/etc/appname/")  // 第一个搜索路径
	viper.AddConfigPath("$HOME/.appname") // 可以多次调用添加路径
	viper.AddConfigPath(".")              // 比如添加当前目录
	err := viper.ReadInConfig()           // 搜索路径，并读取配置数据
	if err != nil {
		panic(fmt.Errorf("Fatal error config file: %s \n", err))
	}
```

### 3. 监视配置文件，重新读取配置数据

Viper支持让您的应用程序在运行时拥有读取配置文件的能力。
需要重新启动服务器以使配置生效的日子已经一去不复返了，由viper驱动的应用程序可以在运行时读取已更新的配置文件，并且不会错过任何节拍。
只需要调用viper实例的WatchConfig函数，你也可以指定一个回调函数来获得变动的通知。

```go
// 监控配置文件变化并热加载程序
func (c *Config) watchConfig() {
	viper.WatchConfig()
	viper.OnConfigChange(func(e fsnotify.Event) {
		log.Infof("Config file changed: %s", e.Name)
	})
}
```

### 4. 从 io.Reader 中读取配置

Viper预先定义了许多配置源，例如文件、环境变量、命令行参数和远程K / V存储系统，但您并未受其约束。
您也可以实现自己的配置源，并提供给viper。

```go
viper.SetConfigType("yaml")
// or
viper.SetConfigType("YAML")
// any approach to require this configuration into your program.
var yamlExample = []byte(`Hacker: truename: stevehobbies:- skateboarding- snowboarding- goclothing:  jacket: leather  trousers: denimage: 35eyes : brownbeard: true`)
viper.ReadConfig(bytes.NewBuffer(yamlExample))
viper.Get("name") // 返回 "steve"
```

### 5. Set 调用

```go
viper.Set("Verbose", true)
viper.Set("LogFile", LogFile)
```

### 6. 注册并使用别名

别名可以实现多个key引用单个值。

```go
viper.RegisterAlias("loud", "Verbose")
viper.Set("verbose", true)
viper.Set("loud", true) // 这两句设置的都是同一个值
viper.GetBool("loud")
trueviper.GetBool("verbose") // true
```

### 7. 从环境变量中读取

Viper 完全支持环境变量，这是的应用程序可以开箱即用。
有四个和环境变量有关的方法：

- AutomaticEnv()
- BindEnv(string...) : error
- SetEnvPrefix(string)
- SetEnvKeyReplacer(string...) *strings.Replacer

注意，环境变量时区分大小写的。

Viper提供了一种机制来确保Env变量是唯一的。通过**SetEnvPrefix**，在从环境变量读取时会**添加**设置的**前缀**。BindEnv和AutomaticEnv都会使用到这个前缀。

BindEnv需要一个或两个参数。第一个参数是键名，第二个参数是环境变量的名称。环境变量的名称区分大小写。如果未提供ENV变量名称，则Viper会自动假定该键名称与ENV变量名称匹配，并且ENV变量为全部大写。当您显式提供ENV变量名称时，它不会自动添加前缀。

使用ENV变量时要注意，当关联后，每次访问时都会读取该ENV值。Viper在BindEnv调用时不读取ENV值。

AutomaticEnv与SetEnvPrefix结合将会特别有用。当AutomaticEnv被调用时，任何viper.Get请求都会去获取环境变量。环境变量名为SetEnvPrefix设置的前缀，加上对应名称的大写。

SetEnvKeyReplacer允许你使用一个strings.Replacer对象来将配置名重写为Env名。如果你想在Get()中使用包含-的配置名 ，但希望对应的环境变量名包含_分隔符，就可以使用该方法。使用它的一个例子可以在项目中viper_test.go文件里找到。

```GO
	SetEnvPrefix("spf") // 将会自动转为大写
	BindEnv("id")
	os.Setenv("SPF_ID", "13") // 通常通过系统环境变量来设置
	id := Get("id") // 13
```

### 8. 绑定命令行参数

Viper支持绑定pflags参数。
和BindEnv一样，当绑定方法被调用时，该值没有被获取，而是在被访问时获取。这意味着应该尽早进行绑定，甚至是在init()函数中绑定。

利用BindPFlag()方法可以绑定单个flag。

```GO
	serverCmd.Flags().Int("port", 1138, "Port to run Application server on")
	viper.BindPFlag("port", serverCmd.Flags().Lookup("port"))
```

你也可以绑定已存在的pflag集合 (pflag.FlagSet):

```go
	pflag.Int("flagname", 1234, "help message for flagname")
	pflag.Parse()
	viper.BindPFlags(pflag.CommandLine)
	i := viper.GetInt("flagname") // 通过viper从pflag中获取值
```

使用pflag并不影响其他库使用标准库中的flag。通过导入，pflag可以接管通过标准库的flag定义的参数。这是通过调用pflag包中的AddGoFlagSet()方法实现的。

```go
	package main
	import(
		"flag"
		"github.com/spf13/pflag")

	func main(){ // using standard library "flag" package    
		flag.Int("flagname", 1234, "help message for flagname")
		pflag.CommandLine.AddGoFlagSet(flag.CommandLine)
		pflag.Parse()
		viper.BindPFlags(pflag.CommandLine)
		i := viper.GetInt("flagname") // retrieve value from viper    ...
	}
```



