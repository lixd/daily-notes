 # Go error

## 1. 概述

Go 语言中调用函数后必须先判定 error，在使用返回值。

error 的特点：

* 简单
* 考虑失败，而不是成功（plan for failure,not success）
* 没有隐藏的控制流
* 完全交给你来控制 error
* Error are values。



## 2. Error Type

### Sentinel Error

预定义的特定错误，我们叫为sentinel error,这个名字来源于计算机编程中使用一个
特定值来表示不可能进行进一步处理的做法。所以对于Go,我们使用特定的值来表示
错误。

```go
if err == ErrSomething {...}
```

类似 io.EOF，更底层的 syscall.ENOENT

使用 sentine 值是最不灵活的错误处理策略，因为调用方必须使用==将结果与预先声明的值进行比较。当您想要提供更多的上下文时，这就出现了一个问题，因为返回一个不同的错误将破坏相等性检查。
甚至是一些有意义的 fmt.Errorf 携带一些上下文，也会破坏调用者的 ==，调用者将被迫查看 error. Error() 方法的输出，以查看它是否与特定的字符串匹配。

* 不依赖检查 error.Error 的输出

不应该依赖检测 error. Error 的输出，Error 方法存在于 error 接口主要用于方便程序员使用，但不是程序(编写测试可能会依赖这1返回)。这个输出的字符串用于记录日志、输出到 stdout 等。

* Sentinel errors成为你API公共部分。

如果您的公共函数或方法返回一 个特定值的错误，那么该值必须是公共的，当然要有文档记录，这会增加 API 的表面积。
如果 API 定义了一个返回特定错误的 interface,则该接口的所有实现都将被限制为仅返回该错误，即使它们可以提供更具描述性的错误。
比如io.Reader。像io. Copy这类函数需要reader的实现者比如返回io.EOF来告诉调用者没有更多数据了，但这又不是错误。

* Sentinelerrors在两个包之间创建了依赖。

sentinel errors 最糟糕的问题是它们在两个包之间创建源代码依赖关系。例如，检查错误是否等于 io.EOF,您的代码必须导入 io 包。这个特定的例子听起来并不那么糟糕，因为它非常常见，但是想象一下，当项目中的许多包导出错误值时，存在耦合，项目中的其他包必须导入这些错误值才能检查特定的错误条件(in the form of an import loop)。

* 结论：**尽可能避免sentinel errors**。

我的建议是避免在编写的代码中使用sentinel errors。在标准库中有一些使用它们的情况， 但这不是一个您应该模仿的模式。



### Error types

Error type是实现了error 接口的自定义类型。例如MyError类型记录了文件和行号以
展示发生了什么。

```go
type MyError struct {
    Msg string
    File string
    Line int
}

func (e *MyError) Error()string{
    return fmt.Sprintf("%s:%d: %s",e.File,e.Line,e.Msg )
}
```

因为 MyError 是一个type,调用者可以使用断言转换成这个类型，来获取更多的上下
文信息。

```go
switch err:=err.(type){
    case *MyError:
    fmt.Println("Line:",e.Line)
}
```

与错误值相比，错误类型的一大改进是它们能够包装底层错误以提供更多上下文。
一个不错的例子就是 os. PathError 他提供了底层执行了什么操作、那个路径出了什么问题。

```go
type PathError struct {
    Op string
    Path string
    Err error
}
```

调用者要使用类型断言和类型 switch,就要让自定义的 error 变为 public。这种模型会导致和调用者产生强耦合，从而导致API变得脆弱。

结论：**尽量避免使用error types**。

虽然错误类型比sentinel errors更好，因为它们可以捕获关于出错的更多上下文，但是 error types 共享 error values 许多相同的问题。
因此，我的建议是避免错误类型，或者至少避免将它们作为公共 API 的一部分。



### Opaque errors

在我看来，这是最灵活的错误处理策略，因为它要求代码和调用者之间的耦合最少。

我将这种风格称为**不透明错误处理**，因为虽然你知道发生了错误，但你没有能力看到错误的内部。作为调用者，关于操作的结果，你所知道的就是它起作用了，或者没有起作用(成功还是失败)。

这就是不透明错误处理的全部功能一只需返回错误而不假设其内容。

```go
x,err:=doSomething()
if err!=nil{
    return err
}
// else use x doSomething
```

