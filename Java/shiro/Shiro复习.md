# Shiro复习

## 1. RBAC权限控制

RBAC：Role-Based Access Control 基于角色的访问控制

### 1.1 RBAC1.0

用户表 角色表 菜单表(权限表)  和两个中间表 用户-角色表 角色-菜单表。

菜单表中存放所有的功能，角色表中设置多种角色(职位)，权限赋给角色，然后在将角色关联到用户上，这样就不用给每个用户都赋值权限了。

![]()

### 1.2 RBAC2.0

随着项目的扩大，人数特别特别多了，给每个用户赋角色都很麻烦，然后又添加了一个`用户组表`,对用户进行分组，如果角色也特别特别多，那么在加一个`角色组表`，用户组与用户管理，角色组与角色关联，最后用户组再与角色组关联。

![]()



## 2.Shiro

### 2.1 简介

Java中安全管理框架有`spring security`和`shiro`，其中`spring security`依赖于`spring`，且比较复杂，学习曲线比较该，`shiro`比较简单且独立，java se单机环境都可以使用。、

### 2.2 各种名词

**Shiro是一个强大易用的Java安全框架,提供了认证、授权、加密和会话管理等功能**。

* **Authentication**：身份认证/登录，验证用户是不是拥有相应的身份；

* **Authorization**：授权，即权限验证，验证某个已认证的用户是否拥有某个权限；即判断用户是否能做事情，常见的如：验证某个用户是否拥有某个角色。或者细粒度的验证某个用户对某个资源是否具有某个权限；

* **Session Manager**：会话管理，即用户登录后就是一次会话，在没有退出之前，它的所有信息都在会话中；会话可以是普通JavaSE环境的，也可以是如Web环境的；

* **Cryptography**：加密，保护数据的安全性，如密码加密存储到数据库，而不是明文存储；

* **Web Support**：Web支持，可以非常容易的集成到Web环境；

* **Caching**：缓存，比如用户登录后，其用户信息、拥有的角色/权限不必每次去查，这样可以提高效率；

* **Concurrency**：shiro支持多线程应用的并发验证，即如在一个线程中开启另一个线程，能把权限自动传播过去；

* **Testing**：提供测试支持；

* **Run As**：允许一个用户假装为另一个用户（如果他们允许）的身份进行访问；

* **Remember Me**：记住我，这个是非常常见的功能，即一次登录后，下次再来的话不用登录了。

**记住一点，Shiro不会去维护用户、维护权限；这些需要我们自己去设计提供；然后通过相应的接口注入给Shiro即可**。







可以看到：应用代码直接交互的对象是Subject，也就是说Shiro的对外API核心就是Subject；其每个API的含义：

* **Subject**：主体，代表了当前“用户”，这个用户不一定是一个具体的人，与当前应用交互的任何东西都是Subject，如网络爬虫，机器人等；即一个抽象概念；所有Subject都绑定到SecurityManager，与Subject的所有交互都会委托给SecurityManager；可以把Subject认为是一个门面；SecurityManager才是实际的执行者；

* **SecurityManager**：安全管理器；即所有与安全有关的操作都会与SecurityManager交互；且它管理着所有Subject；可以看出它是Shiro的核心，它负责与后边介绍的其他组件进行交互，如果学习过SpringMVC，你可以把它看成DispatcherServlet前端控制器；

* **Realm**：域，Shiro从从Realm获取安全数据（如用户、角色、权限），就是说SecurityManager要验证用户身份，那么它需要从Realm获取相应的用户进行比较以确定用户身份是否合法；也需要从Realm得到用户相应的角色/权限进行验证用户是否能进行操作；可以把Realm看成DataSource，即安全数据源。



### 2.3 具体架构

