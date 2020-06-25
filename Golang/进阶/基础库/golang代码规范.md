# Golang代码规范

这里主要记录了一些容易犯错的地方，完整的规范可以看下面两个地方。

官方

```sh
https://github.com/golang/go/wiki/CodeReviewComments
```

Uber

```sh
https://github.com/uber-go/guide
```



## 1. 原则

### 1. 零值 Mutex 是有效的

零值 `sync.Mutex` 和 `sync.RWMutex` 是有效的。所以指向 mutex 的指针基本是不必要的。

```go
//Bad
mu := new(sync.Mutex) 
mu.Lock()
//Good
var mu sync.Mutex 
mu.Lock()
```



如果你使用结构体指针，mutex 可以非指针形式作为结构体的组成字段，或者更好的方式是直接嵌入到结构体中。 如果是私有结构体类型或是要实现 Mutex 接口的类型，我们可以使用嵌入 mutex 的方法：

**为私有类型或需要实现互斥接口的类型嵌入。**

```go
type smap struct {
  sync.Mutex // only for unexported types（仅适用于非导出类型）

  data map[string]string
}

func newSMap() *smap {
  return &smap{
    data: make(map[string]string),
  }
}

func (m *smap) Get(k string) string {
  m.Lock()
  defer m.Unlock()

  return m.data[k]
}
```



**对于导出的类型，请使用专用字段。**

```go
type SMap struct {
  mu sync.Mutex // 对于导出类型，请使用私有锁

  data map[string]string
}

func NewSMap() *SMap {
  return &SMap{
    data: make(map[string]string),
  }
}

func (m *SMap) Get(k string) string {
  m.mu.Lock()
  defer m.mu.Unlock()

  return m.data[k]
}
```



### 2. 在边界处拷贝 Slices 和 Maps

slices 和 maps 包含了指向底层数据的指针，因此在需要复制它们时要特别注意。

#### 1. 接收 Slices 和 Maps

请记住，当 map 或 slice 作为函数参数传入时，如果您存储了对它们的引用，则用户可以对其进行修改。

```go
//Bad
func (d *Driver) SetTrips(trips []Trip) {
  // 直接赋值则和外部指向同一引用 受外部修改影响
  d.trips = trips
}

trips := ...
d1.SetTrips(trips)

// 你是要修改 d1.trips 吗？
trips[0] = ...
```



```go
//Good
func (d *Driver) SetTrips(trips []Trip) {
  // 这里copy单独复制一份出来 之后则不受外部修改影响
  d.trips = make([]Trip, len(trips))
  copy(d.trips, trips)
}

trips := ...
d1.SetTrips(trips)

// 这里我们修改 trips[0]，但不会影响到 d1.trips
trips[0] = ...
```

#### 2. 返回 slices 或 maps

同样，请注意用户对暴露内部状态的 map 或 slice 的修改。

```go
// Bad
type Stats struct {
  mu sync.Mutex

  counters map[string]int
}

// Snapshot 返回当前状态。
func (s *Stats) Snapshot() map[string]int {
  s.mu.Lock()
  defer s.mu.Unlock()
  // 直接返回引用 如果外部修改后会受到影响
  return s.counters
}

// snapshot 不再受互斥锁保护
// 因此对 snapshot 的任何访问都将受到数据竞争的影响
// 影响 stats.counters
snapshot := stats.Snapshot()
```



```go
//Good
type Stats struct {
  mu sync.Mutex

  counters map[string]int
}

func (s *Stats) Snapshot() map[string]int {
  s.mu.Lock()
  defer s.mu.Unlock()
 //单独make一个新的map返回
  result := make(map[string]int, len(s.counters))
  for k, v := range s.counters {
    result[k] = v
  }
  return result
}

// snapshot 现在是一个拷贝
snapshot := stats.Snapshot()
```

### 3. Channel 的 size 要么是 1，要么是无缓冲的

channel 通常 size 应为 1 或是无缓冲的。默认情况下，channel 是无缓冲的，其 size 为零。任何其他尺寸都必须经过严格的审查。

```go
//Bad
// 应该足以满足任何情况！
c := make(chan int, 64)

//Good
// 大小：1
c := make(chan int, 1) // 或者
// 无缓冲 channel，大小为 0
c := make(chan int)
```

