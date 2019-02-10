# 深入理解Java虚拟机

## 第一章 走进Java

### 展望Java技术的未来

模块化

混合语言 项目中每个应用层使用不同的需要，发挥各自的优点，中间层使用Java。

多核并行 

进一步丰富语法  

64位虚拟机

## 第二章 自动内存管理机制

### 2.1 运行时数据区

#### 1.程序计数器   

线程独立的。可以看做是当前线程所执行的字节码的行号指示器，字节码解释器工作时就是通过改变这个计数器的值来选取下一条需要执行的字节码指令。

#### 2.java虚拟机栈

生命周期和线程相同，线程独立。每个方法在执行时都会创建一个栈帧用于存储局部变量表，操作数栈，动态链接，方法出口等信息。每一个方法从调用到执行完成的过程就是一个栈帧在虚拟机中的入栈到出栈的过程。

局部变量表：存放了编译时期可知的各种基本类型（Boolean，byte，char,short,int.float.long,double）、对象引用（reference类型）和returnAddress（指向了一条字节码指令的地址）

#### 3.本地方法栈

和Java虚拟机栈作用相似，不过这是为虚拟机执行Native方法服务的，线程独立的。

#### 4.堆

Java堆是虚拟机所管理的内存中最大的一块了。线程共享，在虚拟机启动时创建。也是垃圾回收的主要区域。Java虚拟机规范中说的是：所有的对象实例以及数组都要在堆上分配内存。但是随着`JIT(just in time)编译器`的发展与`逃逸分析`技术的成熟，`栈上分配`，`标量替换`优化技术将会导致一些微妙的变化，所有对象都分配在堆上也变得不是那么绝对了。

垃圾回收器都采用分代回收算法。所以Java堆可以细分为`新生代`和`老年代`。在细致一点可以分为`Eden空间`，`From Survivor`,`To Survivor`等。

#### 5.方法区

也是线程共享的区域。用于存储已被虚拟机加载的`类信息`,`常量`，`静态变量`，`即时编译器编译后的代码`等数据。

java虚拟机把方法区描述为堆的一个逻辑区域，但是方法区却有一个别名`Non-Heap非堆`目的应该是和Java堆区分开。

#### 6.运行时常量池

`运行时常量池`是`方法区`的一部分。Java Class文件中除了有类的版本，字段，方法，接口等描述信息外还有一项信息是`常量池`,用于存放编译期生成的各种`字面量`和`符号引用`，这部分内容将在`类加载后`进入方法区的`运行时常量池`。

##### 全局字符串池

全局字符串池里的内容是在类加载完成，经过验证，**准备阶段之后**在堆中生成字符串对象实例，然后将该字符串对象实例的引用值存到string pool中（记住：string pool中存的是引用值而不是具体的实例对象，具体的实例对象是在堆中开辟的一块空间存放的。）。 在HotSpot VM里实现的string pool功能的是一个StringTable类，它是一个哈希表，里面存的是驻留字符串(也就是我们常说的用双引号括起来的)的引用（而不是驻留字符串实例本身），也就是说在堆中的某些字符串实例被这个StringTable引用之后就等同被赋予了”驻留字符串”的身份。这个StringTable在每个HotSpot VM的实例只有一份，被所有的类共享。

##### class文件常量池（class constant pool）

Java Class文件中除了有类的版本，字段，方法，接口等描述信息外还有一项信息是`常量池`,用于存放编译期生成的各种`字面量`和`符号引用`，这部分内容将在`类加载后`进入方法区的`运行时常量池`。

 字面量就是我们所说的常量概念，如文本字符串、被声明为final的常量值等。 符号引用是一组符号来描述所引用的目标，符号可以是任何形式的字面量，只要使用时能无歧义地定位到目标即可（它与直接引用区分一下，直接引用一般是指向方法区的本地指针，相对偏移量或是一个能间接定位到目标的句柄）。一般包括下面三类常量：

- 类和接口的全限定名
- 字段的名称和描述符
- 方法的名称和描述符

##### 运行时常量池

jvm在执行某个类的时候，必须经过`加载`、`连接`、`初始化`，而连接又包括`验证`、`准备`、`解析`三个阶段。而当类加载到内存中后，jvm就会将class常量池中的内容存放到运行时常量池中，由此可知，`运行时常量池也是每个类都有一个`。在上面我也说了，`class常量池中存的是字面量和符号引用`，也就是说他们存的并不是对象的实例，而是对象的符号引用值。而经过`解析（resolve）`之后，也就是把符号引用替换为直接引用，解析的过程会去查询全局字符串池，也就是我们上面所说的StringTable，以保证运行时常量池所引用的字符串与全局字符串池中所引用的是一致的。

##### 小结

- 1.全局常量池在每个VM中只有一份，存放的是字符串常量的引用值。
- 2.class常量池是在编译的时候每个class都有的，在编译阶段，存放的是常量的符号引用。
- 3.运行时常量池是在类加载完成之后，将每个class常量池中的符号引用值转存到运行时常量池中，也就是说，每个class都有一个运行时常量池，类在解析之后，将符号引用替换成直接引用，与全局常量池中的引用值保持一致。

#### 7.直接内存

直接内存并不是虚拟机运行时数据区的一部分，但是也频繁被用到，也可能导致OOM,虚拟机内存+直接内存超过物理内存时。

在JDK1.4出现的NIO类中引入了一个基于Channel和Buffer的IO方式，它可以直接使用Native函数库直接分配堆外内存，然后通过一个存储在Java堆中的DirectByteBuffer对象作为这块内存的引用进行操作，能在一些场合中显著提高性能，因为避免了在Java堆和Native堆中来回复制数据。

#### 8.对象的创建

##### 1.类加载检查

虚拟机遇到new指令时，首先检查这个指令的参数是否能在常量池中定位到一个类的符号引用，并且检查这个符号引用代表的类是否已被加载，解析和初始化过。若没有则必须先执行相应的类加载过程。

##### 2.分配内存空间

在类加载检查完成后，接下来虚拟机开始为新生对象分配内存，对象所需内存大小在类加载完成后即可完全确定。

**问题：**

这里有一个问题就是对象创建在虚拟机中是非常频繁的，并发情况下可能会有线程安全问题。可能出现正在给对象A分配内存，指针还没来得及修改，对象B又使用的原来的指针来分配内存。

**解决方案：**

有两种解决方案。

一种是对分配内存空间的动作进行同步处理----实际上虚拟机采用CAS配上失败重试的方式，保证更新操作的原子性。

另一种是把内存分配的动作放在不同的空间中进行，即每个线程在Java堆中预先分配一块内存，称为本地线程分配缓冲TLAB（Thread Local Allocation Buffer），分配内存时优先在线程自己的TALB上分配，因为`在TLAB上分配对象时不需要加锁`，只有TALB用完后分配新的TALB时才需要同步锁定。

##### 3.初始化零值

内存分配完成后，虚拟机将分配到的内存空间都初始化为零值（零值根据对象类型不同也不同，这就是为什么对象的实例字段在Java代码中不用初始化也可以使用），若使用TLAB，则这一步可以提前至TALB分配时进行。

##### 4.设置对象头

接下来是对象头的设置，例如这个对象是哪个类的实例，如何才能找到类的元数据信息，对象的哈希码，对象的GC分代年龄信息等。这些信息都存放在对象的对象头中。

##### 5.init初始化

前面几步执行后，在虚拟机角度一个对象已经创建完成了，但是在Java程序角度对象的创建才刚开始，因为init方法还没执行。所以一般来说执行new指令后还会执行init方法，把对象按照程序员的意愿进行初始化，这样一个真正可用的对象才算完全创建出来了。

#### 9.Java对象的内存布局

在HotSpot虚拟机中，对象在内存中存储的布局可以分为3块区域，`对象头（Header）`、`实例数据（InstanceData）`、`对齐填充（Padding）`。

`对象头`又包括两部分.

第一部分用于存储对象自身的运行时数据，如哈希码，GC分代年龄，锁状态标志，线程持有的锁，偏向锁线程ID，偏向时间戳等，官方称为`MarkWord`.

另一部分是类型指针，即对象指向它的类元数据的指针，虚拟机通过这个指针来确定这个对象是哪个类的实例。

