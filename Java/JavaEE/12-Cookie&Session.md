# 中文文件下载

> 针对浏览器类型，对文件名字做编码处理 Firefox (Base64) , IE、Chrome ... 使用的是URLEncoder

		/*
		 * 如果文件的名字带有中文，那么需要对这个文件名进行编码处理
		 * 如果是IE ，或者  Chrome （谷歌浏览器） ，使用URLEncoding 编码
		 * 如果是Firefox ， 使用Base64编码
		 */
		//获取来访的客户端类型
		String clientType = request.getHeader("User-Agent");
		
		if(clientType.contains("Firefox")){
			fileName = DownLoadUtil.base64EncodeFileName(fileName);
		}else{
			//IE ，或者  Chrome （谷歌浏览器） ，
			//对中文的名字进行编码处理
			fileName = URLEncoder.encode(fileName,"UTF-8");
		}

## 请求转发和重定向

### 重定向

```java
		/*
		之前的写法
		response.setStatus(302);
		response.setHeader("Location", "login_success.html");*/
		//重定向写法： 重新定位方向 参数即跳转的位置
	response.sendRedirect("login_success.html");
	1. 地址上显示的是最后的那个资源的路径地址
	2. 请求次数最少有两次， 服务器在第一次请求后，会返回302 以及一个地址， 浏览器在根据这个地址，执行第二次访问。
	3. 可以跳转到任意路径。 不是自己的工程也可以跳。
	4. 效率稍微低一点， 执行两次请求。 
	5. 后续的请求，没法使用上一次的request存储的数据，或者 没法使用上一次的request对象，因为这是两次不同的请求。
```

### 请求转发

```java
	//请求转发的写法： 参数即跳转的位置
	request.getRequestDispatcher("login_success.html").forward(request, response);
	1. 地址上显示的是请求servlet的地址。  返回200 ok
	2. 请求次数只有一次， 因为是服务器内部帮客户端执行了后续的工作。 
	3. 只能跳转自己项目的资源路径 。  
	4. 效率上稍微高一点，因为只执行一次请求。 
	5. 可以使用上一次的request对象。 
```

# Cookie

> 饼干. 其实是一份小数据， 是服务器给客户端，并且存储在客户端上的一份小数据

### 应用场景

> 自动登录、浏览记录、购物车

> http的请求是无状态。 客户端与服务器在通讯的时候，是无状态的，其实就是客户端在第二次来访的时候，服务器根本就不知道这个客户端以前有没有来访问过。 为了更好的用户体验，更好的交互 [自动登录]，其实从公司层面讲，就是为了更好的收集用户习惯[大数据]


### 简单使用

```java
//添加Cookie给客户端
//1. 在响应的时候，添加cookie
Cookie cookie = new Cookie("aa", "bb");
//给响应，添加一个cookie
response.addCookie(cookie);
```

1. 客户端收到的信息里面，响应头中多了一个字段 Set-Cookie

```java
获取客户端带过来的Cookie
//获取客户端带过来的cookie
	Cookie[] cookies = request.getCookies();
	if(cookies != null){
		for (Cookie c : cookies) {
			String cookieName = c.getName();
			String cookieValue = c.getValue();
			System.out.println(cookieName + " = "+ cookieValue);
		}
	}
```

### 常用方法


```java
	//关闭浏览器后，cookie就没有了。 ---> 针对没有设置cookie的有效期。
	//	expiry： 有效 以秒计算。
	//正值 ： 表示 在这个数字过后，cookie将会失效。
	//负值： 关闭浏览器，那么cookie就失效， 默认值是 -1
	cookie.setMaxAge(60 * 60 * 24 * 7);
	//赋值新的值
	//cookie.setValue(newValue);
	//用于指定只有请求了指定的域名，才会带上该cookie
	cookie.setDomain(".itheima.com");
	//只有访问该域名下的cookieDemo的这个路径地址才会带cookie
	cookie.setPath("/CookieDemo");
```

## 例子一 显示最近访问的时间。

1. 判断账号是否正确

2. 如果正确，则获取cookie。 但是得到的cookie是一个数组， 我们要从数组里面找到我们想要的对象。

3. 如果找到的对象为空，表明是第一次登录。那么要添加cookie

4. 如果找到的对象不为空， 表明不是第一次登录。 


```java
	if("admin".equals(userName) && "123".equals(password)){
		//获取cookie last-name --- >
		Cookie [] cookies = request.getCookies();
		//从数组里面找出我们想要的cookie
		Cookie cookie = CookieUtil.findCookie(cookies, "last");
		//是第一次登录，没有cookie
		if(cookie == null){
			Cookie c = new Cookie("last", System.currentTimeMillis()+"");
			c.setMaxAge(60*60); //一个小时
			response.addCookie(c);
			response.getWriter().write("欢迎您, "+userName);	
		}else{
			//1. 去以前的cookie第二次登录，有cookie
			long lastVisitTime = Long.parseLong(cookie.getValue());
			
			//2. 输出到界面，
			response.getWriter().write("欢迎您, "+userName +",上次来访时间是："+new Date(lastVisitTime));
            			//3. 重置登录的时间
			cookie.setValue(System.currentTimeMillis()+"");
			response.addCookie(cookie);
		}
	}else{
		response.getWriter().write("登陆失败 ");
	}
```

