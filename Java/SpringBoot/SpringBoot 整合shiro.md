## SpringBoot 整合shiro

## 1.shiro介绍

Shiro是Apache下的一个开源项目，我们称之为Apache Shiro。它是一个很易用与Java项目的的安全框架，提供了认证、授权、加密、会话管理，与spring Security 一样都是做一个权限的安全框架，但是与Spring Security 相比，在于 Shiro 使用了比较简单易懂易于使用的授权方式。shiro属于轻量级框架，相对于security简单的多，也没有security那么复杂。

## 2.基本功能

**Authentication：**身份认证/登录，验证用户是不是拥有相应的身份；

**Authorization：**授权，即权限验证，验证某个已认证的用户是否拥有某个权限；即判断用户是否能做事情，常见的如：验证某个用户是否拥有某个角色。或者细粒度的验证某个用户对某个资源是否具有某个权限；

**Session Manager：**会话管理，即用户登录后就是一次会话，在没有退出之前，它的所有信息都在会话中；会话可以是普通JavaSE环境的，也可以是如Web环境的；

**Cryptography：**加密，保护数据的安全性，如密码加密存储到数据库，而不是明文存储；

**Web Support：**Web支持，可以非常容易的集成到Web环境；

**Caching**：缓存，比如用户登录后，其用户信息、拥有的角色/权限不必每次去查，这样可以提高效率；

**Concurrency：**shiro支持多线程应用的并发验证，即如在一个线程中开启另一个线程，能把权限自动传播过去；

**Testing**：提供测试支持；

**Run As：**允许一个用户假装为另一个用户（如果他们允许）的身份进行访问；

**Remember Me：**记住我，这个是非常常见的功能，即一次登录后，下次再来的话不用登录了。

## 3.使用

### 3.1 依赖

pom.xml

```xml
        <!--shiro-->
        <dependency>
            <groupId>org.apache.shiro</groupId>
            <artifactId>shiro-spring</artifactId>
            <version>1.3.2</version>
        </dependency>
  		 <!--shiro-thymeleaf整合-->
        <dependency>
            <groupId>com.github.theborakompanioni</groupId>
            <artifactId>thymeleaf-extras-shiro</artifactId>
            <version>2.0.0</version>
        </dependency>
```



### 3.2 建表

一共有三个对象，User用户，Role角色，Permission权限。 将权限分配给角色，不同的角色拥有不同的权限，然后给用户分配不同的角色，这样就达到了权限管理的效果。



这里主要涉及到五张表:`用户表`,`角色表`(用户所拥有的角色),`权限表`(角色所涉及到的权限),`用户-角色表`(用户和角色是多对多的),`角色-权限表`(角色和权限是多对多的).表结构建立的sql语句如下:



```sql
--新建一个数据库
CREATE DATABASE shiro;
USE shiro;

--用户表
DROP TABLE IF EXISTS USER;
CREATE TABLE USER(
id INT PRIMARY KEY AUTO_INCREMENT,
NAME VARCHAR(4),
pwd VARCHAR(8) 
);
INSERT INTO USER VALUES(NULL,'张三','qwer'),(NULL,'李四','qwer');

--权限表
DROP TABLE IF EXISTS permission;
CREATE TABLE permission(
id INT PRIMARY KEY AUTO_INCREMENT,
permission VARCHAR(10)
);
INSERT INTO permission VALUES(NULL,'add'),
(NULL,'delete'),
(NULL,'update'),
(NULL,'query');

--角色表
DROP TABLE IF EXISTS role;
CREATE TABLE role(
id INT PRIMARY KEY AUTO_INCREMENT,
NAME VARCHAR(10));
INSERT INTO role VALUES(NULL,'admin'),(NULL,'customer');

-- 权限-角色表

DROP TABLE IF EXISTS permission_role;
CREATE TABLE permission_role(
pid INT(3),
CONSTRAINT  fk_permission FOREIGN KEY(pid) REFERENCES permission(id),
rid INT(3),
CONSTRAINT  fk_role FOREIGN KEY(rid) REFERENCES role(id)
);
--管理员有4个权限 用户只有查询权限
INSERT INTO permission_role VALUES(1,1),(2,1),(3,1),(4,1),(4,2);
-- 用户-角色表
DROP TABLE IF EXISTS user_role;
CREATE TABLE user_role(
uid INT(3),
CONSTRAINT  fk_user FOREIGN KEY(uid) REFERENCES USER(id),
rid INT(3),
CONSTRAINT  fk_roles FOREIGN KEY(rid) REFERENCES role(id)
);
-- 张三为管理员 李四为用户
INSERT INTO user_role VALUES(1,1),(2,2);
```

