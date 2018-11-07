# 今日目标

#### 使用CSS完成网站首页的优化

#### 使用CSS完成网站注册页面的优化

#### 使用JS完成简单的数据校验

#### 使用JS完成图片轮播效果

### 教学目标：

- 了解CSS的概念
- 了解CSS的引入方式
- 了解CSS的基本用法和常用的选择器
- 了解CSS的盒子模型，悬浮和定位
- 了解JS的概念
- 掌握JS的基本语法，数据类型，能够使用JS完成简单的页面交互


去年的内容简单回顾

什么HTML : 超文本标记语言

p标签: 段落标签

br标签: 简单换行

h1-h6: 标题标签

hr标签: 水平分割线, 华丽的分割线

font标签: color属性改变颜色 , size

b标签: 加粗

i标签: 斜体



strong标签: 带语义的加粗

em标签: 斜体标签,带语义



img标签: 图片标签 显示图片

​	src: 指定图片路径(相对路径)

​	width: 宽度

​	height: 高度

​	alt: 图片加载失败时的提示

相对路径:

​	./  代表当前路径

​	../ 代表的是上一级路径

​	../../  代表的是上上一级路径



ul标签: 无序列表

ol标签: 有序列表

li标签: 列表项



a标签: 超链接标签:

​	target: 打开方式

​	href:  指定要跳转的链接地址



table标签:  table > tr > td

tr标签: 行

td标签: 列

​	合并行: rowspan

​	合并列: colspan



网站注册案例:

​	form 标签: 表单标签,主要是用来向服务器提交数据

​		method: 提交方式 get  post

​		action : 提交的路径

​	input 标签:

​			type: 

​				password: 密码框

​				text : 文本

​				submit:  提交

​				button:  普通的按钮

​				reset:  重置按钮

​				radio: 单选按钮 设置name属性让它们是一组

​				checkbox: 复选按钮 

​				email:

​				date:

​				tel:

frameset : 框架标签

​	rows:

​	cols:

frame:  



### 使用CSS完成网站首页的优化

#### 需求分析:

​	由于我们昨天使用表格布局存在缺陷,那么我们要来考虑使用DIV+CSS来对页面进行优化

表格布局的缺陷:

	1. 嵌套层级太多, 一旦出现嵌套顺序错乱, 整个页面达不到预期效果
	2.  采用表格布局,页面不够灵活, 动其中某一块,整个表格布局的结构全都要变

#### 技术分析

HTML的块标签:

​	div标签: 默认占一行,自动换行

​	span标签:  内容显示在同一行

CSS概述:

​	Cascading Style Sheets : 层叠样式表

​		红砖, 抹了一层水泥, 白灰

主要用作用:

​	用来美化我们的HTML页面的

​	HTML 决定网页的骨架	,CSS  化妆

​	将页面的HTML和美化进行分离

CSS的简单语法:

​	在一个style标签中,去编写CSS内容,最好将style标签写在这个head标签中

```html
<style>
  选择器{
    属性名称:属性的值;
    属性名称2: 属性的值2;
  }
</style>
```

CSS选择器: 帮助我们找到我们要修饰的标签或者元素



元素选择:

```html
元素的名称{
  属性名称:属性的值;
  属性名称:属性的值;
}
```

ID选择器:

```html
以#号开头  ID在整个页面中必须是唯一的s
#ID的名称{
  属性名称:属性的值;
  属性名称:属性的值;
}
```

类选择器:

```html
以 . 开头 
.类的名称{
   属性名称:属性的值;
  	属性名称:属性的值;
}
```



CSS的引入方式:

​	外部样式: 通过link标签引入一个外部的css文件

​	内部样式: 直接在style标签内编写CSS代码

​	行内样式: 直接在标签中添加一个style属性, 编写CSS样式



CSS浮动 : 浮动的元素会脱离正常的文档流,在正常的文档流中不占空间

				float属性:
					left
					right
				
				clear属性: 清除浮动
					both : 两边都不允许浮动
					left: 左边不允许浮动
					right : 右边不允许浮动
				流式布局


