### 今日任务

#### 使用JQuery完成页面定时弹出广告

定时器: 

​	setInterval     clearInterval

​	setTimeout    clearTimeout

显示:  img.style.display  = "block"

隐藏:  img.style.display  = "none"

img 对象

​	style属性:  style对象

#### 使用JQuery完成表格的隔行换色

获得所有的行

​	table.rows[]

修改行的颜色

​	row.bgColor ="red"

​	row.style.backgroundColor = "black"

​	row.style.background = "red"

​	"background-color:red"

​	"background:red"

#### 使用JQuery完成复选框的全选效果

checked属性

如何获取所有复选框:

​	document.getElementsByName   get Elements  By Name  数据库里面

#### 使用JQuery完成省市联动效果

​	JS中的数组:  ["城市"]

​	new Array()

​	DOM树操作:

​		创建节点:  document.createElement

​		创建文本节点: document.createTextNode

​		添加节点:  appendChild

#### 使用JQuery完成下列列表左右选择

​	select下拉列表

​	multiple 允许多选

​	ondblclick : 双击事件

​	for循环遍历,一边遍历一边移除出现的问题

#### 使用JQuery完成表单的校验(扩展)

​	事件:

​	获得焦点事件: onfocus

​	失去焦点事件: onblur

​	按键抬起事件: onkeyup

​	鼠标移入:  onmouseenter

​	鼠标移出: onmouseout

​	JS引入外部文件 : script 



### 今日目标：

#### 掌握JQuery的基本使用

#### 掌握JQuery的基本选择器,层次选择器

#### 会使用JQuery完成DOM的基本操作



### 1. 使用JQuery完成页面定时弹出广告

#### 1.1 需求分析：

当用户打开界面，3秒钟之后弹出广告，这个广告显示5秒钟，隐藏广告

#### 1.2 技术分析

定时器: setTimeout 

显示和隐藏:  style.display = "block/none"



什么JQuery:

jQuery是一个快速、简洁的JavaScript框架，是继Prototype之后又一个优秀的JavaScript代码库（*或JavaScript框架*）。jQuery设计的宗旨是“write Less，Do More”，即倡导写更少的代码，做更多的事情。它封装JavaScript常用的功能代码，提供一种简便的JavaScript设计模式，优化HTML文档操作、事件处理、动画设计和Ajax交互。

jQuery的核心特性可以总结为：具有独特的链式语法和短小清晰的多功能接口；具有高效灵活的css选择器，并且可对CSS选择器进行扩展；拥有便捷的插件扩展机制和丰富的插件。jQuery兼容各种主流浏览器，如IE 6.0+、FF 1.5+、Safari 2.0+、Opera 9.0+等



JQuery的作用:

​	1. 写更少的代码,做更多的事情: write Less ,Do more

	2. 将我们页面的JS代码和HTML页面代码进行分离



为什么学习JQuery:

​	提高我们的工作效率



JQ的入门

```html
<script>
			//js文档加载完成的事件
			window.onload = function(){
				alert("window.onload   111");
			}
			
			window.onload = function(){
				alert("window.onload   222");
			}
			
			/*文档加载完成的事件*/
			jQuery(document).ready(function(){
			 	alert("jQuery(document).ready(function()");
			});
			/*
			 	jQuery  简写成 $
			 */
			$(document).ready(function(){
			 	alert("$(document).ready(function()");
			});
			
			/*
				最简单的写法 
			*/
			$(function(){
				alert("$(function(){");
			});
			
		</script>
```



【JQ中根据ID查找元素】

```html
全都是根据选择器去找的
#ID{}
.类名{}
$("#ID的名称")
```



【JQ和JS之间的转换】

- JQ对象,只能调用JQ的属性和方法
- JS对象 只能调用JS的属性和方法

```html
function changeJS(){
				var div = document.getElementById("div1");
//				div.innerHTML = "JS成功修改了内容"
				//将JS对象转成JQ对象
				$(div).html("转成JQ对象来修改内容")
			}
			
			$(function(){
				//给按钮绑定事件
				$("#btn2").click(function(){
					//找到div1
//					$("#div1").html("JQ方式成功修改了内容");
					//将JQ对象转成JS对象来调用
					var $div = $("#div1");
//					var jsDiv = $div.get(0);
					var jsDiv = $div[0];
					jsDiv.innerHTML="jq转成JS对象成功";
				});
			});
```

