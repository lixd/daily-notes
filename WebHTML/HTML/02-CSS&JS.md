## 01简单回顾

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

## 02CSS/JS

### CSS

```
div 默认换行

span 默认在同一行

<style> 
```

在一个style标签中,去编写CSS内容,最好将style标签写在这个head标签中

```html
<style>
  选择器{
    属性名称:属性的值;
    属性名称2: 属性的值2;
  }
</style>
```

CSS选择器: 帮助我们找到我们要修饰的标签或者元素

```
元素的名称{
  属性名称:属性的值;
  属性名称:属性的值;
}
div{ 
	color: red;
	font-size: 50px;
	}
```

```
以#号开头  ID在整个页面中必须是唯一的s
#ID的名称{
  属性名称:属性的值;
  属性名称:属性的值;
}
	<div id="div1">张三</div>
	
    #div1{
        color: green;
    }
```

```
以 . 开头 
.类的名称{
   属性名称:属性的值;
  	属性名称:属性的值;
}
		<div class="Student">小红</div>
		<div class="Student">小明</div>
		<div class="Teacher">张老师</div>
		<div class="Teacher">李老师</div>
            .Student{
                    color: red;
                }
			.Teacher{
				font-size: 33px;
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

CSS的优先级

按照选择器搜索精确度来编写:		 	行内样式 > ID选择器 > 类选择器  > 元素选择器

就近原则: 哪个离得近,就选用哪个的样式

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

### JS

**JS的组成:**

ECMAScript : 核心部分 ,定义js的语法规范

DOM: document Object Model 文档对象模型 , 主要是用来管理页面的

BOM : Browser Object Model  浏览器对象模型, 前进,后退,页面刷新, 地址栏, 历史记录, 屏幕宽高

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

​	function 函数的名称(){

​	}



