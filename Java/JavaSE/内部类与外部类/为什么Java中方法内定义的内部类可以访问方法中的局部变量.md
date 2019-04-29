# 为什么Java中方法内定义的内部类可以访问方法中的局部变量

## 1. 概述

匿名内部类和非匿名内部类。

在平时写代码的过程中， 我们经常会写类似下面的代码段：

```java
public class Test {
    public static void main(String[] args) {
        final int count = 0;

        new Thread(){
            public void run() {
                int var = count;
            };
        }.start();
    }
}
```
这段代码在main方法中定义了一个匿名内部类， 并且创建了匿名内部类的一个对象， 使用这个对象调用了匿名内部类中的方法。 所有这些操作都在`new Thread(){}.start()` 这一句代码中完成， 这不禁让人感叹java的表达能力还是很强的。 上面的代码和以下代码等价：


```java
public class Test {
    public static void main(String[] args) {
        final int count = 0;

        //在方法中定义一个内部类
        class MyThread extends Thread{
            public void run() {
                int var = count;
            }
        }

        new MyThread().start();
    }
}
```


这里我们不关心方法中匿名内部类和非匿名内部类的区别， 我们只需要知道， 这两种方式都是定义在方法中的内部类， 他们的工作原理是相同的。 在本文中主要根据非匿名内部类讲解。 


让我们仔细观察上面的代码都有哪些“奇怪”的行为：



* 1.在外部类的main方法中有一个局部变量count， 并且在内部类的run方法中访问了这个count变量。 也就是说， 方法中定义的内部类， 可以访问方法中的局部变量（方法的参数也是局部变量）；
* 2.count变量使用final关键字修饰， 如果去掉final， 则编译失败。 也就是说被方法中的内部类访问的局部变量必须是final的。



由于我们经常这样做， 这样写代码， 久而久之养成了习惯， 就成了司空见惯的做法了。 但是如果要问为什么Java支持这样的做法， 恐怕很少有人能说的出来。 在下面， 我们就会分析为什么Java支持这种做法， 让我们不仅知其然， 还要知其所以然。

为什么定义在方法中的内部类可以访问方法中的局部变量？

## 2. 原理分析

### 2.1 当被访问的局部变量是编译时可确定的字面常量时

我们首先看这样一段代码， 本文的以下部分会以这样的代码进行讲解。 

```java
public class Outer {
    void outerMethod(){
        final  String localVar = "abc";

        /*定义在方法中的内部类*/
        class Inner{
            void innerMethod(){
                String a = localVar;
            }
        }
    }
}
```
在外部类的方法 outerMethod 中定义了成员变量 String localVar， 并且用一个编译时字面量 "abc" 给他赋值。在 outerMethod 方法中定义了内部类 Inner， 并且在内部类的方法 innerMethod 中访问了 localVar 变量。 接下来我们就根据这个例子来讲解为什么可以这样做。

首先看编译后的文件， 和普通的内部类一样， 定义在方法中的内部类在编译之后， 也有自己独立的class文件：

//TODO 图片

#### 1. 反编译

执行以下命令反编译该文件

```java
javap -classpath . -v Outer$1Inner
```

> `-classpath .`  :  说明在当前目录下寻找要反编译的class文件
> `-v`   : 加上这个参数输出的信息比较全面。包括常量池和方法内的局部变量表， 行号， 访问标志等等。

#### 2. 结果分析

