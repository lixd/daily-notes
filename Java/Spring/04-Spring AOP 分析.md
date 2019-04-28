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

## 1. AOP的作用

在软件业，AOP为Aspect Oriented Programming的缩写，意为：面向切面编程，通过预编译方
式和运行期动态代理实现程序功能的统一维护的一种技术。AOP是OOP的延续，是软件开发中的一个
热点，也是Spring框架中的一个重要内容，是函数式编程的一种衍生范型。利用AOP可以对业务逻辑
的各个部分进行隔离，从而使得业务逻辑各部分之间的耦合度降低，提高程序的可重用性，同时提高
了开发的效率。

在OOP中，正是这种分散在各处且与对象核心功能无关的代码（横切代码）的存在，使得模块复用难度增加。AOP则将封装好的对象剖开，找出其中对多个对象产生影响的公共行为，并将其封装为一个可重用的模块，这个模块被命名为“切面”（Aspect），切面将那些与业务无关，却被业务模块共同调用的逻辑提取并封装起来，减少了系统中的重复代码，降低了模块间的耦合度，同时提高了系统的可维护性。

## 2. 相关概念

Aspect（切面）： Aspect 声明类似于 Java 中的类声明，在 Aspect 中会包含着一些 Pointcut 以及相应的 Advice。
Joint point（连接点）：表示在程序中明确定义的点，典型的包括方法调用，对类成员的访问以及异常处理程序块的执行等等，它自身还可以嵌套其它 joint point。
Pointcut（切点）：表示一组 joint point，这些 joint point 或是通过逻辑关系组合起来，或是通过通配、正则表达式等方式集中起来，它定义了相应的 Advice 将要发生的地方。
Advice（增强）：Advice 定义了在 Pointcut 里面定义的程序点具体要做的操作，它通过 before、after 和 around 来区别是在每个 joint point 之前、之后还是代替执行的代码。
Target（目标对象）：织入 Advice 的目标对象.。

Weaving（织入）：将 Aspect 和其他对象连接起来, 并创建 Adviced object 的过程

### PointCut

AOP标准中的`Joinpoit`可以有很多类型：构造方法调用、字段的设置和获取、方法调用和执行等。而Spring AOP中只支持方法执行类型的`Joinpoint`，不过这已经够我们用了。

Spring AOP中通过接口`org.springframework.aop.Pointcut`来表示所有连接点`Joinpoit`的抽象。`Pointcut`接口的代码定义如下：

```
public interface Pointcut {

    ClassFilter getClassFilter();

    MethodMatcher getMethodMatcher();

    Pointcut TRUE = TruePointcut.INSTANCE;

}
```

`ClassFilter`将用来匹配目标对象，`MethodMatcher`用来匹配将被执行织入操作的相应方法。`TruePointcut`表示匹配所有对象。

```
public interface ClassFilter {

    /**
     * 当织入的目标对象的Class类型和Pointcut所规定的类型相同时，
     * 该方法返回true
     */
    boolean matches(Class<?> clazz);

    /**
     * 匹配所以类的ClassFilter实例.
     */
    ClassFilter TRUE = TrueClassFilter.INSTANCE;

}
```

`MethodMatcher`接口的代码定义如下：

```
public interface MethodMatcher {

    /**
     * 判断方法是否匹配，静态的MethodMatcher调用
     */
    boolean matches(Method method, Class<?> targetClass);

    /**
     * 判断MethodMatcher是否是动态的，如果是动态的该方法返回TRUE，将会调用3个参数的matches方法。
     * 如果是静态的，该方法返回FALSE，将会调用2个参数的matches方法。
     */
    boolean isRuntime();

    /**
     * 判断是否匹配方法，动态的MethodMatcher调用
     * 
     */
    boolean matches(Method method, Class<?> targetClass, Object... args);


    /**
     * 匹配所有方法的MethodMatcher实例
     */
    MethodMatcher TRUE = TrueMethodMatcher.INSTANCE;

}
```

根据是否需要捕捉目标方法执行时的参数，可以将`MethodMatcher`分为动态和静态两种。在`MethodMatcher`类型的基础上，`Pointcut`可以分为两类，即`StaticMethodMatcherPointcut`和`DynamicMethodMatcherPointcut`。因为`StaticMethodMatcherPointcut`具有明显的性能优势，所以，Spring为其提供了更多支持。

### 切点指示符

切点指示符是切点定义的关键字，切点表达式以切点指示符开始。开发人员使切点指示符来告诉切点将要匹配什么，有以下9种切点指示符：execution、within、this、target、args、@target、@args、@within、@annotation，下面一一介结这9种切点指示符。

### execution

execution是一种使用频率比较高比较主要的一种切点指示符，用来匹配方法签名，方法签名使用全限定名，**包括访问修饰符（public/private/protected）、返回类型，包名、类名、方法名、参数**

**其中返回类型，包名，类名，方法，参数是必须的**，如下面代码片段所示：

