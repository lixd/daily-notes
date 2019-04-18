# Spring总结

## 1. 概述

Spring 是一个开源容器框架，可以接管 web 层，业务层，dao 层，持久层的组件，并且可以配置各种bean,和维护 bean 与 bean 之间的关系。其核心就是控制反转(IOC),和面向切面(AOP),简单的说就是一个分层的轻量级开源框架。 

## 2. Spring 中的 IoC

* IoC：(Inverse of Control )控制反转，容器主动将资源推送给它所管理的组件，组件所做的是选择一种合理的方式接受资源。

  简单的理解：把创建对象和维护之间的关系的权利由程序中转移到Spring容器的配置文件中。

* DI : (Dependency Injection) 依赖注入，IoC 的另一种表现方式，组件以一种预先定义好的方式来接受容器注入的资源。

## 3. Spring 简单使用
这里先演示用xml配置文件的。
### 1. 准备 bean 对象
先准备两个简单的实体类 Student 和 Book，需要提供Getter/Setter 和有参数无参构造方法等。
Spring Bean是事物处理组件类和实体类（POJO）对象的总称，Spring Bean被Spring IOC容器初始化，装配和管理。
```java
/**
 * @author illusory
 * @version 1.0.0
 * @date 2019/4/18 0018
 */
public class Student {
    private String name;
    private int age;
    private Book book;
    //省略Getter/Setter和构造方法
}

/**
 * @author illusory
 * @version 1.0.0
 * @date 2019/4/18
 */
public class Book {
    private String type;
    private String name;
   //省略Getter/Setter和构造方法
}

```

### Spring Bean类的配置项

Spring IOC容器管理Bean时，需要了解Bean的类名、名称、依赖项、属性、生命周期及作用域等信息。为此，Spring IOC提供了一系列配置项，用于Bean在IOC容器中的定义。

① class

该配置项是强制项，用于指定创建Bean实例的Bean类的路径。

② name

该配置项是强制项，用于指定Bean唯一的标识符，在基于 XML 的配置项中，可以使用 id和或 name 属性来指定 Bean唯一 标识符。

③ scope

该配置项是可选项，用于设定创建Bean对象的作用域。

④ constructor-arg

该配置项是可选项，用于指定通过构造函数注入依赖数据到Bean。

⑤ properties

该配置项是可选项，用于指定通过set方法注入依赖数据到Bean。

⑥ autowiring mode

该配置项是可选项，用于指定通过自动依赖方法注入依赖数据到Bean。

⑦ lazy-initialization mode

该配置项是可选项，用于指定IOC容器延迟创建Bean，在用户请求时创建Bean，而不要在启动时就创建Bean。

⑧ initialization

该配置项是可选项，用于指定IOC容器完成Bean必要的创建后，调用Bean类提供的回调方法对Bean实例进一步处理。

⑨ destruction

该配置项是可选项，用于指定IOC容器在销毁Bean时，调用Bean类提供的回调方法。

### 将Bean类添加到Spring IOC容器

将Bean类添加到Spring IOC容器有三种方式。一种方式是基于XML的配置文件；一种方式是基于注解的配置；一种方式是基于Java的配置。
下面主要介绍基于XML的配置方式，基于注解和基于Java的配置放在后面进行讨论，放在后面讨论的原因是一些其它重要的Spring概念还需要掌握。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">
    <!-- bean的配置文件 -->
    <bean id="student" class="spring.Student">
        <property name="name" value="illusory"></property>
        <property name="age" value="23"></property>
        <property name="book" ref="book"></property>
    </bean>
    <bean id="book" class="spring.Book">
        <property name="name" value="think in java"></property>
        <property name="type" value="CS"></property>
    </bean>
</beans>
```
### 3. 测试
```java
/**
 * @author illusory
 * @version 1.0.0
 * @date 2019/4/18
 */
