# **今日任务**

### 网站信息页面案例

### 网站图片信息页面案例

### 网站友情链接页面案例

### 网站首页案例

### 网站注册页面案例

### 网站后台页面案例

## 教学导航

- 了解什么是标记语言
- 了解HTML主要特性，主要变化以及发展趋势
- 了解HTML的结构标签
- 掌握HTML的主要标签（字体，图片，列表，链接，表单等标签）




### 1.网站信息页面

#### 1.1需求分析:

我们公司的需要一个对外宣传的网站介绍,介绍公司的主要业务,公司的发展历史,公司的口号等等信息

#### 1.2技术分析:

##### HTML概述:

HTML: Hyper Text Markup Language 超文本标记语言

超文本: 比普通文本功能更加强大,可以添加各种样式

标记语言: 通过一组标签.来对内容进行描述. <关键字> , 是由浏览器来解释执行

```html
<h1>静夜诗</h1>
<b><i>--李白</i> </b> <br/>
<p>床前明月光,</p>
<p>地上鞋两双,</p>
<p>举头望明月,</p>
<p>低头思故乡.</p>
```

##### 为什么要学习HTML:

生活所迫,今天的课程,群英妹子不让回家.

##### HTML的主要作用:

设计网页的基础,HTML5

##### HTML语法规范

	<!--
		1. 上面是一个文档声明 
		2. 根标签 html
		3. html文件主要包含两部分. 头部分和体部分
			头部分 : 主要是用来放置一些页面信息
			体部分 : 主要来放置我们的HTML页面内容
		4. 通过标签来对内容进行描述,标签通常都是由开始标签和结束标签组成  
		5. 标签不区分大小写, 官方建议使用小写
	-->

#### 1.3步骤分析:

1. 公司简介 需要标题
2. 水平分割线
3. 四个段落
4. 第一个段落字体需要红色

#### 1.4代码实现:

```html
<html>
	<head>
		<meta charset="UTF-8">
		<title>网站信息页面</title>
	</head>
	<body>
		<!--
			1. 公司简介 需要标题
			2. 水平分割线
			3. 四个段落
			4. 第一个段落字体需要红色
		-->
		<h3>公司简介</h3>
		
		<hr />
		<p>
		<font color="red">“中关村黑马程序员训练营”</font>是由<b><i>传智播客</i></b>联合中关村软件园、CSDN，并委托传智播客进行教学实施的软件开发高端培训机构，致力于服务各大软件企业，解决当前软件开发技术飞速发展，而企业招不到优秀人才的困扰。 目前，“中关村黑马程序员训练营”已成长为行业“学员质量好、课程内容深、企业满意”的移动开发高端训练基地，并被评为中关村软件园重点扶持人才企业。
		</p>
		<p>
		<strong>黑马程序员</strong>的学员多为大学毕业后，<em>有理想、有梦想，</em>想从事IT行业，而没有环境和机遇改变自己命运的年轻人。黑马程序员的学员筛选制度，远比现在90%以上的企业招聘流程更为严格。任何一名学员想成功入学“黑马程序员”，必须经历长达2个月的面试流程，这些流程中不仅包括严格的技术测试、自学能力测试，还包括性格测试、压力测试、品德测试等等测试。毫不夸张地说，黑马程序员训练营所有学员都是精挑细选出来的。百里挑一的残酷筛选制度确保学员质量，并降低企业的用人风险。
		</p>
		<p>
		中关村黑马程序员训练营不仅着重培养学员的基础理论知识，更注重培养项目实施管理能力，并密切关注技术革新，不断引入先进的技术，研发更新技术课程，确保学员进入企业后不仅能独立从事开发工作，更能给企业带来新的技术体系和理念。
		</p>
		<p>
		一直以来，黑马程序员以技术视角关注IT产业发展，以深度分享推进产业技术成长，致力于弘扬技术创新，倡导分享、 开放和协作，努力打造高质量的IT人才服务平台。
		</p>
	</body>
</html>

```

##### 1.5 扩展内容

​	b : 加粗

​	i : 斜体

​	strong: 加粗, 带语义标签

 	em:  斜体, 带语义

### 2.网站图片信息

#### 2.1需求分析:

在我们的网站中通常需要显示LOGO图片,显示效果如下

#### 2.2技术分析

img 标签:

​	常用的属性;

​		width : 宽度

​		height: 高度

​		src :  指定文件路径

​		alt:  图片加载失败时的提示内容

#### 2.3步骤分析

#### 2.4代码实现

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<title></title>
	</head>
	<body>
		<!--
			常用属性:
				src : 指定图片路径
				width : 指定图片宽度
				height : 图片高度
				alt : 文件加载失败时的提示信息
		-->
		<img src="../img/美女22.jpg" width="500px" alt="这张图片可能加载问题" />
	</body>