#### 步骤分析:

1. 创一个最外层div
2. 第一部份: LOGO部分: 嵌套三个div
3. 第二部分: 导航栏部分 : 放置5个超链接
4. 第三部分: 轮播图 
5. 第四部分: 
6. 第五部分: 直接放一张图片
7. 第六部分: 抄第四部分的
8. 第七部分: 放置一张图片
9. 第八部分: 放一堆超链接


#### 代码实现:

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<title></title>
		<style>
			
			.logo{
				float: left;
				width: 33%;
				/*border-width: 1px;
				border-style: solid;
				border-color: red;*/
				height: 60px;
				line-height: 60px;
		/*		border: 1px solid red;*/
			}
			
			
			.amenu{
				color: white;
				text-decoration: none;
				height: 50px;
				line-height: 50px;
			}
			
			.product{
				float: left; text-align: center; width: 16%; height: 240px;
			}
			
		</style>
	</head>
	<body>
		<!--
			1. 创一个最外层div
			2. 第一部份: LOGO部分: 嵌套三个div
			3. 第二部分: 导航栏部分 : 放置5个超链接
			4. 第三部分: 轮播图 
			5. 第四部分: 
			6. 第五部分: 直接放一张图片
			7. 第六部分: 抄第四部分的
			8. 第七部分: 放置一张图片
			9. 第八部分: 放一堆超链接
		-->
		<div>
			<!--2. 第一部份: LOGO部分: 嵌套三个div-->
			<div>
				<div class="logo">
					<img src="../img/logo2.png"/>
				</div>
				<div class="logo">
					<img src="../img/header.png"/>
				</div>
				<div class="logo">
					<a href="#">登录</a>
					<a href="#">注册</a>
					<a href="#">购物车</a>
				</div>
			</div>
			
				
			<!--清除浮动-->
			<div style="clear: both;"></div>
			
			
			<!--3. 第二部分: 导航栏部分 : 放置5个超链接-->
			<div style="background-color: black; height: 50px;">
				<a href="#" class="amenu">首页</a>
				<a href="#" class="amenu">手机数码</a>
				<a href="#" class="amenu">电脑办公</a>
				<a href="#" class="amenu">鞋靴箱包</a>
				<a href="#" class="amenu">香烟酒水</a>
			</div>
			
				
			<!--4. 第三部分: 轮播图--> 
			<div>
				<img src="../img/1.jpg" width="100%"/>
			</div>
			<!--5. 第四部分:--> 
			<div>
				<div><h2>最新商品<img src="../img/title2.jpg"/></h2></div>
				
				<!--左侧广告图-->
				<div style="width: 15%; height: 480px;  float: left;">
					<img src="../products/hao/big01.jpg" width="100%" height="100%"/>
				</div>
				<!--
                	右侧商品
                -->
                <div style="width: 84%; height: 480px;float: left;">
                	<div style="height: 240px; width: 50%; float: left;">
                		<img src="../products/hao/middle01.jpg" height="100%" width="100%" />
                	</div>
					<div class="product">
                		<img src="../products/hao/small08.jpg" />
                		<p>高压锅</p>
                		<p style="color: red;">$998</p>
                	</div>
					<div class="product">
                		<img src="../products/hao/small08.jpg" />
                		<p>高压锅</p>
                		<p style="color: red;">$998</p>
                	</div>
					<div class="product">
                		<img src="../products/hao/small08.jpg" />
                		<p>高压锅</p>
                		<p style="color: red;">$998</p>
                	</div>
					<div class="product">
                		<img src="../products/hao/small08.jpg" />
                		<p>高压锅</p>
                		<p style="color: red;">$998</p>
                	</div>
					<div class="product">
                		<img src="../products/hao/small08.jpg" />
                		<p>高压锅</p>
                		<p style="color: red;">$998</p>
                	</div>
					<div class="product">
                		<img src="../products/hao/small08.jpg" />
                		<p>高压锅</p>
                		<p style="color: red;">$998</p>
                	</div>
					<div class="product">
                		<img src="../products/hao/small08.jpg" />
                		<p>高压锅</p>
                		<p style="color: red;">$998</p>
                	</div>
					<div class="product">
                		<img src="../products/hao/small08.jpg" />
                		<p>高压锅</p>
                		<p style="color: red;">$998</p>
                	</div>
					<div class="product">
                		<img src="../products/hao/small08.jpg" />
                		<p>高压锅</p>
                		<p style="color: red;">$998</p>
                	</div>
					
                </div>
			</div>
			
			<!--6. 第五部分: 直接放一张图片-->
			<div>
				<img src="../products/hao/ad.jpg" width="100%"/>
			</div>
			<!--7. 第六部分: 抄第四部分的-->
			<div>
				<div><h2>最新商品<img src="../img/title2.jpg"/></h2></div>
				
				<!--左侧广告图-->
				<div style="width: 15%; height: 480px;  float: left;">
					<img src="../products/hao/big01.jpg" width="100%" height="100%"/>
				</div>
				<!--
                	右侧商品
                -->
                <div style="width: 84%; height: 480px;float: left;">
                	<div style="height: 240px; width: 50%; float: left;">
                		<img src="../products/hao/middle01.jpg" height="100%" width="100%" />
                	</div>
					<div class="product">
                		<img src="../products/hao/small08.jpg" />
                		<p>高压锅</p>
                		<p style="color: red;">$998</p>
                	</div>
					<div class="product">
                		<img src="../products/hao/small08.jpg" />
                		<p>高压锅</p>
                		<p style="color: red;">$998</p>
                	</div>
					<div class="product">
                		<img src="../products/hao/small08.jpg" />
                		<p>高压锅</p>
                		<p style="color: red;">$998</p>
                	</div>
					<div class="product">
                		<img src="../products/hao/small08.jpg" />
                		<p>高压锅</p>
                		<p style="color: red;">$998</p>
                	</div>
					<div class="product">
                		<img src="../products/hao/small08.jpg" />
                		<p>高压锅</p>
                		<p style="color: red;">$998</p>
                	</div>
					<div class="product">
                		<img src="../products/hao/small08.jpg" />
                		<p>高压锅</p>
                		<p style="color: red;">$998</p>
                	</div>
					<div class="product">
                		<img src="../products/hao/small08.jpg" />
                		<p>高压锅</p>
                		<p style="color: red;">$998</p>
                	</div>
					<div class="product">
                		<img src="../products/hao/small08.jpg" />
                		<p>高压锅</p>
                		<p style="color: red;">$998</p>
                	</div>
					<div class="product">
                		<img src="../products/hao/small08.jpg" />
                		<p>高压锅</p>
                		<p style="color: red;">$998</p>
                	</div>
					
                </div>
			</div>
			
			<!--8. 第七部分: 放置一张图片-->
			<div>
				<img src="../img/footer.jpg" width="100%"/>
			</div>
			<!--9. 第八部分: 放一堆超链接-->
			<div style="text-align: center;">
				        
					<a href="#">关于我们</a>
					<a href="#">联系我们</a>
					<a href="#">招贤纳士</a>
					<a href="#">法律声明</a>
					<a href="#">友情链接</a>
					<a href="#">支付方式</a>
					<a href="#">配送方式</a>
					<a href="#">服务声明</a>
					<a href="#">广告声明</a>
					
					<br />
					
					Copyright © 2005-2016 传智商城 版权所有
			</div>
		</div>
	</body>
