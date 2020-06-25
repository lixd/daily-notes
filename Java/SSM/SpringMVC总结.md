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

### 3. 参数绑定

确定处理请求的 Method 后,接下来的任务就是参数绑定,把 Request 中参数绑定到方法的形式参数上,这一步是整个请求处理过程中最复杂的一个步骤。SpringMVC 提供了两种 Request 参数与方法形参的绑定方法:

#### 注解

使用注解进行绑定,我们只要在方法参数前面声明 `@RequestParam("a")`,就可以将 `Request` 中参数 `a` 的值绑定到方法的该参数上。

#### 参数名称

使用参数名称进行绑定的前提是必须要获取方法中参数的名称,Java 反射只提供了获取方法的参数的类型,并没有提供获取参数名称的方法。SpringMVC 解决这个问题的方法是用 asm 框架读取字节码文件,来获取方法的参数名称。asm 框架是一个字节码操作框架,关于a sm 更多介绍可以参考它的官网。

个人建议,使用注解来完成参数绑定,这样就可以省去 asm 框架的读取字节码的操作。

## 4. 源码分析

### 1. 建立Map<urls,controller>的关系

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

`determineUrlsForHandler(String beanName)`方法的作用是获取每个`Controller`中的`url`,不同的子类有不同的实现,这是一个典型的模板设计模式.因为开发中我们用的最多的就是用注解来配置`Controller``中的url`,`BeanNameUrlHandlerMapping`是`AbstractDetectingUrlHandlerMapping`的子类,我们看`BeanNameUrlHandlerMapping`是如何查`beanName`上所有映射的`url`.

```java
public class BeanNameUrlHandlerMapping extends AbstractDetectingUrlHandlerMapping {

	/**
	 * Checks name and aliases of the given bean for URLs, starting with "/".
	 * 找出名字或者别名是以 / 开头的bean
	 */
	@Override
	protected String[] determineUrlsForHandler(String beanName) {
		List<String> urls = new ArrayList<>();
		if (beanName.startsWith("/")) {
			urls.add(beanName);
		}
		String[] aliases = obtainApplicationContext().getAliases(beanName);
		for (String alias : aliases) {
			if (alias.startsWith("/")) {
				urls.add(alias);
			}
		}
		return StringUtils.toStringArray(urls);
	}

}
```

### 2. 根据访问url找到对应controller中处理请求的方法

下面我们开始分析第二个步骤,第二个步骤是由请求触发的,所以入口为`DispatcherServlet.DispatcherServlet`的核心方法为`doService()`,`doService()`中的核心逻辑由`doDispatch()`实现,我们查看`doDispatch()`的源代码.

```java
/**
 * Process the actual dispatching to the handler.
 * <p>The handler will be obtained by applying the servlet's HandlerMappings in order.
 * The HandlerAdapter will be obtained by querying the servlet's installed HandlerAdapters
 * to find the first that supports the handler class.
 * <p>All HTTP methods are handled by this method. It's up to HandlerAdapters or handlers
 * themselves to decide which methods are acceptable.
 * @param request current HTTP request
 * @param response current HTTP response
 * @throws Exception in case of any kind of processing failure
 */
/** 中央控制器,控制请求的转发 **/
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
   HttpServletRequest processedRequest = request;
   HandlerExecutionChain mappedHandler = null;
   boolean multipartRequestParsed = false;

   WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);

   try {
      ModelAndView mv = null;
      Exception dispatchException = null;

      try {
          // 1.检查是否是文件上传的请求
         processedRequest = checkMultipart(request);
         multipartRequestParsed = (processedRequest != request);

         // Determine handler for the current request.
         // 2.取得处理当前请求的controller,这里也称为hanlder,处理器
         // 第一个步骤的意义就在这里体现了.这里并不是直接返回controller,
         // 而是返回的HandlerExecutionChain请求处理器链对象,
         // 该对象封装了handler和interceptors.
         mappedHandler = getHandler(processedRequest);
         if (mappedHandler == null) {
            noHandlerFound(processedRequest, response);
            return;
         }

         // Determine handler adapter for the current request.
         //3. 获取处理request的处理器适配器handler adapter 
         HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());

         // Process last-modified header, if supported by the handler.
         // 处理 last-modified 请求头
         String method = request.getMethod();
         boolean isGet = "GET".equals(method);
         if (isGet || "HEAD".equals(method)) {
            long lastModified = ha.getLastModified(request, mappedHandler.getHandler());
            if (new ServletWebRequest(request, response).checkNotModified(lastModified) && isGet) {
               return;
            }
         }
			 // 4.拦截器的预处理方法
         if (!mappedHandler.applyPreHandle(processedRequest, response)) {
            return;
         }

         // Actually invoke the handler.
          // 5.实际的处理器处理请求,返回结果视图对象
         mv = ha.handle(processedRequest, response, mappedHandler.getHandler());

         if (asyncManager.isConcurrentHandlingStarted()) {
            return;
         }
		 // 结果视图对象的处理
         applyDefaultViewName(processedRequest, mv);
         // 6.拦截器的后处理方法
         mappedHandler.applyPostHandle(processedRequest, response, mv);
      }
      catch (Exception ex) {
         dispatchException = ex;
      }
      catch (Throwable err) {
         // As of 4.3, we're processing Errors thrown from handler methods as well,
         // making them available for @ExceptionHandler methods and other scenarios.
         dispatchException = new NestedServletException("Handler dispatch failed", err);
      }
       //将结果解析为ModelAndView
      processDispatchResult(processedRequest, response, mappedHandler, mv, dispatchException);
   }
   catch (Exception ex) {
      // 请求成功响应之后的方法
      triggerAfterCompletion(processedRequest, response, mappedHandler, ex);
   }
   catch (Throwable err) {
      triggerAfterCompletion(processedRequest, response, mappedHandler,
            new NestedServletException("Handler processing failed", err));
   }
   finally {
      if (asyncManager.isConcurrentHandlingStarted()) {
         // Instead of postHandle and afterCompletion
         if (mappedHandler != null) {
            mappedHandler.applyAfterConcurrentHandlingStarted(processedRequest, response);
         }
      }
      else {
         // Clean up any resources used by a multipart request.
         if (multipartRequestParsed) {
            cleanupMultipart(processedRequest);
         }
      }
   }
}
```