</html>


<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<title></title>
	</head>
	<body>
		<!--在网页中显示图片-->
		<img src="../img/logo2.png" width="30%"/>
		<img src="../image/header.jpg" width="30%" />
	</body>
</html>
```

#### 2.5 扩展-文件路径

- 相对路径

```html
		./		代表的是当前路径
		../ 	代表的上一级路径
		../../	上上一级路径
```



### 3.网站友情链接页面

#### 3.1需求分析

在我们的网站中,通常会显示友商公司的网站链接

- 百度
- 新浪微博
- 黑马程序员

#### 3.2技术分析

列表标签: 

​	无序列表:  ul

​		type: 小圆圈,小圆点, 小方块

​	有序列表: ol

​		type: 1,a ,A,I,

​		start : 指定是起始索引

#### 3.3步骤分析



#### 3.4代码实现

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<title></title>
	</head>
	<!--
		1.使用无序列表
			百合网
			世纪家园
			珍爱网
			非诚勿扰
	-->
	<body>
		<ul>
			<li><a href="http://www.baihe.com" target="_blank">百合网</a></li>
			<li><a href="http://www.jiayuan.com">世纪家园</a></li>
			<li>珍爱网</li>
			<li>非诚勿扰</li>
		</ul>
	</body>
</html>
```

##### 3.5 扩展内容

​	点击链接,跳转去指定网站

​	a 超链接标签

​		常用的属性:

​			href: 指定要跳转去的链接地址  

​					如果是网络地址需要加上http协议 , 

​					如果访问的是本网站的html文件,可以直接写文件路径

​			target : 以什么方式打开

​				_self: 默认打开方式,在当前窗口打开

​				_blank:  新起一个标签页打开页面

### 上午内容回顾:

- 网站信息案例
  - 字体标签 font
    - color: 颜色
    - size:  大小 1~7
    - face: 改变字体
  - p 段落标签
  - h标题标签 : 1~6
  - br 换行
  - hr 水平线
  - b 加粗
  - i  斜体
  - strong : 加粗  包含语义
  - em : 斜体  包含语义
- 网站图片案例
  - img标签
    - src : 指定图片的路径
    - width: 宽度
    - height: 高度
    - alt : 图片加载错误时的提示信息
  - 相对路径:
    - ./  代表的是当前路径
    - ../  代表的上一级路径
    - ../../ 代表的上上一级路径
- 友情链接:
  - ul: 无序列表
    - type :
  - ol: 有序列表
    - type : 样式
    - start : 起始索引
  - li : 列表项
  - a 超链接标签
    - href : 要访问的链接地址
    - target : 打开方式
- 网站首页
  - table标签
    - border: 指定边框
    - width : 宽度
    - height : 高度
    - bgcolor : 背景颜色
    - align : 对齐方式
  - tr标签
  - td标签
    - colspan: 跨列操作
    - rowspan: 跨行操作
  - 表格单元格的合并
  - 表格的嵌套

### 4.网站首页

#### 4.1需求分析:

​	根据产品文档,完成商城首页,显示效果如图:

#### 4.2技术分析:

#####  表格标签table

​	table标签:

​		常用的属性:

​			bgcolor : 背景色

​			width : 	宽度

​			height : 高度

​			align : 对齐方式

​	tr 标签

​	td 标签	

###### 合并单元格:

​	colspan : 跨列操作

​	rowspan : 跨行操作

​	注意: 跨行或者跨列操作之后,被占掉的格子需要删除掉

###### 表格的嵌套:

​	在td中可以嵌套一个表格

#### 4.3步骤分析

1. 创建一个8行一列的表格
2. 第一部份: LOGO部分: 嵌套一个一行三列的表格
3. 第二部分: 导航栏部分 : 放置5个超链接
4. 第三部分: 轮播图 
5. 第四部分: 嵌套一个三行7列表格
6. 第五部分: 直接放一张图片
7. 第六部分: 抄第四部分的
8. 第七部分: 放置一张图片
9. 第八部分: 放一堆超链接





