# SpringBoot全局配置文件

## 1. 常用配置

1.端口号配置

```properties
server.port=8888
```

2.自定义属性

application.properties中

```properties
msg=hello world
```

java文件中获取值

```java
@Value("${msg}")
private String msg;
```

3.配置变量引用

application.properties中

```properties
msg1=springboot
msg2=hello ${msg1}
```

java文件中获取值

```java
@Value("${msg2}")
private String msg;
```

4.随机值配置

application.properties中

```properties
randomnum=${random.int}
```

java文件中获取值

```java
@Value("${msg2}")
private String msg;
```

**随机值只会在开启服务时生成一次。**

例如随机端口号：

在SpringCloud微服务中，不需要记录IP和端口号，也不需要我们去维护，直接随机生成就好了。

```properties
server.port=${random.int[1024,9999]}  
# 限定为1024-9999
```

## 2. yml配置文件

SpringBoot中新增的一种配置文件格式，具备天然的树状结构。

与properties文件相比，yml格式比较简洁。

数据格式和json比较像，都是K-V结构的，以冒号： 进行分割。

**K和V之间必须要有空格。**

application.yml

```yaml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/shiro?useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC
    username: root
    password: root
    type: com.alibaba.druid.pool.DruidDataSource
  http:
    encoding:
      charset: utf-8
      enabled: true

mybatis:
  mapper-locations: classpath:mapper/*.xml
  type-aliases-package: com.example.shiro.pojo
```

## 3. 多环境配置

### 1.yml单文件配置

通过yml文件配置多环境变量

首先配置好几个环境的信息。

```yaml
server:
  port: 8080
# spring
spring:
  profiles:
    active: dev
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/shiro?useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC
    username: root
    password: root
    type: com.alibaba.druid.pool.DruidDataSource
  http:
    encoding:
      charset: utf-8
      enabled: true
# Mybatis
mybatis:
  mapper-locations: classpath:mapper/*.xml
  type-aliases-package: com.example.shiro.pojo
---
#development environment
spring:
  profiles: dev
  
server:
  port: 8160
---
#test environment
spring:
  profiles: test
  
server:
  port: 8180
---
#production environment
spring:
  profiles: prod
  
server:
  port: 8190
```

然后选择使用哪个环境

```yaml
spring:
    profiles:
        active: dev
```

表示默认 加载的就是开发环境的配置，如果dev换成test，则会加载测试环境的属性，以此类推。

### 2.启动配置选择
工程打成jar包后，我们可以在运行的时候对配置进行选择，而不需要每次打包前都手动去修改spring.profiles.active的值。

例如在生产环境，我们可以使用release配置执行jar包，命令如下：

java -jar xxx.jar --spring.profiles.active=release
### 3.yml多文件配置
为了更方便得维护各种环境的配置，我们可以将yml文件拆分。

命名规则为application-{profiles}.yml，例如 
application-dev.yml 
application-test.yml

application-prod.yml

然后，将原来application.yml中的dev、release配置分别移到这两个配置文件中，同时可以去掉spring.profiles属性，因为spring会自动按照命名规则寻找对应的配置文件。 

如：

application-dev.yml 

```yaml
server:
  port: 8160
```

application-test.yml 

```yaml
server:
  port: 8160
```

application-prod.yml 

```yaml
server:
  port: 8190
```



### 4.用Maven控制默认配置
之前，我们将项目打成包后，在运行的时候需要指定配置，略嫌麻烦。能不能在打包的时候，自动改变spring.profiles.active的激活配置，这样直接通过java -jar xxx.jar即可运行项目。而且我司项目上线采用自研运维系统，默认是直接执行jar、war包的，不能在启动时选择配置，所以在打包时如果能自动将spring.profiles.active配置动态切换就显得尤为诱人了。

那如何实现呢？这里我们需要使用maven-resources-plugin插件。

在pom.xml添加如下配置

