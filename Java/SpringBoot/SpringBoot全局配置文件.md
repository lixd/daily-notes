# SpringBoot全局配置文件

### 自定义属性

application.properties中

```properties
msg=hello world
```

java文件中获取值

```java
@Value("${msg}")
private String msg;
```

