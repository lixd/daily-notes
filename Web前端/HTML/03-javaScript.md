### 

### 教学导航

1. 掌握JS中的BOM对象
2. 掌握JS中的常用事件
3. 掌握JS中的常用DOM操作
4. 了解JS中的内置对象



## CSS/JS复习:

CSS: 层叠样式表

主要作用: 美化页面, 将美化和HTML进行分离,提高代码复用性

选择器:

​	元素选择器: 元素的名称{}

​	类选择器:  . 开头

​	ID选择器:  #ID选择器

​	

​	后代选择器:  选择器1 选择器2

​	子元素选择器: 选择器1 > 选择器2 

​	选择器分组: 选择器1,选择器2,选择器3{}

​	属性选择器: 选择器[属性的名称='属性的值']

​	伪类选择器:



浮动:

​	float 属性: left right

清除浮动:

​	clear 属性: both left right



盒子模型:  上右下左   padding 10px 20px 30px 40px  顺时针的方向

​	内边距: 控制的盒子内距离

​	边框: 盒子的边框

​	外边距: 控制盒子与盒子之间的距离



绝对定位:  position : absolute; top:   left



JS开发: 是一门脚本语言,由浏览器来解释执行,不需要经过编译

JS声明变量:   var  变量的名字;

JS声明函数: function 函数的名称(参数的名字){}

JS开发的步骤:

	1. 确定事件
	2. 事件要触发函数,所以我们是要声明函数
	3. 函数里面通常是去做一些交互才操作,  弹框, 修改页面内容,动态去添加一些东西



- 定时器
  - setInterval : 每隔多少毫秒执行一次函数
  - setTimeout: 多少毫秒之后执行一次函数
  - clearInterval
  - clearTimeout
- 显示广告 img.style.display  = "block"
- 隐藏广告 img.style.display  = "none"


#### 1.3 步骤分析

1. 确定事件: 页面加载完成的事件 onload
2. 事件要触发函数:  init()
3. init函数里面做一件事: 
   1. 启动一个定时器 : setTimeout() 
   2. 显示一个广告
      1. 再去开启一个定时5秒钟之后,关闭广告


#### 1.4 代码实现

```html
<script>
		
			function init(){
				setTimeout("showAD()",3000);
			}
			
			function showAD(){
				//首先要获取要操作的img
				var img = document.getElementById("img1");
				//显示广告
				img.style.display = "block";
				
				//再开启定时器,关闭广告
				setTimeout("hideAD()",3000);
			}
			
			function hideAD(){
				//首先要获取要操作的img
				var img = document.getElementById("img1");
				//隐藏广告
				img.style.display = "none";
			}
		</script>
```




#### 1.5扩展

- JS的引入方式




### 2. 完成完成表单的校验

#### 2.1 需求分析

​	昨天我们做了一个简单的表单校验，每当用户输入出错的时候，我们是弹出了一个对话框，提示用户去修改。这样的用户体验效果非常不好好。我们今天就是需要来对他进行一个修改，当用户输入信息有问题的时候，我们就再输入框的后面给他一个友好提示。



#### 2.2 技术分析

【HTML中innerHTML属性】

【JS中的常用事件】

onfocus 事件: 获得焦点事件

onblur : 失去焦点

onkeyup : 按键抬起事件


#### 2.3 步骤分析



#### 2.4 代码实现

