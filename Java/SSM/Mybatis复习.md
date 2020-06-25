# Mybatis复习

 看了下JPA,回来复习下Mybatis

## parameperType

`parameperType`控制参数类型

 `#{}` 获取参数 

如果参数是对象，则-->#{属性名}

如果是Map,则-->#{key}

`#{}`和`${}` 的区别

`#{}` 获取参数的内容支持 索引获取param1获取指定位置参数，并且SQL使用？占位符

`${}` 纯字符串拼接，不使用占位符，默认找get/set方法，如果是数字结果就是数字。如：

`parameperType="user"`

`${id}`-->会去找id, ${1}-->就是 `1 `



## resultMap

SQL查询结果与实体类映射关系

1.默认使用Auto Mapping特性

2.使用了resyltMap 就不写resulType

N+1次查询

```xml
<resultMap id="UserMap" type="user">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <result property="age" column="age"/>
    <result property="address" column="address"/>
     <result property="oid" column="oid"/>
    <association property="order" select="com.illusory.demodao.mapper.UserMapper.selectOrder" column="oid"/>
</resultMap>

<select id="selectOrder" resultType="order">
    select *
    from order
</select>
<!--包含对象时使用association-->
<!--包含集合时使用collection- ofType 集合的数据类型->
<collection property="list" ofType="order" 。。。。。/>
```

### 一对一关联查询

`resultMap`  + `association`
		

```xml
	<!-- association:配置一对一关联
			 property:绑定的用户属性
			 javaType:属性数据类型，支持别名
		-->

<!-- 一对一关联查询-resultMap -->
	<resultMap type="order" id="order_user_map">
		<!-- id标签用于绑定主键 -->
		<id property="id" column="id"/>
		<!-- 使用result绑定普通字段 -->
		<result property="userId" column="user_id"/>
		<result property="number" column="number"/>
		<result property="createtime" column="createtime"/>
		<result property="note" column="note"/>
		
		<!-- association:配置一对一关联
			 property:绑定的用户属性
			 javaType:属性数据类型，支持别名
		-->
		<association property="user" javaType="com.itheima.mybatis.pojo.User">
			<id property="id" column="user_id"/>
			
			<result property="username" column="username"/>
			<result property="address" column="address"/>
			<result property="sex" column="sex"/>
		</association>
	</resultMap>
	<!-- 一对一关联查询-使用resultMap -->
	<select id="getOrderUser2" resultMap="order_user_map">
		SELECT
		  o.`id`,
		  o.`user_id`,
		  o.`number`,
		  o.`createtime`,
		  o.`note`,
		  u.`username`,
		  u.`address`,
		  u.`sex`
		FROM `order` o
		LEFT JOIN `user` u
		ON u.id = o.`user_id`
	</select>

```
###  一对多关联

`resultMap`  + `collection`

```xml
<!-- 一对多关联查询 -->
	<resultMap type="user" id="user_order_map">
		<id property="id" column="id" />
		<result property="username" column="username" />
		<result property="birthday" column="birthday" />
		<result property="address" column="address" />
		<result property="sex" column="sex" />
		<result property="uuid2" column="uuid2" />
		
		<!-- collection:配置一对多关系
			 property:用户下的order属性
			 ofType:property的数据类型，支持别名
		-->
		<collection property="orders" ofType="order">
			<!-- id标签用于绑定主键 -->
			<id property="id" column="oid"/>
			<!-- 使用result绑定普通字段 -->
			<result property="userId" column="id"/>
			<result property="number" column="number"/>
			<result property="createtime" column="createtime"/>
		</collection>

	</resultMap>
	<!-- 一对多关联查询 -->
	<select id="getUserOrder" resultMap="user_order_map">
		SELECT
		u.`id`,
		u.`username`,
		u.`birthday`,
		u.`sex`,
		u.`address`,
		u.`uuid2`,
		o.`id` oid,
		o.`number`,
		o.`createtime`
		FROM `user` u
		LEFT JOIN `order` o
		ON o.`user_id` = u.`id`
	</select>

```



