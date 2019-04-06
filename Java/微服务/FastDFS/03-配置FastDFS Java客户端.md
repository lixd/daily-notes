# 配置 FastDFS Java 客户端



## 创建项目

创建一个名为 `myshop-service-upload` 的服务提供者项目

## 安装 FastDFS Java 客户端

### 从 GitHub 克隆源码

```bash
git clone https://github.com/happyfish100/fastdfs-client-java.git
```

### 在项目中添加依赖

```xml
<!-- FastDFS Begin -->
<dependency>
    <groupId>org.csource</groupId>
    <artifactId>fastdfs-client-java</artifactId>
    <version>1.27-SNAPSHOT</version>
</dependency>
<!-- FastDFS End -->
```

## 创建 FastDFS 工具类

### 定义文件存储服务接口

```java

```

### 实现文件存储服务接口

```java

```

### 文件存储服务工厂类

```java

```

### 配置文件存储服务工厂类

```java

```

## 创建 FastDFS 控制器

### 增加云配置

```yml
fastdfs.base.url: http://192.168.75.128:8888/
storage:
  type: fastdfs
  fastdfs:
    tracker_server: 192.168.75.128:22122
```

### 控制器代码

