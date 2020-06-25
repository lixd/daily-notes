# Golang 交叉编译

## 交叉编译

交叉编译即在当前平台编译出其他平台可执行文件，即在`windows`平台直接编译出`linux`平台可执行文件,Golang具有跨平台编译特性，省去了各个平台装编译环境的麻烦，设置起来也相当简单。

交叉编译主要是两个编译环境参数 $GOOS 和 $GOARCH 的设定。$GOOS代表编译的目标系统，$GOARCH代表编译的处理器体系结构。 

> GOOS：目标平台的[操作系统](https://link.jianshu.com?t=http://lib.csdn.net/base/operatingsystem)（darwin、freebsd、linux、windows） 
>
> GOARCH：目标平台的体系[架构](https://link.jianshu.com?t=http://lib.csdn.net/base/architecture)（386、amd64、arm） 
>
> 交叉编译不支持 CGO 所以要禁用它`CGO_ENABLED=0`

在编译的时候我们可以根据实际需要对这两个参数进行组合。

Mac 下编译 [Linux](https://link.jianshu.com?t=http://lib.csdn.net/base/linux) 和 Windows 64位可执行程序

```go
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build 
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build 
```

[linux](https://link.jianshu.com?t=http://lib.csdn.net/base/linux) 下编译 Mac 和 Windows 64位可执行程序

```go
CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build 
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build 
```

Windows 下编译 Mac 和 Linux 64位可执行程序

```go
//先设置编译环境
SET CGO_ENABLED=0
SET GOOS=darwin
SET GOARCH=amd64 
//再编译
go build main.go

SET CGO_ENABLED=0
SET GOOS=linux
SET GOARCH=amd64 
go build main.go
```



```go
https://github.com/golang/go/blob/master/src/go/build/syslist.go#L8:31
package build
const goosList = "android darwin dragonfly freebsd js linux nacl netbsd openbsd plan9 solaris windows zos "
const goarchList = "386 amd64 amd64p32 arm armbe arm64 arm64be ppc64 ppc64le mips mipsle mips64 mips64le mips64p32 mips64p32le
```

## 选择性编译

虽然golang 可以跨平台编译，但却无法解决系统的差异性。总在一些时候我们会直接调用操作系统函数。相同功能编写类似`xxx_windows.go`, `xxx.Linux.go`文件，根据操作系统编译对应源文件。而不是在文件中用if else规划执行路径。 要实现选择性编译需要在文件顶部增加构建标记。

```go
// +build
```

此标记必须出现在**文件顶部**，仅由空行或其他注释行开头。也就是**必须在Package 语句前**。

此标记后接约束参数，格式为 `// +build A,B !C,D `,**逗号`,`为且，空格为或，`!` 为非**。

代表编译此文件需符合 (A且B) 或 ((非C)且D) 。

A和C的可选参数可参见本文上面的 $GOOS参数

B和D的可选参数可参见$GOARCH 

比如

```go
// +build !windows,386
//此文件在非windows操作系统 且386处理器时编译
```



## 遇到的问题

### 交叉编译出错

windows下go编译成linux可执行文件报错：

```go
cmd/go: unsupported GOOS/GOARCH pair linux /amd64
```

操作步骤如下

```go
SET CGO_ENABLED=0
SET GOOS=linux
SET GOARCH=amd64 
go build main.go
```

最后在`https://github.com/golang/go/issues/24501#issuecomment-375682124`找到了原因。

是因为在 `SET GOOS=linux`这句后面多了个空格（直接复制的命令。。。）
编译器也没有自动去掉多余的空格，不容易发现错误原因。