第2步:`getHandler(processedRequest)`方法实际上就是从`HandlerMapping`中找到`url`和`Controller`的对应关系.这也就是第一个步骤:建立`Map<url,Controller>`的意义.我们知道,最终处理`Request`的是`Controller`中的方法,我们现在只是知道了`Controller`,还要进一步确认`Controller`中处理`Request`的方法.由于下面的步骤和第三个步骤关系更加紧密,直接转到第三个步骤.

### 3. 反射调用处理请求的方法,返回结果视图

上面的方法中,第2步其实就是从第一个步骤中的`Map<urls,beanName>`中取得`Controller`,然后经过拦截器的预处理方法,到最核心的部分--第5步调用`Controller`的方法处理请求.在第2步中我们可以知道处理`Request`的`Controller`,第5步就是要根据`url`确定`Controller`中处理请求的方法,然后通过反射获取该方法上的注解和参数,解析方法和参数上的注解,最后反射调用方法获取`ModelAndView`结果视图。

第5步调用的就是`RequestMappingHandlerAdapter`的`handle().handle()`中的核心逻辑由`invokeHandlerMethod(request, response, handler)`实现。

> handle().handle()-->handleInternal(request, response, (HandlerMethod) handler)-->invokeHandlerMethod(request, response, handlerMethod)

`RequestMappingHandlerAdapter类`

```java
/**
	 * Invoke the {@link RequestMapping} handler method preparing a {@link ModelAndView}
	 * if view resolution is required.
	 * @since 4.2
	 * @see #createInvocableHandlerMethod(HandlerMethod)
	 */
	@Nullable
	protected ModelAndView invokeHandlerMethod(HttpServletRequest request,
			HttpServletResponse response, HandlerMethod handlerMethod) throws Exception {

		ServletWebRequest webRequest = new ServletWebRequest(request, response);
		try {
			WebDataBinderFactory binderFactory = getDataBinderFactory(handlerMethod);
			ModelFactory modelFactory = getModelFactory(handlerMethod, binderFactory);
			//创建invocableMetho
			ServletInvocableHandlerMethod invocableMethod = createInvocableHandlerMethod(handlerMethod);
			if (this.argumentResolvers != null) {
				invocableMethod.setHandlerMethodArgumentResolvers(this.argumentResolvers);
			}
			if (this.returnValueHandlers != null) {
				invocableMethod.setHandlerMethodReturnValueHandlers(this.returnValueHandlers);
			}
			invocableMethod.setDataBinderFactory(binderFactory);
			invocableMethod.setParameterNameDiscoverer(this.parameterNameDiscoverer);

			ModelAndViewContainer mavContainer = new ModelAndViewContainer();
			mavContainer.addAllAttributes(RequestContextUtils.getInputFlashMap(request));
			modelFactory.initModel(webRequest, mavContainer, invocableMethod);
			mavContainer.setIgnoreDefaultModelOnRedirect(this.ignoreDefaultModelOnRedirect);

			AsyncWebRequest asyncWebRequest = WebAsyncUtils.createAsyncWebRequest(request, response);
			asyncWebRequest.setTimeout(this.asyncRequestTimeout);

			WebAsyncManager asyncManager = WebAsyncUtils.getAsyncManager(request);
			asyncManager.setTaskExecutor(this.taskExecutor);
			asyncManager.setAsyncWebRequest(asyncWebRequest);
			asyncManager.registerCallableInterceptors(this.callableInterceptors);
			asyncManager.registerDeferredResultInterceptors(this.deferredResultInterceptors);

			if (asyncManager.hasConcurrentResult()) {
				Object result = asyncManager.getConcurrentResult();
				mavContainer = (ModelAndViewContainer) asyncManager.getConcurrentResultContext()[0];
				asyncManager.clearConcurrentResult();
				LogFormatUtils.traceDebug(logger, traceOn -> {
					String formatted = LogFormatUtils.formatValue(result, !traceOn);
					return "Resume with async result [" + formatted + "]";
				});
				invocableMethod = invocableMethod.wrapConcurrentResult(result);
			}
			//执行ServletInvocableHandlerMethod的invokeAndHandle方法		
			invocableMethod.invokeAndHandle(webRequest, mavContainer);
			if (asyncManager.isConcurrentHandlingStarted()) {
				return null;
			}
			// 封装结果视图
			return getModelAndView(mavContainer, modelFactory, webRequest);
		}
		finally {
			webRequest.requestCompleted();
		}
	}
```