### 3.3 实体类

User

```java
public class User {
    private Integer uid;
    private String uname;
    private String upwd;
    private Set<Role> roles=new HashSet<>();
    //getter/setter
}
```

Role

```java
public class Role {
    private Integer rid;
    private String rname;
    private Set<User> users=new HashSet<>();
    private Set<Permission> permissions=new HashSet<>();
}
```

Permission

```java
public class Permission {
    private Integer pid;
    private String permission;
    private Set<Role> roles=new HashSet<>();
}
```

### 3.4 mapper

UserMapper.java

```java
public interface UserMapper {
    User findUserByName(String name);
     List<String> selectPermissionByUserId(Integer id);
}
```

UserMapper.xml

```xml
<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.shiro.mapper.UserMapper">
    <resultMap type="User" id="userMap">
        <id property="uid" column="id" />
        <result property="uname" column="name" />
        <result property="upwd" column="pwd" />
        <collection property="roles" ofType="Role">
            <id property="rid" column="id" />
            <result property="rname" column="name" />
            <collection property="permissions" ofType="Permission">
                <id property="pid" column="id" />
                <result property="permission" column="permission" />
            </collection>
        </collection>
    </resultMap>
    <select id="findUserByName" parameterType="string" resultMap="userMap">
        SELECT u.*,r.*,p.*
        FROM USER u
                 INNER JOIN user_role ur ON ur.uid = u.id
                 INNER JOIN role r ON r.id = ur.rid
                 INNER JOIN permission_role pr ON pr.rid = r.id
                 INNER JOIN permission p ON pr.pid = p.id
        WHERE u.name = #{name};
    </select>
    <select id="selectPermissionByUserId" parameterType="integer" resultType="string">
SELECT permission FROM permission p INNER JOIN permission_role pr ON p.id=pr.pid
INNER JOIN user_role ur ON ur.rid=pr.rid
WHERE ur.uid=#{id}
    </select>
</mapper>
```

### 3.5 Service

UserService.java

```java
public interface UserService {
    User findUserByName(String name);
    List<String> selectPermissionByUserId(Integer id);
}
```

UserServiceImpl.java

```java
@Service
public class UserServiceImpl implements UserService {
    @Autowired
    private UserMapper userMapper;

    @Override
    public User findUserByName(String name) {
        return userMapper.findUserByName(name);
    }
       @Override
    public List<String> selectPermissionByUserId(Integer id) {
        return userMapper.selectPermissionByUserId(id);
    }
}
```

紧接着就是重点啦!我们需要在spring-boot-shiro-web工程下面建立两个类,这也是shiro中唯一需要程序员编写的两个类:

类AuthRealm完成根据用户名去数据库的查询,并且将用户信息放入shiro中,供第二个类调用.

CredentialsMatcher,完成对于密码的校验.其中用户的信息来自shiro

### 3.6 AuthRealm

```java
public class AuthRealm extends AuthorizingRealm {
    @Autowired
    private UserServiceImpl userService;

    /**
     * 授权
     *
     * @param principalCollection
     * @return
     */
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principalCollection) {
        //获取session中的用户
        User user = (User) principalCollection.fromRealm(this.getClass().getName()).iterator().next();
        //查询权限
        List<String> strings = userService.selectPermissionByUserId(user.getUid());
        SimpleAuthorizationInfo simpleAuthorizationInfo = new SimpleAuthorizationInfo();
        //将权限放入shiro中.
        simpleAuthorizationInfo.addStringPermissions(strings);
//        System.out.println("添加时的权限" + permission.toString());
        return simpleAuthorizationInfo;
    }

    /**
     * 认证 登陆
     *
     * @param authenticationToken
     * @return
     * @throws AuthenticationException
     */
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken authenticationToken) throws AuthenticationException {
        //用户输入的token
        UsernamePasswordToken usernamePasswordToken = (UsernamePasswordToken) authenticationToken;
        String username = usernamePasswordToken.getUsername();
        User user = userService.findUserByName(username);
        System.out.println("认证：" + user.toString());
        Set<Role> roles = user.getRoles();
        for (Role r : roles ) {
            Set<Permission> permissions = r.getPermissions();
            for (Permission p : permissions) {
                String permission = p.getPermission();
                System.out.println("权限--》" + permission);
            }
        }
        //放入shiro.调用CredentialsMatcher检验密码
        return new SimpleAuthenticationInfo(user, user.getUpwd(), this.getClass().getName());
    }
}
```

