# Go 模板生成

## 1. 概述

Go模板是使用特殊的占位符（称为动作）来管理某些文本的对象，这些占位符用双花括号括起来： `{{ some action }}` 。 执行模板时，将为其提供Go结构，该结构具有占位符所需的数据。

> 一般用于代码生成，减少重复劳动。



相关教程

> [Go 模板详说](https://www.cnblogs.com/li-peng/p/12835425.html)
>
> [Go模板-代码生成器](https://www.cnblogs.com/li-peng/p/12972016.html)
>
> [[Go 每日一库之 quicktemplate](https://segmentfault.com/a/1190000025133292)](https://segmentfault.com/a/1190000025133292)
>
> [使用Go模板生成文本](https://blog.csdn.net/cunjie3951/article/details/106906340)
>
> [[golang 模板(template)的常用基本语法](https://www.cnblogs.com/davygeek/p/6387385.html)](https://www.cnblogs.com/davygeek/p/6387385.html)



## 2. 演示

比如有这么一个需求，需要定义一些状态码，就像下面这样：

```go
const(
 C1000=1000
 C1001=1001
 // ....
 C1008=1008
 C1009=1009
)
```

基本全是复制粘贴，这里只有 10 个还能手写，如果更多很难受了。

像这种重复劳动完全可以通过模板来生成：

```go
func TestGenerateCode(t *testing.T) {
	tmpl, err := template.New("RespCode").Parse(`
const(
{{range .}} C{{.}}={{.}}
{{end}})
`)
	if err != nil {
		panic(err)
	}

	list := make([]int64, 0, 10)
	for i := int64(1000); i < 1010; i++ {
		list = append(list, i)
	}

	err = tmpl.Execute(os.Stdout, list)
	if err != nil {
		panic(err)
	}
}
```

输出如下：

```go
const(
 C1000=1000
 C1001=1001
 C1002=1002
 C1003=1003
 C1004=1004
 C1005=1005
 C1006=1006
 C1007=1007
 C1008=1008
 C1009=1009
)
```

只需要调整一下参数即可一键生成，这不比复制粘贴舒服。

当然还有更多用法，比如把数据库表转成Go Struct。



## 3. 语法

### 渲染对象

`{{.}}`来渲染对象本身，对象内部的字段可以`{{.field}}`
比如下面，我是用一个 `map`来存储的数据，通过`{{.name}}`访问map中的 `name`，并使用`{{.}}`来把整个 `map`打印出来
eg:

```go
	tmpl, err := template.New("test").Parse(`hello {{.name}}!
	obj: {{.}}`)
	if err != nil {
		panic(err)
	}
	err = tmpl.Execute(os.Stdout, map[string]interface{}{
		"name": "world", "age": 18})
	if err != nil {
		panic(err)
	}
```

输出

```
hello world!
obj: map[age:18 name:world]
```

结构体内的字段也是用`{{.field}}`

```go
	tmpl, err := template.New("test").Parse(`hello {{.Name}}!
	obj: {{.}}`)
	if err != nil {
		panic(err)
	}
	err = tmpl.Execute(os.Stdout, struct {
		Name string
		Age  int
	}{Name: "li", Age: 18})
	if err != nil {
		panic(err)
	}
```



#### 空格

在`{{}}`内添加 `-`可以去掉空格

- `{{- }}` 去掉左边所有的空格，一直到遇到左边的字符
- `{{ -}}` 去掉右边所有的空格，一直到遇到右边的字符
- `{{- -}}` 去掉两边所有的空格
  `eg:`

```go
	tmpl, err := template.New("test").Parse(`hello:    {{- .Name}}
	age: {{.Age -}}   !!!
	obj:     
	{{- . -}}   end.`)
	if err != nil {
		panic(err)
	}
	err = tmpl.Execute(os.Stdout, struct {
		Name string
		Age  int
	}{Name: "li", Age: 18})
	if err != nil {
		panic(err)
	}
```

- `hello:` 后面的空格到`{{- .Name}}` 之间的空格会被去掉.
- `{{.Age -}}`到 `!!!`之间的空格会被去掉
- `obj:`到`{{- . -}}`和`{{- . -}}`到 `end.`之间的空格都会被去掉。

```
hello:li
age: 18!!!
obj:{li 18}end.
```



#### 自定义变量

除了可以直接使用`go`的对象，也可以直接在模板中定义变量`{{ $var := }}`，变量定义后，可以在模板内其他任意地方使用：

```go
	tmpl, err := template.New("test").Parse(`{{$a := "li"}} hello {{$a}}`)
	if err != nil {
		panic(err)
	}
	err = tmpl.Execute(os.Stdout, nil)
	if err != nil {
		panic(err)
	}
```

输出

```
hello li
```



### 方法

方法可以分为全局方法和结构体方法还有内置方法，内置方法也是全局方法的一种



#### 全局方法

`template.FuncMap` 是一个`map`里面的`value`必需是方法，传入的值的参数没有限制

```
type FuncMap map[string]interface{}
```

比如：定义一个`ReplaceAll`方法，替换所有的指定字符串
例子中把所有的`zhang`替换成`li`

> 解析时，通过名字去 Map 中取到对应 func

```go
	tmpl, err := template.New("test").Funcs(template.FuncMap{
		"ReplaceAll": func(src string, old, new string) string {
			return strings.ReplaceAll(src, old, new)
		},
	}).Parse(`func replace:  {{ReplaceAll .Name "zhang" "li"}}`)
	if err != nil {
		panic(err)
	}
	err = tmpl.Execute(os.Stdout, struct {
		Name string
		Age  int
	}{Name: "zhang_san zhang_si", Age: 18})
	if err != nil {
		panic(err)
	}
```

输出

```
func replace:  li_san li_si
```



#### 内置方法

模板有一些[内置方法](https://golang.org/pkg/text/template/#Functions)比如 `call` `printf` 等，和全局方法一样，直接调用就行

```go
	tmpl, err := template.New("test").Parse(`{{printf "name: %s age: %d" .Name .Age}}`)
	if err != nil {
		panic(err)
	}
	err = tmpl.Execute(os.Stdout, struct {
		Name string
		Age  int
	}{Name: "li", Age: 18})
	if err != nil {
		panic(err)
	}
```

输出

```
name: li age: 18
```



### 行为

常用的行为有`if`、 `range`、 `template`等。

#### if

判断 `{{if }} {{end}}`，可以用于`字符串` `bool` 或者`数值类型`
当 `字符串有数据` 或者`bool`值为`true` 或者`数值类型`大于`0` 时为真

```go
	{{- if .Name}} 
      string .Name true  // 如果 Name字段存在则进入if逻辑
	{{else}} 
      string .Name false // 如果 Name字段不存在则进入else逻辑 
	{{end -}}
```

e.g.

```go
	tmpl, err := template.New("test").Parse(`
	name: {{.Name}} 
	{{- if .Name}}
      string .Name true 
	{{else}} 
      string .Name false 
	{{end -}}
	desc: {{.Desc}} 
	{{- if .Desc}}
      string .Desc true 
	{{else}} 
      string .Desc false 
	{{end -}}
	age: {{.Age}} 
	{{- if .Age}}
      number .Age true 
	{{else}} 
	  number .Age true false
	{{end -}}
	isAdmin: {{.IsAdmin}} 
	{{- if .Age}}
      bool .IsAdmin true 
	{{else}} 
	  bool .IsAdmin true false
	{{end}}
	`)
	if err != nil {
		panic(err)
	}
	err = tmpl.Execute(os.Stdout, struct {
		Name    string
		Desc    string
		Age     int
		IsAdmin bool
	}{Name: "", Desc: "xyz", Age: 18, IsAdmin: true})
	if err != nil {
		panic(err)
	}
```

输出：

```
	name:  
      string .Name false 
	desc: xyz
      string .Desc true 
	age: 18
      number .Age true 
	isAdmin: true
      bool .IsAdmin true
```



#### range

```go
range` 用于遍例数组，和`go`的 `range`一样，可以直接得到每个变量，或者得到 `index` 和`value
	tmpl, err := template.New("test").Parse(`
	{{range .val}} {{.}} {{end}}
	{{range $idx, $value := .val}} id: {{$idx}}: {{$value}} {{end}}`)
	if err != nil {
		panic(err)
	}
	err = tmpl.Execute(os.Stdout, map[string]interface{}{
		"val": []string{"a", "b", "c", "d"}})
	if err != nil {
		panic(err)
	}
```

输出

```
a  b  c  d 
id: 0: a  id: 1: b  id: 2: c  id: 3: d
```



```go
{{range .val}} {{.}} {{end}}
```

`{{range .val}}`表示对传入数据结构的 val 字段进行 range 操作，

`{{.}}`表示的是 range 中的每一个 item

` {{end}}`为语法，表示 range 结束

```go
{{range $idx, $value := .val}} id: {{$idx}}: {{$value}} {{end}}`)
```

新增了变量 idx、 value来接收for range 中的索引的item。



#### 内嵌template

除了可以自定义对象还可以自定义内嵌的模板`{{define "name"}}`，也可以传参数

```go
	tmpl, err := template.New("test").Parse(`
	{{define "content"}} hello {{.}} {{end}}
	content: {{template "content" "zhang san"}}`)
	if err != nil {
		panic(err)
	}
	err = tmpl.Execute(os.Stdout, nil)
	if err != nil {
		panic(err)
	}
```

在调用时`{{template "content" "zhang san"}}` 传递了参数 `zhang san`
输出：

```
content:  hello zhang san
```



```go
{{define "content"}} hello {{.}} {{end}}
```

定义一个名为`content`的模板，

```go
{{template "content" "zhang san"}}
```

调用名为`content`的模板，并传入参数 "zhang san"。



#### 注释

模板的注释： `{{/* comment */}}`

> 就是在模板内容中添加注释 普通的 Go 注释 `//`、`/* */`会被当做模板的一部分处理。

```go
	tmpl, err := template.New("test").Parse(`
	{{/* 注释 */}}
	{{define "content"}} hello {{.}} {{end}}
	content: {{template "content" "zhang san"}}`)
	if err != nil {
		panic(err)
	}
	err = tmpl.Execute(os.Stdout, nil)
	if err != nil {
		panic(err)
	}
```





## 4.攻击码生成



```go

// 更新时，维护CodeComments中的错误码和注释关系，并修改Start、End即可

var CodeComments = map[int64]string{
	100: "参数错误",
	101: "参数为空",
	102: "伪造参数攻击",
	103: "请求重放攻击",
	104: "异常设备",
	105: "异常IP",
	106: "异常用户",
	107: "TODO",
	108: "TODO",
	109: "TODO",
}

const (
	Start = 100
	End   = 110
)

type code struct {
	Number  int64
	Comment string
}

const VCodeTmpl = `{{/*定义一个变量来存储MaxID，便于后续在 for range 中使用*/}}
{{- $MaxID := .MaxID}}
{{- /*生成一组const*/}}
const(
	{{range .Data}} C{{.Number}}={{.Number}} // {{.Comment}}
	{{end -}}
)

{{/*生成对应List列表*/ -}}
var(
	List = []string{
{{- range $i,$v :=.Data -}}
	{{/*判断是最后一个值时，不添加逗号*/}}"{{.Number}}"{{if lt $i $MaxID -}} , {{- end -}}
{{end}}}
)

`

func TestGenerateVCode(t *testing.T) {
	tmpl, err := template.New("test").Parse(VCodeTmpl)
	if err != nil {
		panic(err)
	}

	list := make([]code, 0, End-Start)
	for i := int64(Start); i < End; i++ {
		item := code{
			Number:  i,
			Comment: CodeComments[i],
		}
		list = append(list, item)
	}

	err = tmpl.Execute(os.Stdout, struct {
		Data  []code
		MaxID int
	}{
		Data:  list,
		MaxID: End - Start - 1, // id从0开始，因此需要减1
	})
	if err != nil {
		panic(err)
	}
}
```

输出如下：

```go
package vcode

const(
	 C100=100 // 参数错误
	 C101=101 // 参数为空
	 C102=102 // 伪造参数攻击
	 C103=103 // 请求重放攻击
	 C104=104 // 异常设备
	 C105=105 // 异常IP
	 C106=106 // 异常用户
	 C107=107 // TODO
	 C108=108 // TODO
	 C109=109 // TODO
	)

var(
	List = []string{"100","101","102","103","104","105","106","107","108","109"}
)
```

