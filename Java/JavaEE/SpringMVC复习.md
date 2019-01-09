# SpringMVC复习

## servlet

传统servlet的执行过程分为如下几步： 
1、浏览器向服务器发送请求http://localhost:8080/webproject/hello 
2、服务器接受到请求，并从地址中得到项目名称webproject 
3、然后再从地址中找到名称hello，并与webproject下的web.xml文件进行匹配 
4、在web.xml中找到一个 <url-pattern>hello</url-pattern>的标签，并且通过他找到servlet-name进而找到<servlet-class> 
5、再拿到servlet-class之后，这个服务器便知道了这个servlet的全类名，所以便可以通过反射技术创建这个类的对象，并且调用doGet/doPost方法 

6、方法执行完毕，结果打回到浏览器。结束。

## SpringMVC

配置的是org.springframework.web.servlet.DispatcherServlet，所有的请求过来都会找这个servlet （前端控制器）

1、  用户发送请求至前端控制器DispatcherServlet。

2、  DispatcherServlet收到请求调用HandlerMapping处理器映射器。

3、  处理器映射器找到具体的处理器(可以根据xml配置、注解进行查找)，生成处理器对象及处理器拦截器(如果有则生成)一并返回给DispatcherServlet。

4、  DispatcherServlet调用HandlerAdapter处理器适配器。

5、  HandlerAdapter经过适配调用具体的处理器(Controller，也叫后端控制器)。

6、  Controller执行完成返回ModelAndView。

7、  HandlerAdapter将controller执行结果ModelAndView返回给DispatcherServlet。

8、  DispatcherServlet将ModelAndView传给ViewReslover视图解析器。

9、  ViewReslover解析后返回具体View。

10、DispatcherServlet根据View进行渲染视图（即将模型数据填充至视图中）。

11、 DispatcherServlet响应用户。



https://www.cnblogs.com/xiaoxi/p/6164383.html



DispatcherServlet-->initApplicationContext

初始化容器 建立Map<url,controller>关系的部分 

