# Effective Go

> [《Effective Go》原文](https://go.dev/doc/effective_go)
>
> [《Effective Go》中文](https://go-zh.org/doc/effective_go.html)
>
> [《Effective Go》中英双语版](https://github.com/bingohuang/effective-go-zh-en)



## Formatting

Go 使用 gofmt 工具进行代码格式化，以保证代码风格统一。

细节：

* tab 缩进
* 没有强制限制每行代码的长度
* 括号使用很少

## Commentary

Go 提供了两种注释：

* C 风格的 块注释 `/* */`

* C++ 风格的 行注释 `//` 



**包注释**

包注释一般使用 块注释风格。

go doc 会根据代码中的包注释来生成文档，所以建议给每个 package 都写上 包注释。

```go
/*
Package regexp implements a simple library for regular expressions.

The syntax of the regular expressions accepted is:

    regexp:
        concatenation { '|' concatenation }
    concatenation:
        { closure }
    closure:
        term [ '*' | '+' | '?' ]
    term:
        '^'
        '$'
        '.'
        character
        '[' [ '^' ] character-ranges ']'
        '(' regexp ')'
*/
package regexp
```



**文档注释**

注释一般以注释的对象开始,以英文句号`.`结束。

```go
// Compile parses a regular expression and returns, if successful,
// a Regexp that can be used to match against text.
func Compile(str string) (*Regexp, error) {
```





## Names

### Package names

包名应该简短、简洁。按照惯例，包名使用小写的单字名称。

> 包名只是导入时的默认名称，使用者可以自定义导入名称，所以不需要担心重名问题。

包名和目录的关系：

the package in `src/encoding/base64` is imported as `"encoding/base64"` but has name `base64`, not `encoding_base64` and not `encodingBase64`.



使用者使用导入的包名来引用包中的内容，所以包中的导出名字应该避免重复。

比如 `bufio` 包中的 buffered reader 叫做 `Reader `而不是 `BufReader`，因为这样导入者可以通过 `bufio.Readr` 来引用，而不是 `bufio.BufReader`。



### Getters

Go 中同样可以使用 Getter/Setter，只是**Getter 的名字没必要带上 get**。

例如某个结构体拥有一个未导出的 `owner` 字段，其Getter 一般叫做 Owner 而不是 GetOwner，Setter 则是 SetOwner。

```go
owner := obj.Owner()
if owner != user {
    obj.SetOwner(user)
}
```



### Interface names

单方法的接口名，一般是在方法名上增加 er 后缀，例如`Reader`, ``Writer`, `Formatter` 等等。

> 这样看到接口名就知道接口对应的方法了。

向`Read`, `Write`, `Close`, `Flush`, `String`这样的方法用于规范前面和含义：

* 为了避免混淆，自定的方法不要叫这些名字，除非有相同的含义和签名。相反；
* 如果你实现的方法和前面这些有相同的含义，那么应该使用相同的前面和方法。

> 比如把结构体转 string 的方法，应该叫做 String 而不是 ToString。





### MixedCaps

Go 惯例是使用 大驼峰或者小驼峰而不是下划线。



### Semicolons

和 C 一样，Go 语法中也是使用分号来分割语句，但是 Go 的分号由词法分析器添加，所以一般不会出现在 Go 源码中。

> Go 源码中只有 for 循环会用到分号。

具体规则是：

在 Go 代码中，注释除外，如果一个代码行的最后一个语法词段（token）为下列所示之一，则一个分号将自动插入在此字段后（即行尾）：

* 一个标识符

* 一个整数、浮点数、虚部、码点或者字符串字面表示形式

* 或者这些 token：`break continue fallthrough return ++ -- ) }`中的一个

根据这个规则可以知道，在 Go 中不能把控制结构的开括号放到下一行，例如：

```go
if i < f()  // wrong! 这里会被自动插入一个分号
{           // wrong!
    g()
}

if i < f() { // 这样就没问题了
    g()
}
```



## Control structures

Go 中的控制结构和 C 类似，但也有不同：

* 没有 `while` 循环，只有 `for`
* `if` 、 `switch`、  `for`都可以添加一个初始化语句。
* `break` 和 `continue` 接收一个可选的标签，来指定 `break` 或 `continue` 到哪儿。
* 一个新的控制结构：select
  * type switch
  * multiway communications multiplexer





### If

在 Go 中，一个简单的 if 语句看起来像这样：

```go
if x > 0 {
	return y
}
```

首先是条件不需要括号包裹起来；

其次则是必须要用大括号把执行体包裹起来。

> Go 中推荐这种风格，因为在主体中包含 return 或 break 等控制语句时能清晰的知道控制范围。



**设置局部变量**

而且可以接收一个初始化语句，一般用于设置局部变量，就像这样：

```go
if err := file.Chmod(0664); err != nil {
	log.Print(err)
	return err
}
```

相比于下面这个写法，上面的看起来会简洁一些。

```GO
err := file.Chmod(0664)
if err != nil {
	log.Print(err)
	return err
}
```

如果是局部变量则推荐使用前者。



**省略else**

如果 if 后的下一条语句不会被执行时(比如 if 中执行了 return、continue、break、goto 等语句)，就可以省略后续的 else，就像这样：

```go
f, err := os.Open(name)
if err != nil {
    return err
}
codeUsing(f)
```

如果不省略，就像这样：

```go
f, err := os.Open(name)
if err != nil {
    return err
}else{
    codeUsing(f)
}
```

多了一个嵌套层级，看着不够优雅。





### Redeclaration and reassignment

比如下面这个例子：

```go
f, err := os.Open(name)
if err != nil {
    return err
}
d, err := f.Stat()
if err != nil {
    f.Close()
    return err
}
codeUsing(f, d)
```

在第一行`f, err := os.Open(name)` 通过 `:=`声明并给 err 变量赋值了。

然后第五行`d, err := f.Stat()` 又用了`:=`，好像又声明了一次 err 变量。

看起来是重复声明了，实际上这种写法是合法的，第一行声明了 err，而第五行只是给 err 重新赋值了。

> 也就是说，调用 f.Stat 使用的是前面已经声明的 err，它只是被重新赋值了而已。

在满足下列条件时，已被声明的变量 v 可出现在:= 声明中：

- 本次声明与已声明的 v 处于同一作用域中（若 v 已在外层作用域中声明过，则此次声明会创建一个新的变量 §），
- 在初始化中与其类型相应的值才能赋予 v，且在此次声明中至少另有一个变量是新声明的。

这种写法在 长 if-else 链中比较常见，整个 if-else 链中可以只使用一个 err 变量。



### For

Go 的 for 循环类似于 C，但却不尽相同。它统一了 for 和 while，不再有 do-while 了。它有三种形式，但只有一种需要分号。

```go
// Like a C for
for init; condition; post { }

// Like a C while
for condition { }

// Like a C for(;;)
for { }
```

若你想遍历数组、切片、字符串或者映射，或从 channel 中读取消息， range 子句能够帮你轻松实现循环。

```go
for key, value := range oldMap {
	newMap[key] = value
}
```

若你只需要该遍历中的第一个项（键或下标），去掉第二个就行了：

```go
for key := range m {
	if key.expired() {
		delete(m, key)
	}
}
```

若你只需要该遍历中的第二个项（值），请使用空白标识符，即下划线来丢弃第一个值：

```go
sum := 0
for _, value := range array {
	sum += value
}
```

对于字符串，range 能够提供更多便利。它能通过解析 UTF-8， 将每个独立的 Unicode 码点分离出来。

> 错误的编码将占用一个字节，并以符文 U+FFFD 来代替

```go
for pos, char := range "日本 \x80 語" { // \x80 is an illegal UTF-8 encoding
	fmt.Printf("character %#U starts at byte position %d\n", char, pos)
}

character U+65E5 '日' starts at byte position 0
character U+672C '本' starts at byte position 3
// 无效字符 \x80 被替换成了 U+FFFD，而且只占用一个字节
character U+FFFD '�' starts at byte position 6
character U+8A9E '語' starts at byte position 7
```

最后，Go 没有逗号操作符，并且 ++ 和 -- 为语句而非表达式。 因此，若你想要在 for 中使用多个变量，应采用 parallel assignment，就像这样：

```go
// Reverse a
for i, j := 0, len(a)-1; i < j; i, j = i+1, j-1 {
	a[i], a[j] = a[j], a[i]
}

// 这样则会提示语法错误
for i, j := 0, len(a)-1; i < j; i++,j++; {
    a[i], a[j] = a[j], a[i]
}
```



### Switch

Go 的 switch 比 C 的更通用。其表达式无需为常量或整数，case 语句会自上而下逐一进行求值直到匹配为止。若 switch 后面没有表达式，它将匹配 true，因此，我们可以将 if-else-if-else 链写成一个 switch，这也更符合 Go 的风格。

```go
func unhex(c byte) byte {
	switch {
	case '0' <= c && c <= '9':
		return c - '0'
	case 'a' <= c && c <= 'f':
		return c - 'a' + 10
	case 'A' <= c && c <= 'F':
		return c - 'A' + 10
	}
	return 0
}
```



Go switch 中的 case 可通过逗号分隔来列举相同的处理条件。

```go
func shouldEscape(c byte) bool {
	switch c {
	case ' ', '?', '&', '=', '#', '+', '%':
		return true
	}
	return false
}
```

break 可以退出 switch，如果加上 label 还可以直接 break 出整个循环：

```go
Loop:
	for n := 0; n < len(src); n += size {
		switch {
		case src[n] < sizeOne:
			if validateOnly {
				break
			}
			size = 1
			update(src[n])

		case src[n] < sizeTwo:
			if n+1 >= len(src) {
				err = errShortInput
				break Loop
			}
			if validateOnly {
				break
			}
			size = 2
			update(src[n] + src[n+1]<<shift)
		}
	}
```



### Type switch

switch 也可用于判断接口变量的动态类型。如 类型选择 通过圆括号中的关键字 type 使用类型断言语法` t.(type)`:

```go
var t interface{}
t = functionOfSomeType()
switch t := t.(type) {
default:
	fmt.Printf("unexpected type %T", t)       // %T 输出 t 是什么类型
case bool:
	fmt.Printf("boolean %t\n", t)             // t 是 bool 类型
case int:
	fmt.Printf("integer %d\n", t)             // t 是 int 类型
case *bool:
	fmt.Printf("pointer to boolean %t\n", *t) // t 是 *bool 类型
case *int:
	fmt.Printf("pointer to integer %d\n", *t) // t 是 *int 类型
}
```



## Functions

### Multiple return values

**Go 中的函数和方法可以有多返回值**。

这个特性可以解决很多问题，比如 C 中一般通过返回 -1 来标记错误，在 Go 中就可以直接返回一个 err 来标记错误：

```GO
func (file *File) Write(b []byte) (n int, err error)
```





### Named result parameters

Go 函数的返回值或结果 “形参” 可被命名，并作为常规变量使用，就像传入的形参一样。

* 命名后，一旦该函数开始执行，它们就会被初始化为与其类型相应的零值； 
* 若该函数执行了一条不带实参的 return 语句，则结果形参的当前值将被返回。



命名不是强制的，**但它们能使代码更加简短清晰**，特别是返回多个同类型的参数时，比如这样：

```go
func nextInt(b []byte, pos int) (value, nextPos int)
```

通过命名我们可以不看具体实现就能知道每个返回值的含义。

而如果不命名返回值，就只能看具体实现了，就像下面这样

```go
func nextInt(b []byte, pos int) (int,int)
```

> 如果我们使用普通返回值，那么我们想要知道返回值的含义，就需要先阅读函数体中完整代码。
>
> 而如果使用具有实际含义的命名返回值，我们只需要阅读函数或方法的签名，就可以知道其含义，甚至可以把它们作为文档使用。



另外命名+裸返回(Naked Return) 可以使得代码更加简洁：

```go
func ReadFull(r io.Reader, buf []byte) (n int, err error) {
	for len(buf) > 0 && err == nil {
		var nr int
		nr, err = r.Read(buf)
		n += nr
		buf = buf[nr:]
	}
	return
}
```

如果使用 unamed 则是这样的，可以看到多了几行代码：

> 虽然只是几行，但是对于这种简单的函数来说已经是多了1/3了。

```go
func ReadFull(r io.Reader, buf []byte) (int, error) {
	var (
		n   int
		err error
	)
	for len(buf) > 0 && err == nil {
		var nr int
		nr, err = r.Read(buf)
		n += nr
		buf = buf[nr:]
	}
	return n, err
}
```



注意：**命名返回值和匿名返回值，在和 defer 搭配时的效果是不一样的。**



最佳实践：

* 返回值比较多可以使用 Named result parameters 提升可读性
* 简单函数可以使用 Named result parameters + Naked return 让函数根据简洁

具体参考：

> [https://go.dev/tour/basics/7](https://go.dev/tour/basics/7)
>
> Naked return statements should be used only in short functions, as with the example shown here. They can harm readability in longer functions.
>
> 裸返回（Naked return）只应该在 short functions 中使用，在 longer functions 中则会降低可读性。



### Defer

Go 中的 defer 会在当前函数返回前立即执行，常见的用法是在 defer 中释放资源，比如解互斥锁或关闭文件。

多个 defer 会以 LIFO 的顺序执行。

优点：

* 它能保证你不会忘记释放资源
  * 比如新增 if 或者 else 路径后，可能就会忘记关闭资源，使用 defer 则不存在这种问题。
* 资源的打开和关闭挨在一起，更加清晰



比如下面这个函数，如果不使用 defer，则需要在每个 return 之前关闭文件，如果后续新增了分支，很可能就会忘记关闭文件。

```go
// Contents returns the file's contents as a string.
func Contents(filename string) (string, error) {
	f, err := os.Open(filename)
	if err != nil {
		return "", err
	}
	defer f.Close()  // f.Close will run when we're finished.

	var result []byte
	buf := make([]byte, 100)
	for {
		n, err := f.Read(buf[0:])
		result = append(result, buf[0:n]...) // append is discussed later.
		if err != nil {
			if err == io.EOF {
				break
			}
			return "", err  // f will be closed if we return here.
		}
	}
	return string(result), nil // f will be closed if we return here.
}
```





利用 defer 的特性，可以很方便的记录每个 func 的执行时间，就像这样：

```go
// Trace 记录func运行时间
func Trace(msg string) func() {
	start := time.Now()
	logrus.Printf("-------------------------enter %s--------------------------", msg)
	return func() {
		logrus.Printf("--------------------exit %s (%s)--------------------", msg, time.Since(start))
	}
}

func MyFunc(){
    defer Trace("MyFunc")()
}

// 输出
time="2022-01-05T13:38:03+08:00" level=info msg="-------------------------enter
MyFunc--------------------------"
time="2022-01-05T13:38:03+08:00" level=info msg="--------------------exit MyFunc
 (40.8648ms)--------------------"

```





## Data

### Allocation with `new`

Go 提供了两种分配原语，即内建函数 `new` 和 `make`。

new(T) 会为类型为 T 的新项分配已置零的内存空间， 并返回它的地址，也就是一个类型为 `*T` 的值。

> 用 Go 的术语来说，它返回一个指针， 该指针指向新分配的，类型为 T 的零值。

因为有的类型零值也是有意义的，所以就不需要再初始化了。比如 `bytes.Buffer`、`sync.Mutex`：

* bytes.Buffer 零值是一个空的 buffer
* sync.Mutex 零值是一个 unlock 状态的 mutex

所以如果我们的自定义类型的零值是可用的，也可以直接用 `new` 来初始化

```go
type SyncedBuffer struct {
    lock    sync.Mutex
    buffer  bytes.Buffer
}
p := new(SyncedBuffer)  // type *SyncedBuffer
var v SyncedBuffer      // type  SyncedBuffer
```



### Constructors and composite literals

如果零值无法直接使用，就需要一个初始化构造函数。

```go
func NewFile(fd int, name string) *File {
	if fd < 0 {
		return nil
	}
	f := new(File)
	f.fd = fd
	f.name = name
	f.dirinfo = nil
	f.nepipe = 0
	return f
}
```

这里显得代码过于冗长。我们可通过复合字面量来简化它：

```go
func NewFile(fd int, name string) *File {
    if fd < 0 {
        return nil
    }
    f := File{fd, name, nil, 0}
    return &f
}
```

实际上，每次计算复合字面量的地址时都会分配一个新实例，所以可以合并最后两句：

```go
func NewFile(fd int, name string) *File {
    if fd < 0 {
        return nil
    }
    return &File{fd, name, nil, 0}
}
```

复合字面量的字段必须按顺序全部列出,也可以按 field:value 对的形式指定给某些字段赋值：

```go
return &File{fd: fd, name: name}
```



和 C 不同，Go 里面可以返回局部变量的地址，这个变量并不会在函数调用完成后被销毁。

> 这也是内存逃逸的一种场景。



### Allocation with `make`

make 只用于创建 slices, maps 和 channels ，并返回类型为 T（而非 `*T`）的一个已初始化 （而非置零）的值。

> 因为这三种类型本质上为引用数据类型，它们在使用前必须初始化。

比如 slice 实际由以下三部分组成：

```go
type SliceHeader struct {
	Data uintptr
	Len  int
	Cap  int
}
```

再这3个字段被初始化前，slice 都是 nil。

make 习惯用法如下：

```go
v := make([]int,100)
```





### Arrays

在 Go 中，

- 数组是值。将一个数组赋予另一个数组会复制其所有元素。
- 特别地，若将某个数组传入某个函数，它将接收到该数组的一份副本而非指针。
- 数组的大小是其类型的一部分。类型 [10]int 和 [20]int 是不同的。

Go 中数组使用较少，一般都是用的 slice，不过数组也有自己的优点：

* 数组是值对象，可以进行比较，可以将数组用作 map 的映射键
  * 切片不能比较，也无法作为 map 的映射键。

* 数组有编译安全的检查，可以在早期就避免越界行为
  * 切片是在运行时才会出现越界的 panic

* 数组可以更好地控制内存布局，若拿切片替换，会发现不能直接在带有切片的结构中分配空间，数组可以。

* 数组在访问单个元素时，性能比切片好。

* 数组的长度，是类型的一部分。在特定场景下具有一定的意义。

* 数组是切片的基础，每个数组都可以是一个切片，但并非每个切片都可以是一个数组。如果值是固定大小，可以通过使用数组来获得较小的性能提升(至少节省 slice 头占用的空间)。



内存布局：

```go
type TGIHeader struct { 
    _        uint16 // Reserved 
    _        uint16 // Reserved 
    Width    uint32 
    Height   uint32 
    _        [15]uint32 // 15 "don't care" dwords 
    SaveTime int64 
} 
```

其中的`[15]uint32`就起到内存布局的作用。

因为业务需求，我们需要实现一个格式，其中格式是 "TGI"(理论上的Go Image)，头包含这样的字段：

- 有 2 个保留字(每个16位)。
- 有 1 个字的图像宽度。
- 有 1 个字的图像高度。
- 有 15 个业务 "不在乎 "的字节。
- 有 1 个保存时间，图像的保存时间为8字节，是自1970年1月1日UTC以来的纳秒数。

这么一看，也就不难理解数组的在这个场景下的优势了。定长，可控的内存，在计划内存布局时非常有用。





### Slices

切片是对数组的封装，更加通用和方便。

需要注意的是 切片提供了裁剪语法：

```go
// buf2中只包含 buf 的前32个元素
buf2:=buf[0:32]
```

虽然可以通过裁剪得到新元素，但是二者还是共用一个底层数组。

> 即上面例子中修改buf2还是会影响到buf



还有切片扩容后会创建一个新的底层数组，并将元素从旧数组中拷贝过去。

正是因为有开辟新数组的可能，所以每次 append 的结果都需要用一个变量来接收，因为可能 append 后返回的不在是以前那个 Slice 了。



### Maps

与切片一样，map 也是引用类型。

map 可使用一般的复合字面语法进行构建，其键 - 值对使用逗号分隔，因此可在初始化时很容易地构建它们。

```go
var timeZone = map[string]int{
	"UTC":  0*60*60,
	"EST": -5*60*60,
	"CST": -6*60*60,
	"MST": -7*60*60,
	"PST": -8*60*60,
}
```

从 map 中取值会返回两个参数：

```go
seconds, ok = timeZone[tz]
```

参数1为 key 对应的 value，参数2表示map中是否存在该key。

参数2主要用户区分零值的情况，key 不存在时，取值会放回零值。



### Print

```go
fmt.Printf("Hello %d\n", 23)
fmt.Fprint(os.Stdout, "Hello ", 23, "\n")
fmt.Println("Hello", 23)
fmt.Println(fmt.Sprint("Hello ", 23))
```

* %+v 会为结构体的每个字段添上字段名；

* 而 %#v 将完全按照 Go 的语法打印值。

若你想控制自定义类型的默认格式，只需为该类型定义一个具有 String() string 签名的方法。对于我们简单的类型 T，可进行如下操作。

```go
func (t *T) String() string {
	return fmt.Sprintf("%d/%g/%q", t.a, t.b, t.c)
}
fmt.Printf("%v\n", t)
```



注：**不要通过调用 Sprintf 来构造自定义类型的 String 方法**，因为它会无限递归你的的 String 方法。

> 因为 Sprintf 需要调用自定义类型的 String 方法把我们的自定义类型转成字符串形式。
>
> 如果 String 中又使用了 Sprintf 则会无限循环递归调用。

比如下面这个例子：

```go
type MyString string

func (m MyString) String() string {
    // Sprintf 会调用 m 的 String 方法把 m 转成字符串
   // 然后 String 方法又调用了 Sprintf 就会无限循环
	return fmt.Sprintf("MyString=%s", m) // Error: will recur forever.
}
func (m MyString) String() string {
    // 手动转成string类型 则 Sprintf 不会调用 String 方法
	return fmt.Sprintf("MyString=%s", string(m)) // OK: note conversion.
}
```



### Append

```go
func append(slice []T, elements ...T) []T
```

append 会在切片末尾追加元素并返回结果。

```go
x := []int{1,2,3}
x = append(x, 4, 5, 6)
fmt.Println(x)
```

如果想将一个切片追加到另一个切片中，很简单：在调用的地方使用 ...，就像这样：

```go
x := []int{1,2,3}
y := []int{4,5,6}
x = append(x, y...) // 添加...即可
fmt.Println(x)
```





## Initialization

### Constants

Go 中的常量就是常量，在编译时被创建，即使是定义成了局部变量。而由于编译时的限制，常量只能是 数字、字符、字符串和布尔。或者是能被编译器求值的常量表达式，比如`1 << 3 `是常量表达式，而`math.Sin(math.Pi/4)`则不是，因为 math.Sin 函数需要在运行时调用。

同时Go中提供了iota用于创建枚举常量，就像这样：

```go
type ByteSize float64

const (
    _           = iota // ignore first value by assigning to blank identifier
    KB ByteSize = 1 << (10 * iota)
    MB
    GB
    TB
    PB
    EB
    ZB
    YB
)
```





### Variables

变量和常量类似，不过变量的初始化语句可以是在运行时计算的表达式。

```go
var (
    home   = os.Getenv("HOME")
    user   = os.Getenv("USER")
    gopath = os.Getenv("GOPATH")
)
```





### The init function

Go 中每个文件都可以定义 0个或多个 init 方法来做初始化的工作。

比如：

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

init 方法在 package 被导入时就会执行。

社区比较推崇显式初始化，所以一般除了 main 文件其他地方不建议用 init  方法，因为这是对调用者透明的。



### Order

Go 中初始化顺序如下：

package、const、var、init()、main。

即先导包，按照import顺序，从上往下初始化。

main.go 中先后导入了A、B两个包，则先初始化A，A中又导入了其他包则继续初始化A中导入的包，A导包结束后，在a中按const、var、init()顺序初始化，至此，A初始化完成，继续初始化B，B结束后，在轮到main.go 初始化，同样是const、var、init()、main这个顺序。

如图所示：

![](https://img-blog.csdn.net/20180829114922652?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L2x1bmh1aTE5OTRf/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)



> [Go init 顺序](https://blog.csdn.net/lunhui1994_/article/details/82181056)

即最底层依赖需要最先初始化。







## Methods

### Pointers vs. Values

在 Go 中我们可以为任何已命名的类型（除了指针或接口）定义方法； 接收者可不必为结构体。

指针接收者或值接收者的区别在于：**值方法可通过指针和值调用， 而指针方法只能通过指针来调用**。

> 可以通过指针调用值接收方法是因为编译器的语法糖，实际是对指针解引用后通过值来调用的。而值不能调用指针接收者，是有的值是不可取地址的。


### 包装方法

实际上编译器有时候还会生成值方法的**包装方法**。

> 即：在编译时为值接收者的方法，生成一个指针接收者的方法。

**主要是为了满足使用 interface 来调用的情况**。

因为 interface 是动态类型，调用值接收方法时需要根据 interface 中的data 指针找到数据并拷贝到栈上去，但是不知道具体类型，所以不能在编译生成相关拷贝数据的指令，导致interface直接不能用值接收者方法。

因此需要在编译时生成指针接收者方法，因为地址不需要指定具体类型，大小也都是一样的，就没有这个问题。



但是并不是所有值接收者方法都会被 interface 调用，所以不会在可执行文件中给全部值接收者方法生成包装方法，编译器也会自动裁剪掉那些用不上的包装方法。

> 但是如果代码中是通过反射在调用，编译器就无法判断是否有用了，所以都会保留下来。





## Interfaces and other types

### Interfaces

 if something can do *this*, then it can be used here。

Go 中的 interface 是一组方法的集合也是一种类型，只有实现了集合中的方法，就可以说是这个类型。

比如下面的`MyError`结构实现了 error interface 中的 Error 方法，因此 MyError 就实现了 error 接口，MyError 就可以当做是 error 类型来用。

```go
type error interface {
	Error() string
}
type MyError struct {
	Err string
	Msg string
}

func (m MyError) Error() string {
	return m.Err
}
```



Go 中实现接口不像 Java 需要显式的 implement，Go 的接口实现都是隐式的，更加灵活。

> 可以让接口定义方和实现方解耦。



### Conversions

Go 中可以通过`type(xxx)`的方式，进行类型转换，Go 中通常会使用类型转换的方式来访问不同的方法集。

例如：

```go
type Sequence []int

// Methods required by sort.Interface.
func (s Sequence) Len() int {
    return len(s)
}
func (s Sequence) Less(i, j int) bool {
    return s[i] < s[j]
}
func (s Sequence) Swap(i, j int) {
    s[i], s[j] = s[j], s[i]
}

func (s Sequence) String() string {
    // Sequence 实现了 sort.Interface 因此可以排序
	sort.IntSlice(s).Sort()
    // 将s从Sequence类型转为[]int类型，[]int 类型实现了String方法，因此 Sequence 类型就可以不用在实现 String方法了。
	return fmt.Sprint([]int(s))
}
```



### Interface conversions and type assertions

**Interface conversions**

Type switchs 也是类型转换的一种。

它接受一个接口，在 switch 中根据其判断选择对应的 case， 并在某种意义上将其转换为该种类型：

```go
type Stringer interface {
	String() string
}

var value interface{} // Value provided by caller.
switch str := value.(type) {
case string:
	return str
case Stringer:
	return str.String()
}
```

如果是 string 类型则直接返回，如果是 Stringer 类型则调用 String 方法转为 string 后在返回，这种方式对于混合类型来说非常完美。



**type assertions**

如果已经知道是某种类型了，就可以直接使用`value.(typeName)`语法提取，就像这样：

```go
str := value.(string)
```

然后，这种写法如果转换失败则会 panic，为避免这种情况，需要使用以下写法，它能安全地判断该值是否为字符串：

```go
str, ok := value.(string)
if ok {
	fmt.Printf("string value is: %q\n", str)
} else {
	fmt.Printf("value is not a string\n")
}
```

若类型断言失败，则 ok 为 false，str 为零值。



### Generality

Go 中接口的灵活实现可以使得我们不暴露具体实现，而仅对外暴露接口。对调用者可以专注于接口而非具体实现，对提供者则可以避免在每个具体实现上重复编写文档。

> 若返回具体实现，调用者则需要关注该类型具体实现了哪些方法，若返回接口则一眼能看出该接口有哪些方法。



例如在 hash 库中，crc32.NewIEEE 和 adler32.New 都返回接口类型 hash.Hash32。要在 Go 程序中用 Adler-32 算法替代 CRC-32， 只需修改构造函数调用即可，其余代码则不受算法改变的影响。

```go
type Hash32 interface {
	Hash
	Sum32() uint32
}

// crc32.NewIEEE
func New(tab *Table) hash.Hash32 {
	if tab == IEEETable {
		ieeeOnce.Do(ieeeInit)
	}
	return &digest{0, tab}
}

// adler32.New
func New() hash.Hash32 {
	d := new(digest)
	d.Reset()
	return d
}
```



### Interfaces and methods

由于几乎任何类型都能添加方法，而只要实现了接口中的方法就算实现了接口，因此几乎任何类型都能满足一个接口。

例如 http 包中，只要实现了 Handler 接口中的 ServeHTTP 方法就能用于处理 http 请求。

```go
type Handler interface {
    ServeHTTP(ResponseWriter, *Request)
}
```

就像这样：

```go
// Simple counter server.
type Counter struct {
	n int
}

func (ctr *Counter) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	ctr.n++
	fmt.Fprintf(w, "counter = %d\n", ctr.n)
}
```

具体调用：

```go
import "net/http"
...
ctr := new(Counter)
http.Handle("/counter", ctr)
```





## The blank identifier

### The blank identifier in multiple assignment

空白标识符`_`在 Go 中的作用，有点像Unix 系统中往`/dev/null` 文件里写数据。它表示只写的值，在需要变量但不需要实际值的地方用作占位符。

> 一般用于丢弃某个值

比如在 for range 中丢弃 index：

```go
for _, v := range list {

}
```

当然也可以用来丢弃错误：

```go
// Bad! This code will crash if path does not exist.
fi, _ := os.Stat(path)
if fi.IsDir() {
	fmt.Printf("%s is a directory\n", path)
}
```

不过这是非常不推荐的写法，在 Go 中每个错误都尽量检查一下。



### Unused imports and variables

在 Go 中导入某个包或声明变量后，如果未使用则会报错。

> 未使用的包会让程序膨胀并拖慢编译速度， 而已初始化但未使用的变量不仅会浪费计算能力，还有可能暗藏着更大的 Bug。



```go
package main