JQ的开发步骤: (将我们页面的JS代码和HTML页面代码进行分离)

	1. 导入JQ相关的文件
	2.  文档加载完成事件: $(function)  : 页面初始化的操作: 绑定事件, 启动页面定时器
	3. 确定相关操作的事件
	4. 事件触发函数
	5. 函数里面再去操作相关的元素

显示和隐藏  img.style.display

【JQ中的动画效果】

```javascript
show()
hide()
slideUp
slideDown
fadeIn
fadeOut
animate : 自定义动画
```

#### 1.3 步骤分析：

1. 导入JQ的文件
2. 编写JQ的文档加载事件
3. 启动定时器 setTimeout("",3000);
4. 编写显示广告的函数
5. 在显示广告里面再启动一个定时器
6. 编写隐藏广告的函数



#### 1.4 代码实现

```html
<script>
			//显示广告
			function showAd(){
				$("#img1").slideDown(2000);
				setTimeout("hideAd()",3000);
			}
			//隐藏广告
			function hideAd(){
				$("#img1").slideUp(2000);
			}
			$(function(){
				setTimeout("showAd()",3000);
			});
		</script>
```





### JQuery中的选择器

让我们能够更加精确找到我们要操作的元素	

##### 基本选择器

- ID选择器 :     #ID的名称
- 类选择器:     以 . 开头  .类名
- 元素选择器:    标签的名称
- 通配符选择器:   * 
- 选择器,选择器:  选择器1,选择器2





##### 基本选择器的案例

```javascript
	<!--
			- ID选择器 :     #ID的名称
			- 类选择器:     以 . 开头  .类名
			- 元素选择器:    标签的名称
			- 通配符选择器:   * 
			- 选择器,选择器:  选择器1,选择器2
		-->
		<script>
			//文档加载事件,页面初始化的操作
			$(function(){
				//初始化操作: 给按钮绑定事件
				$("#btn1").click(function(){
					$("#two").css("background-color","palegreen");					
				});
				
				//找出mini类的所有元素
				$("#btn2").click(function(){
					$(".mini").css("background-color","palegreen");					
				});
				$("#btn3").click(function(){
					$("div").css("background-color","palegreen");					
				});
				$("#btn4").click(function(){
					$("*").css("background-color","palegreen");
					
				});
				/*选择器分组*/
				
				//找出mini类 和 span元素
				$("#btn5").click(function(){
					$(".mini,span").css("background-color","palegreen");
				});
			});
		</script>
```

##### JQ中的层级选择器

- 子元素选择器:   选择器1 > 选择器2
- 后代选择器:  选择器1 儿孙
- 相邻兄弟选择器 :  选择器1 + 选择器2 : 找出紧挨着的一个弟弟
- 找出所有弟弟:  选择器1~ 选择器2   : 找出所有的弟弟

```html
<script>
			//文档加载事件,页面初始化的操作
			$(function(){
				//初始化操作: 给按钮绑定事件
				//找出body下面的子div   
				$("#btn1").click(function(){
					$("body > div").css("background-color","palegreen");					
				});
				//找出body下面的所有div
				$("#btn2").click(function(){
					$("body div").css("background-color","palegreen");					
				});
				$("#btn3").click(function(){
					$("#one+div").css("background-color","palegreen");					
				});
				$("#btn4").click(function(){
					$("#two~div").css("background-color","palegreen");					
				});
				
			});
		</script>
```



##### JQ中的基本过滤器

```html
		<script>
			$(function(){
				/<script>
			//文档加载事件,页面初始化的操作
			$(function(){
				
				//初始化操作: 给按钮绑定事件
				//过滤出所有div中第一个元素
				$("#btn1").click(function(){
					$("div:first").css("background-color","palegreen");					
				});
				
				//过滤出所有div中偶数位的div
				$("#btn2").click(function(){
					$("div:even").css("background-color","palegreen");					
				});
				$("#btn3").click(function(){
					$("div:odd").css("background-color","palegreen");					
				});
				$("#btn4").click(function(){
					$("div:gt(2)").css("background-color","palegreen");					
				});
			
			});
		</script>
```