public class SpringTest {
    public static void main(String[] args) {
        // 根据配置文件创建 IoC 容器
        ApplicationContext ac = new ClassPathXmlApplicationContext("applicationContext.xml");
        // 从容器中获取 bean 实例 这里的名称就是配置文件中的id="student"
        Student student = (Student) ac.getBean("student");
        // 使用bean
        System.out.println(student.getName());
        //成功打印出 illusory
    }
}
```

### 简单分析
```java
ApplicationContext ac = new ClassPathXmlApplicationContext("applicationContext .xml")
```
执行这句代码时Spring容器对象被创建，同时applicationContext .xml中的bean就会被创建到内存中。

### Bean注入
Bean注入的方式有两种，一种是在XML中配置，此时分别有属性注入、构造函数注入和工厂方法注入；另一种则是使用注解的方式注入 @Autowired,@Resource,@Required。
#### 在xml文件中配置依赖注入
##### 属性注入
属性注入即通过setXxx()方法注入Bean的属性值或依赖对象，由于属性注入方式具有可选择性和灵活性高的优点，因此属性注入是实际应用中最常采用的注入方式。

属性注入要求Bean提供一个默认的构造函数，并为需要注入的属性提供对应的Setter方法。Spring先调用Bean的默认构造函数实例化Bean对象，然后通过反射的方式调用Setter方法注入属性值。
```xml
<bean id="book" class="spring.Book">
        <property name="name" value="think in java"></property>
        <property name="type" value="CS"></property>
    </bean>
```
例子中的这个就是属性注入。

##### 构造方法注入
使用构造函数注入的前提是Bean必须提供带参数的构造函数。

```xml
    <bean id="book" class="spring.Book">
        <constructor-arg name="name" value="think in java"></constructor-arg>
        <constructor-arg name="type" value="CS"></constructor-arg>
    </bean>
```
##### 工厂方法注入

```java
/**
 * @author illusory
 * @version 1.0.0
 * @date 2019/4/18 0018
 */
public class BookFactory {
    //非静态方法
    public Book createBook() {
        Book book = new Book();
        book.setName("图解HTTP");
        book.setType("HTTP");
        return book;
    }

    //静态方法
    public static Book createBookStatic() {
        Book book = new Book();
        book.setName("大话数据结构");
        book.setType("数据结构");
        return book;
    }
}
```

非静态方法：必须实例化工厂类（factory-bean）后才能调用工厂方法
```xml
 <bean id="bookFactory" class="spring.BookFactory"></bean>
 <bean id="book" class="spring.Book" factory-bean="bookFactory" factory-method="createBook"></bean>
```
静态方法：不用实例化工厂类（factory-bean）后才能调用工厂方法
```xml
<bean id="book" class="spring.Book" factory-method="createBookStatic"></bean>
```
接着通过`Student student = (Student) ac.getBean("student");`从Spring容器中根据名字获取对应的bean。

## 小结
### 概述
大概就这几个步骤:
1.定义一个 bean 实体类或组件
2.配置 bean 
    * 基本配置 xml 配置文件中注册这个 bean
    * 属性注入 xml 配置文件中为这个 bean 注入属性 XML中配置:属性注入、构造方法注入、工厂方法注入 注解方式: @Autowired,@Resource,@Required
3.根据 name(即配置文件中的 bean id) 从 Spring 容器中获取 bean 实例

### xml配置文件
#### 1. 定义一个 bean 实体类或组件
```java
public class Book {
    private String type;
    private String name;
   //省略Getter/Setter和构造方法
}
```
#### 2. 配置 bean 
基本配置
```xml
    <bean id="book" class="spring.Book">
    </bean>
```
属性注入
```xml
    <bean id="book" class="spring.Book">
        <property name="name" value="think in java"></property>
        <property name="type" value="CS"></property>
    </bean>
```
#### 获取 bean

```java
 // 根据配置文件创建 IoC 容器
        ApplicationContext ac = new ClassPathXmlApplicationContext("applicationContext.xml");
        // 从容器中获取 bean 实例
        Student student = (Student) ac.getBean("student");
```

### 注解
使用注解需要在xml配置文件中开启组件扫描
```xml
    <!--配置组件扫描-->
    <context:component-scan base-package="spring"/>
