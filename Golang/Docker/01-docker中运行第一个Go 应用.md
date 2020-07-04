# 在 Docker 中运行 Go 应用

## 1. 概述

首先是一个简单的 http 服务，

然后编写 Dockerfile build 出相应镜像

最后运行编译后的镜像。

> 需要准备 golang 环境 和 Docker 环境。

## 2. 创建项目

### 1. 初始化

创建文件夹并初始化 gomod

```shell
mkdir hello
cd hello
set GO111MODULE=on
go mod init hello
```

### 2. hello.go

```go
package main

import (
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/", hello)
	server := &http.Server{
		Addr: ":8080",
	}
	fmt.Println("server startup...")
	if err := server.ListenAndServe(); err != nil {
		fmt.Printf("server startup failed, err:%v\n", err)
	}
}

func hello(w http.ResponseWriter, _ *http.Request) {
	w.Write([]byte("hello dockerfile ! \n"))
}
```

### 3. Dockerfile

```dockerfile
# 源镜像
FROM golang:latest
# 作者
MAINTAINER Razil "xueduanli@163.com"

# 为我们的镜像设置必要的环境变量
ENV GO111MODULE=on \
    CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64

# 设置工作目录
WORKDIR $GOPATH/src/hello
# 将 go 工程代码加入到 docker 容器中
ADD . $GOPATH/src/hello

# 将我们的代码编译成二进制可执行文件 hello
RUN go build -o hello .

# 暴露端口
EXPOSE 8080
# 最终运行docker的命令
ENTRYPOINT  ["./hello"]
```

### 4. 具体目录

具体目录如下

```shell
/hello
	--Dockerfile
	--go.mod
	--hello.go
```

hello 目录下只有这三个文件。



## 3. 构建镜像并运行

### 1. 构建镜像

```shell
# hello 打包之后的镜像名称
# 需要在 Dockerfile 文件所在目录执行该命令
# 即 这里的 hello 目录
docker build . -t hello
```



具体构建过程如下:

```shell
lixd@17x:~/17x/projects/hello$ docker build . -t hello
Sending build context to Docker daemon  4.608kB
Step 1/8 : FROM golang:latest
 ---> 00d970a31ef2
Step 2/8 : MAINTAINER Razil "xueduanli@163.com"
 ---> Running in c86de1d6232c
Removing intermediate container c86de1d6232c
 ---> c6503b0710d3
Step 3/8 : ENV GO111MODULE=on     CGO_ENABLED=0     GOOS=linux     GOARCH=amd64
 ---> Running in 977e48dc3ff5
Removing intermediate container 977e48dc3ff5
 ---> 01d0297584d0
Step 4/8 : WORKDIR $GOPATH/src/hello
 ---> Running in 0d5c3a1c4370
Removing intermediate container 0d5c3a1c4370
 ---> 48265b1e2551
Step 5/8 : ADD . $GOPATH/src/hello
 ---> 9b17f2fcad07
Step 6/8 : RUN go build -o hello .
 ---> Running in f3bb96173f49
Removing intermediate container f3bb96173f49
 ---> 6e5a1f527ab5
Step 7/8 : EXPOSE 8080
 ---> Running in 87e2a2cec7c8
Removing intermediate container 87e2a2cec7c8
 ---> a4959300a02f
Step 8/8 : ENTRYPOINT  ["./hello"]
 ---> Running in 02968f0c05a7
Removing intermediate container 02968f0c05a7
 ---> 5ea43ad2f18f
# 构建成功 
Successfully built 5ea43ad2f18f
Successfully tagged hello:latest

```

查看镜像列表

```shell
lixd@17x:~/17x/projects/hello$ docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
hello               latest              5ea43ad2f18f        7 seconds ago       826MB
golang              latest              00d970a31ef2        10 days ago         810MB
```



### 2. 运行容器

```shell
# 映射 8080 端口
docker run -p 8080:8080 hello
```

运行成功后应该会打印出如下消息:

```shell
lixd@17x:~/17x/projects/gocker$ docker run -p 8080:8080 hello
server startup...
```

查看容器列表

```shell
lixd@17x:~/17x/projects/gocker$ docker ps
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS                    NAMES
aa8956adadc6        hello               "./hello"           42 seconds ago      Up 41 seconds       0.0.0.0:8080->8080/tcp   loving_galois

```

确实运行起来了。

### 3. 测试

最后测试一下看到底能不能访问呢

```shell
lixd@17x:~/17x/projects/gocker$ curl localhost:8080
hello dockerfile ! 
```

ok！



## 4. 小结

到此为止已经成功编写 Dockerfile 并构建镜像，最后也成功跑起来了。

但是还有很多问题需要处理。

比如这只是一个最最最基本的应用，打包出来的镜像居然有 800M 就很不科学了。