* **Subject**：主体，可以看到主体可以是任何可以与应用交互的“用户”；
* **SecurityManager**：相当于SpringMVC中的DispatcherServlet或者Struts2中的FilterDispatcher；是Shiro的心脏；所有具体的交互都通过SecurityManager进行控制；它管理着所有Subject、且负责进行认证和授权、及会话、缓存的管理。
* **Authenticator**：认证器，负责主体认证的，这是一个扩展点，如果用户觉得Shiro默认的不好，可以自定义实现；其需要认证策略（Authentication Strategy），即什么情况下算用户认证通过了；
* **Authrizer**：授权器，或者访问控制器，用来决定主体是否有权限进行相应的操作；即控制着用户能访问应用中的哪些功能；
* **Realm**：可以有1个或多个Realm，可以认为是安全实体数据源，即用于获取安全实体的；可以是JDBC实现，也可以是LDAP实现，或者内存实现等等；由用户提供；注意：Shiro不知道你的用户/权限存储在哪及以何种格式存储；所以我们一般在应用中都需要实现自己的Realm；
* **SessionManager**：如果写过Servlet就应该知道Session的概念，Session呢需要有人去管理它的生命周期，这个组件就是SessionManager；而Shiro并不仅仅可以用在Web环境，也可以用在如普通的JavaSE环境、EJB等环境；所有呢，Shiro就抽象了一个自己的Session来管理主体与应用之间交互的数据；这样的话，比如我们在Web环境用，刚开始是一台Web服务器；接着又上了台EJB服务器；这时想把两台服务器的会话数据放到一个地方，这个时候就可以实现自己的分布式会话（如把数据放到Memcached服务器）；
* **SessionDAO**：DAO大家都用过，数据访问对象，用于会话的CRUD，比如我们想把Session保存到数据库，那么可以实现自己的SessionDAO，通过如JDBC写到数据库；比如想把Session放到Memcached中，可以实现自己的Memcached SessionDAO；另外SessionDAO中可以使用Cache进行缓存，以提高性能；
* **CacheManager**：缓存控制器，来管理如用户、角色、权限等的缓存的；因为这些数据基本上很少去改变，放到缓存中后可以提高访问的性能
* **Cryptography**：密码模块，Shiro提高了一些常见的加密组件用于如密码加密/解密的。

## 3. Authentication 用户认证

### 3.1 身份和凭证

![]()

需要提供身份和凭证给shiro。

Princirpals：用户身份信息，是Subject标识信息，能够标识唯一subject。如电话、邮箱、身份证号码等。

Credentials: 凭证，就是密码，是只被subject知道的秘密值，可以是密码也可以是数字证书等。

Princirpals/Credentials的常见组合：账号+密码。在shiro中使用UsernamePasswordToken来指定身份信息和凭证。

### 3.2 认证流程

![]()



* 1.把用户输入的账号密码封装成Token给Subject
* 2.Subject把Token给SecurityManager
* 3.SecurityManager调用Authenticator认证器
* 4.Authenticator根据配置的AuthenticationStrategy策略去调用Realms获取相对应的数据
* 5.最后返回认证结果

代码如下：
controller 获取用户输入的账号密码 然后交给Subject去登录

```java
    @RequestMapping(value = "/login")
    public String login(HttpServletRequest request,User inuser,String uname,String upwd) {
        System.out.println("用户名和密码是" + uname + upwd + " User-->" + inuser.toString());
        UsernamePasswordToken usernamePasswordToken = new UsernamePasswordToken(uname,upwd);
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
```

根据前面的步骤，Subject获取到Token后会交给SecurityManager，最后Authenticator去Realms中获取数据进行登录认证。

Realm如下：

```java
public class AuthRealmTest extends AuthorizingRealm {
    @Autowired
    private UserService userService;

    /**
     * 授权
     *
     * @param principalCollection
     * @return
     */
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principalCollection) {
        //1.获取session中的用户
        User user = (User) principalCollection.fromRealm(this.getClass().getName()).iterator().next();

        //2.去数据库查询当前user的权限
        List<String> strings = userService.selectPermissionByUserId(user.getUid());

        //3.将权限放入shiro中.
        SimpleAuthorizationInfo simpleAuthorizationInfo = new SimpleAuthorizationInfo();
        simpleAuthorizationInfo.addStringPermissions(strings);
        //4.返回授权信息AuthorizationInfo
        return simpleAuthorizationInfo;
    }

    /**
     * 登录认证
     *
     * @param authenticationToken
     * @return
     * @throws AuthenticationException ex
     *                                 密码校验在{@link CredentialsMatcherTest#doCredentialsMatch(AuthenticationToken, AuthenticationInfo)}
     */
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken authenticationToken) throws AuthenticationException {
        //1.将用户输入的token 就是authenticationToken强转为UsernamePasswordToken
        UsernamePasswordToken usernamePasswordToken = (UsernamePasswordToken) authenticationToken;
        //2.获取用户名
        String username = usernamePasswordToken.getUsername();
        //3.数据库中查询出user对象
        User user = userService.findUserByName(username);
        //4.查询出这个user的权限
        Set<Role> roles = user.getRoles();
        for (Role r : roles) {
            Set<Permission> permissions = r.getPermissions();
            for (Permission p : permissions) {
                String permission = p.getPermission();
                System.out.println("权限--》" + permission);
            }
        }
        //5.返回认证信息AuthenticationInfo 这里是没进行密码校验的 密码校验在CredentialsMatcherTest类中
        return new SimpleAuthenticationInfo(user, user.getUpwd(), this.getClass().getName());
    }
}

```
其中 `doGetAuthenticationInfo`方法中的Token就是用户前面输入的账号密码，我们还需要些一个类用来校验密码：