## 注解

普通查询简单，使用resultMap时复杂 

```java
@Results(value = {
        @Result(id = true,property = "id",column = "id"),
        @Result(property = "name",column = "name"),
        @Result(property = "age",column = "age"),
        @Result(property = "list",column = "id",many = @Many(select = "com.illusory.demodao.mapper.UserMapper.findUserById")),
})
@Select(value = "select * from user")
List<User> queryAll();
```

## 各个属性的作用

 namespace属性 ：用于绑定dao接口的，即面向接口编程，将接口和xml文件对应起来。 `com.illusory.demodao.mapper.UserMapper`将被直接查找并且找到即用。

> 官方文档
>
> 这个命名可以直接映射到在命名空间中同名的 Mapper 类，并将已映射的 select 语句中的名字、参数和返回类型匹配成方法。这样你就可以像上面那样很容易地调用这个对应 Mapper 接口的方法。 
>
> **命名空间（Namespaces）**在之前版本的 MyBatis 中是可选的，这样容易引起混淆因此毫无益处。现在命名空间则是必须的，且意于简单地用更长的完全限定名来隔离语句。
>
> 命名空间使得你所见到的接口绑定成为可能，尽管你觉得这些东西未必用得上，你还是应该遵循这里的规定以防哪天你改变了主意。出于长远考虑，使用命名空间，并将它置于合适的 Java 包命名空间之下，你将拥有一份更加整洁的代码并提高了 MyBatis 的可用性。
>
> **命名解析：**为了减少输入量，MyBatis 对所有的命名配置元素（包括语句，结果映射，缓存等）使用了如下的命名解析规则。
>
> - 完全限定名（比如“com.mypackage.MyMapper.selectAllThings”）将被直接查找并且找到即用。
> - 短名称（比如“selectAllThings”）如果全局唯一也可以作为一个单独的引用。如果不唯一，有两个或两个以上的相同名称（比如“com.foo.selectAllThings ”和“com.bar.selectAllThings”），那么使用时就会收到错误报告说短名称是不唯一的，这种情况下就必须使用完全限定名。

Id属性：与接口中的方法对应。

[Mybatis官方文档](http://www.mybatis.org/mybatis-3/zh/index.html)

## 原理

* Resources 加载配置文件
  * XMLConfigBuilder Mybatis全局配置文件内容构建类
  * Configration 封装了配置信息

* SqlSessionFactoryBuilder 创建SqlSessionFactory

* DefaultSQLSessionFactory 是SqlSessionFactory的实现类

* SqlSessionFactory.openSession();  返回Sqlsession对象 包括Transaction 和Executor 

* Transaction 事务类
  * TransactionFactory 事务工厂

* Executor Mybatis执行器 （相当于JDBC中的statement）
  * SimpleExecutor 默认执行器

* DefaultSqlSession  SqlSession 实现类

* ExceptionFactory Mybatis异常工厂



1.Mybatis运行时需要先通过Resources加载全局配置文件。接着实例化SqlSessionFactoryBuilder 用于创建SqlSessionFactory接口实现类DefaultSqlSessionFactory 。

2.实例化SqlSessionFactoryBuilder 之前需要先创建XMLConfigBuilder 解析全局配置文件流，并把结果存放在Configration 中。接着传递给DefaultSqlSessionFactory 。到此SqlSessionFactory工厂创建成功。

3.由SQLSessionFactory创建SQLsession。

每次创建Sqlsession时，都需要由TransactionFactory 创建Transaction对象，同时还需要SqlSession的执行器Executor，最后实例化DefaultSQLSession传递给SqlSession接口。

4.然后根据项目需求使用SqlSession接口中的API完成具体的事务操作，如果事务执行失败，需要进行RollBack,回滚事务。如果事务执行成功则提交给数据库，关闭SqlSession.

over~

