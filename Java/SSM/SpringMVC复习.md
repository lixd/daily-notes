# SpringMVC复习

## servlet

传统servlet的执行过程分为如下几步： 
1、浏览器向服务器发送请求http://localhost:8080/demo/hello 
2、服务器接受到请求，并从地址中得到项目名称webproject 
3、然后再从地址中找到名称hello，并与webproject下的web.xml文件进行匹配 
4、在web.xml中找到一个` <url-pattern>hello</url-pattern>`的标签，并且通过他找到servlet-name进而找到`<servlet-class> `
5、再拿到servlet-class之后，这个服务器便知道了这个servlet的全类名，通过反射创建这个类的对象，并且调用doGet/doPost方法 

6、方法执行完毕，结果返回到浏览器。结束。

## SpringMVC

其中也配置了一个Servlet

配置的是org.springframework.web.servlet.DispatcherServlet，所有的请求过来都会找这个servlet （前端控制器）

DispatcherServlet继承了HttpServlet

### 运行过程分析：

1、  用户发送请求至前端控制器`DispatcherServlet`。

2、  `DispatcherServlet`收到请求调用`HandlerMapping`处理器映射器。

3、  处理器映射器找到具体的处理器(可以根据xml配置、注解进行查找)，生成处理器对象及处理器拦截器(如果有则生成)`HandlerExcutorChain`并返回给DispatcherServlet。

4、  `DispatcherServlet`调用`HandlerAdapter`处理器适配器。

5、  `HandlerAdapter`经过适配调用具体的处理器(Controller，也叫后端控制器)。

6、 ` Controller`执行完成返回`ModelAndView`。

7、  `HandlerAdapter`将controller执行结果`ModelAndView`返回给`DispatcherServlet`。

8、  `DispatcherServlet`将ModelAndView传给`ViewReslover`视图解析器。

9、  `ViewReslover`解析后返回具体`View`。

10、`DispatcherServle`t根据`View`进行渲染视图（即将模型数据填充至视图中）。

11、 DispatcherServlet响应用户。

### 具体分析： 

**1.建立Map<urls,controller>的关系**

在容器初始化时会建立`所有url和controller的对应关系`,保存到`Map<url,controller>`中.

`DispatcherServlet-->initApplicationContext`初始化容器 建立Map<url,controller>关系的部分 

tomcat启动时会通知spring初始化容器(加载bean的定义信息和初始化所有单例bean),然后springmvc会遍历容器中的bean,获取每一个controller中的所有方法访问的url,然后将url和controller保存到一个Map中;

**2.根据访问url找到对应controller中处理请求的方法.**

`DispatcherServlet-->doDispatch()`

　　这样就可以根据request快速定位到controller,因为最终处理request的是controller中的方法,Map中只保留了url和controller中的对应关系,所以要根据request的url进一步确认controller中的method,这一步工作的原理就是拼接controller的url(controller上@RequestMapping的值)和方法的url(method上@RequestMapping的值),与request的url进行匹配,找到匹配的那个方法;　　

**3.反射调用处理请求的方法,返回结果视图**

　　确定处理请求的method后,接下来的任务就是参数绑定,把request中参数绑定到方法的形式参数上,这一步是整个请求处理过程中最复杂的一个步骤。springmvc提供了两种request参数与方法形参的绑定方法:

　　① 通过注解进行绑定,@RequestParam

　　② 通过参数名称进行绑定.
　　使用注解进行绑定,我们只要在方法参数前面声明@RequestParam("a"),就可以将request中参数a的值绑定到方法的该参数上.使用参数名称进行绑定的前提是必须要获取方法中参数的名称,Java反射只提供了获取方法的参数的类型,并没有提供获取参数名称的方法.springmvc解决这个问题的方法是用asm框架读取字节码文件,来获取方法的参数名称.asm框架是一个字节码操作框架,关于asm更多介绍可以参考它的官网.个人建议,使用注解来完成参数绑定,这样就可以省去asm框架的读取字节码的操作.

## 参考：

https://www.cnblogs.com/heavenyes/p/3905844.html