</html>
```



#### 扩展:

- CSS的优先级

  按照选择器搜索精确度来编写:		 	行内样式 > ID选择器 > 类选择器  > 元素选择器

  就近原则: 哪个离得近,就选用哪个的样式


  CSS: 层叠样式表

  主要作用:

  	1. 美化页面
  	2. 将页面美化和HTML代码进行分离,提高代码的服用型

  - 选择器:

    - 元素选择器: 标签的名称{}
    - 类选择器:   以. 开头  .类的名称
    - ID选择器:  以#开头 ,   #ID的名称  (ID必须是页面上面唯一) 

  - CSS浮动:

    - float : left, right  不再占有正常文档流中的空间 , 流式布局

    - clear : both  left right

      ​

- CSS中的其它选择器

  - 选择器分组: 选择器1,选择器2{ 属性的名称:属性的值}

  - 属性选择器:

    ```html
    a[title]
    a[titile='aaa']
    a[href][title]
    a[href][title='aaa']
    ```

  - 后代选择器: 爷爷选择器  孙子选择器   找出所有的后代

  - 子元素选择器:  父选择器  > 儿子选择器

  - 伪类选择器: 通常都是用在A标签上

  ​

  ​

### 使用DIV+CSS完成注册页面的优化

#### 需求分析

由于我们的注册页面也是用table布局的,存在与首页同样的问题,所以我们需要使用div+css对我们的注册页面进行美化

总共是5部分内容

#### 技术分析

CSS的盒子模型: 万物皆盒子

内边距:  

padding-top:

padding-right:

padding-bottom:

padding-left:

```html
padding:10px;  上下左右都是10px
padding:10px 20px;  上下是10px 左右是20px
padding: 10px 20px 30px;  上 10px 右20px  下30px  左20px
padding: 10px 20px 30px 40px;  上右下左, 顺时针的方向
```



外边距:

margin-top:

margin-right:

margin-bottom:

margin-left: 



CSS绝对定位:

​	position: absolute

​	top: 控制距离顶部的位置

​	left: 控制距离左边的位置

#### 步骤分析:

1. 总共是5部分
2. 第一部分是LOGO部分
3. 第二部分是导航菜单
4. 第三部分是注册部分
5. 第四部分是FOOTER图片
6. 第五部分是一堆超链接

#### 代码实现:

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<title></title>
		 <link rel="stylesheet" type="text/css" href="../css/main.css"/>
	</head>
	<body>
		<!--
			1. 总共是5部分
			2. 第一部分是LOGO部分
			3. 第二部分是导航菜单
			4. 第三部分是注册部分
			5. 第四部分是FOOTER图片
			6. 第五部分是一堆超链接
		-->
		<div>
			
			<!--2. 第一部分是LOGO部分-->
			<div>
				<div class="logo">
					<img src="../img/logo2.png" />
				</div>
				<div class="logo">
					<img src="../img/header.png" />
				</div>
				<div class="logo">
					<a href="#">登录</a>
					<a href="#">注册</a>
					<a href="#">购物车</a>
				</div>
			</div>
			
			<!--清除浮动-->
			<div style="clear: both;"></div>
			<!--3. 第二部分是导航菜单-->
			<div style="background-color: black; height: 50px;">
				<a href="#" class="amenu">首页</a>
				<a href="#" class="amenu">手机数码</a>
				<a href="#" class="amenu">电脑办公</a>
				<a href="#" class="amenu">鞋靴箱包</a>
				<a href="#" class="amenu">香烟酒水</a>
			</div>
			<!--4. 第三部分是注册部分-->
			<div style="background: url(../image/regist_bg.jpg);height: 500px;">
				
				<div style="position:absolute;top:200px;left:350px;border: 5px solid darkgray;width: 50%;height: 50%;background-color: white;">
					<table width="60%" align="center">
						<tr>
							<td colspan="2"><font color="blue" size="6">会员注册</font>USER REGISTER</td>
							
						</tr>
						<tr>
							<td>用户名:</td>
							<td><input type="text"/></td>
						</tr>
						<tr>
							<td>密码:</td>
							<td><input type="password"/></td>
						</tr>
						<tr>
							<td>确认密码:</td>
							<td><input type="password"/></td>
						</tr>
						<tr>
							<td>email:</td>
							<td><input type="email"/></td>
						</tr>
						<tr>
							<td>姓名:</td>
							<td><input type="text"/></td>
						</tr>
						<tr>
							<td>性别:</td>
							<td><input type="radio" name="sex"/> 男
							<input type="radio" name="sex"/> 女
							<input type="radio" name="sex"/> 妖
							</td>
						</tr>
						<tr>
							<td>出生日期:</td>
							<td><input type="date"/></td>
						</tr>
						<tr>
							<td>验证码:</td>
							<td><input type="text"/></td>
						</tr>
						<tr>
							<td></td>
							<td><input type="submit" value="注册"/></td>
						</tr>
					</table>
				</div>
				
			</div>
			
			<!--5. 第四部分是FOOTER图片-->
			<div>
				<img src="../img/footer.jpg" width="100%"/>
			</div>
			<!--9. 第四部分: 放一堆超链接-->
			<div style="text-align: center;">
				        
					<a href="#">关于我们</a>
					<a href="#">联系我们</a>
					<a href="#">招贤纳士</a>
					<a href="#">法律声明</a>
					<a href="#">友情链接</a>
					<a href="#">支付方式</a>
					<a href="#">配送方式</a>
					<a href="#">服务声明</a>
					<a href="#">广告声明</a>
					
					<br />
					
					Copyright © 2005-2016 传智商城 版权所有
			</div>
			
		</div>
	</body>
</html>

```



