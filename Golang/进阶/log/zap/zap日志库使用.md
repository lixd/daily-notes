# zap高性能日志库

## 1. 概述

zap是uber开源的Go高性能日志库。

github地址

```sh
https://github.com/uber-go/zap
```



## 2. 基本使用

### 1. 安装

```shell
go get -u go.uber.org/zap
```

### 2. 配置Zap Logger

Zap提供了两种类型的日志记录器—`Sugared Logger`和`Logger`。

在性能很好但不是很关键的上下文中，使用`SugaredLogger`。它比其他结构化日志记录包快4-10倍，并且支持结构化和printf风格的日志记录。

在每一微秒和每一次内存分配都很重要的上下文中，使用`Logger`。它甚至比`SugaredLogger`更快，内存分配次数也更少，但它只支持强类型的结构化日志记录。

#### 1. Logger

- 通过调用`zap.NewProduction()`/`zap.NewDevelopment()`或者`zap.Example()`创建一个Logger。
- 上面的每一个函数都将创建一个logger。唯一的区别在于它将记录的信息不同。例如production logger默认记录调用函数信息、日期和时间等。
- 通过Logger调用Info/Error等。
- 默认情况下日志都会打印到应用程序的console界面。





```go
package main

import (
	"go.uber.org/zap"
	"time"
)

func main() {
	simpleLog()
}
// simpleLog 简单使用
func simpleLog(){
	//  格式化输出
	// logger, _ := zap.NewDevelopment()
	//  json序列化输出
	logger, _ := zap.NewProduction()
	defer logger.Sync()
	logger.Info("无法获取网址",
		zap.String("url", "http://www.baidu.com"),
		zap.Int("attempt", 3),
		zap.Duration("backoff", time.Second),
	)
}
```

在上面的代码中，我们首先创建了一个Logger，然后使用Info/ Error等Logger方法记录消息。

日志记录器方法的语法是这样的：

```go
func (log *Logger) MethodXXX(msg string, fields ...Field) 
```

其中`MethodXXX`是一个可变参数函数，可以是Info / Error/ Debug / Panic等。每个方法都接受一个消息字符串和任意数量的`zapcore.Field`场参数。

每个`zapcore.Field`其实就是一组键值对参数。



#### 2. Sugared Logger

现在让我们使用Sugared Logger来实现相同的功能。

- 大部分的实现基本都相同。
- 惟一的区别是，我们通过调用主logger的`. Sugar()`方法来获取一个`SugaredLogger`。
- 然后使用`SugaredLogger`以`printf`格式记录语句

### 3. 定制logger

将日志写入文件而不是终端

我们要做的第一个更改是把日志写入文件，而不是打印到应用程序控制台。

 我们将使用`zap.New(…)`方法来手动传递所有配置，而不是使用像`zap.NewProduction()`这样的预置方法来创建logger。 

```go
func New(core zapcore.Core, options ...Option) *Logger
```

 `zapcore.Core`需要三个配置——`Encoder`，`WriteSyncer`，`LogLevel`。 

```go
// NewCore creates a Core that writes logs to a WriteSyncer.
func NewCore(enc Encoder, ws WriteSyncer, enab LevelEnabler) Core {
	return &ioCore{
		LevelEnabler: enab,
		enc:          enc,
		out:          ws,
	}
}
```

 1.**Encoder**:编码器(如何写入日志)。我们将使用开箱即用的`NewJSONEncoder()`，并使用预先设置的`ProductionEncoderConfig()`。 

```go
 zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig())
```

2.**WriterSyncer** ：指定日志将写到哪里去。我们使用`zapcore.AddSync()`函数并且将打开的文件句柄传进去。

```go
   file, _ := os.Create("./test.log")
   writeSyncer := zapcore.AddSync(file)
```

3.**Log Level**：哪种级别的日志将被写入。

我们将修改上述部分中的Logger代码，并重写`InitLogger()`方法。其余方法—`main()` /`SimpleHttpGet()`保持不变。

```go
package main

import (
	"fmt"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"net/http"
	"os"
)

var customLogger *zap.SugaredLogger

// LogPath 日志文件路径
const LogPath = "./log/zap/logs/info.log"

func main() {
	InitLogger()
	defer customLogger.Sync()
	simpleHttpGet("www.google.com")
	simpleHttpGet("http://www.google.com")
}

func InitLogger() {
	writeSyncer := getLogWriter(LogPath)
	encoder := getEncoder()
	core := zapcore.NewCore(encoder, writeSyncer, zapcore.DebugLevel)

	logger := zap.New(core)
	customLogger = logger.Sugar()
}
func getEncoder() zapcore.Encoder {
	return zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig())
}

// getLogWriter 创建一个WriterSyncer path 文件路径
func getLogWriter(path string) zapcore.WriteSyncer {
	file, err := os.Create(path)
	if err != nil {
		panic(fmt.Sprintf("log init getLogWriter error: %v", err))
	}
	return zapcore.AddSync(file)
}
func simpleHttpGet(url string) {
	resp, err := http.Get(url)
	if err != nil {
		customLogger.Error(
			"Error fetching url..",
			zap.String("url", url),
			zap.Error(err))
	} else {
		customLogger.Info("Success..",
			zap.String("statusCode", resp.Status),
			zap.String("url", url))
		resp.Body.Close()
	}
}

```