##### JQ中的属性选择器

```html
		$(function(){
				//找到有name属性的input
				$("#btn1").click(function(){
					$("input[name]").attr("checked",true);
				});
				$("#btn2").click(function(){
					$("input[name='accept']").attr("checked",true);
				});
				$("#btn3").click(function(){
					$("input[name='newsletter'][value='Hot Fuzz']").attr("checked",true);
				});
			});
```

##### JQ中的表单过滤器

```html
<script>
  //1.文档加载事件	
  $(function(){
    $(":text").css("background-color","pink");
  });
</script>
```



上午的内容回顾:

什么是JQ:  write less , do more: 写更少的代码,做更多的事

​	javascript函数库

1.11版本

定时器:

动画效果:

​	show : 显示

​	hide : 隐藏

​	slideDown: 

​	slideUp: 向上滑动

​	fadeIn

​	fadeOut

JQ选择器:

基本选择器:

​	ID选择器:  #ID的名字

​	类选择器:  .类名

​	元素选择器:   标签名称

​	通配符选择器:  *

​	选择器分组:  选择器1,选择器2

层级选择器:

​	后代选择器:  选择器1 儿孙

​	子元素选择器: 选择器1 > 儿子

​	相邻兄弟选择器:  选择器1 + 选择器2  找出紧挨着它的弟弟

​	所有弟弟选择器:  选择器1~选择器2  找出所有弟弟



基本过滤器:

​	选择器:first  : 找出的是第一个

​	:last  

​	:even   找出索引为偶数

​	:odd    找出奇数索引

​	:gt(index) :  大于索引

​	:lt(index)   小于

​	:eq(index)  等于



属性选择器:

​	选择器[href]  : 单个属性

```html
选择器[href][title] : 多个属性
选择器[href][title='test'] : 多个属性,包含值
```

表单过滤器:

​	:input   找出所有输入项:  input  textarea  select 

​	:text 

​	:password  

表单对象属性:

​	找出select中被选中的那一项:

​	option:selected



JQ的开发步骤:

	1. 导入JQ相关的包
	2. 文档加载文成的事件:  页面初始化:  绑定事件, 启动定时器
	3.  确定事件
	4. 实现事件索要触发的函数
	5. 函数里面再去操作我们要操作的元素



### 使用JQ完成表格的隔行换色

#### 需求分析:

在我们的实际开发过程中,我们的表格如果所有的行都是一样的话,很容易看花眼,所以我们需要让我们的表格隔行换色

#### 技术分析:

获取所有行 table.rows

遍历所有行

根据行号去修改每一行的背景颜色: bgColor

​	style.backgroundColor = "red"

#### 步骤分析:

1. 导入JQ的包
2. 文档加载完成函数: 页面初始化
3. 获得所有的行 :   元素选择器
4. 根据行号去修改颜色



#### 代码实现:

```html
	$(function(){
				//获得所有的行 :   元素选择器
				$("tbody > tr:even").css("background-color","#CCCCCC");
				//修改基数行
				$("tbody > tr:odd").css("background-color","#FFF38F");
//				$("tbody > tr").css("background-color","#FFF38F");
				
				
			});
```



### 使用JQuery完成表单的全选全不选功能

#### 需求分析

​	在我们对表格处理的时,有些情况下,我们需要对表格进行批量处理,

#### 技术分析:




#### 代码实现:



### 使用JQ完成省市联动效果

#### 需求分析:

​	在我们的注册表单中,通常我们需要知道用户的籍贯,需要一个给用选择的项,当用户选中了省份之后,列出省下面所有的城市

#### 技术分析:

1. 准备工作 : 城市信息的数据

2. 添加节点 :  appendChild (JS)

   1. append  :  添加子元素到末尾
   2. appendTo  : 给自己找一个爹,将自己添加到别人家里
   3. prepend : 在子元素前面添加
   4. after :   在自己的后面添加一个兄弟