import (
    "fmt"
    "io"
    "log"
    "os"
)

func main() {
    fd, err := os.Open("test.go")
    if err != nil {
        log.Fatal(err)
    }
    // TODO: use fd.
}
```

比如上述代码中由于逻辑未完全实现，导致导入的`fmt`和`io`两个包没有使用到，而产生了错误，此时可以这样处理：

```go
var _ = fmt.Printf // For debugging; delete when done.
var _ io.Reader    // For debugging; delete when done. 
```

定义两个变量，使得这个两个包被使用，然后再用空白标识符解决变量未使用的问题。



### Import for side effect

有时候导入某个包只想用到里面的`init`方法，并不会调用其他功能，比如`pprof`，此时就需要用到空白标识符使其不报错：

```go
import (
	_ "net/http/pprof"
)
```



### Interface checks

Go 中接口非常灵活，只需要使用接口中的方法即可。但是有时候接口定义和实现离得比较远，或者接口中方法较多，很难一眼看出某个类型是否实现了该接口。



**大部分接口转换都是静态的**，因此会在编译时检测。 例如，将一个 `*os.File` 传入一个接收 io.Reader 的函数将无法通过编译， 除非 `*os.File` 实现了 io.Reader 接口。



**但是有的接口检查会在运行时进行**，例如，[encoding/json](https://go-zh.org/pkg/encoding/json/) 包定义了一个 [Marshaler](https://github.com/bingohuang/effective-go-zh-en/blob/master/Marshaler) 接口。当 JSON 编码器接收到一个实现了该接口的值，那么该编码器就会调用该值的编组方法， 将其转换为 JSON，而非进行标准的类型转换。 编码器在运行时通过 [类型断言](https://go-zh.org/doc/effective_go.html#interface_conversions) 检查其属性，就像这样：

```go
m, ok := val.(json.Marshaler)
```

而如果该类型没有实现这个接口，就不能把值转成 JSON 格式。

为了避免这种问题，可以**手动增加一个静态转换来进行接口转换检测**，就像这样：

```go
var _ json.Marshaler = (*RawMessage)(nil)
```

如果 *RawMessage 没有实现 json.Marshaler 接口在编译时就会被检测出来。

> 在这个声明中出现空白标识符，即表示该声明的存在只是为了类型检查。

**但是不要每个接口都这样用，只有不存在静态类型转换时才需要这种声明来检测。**



## Embedding

Go 中 提倡组合，不提倡继承。

> 当然，Go 中也没有继承。



### 组合与继承

组合一般理解为 has-a 的关系，继承是 is-a 的关系，两者都能起到代码复用的作用。

```go
继承的优缺点
优点：
1，类继承简单粗爆，直观，关系在编译时静态定义。
2，被复用的实现易于修改，sub可以覆盖super的实现。
缺点：
1，无法在运行时变更从super继承来的实现（也不一定是缺点）
2，sub的部分实现通常定义在super中。
3，sub直接面对super的实现细节，因此破坏了封装。
4，super实现的任何变更都会强制子类也进行变更，因为它们的实现联系在了一起。
5，如果在新的问题场景下继承来的实现已过时或不适用，所以必须重写super或继承来的实现。
由于在类继承中，实现的依存关系，对子类进行复用可能会有问题。有一个解决办法是，只从协议或抽象基类继承(子类型化)，国为它们只对很少的实现，而协议则没有实现。

