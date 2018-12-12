# SpringMVC

## 1.搭建工程

### 1.1导入需要的包

```java
logging
jstl
spring-aop
spring-beans
spring-context
spring-core
spring-expression
spring-web
spring-webmvc
```

### 1.2 编写测试类

```java
@Controller
public class HelloController {

	@RequestMapping("hello")
	public ModelAndView hello(){
		System.out.println("hello springmvc....");
		//创建ModelAndView对象
		ModelAndView mav = new ModelAndView();
		//设置模型数据
		mav.addObject("msg", "hello springmvc...");
		//设置视图名字
		mav.setViewName("/WEB-INF/jsp/hello.jsp");
		return mav;
	}
    
  //hello.jsp
<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<title>Insert title here</title>
	</head>
	<body>
		${msg }
	</body>
</html>
```

### 1.3 SpringMVC核心配置文件

创建一个springmvc.xml文件

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:p="http://www.springframework.org/schema/p"
	xmlns:context="http://www.springframework.org/schema/context"
	xmlns:mvc="http://www.springframework.org/schema/mvc"
	xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans-4.0.xsd
        http://www.springframework.org/schema/mvc http://www.springframework.org/schema/mvc/spring-mvc-4.0.xsd
        http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context-4.0.xsd">
	
	<!-- 配置@Controller处理器，包扫描器 -->
	<context:component-scan base-package="com.lillusory.controller" />
</beans>

```

### 1.4 配置web.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns="http://java.sun.com/xml/ns/javaee"
	xsi:schemaLocation="http://java.sun.com/xml/ns/javaee http://java.sun.com/xml/ns/javaee/web-app_2_5.xsd"
	id="WebApp_ID" version="2.5">
	<display-name>SpringMVC01</display-name>
	<welcome-file-list>
		<welcome-file>index.html</welcome-file>
		<welcome-file>index.htm</welcome-file>
		<welcome-file>index.jsp</welcome-file>
		<welcome-file>default.html</welcome-file>
		<welcome-file>default.htm</welcome-file>
		<welcome-file>default.jsp</welcome-file>
	</welcome-file-list>
			<!-- 配置前端控制器 -->
	<servlet>
		<servlet-name>springmvc</servlet-name>
		<servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
           <!-- 加载springmvc核心配置文件 -->
		<init-param>
			<param-name>contextConfigLocation</param-name>
			<param-value>classpath:springmvc.xml</param-value>
		</init-param>
	</servlet>
      		<!-- 配置拦截路径 -->
	<servlet-mapping>
		<servlet-name>springmvc</servlet-name>
		<url-pattern>*.action</url-pattern>
	</servlet-mapping>
</web-app>
```

### 1.5 执行顺序分析

```java
上述配置好后,即可通过访问xxxx/hello.action访问到了
1.通过.action 找到拦截器servlet-name-->springmvc
2.通过servlet-name找到servlet-class DispatcherServlet
3.DispatcherServlet 加载配置文件
4.核心配置文件springmvc.xml中配置了包扫描
5.找到Controll包下带@Controller的类 helloControll.java
6.根据类上的	@RequestMapping("hello") 处理用户请求hello.action
7.处理完后返回
```

## 2.SpringMVC架构

### 2.1 默认加载的组件

#### 处理器和映射器

```xml
<!-- 1 配置处理器映射器 -->
	<bean class="org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping"/>
<!-- 1 处理器适配器 -->
	<bean class="org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter" />
<!-- 映射器与适配器必需配套使用，如果映射器使用了推荐的RequestMappingHandlerMapping，适配器也必需使用推荐的RequestMappingHandlerAdapter。-->

<!-- 2.注解驱动配置，代替映射器与适配器的单独配置，同时支持json响应(推荐使用) -->
	<mvc:annotation-driven />
```

#### 视图解析器

配置前

```java
//设置视图名字
		mav.setViewName("/WEB-INF/jsp/hello.jsp");
```

```xml
<!-- 配置视图解析器 -->
	<bean class="org.springframework.web.servlet.view.InternalResourceViewResolver">
		<!-- 配置视图响应的前缀 -->
		<property name="prefix" value="/WEB-INF/jsp/" />
		<!-- 配置视图响应的后缀 -->
		<property name="suffix" value=".jsp" />
	</bean>

```

配置后

```java
//设置视图名字
		mav.setViewName("hello");
```

### 2.2 架构

![](../../../MyProjects/lillusory.github.io/images/posts/Java/ssm/2018-12-12-SpringMVC架构.png)



## 3.参数绑定

### 3.1简单参数

```java
/**
     * 简单参数传递
     * @RequestParam用法：入参名字与方法名参数名不一致时使用{
     *  value:传入的参数名，required：是否必填,defaultValue:默认值
     */
    @RequestMapping("itemEdit")
    public ModelAndView itemEdit(@RequestParam(value="id",required=true,defaultValue="1")Integer ids){
       ModelAndView mav = new ModelAndView();
       //查询商品信息
       Item item = itemServices.getItemById(ids);
       //设置商品数据返回页面
       mav.addObject("item", item);
       //设置视图名称
       mav.setViewName("itemEdit");
       return mav;
    }
```

### 3.2Model/ModelMap

```java
/**
     * 返回String，通过Model/ModelMap返回数据模型
     * 跳转修改商品信息页面
     * @param id
     * @return
     */
    @RequestMapping("itemEdit")
    public String itemEdit(@RequestParam("id")Integer ids,Model m,ModelMap model){
       //查询商品信息
       Item item = itemServices.getItemById(ids);
       //通过Model把商品数据返回页面
       model.addAttribute("item", item);
       //返回String视图名字
       return "itemEdit";
    }
```

### 3.3绑定pojo对象

**要点：**表单提交的`name属性`必需与pojo的`属性名称`一致

```java
	 @RequestMapping("updateItem")
    public String updateItem(Item item,Model model){
       //更新商品
       itemServices.update(item);
       //返回商品模型
       model.addAttribute("item", item);
       //返回担任提示
       model.addAttribute("msg", "修改商品成功");
       //返回修改商品页面
       return "itemEdit";
    }
```

