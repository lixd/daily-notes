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

## 2.Spring AOP