## JSP


Jsp 里面使用Java代码

* jsp

> Java Server Pager ---> 最终会翻译成一个类， 就是一个Servlet

```java
- 定义全局变量
  <%! int a = 99; %>
- 定义局部变量
  <% int b = 999; %>
- 在jsp页面上，显示 a 和 b的值，
  <%=a %> 
  <%=b %>
```

### jsp显示浏览记录

### 清除浏览记录

> 其实就是清除Cookie， 删除cookie是没有什么delete方法的。只有设置maxAge 为0 。


```java
	Cookie cookie = new Cookie("history","");
	cookie.setMaxAge(0); //设置立即删除
	cookie.setPath("/CookieDemo02");
	response.addCookie(cookie);
```

### Cookie总结

```java
1. 服务器给客户端发送过来的一小份数据，并且存放在客户端上。
2. 获取cookie， 添加cookie
   request.getCookie();
   response.addCookie();
3. Cookie分类
   会话Cookie
   	默认情况下，关闭了浏览器，那么cookie就会消失。
   持久Cookie

在一定时间内，都有效，并且会保存在客户端上。 
cookie.setMaxAge(0); //设置立即删除
cookie.setMaxAge(100); //100 秒
```
1. Cookie的安全问题。

> 由于Cookie会保存在客户端上，所以有安全隐患问题。  还有一个问题， Cookie的大小与个数有限制。 为了解决这个问题 ---> Session .

# Session

> 会话 ， Session是基于Cookie的一种会话机制。 Cookie是服务器返回一小份数据给客户端，并且存放在客户端上。 Session是，数据存放在服务器端。


* 常用API


```java
	//得到会话ID
	String id = session.getId();
	//存值
	session.setAttribute(name, value);
	//取值
	session.getAttribute(name);	
	//移除值
	session.removeAttribute(name);
```

* Session何时创建  ， 何时销毁?

* 创建

```java
如果有在servlet里面调用了 request.getSession()就创建
```

* 销毁

```java
session 是存放在服务器的内存中的一份数据。 当然可以持久化. Redis . 即使关了浏览器，session也不会销毁。
1. 关闭服务器
2. session会话时间过期。 有效期过了，默认有效期： 30分钟。
```



#例子三： 简单购物车。


###CartServlet 代码


```java
	response.setContentType("text/html;charset=utf-8");
		
		//1. 获取要添加到购物车的商品id
		int id = Integer.parseInt(request.getParameter("id")); // 0 - 1- 2 -3 -4 
		String [] names = {"Iphone7","小米6","三星Note8","魅族7" , "华为9"};
		//取到id对应的商品名称
		String name = names[id];
		
		//2. 获取购物车存放东西的session  Map<String , Integer>  iphoen7 3
		//把一个map对象存放到session里面去，并且保证只存一次。 
		Map<String, Integer> map = (Map<String, Integer>) request.getSession().getAttribute("cart");
		//session里面没有存放过任何东西。
		if(map == null){
			map = new LinkedHashMap<String , Integer>();
			request.getSession().setAttribute("cart", map);
		}
				//3. 判断购物车里面有没有该商品
		if(map.containsKey(name)){
			//在原来的值基础上  + 1 
			map.put(name, map.get(name) + 1 );
		}else{
			//没有购买过该商品，当前数量为1 。
			map.put(name, 1);
		}
		
		//4. 输出界面。（跳转）
		response.getWriter().write("<a href='product_list.jsp'><h3>继续购物</h3></a><br>");
		response.getWriter().write("<a href='cart.jsp'><h3>去购物车结算</h3></a>");
```


##移除Session中的元素

```java
	//方式一.制干掉会话，里面存放的任何数据就都没有了。
	session.invalidate();
	//方式二.从session中移除某一个数据
	session.removeAttribute("cart");
```

# 总结：

* 请求转发和重定向


* Cookie

  服务器给客户端发送一小份数据， 存放在客户端上。

  基本用法：

  ```java
  //添加cookie
  Cookie cookie = new Cookie("aa", "bb");
  response.addCookie(cookie);
  //获取cookie。
  Cookie[] cookies = request.getCookies();
  ```

* 什么时候有cookie

  ```java
  response.addCookie(new Cookie())
  ```

* Cookie 分类

   会话Cookie

   关闭浏览器，就失效
   持久cookie
   存放在客户端上。 在指定的期限内有效。

   ```java
   	setMaxAge();
   ```


* Session

   也是基于cookie的一种会话技术，  数据存放存放在服务器端

   ```java
   会在cookie里面添加一个字段 JSESSIONID . 是tomcat服务器生成。 
   
   setAttribute 存数据
    
   getAttribute 取数据
   
   removeAttribute  移除数据
   
   getSessionId();  获取会话id
   
   invalidate() 强制让会话失效。
   ```

* 创建和销毁

	，调用request.getSesion创建 
	
	 服务器关闭 ， 会话超时（30分）


setAttribute 存放的值， 在浏览器关闭后，还有没有。  有！，就算客户端把电脑砸了也还有。


​		


