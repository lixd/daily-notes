# SpringBoot视图层

## 1. 整合jsp

### 1.1 修改pom.xml 添加依赖

```xml
        <dependency>
            <groupId>org.apache.tomcat.embed</groupId>
            <artifactId>tomcat-embed-jasper</artifactId>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>jstl</artifactId>
        </dependency>
```



### 1.2 全局配置文件

 application.properties

视图解析

```properties
spring.mvc.view.prefix=/WEB-INF/jsp/
spring.mvc.view.suffix=.jsp
```

### 1.3 创建controller

```java
@Controller
public class UserController {
    /**
     * 产生数据
     * @param model
     * @return
     */
    @RequestMapping("/showUser")
    public String showUser(Model model) {
        List<User> list = new ArrayList<>();
        list.add(new User(1, "张三", 20));
        list.add(new User(2, "李四", 22));
        list.add(new User(3, "王五", 25));
        //需要一个model对象
        model.addAttribute("list",list);
        //跳转视图
        return "userList";
    }
}
```

### 1.4 userList.jsp

**在src/main 文件夹下创建一个webapp文件夹 具体目录 src/main/webapp/WEB-INF/** 

如果不能直接创建JSP文件的话，需要把WebResources目录指定为webapp这个目录

priject Structure-->Modules-->找到你的项目下的web选项 -->Web Resources Directory 指定为src/main/webapp/

```jsp
<%--
  Created by IntelliJ IDEA.
  User: 13452
  Date: 2019/1/5
  Time: 23:02
  To change this template use File | Settings | File Templates.
--%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
>
<html>
<head>
    <title>Title</title>
</head>
<body>
<table border="1px" align="center" width="50%">
    <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Age</th>
    </tr>

    <c:forEach items="${list}" var="user">
        <tr>
            <td>
                    ${user.userid}
                    ${user.username}
                    ${user.age}
            </td>

        </tr>

    </c:forEach>
</table>
</body>
</html>

```

## 2. 整合Freemarker

###  2.1 修改pom.xml 添加依赖

freemarker

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-freemarker</artifactId>
</dependency>
```

### 2.2 编写视图

必须放在src/main/resource/templates目录下

userList.ftl

```html
<html>
<title>userlist</title>
<meta charset="utf-8">
<body>
<table border="1px" align="center" width="50%">
    <tr>
        <th>id</th>
        <th>name</th>
        <th>age</th>
    </tr>
    <#list list as user>
        <tr>
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.age}</td>
        </tr>
    </#list>
</table>
</body>
</html>
```

### 2.3 全局配置文件

将上边配置的注释掉，同时添加新的加载路径配置

```properties
#spring.mvc.view.prefix=/WEB-INF/jsp/
#spring.mvc.view.suffix=.jsp
spring.freemarker.template-loader-path=classpath:/templates/
```

### 2.3 创建Controller

```java
@Controller
public class UserController {
    /**
     * 产生数据
     * @param model
     * @return
     */
    @RequestMapping("/showUser")
    public String showUser(Model model) {
        List<User> list = new ArrayList<>();
        list.add(new User(1, "张三", 20));
        list.add(new User(2, "李四", 22));
        list.add(new User(3, "王五", 25));
        //需要一个model对象
        model.addAttribute("list",list);
        //跳转视图
        return "userList";
    }
}
```

## 3. 整合Thymeleaf(官方推荐)

### 3.0 Thymeleaf介绍

特点：通过他特定的语法对html标记做渲染

### 3.1 修改pom.xml 添加依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```

### 3.2 创建视图

也是必须放在src/main/resource/templates目录下

templates目录是安全的，外界不能直接访问。

index.html

```html
<!DOCTYPE html>
<html lang="en">
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:th="http://www.thymeleaf.org"><!--引入thymeleaf标签-->
<head>
    <meta charset="UTF-8">
    <title>Thymeleaf</title>
</head>
<body>
<span th:text="hello Thymeleaf"></span>
<hr/>
<span th:text="${msg}"></span>
</body>
</html>
```

