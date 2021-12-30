# Go相关工具

##  1. 概述

优雅听起来是一个非常感性、难以量化的结果，然而这却是好的代码能够带来的最直观感受，它可能隐式地包含了以下特性：

- 容易阅读和理解；
- 容易测试、维护和扩展；
- 命名清晰、无歧义、注释完善清楚；
- …



## 2. 代码规范

Go 语言比较常见并且使用广泛的代码规范就是官方提供的 [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)，无论你是短期还是长期使用 Go 语言编程，都应该**至少完整地阅读一遍这个官方的代码规范指南**，它既是我们在写代码时应该遵守的规则，也是在代码审查时需要注意的规范。



## 3. 辅助工具

### 1. goimports

> `goimports` = `gofmt` + `import`

[goimports](https://godoc.org/golang.org/x/tools/cmd/goimports) 是 Go 语言官方提供的工具，它能够为我们自动格式化 Go 语言代码并对所有引入的包进行管理，包括自动增删依赖的包引用、将依赖包按字母序排序并分类。

> `gogland`原生支持`goimports`,不需要进行额外的配置，保存或编译go代码时会自动进行包的依赖检查。
>
> 其他IDE可能需要配置一下才能使用。

### 2. golangci-lint

这也是一个静态检查工具，不过是可定制化的。

**安装**

```shell
go get github.com/golangci/golangci-lint/cmd/golangci-lint@v1.27.0
#这样应该也可以
go get github.com/golangci/golangci-lint/cmd/golangci-lint
```

**使用**

```shell
#指定检查给定目录下的所有文件
golangci-lint run ./
```

**配置文件**

`golangci`会在工作目录下寻找配置文件(`.golangci.yml`)

支持`yml`、`toml`和`json`三种格式。

> 具体配置信息看这里https://golangci-lint.run/usage/configuration/

更推荐的方法是在基础库或者框架中使用 `golint` 进行静态检查（或者同时使用 `golint` 和 `golangci-lint`），在其他的项目中使用可定制化的 `golangci-lint` 来进行静态检查。

因为在基础库和框架中施加强限制对于整体的代码质量有着更大的收益。

### 3. 配置

goland中则可以将这几个工具添加到`File watchers`中，每次文件变化时会自动触发。

```sh
File-->Settings-->Tools-->File watchers
```



## 4. 最佳实践

- 目录结构；
- 模块拆分；
- 显式调用；
- 面向接口；

### 1. 目录结构

目录结构基本上就是一个项目的门面，很多时候我们从目录结构中就能够看出开发者对这门语言是否有足够的经验。

官方并没有给出一个推荐的目录划分方式，但是社区中还是有一些比较常见的约定：例如：[golang-standards/project-layout](https://github.com/golang-standards/project-layout) 项目中就定义了一个比较标准的目录结构。



#### 1. /pkg

`/pkg` 目录是 Go 语言项目中非常常见的目录，我们几乎能够在所有知名的开源项目（非框架）中找到它的身影。

**这个目录中存放的就是项目中可以被外部应用使用的代码库**，其他的项目可以直接通过 `import` 引入这里的代码，所以当我们将代码放入 `pkg` 时一定要慎重。

#### 2. /internal

私有代码推荐放到 `/internal` 目录中，真正的项目代码应该写在 `/internal/app` 里，同时这些内部应用依赖的代码库应该在 `/internal/pkg` 子目录和 `/pkg` 中。

#### 3. /src

作为一个 Go 语言的开发者，我们不应该允许项目中存在 `/src` 目录。

> 社区中的一些项目确实有 `/src` 文件夹，但是这些项目的开发者之前大多数都有 Java 的编程经验。

最重要的原因其实是 Go 语言的项目在默认情况下都会被放置到 `$GOPATH/src` 目录下，这个目录中存储着我们开发和依赖的全部项目代码，如果我们在自己的项目中使用 `/src` 目录，该项目的 `PATH` 中就会出现两个 `src`

```shell
$GOPATH/src/github.com/draveness/project/src/code.go
```

#### 4. /cmd

`/cmd` 目录中存储的都是当前项目中的可执行文件，该目录下的每一个子目录都应该包含我们希望有的可执行文件。

> 如果我们的项目是一个 `grpc` 服务的话，可能在 `/cmd/server/main.go` 中就包含了启动服务进程的代码，编译后生成的可执行文件就是 `server`。

#### 5. /api

`/api` 目录中存放的就是当前项目对外提供的各种不同类型的 API 接口定义文件了。

> 其中可能包含类似 `/api/protobuf-spec`、`/api/thrift-spec` 或者 `/api/http-spec` 的目录

```shell
$ tree ./api
api
└── protobuf-spec
    └── oceanbookpb
        ├── oceanbook.pb.go
        └── oceanbook.proto
```

#### 6. Makefile

最后要介绍的 `Makefile` 文件也非常值得被关注，在任何一个项目中都会存在一些需要运行的脚本，这些脚本文件应该被放到 `/scripts` 目录中并由 `Makefile` 触发，将这些经常需要运行的命令固化成脚本减少『祖传命令』的出现。

#### 7. 小结

总的来说，每一个项目都应该按照固定的组织方式进行实现，这种约定虽然并不是强制的，但是无论是组内、公司内还是整个 Go 语言社区中，只要达成了一致，对于其他工程师快速梳理和理解项目都是很有帮助的。

### 2. 模块拆分

Go 语言的一些顶层设计最终导致了它在划分模块上与其他的编程语言有着非常明显的不同。

#### 1. 按层拆分

`Java`中的`SpringMVC`深受 [MVC 架构模式](https://draveness.me/mvx) 的影响,这是一种 Web 框架的最常见架构方式，将服务中的不同组件分成了 Model、View 和 Controller 三层。

```shell
app
├── controllers
│   ├── application_controller.rb
│   └── concerns
├── models
│   ├── application_record.rb
│   └── concerns
└── views
    └── layouts
```

#### 2. 按职责拆分

Go 语言在拆分模块时就使用了完全不同的思路，虽然 MVC 架构模式是在我们写 Web 服务时无法避开的，但是相比于横向地切分不同的层级，Go 语言的项目往往都按照职责对模块进行拆分：

对于一个比较常见的博客系统，使用 Go 语言的项目会按照不同的职责将其纵向拆分成 `post`、`user`、`comment` 三个模块，每一个模块都对外提供相应的功能，`post` 模块中就包含相关的模型和视图定义以及用于处理 API 请求的控制器（或者服务）：

```shell
$ tree pkg
pkg
├── comment
├── post
│   ├── handler.go
│   └── post.go
└── user
```

如果我们在 Go 语言中使用 `model`、`view` 和 `controller` 来划分层级，你会在其他的模块中看到非常多的 `model.Post`、`model.Comment` 和 `view.PostView`。

> 这种划分层级的方法在 Go 语言中会显得非常冗余，并且如果对项目依赖包的管理不够谨慎时，很容易发生引用循环



#### 3. 小结

项目是按照层级还是按照职责对模块进行拆分其实并没有绝对的好与不好，语言和框架层面的设计最终决定了我们应该采用哪种方式对项目和代码进行组织。

**Go 语言项目的最佳实践就是按照职责对模块进行垂直拆分，将代码按照功能的方式分到多个 `package` 中。**

> 因为 `package` 作为一个 Go 语言访问控制的最小粒度，所以我们应该遵循顶层的设计使用这种方式构建高内聚的模块。



### 3. 显式与隐式

Go 语言社区对于**显式的初始化、方法调用和错误处理**非常推崇，类似 Spring Boot 和 Rails 的框架其实都广泛地采纳了『约定优于配置』的中心思想，简化了开发者和工程师的工作量。

> 虽然是社区达成的共识与约定，但是从语言的设计以及工具上的使用我们就能发现显式地调用方法和错误处理是被鼓励的。

#### 1. init

```go
var grpcClient *grpc.Client

func init() {
    var err error
    grpcClient, err = grpc.Dial(...)
    if err != nil {
        panic(err)
    }
}

func GetPost(postID int64) (*Post, error) {
    post, err := grpcClient.FindPost(context.Background(), &pb.FindPostRequest{PostID: postID})
    if err != nil {
        return nil, err
    }
    
    return post, nil
}
```

这种代码虽然能够通过编译并且正常工作，然而这里的 `init` 函数其实隐式地初始化了 grpc 的连接资源，如果另一个 `package` 依赖了当前的包，那么引入这个依赖的工程师可能会在遇到错误时非常困惑，因为在 `init` 函数中做这种资源的初始化是非常耗时并且容易出现问题的。

**一种更加合理的做法显示地调用初始化方法。**

```go
// cmd/grpc/main.go
func main() {
    grpcClient, err := grpc.Dial(...)
    if err != nil {
        panic(err)
    }
    
    postClient := post.NewClient(grpcClient)
    // ...
}
```

这样我们从 `main` 函数开始就能梳理出程序启动的整个过程。



比较合理地用法是这样的

```go
func init() {
    if user == "" {
        log.Fatal("$USER not set")
    }
    if home == "" {
        home = "/home/" + user
    }
    if gopath == "" {
        gopath = home + "/go"
    }
    // gopath may be overridden by --gopath flag on command line.
    flag.StringVar(&gopath, "gopath", gopath, "override default GOPATH")
}
```

**我们不应该在 `init` 中做过重的初始化逻辑，而是做一些简单、轻量的前置条件判断**



#### 2. error

当我们在 Go 语言中处理错误相关的逻辑时，最重要的其实就是以下几点：

* 1) **使用 `error` 实现错误处理** — 尽管这看起来非常啰嗦；
* 2) **将错误抛给上层处理** — 对于一个方法是否需要返回 `error` 也需要我们仔细地思考，向上抛出错误时可以通过 `errors.Wrap` 携带一些额外的信息方便上层进行判断；
* 3) **处理所有可能返回的错误** — 所有可能返回错误的地方最终一定会返回错误，考虑全面才能帮助我们构建更加健壮的项目；

