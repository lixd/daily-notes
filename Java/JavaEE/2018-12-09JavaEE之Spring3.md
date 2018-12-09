# SpringAOP

```java
自动提示class的插件
Help ->Install New Software 输入下面的网址按回车安装即可 最后的数字是当前eclipse的版本号 
http://dist.springsource.com/release/TOOLS/update/e4.9/
```



## 1.基于AspectJ的注解开发

### 1.创建项目

#### 1.导包

```java
//日志记录 
--logging  				//com.springsource.org.apache.commons.logging-1.1.1.jar
--log4j					 //com.springsource.org.apache.log4j-1.2.15.jar
//Spring 4个核心包
--beans  				 //spring-beans-4.2.4.RELEASE.jar
--context				 //spring-context-4.2.4.RELEASE.jar
--core  				//spring-core-4.2.4.RELEASE.jar
--expression 				//spring-expression-4.2.4.RELEASE.jar
//aop包
--aop  					//spring-aop-4.2.4.RELEASE.jar
--aopalliance aop联盟 	//com.springsource.org.aopalliance-1.0.0.jar
//aspectJ
aspectj.weaver   			//com.springsource.org.aspectj.weaver-1.6.8.RELEASE.jar
//Spring AspectJ整合包
spring-aspects 				//spring-aspects-4.2.4.RELEASE.jar
```

#### 2.配置文件

src下创建 applicationContext.xml

#### 3.编写目标类

```java
public class orderDao {
public void sava() {
	System.out.println("保存订单");
}
public void query() {
	System.out.println("查询订单");
}
public void update() {
	System.out.println("更新订单");
}
public void delete() {
	System.out.println("删除订单");
}
}
//配置bean
<bean id="OrderDao" class="com.lillusory.demo2.orderDao"></bean>
```

#### 4.编写切面类

```java
public class MyAspectAnno {
	public void before() {
		System.out.println("前置通知");
	}
}
//配置切面类
<bean id="myAspectAnno" class="com.lillusory.demo2.MyAspectAnno"></bean>
```

## 2.使用SpringAOP注解通知

#### 1.打开注解开关

```xml
Spring配置文件applicationContext.xml中
<!-- 打开AOP注解-->
<aop:aspectj-autoproxy/>
```
#### 2.切面类添加注解

```java
@Aspect //代表这是切面
public class MyAspectAnno {
	//前置通知 before value 为表达式 指定给哪个类哪个方法进行增强
	@Before(value="execution(* com.lillusory.demo2.orderDao.save(..))")
	public void before() {
		System.out.println("前置通知");
	}
	//后置通知 returning 为返回值
	@AfterReturning(value="execution(* com.lillusory.demo2.orderDao.delete(..))",
			returning="result")
	public void afterreturning(Object result) {
		System.out.println("后置通知"+result);
	}
	//环绕通知 
	@Around(value="execution(* com.lillusory.demo2.orderDao.update(..))")
	public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
		System.out.println("环绕--前");
		Object obj = joinPoint.proceed();
		System.out.println("环绕--后");
		return obj; 
	}
	//异常抛出通知 throwing为异常信息
	@AfterThrowing(value="execution(* com.lillusory.demo2.orderDao.query(..))",
			throwing="exc")
	public void throwing(Throwable exc) {
		System.out.println("抛出异常了"+exc.getMessage());
	}
	//最终通知 
	@After(value="execution(* com.lillusory.demo2.orderDao.query(..))")
	public void after() {
		System.out.println("最终通知");
	}
}

//测试
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(value="classpath:applicationContext.xml")
public class Test2 {
	@Resource(name = "OrderDao")
	private orderDao orderDao;
	@Test
	public void test1() {
		orderDao.save();
		System.out.println("-----------------");
		orderDao.delete();
		System.out.println("-----------------");
		orderDao.update();
		System.out.println("-----------------");
		orderDao.query();
	}
}

//输出
前置通知
保存订单
-----------------
删除订单
后置通知ssss
-----------------
环绕--前
更新订单
环绕--后
-----------------
查询订单
最终通知
抛出异常了/ by zero
```

