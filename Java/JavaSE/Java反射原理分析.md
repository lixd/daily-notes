# Java反射原理分析

## 1. 类加载器

### 1.1 类的加载

当程序要使用某个类时，如果该类还未被加载到内存中，则系统会通过加载，连接，初始化三步来实现对这个类进行初始化。

*  加载 

  就是指将class文件读入内存，并为之创建一个Class对象。

  任何类被使用时系统都会建立一个Class对象

* 连接
  * 验证 是否有正确的内部结构，并和其他类协调一致
  * 准备 负责为类的静态成员分配内存，并设置默认初始化值
  * 解析 将类的二进制数据中的符号引用替换为直接引用

* 初始化 

就是我们以前讲过的初始化步骤

### 1.2   类初始化时机

1. 创建类的实例

2. 类的静态变量，或者为静态变量赋值

3. 类的静态方法

4. 使用反射方式来强制创建某个类或接口对应的java.lang.Class对象

5. 初始化某个类的子类

6. 直接使用java.exe命令来运行某个主类

### 1.3 类加载器

负责将.class文件加载到内在中，并为之生成对应的Class对象。虽然我们不需要关心类加载机制，但是了解这个机制我们就能更好的理解程序的运行

* Bootstrap ClassLoader 根类加载器

  也被称为引导类加载器，负责Java核心类的加载

  比如System,String等。在JDK中JRE的lib目录下rt.jar文件中

* Extension ClassLoader 扩展类加载器

  负责JRE的扩展目录中jar包的加载。

  在JDK中JRE的lib目录下ext目录

* System ClassLoader 系统类加载器

  负责在JVM启动时加载来自java命令的class文件，以及classpath环境变量所指定的jar包和类路径。  

## 2. 反射

JAVA反射机制是在运行状态中，对于任意一个类，都能够知道这个类的所有属性和方法；对于任意一个对象，都能够调用它的任意一个方法和属性；这种动态获取的信息以及动态调用对象的方法的功能称为java语言的反射机制。

要想解剖一个类,必须先要获取到该类的字节码文件对象。而解剖使用的就是Class类中的方法.所以先要获取到每一个字节码文件对应的Class类型的对象。

**获取字节码文件中的字段**

```java
Class clazz = Class.forName("cn.itcast.bean.Person");
//获取该类中的指定字段。比如age
Field field = clazz.getDeclaredField("age");//clazz.getField("age");	//为了对该字段进行操作，必须要先有指定类的对象。
Object obj = clazz.newInstance();
	//对私有访问，必须取消对其的访问控制检查，使用AccessibleObject父类中的setAccessible的方法
field.setAccessible(true);//暴力访问。
field.set(obj, 789);
	//获取该字段的值。
Object o = field.get(obj);
System.out.println(o);
//getDeclaredField：获取所有属性，包括私有。
//getField:获取公开属性，包括从父类继承过来的，不包括非公开方法。
```

**获取字节码文件中的方法**

```java
//根据名称获取其对应的字节码文件对象
Class clazz = Class.forName("cn.itcast.bean.Person");
//调用字节码文件对象的方法getMethod获取class对象所表示的类的公共成员方法(指定方法)，参数为方法名和当前方法的参数，无需创建对象，它是静态方法
Method method = clazz.getMethod("staticShow", null);
//调用class对象所表示的类的公共成员方法，需要指定对象和方法中的参数列表
method.invoke(null, null);
………………………………………………………………………………………………………
Class clazz = Class.forName("cn.itcast.bean.Person");	
	//获取指定方法。
Method method = clazz.getMethod("publicShow", null);
	//获取指定的类对象。 
Object obj = clazz.newInstance();
method.invoke(obj, null);//对哪个对象调用方法，是参数组
```

## 3. 反射原理

### 3.1 Method获取

调用`Class`类的`getDeclaredMethod`可以获取指定方法名和参数的方法对象`Method`。

**getDeclaredMethod**

```java
    @CallerSensitive
    public Method getDeclaredMethod(String name, Class<?>... parameterTypes)
        throws NoSuchMethodException, SecurityException {
        checkMemberAccess(Member.DECLARED, Reflection.getCallerClass(), true);
        Method method = searchMethods(privateGetDeclaredMethods(false), name, parameterTypes);
        if (method == null) {
            throw new NoSuchMethodException(getName() + "." + name + argumentTypesToString(parameterTypes));
        }
        return method;
    }
//其中privateGetDeclaredMethods方法从缓存或JVM中获取该Class中申明的方法列表，searchMethods方法将从返回的方法列表里找到一个匹配名称和参数的方法对象。
```