```java
D:\lillusory\Java\work_idea\java-learning\target\classes\jvm\localfiled>javap -c
lasspath . -v Outer$1Inner

Classfile /D:/lillusory/Java/work_idea/java-learning/target/classes/jvm/localfil
ed/Outer$1Inner.class
  Last modified 2019-4-29; size 643 bytes
  MD5 checksum 12cea9ab1340856585960146078de1b3
  Compiled from "Outer.java"
   <!--版本号等信息-->
class jvm.localfiled.Outer$1Inner
  minor version: 0
  major version: 52
  flags: ACC_SUPER
  <!--常量池-->
Constant pool:
   #1 = Fieldref           #4.#27         // jvm/localfiled/Outer$1Inner.this$0:
Ljvm/localfiled/Outer;
   #2 = Methodref          #5.#28         // java/lang/Object."<init>":()V
   #3 = String             #29            // abc
   #4 = Class              #30            // jvm/localfiled/Outer$1Inner
   #5 = Class              #31            // java/lang/Object
   #6 = Utf8               this$0
   #7 = Utf8               Ljvm/localfiled/Outer;
   #8 = Utf8               <init>
   #9 = Utf8               (Ljvm/localfiled/Outer;)V
  #10 = Utf8               Code
  #11 = Utf8               LineNumberTable
  #12 = Utf8               LocalVariableTable
  #13 = Utf8               this
  #14 = Utf8               Inner
  #15 = Utf8               InnerClasses
  #16 = Utf8               Ljvm/localfiled/Outer$1Inner;
  #17 = Utf8               MethodParameters
  #18 = Utf8               innerMethod
  #19 = Utf8               ()V
  #20 = Utf8               a
  #21 = Utf8               Ljava/lang/String;
  #22 = Utf8               SourceFile
  #23 = Utf8               Outer.java
  #24 = Utf8               EnclosingMethod
  #25 = Class              #32            // jvm/localfiled/Outer
  #26 = NameAndType        #33:#19        // outerMethod:()V
  #27 = NameAndType        #6:#7          // this$0:Ljvm/localfiled/Outer;
  #28 = NameAndType        #8:#19         // "<init>":()V
  #29 = Utf8               abc
  #30 = Utf8               jvm/localfiled/Outer$1Inner
  #31 = Utf8               java/lang/Object
  #32 = Utf8               jvm/localfiled/Outer
  #33 = Utf8               outerMethod
 <!--从这里开始看-->
{
  final jvm.localfiled.Outer this$0;
    descriptor: Ljvm/localfiled/Outer;
    flags: ACC_FINAL, ACC_SYNTHETIC

  jvm.localfiled.Outer$1Inner(jvm.localfiled.Outer);
    descriptor: (Ljvm/localfiled/Outer;)V
    flags:
    Code:
      stack=2, locals=2, args_size=2
         0: aload_0
         1: aload_1
         2: putfield      #1                  // Field this$0:Ljvm/localfiled/Ou
ter;
         5: aload_0
         6: invokespecial #2                  // Method java/lang/Object."<init>
":()V
         9: return
      LineNumberTable:
        line 11: 0
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0      10     0  this   Ljvm/localfiled/Outer$1Inner;
            0      10     1 this$0   Ljvm/localfiled/Outer;
    MethodParameters:
      Name                           Flags
      this$0                         final mandated

  void innerMethod();
    descriptor: ()V
    flags:
    Code:
      stack=1, locals=2, args_size=1
         0: ldc           #3                  // String abc
         2: astore_1
         3: return
      LineNumberTable:
        line 13: 0
        line 14: 3
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0       4     0  this   Ljvm/localfiled/Outer$1Inner;
            3       1     1     a   Ljava/lang/String;
}
SourceFile: "Outer.java"
EnclosingMethod: #25.#26                // jvm.localfiled.Outer.outerMethod
InnerClasses:
     #14= #4; //Inner=class jvm/localfiled/Outer$1Inner
```

其中 InnerMethod 相关如下：

```java
  void innerMethod();
    descriptor: ()V
    flags:
    Code:
      stack=1, locals=2, args_size=1
         0: ldc           #3                  // String abc
         2: astore_1
         3: return
      LineNumberTable:
        line 13: 0
        line 14: 3
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0       4     0  this   Ljvm/localfiled/Outer$1Inner;
            3       1     1     a   Ljava/lang/String;
```



```java
ldc           #3                  // String abc
```

Idc 指令的意思是将索引指向的常量池中的项压入操作数栈。 这里的索引为3 ， 引用的常量池中的项为字符串“abc” 。 这句话就揭示了内部类访问方法局部变量的原理。 让我们从常量池第3项看起。 

 ```java
  #3 = String             #29            // abc
 ```

 但是这个字符串“abc”明明是定义在外部类Outer中的， 因为出现在外部类的outerMethod方法中。 为了查看这个“abc”是否在外部类中， 我们继续反编译外部类Outer.class 。

