### 今日任务

#### 使用JQuery发送请求局部刷新页面

#### 使用BootStrap制作一个响应式的页面

#### 使用BootStrap制作网站的首页



### 教学目标

#### 掌握什么是响应式及响应式的原理

#### 掌握BootStrap的栅格系统

#### 了解BootStrap的其他组件及JS控件



上次课内容:

什么JQ : write less do more 写更少的代码,做更多的事情  javascript函数库

基本选择器:

​	ID选择器: #ID名称

​	类选择器: .类名

​	元素选择器: 元素的名称

​	通配符选择器:  *  找出页面上所有元素

​	选择器分组: 选择器1,选择器2     [选择器1 , 选择器2]  

层级选择器:

​	后代选择器: 选择器1 选择器2  找出来的选择器1 下面的所有选择器2  子孙

​	子元素选择器: 选择器1 > 选择器2   找出来的是所有的子节点  儿子

​	相邻兄弟选择器: 选择器1+选择器2    找出来的紧挨着自己的弟弟

​	兄弟选择器:   选择器1~选择器2    找出所有的弟弟

​		(找出所有兄弟:   $("div").siblings()    )

属性选择器:

```html
选择器 div
选择器[title]
选择器[title='test']
选择器[title='test'][style]
```



基本的过滤器:    选择器:过滤器   $("div:first")

​	:first : 找出第一个元素

​	:last  找出最后一个元素

​	:even   找出偶数索引

​	:odd   找出奇数

​	:gt(index)   greater-than大于

​	:lt(index)    小于

​	:eq(index)  等于

表单选择器:

​	:input  找出所有的输入项,  textarea select button

​	:password

​	:text

​	:radio

表单对象属性的过滤器

​	:selected

​	:checked



常用函数:

​	属性prop()    properties

​		如果传入一个参数  就是获取

​	prop("src","../img/1.jpg");  

​		设置图片路径

​	attr : 操作一些自定义的属性  <img  abc='123' />

​	prop: 通常是用来操作元素固有属性的 ,建议大家使用prop来操作属性



​	css() ; 修改css样式

​	addClass()  : 添加一个class样式

​	removeClass() : 移除

​	

​	blur : 绑定失去焦点

​	focus: 绑定获得焦点事件

​	click:

​	dblclick

​	change

​	

​	append    :  给自己添加儿子

​	appendTo :  把自己添加到别人家

​	prepend :  在自己子节点最前面添加子节点

​	after  : 在自己后面添加一个兄弟

​	before: 在自己前面添加一个兄弟

​	

​	$("数组对象").each(function(index,data))

​	$.each(arr,function(index,data))

​	




### 表单校验案例



#### 技术分析

- trigger  :  触发事件,但是会执行类似浏览将光标移到输入框内的这种浏览器默认行为
- triggerHandler : 仅仅只会触发事件所对应的函数
- is()

#### 步骤分析

1. 首先给必填项,添加尾部添加一个小红点
2. 获取用户输入的信息,做相应的校验
3. 事件: 获得焦点, 失去焦点, 按键抬起
4. 表单提交的事件


#### 代码实现

```html

```









### 使用JQuery发送请求局部刷新页面

​	数据交换格式:

​		json

​		xml

​	