```java
/**
 * 密码校验类
 */
public class CredentialsMatcherTest extends SimpleCredentialsMatcher {
    /**
     * 校验密码
     *
     * @param token
     * @param info
     * @return 密码校验结果
     * {@link AuthRealmTest#doGetAuthenticationInfo(AuthenticationToken)}
     */
    @Override
    public boolean doCredentialsMatch(AuthenticationToken token, AuthenticationInfo info) {
        //1.强转
        UsernamePasswordToken usernamePasswordToken = (UsernamePasswordToken) token;
        //2.获取用户输入的密码
        char[] password = usernamePasswordToken.getPassword();
        String pwd = new String(password);
        //3.获取数据库中的真实密码
        //这个info就是前面AuthRealmTest类中的doGetAuthenticationInfo返回的info
        String relPwd = (String) info.getCredentials();
        //4.返回校验结果
        return this.equals(pwd, relPwd);

    }
}
```

到这里就算是认证成功了，但是还没有授权。

### 3.3 小结

认证流程：

1.用户输入账号密码，controller中调subject.login去认证

2.认证方法就是自定义realm中的doGetAuthenticationInfo

3.认证过程中需要校验密码，就是自定义的CredentialsMatcherTest

## 3.Realm

Realm是一个接口，在接口中定义了token获得认证信息的方法，Shiro内实现了一系列的realm，这些不同的realm提供了不同的功能，`AuthenticatingRealm`实现了获取身份信息的功能，`AuthorizingRealm`实现了获取权限信息的功能且继承了`AuthenticatingRealm`,自定义realm时要继承`AuthorizingRealm`,这样既可以提供身份认证的自定义方法，也可以实现授权的自定义方法。
**shiro只实现了功能，并不维护数据**，所以自定义realm中也只是从数据库中查询数据然后和用户输入进行对比，其中密码校验是单独的
自定义realm代码如下：

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
        System.out.println("-------------授权-------------");
        return simpleAuthorizationInfo;
    }

    /**
     * 完成身份认证并返回认证信息
     * 认证失败则返回空
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
        //放入shiro.调用CredentialsMatcher检验密码
        System.out.println("获取到的密码" + user.getUpwd());
//        ByteSource salt = ByteSource.Util.bytes(user.getSalt());
//        System.out.println(salt);
        return new SimpleAuthenticationInfo(user, user.getUpwd(),this.getClass().getName());
    }
}
```

自定义密码校验

```java
public class CredentialsMatcher extends SimpleCredentialsMatcher {
    @Override
    public boolean doCredentialsMatch(AuthenticationToken token, AuthenticationInfo info) {
        //强转 获取token
        UsernamePasswordToken usernamePasswordToken = (UsernamePasswordToken) token;
        //获取用户输入的密码
        char[] password = usernamePasswordToken.getPassword();
        String inputPassword = new String(password);
//        Md5Hash md5Hash = new Md5Hash(inputPassword);
        //获取数据库中的密码
        String realPassword = (String) info.getCredentials();
        System.out.println("输入的密码"+inputPassword);
        System.out.println("数据库中的密码"+realPassword);
        //对比
        return this.equals(inputPassword, realPassword);
    }
}
```

配置如下：

```java
    //配置核心安全事务管理器
    @Bean(name = "securityManager")
    public SecurityManager securityManager(@Qualifier("authRealm") AuthRealm authRealm, @Qualifier("authRealm2") AuthRealm authRealm2) {
        System.err.println("----------------------------shiro已经加载---------------------------");
        DefaultWebSecurityManager manager = new DefaultWebSecurityManager();
        //配置两个测试一下认证策略AllSuccessfulStrategy
        manager.setRealm(authRealm);
        manager.setRealm(authRealm2);
        manager.setSessionManager(sessionManager());
//        manager.setCacheManager(ehCacheManager);
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

```

## 4.Realm

Realm是一个接口，在接口中定义了token获得认证信息的方法，Shiro内实现了一系列的realm，这些不同的realm提供了不同的功能，`AuthenticatingRealm`实现了获取身份信息的功能，`AuthorizingRealm`实现了获取权限信息的功能且继承了`AuthenticatingRealm`,自定义realm时要继承`AuthorizingRealm`,这样既可以提供身份认证的自定义方法，也可以实现授权的自定义方法。
**shiro只实现了功能，并不维护数据**，所以自定义realm中也只是从数据库中查询数据然后和用户输入进行对比，其中密码校验是单独的
自定义realm代码如下：

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
        System.out.println("-------------授权-------------");
        return simpleAuthorizationInfo;
    }

    /**
     * 完成身份认证并返回认证信息
     * 认证失败则返回空
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
        //放入shiro.调用CredentialsMatcher检验密码
        System.out.println("获取到的密码" + user.getUpwd());
//        ByteSource salt = ByteSource.Util.bytes(user.getSalt());
//        System.out.println(salt);
        return new SimpleAuthenticationInfo(user, user.getUpwd(),this.getClass().getName());
    }
}
```

自定义密码校验

```java
public class CredentialsMatcher extends SimpleCredentialsMatcher {
    @Override
    public boolean doCredentialsMatch(AuthenticationToken token, AuthenticationInfo info) {
        //强转 获取token
        UsernamePasswordToken usernamePasswordToken = (UsernamePasswordToken) token;
        //获取用户输入的密码
        char[] password = usernamePasswordToken.getPassword();
        String inputPassword = new String(password);
//        Md5Hash md5Hash = new Md5Hash(inputPassword);
        //获取数据库中的密码
        String realPassword = (String) info.getCredentials();
        System.out.println("输入的密码"+inputPassword);
        System.out.println("数据库中的密码"+realPassword);
        //对比
        return this.equals(inputPassword, realPassword);
    }
}
```

配置如下：

```java
    //配置核心安全事务管理器
    @Bean(name = "securityManager")
    public SecurityManager securityManager(@Qualifier("authRealm") AuthRealm authRealm, @Qualifier("authRealm2") AuthRealm authRealm2) {
        System.err.println("----------------------------shiro已经加载---------------------------");
        DefaultWebSecurityManager manager = new DefaultWebSecurityManager();
        //配置两个测试一下认证策略AllSuccessfulStrategy
        manager.setRealm(authRealm);
        manager.setRealm(authRealm2);
        manager.setSessionManager(sessionManager());
//        manager.setCacheManager(ehCacheManager);
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

```

## 5. Authentication Strategy 认证策略

在Shiro中有三种认证策略：

* **AtLeatOneSuccessfulStrategy(默认策略)** `:只要有一个Realm验证成功即可`，和`FirstSuccessfulStrategy`不同，将`返回所有`Realm身份校验成功的认证信息。

* **FirstSuccessfulStrategy** :`只要有一个Realm验证成功即可`，`只返回第一个`Realm身份验证成功的认证
  信息，其他的忽略。

* **AllSuccessfulStrategy** :所有Realm验证成功才算成功，且返回所有Realm身份认证成功的认证信息，如

  果`有一个失败就失败`了。


具体配置
```java
    /**
     * 认证策略配置
     *
     * @return modularRealmAuthenticator
     */
    @Bean
    public ModularRealmAuthenticator modularRealmAuthenticator() {
        ModularRealmAuthenticator modularRealmAuthenticator = new ModularRealmAuthenticator();
        AuthenticationStrategy atLeastOneSuccessfulStrategy = new AtLeastOneSuccessfulStrategy();
        modularRealmAuthenticator.setAuthenticationStrategy(atLeastOneSuccessfulStrategy);
        return modularRealmAuthenticator;
    }