```java
@Pointcut("execution(public String org.baeldung.dao.FooDao.findById(Long))")
```

上面的代码片段里的表达式精确地匹配到FooDao类里的findById(Long)方法，但是这看起来不是很灵活。假设我们要匹配FooDao类的所有方法，这些方法可能会有不同的方法名，不同的返回值，不同的参数列表，为了达到这种效果，我们可以使用通配符。如下代码片段所示：

```java
@Pointcut("execution(* org.baeldung.dao.FooDao.*(..))")
```

第一个通配符匹配所有返回值类型，第二个匹配这个类里的所有方法，（）括号表示参数列表，括号里的用两个点号表示匹配任意个参数，包括0个

### within

使用within切点批示符可以达到上面例子一样的效果，**within用来限定连接点属于某个确定类型的类**。如下面代码的效果与上面的例子是一样的：

```java
@Pointcut("within(org.baeldung.dao.FooDao)")
```

我们也可以使用within指示符来匹配某个包下面所有类的方法（包括子包下面的所有类方法），如下代码所示：

```java
@Pointcut("within(org.baeldung..*)")
```

### this 和 target

this用来匹配的连接点所属的对象引用是某个特定类型的实例，target用来匹配的连接点所属目标对象必须是指定类型的实例；那么这两个有什么区别呢？原来AspectJ在实现代理时有两种方式：
1、如果当前对象引用的类型没有实现自接口时，spring aop使用生成一个基于CGLIB的代理类实现切面编程
2、如果当前对象引用实现了某个接口时，Spring aop使用JDK的动态代理机制来实现切面编程
this指示符就是用来匹配基于CGLIB的代理类，通俗的来讲就是，**如果当前要代理的类对象没有实现某个接口的话，则使用this；target指示符用于基于JDK动态代理的代理类**，通俗的来讲就是如果当前要代理的目标对象有实现了某个接口的话，则使用target.：

```java
public class FooDao implements BarDao {
    ...
}
```

比如在上面这段代码示例中，spring aop将使用jdk的动态代理来实现切面编程，在编写匹配这类型的目标对象的连接点表达式时要使用target指示符， 如下所示：

```java
@Pointcut("target(org.baeldung.dao.BarDao)")
```

如果FooDao类没有实现任何接口，或者在spring aop配置属性：proxyTargetClass设为true时，Spring Aop会使用基于CGLIB的动态字节码技为目标对象生成一个子类将为代理类，这时应该使用this指示器：

```java
@Pointcut("this(org.baeldung.dao.FooDao)")
```

### 参数

参数指示符是一对括号所括的内容，用来匹配指定方法参数：

```java
@Pointcut("execution(* *..find*(Long))")
```

这个切点匹配所有以find开头的方法，并且只一个Long类的参数。如果我们想要匹配一个有任意个参数，但是第一个参数必须是Long类的，我们这可使用下面这个切点表达式：

```java
@Pointcut("execution(* *..find*(Long,..))")
```

### @Target

**这个指示器匹配指定连接点，这个连接点所属的目标对象的类有一个指定的注解**:

```java
@Pointcut("@target(org.springframework.stereotype.Repository)")
```

### @args

这个指示符是用来匹配连接点的参数的，@args指出连接点在运行时传过来的参数的类必须要有指定的注解，假设我们希望切入所有在运行时接受实@Entity注解的bean对象的方法：

```java
@Pointcut("@args(org.baeldung.aop.annotations.Entity)")
public void methodsAcceptingEntities() {}
```

为了在切面里接收并使用这个被@Entity的对象，我们需要提供一个参数给切面通知：JointPoint:

```java
@Before("methodsAcceptingEntities()")
public void logMethodAcceptionEntityAnnotatedBean(JoinPoint jp) {
    logger.info("Accepting beans with @Entity annotation: " + jp.getArgs()[0]);
}
```

### @within

这个指示器，**指定匹配必须包括某个注解的的类里的所有连接点**：

```java
@Pointcut("@within(org.springframework.stereotype.Repository)")
```

上面的切点跟以下这个切点是等效的：

```java
@Pointcut("within(@org.springframework.stereotype.Repository *)")
```

### @annotation

**这个指示器匹配那些有指定注解的连接点**，比如，我们可以新建一个这样的注解@Loggable:

```java
@Pointcut("@annotation(org.baeldung.aop.annotations.Loggable)")
public void loggableMethods() {}
```

我们可以使用@Loggable注解标记哪些方法执行需要输出日志：

```java
@Before("loggableMethods()")
public void logMethod(JoinPoint jp) {
    String methodName = jp.getSignature().getName();
    logger.info("Executing method: " + methodName);
}
```

### 切点表达式组合

可以使用&&、||、!、三种运算符来组合切点表达式，表示与或非的关系。

```java
@Pointcut("@target(org.springframework.stereotype.Repository)")
public void repositoryMethods() {}

@Pointcut("execution(* *..create*(Long,..))")
public void firstLongParamMethods() {}

@Pointcut("repositoryMethods() && firstLongParamMethods()")
public void entityCreationMethods() {}
```

