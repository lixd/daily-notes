# validator库实用技巧

## 1. 概述

* 1）基本操作
* 2）国际化
    * 将错误翻译成中文
* 3）自定义校验
    * 自定义结构体校验
    * 自定义字段校验
    * 自定义国际化（翻译）


## 2. 基本操作

```go
package main

import (
   "net/http"

   "github.com/gin-gonic/gin"
)

type SignUpParam struct {
   Age        uint8  `json:"age" binding:"gte=1,lte=130"`
   Name       string `json:"name" binding:"required"`
   Email      string `json:"email" binding:"required,email"`
   Password   string `json:"password" binding:"required"`
   RePassword string `json:"rePassword" binding:"required,eqfield=Password"`
}

func main() {
   r := gin.Default()

   r.POST("/signup", func(c *gin.Context) {
      var u SignUpParam
      if err := c.ShouldBind(&u); err != nil {
         c.JSON(http.StatusOK, gin.H{
            "msg": err.Error(),
         })
         return
      }
      // 保存入库等业务逻辑代码...

      c.JSON(http.StatusOK, "success")
   })

   _ = r.Run(":8999")
}
```
我们使用curl发送一个POST请求测试下：
```shell script
curl -H "Content-type: application/json" -X POST -d '{"name":"q1mi","age":18,"email":"123.com"}' http://127.0.0.1:8999/signup
```
输出结果：
```shell script
{"msg":"Key: 'SignUpParam.Email' Error:Field validation for 'Email' failed on the 'email' tag\nKey: 'SignUpParam.Password' Error:Field validation for 'Password' failed on the 'required' tag\nKey: 'SignUpParam.RePassword' Error:Field validation for 'RePassword' failed on the 'required' tag"}
```
从最终的输出结果可以看到 validator 的检验生效了，但是错误提示的字段不是特别友好，我们可能需要将它翻译成中文。



## 3. 国际化

* 1）定义一个 全局翻译器
* 2）每次返回的时候用全局翻译器进行翻译。。

定义全局翻译器

```go
// 全局翻译器
var trans ut.Translator
// InitTrans 初始化翻译器
func InitTrans(locale string) (err error) {
	// 修改gin框架中的Validator引擎属性，实现自定制
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		zhT := zh.New() // 中文翻译器

		// 第一个参数是备用（fallback）的语言环境 后面的参数是应该支持的语言环境（支持多个）
		uni := ut.New(zhT, zhT)

		// locale 通常取决于 http 请求头的 'Accept-Language'
		// 也可以使用 uni.FindTranslator(...) 传入多个locale进行查找
		trans, ok = uni.GetTranslator(locale)
		if !ok {
			return fmt.Errorf("uni.GetTranslator(%s) failed", locale)
		}
		// 这里可以用 gin 框架自带的 validate 或者 validator 库 都是一样的
		err = zhTranslations.RegisterDefaultTranslations(v, trans)
		/*		validate := validator.New()
				err = zhTranslations.RegisterDefaultTranslations(validate, trans)*/
		if err != nil {
			return err
		}
		return
	}
	return
}
```

使用 

```go
if err := c.ShouldBind(&u); err != nil {
    // translate all error at once
    errs := err.(validator.ValidationErrors)
    tranErrs := errs.Translate(trans)
    c.JSON(http.StatusOK, gin.H{
        "msg": tranErrs,
    })
    return
}
```



测试

```shell
curl -H "Content-type: application/json" -X POST -d '{"name":"q1mi","age":18,"email":"123.com"}' http://127.0.0.1:8999/signup
```

结果如下

```text
{"msg":{"SignUpParam.Email":"Email必须是一个有效的邮箱","SignUpParam.Password":"Password为必填字段","SignUpParam.RePassword":"RePassword为必填字段"}}
```

虽然翻译成中文了，但是字段名显示的是`SignUpParam.Email` 这种格式的，需要调整一下。

### 1. 字段打印格式

参考地址

```shell
https://github.com/go-playground/validator/issues/633#issuecomment-654382345
```

再返回之前移除结构体前缀

```go
// removeTopStruct 移除结构体名
// from struct.field to field e.g.: from User.Email to Email
func removeTopStruct(fields map[string]string) map[string]string {
	res := map[string]string{}
	for field, err := range fields {
		res[field[strings.Index(field, ".")+1:]] = err
	}
	return res
}
```

使用如下

```go
if err := c.ShouldBind(&u); err != nil {
    // translate all error at once
    errs := err.(validator.ValidationErrors)
    tranErrs := errs.Translate(trans)
    // 移除 结构体名
    c.JSON(http.StatusOK, gin.H{
        "msg": removeTopStruct(tranErrs),
    })
    return
}
```

再次测试

```text
{"msg":{"Email":"Email必须是一个有效的邮箱","Password":"Password为必填字段","RePassword":"RePassword为必填字段"}}
```

这样就好多了，不过现在返回的字段是 定义的字段名，而不是定义的 tag 值，所以还需要调整一下。

### 2. 字段名

只需要在初始化翻译器的时候像下面一样添加一个获取`json` tag的自定义方法即可。

```go
if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
    v.RegisterTagNameFunc(func(field reflect.StructField) string {
        return field.Tag.Get("json")
    })
}
```



在试一下

```text
{"msg":{"email":"email必须是一个有效的邮箱","password":"password为必填字段","rePassword":"rePassword为必填字段"}}
```

这样就好多了。



## 4. 自定义

### 1. 自定义结构体校验方法

