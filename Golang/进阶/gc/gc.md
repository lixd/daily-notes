# Go GC

## 1. 概述



## 2. 如何检测

### 1. 打开 GC 日志

在程序执行之前加上环境变量 `GODEBUG=gctrace=1`，即可开启日志。

如：

```go 
GODEBUG=gctrace=1 go test -bench="."
GODEBUG=gctrace=1 go run main.go
```



### 2. go tool trace

**普通程序输出 trace 信息**

```go
package main

import (
	"os"
	"runtime/trace"
)

func main() {
	file, err := os.Create("trace.out")
	if err != nil {
		panic(err)
	}
	defer file.Close()
	err = trace.Start(file)
	if err != nil {
		panic(err)
	}
	defer trace.Stop()

	// 	your program here
}

```

**测试程序输出**

```shell
go test -trace trace.out
```



**可视化 trace 信息**

```shell
go tool trace trace.out 
```

大概是这样的

![](go-gc-trace.png)

## 3. 详解

https://godoc.org/runtime

https://zhuanlan.zhihu.com/p/77943973

http://legendtkl.com/2017/04/28/golang-gc/

https://juejin.im/post/5c8525666fb9a049ea39c3e6

https://juejin.im/post/5d56b47a5188250541792ede