组合的优缺点
对象组合让我们同时使用多个对象，而每个对象都假定其他对象的接口正常运行。因此，为了在系统中正常运行，它们的接口都需要经过精心的设计。下面我就来说说他的优缺点
优点：
1，不会破坏封装，因为只通过接口来访问对象；
2，减少实现的依存关系，因为实面是通过接口来定义的；
3，可以在运行时将任意对象替换为其他同类型的对象；
4，可以保持类的封装以专注于单一任务；
5，类和他的层次结构能保持简洁，不至于过度膨胀而无法管理；
缺点：
1，涉及对象多；
2，系统的行为将依赖于不同对象间的关系，而不是定义于单个类中；
3，现成的组件总是不太够用，从而导致我们要不停的定义新对象。
```



小结，组合相对于继承的优点在于：

* 1）可以利用面向接口编程原则的一系列优点，封装性好，耦合性低
* 2）相对于继承的编译期确定实现，组合的运行态指定实现，更加灵活
* 3）组合是非侵入式的，继承是侵入式的



Go 中提供的结构体嵌入语法就是组合的一种，通过嵌入(组合)可以让代码更加灵活。

比如 io.Reader 和 io.Writer 接口：

```go
type Reader interface {
	Read(p []byte) (n int, err error)
}

type Writer interface {
	Write(p []byte) (n int, err error)
}
```

如果需要定义一个有 Read 和 Write 方法的接口只需要这样：

```go
// ReadWriter is the interface that combines the Reader and Writer interfaces.
type ReadWriter interface {
	Reader
	Writer
}
```

这样 ReadWriter 就包含了Read 和 Write 方法。



结构体也类似：

```go
// ReadWriter stores pointers to a Reader and a Writer.
// It implements io.ReadWriter.
type ReadWriter struct {
	*Reader  // *bufio.Reader
	*Writer  // *bufio.Writer
}
```

ReadWriter 接口体中嵌入了`*bufio.Reader`和`*bufio.Writer`，而`*bufio.Reader`和`*bufio.Writer`又分别实现了`Read`、`Write`接口。这样

ReadWriter 结构体也就实现了 `Read`、`Write`接口，同样也实现了上面的`ReadWriter`接口。



### 匿名嵌入和有名嵌入

结构体嵌入分类有名嵌入和匿名嵌入，比如：

```go
// 匿名嵌入
type ReadWriter1 struct {
	*Reader  // *bufio.Reader
	*Writer  // *bufio.Writer
}

