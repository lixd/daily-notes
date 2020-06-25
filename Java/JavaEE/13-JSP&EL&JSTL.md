# JSP & EL & JSTL

#1.jsp

> Java Server Page 

* 什么是jsp

> 从用户角度看待 ，就是是一个网页 ， 从程序员角度看待 ， 其实是一个java类， 它继承了servlet，所以可以直接说jsp 就是一个Servlet.

* 为什么会有jsp?

> html 多数情况下用来显示静态内容 ， 一成不变的。 但是有时候我们需要在网页上显示一些动态数据， 比如： 查询所有的学生信息， 根据姓名去查询具体某个学生。  这些动作都需要去查询数据库，然后在网页上显示。 html是不支持写java代码  ， jsp里面可以写java代码。 

## 怎么用JSP

### 指令写法

```xml
<%@ 指令名字 %>
```

### page指令

```java
- language="java" 表明jsp页面中可以写java代码
- contentType
其实即使说这个文件是什么类型，告诉浏览器我是什么内容类型，以及使用什么编码
    	contentType="text/html; charset=UTF-8"
    	text/html  MIMEType 这是一个文本，html网页
- pageEncoding  jsp内容编码
- extends 用于指定jsp翻译成java文件后，继承的父类是谁，一般不用改。
- import 导包使用的，一般不用手写。
- session 值可选的有true or false .用于控制在这个jsp页面里面，能够直接使用session对象。
//具体的区别是，请看翻译后的java文件   
//如果该值是true , 那么在代码里面会有getSession（）的调用，
//如果是false :  那么就不会有该方法调用，也就是没有session对象了。在页面上自然也就不能使用session了。
- errorPage 指的是错误的页面， 值需要给错误的页面路径
- isErrorPage  上面的errorPage 用于指定错误的时候跑到哪一个页面去。 那么这个isErroPage , 就是声明某一个页面到底是不是错误的页面。
//exception.toString(); 在错误页面获取出错信息
```

### include 

```java
包含另外一个jsp的内容进来。
    	<%@ include file="other02.jsp"%>
//- 背后细节: 编译后合在一个文件中了,把另外一个页面的所有内容拿过来一起输出。 所有的标签元素都包含进来。
```

### taglib

```xml
<%@ taglib prefix=""  uri=""%>  
uri: 标签库路径
prefix : 标签库的别名  
```

## JSP 动作标签

```jsp
<jsp:include page=""></jsp:include>
<jsp:param value="" name=""/>
<jsp:forward page=""></jsp:forward>
```

### jsp:include

```jsp

```

### jsp:forward

```jsp
<jsp:forward page="">/jsp:forward 前往哪一个页面。  
  <% 
  	//等同于请求转发
  	request.getRequestDispatcher("other02.jsp").forward(request, response);
  %>	
```

### jsp:param 

```jsp
 意思是： 在包含某个页面的时候，或者在跳转某个页面的时候，加入这个参数。
<jsp:forward page="other02.jsp">
	<jsp:param value="beijing" name="address"/>
/jsp:forward
  在other02.jsp中获取参数
  <br>收到的参数是：<br>
  <%= request.getParameter("address")%>
```

## JSP内置对象(9个)

> 所谓内置对象，就是我们可以直接在jsp页面中使用这些对象。 不用创建。

- pageContext
- request
- session
- application

以上4个是作用域对象 , 

* 作用域 

> 表示这些对象可以存值，他们的取值范围有限定。  setAttribute   和  getAttribute


```xml
	使用作用域来存储数据<br>
	<%
		pageContext.setAttribute("name", "page");
		request.setAttribute("name", "request");
		session.setAttribute("name", "session");
		application.setAttribute("name", "application");
	%>
	取出四个作用域中的值<br>
	<%=pageContext.getAttribute("name")%>
	<%=request.getAttribute("name")%>
	<%=session.getAttribute("name")%>
	<%=application.getAttribute("name")%>
```

作用域范围大小：

```java
pageContext -- request --- session -- application 
```


### 四个作用域的区别

```java
- pageContext 【PageContext】
作用域仅限于当前的页面。  还可以获取到其他八个内置对象。
- request 【HttpServletRequest】
作用域仅限于一次请求， 只要服务器对该请求做出了响应。 这个域中存的值就没有了。
- session 【HttpSession】
作用域限于一次会话（多次请求与响应） 当中。 
- application 【ServletContext】
整个工程都可以访问， 服务器关闭后就不能访问了。 
- out		 【JspWriter】
- response  【HttpServletResponse】
- exception  【Throwable】
- page	 【Object】 ---就是这个jsp翻译成的java类的实例对象
- config 【ServletConfig】
```

```java
out对象输出
<%out.write("out输出的内容"); %>
response对象输出
<%response.getWriter().write("response输出的内容"); %>
    
 //先输出response对象的内容 其他的在按顺序输出
```



# 2.EL表达式

> 是为了简化咱们的jsp代码，具体一点就是为了简化在jsp里面写的那些java代码。

### 写法格式

${表达式 }

> 如果从作用域中取值，会先从小的作用域开始取，如果没有，就往下一个作用域取。  一直把四个作用域取完都没有， 就没有显示。



### 取值。


```java
	<%
		pageContext.setAttribute("name", "page");
		request.setAttribute("name", "request");
		session.setAttribute("name", "session");
		application.setAttribute("name", "application");
	%>
	按普通手段取值<br>
	<%= pageContext.getAttribute("name")%>
	<%= request.getAttribute("name")%>
	<%= session.getAttribute("name")%>
	<%= application.getAttribute("name")%>
	<br>使用EL表达式取出作用域中的值<br>
	${ pageScope.name }
	${ requestScope.name }
	${ sessionScope.name }
	${ applicationScope.name }
```

