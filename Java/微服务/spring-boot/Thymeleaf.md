# Thymeleaf

## 1. 简介

Thymeleaf 是一个跟 Velocity、FreeMarker 类似的模板引擎，它可以完全替代 JSP 。相较与其他的模板引擎，它有如下三个极吸引人的特点

- Thymeleaf 在有网络和无网络的环境下皆可运行，即它可以让美工在浏览器查看页面的静态效果，也可以让程序员在服务器查看带数据的动态页面效果。这是由于它支持 html 原型，然后在 html 标签里增加额外的属性来达到模板 + 数据的展示方式。浏览器解释 html 时会忽略未定义的标签属性，所以 thymeleaf 的模板可以静态地运行；当有数据返回到页面时，Thymeleaf 标签会动态地替换掉静态内容，使页面动态显示。
- Thymeleaf 开箱即用的特性。它提供标准和 Spring 标准两种方言，可以直接套用模板实现 JSTL、 OGNL 表达式效果，避免每天套模板、改 JSTL、改标签的困扰。同时开发人员也可以扩展和创建自定义的方言。
- Thymeleaf 提供 Spring 标准方言和一个与 SpringMVC 完美集成的可选模块，可以快速的实现表单绑定、属性编辑器、国际化等功能。

## 2. 为什么要用Thymeleaf

如果希望以 Jar 形式发布模块则尽量不要使用 JSP 相关知识，这是**因为 JSP 在内嵌的 Servlet 容器上运行有一些问题 (内嵌 Tomcat、 Jetty 不支持 Jar 形式运行 JSP**，Undertow 不支持 JSP)。

Spring Boot 中推荐使用 Thymeleaf 作为模板引擎，因为 Thymeleaf 提供了完美的 Spring MVC 支持

Spring Boot 提供了大量模板引擎，包括：

- FreeMarker
- Groovy
- Mustache
- **Thymeleaf**
- Velocity
- **Beetl**



## 3. 使用

### 1. 引入依赖

主要增加 `spring-boot-starter-thymeleaf` 和 `nekohtml` 这两个依赖

- `spring-boot-starter-thymeleaf`：Thymeleaf 自动配置
- `nekohtml`：允许使用非严格的 HTML 语法

```xml
		<dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
		<dependency>
            <groupId>net.sourceforge.nekohtml</groupId>
            <artifactId>nekohtml</artifactId>
            <version>1.9.22</version>
        </dependency>
```

### 2. 在 `application.yml` 中配置 Thymeleaf

```yml
spring:
  thymeleaf:
    cache: false # 开发时关闭缓存,不然没法看到实时页面
    mode: HTML # 用非严格的 HTML
    encoding: UTF-8
    servlet:
      content-type: text/html 
```

### 3.HTML引入 Thymeleaf

修改 html 标签用于引入 thymeleaf 引擎，这样才可以在其他标签里使用 `th:*` 语法，这是下面语法的前提。

```html
<!DOCTYPE html SYSTEM "http://www.thymeleaf.org/dtd/xhtml1-strict-thymeleaf-spring4-4.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:th="http://www.thymeleaf.org">
```

## 4. 常用语法

### 获取变量值

```html
<p th:text="'Hello！, ' + ${name} + '!'" >name</p>
```

可以看出获取变量值用 `$` 符号,对于javaBean的话使用 `变量名.属性名` 方式获取,这点和 `EL` 表达式一样.

另外 `$` 表达式只能写在th标签内部,不然不会生效,上面例子就是使用 `th:text` 标签的值替换 `p` 标签里面的值,至于 `p` 里面的原有的值只是为了给前端开发时做展示用的.这样的话很好的做到了前后端分离。

### 引入 URL

Thymeleaf 对于 URL 的处理是通过语法 `@{…}` 来处理的

```html
<a th:href="@{http://www.baidu.com}">绝对路径</a>
<a th:href="@{/}">相对路径</a>
<a th:href="@{css/bootstrap.min.css}">Content路径,默认访问static下的css文件夹</a>
```

类似的标签有:`th:href` 和 `th:src`

### 字符串替换

很多时候可能我们只需要对一大段文字中的某一处地方进行替换，可以通过字符串拼接操作完成：

```html
<span th:text="'Welcome to our application, ' + ${user.name} + '!'">
```

一种更简洁的方式是：

```html
<span th:text="|Welcome to our application, ${user.name}!|">
```

当然这种形式限制比较多，|…|中只能包含变量表达式${…}，不能包含其他常量、条件表达式等。

### 运算符

在表达式中可以使用各类算术运算符，例如+, -, *, /, %

```html
th:with="isEven=(${prodStat.count} % 2 == 0)"
```

逻辑运算符>, <, <=,>=，==,!=都可以使用，唯一需要注意的是使用<,>时需要用它的HTML转义符：

```html
th:if="${prodStat.count} &gt; 1"
th:text="'Execution mode is ' + ( (${execMode} == 'dev')? 'Development' : 'Production')"
```

### 条件

#### if/unless

Thymeleaf 中使用 `th:if` 和 `th:unless` 属性进行条件判断，下面的例子中，标签只有在 `th:if` 中条件成立时才显示：

```html
<a th:href="@{/login}" th:unless=${session.user != null}>Login</a>
```

`th:unless` 于 `th:if` 恰好相反，只有表达式中的条件不成立，才会显示其内容。

#### switch

Thymeleaf 同样支持多路选择 Switch 结构：

```html
<div th:switch="${user.role}">
  <p th:case="'admin'">User is an administrator</p>
  <p th:case="#{roles.manager}">User is a manager</p>
</div>
```

默认属性 default 可以用 * 表示：

```html
<div th:switch="${user.role}">
  <p th:case="'admin'">User is an administrator</p>
  <p th:case="#{roles.manager}">User is a manager</p>
  <p th:case="*">User is some other thing</p>
</div>
```

#### 循环

渲染列表数据是一种非常常见的场景，例如现在有 n 条记录需要渲染成一个表格，该数据集合必须是可以遍历的，使用 `th:each` 标签：

```html
<body>
  <h1>Product list</h1>

  <table>
    <tr>
      <th>NAME</th>
      <th>PRICE</th>
      <th>IN STOCK</th>
    </tr>
    <tr th:each="prod : ${prods}">
      <td th:text="${prod.name}">Onions</td>
      <td th:text="${prod.price}">2.41</td>
      <td th:text="${prod.inStock}? #{true} : #{false}">yes</td>
    </tr>
  </table>

  <p>
    <a href="../home.html" th:href="@{/}">Return to home</a>
  </p>
</body>
```

可以看到，需要在被循环渲染的元素（这里是）中加入 `th:each` 标签，其中 `th:each="prod : ${prods}"` 意味着对集合变量 `prods` 进行遍历，循环变量是 `prod` 在循环体中可以通过表达式访问。