// 有名嵌入
type ReadWriter2 struct {
	reader *Reader // *bufio.Reader
	writer *Writer // *bufio.Writer
}
```

匿名嵌入和有名嵌入最大区别在于：**二者调用方法的方式不同**。

匿名嵌入可以直接通过结构体进行调用：

```go
rw:=ReadWriter1{xxx} // 初始化
rw.Read() // 直接调用，就像 ReadWriter1 结构体本身就实现了 Read 方法一样。
rw.Write()
```

而有名嵌入则需要通过具体字段来调用：

```go
rw:=ReadWriter2{xxx} // 初始化
rw.reader.Read() // 需要通过reader字段才能调用Read方法
rw.writer.Write()
```



根据调用方式可以知道，使用有名嵌入的ReadWriter2结构体本身其实是没有Read和Write方法，因此也就没有实现ReadWriter接口。

需要手动进行包装：

```go
func (rw *ReadWriter2) Read(p []byte) (n int, err error) {
	return rw.reader.Read(p)
}

func (rw *ReadWriter2) Write(p []byte) (n int, err error){
	return rw.writer.Write(p)
}
```

这样才能当做 ReadWriter 接口使用，而匿名嵌入则没有这个问题。



当然也不能任何地方都用匿名嵌入，因为匿名嵌入存在一个问题：由于没有给字段指定名字，若字段名冲突时则会被覆盖掉。

覆盖规则为：**外层覆盖内层，若同层则会报错**。

外层覆盖内层：

```go
type T1 struct {
	Name string
}
type T2 struct {
	T4
	Age string
}
type T4 struct {
	Age string
}

