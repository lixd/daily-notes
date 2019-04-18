---
title: Spring系列(四)---AOP分析
tags:
  - Spring
categories:
  - Spring
date: 2019-03-30 22:00:00
---

本文主要通过源码详细分析了 Spring 框架中的 AOP 是如何实现的。

<!--more-->

> 更多文章欢迎访问我的个人博客-->[幻境云图](https://www.lixueduan.com/)

后面写剩下的内容

## Spring AOP动态代理支持的核心

jdk动态代理：`java.lang.reflect.InvocationHandler`
对应的方法拦截器：

```java
public Object invoke(Object proxy, Method method, Object[] args)
        throws Throwable;
```

调用时使用method.invoke(Object, args)

该动态代理是基于接口的动态代理，所以并没有一个原始方法的调用过程，整个方法都是被拦截的。

通过cglib动态创建类进行动态代理。org.springframework.cglib.proxy包下的原生接口，同net.sf.cglib.proxy包下的接口，都是源自cglib库。Spring内部的cglib动态代理使用了这种方式。
对应的方法拦截器:

`org.springframework.cglib.proxy.Callback`、 `org.springframework.cglib.proxy.MethodInterceptor`

```java
public interface MethodInterceptor extends Callback {
    Object intercept(Object obj, Method m, Object[] args, MethodProxy mp) throws Throwable
}
```

调用时，使用mp.invoke(Object obj, Object[] args)调用其他同类对象的原方法或者mp.invokeSuper(Object obj, Object[] args)调用原始(父类)方法。

org.aopalliance的拦截体系
该包是AOP组织下的公用包，用于AOP中方法增强和调用。相当于一个jsr标准，只有接口和异常。在AspectJ、Spring等AOP框架中使用。

对应的方法拦截器`org.aopalliance.intercept.MethodInterceptor`

```java
public interface MethodInterceptor extends Interceptor {
    Object invoke(MethodInvocation inv) throws Throwable;
}
```

调用时使用inv.proceed()调用原始方法。

说起AOP就不得不说下OOP了，OOP中引入封装、继承和多态性等概念来建立一种对象层次结构，用以模拟公共行为的一个集合。但是，如果我们需要为部分对象引入公共部分
的时候，OOP就会引入大量重复的代码。例如：日志功能。
AOP技术利用一种称为“横切”的技术，解剖封装的对象内部，并将那些影响了多个类的公共行为封装到一个可重用模块，这样就能减少系统的重复代码，
降低模块间的耦合度，并有利于未来的可操作性和可维护性。AOP把软件系统分为两个部分：核心关注点和横切关注点。业务处理的主要流程是核心关注点，
与之关系不大的部分是横切关注点。横切关注点的一个特点是，他们经常发生在核心关注点的多处，而各处都基本相似。比如权限认证、日志、事务处理。

AOP（Aspect Orient Programming），作为面向对象编程的一种补充，广泛应用于处理一些具有横切性质的系统级服务，如事务管理、安全检查、缓存、对象池管理等。
AOP 实现的关键就在于 AOP 框架自动创建的 AOP 代理，AOP 代理则可分为静态代理和动态代理两大类，其中静态代理是指使用 AOP 框架提供的命令进行编译，
从而在编译阶段就可生成 AOP 代理类，因此也称为编译时增强；而动态代理则在运行时借助于 JDK 动态代理、CGLIB 等在内存中“临时”生成 AOP 动态代理类，
因此也被称为运行时增强