# gomod

## 概述

下载官方包1.11(及其以上版本将会自动支持`gomod`) 默认`GO111MODULE=auto`(`auto`是指如果在`gopath`下不启用`mod`)

引入`Go Module`后，环境变量`GOPATH`还是存在的。开启`Go Module`功能开关后，环境变量`GOPATH`的作用也发生了改变。

> - 环境变量`GOPATH`不再用于解析`imports`包路径，即原有的`GOPATH/src/`下的包，通过`import`是找不到了。
> - `Go Module`功能开启后，下载的包将存放与`$GOPATH/pkg/mod`路径
> - `$GOPATH/bin`路径的功能依旧保持。

```go
go mod help查看帮助
go mod init<项目模块名称>初始化模块，会在项目根目录下生成 go.mod文件。

go mod tidy根据go.mod文件来处理依赖关系。

go mod vendor将依赖包复制到项目下的 vendor目录。建议一些使用了被墙包的话可以这么处理，方便用户快速使用命令go build -mod=vendor编译

go list -m all显示依赖关系。go list -m -json all显示详细依赖关系。

go mod download `<path@version>`下载依赖。参数`<path@version>`是非必写的，path是包的路径，version是包的版本。
go mod why 解释为什么需要依赖
go mod verify 验证依赖是否正确
go mod
```

golang 提供了 `go mod`命令来管理包。

go mod 有以下命令：

| 命令     | 说明                                                         |
| -------- | ------------------------------------------------------------ |
| download | download modules to local cache(下载依赖包)                  |
| edit     | edit go.mod from tools or scripts（编辑go.mod)               |
| graph    | print module requirement graph (打印模块依赖图)              |
| init     | initialize new module in current directory（在当前目录初始化mod） |
| tidy     | add missing and remove unused modules(拉取缺少的模块，移除不用的模块) |
| vendor   | make vendored copy of dependencies(将依赖复制到vendor下)     |
| verify   | verify dependencies have expected content (验证依赖是否正确） |
| why      | explain why packages or modules are needed(解释为什么需要依赖) |

## 初始化

1.go版本1.11及其以上。

2.在`gopath`外新建一个项目

3.执行以下命令 初始化

```sh
# 打开Go Module
set GO111MODULE=on
#在当前目录初始化mod
go mod init <项目模块名称>（module名称可与文件名不同）
#go: creating new go.mod: module xxxx
#处理依赖关系
go mod tidy
```





## 重建 go.mod

先移除 go.mod 中的所有内容，只保留 module 和 go 版本号即可。

```go
module xxx

go 1.17
```



然可以通过 `go get ./...`让它查找依赖，并记录在`go.mod`文件中



## FAQ

**是否需要提交 `go.sum`  文件?**

官方推荐提交。

[官方wiki-should-i-commit-my-gosum-file-as-well-as-my-gomod-file](https://github.com/golang/go/wiki/Modules#should-i-commit-my-gosum-file-as-well-as-my-gomod-file)





> [超详细解读 Go Modules 应用](https://iswbm.com/273.html)