`invocableMethod.setHandlerMethodArgumentResolvers(this.argumentResolvers);`为参数绑定，后面说

其中`invokeAndHandle`如下：

```java
	/**
	 * Invoke the method and handle the return value through one of the
	 * configured {@link HandlerMethodReturnValueHandler HandlerMethodReturnValueHandlers}.
	 * @param webRequest the current request
	 * @param mavContainer the ModelAndViewContainer for this request
	 * @param providedArgs "given" arguments matched by type (not resolved)
	 */
	public void invokeAndHandle(ServletWebRequest webRequest, ModelAndViewContainer mavContainer,
			Object... providedArgs) throws Exception {
			//执行请求对应的方法，并获得返回值
		Object returnValue = invokeForRequest(webRequest, mavContainer, providedArgs);
		setResponseStatus(webRequest);

		if (returnValue == null) {
			if (isRequestNotModified(webRequest) || getResponseStatus() != null || mavContainer.isRequestHandled()) {
				mavContainer.setRequestHandled(true);
				return;
			}
		}
		else if (StringUtils.hasText(getResponseStatusReason())) {
			mavContainer.setRequestHandled(true);
			return;
		}

		mavContainer.setRequestHandled(false);
		Assert.state(this.returnValueHandlers != null, "No return value handlers");
		try {
			this.returnValueHandlers.handleReturnValue(
					returnValue, getReturnValueType(returnValue), mavContainer, webRequest);
		}
		catch (Exception ex) {
			if (logger.isTraceEnabled()) {
				logger.trace(formatErrorForReturnValue(returnValue), ex);
			}
			throw ex;
		}
	}
```

`invokeForRequest`中的操作也是比较简单的，首先获取`request`中的参数，然后调用`doInvoke(args)`方法。

```java
	public Object invokeForRequest(NativeWebRequest request, @Nullable ModelAndViewContainer mavContainer,
			Object... providedArgs) throws Exception {
//首先会获取请求的参数，其实就是Controller方法中的参数
		Object[] args = getMethodArgumentValues(request, mavContainer, providedArgs);
		if (logger.isTraceEnabled()) {
			logger.trace("Arguments: " + Arrays.toString(args));
		}
        //调用Controller中的方法
		return doInvoke(args);
	}
```

`doInvoke`方法是在`InvocableHandlerMethod``类中，最重要的是调用getBridgedMethod().invoke(getBean(),args)`，通过反射机制完成对`Controller`中的函数的调用。

```java
//InvocableHandlerMethod类	
/** 
	 * Invoke the handler method with the given argument values.
	 */
	@Nullable
	protected Object doInvoke(Object... args) throws Exception {
        //反射之前 取消Java的权限控制检查
		ReflectionUtils.makeAccessible(getBridgedMethod());
		try {
          //通过执行controller中的方法
			return getBridgedMethod().invoke(getBean(), args);
		}
		catch (IllegalArgumentException ex) {
			assertTargetBean(getBridgedMethod(), getBean(), args);
			String text = (ex.getMessage() != null ? ex.getMessage() : "Illegal argument");
			throw new IllegalStateException(formatInvokeError(text, args), ex);
		}
		catch (InvocationTargetException ex) {
			// Unwrap for HandlerExceptionResolvers ...
			Throwable targetException = ex.getTargetException();
			if (targetException instanceof RuntimeException) {
				throw (RuntimeException) targetException;
			}
			else if (targetException instanceof Error) {
				throw (Error) targetException;
			}
			else if (targetException instanceof Exception) {
				throw (Exception) targetException;
			}
			else {
				throw new IllegalStateException(formatInvokeError("Invocation failure", args), targetException);
			}
		}
	}

```

  **注**：桥接方法是 JDK 1.5 引入泛型后，为了使Java的泛型方法生成的字节码和 1.5 版本前的字节码相兼容，由编译器自动生成的方法。

反正最终就是通过反射来调用`Controller`中的方法。

### 4. 参数绑定

resolveHandlerArguments方法实现代码比较长,它最终要实现的目的就是:完成request中的参数和方法参数上数据的绑定.

springmvc中提供两种request参数到方法中参数的绑定方式:

#### 注解

使用注解进行绑定,我们只要在方法参数前面声明 `@RequestParam("a")`,就可以将 `Request` 中参数 `a` 的值绑定到方法的该参数上。

#### 参数名称