* Assert errors for behaviour, not type

在少数情况下，这种二分错误处理方法是不够的。例如，与进程外的世界进行交互(如
网络活动)，需要调用方调查错误的性质，以确定重试该操作是否合理。在这种情况下，我们可以断言错误实现了特定的行为，而不是断言错误是特定的类型或值。考虑这个例子:

```go
type temporary interface {
    Temporary() bool
}
func IsTemporary(err error)bool{
    te,ok:=err.(temporary)
    return ok&&te.Terporary
}
```

通过定义接口，在内部实现 error 相关判断，减轻外部调用者负担。



## 3. Handler Error

### Indented flow is for errors

无错误的正常流程代码，将成为一条直线，而不是缩进的代码。



Eliminate error handling by eliminating errors

```go
func AuthenticateRequest(r *Request)error{
    err:=authenticate(r.User)
    if err != nil{
        return err
    }
    return nil
}
// 直接向下面这样
func AuthenticateRequest(r *Request)error{
	return authenticate(r.User)
}
```



统计 io.Reader 读取内容的行数

```go
// CountLines 第一版本 需要多个地方判断err 看着比较乱
func CountLines(r io.Reader) (int, error) {
	var (
		br    = bufio.NewReader(r)
		lines int
		err   error
	)
	for {
		_, err = br.ReadString('\n')
		lines++
		if err != nil {
			break
		}
	}
	if err != io.EOF {
		return 0, err
	}
	return lines, nil
}

// CountLines2  优化后 中途不需要判断 error 最后直接返回即可
// CountLines2  优化后 中途不需要判断 error 最后直接返回即可
func CountLines2(r io.Reader) (int, error) {
	// 1.Scanner 将 error 存放在自己内部 不需要在外部判断
	sc := bufio.NewScanner(r)
	lines := 0
	for sc.Scan() {
		lines++
	}
	// 2. 返回的时候直接将 Scanner 中的 err 返回即可
	return lines, sc.Err()
}

```



一个 HTTP 响应的例子，用上面的方式进行优化：

```go
type Header struct {
	Key, Value string
}
type Status struct {
	Code   int
	Reason string
}

func WriteResponse(w io.Writer, st Status, headers []Header, body io.Reader) error {
	_, err := fmt.Fprintf(w, "HTTP/1.1 %d %s\r\n", st.Code, st.Reason)
	if err != nil {
		return err
	}
	for _, h := range headers {
		_, err := fmt.Fprintf(w, "%s: %s\r\n", h.Key, h.Value)
		if err != nil {
			return err
		}
	}
	if _, err := fmt.Fprint(w, "\r\n"); err != nil {
		return err
	}
	_, err = io.Copy(w, body)
	return err
}
```

优化后：

使用 errWriter 把 error 包一下，同时实现一下 Write 方法。

```go
type errWriter struct {
	io.Writer
	err error
}

func (e *errWriter) Write(buf []byte) (int, error) {
	// 第二步 在下一次调用的时候判定 err 字段是否不为空
	// 不为空说明上一次调用肯定报错了 这里直接返回
	if e.err != nil {
		return 0,e.err
	}
	var n int
	// 第一步 用 err字段把Write返回的错误接收一下
	n, e.err = e.Writer.Write(buf)
	return n, nil
}
// WriteResponse2 中途不需要任何判断 直接在最后返回错误即可
func WriteResponse2(w io.Writer, st Status, headers []Header, body io.Reader) error {
	ew := &errWriter{Writer: w}
	// 这里不判断 error
	fmt.Fprintf(ew, "HTTP/1.1 %d %s\r\n", st.Code, st.Reason)
	for _, h := range headers {
		// 这里也不判断
		fmt.Fprintf(ew, "%s: %s\r\n", h.Key, h.Value)
	}
	// 这里还是不判断
	fmt.Fprint(ew, "\r\n")
	io.Copy(ew, body)
	// 最终返回的时候直接把 err 字段返回即可
	return ew.err
}

```



### Wrap errors

还记得之前我们 auth 的代码吧，如果 authenticate 返回错误，AuthenticateRequest 会将错误返回给调用方，调用者可能也会这样做，依此类推。在程序的顶部，程序的主体将把错误打印到屏幕或日志文件中，打印出来的只是:没有这样的文件或目录,也不知道具体是什么错误，于是大家想到了在 error 中拼接上下文信息：