```xml
<profiles>
    <!-- 开发环境 -->
    <profile>
        <id>dev</id>
        <properties>
            <spring.profiles.active>dev</spring.profiles.active>
        </properties>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
    </profile>
    <!-- 生产环境 -->
    <profile>
        <id>release</id>
        <properties>
            <spring.profiles.active>release</spring.profiles.active>
        </properties>
    </profile>
</profiles>
```

在< plugins/>里添加

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-resources-plugin</artifactId>
    <version>2.7</version>
    <executions>
        <execution>
            <id>default-resources</id>
            <phase>validate</phase>
            <goals>
                <goal>copy-resources</goal>
            </goals>
            <configuration>
                <outputDirectory>target/classes</outputDirectory>
                <useDefaultDelimiters>false</useDefaultDelimiters>
                <delimiters>
                    <delimiter>#</delimiter>
                </delimiters>
                <resources>
                    <resource>
                        <directory>src/main/resources/</directory>
                        <filtering>true</filtering>
                    </resource>
                    <resource>
                        <directory>src/main/resources.${spring.profiles.active}</directory>
                        <filtering>false</filtering>
                    </resource>
                </resources>
            </configuration>
        </execution>
    </executions>
</plugin>
```



这里<delimiter>#</delimiter>用来增加一个占位符，Maven本身有占位符${xxx}，但这个占位符被SpringBoot占用了，所以我们就再定义一个。<filtering>true</filtering>表示打开过滤器开关，这样application.yml文件中的#spring.profiles.active#部分就会替换为pom.xml里profiles中定义的 spring.profiles.active变量值。

最后，将application.yml的spring.profiles.active的值改为#spring.profiles.active#。

默认使用配置

```yaml
spring:
  profiles:
    active: #spring.profiles.active#
```

这样，在用maven打包的时候，使用mvn package -P release打包，最后打包后的文件中，application.yml中的spring.profiles.active的值就是release。这样直接运行java -jar xxx.jar，就是生产环境的配置了。

## 4. SpringBoot核心注解

@SpringBootApplication 代表是springboot启动类

```java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan(
    excludeFilters = {@Filter(
    type = FilterType.CUSTOM,
    classes = {TypeExcludeFilter.class}
), @Filter(
    type = FilterType.CUSTOM,
    classes = {AutoConfigurationExcludeFilter.class}
)}
)
public @interface SpringBootApplication {
//代码省略
}
```

* @SpringBootConfiguration： 通过bean对象获取配置信息
  * @Configuration： 通过对bean对象的操作代替spring中的xml

* @EnableAutoConfiguration： 完成一些初始化环境的配置
* @ComponentScan： 完成spring的组件扫描，代替xml文件中配置的包扫描
* @RestController： 相当于@Controller+@ResponseBody

## 5. 全局异常处理

@ControllerAdvice+@ExceptionHandler 注解处理异常

```java
@ControllerAdvice
public class MyControllerAdvice {

