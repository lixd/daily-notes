# SpringBoot整合持久层

## 1. 创建项目

创建的时候选上web、MySQL模块 ，需要添加mybatis，mysql,thymeleaf,druid等依赖

pom.xml如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.1.1.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.example</groupId>
    <artifactId>demodao</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>demodao</name>
    <description>Demo project for Spring Boot</description>

    <properties>
        <java.version>1.8</java.version>
    </properties>

    <dependencies>
        <!--springboot启动器-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jdbc</artifactId>
        </dependency>
        <!--thymeleaf模板-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-thymeleaf</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <!--mybatis-->
        <dependency>
            <groupId>org.mybatis.spring.boot</groupId>
            <artifactId>mybatis-spring-boot-starter</artifactId>
            <version>1.3.2</version>
        </dependency>
        <!--mysql链接-->
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>8.0.13</version>
        </dependency>
        <!--数据源druid -->
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>druid</artifactId>
            <version>1.1.12</version>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>

        <!--解决Intellij构建项目时，target/classes目录下不存在mapper.xml文件-->
        <resources>
            <resource>
                <directory>${basedir}/src/main/java</directory>
                <includes>
                    <include>**/*.xml</include>
                </includes>
            </resource>
        </resources>
    </build>

</project>
```

## 2. 创建数据库

```sql
CREATE DATABASE hello;
USE hello;
CREATE TABLE users(
uid INT(5)  AUTO_INCREMENT,
uname VARCHAR(20),
uage INT(3),
PRIMARY KEY(uid)
);
INSERT INTO users VALUES(NULL,'zhangsan',11),(NULL,'lisi',22),(NULL,'wangwu',33);
#简单创建一张表
```

## 3. dao

UserMapper.java

```java
/**
 * Mapper
 */
public interface UserMapper {
    void addUser(User user);
    List<User> queryAll();
    User findUserById(Integer id);
    void updateUser(User user);
    void deleteUserById(Integer id);
}
```

UserMapper.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.illusory.demodao.mapper.UserMapper">
    <insert id="addUser" parameterType="user">
        insert into users(uname, uage)
        values (#{uname}, #{uage})
    </insert>
    <select id="queryAll" resultType="user">
        select *
        from users
    </select>
    <select id="findUserById" resultType="user">
        select *
        from users where uid=#{id}
    </select>
    <update id="updateUser" parameterType="user">
        update users set uage=#{uage},uname=#{uname} where uid=#{uid}
    </update>
    <delete id="deleteUserById" parameterType="int">
        delete from users where uid=#{id}
    </delete>
</mapper>
```

## 4. Service

UserService.java

```java
/**
 * Service
 */
public interface UserService {
    void addUser(User user);
    List<User> queryAll();
    User findUserById(Integer id);
    void updateUser(User user);
    void deleteUserById(Integer id);
}
```

UserServiceImpl.java

```java
@Service
@Transactional //事务
public class UserService implements com.illusory.demodao.service.UserService {
    @Resource
    private UserMapper userMapper;

    /**
     * 添加用户
     *
     * @param user
     */
    @Override
    public void addUser(User user) {
        userMapper.addUser(user);
    }

    /**
     * 查询所有用户
     *
     * @return
     */
    @Override
    public List<User> queryAll() {
        return userMapper.queryAll();
    }

    /**
     * 根据Id查询用户
     *
     * @param id
     * @return
     */
    @Override
    public User findUserById(Integer id) {
        return userMapper.findUserById(id);
    }

    /**
     * 更新用户
     *
     * @param user
     */
    @Override
    public void updateUser(User user) {
        userMapper.updateUser(user);
    }

    /**
     * 根据ID删除用户
     *
     * @param id
     */
    @Override
    public void deleteUserById(Integer id) {
        userMapper.deleteUserById(id);
    }
}
```

## 5. controller

UserController.java

```java
@Controller
@RequestMapping("/user")
public class UserController {
    @Resource
    private UserService userService;

    /**
     * 添加用户
     *
     * @param user user
     * @return
     */
    @RequestMapping("/addUser") //user/addUser
    public String addUser(User user) {
        userService.addUser(user);
        return "redirect:/user/findAll";
    }

    /**
     * 页面跳转
     *
     * @param page
     * @return
     */
    @RequestMapping("/{page}")
    public String show(@PathVariable("page") String page) {
        return page;
    }

    /**
     * 查询所有用户
     *
     * @param mav ModelAndView
     * @return
     */
    @RequestMapping("/queryAll")
    public ModelAndView queryAll(ModelAndView mav) {
        List<User> users = userService.queryAll();
        mav.addObject("list", users);
        mav.setViewName("userList");
        return mav;
    }

    /**
     * 根据Id查询用户
     *
     * @param id    id
     * @param model
     * @return
     */
    @RequestMapping("/findUserById")
    public String findUserById(Integer id, Model model) {
        User user = userService.findUserById(id);
        model.addAttribute("user", user);
        return "editUser";
    }

    /**
     * 编辑用户
     *
     * @param user  user
     * @param model
     * @return
     */
    @RequestMapping("/editUser")
    public String editUser(User user, Model model) {
        userService.updateUser(user);
        //重定向到查询界面
        return "redirect:/user/findAll";
    }

    /**
     * 根据Id删除用户
     *
     * @param id
     * @return
     */
    @RequestMapping("/deleteUserById")
    public String editUser(Integer id) {
        userService.deleteUserById(id);
        return "redirect:/user/findAll";
    }
}
```

## 6. 全局配置文件

application.properties

```properties
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.username=root
spring.datasource.password=root
spring.datasource.url=jdbc:mysql://localhost:3306/dao?useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC
#?useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC 设置编码和时区 不让会报异常java.sql.SQLException
spring.datasource.type=com.alibaba.druid.pool.DruidDataSource
    mybatis.type-aliases-package=com.illusory.demodao.pojo
mybatis.mapper-locations=classpath:mapper/*.xml
```

## 7. 遇到的问题

**1.数据库时区异常** java.sql.SQLException

```java
java.sql.SQLException: The server time zone value 'ÖÐ¹ú±ê×¼Ê±¼ä' is unrecognized or represents more than one time zone. You must configure either the server or JDC driver (via the serverTimezone configuration property) to use a more specifc time zone value if you want to utilize time zone support.
//解决方式
spring.datasource.url=jdbc:mysql://localhost:3306/dao?useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC
设置编码和时区 不让会报异常java.sql.SQLException
```

**2.Intellij构建项目时，target/classes目录下不存在mapper.xml文件**

```xml
  <build>
  <resources>
        <resource>
            <directory>${basedir}/src/main/java</directory>
            <includes>
                <include>**/*.xml</include>
            </includes>
        </resource>
    </resources>
</build>
```
```html
Thymeleaf头文件
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:th="http://www.thymeleaf.org">
```

```xml
mapper.xml头文件
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper>
</mapper>
```

```xml
    <resources>
        <resource>
            <directory>src/main/java</directory>
            <excludes>
                <exclude>**/*.java</exclude>
            </excludes>
        </resource>
        <resource>
            <directory>src/main/resources</directory>
            <includes>
                <include>**/*.*</include>
            </includes>
        </resource>
    </resources>
```