#### 4.4代码实现

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<title></title>
		
	</head>
	<body>
		<!--
			1. 创建一个8行一列的表格
			2. 第一部份: LOGO部分: 嵌套一个一行三列的表格
			3. 第二部分: 导航栏部分 : 放置5个超链接
			4. 第三部分: 轮播图 
			5. 第四部分: 嵌套一个三行7列表格
			6. 第五部分: 直接放一张图片
			7. 第六部分: 抄第四部分的
			8. 第七部分: 放置一张图片
			9. 第八部分: 放一堆超链接
		-->
		<table  width="100%" >
			<!--第一部份: LOGO部分: 嵌套一个一行三列的表格-->
			<tr>
				<td>
					<table  width="100%">
						<tr>
							<td>
								<img src="../img/logo2.png" />
							</td>
							<td>
								<img src="../image/header.jpg" />
							</td>
							<td>
								<a href="#">登录</a>
								<a href="#">注册</a>
								<a href="#">购物车</a>
							</td>
						</tr>
					</table>
				</td>
			</tr>
			<!--第二部分: 导航栏部分 : 放置5个超链接-->
			<tr bgcolor="black">
				<td height="50px">
					<a href="#"><font color="white">首页</font></a>
					<a href="#"><font color="white">手机数码</font></a>
					<a href="#"><font color="white">鞋靴箱包</font></a>
					<a href="#"><font color="white">电脑办公</font></a>
					<a href="#"><font color="white">香烟酒水</font></a>
				</td>
			</tr>
			<!--第三部分: 轮播图 -->
			<tr>
				<td>
					<img src="../img/1.jpg" width="100%" />
				</td>
			</tr>
			<!--第四部分: 嵌套一个三行7列表格-->
			<tr>
				<td>
					<table  width="100%" height="500px"> 
						<tr>
							<td colspan="7">
								<h3>最新商品<img src="../img/title2.jpg"></h3>
							</td>
						</tr>
						<tr align="center">
							<!--左边大图的-->
							<td rowspan="2" width="206px" height="480px">
								<img src="../products/hao/big01.jpg" />
							</td>
							<td colspan="3" height="240px">
								<img src="../products/hao/middle01.jpg" width="100%" height="100%" />								
							</td>
							<td>
								<img src="../products/hao/small06.jpg" />
								<p>洗衣机</p>
								<p><font color="red">$998</font></p>
							</td>
							<td>
								<img src="../products/hao/small06.jpg" />
								<p>洗衣机</p>
								<p><font color="red">$998</font></p>
							</td>
							<td>
								<img src="../products/hao/small06.jpg" />
								<p>洗衣机</p>
								<p><font color="red">$998</font></p>
							</td>
						</tr>
						<tr align="center">
							
							<td>
								<img src="../products/hao/small06.jpg" />
								<p>洗衣机</p>
								<p><font color="red">$998</font></p>
							</td>
							<td>
								<img src="../products/hao/small06.jpg" />
								<p>洗衣机</p>
								<p><font color="red">$998</font></p>
							</td>
							<td>
								<img src="../products/hao/small06.jpg" />
								<p>洗衣机</p>
								<p><font color="red">$998</font></p>
							</td>
							<td>
								<img src="../products/hao/small06.jpg" />
								<p>洗衣机</p>
								<p><font color="red">$998</font></p>
							</td>
							<td>
								<img src="../products/hao/small06.jpg" />
								<p>洗衣机</p>
								<p><font color="red">$998</font></p>
							</td>
							<td>
								<img src="../products/hao/small06.jpg" />
								<p>洗衣机</p>
								<p><font color="red">$998</font></p>
							</td>
						</tr>
					</table>
				</td>
			</tr>
			<!--第五部分: 直接放一张图片-->
			<tr>
				<td>
					<img src="../products/hao/ad.jpg" width="100%" />
				</td>
			</tr>
			<!--第六部分: 抄第四部分的-->
			<tr>
				<td>
					<table  width="100%" height="500px"> 
						<tr>
							<td colspan="7">
								<h3>热门商品<img src="../img/title2.jpg"></h3>
							</td>
						</tr>
						<tr align="center">
							<!--左边大图的-->
							<td rowspan="2" width="206px" height="480px">
								<img src="../products/hao/big01.jpg" />
							</td>
							<td colspan="3" height="240px">
								<img src="../products/hao/middle01.jpg" width="100%" height="100%" />								
							</td>
							<td>
								<img src="../products/hao/small06.jpg" />
								<p>洗衣机</p>
								<p><font color="red">$998</font></p>
							</td>
							<td>
								<img src="../products/hao/small06.jpg" />
								<p>洗衣机</p>
								<p><font color="red">$998</font></p>
							</td>
							<td>
								<img src="../products/hao/small06.jpg" />
								<p>洗衣机</p>
								<p><font color="red">$998</font></p>
							</td>
						</tr>
						<tr align="center">
							
							<td>
								<img src="../products/hao/small06.jpg" />
								<p>洗衣机</p>
								<p><font color="red">$998</font></p>
							</td>
							<td>
								<img src="../products/hao/small06.jpg" />
								<p>洗衣机</p>
								<p><font color="red">$998</font></p>
							</td>
							<td>
								<img src="../products/hao/small06.jpg" />
								<p>洗衣机</p>
								<p><font color="red">$998</font></p>
							</td>
							<td>
								<img src="../products/hao/small06.jpg" />
								<p>洗衣机</p>
								<p><font color="red">$998</font></p>
							</td>
							<td>
								<img src="../products/hao/small06.jpg" />
								<p>洗衣机</p>
								<p><font color="red">$998</font></p>
							</td>
							<td>
								<img src="../products/hao/small06.jpg" />
								<p>洗衣机</p>
								<p><font color="red">$998</font></p>
							</td>
						</tr>
					</table>
				</td>
			</tr>
			<!-- 第七部分: 放置一张图片-->
			<tr>
				<td>
					<img src="../image/footer.jpg" width="100%" />
				</td>
			</tr>
			<!--第八部分: 放一堆超链接-->
			<tr>
				<td align="center">
					        
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
				</td>
			</tr>
		</table>
	</body>