如果是数组对象，那么对象头中还必须有一块用于记录数组长度的数据。

`实例数据`部分是对象真正存储的有效信息，也是在程序代码中所定义的各种类型的字段内容。

`对齐填充`没有特殊含义，只是起着占位符的作用，由于HotSpotVM的自动内存管理系统要求对象其实地址必须是8字节的整数倍，也就是对象大小必须是8字节的整数倍，其中对象头大小刚好是8字节的倍数，所以如果对象实例数据部分不是8字节的倍数时就需要对齐填充字节来补全。

#### 10.对象的访问定位

目前主流的访问对象的方式有两种，`句柄`和`直接指针`。

##### 1.句柄

使用句柄的话，会在Java堆中划分一块内存作为`句柄池`,reference中存储的是对象的句柄地址，而句柄中包含了对象实例数据与类型数据各种的具体地址信息。

##### 2.直接指针

如果使用直接指针，那么Java堆对象的布局中就必须考虑如何放置访问类型数据的相关信息，而reference中存储的直接就是对象的地址。

##### 3.总结

使用句柄访问的好处是reference中存储的是稳定的句柄，在对象被移动时(垃圾收集时对象被移动是很普遍的）只会改变句柄中的实例数据指针，而reference本身不需要修改。

使用直接指针访问的方式最大的好处就是速度更快，因为节省了一次指针定位的时间开销。

Sun HotSpot虚拟机中使用的是直接指针访问。

#### 11实战OOM异常

## 第三章 垃圾收集器与内存分配策略

### 1.再谈引用

* 强引用(Strong Reference)： 类似`Object o =new Object()`这类的引用，只要强引用还存在，垃圾收集器永远不会回收掉被引用的对象。
* 软引用(Soft Reference)： 用来描述一些还有用但并非必需的对象，在系统将要发生内存溢出异常之前，会将软引用对象回收，如果这次回收后还没有足够内存才抛出异常。
* 弱引用(Weak Reference)：也是用来描述非必需对象的，只是强度比软引用还低，垃圾收集器工作时，无论内存是否足够都会回收掉弱引用对象。
* 虚引用(Phantom Reference)：它是最弱的一种引用，一个对象是否有虚引用存在，不会对其生存时间构成影响，也无法通过虚引用得到一个实例。`设置虚引用的唯一目的就是在这个对象被回收后得到一个通知。`

### 2.对象回收

即使在可达性分析箅法中不可达的对象，也并非是“非死不可”的，这时候它们暂时处于“缓刑”阶段。

**要真正宣告一个对象死亡，至少要经历两次标记过程：**

**第一次标记：**

如果对象在进行可达性分析后发现`没有与GCRoots相连接的引用链`，那它将`会被第一次标记`并且进行一次`筛选`.

> 筛选的条件是此对象是否有必要执行finalize()方法。当对象没有覆盖finalize()方法，或者finalize()方法已经被虚拟机调用过，虚拟机将这两种情况都视为“没有必要执行”。

如果这个对象被判定为有必要执行finalize()方法，那么这个对象将会放置在一个叫做`F-Queue`的队列之中，并在稍后由一个由虚拟机自动建立的、低优先级的Finalizer线程去`执行`它。

> 这里所谓的“执行”是指虚拟机会触发这个方法，但并不承诺会等待它运行结束，这样做的原因是，如果一个对象在finalize()方法中执行缓慢，或者发生了死循环（更极端的情况），将很可能会导致F-Queue队列中其他对象永久处于等待，甚至导致整个内存回收系统崩溃。

finalize()方法是对象逃脱死亡命运的最后一次机会。

**第二次标记**

稍后GC将对F-Queue中的对象进行第二次小规模的标记.

> 如果对象要在finalize()中成功拯救自己——只要重新与引用链上的对象进行关联，譬如自己（this关键字）赋值给某个变量或对象的成员变量，那在第二次标记时它将被移出“即将回收”的集合。

如果对象没能成功逃脱，那基本上就真的被回收了。

### 3.finalize()方法

需要特别说明的是，上面关于对象死亡时finalize()方法的描述可能带有悲情的艺术色彩.并不鼓励大家使用这种方法来拯救对象。相反，笔者建议大家尽量避免使用它，`因为它不是C/C++中的析构函数`，而是Java刚诞生时为了使C/C++程序员更容易接受它所做出的一个妥协。`它的运行代价高昂，不确定性大，无法保证各个对象的调用顺序`。有些教材中描述它适合做“关闭外部资源”之类的工作，这完全是对这个方法用途的一种自我安慰。finalize()能做的所有工作，使用try-finally或者其他方式都可以做得更好、更及时，所以`建议大家完全可以忘掉Java语言中有这个方法的存在`。

1. finalize的作用

- finalize()是Object的protected方法，子类可以覆盖该方法以实现资源清理工作，GC在回收对象之前调用该方法。
- finalize()与C++中的析构函数不是对应的。C++中的析构函数调用的时机是确定的（对象离开作用域或delete掉），但Java中的finalize的调用具有不确定性
- 不建议用finalize方法完成“非内存资源”的清理工作，但建议用于：① 清理本地对象(通过JNI创建的对象)；② 作为确保某些非内存资源(如Socket、文件等)释放的一个补充：在finalize方法中显式调用其他资源释放方法。其原因可见下文[finalize的问题]

2. finalize的问题

- 一些与finalize相关的方法，由于一些致命的缺陷，已经被废弃了，如System.runFinalizersOnExit()方法、Runtime.runFinalizersOnExit()方法
- System.gc()与System.runFinalization()方法增加了finalize方法执行的机会，但不可盲目依赖它们
- Java语言规范并不保证finalize方法会被及时地执行、而且根本不会保证它们会被执行
- finalize方法可能会带来性能问题。因为JVM通常在单独的低优先级线程中完成finalize的执行
- 对象再生问题：finalize方法中，可将待回收对象赋值给GC Roots可达的对象引用，从而达到对象再生的目的
- finalize方法至多由GC执行一次(用户当然可以手动调用对象的finalize方法，但并不影响GC对finalize的行为)

3. finalize的执行过程(生命周期)

(1) 首先，大致描述一下finalize流程：当对象变成(GC Roots)不可达时，GC会判断该对象是否覆盖了finalize方法，若未覆盖，则直接将其回收。否则，若对象未执行过finalize方法，将其放入F-Queue队列，由一低优先级线程执行该队列中对象的finalize方法。执行finalize方法完毕后，GC会再次判断该对象是否可达，若不可达，则进行回收，否则，对象“复活”。

(2) 具体的finalize流程：

对象可由两种状态，涉及到两类状态空间，一是终结状态空间 F = {unfinalized, finalizable, finalized}；二是可达状态空间 R = {reachable, finalizer-reachable, unreachable}。各状态含义如下：

- unfinalized: 新建对象会先进入此状态，GC并未准备执行其finalize方法，因为该对象是可达的
- finalizable: 表示GC可对该对象执行finalize方法，GC已检测到该对象不可达。正如前面所述，GC通过F-Queue队列和一专用线程完成finalize的执行
- finalized: 表示GC已经对该对象执行过finalize方法
- reachable: 表示GC Roots引用可达
- finalizer-reachable(f-reachable)：表示不是reachable，但可通过某个finalizable对象可达
- unreachable：对象不可通过上面两种途径可达

状态变迁图：

![img](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/jvm/finalize-status.png)

变迁说明：

1. 新建对象首先处于[reachable, unfinalized]状态(A)
2. 随着程序的运行，一些引用关系会消失，导致状态变迁，从reachable状态变迁到f-reachable(B, C, D)或unreachable(E, F)状态
3. 若JVM检测到处于unfinalized状态的对象变成f-reachable或unreachable，JVM会将其标记为finalizable状态(G,H)。若对象原处于[unreachable, unfinalized]状态，则同时将其标记为f-reachable(H)。
4. 在某个时刻，JVM取出某个finalizable对象，将其标记为finalized并在某个线程中执行其finalize方法。由于是在活动线程中引用了该对象，该对象将变迁到(reachable, finalized)状态(K或J)。该动作将影响某些其他对象从f-reachable状态重新回到reachable状态(L, M, N)
5. 处于finalizable状态的对象不能同时是unreahable的，由第4点可知，将对象finalizable对象标记为finalized时会由某个线程执行该对象的finalize方法，致使其变成reachable。这也是图中只有八个状态点的原因
6. 程序员手动调用finalize方法并不会影响到上述内部标记的变化，因此JVM只会至多调用finalize一次，即使该对象“复活”也是如此。程序员手动调用多少次不影响JVM的行为
7. 若JVM检测到finalized状态的对象变成unreachable，回收其内存(I)
8. 若对象并未覆盖finalize方法，JVM会进行优化，直接回收对象（O）
9. 注：System.runFinalizersOnExit()等方法可以使对象即使处于reachable状态，JVM仍对其执行finalize方法。

参考：`https://www.cnblogs.com/Smina/p/7189427.html`

**小结**

当对象变成(GC Roots)不可达时，GC会判断该对象是否覆盖了finalize方法，若未覆盖，则直接将其回收。否则，若对象未执行过finalize方法，将其放入F-Queue队列，由一低优先级线程执行该队列中对象的finalize方法。执行finalize方法完毕后，GC会再次判断该对象是否可达，若不可达，则进行回收，否则，对象“复活”。

### 4.回收方法区

Java虚拟机规范中确实说过可以不要求虚拟机在方法区实现垃圾收集，而且在方法区中进行垃圾收集的“性价比”一般比较低：在堆中，尤其是在新生代中，常规应用进行一次垃圾收集一般可以回收70%〜95%的空间，而永久代的垃圾收集效率远低于此。

  永久代的垃圾收集主要回收两部分内容：`废弃常量`和`无用的类`。回收废弃常最与回收Java堆中的对象非常类似。以常量池中字面量的回收为例，假如一个字符串“abc”已经进入了常量池中，但是当前系统没有任何一个String对象是叫做“abc”的，换句话说，就是`没有任何String对象引用常量池中的“abc”常量，也没有其他地方引用了这个字面量`，如果这时发生内存回收，而且必要的话，这个“abc”常量就会被系统清理出常量池。常量池中的其他类（接口）、方法、字段的符号引用也与此类似。

  判定一个常量是否是“废弃常量”比较简单，而要判定一个类是否是“无用的类”的条件则相对苛刻许多。类需要同时满足下面3个条件才能算是“无用的类”：

* 该类所有的实例都已经被回收，也就是Java堆中不存在该类的任何实例。

* 加载该类的ClassLoader已经被冋收。

* 该类对应的java.lang.Class对象没冇在任何地方被引用，无法在任何地方通过反射访 问该类的方法。

  虚拟机可以对满足上述3个条件的无用类进行回收，这里说的仅仅是“可以”，而并不是和对象一样，不使用了就必然会回收。是否对类进行回收，HotSpot虚拟机提供了-Xnoclassgc参数迸行控制，还可以使用-verbose:class 以及-XX:+TraceClassLoading、-XX:+TraceClassUnLoading类加载和卸载信息，其中-veiboscxlass和-XXi+TraceClassLoading可以在Product版的虚拟机中使用-XX:+TraceClassUnLoading参数需要FastDebug版的虚拟机支持。
​    在大量使用反射、动态代理、CGLib等ByteCode框架、动态生成JSP以及OSGi这类频繁定义ClassLoader的场景都需要虚拟机具备类卸载的功能，以保证永久代不会溢出。

### 5.垃圾收集算法

#### 1.标记-清除算法

最基础的垃圾收集算法，算法分为“标记”和“清除”两个阶段：首先标记出所有需要回收的对象，在标记完成之后统一回收掉所有被标记的对象。

**缺点：**1.效率问题，标记和清除效率都不高。

​	    2.空间问题其次，标记清除之后会产生大量的不连续的内存碎片，空间碎片太多会导致后续当程序需要为较大对象分配内存时无法找到足够的连续内存而不得不提前触发另一次垃圾收集动作。

#### 2.复制算法

为了解决效率问题，“复制”收集算法出现了。

将可用内存按容量分成大小相等的两块，每次只使用其中一块，当这块内存使用完了，就将还存活的对象复制到另一块内存上去，然后把使用过的内存空间一次清理掉。这样使得每次都是对其中一块内存进行回收，内存分配时不用考虑内存碎片等复杂情况，只需要移动堆顶指针，按顺序分配内存即可，实现简单，运行高效。

**缺点：**可使用的内存降为原来一半。

#### 3.标记-整理算法

标记-整理算法在标记-清除算法基础上做了改进，标记阶段是相同的标记出所有需要回收的对象，在标记完成之后不是直接对可回收对象进行清理，而是让所有存活的对象都向一端移动，在移动过程中清理掉可回收的对象，这个过程叫做整理。

标记-整理算法相比标记-清除算法的优点是内存被整理以后不会产生大量不连续内存碎片问题。

#### 4.分代收集算法

根据对象存活周期的不同将内存分为几块。一般将java堆分为新生代和老年代，这样我们就可以根据各个年代的特点选择合适的垃圾收集算法。

**新生代**：**复制算法 **

​		每次收集都会有大量对象死去，所以可以选择复制算法，将存活的对象复制到空白的Survivor区，然后清理Eden 区和另外一个Survivor区就可以了。只需要付出少量对象的复制成本就可以完成每次垃圾收集

**老年代**：**标记-整理”算法**

​		老年代的对象存活几率是比较高的，而且没有额外的空间对它进行分配担保,所以采用标记-整理算法。

### 6.垃圾收集器

#### 1.简介

一共7种垃圾收集器。其中年轻代3种，老年代3种。最后一种可以回收年轻代和老年代。

年轻代：Serial  、  ParNew、  Parallel scavenge

老年代：SerialOld 、Concurrent Mark Swap(CMS) 、 ParallelOld

最后一种Garbage First。

其中年轻代和老年代垃圾收集器都是搭配工作的。

CMS可以和Serial、ParNew搭配

SerialOld可以和Serial  、  ParNew、  Parallel scavenge搭配

ParallelOld只能和Parallel scavenge搭配

![Garbage collection](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/jvm/garbage-collection.png)

注意：

这里会接触到几款并发和并行的收集器。两个名词：并发和并行。这两个名词都是并发编程中的概念，在谈论垃圾收集器的上下文语境中，它们可以解释如下。

* 并行（Parallel):指多条垃圾收集线程并行工作，但此时用户线程仍然处于等待状态。
* 并发（Concurrent):指用户线程与垃圾收集线程同时执行（但不一定是并行的，可能会交替执行），用户程序在继续运行，而垃圾收集程序运行于另一个CPU上。