**searchMethods**

```java
private static Method searchMethods(Method[] methods,
                                    String name,
                                    Class<?>[] parameterTypes)
{
    Method res = null;
    String internedName = name.intern();
    for (int i = 0; i < methods.length; i++) {
        Method m = methods[i];
        if (m.getName() == internedName
            && arrayContentsEq(parameterTypes, m.getParameterTypes())
            && (res == null
                || res.getReturnType().isAssignableFrom(m.getReturnType())))
            res = m;
    }

    return (res == null ? res : getReflectionFactory().copyMethod(res));
}
//如果找到一个匹配的Method，则重新copy一份返回，即Method.copy()方法
```

**copy**

```java
/**
 * Package-private routine (exposed to java.lang.Class via
 * ReflectAccess) which returns a copy of this Method. The copy's
 * "root" field points to this Method.
 */
Method copy() {
    // This routine enables sharing of MethodAccessor objects
    // among Method objects which refer to the same underlying
    // method in the VM. (All of this contortion is only necessary
    // because of the "accessibility" bit in AccessibleObject,
    // which implicitly requires that new java.lang.reflect
    // objects be fabricated for each reflective call on Class
    // objects.)
    if (this.root != null)
        throw new IllegalArgumentException("Can not copy a non-root Method");

    Method res = new Method(clazz, name, parameterTypes, returnType,
                            exceptionTypes, modifiers, slot, signature,
                            annotations, parameterAnnotations, annotationDefault);
    res.root = this;
    // Might as well eagerly propagate this if already present
    res.methodAccessor = methodAccessor;
    return res;
}
//每次调用getDeclaredMethod方法返回的Method对象其实都是一个新的对象，且新对象的root属性都指向原来的Method对象，如果需要频繁调用，最好把Method对象缓存起来。
```

### 3.2 Method调用

获取到指定的方法对象`Method`之后，就可以调用它的`invoke`方法了，`invoke`实现如下：

**invoke**

```java
@CallerSensitive
public Object invoke(Object obj, Object... args)
    throws IllegalAccessException, IllegalArgumentException,
       InvocationTargetException
{
    if (!override) {
        if (!Reflection.quickCheckMemberAccess(clazz, modifiers)) {
            Class<?> caller = Reflection.getCallerClass();
            checkAccess(caller, clazz, obj, modifiers);
        }
    }
    MethodAccessor ma = methodAccessor;             // read volatile
    if (ma == null) {
        ma = acquireMethodAccessor();
    }
    return ma.invoke(obj, args);
}
```

invoke方法会首先检查AccessibleObject的override属性的值。AccessibleObject 类是 Field、Method 和 Constructor 对象的基类。它提供了将反射的对象标记为在使用时取消默认 Java 语言访问控制检查的能力。

verride的值默认是false,表示需要权限调用规则，调用方法时需要检查权限;我们也可以用setAccessible方法设置为true,若override的值为true，表示忽略权限规则，调用方法时无需检查权限（也就是说可以调用任意的private方法，违反了封装）。



Method.invoke()实际上并不是自己实现的反射调用逻辑，而是委托给sun.reflect.MethodAccessor来处理。

**MethodAccessor**

```java
public interface MethodAccessor {
    Object invoke(Object var1, Object[] var2) throws IllegalArgumentException, InvocationTargetException;
}
//具体实现类
//sun.reflect.DelegatingMethodAccessorImpl
//sun.reflect.MethodAccessorImpl
//sun.reflect.NativeMethodAccessorImpl
```

第一次调用一个Java方法对应的Method对象的invoke()方法之前，实现调用逻辑的MethodAccessor对象还没有创建；等第一次调用时才新创建MethodAccessor并更新给root，然后调用MethodAccessor.invoke()完成反射调用：

**acquireMethodAccessor**

