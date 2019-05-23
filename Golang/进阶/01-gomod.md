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
```

在`gopath`外新建一个项目，单独开一个`cmd`设置`set GO111MODULE=on`(习惯性的和git初始化一样),然后初始化`go mod init <项目模块名称>（module名称可与文件名不同）`

> go: creating new go.mod: module xxxx

在项目目录下执行`go mod tidy`

>  下载完成后项目路径下会生成`go.mod`和`go.sum`
>
> **go.mod文件必须要提交到git仓库**，但go.sum文件可以不用提交到git仓库(git忽略文件.gitignore中设置一下)。

go模块版本控制的下载文件及信息会存储到`GOPATH的pkg/mod文件夹`里。