#### 2.Serial收集器

Serial收集器是最基本、发展历史最悠久的收集器。是单线程的收集器。它在进行垃圾收集时，必须暂停其他所有的工作线程(**Stop The Word**)，直到它收集完成。 

Serial收集器依然是虚拟机运行在**Client模式**下默认新生代收集器，对于运行在Client模式下的虚拟机来说是一个很好的选择。 

**新生代采用复制算法，老年代采用标记-整理算法。** 

#### 3.ParNew收集器

ParNew收集器其实就是**Serial收集器的多线程版本**，除了使用多线程进行垃圾收集之外，其余行为包括Serial收集器可用的所有控制参数、收集算法、Stop The Worl、对象分配规则、回收策略等都与Serial 收集器完全一样 

它是许多运行在**Server模式**下的虚拟机的首要选择，除了性能原因之外，目前除去Serial收集器，只有ParNew收集器能与CMS收集器（真正意义上的并发收集器，后面会介绍到）配合工作。

在单CPU甚至两个CPU的环境下，ParNew收集器都不能百分百得保证性能比serial收集器性能高，但是随着CPU数量的增加，它对于GC时系统资源的有效利用还是有好处的。

**新生代采用复制算法，老年代采用标记-整理算法。**

#### 4.Parallel Scavenge收集器

Parallel Scavenge 收集器类似于ParNew 收集器。 **那么它有什么特别之处呢？**

```java
-XX:+UseParallelGC 
    //使用Parallel收集器+ 老年代串行
-XX:+UseParallelOldGC
    //使用Parallel收集器+ 老年代并行
```

