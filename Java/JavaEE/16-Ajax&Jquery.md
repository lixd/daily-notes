# Ajax & Jquery

##  1.Ajax

* 是什么?

> “Asynchronous Javascript And XML”（异步JavaScript和XML），

> 并不是新的技术，只是把原有的技术，整合到一起而已。 

		   1.使用CSS和XHTML来表示。
		   2.使用DOM模型来交互和动态显示。
		   3.使用XMLHttpRequest来和服务器进行异步通信。
		   4.使用javascript来绑定和调用。

* 有什么用?

> 咱们的网页如果想要刷新局部内容。 那么需要重新载入整个网页。用户体验不是很好。  就是为了解决局部刷新的问题。 保持其他部分不动，只刷新某些地方。 

##  1.1数据请求 Get


```java
1.创建对象
	function ajaxFunction() {
		var xmlHttp;
		try { // Firefox, Opera 8.0+, Safari
			xmlHttp = new XMLHttpRequest();
		} catch (e) {
			try {// Internet Explorer
				xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
			} catch (e) {
				try {
					xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
				} catch (e) {
				}
			}
		}
		return xmlHttp;
	}
2. 发送请求
	//执行get请求
function get() {
	//1. 创建xmlhttprequest 对象
	var request = ajaxFunction();
	//2. 发送请求。
	// http://localhost:8080/day16/demo01.jsp
	//http://localhost:8080/day16/DemoServlet01
	/*	
		参数一： 请求类型  GET or  POST
		参数二： 请求的路径
		参数三： 是否异步， true  or false
	*/
	request.open("GET" ,"/day16/DemoServlet01" ,true );
	request.send();
}

如果发送请求的同时，还想获取数据，那么代码如下

//执行get请求
function get() {
	
	//1. 创建xmlhttprequest 对象
	var request = ajaxFunction();
	
	//2. 发送请求
	request.open("GET" ,"/day16/DemoServlet01?name=aa&age=18" ,true );
	
	//3. 获取响应数据 注册监听的意思。  一会准备的状态发生了改变，那么就执行 = 号右边的方法
	request.onreadystatechange = function(){
		//前半段表示 已经能够正常处理。  再判断状态码是否是200
		if(request.readyState == 4 && request.status == 200){
			//弹出响应的信息
			alert(request.responseText);
		}
	}
	request.send();
}

```

##  1.2 数据请求 Post

```java
<script type="text/javascript">
//1. 创建对象
function  ajaxFunction(){
   var xmlHttp;
   try{ // Firefox, Opera 8.0+, Safari
        xmlHttp=new XMLHttpRequest();
    }
    catch (e){
	   try{// Internet Explorer
	         xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");
	      }
	    catch (e){
	      try{
	         xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");
	      }
	      catch (e){}
	      }
    }

	return xmlHttp;
 }

function post() {
	//1. 创建对象
	var request = ajaxFunction();
	//2. 发送请求
	request.open( "POST", "/day16/DemoServlet01", true );
	//如果不带数据，写这行就可以了
	//request.send();
	//如果想带数据，就写下面的两行
	//如果使用的是post方式带数据，那么 这里要添加头， 说明提交的数据类型是一个经过url编码的form表单数据
	request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	//带数据过去  ， 在send方法里面写表单数据。 
	request.send("name=aobama&age=19");
}
</script>
需要获取数据
	function post() {
		//1. 创建对象
		var request = ajaxFunction();
		
		//2. 发送请求
		request.open( "POST", "/day16/DemoServlet01", true );
		
		//想获取服务器传送过来的数据， 加一个状态的监听。 
		request.onreadystatechange=function(){
			if(request.readyState==4 && request.status == 200){
				
				alert("post："+request.responseText);
			}
		}
		
		//如果使用的是post方式带数据，那么 这里要添加头， 说明提交的数据类型是一个经过url编码的form表单数据
		request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		
		//带数据过去  ， 在send方法里面写表单数据。 
		request.send("name=aobama&age=19");
	}
```




## Demo 校验用户名是否可用

