---
layout: post
title: Mybatis框架搭建
categories: Java
description: 第一次接触Mybatis
keywords: Mybatis, Java
---

先看一下Mybatis的架构

![Mybatis-structure](https://github.com/lillusory/lillusory.github.io/raw/master/images/posts/Java/Java_mybatis_structure.png)

# 1.导包

![Mybatis-jar](https://github.com/lillusory/lillusory.github.io/raw/master/images/posts/Java/Java_mybatis_jar.png)

# 2.准备pojo

```Java
package pojo;

import java.io.Serializable;
import java.util.Date;

public class User implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private Integer id;
	private String username;
	private String sex;
	private Date birthday;
	private String address;


	public Integer getId() {
		return id;
	}
	public void setId(Integer id) {
		this.id = id;
	}
	public String getUsername() {
		return username;
	}
	public void setUsername(String username) {
		this.username = username;
	}
	public String getSex() {
		return sex;
	}
	public void setSex(String sex) {
		this.sex = sex;
	}
	public Date getBirthday() {
		return birthday;
	}
	public void setBirthday(Date birthday) {
		this.birthday = birthday;
	}
	public String getAddress() {
		return address;
	}
	public void setAddress(String address) {
		this.address = address;
	}
	@Override
	public String toString() {
		return "User [id=" + id + ", username=" + username + ", sex=" + sex
				+ ", birthday=" + birthday + ", address=" + address + "]";
	}

	
	

}

```

```java
package pojo;

import java.io.Serializable;
import java.util.Date;

public class Orders  implements Serializable{
    /**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	private Integer id;

    private Integer userId;

    private String number;

    private Date createtime;

    private String note;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getNumber() {
        return number;
    }

    public void setNumber(String number) {
        this.number = number == null ? null : number.trim();
    }

    public Date getCreatetime() {
        return createtime;
    }

    public void setCreatetime(Date createtime) {
        this.createtime = createtime;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note == null ? null : note.trim();
    }

    
    
}
```

# 3.编写配置文件

在`/src`下创建`sqlMapConfig.xml`配置文件。

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
	<!-- 和spring整合后 environments配置将废除 -->
	<environments default="development">
		<environment id="development">
			<!-- 使用jdbc事务管理 -->
			<transactionManager type="JDBC" />
			<!-- 数据库连接池 -->
			<dataSource type="POOLED">
				<property name="driver" value="com.mysql.jdbc.Driver" />
				<property name="url"
					value="jdbc:mysql://localhost:3306/mybatis?characterEncoding=utf-8" />
				<property name="username" value="root" />
				<property name="password" value="root" />
			</dataSource>
		</environment>
	</environments>
</configuration>

```

在`/src`下创建`log4j.properties`配置文件，为了打印日志，显示SQL语句执行顺序。

```properties
# Global logging configuration
log4j.rootLogger=DEBUG, stdout
# Console output...
log4j.appender.stdout=org.apache.log4j.ConsoleAppender
log4j.appender.stdout.layout=org.apache.log4j.PatternLayout
log4j.appender.stdout.layout.ConversionPattern=%5p [%t] - %m%n

```

在`/src/sqlmap`下创建`User.xml`配置文件

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 写sql语句
命名空间 test.findUserById
-->
<mapper namespace="test">
	<!-- 通过id查用户 -->
	<select id="findUserById" parameterType="Integer" resultType="pojo.User">
		select * from user where id = #{v}
	</select>
</mapper>

```

在`junit` 下创建 `Test测试文件`

```java
package junit;

import java.io.IOException;
import java.io.InputStream;

import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.junit.Test;

import pojo.User;

public class MyFirstMybatisTest {
@Test
	public void fun1() throws IOException {
		//加载核心配置文件
	String resource="sqlMapConfig.xml";
	InputStream in = Resources.getResourceAsStream(resource);
		//创建SqlSessionFactory
	SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(in);
	//创建SqlSession
	SqlSession sqlSession = sqlSessionFactory.openSession();
	//执行Sql语句
 
	User user = sqlSession.selectOne("test.findUserById", 10);
	System.out.println(user);
	}
}

```

junit运行结果

```java
DEBUG [main] - Logging initialized using 'class org.apache.ibatis.logging.slf4j.Slf4jImpl' adapter.
DEBUG [main] - PooledDataSource forcefully closed/removed all connections.
DEBUG [main] - PooledDataSource forcefully closed/removed all connections.
DEBUG [main] - PooledDataSource forcefully closed/removed all connections.
DEBUG [main] - PooledDataSource forcefully closed/removed all connections.
DEBUG [main] - Opening JDBC Connection
DEBUG [main] - Created connection 706197430.
DEBUG [main] - Setting autocommit to false on JDBC Connection [com.mysql.jdbc.JDBC4Connection@2a17b7b6]
DEBUG [main] - ==>  Preparing: select * from user where id = ? 
DEBUG [main] - ==> Parameters: 10(Integer)
DEBUG [main] - <==      Total: 1
User [id=10, username=张三, sex=1, birthday=Thu Jul 10 00:00:00 CST 2014, address=北京市]
```

Mybatis第一个入门小程序成功！



增删改查入门

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<!-- 写sql语句
命名空间 test.findUserById
-->
<mapper namespace="test">
	<!-- 通过id查用户 -->
	<select id="findUserById" parameterType="Integer" resultType="pojo.User">
		select * from user where id = #{v}
	</select>
	<!--根据用户名模糊查询 
	#{} 占位符
	${} 字符串拼接
	 -->
	<select id="findUserByusername" parameterType="String" resultType="pojo.User">
		select * from user where username like'%${value}%'
	</select>
	<!--添加用户  -->
	<!-- 通过id查用户 -->
	<insert id="insertUser" parameterType="pojo.User">
	<selectKey keyProperty="id" resultType="Integer" order="AFTER">
		select LAST_INSERT_ID()
	</selectKey>
		insert into user (username,birthday,sex) values(#{username},#{birthday},#{sex})
	</insert>
	
	<!--更新用户  -->
	<update id="updateUserById" parameterType="pojo.User" >
		update user
		set username=#{username},sex=#{sex},birthday=#{birthday}
		where id=#{id}
	</update>
	
	<!--删除用户  -->
	<delete id="deleteUserById" parameterType="Integer">
		delete from user where id =#{id}
	</delete>
</mapper>

```

测试文件

```java
package junit;

import java.io.IOException;
import java.io.InputStream;
import java.util.Date;
import java.util.List;

import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;
import org.junit.Test;

import pojo.User;

public class MyFirstMybatisTest {
	@Test
	public void fun1() throws IOException {
		//加载核心配置文件
	String resource="sqlMapConfig.xml";
	InputStream in = Resources.getResourceAsStream(resource);
		//创建SqlSessionFactory
	SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(in);
	//创建SqlSession
	SqlSession sqlSession = sqlSessionFactory.openSession();
	//执行Sql语句
 
	User user = sqlSession.selectOne("test.findUserById", 10);
	System.out.println(user);
	}
	
	@Test
	public void fun2() throws IOException {
		//加载核心配置文件
		String resource="sqlMapConfig.xml";
		InputStream in = Resources.getResourceAsStream(resource);
		//创建SqlSessionFactory
		SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(in);
		//创建SqlSession
		SqlSession sqlSession = sqlSessionFactory.openSession();
		//执行Sql语句
		
		List<User> users = sqlSession.selectList("test.findUserByusername", "五");
		for (User user : users) {
			System.out.println(user);
		}
	}
	@Test
	public void fun3() throws IOException {
		//加载核心配置文件
		String resource="sqlMapConfig.xml";
		InputStream in = Resources.getResourceAsStream(resource);
		//创建SqlSessionFactory
		SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(in);
		//创建SqlSession
		SqlSession sqlSession = sqlSessionFactory.openSession();
		//执行Sql语句
		User user=new User();
		user.setUsername("天策");
		user.setBirthday(new Date());
		user.setSex("男");
		int i= sqlSession.insert("test.insertUser", user);
		sqlSession.commit();
		System.out.println(i);
		System.out.println(user.getId());
	}
	@Test
	public void fu4() throws IOException {
		//加载核心配置文件
		String resource="sqlMapConfig.xml";
		InputStream in = Resources.getResourceAsStream(resource);
		//创建SqlSessionFactory
		SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(in);
		//创建SqlSession
		SqlSession sqlSession = sqlSessionFactory.openSession();
		//执行Sql语句
		User user=new User();
		user.setId(28);
		user.setUsername("丐帮");
		user.setBirthday(new Date());
		user.setSex("男");
		int i= sqlSession.insert("test.updateUserById", user);
		sqlSession.commit();
		System.out.println(i);

	}
	@Test
	public void fun5() throws IOException {
		//加载核心配置文件
		String resource="sqlMapConfig.xml";
		InputStream in = Resources.getResourceAsStream(resource);
		//创建SqlSessionFactory
		SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(in);
		//创建SqlSession
		SqlSession sqlSession = sqlSessionFactory.openSession();
		//执行Sql语句
		int i= sqlSession.insert("test.deleteUserById", 28);
		sqlSession.commit();
		System.out.println(i);
		
	}
}
```

最后其中更新的时候忘记加where条件了，整个变全改了 ╮(╯▽╰)╭，所以操作数据库的时候一定要小心。

