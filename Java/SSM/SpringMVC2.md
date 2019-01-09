# SpringMVC2

## 1.@RequestMapping注解的使用

```java
@Controller
@RequestMapping("springmvc")//写在类上 用于增加目录 spring/hello spring/hello2才能访问到
public class HelloControll { 
	@RequestMapping(value= {"hello","hello2"},method=RequestMethod.POST)//可以是多个值 多个路径都可以访问   method用于限定支持的方法 默认支持所有 当前为只支持POST方法
public ModelAndView hello() {
	System.out.println("hello spring mcv");
	
	ModelAndView mav=new ModelAndView();
	mav.addObject("msg","hello spring mvc");
	mav.setViewName("WEB-INF/jsp/hello.jsp");
	return mav;
}
}
```

## 2.Springmvc中异常处理

```java
//1.创建异常消息类
public class MyExceptions extends Exception{
	private String msg;

	public String getMsg() {
		return msg;
	}

	public void setMsg(String msg) {
		this.msg = msg;
	}
	
}
//2.创建全局异常处理器
public class MyException implements HandlerExceptionResolver {

	@Override
	public ModelAndView resolveException(HttpServletRequest request, HttpServletResponse response, Object hanlder,
			Exception e) {
	String result = "系统发生异常了，请联系管理员！";
		//自定义异常处理
		if(ex instanceof MyExceptions){
			result = ((MyExceptions)ex).getMsg();
		}
		ModelAndView mav = new ModelAndView();
		mav.addObject("msg", result);
		mav.setViewName("msg");
		return mav;
	}
}

// 3. 配置全局异常处理器  springmvc.xml
<bean class="com.lillusory.demo.MyException"/>
```

## 3.Springmvc实现Restful

```java

	//RESTful风格url上的参数通过{}点位符绑定
	//点位符参数名与方法参数名不一致时，通过@PathVariable绑定
	@RequestMapping("/item/{id}")
	public String testRest(@PathVariable("id") Integer ids, Model model) {
		Item item = itemServices.getItemById(ids);
		model.addAttribute("item", item);
		return "itemEdit";
	}
```

## 4.拦截器

### 4.1创建拦截器

```java
/**
 * 自定义拦截器
 */
public class MyInterceptor1 implements HandlerInterceptor {

	//在Controller方法执行后被执行
	//处理异常、记录日志
	@Override
	public void afterCompletion(HttpServletRequest arg0, HttpServletResponse arg1, Object arg2, Exception arg3)
			throws Exception {
		System.out.println("MyInterceptor1.afterCompletion.....");
	}

	//在Controller方法执行后，返回ModelAndView之前被执行
	//设置或者清理页面共用参数等等
	@Override
	public void postHandle(HttpServletRequest arg0, HttpServletResponse arg1, Object arg2, ModelAndView arg3)
			throws Exception {
		System.out.println("MyInterceptor1.postHandle.....");
	}

	//在Controller方法执行前被执行
	//登录拦截、权限认证等等
	@Override
	public boolean preHandle(HttpServletRequest arg0, HttpServletResponse arg1, Object arg2) throws Exception {
		
		System.out.println("MyInterceptor1.preHandle.....");
		
		//返回true放行，false拦截
		return true;
	}

}

```

### 4.2配置拦截器

```xml
<!-- 拦截器定义 -->
	<mvc:interceptors>
		<!-- 定义一个拦截器 -->
		<mvc:interceptor>
		<!-- path配置</**>拦截所有请求，包括二级以上目录，</*>拦截所有请求，不包括二级以上目录 -->
			<mvc:mapping path="/**"/>
			<bean class="com.lillusory.demo.interceptor.MyInterceptor1" />
		</mvc:interceptor>
		
		<!-- 定义一个拦截器 -->
		<mvc:interceptor>
		<!-- path配置</**>拦截所有请求，包括二级以上目录，</*>拦截所有请求，不包括二级以上目录 -->
			<mvc:mapping path="/**"/>
			<bean class="com.lillusory.demo.interceptor.MyInterceptor2" />
		</mvc:interceptor>
	</mvc:interceptors>
```

### 4.3 执行顺序

* 单个拦截器中
  * `preHandle` 在Controller方法执行前执行  返回true则放行,继续执行后面的方法,返回false则拦截
  * `postHandle` 在Controller方法执行后,返回ModelAndView之前被执行 
  * `afterCompletion` 在Controller方法执行后执行 最后执行
* 多个拦截器
  * 按照配置顺序执行 配置在前的先执行
  * 若都放行 不进行拦截

```java
// 1.先按配置文件中的先后顺序执行所有的拦截器的preHandle 方法
// 2.若未拦截则会执行后续两个方法,然后后续两个方法都是由后往前执行的
preHandle 1--> preHandle 2 -->postHandle 2-->postHandle 1-->afterCompletion 2-->afterCompletion 1
```