使用参数名称进行绑定的前提是必须要获取方法中参数的名称,Java 反射只提供了获取方法的参数的类型,并没有提供获取参数名称的方法。SpringMVC 解决这个问题的方法是用 asm 框架读取字节码文件,来获取方法的参数名称。asm 框架是一个字节码操作框架,关于a sm 更多介绍可以参考它的官网。

个人建议,使用注解来完成参数绑定,这样就可以省去 asm 框架的读取字节码的操作。

```java
private Object[] resolveHandlerArguments(Method handlerMethod, Object handler,
            NativeWebRequest webRequest, ExtendedModelMap implicitModel) throws Exception {
　　　　 // 1.获取方法参数类型的数组
        Class[] paramTypes = handlerMethod.getParameterTypes();
　　　　// 声明数组,存参数的值
        Object[] args = new Object[paramTypes.length];
　　　　//2.遍历参数数组,获取每个参数的值
        for (int i = 0; i < args.length; i++) {
            MethodParameter methodParam = new MethodParameter(handlerMethod, i);
            methodParam.initParameterNameDiscovery(this.parameterNameDiscoverer);
            GenericTypeResolver.resolveParameterType(methodParam, handler.getClass());
            String paramName = null;
            String headerName = null;
            boolean requestBodyFound = false;
            String cookieName = null;
            String pathVarName = null;
            String attrName = null;
            boolean required = false;
            String defaultValue = null;
            boolean validate = false;
            int annotationsFound = 0;
            Annotation[] paramAnns = methodParam.getParameterAnnotations();
　　　　　　 // 处理参数上的注解
            for (Annotation paramAnn : paramAnns) {
                if (RequestParam.class.isInstance(paramAnn)) {
                    RequestParam requestParam = (RequestParam) paramAnn;
                    paramName = requestParam.value();
                    required = requestParam.required();
                    defaultValue = parseDefaultValueAttribute(requestParam.defaultValue());
                    annotationsFound++;
                }
                else if (RequestHeader.class.isInstance(paramAnn)) {
                    RequestHeader requestHeader = (RequestHeader) paramAnn;
                    headerName = requestHeader.value();
                    required = requestHeader.required();
                    defaultValue = parseDefaultValueAttribute(requestHeader.defaultValue());
                    annotationsFound++;
                }
                else if (RequestBody.class.isInstance(paramAnn)) {
                    requestBodyFound = true;
                    annotationsFound++;
                }
                else if (CookieValue.class.isInstance(paramAnn)) {
                    CookieValue cookieValue = (CookieValue) paramAnn;
                    cookieName = cookieValue.value();
                    required = cookieValue.required();
                    defaultValue = parseDefaultValueAttribute(cookieValue.defaultValue());
                    annotationsFound++;
                }
                else if (PathVariable.class.isInstance(paramAnn)) {
                    PathVariable pathVar = (PathVariable) paramAnn;
                    pathVarName = pathVar.value();
                    annotationsFound++;
                }
                else if (ModelAttribute.class.isInstance(paramAnn)) {
                    ModelAttribute attr = (ModelAttribute) paramAnn;
                    attrName = attr.value();
                    annotationsFound++;
                }
                else if (Value.class.isInstance(paramAnn)) {
                    defaultValue = ((Value) paramAnn).value();
                }
                else if ("Valid".equals(paramAnn.annotationType().getSimpleName())) {
                    validate = true;
                }
            }
　　
            if (annotationsFound > 1) {
                throw new IllegalStateException("Handler parameter annotations are exclusive choices - " +
                        "do not specify more than one such annotation on the same parameter: " + handlerMethod);
            }

            if (annotationsFound == 0) {// 如果没有注解
                Object argValue = resolveCommonArgument(methodParam, webRequest);
                if (argValue != WebArgumentResolver.UNRESOLVED) {
                    args[i] = argValue;
                }
                else if (defaultValue != null) {
                    args[i] = resolveDefaultValue(defaultValue);
                }
                else {
                    Class paramType = methodParam.getParameterType();
　　　　　　　　　　  // 将方法声明中的Map和Model参数,放到request中,用于将数据放到request中带回页面
                    if (Model.class.isAssignableFrom(paramType) || Map.class.isAssignableFrom(paramType)) {
                        args[i] = implicitModel;
                    }
                    else if (SessionStatus.class.isAssignableFrom(paramType)) {
                        args[i] = this.sessionStatus;
                    }
                    else if (HttpEntity.class.isAssignableFrom(paramType)) {
                        args[i] = resolveHttpEntityRequest(methodParam, webRequest);
                    }
                    else if (Errors.class.isAssignableFrom(paramType)) {
                        throw new IllegalStateException("Errors/BindingResult argument declared " +
                                "without preceding model attribute. Check your handler method signature!");
                    }
                    else if (BeanUtils.isSimpleProperty(paramType)) {
                        paramName = "";
                    }
                    else {
                        attrName = "";
                    }
                }
            }
　　　　　　　// 从request中取值,并进行赋值操作
            if (paramName != null) {
　　　　　　　　　// 根据paramName从request中取值,如果没有通过RequestParam注解指定paramName,则使用asm读取class文件来获取paramName
                args[i] = resolveRequestParam(paramName, required, defaultValue, methodParam, webRequest, handler);
            }
            else if (headerName != null) {
                args[i] = resolveRequestHeader(headerName, required, defaultValue, methodParam, webRequest, handler);
            }
            else if (requestBodyFound) {
                args[i] = resolveRequestBody(methodParam, webRequest, handler);
            }
            else if (cookieName != null) {
                args[i] = resolveCookieValue(cookieName, required, defaultValue, methodParam, webRequest, handler);
            }
            else if (pathVarName != null) {
                args[i] = resolvePathVariable(pathVarName, methodParam, webRequest, handler);
            }
            else if (attrName != null) {
                WebDataBinder binder =
                        resolveModelAttribute(attrName, methodParam, implicitModel, webRequest, handler);
                boolean assignBindingResult = (args.length > i + 1 && Errors.class.isAssignableFrom(paramTypes[i + 1]));
                if (binder.getTarget() != null) {
                    doBind(binder, webRequest, validate, !assignBindingResult);
                }
                args[i] = binder.getTarget();
                if (assignBindingResult) {
                    args[i + 1] = binder.getBindingResult();
                    i++;
                }
                implicitModel.putAll(binder.getBindingResult().getModel());
            }
        }
　　　　 // 返回参数值数组
        return args;
    }
```