### CSS部分的回顾:

​	CSS: 层叠样式表.

​	CSS作用: 美化页面,提高代码的复用性

​	选择器:

​		需要掌握的:

​			元素选择器: 标签的名称

​			类选择器:  以 . 开头

​			ID选择器: 以#开头,  #ID的名称  ID必须是唯一的

​		优先级: 按照选择精确度: 行内样式  > ID选择器 > 类选择器 > 元素选择器

​				就近原则

​		扩展选择器:

​			选择器分组:  选择器1,选择器2   以逗号隔开

​			后代选择器:  爷爷 孙子   中间以空格隔开

​			子元素选择器:  爸爸 > 儿子 

​			属性选择器:   选择器[属性的名称='']

​			伪类选择器:  超链接标签上使用  

​	 浮动: float属性  left right

​	 清除浮动: clear: both left right

​	

​	盒子模型:  顺时针 : 上右下左

​		padding : 内边距 ,控制的是盒子内容的距离

​		margin : 外边距 控制盒子与盒子之间的距离

​	绝对定位:

​		position: absolute

​		top:

​		left:



### 使用JS完成简单的数据校验

#### 需求分析

使用JS完成对注册页面的简单数据校验,不允许出现用户名或密码为空的情况



#### 技术分析

##### JavaScript概述

