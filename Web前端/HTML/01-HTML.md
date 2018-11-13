

## 导航

- 了解什么是标记语言
- 了解HTML主要特性，主要变化以及发展趋势
- 了解HTML的结构标签
- 掌握HTML的主要标签（字体，图片，列表，链接，表单等标签）



##### HTML概述:

HTML: Hyper Text Markup Language 超文本标记语言

超文本: 比普通文本功能更加强大,可以添加各种样式

标记语言: 通过一组标签.来对内容进行描述. <关键字> , 是由浏览器来解释执行

##### HTML的主要作用:

设计网页的基础,

HTML5

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


框架标签:
frameset

注意: 使用了frameset必须将body删掉,否则页面会有问题

frame
 	常用属性:

​	src: 引入的html文件路径
	name: 指定框架的名称

#### 常用的快捷键

```html
Ctrl + D 					删除光标当前所在的行
Ctrl + Shift + R 			复制当前行到下一行
Ctrl + Enter 				将光标移动到下一行
Ctrl + Shift + Enter 		将光标定位在上一行
Ctrl + Shift + /            注释当前行
Ctrl + R  					运行当前网页/刷新当前网页
```