### 5. 反射源码分析

反射相关分析来源于：`http://www.sczyh30.com/posts/Java/java-reflection-2/`

第三步中的`invoke`方法如下

```java
    @CallerSensitive
    public Object invoke(Object obj, Object... args)
        throws IllegalAccessException, IllegalArgumentException,
           InvocationTargetException
    {
        if (!override) {
        //quickCheckMemberAccess 检查方法是否为public 如果是的话跳出本步
            if (!Reflection.quickCheckMemberAccess(clazz, modifiers)) {
            //如果不是public方法，那么用Reflection.getCallerClass()方法获取调用这个方法的Class对象，这是一个native方法:
                Class<?> caller = Reflection.getCallerClass();
                checkAccess(caller, clazz, obj, modifiers);
            }
        }
        MethodAccessor ma = methodAccessor;             // read volatile
        if (ma == null) {
            ma = acquireMethodAccessor();
        }
        return ma.invoke(obj, args);
    }
```

getCallerClass()是一个native方法

```java
@CallerSensitive
    public static native Class<?> getCallerClass();
```

在OpenJDK的源码中找到此方法的JNI入口(Reflection.c):

```c
JNIEXPORT jclass JNICALL Java_sun_reflect_Reflection_getCallerClass__
(JNIEnv *env, jclass unused)
{
    return JVM_GetCallerClass(env, JVM_CALLER_DEPTH);
}
```

获取了这个Class对象caller后用checkAccess方法做一次快速的权限校验，其实现为:

```java
volatile Object securityCheckCache;

    void checkAccess(Class<?> caller, Class<?> clazz, Object obj, int modifiers)
        throws IllegalAccessException
    {
        if (caller == clazz) {  // 快速校验
            return;             // 权限通过校验
        }
        Object cache = securityCheckCache;  // read volatile
        Class<?> targetClass = clazz;
        if (obj != null
            && Modifier.isProtected(modifiers)
            && ((targetClass = obj.getClass()) != clazz)) {
            // Must match a 2-list of { caller, targetClass }.
            if (cache instanceof Class[]) {
                Class<?>[] cache2 = (Class<?>[]) cache;
                if (cache2[1] == targetClass &&
                    cache2[0] == caller) {
                    return;     // ACCESS IS OK
                }
                // (Test cache[1] first since range check for [1]
                // subsumes range check for [0].)
            }
        } else if (cache == caller) {
            // Non-protected case (or obj.class == this.clazz).
            return;             // ACCESS IS OK
        }

        // If no return, fall through to the slow path.
        slowCheckMemberAccess(caller, clazz, obj, modifiers, targetClass);
    }
```

首先先执行一次快速校验，一旦调用方法的Class正确则权限检查通过。
若未通过，则创建一个缓存，中间再进行一堆检查（比如检验是否为protected属性）。
如果上面的所有权限检查都未通过，那么将执行更详细的检查，其实现为：

```java
// Keep all this slow stuff out of line:
void slowCheckMemberAccess(Class<?> caller, Class<?> clazz, Object obj, int modifiers,
                           Class<?> targetClass)
    throws IllegalAccessException
{
    Reflection.ensureMemberAccess(caller, clazz, obj, modifiers);

    // Success: Update the cache.
    Object cache = ((targetClass == clazz)
                    ? caller
                    : new Class<?>[] { caller, targetClass });

    // Note:  The two cache elements are not volatile,
    // but they are effectively final.  The Java memory model
    // guarantees that the initializing stores for the cache
    // elements will occur before the volatile write.
    securityCheckCache = cache;         // write volatile
}
```

