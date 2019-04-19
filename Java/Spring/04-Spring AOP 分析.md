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

## AOP的作用

在软件业，AOP为Aspect Oriented Programming的缩写，意为：面向切面编程，通过预编译方
式和运行期动态代理实现程序功能的统一维护的一种技术。AOP是OOP的延续，是软件开发中的一个
热点，也是Spring框架中的一个重要内容，是函数式编程的一种衍生范型。利用AOP可以对业务逻辑
的各个部分进行隔离，从而使得业务逻辑各部分之间的耦合度降低，提高程序的可重用性，同时提高
了开发的效率。

在OOP中，正是这种分散在各处且与对象核心功能无关的代码（横切代码）的存在，使得模块复用难度增加。AOP则将封装好的对象剖开，找出其中对多个对象产生影响的公共行为，并将其封装为一个可重用的模块，这个模块被命名为“切面”（Aspect），切面将那些与业务无关，却被业务模块共同调用的逻辑提取并封装起来，减少了系统中的重复代码，降低了模块间的耦合度，同时提高了系统的可维护性。

## 相关概念

Aspect（切面）： Aspect 声明类似于 Java 中的类声明，在 Aspect 中会包含着一些 Pointcut 以及相应的 Advice。
Joint point（连接点）：表示在程序中明确定义的点，典型的包括方法调用，对类成员的访问以及异常处理程序块的执行等等，它自身还可以嵌套其它 joint point。
Pointcut（切点）：表示一组 joint point，这些 joint point 或是通过逻辑关系组合起来，或是通过通配、正则表达式等方式集中起来，它定义了相应的 Advice 将要发生的地方。
Advice（增强）：Advice 定义了在 Pointcut 里面定义的程序点具体要做的操作，它通过 before、after 和 around 来区别是在每个 joint point 之前、之后还是代替执行的代码。
Target（目标对象）：织入 Advice 的目标对象.。

Weaving（织入）：将 Aspect 和其他对象连接起来, 并创建 Adviced object 的过程

## 切面

AOP中的Joinpoint可以有多种类型：构造方法调用，字段的设置和获取，方法的调用，方法的执行，异常的处理执行，类的初始化。也就是说在AOP的概念中我们可以在上面的这些Joinpoint上织入我们自定义的Advice，但是在Spring中却没有实现上面所有的joinpoint，确切的说，Spring只支持方法执行类型的Joinpoint。

Advice 的类型

before advice, 在 join point 前被执行的 advice. 虽然 before advice 是在 join point 前被执行, 但是它并不能够阻止 join point 的执行, 除非发生了异常(即我们在 before advice 代码中, 不能人为地决定是否继续执行 join point 中的代码)

after return advice, 在一个 join point 正常返回后执行的 advice

after throwing advice, 当一个 join point 抛出异常后执行的 advice
after(final) advice, 无论一个 join point 是正常退出还是发生了异常, 都会被执行的 advice.
around advice, 在 join point 前和 joint point 退出后都执行的 advice. 这个是最常用的 advice.

introduction，introduction可以为原有的对象增加新的属性和方法。



















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