```go
func AuthenticateRequest(r *Request)error{
	err:=authenticate(r.User)
	if err != nil{
        return fmt.Errorf("authenticate failed: %v",err)
	}
	return nil
}
```

但是这样也**没有生成错误的 file:line 信息**。没有导致错误的调用堆栈的堆栈跟踪。这段代码的作者将被迫进行长时间的代码分割，以发现是哪个代码路径触发了文件未找到错误。

但是正如我们前面看到的，这种模式与 sentinel error s或 type assertions 的使用不兼容，因为将错误值转换为字符串，将其与另一个字符串合并，然后将其转换回
fmt.Errorf 破坏了原始错误，导致等值判定失败。



error 处理的理念：**你只应该处理 error 一次**。

> you should only handle errors once. Handling an error means inspecting the error value, and making a single decision。

错误示范：

```go
func WriteAll(w io.Writer, buf []byte) error {
	_, err := w.Write(buf)
	if err != nil {
		log.Println("unable to write:", err) // annotated error
		return err                           // unannotated error
	}
	return nil
}
```

```go
func WriteConfig(w io.Writer, conf *Config) error {
	buf, err := json.Marshal(conf)
	if err != nil {
		log.Printf("could not marshal config: %v", err)
		return err
		// oops，forgot to return
	}
	if err := WriteAll(w, buf); err != nil {
		log.Println("could not write config: %v", err)
		return err
	}
	return nil
}
```



打印日志后 又再次将 error 返回，上一层检测到错误后可能也会打印日志并再往上层返回，最终导致一个 error 打印了 N 个日志。



**Go 中的错误处理契约规定，在出现错误的情况下，不能对其他返回值的内容做出任何
假设**。由于JSON 序列化失败，buf 的内容是未知的，可能它不包含任何内容，但更糟
糕的是，它可能包含一个半写的 JSON 片段。

由于程序员在检查并记录错误后忘记 return,损坏的缓冲区将被传递给 WriteAll ,这可
能会成功，因此配置文件将被错误地写入。但是，该函数返回的结果是正确的。

```go
func WriteConfig(w io.Writer, conf *Config) error {
	buf, err := json.Marshal(conf)
	if err != nil {
		log.Printf("could not marshal config: %v", err)
		// return err
		// oops，forgot to return
	}
	if err := WriteAll(w, buf); err != nil {
		log.Println("could not write config: %v", err)
		return err
	}
	return nil
}
```





日志记录与错误无关且对调试没有帮助的信息应被视为噪音，应予以质疑。

**记录的原因是因为某些东西失败了，而日志包含了答案。**

* The error has been logged.
* The application is back to 100% integrity.
* The current error is not reported any longer.



* 错误要被日志记录
* 应用程序处理错误，保证 100% 完整性。
* 之后不在报告当前错误



推荐使用`github.com/pkg/errors`包对 error 进行处理



```go
func ReadFile(path string) ([]byte, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, errors.Wrap(err, "open failed")
	}
	defer f.Close()
	buf, err := ioutil.ReadAll(f)
	if err != nil {
		return nil, errors.Wrap(err, "read failed")
	}
	return buf, nil
}
func ReadConfig() ([]byte, error) {
	home := os.Getenv("HOME")
	config, err := ReadFile(filepath.Join(home, ".settings，xm1"))
	return config, errors.WithMessage(err, " could not read config")
}

func main() {
	_, err := ReadConfig()
	if err != nil {
		fmt.Println(err)
		fmt.Printf("origin error:%T %v\n",errors.Cause(err),errors.Cause(err))
		fmt.Printf("stack trace:\n%+v\n",err)
		os.Exit(1)
	}
}
```

输出错误如下:

既有最底层的错误 os.PathError，也有上下文信息 open failed，还有堆栈信息。

```json
 could not read config: open failed: open .settings，xm1: The system cannot find the file specified.
origin error:*os.PathError open .settings，xm1: The system cannot find the file specified.
stack trace:
open .settings，xm1: The system cannot find the file specified.
open failed
main.ReadFile
	D:/Home/17x/Projects/i-go/training/error/wrap.go:15
main.ReadConfig
	D:/Home/17x/Projects/i-go/training/error/wrap.go:26
main.main
	D:/Home/17x/Projects/i-go/training/error/wrap.go:31
runtime.main
	D:/Program Files/Go/src/runtime/proc.go:203
runtime.goexit
	D:/Program Files/Go/src/runtime/asm_amd64.s:1373
 could not read config

Process finished with the exit code 1
```