```css
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<title></title>
		<!--
			引入外部的js文件
		-->
		<script type="text/javascript" src="../js/regutils.js" ></script>
		<script>
			/*
				1. 确定事件 : onfocus
				2. 事件要驱动函数
				3. 函数要干一些事情: 修改span的内容
			*/
			function showTips(spanID,msg){
				//首先要获得要操作元素 span
				var span = document.getElementById(spanID);
				span.innerHTML = msg;
			}
			/*
				校验用户名:
				1.事件: onblur  失去焦点
				2.函数: checkUsername()
				3.函数去显示校验结果
			*/
			function checkUsername(){
				//获取用户输入的内容
				var uValue = document.getElementById("username").value;
				//对输入的内容进行校验
				//获得要显示结果的span
				var span = document.getElementById("span_username");
				if(uValue.length < 6){
					//显示校验结果
					span.innerHTML = "<font color='red' size='2'>对不起,太短</font>";
					return false;
				}else{
					span.innerHTML = "<font color='red' size='2'>恭喜您,可用</font>";
					return true;
				}
			}
			
			/*
			 密码校验
			 */
			function checkPassword(){
				//获取密码输入
				var uPass = document.getElementById("password").value;
				var span = document.getElementById("span_password");
				//对密码输入进行校验
				if(uPass.length < 6){
					span.innerHTML = "<font color='red' size='2'>对不起,太短</font>";
					return false;
				}else{
					span.innerHTML = "<font color='red' size='2'>恭喜您,够用</font>";
					return true;
				}
			}
			
			/*
			 确认密码校验
			 * */
			function checkRePassword(){
				//获取密码输入
				var uPass = document.getElementById("password").value;
				
				//获取确认密码输入
				var uRePass = document.getElementById("repassword").value;
				var span = document.getElementById("span_repassword");
				
				//对密码输入进行校验
				if(uPass != uRePass){
					span.innerHTML = "<font color='red' size='2'>对不起,两次密码不一致</font>";
					return false;
				}else{
					span.innerHTML = "";
					return true;
				}
			}
			
			/*
			 校验邮箱
			 * */
			function checkMail(){
				var umail = document.getElementById("email").value;
				var flag = checkEmail(umail);
				
				var span = document.getElementById("span_email");
				//对邮箱输入进行校验
				if(flag){
					span.innerHTML = "<font color='red' size='2'>恭喜您,可用</font>";
					return true;
				}else{
					span.innerHTML = "<font color='red' size='2'>对不起,邮箱格式貌似有问题</font>";
					return false;
				}
			}
			
			function checkForm(){
				var flag = checkUsername() && checkPassword() && checkRePassword() && checkMail();
				return flag;
			}
			
		</script>
	</head>
	<body>
		<form action="../01-自动轮播图片/图片自动轮播.html" onsubmit="return checkForm()" >
			用户名:<input type="text" id="username" onfocus="showTips('span_username','用户名长度不能小于6')" onblur="checkUsername()" onkeyup="checkUsername()" /><span id="span_username"></span><br />
			密码:<input type="password" id="password" onfocus="showTips('span_password','密码长度不能小于6')" onblur="checkPassword()" onkeyup="checkPassword()"/><span id="span_password"></span><br />
			确认密码:<input type="password" id="repassword" onfocus="showTips('span_repassword','两次密码必须一致')" onblur="checkRePassword()" onkeyup="checkRePassword()" /><span id="span_repassword"></span><br />
			邮箱:<input type="text" id="email" onfocus="showTips('span_email','邮箱格式必须正确')" onblur="checkMail()" /><span id="span_email"></span><br />
			手机号:<input type="text" id="text" /><br />
			
			<input type="submit" value="提交" />
		</form>
	</body>
</html>
```



### 上午回顾:

定时器:

​	setInterval("test()",3000)   每隔多少毫秒执行一次函数

​	setTimeout("test()",3000)  多少毫秒之后执行一次函数

​	timerID 上面定时器调用之后

​	clearInterval()

​	clearTimeout()

切换图片

​	img.src = "图片路径"



事件: 文档加载完成的事件 onload事件

显示广告  :   img.style.display = "block"

隐藏广告:    img.style.display ="none"



引入一个外部js文件  

```html
<script src="js文件的路径"  type="text/javascript"/>
```

表单校验中常用的事件:

​	获得焦点事件: onfocus

​	失去焦点事件  onblur

​	按键抬起事件:  onkeyup