```

## 6. 散列算法(加密)

### 6.1 简介

为了提高应用系统的安全性，在身份认证过程中往往会涉及加密，这里主要关注shiro提供的密码服务模块；通过shiro进行散列算法操作，常见的有两个MD5，SHA-1等。

如`1111`的MD5为`b59c67bf196a4758191e42f76670ceba`,但是这个`b59c67bf196a4758191e42f76670ceba`很容易就会被破解，轻松就能获取到加密前的数据。

### 6.2 加盐

但是`1111+userName`进行加密，这样就不容易被破解了，破解难度增加。

例如:

`qwer`的MD5为`962012d09b8170d912f0669f6d7d9d07`
`qwer`加盐`illusory`后的MD5为`6aee9c0e35ad7a12e59ff67b663a32ca`

用户在注册的时候就把加密后的密码和盐值存到数据库，用户登录时就先根据用户名查询盐值，然后把用户输入的密码加密后在和数据库中的密码做对比。

代码如下：
自定义密码校验,shiro也提供了一下内置的加密密码校验器
> 1.根据name查询user 然后获取到盐值
> 2.然后把输入的密码加密
> 3.最后在于数据库中的密码对比
```java
public class CredentialsMatcherHash extends SimpleCredentialsMatcher {
    @Autowired
    UserService service;