#### 3.注解简化

```java
前面使用很麻烦 每次都要写(value="execution(* com.lillusory.demo2.orderDao.query(..))")
如果对同一个方法增加多个通知也要写多次.
// @Pointcut  注解可以解决这个问题,就想xml配置中的id一样
<aop:pointcut
			expression="execution(* com.lillusory.demo.UserDaoImpl.query(..))"
			id="pointcut4" />

@Aspect //代表这是切面
public class MyAspectAnno {
	//前置通知 before value 为表达式 指定给哪个类哪个方法进行增强
	@Before(value="MyAspectAnno.pointcutSave()")
	public void before() {
		System.out.println("前置通知");
	}
	//后置通知 returning 为返回值
	@AfterReturning(value="MyAspectAnno.pointcutDelete()",
			returning="result")
	public void afterreturning(Object result) {
		System.out.println("后置通知"+result);
	}
	//环绕通知 
	@Around(value="MyAspectAnno.pointcutUpdate()")
	public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
		System.out.println("环绕--前");
		Object obj = joinPoint.proceed();
		System.out.println("环绕--后");
		return obj; 
	}
	//异常抛出通知 throwing为异常信息
	@AfterThrowing(value="MyAspectAnno.pointcutQuery()",
			throwing="exc")
	public void throwing(Throwable exc) {
		System.out.println("抛出异常了"+exc.getMessage());
	}
	//最终通知 
	@After(value="MyAspectAnno.pointcutQuery()")
	public void after() {
		System.out.println("最终通知");
	}
	//切入点注解  相当于给execution(* com.lillusory.orderDao.query(..))表达式取
	//了个ID为pointcutQuery
	//修改时只需要维护这几个就可以了
	@Pointcut(value="execution(* com.lillusory.demo2.orderDao.query(..))")
	private void pointcutQuery() {}
	@Pointcut(value="execution(* com.lillusory.demo2.orderDao.save(..))")
	private void pointcutSave() {}
	@Pointcut(value="execution(* com.lillusory.demo2.orderDao.delete(..))")
	private void pointcutDelete() {}
	@Pointcut(value="execution(* com.lillusory.demo2.orderDao.update(..))")
	private void pointcutUpdate() {}
}
}
```

## 3.DBCP/C3P0

#### 1.直接配置

```xml
<!-- 导包=============================== -->
com.springsource.org.apache.commons.dbcp-1.2.2.jar
com.springsource.org.apache.commons.pool-1.5.3.jar
	<!-- 配置DBCP连接池=============================== -->
<!-- 	<bean id="dataSource" class="org.apache.commons.dbcp.BasicDataSource">
		<property name="driverClassName" value="com.mysql.jdbc.Driver"/>
		<property name="url" value="jdbc:mysql:///spring4_day03"/>
		<property name="username" value="root"/>
		<property name="password" value="abc"/>
	</bean> -->
	<!-- 配置C3P0连接池=============================== -->
	<bean id="dataSource" class="com.mchange.v2.c3p0.ComboPooledDataSource">
		<property name="driverClass" value="${jdbc.driverClass}"/>
		<property name="jdbcUrl" value="${jdbc.url}"/>
		<property name="user" value="${jdbc.username}"/>
		<property name="password" value="${jdbc.password}"/>
	</bean>
	<!-- 配置Spring的JDBC的模板========================= -->
	<bean id="jdbcTemplate" class="org.springframework.jdbc.core.JdbcTemplate">
		<property name="dataSource" ref="dataSource" />
	</bean>
```

#### 2.配置文件配置

```properties
jdbc.driverClass=com.mysql.jdbc.Driver
jdbc.url=jdbc:mysql:///mySpring
jdbc.username=root
jdbc.password=root
```