大体意思就是，用Reflection.ensureMemberAccess方法继续检查权限，若检查通过就更新缓存，这样下一次同一个类调用同一个方法时就不用执行权限检查了，这是一种简单的缓存机制。由于JMM的happens-before规则能够保证缓存初始化能够在写缓存之前发生，因此两个cache不需要声明为volatile。
到这里，前期的权限检查工作就结束了。如果没有通过检查则会抛出异常，如果通过了检查则会到下一步。

#### 调用MethodAccessor的invoke方法

Method.invoke()实际上并不是自己实现的反射调用逻辑，而是委托给sun.reflect.MethodAccessor来处理。
首先要了解Method对象的基本构成，每个Java方法有且只有一个Method对象作为root，它相当于根对象，对用户不可见。当我们创建Method对象时，我们代码中获得的Method对象都相当于它的副本（或引用）。root对象持有一个MethodAccessor对象，所以所有获取到的Method对象都共享这一个MethodAccessor对象，因此必须保证它在内存中的可见性。root对象其声明及注释为：

```java
private volatile MethodAccessor methodAccessor;
// For sharing of MethodAccessors. This branching structure is
// currently only two levels deep (i.e., one root Method and
// potentially many Method objects pointing to it.)
//
// If this branching structure would ever contain cycles, deadlocks can
// occur in annotation code.
private Method  root;
```

那么MethodAccessor到底是个啥玩意呢？

```java
/** This interface provides the declaration for
    java.lang.reflect.Method.invoke(). Each Method object is
    configured with a (possibly dynamically-generated) class which
    implements this interface.
*/
	public interface MethodAccessor {
    /** Matches specification in {@link java.lang.reflect.Method} */
    public Object invoke(Object obj, Object[] args)
        throws IllegalArgumentException, InvocationTargetException;
}
```

可以看到MethodAccessor是一个接口，定义了invoke方法。分析其Usage可得它的具体实现类有:

- sun.reflect.DelegatingMethodAccessorImpl
- sun.reflect.MethodAccessorImpl
- sun.reflect.NativeMethodAccessorImpl

第一次调用一个Java方法对应的Method对象的invoke()方法之前，实现调用逻辑的MethodAccessor对象还没有创建；等第一次调用时才新创建MethodAccessor并更新给root，然后调用MethodAccessor.invoke()完成反射调用：

```java
// NOTE that there is no synchronization used here. It is correct
// (though not efficient) to generate more than one MethodAccessor
// for a given Method. However, avoiding synchronization will
// probably make the implementation more scalable.
private MethodAccessor acquireMethodAccessor() {
    // First check to see if one has been created yet, and take it
    // if so
    MethodAccessor tmp = null;
    if (root != null) tmp = root.getMethodAccessor();
    if (tmp != null) {
        methodAccessor = tmp;
    } else {
        // Otherwise fabricate one and propagate it up to the root
        tmp = reflectionFactory.newMethodAccessor(this);
        setMethodAccessor(tmp);
    }

    return tmp;
}
```

可以看到methodAccessor实例由reflectionFactory对象操控生成，它在AccessibleObject下的声明如下:

```java
// Reflection factory used by subclasses for creating field,
// method, and constructor accessors. Note that this is called
// very early in the bootstrapping process.
static final ReflectionFactory reflectionFactory =
    AccessController.doPrivileged(
        new sun.reflect.ReflectionFactory.GetReflectionFactoryAction());
```

再研究一下sun.reflect.ReflectionFactory类的源码：

```java
public class ReflectionFactory {

    private static boolean initted = false;
    private static Permission reflectionFactoryAccessPerm
        = new RuntimePermission("reflectionFactoryAccess");
    private static ReflectionFactory soleInstance = new ReflectionFactory();
    // Provides access to package-private mechanisms in java.lang.reflect
    private static volatile LangReflectAccess langReflectAccess;

    // 这里设计得非常巧妙
    // "Inflation" mechanism. Loading bytecodes to implement
    // Method.invoke() and Constructor.newInstance() currently costs
    // 3-4x more than an invocation via native code for the first
    // invocation (though subsequent invocations have been benchmarked
    // to be over 20x faster). Unfortunately this cost increases
    // startup time for certain applications that use reflection
    // intensively (but only once per class) to bootstrap themselves.
    // To avoid this penalty we reuse the existing JVM entry points
    // for the first few invocations of Methods and Constructors and
    // then switch to the bytecode-based implementations.
    //
    // Package-private to be accessible to NativeMethodAccessorImpl
    // and NativeConstructorAccessorImpl
    private static boolean noInflation        = false;
    private static int     inflationThreshold = 15;

    //......

	//这是生成MethodAccessor的方法
    public MethodAccessor newMethodAccessor(Method method) {
        checkInitted();

        if (noInflation && !ReflectUtil.isVMAnonymousClass(method.getDeclaringClass())) {
            return new MethodAccessorGenerator().
                generateMethod(method.getDeclaringClass(),
                               method.getName(),
                               method.getParameterTypes(),
                               method.getReturnType(),
                               method.getExceptionTypes(),
                               method.getModifiers());
        } else {
            NativeMethodAccessorImpl acc =
                new NativeMethodAccessorImpl(method);
            DelegatingMethodAccessorImpl res =
                new DelegatingMethodAccessorImpl(acc);
            acc.setParent(res);
            return res;
        }
    }

    //......

    /** We have to defer full initialization of this class until after
    the static initializer is run since java.lang.reflect.Method's
    static initializer (more properly, that for
    java.lang.reflect.AccessibleObject) causes this class's to be
    run, before the system properties are set up. */
    private static void checkInitted() {
        if (initted) return;
        AccessController.doPrivileged(
            new PrivilegedAction<Void>() {
                public Void run() {
                    // Tests to ensure the system properties table is fully
                    // initialized. This is needed because reflection code is
                    // called very early in the initialization process (before
                    // command-line arguments have been parsed and therefore
                    // these user-settable properties installed.) We assume that
                    // if System.out is non-null then the System class has been
                    // fully initialized and that the bulk of the startup code
                    // has been run.

                    if (System.out == null) {
                        // java.lang.System not yet fully initialized
                        return null;
                    }

                    String val = System.getProperty("sun.reflect.noInflation");
                    if (val != null && val.equals("true")) {
                        noInflation = true;
                    }

                    val = System.getProperty("sun.reflect.inflationThreshold");
                    if (val != null) {
                        try {
                            inflationThreshold = Integer.parseInt(val);
                        } catch (NumberFormatException e) {
                            throw new RuntimeException("Unable to parse property sun.reflect.inflationThreshold", e);
                        }
                    }

                    initted = true;
                    return null;
                }
            });
    }
}
```