type T3 struct {
	Name string
	T1
	T2
}

func main() {
	t := T3{
		Name: "name-t3",
		T1: T1{
			Name: "name-t1",
		},
		T2: T2{
			T4: T4{
				Age: "age-t4",
			},
			Age: "age-t2",
		},
	}
	fmt.Println("name:", t.Name) // name-t3
	fmt.Println("age:", t.Age) // age-t2
}
```

根据输出可以看到：

* T1 中的 Name 被 T3 的 Name 覆盖了
* T4 中的 Age 被 T2 中的 Age 覆盖了

即：**外层覆盖内层**。



```go
// 同层嵌入字段冲突，定义时就报错
type Reader struct {
	io.Reader
	bufio.Reader
}
// 若是内层嵌入了同名字段则会在调用时才报错
// 意味着如果不会使用这些字段，就不会报错
type T1 struct {
	Name string
}
type T2 struct {
	Name string
}
type T3 struct {
	T1
	T2
}

func main() {
    t:=T3{xxx} // 初始化
    fmt.Println("name:", t.Name) // 报错：ambigouos reference 'Name'
}
```

小结：

* 最外层冲突直接报错
* 内层冲突则在用到该字段时才报错。



## Concurrency

Go 中的口号是：

> Do not communicate by sharing memory; instead, share memory by communicating.
>
> 不要通过共享内存来通信，而应通过通信来共享内存。



Go 中利用 channel 来共享变量，以实现访问控制。若将通信(communication )看做同步器(synchronizer)， 那就完全不需要其它同步(synchronization)了。例如，Unix 管道就与这种模型完美契合。

> if the communication is the synchronizer, there's still no need for other synchronization

虽然 Go 的并发处理方式来源于Communicating Sequential Processes (CSP)，但是也可以看做是 Unix pipes 的类型安全泛化。

>  Although Go's approach to concurrency originates in Hoare's Communicating Sequential Processes (CSP), it can also be seen as a type-safe generalization of Unix pipes.





### Goroutines

Goroutine 具有简单的模型：它是与其它 goroutine 并发运行在同一地址空间的函数。

它是轻量级的，消耗只比分配栈空间多一点，而且栈空间初始化时很小，堆空间会根据需要进行分配和释放，so they are cheap。



使用也很简单，只需要在函数调用前增加`go`关键字，就像这样：

```go
go list.Sort()  // run list.Sort concurrently; don't wait for it.
```

需要注意的是Goroutine 和 for range 配合使用时的闭包问题：

```go
for req := range queue {
    sem <- 1
    go func() {
        process(req) // Buggy; see explanation below.
        <-sem
    }()
}
```

上述代码中所有Goroutine 实际上会共享一个req 值，而不是想象中的每个Goroutine一个。

因为：在 Go 的 for 循环中，该循环变量在每次迭代时会被复用。

解决办法：将 req 的值作为实参传入到该 goroutine 的闭包中。

```go
for req := range queue {
    sem <- 1
    go func(req *Request) {
        process(req)
        <-sem
    }(req)
}
```

 另一种解决方案就是以相同的名字创建新的变量：

```go
for req := range queue {
		req := req // Create new instance of req for the goroutine.
		sem <- 1
		go func() {
			process(req)
			<-sem
		}()
	}