JS开发步骤

	1. 确定事件
	2. 事件要触发函数: 定义函数
	3. 函数通常都要去做一些交互:  点击, 修改图片,  动态修改innerHTML属性...  innerTEXT

​	





### 3.表格隔行换色

#### 3.1 需求分析

​	我们商品分类的信息太多，如果每一行都显示同一个颜色的话会让人看的眼花，为了提高用户体验，减少用户看错的情况，需要对表格进行隔行换色

#### 3.2 技术分析

改变行的颜色



#### 3.3 步骤分析

1.   确定事件: 文档加载完成 onload
     2.  事件要触发函数: init()
         3. 函数:操作页面的元素
            	要操作表格中每一行
            	动态的修改行的背景颜色

#### 3.4 代码实现

```html
<script >
			function init(){
				//得到表格
				var tab = document.getElementById("tab");
				//得到表格中每一行
				var rows = tab.rows;
				//便利所有的行,然后根据奇数 偶数
				for(var i=1; i < rows.length; i++){
					var row = rows[i];  //得到其中的某一行
					if(i%2==0){
						row.bgColor = "yellow";
					}else{
						row.bgColor = "red"
					}
				}
			}
</script>
```





### 4. 复选框的全选和全不选

#### 4.1 需求分析

​	商品分类界面中，当我们点击全选框的时候，我们希望选中所有的商品，当我们取消掉的时候，我们希望不选中所有的商品

#### 4.2 技术分析

​	事件 : onclick点击事件

#### 4.3 步骤分析

全选和全不选步骤分析:

1.确定事件: onclick 单机事件
2.事件触发函数: checkAll()
3.函数要去做一些事情:
  	获得当前第一个checkbox的状态
  	 获得所有分类项的checkbox
  	修改每一个checkbox的状态
#### 代码实现

```html
function checkAll(){
//				获得当前第一个checkbox的状态
				var check1 = document.getElementById("check1");
				//得到当前checked状态
				var checked = check1.checked;
//				 	获得所有分类项的checkbox
//				var checks = document.getElementsByTagName("input");
				var checks = document.getElementsByName("checkone");
//				alert(checks.length);
				for(var i = 0; i < checks.length; i++){
//				 	修改每一个checkbox的状态
					var checkone = checks[i];
					checkone.checked = checked;
				}
			}
```



### 5. 省市联动效果

#### 5.1 需求分析

#### 5.2 技术分析



什么是DOM: Document Object Model : 管理我们的文档   增删改查规则 




【HTML中的DOM操作】

```html
一些常用的 HTML DOM 方法：
  getElementById(id) - 获取带有指定 id 的节点（元素） 
  appendChild(node) - 插入新的子节点（元素） 
  removeChild(node) - 删除子节点（元素） 

  一些常用的 HTML DOM 属性：
  innerHTML - 节点（元素）的文本值 
  parentNode - 节点（元素）的父节点 
  childNodes - 节点（元素）的子节点 
  attributes - 节点（元素）的属性节点 


查找节点：
getElementById() 返回带有指定 ID 的元素。 
getElementsByTagName() 返回包含带有指定标签名称的所有元素的节点列表（集合/节点数组）。 
getElementsByClassName() 返回包含带有指定类名的所有元素的节点列表。 

增加节点：
createAttribute() 创建属性节点。 
createElement() 创建元素节点。 
createTextNode() 创建文本节点。 
insertBefore() 在指定的子节点前面插入新的子节点。 
appendChild() 把新的子节点添加到指定节点。 

删除节点：
removeChild() 删除子节点。 
replaceChild() 替换子节点。 

修改节点：
setAttribute()  修改属性
setAttributeNode()  修改属性节点
```



#### 5.3 步骤分析



#### 5.4 代码实现

```html

```





### 6. 使用JS控制下拉列表左右选择

#### 6.1 需求分析:

