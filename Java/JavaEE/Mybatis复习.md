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

* SQLSessionFactoryBuilder 创建SQLSessionFactory

* DefaultSQLSessionFactory 是SQLSessionFactory的实现类

* SQLSessionFactory.openSession();  返回SQLsession对象 包括Transaction 和Executor 

* Transaction 事务类
  * Transaction Factory 事务工厂

* Executor Mybatis执行器 （相当于JDBC中的statement）
  * SimpleExecutor 默认执行器

* DefaultSQLSession  SQLSession 实现类

* ExceptionFactory Mybatis异常工厂