当使用这些修改过的logger配置调用上述部分的`main()`函数时，以下输出将打印在文件`info.log`中。

```json
{"level":"error","ts":1584081834.0902812,"msg":"Error fetching url..{url 15 0 www.google.com <nil>} {error 25 0  Get www.google.com: unsupported protocol scheme \"\"}"}
{"level":"error","ts":1584081855.4093273,"msg":"Error fetching url..{url 15 0 http://www.google.com <nil>} {error 25 0  Get http://www.google.com: dial tcp [2400:cb00:2048:1::6814:224e]:80: connectex: A connection attempt failed because the connected party did not properly respond after a period of time, or established connection failed because connected host has failed to respond.}"}
```



鉴于我们对配置所做的更改，有下面两个问题：

- 时间是以非人类可读的方式展示，例如`1584081834.0902812`
- 调用方函数的详细信息没有显示在日志中

```go
func getEncoder() zapcore.Encoder {
	encoderConfig := zap.NewProductionEncoderConfig()
	encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	encoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder
	return zapcore.NewJSONEncoder(encoderConfig)
}
```



## 3. 分等级打印

根据日志等级将info、error分别输出到不同文件。这也是一个比较常见的需求。

zap中实现也比较简单。

1.实现判断日志等级的interface` zap.LevelEnablerFunc`

2.根据不同日志文件路径创建不同等级的`writer`

3.在创建`zapcore.Core`时分别传入对应的`writer`和`level`

```go
func InitLogger() {
	// 实现两个判断日志等级的interface
	// 如果每个级别的日志都需要分开输出的话 这里再加几个即可
	infoLevel := zap.LevelEnablerFunc(func(lvl zapcore.Level) bool {
		// info中只打印 info 和warn
		return lvl <= zapcore.WarnLevel
	})

	errorLevel := zap.LevelEnablerFunc(func(lvl zapcore.Level) bool {
		// error及其以上的都打印在error中
		return lvl >= zapcore.ErrorLevel
	})
	// 获取 info、error日志文件的io.Writer
	infoWriter := getWriter(LogPathInfo)
	errorWriter := getWriter(LogPathError)
	encoder := getEncoder()
	// 最后创建具体的Logger
	core := zapcore.NewTee(
		// 分别指定writer和level
		zapcore.NewCore(encoder, zapcore.AddSync(infoWriter), infoLevel),
		zapcore.NewCore(encoder, zapcore.AddSync(errorWriter), errorLevel),
	)
	// 传入 zap.AddCaller()显示打日志点的文件名和行数
	logger := zap.New(core, zap.AddCaller())
	customLogger = logger.Sugar()
}
```



## 4. 日志切割归档

### 1. 按大小切割(Lumberjack)

这个日志程序中唯一缺少的就是日志切割归档功能。  为了添加日志切割归档功能，我们将使用第三方库[Lumberjack](https://github.com/natefinch/lumberjack)来实现。 

要在zap中加入Lumberjack支持，我们需要修改`WriteSyncer`代码。我们将按照下面的代码修改`getLogWriter()`函数：

```go
// getLogWriter 创建一个WriterSyncer
// path 文件路径
func getLogWriter(path string) zapcore.WriteSyncer {
	// 带有日志切割功能
	lumberJackLogger := &lumberjack.Logger{
		Filename:   path,  // 日志文件的位置
		MaxSize:    10,    // 在进行切割之前，日志文件的最大大小（以MB为单位）
		MaxBackups: 5,     // 保留旧文件的最大个数
		MaxAge:     30,    // 保留旧文件的最大天数
		Compress:   false, // 是否压缩/归档旧文件
	}
	return zapcore.AddSync(lumberJackLogger)
}
```

### 2. 按时间切割(file-rotatelogs)

Lumberjack只能按照文件大小进行切割，但是一般是按照时间进行切割是最好的，比较这样比较容易查找某个时间段的日志。

同样也是只需要修改`getLogWriter`方法即可。

可以指定切割后文件的名字，切割时间间隔 最大保存时间等。

```go
// getWriter 传入日志文件存储地址 返回一个writer
func getLogWriter(logPath string) io.Writer {
	// 生成rotatelogs的Writer
	// 拼接日志文件格式 e.g.:error-2020031316.log
	fullLogPath := strings.Replace(logPath, ".log", "", -1) + "-%Y%m%d%H.log"
	writer, err := rotatelogs.New(
		fullLogPath,
		// rotatelogs.WithLinkName(filename), // 生成软链,指向最新日志文件
		// WithMaxAge和WithRotationCount 只能同时指定一个 否则会panic
		rotatelogs.WithMaxAge(time.Hour*24*7), // 日志最大保存时间
		// rotatelogs.WithRotationCount(10),       // 日志文件最大保存数
		rotatelogs.WithRotationTime(time.Hour), // 日志切割时间间隔
	)

	if err != nil {
		panic(err)
	}
	return writer
}
```



## 4. 完整代码

将不同等级的日志分别打印到不同的文件，同时按照时间对日志文件进行切割。

github

## 5. 参考

` https://www.liwenzhou.com/posts/Go/zap/ `

` https://www.jianshu.com/p/d729c7ec9c85 `