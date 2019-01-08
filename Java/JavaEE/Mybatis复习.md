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



1.Mybatis运行时需要先通过Resources加载全局配置文件。接着实例化SQLSessionFactoryBuilder 用于创建SQLSessionFactory接口实现类DefaultSQLSessionFactory 。

2.实例化SQLSessionFactoryBuilder 之前需要先创建XMLConfigBuilder 解析全局配置文件流，并把结果存放在Configration 中。接着传递给DefaultSQLSessionFactory 。到此SQLSessionFactory工厂创建成功。

3.由SQLSessionFactory创建SQLsession。

每次创建SQLsession时，都需要由TransactionFactory 创建Transaction对象，同时还需要SqlSession的执行器Executor，最后实例化DefaultSQLSession传递给SqlSession接口。

4.然后根据项目需求使用SqlSession接口中的API完成具体的事务操作，如果事务执行失败，需要进行RollBack,回滚事务。如果事务执行成功则提交给数据库，关闭SqlSession.

over~



