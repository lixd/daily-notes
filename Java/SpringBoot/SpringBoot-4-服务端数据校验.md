# SpringBoot服务端数据校验

## 1. 简单的添加用户

```html
<!--add.html-->
<!DOCTYPE html>
<html lang="en">
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>Add</title>
</head>
<body>
<form th:action="@{/save}" method="post">
    用户名：<input type="text" name="username"><br/>
    密码： <input type="password" name="password"><br/>
    年龄： <input type="text" name="age"><br/>
    <input type="submit" value="提交"><br/>
</form>
</body>
</html>
```

```java
//UserController
@Controller
public class UserController {
    @RequestMapping("/addUser")
    public String showPage() {
        return "add";
    }

    @RequestMapping("/save")
    public String saveUser(User user) {
        System.out.println(user.toString());
        return "ok";
    }
}
```

## 2. SpringBoot 数据校验

1.SpringBoot使用了hibernate-validator校验框架

表单数据校验步骤： 注解方式 

### 1. 添加校验 

```jav
//属性上添加注解
@NotBlank
private String name;
```

@NotEmpty 用在集合类上面
@NotBlank 用在String上面
@NotNull    用在基本类型上

### 2.开启校验

@Valid：在方法中添加@Valid注解 表示开启校验，开启校验后会对对象中的属性挨个校验 

BindingResult：该对象封装了校验结果

`springmvc`会将校验的对象（User)放到Model中传递，key的值会使用该对象的驼峰式规则命名（user）

@ModelAttribute("str"): 可以修改上边默认的key值

```java
//
@Controller
public class UserController {
    @RequestMapping("/addUser") //访问该方法是User对象为空，会直接报错，所以注入一个user对象
    public String showPage(@ModelAttribute("u") User user) {
        return "add";
    }

    /**
     * @param user
     * @param result
     * @return
     * @Valid 开启校验
     * BindingResult：封装了校验结果
     */
    @RequestMapping("/save")
    public String saveUser(@ModelAttribute("u") @Valid User user, BindingResult result) {
        //result.hasErrors() 检测是否校验错误 false表示通过校验 true表示校验出错
        if (result.hasErrors()) {
            return "add";
        }
        System.out.println(user.toString());
        return "ok";
    }
}
```

## 3.校验结果

在html中可以取出当个对象的校验结果。

  `th:errors="${u.username}" `
`    th:errors="${u.password}"`
 `   th:errors="${u.password}"`

其中的u就是前面的key

```html
<!DOCTYPE html>
<html lang="en">
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8">
    <title>Add</title>
</head>
<body>
<form th:action="@{/save}" method="post">
    用户名：<input type="text" name="username"><span th:errors="${u.username}" style="color: red; "></span><br/>
    密码： <input type="password" name="password"><span th:errors="${u.password}" style="color: red; "></span><br/>
    年龄： <input type="text" name="age"><span th:errors="${u.password}" style="color: red; "></span><br/>
    <input type="submit" value="提交"><br/>
</form>
</body>
</html>

```