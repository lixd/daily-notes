# Spring

## 1.Spring IOC

### 导包

```java
//日志记录 
--logging
--log4j
//Spring 4个核心包
--beans 
--context 
--core 
--expression
//aop包
--aop
```

### 配置文件

src下创建 applicationContext.xml

### 引入约束

```xml
官方文档-->spring-framework-4.2.4.RELEASE\docs\spring-framework-reference\html\xsd-configuration.html
<!---------------------1.引入约束---------------- -->
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:context="http://www.springframework.org/schema/context" xsi:schemaLocation="
        http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/context http://www.springframework.org/schema/context/spring-context.xsd"> <!-- bean definitions here -->
    <!---------------------2.配置组件扫描---------------- -->
    <!-- IOC 配置组件扫描(哪些包下的类要使用IOC注解) -->
<context:component-scan base-package="Demo"></context:component-scan>
</beans>
```

### 在类中添加注解

```java
@Component("userDao") //相当于  <bean id="userDao" class="Demo.UserDaoImpl">
public class UserDaoImpl implements UserDao {
    //...省略
}
```

### 注解方式为属性设置值

可以没有set方法

配置注解后，Spring 将直接采用Java反射机制对两个私有成员变量进行自动注入。所以对成员变量使用`@Autowired`后，不需要get set方法.

如果类中有set方法,需要将注解添加在set方法上

如果没有set方法,则添加在属性上.

```java
	@Value("myname")
	private String name; 
	@Value("myaddress")
	private String address; 	
```

## 2.常用注解

### @component:组件

修饰一个类,将这个类交给Spring管理

三个衍生注解

**`@Controller` :web层**

**`@Service` :service层**

**`@Repository` :dao层**

### 属性注入的注解

**`@Value` 普通属性**

`@Autowired` 对象属性 按照`类型`注入 和名称无关,但是习惯是按`名称`注入,必须和`@Qualifier`一起使用来完成按名称注入

```java
@Autowired
@Qualifier(value="UserDao") //value值为要注入对象的名称
```

**`@Resource` 完成对象类型的按名称注入(常用)**

```java
@Resource(name="UserDao")
```

### Bean的其他注解

* Bean的生命周期

`@PostConstruct` x相当于init-method

`@PreDestory` 相当于destory-method

* Bean的作用范围

`@Scope`

*  **singleton**          **：默认的，Spring会采用单例模式创建这个对象**

- **prototype**        **：多例模式**
- request              ：应用在web项目中，Spring创建这个类以后，将这个类存入到request范围中。
- session               ：应用在web项目中，Spring创建这个类以后，将这个类存入到session范围中。
- globalsession    ：应用在web项目中，必须在porlet环境下使用。但是如果没有这种环境，相对于session。

### XML和注解整合

* 适用场景
  * XML 可以适用于任何场景 **结构清晰,维护方便**
  * 注解 :类不是自己提供的就用不了 **开发方便**

​	XML管理Bean,注解完成属性注入

```java
//    <!-- IOC 配置组件扫描(哪些包下的类要使用IOC注解) -->
//<!--<context:component-scan base-package="Demo"></context:component-scan>-->
//整合开发不需要配置扫描了 扫描是扫描类上的注解

//在没有扫描的情况下.使用属性注解 @Resource @Value @AutoWired @Qualifier
<context:annotation-config/>
```

## 3.Spring AOP

AOP(Aspect Oriented Programming ) 面向切面编程,AOP是OOP的延伸,解决OOP开发遇到的问题.

AOP采用`横向抽取-->代理机制`取代了传统的`纵向继承`

### Spring底层的AOP原理

**动态代理**

`JDK动态代理` -->缺点 只能对实现了接口的类产生代理

`Cglib动态代理`(第三方代理技术) --->没有实现接口的类也可以产生代理,生成子类对象

Spring基本包中已经包含了Cglib.不用引入额外的包了.

### Spring的AOP开发

#### AOP相关术语

`Joinpoint`--> 连接点,可以被拦截到的点(可以被拦截到,被增强的方法就可以称为连接点)

`Pointcut`-->切入点 真正被拦截到的点(实际开发中,真正被增强的方法就可以称为切入点)

`Advice-->通知,增强 **方法层面的增强**

**前置通知:**一般在**方法执行前**进行操作.(如:权限校验)

**后置通知:**一般在**方法执行后**进行操作.(如:日志记录)

**环绕通知:**一般在**方法执行前后**都进行操作.

`Introduction`-->引介 也是增强 **类层面的增强**  给类添加方法之类的

`Target` -->被增强的对象,目标 一般是被增强类的实例对象,称为目标

`Weaving `-->织入,将通知`Advice`应用到目标`Target`的过程

`Proxy`-->代理对象 被增强后的对象

**`Aspect`-->切面,多个通知和多个切入点的组合**

### 基于AspectJ的XML方式AOP开发

1.导包

```java
//日志记录 
--logging
--log4j
//Spring 4个核心包
--beans 
--context 
--core 
--expression
//aop包
--aop
```