```java
// NOTE that there is no synchronization used here. It is correct
// (though not efficient) to generate more than one MethodAccessor
// for a given Method. However, avoiding synchronization will
// probably make the implementation more scalable.
private MethodAccessor acquireMethodAccessor() {
    // First check to see if one has been created yet, and take it
    // if so
    MethodAccessor tmp = null;
    if (root != null) tmp = root.getMethodAccessor();
    if (tmp != null) {
        methodAccessor = tmp;
    } else {
        // Otherwise fabricate one and propagate it up to the root
        tmp = reflectionFactory.newMethodAccessor(this);
        setMethodAccessor(tmp);
    }

    return tmp;
}
```

可以看到methodAccessor实例由reflectionFactory对象操控生成，它在AccessibleObject下的声明如下:

```java
// Fetches the factory for reflective objects
private static ReflectionFactory getReflectionFactory() {
    if (reflectionFactory == null) {
        reflectionFactory =
            java.security.AccessController.doPrivileged
                (new sun.reflect.ReflectionFactory.GetReflectionFactoryAction());
    }
    return reflectionFactory;
}
private static ReflectionFactory reflectionFactory;
```

```java
public MethodAccessor newMethodAccessor(Method var1) {
    checkInitted();
    if (noInflation && !ReflectUtil.isVMAnonymousClass(var1.getDeclaringClass())) {
        return (new MethodAccessorGenerator()).generateMethod(var1.getDeclaringClass(), var1.getName(), var1.getParameterTypes(), var1.getReturnType(), var1.getExceptionTypes(), var1.getModifiers());
    } else {
        NativeMethodAccessorImpl var2 = new NativeMethodAccessorImpl(var1);
        DelegatingMethodAccessorImpl var3 = new DelegatingMethodAccessorImpl(var2);
        var2.setParent(var3);
        return var3;
    }
}
```

实际的MethodAccessor实现有两个版本，一个是Java版本，一个是native版本，两者各有特点。初次启动时Method.invoke()和Constructor.newInstance()方法采用native方法要比Java方法快3-4倍，而启动后native方法又要消耗额外的性能而慢于Java方法。也就是说，Java实现的版本在初始化时需要较多时间，但长久来说性能较好；native版本正好相反，启动时相对较快，但运行时间长了之后速度就比不过Java版了。这是HotSpot的优化方式带来的性能特性，同时也是许多虚拟机的共同点：跨越native边界会对优化有阻碍作用，它就像个黑箱一样让虚拟机难以分析也将其内联，于是运行时间长了之后反而是托管版本的代码更快些。

为了尽可能地减少性能损耗，HotSpot JDK采用“inflation”的技巧：让Java方法在被反射调用时，开头若干次使用native版，等反射调用次数超过阈值时则生成一个专用的MethodAccessor实现类，生成其中的invoke()方法的字节码，以后对该Java方法的反射调用就会使用Java版本。 这项优化是从JDK 1.4开始的。

研究ReflectionFactory.newMethodAccessor()生产MethodAccessor对象的逻辑，一开始(native版)会生产NativeMethodAccessorImpl和DelegatingMethodAccessorImpl两个对象。
DelegatingMethodAccessorImpl的源码如下：

```java
class DelegatingMethodAccessorImpl extends MethodAccessorImpl {
    private MethodAccessorImpl delegate;

    DelegatingMethodAccessorImpl(MethodAccessorImpl var1) {
        this.setDelegate(var1);
    }

    public Object invoke(Object var1, Object[] var2) throws IllegalArgumentException, InvocationTargetException {
        return this.delegate.invoke(var1, var2);
    }

    void setDelegate(MethodAccessorImpl var1) {
        this.delegate = var1;
    }
}
```

它其实是一个中间层，方便在native版与Java版的MethodAccessor之间进行切换。
然后下面就是native版MethodAccessor的Java方面的声明：
sun.reflect.NativeMethodAccessorImpl：

