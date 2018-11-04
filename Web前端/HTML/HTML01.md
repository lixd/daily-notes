HTML01

标签：

```
<h1> <h2>标题等级

<hr>水平线

<br>换行
<p> 段落
<font> 格式(color size face字体)
<b> 加粗
<strong>加粗 带语义朗读的时候感情有所提升
<i>斜体
<em>斜体 带语义 同上
<img> 图片 src width height alt(图片加载失败是显示的信息)
./ 当前路径
../ 上一级路径
../../上上级路径
<ul> 无需列表 type前面的序号类型
<ol> type start 第一个序号的值 默认从1开始
<a> 超链接 href 链接地址 http://www.lixueduan.com 
	target 打开方式
			_self 默认值 当前页打开
			_blank 新标签页打开
<table> 表格 <tr>行<td>列
	border 边框 width height bgcolor 背景颜色 align 对齐方式
	合并 colspan 跨列 rowspan跨行
<input>输入框 type =text,password,file,radio (name 用于分组 同一组只能有一个按钮被选中) 
		submit提交（value 按钮显示的文本） button 普通按钮 reset 重置按钮
<from> 表单标签 提交的类容必须放<from>标签中 （action 提交地址 method 提交方式post 参数在请求体中 无大小限制 get 参数在链接中 限制4k（默认值）） hidder 隐藏域  date/datetime/datetime-local 日期 tel number 数字
placeholder 提示语 如：请输入密码
			name 表单提交时参数的名称
			id 给输入项取的名称
<textarea> 文本域 cols rows 行列
<select> 下拉菜单 option 子选项
<frameset> 框架 用该标签必须取消掉<body>标签 <frame>子框架 src 路径 name 框架名称
```

Ctrl + D 					删除光标当前所在的行
Ctrl + Shift + R 			复制当前行到下一行
Ctrl + Enter 				将光标移动到下一行
Ctrl + Shift + Enter 		将光标定位在上一行
Ctrl + Shift + /            注释当前行
Ctrl + R  					运行当前网页/刷新当前网页

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

  框架标签:
  frameset

  

  注意: 使用了frameset必须将body删掉,否则页面会有问题

  frame
   	常用属性:

  ​	src: 引入的html文件路径
  ​	name: 指定框架的名称

​			

```HTML
	<!--	表单标签

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