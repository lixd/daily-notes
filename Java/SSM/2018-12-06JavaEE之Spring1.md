# JavaEE之Spring

## 1.IOC&DI

 **IOC:** Inversion of Control(控制反转)。 

控制反转：将对象的创建权反转给（交给）Spring。

对象的获取方式被反转了.

以前是我们自己创建对象,现在是通过xml文件配置,将所有的对象交给容器,让Spring容器来帮我们创建对象.

配置了id,和全限定类名,Spring容器就可以通过反射创建对象了,对象的创建和管理都交给Spring容器,我们只要在需要的时候提供一个ID即可获取对象.

**Spring所倡导的开发方式**就是如此，**所有的类都会在spring容器中登记，告诉spring你是个什么东西，你需要什么东西，然后spring会在系统运行到适当的时候，把你要的东西主动给你，同时也把你交给其他需要你的东西。所有的类的创建、销毁都由 spring来控制，也就是说控制对象生存周期的不再是引用它的对象，而是spring。对于某个具体的对象而言，以前是它控制其他对象，现在是所有对象都被spring控制，所以这叫控制反转。** 

```java
-------测试方法----------------------
	@Test
	public void SpringTest() {
		// 创建Spring工厂
		ApplicationContext applicationContext=
				new ClassPathXmlApplicationContext("applicationContext.xml");
    //方法中的名字为配置文件名字 可以不是这个 统一就行 
		// 获取对象
		UserDao userDao = (UserDao) applicationContext.getBean("userDao");
		userDao.save();
	}
---------------配置文件applicationContext.xml-------------
    --bean 其中id是自己设置的 方便后面使用, class就是全限定类
    --property name就是属性名 必须相同 value即想注入的值
   <bean id="userDao" class="Demo.UserDaoImpl">
 	 <property name="name" value="Spring"></property>
   </bean>
--------------对象--------------   
public class UserDaoImpl implements UserDao {
	private String name; //等会需要注入的属性
	public String getName() {//通过set方法注入
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public void save() {
		// TODO Auto-generated method stub
		System.out.println("save 方法执行了,name-->"+name);
	}
}
//输出
save 方法执行了,name-->Spring

通过反射+配置文件+工厂模式实现
根据ID在配置文件中找到类 通过反射生成类的实例
```

Spring的xml配置文件就相当于是一个容器，它托管着整个程序中的Class类实例，通过在xml文件中定义一个bean，（上文xml代码所示）bean标签指定一个Class类，然后在bean节点中的property标签指定Class类定义的接口类型的属性，通过property标签的ref属性指定一个bean标签的id，注入一个实例给Class类中的属性。

**DI**

**DI—Dependency Injection，即“依赖注入”,必须要有IOC的环境,Spring管理这个类的时候,会将类的依赖属性注入(设置)进来**  

**组件之间依赖关系**由容器在运行期决定，形象的说，即**由容器动态的将某个依赖关系注入到组件之中**。**依赖注入的目的并非为软件系统带来更多功能，而是为了提升组件重用的频率，并为系统搭建一个灵活、可扩展的平台。**通过依赖注入机制，我们只需要通过简单的配置，而无需任何代码就可指定目标需要的资源，完成自身的业务逻辑，而不需要关心具体的资源来自何处，由谁实现。 

## 2.框架搭建

### 2.1导包

```java
//日志记录 
--logging
--log4j
//Spring 4个核心包
--beans 
--context 
--core 
--expression
```

### 2.2 applicationContext.xml配置文件

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="
        http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">

      <bean id="userDao" class="Demo.UserDaoImpl">
   		<property name="name" value="Spring"></property>
   </bean> 

</beans>
```

## 3 Spring的工厂类

 BeanFactory：调用getBean的时候，才会生成类的实例。

ApplicationContext：加载配置文件的时候，就会将Spring管理的类都实例化

ApplicationContext的两个实现类

**ClassPathXmlApplicationContext：**加载类路径下的配置文件

**FileSystemXmlApplicationContext：**加载文件系统下的配置文件

## 4.Spring配置

```java
Windows-->preference-->XMl Catalog-->add
key-->http://www.springframework.org/schema/beans/spring-beans.xsd
Location-->选择路径找到spring-beans.xsd
key type-->选择Schema location
```

#### 4.1bean标签的配置

**id:**使用了约束中的唯一约束。里面不能出现特殊字符的。

**name:** :没有使用约束中的唯一约束（理论上可以出现重复的，但是实际开发不能出现的）。里面可以出现特殊字符。

 **class:**要生成的对象的全限定类名

生命周期:

**init-method:**Bean被初始化的时候执行的方法

**destroy-method:** Bean被销毁的时候执行的方法（Bean是单例创建，工厂关闭）

#### 4.2Bean的作用范围配置

 scope                            ：Bean的作用范围

* **singleton**          **：默认的，Spring会采用单例模式创建这个对象**
*  **prototype**        **：多例模式**
*  request              ：应用在web项目中，Spring创建这个类以后，将这个类存入到request范围中。
*  session               ：应用在web项目中，Spring创建这个类以后，将这个类存入到session范围中。
* globalsession    ：应用在web项目中，必须在porlet环境下使用。但是如果没有这种环境，相对于session。

## 5.Spring属性注入

###  5.1构造方法的属性注入

```xml
  <bean id="userDao" class="Demo.UserDaoImpl" >
   		<constructor-arg name="name" value="zhangsan"> </constructor-arg>
      	<constructor-arg name="car" ref="car"> </constructor-arg>
   </bean> 
```

### 5.2Set方法的属性注入

```xml
--value 注入普通属性 ref 引用类型
<bean id="userDao" class="Demo.UserDaoImpl">
   		<property name="name" value="Spring"></property>
   		<property name="car" ref="car"></property>
 </bean>
```

P名称空间注入

SpEL注入

 语法: #{xxxxx} 引用类型也用value 

```xml
-- 引用类型也用value 
<bean id="userDao" class="Demo.UserDaoImpl">
   		<property name="name" value=#{userInfo.name}></property>
   		<property name="car" value=#{carFactory.getCar()}></property>
 </bean>
```

### 5.3集合类型注入

```xml
	<!-- 注入数组类型 -->
<bean id="userDao" class="Demo.UserDaoImpl">
   	<property name="arrs">
        <list>
			<value>Spring</value>
			<value>SpringMVC</value>
			<value>Mybatis</value>
      	</list>
    </property>
 </bean>	

<!-- 注入list集合 -->
<bean id="userDao" class="Demo.UserDaoImpl">
   	<property name="list">
        <list>
			<value>Spring</value>
			<value>SpringMVC</value>
			<value>Mybatis</value>
      	</list>
    </property>
 </bean>

	<!-- 注入Set集合 -->
<bean id="userDao" class="Demo.UserDaoImpl">
   	<property name="set">
        <set>
			<value>Spring</value>
			<value>SpringMVC</value>
			<value>Mybatis</value>
      	</set>
    </property>
 </bean>

	<!-- 注入Map集合 -->
<bean id="userDao" class="Demo.UserDaoImpl">
		<property name="map">
			<map>
				<entry key="aaa" value="111"/>
				<entry key="bbb" value="222"/>
				<entry key="ccc" value="333"/>
			</map>
		</property>
 </bean>
```