- 什么是JSON

  [JSON](http://baike.baidu.com/view/136475.htm)([JavaScript](http://baike.baidu.com/view/16168.htm) Object Notation) 是一种轻量级的数据交换格式。它基于[ECMAScript](http://baike.baidu.com/view/810176.htm)的一个子集。 JSON采用完全独立于语言的文本格式，但是也使用了类似于C语言家族的习惯（包括[C](http://baike.baidu.com/subview/10075/6770152.htm)、C++、[C#](http://baike.baidu.com/view/6590.htm)、[Java](http://baike.baidu.com/subview/29/12654100.htm)、JavaScript、[Perl](http://baike.baidu.com/view/46614.htm)、[Python](http://baike.baidu.com/view/21087.htm)等）。这些特性使JSON成为理想的数据交换语言。 易于人阅读和编写，同时也易于机器解析和生成(一般用于提升网络传输速率)。

- JSON格式

  ​	JSON对象

  ```json
  { key1:value}   
  {"username":"zhangsan","password":"123"}
  ```

  ​	JSON数组

  ```json
  [{ key1:value},{ key1:value},{ key1:value}]
  ```

  ​



### 使用BootStrap开发一个响应式的页面出来

#### 需求分析

开发一套响应式页面.让他能够在各种设备上显示正常,提升用户体验

#### 技术分析

##### BootStap概述

- 什么是BootStrap

  ​

- BootStrap有什么作用

  - 复制粘贴, 能够提高开发人员的工作效率



- 什么是响应式页面


  - 适应不同的分辨率显示不同样式,提高用户的体验

    ​



- BootStrap的中文网
  - http://www.bootcss.com
- 下载BootStrap
- BootStrap结构
  - 全局CSS
    - bootStrap中已经定义好了一套CSS的样式表
  - 组件
    - BootStrap定义的一套按钮,导航条等组件
  - JS插件
    - BootStrap定义了一套JS的插件,这些插件已经默认实现了很多种效果

##### BootStrap的入门开发

- 引入相关的头文件

```html
		<!-- 最新版本的 Bootstrap 核心 CSS 文件 -->
		<link rel="stylesheet" href="../css/bootstrap.css" />
		
		<!--需要引入JQuery-->
		<script type="text/javascript" src="../js/jquery-1.11.0.js" ></script>
		
		<!-- 最新的 Bootstrap 核心 JavaScript 文件 -->
		<script type="text/javascript" src="../js/bootstrap.js" ></script>
		
		<meta name="viewport" content="width=device-width, initial-scale=1">
```

- BootStrap的布局容器

`.container` 类用于固定宽度并支持响应式布局的容器。

```
<div class="container">
  ...
</div>
```

`.container-fluid` 类用于 100% 宽度，占据全部视口（viewport）的容器。

```
<div class="container-fluid">
  ...
</div>
```



校验表单扩展:

trigger  : 触发浏览器默认行为

triggerHandler : 不会触发

is : 判断

find : 查找



老黄历:

什么json: 轻量级的数据交换格式

json对象:  {"username":"zhangsan"}

json数组: [ {"username":"zhangsan"}, {"username":"zhangsan"}, {"username":"zhangsan"}]

ajax异步请求: 

​	同步和异步





- row

   Bootstrap 栅格系统的工作原理：

  - “行（row）”必须包含在 `.container` （固定宽度）或 `.container-fluid` （100% 宽度）中，以便为其赋予合适的排列（aligment）和内补（padding）。
  - 通过“行（row）”在水平方向创建一组“列（column）”。
  - 你的内容应当放置于“列（column）”内，并且，只有“列（column）”可以作为行（row）”的直接子元素。
  - 类似 `.row` 和 `.col-xs-4` 这种预定义的类，可以用来快速创建栅格布局。Bootstrap 源码中定义的 mixin 也可以用来创建语义化的布局。
  - 通过为“列（column）”设置 `padding` 属性，从而创建列与列之间的间隔（gutter）。通过为 `.row` 元素设置负值 `margin` 从而抵消掉为 `.container` 元素设置的 `padding`，也就间接为“行（row）”所包含的“列（column）”抵消掉了`padding`

  ​

- BootStrap的栅格系统

  - 响应式设计: 这种设计依赖于CSS3中的媒体查询
  - 栅格样式:
    - 设备分辨率大于1200 使用lg样式
    - 设备分辨率大于992 < 1200 使用md样式
    - 设备分辨率大于768 < 992  使用sm样式
    - 设备分辨率小于768使用xs样式

- BootStrap的全局CSS
  - 定义了一套CSS
    - 对页面中的元素进行定义
    - 列表元素,表单,按钮,图片...

#### 步骤分析



#### 代码实现



#### 使用BootStrap布局网站首页

#### 需求分析

请使用BootStrap对我们的首页进行优化

#### 技术分析

#### 步骤分析

> 1. 新建一个HTML页面.引入bootStrap相关的js和CSS
> 2. 定义一个整体的div, 将整体的div分成8个部分
> 3. 完成没部分的内容显示

#### 代码实现

```html
<!DOCTYPE html>
<html>

	<head>
		<meta charset="UTF-8">
		<title></title>
		<!--
			准备工作:
			<meta name='viewport'>
			1.导入bootstrap css文件
			2.导入JQuery
			3.bootstrap.js
			
			4.写一个div  class = container 支持响应式的布局容器
			
		-->
		<link rel="stylesheet" href="../css/bootstrap.min.css">

		<meta name="viewport" content="width=device-width, initial-scale=1">

		<!--
			
		jQuery文件。务必在bootstrap.min.js 之前引入
		 -->
		<script src="../js/jquery-1.11.0.js"></script>

		<!-- 最新的 Bootstrap 核心 JavaScript 文件 -->
		<script src="../js/bootstrap.min.js"></script>

	</head>

	<body>
		<div class="container">

			<div class="row">
				<div class="col-md-4">
					<img src="../img/logo2.png" />
				</div>
				<div class="col-md-4 hidden-xs">
					<img src="../img/header.png" />
				</div>
				<div class="col-md-4">
					<a href="#">登录</a>
					<a href="#">注册</a>
					<a href="#">购物车</a>
				</div>
			</div>

			<!--菜单-->
			<div class="row">
				<div class="col-md-12">
					<nav class="navbar navbar-inverse" role="navigation">
						<div class="container-fluid">
							<!-- Brand and toggle get grouped for better mobile display -->
							<div class="navbar-header">
								<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
						        <span class="sr-only">Toggle navigation</span>
						        <span class="icon-bar"></span>
						        <span class="icon-bar"></span>
						        <span class="icon-bar"></span>
						      </button>
								<a class="navbar-brand" href="#">首页</a>
							</div>

							<!-- Collect the nav links, forms, and other content for toggling -->
							<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
								<ul class="nav navbar-nav">
									<li class="active">
										<a href="#">手机数码</a>
									</li>
									<li>
										<a href="#">鞋靴箱包</a>
									</li>
									<li>
										<a href="#">电脑办公</a>
									</li>
									<li class="dropdown">
										<a href="#" class="dropdown-toggle" data-toggle="dropdown">所有分类 <span class="caret"></span></a>
										<ul class="dropdown-menu" role="menu">
											<li>
												<a href="#">手机数码</a>
											</li>
											<li>
												<a href="#">鞋靴箱包</a>
											</li>
											<li>
												<a href="#">电脑办公</a>
											</li>
											<li class="divider"></li>
											<li>
												<a href="#">Separated link</a>
											</li>
											<li class="divider"></li>
											<li>
												<a href="#">One more separated link</a>
											</li>
										</ul>
									</li>
								</ul>
								<form class="navbar-form navbar-right" role="search">
									<div class="form-group">
										<input type="text" class="form-control" placeholder="请输入要搜索的商品">
									</div>
									<button type="submit" class="btn btn-default">搜索</button>
								</form>

							</div>
							<!-- /.navbar-collapse -->
						</div>
						<!-- /.container-fluid -->
					</nav>
				</div>
			</div>

			<div>
				<div id="carousel-example-generic" class="carousel slide" data-ride="carousel">
  <!-- Indicators -->
  <ol class="carousel-indicators">
    <li data-target="#carousel-example-generic" data-slide-to="0" class="active"></li>
    <li data-target="#carousel-example-generic" data-slide-to="1"></li>
    <li data-target="#carousel-example-generic" data-slide-to="2"></li>
  </ol>

  <!-- Wrapper for slides -->
  <div class="carousel-inner" role="listbox">
    <div class="item active">
      <img src="../img/1.jpg" alt="...">
      <div class="carousel-caption">
        ...
      </div>
    </div>
    <div class="item">
      <img src="../img/2.jpg" alt="...">
      <div class="carousel-caption">
        ...
      </div>
    </div>
    <div class="item">
      <img src="../img/3.jpg" alt="...">
      <div class="carousel-caption">
        ...
      </div>
    </div>
   
  </div>

  <!-- Controls -->
  <a class="left carousel-control" href="#carousel-example-generic" role="button" data-slide="prev">
    <span class="glyphicon glyphicon-chevron-left"></span>
    <span class="sr-only">Previous</span>
  </a>
  <a class="right carousel-control" href="#carousel-example-generic" role="button" data-slide="next">
    <span class="glyphicon glyphicon-chevron-right"></span>
    <span class="sr-only">Next</span>
  </a>
</div>

				
				
			</div>
			
			<!--最新商品这里-->
			<div class="row">
				<div class="col-md-12">
					<h3>最新商品<img src="../images/title2.jpg"/></h3>
				</div>
			</div>
			
			<!--商品部分 -->
			<div class="row">
				<!--左边div-->
				<div class="col-md-2 hidden-sm hidden-xs">
					<img src="../products/hao/big01.jpg" width="100%" height="100%" />
				</div>
				<!--右边div-->	
				<div class="col-md-10">
					<!--上面部分-->
					<div class="row">
						<!--中等广告图-->
						<div class="col-md-6">
							<img src="../products/hao/middle01.jpg" width="100%" />
						</div>
						
						<!--商品项-->
						<div class="col-md-2 col-xs-4" style="text-align: center;">
							<img src="../products/hao/small01.jpg" />
							<p>豆浆机</p>
							<p>$998</p>
						</div>
						<!--商品项-->
						<div class="col-md-2 col-xs-4" style="text-align: center;">
							<img src="../products/hao/small01.jpg" />
							<p>豆浆机</p>
							<p>$998</p>
						</div>
						<!--商品项-->
						<div class="col-md-2 col-xs-4" style="text-align: center;">
							<img src="../products/hao/small01.jpg" />
							<p>豆浆机</p>
							<p>$998</p>
						</div>
					</div>
					<!--下面部分-->
					<div class="row">
						<!--商品项-->
						<div class="col-md-2 col-xs-4" style="text-align: center;">
							<img src="../products/hao/small01.jpg" />
							<p>豆浆机</p>
							<p>$998</p>
						</div>
						<!--商品项-->
						<div class="col-md-2 col-xs-4" style="text-align: center;">
							<img src="../products/hao/small01.jpg" />
							<p>豆浆机</p>
							<p>$998</p>
						</div>
						<!--商品项-->
						<div class="col-md-2 col-xs-4" style="text-align: center;">
							<img src="../products/hao/small01.jpg" />
							<p>豆浆机</p>
							<p>$998</p>
						</div>
						<!--商品项-->
						<div class="col-md-2 col-xs-4" style="text-align: center;">
							<img src="../products/hao/small01.jpg" />
							<p>豆浆机</p>
							<p>$998</p>
						</div>
						<!--商品项-->
						<div class="col-md-2 col-xs-4" style="text-align: center;">
							<img src="../products/hao/small01.jpg" />
							<p>豆浆机</p>
							<p>$998</p>
						</div>
						<!--商品项-->
						<div class="col-md-2 col-xs-4" style="text-align: center;">
							<img src="../products/hao/small01.jpg" />
							<p>豆浆机</p>
							<p>$998</p>
						</div>
						
					</div>
				</div>
			</div>
			
			<div class="row">
				<div class="col-md-12">
					<img src="../products/hao/ad.jpg" width="100%" />
				</div>
			</div>
			
			
			
			
			<!--最新商品这里-->
			<div class="row">
				<div class="col-md-12">
					<h3>最新商品<img src="../images/title2.jpg"/></h3>
				</div>
			</div>
			
			<!--商品部分 -->
			<div class="row">
				<!--左边div-->
				<div class="col-md-2 hidden-sm hidden-xs">
					<img src="../products/hao/big01.jpg" width="100%" height="100%" />
				</div>
				<!--右边div-->	
				<div class="col-md-10">
					<!--上面部分-->
					<div class="row">
						<!--中等广告图-->
						<div class="col-md-6">
							<img src="../products/hao/middle01.jpg" width="100%" />
						</div>
						
						<!--商品项-->
						<div class="col-md-2 col-xs-4" style="text-align: center;">
							<img src="../products/hao/small01.jpg" />
							<p>豆浆机</p>
							<p>$998</p>
						</div>
						<!--商品项-->
						<div class="col-md-2 col-xs-4" style="text-align: center;">
							<img src="../products/hao/small01.jpg" />
							<p>豆浆机</p>
							<p>$998</p>
						</div>
						<!--商品项-->
						<div class="col-md-2 col-xs-4" style="text-align: center;">
							<img src="../products/hao/small01.jpg" />
							<p>豆浆机</p>
							<p>$998</p>
						</div>
					</div>
					<!--下面部分-->
					<div class="row">
						<!--商品项-->
						<div class="col-md-2 col-xs-4" style="text-align: center;">
							<img src="../products/hao/small01.jpg" />
							<p>豆浆机</p>
							<p>$998</p>
						</div>
						<!--商品项-->
						<div class="col-md-2 col-xs-4" style="text-align: center;">
							<img src="../products/hao/small01.jpg" />
							<p>豆浆机</p>
							<p>$998</p>
						</div>
						<!--商品项-->
						<div class="col-md-2 col-xs-4" style="text-align: center;">
							<img src="../products/hao/small01.jpg" />
							<p>豆浆机</p>
							<p>$998</p>
						</div>
						<!--商品项-->
						<div class="col-md-2 col-xs-4" style="text-align: center;">
							<img src="../products/hao/small01.jpg" />
							<p>豆浆机</p>
							<p>$998</p>
						</div>
						<!--商品项-->
						<div class="col-md-2 col-xs-4" style="text-align: center;">
							<img src="../products/hao/small01.jpg" />
							<p>豆浆机</p>
							<p>$998</p>
						</div>
						<!--商品项-->
						<div class="col-md-2 col-xs-4" style="text-align: center;">
							<img src="../products/hao/small01.jpg" />
							<p>豆浆机</p>
							<p>$998</p>
						</div>
						
					</div>
				</div>
			</div>
			
			
			<!--页脚广告-->
			<div>
				<img src="../image/footer.jpg" width="100%" />
			</div>
			<!--网站声明-->
			<div style="text-align: center;">
				<a href="http://www.itheima.com">关于我们</a>	
					<a href="http://www.itheima.com">联系我们</a>	
					<a href="http://www.itheima.com">招贤纳士</a>	
					<a href="http://www.itheima.com">法律声明</a>	
					<a href="http://www.itheima.com">友情链接</a>	
					<a href="http://www.itheima.com">支付方式</a>	
					<a href="http://www.itheima.com">配送方式</a>	
					<a href="http://www.itheima.com">服务声明</a>	
					<a href="http://www.itheima.com">广告声明</a>	
					<br />
					Copyright © 2005-2016 传智商城 版权所有
			</div>

		</div>
	</body>

</html>
```





### 五天前端内容总结

- JQ方式校验表单(要求做出来)
- json :  (了解)
  - json对象 {}
  - json数组 [{},{}]
- $.get(url,function(data){}) (了解)
- bootstrap:  Bootstrap 是最受欢迎的 HTML、CSS 和 JS 框架，用于开发响应式布局、移动设备优先的 WEB 项目。
  - 全局CSS样式: css样式
    - 栅格系统:
      - 将屏幕划分成12个格子,12列
      - class='row' 当前是行
      - 行里面放的是列 col-屏幕分辨率-数字    (每一种分辨率后的数字总和必须是等于12,如果超过12,另起一行)
      - col-lg-数字: 在超宽屏幕上使用
      - col-md-数字: 在中等屏幕上,PC电脑
      - col-sm-数字:  在平板电脑上
      - col-xs-数字:  在手机上
  - 组件:  导航条 , 进度条, 字体
  - javascript插件 : 轮播图
  - 复制粘贴
- 什么是响应式: 会根据不同的分辨率去显示不同页面结构,提高用户体验



- HTML: 超文本标记语言: 设计网页,决定了网页的结构

- CSS:  层叠样式表 ,主要是用来美化页面, 将美化和HTML代码进行分离,提高代码复用性

- javascript: 脚本语言,由浏览器解释执行, 弱类型语言(var i), 提供用户交互

- jquery:  javascript函数库,进一步的封装

  - 选择器:

    - ID选择器
    - 类选择器
    - 元素选择器
    - 通配符选择器
    - 选择器分组

  - 层级选择器

    - 后代选择器
    - 子元素选择器
    - 相邻兄弟选择器
    - 兄弟选择器 : 找出所有的弟弟

  - 属性选择器:

    - 选择器[属性名称='属性的值']

  - 表单选择器

    - :input
    - :text
    - :password

    body > div > div:nth-child(7) > div:nth-child(3) > div:nth-child(8)

  - 基本的过滤器

    - :first
    - :last
    - :even
    - :odd
    - :gt
    - :lt
    - :eq

  - 表单对象属性

    - :selected
    - :checked