在我们的分类管理中,我们要能够去修改我们的分类信息,当我们一点修改的时候,跳转到一个可以编辑的页面,这里面能够修改分类的名称,分类的描述,以及分类的商品

#### 6.2 步骤分析:



#### 6.3 代码实现

```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<title></title>
		<!--
			步骤分析
				1. 确定事件: 点击事件 :onclick事件
				2. 事件要触发函数 selectOne
				3. selectOne要做一些操作
					(将左边选中的元素移动到右边的select中)
					1. 获取左边Select中被选中的元素
					2. 将选中的元素添加到右边的Select中就可以
		-->
		<script>
			
			function selectOne(){
//				1. 获取左边Select中被选中的元素
				var leftSelect = document.getElementById("leftSelect");
				var options = leftSelect.options;
				
				//找到右侧的Select
				var rightSelect = document.getElementById("rightSelect");
				//遍历找出被选中的option
				for(var i=0; i < options.length; i++){
					var option1 = options[i];
					if(option1.selected){
		//				2. 将选中的元素添加到右边的Select中就可以
						rightSelect.appendChild(option1);
					}
				}
			}
			
			//将左边所有的商品移动到右边
			function selectAll(){
//				1. 获取左边Select中被选中的元素
				var leftSelect = document.getElementById("leftSelect");
				var options = leftSelect.options;
				
				//找到右侧的Select
				var rightSelect = document.getElementById("rightSelect");
				//遍历找出被选中的option
				for(var i=options.length - 1; i >=0; i--){
					var option1 = options[i];
					rightSelect.appendChild(option1);
				}
			}
			
			
			
		</script>
	</head>
	<body>
		
		<table border="1px" width="400px">
			<tr>
				<td>分类名称</td>
				<td><input type="text" value="手机数码"/></td>
			</tr>
			<tr>
				<td>分类描述</td>
				<td><input type="text" value="这里面都是手机数码"/></td>
			</tr>
			<tr>
				<td>分类商品</td>
				<td>
					<!--左边-->
					<div style="float: left;">
						已有商品<br />
						<select multiple="multiple" id="leftSelect" ondblclick="selectOne()">
							<option>华为</option>
							<option>小米</option>
							<option>锤子</option>
							<option>oppo</option>
						</select>
						<br />
						<a href="#" onclick="selectOne()"> &gt;&gt; </a> <br />
						<a href="#" onclick="selectAll()"> &gt;&gt;&gt; </a>
					</div>
					<!--右边-->
					<div style="float: right;"> 
						未有商品<br />
						<select multiple="multiple" id="rightSelect">
							<option>苹果6</option>
							<option>肾7</option>
							<option>诺基亚</option>
							<option>波导</option>
						</select>
						<br />
						<a href="#"> &lt;&lt; </a> <br />
						<a href="#"> &lt;&lt;&lt; </a>
					</div>
				</td>
			</tr>
			<tr>
				<td colspan="2">
					<input type="submit" value="提交"/>
				</td>
			</tr>
		</table>
	</body>
</html>
```





今天内容简单回顾:

定时器: 

​	setInterval

​	setTimeout

​	clearInterval

​	clearTimeout

控制图片显示隐藏

​	img.style.display = "block"

​	img.style.display = "none"



表单中常用的事件:

​	onfocus: 获取焦点事件

​	onblur : 失去焦点的事件

​	onkeyup: 按键抬起的事件

​	onclick:  单击事件

​	ondblclick:  双击事件 

表格隔行换色,鼠标移入和移除要变色:

​	onmouseenter:  鼠标移入

​	onmouseout:  鼠标移出

​	onload:  文档加载完成事件

​	onsubmit:  提交

​	onchange:   下拉列表内容改变



checkbox.checked  选中状态



DOM的文档操作:

​	添加节点: appendChild

​	创建节点: document.createElement

​	创建文本节点: document.createTextNode()



JS开发步骤:

	1. 确认事件
	2. 事件触发函数
	3. 函数里面要做一些交互 



​	