### 4. 面向接口

接口的作用其实就是为不同层级的模块提供了一个定义好的中间层，上游不再需要依赖下游的具体实现，充分地对上下游进行了解耦。

这种编程方式不仅是在 Go 语言中是被推荐的，在几乎所有的编程语言中，我们都会推荐这种编程的方式。它为我们的程序提供了非常强的`灵活性`，想要构建一个稳定、健壮的 Go 语言项目，不使用接口是完全无法做到的。



```go
package post

var client *grpc.ClientConn

func init() {
    var err error
    client, err = grpc.Dial(...）
    if err != nil {
        panic(err)
    }
}

func ListPosts() ([]*Post, error) {
    posts, err := client.ListPosts(...)
    if err != nil {
        return []*Post{}, err
    }
    
    return posts, nil
}
```

上述代码其实就不是一个设计良好的代码，它不仅在 `init` 函数中隐式地初始化了 grpc 连接这种全局变量，而且没有将 `ListPosts` 通过接口的方式暴露出去，这会让依赖 `ListPosts` 的上层模块难以测试。

我们可以使用下面的代码改写原有的逻辑，使得同样地逻辑变得更容易测试和维护：

```go
package post

type Service interface {
    ListPosts() ([]*Post, error)
}

type service struct {
    conn *grpc.ClientConn
}

func NewService(conn *grpc.ClientConn) Service {
    return &service{
        conn: conn,
    }
}

func (s *service) ListPosts() ([]*Post, error) {
    posts, err := s.conn.ListPosts(...)
    if err != nil {
        return []*Post{}, err
    }
    
    return posts, nil
}
```