上面的校验还是有点小问题，就是当涉及到一些复杂的校验规则，比如`re_password`字段需要与`password`字段的值相等这样的校验规则，我们的自定义错误提示字段名称方法就不能很好解决错误提示信息中的其他字段名称了。

比如

```shell
curl -H "Content-type: application/json" -X POST -d '{"name":"q1mi","age":18,"email":"123.com","password":"123","re_password":"321"}' http://127.0.0.1:8999/signup
```

结果如下

```text
{"msg":{"email":"email必须是一个有效的邮箱","re_password":"re_password必须等于Password"}}
```

可以看到`re_password`字段的提示信息中还是出现了`Password`这个结构体字段名称。这有点小小的遗憾，毕竟自定义字段名称的方法不能影响被当成param传入的值。

此时如果想要追求更好的提示效果，将上面的Password字段也改为和`json` tag一致的名称，就需要我们自定义结构体校验的方法。

* 1）自定义校验方法
* 2）注册到 validator 中

```go
// SignUpParamStructLevelValidation 自定义SignUpParam结构体校验函数
func SignUpParamStructLevelValidation(sl validator.StructLevel) {
 su := sl.Current().Interface().(SignUpParam)

 if su.Password != su.RePassword {
  // 输出错误提示信息，最后一个参数就是传递的param
  sl.ReportError(su.RePassword, "re_password", "RePassword", "eqfield", "password")
 }
}
```

然后注册

```go
if v, ok := binding.Validator.Engine().(*validator.Validate); ok {		v.RegisterStructValidation(SignUpParamStructLevelValidation,&SignUpParam{})
                                                                 }
```

再试一下

```text
{"msg":{"email":"email必须是一个有效的邮箱","rePassword":"rePassword为必填字段","re_password":"re_password必须等于password"}}
```

舒服了。

### 2. 自定义字段校验方法

除了上面介绍到的自定义结构体校验方法，`validator`还支持为某个字段自定义校验方法，并使用`RegisterValidation()`注册到校验器实例中。

* 1）自定义方法
* 2）注册

接下来我们来为`SignUpParam`添加一个需要使用自定义校验方法`checkDate`做参数校验的字段`Date`。

```go
type SignUpParam struct {
 Age        uint8  `json:"age" binding:"gte=1,lte=130"`
 Name       string `json:"name" binding:"required"`
 Email      string `json:"email" binding:"required,email"`
 Password   string `json:"password" binding:"required"`
 RePassword string `json:"re_password" binding:"required,eqfield=Password"`
 // 需要使用自定义校验方法checkDate做参数校验的字段Date
 Date       string `json:"date" binding:"required,datetime=2006-01-02,checkDate"`
}
```

其中`datetime=2006-01-02`是内置的用于校验日期类参数是否满足指定格式要求的tag。 如果传入的`date`参数不满足`2006-01-02`这种格式就会提示如下错误：

```
{"msg":{"date":"date的格式必须是2006-01-02"}}
```

针对date字段除了内置的`datetime=2006-01-02`提供的格式要求外，假设我们还要求该字段的时间必须是一个未来的时间（晚于当前时间），像这样针对某个字段的特殊校验需求就需要我们使用自定义字段校验方法了。

首先我们要在需要执行自定义校验的字段后面添加自定义tag，这里使用的是`checkDate`，注意使用英文分号分隔开。

```go
// customFunc 自定义字段级别校验方法
func customFunc(fl validator.FieldLevel) bool {
	date, err := time.Parse("2006-01-02", fl.Field().String())
	if err != nil {
		return false
	}
	if date.Before(time.Now()) {
		return false
	}
	return true
}
```

注册

```go
if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
    if err := v.RegisterValidation("checkDate", customFunc); err != nil {
        fmt.Println(err)
    }
}
```



### 3. 自定义翻译方法

我们现在需要为自定义字段校验方法提供一个自定义的翻译方法，从而实现该字段错误提示信息的自定义显示。

```
// registerTranslator 为自定义字段添加翻译功能
func registerTranslator(tag string, msg string) validator.RegisterTranslationsFunc {
 return func(trans ut.Translator) error {
  if err := trans.Add(tag, msg, false); err != nil {
   return err
  }
  return nil
 }
}

// translate 自定义字段的翻译方法
func translate(trans ut.Translator, fe validator.FieldError) string {
 msg, err := trans.T(fe.Tag(), fe.Field())
 if err != nil {
  panic(fe.(error).Error())
 }
 return msg
}
```

定义好了相关翻译方法之后，我们在`InitTrans`函数中通过调用`RegisterTranslation()`方法来注册我们自定义的翻译方法。

```
// InitTrans 初始化翻译器
func InitTrans(locale string) (err error) {
 // ...liwenzhou.com...
 
  // 注册翻译器
  switch locale {
  case "en":
   err = enTranslations.RegisterDefaultTranslations(v, trans)
  case "zh":
   err = zhTranslations.RegisterDefaultTranslations(v, trans)
  default:
   err = enTranslations.RegisterDefaultTranslations(v, trans)
  }
  if err != nil {
   return err
  }
  // 注意！因为这里会使用到trans实例
  // 所以这一步注册要放到trans初始化的后面
  if err := v.RegisterTranslation(
   "checkDate",
   trans,
   registerTranslator("checkDate", "{0}必须要晚于当前日期"),
   translate,
  ); err != nil {
   return err
  }
  return
 }
 return
}
```

这样再次尝试发送请求，就能得到想要的错误提示信息了。

```
{"msg":{"date":"date必须要晚于当前日期"}}
```