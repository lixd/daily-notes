## JQuery回顾

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



- trigger  :  触发事件,但是会执行类似浏览将光标移到输入框内的这种浏览器默认行为
- triggerHandler : 仅仅只会触发事件所对应的函数
- is()

## BootStrap的入门开发

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



## 五天前端内容总结

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


