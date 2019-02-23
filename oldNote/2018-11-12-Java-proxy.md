---
layout: post
title: Java中的静态代理与动态代理
categories: [Java]
description: Java中的代理机制学习记录
keywords: Proxy, DynamicInvocation
---

# Java代理机制

## 1.静态代理

```
由程序员创建或特定工具自动生成源代码，也就是在编译时就已经将接口，被代理类，代理类等确定下来。在程序运行之前，代理类的.class文件就已经生成。

代理类和被代理类必须实现同一个接口
```

```java
//代理类和被代理类需要实现的接口
public interface Person {
    public void sayHello(String str);
}

//学生 被代理类
public class Student implements Person {
    @Override
    public void sayHello(String str) {
        System.out.println(str);
    }
}

//代理类
public class PersonProxy implements Person {
    //被代理的对象
    private Person person;

    //通过构造方法赋值
    public PersonProxy(Person person) {
        this.person = person;
    }

    @Override
    public void sayHello(String str) {
        //在执行代理方法前后可以执行其他的方法 代理模式的一个很大的优点
        System.out.println("Before");
        //在代理类的方法中 间接访问被代理对象的方法
        person.sayHello(str);
        System.out.println("After");

    }
}

      //测试代码
            public class ProxyTest {
                public static void main(String[] args) {
                    //被代理的对象
                    Student student = new Student();
                    //将被代理对象传递给代理对象
                    PersonProxy personProxy = new PersonProxy(student);
                    //代理对象调用方法
                    personProxy.sayHello("hello proxy");
                }
            }
   //输出结果
            Before
            hello proxy
            After
```



## 2.动态代理

```
理类在程序运行时创建的代理方式被成为动态代理。
```

同样是上边的Person接口 和Student被代理类

```java
1.创建一个类实现InvocationHandler接口
public class DynamicInvocationHandler implements InvocationHandler {
    //invocationHandler持有的被代理对象
    private Object object;

    public DynamicInvocationHandler(Object object) {
        this.object = object;
    }

    /**
     * @param proxy 代表动态代理对象
     * @param method 代表正在执行的方法
     * @param args  代表调用目标方法时传入的实参
     * @return
     * @throws Throwable
     */
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println("Before");
    	Object result = method.invoke(object,args);//传入被代理对象和参数
        System.out.println("After");
        return result;
    }
}

 //测试代码
            public class DynamicTest {
                public static void main(String[] args) {
                //创建一个实例对象，这个对象是被代理的对象
                Student studentB = new Student();
                //一组接口
                Class[] interfaces = {Person.class};
                //创建一个与代理对象相关联的InvocationHandler 将被代理对象传过去
                DynamicInvocationHandler dynamicInvocationHandler = new DynamicInvocationHandler(studentB);
//一个ClassLoader对象 这里dynamicInvocationHandler.getClass().getClassLoader()和studentB.getClass().getClassLoader()是同一个类加载器
                ClassLoader classLoader = dynamicInvocationHandler.getClass().getClassLoader();
//创建一个代理对象stuProxy来代理zhangsan，代理对象的每个执行方法都会替换执行Invocation中的invoke方法
//loader 一个ClassLoader对象，定义了由哪个ClassLoader对象来对生成的代理对象进行加载
//interfaces 一个Interface对象的数组，表示的是我将要给我需要代理的对象提供一组什么接口，
// 如果我提供了一组接口给它，那么这个代理对象就宣称实现了该接口(多态)，这样我就能调用这组接口中的方法了
//handler 一个InvocationHandler对象，表示的是当我这个动态代理对象在调用方法的时候，会关联到哪一个InvocationHandler对象上
                Person person = (Person) Proxy.newProxyInstance(classLoader, interfaces, dynamicInvocationHandler);
                //代理对象调用方法
                person.sayHello("hello Dynamic");
                }
            }
   //输出结果
            Before
            hello Dynamic
            After
```

## 3.CGLIB动态代理

```
JDK代理要求被代理的类必须实现接口，有很强的局限性。而CGLIB动态代理则没有此类强制性要求。简单的说，CGLIB会让生成的代理类继承被代理类，并在代理类中对代理方法进行强化处理(前置处理、后置处理等)。在CGLIB底层，其实是借助了ASM这个非常强大的Java字节码生成框架。
cglib原理是通过字节码技术为一个类创建子类，并在子类中采用方法拦截的技术拦截所有父类方法的调用，顺势织入横切逻辑。由于是通过子类来代理父类，因此不能代理被final字段修饰的方法。
```

```java
//轮船类
package com.zs.spring.demo1;

public class Ship {
    public void travel(){
        System.out.println("轮船正在行驶");
    }

}

//代理类 输出日志
package com.zs.spring.demo1;

import java.lang.reflect.Method;

import net.sf.cglib.proxy.Enhancer;
import net.sf.cglib.proxy.MethodInterceptor;
import net.sf.cglib.proxy.MethodProxy;

public class ShipProxy implements MethodInterceptor {
//通过Enhancer 创建代理对象
    private Enhancer enhancer = new Enhancer();

    //通过Class对象获取代理对象
    public Object getProxy(Class c){
        //设置创建子类的类
        enhancer.setSuperclass(c);
        enhancer.setCallback(this);
        return enhancer.create();
    }

    @Override
    public Object intercept(Object obj, Method m, Object[] args, MethodProxy proxy) throws Throwable {
        // TODO Auto-generated method stub
        System.out.println("日志开始...");
        //代理类调用父类的方法
        proxy.invokeSuper(obj, args);
        System.out.println("日志结束...");
        return null;
    }
}

//创建我的测试类
package com.zs.spring.demo1;
public class TestCgibl {
    public static void main(String[] args) {
        //创建我们的代理类
        ShipProxy Proxy = new ShipProxy();
        Ship ship = (Ship)Proxy.getProxy(Ship.class);
        ship.travel();

    }

}

//输出:

日志开始...
轮船正在行驶
日志结束...

```



| 代理方式      | 实现                                                         | 优点                                                         | 缺点                                                         | 特点                                                       |
| ------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ---------------------------------------------------------- |
| JDK静态代理   | 代理类与委托类实现同一接口，并且在代理类中需要硬编码接口     | 实现简单，容易理解                                           | 代理类需要硬编码接口，在实际应用中可能会导致重复编码，浪费存储空间并且效率很低 | 好像没啥特点                                               |
| JDK动态代理   | 代理类与委托类实现同一接口，主要是通过代理类实现InvocationHandler并重写invoke方法来进行动态代理的，在invoke方法中将对方法进行增强处理 | 不需要硬编码接口，代码复用率高                               | 只能够代理实现了接口的委托类                                 | 底层使用反射机制进行方法的调用                             |
| CGLIB动态代理 | 代理类将委托类作为自己的父类并为其中的非final委托方法创建两个方法，一个是与委托方法签名相同的方法，它在方法中会通过super调用委托方法；另一个是代理类独有的方法。在代理方法中，它会判断是否存在实现了MethodInterceptor接口的对象，若存在则将调用intercept方法对委托方法进行代理 | 可以在运行时对类或者是接口进行增强操作，且委托类无需实现接口 | 不能对final类以及final方法进行代理                           | 底层将方法全部存入一个数组中，通过数组索引直接进行方法调用 |

 

 

 

 

 