```
#### 1. 定义一个 bean 实体类或组件
```java
@Component(value = "book")
public class Book {
    private String type;
    private String name;
   //省略Getter/Setter和构造方法
}
```
#### 2. 配置 bean 
基本配置
```java
@Component(value = "book")
public class Book {
    private String type;
    private String name;
   //省略Getter/Setter和构造方法
}
```
其中`@Component(value = "book")`相当于`<bean id="book" class="spring.Book">`
**Bean实例的名称默认是Bean类的首字母小写，其他部分不变**
属性注入
普通类型注入:  @Value(value = "illusory")
引用类型注入:  @Autowired/@Resources(name="") 区别在后面有写
```java
@Component(value = "student")
public class Student {
    @Value(value = "illusory")
    private String name;
    @Value(value = "23")
    private int age;
    @Autowired
    private Book book;
}

@Component(value = "book")
public class Book {
    @Value(value = "defaultType")
    private String type;
    @Value(value = "defaultName")
    private String name;
}
```
### 获取 bean
```java
    public static void main(String[] args) {
        // 根据配置文件创建 IoC 容器
        ApplicationContext ac = new ClassPathXmlApplicationContext("applicationContext.xml");
        // 从容器中获取 bean 实例
        Student student = (Student) ac.getBean("student");
        // 使用bean
        System.out.println(student.getName());
        //成功打印出 illusory
    }
```
### Bean相关的注解
与SpringBean相关的注解有以下四大类：

@Controller：标注一个控制器组件类 Controller层
@Service：标注一个业务逻辑组件类 Service层
@Repository：标注一个DAO组件类 DAO层
@Component：标注一个普通的Spring Bean类 前面三个都不是但又想交给Spring管理就用这个

### @Autowired与@Resource
#### 相同点
@Resource的作用相当于@Autowired，均可标注在字段或属性的setter方法上。
#### 不同点
* 提供方 
@Autowired是Spring的注解，@Resource是javax.annotation注解，而是来自于JSR-250，J2EE提供，需要JDK1.6及以上。
* 注入方式 
@Autowired只按照Type 注入；@Resource默认按Name自动注入，也提供按照Type 注入；
* 属性
@Autowired注解可用于为类的属性、构造器、方法进行注值。默认情况下，其依赖的对象必须存在（bean可用），如果需要改变这种默认方式，可以设置其required属性为false。
@Autowired注解默认按照类型装配，如果容器中包含多个同一类型的Bean，那么启动容器时会报找不到指定类型bean的异常，解决办法是结合 **@Qualifier** 注解进行限定，指定注入的bean名称。
@Resource有两个中重要的属性：name和type。name属性指定byName，如果没有指定name属性，当注解标注在字段上，即默认取字段的名称作为bean名称寻找依赖对象，
当注解标注在属性的setter方法上，即默认取属性名作为bean名称寻找依赖对象。
@Resource如果没有指定name属性，并且按照默认的名称仍然找不到依赖对象时， @Resource注解会回退到按类型装配。但一旦指定了name属性，就只能按名称装配了。
* 其他
@Resource注解的使用性更为灵活，可指定名称，也可以指定类型；
@Autowired注解进行装配容易抛出异常，特别是装配的bean类型有多个的时候，而解决的办法是需要在增加 @Qualifier 进行限定。

## context:annotation-config与context:component-scan
### context:annotation-config
我们一般在含有Spring的项目中，可能会看到配置项中包含这个配置节点`<context:annotation-config>`，这是一条向Spring容器中注册

AutowiredAnnotationBeanPostProcessor

CommonAnnotationBeanPostProcessor

PersistenceAnnotationBeanPostProcessor

RequiredAnnotationBeanPostProcessor

这4个BeanPostProcessor.注册这4个BeanPostProcessor的作用，就是为了你的系统能够识别相应的注解。

那么那些注释依赖这些Bean呢。

如果想使用 @Resource 、@PostConstruct、@PreDestroy等注解就必须声明CommonAnnotationBeanPostProcessor。 
如果想使用 @PersistenceContext注解，就必须声明PersistenceAnnotationBeanPostProcessor的Bean。 
如果想使用 @Autowired注解，那么就必须事先在 Spring 容器中声明 AutowiredAnnotationBeanPostProcessor Bean。 
如果想使用 @Required的注解，就必须声明RequiredAnnotationBeanPostProcessor的Bean。

所以如果不加一句`context:annotation-config`那么上面的这些注解就无法识别,@Autowired自动注入失效。

### context:component-scan
context:component-scan包括了context:annotation-config的功能，即注册BeanPostProcessor使注解有效。
同时还会自动扫描所配置的包下的 bean。

所以一般写context:component-scan就行了。

### 例子
就拿前面的student和book举例
实体类这样写,使用注解进行属性注入
```java
public class Student {
    @Value(value = "illusory")
    private String name;
    @Value(value = "23")
    private int age;
    @Autowired
    private Book book;
}
public class Book {
    @Value(value = "defaultType")
    private String type;
    @Value(value = "defaultName")
    private String name;
}
```
配置文件就不用写各种`<property name="name" value="illusory"></property>`了
使用`@Autowired`后也不用` <property name="book" ref="book"></property>`了
```xml
  <bean id="student" class="spring.Student"></bean>
  <bean id="book" class="spring.Book"></bean>
   <context:annotation-config />