### 小结

* 在你的应用代码中，使用 errors.New 或者 errors.Errorf 返回错误。
  * errors.New 或者  errors.Errorf  都会保存堆栈信息
* 如果调用其他保内的函数，通常简单的直接返回
* 如果和其他库进行协作，考虑使用 errors.Wrap 或者 errors.Wrapf 保存堆栈信息。同样适用于和标准库协作的时候。
* 直接返回错误，而不是每个错误产生的地方到处打日志
* 在程序的顶部或者是工作的 goroutine 顶部（请求入口），使用 `%+v` 把堆栈详情记录。
* 使用 errors.Cause 获取 root error，再进行和 sentinel error判定。

总结：

* Packages that are reusable across many projects only return root error values.
  * 选择 wrap error 是只有 applications 可以选择应用的策略。具有最高可重用性的包只能返回根错误值。此机制与 Go 标准库中使用的相同(kit库的sql. ErrNoRows)。
* If the error is not going to be handled, wrap and return up the call stack.
  * 这是关于函数/方法调用返回的每个错误的基本问题。如果函数/方法不打算处理错误，那么用足够的上下文 wrap errors 并将其返回到调用堆栈中。例如，额外的上下文可以是使用的输入参数或失败的查询语句。确定您记录的上下文是足够多还是太多的一个好方法是检查日志并验证它们在开发期间是否为您工作。
* Once an error is handled, it is not allowed to be passed up the call stack any
  longer.
  * 一旦确定函数/方法将处理错误，错误就不再是错误，如果函数/方法仍然需要发出返回，则它不能返回错误值。它应该只返回零(比如降级处理中，你返回了降级数据，然后需要return nil)。



## 4. Go 1.13 error



### Before 1.13

最简单的错误检查

```go
if err != nil{
    // something went wrong
}
```

有时我们需要对 sentinel error 进行检查

```go
var ErrNotFount=errors.New("not found")
if err == ErrNotFount{
    // something wasn't found
}
```

实现了 error interface 的自定义 error struct,进行断言使用获取更丰富的上下文

```go
type NotFountError struct{
    Name string
}
func(e *NotFountError)Error()string{
    return e.Name+": not found"
}
if e,ok:=err.(*NotFoundError);ok{
    // e.Name wasn't found
}
```

函数在调用栈中添加信息向，上传递错误，例如对错误发生时发生的情况的简要述。

```go
if err != nil {
	return fmt. Errorf("decompress %V: %v", name, err)
}
```

**使用 fmt.Errorf  创建新错误会丢弃原始错误中除文本外的所有内容**。正如我们在上面的 QueryError 中看到的那样，我们有时可能需要定义一个包含底层错误的新错误类型，并将其保存以供代码检查。这里是 QueryError:

```go
type QueryError struct {
	Query string
	Err error
}
```

程序可以查看 QueryError 值以根据底层错误做出决策。

```go
if e, ok := err. (*QueryError); ok && e.Err == ErrPermission {
// query failed because of a permission problem
}
```


### After 1.13

### Unwrap

go1.13 为 errors 和 fmt 标准库包引入了新特性，以简化处理包含其他错误的错误。其中最重要的是：**包含另一个错误的 error 可以实现返回底层错误的 Unwrap 方法**。如果 e1. Unwrap() 返回 e2，那么我们说 e1 包装 e2,您可以展开 e1 以获得 e2。
按照此约定，我们可以为上面的 QueryError 类型指定一个 Unwrap 方法，该方法返回其包含的错误:

```go
func (e *QueryError) Unwrap()error{
    return e.Err
}
```

go1.13 errors包包含两个用于检查错误的新函数: Is 和As。

```go
// Similar to:
// if err == ErrNotFound {}
if errors.Is(err, Er rNotFound) {
// something wasn't found
}
```

```go
// Similar to:
//if e, ok := err. (*QueryError); ok {... }
var e *QueryError
// Note: *QueryError is the type of the error.
if errors.As(err, &e) {
// err is a *QueryError, and e is set to the error's value
}

```

