# Mybatis

## 工程搭建

### 1.日志记录

在工程目录下创建一个source folder 名字为config,与src同级,所有配置文件都放这里面,方便管理

在config下创建log4j.properties如下：

```properties
# Global logging configuration
log4j.rootLogger=DEBUG, stdout
# Console output...
log4j.appender.stdout=org.apache.log4j.ConsoleAppender
log4j.appender.stdout.layout=org.apache.log4j.PatternLayout
log4j.appender.stdout.layout.ConversionPattern=%5p [%t] - %m%n
```

### 2.数据库连接配置文件

在config下创建db.properties如下：

```properties
db.driverClass=com.mysql.jdbc.Driver
db.url=jdbc:mysql://localhost:3306/tran?useUnicode=true&characterEncoding=utf8
db.username=root
db.password=root
```

### 3.创建一个Bean对象

```java
public class User {

	private Integer id;
	private String username;// 用户姓名
	private String sex;// 性别
	private Date birthday;// 生日
	private String address;// 地址
	//此处省略get/set/toString
}
```

### 4.创建bean对象的Sql映射文件

**User.xml 名字必须和上面的bean一致.**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="User">
    <!--namespace也必须与bean一致 resultType 返回值类型 类的全限定类名-->
<select id="getUserById" parameterType="int" resultType="pojo.User">
SELECT 
  `id`,
  `username`,
  `birthday`,
  `sex`,
  `address` 
FROM
  `user` 
  WHERE id=#{id};
</select>
</mapper>

```

### 5.Mybatis全局配置文件

在config下创建SqlMapConfig.xml，如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE configuration
PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
	<!-- 引入数据库连接配置文件 -->
<properties resource="db.properties"></properties>
	<!-- 和spring整合后 environments配置将废除 -->
	<environments default="development">
		<environment id="development">
			<!-- 使用jdbc事务管理 -->
			<transactionManager type="JDBC" />
			<!-- 数据库连接池 -->
			<dataSource type="POOLED">
				<property name="driver" value="${db.driverClass}" />
				<property name="url"
					value="${db.url}" />
				<property name="username" value="${db.username}" />
				<property name="password" value="${db.password}" />
			</dataSource>
		</environment>
	</environments>
	<!-- 引入映射文件 -->
	<mappers>
	<mapper resource="mybatis/User.xml"/>
	</mappers>
</configuration>
```

### 6.测试

```java
public class MybatisTest {
	@Test
 public void testGetUserById() throws IOException {
	//创建工厂的builder对象
	 SqlSessionFactoryBuilder ssfb=new SqlSessionFactoryBuilder();
	 //创建配置文件输入流
	 InputStream is = Resources.getResourceAsStream("SqlMapConfig.xml");
	 //通过输入流创建工厂对象
	 SqlSessionFactory ssf = ssfb.build(is);
	 //创建SQLSession对象
	 SqlSession sqlSession = ssf.openSession();
	 User user = sqlSession.selectOne("User.getUserById",1);
	 System.out.println(user);
	 sqlSession.close();
 }
}
//输出
User [id=1, username=王五, sex=2, birthday=null, address=null]
```

### 7.mapper语法

```java
<mapper namespace="User">
//--1.#{} 点位符 相当于占位符? 括号内写什么都可以-----
<select id="getUserById" parameterType="int" resultType="pojo.User">
SELECT 
  `id`,
  `username`,
  `birthday`,
  `sex`,
  `address` 
FROM
  `user` 
  WHERE id=#{id};
</select>
//--2.${} 字符串拼接指令 如果入参为普通类型括号内必须写value -----
<select id="getUserByName" parameterType="string" resultType="pojo.User">
SELECT 
  `id`,
  `username`,
  `birthday`,
  `sex`,
  `address` 
FROM
  `user` 
  WHERE username LIKE '%${value}%';

//--3.主键自增的两种写法   
//	第一种:useGeneratedKeys="true" keyProperty="id"
//	第二种: 
//	<selectKey keyProperty="id" resultType="int" order="AFTER">
//	SELECT LAST_INSERT_ID()
//	</selectKey>
-----
<insert id="insertUser" parameterType="pojo.User" useGeneratedKeys="true" keyProperty="id">	
<!--selectKey主键返回 
	keyProperty:user中的主键属性
	resultType:主键数据类型
	order:指定selectKey何时执行AFTER 即insert
  -->
  <!-- 
 <selectKey keyProperty="id" resultType="int" order="AFTER">
	SELECT LAST_INSERT_ID()
	</selectKey>
	-->
INSERT INTO `user` (
  `username`,
  `birthday`,
  `sex`,
  `address`
) 
VALUES
  (
    #{username},
    #{birthday},
    #{sex},
    #{address}
  ) ;
</insert>

</mapper>
```

#### 插入ID自增

```java
<insert id="insertUser" parameterClass="ibatis.User"> 
          insert into user 
          (name,password) 
          values 
          (#name#,#password#) 
          <selectKey resultClass="long" keyProperty="id">  
             SELECT LAST_INSERT_ID() AS ID  
        </selectKey>  
</insert>
```



### 8.动态代理dao包装

只有接口没有实现类

规则:

**1.映射文件的namespace必须是接口的全限定 namespace="dao.UserMapper"**

**2.接口方法名必须与SQL id一致 id="getUserByName" 方法名也必须是getUserByName**

**3.接口入参必须与SQL入参类型一致  parameterType**

**4.接口返回值必须需SQL返回值一致  resultType**

```java
	@Test
	public void testDemo() throws IOException {
		SqlSession sqlSession = SqlSessionFactoryUtils.getSqlSessionFactory().openSession();
		// 获取接口的代理人实现
		UserMapper mapper = sqlSession.getMapper(UserMapper.class);
		User user = mapper.getUserById(28);
		System.out.println(user);
         sqlSession.close();
	}
```

### 9.typeAliases

```xml
<typeAliases>
		<!-- 单个别名定义 -->
		<!-- <typeAlias type="com.itheima.mybatis.pojo.User" alias="user"/> -->
		<!-- 别名包扫描器(推荐使用此方式)，整个包下的类都被定义别名，别名为类名，不区分大小写-->
		<package name="com.itheima.mybatis.pojo"/>
	</typeAliases>
```

### 10.映射文件

```xml
<mappers>
		<!-- 第一种方式，加载 resource-->
		<mapper resource="mapper/user.xml"/>
		<!-- <mapper resource="mapper/UserMapper.xml"/> -->
		
		<!-- 第二种方式，class扫描器要求：
			 1、映射文件与接口同一目录下
			 2、映射文件名必需与接口文件名称一致
		 -->
		<!-- <mapper class="com.itheima.mybatis.mapper.UserMapper"/> -->
		
		<!-- 第三种方式，包扫描器要求(推荐使用此方式)：
			 1、映射文件与接口同一目录下
			 2、映射文件名必需与接口文件名称一致
		-->
		<package name="com.lillusory.demo.mapper"/>
</mappers>

```