**Parallel Scavenge**收集器关注点是**吞吐量**（高效率的利用CPU）。**CMS**等垃圾收集器的关注点更多的是**用户线程的停顿时间**（提高用户体验）。所谓吞吐量就是CPU用于运行用户代码的时间与CPU总消耗时间的比值，即 吞吐量=运行用户代码时间/（运行用户代码时间+垃圾收集时间）

**新生代采用复制算法，老年代采用标记-整理算法。**

#### 5.Serial Old收集器

**Serial收集器的老年代版本**，它同样是一个单线程收集器。它主要有两大用途：一种用途是在JDK1.5以及以前的版本中与Parallel Scavenge收集器搭配使用，另一种用途是作为CMS收集器的后备方案。

#### 6Parallel Old收集器

**Parallel Scavenge收集器的老年代版本**。使用多线程和“标记-整理”算法。在注重吞吐量以及CPU资源的场合，都可以优先考虑 Parallel Scavenge收集器和Parallel Old收集器。

#### 7.CMS收集器

**CMS（Concurrent Mark Sweep）收集器是一种以获取最短回收停顿时间为目标的收集器。它而非常符合在注重用户体验的应用上使用。**

从名字中的**Mark Sweep**这两个词可以看出，CMS收集器是一种 **“标记-清除”**算法实现的，它的运作过程相比于前面几种垃圾收集器来说更加复杂一些。整个过程分为四个步骤：

- **初始标记：** 暂停所有的其他线程，并记录下直接与root相连的对象，速度很快 ；

- **并发标记：** 同时开启GC和用户线程，用一个闭包结构去记录可达对象。但在这个阶段结束，这个闭包结构并不能保证包含当前所有的可达对象。因为用户线程可能会不断的更新引用域，所以GC线程无法保证可达性分析的实时性。所以这个算法里会跟踪记录这些发生引用更新的地方。

- **重新标记：** 重新标记阶段就是为了修正并发标记期间因为用户程序继续运行而导致标记产生变动的那一部分对象的标记记录，这个阶段的停顿时间一般会比初始标记阶段的时间稍长，远远比并发标记阶段时间短

- **并发清除：** 开启用户线程，同时GC线程开始对为标记的区域做清扫。

  初始标记、重新标记这两个步骤仍然需要“Stop The World”. 

从它的名字就可以看出它是一款优秀的垃圾收集器，主要优点：**并发收集、低停顿**。但是它有下面三个明显的缺点：

- **对CPU资源敏感，垃圾收集时会占用大量CPU资源**
- **无法处理浮动垃圾，即并发标记时用户线程继续运行时产生的垃圾，只能等下一次垃圾回收才能处理**
- **它使用的回收算法-“标记-清除”算法会导致收集结束时会有大量空间碎片产生。**

#### 8.G1收集器

**G1 (Garbage-First)是一款面向服务器的垃圾收集器,主要针对配备多颗处理器及大容量内存的机器. 以极高概率满足GC停顿时间要求的同时,还具备高吞吐量性能特征.**

**G1收集器的优势：**

（1）并行与并发，可以充分利用多CPU，多核环境优势来缩短Stop-The-World停顿时间。

（2）分代收集，不需要与其他收集器配合就能管理整个GC堆。

（3）空间整理 （标记整理算法，复制算法），不会产生内存空间碎片。

（4）可预测的停顿（G1处处理追求低停顿外，还能建立可预测的停顿时间模型，能让使用者明确指定在一个长度为M毫秒的时间片段内，消耗在垃圾收集上的时间不得超过N毫秒，这几乎已经实现Java（RTSJ）的来及收集器的特征）

**大致步骤：**

（1）初始标记

（2）并发标记

（3）最终标记

（4）筛选回收

**G1收集器在后台维护了一个优先列表，每次根据允许的收集时间，优先选择回收价值最大的Region(这也就是它的名字Garbage-First的由来)**。这种使用Region划分内存空间以及有优先级的区域回收方式，保证了GF收集器在有限时间内可以尽可能高的收集效率（把内存化整为零）。 

> G1用于堆比较大的应用上，GC 的时间难以预估的这种效果更好，内存200G以上，JDK9（含）以上，jdk版本较低的G1功能有欠缺 

### 7.理解GC日志

理解GC日志是处理Java虚拟机内存问题的基本技能，下面我们具体来看看。

通过在java命令种加入参数来指定对应的gc类型，打印gc日志信息并输出至文件等策略。

#### 1.编写代码

```java
//ReferenceCountingGC.java
public class ReferenceCountingGC {
    public Object instance = null;
    private static final int ONE_MB = 1024 * 1024;

    private byte[] bigSize = new byte[2 * ONE_MB];

    public static void main(String[] args) {
        testGC();


    }

    public static void testGC() {
            ReferenceCountingGC objA = new ReferenceCountingGC();
            ReferenceCountingGC objB = new ReferenceCountingGC();
            objA.instance = objB;
            objB.instance = objA;

            objA = null;
            objB = null;

            System.gc();
    }
}
```

#### 2.编译执行

```java
//编译
javac ReferenceCountingGC.java  
//执行
java -XX:+PrintGCDateStamps -XX:+PrintGCDetails ReferenceCountingGC

对应的参数列表
-XX:+PrintGC 输出GC日志
-XX:+PrintGCDetails 输出GC的详细日志
-XX:+PrintGCTimeStamps 输出GC的时间戳（以基准时间的形式）
-XX:+PrintGCDateStamps 输出GC的时间戳（以日期的形式，如 2013-05-04T21:53:59.234+0800）
-XX:+PrintHeapAtGC 在进行GC的前后打印出堆的信息
-Xloggc:../logs/gc.log 日志文件的输出路径
```

#### 3.查看日志

```java
2019-02-08T16:26:30.677+0800: [GC (System.gc()) [PSYoungGen: 5345K->736K(36352K)] 5345K->744K(119808K), 0.0769922 secs] [Times: user=0.00 sys=0.00, real=0.08 secs]
2019-02-08T16:26:30.754+0800: [Full GC (System.gc()) [PSYoungGen: 736K->0K(36352K)] [ParOldGen: 8K->627K(83456K)] 744K->627K(119808K), [Metaspace: 2531K->2531K(1056768K)], 0.0970499 secs] [Times: user=0.06 sys=0.00, real=0.10 secs]
Heap
 PSYoungGen      total 36352K, used 625K [0x00000000d7980000, 0x00000000da200000, 0x0000000100000000)
  eden space 31232K, 2% used [0x00000000d7980000,0x00000000d7a1c400,0x00000000d9800000)
  from space 5120K, 0% used [0x00000000d9800000,0x00000000d9800000,0x00000000d9d00000)
  to   space 5120K, 0% used [0x00000000d9d00000,0x00000000d9d00000,0x00000000da200000)
 ParOldGen       total 83456K, used 627K [0x0000000086c00000, 0x000000008bd80000, 0x00000000d7980000)
  object space 83456K, 0% used [0x0000000086c00000,0x0000000086c9cd10,0x000000008bd80000)
 Metaspace       used 2537K, capacity 4486K, committed 4864K, reserved 1056768K
  class space    used 278K, capacity 386K, committed 512K, reserved 1048576K
```

`PSYoungGen`表示`新生代`，这个名称`由收集器决定`，这里的收集器是Parallel Scavenge。老年代为ParOldGen，永久代为PSPermGen 

> 如果收集器为ParNew收集器，新生代为ParNew，Parallel New Generation 
> 如果收集器是Serial收集器，新生代为DefNew，Default New Generation

可以看到上面有两种GC类型：GC和Full GC，有Full表示这次GC是发生了Stop-The-World的。

新生代GC（Minor GC）：指发生在新生代的垃圾收集动作，因为Java对象大多都具备朝生夕灭的特性，所以Minor GC非常频繁，一般回收速度非常快。

老年代GC（Major GC/Full GC）：指发生在老年代的GC，出现了Major GC，经常会伴随至少一次的Minor GC，Major GC的速度一般会比Minor GC慢10倍以上。

