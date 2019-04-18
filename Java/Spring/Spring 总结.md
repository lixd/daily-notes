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
## 参考
`阿飞云的技术乐园: https://blog.csdn.net/u010648555/article/details/76299467 `
`https://www.cnblogs.com/_popc/p/3972212.html`