```

`req := req`这种写法看起来会有点奇怪，但在 Go 中这样做是比较常见的。使用相同的名字获得了该变量的一个新的版本， 以此来屏蔽循环变量，使它对每个 goroutine 保持唯一。



第一种解决方法更容易理解，第二种则更简洁，不过对新手来说可能比较迷惑。



### Channels

Goroutines 一般会和 channel 配合使用，通常的做法是使用 channel 来做完成时的信号处理。

channel 使用 make 来初始化。

```go
ci := make(chan int)            // unbuffered channel of integers
cj := make(chan int, 0)         // unbuffered channel of integers
cs := make(chan *os.File, 100)  // buffered channel of pointers to Files
```

> 需要注意的是 Channel 默认就会分配在堆上，因为会在多个 Goroutine 之间共享。





### Channels of channels

channel 在 Go 是 first-class value，因此可以被分配并像其它值到处传递。

常见用法是，在 chan 传递的元素中再放置一个 chan，以接收返回值，就像这样：

```go
type Request struct {
	args        []int
	f           func([]int) int
	resultChan  chan int
}

func sum(a []int) (s int) {
	for _, v := range a {
		s += v
	}
	return
}

request := &Request{[]int{3, 4, 5}, sum, make(chan int)}
// Send request
clientRequests <- request
// Wait for response.
fmt.Printf("answer: %d\n", <-request.resultChan)
```

处理方如下：

```go
for req := range queue {
    // process logic
    req.resultChan <- req.f(req.args) // 通过req中的chan将结果再传递给调用方
}
```





### Parallelization

这些设计的另一个应用是在多 CPU 核心上实现并行计算。

如果计算过程能够被分为几块可独立执行的过程，它就可以在每块计算结束时向信道发送信号，从而实现并行处理。

例如：

具体处理逻辑，处理完成后通过 chan 告知调用方。

```go
type Vector []float64