#### 数组

```java
<%
		String [] a = {"aa","bb","cc","dd"};
		pageContext.setAttribute("array", a);
%>
		使用EL表达式取出作用域中数组的值<br>	
		${array[0] } , ${array[1] },${array[2] },${array[3] }		
```
#### List集合


```java
<% 
List list=new ArrayList();
list.add(11);
list.add(22);
list.add(33);
list.add(44);
pageContext.setAttribute("List", list);
%>
--------取List集合中的值<br>
${List[0]},${List[1]},${List[2]},${List[3]}
```

#### Map集合

```java
<% 
Map map=new HashMap();
map.put("name", "lillusory");
map.put("address", "ChongQing");
map.put("age", "22");
map.put("Job", "Java");
pageContext.setAttribute("Map", map);
%>
--------EL表达式取Map集合中的值<br>
${Map.name },${Map.address },${Map.age },${Map.Job },
```

### 取值细节：

#### 1.从域中取值

得先存值。

两种方式

1.指定取值域 若指定的域中没找到就不显示

2.不指定取值域

```java
<%
pageContext.setAttribute("name", "zhangsan");
session.setAttribute("name", "lisi...");
%>
//直接指定说到pageContext作用域里面去找这个name
${ pageScope.name } 
// 未指定,先从page里面找，没有去request找，去session，去application <br>
${ name }
```
#### 2.取值方式

如果这份值是有下标的，那么直接使用[] `数组`,`list集合`等

```java
<%
	String [] array = {"aa","bb","cc"}
	session.setAttribute("array",array);
%>
${ array[1] } --> 这里array说的是attribute的name 
```

如果没有下标， 直接使用 .的方式去取` map集合`


```java
<%
	User user = new User("zhangsan",18);
	session.setAttribute("u", user);
%>
${ u.name }  , ${ u.age } 
```

**一般使用EL表达式，用的比较多的，都是从一个对象中取出它的属性值，比如取出某一个学生的姓名。**

##  EL表达式 的11个内置对象。 

${ 对象名.成员 } 括号中能直接用的就是内置对象

- pageContext  pageContext 实例对应于当前页面的处理

作用域相关对象
- pageScope
- requestScope
- sessionScope
- applicationScope

头信息相关对象
- header
- headerValues

参数信息相关对象
- param
- paramValues


- cookie
  全局初始化参数
- initParam

# 3.JSTL

> 全称 ： JSP Standard Tag Library  jsp标准标签库

> 简化jsp的代码编写。 替换 <%%> 写法。 一般与EL表达式配合

### 怎么使用

1. 导入jar文件到工程的WebContent/Web-Inf/lib  jstl.jar standard.jar

2. 在jsp页面上，使用taglib 指令，来引入标签库

3. 注意： 如果想支持 EL表达式，那么引入的标签库必须选择1.1的版本，1.0的版本不支持EL表达式。


```java
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
```

### 常用标签

```java
c:set/c:set
<c:if test="">/c:if
c:forEach/c:forEach
```

#### c:set


```xml
	<!-- 声明一个对象name， 对象的值 zhangsan , 存储到了page（默认） ， 指定是session -->
	<c:set var="name" value="zhangsan" scope="session"></c:set>
	${sessionScope.name }
```

#### c:if

> 判断test里面的表达式是否满足，如果满足，就执行c:if标签中的输出 ， c:if 是没有else的。 

```xml
	<c:set var="age" value="18" ></c:set>
	-------------
	<c:if test="${ age > 26 }">
		年龄大于了26岁...
	</c:if>
	<c:if test="${ age <= 26 }">
		年龄小于了26岁...
	</c:if>
	----------------
	定义一个变量名 flag  去接收前面表达式的值，然后存在session域中
	<c:if test="${ age > 26 }" var="flag" scope="session">
		年龄大于了26岁...
	</c:if>
```

#### c:forEach


```xml
	从1 开始遍历到10 ，得到的结果 ，赋值给 i ,并且会存储到page域中， step  增幅为2， 
	<c:forEach begin="1" end="10" var="i" step="2">
		${i } 
	</c:forEach>
	-----------------------------------------------
	<!-- items : 表示遍历哪一个对象，注意，这里必须写EL表达式。 
	var: 遍历出来的每一个元素用user 去接收。 -->
<%
	List userlist=new ArrayList();
	userlist.add(new User("zhangsan","12"));
	userlist.add(new User("lisi","13"));
	userlist.add(new User("wangwu","14"));
	userlist.add(new User("Lillisury","22"));
	pageContext.setAttribute("userList", userlist);
	%>	
	----------foreach--------
	<c:forEach var="user" items="${userList }">
	${user.name }------${user.age }
	</c:forEach>
```

# 总结：

* JSP

  	三大指令

  		page
  		include
  		taglib
  	
  	三个动作标签
  		<jsp:include>
  		<jsp:forward>
  		<jsp:param>


  	九个内置对象

  		四个作用域
  			pageContext
  			request
  			session
  			application
  	
  		out
  		exception
  		response
  		page
  		config


​			

* EL

  ${ 表达式 }

  取4个作用域中的值

  	${ name }

  有11个内置对象。

  	pageContext
		
  	pageScope
  	requestScope
  	sessionScope
  	applicationScope
  	
  	header
  	headerValues
  	
  	param
  	paramValues
  	
  	cookie
  	initParam

* JSTL

> 使用1.1的版本， 支持EL表达式， 1.0不支持EL表达式

> 拷贝jar包， 通过taglib 去引入标签库

	<c:set>
	<c:if>
	<c:forEach>