观察前面的声明部分的注释，我们可以发现一些有趣的东西。就像注释里说的，实际的MethodAccessor实现有两个版本，一个是Java版本，一个是native版本，两者各有特点。初次启动时Method.invoke()和Constructor.newInstance()方法采用native方法要比Java方法快3-4倍，而启动后native方法又要消耗额外的性能而慢于Java方法。也就是说，Java实现的版本在初始化时需要较多时间，但长久来说性能较好；native版本正好相反，启动时相对较快，但运行时间长了之后速度就比不过Java版了。这是HotSpot的优化方式带来的性能特性，同时也是许多虚拟机的共同点：跨越native边界会对优化有阻碍作用，它就像个黑箱一样让虚拟机难以分析也将其内联，于是运行时间长了之后反而是托管版本的代码更快些。

为了尽可能地减少性能损耗，HotSpot JDK采用“inflation”的技巧：让Java方法在被反射调用时，开头若干次使用native版，等反射调用次数超过阈值时则生成一个专用的MethodAccessor实现类，生成其中的invoke()方法的字节码，以后对该Java方法的反射调用就会使用Java版本。 这项优化是从JDK 1.4开始的。

研究ReflectionFactory.newMethodAccessor()生产MethodAccessor对象的逻辑，一开始(native版)会生产NativeMethodAccessorImpl和DelegatingMethodAccessorImpl两个对象。
DelegatingMethodAccessorImpl的源码如下：

```java
/** Delegates its invocation to another MethodAccessorImpl and can
    change its delegate at run time. */

class DelegatingMethodAccessorImpl extends MethodAccessorImpl {
    private MethodAccessorImpl delegate;

    DelegatingMethodAccessorImpl(MethodAccessorImpl delegate) {
        setDelegate(delegate);
    }

    public Object invoke(Object obj, Object[] args)
        throws IllegalArgumentException, InvocationTargetException
    {
        return delegate.invoke(obj, args);
    }

    void setDelegate(MethodAccessorImpl delegate) {
        this.delegate = delegate;
    }
}
```

它其实是一个中间层，方便在native版与Java版的MethodAccessor之间进行切换。
然后下面就是native版MethodAccessor的Java方面的声明：
sun.reflect.NativeMethodAccessorImpl：

```java
/** Used only for the first few invocations of a Method; afterward,
    switches to bytecode-based implementation */

class NativeMethodAccessorImpl extends MethodAccessorImpl {
    private Method method;
    private DelegatingMethodAccessorImpl parent;
    private int numInvocations;

    NativeMethodAccessorImpl(Method method) {
        this.method = method;
    }

    public Object invoke(Object obj, Object[] args)
        throws IllegalArgumentException, InvocationTargetException
    {
        // We can't inflate methods belonging to vm-anonymous classes because
        // that kind of class can't be referred to by name, hence can't be
        // found from the generated bytecode.
        if (++numInvocations > ReflectionFactory.inflationThreshold()
                && !ReflectUtil.isVMAnonymousClass(method.getDeclaringClass())) {
            MethodAccessorImpl acc = (MethodAccessorImpl)
                new MethodAccessorGenerator().
                    generateMethod(method.getDeclaringClass(),
                                   method.getName(),
                                   method.getParameterTypes(),
                                   method.getReturnType(),
                                   method.getExceptionTypes(),
                                   method.getModifiers());
            parent.setDelegate(acc);
        }

        return invoke0(method, obj, args);
    }

    void setParent(DelegatingMethodAccessorImpl parent) {
        this.parent = parent;
    }

    private static native Object invoke0(Method m, Object obj, Object[] args);
}
```