`[GC [PSYoungGen: 6123K->400K(38912K)] 6123K->400K(125952K), 0.0012070 secs][Times: user=0.00 sys=0.00, real=0.00 secs]`

上面方括号内部的`6123K->400K(38912K)`，表示`GC前该内存区域已使用容量->GC后该内存区域已使用容量`，后面圆括号里面的38912K为`该内存区域的总容量`。

方括号外面的`6123K->400K(125952K)`，表示`GC前Java堆已使用容量->GC后Java堆已使用容量`，后面圆括号里面的125952K为`Java堆总容量`。

`[Times: user=0.00 sys=0.00, real=0.00 secs]`分别表示用户消耗的CPU时间，内核态消耗的CPU时间和操作从开始到结束所经过的墙钟时间（Wall Clock Time），CPU时间和墙钟时间的差别是，墙钟时间包括各种非运算的等待耗时，例如等待磁盘I/O、等待线程阻塞，而CPU时间不包括这些耗时。

参考`https://blog.csdn.net/hp910315/article/details/50936629`

#### 4.日志格式

日志格式由收集器决定的，每个收集器的日志格式都可能是不一样。但虚拟机设计者为了方便用户阅读，将各个收集器的日志都维持一定的共性，例如以下两段典型的GC口志：

```java
33.125:GC[DefNew:3324K->152K(3712K),0.0025925secs]3324K>152K(119040.0031680secs]
100.667:[FullGC[Tenured:0K>210K(10240K),0.0149142secsj4603K->210K(19456K),[Perm:2999K>2999K(21248K)],0.0150007secs][Times:user-0.01sys=0.00,real-0.02secs]
```

最前面的数字`33.125:`和`100.667:`代表了`GC发生的时间`，这个数字的含义是`从Java虚拟机启动以来经过的秒数`。

GCH志开头的`[GC`和`[FullGC`说明了这次`垃圾收集的停顿类型`，而`不是用来区分新生代GC还是老年代GC的`。如果有`Full`，说明这次GC是发生了Stop-The-World的.

例如下面这段新生代收集器ParNew的日志也会出现`[FullGC`（这一般是因为出现了分配担保失败之类的问题，所以才导致STW)。如果是调用`SyStem.gc()方法`所触发的收集，那么在这里将显示`[FullGC(System)`。`[FullGC283_736:[ParNew:261599K->261599K(261952K),0.0000288secs]`

接下来的`[DefNew`、`[Tenured`、`[Perm`表示`GC发生的区域`，这里显示的区域名称与使用的GC收集器是密切相关的，例如上面样例所使用的`Serial收集器`中的新生代名为`DefaultNewGeneration`，所以显示的是`[DefNew`。如果是`ParNew收集器`，新生代名称就会变为`[ParNcw`，意为`ParallelNewGeneration`.如果采用ParaUelScavenge收集器，那它配套的新生代称为“PSYoungGen”，老年代和永久代同理，名称也是由收集器决定的。

后面方括号内部的`3324K->152K(3712K)`含义是`GC前该内存K域已使用容M->GC后该内存区域已使用容量（该内存区域总容量）`。

而在方括号之外的

`3324K->152IC(11904K)`表示`GC前Java堆已使用容M->GC后Java堆已使用容M(Java堆总容量)`。

再往后，`0.0025925secs`表示`该内存区域GC所占用的时间`，单位是秒。

有的收集器会给出更具体的时间数据，如`[Times:user=0.01sys=0.00，real=0.02secs]`，这里面的`user`、`sys`和`real`与Linux的time命令所输出的时间含义一致，分别代表`用户态消耗的CPU时间`、`内核态消耗的CPU时间和`操作从开始到结束所经过的墙钟时间（WallClockTime)`。CPU时间与墙钟时间的区别是，墙钟时间包括各种非运算的等待耗时，例如等待磁盘I/O、等待线程阻塞，而CPU时间不包括这些耗时，但当系统有多CPU或者多核的话，多线程操作会叠加这些CPU时间，所以读者看到user或sys时间超过real时间是完全正常的。

### 8.内存分配

#### 1.对象优先在Eden区分配

大多数情况下，对象优先在Eden区分配，当Eden区没有足够内存空间进行分配时，虚拟机将会发起一次MinorGC

#### 2.大对象直接进入老年代

所谓的大对象是指，需要大量连续内存空间的Java对象，最典型的大对象就是那种很长的字符串以及数组。大对象对虚拟机的内存分配来说就是一个坏消息（替Java虚拟机抱怨一句，比遇到一个大对象更加坏的消息就是遇到一群“朝生夕灭”的“短命大对象”，写程序的时候应当避免），经常出现大对象容易导致内存还有不少空间时就提前触发垃圾收集以获取足够的连续空间来“安置”它们。

虚拟机提供了一个`-XX:PretenureSiZeThreShold`参数，令大于这个设置值的对象直接在老年代分配。这样做的R的是避免在Eden区及两个SurvivorK之间发生大量的内存复制（复习一下：新生代采用复制算法收集内存）。

#### 3.长期存活的对象将进入老年代

既然虚拟机采用了分代收集的思想来管理内存，那么内存回收时就必须能识别哪些对象应放在新生代，哪些对象应放在老年代中。为了做到这点，虚拟机给每个对象定义了一个对象年龄（Age)计数器。如果对象在Eden出生并经过第一次MinorGC后仍然存活，并且能被Survivor容纳的话，将被移动到Survivor空间中，并且对象年龄设为1。对象在Survivor区中每“熬过”一次MinorGC，年龄就增加1岁，当它的年龄增加到一定程度（默认为15岁），就将会被晋升到老年代中。对象晋升老年代的年龄阈值，可以通过参数`-XX:MaxTenuringThreshold`设置。

#### 4.动态对象年龄判定

为了能更好地适应不同程序的内存状况，虚拟机并不是永远地要求对象的年龄必须达到了`MaxTenuringThreshold`才能晋升老年代，`如果在Survivor空间中相同年龄所有对象大小的总和大于Survivor空间的一半，年龄大于或等于该年龄的对象就可以直接进人老年代`，无须等到MaxTenuringThreshold中要求的年龄。

#### 5.空间分配担保

在发生MinorGC之前，虚拟机会先检查老年代最大可用的连续空间是否大于新生代所有对象总空间，如果这个条件成立，那么MinorGC可以确保是安全的。如果不成立，则虚拟机会查看`HandlePromotionFailure`设置值是否允许担保失败.如果允许，那么会继续检查老年代最大可用的连续空间是否大于历次晋升到老年代对象的平均大小，如果大于，将尝试着进行一次MinorGC，尽管这次MinorGC是有风险的：如果小于，或者HandlePromotionFailure设置不允许冒险，那这时也要改为进行一次FullGC。

下面解释一下“冒险”是冒了什么风险，前面提到过，新生代使用复制收集算法，但为了内存利用率，只使用其中一个Survivor空间来作为轮换备份，因此当出现大址对象在MinorGC后仍然存活的情况（最极端的情况就是内存回收后新生代中所有对象都存活），就需要老年代进行分配担保，把Survivor无法容纳的对象直接迸人老年代。与生活中的贷款担保类似，老年代要进行这样的担保，前提是老年代本身还有容纳这些对象的剩余空间，一共有多少对象会活下来在实际完成内存回收之前是无法明确知道的，所以只好取之前每一次回收晋升到老年代对象的平均大小值作为经验值，与老年代的剩余空间进行比较，决定是否进行FullGC来让老年代腾出更多空间。

取平均值进行比较其实仍然是一种动态概率的手段，也就是说，如果某次MinorGC存活后的对象突增，远远高于平均值的话，依然会导致担保失败（HandlePromotionFailure)。如果出现了HandlePromotionFailure失败，那就只好在失败后重新发起一次FullGC。虽然担保失败时绕的圈子是最大的，但大部分情况下都还是会将HandlePromotionFailure开关打开，避免FullGC过于频繁。

#### 6.小结

内存回收与垃圾收集器在很多时候都是影响系统性能、并发能力的主要因素之一，虚拟机之所以提供多种不同的收集器以及提供大最的调节参数，是因为只有根据实际应用需求、实现方式选择最优的收集方式才能获取最高的性能。没有阇定收集器、参数组合，也没有最优的调优方法，虚拟机也就没有什么必然的内存回收行为。因此，学习虚拟机内存知识，如果要到实践调优阶段，那么必须了解每个具体收集器的行为、优势和劣势、调节参数。



## 第四章 虚拟机性能监控与故障处理工具

Java与C++之间有一堵由内存动态分配和垃圾收集技术所围成的“高墙”，墙外面的人想迸去，墙的人却想出来。

#### 1.JDK命令行工具

大家应该都知道`java.exe` ,`javac.exe`这两个命令行工具，但bin目录下其实还有很多工具。

这些工具都很小，只有几十K，因为这些命令行工具大多是jdk/lib/tools.jar类库的一层包装。主要功能在tools类库中实现的。

若是Linux版本的jdk，那么这些工具直接是Shell脚本写的。

JDK团队采用java代码来实现这些监控工具是有用意的:当应用程序部署到生产环境后，无论是直接接触物理服务器还是远程Telnet到服务器上都可能会受到限制，借助tools.jar类库里面的接口，我们可以直接在应用程序中实现功能强大的监控分析功能。

#### 2.Sun JDK监控和故障处理工具

| 名称   | 主要作用                                                     |
| ------ | ------------------------------------------------------------ |
| jps    | jvm process status tool,显示指定系统内所有的hotspot虚拟机进程 |
| jstat  | jvm statistics monitoring tool,用于收集hotspot虚拟机各方面的运行数据 |
| jinfo  | configuration info for java，显示虚拟机配置信息              |
| jmap   | memory map for java,生成虚拟机的内存转储快照（heapdump文件） |
| jhat   | jvm heap dump browser，用于分析heapmap文件，它会建立一个http/html服务器让用户可以在浏览器上查看分析结果 |
| jstack | stack trace for java ,显示虚拟机的线程快照                   |

##### 1.jps:虚拟机进程状况工具

可以列出正在运行的虚拟机进程，并显示虚拟机执行主类名称以及这些进程的本地虚拟机唯一ID(Local Virtual Machine Identifier,LVMID)。虽然功能比较单一，但它是使用频率最高的jDK命令行工具，因为其他的JDK工具大多需要输入它査询到的LVMID来确定要监控的是哪一个虚拟机进程。对于本地虚拟机进程来说，LVMID与操作系统的进程ID(Process Identifier，PID)是一致的.

　　jps命令格式 `jps [options][hostid]`

　　jps可以通过RMI协议开启了RMI服务的远程虚拟机进程状态，hostid为RMI注册表中注册的主机名。

　　jps常用的选项

| 属性 | 作用                                               |
| ---- | -------------------------------------------------- |
| -p   | 只输出LVMID，省略主类的名称                        |
| -m   | 输出虚拟机进程启动时传递给主类main（）函数的参数   |
| -l   | 输出主类的全名，如果进程执行的是jar包，输出jar路径 |
| -v   | 输出虚拟机进程启动时jvm参数                        |

例子：

```java
D:\illusoryCloud\Common\Java\jdk1.8.0_181\bin>jps