// Apply the operation to v[i], v[i+1] ... up to v[n-1].
func (v Vector) DoSome(i, n int, u Vector, c chan int) {
	for ; i < n; i++ {
		v[i] += u.Op(v[i])
	}
	c <- 1    // signal that this piece is done
}
```

具体调用逻辑，启动和 CPU 个数一样的 Goroutine ，使每个 Goroutine 分别运行在不同 CPU 核心上，以实现并行计算。

```go
const NCPU = 4  // number of CPU cores

func (v Vector) DoAll(u Vector) {
	c := make(chan int, NCPU)  // Buffering optional but sensible.
	for i := 0; i < NCPU; i++ {
		go v.DoSome(i*len(v)/NCPU, (i+1)*len(v)/NCPU, u, c)
	}
	// Drain the channel.
	for i := 0; i < NCPU; i++ {
		<-c    // wait for one task to complete
	}
	// All done.
}
```





### A leaky buffer

没看明白。。

[leaky_buffer](https://go.dev/doc/effective_go#leaky_buffer)







## Errors

方法提供者一般会给调用者返回某种类型的错误提示。

Go 中错误为 error 类型，这是一个内建接口：

```go
type error interface {
	Error() string
}
```

library writer 应该定义自己的错误类型来实现 error 接口，以返回除了错误之外的其他信息，如上下文之类的。

就像这样：

```go
// PathError records an error and the operation and
// file path that caused it.
type PathError struct {
	Op string    // "open", "unlink", etc.
	Path string  // The associated file.
	Err error    // Returned by the system call.
}

