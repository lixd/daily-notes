# SpringMVC总结

## 1. Servlet 执行流程

传统servlet的执行过程分为如下几步： 
1、浏览器向服务器发送请求`http://localhost:8080/demo/hello`
2、服务器接受到请求，并从地址中得到项目名称`webproject `
3、然后再从地址中找到名称`hello`，并与`webproject`下的`web.xml`文件进行匹配 
4、在`web.xml`中找到一个` <url-pattern>hello</url-pattern>`的标签，并且通过他找到`servlet-name`进而找到`<servlet-class> `
5、再拿到`servlet-class`之后，这个服务器便知道了这个`servlet`的全类名，通过`反射`创建这个类的对象，并且调用`doGet/doPost`方法 

6、方法执行完毕，结果返回到浏览器。结束。

## 2. SpringMVC 执行流程

SpringMVC 中也配置了一个 Servlet,配置的是 org.springframework.web.servlet.DispatcherServlet，所有的请求过来都会找这个 servlet  (前端控制器)，DispatcherServlet 继承了 HttpServlet。

### 运行过程分析

1、  用户发送请求至前端控制器`DispatcherServlet`。

2、  `DispatcherServlet`收到请求调用`HandlerMapping`处理器映射器。

3、  处理器映射器找到具体的处理器(可以根据xml配置、注解进行查找)，生成处理器对象及处理器拦截器(如果有则生成)`HandlerExcutorChain`并返回给 DispatcherServlet。

4、  `DispatcherServlet`调用`HandlerAdapter`处理器适配器。

5、  `HandlerAdapter`经过适配调用具体的处理器(就是我们写的 Controller )。

6、 ` Controller`执行完成返回`ModelAndView`。

7、  `HandlerAdapter`将 Controller 执行结果`ModelAndView`返回给`DispatcherServlet`。

8、  `DispatcherServlet`将 ModelAndView 传给`ViewReslover`视图解析器。

9、  `ViewReslover`解析后返回具体`View`(这就是为什么`reurn "index"`会自动找到 index.html)

10、`DispatcherServle`t根据`View`进行渲染视图（即将模型数据填充至视图中）。

11、 DispatcherServlet响应用户。

## 3. 具体过程分析

### 1. 建立 Map<urls,Controller> 的关系

#### 概述

在容器初始化时会建立所有`url` 和 `controller`的对应关系,保存到`Map<url,controller>`中。

`DispatcherServlet-->initApplicationContext`初始化容器 建立`Map<url,controller>`关系的部分 

Tomcat启动时会通知 Spring 初始化容器(加载 bean 的定义信息和初始化所有单例 bean ),然后 SpringMVC 会遍历容器中的bean,获取每一个 Controller 中的所有方法访问的 url,然后将 url和 Controller 保存到一个 Map 中;

### 2.根据访问url 找到对应 Controller 中处理请求的方法

#### 概述

`DispatcherServlet-->doDispatch()`

有了前面的 Map 就可以根据 Request快速定位到 Controller,因为最终处理 Request 的是 Controller 中的方法,Map 中只保留了 url 和 Controller 中的对应关系,所以要根据 Request 的 url 进一步确认 Controller 中的 Method.

#### 原理

这一步工作的原理就是拼接 Controller 的 url(controller上@RequestMapping的值) 和方法的 url(method 上@RequestMapping的值),与 Request 的 url 进行匹配,找到匹配的那个方法;　　

#### 3. 参数绑定

确定处理请求的 Method 后,接下来的任务就是参数绑定,把 Request 中参数绑定到方法的形式参数上,这一步是整个请求处理过程中最复杂的一个步骤。SpringMVC 提供了两种 Request 参数与方法形参的绑定方法:

* ① 通过注解进行绑定, @RequestParam

使用注解进行绑定,我们只要在方法参数前面声明 `@RequestParam("a")`,就可以将 `Request` 中参数 `a` 的值绑定到方法的该参数上。

* ② 通过参数名称进行绑定.