#### 3. 反编译外部类

反编译外部类结果如下：

```JAVA
D:\lillusory\Java\work_idea\java-learning\target\classes\jvm\localfiled>javap -c
lasspath . -v Outer.class
Classfile /D:/lillusory/Java/work_idea/java-learning/target/classes/jvm/localfil
ed/Outer.class
  Last modified 2019-4-29; size 471 bytes
  MD5 checksum 4442fd25b31a0563253f16e275643d11
  Compiled from "Outer.java"
public class jvm.localfiled.Outer
  minor version: 0
  major version: 52
  flags: ACC_PUBLIC, ACC_SUPER
Constant pool:
   #1 = Methodref          #4.#20         // java/lang/Object."<init>":()V
   #2 = String             #21            // abc
   #3 = Class              #22            // jvm/localfiled/Outer
   #4 = Class              #23            // java/lang/Object
   #5 = Class              #24            // jvm/localfiled/Outer$1Inner
   #6 = Utf8               Inner
   #7 = Utf8               InnerClasses
   #8 = Utf8               <init>
   #9 = Utf8               ()V
  #10 = Utf8               Code
  #11 = Utf8               LineNumberTable
  #12 = Utf8               LocalVariableTable
  #13 = Utf8               this
  #14 = Utf8               Ljvm/localfiled/Outer;
  #15 = Utf8               outerMethod
  #16 = Utf8               localVar
  #17 = Utf8               Ljava/lang/String;
  #18 = Utf8               SourceFile
  #19 = Utf8               Outer.java
  #20 = NameAndType        #8:#9          // "<init>":()V
  #21 = Utf8               abc
  #22 = Utf8               jvm/localfiled/Outer
  #23 = Utf8               java/lang/Object
  #24 = Utf8               jvm/localfiled/Outer$1Inner
{
  public jvm.localfiled.Outer();
    descriptor: ()V
    flags: ACC_PUBLIC
    Code:
      stack=1, locals=1, args_size=1
         0: aload_0
         1: invokespecial #1                  // Method java/lang/Object."<init>
":()V
         4: return
      LineNumberTable:
        line 6: 0
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0       5     0  this   Ljvm/localfiled/Outer;

  void outerMethod();
    descriptor: ()V
    flags:
    Code:
      stack=1, locals=2, args_size=1
         0: ldc           #2                  // String abc
         2: astore_1
         3: return
      LineNumberTable:
        line 8: 0
        line 16: 3
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0       4     0  this   Ljvm/localfiled/Outer;
            3       1     1 localVar   Ljava/lang/String;
}
SourceFile: "Outer.java"
InnerClasses:
     #6= #5; //Inner=class jvm/localfiled/Outer$1Inner

```



```java
   #2 = String             #21            // abc
```

我们可以看到， “abc”这个字符串确实出现在Outer.class常量池的第15项。 这就奇怪了， 明明是定义在外部类的字面量， 为什么会出现在 内部类的常量池中呢？ 其实这正是编译器在编译方法中定义的内部类时， 所做的额外工作。 

#### 4. 修改局部变量类型

下面我们将这个被内部类访问的局部变量改成整形的。 看看在字节码层面上会有什么变化。 修改后的源码如下：

```java
public class Outer {
 
	void outerMethod(){
		final  int localVar = 1;
		
		/*定义在方法中的内部类*/
		class Inner{
			void innerMethod(){
				int a = localVar;
			}
		}
	}
}
```

反编译内部类