11552 EurekaserverCluApplication
6336
9104 EurekaServerApplication
13348 RemoteMavenServer
2820 EurekaProviderApplication
11948 Jps
7212 Launcher
```



##### 2.jstat：虚拟机统计信息监视工具

　　jstat是用于监视虚拟机各种运行状态信息的命令行工具。它可以显示本地或者远程虚拟机进程中的类装载、内存、垃圾回收、JIT编译等运行数据，在没有GUI图形界面，只是提供了纯文本控制台环境的服务器上，它将是运行期定位虚拟机性能问题的首选工具

　　jstat的命令格式 ` jstat [option vmid [interval [s|ms][count]] ]`

　　对于铭霖格式中的VMID和LVMID，如过是本地虚拟机进程，VMID和LVMID是一致的，如果是远程虚拟机，那VMID的格式应当是：

　`[protocol:][//] lvmid[@hostname[:port]/servername]`

　　参数interval 和count分别表示查询的间隔和次数，如果省略这两个参数，说明只查询一次。

　　主要选项

| 选项              | 作用                                                         |
| ----------------- | ------------------------------------------------------------ |
| -class            | 监视装载类、卸载类、总空间以及类装载所耗费的时间             |
| -gc               | 监视java堆状况，包括eden区、两个survivor区、老年代、永久代等的容量、已用空间、GC时间合计信息 |
| -gccapacity       | 监视内容与-gc基本相同，但输出主要关注java堆各个区域使用到最大、最小空间 |
| -gcutil           | 监视内容与-gc基本相同，但输出主要关注已使用控件占总空间的百分比 |
| -gccause          | 与-gcutil功能一样，但是会额外输出导致上一次gc产生的原因      |
| -gcnew            | 监视新生代GC情况                                             |
| -gcnewcapacity    | 监视内容与-gcnew基本相同，输出主要关注使用到的最大、最小空间 |
| -gcold            | 监视老年代GC情况                                             |
| -gcoldcapacity    | 监视内容与-gcold基本相同，输出主要关注使用到的最大、最小空间 |
| -gcpermcapacity   | 输出永久代使用到的最大、最小空间                             |
| -compiler         | 输出JIT编译过的方法、耗时等信息                              |
| -printcompilation | 输出已经被JIT编译过的方法                                    |

例子：

```java
D:\lillusory\Common\Java\jdk1.8.0_181\bin>jstat -gc 2820
    
 S0C    S1C    S0U    S1U      EC       EU        OC         OU       MC     MU    CCSC   CCSU   YGC     YGCT    FGC    FGCT     GCT
11776.0 15360.0  0.0    0.0   179712.0 152791.4  84992.0    22011.5   35456.0 33624.4 4992.0 4560.4      8    0.101   2      0.142    0.242
```



##### 3.jinfo：java配置信息工具

　　jinfo的作用是实时的查看和调整虚拟机各项参数。使用jps命令的-v参数可以查看虚拟机启动时显示指定的参数列表，但如果想知道未被显式指定的参数的系统默认值，除了去找资料以外，就得使用jinfo的-flag选项

　　jinfo格式 `jinfo [option] pid`

　　jinfo在windows 平台仍有很大的限制

| option           | 说明                       |
| ---------------- | -------------------------- |
| no option        | 输出全部参数和系统属性     |
| -flag  name      | 输出对应名称的参数         |
| -flag [+-]name   | 开启或者关闭对应名称的参数 |
| -flag name=value | 设定对应名称的参数         |
| -flags           | 输出全部参数               |
| -sysprops        | 输出系统属性               |

例子：

```java
D:\lillusory\Common\Java\jdk1.8.0_181\bin>jinfo -flags 2820
    
Attaching to process ID 2820, please wait...
Debugger attached successfully.
Server compiler detected.
JVM version is 25.181-b13
Non-default VM flags: -XX:-BytecodeVerificationLocal -XX:-BytecodeVerificationRemote -XX:CICompilerCount=3 -XX:InitialHeapSize=127926272 -XX:+ManagementServer -XX:MaxHeapSize=2034237440 -XX:MaxNewSize=677904384 -XX:MinHeapDeltaBytes=524288 -XX:NewSize=42467328 -XX:OldSize=85458944 -XX:TieredStopAtLevel=1 -XX:+UseCompressedClassPointers -XX:+UseCompressedOops -XX:+UseFastUnorderedTimeStamps -XX:-UseLargePagesIndividualAllocation -XX:+UseParallelGC
Command line:  -XX:TieredStopAtLevel=1 -Xverify:none -Dspring.output.ansi.enabled=always -Dcom.sun.management.jmxremote -Dcom.sun.management.jmxremote.port=11926 -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.ssl=false -Djava.rmi.server.hostname=localhost -Dspring.liveBeansView.mbeanDomain -Dspring.application.admin.enabled=true -javaagent:D:\lillusory\Java\IntelliJ IDEA 2018.3\lib\idea_rt.jar=11927:D:\lillusory\Java\IntelliJ IDEA 2018.3\bin -Dfile.encoding=UTF-8
```



##### 4.jmap：java内存映像工具

　　jmap命令用于生成堆转储快照。jmap的作用并不仅仅为了获取dump文件，它还可以查询finalize执行队列、java堆和永久代的详细信息。如空间使用率、当前用的是哪种收集器等。

　　和jinfo命令一样，jmap在windows下也受到比较大的限制。除了生成dump文件的-dump选项和用于查看每个类的实例、控件占用统计的-histo选项在所有操作系用都提供之外，其余选项只能在linux/solaris下使用。

　　jmap格式 `jmap [option] vmid`

　　选项：

| 选项           | 作用                                                         |
| -------------- | ------------------------------------------------------------ |
| -dump          | 生成java堆转储快照。格式为： -dump:live,format=b,file=文件名,dump堆到文件,format指定输出格式，live指明是活着的对象,file指定文件名 |
| -finalizerinfo | 显示在F-Queue中等待Finalizer线程执行finalize方法的对象。只在Linux/Solaris平台下有效 |
| -heap          | 显示java堆详细信息，如使用哪种收集器、参数配置、分代情况等，在Linux/Solaris平台下有效 |
| -jisto         | 显示堆中对象统计信息，包含类、实例对象、合集容量             |
| -permstat      | 以ClassLoader为统计口径显示永久代内存状态。只在Linux/Solaris平台下有效 |
| -F             | 当虚拟机进程对-dump选项没有相应时。可使用这个选项强制生成dump快照。只在Linux/Solaris平台下有效 |

例子：

```java
D:\lillusory\Common\Java\jdk1.8.0_181\bin>jmap -heap 2820
    
Attaching to process ID 2820, please wait...
Debugger attached successfully.
Server compiler detected.
JVM version is 25.181-b13

using thread-local object allocation.
Parallel GC with 4 thread(s)

Heap Configuration:
   MinHeapFreeRatio         = 0
   MaxHeapFreeRatio         = 100
   MaxHeapSize              = 2034237440 (1940.0MB)
   NewSize                  = 42467328 (40.5MB)
   MaxNewSize               = 677904384 (646.5MB)
   OldSize                  = 85458944 (81.5MB)
   NewRatio                 = 2
   SurvivorRatio            = 8
   MetaspaceSize            = 21807104 (20.796875MB)
   CompressedClassSpaceSize = 1073741824 (1024.0MB)
   MaxMetaspaceSize         = 17592186044415 MB
   G1HeapRegionSize         = 0 (0.0MB)

Heap Usage:
PS Young Generation
Eden Space:
   capacity = 184025088 (175.5MB)
   used     = 164187512 (156.58141326904297MB)
   free     = 19837576 (18.91858673095703MB)
   89.22017850087919% used
From Space:
   capacity = 12058624 (11.5MB)
   used     = 0 (0.0MB)
   free     = 12058624 (11.5MB)
   0.0% used
To Space:
   capacity = 15728640 (15.0MB)
   used     = 0 (0.0MB)
   free     = 15728640 (15.0MB)
   0.0% used
PS Old Generation
   capacity = 87031808 (83.0MB)
   used     = 22539744 (21.495574951171875MB)
   free     = 64492064 (61.504425048828125MB)
   25.898283073701055% used

22291 interned Strings occupying 2785472 bytes.
```

生成dump文件

```java
D:\lillusory\Common\Java\jdk1.8.0_181\bin>jmap -dump:live,format=b,file=test.bin 2820
    
Dumping heap to D:\lillusory\Common\Java\jdk1.8.0_181\bin\test.bin ...
Heap dump file created
```



##### 5.jhat：虚拟机堆转储快照分析工具

　　Sun JDK提供jhat与jmap搭配使用，来分析dump生成的堆快照。jhat内置了一个微型的HTTP/HTML服务器，生成dump文件的分析结果后，可以在浏览器中查看。

　　用法举例 `jhat test.bin` 

　　test.bin为生成的dump文件。

　　分析结果默认是以包围单位进行分组显示，分析内存泄漏问题主要会使用到其中的“Heap Histogram”与OQL标签的功能。前者可以找到内存中总容量最大的对象。后者是标准的对象查询语言，使用类似SQL的语法对内存中的对象进行查询统计。

例子：

```java
D:\lillusory\Common\Java\jdk1.8.0_181\bin>jhat test.bin

Reading from test.bin...
Dump file created Sat Feb 09 10:42:07 CST 2019
Snapshot read, resolving...
Resolving 414341 objects...
Chasing references, expect 82 dots..................................................................................
Eliminating duplicate references..................................................................................
Snapshot resolved.
Started HTTP server on port 7000
Server is ready.
```

服务开启后 在浏览器中查看`http://localhost:7000/` 内容大概是这样的：

```java
All Classes (excluding platform)
Package <Arrays>
class [Lch.qos.logback.classic.spi.IThrowableProxy; [0x87fae378]
class [Lch.qos.logback.classic.spi.StackTraceElementProxy; [0x87fae2a8]
class [Lch.qos.logback.classic.spi.ThrowableProxy; [0x87fae310]
class [Lch.qos.logback.core.Appender; [0x86f6bff8]
class [Lch.qos.logback.core.filter.Filter; [0x86f6c708]
Package ch.qos.logback.classic
class ch.qos.logback.classic.BasicConfigurator [0x86f77918]
class ch.qos.logback.classic.Level [0x86f7bfd8]
class ch.qos.logback.classic.Logger [0x86f7c0a0]
class ch.qos.logback.classic.LoggerContext [0x86f781a0]
class ch.qos.logback.classic.PatternLayout [0x86f12178]
Package ch.qos.logback.classic.encoder
class ch.qos.logback.classic.encoder.PatternLayoutEncoder [0x86f14c50]
Package ch.qos.logback.classic.jul
class ch.qos.logback.classic.jul.JULHelper [0x86f14d20]
class ch.qos.logback.classic.jul.LevelChangePropagator [0x86f1dbf8]
Package ch.qos.logback.classic.layout
class ch.qos.logback.classic.layout.TTLLLayout [0x86f6c558]
Package ch.qos.logback.classic.pattern
class ch.qos.logback.classic.pattern.Abbreviator [0x86f0e068]
class ch.qos.logback.classic.pattern.CallerDataConverter [0x86f105a8]
class ch.qos.logback.classic.pattern.ClassOfCallerConverter [0x86f10e58]
class ch.qos.logback.classic.pattern.ClassicConverter [0x86f6c348]
Package ch.qos.logback.classic.pattern.color
class ch.qos.logback.classic.pattern.color.HighlightingCompositeConverter [0x86f0edf0]
Package ch.qos.logback.classic.selector
class ch.qos.logback.classic.selector.ContextSelector [0x86f6beb8]
class ch.qos.logback.classic.selector.DefaultContextSelector [0x86f6be50]
Package ch.qos.logback.classic.spi
class ch.qos.logback.classic.spi.ClassPackagingData [0x87f6bdd0]
class ch.qos.logback.classic.spi.Configurator [0x86f779f0]
class ch.qos.logback.classic.spi.EventArgUtil [0x87804e08]
class ch.qos.logback.classic.spi.ILoggingEvent [0x87804ed8]
Package ch.qos.logback.classic.turbo
class ch.qos.logback.classic.turbo.TurboFilter [0x86f693b8]
Package ch.qos.logback.classic.util
class ch.qos.logback.classic.util.ContextInitializer [0x86f7bef0]
class ch.qos.logback.classic.util.ContextSelectorStaticBinder [0x86f7bf68]
class ch.qos.logback.classic.util.EnvUtil [0x86f77980]
class ch.qos.logback.classic.util.LogbackMDCAdapter [0x87804ae0]
class ch.qos.logback.classic.util.LoggerNameUtil [0x86f6bde8]
Package ch.qos.logback.core
class ch.qos.logback.core.Appender [0x86f6c060]
class ch.qos.logback.core.BasicStatusManager [0x86f780b8]
class ch.qos.logback.core.ConsoleAppender [0x86f77750]
```



##### 6.jstack：java堆栈跟踪工具

 　　jstack命令用于生成虚拟机当前时刻的线程快照。线程快照就是当前虚拟机内每一条线程正在执行的方法堆栈集合，生成线程快照的主要目的是定位线程出现长时间停顿的原因，如线程死锁、死循环、请求外部资源导致长时间等待等。

　　jstack 格式 `jstack [option] vmid`

　　option选项的合法值和具体含义

| 选项 | 作用                                         |
| ---- | -------------------------------------------- |
| -F   | 当正常输出的请求不被响应时，强制输出线程堆栈 |
| -l   | 除堆栈外，显示关于锁的附加信息               |
| -m   | 如果调用到本地方法的话，可以显示c/c++的堆栈  |

Tread类新增了一个getAllStackTraces（）方法用于获取虚拟机中所有的线程的StackTraceElement对象。

例子：

```java
D:\lillusory\Common\Java\jdk1.8.0_181\bin>jstack -l 2820
2019-02-09 10:47:33
Full thread dump Java HotSpot(TM) 64-Bit Server VM (25.181-b13 mixed mode):

"AsyncResolver-bootstrap-executor-0" #76 daemon prio=5 os_prio=0 tid=0x000000001bcb1800 nid=0x3a70 waiting on condition [0x000000001fb6e000]
   java.lang.Thread.State: WAITING (parking)
        at sun.misc.Unsafe.park(Native Method)
        - parking to wait for  <0x0000000087c7fa48> (a java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1134)
        at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624)
        at java.lang.Thread.run(Thread.java:748)

   Locked ownable synchronizers:
        - None

"DiscoveryClient-1" #75 daemon prio=5 os_prio=0 tid=0x000000001bcb0800 nid=0xd30 waiting on condition [0x000000001fa6f000]
   java.lang.Thread.State: TIMED_WAITING (parking)
        at sun.misc.Unsafe.park(Native Method)
        - parking to wait for  <0x0000000087ecd908> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)
java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624)
        at java.lang.Thread.run(Thread.java:748)

   Locked ownable synchronizers:
        - None

"DiscoveryClient-HeartbeatExecutor-0" #74 daemon prio=5 os_prio=0 tid=0x000000001bca8800 nid=0x2240 waiting on condition [0x000000001f96e000]
   java.lang.Thread.State: WAITING (parking)
        at sun.misc.Unsafe.park(Native Method)
        - parking to wait for  <0x0000000087c80c98> (a java.util.concurrent.SynchronousQueue$TransferStack)
        at java.util.concurrent.locks.LockSupport.park(LockSupport.java:175)

   Locked ownable synchronizers:
        - None

"DestroyJavaVM" #67 prio=5 os_prio=0 tid=0x000000001bcaf000 nid=0x283c waiting on condition [0x0000000000000000]
   java.lang.Thread.State: RUNNABLE

   Locked ownable synchronizers:
        - None

"http-nio-8763-Acceptor-0" #65 daemon prio=5 os_prio=0 tid=0x000000001bcae800 

"VM Thread" os_prio=2 tid=0x0000000017a07800 nid=0x25c4 runnable

"GC task thread#0 (ParallelGC)" os_prio=0 tid=0x0000000002f6e800 nid=0xb74 runnable

"GC task thread#1 (ParallelGC)" os_prio=0 tid=0x0000000002f70800 nid=0x31b8 runnable

"GC task thread#2 (ParallelGC)" os_prio=0 tid=0x0000000002f72000 nid=0x12a4 runnable

"GC task thread#3 (ParallelGC)" os_prio=0 tid=0x0000000002f74800 nid=0x978 runnable

"VM Periodic Task Thread" os_prio=2 tid=0x00000000197be000 nid=0x76c waiting on condition

JNI global references: 1121
```

#### 4.HSIDS:JIT生成代码反汇编

HSDIS是一个Sun官方推荐的HotSpot虚拟机JIT编译代码的反汇编插件，它包含在HotSpot虚拟机的源码之中但没有提供编译后的程序。在Project Kenai的网站也可以下载.到单独的源码.它的作占HotSpot的-XX:+PrintAssembly指令调用它来把动态生成的本.地代码还原为汇编编代码输出，同时还生成了大量非常右价值的注释，这样我们就可以通过输出的代妈来分析问题。

//TODO

参考：`https://www.cnblogs.com/stevenczp/p/7975776.html`

#### 5.JDK的可视化工具

JDK中除了提供命令行工具外还提供了两个功能强大的可视化工具：Jconsole和VisualVM，这两个工具是JDK的正式成员。

##### 1.Jconsole

打开后可以看到主界面有`概览`，`内存`，`线程`,`类`,`VM概要`,`Mbean`几个选项。

###### 1.内存监控

内存标签界面相当于`jstat`命令的可视化，用于监控受收集器管理的虚拟机内存(Java堆和永久代)的变化趋势。

###### 2.线程监控

线程标签界面相当于`jstack`命令的可视化，遇到线程停顿时可以使用这个页面进行分析。线程长时间停顿的原因主要有这些：等待外部资源(数据库连接，网络资源，设备资源等)，死循环，锁等待（活锁和死锁）.

通过该界面的检测死锁可以发现程序中的死锁情况。

##### 2.VisualVM

VisualVM(All-in-OneJavaTroubleshootingTool)是到目前为止随JDK发布的功能最强大的运行监视和故障处理程序，并且可以预见在未来一段时间内都是官方主力发展的虚拟机故障处理T具。官方在VisualVM的软件说明中写上了“All-in-one”的描述字样，预示着它除了运行监视、故障处理外，还提供了很多其他方而的功能。

如性能分析（Profiling)，VisualVM的性能分析功能甚至比起JProfiler、YourKit等专业且收费的Profiling工具都不会逊色多少，而且VisualVM的还有一个很大的优点：不需要被监视的程序基于特殊Agent运行，因此它对应用程序的实际性能的影响很小，使得它可以直接应用在生产环境中。这个优点是JProfiler、YourKit等工具无法与之娘美的。