```java
class NativeMethodAccessorImpl extends MethodAccessorImpl {
    private final Method method;
    private DelegatingMethodAccessorImpl parent;
    private int numInvocations;

    NativeMethodAccessorImpl(Method var1) {
        this.method = var1;
    }

    public Object invoke(Object var1, Object[] var2) throws IllegalArgumentException, InvocationTargetException {
        if (++this.numInvocations > ReflectionFactory.inflationThreshold() && !ReflectUtil.isVMAnonymousClass(this.method.getDeclaringClass())) {
            MethodAccessorImpl var3 = (MethodAccessorImpl)(new MethodAccessorGenerator()).generateMethod(this.method.getDeclaringClass(), this.method.getName(), this.method.getParameterTypes(), this.method.getReturnType(), this.method.getExceptionTypes(), this.method.getModifiers());
            this.parent.setDelegate(var3);
        }

        return invoke0(this.method, var1, var2);
    }

    void setParent(DelegatingMethodAccessorImpl var1) {
        this.parent = var1;
    }

    private static native Object invoke0(Method var0, Object var1, Object[] var2);
}
```



每次NativeMethodAccessorImpl.invoke()方法被调用时，程序调用计数器都会增加1，看看是否超过阈值；一旦超过，则调用MethodAccessorGenerator.generateMethod()来生成Java版的MethodAccessor的实现类，并且改变

**`invoke0`**

invoke0方法是一个native方法,它在HotSpot JVM里调用JVM_InvokeMethod函数:

```java
JNIEXPORT jobject JNICALL Java_sun_reflect_NativeMethodAccessorImpl_invoke0
(JNIEnv *env, jclass unused, jobject m, jobject obj, jobjectArray args)
{
    return JVM_InvokeMethod(env, m, obj, args);
}
```

openjdk/hotspot/src/share/vm/prims/jvm.cpp

```c++
JVM_ENTRY(jobject, JVM_InvokeMethod(JNIEnv *env, jobject method, jobject obj, jobjectArray args0))
  JVMWrapper("JVM_InvokeMethod");
  Handle method_handle;
  if (thread->stack_available((address) &method_handle) >= JVMInvokeMethodSlack) {
    method_handle = Handle(THREAD, JNIHandles::resolve(method));
    Handle receiver(THREAD, JNIHandles::resolve(obj));
    objArrayHandle args(THREAD, objArrayOop(JNIHandles::resolve(args0)));
    oop result = Reflection::invoke_method(method_handle(), receiver, args, CHECK_NULL);
    jobject res = JNIHandles::make_local(env, result);
    if (JvmtiExport::should_post_vm_object_alloc()) {
      oop ret_type = java_lang_reflect_Method::return_type(method_handle());
      assert(ret_type != NULL, "sanity check: ret_type oop must not be NULL!");
      if (java_lang_Class::is_primitive(ret_type)) {
        // Only for primitive type vm allocates memory for java object.
        // See box() method.
        JvmtiExport::post_vm_object_alloc(JavaThread::current(), result);
      }
    }
    return res;
  } else {
    THROW_0(vmSymbols::java_lang_StackOverflowError());
  }
JVM_END
```



其关键部分为Reflection::invoke_method:
openjdk/hotspot/src/share/vm/runtime/reflection.cpp

```c++
oop Reflection::invoke_method(oop method_mirror, Handle receiver, objArrayHandle args, TRAPS) {
  oop mirror             = java_lang_reflect_Method::clazz(method_mirror);
  int slot               = java_lang_reflect_Method::slot(method_mirror);
  bool override          = java_lang_reflect_Method::override(method_mirror) != 0;
  objArrayHandle ptypes(THREAD, objArrayOop(java_lang_reflect_Method::parameter_types(method_mirror)));

  oop return_type_mirror = java_lang_reflect_Method::return_type(method_mirror);
  BasicType rtype;
  if (java_lang_Class::is_primitive(return_type_mirror)) {
    rtype = basic_type_mirror_to_basic_type(return_type_mirror, CHECK_NULL);
  } else {
    rtype = T_OBJECT;
  }

  instanceKlassHandle klass(THREAD, java_lang_Class::as_Klass(mirror));
  Method* m = klass->method_with_idnum(slot);
  if (m == NULL) {
    THROW_MSG_0(vmSymbols::java_lang_InternalError(), "invoke");
  }
  methodHandle method(THREAD, m);

  return invoke(klass, method, receiver, override, ptypes, rtype, args, true, THREAD);
}
```

Java版MethodAccessor的生成使用MethodAccessorGenerator实现运用了asm动态生成字节码技术（sun.reflect.ClassFileAssembler)，原理比较复杂.

## 参考

`原文: http://www.sczyh30.com/posts/Java/java-reflection-2/　　作者: sczyh30`