使用参数名称进行绑定的前提是必须要获取方法中参数的名称,Java 反射只提供了获取方法的参数的类型,并没有提供获取参数名称的方法。SpringMVC 解决这个问题的方法是用 asm 框架读取字节码文件,来获取方法的参数名称。asm 框架是一个字节码操作框架,关于a sm 更多介绍可以参考它的官网。

个人建议,使用注解来完成参数绑定,这样就可以省去 asm 框架的读取字节码的操作。

## 4. 源码分析

### 第一步、建立Map<urls,controller>的关系

我们首先看第一个步骤,也就是建立`Map<url,controller>`关系的部分.第一部分的入口类`ApplicationObjectSupport`的`setApplicationContext`方法.`setApplicationContext`方法中核心部分就是初始化容器`initApplicationContext(context)`,子类`AbstractDetectingUrlHandlerMapping`实现了该方法,所以我们直接看子类中的初始化容器方法.

```java
//ApplicationObjectSupport类
	@Override
	public final void setApplicationContext(@Nullable ApplicationContext context) throws BeansException {
		if (context == null && !isContextRequired()) {
			// Reset internal context state.
			this.applicationContext = null;
			this.messageSourceAccessor = null;
		}
		else if (this.applicationContext == null) {
			// Initialize with passed-in context.
			if (!requiredContextClass().isInstance(context)) {
				throw new ApplicationContextException(
						"Invalid application context: needs to be of type [" + requiredContextClass().getName() + "]");
			}
			this.applicationContext = context;
			this.messageSourceAccessor = new MessageSourceAccessor(context);
			initApplicationContext(context);
		}
		else {
			// Ignore reinitialization if same context passed in.
			if (this.applicationContext != context) {
				throw new ApplicationContextException(
						"Cannot reinitialize with different application context: current one is [" +
						this.applicationContext + "], passed-in one is [" + context + "]");
			}
		}
	}
```
其中`initApplicationContext(context)`由子类`AbstractDetectingUrlHandlerMapping`实现,具体如下:
```java
/**
	 * Calls the {@link #detectHandlers()} method in addition to the
	 * superclass's initialization.
	 */
	@Override
	public void initApplicationContext() throws ApplicationContextException {
		super.initApplicationContext();
		detectHandlers();
	}
	
	/** 建立当前ApplicationContext中的所有controller和url的对应关系
	 * Register all handlers found in the current ApplicationContext.
	 * <p>The actual URL determination for a handler is up to the concrete
	 * {@link #determineUrlsForHandler(String)} implementation. A bean for
	 * which no such URLs could be determined is simply not considered a handler.
	 * @throws org.springframework.beans.BeansException if the handler couldn't be registered
	 * @see #determineUrlsForHandler(String)
	 */
	protected void detectHandlers() throws BeansException {
		ApplicationContext applicationContext = obtainApplicationContext();
		String[] beanNames = (this.detectHandlersInAncestorContexts ?
				BeanFactoryUtils.beanNamesForTypeIncludingAncestors(applicationContext, Object.class) :
				applicationContext.getBeanNamesForType(Object.class));
        // 获取ApplicationContext容器中所有bean的Name
		// Take any bean name that we can determine URLs for.
		// 遍历beanNames,并找到这些bean对应的url
		for (String beanName : beanNames) {
		     // 找bean上的所有url(controller上的url+方法上的url),该方法由对应的子类实现
			String[] urls = determineUrlsForHandler(beanName);
			if (!ObjectUtils.isEmpty(urls)) {
				// URL paths found: Let's consider it a handler.
				// 保存urls和beanName的对应关系,put it to Map<urls,beanName>,该方法在父类AbstractUrlHandlerMapping中实现
				registerHandler(urls, beanName);
			}
		}

		if ((logger.isDebugEnabled() && !getHandlerMap().isEmpty()) || logger.isTraceEnabled()) {
			logger.debug("Detected " + getHandlerMap().size() + " mappings in " + formatMappingName());
		}
	}       
		/**
    	 * Determine the URLs for the given handler bean.
    	 * @param beanName the name of the candidate bean
    	 * @return the URLs determined for the bean, or an empty array if none
    	 */
		    /** 获取controller中所有方法的url,由子类实现,典型的模板模式 **/
    	protected abstract String[] determineUrlsForHandler(String beanName);
```
