# go语言http标准库

## 1. HelloWord

```go
package main

import (
	"io"
	"log"
	"net/http"
)

func HelloServer(w http.ResponseWriter, r *http.Request) {
	_, err := io.WriteString(w, "Hello,World \n")
	if err != nil {
		log.Println(err)
	}
}

func main() {
	http.HandleFunc("/hello", HelloServer)
	err := http.ListenAndServe(":50051", nil)
	if err != nil {
		log.Fatal(err)
	}
}

```

## 2.httpClient

* 1.使用http客户端发送请求
* 2.使用http.Client控制请求头
* 3.使用httputil简化工作

## 3. http_pprof

* 1.`import _ "net/http/pprof"`

* 2.访问`/debug/pprof`
* 3.使用`go tool pprof`分析性能



使用`pprof`来检测http服务器性能,只需要导入`pprof`包即可。

```go
import (
	_ "net/http/pprof"
)
```

```go
package main

import (
	"io"
	"log"
	"net/http"
	_ "net/http/pprof"
)

func HelloServerPprof(w http.ResponseWriter, r *http.Request) {
	_, err := io.WriteString(w, "Hello,World \n")
	if err != nil {
		log.Println(err)
	}
}

func main() {
	http.HandleFunc("/hello", HelloServerPprof)
	err := http.ListenAndServe(":50051", nil)
	if err != nil {
		log.Fatal(err)
	}
}

```

访问`localhost:50051/hello`会显示出`Hello,World`。

### pprof界面

访问`http://localhost:50051/debug/pprof/`即可进入pprof界面

### profile

命令行输入以下命令即可查看profile

```go
go tool pprof http://localhost:50051/debug/pprof/profile
```

会显示最近30秒的性能分析

```go
D:\lillusory\MyProjects\i-go\base\mid>go tool pprof http://localhost:50051/debug/pprof/profile
Fetching profile over HTTP from http://localhost:50051/debug/pprof/profile
Saved profile in C:\Users\13452\pprof\pprof.samples.cpu.001.pb.gz
Type: cpu
Time: Jul 24, 2019 at 10:23pm (CST)
Duration: 30.04s, Total samples = 10ms (0.033%)
Entering interactive mode (type "help" for commands, "o" for options)
// 获取到之后输入web 浏览器弹出性能可视化 模块越大代表性能消耗越大 注意web弹出页面文件后缀为.svg
(pprof) web

```

如果出现以下错误的话，需要安装`Graphviz`,下载地址`https://graphviz.gitlab.io/_pages/Download/Download_windows.html`，安装后将`bin`目录路径配置到`path`变量下。

```go
Failed to execute dot. Is Graphviz installed? Error: exec: "dot": executable file not found in %PATH%
```

如果安装了还是不行的话，可以试一下在cmd命令行执行，而不是goland中执行。

## 4. 其他标准库

```go
1.godoc -http:8888
//访问localhost:8888即可查看所有文档
2.https://studygolang.com/pkgdoc
```