* 1) 通过接口 `Service` 暴露对外的 `ListPosts` 方法；
* 2) 使用 `NewService` 函数初始化 `Service` 接口的实现并通过私有的结构体 `service` 持有 grpc 连接；
* 3) `ListPosts` 不再依赖全局变量，而是依赖接口体 `service` 持有的连接；

当我们使用这种方式重构代码之后，就可以在 `main` 函数中显式的初始化 grpc 连接、创建 `Service` 接口的实现并调用 `ListPosts` 方法：

```go
package main

import ...

func main() {
    conn, err = grpc.Dial(...）
    if err != nil {
        panic(err)
    }
    
    svc := post.NewService(conn)
    posts, err := svc.ListPosts()
    if err != nil {
        panic(err)
    }
    
    fmt.Println(posts)
}
```

这种使用接口组织代码的方式在 Go 语言中非常常见，我们应该在代码中尽可能地使用这种思想和模式对外提供功能：

* 1) 使用大写的 `Service` 对外暴露方法；
* 2) 使用小写的 `service` 实现接口中定义的方法；
* 3) 通过 `NewService` 函数初始化 `Service` 接口；

当我们使用上述方法组织代码之后，其实就对不同模块的依赖进行了解耦，也正遵循了软件设计中经常被提到的一句话 — 『依赖接口，不要依赖实现』，也就是**面向接口编程**。

### 5. 小结

在这一小节中总共介绍了 Go 语言中三个经常会打交道的『元素』— `init` 函数、`error` 和接口，我们在这里主要是想通过三个不同的例子为大家传达的一个主要思想就是尽量使用**显式的（explicit）的方式**编写 Go 语言代码。



## 5. 单元测试

一个代码质量和工程质量有保证的项目一定有比较合理的单元测试覆盖率，没有单元测试的项目一定是不合格的或者不重要的，单元测试应该是所有项目都必须有的代码，每一个单元测试都表示一个可能发生的情况，**单元测试就是业务逻辑**。

### 1. 可测试性

如何控制待测试方法中依赖的模块是写单元测试时至关重要的，控制依赖也就是对目标函数的依赖进行 `Mock` 消灭不确定性，为了减少每一个单元测试的复杂度，我们需要：

