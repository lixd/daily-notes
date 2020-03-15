# logrus

## 1. 概述

`golang`标准库的日志框架非常简单,仅仅提供了`print`,`panic`和`fatal`三个函数对于更精细的日志级别、日志文件分割以及日志分发等方面并没有提供支持. 所以催生了很多第三方的日志库,但是在golang的世界里,没有一个日志库像slf4j那样在Java中具有绝对统治地位.golang中,流行的日志框架包括logrus、zap、zerolog、seelog等.

**`logrus`是目前Github上star数量最多的日志库,目前(2018.12,下同)star数量为8119,fork数为1031.** **`logrus`功能强大,性能高效,而且具有高度灵活性,提供了自定义插件的功能.很多开源项目,如`docker`,`prometheus`等,都是用了logrus来记录其日志.**

go中用得比较多的日志库应该就是logrus和zap了。

## 2. logrus特性

完全兼容golang标准库日志模块：logrus拥有六种日志级别：`debug``info``warn``error``fatal``panic`

- `logrus.Debug("Useful debugging information.")`
- `logrus.Info("Something noteworthy happened!")`
- `logrus.Warn("You should probably take a look at this.")`
- `logrus.Error("Something failed but I'm not quitting.")`
- `logrus.Fatal("Bye.")` //log之后会调用os.Exit(1)
- `logrus.Panic("I'm bailing.")` //log之后会panic()

- 可扩展的Hook机制：允许使用者通过hook的方式将日志分发到任意地方,如本地文件系统、标准输出、`logstash`、`elasticsearch`或者`mq`等,或者通过hook定义日志内容和格式等.
- 可选的日志输出格式：logrus内置了两种日志格式,`JSONFormatter`和`TextFormatter`,如果这两个格式不满足需求,可以自己动手实现接口Formatter,来定义自己的日志格式.
- `Field`机制：`logrus`鼓励通过Field机制进行精细化的、结构化的日志记录,而不是通过冗长的消息来记录日志.
- `logrus`是一个可插拔的、结构化的日志框架
- `Entry`: 会自动返回一个 里面的有些变量会被自动加上
  - `time:entry`被创建时的时间戳
  - msg:在调用`.Info()`等方法时被添加
  - level

## 3. 基本使用

```go
package main

import (
	log "github.com/sirupsen/logrus"
)

func main() {
	log.WithFields(log.Fields{
		"animal": "walrus",
	}).Info("A walrus appears")
}
```

输入日志如下

```sh
time="2020-03-13T18:16:51+08:00" level=info msg="A walrus appears" animal=walrus
```

 `logrus`与golang标准库日志模块完全兼容,因此您可以使用`log“github.com/sirupsen/logrus”`替换所有日志导入. `logrus`可以通过简单的配置,来定义输出、格式或者日志级别等. 

```go
package main

import (
	"github.com/sirupsen/logrus"
	"os"
)

func init() {
	// 设置日志格式为json格式
	logrus.SetFormatter(&logrus.JSONFormatter{})

	// 设置将日志输出到标准输出（默认的输出为stderr,标准错误）
	// 日志消息输出可以是任意的io.writer类型
	logrus.SetOutput(os.Stdout)

	// 设置日志级别为warn以上
	logrus.SetLevel(logrus.WarnLevel)
}

func main() {
	logrus.WithFields(logrus.Fields{
		"animal": "walrus",
		"size":   10,
	}).Info("A group of walrus emerges from the ocean")

	logrus.WithFields(logrus.Fields{
		"omg":    true,
		"number": 122,
	}).Warn("The group's number increased tremendously!")

	logrus.WithFields(logrus.Fields{
		"omg":    true,
		"number": 100,
	}).Fatal("The ice breaks!")
}

```

## 4. Fields用法

`logrus`不推荐使用冗长的消息来记录运行信息,它推荐使用`Fields`来进行精细化的、结构化的信息记录. 例如下面的记录日志的方式：

```sh
log.Fatalf("Failed to send event %s to topic %s with key %d", event, topic, key)
```

在`logrus`中不太提倡,`logrus`鼓励使用以下方式替代之：

```go
log.WithFields(log.Fields{
  "event": event,
  "topic": topic,
  "key": key,
}).Fatal("Failed to send event")
```

前面的WithFields API可以规范使用者按照其提倡的方式记录日志.但是WithFields依然是可选的,因为某些场景下,使用者确实只需要记录仪一条简单的消息.

通常,在一个应用中、或者应用的一部分中,都有一些固定的Field.比如在处理用户http请求时,上下文中,所有的日志都会有`request_id`和`user_ip`.为了避免每次记录日志都要重复写

