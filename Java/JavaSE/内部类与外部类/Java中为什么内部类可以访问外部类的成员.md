# Java中为什么内部类可以访问外部类的成员

## 1. 概述

**内部类就是定义在一个类内部的类**。

定义在类内部的类有两种情况：

* 一种是被static关键字修饰的， 叫做静态内部类.
* 另一种是不被static关键字修饰的， 就是普通内部类。

**注**：在下文中所提到的内部类都是指这种不被static关键字修饰的普通内部类

静态内部类虽然也定义在外部类的里面， 但是它只是在形式上（写法上）和外部类有关系， 其实在逻辑上和外部类并没有直接的关系。而一般的内部类，不仅在形式上和外部类有关系（写在外部类的里面）， 在逻辑上也和外部类有联系。 

这种逻辑上的关系可以总结为以下两点：

* 1.内部类对象的创建依赖于外部类对象
* 2.内部类对象持有指向外部类对象的引用。

上边的第二条可以解释为什么在内部类中可以访问外部类的成员。就是因为内部类对象持有外部类对象的引用。

## 2. 测试

###  2.1 测试类

```java
public class Outer {
	int outerField = 0;
	
	class Inner{
		void InnerMethod(){
			int i = outerField;
		}
	}
}
```

虽然这两个类写在同一个文件中， 但是编译完成后， 还是生成各自的class文件： 

 // TODO 图片

### 2.2 反编译

这里我们的目的是探究内部类的行为， 所以只反编译内部类的class文件Outer$Inner.class 。 在命令行中， 切换到工程的bin目录， 输入以下命令反编译这个类文件：

```cmd
javap -classpath . -v Outer$Inner 
```

> `-classpath .`  :  说明在当前目录下寻找要反编译的class文件
> `-v`   : 加上这个参数输出的信息比较全面。包括常量池和方法内的局部变量表， 行号， 访问标志等等。



```java
D:\lillusory\Java\work_idea\java-learning\target\classes\jvm\innerclass>javap -c
lasspath . -v Outer$Inner
警告: 二进制文件Outer$Inner包含jvm.innerclass.Outer$Inner
Classfile /D:/lillusory/Java/work_idea/java-learning/target/classes/jvm/innercla
ss/Outer$Inner.class
  Last modified 2019-4-29; size 596 bytes
  MD5 checksum 1c7365a21e81dd01b3c6b115c1a72484
  Compiled from "Outer.java"
  <!--类信息-->
class jvm.innerclass.Outer$Inner
  minor version: 0
  major version: 52
  flags: ACC_SUPER
  <!--常量池-->
Constant pool:
   #1 = Fieldref           #4.#24         // jvm/innerclass/Outer$Inner.this$0:L
jvm/innerclass/Outer;
   #2 = Methodref          #5.#25         // java/lang/Object."<init>":()V
   #3 = Fieldref           #26.#27        // jvm/innerclass/Outer.outerField:I
   #4 = Class              #28            // jvm/innerclass/Outer$Inner
   #5 = Class              #29            // java/lang/Object
   #6 = Utf8               this$0
   #7 = Utf8               Ljvm/innerclass/Outer;
   #8 = Utf8               <init>
   #9 = Utf8               (Ljvm/innerclass/Outer;)V
  #10 = Utf8               Code
  #11 = Utf8               LineNumberTable
  #12 = Utf8               LocalVariableTable
  #13 = Utf8               this
  #14 = Utf8               Inner
  #15 = Utf8               InnerClasses
  #16 = Utf8               Ljvm/innerclass/Outer$Inner;
  #17 = Utf8               MethodParameters
  #18 = Utf8               InnerMethod
  #19 = Utf8               ()V
  #20 = Utf8               i
  #21 = Utf8               I
  #22 = Utf8               SourceFile
  #23 = Utf8               Outer.java
  #24 = NameAndType        #6:#7          // this$0:Ljvm/innerclass/Outer;
  #25 = NameAndType        #8:#19         // "<init>":()V
  #26 = Class              #30            // jvm/innerclass/Outer
  #27 = NameAndType        #31:#21        // outerField:I
  #28 = Utf8               jvm/innerclass/Outer$Inner
  #29 = Utf8               java/lang/Object
  #30 = Utf8               jvm/innerclass/Outer
  #31 = Utf8               outerField
  <!--从这里开始看-->
{
  final jvm.innerclass.Outer this$0;
    descriptor: Ljvm/innerclass/Outer;
    flags: ACC_FINAL, ACC_SYNTHETIC

  jvm.innerclass.Outer$Inner(jvm.innerclass.Outer);
    descriptor: (Ljvm/innerclass/Outer;)V
    flags:
    Code:
      stack=2, locals=2, args_size=2
         0: aload_0
         1: aload_1
         2: putfield      #1                  // Field this$0:Ljvm/innerclass/Ou
ter;
         5: aload_0
         6: invokespecial #2                  // Method java/lang/Object."<init>
":()V
         9: return
      LineNumberTable:
        line 9: 0
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0      10     0  this   Ljvm/innerclass/Outer$Inner;
            0      10     1 this$0   Ljvm/innerclass/Outer;
    MethodParameters:
      Name                           Flags
      this$0                         final mandated

  void InnerMethod();
    descriptor: ()V
    flags:
    Code:
      stack=1, locals=2, args_size=1
         0: aload_0
         1: getfield      #1                  // Field this$0:Ljvm/innerclass/Ou
ter;
         4: getfield      #3                  // Field jvm/innerclass/Outer.oute
rField:I
         7: istore_1
         8: return
      LineNumberTable:
        line 11: 0
        line 12: 8
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0       9     0  this   Ljvm/innerclass/Outer$Inner;
            8       1     1     i   I
}
SourceFile: "Outer.java"
InnerClasses:
     #14= #4 of #26; //Inner=class jvm/innerclass/Outer$Inner of class jvm/inner
class/Outer

```