func (e *PathError) Error() string {
	return e.Op + " " + e.Path + ": " + e.Err.Error()
}
```

PathError 的 Error 会生成如下错误信息：

```go
open /etc/passwx: no such file or directory
```

这比只返回`不存在该文件或目录`更加有用。

错误字符串应尽可能地指明它们的来源，例如产生该错误的包名前缀。例如在 image 包中，由于未知格式导致解码错误的字符串为 `image: unknown format`。

若调用者关心错误的完整细节，可使用类型选择或者类型断言来查看特定错误，并抽取其细节。



**推荐使用 pkg/error 包来对 error 进行包装，以提供更多信息。**



### Panic

如果真的是遇到不可恢复的问题，可以使用 panic 函数。内建的 panic 函数，它会产生一个运行时错误并终止程序。

比如程序在初始化时发现没有提供相关配置，导致程序无法正常运行，此时就可以使用 panic：

```go
var user = os.Getenv("USER")

func init() {
	if user == "" {
		panic("no value for $USER")
	}
}
```





### Recover

当 panic 被调用后（包括不明确的运行时错误，例如切片检索越界或类型断言失败）， 程序将立刻终止当前函数的执行，并开始执行之前添加的 defer 函数，执行完成后程序退出。

Go 中提供了 Recover 函数来使得panic中的程序恢复到正常运行状态。

需要注意的是 必须在 panic 之前使用 defer 来调用 recover才行，就像这样：

```go
func server(workChan <-chan *Work) {
	for work := range workChan {
		go safelyDo(work)
	}
}

func safelyDo(work *Work) {
	defer func() {
		if err := recover(); err != nil {
			log.Println("work failed:", err)
		}
	}()
	do(work)
}
```

do 方法会触发 panic，随后会被 safelyDo 中的 recover 恢复。这样就不会影响到 server 方法。



注：直接调用 recover 方法总是会返回 nil，必须在 defer 中调用才行。而 defer 中的函数可以捕获 panic 且不受 panic 影响。

例如 safelyDo 中的 defer 中的 log 方法不会因为触发了 panic 就不打印了。

> 翻译过来不好理解，可能有错，贴一些原文：
>
> Because `recover` always returns `nil` unless called directly from a deferred function, deferred code can call library routines that themselves use `panic` and `recover` without failing. As an example, the deferred function in `safelyDo` might call a logging function before calling `recover`, and that logging code would run unaffected by the panicking state.





通过 recovery pattern，可以避免因为 panic 而导致的问题。也可以借此来简化复杂软件中的错误处理问题：

regexp 包的理想化实现，以局部的错误类型调用 panic 来报告解析错误：

```go
// Error 是解析错误的类型，它满足 error 接口。
type Error string
func (e Error) Error() string {
	return string(e)
}

// error 是 *Regexp 的方法，它通过用一个 Error 触发 Panic 来报告解析错误。
func (regexp *Regexp) error(err string) {
	panic(Error(err))
}

// Compile 返回该正则表达式解析后的表示。
func Compile(str string) (regexp *Regexp, err error) {
	regexp = new(Regexp)
	// doParse will panic if there is a parse error.
	defer func() {
		if e := recover(); e != nil {
			regexp = nil    // 清理返回值。
			err = e.(Error) // 若它不是解析错误，将重新触发 Panic。
		}
	}()
	return regexp.doParse(str), nil
}
```

内部捕获panic后，进行类型断言，`err = e.(Error)`, 若 error 不是解析错误，将重新触发 Panic。

这种模式让报告解析错误变得更容易。

**尽管这种模式很有用，但它应当仅在包内使用**。Parse 会将其内部的 panic 调用转为 error 值，它并不会向调用者暴露出 panic。这是个值得遵守的良好规则。

> 不过这种重新触发Panic的惯用法会在产生实际错误时改变Panic的值。