### 4. 枚举从 1 开始

由于变量的默认值为 0，因此`通常`应以非零值开头枚举。

> 在某些情况下，使用零值是有意义的（枚举从零开始），例如，当零值是理想的默认行为时。

```go
//Bad
type Operation int

const (
  Add Operation = iota
  Subtract
  Multiply
)

// Add=0, Subtract=1, Multiply=2
```

```go
//Good
type Operation int

const (
  Add Operation = iota + 1
  Subtract
  Multiply
)

// Add=1, Subtract=2, Multiply=3
```

### 5. 使用 time 处理时间

#### 1. 使用 `time.Time` 表达瞬时时间

```go
//Bad
func isActive(now, start, stop int) bool {
  return start <= now && now < stop
}
//Good
func isActive(now, start, stop time.Time) bool {
  return (start.Before(now) || start.Equal(now)) && now.Before(stop)
}
```

#### 2. 使用 `time.Duration` 表达时间段

```go
//Bad
func poll(delay int) {
  for {
    // ...
    time.Sleep(time.Duration(delay) * time.Millisecond)
  }
}
poll(10) // 是几秒钟还是几毫秒?
```

```go
//Good
func poll(delay time.Duration) {
  for {
    // ...
    time.Sleep(delay)
  }
}
poll(10*time.Second)
```

#### 3. 对外部系统使用 `time.Time` 和 `time.Duration`

尽可能在与外部系统的交互中使用 `time.Duration` 和 `time.Time` 例如 :

