### 导航

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

  

【JS中的常用事件】

onfocus 事件: 获得焦点事件

onblur : 失去焦点

onkeyup : 按键抬起事件



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



什么是DOM: Document Object Model : 管理我们的文档   增删改查规则 



### 【HTML中的DOM操作】

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

### 今天内容简单回顾:

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