```java
D:\lillusory\Java\work_idea\java-learning\target\classes\jvm\localfiled>javap -c
lasspath . -v Outer$1Inner
警告: 二进制文件Outer$1Inner包含jvm.localfiled.Outer$1Inner
Classfile /D:/lillusory/Java/work_idea/java-learning/target/classes/jvm/localfil
ed/Outer$1Inner.class
  Last modified 2019-4-29; size 616 bytes
  MD5 checksum f3e4d21797e0fe422029c3894699dbf6
  Compiled from "Outer.java"
class jvm.localfiled.Outer$1Inner
  minor version: 0
  major version: 52
  flags: ACC_SUPER
Constant pool:
   #1 = Fieldref           #3.#26         // jvm/localfiled/Outer$1Inner.this$0:
Ljvm/localfiled/Outer;
   #2 = Methodref          #4.#27         // java/lang/Object."<init>":()V
   #3 = Class              #28            // jvm/localfiled/Outer$1Inner
   #4 = Class              #29            // java/lang/Object
   #5 = Utf8               this$0
   #6 = Utf8               Ljvm/localfiled/Outer;
   #7 = Utf8               <init>
   #8 = Utf8               (Ljvm/localfiled/Outer;)V
   #9 = Utf8               Code
  #10 = Utf8               LineNumberTable
  #11 = Utf8               LocalVariableTable
  #12 = Utf8               this
  #13 = Utf8               Inner
  #14 = Utf8               InnerClasses
  #15 = Utf8               Ljvm/localfiled/Outer$1Inner;
  #16 = Utf8               MethodParameters
  #17 = Utf8               innerMethod
  #18 = Utf8               ()V
  #19 = Utf8               a
  #20 = Utf8               I
  #21 = Utf8               SourceFile
  #22 = Utf8               Outer.java
  #23 = Utf8               EnclosingMethod
  #24 = Class              #30            // jvm/localfiled/Outer
  #25 = NameAndType        #31:#18        // outerMethod:()V
  #26 = NameAndType        #5:#6          // this$0:Ljvm/localfiled/Outer;
  #27 = NameAndType        #7:#18         // "<init>":()V
  #28 = Utf8               jvm/localfiled/Outer$1Inner
  #29 = Utf8               java/lang/Object
  #30 = Utf8               jvm/localfiled/Outer
  #31 = Utf8               outerMethod
{
  final jvm.localfiled.Outer this$0;
    descriptor: Ljvm/localfiled/Outer;
    flags: ACC_FINAL, ACC_SYNTHETIC

  jvm.localfiled.Outer$1Inner(jvm.localfiled.Outer);
    descriptor: (Ljvm/localfiled/Outer;)V
    flags:
    Code:
      stack=2, locals=2, args_size=2
         0: aload_0
         1: aload_1
         2: putfield      #1                  // Field this$0:Ljvm/localfiled/Ou
ter;
         5: aload_0
         6: invokespecial #2                  // Method java/lang/Object."<init>
":()V
         9: return
      LineNumberTable:
        line 12: 0
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0      10     0  this   Ljvm/localfiled/Outer$1Inner;
            0      10     1 this$0   Ljvm/localfiled/Outer;
    MethodParameters:
      Name                           Flags
      this$0                         final mandated

  void innerMethod();
    descriptor: ()V
    flags:
    Code:
      stack=1, locals=2, args_size=1
         0: iconst_1
         1: istore_1
         2: return
      LineNumberTable:
        line 14: 0
        line 15: 2
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0       3     0  this   Ljvm/localfiled/Outer$1Inner;
            2       1     1     a   I
}
SourceFile: "Outer.java"
EnclosingMethod: #24.#25                // jvm.localfiled.Outer.outerMethod
InnerClasses:
     #13= #3; //Inner=class jvm/localfiled/Outer$1Inner

```

其中InnerMethod如下：

```java
void innerMethod();
    descriptor: ()V
    flags:
    Code:
      stack=1, locals=2, args_size=1
         0: iconst_1
         1: istore_1
         2: return
      LineNumberTable:
        line 14: 0
        line 15: 2
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0       3     0  this   Ljvm/localfiled/Outer$1Inner;
            2       1     1     a   I
```

第一句变成了

```java
iconst_1
```

这句字节码的意义是：将int类型的常量 1 压入操作数栈。

这就是在内部类中访问外部类方法中的局部变量int localVar = 1的原理。