什么是javascript: JavaScript一种直译式脚本语言，

什么是脚本语言?

​	java源代码 ----> 编译成.class文件 -----> java虚拟机中才能执行

​	脚本语言:   源码  -------- > 解释执行

​	js由我们的浏览器来解释执行

HTML: 决定了页面的框架  

CSS: 用来美化我们的页面

JS:	提供用户的交互的

##### JS的组成:

ECMAScript : 核心部分 ,定义js的语法规范

DOM: document Object Model 文档对象模型 , 主要是用来管理页面的

BOM : Browser Object Model  浏览器对象模型, 前进,后退,页面刷新, 地址栏, 历史记录, 屏幕宽高

##### JS的语法:

变量弱类型: var i = true

区分大小写

语句结束之后的分号 ,可以有,也可以没有

写在script标签


##### JS的数据类型:

- 基本类型
  - string
  - number
  - boolean 
  - undefine
  - null
- 引用类型
  - 对象, 内置对象
- 类型转换
  - js内部自动转换 

##### JS的运算符和语句:

- 运算符和java 一样
  - "===" 全等号: 值和类型都必须相等
  - == 值相等就可以了
- 语句和java 一样


##### JS的输出

- alert()  直接弹框
- document.write()  向页面输出
- console.log() 向控制台输出
- innerHTML:  向页面输出



- 获取页面元素: document.getElementById("id的名称");



JS声明变量:

