# ThreadLocal

## 1. 概述

ThreadLocal 用一种存储变量与线程绑定的方式，在每个线程中用自己的 ThreadLocalMap 安全隔离变量，为解决多线程程序的并发问题提供了一种新的思路，如为每个线程创建一个独立的数据库连接。

## 2. 核心方法

### 2.1 set

```java
public void set(T value) {
    Thread t = Thread.currentThread(); // 获取当前线程
    ThreadLocalMap map = getMap(t); // 拿到当前线程的 ThreadLocalMap
    if (map != null) // 判断 ThreadLocalMap 是否存在
        map.set(this, value); // 调用 ThreadLocalMap 的 set 方法
    else
        createMap(t, value); // 创建 ThreadLocalMap
}

ThreadLocalMap getMap(Thread t) {
    return t.threadLocals;
}

void createMap(Thread t, T firstValue) {
    t.threadLocals = new ThreadLocalMap(this, firstValue);
}
```

第一次调用时需要 creatMap，创建方式比较简单，不详解。这里重要的还是 ThreadLocalMap 的 set 方法。

步骤：

* 1.获取当前线程的成员变量map
* 2.map非空，则重新将ThreadLocal和新的value副本放入到map中。
* 3.map空，则对线程的成员变量ThreadLocalMap进行初始化创建，并将ThreadLocal和value副本放入map中。

### 2.2 get

```java
public T get() {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null) {
        ThreadLocalMap.Entry e = map.getEntry(this); //调用  ThreadLocalMap 的 getEntry 方法
        if (e != null) {
            @SuppressWarnings("unchecked")
            T result = (T)e.value;
            return result;
        }
    }
    return setInitialValue(); // 如果还没有设置，可以用子类实现 initialValue ，自定义初始值。
}
ThreadLocalMap getMap(Thread t) {
    return t.threadLocals;
}
private T setInitialValue() {
    T value = initialValue();
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null)
        map.set(this, value);
    else
        createMap(t, value);
    return value;
}

protected T initialValue() {
    return null;
}
```

步骤：

* 1.获取当前线 程的 ThreadLocalMa p对象 threadLocals
* 2.从 map 中获取线程存储的 K-V Entry 节点。
* 3.从 Entry 节点获取存储的 Value 副本值返回。
* 4.map 为空的话返回初始值 null，即线程变量副本为 null，在使用时需要注意判断 NullPointerException。

### 2.3 remove

```java
public void remove() {
    ThreadLocalMap m = getMap(Thread.currentThread());
    if (m != null)
        m.remove(this); // 调用 ThreadLocalMap 的 remove方法
}
ThreadLocalMap getMap(Thread t) {
    return t.threadLocals;
}
```

通过上面这几个方法可以看到，其实所有工作最终都落到了 ThreadLocalMap 的头上，ThreadLocal 仅仅是从当前线程取到 ThreadLocalMap 而已。

## 3. ThreadLocalMap

### 简介

ThreadLocalMap 是ThreadLocal 内部的一个Map实现，然而它并没有实现任何集合的接口规范，因为它仅供内部使用，数据结构采用 数组 + 开方地址法，Entry 继承 WeakReference，是基于 ThreadLocal 这种特殊场景实现的 Map，它的实现方式很值得研究。

在ThreadLocalMap中，也是用Entry来保存K-V结构数据的。但是Entry中key只能是ThreadLocal对象，这点被Entry的构造方法已经限定死了。

```java
static class Entry extends WeakReference<ThreadLocal> {
    /** The value associated with this ThreadLocal. */
    Object value;

    Entry(ThreadLocal k, Object v) {
        super(k);
        value = v;
    }
}
```

Entry继承自WeakReference（弱引用，生命周期只能存活到下次GC前），但只有Key是弱引用类型的，Value并非弱引用。

### Hash冲突怎么解决

和HashMap的最大的不同在于，ThreadLocalMap结构非常简单，没有next引用，也就是说ThreadLocalMap中解决Hash冲突的方式并非链表的方式，而是采用线性探测的方式，所谓线性探测，就是根据初始key的hashcode值确定元素在table数组中的位置，如果发现这个位置上已经有其他key值的元素被占用，则利用固定的算法寻找一定步长的下个位置，依次判断，直至找到能够存放的位置。

ThreadLocalMap解决Hash冲突的方式就是简单的步长加1或减1，寻找下一个相邻的位置。