### 1. 搭建环境

1. 页面准备

    ```html
    <table>
    	<tr>
    	<td>姓名:</td>
    	<td><input type="text" name="username" id="name" onblur="post()"><span id="span01"></span></td>
    	</tr>
    	<tr>
    	<td>密码:</td>
    	<td><input type="text" name="password"></td>
    	</tr>
    	<tr>
    	<td>邮箱:</td>
    	<td><input type="text" name="email"></td>
    	</tr>
    	<tr>
    	<td>验证码:</td>
    	<td><input type="text" name="vercode"></td>
    	</tr>
    	<tr>
    	<td>简介:</td>
    	<td><input type="text" name="info"></td>
    	</tr>
    	</table>
    ```


2. 数据库准备

### 2. Servlet代码

```java
protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			request.setCharacterEncoding("UTF-8");
			// 1.检测是否存在
			String username = request.getParameter("username");	
			System.out.println("username:"+username);
			UserService service=new UserServiceImpl();
			boolean isExist = service.checkUserName(username);
			//2 . 通知界面 检测结果
			if(isExist) {
				response.getWriter().print(1);//存在
			}else {
				response.getWriter().print(2);//不存在
			}
		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}
```

### 3. Dao代码


```java
	public class UserDaomImpl implements UserDao{
		@Override
		public boolean checkUserName(String username) throws SQLException {
			QueryRunner runner = new QueryRunner(JDBCUtil02.getDataSource());
			String sql = "select count(*) from t_user where username =?";
						runner.query(sql, new  ScalarHandler(), username);
			Long result = (Long) runner.query(sql, new  ScalarHandler(), username); 
			return result > 0 ;
		}
	}
```

###  4.jsp页面显示

```java
	function checkUserName() {
//获取输入框的值 document 整个网页
	var name = document.getElementById("name").value; // value  value() val val()
	//1. 创建对象
	var request = ajaxFunction();
	//2. 发送请求
	request.open("POST"  ,"/day16/CheckUserNameServlet" , true );
	//注册状态改变监听，获取服务器传送过来的数据
	request.onreadystatechange = function(){
		if(request.readyState == 4 && request.status == 200){
			//alert(request.responseText);
			var data = request.responseText;
			if(data == 1){
				document.getElementById("span01").innerHTML = "<font color='red'>用户名已存在!</font>";
			}else{
				document.getElementById("span01").innerHTML = "<font color='green'>用户名可用!</font>";
			}
		}
	}
	request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	request.send("name="+name);
}
```

##  2.JQuery

* 是什么?

> javascript 的代码框架。  

* 有什么用?

> 简化代码，提高效率。  

* 核心 

> write less do more , 写得更少，做的更多。 

### load

```java
<a href="" onclick="load()">使用JQuery执行load方法</a>
有两次刷新，  先走 onClick的方法，取到数据回来之后，赋值显示。 接着 走 href=""的路径，但是这个属性没有给值，所以会把当前的页面重新再刷新一次。所以导致看不见值。
//找到这个元素， 去执行加载的动作， 加载/day16/DemoServlet02 ， 得到的数据，赋值显示
$("#aaa").load("/day16/DemoServlet02" , function(responseText , statusTXT  , xhr) {
		//找到id为text01的元素， 设置它的value属性值为 responseText 对应的值
		$("#aaa").val(responseText);
	});
```

### Get


```java
$.get("/day16/DemoServlet02", function(data ,status) {
		$("#div01").text(data);
	});
```

# 赋值显示

* val("aa"); 

> 只能放那些标签带有value属性
* html("aa"); ---写html代码
* text("aa");

> 其实没有什么区别，如果想针对这分数据做html样式处理，那么只能用html()

### load & get


* load

   $("#元素id").load(url地址);

   ```javascript
   $("#div1").load(serlvet); ---> 使用的get请求，回来赋值的时候， 使用text（）;去赋值
   ```
* get

  	语法格式 ： $.get(URL,callback);	