```xml
<!-- 通过context标签引入的 -->
	<context:property-placeholder location="classpath:jdbc.properties"/>
	
	<!-- 配置C3P0连接池=============================== -->
	<bean id="dataSource" class="com.mchange.v2.c3p0.ComboPooledDataSource">
		<property name="driverClass" value="${jdbc.driverClass}"/>
		<property name="jdbcUrl" value="${jdbc.url}"/>
		<property name="user" value="${jdbc.username}"/>
		<property name="password" value="${jdbc.password}"/>
	</bean>
	
	<!-- 配置Spring的JDBC的模板========================= -->
	<bean id="jdbcTemplate" class="org.springframework.jdbc.core.JdbcTemplate">
		<property name="dataSource" ref="dataSource" />
	</bean>
```

#### 3.增删改查

```java
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration("classpath:applicationContext.xml")
public class JDBCDemo1 {
	@Resource(name="jdbcTemplate")
	private JdbcTemplate jdbcTemplate;
	
	@Test
	//添加
	public void insert() {
		String sql="insert into user values(null,?,?,?)";
		int update = jdbcTemplate.update(sql,"Az","123456","10086");
		System.out.println(update);
	}
	@Test
	//修改
	public void update() {
		String sql="update user set username= ? where uid =?";
		int update = jdbcTemplate.update(sql,"Azzz",9);
		System.out.println(update);
	}
	@Test
	//删除
	public void delete() {
		String sql="delete from user where uid =?";
		int update = jdbcTemplate.update(sql,9);
		System.out.println(update);
	}
	@Test
	//查询用户名
	public void queryName() {
		String sql="select username from user where uid =?";
		String username = jdbcTemplate.queryForObject(sql, String.class,10);
		System.out.println(username);
	}
	@Test
	//查询数据条数
	public void queryCount() {
		String sql="select count(*) from user";
		int count = jdbcTemplate.queryForObject(sql, int.class);
		System.out.println(count);
	}
    	@Test
	//查询结果封装到对象中
	public void queryUser() {
		String sql="select * from user where uid=?";
		User user = jdbcTemplate.queryForObject(sql,new MyRowmapper(),6);
		System.out.println(user);
	}
    	@Test
	//查询有多个结果
	public void queryUsers() {
		String sql="select * from user";
	 List<User> list = jdbcTemplate.query(sql, new MyRowmapper());
		for (User user : list) {
		System.out.println(user);
		}
	}
	class MyRowmapper implements RowMapper<User>{
		public User mapRow(ResultSet rs, int rowNum) throws SQLException {
			User user=new User();
			user.setUid(rs.getInt("uid"));
			user.setUsername(rs.getString("username"));
			user.setPassword(rs.getString("password"));
			user.setPhone(rs.getString("phone"));
			return user;
		}
		
	}
}
```

## 4.Spring事务

### 1.事务

 `事务`：逻辑上的一组操作，组成这组操作的各个单元，要么全都成功，要么全都失败。

#### 1.事务特性

`原子性`：事务不可分割

`一致性`：事务执行前后数据完整性保持一致

` 隔离性`：一个事务的执行不应该受到其他事务的干扰

`持久性`：一旦事务结束，数据就持久化到数据库

#### 2.安全性问题

* 读问题
  * 脏读                   ：一个事务读到另一个事务未提交的数据
  *  不可重复读     ：一个事务读到另一个事务已经提交的update的数据，导致一个事务中多次查询结果不一致
  * 虚读、幻读     ：一个事务读到另一个事务已经提交的insert的数据，导致一个事务中多次查询结果不一致。
* 写问题
  * 丢失更新

#### 3.事务隔离级别

`Read uncommitted ` ：读未提交，任何读问题解决不了。

`Read committed `      ：读已提交，解决脏读，但是不可重复读和虚读有可能发生。

`Repeatable read`      ：重复读，解决脏读和不可重复读，但是虚读有可能发生。

` Serializable `               ：解决所有读问题。

### 2.Spring的事务管理的API

```java
//PlatformTransactionManager：平台事务管理器
	平台事务管理器：接口，是Spring用于管理事务的真正的对象。
	DataSourceTransactionManager	：底层使用JDBC管理事务
	HibernateTransactionManager	：底层使用Hibernate管理事务
//TransactionDefinition	：事务定义信息
	事务定义：用于定义事务的相关的信息，隔离级别、超时信息、传播行为、是否只读
//TransactionStatus：事务的状态
	事务状态：用于记录在事务管理过程中，事务的状态的对象。
//事务管理的API的关系：
Spring进行事务管理的时候，首先平台事务管理器根据事务定义信息进行事务的管理，在事务管理过程中，产生各种状态，将这些状态的信息记录到事务状态的对象中。
```