**Is 和 As 方法都会自动对 err 进行 Unwrap**，如果Unwrap后的err还可以Unwrap也会继续执行下去，一层一层最终获取到 root error

> 可以省去很多断言代码

```go
if errors.Is(err, ErrPermission) {
// err, or some error that it wraps, is a permission problem
}
```





如前所述，使用 fmt. Errorf 向错误添加附加信息,会丢掉原始错误信息：

```go
iferr!=nil{
	return fmt. Errorf("decompress %V: %v", name, err)
}
```

在 Go 1.13 中fmt. Errorf  支持新的`%w`谓词,w 即 wrap

```go
iferr!=nil{
	return fmt. Errorf("decompress %V: %w", name, err)
}
```

用 %w 包装错误可用于 errors.Is 以及 errors.As:

```go
err := fmt. Errorf("access denied: %w", ErrPermission)
if errors.Is(err, ErrPermission){
    // ...
}

```



`%w`大致实现如下，可以看到和 pkg/errors 包原理是一样的：

```go
type wrapError struct {
	msg str ing
	err error
}
func (e *wrapError) Error() string { 
	return e .msg
}

func (e *wrapError ) Unwrap( ) error {
	return e.err
}

```



### Customizing error tests with Is and As methods

自定义的 error 类型如何判断相等，Is 方法内部也是通过判断该 error 是否实现了 Is 接口，如果有就通过 Is 接口判断，没有则判断是否为同一个地址。

```go
func Is(err, target error) bool {
	if target == nil {
		return err == target
	}

	isComparable := reflectlite.TypeOf(target).Comparable()
	for {
		if isComparable && err == target {
			return true
		}
		if x, ok := err.(interface{ Is(error) bool }); ok && x.Is(target) {
			return true
		}
		// TODO: consider supporting target.Is(err). This would allow
		// user-definable predicates, but also may allow for coping with sloppy
		// APIs, thereby making it easier to get away with them.
		if err = Unwrap(err); err == nil {
			return false
		}
	}
}
```

关键代码如下：

```go
if x, ok := err.(interface{ Is(error) bool }); ok && x.Is(target) {
			return true
		}
```

所以我们自定义的 error 也可以实现自己的 Is 方法来进行判断是否相等。

```go
type Error struct {
	Path string
	User string
}
// 自定义 Is 方法实现自己的 判等逻辑
func (e *Error) Is(target error) bool {
    t, ok := target. (*Error)
    if !ok {
   	 return false
    }
	return (e.Path == t.Path || t.Path =="") &&
	(e.user == t.User || t.User == ""
}
if errors.Is(err, &Error{User: "someuser"}) {
// err's User field is "someuser".
}

```



```go
var ErrPermission = errors .New("pe rmission denied") 
// DoSomething returns an error wrapping ErrPermission if the user
// does not have permission to do something .
func DoSomething() error {
    if !userHasPermission() {
    // If we return ErrPe rmission directly, callers might come
    // to depend on the exact error value, writing code like this:
    //if err := pkg. DoSomething(); err == pkg. ErrPermission { .... }
    //
    // This will cause problems if we want to add additional
    // context to the error in the future. To avoid this, we
    // return an error wrapping the sentinel so that users must
    // always unwrap it:
    //
    // if err := pkg. DoSomething(); errors.Is(err, pkg. ErrPermission) { ... }
    return fmt. Errorf ("%w", ErrPermission)
// ...
}
```

* 该方法如果直接返回一个 ErrPermission，那么调用者就需要依赖使用 sentinel Error 进行判断；
* 而如果用 `%w` 包装后返回error，调用者直接使用 Is 就可以进行判断了。





## 5. Go 2 Error inspection

```sh
https://go.googlesource.com/proposal/+/master/design/29934-error-values.md
```



## 6. 小结

* Error Type
  * Sentinel Error
  * Error types
  * Opaque Errors

推荐使用 Opaque Errors ，使用行为断言（接口）而不是类型断言来判定错误。

* Handling Error
  * Wrap Errors

应用程序中需要对错误进行 Wrap，基础库则禁止 Wrap，因为用户调用基础库之后可能会对 Error 进行 Wrap 如果基础库内部也 Wrap 则会 Wrap 两次。

* Go 1.13 Errors
  * fmt %w
  * Is 和 As 方法

整体和 pkg/errors 相似



一个 Error 只处理一次，避免重复打日志。