授权的方法是在碰到`<shiro:hasPermission>`标签的时候调用的,它会去检测shiro框架中的权限(这里的permissions)是否包含有该标签的name值,如果有,里面的内容显示,如果没有,里面的内容不予显示(这就完成了对于权限的认证.)

### 3.7 CredentialsMatcher

```java
public class CredentialsMatcher extends SimpleCredentialsMatcher {
    @Override
    public boolean doCredentialsMatch(AuthenticationToken token, AuthenticationInfo info) {
        //强转 获取token
        UsernamePasswordToken usernamePasswordToken = (UsernamePasswordToken) token;
        //获取用户输入的密码
        char[] password = usernamePasswordToken.getPassword();
        String inputPassword = new String(password);
        //获取数据库中的密码
        String realPassword = (String) info.getCredentials();
        //对比
        return this.equals(inputPassword, realPassword);
    }
}
```

　接着就是shiro的配置类了,需要注意一点filterChainDefinitionMap必须是LinkedHashMap因为它必须保证有序:

### 3.8 shiro配置

需要手动导入包`import org.apache.shiro.mgt.SecurityManager;`,不然默认会导入`java.lang.SecurityManager`包

```java
/**
 * shiro的配置类
 *
 * @author Administrator
 */
@Configuration
public class ShiroConfiguration {
 //配置shiro-thymeleaf该方言标签：
@Bean(name = "shiroDialect")
public ShiroDialect shiroDialect() {
    return new ShiroDialect();
}
    
    @Bean(name = "shiroFilter")
    public ShiroFilterFactoryBean shiroFilter(@Qualifier("securityManager") SecurityManager manager) {
        ShiroFilterFactoryBean bean = new ShiroFilterFactoryBean();
        bean.setSecurityManager(manager);
        //配置登录的url和登录成功的url
        bean.setLoginUrl("/login");
        bean.setSuccessUrl("/index");
        //配置访问权限
        LinkedHashMap<String, String> filterChainDefinitionMap = new LinkedHashMap<>();
        filterChainDefinitionMap.put("/login.*", "anon"); //表示可以匿名访问
        filterChainDefinitionMap.put("/logout*", "anon");
        filterChainDefinitionMap.put("/index.*", "authc");
        filterChainDefinitionMap.put("/*", "authc");//表示需要认证才可以访问
        filterChainDefinitionMap.put("/**", "authc");//表示需要认证才可以访问
        filterChainDefinitionMap.put("/*.*", "authc");
        bean.setFilterChainDefinitionMap(filterChainDefinitionMap);
        return bean;
    }

    //配置核心安全事务管理器
    @Bean(name = "securityManager")
    public SecurityManager securityManager(@Qualifier("authRealm") AuthRealm authRealm) {
        System.err.println("--------------shiro已经加载----------------");
        DefaultWebSecurityManager manager = new DefaultWebSecurityManager();
        manager.setRealm(authRealm);
        return manager;
    }

    //配置自定义的权限登录器
    @Bean(name = "authRealm")
    public AuthRealm authRealm(@Qualifier("credentialsMatcher") CredentialsMatcher matcher) {
        AuthRealm authRealm = new AuthRealm();
        authRealm.setCredentialsMatcher(matcher);
        return authRealm;
    }

    //配置自定义的密码比较器
    @Bean(name = "credentialsMatcher")
    public CredentialsMatcher credentialsMatcher() {
        return new CredentialsMatcher();
    }

    @Bean
    public LifecycleBeanPostProcessor lifecycleBeanPostProcessor() {
        return new LifecycleBeanPostProcessor();
    }

    @Bean
    public DefaultAdvisorAutoProxyCreator defaultAdvisorAutoProxyCreator() {
        DefaultAdvisorAutoProxyCreator creator = new DefaultAdvisorAutoProxyCreator();
        creator.setProxyTargetClass(true);
        return creator;
    }

    @Bean
    public AuthorizationAttributeSourceAdvisor authorizationAttributeSourceAdvisor(@Qualifier("securityManager") SecurityManager manager) {
        AuthorizationAttributeSourceAdvisor advisor = new AuthorizationAttributeSourceAdvisor();
        advisor.setSecurityManager(manager);
        return advisor;
    }
}
```