```
但是还是需要在xml配置bean的基本信息，即`<bean id="student" class="spring.Student"></bean>`
如果在实体类加上`@Component`注解
```java
@Component(value = "student")
public class Student {
    @Value(value = "illusory")
    private String name;
    @Value(value = "23")
    private int age;
    @Autowired
    private Book book;
}
```
就不用在xml中配置bean了,只需要在xml中配置`<context:component-scan base-package="spring"/>`
```xml
<context:component-scan base-package="spring"/>
```
这样xml中只要要一行就搞定了。
开启注解的同时还会自动扫描包下的bean。
### 其他注解
init-method destroy-method属性对应的注解
*  @PostConstruct注解，在对象创建后调用
*  @PreDestroy注解，在对象销毁前调用
```java
    @PostConstruct
    public void init() {
        System.out.println("init");
    }

    @PreDestroy
    public void destory() {
        System.out.println("destory");
    }
```

## BeanFactory与ApplicationConText区别
BeanFactroy采用的是延迟加载形式来注入Bean的，即只有在使用到某个Bean时(调用getBean())，才对该Bean进行加载实例化，这样，我们就不能发现一些存在的Spring的配置问题。
而ApplicationContext则相反，它是在容器启动时，一次性创建了所有的Bean。这样，在容器启动时，我们就可以发现Spring中存在的配置错误。 

BeanFactory和ApplicationContext都支持BeanPostProcessor、BeanFactoryPostProcessor的使用，
但两者之间的区别是：BeanFactory需要手动注册，而ApplicationContext则是自动注册

BeanFacotry是spring中比较原始的Factory。如XMLBeanFactory就是一种典型的BeanFactory。原始的BeanFactory无法支持spring的许多插件，如AOP功能、Web应用等。 
  ApplicationContext接口,它由BeanFactory接口派生而来，因而提供BeanFactory所有的功能。ApplicationContext以一种更向面向框架的方式工作以及对上下文进行分层和实现继承，ApplicationContext包还提供了以下的功能： 
  • MessageSource, 提供国际化的消息访问  
  • 资源访问，如URL和文件  
  • 事件传播  
  • 载入多个（有继承关系）上下文 ，使得每一个上下文都专注于一个特定的层次，比如应用的web层  
1.利用MessageSource进行国际化  
  BeanFactory是不支持国际化功能的，因为BeanFactory没有扩展Spring中MessageResource接口。相反，由于ApplicationContext扩展了MessageResource接口，因而具有消息处理的能力(i18N)，具体spring如何使用国际化，以后章节会详细描述。 

2.强大的事件机制(Event)  
  基本上牵涉到事件(Event)方面的设计，就离不开观察者模式。不明白观察者模式的朋友，最好上网了解下。因为，这种模式在java开发中是比较常用的，又是比较重要的。 
ApplicationContext的事件机制主要通过ApplicationEvent和ApplicationListener这两个接口来提供的，和java swing中的事件机制一样。即当ApplicationContext中发布一个事件的时，所有扩展了ApplicationListener的Bean都将会接受到这个事件，并进行相应的处理。 

Spring提供了部分内置事件，主要有以下几种：  
ContextRefreshedEvent ：ApplicationContext发送该事件时，表示该容器中所有的Bean都已经被装载完成，此ApplicationContext已就绪可用 
ContextStartedEvent：生命周期 beans的启动信号  
ContextStoppedEvent: 生命周期 beans的停止信号  
ContextClosedEvent：ApplicationContext关闭事件，则context不能刷新和重启，从而所有的singleton bean全部销毁(因为singleton bean是存在容器缓存中的) 

  虽然，spring提供了许多内置事件，但用户也可根据自己需要来扩展spriong中的事物。注意，要扩展的事件都要实现ApplicationEvent接口。  

3.底层资源的访问  
  ApplicationContext扩展了ResourceLoader(资源加载器)接口，从而可以用来加载多个Resource，而BeanFactory是没有扩展ResourceLoader 

4.对Web应用的支持  
  与BeanFactory通常以编程的方式被创建不同的是，ApplicationContext能以声明的方式创建，如使用ContextLoader。当然你也可以使用ApplicationContext的实现之一来以编程的方式创建ApplicationContext实例 。 
 
ContextLoader有两个实现：ContextLoaderListener和ContextLoaderServlet。它们两个有着同样的功能，除了listener不能在Servlet 2.2兼容的容器中使用。自从Servelt 2.4规范，listener被要求在web应用启动后初始化。很多2.3兼容的容器已经实现了这个特性。使用哪一个取决于你自己，但是如果所有的条件都一样，你大概会更喜欢ContextLoaderListener；关于兼容方面的更多信息可以参照ContextLoaderServlet的JavaDoc。

这个listener需要检查contextConfigLocation参数。如果不存在的话，它将默认使用/WEB-INF/applicationContext.xml。如果它存在，它就会用预先定义的分隔符（逗号，分号和空格）分开分割字符串，并将这些值作为应用上下文将要搜索的位置。ContextLoaderServlet可以用来替换ContextLoaderListener。这个servlet像listener那样使用contextConfigLocation参数。

## @Component和@Configuration作为配置类的差别
### 概述
@Component和@Configuration都可以作为配置类,但还是有一定差别的。
```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component  //看这里！！！
public @interface Configuration {
    String value() default "";
```

```java
Spring 中新的 Java 配置支持的核心就是@Configuration 注解的类。这些类主要包括 @Bean 注解的方法来为 Spring 的 IoC 容器管理的对象定义实例，配置和初始化逻辑。

使用@Configuration 来注解类表示类可以被 Spring 的 IoC 容器所使用，作为 bean 定义的资源。

@Configuration
public class AppConfig {
    @Bean
    public MyService myService() {
        return new MyServiceImpl();
    }
}
```
这和 Spring 的 XML 文件中的非常类似
```xml
<beans>
    <bean id="myService" class="com.acme.services.MyServiceImpl"/>
</beans>
```
### 举例说明@Component 和 @Configuration

```java
@Configuration
public static class Config {

