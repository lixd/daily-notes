# Gin web 框架

## 1. 快速入门

```go
package main

import (
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
    //参数1 路径 参数2 func函数
	r.GET("/v1/ping", PingHandler)
	r.Run(":8080")
}
func PingHandler(c *gin.Context) {
	c.JSON(200, gin.H{"message": "pong"})
}
```



## 2. router 路由

#### 路由分组

```go
func main() {
    router := gin.Default()

    // Simple group: v1
    v1 := router.Group("/v1")
    {
        v1.POST("/login", loginEndpoint)
        v1.POST("/submit", submitEndpoint)
        v1.POST("/read", readEndpoint)
    }

    // Simple group: v2
    v2 := router.Group("/v2")
    {
        v2.POST("/login", loginEndpoint)
        v2.POST("/submit", submitEndpoint)
        v2.POST("/read", readEndpoint)
    }

    router.Run(":8080")
}
```

## 3. 参数匹配

gin 中参数匹配相关的方法：

单个参数相关：

```go
// c --> *gin.Context
c.Param()
c.Query()
c.DefaultQuery()
c.PostForm()
c.DefaultPostForm()
c.QueryMap()
c.PostFormMap()
c.FormFile()
c.MultipartForm()
```

模型绑定相关：

```go
// 必须绑定 
c.Bind()  // 根据Content-Type判断类型
c.BindJSON()
c.BindXML()
c.BindQuery()
c.BindYAML()
// 应该绑定
c.ShouldBind()  // 根据Content-Type判断类型
c.ShouldBindJSON()
c.ShouldBindXML()
c.ShouldBindQuery()
c.ShouldBindYAML()
```

### 3.1 参数匹配

#### c.Param()

用于获取URL 中的`路径参数`，是 ` c.Params.ByName(key)`的快捷方式。

URL格式：`:paramsName`

参数获取：`c.Param(paramsName)`

```go
// URL 路径参数绑定
router.GET("/param/:user/:password",func ParamHandler(c *gin.Context) {
    //request http://localhost:8080/param/admin/root
	paramUser := c.Param("user") //user=admin
	paramPassword := c.Param("password") //password=root
    log.Printf("c.Param()  user=%v password=%v", paramUser, paramPassword)
})
```

#### c.Query()

用于获取`查询参数(query params)`，即拼接在 URL 后面的参数，类似`/query?user=admin&password=root`这样

```go
// URL 路径参数绑定
router.GET("/query",func ParamHandler(c *gin.Context) {
    //request http://localhost:8080/query?user=admin&password=root
	queryUser := c.Query("user")         // user=admin
	queryPassword := c.Query("password") // password=root
	log.Printf("c.Query()  user=%v password=%v", queryUser, queryPassword)
})
```

#### c.DefaultQuery()

类似于`c.Query()`，不过可以设置默认值。

```go
queryPassword:=c.DefaultQuery("user","unknown")//没有获取到时有默认值"unknown"
```

#### c.PostForm()

用于获取 POST表单方式提交,`urlencoded form or multipart form`，如果`key`不存在则返回空字符串`""`

```go
// URL 路径参数绑定
router.GET("/postform",func ParamHandler(c *gin.Context) {
    //request http://localhost:8080/postform
    //content-type：x-www-form-urlencoded
	PostFormUser := c.PostForm("user")         // user=admin
	PostFormPassword := c.PostForm("password") // password=root
	log.Printf("c.PostForm()  user=%v password=%v", PostFormUser, PostFormPassword)
})
```

#### c.DefaultPostForm()

类似于`c.PostForm()`，不过可以设置默认值。

```GO
PostFormPassword := c.DefaultPostForm("password","none") // 不存在时有默认值"none"
```

#### c.QueryMap()

类似于`c.Query()`,用于获取`查询参数(query params)`，只不过返回值为`map[string]string`.

#### c.PostFormMap()

类似于`c.PostForm()`,用于获取 POST表单方式提交.

```go
postFormMapUsers := c.PostFormMap("user")
```

#### c.FormFile()

用于单个文件上传,只会获取`key`对应的第一个文件

`c.FormFile("file")`其中的`file`对应下面的`name`属性

```html
 <input type="file" name="file" id="file_upload">
```



```go
// 单个文件上传
router.GET("/formfile",func ParamHandler(c *gin.Context) {
	// FormFile returns the first file for the provided form key.
	header, err := c.FormFile("file")
	if err != nil {
		c.String(http.StatusBadRequest, "Bad request")
		log.Printf("c.FormFile() error error=%v", err)
		return
	}
	log.Printf("c.FormFile()  file name=%v error=%v", header.Filename, err)
    //save file
})
```

#### c.MultipartForm()

用于多个文件上传，获取上传的所有文件

```go
// 多个文件上传
router.GET("/formfile",func ParamHandler(c *gin.Context) {
    // MultipartForm is the parsed multipart form, including file uploads.
	form, err := c.MultipartForm()
	log.Printf("c.MultipartForm() form=%v err=%v", form,err)
	headers := form.File
	for value, file := range headers {
		log.Printf("c.MultipartForm()  form.File.value=%v form.File.file=%v", value, file)
	}
    //save file
})
```





### 3.2 模型绑定和验证

