# Idea下SpringBoot项目打包war、jar

## 1. 创建项目

打包之前肯定需要一个完整的项目的。

## 2.打包

### 2.1 jar包

SpringBoot官方推荐打成jar包，服务器上有JDK 1.8以上就可以直接使用

哎，现在学编程的基本都不会教历史了，也没人有兴趣去钻研。总体来说吧，很多年前，Sun 还在世的那个年代，在度过了早期用 C++写 Html 解析器的蛮荒时期后，有一批最早的脚本程序进入了 cgi 时代，此时的 Sun 决定进军这个领域，为了以示区别并显得自己高大上，于是研发了 servlet 标准，搞出了最早的 jsp。并给自己起了个高大上的称号 JavaEE （ Java 企业级应用标准，我呸，不就是一堆服务器以 http 提供服务吗，吹逼）。既然是企业级标准那自然得有自己的服务器标准。于是 Servlet 标准诞生，以此标准实现的服务器称为 Servle 容器服务器，Tomcat 就是其中代表，被 Sun 捐献给了 Apache 基金会，那个时候的 Web 服务器还是个高大上的概念，当时的 Java Web 程序的标准就是 War 包(其实就是个 Zip 包)，这就是 War 包的由来。后来随着服务器领域的屡次进化，人们发现我们为什么要这么笨重的 Web 服务器，还要实现一大堆 Servlet 之外的管理功能，简化一下抽出核心概念 servlet 不是更好吗，最早这么干的似乎是 Jetty，出现了可以内嵌的 Servelet 服务器。去掉了一大堆非核心功能。后来 tomcat 也跟进了，再后来，本来很笨重的传统 JavaEE 服务器 Jboss 也搞了个 undertow 来凑热闹。正好这个时候微服务的概念兴起，“ use Jar，not War ”。要求淘汰传统 Servlet 服务器的呼声就起来了 

### 2.2 war包

#### 1.修改pom.xml

```xml
 	<groupId>com.example</groupId>
    <artifactId>demo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
	<!--指定打包格式-->
    <packaging>war</packaging><!--<packaging>jar</packaging>-->
<!--外置tomcat启动-->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
            <scope>provided</scope>
        </dependency>

```

#### 2.改造启动项

就是改成继承SpringBootServletInitializer;因为springboot 自己能认识自己的启动项,而外部tomcat是不认识的,所以要自己继承,并读取配置

```java
public class DingApplication extends SpringBootServletInitializer {
    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(DingApplication.class);
    }

    public static void main(String[] args) {
        SpringApplication.run(DingApplication.class, args);
    }
}

```

当我们用maven install生成最终的构件包ProjectABC.war后，在其下的WEB-INF/lib中，会包含我们被标注为scope=compile的构件的jar包，而不会包含我们被标注为scope=provided的构件的jar包。这也避免了此类构件当部署到目标容器后产生包依赖冲突。 



## 4.问题

重点:启动tomcat,你可能会遇到一个错: 
Caused by: java.lang.NoClassDefFoundError: javax/el/ELManager 

我被卡了好久,是因为:tomcat提供的el-api 和项目里面的el-api.jar冲突;这时候你需要去找到自己本机上用的el-api的版本,copy到tomcat的lib目录下,覆盖原来的jar包