这样,shiro的配置就完成了!紧接着建立页面.login.jsp用于用户登录,index.jsp是用户主页,在没有登录的情况下是进不去的.

### 3.9 页面

没登录不让进index.html

login.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>用户登陆</title>
</head>
<body>
<form>
    用户名:<input type="text" name="uname"><br/>
    密码:<input type="password" name="upwd"><br/>
    <input type="submit" value="登陆"><br/>
</form>
</body>
</html>
```

index.html

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org"
      xmlns:shiro="http://www.pollix.at/thymeleaf/shiro">

<head>
    <meta charset="UTF-8">
    <title>首页</title>
</head>
<body>
欢迎您，<span th:text="${user.uname}"></span>
<div>
    <p shiro:hasPermission="add">添加用户</p>
    <p shiro:hasPermission="delete">删除用户</p>
    <p shiro:hasPermission="update">更新用户</p>
    <p shiro:hasPermission="query">查询用户</p>
</div>
<a th:href="@{logout}">点我注销</a>
</body>
</html>
```

OK,紧接着就是建立LoginController去测试结果了!这里需要注意,我们和shiro框架的交互完全通过Subject这个类去交互,用它完成登录,注销,获取当前的用户对象等操作

### 3.10 controller

```java
@Controller
public class UserController {
    @Autowired
    private UserServiceImpl userService;

    @RequestMapping(value = "/login")
    public String login(HttpServletRequest request, String name, String pwd, boolean rememberMe) {
        UsernamePasswordToken usernamePasswordToken = new UsernamePasswordToken(name, pwd, rememberMe);
        Subject subject = SecurityUtils.getSubject();
        try {
            //登录
            subject.login(usernamePasswordToken);
            User user = (User) subject.getPrincipal();
            request.getSession().setAttribute("user", user);
            return "index";
        } catch (AuthenticationException e) {
            return "login";
        }
    }

    @RequestMapping(value = "/logout")
    public String logout(HttpServletRequest request) {
        Subject subject = SecurityUtils.getSubject();
        subject.logout();
        request.getSession().removeAttribute("user");
        return "login";
    }


    @RequestMapping(value = "/{page}")
    private String show(@PathVariable("page") String page) {
        return page;
    }
}
```

## 4. Thymeleaf引入shiro标签

### 4.1 引入thymeleaf-extras-shiro

在pom中引入：

```xml
<dependency>
    <groupId>com.github.theborakompanioni</groupId>
    <artifactId>thymeleaf-extras-shiro</artifactId>
    <version>2.0.0</version>
</dependency>
```

### 4.2 Shiro配置文件修改

引入依赖后，需要在ShiroConfig中配置该方言标签：

```java
 @Bean
public ShiroDialect shiroDialect() {
    return new ShiroDialect();
}
```

### 4.3 使用

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org"
      xmlns:shiro="http://www.pollix.at/thymeleaf/shiro">

<head>
    <meta charset="UTF-8">
    <title>首页</title>
</head>
<body>
欢迎您，<span th:text="${user.uname}"></span>
<div>
    <p shiro:hasPermission="add">添加用户</p>
    <p shiro:hasPermission="delete">删除用户</p>
    <p shiro:hasPermission="update">更新用户</p>
    <p shiro:hasPermission="query">查询用户</p>
</div>
<a th:href="@{logout}">点我注销</a>
</body>
</html>
```

参考：https://mrbird.cc/Spring-Boot-Themeleaf%20Shiro%20tag.html

第三方库：https://github.com/theborakompanioni/thymeleaf-extras-shiro

## 5. 缓存

EhCache





##  问题

1.controller层获取不到页面传过来的值（username,pwd等）

原因：springmvc的自动绑定参数要求前台请求参数和controller层的方法的参数名字要一样。如果是对象属性自动绑定时，那么前台的参数一定要是对象的某个属性。在这里，前台的parm参数，与后台的参数不一致，或者不是后台对象的属性。在前台我看到你用json格式化对象得到parm，这样传到后台是不能识别的。

2.异常处理

DisabledAccountException（禁用的帐号）、

LockedAccountException（锁定的帐号）、

UnknownAccountException（错误的帐号）、

ExcessiveAttemptsException（登录失败次数过多）、

IncorrectCredentialsException （错误的凭证）、

ExpiredCredentialsException（过期的凭证）

模糊处理 账户或 密码错误。

3.权限管理

编程式

注解式

shiro标签