若要将请求主体绑定到结构体中，请使用模型绑定，目前支持JSON、XML、YAML和标准表单值(foo=bar&boo=baz)的绑定。

Gin使用 [go-playground/validator.v8](https://github.com/go-playground/validator) 验证参数，[查看完整文档](https://godoc.org/gopkg.in/go-playground/validator.v8#hdr-Baked_In_Validators_and_Tags)。

需要在绑定的字段上设置tag，比如，绑定格式为json，需要这样设置 `json:"fieldname"` 。

此外，Gin还提供了两套绑定方法：

- `Must bind`
- - Methods  - `Bind`, `BindJSON`, `BindXML`, `BindQuery`, `BindYAML` 
- - Behavior - 这些方法底层使用 `MustBindWith`，如果存在绑定错误，请求将被以下指令中止 `c.AbortWithError(400, err).SetType(ErrorTypeBind)`，响应状态代码会被设置为400，请求头`Content-Type`被设置为`text/plain; charset=utf-8`。注意，如果你试图在此之后设置响应代码，将会发出一个警告 `[GIN-debug] [WARNING] Headers were already written. Wanted to override status code 400 with 422`，如果你希望更好地控制行为，请使用`ShouldBind`相关的方法
- `Should bind`
- - Methods  - `ShouldBind`, `ShouldBindJSON`, `ShouldBindXML`, `ShouldBindQuery`, `ShouldBindYAML` 
- - Behavior - 这些方法底层使用 `ShouldBindWith`，如果存在绑定错误，则返回错误，开发人员可以正确处理请求和错误。

当我们使用绑定方法时，Gin会根据Content-Type推断出使用哪种绑定器，如果你确定你绑定的是什么，你可以使用`MustBindWith`或者`BindingWith`。

你还可以给字段指定特定规则的修饰符，如果一个字段用`binding:"required"`修饰，并且在绑定时该字段的值为空，那么将返回一个错误。

#### Bind()

**如果绑定错误，请求将被 c.AbortWithError(400, err).SetType(ErrorTypeBind) 中止**，响应状态码将被设置成400，响应头 Content-Type 将被设置成 text/plain;charset=utf-8。如果你尝试在这之后设置相应状态码，将产生一个头已被设置的警告。如果想更灵活点，则需要使用 ShouldBind 类型的方法。

```go
// 必须绑定 
c.Bind()  // 根据Content-Type判断类型
c.BindJSON()
c.BindXML()
c.BindQuery()
c.BindYAML()
```

#### ShouldBind()

**如果出现绑定错误，这个错误将被返回，并且开发人员可以进行适当的请求和错误处理**。

```go
// 应该绑定
c.ShouldBind()  // 根据Content-Type判断类型
c.ShouldBindJSON()
c.ShouldBindXML()
c.ShouldBindQuery()
c.ShouldBindYAML()
```

#### c.Bind()

只能匹配`查询参数(query params)`和`form-data`



根据`Content-Type`自动选择绑定引擎：

- "application/json" --> JSON binding
- "application/xml"  --> XML binding
- 其他类型则返回error

#### c.BindQuery()

`c.BindQuery()`只绑定查询参数，而不绑定POST数据。

#### c.ShouldBind()

只能匹配`查询参数(query params)`和`form-data`



根据`Content-Type`自动选择绑定引擎：

- "application/json" --> JSON binding
- "application/xml"  --> XML binding
- 其他类型则返回error

#### c.ShouldBindQuery()

`c.shouldBindQuery()`函数只绑定查询参数，而不绑定POST数据。

## 4. 响应

常用数据响应方法如下：

```go
c.String()
c.HTML()
c.JSON()
c.Data()
```



## 5. 中间件

gin 中的`中间件` 类似于拦截器这种东西。

```go
    // 设定请求url不存在的返回值
	router.NoRoute(user.NoResponse)
	// route 分组
	v1 := router.Group("/v1")
	// 使用中间件
	v1.Use(middleware.AuthMiddleWare())
```



 ## 6. 例子

### AsciiJSON

使用 AsciiJSON 生成具有转义的非 ASCII 字符的 ASCII-only JSON。

```go
package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func main() {
	r := gin.Default()
	r.GET("/v1/users", UserHandler)
	r.Run(":8080")
}

func UserHandler(c *gin.Context) {
	User1 := User{"illusory", 23, "CQ"}
	c.AsciiJSON(http.StatusOK, User1)
}

type User struct {
	Name    string `json:"name"`
	Age     int    `json:"age"`
	Address string `json:"address"`
}
```

### 参数匹配

#### 快速参数匹配

```go
func main() {
	router := gin.Default()
	router.GET("/login/:name/:password", LoginHandler)
	router.Run(":8080")
}
// 快速参数匹配
func LoginHandler(c *gin.Context) {
	name := c.Param("name")
	password := c.Param("password")
	c.String(http.StatusOK, "name=%v password=%v ", name, password)
}
```

#### 普通参数匹配

```go
func main() {
	router := gin.Default()
	router.GET("/login", LoginHandler)
	router.Run(":8080")
}
// 普通参数匹配
func LoginHandler(c *gin.Context) {
	// 找不到时设置默认值 admin
	name := c.DefaultQuery("name", "admin")
	// 找不到时直接为空
	password := c.Query("password")
	c.String(http.StatusOK, "name=%v password=%v ", name, password)
}
```