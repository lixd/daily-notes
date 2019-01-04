# SpringBoot

## 1.SpringMVC注解回顾

**@Controller和@RestController**

`@Controller`用于标记在一个类上，使用它标记的类就是一个SpringMVC Controller 对象。

使用@Controller 注解，在对应的方法上，视图解析器可以解析return 的jsp,html页面，并且跳转到相应页面

若返回json等内容到页面，则需要加@ResponseBody注解

`@RestController` 注解相当于@ResponseBody ＋ @Controller合在一起的作用。

返回json数据不需要在方法前面加@ResponseBody注解了，但使用@RestController这个注解，就不能返回jsp,html页面，视图解析器无法解析jsp,html页面



**@RequestMapping 和 @GetMapping @PostMapping 区别**

RequestMapping是一个用来处理请求地址映射的注解，可用于类或方法上。参数如下：

**1、 value， method；**

value：     指定请求的实际地址，指定的地址可以是URI Template 模式（后面将会说明）；

method：  指定请求的method类型， GET、POST、PUT、DELETE等；

**2、consumes，produces**

consumes： 指定处理请求的提交内容类型（Content-Type），例如application/json, text/html;

produces:    指定返回的内容类型，仅当request请求头中的(Accept)类型中包含该指定类型才返回；

**3、params，headers**

params： 指定request中必须包含某些参数值是，才让该方法处理。

headers： 指定request中必须包含某些指定的header值，才能让该方法处理请求。



@GetMapping是一个组合注解，是@RequestMapping(method = RequestMethod.GET)的缩写。

 @PostMapping是一个组合注解，是@RequestMapping(method = RequestMethod.POST)的缩写。



**@Resource和@Autowired**

@Resource和@Autowired都是做bean的注入时使用，其实@Resource并不是Spring的注解，它的包是javax.annotation.Resource，需要导入，但是Spring支持该注解的注入。

@Autowired注解是按照类型（byType）装配依赖对象，默认情况下它要求依赖对象必须存在，如果允许null值，可以设置它的required属性为false。如果我们想使用按照名称（byName）来装配，可以结合@Qualifier注解一起使用

```
    @Autowired
    @Qualifier("userDao")
    private UserDao userDao;
```

**@ModelAttribute和 @SessionAttributes**

该Controller的所有方法在调用前，先执行此@ModelAttribute方法，可用于注解和方法参数中，可以把这个@ModelAttribute特性，应用在BaseController当中，所有的Controller继承BaseController，即可实现在调用Controller时，先执行@ModelAttribute方法。

 @SessionAttributes即将值放到session作用域中，写在class上面。

**@Repository**

用于注解dao层，在daoImpl类上面注解。



## 2. SpringBoot

@SpringBootApplication 

SpringBoot启动类注解

### 2.1 hello

```java
@Controller
public class HelloController {
    @RequestMapping("/gethello")
    @ResponseBody
    public Map<String, Object> getHello() {
        Map<String, Object> map = new HashMap<>();
        map.put("msg", "hello");
        return map;
    }
}
```



## 3. 整合Servlet

### 3.1 方式一 扫描注解注册Servlet

```java
@WebServlet(name = "FirstServlet",urlPatterns = "/first")
public class FirstServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        super.doGet(req, resp);
    }
}
```

**@WebServlet(name = "FirstServlet",urlPatterns = "/first") 相当于web.xml中的以下配置**

```xml
<servlet>
      <servlet-name>FirstServlet</servlet-name>
      <servlet-class>com.demo.FirstServlet</servlet-class>
  </servlet>
  <servlet-mapping>
      <servlet-name>FirstServlet</servlet-name>
      <url-pattern>/firse</url-pattern>
  </servlet-mapping>
```

**@ServletComponentScan  让SpringBoot在启动时扫描@WebServlet注解**

```Java
@SpringBootApplication
@ServletComponentScan
public class HelloApplication {

    public static void main(String[] args) {
        SpringApplication.run(HelloApplication.class, args);
    }

}
```

### 3.2 方式二 通过方法注册Servlet

该方式 创建servlet后不用任何注解，直接在启动器中注册servlet

```java
@SpringBootApplication
public class app {
    public static void main(String[] args) {
        SpringApplication.run(app.class, args);
    }
    
    @Bean
    public ServletRegistrationBean Register(){
        ServletRegistrationBean bean=new ServletRegistrationBean(new FirstServlet());
        bean.addUrlMappings("/first");
        return bean;
    }
}
```

## 4. 整合Filter

### 4.1 方式一 扫描注解注册Filter

```
@WebFilter(filterName = "firstFilter",urlPatterns ="/first")
public class FirstFilter implements Filter {
    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        System.out.println("进入Filter");
        filterChain.doFilter(servletRequest,servletResponse);
        System.out.println("放行Filter");
    }
}
```

**@WebFilter(filterName = "firstFilter",urlPatterns ="/first")**

### 4.2 方式二 通过方法注册Servlet

```
@Bean
public FilterRegistrationBean RegisterFilter() {
    FilterRegistrationBean bean = new FilterRegistrationBean<>(new FirstFilter());
    bean.addUrlPatterns("/first");
    return bean;
}
```



## 5. 整合Listener

### 5.1 方式一 扫描注解注册Listener

```java
@WebListener
public class FirstListener implements ServletContextListener {
    @Override
    public void contextInitialized(ServletContextEvent sce) {
        
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        
    }
}
```

**@WebListener**

### 5.2 方式二 通过方法注册Listener

```java
@Bean
public ServletListenerRegistrationBean<FirstListener> registerListener() {
    ServletListenerRegistrationBean<FirstListener> bean = new 		             ServletListenerRegistrationBean<>(new FirstListener());
    return bean;
}
```

### 6. 访问静态资源

**从classpath/static目录下（名称必须是static）**



ServletContext根目录下

**src/main/webapp(名称必须是webapp)**