* 1）尽可能减少目标方法的依赖，让目标方法只依赖必要的模块；
* 2）依赖的模块也应该非常容易地进行 `Mock`；



#### 1. 接口

接口的使用能够为我们带来更清晰的抽象，帮助我们思考如何对代码进行设计，也能让我们更方便地对依赖进行 `Mock`。

接口常见用法

```go
type Service interface { ... }

type service struct { ... }

func NewService(...) (Service, error) {
    return &service{...}, nil
}
```

果你不知道应不应该使用接口对外提供服务，这时就应该无脑地使用上述模式对外暴露方法了，这种模式可以在绝大多数的场景下工作。

#### 2. 函数简单

另一个建议就是保证每一个函数尽可能简单，这里的简单不止是指功能上的简单、单一，还意味着函数容易理解并且命名能够自解释。

### 2. 组织方式

Go 语言中的单元测试文件和代码都是与源代码放在同一个目录下按照 `package` 进行组织的，`server.go` 文件对应的测试代码应该放在同一目录下的 `server_test.go` 文件中。

#### 1. Test

单元测试的最常见以及默认组织方式就是写在以 `_test.go` 结尾的文件中，所有的测试方法也都是以 `Test` 开头并且只接受一个 `testing.T` 类型的参数：

```go
func TestAuthor(t *testing.T) {
    author := blog.Author()
    assert.Equal(t, "draveness", author)
}
```

#### 2. Suite

第二种比较常见的方式是按照簇进行组织，其实就是对 Go 语言默认的测试方式进行简单的封装，我们可以使用 [stretchr/testify](https://github.com/stretchr/testify) 中的 `suite` 包对测试进行组织:

```go
import (
    "testing"
    "github.com/stretchr/testify/suite"
)

type ExampleTestSuite struct {
    suite.Suite
    VariableThatShouldStartAtFive int
}

func (suite *ExampleTestSuite) SetupTest() {
    suite.VariableThatShouldStartAtFive = 5
}

func (suite *ExampleTestSuite) TestExample() {
    suite.Equal(suite.VariableThatShouldStartAtFive, 5)
}

func TestExampleTestSuite(t *testing.T) {
    suite.Run(t, new(ExampleTestSuite))
}
```

我们可以使用 `suite` 包，以结构体的方式对测试簇进行组织，`suite` 提供的 `SetupTest`/`SetupSuite` 和 `TearDownTest`/`TearDownSuite` 是执行测试前后以及执行测试簇前后的钩子方法，我们能在其中完成一些共享资源的初始化，减少测试中的初始化代码。



## 6. 总结

在这篇文章中我们从三个方面分别介绍了如何写优雅的 Go 语言代码，作者尽可能地给出了最容易操作和最有效的方法：

- 代码规范：使用辅助工具帮助我们在每次提交 PR 时自动化地对代码进行检查，减少工程师人工审查的工作量；
- 最佳实践
  - 目录结构：遵循 Go 语言社区中被广泛达成共识的 [目录结构](https://github.com/golang-standards/project-layout)，减少项目的沟通成本；
  - 模块拆分：按照职责对不同的模块进行拆分，Go 语言的项目中也不应该出现 `model`、`controller` 这种违反语言顶层设计思路的包名；
  - 显示与隐式：尽可能地消灭项目中的 `init` 函数，保证显式地进行方法的调用以及错误的处理；
  - 面向接口：面向接口是 Go 语言鼓励的开发方式，也能够为我们写单元测试提供方便，我们应该遵循固定的模式对外提供功能；
    1. 使用大写的 `Service` 对外暴露方法；
    2. 使用小写的 `service` 实现接口中定义的方法；
    3. 通过 `func NewService(...) (Service, error)` 函数初始化 `Service` 接口；
- 单元测试：保证项目工程质量的最有效办法；
  - 可测试：意味着面向接口编程以及减少单个函数中包含的逻辑，使用『小方法』；
  - 组织方式：使用 Go 语言默认的 Test 框架、开源的 `suite` 或者 BDD 的风格对单元测试进行合理组织；
  - Mock 方法：四种不同的单元测试 Mock 方法；
    - [gomock](https://github.com/golang/mock)：最标准的也是最被鼓励的方式；
    - [sqlmock](https://github.com/DATA-DOG/go-sqlmock)：处理依赖的数据库；
    - [httpmock](https://github.com/jarcoal/httpmock)：处理依赖的 HTTP 请求；
    - [monkey](https://github.com/bouk/monkey)：万能的方法，但是只在万不得已时使用，类似的代码写起来非常冗长而且不直观；
  - 断言：使用社区的 [testify](https://github.com/stretchr/testify) 快速验证方法的返回值；



## 原文

`https://draveness.me/golang-101/`