</html>

```



### 5.网站注册页面:

#### 5.1需求分析:

​	编写一个HTML页面, 显示效果如图所示

#### 5.2技术分析:

- 表单标签

  ```html
  <!--
  			表单标签
  				action : 直接提交的地址
  				
  				method : 
  						get 方式  默认提交方式 ,会将参数拼接在链接后面 , 有大小限制 ,4k
  						post 方式  会将参数封装在请求体中, 没有这样的限制
  						
  			
  			input :
  				type: 指定输入项的类型
  					text : 文本
  					password :  密码框
  					radio :		单选按钮
  					checkbox :  复选框
  					file 	 : 上传文件
  					submit   : 提交按钮
  					button 	 : 普通按钮
  					reset	 : 重置按钮
  					hidden  : 隐藏域
  					
  					date    : 日期类型
  					tel     : 手机号
  					number   : 只允许输入数字
  					
  				placeholder : 指定默认的提示信息
  				name : 在表单提交的时候,当作参数的名称
  				id : 给输入项取一个名字, 以便于后期我们去找到它,并且操作它
  			
  			textarea : 文本域, 可以输入一段文本
  						cols : 指定宽度
  						rows : 指定的是高度
  			
  			select  : 下拉列表
  				option : 选择项
  		-->
  ```

  ​

  #### 步骤分析:

  1. logo部分
  2. 导航栏
  3. 注册部分
  4. 页脚图片
  5. 网站声明信息


#### 5.3代码实现:

```html
<form action="注册入门案例.html">
  <table width="60%" align="center"> 
    <tr>
      <td colspan="2"><font color="blue" size="5">会员注册</font> USER REGISTER</td>
    </tr>
    <tr>
      <td>用户名:</td>
      <td>
        <input type="text"  placeholder="请输入用户名"/>
      </td>
    </tr>
    <tr>
      <td>密   码:</td>
      <td>
        <input type="password"  placeholder="请输入密码"/>
      </td>
    </tr>
    <tr>
      <td>确认密码:</td>
      <td>
        <input type="password"  placeholder="请再次输入密码"/>
      </td>
    </tr>
    <tr>
      <td>email:</td>
      <td>
        <input type="text"  placeholder="请输入邮箱"/>
      </td>
    </tr>
    <tr>
      <td>姓名:</td>
      <td>
        <input type="text"  placeholder="请输入真实姓名"/>
      </td>
    </tr>
    <tr>
      <td>性别:</td>
      <td>
        <input type="radio" name="sex" /> 男
        <input type="radio" name="sex" /> 女
        <input type="radio" name="sex" /> 妖
      </td>
    </tr>
    <tr>
      <td>出生日期:</td>
      <td>
        <input type="date"  />
      </td>
    </tr>
    <tr>
      <td>验证码:</td>
      <td>
        <input type="text"  />
      </td>
    </tr>
    <tr>
      <td></td>
      <td>
        <input type="submit" value="注册"  />
      </td>
    </tr>
  </table>
</form>
```



### 6.网站后台页面展示

#### 6.1需求分析:

我们前面已经做完了首页商品展示, 那么我们需要一个页面用来编辑我们的商品信息, 还有商品分类, 用户购买之后,还得有订单管理页面

#### 6.2技术分析

框架标签:
frameset

注意: 使用了frameset必须将body删掉,否则页面会有问题

frame
 	常用属性:

​	src: 引入的html文件路径
​	name: 指定框架的名称

#### 6.3步骤分析

#### 6.4代码实现



#### 扩展

框架中点击跳转



#### 常用的快捷键

```html
Ctrl + D 					删除光标当前所在的行
Ctrl + Shift + R 			复制当前行到下一行
Ctrl + Enter 				将光标移动到下一行
Ctrl + Shift + Enter 		将光标定位在上一行
Ctrl + Shift + /            注释当前行
Ctrl + R  					运行当前网页/刷新当前网页
```