### Advice(增强)

Spring中的`Advice`实现全部基于AOP Alliance规定的接口。

按照增强（advice）在目标对象方法连接点的位置，可以将增强分为以下五类：

1. 前置增强：`org.springframework.aop.BeforeAdvice`，在目标方法执行前执行；
2. 后置增强：`org.springframework.aop.AfterReturningAdvice`，在目标方法调用后执行；
3. 环绕增强：`org.aopalliance.intercept.MethodInterceptor`，截取目标类方法的执行，并在前后添加横切逻辑；
4. 抛出异常增强：`org.springframework.aop.ThrowsAdvice`，目标方法抛出异常后执行；
5. Introduction增强：`org.springframework.aop.introductioninterceptor` 

Spring AOP中的`AfterReturningAdvice`只有在方法正常返回时才会执行，且不能更改方法的返回值。所以要想实现类似资源清理的横切工作，无法使用`AfterReturningAdvice`，而Spring AOP并没有提供After Finally Advice。如果要想实现资源清理的工作我们可以借助Around Advice，它在Spring AOP的API编程实现中没有对应的实现类，不过可以借助`MethodInterceptor`来实现Around Advice。下面来看看如何定义一个`Around Advice`

```
/**
 * 通过MethodInterceptor来实现Around Advice
 */
public class PerformanceMethodInterceptor implements MethodInterceptor{

    private final Logger logger = LoggerFactory.getLogger(PerformanceMethodInterceptor.class);

    @Override
    public Object invoke(MethodInvocation invocation) throws Throwable {
        StopWatch stopWatch = new StopWatch();
        try {
            stopWatch.start();
            return invocation.proceed();
        } catch (Exception e){
            // do nothing
        } finally {
            stopWatch.stop();
            if (logger.isInfoEnabled()){
                logger.info(stopWatch.toString());
            }
        }
        return null;
    }
}
```

异常抛出增强类的定义接口是`ThrowsAdvice`，它是一个标志接口，内部没有定义任何方法。不过我们在编写`ThrowsAdvice`的实现类时，必须要定义如下方法：

```
/**
 * 1. 方法名必须是afterThrowing
 * 2. 前三个参数(method,args,target)是可选的，不过必须是要么同时存在，要么同时不存在
 * 3. 第四个参数必须存在，可以是Throwable或者其任何子类
 * 4. 可以存在多个符合规则的afterThrowing，Spring会自动选择最匹配的
 */
public void afterThrowing(Method method,Object[] args,Object target,Throwable t)
```

`ThrowsAdvice`的实现如下：

```
public class MyThrowsAdvice implements ThrowsAdvice {

    private Logger logger = LoggerFactory.getLogger(MyThrowsAdvice.class);

    public void afterThrowing(Method method, Object[] args, Object target, Throwable t) {
        logger.error("发送异常啦",t);
    }

    public void afterThrowing(RuntimeException t) {
        logger.error("发生了运行时异常，异常信息：",t);
    }
}
```

### Introduction

除了常见的Advice之外，还有一种特殊的Advice--Introduction。Introduction可以在不改变目标类的情况下，为目标类添加新的属性以及行为。要想为目标对象添加新的属性和行为，必须要先声明对应的接口和实现类，然后可以通过拦截器`IntroductionInterceptor`实现添加。

下面来演示一下

```
DelegatingIntroductionInterceptor
```

的用法。



```
public class DelegatingIntroductionInterceptorSample {
    public static void main(String[] args) {
        IDancer dancer = new Dancer();
        DelegatingIntroductionInterceptor interceptor = new DelegatingIntroductionInterceptor(dancer);

        ProxyFactory weaver = new ProxyFactory(new Singer());
        weaver.setInterfaces(new Class[]{IDancer.class,ISinger.class});
        weaver.addAdvice(interceptor);
        Object proxy = weaver.getProxy();
        ((IDancer)proxy).dance();
        ((ISinger)proxy).sing();
    }
}
```

# Aspect

我们知道@Aspect可以用来表示Aspect。不过在针对面向API编程的Spring AOP中，`Advisor`用来表示Spring中的Aspect。`Advisor`只能看成是一种特殊的`Aspect`，因为在`Advisor`中通常只持有一个Pointcut和一个Advice（实际的Aspect定义中可以有多个Pointcut和多个Advice）。

Advisor可以分为两种：

- PointcutAdvisor
- IntroductionAdvisor

# 织入

**织入就是为了创建代理对象。**当有了切入点和横切逻辑（advice）之后，如何在目标对象（或方法）中加入横切逻辑呢？这个时候我们需要借助织入器将横切逻辑织入目标对象当中。

在Spring AOP中，根据一次创建代理的个数，可以分为创建单个代理的织入器和创建多个代理的织入器（即自动代理）。

Spring AOP中创建**单个代理**的织入器的类有：

- ProxyFactory
- ProxyFactoryBean
- AspectJProxyFactory

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