- Command-line 标志: [`flag`](https://golang.org/pkg/flag/) 通过 [`time.ParseDuration`](https://golang.org/pkg/time/#ParseDuration) 支持 `time.Duration`
- JSON: [`encoding/json`](https://golang.org/pkg/encoding/json/) 通过其 [`UnmarshalJSON` method](https://golang.org/pkg/time/#Time.UnmarshalJSON) 方法支持将 `time.Time` 编码为 [RFC 3339](https://tools.ietf.org/html/rfc3339) 字符串
- SQL: [`database/sql`](https://golang.org/pkg/database/sql/) 支持将 `DATETIME` 或 `TIMESTAMP` 列转换为 `time.Time`，如果底层驱动程序支持则返回
- YAML: [`gopkg.in/yaml.v2`](https://godoc.org/gopkg.in/yaml.v2) 支持将 `time.Time` 作为 [RFC 3339](https://tools.ietf.org/html/rfc3339) 字符串，并通过 [`time.ParseDuration`](https://golang.org/pkg/time/#ParseDuration) 支持 `time.Duration`。

当不能在这些交互中使用 `time.Duration` 时，请使用 `int` 或 `float64`，**并在字段名称中包含单位**。

```go
//Bad
// {"interval": 2}
type Config struct {
  Interval int `json:"interval"`
}
//Good
// {"intervalMillis": 2000}
type Config struct {
  IntervalMillis int `json:"intervalMillis"`
}
```

### 6. Error

一个（函数/方法）调用失败时，有三种主要的错误传播方式：

- 如果没有要添加的其他上下文，并且您想要维护原始错误类型，则返回原始错误。
- 添加上下文，使用 [`"pkg/errors".Wrap`](https://godoc.org/github.com/pkg/errors#Wrap) 以便错误消息提供更多上下文 ,[`"pkg/errors".Cause`](https://godoc.org/github.com/pkg/errors#Cause) 可用于提取原始错误。
- 如果调用者不需要检测或处理的特定错误情况，使用 [`fmt.Errorf`](https://golang.org/pkg/fmt/#Errorf)。

建议在可能的地方添加上下文，以使您获得诸如“调用服务 foo：连接被拒绝”之类的更有用的错误，而不是诸如“连接被拒绝”之类的模糊错误。

在将上下文添加到返回的错误时，**请避免使用“failed to”之类的短语**以保持上下文简洁，这些短语会陈述明显的内容，并随着错误在堆栈中的渗透而逐渐堆积：

```go
//Bad
s, err := store.New()
if err != nil {
    return fmt.Errorf(
        "failed to create new store: %s", err)
}
//failed to x: failed to y: failed to create new store: the error
```

```go
//Good
s, err := store.New()
if err != nil {
    return fmt.Errorf(
        "new store: %s", err)
}
//x: y: new store: the error
```

### 7. 处理类型断言失败

[type assertion](https://golang.org/ref/spec#Type_assertions) 的单个返回值形式针对不正确的类型将产生 panic。因此，请始终使用“comma ok”的惯用法。

```go
//Bad
t := i.(string)
//Good
t, ok := i.(string)
if !ok {
  // 优雅地处理错误
}
```

### 8. panic

在生产环境中运行的代码必须避免出现 panic，程序初始化除外。



### 9. 避免可变全局变量

```go
//Bad
// sign.go
var _timeNow = time.Now
func sign(msg string) string {
  //这里使用了全局变量  
  now := _timeNow()
  return signWithTime(msg, now)
}
```



```go
//Good
// sign.go
type signer struct {
  now func() time.Time
}
func newSigner() *signer {
  return &signer{
    now: time.Now,
  }
}
func (s *signer) Sign(msg string) string {
  // 通过将全局变量作为signer的依赖来传递
  now := s.now()
  return signWithTime(msg, now)
}
```



### 10. 避免在公共结构中嵌入类型

这些嵌入的类型泄漏实现细节、禁止类型演化和模糊的文档。

假设您使用共享的 `AbstractList` 实现了多种列表类型，请避免在具体的列表实现中嵌入 `AbstractList`。 相反，只需手动将方法写入具体的列表，该列表将委托给抽象列表。

```go
type AbstractList struct {}
// 添加将实体添加到列表中。
func (l *AbstractList) Add(e Entity) {
  // ...
}
// 移除从列表中移除实体。
func (l *AbstractList) Remove(e Entity) {
  // ...
}
```


```go
//Bad
// ConcreteList 是一个实体列表。
type ConcreteList struct {
   //直接匿名嵌入不推荐 
   //AbstractList中添加新增方法都会直接影响到ConcreteList
  *AbstractList
}
```



```go
//Good
// ConcreteList 是一个实体列表。
type ConcreteList struct {
  // 显示嵌入 同时添加了委托方法 
  // 这样AbstractList中添加新增方法都不会影响到ConcreteList
  list *AbstractList
}
// 添加将实体添加到列表中。
func (l *ConcreteList) Add(e Entity) {
  return l.list.Add(e)
}
// 移除从列表中移除实体。
func (l *ConcreteList) Remove(e Entity) {
  return l.list.Remove(e)
}
```



## 2. 性能

### 1. 优先使用 strconv 而不是 fmt

将原语转换为字符串或从字符串转换时，`strconv`速度比`fmt`快。

```go
//Bad
for i := 0; i < b.N; i++ {
  s := fmt.Sprint(rand.Int())
}
// BenchmarkFmtSprint-4    143 ns/op    2 allocs/op

//Good
for i := 0; i < b.N; i++ {
  s := strconv.Itoa(rand.Int())
}
//BenchmarkStrconv-4    64.2 ns/op    1 allocs/op
```



### 2. 避免字符串到字节的转换

不要反复从固定字符串创建字节 slice。相反，请执行一次转换并捕获结果。

```go
//Bad
for i := 0; i < b.N; i++ {
  w.Write([]byte("Hello world"))
}
//BenchmarkBad-4   50000000   22.2 ns/op

//Good
data := []byte("Hello world")
for i := 0; i < b.N; i++ {
  w.Write(data)
}
//BenchmarkGood-4  500000000   3.25 ns/op
```

### 3. 尽量初始化时指定 Map 容量

在尽可能的情况下，在使用 `make()` 初始化的时候提供容量信息,这减少了在将元素添加到 map 时增长和分配的开销

```go
make(map[T1]T2, hint)
```



```go
//Bad
m := make(map[string]os.FileInfo)

files, _ := ioutil.ReadDir("./files")
for _, f := range files {
    m[f.Name()] = f
}
// m 是在没有大小提示的情况下创建的； 在运行时可能会有更多分配。

//Good
files, _ := ioutil.ReadDir("./files")

m := make(map[string]os.FileInfo, len(files))
for _, f := range files {
    m[f.Name()] = f
}
//m 是有大小提示创建的；在运行时可能会有更少的分配。
```



## 3. 规范

最重要的是，**保持一致**。

### 1. 相似的声明放在一组

导包应该分为两组：

- 标准库
- 其他库

```go
//Bad
import (
  "fmt"
  "os"
  "go.uber.org/atomic"
  "golang.org/x/sync/errgroup"
)

//Good
import (
  "fmt"
  "os"
	
  "go.uber.org/atomic"
  "golang.org/x/sync/errgroup"
)
```

常量、变量和类型声明更应该分组。

```go
//Bad
const a = 1
const b = 2

var a = 1
var b = 2

type Area float64
type Volume float64
```

```go
//Good
const (
  a = 1
  b = 2
)

var (
  a = 1
  b = 2
)

type (
  Area float64
  Volume float64
)
```

仅将相关的声明放在一组。不要将不相关的声明放在一组。

```go
//Bad
type Operation int

const (
  Add Operation = iota + 1
  Subtract
  Multiply
  ENV_VAR = "MY_ENV" //这个很明显不是一组的 不应该放一起
)
```

```go
//Good
type Operation int

const (
  Add Operation = iota + 1
  Subtract
  Multiply
)

const ENV_VAR = "MY_ENV"
```



### 2. 包名

当命名包时，请按下面规则选择一个名称：

- 全部小写。没有大写或下划线。
- 大多数使用命名导入的情况下，不需要重命名。
- 简短而简洁。请记住，在每个使用的地方都完整标识了该名称。
- 不用复数。例如`net/url`，而不是`net/urls`。
- 不要用“common”，“util”，“shared”或“lib”。这些是不好的，信息量不足的名称。



### 3. 函数分组与顺序

- 函数应按粗略的调用顺序排序。
- 同一文件中的函数应按接收者分组。

因此，导出的函数应先出现在文件中，放在`struct`, `const`, `var`定义的后面。

在定义类型之后，但在接收者的其余方法之前，可能会出现一个 `newXYZ()`/`NewXYZ()`

由于函数是按接收者分组的，因此普通工具函数应在文件末尾出现。



### 4. 减少嵌套

代码应通过**尽可能先处理错误情况/特殊情况并尽早返回或继续循环**来减少嵌套。减少嵌套多个级别的代码的代码量。

```go
//Bad
for _, v := range data {
  if v.F1 == 1 {
    v = process(v)
    if err := v.Call(); err == nil {
      v.Send()
    } else {
      return err
    }
  } else {
    log.Printf("Invalid v: %v", v)
  }
}
```

```go
//Good
for _, v := range data {
  if v.F1 != 1 {
    log.Printf("Invalid v: %v", v)
    continue
  }

  v = process(v)
  if err := v.Call(); err != nil {
    return err
  }
  v.Send()
}
```

### 5. 不必要的 else

如果在 if 的两个分支中都设置了变量，则可以将其替换为单个 if。

```go
//Bad
var a int
if b {
  a = 100
} else {
  a = 10
}

//Good
a := 10
if b {
  a = 100
}
```

### 6. 顶层变量声明

在顶层，使用标准`var`关键字。请勿指定类型，除非它与表达式的类型不同。

```go
//Bad
var _s string = F()
func F() string { return "A" }
```

```go
//Good
var _s = F()
// 由于 F 已经明确了返回一个字符串类型，因此我们没有必要显式指定_s 的类型
func F() string { return "A" }
```

如果表达式的类型与所需的类型不完全匹配，请指定类型。

```go
type myError struct{}

func (myError) Error() string { return "error" }

func F() myError { return myError{} }

var _e error = F()
// F 返回一个 myError 类型的实例，但是我们要 error 类型
```

### 7. 对于未导出的顶层常量和变量，使用`_`作为前缀

在未导出的顶级`vars`和`consts`， 前面加上前缀_，以使它们在使用时明确表示它们是全局符号。

> 例外：未导出的错误值，应以`err`开头。

基本依据：顶级变量和常量具有包范围作用域。使用通用名称可能很容易在其他文件中意外使用错误的值。

```go
//Bad
// foo.go

const (
  defaultPort = 8080
  defaultUser = "user"
)

// bar.go

func Bar() {
  defaultPort := 9090
  ...
  fmt.Println("Default port", defaultPort)

  // We will not see a compile error if the first line of
  // Bar() is deleted.
}
```

```go
//Good
// foo.go

const (
  _defaultPort = 8080
  _defaultUser = "user"
)
```

### 8. 结构体中的嵌入

嵌入式类型（例如 mutex）应位于结构体内的字段列表的顶部，并且必须有一个空行将嵌入式字段与常规字段分隔开。

```go
//Bad
type Client struct {
  version int
  http.Client
}

//Good
type Client struct {
  http.Client

  version int
}
```

### 9. 使用字段名初始化结构体

初始化结构体时，几乎始终应该指定字段名称。现在由 [`go vet`](https://golang.org/cmd/vet/) 强制执行。

```go
//Bad
k := User{"John", "Doe", true}
//Good
k := User{
    FirstName: "John",
    LastName: "Doe",
    Admin: true,
}
```

> 例外：如果有 3 个或更少的字段，则可以在测试表中省略字段名称。

### 10. 本地变量声明

如果将变量明确设置为某个值，则应使用短变量声明形式 (`:=`)。

```go
//Bad
var s = "foo"
//Good
s := "foo"
```

> 但是，在某些情况下，`var` 使用关键字时默认值会更清晰。例如，声明空切片。

### 11. nil 是一个有效的 slice

`nil` 是一个有效的长度为 0 的 slice，这意味着，

- 您不应明确返回长度为零的切片。应该返回`nil` 来代替。

```go
//Bad
if x == "" {
  return []int{}
}
//Good
if x == "" {
  return nil
}
```

* 要检查切片是否为空，请始终使用`len(s) == 0`。而非 `nil`。

```go
//Bad
func isEmpty(s []string) bool {
  return s == nil
}
//Good
func isEmpty(s []string) bool {
  return len(s) == 0
}
```

* 零值切片（用`var`声明的切片）可立即使用，无需调用`make()`创建。

```go
//Bad
// 这里没必要make
nums := []int{}
// or, nums := make([]int)

if add1 {
  nums = append(nums, 1)
}

if add2 {
  nums = append(nums, 2)
}
//Good
var nums []int

if add1 {
  nums = append(nums, 1)
}

if add2 {
  nums = append(nums, 2)
}
```



### 12. 缩小变量作用域

如果有可能，尽量缩小变量作用范围。除非它与 [减少嵌套](https://github.com/xxjwxc/uber_go_guide_cn#减少嵌套)的规则冲突。

```go
//Bad
err := ioutil.WriteFile(name, data, 0644)
if err != nil {
 return err
}
//Good
if err := ioutil.WriteFile(name, data, 0644); err != nil {
 return err
}
```

### 13. 避免参数语义不明确(Avoid Naked Parameters)

函数调用中的`意义不明确的参数`可能会损害可读性。当参数名称的含义不明显时，请为参数添加 C 样式注释 (`/* ... */`)

```go
//Bad
// func printInfo(name string, isLocal, done bool)
printInfo("foo", true, true)

//Good
// func printInfo(name string, isLocal, done bool)
printInfo("foo", true /* isLocal */, true /* done */)
```

对于上面的示例代码，还有一种更好的处理方式是将上面的 `bool` 类型换成自定义类型。将来，该参数可以支持不仅仅局限于两个状态（true/false）。

```go
type Region int

const (
  UnknownRegion Region = iota
  Local
)

type Status int

const (
  StatusReady Status= iota + 1
  StatusDone
  // Maybe we will have a StatusInProgress in the future.
)

func printInfo(name string, region Region, status Status)
```

### 14. 使用原始字符串字面值，避免转义

Go 支持使用 [原始字符串字面值](https://golang.org/ref/spec#raw_string_lit)，也就是 " ` " 来表示原生字符串，在需要转义的场景下，我们应该尽量使用这种方案来替换。

可以跨越多行并包含引号。使用这些字符串可以避免更难阅读的手工转义的字符串。

```go
//Bad
wantError := "unknown name:\"test\""

//Good
wantError := `unknown error:"test"`
```



## 4. 编程模式

### 1. 表驱动测试

当测试逻辑是重复的时候，通过 [subtests](https://blog.golang.org/subtests) 使用 table 驱动的方式编写 case 代码看上去会更简洁。

```go
//Bad
// func TestSplitHostPort(t *testing.T)

host, port, err := net.SplitHostPort("192.0.2.0:8000")
require.NoError(t, err)
assert.Equal(t, "192.0.2.0", host)
assert.Equal(t, "8000", port)

host, port, err = net.SplitHostPort("192.0.2.0:http")
require.NoError(t, err)
assert.Equal(t, "192.0.2.0", host)
assert.Equal(t, "http", port)

host, port, err = net.SplitHostPort(":8000")
require.NoError(t, err)
assert.Equal(t, "", host)
assert.Equal(t, "8000", port)

host, port, err = net.SplitHostPort("1:8")
require.NoError(t, err)
assert.Equal(t, "1", host)
assert.Equal(t, "8", port)
```



```go
//Good
// func TestSplitHostPort(t *testing.T)

tests := []struct{
  give     string
  wantHost string
  wantPort string
}{
  {
    give:     "192.0.2.0:8000",
    wantHost: "192.0.2.0",
    wantPort: "8000",
  },
  {
    give:     "192.0.2.0:http",
    wantHost: "192.0.2.0",
    wantPort: "http",
  },
  {
    give:     ":8000",
    wantHost: "",
    wantPort: "8000",
  },
  {
    give:     "1:8",
    wantHost: "1",
    wantPort: "8",
  },
}

for _, tt := range tests {
  t.Run(tt.give, func(t *testing.T) {
    host, port, err := net.SplitHostPort(tt.give)
    require.NoError(t, err)
    assert.Equal(t, tt.wantHost, host)
    assert.Equal(t, tt.wantPort, port)
  })
}
```

我们遵循这样的约定：将结构体切片称为`tests`。 每个测试用例称为`tt`。此外，我们鼓励使用`give`和`want`前缀说明每个测试用例的输入和输出值。

```go
tests := []struct{
  give     string
  wantHost string
  wantPort string
}{
  // ...
}

for _, tt := range tests {
  // ...
}
```

### 2. 功能选项

功能选项是一种模式，您可以在其中声明一个不透明 Option 类型，该类型在某些内部结构中记录信息。您接受这些选项的可变编号，并根据内部结构上的选项记录的全部信息采取行动。

```go
//Bad
// package db

func Open(
  addr string,
  cache bool,
  logger *zap.Logger
) (*Connection, error) {
  // ...
}
//使用
//必须始终提供缓存和记录器参数，即使用户希望使用默认值。

db.Open(addr, db.DefaultCache, zap.NewNop())
db.Open(addr, db.DefaultCache, log)
db.Open(addr, false /* cache */, zap.NewNop())
db.Open(addr, false /* cache */, log)
```



```go
//Good
// package db

type Option interface {
  // ...
}

func WithCache(c bool) Option {
  // ...
}

func WithLogger(log *zap.Logger) Option {
  // ...
}

// Open creates a connection.
func Open(
  addr string,
  opts ...Option,
) (*Connection, error) {
  // ...
}

//使用
//只有在需要时才提供选项。

db.Open(addr)
db.Open(addr, db.WithLogger(log))
db.Open(addr, db.WithCache(false))
db.Open(
  addr,
  db.WithCache(false),
  db.WithLogger(log),
)
```

我们建议实现此模式的方法是使用一个 `Option` 接口，该接口保存一个未导出的方法，在一个未导出的 `options` 结构上记录选项。

```go
type options struct {
  cache  bool
  logger *zap.Logger
}

type Option interface {
  apply(*options)
}

type cacheOption bool

func (c cacheOption) apply(opts *options) {
  opts.cache = bool(c)
}

func WithCache(c bool) Option {
  return cacheOption(c)
}

type loggerOption struct {
  Log *zap.Logger
}

func (l loggerOption) apply(opts *options) {
  opts.logger = l.Log
}

func WithLogger(log *zap.Logger) Option {
  return loggerOption{Log: log}
}

// Open creates a connection.
func Open(
  addr string,
  opts ...Option,
) (*Connection, error) {
  options := options{
    cache:  defaultCache,
    logger: zap.NewNop(),
  }

  for _, o := range opts {
    o.apply(&options)
  }

  // ...
}
```

