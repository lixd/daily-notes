# gomock包基本使用

## 0.常用方式

一般会将 mockgen 命令用 go:generate 方式调用

```go
//go:generate mockgen --build_flags=--mod=mod -package mock -destination  mock.go sigs.kubeclipper.io/openshift_origin/cpcs-scheduler/internal/pkg/adaptor/metrics Metrics
```

- **-package=mock**：将生成的mock代码放置到**mock**包中。
- **-destination=mock.go**：将自动生成的mock代码存储到文件**mock_doer.go**中。
- **sigs.kubeclipper.io/openshift_origin/cpcs-scheduler/internal/pkg/adaptor/metrics**：为这个包生成mock代码。
- **Metrics**：为这个接口生成mock代码。这个参数是个必填参数，我们需要显式地指定要生成mock代码的接口。如果需要指定多个接口，可以将接口通过逗号连接起来，比如：**Metrics1,Metrics2**。



## 1. 概述 

Gomock 是 Go 语言的一个 mock 框架，官方的那种。

在实际项目中，需要进行单元测试的时候。却往往发现有一大堆依赖项。这时候就是 [Gomock](https://github.com/golang/mock) 大显身手的时候了



## 2. 安装

```sh
$ go get -u github.com/golang/mock/gomock
$ go install github.com/golang/mock/mockgen
```

第一步：我们将安装 gomock 第三方库和 mock 代码的生成工具 mockgen。而后者可以大大的节省我们的工作量。只需要了解其使用方式就可以

第二步：输入 `mockgen` 验证代码生成工具是否安装正确。若无法正常响应，请检查 `bin` 目录下是否包含该二进制文件

## 3. 用法

在 `mockgen` 命令中，支持两种生成模式：

1. source：从源文件生成 mock 接口（通过 -source 启用）

```
mockgen -source=foo.go [other options]
```

1. reflect：通过使用反射程序来生成 mock 接口。它通过传递两个非标志参数来启用：导入路径和逗号分隔的接口列表

```
mockgen database/sql/driver Conn,Driver
```

从本质上来讲，两种方式生成的 mock 代码并没有什么区别。因此选择合适的就可以了

## 4. 具体使用

### 1.步骤

* 想清楚整体逻辑

* 定义想要（模拟）依赖项的 interface（接口）

* 使用 `mockgen` 命令对所需 mock 的 interface 生成 mock 文件

* 编写单元测试的逻辑，在测试中使用 mock

* 进行单元测试的验证



### 2. 具体代码

必须要以接口形式的方法才能生存mock文件。

比如这里想测一下login。

```go
package person

type IUserControl interface {
	Login(username, password string) error
}

```



```go
package person

type userControl struct {
	IUC IUserControl
}

func NewUserControl(p IUserControl) *userControl {
	return &userControl{IUC: p}
}

func (uc *userControl) Login(username, password string) error {
	return uc.IUC.Login(username, password)
}

```

生成mock文件

```sh
$ >mockgen -source=i_user_control.go -destination=./user_control_mock.go -package=person
```

> -source 源文件
>
> -destination 设置 mock 文件输出的地方，若不设置则打印到标准输出中
>
> -package 设置 mock 文件的包名，若不设置则为 `mock_` 前缀加上文件名

测试用例

```go
package person

import (
	"github.com/golang/mock/gomock"
	"testing"
)

func TestUserControl_Login(t *testing.T) {
	ctl := gomock.NewController(t)
	defer ctl.Finish()
	var (
		username = "admin"
		password = "root"
	)

	mockUC := NewMockIUserControl(ctl)
	gomock.InOrder(
		mockUC.EXPECT().Login(username,password).Return(nil),
	)
	control := NewUserControl(mockUC)
	err := control.Login(username, password)
	if err != nil {
		t.Errorf("user.GetUserInfo err: %v", err)
	}
}

```

gomock.NewController：返回 `gomock.Controller`，它代表 mock 生态系统中的顶级控件。定义了 mock 对象的范围、生命周期和期待值。另外它在多个 goroutine 中是安全的

mock.NewMockMale：创建一个新的 mock 实例

gomock.InOrder：声明给定的调用应按顺序进行（是对 gomock.After 的二次封装）

mockMale.EXPECT().Get(id).Return(nil)：这里有三个步骤，`EXPECT()`返回一个允许调用者设置**期望**和**返回值**的对象。`Get(id)` 是设置入参并调用 mock 实例中的方法。`Return(nil)` 是设置先前调用的方法出参。简单来说，就是设置入参并调用，最后设置返回值

NewUser(mockMale)：创建 User 实例，值得注意的是，在这里**注入了 mock 对象**，因此实际在随后的 `user.GetUserInfo(id)` 调用（入参：id 为 1）中。它调用的是我们事先模拟好的 mock 方法

ctl.Finish()：进行 mock 用例的期望值断言，一般会使用 `defer` 延迟执行，以防止我们忘记这一操作



### 3. 测试

```go
go test
// 可通过设置 `-cover` 标志符来开启覆盖率的统计
go test -cover
// 可视化
// 1.生成测试覆盖率的 profile 文件
go test  -coverprofile=cover.out
// 2.利用 profile 文件生成可视化界面
go tool cover -html=cover.out
```





## 5. 更多

### 1. 常用 mock 方法

调用方法

- Call.Do()：声明在匹配时要运行的操作
- Call.DoAndReturn()：声明在匹配调用时要运行的操作，并且模拟返回该函数的返回值
- Call.MaxTimes()：设置最大的调用次数为 n 次
- Call.MinTimes()：设置最小的调用次数为 n 次
- Call.AnyTimes()：允许调用次数为 0 次或更多次
- Call.Times()：设置调用次数为 n 次

参数匹配

- gomock.Any()：匹配任意值
- gomock.Eq()：通过反射匹配到指定的类型值，而不需要手动设置
- gomock.Nil()：返回 nil

### 2. 生成多个 mock 文件

官方提供了批量生成方法

```sh
go generate [-run regexp] [-n] [-v] [-x] [build flags] [file.go... | packages]
```

只需要简答修改interface文件即可

```go
package person

//go:generate mockgen -destination=./user_control_mock.go -package=person . IUserControl

type IUserControl interface {
	Login(username, password string) error
}

```



我们关注到 `go:generate` 这条语句，可分为以下部分：

1. 声明 `//go:generate` （注意不要留空格）
2. 使用 `mockgen` 命令
3. 定义 `-destination`
4. 定义 `-package`
5. 定义 `source`，此处为 person 的包路径 当前路径所以填的`.`
6. 定义 `interfaces`，此处为 `IUserControl`



原文`https://eddycjy.gitbook.io/golang/di-1-ke-za-tan/gomock`