### 2.3 解析

暂时不看常量池等其他信息，从50行开始，可以看到第一行信息如下：

```java
final jvm.innerclass.Outer this$0;
```

这句话的意思是， 在内部类`Outer$Inner`中， 存在一个名字为`this$0` ， 类型为`jvm.innerclass.Outer`的成员变量， 并且这个变量是`final`的。 其实这个就是所谓的“在内部类对象中存在的指向外部类对象的引用”。

但是我们在定义这个内部类的时候， 并没有声明它， 所以这个成员变量是编译器加上的。

虽然编译器在创建内部类时为它加上了一个指向外部类的引用， 但是这个引用是怎样赋值的呢？毕竟必须先给他赋值，它才能指向外部类对象。

下面我们把注意力转移到构造函数上,下面这段输出是关于构造函数的信息:

 ```java
  jvm.innerclass.Outer$Inner(jvm.innerclass.Outer);
    descriptor: (Ljvm/innerclass/Outer;)V
    flags:
    Code:
      stack=2, locals=2, args_size=2
         0: aload_0
         1: aload_1
         2: putfield      #1           // Field this$0:Ljvm/innerclass/Outer;
         5: aload_0
         6: invokespecial #2           // Method java/lang/Object."<init>":()V
         9: return
      LineNumberTable:
        line 9: 0
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0      10     0  this   Ljvm/innerclass/Outer$Inner;
            0      10     1 this$0   Ljvm/innerclass/Outer;
 ```

我们知道， **如果在一个类中， 不声明构造方法的话， 编译器会默认添加一个无参数的构造方法**。 但是这句话在这里就行不通了， 因为我们明明看到， 这个构造函数有一个构造方法， 并且类型为Outer。 所以说，**编译器会为内部类的构造方法添加一个参数， 参数的类型就是外部类的类型**。

下面我们看看在构造参数中如何使用这个默认添加的参数。 我们来分析一下构造方法的字节码。 下面是每行字节码的意义：

```java
aload_0 ：  
```

将局部变量表中的第一个引用变量加载到操作数栈。 这里有几点需要说明。 

* 1.局部变量表中的变量在方法执行前就已经初始化完成；
* 2.局部变量表中的变量包括方法的参数；
* 3.操作数栈就是执行当前代码的栈；
* 4.成员方法的局部变量表中的第一个变量永远是this；

**所以这句话的意思是： 将this引用从局部变量表加载到操作数栈**。

```java
aload_1：
```

将局部变量表中的第二个引用变量加载到操作数栈。

 这里加载的变量就是构造方法中的Outer类型的参数 .

```java
putfield      #1           // Field this$0:Ljvm/innerclass/Outer;
```

使用操作数栈顶端的引用变量为指定的成员变量赋值。 这里的意思是将外面传入的`Outer`类型的参数赋给成员变量``this$0` 。 

这一句``putfield`字节码就揭示了， 指向外部类对象的这个引用变量是如何赋值的。

后面几句如下：

```JAVA
         5: aload_0
         6: invokespecial #2           // Method java/lang/Object."<init>":()V
         9: return
```

大致就是**使用this引用调用父类（Object）的构造方法然后返回**。 

**这也印证了上面所说的内部类和外部类逻辑关系的第一条： 内部类对象的创建依赖于外部类对象**。 



在内部类的InnerMethod方法中， 访问了外部类的成员变量outerField， 下面的字节码揭示了访问是如何进行的： 

```java
  void InnerMethod();
    descriptor: ()V
    flags:
    Code:
      stack=1, locals=2, args_size=1
         0: aload_0
         1: getfield      #1         // Field this$0:Ljvm/innerclass/Outer;
         4: getfield      #3         // Field jvm/innerclass/Outer.outerField:I
         7: istore_1
         8: return
      LineNumberTable:
        line 11: 0
        line 12: 8
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0       9     0  this   Ljvm/innerclass/Outer$Inner;
            8       1     1     i   I
```



```java
getfield      #1         // Field this$0:Ljvm/innerclass/Outer;
```

将成员变量this$0加载到操作数栈上来 

```java
getfield      #3         // Field jvm/innerclass/Outer.outerField:I
```

使用上面加载的this$0引用， 将外部类的成员变量outerField加载到操作数栈 

```java
istore_1
```

将操作数栈顶端的int类型的值保存到局部变量表中的第二个变量上（注意， 第一个局部变量被this占用， 第二个局部变量是i）。操作数栈顶端的int型变量就是上一步加载的outerField变量。 

**所以， 这句字节码的含义就是： 使用`outerField`为i赋值**。 

上面三步就是内部类中是如何通过指向外部类对象的引用， 来访问外部类成员的。 

## 3. 总结

本文通过反编译内部类的字节码， 说明了内部类是如何访问外部类对象的成员的，除此之外， 我们也对编译器的行为有了一些了解， 编译器在编译时会自动加上一些逻辑， 这正是我们感觉困惑的原因。  

关于内部类如何访问外部类的成员， 分析之后其实也很简单， 主要是通过以下几步做到的：

* 1.编译器自动为内部类添加一个成员变量， 这个成员变量的类型和外部类的类型相同， 这个成员变量就是指向外部类对象的引用；
* 2.编译器自动为内部类的构造方法添加一个参数， 参数的类型是外部类的类型， 在构造方法内部使用这个参数为1中添加的成员变量赋值；
* 3.在调用内部类的构造函数初始化内部类对象时， 会默认传入外部类的引用。

## 4. 参考

`https://blog.csdn.net/weixin_39214481/article/details/80372676`