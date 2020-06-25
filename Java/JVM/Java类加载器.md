# 类加载器

## 1. 类加载器

Class类描述的是整个类的信息，在Class类中提供的方法`getName()`是根据ClassPath配置的路径来进行类加载的。若类加载的路径为文件、网络等时则必须进行类加载这是就需要用到ClassLoader类。

ClassPath：加载类的路径。

### 1.1 ClassLoad

类加载器用来加载 Java类到Java 虚拟机中。Java 源程序（.java 文件）在经过 Java 编译器编译之后就被转换成Java字节代码（.class 文件）。类加载器负责读取 Java 字节代码，并转换成 java.lang.Class 类的一个实例。

实则jdk默认提供如下几种类加载器：

  Java*虚拟机中可以安装多个类加载器，**系统默认三个主要的类加载器**，每个类负责加载特定位置的类：

### 1.2 BootStrap:

类加载器也是Java类，因为Java类的类加载器本身也是要被类加载器加载的，显然必须有第一个类加载器不是Java类，
这个正是`BootStrap`，使用C/C++代码写的，已经封装到JVM内核中了，而`ExtClassLoader`和`AppClassLoader`是Java类。

也称为启动类加载器或核心类加载器。由C++实现，是JVM虚拟机的一部分。

除BootStrap外其他类加载器是由Java语言实现，独立于JVM并且继承与iava.lang.ClassLoader。

主要负责加载JAVA_HOME/lib（典例：rt.jar）

bootStrap类加载器不能直接被程序使用。

### 1.3 ExtClassLoader:

扩展类加载器，主要加载JAVA_HOME/lib/ext

有Java语言实现可以被Java程序直接使用。

###  1.4 AppClassLoader

应用程序类加载器，主要负责用户类路径（ClassPath）配置下的类库。若用户为自定义类加载器则默认使用AppClassLoader。

以上三种类加载器加载的代码都必须要求在CLASSPATH中加载。

类加载器带来的好处：可以通过动态的路径进行类的加载操作。

用户决定类从哪里加载。

ClassLoad类中提供进行类加载的方法： protected Class<?> loadClass(String name, boolean resolve)

 两个类相等的前提：

必须是由同一个类加载器加载的前提下才有意义。否则，即使两个类来源于同一个Class 文件，被同一个虚拟机加载，只要加载他们的类加载器不同，那么这两个类注定相等。

## 2. 双亲委派模型

（1）双亲委派模型定义

四种类加载器的层次关系就称为双亲委派模型。

（2）双亲委派模型中除了BootStrap外，其他类加载器都有自己的父类加载器。

（3）工作流程：

首先，检查一下指定名称的类是否已经加载过，如果加载过了，就不需要再加载，直接返回。
如果此类没有加载过，那么，再判断一下是否有父加载器；如果有父加载器，则由父加载器加载（即调用parent.loadClass(name, false);）.
或者是调用bootstrap类加载器来加载。
如果父加载器及bootstrap类加载器都没有找到指定的类，那么调用当前类加载器的findClass方法来完成类加载。

### 委托机制加载原理：

每个类加载器加载类时，又先委托给其上级类加载器当所有祖宗类加载器没有加载到类，回到发起者类加载器，还加载不了，则会抛出ClassNotFoundException,不是再去找发起者类加载器的儿子，因为没有getChild()方法。
MyClassLoader->AppClassLoader->Ext-ClassLoader->BootStrap.自定定义的MyClassLoader1首先会先委托给
AppClassLoader,AppClassLoader 会委托给 ExtClassLoader,ExtClassLoader 会委托给 BootStrap，这时候BootStrap就去加载
，如果加载成功，就结束了。如果加载失败，就交给 ExtClassLoader 去加载，如果 ExtClassLoader 加载成功了，就结束了，
如果加载失败就交给 AppClassLoader 加载，如果加载成功，就结束了，如果加载失败，就交给自定义的 MyClassLoader1 类加载器加载，
如果加载失败，就报 ClassNotFoundException 异常，结束。

​           这里需要注意的是上述三个JDK提供的类加载器虽然是父子类加载器关系，但是没有使用继承，而是使用了组合关系。

上述过程即双亲委派模型：优点是java的类加载器一起具备了一种带优先级的层次关系，越是基础的类，越是被上层的类加载器进行加载，
保证了 java 程序的稳定运行

2*）如果类A中引用了类B,Java虚拟机将使用加载类A的类加载器来加载类B

3*）可以直接调用ClassLoader.loadClass(StringclassName)方法来指定某个类加载器去加载某个类

4*）首先当前线程的类加载器去加载线程中的第一个类(当前线程的类加载器：Thread类中有一个get/setContextClassLoader(ClassLoadercl);方法，
可以获取/指定本线程中的类加载器）



## 3. 自定义类加载器

自定义的类加载器默认的都是将挂载到系统类加载器的最低端AppClassLoader

**执行流程是：每个类加载器：loadClass→findClass→defineClass**.

findClass这个方法就是根据name来查找到class文件，在loadClass方法中用到，所以我们只能重写这个方法了，只要在这个方法中找到class文件，再将它用defineClass方法返回一个Class对象即可。defineClass这个方法很简单就是将class文件的字节数组编程一个class对象，这个方法肯定不能重写，内部实现是在C/C++代码中实现的
待加载类
```java
/**
 * 编译完成后改名在测试 不然根据双亲委派模型可知，
 * 会通过sun.misc.Launcher$AppClassLoader 类加载器加载
 *
 * @author illusory
 */
public class TestTemp {
    public void hello() {
        System.out.println("恩，是的，我是由 " + getClass().getClassLoader().getClass()
                + " 加载进来的");
    }
}
```

自定义类加载器
```java
/**
 * 自定义类加载器
 * 主要重写findClass(String name)方法
 *
 * @author illusory
 */
public class MyClassLoader extends ClassLoader {
    /**
     * 类路径
     */
    private String classPath;

    public MyClassLoader(String classPath) {
        this.classPath = classPath;
    }

    private byte[] loadByte(String name) throws Exception {
        name = name.replaceAll("\\.", "/");
        FileInputStream fis = new FileInputStream(classPath + "/" + name
                + ".class");
        int len = fis.available();
        byte[] data = new byte[len];
        fis.read(data);
        fis.close();
        return data;

    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        try {
            byte[] data = loadByte(name);
            return defineClass(name, data, 0, data.length);
        } catch (Exception e) {
            e.printStackTrace();
            throw new ClassNotFoundException();
        }
    }
}
```

测试类
```java
/**
 * 注意：
 * <p>
 * 如果你是直接在当前项目里面创建，待Test.java编译后，请把Test.class文件拷贝走，再将Test.java删除或者改个名字。
 * 因为如果Test.class存放在当前项目中，根据双亲委派模型可知，会通过sun.misc.Launcher$AppClassLoader 类加载器加载。
 * 为了让我们自定义的类加载器加载，我们把Test.class文件放入到其他目录。
 *
 * @author illusory
 */
public class ClassLoadTest {
    @Test
    public void test() throws Exception {
        MyClassLoader classLoader = new MyClassLoader("D:\\lillusory\\Java\\work_idea\\java-learning\\src\\main\\java");
        Class clazz = classLoader.loadClass("jvm.classload.Test");
        Object obj = clazz.newInstance();
        Method helloMethod = clazz.getDeclaredMethod("hello", null);
        helloMethod.invoke(obj, null);
        //恩，是的，我是由 class jvm.classload.MyClassLoader 加载进来的
    }
}
```