```javascript
	使用案例： $.get("/day16/DemoServlet02"  , function(data ,status) {
		$("#div01").text(data);
	});
```
* post

  	语法格式：$.post(URL,data,callback);


```javascript
	function post() {
		$.post("/day16/DemoServlet02", {name:"zhangsan",age:18},function(data,status) {
			//想要放数据到div里面去。 --- 找到div
			$("#div01").html(data);
		});
	}
```

### 使用JQuery去实现校验用户名

		function checkUserName() {
			//1. 获取输入框的内容
			var name = $("#name").val();
			
			//2. 发送请求
			$.post("/day16/CheckUserNameServlet" , {name:name} , function(data , status){
				//alert(data);
				if(data == 1){//用户名存在
					//alert("用户名存在");
					$("#span01").html("<font color='red'>用户名已被注册</font>");
				}else{
					//alert("用户名可用");
					$("#span01").html("<font color='green'>用户名可以使用</font>");
				}
			} );
			//3. 输出响应的数据到页面上。
		}


## 实现百度搜索提示

###搭建环境

1. 定义首页

   	<body>
   	<center>
   	<h2>黑马</h2>
   		<input type="text" name="word" id="word" style="width: 600px ; height: 50px  ;font-size: 20px;">
   		<input type="button" value="黑马一下"  style="height: 55px ; width: 100px ; ">
   		
   		<div id="div01" style="position:relative; left : -54px; width: 600px; height: 200px ; border:  1px solid blue; display: none"></div>
   	</center>
   	</body>

2. 定义数据库


###捕获键盘弹起

$(function(){
	$("#word").keyup(function() {
		alert("键盘弹起了..");
	})
});


###JS请求


	$(function(){
		$("#word").keyup(function() {
			//2。 获取输入框的值 
			//var word = $("#word").val();
			//this  对应就是执行这个方法的那个对象， $("#word")
			var word = $(this).val();
	
			if(word == ""){
				$("#div01").hide();
			}else{
				//3. 请求数据。
				$.post("find",{word:word} ,function(data , status){
					//alert(data);
					$("#div01").show();
					$("#div01").html(data);
				});
			}
			
		})
	});


###Servlet代码

			protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
	
			request.setCharacterEncoding("utf-8");
			try {
				//1. 先获取参数
				String word = request.getParameter("word");
				System.out.println("word="+word);
				
				//2. 让dao执行查询
				WordsDao dao = new WordsDaoImpl();
				List<WordBean> list = dao.findWords(word);
				
				for (WordBean wordBean : list) {
					System.out.println("==="+wordBean.toString());
				}
				
				request.setAttribute("list", list);
				
				//3. 返回数据
				response.setContentType("text/html;charset=utf-8");
				//response.getWriter().write("数据是：");
				request.getRequestDispatcher("list.jsp").forward(request, response);
			} catch (SQLException e) {
				e.printStackTrace();
			}
		
		}

###list.jsp

		<%@ page language="java" contentType="text/html; charset=UTF-8"
		    pageEncoding="UTF-8"%>
		 <%@ taglib uri="http://java.sun.com/jsp/jstl/core"  prefix="c"%>


​		
		<table style="width: 100%">
			<c:forEach items="${list }" var="wordBean">
				<tr>
					<td>${wordBean.words}</td>
				</tr>
			</c:forEach>
		</table>


##使用JQuery实现 省市联动

###环境准备

1. 准备数据库

2 。 准备页面


		<script type="text/javascript" src="js/jquery-1.11.3.min.js"></script>
			<script type="text/javascript" src="js/city.js"></script>
			</head>
			<body>
			省份: <select name="province" id ="province">
					<option value="" >-请选择 -
					<option value="1" >广东
					<option value="2" >湖南
					<option value="3" >湖北
					<option value="4" >四川
				</select>
			城市: 
				<select name="city" id="city">
					<option value="" >-请选择 -
				</select>
			</body>