#### Spring事务传播行为

Dao执行会开启事务,Service中是调用Dao执行业务逻辑,那么Service中也有事务了,如果业务很复杂,需要多个Service互相调用,就会出现事务的嵌套问题.

```java
ServiceA(){
    DaoA();
    DaoB();
}
ServiceB(){
    ServiceA();
    DaoC();
    DAoD();
}
//B中调用A,就出现了事务的传播或者嵌套等问题.
```

Spring中提供了七种事务的传播行为：

* 保证多个操作在同一个事务中
  * **`PROPAGATION_REQUIRED`：默认值，如果A中有事务，使用A中的事务，如果A没有，创建一个新的事务，将操作包含进来**
  * `PROPAGATION_SUPPORTS`：支持事务，如果A中有事务，使用A中的事务。如果A没有事务，不使用事务
  * `PROPAGATION_MANDATORY`：如果A中有事务，使用A中的事务。如果A没有事务，抛出异常。
* 保证多个操作不在同一个事务中
  * **`PROPAGATION_REQUIRES_NEW`：如果A中有事务，将A的事务挂起（暂停），创建新事务，只包含自身操作。如果A中没有事务，创建一个新事务，包含自身操作.**
  * `PROPAGATION_NOT_SUPPORTED`：如果A中有事务，将A的事务挂起。不使用事务管理。
  * `PROPAGATION_NEVER`：如果A中有事务，报异常。
* 嵌套式事务
  * **`PROPAGATION_NESTED`	：嵌套事务，如果A中有事务，按照A的事务执行，执行完成后，设置一个保存点，执行B中的操作，如果没有异常，执行通过，如果有异常，可以选择回滚到最初始位置，也可以回滚到保存点。**

#### Spring事务操作

##### 1.环境搭建

```java
//--------------上面的写法-----------------
public class AccountDaoImpl implememts AccountDao {
 public void outMoney(String from,String money) {
     //注入JDBC模板 创建每个Dao类都要写这个很麻烦
	private JdbcTemplate jdbcTemplate;
	public void setJdbcTemplate(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}
 }
}
//--------------简单的写法-----------------
//每次创建Dao类要注入JDBC模板 都要添加字段和set方法 很麻烦
//直接让Dao类继承JdbcDaoSupport  就不用写了
public class AccountDaoImpl extends JdbcDaoSupport{
 public void outMoney(String from,String money) {
 JdbcTemplate jdbcTemplate = this.getJdbcTemplate();
 }
}

```

```java
//--------------JdbcDaoSupport类源码-----------------
public abstract class JdbcDaoSupport extends DaoSupport {
    //内部已经有jdbcTemplate对象了
	private JdbcTemplate jdbcTemplate;
    //同时set方法也有
    public final void setJdbcTemplate(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
		initTemplateConfig();
	}
    //最后通过dataSource能直接得到jdbcTemplate
    //	applicationContext.xml中的这个配置就不需要了
    //直接把dataSource注入给Dao就可以了
	<bean id="jdbcTemplate"
		class="org.springframework.jdbc.core.JdbcTemplate">
		<property name="dataSource" ref="dataSource"></property>
	</bean>
    public final void setDataSource(DataSource dataSource) {
		if (this.jdbcTemplate == null || dataSource != this.jdbcTemplate.getDataSource()) {
			this.jdbcTemplate = createJdbcTemplate(dataSource);
			initTemplateConfig();
		}
	}
}
```

##### 2.配置文件