    @ResponseBody
    @ExceptionHandler(value = java.lang.Exception.class) //处理所有类型的异常
    public Map<String,Object> myException(Exception ex){
        Map<String,Object> map=new HashMap<>();
        map.put("code",500);
        map.put("msg","出错了.");
        return map;
    }
}
```

## 6. 监控SpringBoot健康状况

### 6.1 Actuator

`actuator`是`spring boot`项目中非常强大一个功能，有助于对应用程序进行监视和管理，通过`restful api`请求来监管、审计、收集应用的运行情况，针对微服务而言它是必不可少的一个环节…

#### Endpoints

`actuator`的核心部分，它用来监视应用程序及交互，`spring-boot-actuator`中已经内置了非常多的**Endpoints（health、info、beans、httptrace、shutdown等等）**，同时也允许我们自己扩展自己的端点

**Spring Boot 2.0**中的端点和之前的版本有较大不同,使用时需注意。另外端点的监控机制也有很大不同，启用了不代表可以直接访问，还需要将其暴露出来，传统的`management.security`管理已被标记为不推荐。

#### 内置Endpoints

| id                 | desc                                                         | Sensitive |
| ------------------ | ------------------------------------------------------------ | --------- |
| **auditevents**    | 显示当前应用程序的审计事件信息                               | Yes       |
| **beans**          | 显示应用Spring Beans的完整列表                               | Yes       |
| **caches**         | 显示可用缓存信息                                             | Yes       |
| **conditions**     | 显示自动装配类的状态及及应用信息                             | Yes       |
| **configprops**    | 显示所有 @ConfigurationProperties 列表                       | Yes       |
| **env**            | 显示 ConfigurableEnvironment 中的属性                        | Yes       |
| **flyway**         | 显示 Flyway 数据库迁移信息                                   | Yes       |
| **health**         | 显示应用的健康信息（未认证只显示`status`，认证显示全部信息详情） | No        |
| **info**           | 显示任意的应用信息（在资源文件写info.xxx即可）               | No        |
| **liquibase**      | 展示Liquibase 数据库迁移                                     | Yes       |
| **metrics**        | 展示当前应用的 metrics 信息                                  | Yes       |
| **mappings**       | 显示所有 @RequestMapping 路径集列表                          | Yes       |
| **scheduledtasks** | 显示应用程序中的计划任务                                     | Yes       |
| **sessions**       | 允许从Spring会话支持的会话存储中检索和删除用户会话。         | Yes       |
| **shutdown**       | 允许应用以优雅的方式关闭（默认情况下不启用）                 | Yes       |
| **threaddump**     | 执行一个线程dump                                             | Yes       |
| **httptrace**      | 显示HTTP跟踪信息（默认显示最后100个HTTP请求 - 响应交换）     | Yes       |

#### 导入依赖

1.pom.xml中添加坐标

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

然后就可以访问了

`http://localhost:8080/actuator`

在application.yml文件中配置actuator的相关配置，其中info开头的属性，就是访问info端点中显示的相关内容，值得注意的十spring boot2.x中，默认只开放了info、health两个端点，其余的需要自己通过配置management.endpoints.web.exposure.include属性来加载（有include自然就有exclude）。如果想单独操作某个端点可以使用management.endpoint.端点.enabled属性进行启用或者禁用。

```yaml
info:
  head: head
  body: body
management:
  endpoints:
    web:
      exposure:
        #加载所有的端点，默认只加载了info、health
        include: '*'
  endpoint:
    health:
      show-details: always
    #可以关闭指定的端点
    shutdown:
      enabled: false
```

开启前： Exposing 2 endpoint(s) beneath base path '/actuator' 默认只加载了info、health这两个

开启后： Exposing 15 endpoint(s) beneath base path '/actuator'

### 6.2 SpringBoot Admin

可视化工具

#### 1.搭建服务端

服务端也是一个SpringBoot项目。

1.先创建一个普通SprinBoot项目。需要选上web模块

2.导入依赖

```xml
<dependency>
    <groupId>de.codecentric</groupId>
    <artifactId>spring-boot-admin-starter-server</artifactId>
    <version>2.1.2</version>
</dependency>
```

3.在启动类添加注解`@EnableAdminServer`

4.修改端口号

由于客户端和服务端都在一台机器上，所以为了不冲突，需要修改一下端口号

application.yml

```yaml
server:
  port: 9090
```

#### 2.客户端配置

1.导入依赖

```xml
<dependency>
    <groupId>de.codecentric</groupId>
    <artifactId>spring-boot-admin-starter-client</artifactId>
    <version>2.1.1</version>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

2.全局配置文件

```yaml
spring:
  boot:
    admin:
      client:
      #配置url 这里填的是服务端的地址 
        url: http://localhost:9090 
management:
  endpoints:
    web:
      exposure:
        #加载所有的端点，默认只加载了info、health
        include: '*'
```

3.Security配置文件

```java
public class SecurityPermitAllConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests().anyRequest().permitAll()
                .and().csrf().disable();
    }
}
```

暂时关闭安全性检测

客户端和服务端都启动后就可以直接访问服务端查看客户端的信息了。

可以配置一个访问密码

```yaml
spring:
  security:
    user:
      name: "admin"
      password: "root"
```

## 参考

`https://blog.csdn.net/colton_null/article/details/82145467`