# Effective Go

> [《Effective Go》原文](https://go.dev/doc/effective_go)
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

