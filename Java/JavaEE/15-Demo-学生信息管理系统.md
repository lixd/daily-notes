## 学生信息管理系统

## 1.数据库准备

```sql
CREATE DATABASE stus;
USE stus;
CREATE TABLE stu (
	sid INT PRIMARY KEY  AUTO_INCREMENT,
	sname VARCHAR (20),
	gender VARCHAR (5),
	phone VARCHAR (20),
	birthday DATE,
	hobby VARCHAR(50),
	info VARCHAR(200)
);
```

## 2.查询

1. 先写一个JSP 页面， 里面放一个超链接 。 

   <a href="StudentListServlet"> 学生列表显示</a>

2. 写Servlet， 接收请求， 去调用 Service  , 由service去调用dao

3. 先写Dao , 做Dao实现

4. 再Service , 做Service的实现。

5. 在servlet 存储数据，并且做出页面响应。

6. 在list.jsp上显示数据

   EL + JSTL  + 表格

## 3.增加

1. 先跳转到增加的页面 ， 编写增加的页面

2. 点击添加，提交数据到AddServlet . 处理数据。

3. 调用service

4. 调用dao, 完成数据持久化。

5. 完成了这些存储工作后，需要跳转到列表页面。 这里不能直接跳转到列表页面，否则没有什么内容显示。 应该先跳转到查询所有学生信息的那个Servlet， 由那个Servlet再去跳转到列表页面。

6. 爱好的value 值有多个,需要进行转换.

   ```java
   request.getParameter("hobby");
   String[] hobby = 	request.getParameterValues("hobby") ---> String[] 
   String value = Arrays.toString(hobby): // [爱好， 篮球， 足球]
   ```

   

## 4.删除

1. 点击超链接，弹出一个询问是否删除的对话框，如果点击了确定，那么就真的删除。


```html
	<a href="#" onclick="doDelete(${stu.sid})">删除</a>
	让超链接，执行一个js方法
<script type="text/javascript">
	function doDelete(sid) {
		/* 如果这里弹出的对话框，用户点击的是确定，就马上去请求Servlet。 
		如何知道用户点击的是确定。
		如何在js的方法中请求servlet。 */
		var flag = confirm("是否确定删除?");
		if(flag){
			//表明点了确定。 访问servlet。 在当前标签页上打开 超链接，
			//window.location.href="DeleteServlet?sid="+sid;
			location.href="DeleteServlet?sid="+sid;
		}
	}
</script>
```

2.在js访问里面判断点击的选项，然后跳转到servlet。

3.servlet收到了请求，然后去调用service ， service去调用dao

## 5.更新

1. 点击列表上的更新， 先跳转到一个EditServlet 

> 在这个Servlet里面，先根据ID 去查询这个学生的所有信息出来。

2. 跳转到更新的页面。 ，然后在页面上显示数据


```java
//细节1
			<!-- 如果性别是男的，  可以在男的性别 input标签里面， 出现checked ,
			如果性别是男的，  可以在女的性别 input标签里面，出现checked -->
			<input type="radio" name="gender" value="男" <c:if test="${stu.gender == '男'}">checked</c:if>>男
			<input type="radio" name="gender" value="女" <c:if test="${stu.gender == '女'}">checked</c:if>>女
//细节2
			<!-- 爱好： 篮球 ， 足球 ， 看书 
			因为爱好有很多个，  里面存在包含的关系 -->
			<input type="checkbox" name="hobby" value="游泳" <c:if test="${fn:contains(stu.hobby,'游泳') }">checked</c:if>>游泳
	//需要添加JSTL标签
	<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
    <%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
```

3. 修改完毕后，提交数据到UpdateServlet

```html
创建一个隐藏的输入框， 添加sid
	<form method="post" action="UpdateServlet">
		<input type="hidden" name="sid" value="${stu.sid }">
	
		...
	</form>
```

4. 获取数据，调用service， 调用dao.

## 6.分页功能

* 物理分页 （真分页）

> 来数据库查询的时候，只查一页的数据就返回了。  

 	优点 内存中的数据量不会太大
	缺点：对数据库的访问频繁了一点。

	SELECT * FROM stu LIMIT	5 OFFSET 2 

* 逻辑分页 （假分页）

> 一口气把所有的数据全部查询出来，然后放置在内存中。 

	优点： 访问速度快。
	缺点： 数据库量过大，内存溢出。

创建PageBean对象 将分页所需的数据封装到里面.

```java
private int currentPage;//当前页
private int totalPage;//总页数
private int pageSize;//每页显示条数
private int totalSize;//总条数
private List<T> list;//学生对象集合
```

预览:

![这是截图](https://github.com/lillusory/JavaDemo_StuManager/blob/master/assets/2018-12-02-StuManager.png)

源码在GitHub上

[点击这里下载源码](https://github.com/lillusory/JavaDemo_StuManager)

