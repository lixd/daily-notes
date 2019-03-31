## SpringBoot缓存

## 1. EhCache

### 1.pom.xml 引入

```xml
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-cache</artifactId>
        </dependency>
        <dependency>
            <groupId>net.sf.ehcache</groupId>
            <artifactId>ehcache</artifactId>
        </dependency>
```

### 2.配置文件 ehcache.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ehcache 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
    xsi:noNamespaceSchemaLocation="http://ehcache.org/ehcache.xsd"
    updateCheck="false">
    <!-- 磁盘缓存位置 -->
    <diskStore path="java.io.tmpdir/ehcache"/>
    <!-- 默认缓存 -->
    <defaultCache
        maxElementsInMemory="10000"
        eternal="false"
        timeToIdleSeconds="120"
        timeToLiveSeconds="120"
        overflowToDisk="true"
        maxElementsOnDisk="10000000"
        diskPersistent="false"
        diskExpiryThreadIntervalSeconds="120"
        memoryStoreEvictionPolicy="LRU"
        />
    <!-- 定义缓存 -->
    <cache name="table1Cache"
        maxElementsInMemory="1000"
        eternal="false"
        timeToIdleSeconds="120"
        timeToLiveSeconds="120"
        overflowToDisk="false"
        memoryStoreEvictionPolicy="LRU"/>
</ehcache> 
```

### 3.开启缓存

启动类添加注解

```
@EnableCaching // 标注启动缓存
```

### 4.使用缓存

方法上添加注解 value为使用哪个缓存策略 配置文件中的 name

```
 @Cacheable(value="table1Cache"，key="xxx") // value为已定义缓存的名字
 key表示缓存对象在内存中的key ,key相同就不查询，直接返回缓存中的 缓存对象唯一标记
```

### 5.@CacheEvict

清除缓存，添加删除后都应该清除缓存。

 @CacheEvict是用来标注在需要清除缓存元素的方法或类上的。当标记在一个类上时表示其中所有的方法的执行都会触发缓存的清除操作。@CacheEvict可以指定的属性有value、key、condition、allEntries和beforeInvocation。其中value、key和condition的语义与@Cacheable对应的属性类似。即value表示清除操作是发生在哪些Cache上的（对应Cache的名称）；key表示需要清除的是哪个key，如未指定则会使用默认策略生成的key；condition表示清除操作发生的条件。

## 2.Redis