注意：如果thymeleaf版本较低，则对html标签检测比较严谨，有开始标签就必须有介绍标签。

 <meta charset="UTF-8"> 这样的就会报错,换高版本就好了

### 3.3 编写COntroller

```java
@Controller
public class DemoController {
    @RequestMapping("/showThy")
    public String getMessage(Model model){
        model.addAttribute("msg","this is my first Thymeleaf");
        return "index";
    }
}
```

## 4. Thymeleaf语法详解

### 4.1变量输出与字符串

#### `th：text`  

向页面输出值 

```html
<span th:text="hello Thymeleaf"></span>
```

#### `th:value`

将值放到input标签的value属性中

```html
<input type="text" name="message" th:value="${msg}"> //相当于下面的语句
<input type="text"name="message" value="xxxxx">
```

#### `${strings.isEmpty(message)}` 

判断字符串message是否为空 true或者false

#### Thymeleaf内置对象

上边的`strings`就是thymeleaf的内置对象

语法：

1.调用内置对象一定使用`#`

2.大部分的内置对象都以`s`结尾-->`strings`,`nubmers`,`dates`等

常用方法：

`${strings.isEmpty(str)}` //判断字符串str是否为空 true/false

`${#strings.contains(str,'xxx')}` //判断str中是否包含字符'xxx'  true/false

`${#strings.startWith(str,'xxx')}`//判断str是否以字符'xxx'开头  true/false

`${#strings.endWith(str,'xxx')}`//判断str是否以字符'xxx'结尾  true/false

`${#strings.Length(str}`//返回字符串str的长度

`${#strings.indexOf(str,'x')}`//查询字符'x' 在字符串str中的索引位置  没找到则返回-1

`${#strings.substring(str,begin,end)}`//截取字符串str,从begin到end。不写end就截取到字符串结束。

例子：str="123456"

`${#strings.substring(str,1,2)}`-->'2'  //从位置1截取到2 **包含开始不包含结束** 

`${#strings.substring(str,1)}` -->'23456' //从位置1截取字符串结束

`${#strings.toUpperCase(str)}` //将str转换为大写

`${#strings.toLowerCase(str)}` //将str转换为小写

### 4.2 日期转换操作

` ${#dates.format(date)}` //将日期对象date格式化 默认格式化为当前浏览器语言所支持的格式 2019年1月6日 下午09时19分29秒

` ${#dates.format(date，'yyy/MM/dd')}` //将日期对象date安自定义的格式格式化 2019/01/06

`${#dates.year(date)}` //获取年

`${#dates.month(date)}` //获取月

`${#dates.day(date)}` //获取日   时分秒都可以

### 4.3 条件判断

`th:if`

```html
<span th:if="${sex}=='男'">性别男</span>
<span th:if="${sex}=='女'">性别女</span>
```

`th:switch`

```html
<div th:switch="${id}">
    <span th:case="1">ID为1</span>
    <span th:case="2">ID为2</span>
    <span th:case="3">ID为3</span>
</div>
```

### 4.4 迭代遍历

#### `th:each` 

**th:each="one : list"**  其中list为被遍历的对象，one是遍历出来得单个对象（变量名都是可以自定义的）

```java
@RequestMapping("/showUser")
public String showUser(Model model) {
    List<User> list=new ArrayList<>();
    list.add(new User("1","U1",1));
    list.add(new User("2","U2",2));
    list.add(new User("3","U3",3));
    model.addAttribute("list",list);
    return "index";
}
```

```html
index.html
<!--传过去的list是一个user集合-->
<tr th:each="user : ${list}">
    <td th:text="${user.id}"></td>
    <td th:text="${user.name}"></td>
    <td th:text="${user.age}"></td>
</tr>
```

#### `th:each` 状态变量 

**th:each="one,var : list"** 其中list为被遍历的对象,one是遍历出来得单个对象 var为状态变量（变量名都是可以自定义的）