#### 5. 小结

 由此可见， **当内部类中访问的局部变量是int型的字面量时， 编译器直接将对该变量的访问嵌入到内部类的字节码中**， 也就是说， 在运行时， 方法中的内部类和外部类， 和外部类方法中的局部变量就没有任何关系了。 这也是编译器所做的额外工作。

上面两种情况有一个共同点， 那就是， 被内部类访问的外部了方法中的局部变量， 都是在编译时可以确定的字面常量。 像下面这样的形式都是编译时可确定的字面常量：

```java
final  String localVar = "abc";

final  int localVar = 1;
```



他们之所以被称为字面常量， 是因为他们被final修饰， 运行时不可改变， 当编译器在编译源文件时， 可以确定他们的值， 也可以确定他们在运行时不会被修改， 所以可以实现类似C语言宏替换的功能。也就是说虽然在编写源代码时， 在内部类中访问的是外部类定义的这个变量， 但是在编译成字节码时， 却把这个变量的值放入了访问这个变量的内部类的常量池中， 或直接将这个变量的值嵌入内部类的字节码指令中。 运行时这两个类各不相干， 各自访问各自的常量池， 各自执行各自的字节码指令。在编译方法中定义的内部类时， 编译器的行为就是这样的。 

### 2.2 当被访问的局部变量的值在编译时不可确定时

那么当方法中定义的内部类访问的局部变量不是编译时可确定的字面常量， 又会怎么样呢？想要让这个局部变量变成编译时不可确定的， 只需要将源码修改如下：

```java
public class Outer {
 
	void outerMethod(){
		final  String localVar = getString();
		
		/*定义在方法中的内部类*/
		class Inner{
			void innerMethod(){
				String a = localVar;
			}
		}
		
		new Inner();
	}
 
	String getString(){
		return "illusory";
	}
}
```
由于使用 getString 方法的返回值为 localVar 赋值， 所以在编译时期， 编译器不可确定 localVar 的值， 必须在运行时执行了 getString 方法之后才能确定它的值。 既然编译时不不可确定， 那么像上面那样的处理就行不通了。

#### 1 反编译

执行以下命令反编译该文件

```java
javap -classpath . -v Outer$1Inner
```

> `-classpath .`  :  说明在当前目录下寻找要反编译的class文件
> `-v`   : 加上这个参数输出的信息比较全面。包括常量池和方法内的局部变量表， 行号， 访问标志等等。

 那么在这种情况下， 内部类是通过什么机制访问方法中的局部变量的呢？ 让我们继续反编译内部类的字节码：

#### 2. 结果分析