每次NativeMethodAccessorImpl.invoke()方法被调用时，程序调用计数器都会增加1，看看是否超过阈值；一旦超过，则调用MethodAccessorGenerator.generateMethod()来生成Java版的MethodAccessor的实现类，并且改变DelegatingMethodAccessorImpl所引用的MethodAccessor为Java版。后续经由DelegatingMethodAccessorImpl.invoke()调用到的就是Java版的实现了。
到这里，我们已经追寻到native版的invoke方法在Java一侧声明的最底层 - invoke0了，下面我们将深入到HotSpot JVM中去研究其具体实现。

####  寻根溯源 - 在JVM层面探究invoke0方法

invoke0方法是一个native方法,它在HotSpot JVM里调用JVM_InvokeMethod函数:

```c
JNIEXPORT jobject JNICALL Java_sun_reflect_NativeMethodAccessorImpl_invoke0
(JNIEnv *env, jclass unused, jobject m, jobject obj, jobjectArray args)
{
    return JVM_InvokeMethod(env, m, obj, args);
}
```

* openjdk/hotspot/src/share/vm/prims/jvm.cpp

```c
JVM_ENTRY(jobject, JVM_InvokeMethod(JNIEnv *env, jobject method, jobject obj, jobjectArray args0))
  JVMWrapper("JVM_InvokeMethod");
  Handle method_handle;
  if (thread->stack_available((address) &method_handle) >= JVMInvokeMethodSlack) {
    method_handle = Handle(THREAD, JNIHandles::resolve(method));
    Handle receiver(THREAD, JNIHandles::resolve(obj));
    objArrayHandle args(THREAD, objArrayOop(JNIHandles::resolve(args0)));
    oop result = Reflection::invoke_method(method_handle(), receiver, args, CHECK_NULL);
    jobject res = JNIHandles::make_local(env, result);
    if (JvmtiExport::should_post_vm_object_alloc()) {
      oop ret_type = java_lang_reflect_Method::return_type(method_handle());
      assert(ret_type != NULL, "sanity check: ret_type oop must not be NULL!");
      if (java_lang_Class::is_primitive(ret_type)) {
        // Only for primitive type vm allocates memory for java object.
        // See box() method.
        JvmtiExport::post_vm_object_alloc(JavaThread::current(), result);
      }
    }
    return res;
  } else {
    THROW_0(vmSymbols::java_lang_StackOverflowError());
  }
JVM_END
```

其关键部分为Reflection::invoke_method:

* openjdk/hotspot/src/share/vm/runtime/reflection.cpp

```c
oop Reflection::invoke_method(oop method_mirror, Handle receiver, objArrayHandle args, TRAPS) {
  oop mirror             = java_lang_reflect_Method::clazz(method_mirror);
  int slot               = java_lang_reflect_Method::slot(method_mirror);
  bool override          = java_lang_reflect_Method::override(method_mirror) != 0;
  objArrayHandle ptypes(THREAD, objArrayOop(java_lang_reflect_Method::parameter_types(method_mirror)));

  oop return_type_mirror = java_lang_reflect_Method::return_type(method_mirror);
  BasicType rtype;
  if (java_lang_Class::is_primitive(return_type_mirror)) {
    rtype = basic_type_mirror_to_basic_type(return_type_mirror, CHECK_NULL);
  } else {
    rtype = T_OBJECT;
  }

  instanceKlassHandle klass(THREAD, java_lang_Class::as_Klass(mirror));
  Method* m = klass->method_with_idnum(slot);
  if (m == NULL) {
    THROW_MSG_0(vmSymbols::java_lang_InternalError(), "invoke");
  }
  methodHandle method(THREAD, m);

  return invoke(klass, method, receiver, override, ptypes, rtype, args, true, THREAD);
}
```

这里面又会涉及到Java的对象模型(klass和oop)，以后继续补充。笑容逐渐消失。

#### 寻根溯源 - Java版的实现

Java版MethodAccessor的生成使用MethodAccessorGenerator实现，由于代码太长，这里就不贴代码了，只贴一下开头的注释：

```c
/** Generator for sun.reflect.MethodAccessor and
    sun.reflect.ConstructorAccessor objects using bytecodes to
    implement reflection. A java.lang.reflect.Method or
    java.lang.reflect.Constructor object can delegate its invoke or
    newInstance method to an accessor using native code or to one
    generated by this class. (Methods and Constructors were merged
    together in this class to ensure maximum code sharing.) */
```

这里又运用了asm动态生成字节码技术（sun.reflect.ClassFileAssembler)。

## 5. 小结

大致流程如下：

* 1.建立 Map<url,comtroller> 的关系
* 2.根据 url 找到具体的处理方法
* 3.通过反射调用 controller 中的方法
* 4.通过`注解`或`参数名称`实现参数绑定

## 参考

`https://www.cnblogs.com/heavenyes/p/3905844.html#t1`

`sczyh30: http://www.sczyh30.com/posts/Java/java-reflection-2/`　