```html
<tr th:each="user,var : ${list}">
    <td th:text="${user.id}"></td>
    <td th:text="${user.name}"></td>
    <td th:text="${user.age}"></td>
    <td th:text="${var.count}"></td>
    <td th:text="${var.size}"></td>
    <td th:text="${var.first}"></td>
    <td th:text="${var.last}"></td>
    <td th:text="${var.index}"></td>
    <td th:text="${var.current}"></td>
    <td th:text="${var.even}"></td>
    <td th:text="${var.odd}"></td>
</tr>
```

**状态变量属性：**

* index: 当前迭代器的索引（从0开始）
* count: 当前迭代对象的计数（从1开始）
* size: 被迭代对象的长度
* even/odd: 布尔值，当前循环是否是偶数/奇数次循环 （从第0次开始算）
* first/last: 布尔值 ，当前循环的是否是第一/最后一条
* current: 返回当前迭代到的那个对象 //上边list集合中的`user`对象

#### `th:each`迭代Map

**th:each="map: maps"**  先从maps中取出单个map

**th:each="entry: map"**  再从单个map中取出entry

**${entry.key} ${entry.value}** 接着就可以在entry中取key和value了

```java
@RequestMapping("/showUser3")
public String showUser3(Model model) {
    Map<String,User> map=new HashMap<>();
    map.put("1",new User("1", "U1", 1));
    map.put("2",new User("2", "U2", 2));
    map.put("3",new User("3", "U3", 3));
    model.addAttribute("map", map);
    return "index2";
}
```

```html
<tr th:each="maps:${map}">
    <td th:each="entrys:${maps}" th:text="${entrys.key}"></td>
    <td th:each="entrys:${maps}" th:text="${entrys.value}"></td>
</tr>
```

### 4.5 获取作用域对象

```java
@RequestMapping("/showUser4")
public String showUser4(HttpServletRequest request, Model model) {
    request.setAttribute("req", "HttpServletRequest");
    request.getSession().setAttribute("sess","HttpSession");
    request.getSession().getServletContext().setAttribute("app","application");
    return "index3";
}
```

```html
Request: <span th:text="${#httpServletRequest.getAttribute('req')}"></span><br>
Request: <span th:text="${request.req}"></span><br>

Session: <span th:text="${#httpSession.getAttribute('sess')}"></span><br>
Session: <span th:text="${session.sess}"></span><br>

App: <span th:text="${#servletContext.getAttribute('app')}"></span><br>
App: <span th:text="${application.app}"></span><br>
```

都可以通过 #获取内置对象 或者${}直接取值

### 4.6 URL表达式

`th:href`

`th:src`

#### 基本语法

`@{}`

##### 绝对路径

```html
<a th:href="@{http://www.baidu.com}">绝对路径</a>

<a href="http://www.baidu.com">以前的写法</a>
```

##### 相对路径

`@PathVariable（”参数名称“）`注解 获取url中的参数

```Java
@RequestMapping("/user/{id}") 
public String test(@PathVariable("id") Integer id){
    System.out.println(id);
     return "hello";
 }
例如：访问  /user/1   ----------  对应id=1
 	　　　 /user/2 ------------  对应id=2
```



**相对于当前项目的根路径**

相对于项目的上下文的相对路径

```java
//请求的哪个路径就跳转到哪个页面
@RequestMapping("/{page}")
public String showURL(@PathVariable String page) {
    return page;
}
```

```html
<a th:href="@{/show}">相对路径</a><a th:href="@{/show}">相对路径</a>
```

**相对于服务器的根路径**

前面加了一个`~` 波浪号

 ```html
<a th:href="@{~/project/resources//view/xxx}">相对服务器的路径</a>
 ```

##### url传值

url后面加个小括号`（key=value,key2=value2）`

```html
<a th:href="@{/show(id=1,name=zhangsan)}">url传值</a>
```

RESTful风格

```html
<a th:href="@{paht/{id}/show(id=1,name=zhangsan)}">url传值-RESTful</a>
```

路径后面加`{}` 通过@PathVariable 取值

