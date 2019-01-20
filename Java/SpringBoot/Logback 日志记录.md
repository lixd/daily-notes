Logback 日志记录

## 简介

logback是由log4j创始人设计的又一个开源日志组件。logback当前分成三个模块：logback-core,logback-classic和logback-access。logback-core是其它两个模块的基础模块。logback-classic是log4j的一个改良版本。此外logback-classic完整实现SLF4J API使你可以很方便地更换成其它日志系统如log4j或JDK14 Logging。logback-access访问模块与Servlet容器集成提供通过Http来访问日志的功能(用的少)。

## 依赖

maven

logback-classic包含了logback-core，不需要再单独引用了。

```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-api</artifactId>
    <version>1.7.21</version>
</dependency>
<dependency>
    <groupId>ch.qos.logback</groupId>
    <artifactId>logback-classic</artifactId>
    <version>1.1.7</version>
</dependency>
<dependency>
    <groupId>ch.qos.logback</groupId>
    <artifactId>logback-access</artifactId>
    <version>1.1.7</version>
</dependency>
```

## 配置和使用

**1. 日志使用**

我们使用org.slf4j.LoggerFactory，就可以直接使用日志了。

```java
private static final Logger logger = LoggerFactory.getLogger(this.getClass());
```

使用：

```java
@Controller  
@RequestMapping(value = "/hello")  
public class IndexController extends BaseController {  
  
    /** 
     * Success 
     * @param response 
     * @throws IOException 
     */  
    @RequestMapping(value = "/test")  
    @ResponseBody  
    public void hello(HttpServletResponse response) throws IOException {  
        logger.debug("DEBUG TEST 这个地方输出DEBUG级别的日志");  
        logger.info("INFO test 这个地方输出INFO级别的日志");  
        logger.error("ERROR test 这个地方输出ERROR级别的日志");  
    }  
  
}  
```



#### 2. 在控制台输出特定级别的日志

logback的配置文件都放在/src/main/resource/文件夹下的logback.xml文件中。其中logback.xml文件就是logback的配置文件。只要将这个文件放置好了之后，系统会自动找到这个配置文件。

下面的配置中，我们输出特定的ERROR级别的日志：



```xml
<?xml version="1.0"?>  
<configuration>  
  
    <!-- ch.qos.logback.core.ConsoleAppender 控制台输出 -->  
    <appender name="console" class="ch.qos.logback.core.ConsoleAppender">  
        <encoder charset="UTF-8">  
            <pattern>[%-5level] %d{HH:mm:ss.SSS} [%thread] %logger{36} - %msg%n</pattern>  
        </encoder>  
    </appender>  
  
    <!-- 日志级别 -->  
    <root>  
        <level value="error" />  
        <appender-ref ref="console" />  
    </root>  
  
</configuration>   
```



结果只在控制台输出ERROR级别的日志。

#### 3. 设置输出多个级别的日志



```xml
<?xml version="1.0"?>  
<configuration>  
  
    <!-- ch.qos.logback.core.ConsoleAppender 控制台输出 -->  
    <appender name="console" class="ch.qos.logback.core.ConsoleAppender">  
        <encoder>  
            <pattern>[%-5level] %d{HH:mm:ss.SSS} [%thread] %logger{36} - %msg%n</pattern>  
        </encoder>  
    </appender>  
  
    <!-- 日志级别 -->  
    <root>  
        <level value="error" />  
        <level value="info" />  
        <appender-ref ref="console" />  
    </root>  
  
</configuration>   
```



设置两个level，则可以输出 ERROR和INFO级别的日志了。

#### 4. 设置文件日志

additivity="false"很少将这个属性设置为true



```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>

    <!-- ch.qos.logback.core.ConsoleAppender 控制台输出 -->
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder charset="UTF-8">
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- ch.qos.logback.core.rolling.RollingFileAppender 文件日志输出 -->
    <appender name="INFO"
              class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>${catalina.base}/logs/guide_info.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>${catalina.base}/logs/guide_info.%d{yyyy-MM-dd}-%i.log</fileNamePattern>
            <maxHistory>30</maxHistory>
            <timeBasedFileNamingAndTriggeringPolicy
                    class="ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP">
                <MaxFileSize>50MB</MaxFileSize>
            </timeBasedFileNamingAndTriggeringPolicy>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- ch.qos.logback.core.rolling.RollingFileAppender 异常日志输出 -->
    <appender name="ERROR"
              class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>${catalina.base}/logs/guide_error.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>${catalina.base}/logs/guide.%d{yyyy-MM-dd}-%i.log</fileNamePattern>
            <maxHistory>30</maxHistory>
            <timeBasedFileNamingAndTriggeringPolicy
                    class="ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP">
                <MaxFileSize>50MB</MaxFileSize>
            </timeBasedFileNamingAndTriggeringPolicy>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <!--打印info级别的日志-->
    <logger name="infoLog" level="info" additivity="false">
        <appender-ref ref="INFO" />
    </logger>

    <!--打印异常错误日志-->
    <logger name="errorLog" level="error" additivity="false">
        <appender-ref ref="ERROR" />
    </logger>

    <!-- 日志级别 -->
    <root level="debug">
        <appender-ref ref="STDOUT" />
    </root>

</configuration>
```

```java
public class Test {
    public static void main(String[] args) {
        Logger INFO_LOG = LoggerFactory.getLogger("infoLog");

        Logger ERROR_LOG = LoggerFactory.getLogger("errorLog");

        INFO_LOG.info("业务日志");

        ERROR_LOG.error("异常日志");
    }
}
```

```java
/**
 * Return a logger named according to the name parameter using the
 * statically bound {@link ILoggerFactory} instance.
 * 
 * @param name
 *            The name of the logger.
 * @return logger
 */
public static Logger getLogger(String name) {
    ILoggerFactory iLoggerFactory = getILoggerFactory();
    return iLoggerFactory.getLogger(name);
}
```

#### 5. 精确设置每个包下面的日志

```xml
<logger name="com.xxx" additivity="false">  
    <level value="info" />  
    <appender-ref ref="file" />  
    <appender-ref ref="console" />  
</logger>  
```

 