    @Bean
    public SimpleBean simpleBean() {
        return new SimpleBean();
    }

    @Bean
    public SimpleBeanConsumer simpleBeanConsumer() {
        return new SimpleBeanConsumer(simpleBean());
    }
}

@Component
public static class Config {

    @Bean
    public SimpleBean simpleBean() {
        return new SimpleBean();
    }

    @Bean
    public SimpleBeanConsumer simpleBeanConsumer() {
        return new SimpleBeanConsumer(simpleBean());
    }
}
```
第一个代码正常工作，正如预期的那样，SimpleBeanConsumer将会得到一个单例SimpleBean的链接。
第二个配置是完全错误的，因为Spring会创建一个SimpleBean的单例bean，但是SimpleBeanConsumer将获得另一个SimpleBean实例（也就是相当于直接调用new SimpleBean() ，
这个bean是不归Spring管理的），既new SimpleBean() 实例是Spring上下文控件之外的。
### 原因总结
使用@ configuration，所有标记为@ bean的方法将被包装成一个CGLIB包装器，它的工作方式就好像是这个方法的第一个调用，那么原始方法的主体将被执行，
最终的对象将在spring上下文中注册。所有进一步的调用只返回从上下文检索的bean。
## Spring AOP动态代理支持的核心
jdk动态代理：`java.lang.reflect.InvocationHandler`
对应的方法拦截器：
```java
public Object invoke(Object proxy, Method method, Object[] args)
        throws Throwable;
```
调用时使用method.invoke(Object, args)

该动态代理是基于接口的动态代理，所以并没有一个原始方法的调用过程，整个方法都是被拦截的。

通过cglib动态创建类进行动态代理。org.springframework.cglib.proxy包下的原生接口，同net.sf.cglib.proxy包下的接口，都是源自cglib库。Spring内部的cglib动态代理使用了这种方式。
对应的方法拦截器:

`org.springframework.cglib.proxy.Callback`、 `org.springframework.cglib.proxy.MethodInterceptor`

```java
public interface MethodInterceptor extends Callback {
    Object intercept(Object obj, Method m, Object[] args, MethodProxy mp) throws Throwable
}
```
调用时，使用mp.invoke(Object obj, Object[] args)调用其他同类对象的原方法或者mp.invokeSuper(Object obj, Object[] args)调用原始(父类)方法。

org.aopalliance的拦截体系
该包是AOP组织下的公用包，用于AOP中方法增强和调用。相当于一个jsr标准，只有接口和异常。在AspectJ、Spring等AOP框架中使用。

对应的方法拦截器`org.aopalliance.intercept.MethodInterceptor`

```java
public interface MethodInterceptor extends Interceptor {
    Object invoke(MethodInvocation inv) throws Throwable;
}
```
调用时使用inv.proceed()调用原始方法。


说起AOP就不得不说下OOP了，OOP中引入封装、继承和多态性等概念来建立一种对象层次结构，用以模拟公共行为的一个集合。但是，如果我们需要为部分对象引入公共部分
的时候，OOP就会引入大量重复的代码。例如：日志功能。
AOP技术利用一种称为“横切”的技术，解剖封装的对象内部，并将那些影响了多个类的公共行为封装到一个可重用模块，这样就能减少系统的重复代码，
降低模块间的耦合度，并有利于未来的可操作性和可维护性。AOP把软件系统分为两个部分：核心关注点和横切关注点。业务处理的主要流程是核心关注点，
与之关系不大的部分是横切关注点。横切关注点的一个特点是，他们经常发生在核心关注点的多处，而各处都基本相似。比如权限认证、日志、事务处理。

AOP（Aspect Orient Programming），作为面向对象编程的一种补充，广泛应用于处理一些具有横切性质的系统级服务，如事务管理、安全检查、缓存、对象池管理等。
AOP 实现的关键就在于 AOP 框架自动创建的 AOP 代理，AOP 代理则可分为静态代理和动态代理两大类，其中静态代理是指使用 AOP 框架提供的命令进行编译，
从而在编译阶段就可生成 AOP 代理类，因此也称为编译时增强；而动态代理则在运行时借助于 JDK 动态代理、CGLIB 等在内存中“临时”生成 AOP 动态代理类，
因此也被称为运行时增强
## 参考
`阿飞云的技术乐园: https://blog.csdn.net/u010648555/article/details/76299467 `
`https://www.cnblogs.com/_popc/p/3972212.html`
`https://www.cnblogs.com/wnlja/p/3907836.html`