###XStream的使用

		//3. 返回数据。手动拼  ---> XStream  转化 bean对象成 xml
			XStream xStream = new XStream();
			
			//想把id做成属性
			xStream.useAttributeFor(CityBean.class, "id");
			
			//设置别名
			xStream.alias("city", CityBean.class);
			
			//转化一个对象成xml字符串
			String xml = xStream.toXML(list);


###JS代码


		$(function() {
		//1。找到省份的元素
		$("#province").change(function() {
			//2. 一旦里面的值发生了改变，那么就去请求该省份的城市数据
			//$("#province").varl();
			var pid = $(this).val();
			
			/*<list>
				<city>
					<id>1<id>
					<pid>1</pid>
					<cname>深圳</cname>
				</city>
				<city >
					<id>2<id>
					<pid>1</pid>
					<cname>东莞</cname>
				</city>
			</list>*/
			
			$.post( "CityServlet",{pid:pid} ,function(data,status){
				//alert("回来数据了:"+data);
				
				//先清空以前的值：
				$("#city").html("<option value='' >-请选择-")
				//遍历： 
				//从data数据里面找出所有的city  ， 然后遍历所有的city。
				//遍历一个city，就执行一次function方法
				$(data).find("city").each(function() {
					
					//遍历出来的每一个city，取它的孩子。 id , cname
					var id = $(this).children("id").text();
					var cname = $(this).children("cname").text();
					
					$("#city").append("<option value='"+id+"' >"+cname)
				});
			} );
			
		});
	});

##服务器和客户端数据传输的方式

* xml

  	<list>
  			<city>
  				<id>1<id>
  				<pid>1</pid>
  				<cname>深圳</cname>
  			</city>
  			<city >
  				<id>2<id>
  				<pid>1</pid>
  				<cname>东莞</cname>
  			</city>
  		</list>

* json

  阅读性更好 、 容量更小。

  {"name":"aaa" , "age":19}


		把javaBean  转化成 json数据
	
		//3. 把list ---> json数据
			//JSONArray ---> 变成数组 ， 集合  []
			//JSONObject ---> 变成简单的数据  { name : zhangsan , age:18}
			
			JSONArray jsonArray = JSONArray.fromObject(list);
			String json = jsonArray.toString();


##使用json格式数据显示省市联动效果
	serlvet代码：

		protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
	
		try {
			//1. 获取参数
			int pid = Integer.parseInt(request.getParameter("pid"));
			
			//2 找出所有的城市
			CityDao dao = new CityDaoImpl();
			List<CityBean> list = dao.findCity(pid);
			
			//3. 把list ---> json数据
			//JSONArray ---> 变成数组 ， 集合  []
			//JSONObject ---> 变成简单的数据  { name : zhangsan , age:18}
			
			JSONArray jsonArray = JSONArray.fromObject(list);
			String json = jsonArray.toString();


			response.setContentType("text/html;charset=utf-8");
			response.getWriter().write(json);


		} catch (SQLException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		};
	}



	js代码


		$(function() {
			//1。找到省份的元素
			$("#province").change(function() {
				//2. 一旦里面的值发生了改变，那么就去请求该省份的城市数据
				//$("#province").varl();
				var pid = $(this).val();
				
				/*[
				    {
				        "cname": "深圳",
				        "id": 1,
				        "pid": 1
				    },
				    {
				        "cname": "东莞",
				        "id": 2,
				        "pid": 1
				    }
				    ...
				]*/
				$.post( "CityServlet02",{pid:pid} ,function(data,status){
					
					//先清空
					$("#city").html("<option value='' >-请选择-");
					//再遍历，追加
					$(data).each(function(index , c) {
						$("#city").append("<option value='"+c.id+"' >"+c.cname)
					});
				},"json" );
				
			});
		});


##总结

###Ajax  

	发送get请求
	
	发送post请求
	
	都要求带数据 + 获取数据＋　放置到元素上。

###JQuery


	发送get请求
	
	发送post请求
	
	都要求带数据 + 获取数据＋　放置到元素上。
	
	---------------------------------------
	
	1. 服务器返回xml数据


	2. 服务器返回json数据