​	var 变量的名称 = 变量的值

JS声明函数:

​	var 函数的名称 = function(){	

​	}

​	

​	function 函数的名称(){

​	}

#### JS的开发步骤

```html
1. 确定事件
2. 通常事件都会出发一个函数
3. 函数里面通常都会去操作页面元素,做一些交互动作

```

#### 步骤分析:



#### 代码实现

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<title></title>
		<script>
			/*
				1. 确认事件: 表单提交事件 onsubmit事件 
				2. 事件所要触发的函数: checkForm
				3. 函数中要干点事情
					1. 校验用户名, 用户不能为空, 长度不能小于6位
						1.获取到用户输入的值
			*/
			function checkForm(){
				//获取用户名输入项
				var inputObj = document.getElementById("username");
				//获取输入项的值
				var uValue = inputObj.value;
//				alert(uValue);
				//用户名长度不能6位 ""
				if(uValue.length < 6 ){
					alert("对不起,您的长度太短!");
					return false;	
				}
				//密码长度大于6 和确认必须一致
				
				//获取密码框输入的值
				var input_password = document.getElementById("password");
				var uPass = input_password.value;
				
				if(uPass.length < 6){
					alert("对不起,您还是太短啦!");
					return false;
				}
				
				//获取确认密码框的值
				var input_repassword = document.getElementById("repassword");
				var uRePass = input_repassword.value;
				if(uPass != uRePass){
					alert("对不起,两次密码不一致!");
					return false;
				}
				
				//校验手机号
				var input_mobile = document.getElementById("mobile");
				var uMobile = input_mobile.value;
				//
				if(!/^[1][3578][0-9]{9}$/.test(uMobile)){
					
					alert("对不起,您的手机号无法识别!");
					
					return false;
				}
				
				//校验邮箱: /^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-])+/
				var inputEmail = document.getElementById("email");
				var uEmail = inputEmail.value;
				
				if(!/^([a-zA-Z0-9_-])+@([a-zA-Z0-9_-])+(\.[a-zA-Z0-9_-])+/.test(uEmail)){
					alert("对不起,邮箱不合法");
					return false;
				}			
				return true;
			}	
		</script>
	</head>
	<body>
		<form action="JS开发步骤.html" onsubmit="return checkForm()">
			<div>用户名:<input id="username" type="text"  /></div>
			<div>密码:<input id="password" type="password"  /></div>
			<div>确认密码:<input id="repassword" type="password"  /></div>
			<div>手机号码:<input id="mobile"  type="number"  /></div>
			<div>邮箱:<input id="email" type="text"  /></div>
			<div><input type="submit" value="注册"  /></div>
		</form>
	</body>
</html>
```



javascript :  它是一门脚本语言 , 直接解释执行的语言

javascript: 

​	ECMAScript : 定义的语法

​	DOM: document Object Model 

​	BOM: 浏览器对象模型



会定义变量: var  变量的名称 = 变量的值



会定义函数:  

​	function 函数的名称(参数的名称){

​	}





### 使用JS完成图片的轮播效果

#### 需求分析

在我们的网站首页,通常需要有一块区域,用来显示广告,但是这块区域如果仅仅显示一张图片肯定是不够的, 故我们需要采用动态循环播放我们所有的广告. 显示效果照抄黑马程序员的网站首页

#### 技术分析:



### 步骤分析:

#### 代码实现:

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<title></title>
		<script>
			/* 当页面加载完成的时候, 动态切换图片
				 1.确定事件:
				 2.事件所要触发的函数
			 */
			var index = 1;
			//切换图片的函数
			function changeAd(){
				//获取要操作的img
				var img = document.getElementById("imgAd");
				img.src = "../img/"+(index%3+1)+".jpg";  //0,1,2    //1,2,3
				index++;
			}
			
			function init(){
				//启动定时器
				setInterval("changeAd()",3000);
			}
		</script>
	</head>
	<body onload="init()">
		<img src="../img/1.jpg" id="imgAd"/>
	</body>
</html>
```