```java
/**
 * Increment i modulo len.
 */
private static int nextIndex(int i, int len) {
    return ((i + 1 < len) ? i + 1 : 0);
}

/**
 * Decrement i modulo len.
 */
private static int prevIndex(int i, int len) {
    return ((i - 1 >= 0) ? i - 1 : len - 1);
}
```

显然ThreadLocalMap采用线性探测的方式解决Hash冲突的效率很低，如果有大量不同的ThreadLocal对象放入map中时发送冲突，或者发生二次冲突，则效率很低。

**所以这里引出的良好建议是：每个线程只存一个变量，这样的话所有的线程存放到map中的Key都是相同的ThreadLocal，如果一个线程要保存多个变量，就需要创建多个ThreadLocal，多个ThreadLocal放入Map中时会极大的增加Hash冲突的可能。**



## 4. 内存泄漏

由于ThreadLocalMap的key是弱引用，而Value是强引用。这就导致了一个问题，ThreadLocal在没有外部对象强引用时，发生GC时弱引用Key会被回收，而Value不会回收，如果创建ThreadLocal的线程一直持续运行，那么这个Entry对象中的value就有可能一直得不到回收，发生内存泄露。

**如何避免泄漏**
 既然Key是弱引用，那么我们要做的事，就是在调用ThreadLocal的get()、set()方法时完成后再调用remove方法，将Entry节点和Map的引用关系移除，这样整个Entry对象在GC Roots分析后就变成不可达了，下次GC的时候就可以被回收。

如果使用ThreadLocal的set方法之后，没有显示的调用remove方法，就有可能发生内存泄露，所以养成良好的编程习惯十分重要，使用完ThreadLocal之后，记得调用remove方法。

```java
ThreadLocal<Session> threadLocal = new ThreadLocal<Session>();
try {
    threadLocal.set(new Session(1, "Misout的博客"));
    // 其它业务逻辑
} finally {
    threadLocal.remove();
}
```

### 应用场景

还记得Hibernate的session获取场景吗？

```java
private static final ThreadLocal<Session> threadLocal = new ThreadLocal<Session>();

//获取Session
public static Session getCurrentSession(){
    Session session =  threadLocal.get();
    //判断Session是否为空，如果为空，将创建一个session，并设置到本地线程变量中
    try {
        if(session ==null&&!session.isOpen()){
            if(sessionFactory==null){
                rbuildSessionFactory();// 创建Hibernate的SessionFactory
            }else{
                session = sessionFactory.openSession();
            }
        }
        threadLocal.set(session);
    } catch (Exception e) {
        // TODO: handle exception
    }

    return session;
}
```

为什么？每个线程访问数据库都应当是一个独立的Session会话，如果多个线程共享同一个Session会话，有可能其他线程关闭连接了，当前线程再执行提交时就会出现会话已关闭的异常，导致系统异常。此方式能避免线程争抢Session，提高并发下的安全性。

使用ThreadLocal的典型场景正如上面的数据库连接管理，线程会话管理等场景，只适用于独立变量副本的情况，如果变量为全局共享的，则不适用在高并发下使用。

## 5. 总结

- 每个ThreadLocal只能保存一个变量副本，如果想要上线一个线程能够保存多个副本以上，就需要创建多个ThreadLocal。
- ThreadLocal内部的ThreadLocalMap键为弱引用，会有内存泄漏的风险。
- 适用于无状态，副本变量独立后不影响业务逻辑的高并发场景。如果如果业务逻辑强依赖于副本变量，则不适合用ThreadLocal解决，需要另寻解决方案。

![](https://upload-images.jianshu.io/upload_images/4943997-cac8c7ca612012f7.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/780/format/webp)

**ThreadLocal的内部结构图**

![](https://upload-images.jianshu.io/upload_images/7432604-ad2ff581127ba8cc.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/806/format/webp)



ThreadLocal的核心机制：

- 每个Thread线程内部都有一个Map。
- Map里面存储线程本地对象（key）和线程的变量副本（value）
- 但是，Thread内部的Map是由ThreadLocal维护的，由ThreadLocal负责向map获取和设置线程的变量值。

## 6. 参考

`https://www.jianshu.com/p/98b68c97df9b`

`https://www.cnblogs.com/dolphin0520/p/3920407.html`