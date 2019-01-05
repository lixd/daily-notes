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