3. 遍历的操作:

   ​	

#### 步骤分析:

1. 导入JQ的文件
2. 文档加载事件:页面初始化
3. 进一步确定事件:  change事件
4. 函数: 得到当前选中省份
5. 得到城市, 遍历城市数据
6. 将遍历出来的城市添加到城市的select中

#### 代码实现:

```javascript
$(function(){
				$("#province").change(function(){
//					alert(this.value);
					//得到城市信息
					var cities = provinces[this.value];
					//清空城市select中的option
					/*var $city = $("#city");
					//将JQ对象转成JS对象
					var citySelect = $city.get(0)
					citySelect.options.length = 0;*/
					
					$("#city").empty();  //采用JQ的方式清空
					//遍历城市数据
					$(cities).each(function(i,n){
						$("#city").append("<option>"+n+"</option>");
					});
				});
			});
```





#### 使用JQ完成下拉列表左右选择

#### 需求分析

我们的商品通常包含已经有了的, 还有没有的,现在我们需要有一个页面用于动态编辑这些商品

#### 技术分析



#### 步骤分析

	1. 导入JQ的文件
	2. 文档加载函数 :页面初始化
	3.确定事件 :　点击事件　onclick
	4. 事件触发函数
	1. 移动被选中的那一项到右边

#### 代码实现

```javascript

		<script type="text/javascript" src="../js/jquery-1.11.0.js" ></script>
		<script>
			$(function(){
				$("#a1").click(function(){
					//找到被选中的那一项
					//将被选中项添加到右边
					$("#rightSelect").append($("#leftSelect option:selected"));
				});
				
				//将左边所有商品移动到右边
				$("#a2").click(function(){
					$("#rightSelect").append($("#leftSelect option"));
				});
			});
		</script>
```





#### 今天内容总结:

定时器

动画效果: show  hide  slideDown  slideUp fadeIn  fadeOut  animate

基本选择器:

​	ID选择器: #ID名称

​	类选择器: .类名

​	元素选择器: 元素/标签名称

​	通配符选择器:  *  找出所有页面元素 包含页面上所有的标签

​	选择器分组 :   选择器1, 选择器2      [选择器1,选择器2]

层级选择器:

​	后代选择器:  选择器1 选择器2  找出所有的后代,儿子孙子曾孙

​	子元素选择器: 选择器1 >选择器2  找出所有儿子

​	相邻兄弟选择器:  选择器1+选择器2  : 找出紧挨着自己那个弟弟

​	兄弟选择器 :　　　选择器1~选择器2  :  找出所有的弟弟

属性选择器:

​	选择器[属性名称]

```html
选择器[属性名称][属性名名]
选择器[属性名称='属性值'][属性名称='属性值'][属性名称='属性值']
```



表单选择器:

​	:input   找出所有的输入项 : 不单单找出input  textarea select 

​	:text  找出type类型为 text

​	:password



基本过滤器:

​	:even

​	:odd

​	:gt

​	:lt

​	:eq

​	:first

​	:last

表单对象属性:

​	:selected

​	:checked



```html
$(function)  : 文档加载完成的事件
css()  : 	修改css样式
prop() :    修改属性/ 获取属性
html() :    修改innerHTML

append : 	给自己添加子节点
appendTo :  将自己添加到别人家,给自己找一个爹
prepend :   在自己最前面添加子节点
after	:   在自己后面添加一个兄弟
empty	:   清空所有子节点

$(cities).each(function(i,n){
  	
})

$.each(arr,function(i,n){
  
});

了解, 熟悉, 熟练, 精通 

经过一个项目,将所有学过串起来
```







#### 使用JQ完成表单的校验(扩展)

#### 需求分析

在用户提交表单的时候, 我们最好是能够在用户数据提交给服务器之前去做一次校验,防止服务器压力过大,并且需要给用户一个友好提示

#### 技术分析

- trigger
- triggerHandler
- is()

#### 步骤分析

1. 首先给必填项,添加尾部添加一个小红点
2. 获取用户输入的信息,做相应的校验
3. 事件: 获得焦点, 失去焦点, 按键抬起
4. 表单提交的事件

#### 代码实现