```java
D:\lillusory\Java\work_idea\java-learning\target\classes\jvm\localfiled>javap -c
lasspath . -v Outer$1Inner
警告: 二进制文件Outer$1Inner包含jvm.localfiled.Outer$1Inner
Classfile /D:/lillusory/Java/work_idea/java-learning/target/classes/jvm/localfil
ed/Outer$1Inner.class
  Last modified 2019-4-29; size 716 bytes
  MD5 checksum e63d82ebc8752469f0d30edde17e88a5
  Compiled from "Outer.java"
class jvm.localfiled.Outer$1Inner
  minor version: 0
  major version: 52
  flags: ACC_SUPER
Constant pool:
   #1 = Fieldref           #4.#29         // jvm/localfiled/Outer$1Inner.this$0:
Ljvm/localfiled/Outer;
   #2 = Fieldref           #4.#30         // jvm/localfiled/Outer$1Inner.val$loc
alVar:Ljava/lang/String;
   #3 = Methodref          #5.#31         // java/lang/Object."<init>":()V
   #4 = Class              #32            // jvm/localfiled/Outer$1Inner
   #5 = Class              #33            // java/lang/Object
   #6 = Utf8               val$localVar
   #7 = Utf8               Ljava/lang/String;
   #8 = Utf8               this$0
   #9 = Utf8               Ljvm/localfiled/Outer;
  #10 = Utf8               <init>
  #11 = Utf8               (Ljvm/localfiled/Outer;Ljava/lang/String;)V
  #12 = Utf8               Code
  #13 = Utf8               LineNumberTable
  #14 = Utf8               LocalVariableTable
  #15 = Utf8               this
  #16 = Utf8               Inner
  #17 = Utf8               InnerClasses
  #18 = Utf8               Ljvm/localfiled/Outer$1Inner;
  #19 = Utf8               MethodParameters
  #20 = Utf8               Signature
  #21 = Utf8               ()V
  #22 = Utf8               innerMethod
  #23 = Utf8               a
  #24 = Utf8               SourceFile
  #25 = Utf8               Outer.java
  #26 = Utf8               EnclosingMethod
  #27 = Class              #34            // jvm/localfiled/Outer
  #28 = NameAndType        #35:#21        // outerMethod:()V
  #29 = NameAndType        #8:#9          // this$0:Ljvm/localfiled/Outer;
  #30 = NameAndType        #6:#7          // val$localVar:Ljava/lang/String;
  #31 = NameAndType        #10:#21        // "<init>":()V
  #32 = Utf8               jvm/localfiled/Outer$1Inner
  #33 = Utf8               java/lang/Object
  #34 = Utf8               jvm/localfiled/Outer
  #35 = Utf8               outerMethod
{
  final java.lang.String val$localVar;
    descriptor: Ljava/lang/String;
    flags: ACC_FINAL, ACC_SYNTHETIC

  final jvm.localfiled.Outer this$0;
    descriptor: Ljvm/localfiled/Outer;
    flags: ACC_FINAL, ACC_SYNTHETIC

  jvm.localfiled.Outer$1Inner();
    descriptor: (Ljvm/localfiled/Outer;Ljava/lang/String;)V
    flags:
    Code:
      stack=2, locals=3, args_size=3
         0: aload_0
         1: aload_1
         2: putfield      #1                  // Field this$0:Ljvm/localfiled/Ou
ter;
         5: aload_0
         6: aload_2
         7: putfield      #2                  // Field val$localVar:Ljava/lang/S
tring;
        10: aload_0
        11: invokespecial #3                  // Method java/lang/Object."<init>
":()V
        14: return
      LineNumberTable:
        line 12: 0
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0      15     0  this   Ljvm/localfiled/Outer$1Inner;
            0      15     1 this$0   Ljvm/localfiled/Outer;
    MethodParameters:
      Name                           Flags
      this$0                         final mandated
      val$localVar                   final synthetic
    Signature: #21                          // ()V

  void innerMethod();
    descriptor: ()V
    flags:
    Code:
      stack=1, locals=2, args_size=1
         0: aload_0
         1: getfield      #2                  // Field val$localVar:Ljava/lang/S
tring;
         4: astore_1
         5: return
      LineNumberTable:
        line 14: 0
        line 15: 5
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0       6     0  this   Ljvm/localfiled/Outer$1Inner;
            5       1     1     a   Ljava/lang/String;
}
SourceFile: "Outer.java"
EnclosingMethod: #27.#28                // jvm.localfiled.Outer.outerMethod
InnerClasses:
     #16= #4; //Inner=class jvm/localfiled/Outer$1Inner
```



首先来看它的构造方法。 方法的签名为： 

```java
jvm.localfiled.Outer$1Inner();
    descriptor: (Ljvm/localfiled/Outer;Ljava/lang/String;)V
    flags:
    Code:
```

我们知道， 如果不定义构造方法， 那么编译器会为这个类自动生成一个无参数的构造方法。 这个说法在这里就行不通了， 因为我们看到， 这个内部类的构造方法又两个参数。 至于第一个参数， 是指向外部类对象的引用， 在前面一篇博客中已经详细的介绍过了， 不明白的可以先看上一篇博客， 这里就不再重复叙述。这也说明了方法中的内部类和类中定义的内部类有相同的地方， 既然他们都是内部类， 就都持有指向外部类对象的引用。  我们来分析第二个参数， 他是String类型的， 和在内部类中访问的局部变量localVar的类型相同。 再看构造方法中编号为6和7的字节码指令：

```java
 6: aload_2
 7: putfield      #2              // Field val$localVar:Ljava/lang/String;
```