###### 1.插件

插件可以进行手工安装，在相关网站上下载*.nbm包后，点击“工具”一“插件”一“已下载”菜中.，然后在弹出的对话框中指定nbm包路径便可进行安装，插件安装后存放在JDK_HOME/lib/visualvm/visualvm中。不过手工安装并不常用，使用VisualVM的白动安装功能已经可以找到大多数所需的插件，在有网络连接的环境下，点击“工具”一“插件”，在弹出的界面中可以看到能直接下载的插件，在右边窗口将显示这个插件的基木信息，如开发者、版本、功能描述等。

###### 2.生成、浏览堆转储快照

在VisualVM中生成dump文件有两种方式，可以执行下列任一操作：

* 在`应用程序`窗口中右键单击应用程序节点，然后选择“堆Dump”。

* 在`应用程序`窗口中双击应用程序节点以打开应用程序标签，然后在“监视”标签中单击“堆Dump”。

生成了dump文件之后，应用程序页签将在该堆的应用程序下增加一个以[heapdump]开头的子节点，并且在主页签中打开了该转储快照。如果需要把dump文件保存或发送出去，要在heapdump节点上右键选择“另存为”菜单，否则当VisualVM关闭时，生成的dump文件会被当做临时文件删除掉。要打开一个已经存在的dump文件，通过文件菜单中的“装入”功能，选择硬盘上的dump文件即可。

从堆页签中的`摘要`面板可以看到应用程序dump时的运行时参数、System.getPropcrtiesO的内容、线程堆栈等信息，`类`面板则是以类为统计口径统计类的实例数量、容量信息，`实例`面板不能直接使用，因为不能确定用户想査看哪个类的实例，所以需要通过`类`面板进入，在“类”中选择一个关心的类后双击鼠标，即可在“实例”里面看见此类中实例的具体信息。

###### 3.分析程序性能

在Profiler页签中，VisualVM提供了程序运行期间方法级的CPU执行时间分析以及内存分析，做Profiling分析肯定会对程序运行性能有比较大的影响，所以一般不在生产环境中使用这项功能。要开始分析，先选择“CPU”和“内存”按钮中的一个，然后切换到应用程序中对程序进行操作，VisualVM会记录到这段时间屮应用程序执行过的方法。如果是CPU分析，将会统计每个方法的执行次数、执行耗时；如果是内存分析，则会统计每个方法关联的对象数以及这些对象所占的空间。分析结束后，点击“停止”按钮结束监控过程。