    @Override
    public boolean doCredentialsMatch(AuthenticationToken token, AuthenticationInfo info) {
        //强转 获取token
        UsernamePasswordToken usernamePasswordToken = (UsernamePasswordToken) token;
        //获取用户输入的密码
        char[] password = usernamePasswordToken.getPassword();
        String inputPassword = new String(password);
        String username = usernamePasswordToken.getUsername();
        User userByName = service.findUserJustByName(username);
        String salt = userByName.getSalt();
        //这个盐值是从数据库查出来的
        Md5Hash md5Hash = new Md5Hash(inputPassword, salt);
        String inputMD5Hash = new String(String.valueOf(md5Hash));
        //获取数据库中的密码
        String realPassword = (String) info.getCredentials();
        System.out.println("输入的密码" + inputPassword);
        System.out.println("输入的密码加密" + md5Hash);
        System.out.println("数据库中的密码" + realPassword);
        //对比
        return this.equals(inputMD5Hash, realPassword);
    }
}
```



## 7. 授权

![]()

### 7.1 简介

1.授权：给身份认证通过的人，授予某些权限。
2.权限粒度：分为粗粒度和细粒度，
    处理度：对某张表的操作，如对user表的crud。
    细粒度：对表中某条记录的操作，如：只能对user表中ID为1的记录进行curd
    shiro一般管理的是粗粒度的权限，比如：菜单、URL，细粒度的权限控制通过业务来实现。
3.角色：权限的集合
4.权限表现规则： 资源:操作:实例 可以用通配符表示
    如:user:add 对user有add权限
      user:*   对user有所有操作
      user:add:1 对ID为1的user有add操作

### 7.2 流程

![]()



Shiro中权限检测方式有三种：
* 1.编程式 业务代码前手动检测 subject.checkPermission("delete");/subject.hasRole("admin");
* 2.注解式 方法上添加注解 @RequiresPermissions(value = "add")/@RequiresRoles("admin")
* 3.标签式 写着html中 <p shiro:hasPermission="add">添加用户</p> 需要引入 xmlns:shiro="http://www.pollix.at/thymeleaf/shiro"

具体如下：

* 1.获取subject主体
* 2.判断subject主体是否通过认证
* 2.subject调用isPermitted()/hasRole()方法开始授权
* 3.SecurityManager执行授权，通过ModularRealmAuthorizer执行授权 
* 4.调用自定义realm的授权方法：doGetAuthorizationInfo
* 5.返回授权结果

授权代码如下：
```java

    /**
     * 授权
     *
     * @param principalCollection
     * @return
     */
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principalCollection) {
        //1.获取principalCollection中的用户
        User user = (User) principalCollection.fromRealm(this.getClass().getName()).iterator().next();
        //2.通过数据库查询当前userde权限
        List<String> permissions = userService.selectPermissionByUserId(user.getUid());
        SimpleAuthorizationInfo simpleAuthorizationInfo = new SimpleAuthorizationInfo();
        //3.将权限放入shiro中.
        simpleAuthorizationInfo.addStringPermissions(permissions);
//        System.out.println("添加时的权限" + permission.toString());
        System.out.println("-------------授权-------------");
        //4.返回
        return simpleAuthorizationInfo;
    }
```



## 参考

`https://blog.csdn.net/yangwenxue_admin/article/details/73936803`