这句话的意思是， 使用构造方法的第二个参数， 为当前这个内部类对象的成员变量赋值， 这个被赋值的成员变量的名字是 val$localVar 。 由此可见， 编译器自动为内部类增加了一个成员变量， 其实这个成员变量就是被访问的外部类方法中的局部变量。 这个局部变量在创建内部类对象时， 通过构造方法注入。 在调用构造方法时， 编译器会默认为这个参数传入外部类方法中的局部变量的值。 

再看内部类中的方法innerMethod中是如何访问这个所谓的“局部变量的”。 看innerMethod中的前两条字节码： 

```java
void innerMethod();
    descriptor: ()V
    flags:
    Code:
      stack=1, locals=2, args_size=1
         0: aload_0
         1: getfield      #2         // Field val$localVar:Ljava/lang/String;
         4: astore_1
         5: return
      LineNumberTable:
        line 14: 0
        line 15: 5
      LocalVariableTable:
        Start  Length  Slot  Name   Signature
            0       6     0  this   Ljvm/localfiled/Outer$1Inner;
            5       1     1     a   Ljava/lang/String;
```

其中

```java
         0: aload_0
         1: getfield      #2         // Field val$localVar:Ljava/lang/String;
```

这两条指令的意思是， 访问成员变量`val$localVar`的值。 而源代码中是访问外部类方法中局部变量的值。 所以， 在这里将编译时对外部类方法中的局部变量的访问， 转化成运行时对当前内部类对象中成员变量的访问。  

#### 3. 小结

总结一下就是： 

当方法中定义的内部类访问的方法局部变量的值， 不是在编译时能确定的字面常量时， 编译器会为内部类增加一个成员变量， 在运行时， 将对外部类方法中局部变量的访问转换成对这个内部类成员变量的方法。 

这就要求内部类中的这个新增的成员变量和外部类方法中的局部变量具有相同的值。

 编译器通过为内部类的构造方法增加参数， 并在调用构造器初始化内部类对象时传入这个参数， 来初始化内部类中的这个成员变量的值。 

**所以， 虽然在源文件中看起来是访问的外部类方法的局部变量， 其实运行时访问的是内部类对象自己的成员变量**。 



## 3. 为什么被方法内的内部类访问的局部变量必须是final的

上面我们讲解了， 方法中的内部类访问方法局部变量是怎么实现的。 那么为什么这个局部变量必须是final的呢？ 我认为有以下两个原因：

### 1. 原因一

1 当局部变量的值为编译时可确定的字面常量时（ 如字符串“abc”或整数1 ）， 通过final修饰， 可以实现类似C语言的编译时宏替换功能。

 这样的话， 外部类和内部类各自访问自己的常量池， 各自执行各自的字节码指令， 看起来就像共同访问外部类方法中的局部变量， 这样就可以达到**语义上的一致性**。 由于存在内部类和外部类中的常量值是一样的， 并且是不可改变的，这样就可以达到**数值访问的一致性**。

### 2. 原因二

2 当局部变量的值不是可在编译时确定的字面常量时（比如通过方法调用为它赋值）， 这种情况下， 编译器给内部类增加相同类型的成员变量， 并通过构造函数将外部类方法中的局部变量的值赋给这个新增的内部类成员量。

### 3. 基本数据类型

如果这个局部变量是基本数据类型时， 直接拷贝数值给内部类成员变量。这样的话， 内部类和外部类各自访问自己的基本数据类型的变量， 他们的变量值一样， 并且不可修改， 这样就保证了语义上和数值访问上的一致性。

### 4. 引用类型

如果这个局部变量是引用数据类型时， 拷贝外部类方法中的引用值给内部类对象的成员变量， 这样的话， 他们就指向了同一个对象。 由于这两个引用变量指向同一个对象， 所以通过引用访问的对象的数据是一样的， 由于他们都不能再指向其他对象（被final修饰）， 所以可以保证内部类和外部类数据访问的一致性。

 

## 4. 参考

`https://blog.csdn.net/zhangjg_blog/article/details/19996629`