```xml
<!-- 加载配置文件 -->
	<context:property-placeholder
		location="classpath:jdbc.properties" />
	<!-- C3P0 -->
	<bean id="dataSource"
		class="com.mchange.v2.c3p0.ComboPooledDataSource">
		<property name="driverClass" value="${jdbc.driverClass}"></property>
		<property name="jdbcUrl" value="${jdbc.url}"></property>
		<property name="user" value="${jdbc.username}"></property>
		<property name="password" value="${jdbc.password}"></property>
	</bean>
	<!-- Dao配置 直接注入dataSource-->
	<bean id="accountDao" class="com.lillusory.tx.AccountDao">
	<property name="dataSource" ref="dataSource"></property>
	</bean>
```

### 3.Spring事务管理

#### 1.编程式事务管理

##### 1.配置事务管理平台

```xml
<!-- 配置平台事务管理器============================= -->
	<bean id="transactionManager" class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
		<property name="dataSource" ref="dataSource"/>
	</bean>
```

##### 2.配置事务管理模板

```xml
<!-- 配置事务管理的模板 -->
	<bean id="transactionTemplate" class="org.springframework.transaction.support.TransactionTemplate">
		<property name="transactionManager" ref="transactionManager"/>
	</bean>
```

##### 3.业务层注入事务管理模板

```xml
	<!-- 配置Service============= -->
	<bean id="accountService" class="com.lillusory.Demo1.AccountServiceImpl">
		<property name="accountDao" ref="accountDao"/>
		<!-- 注入 事务管理的模板 -->
		<property name="trsactionTemplate" ref="transactionTemplate"/>
	</bean>
```

##### 4.编写事务管理代码

```java
	public void transfer(final String from, final String to, final Double money) {
		//将代码写在TransactionCallback中就算开启了事务
		trsactionTemplate.execute(new TransactionCallbackWithoutResult() {
			@Override
			protected void doInTransactionWithoutResult(TransactionStatus transactionStatus) {
				accountDao.outMoney(from, money);
				int d = 1/0;
				accountDao.inMoney(to, money);
			}
		});	
	}
```

#### 2.声明式事务管理(通过配置实现)--AOP (常用)

* XML方式

```xml
<!-- 1.配置事务管理器=============================== -->
	<bean id="transactionManager" class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
		<property name="dataSource" ref="dataSource"/>
	</bean>
```
```xml
<!-- 2.配置事务的增强=============================== -->
<tx:advice id="txAdvice" transaction-manager="transactionManager">
	<tx:attributes>
		<!-- 事务管理的规则 -->
        <!-- propagation 事务传播行为 save开头的方法配置 -->
		<!-- <tx:method name="save*" propagation="REQUIRED" isolation="DEFAULT"/>
		<tx:method name="update*" propagation="REQUIRED"/>
		<tx:method name="delete*" propagation="REQUIRED"/>
		<tx:method name="find*" read-only="true"/> -->
		<tx:method name="*" propagation="REQUIRED" read-only="false"/>
	</tx:attributes>
</tx:advice>
```

```xml
<!-- 3.aop的配置  具体哪些方法要按照上边的配置来-->
<aop:config>
	<aop:pointcut expression="execution(* com.lillusory.Demo1.AccountServiceImpl.*(..))" id="pointcut1"/>
	<aop:advisor advice-ref="txAdvice" pointcut-ref="pointcut1"/>
</aop:config>
```

* 注解方式

```xml
<!-- 1.配置事务管理器=============================== -->
	<bean id="transactionManager" class="org.springframework.jdbc.datasource.DataSourceTransactionManager">
		<property name="dataSource" ref="dataSource"/>
	</bean>
```

```xml
	<!-- 2.开启注解事务================================ -->
	<tx:annotation-driven transaction-manager="transactionManager"/>
```

```java
//---------- 3.@Transactional开启事务-------------
@Transactional(isolation=Isolation.DEFAULT,propagation=Propagation.REQUIRED)
public class AccountServiceImpl implements AccountService {
	// 注入DAO:
	private AccountDao accountDao;
	public void setAccountDao(AccountDao accountDao) {
		this.accountDao = accountDao;
	}
	@Override
	/**
	 * from：转出账号
	 * to：转入账号
	 * money：转账金额
	 */
	public void transfer( String from,  String to,  Double money) {
			accountDao.outMoney(from, money);
			int d = 1/0;
			accountDao.inMoney(to, money);
	}
}
```









### 