```go
logrus.WithFields(log.Fields{“request_id”: request_id, “user_ip”: user_ip})
```

我们可以创建一个`logrus.Entry`实例,为这个实例设置默认Fields,在上下文中使用这个logrus.Entry实例记录日志即可.

```go
requestLogger := logrus.WithFields(log.Fields{"request_id": request_id, "user_ip": user_ip})
requestLogger.Info("something happened on that request") # will log request_id and user_ip
requestLogger.Warn("something not great happened")
```

## 5. Hook

logrus最令人心动的功能就是其可扩展的HOOK机制了,通过在初始化时为logrus添加hook,logrus可以实现各种扩展功能.

logrus的hook接口定义如下,其原理是每此写入日志时拦截,修改logrus.Entry.

```go
// logrus在记录Levels()返回的日志级别的消息时会触发HOOK,
// 按照Fire方法定义的内容修改logrus.Entry.
type Hook interface {
    Levels() []Level
    Fire(*Entry) error
}
```

一个简单自定义hook如下,DefaultFieldHook定义会在所有级别的日志消息中加入默认字段appName=”myAppName”.

```go
type DefaultFieldHook struct {
}

func (hook *DefaultFieldHook) Fire(entry *log.Entry) error {
    entry.Data["appName"] = "MyAppName"
    return nil
}

func (hook *DefaultFieldHook) Levels() []log.Level {
    return log.AllLevels
}

func main() {
	// 添加hook
	logrus.AddHook(new(DefaultFieldHook))
	// 会打印出DefaultFieldHook中添加的field  appName=MyAppName
	logrus.Info("") // time="2020-03-13T18:42:08+08:00" level=info appName=MyAppName
}
```

`hook`的使用也很简单,在初始化前调用`log.AddHook(hook)`添加相应的`hook`即可.

`logrus`官方仅仅内置了`syslog`的`hook`. 此外,但Github也有很多第三方的`hook`可供使用,文末将提供一些第三方`HOOK`的连接.

## 6. 日志切割归档

 logrus本身不带日志本地文件分割功能,但是我们可以通过`file-rotatelogs`进行日志本地文件分割。

这里就直接使用第三方hook。

```go
package cutfile

import (
	rotatelogs "github.com/lestrrat-go/file-rotatelogs"
	"github.com/pkg/errors"
	"github.com/rifflock/lfshook"
	"github.com/sirupsen/logrus"
	"time"
)

func NewLfsHook(logPath string, maxAge time.Duration, rotationTime time.Duration) logrus.Hook {
	// 不同等级日志分别配置切割参数
	infoWriter, err := rotatelogs.New(
		logPath+"/info_%Y-%m-%d.log",
		rotatelogs.WithMaxAge(maxAge),             // 文件最大保存时间
		rotatelogs.WithRotationTime(rotationTime), // 日志切割时间间隔
	)
	errWriter, err := rotatelogs.New(
		logPath+"/error_%Y-%m-%d.log",
		rotatelogs.WithMaxAge(maxAge),             // 文件最大保存时间
		rotatelogs.WithRotationTime(rotationTime), // 日志切割时间间隔
	)
	if err != nil {
		logrus.Errorf("config local file system logger error. %+v", errors.WithStack(err))
	}
	// 将不同等级日志写入不同的文件
	lfsHook := lfshook.NewHook(lfshook.WriterMap{
		logrus.DebugLevel: infoWriter,
		logrus.InfoLevel:  infoWriter,
		logrus.WarnLevel:  infoWriter,
		logrus.ErrorLevel: errWriter,
		logrus.FatalLevel: errWriter,
		logrus.PanicLevel: errWriter,
	}, &logrus.TextFormatter{})

	return lfsHook
}

```

使用时只需添加这个hook即可

```go
package cutfile

import (
	"github.com/sirupsen/logrus"
	"time"
)

const (
	// 日志存储位置
	LogPath = "./log/zap/logs"
	// 日志文件最大保存时间
	MaxAge = time.Hour * 24 * 90
	// 日志切割时间间隔
	RotationTime = time.Hour
)

func main() {
	hook := NewLfsHook(LogPath, MaxAge, RotationTime)
	// 添加hook
	logrus.AddHook(hook)
	// 会打印出DefaultFieldHook中添加的field  appName=MyAppName
	logrus.Info("") // time="2020-03-13T18:42:08+08:00" level=info appName=MyAppName
}

```

## 7. 参考

` https://mojotv.cn/2018/12/27/golang-logrus-tutorial#zmpun `

