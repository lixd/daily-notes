# Java IO/NIO/AIO

# 1.IO

## 1.流的概念和作用

流是一组有顺序的，有起点和终点的字节集合，是对数据传输的总称或抽象。即数据在两设备间的传输称为流，流的本质是数据传输，根据数据传输特性将流抽象为各种类，方便更直观的进行数据操作。

## 2.IO流的分类

### 1.按照流的流向分

**输入流：**

```java
//输入字节流 InputStream
InputStream 是所有的输入字节流的父类，它是一个抽象类。
ByteArrayInputStream、StringBufferInputStream、FileInputStream 是三种基本的介质流，它们分别从Byte 数组、StringBuffer、和本地文件中读取数据。
PipedInputStream 是从与其它线程共用的管道中读取数据，与Piped 相关的知识后续单独介绍。
ObjectInputStream 和所有FilterInputStream 的子类都是装饰流（装饰器模式的主角）。
//输入字符流 Reader
InputStreamReader
FileReader
StringReader
```



**输出流**

```java
//输出字节流 OutputStream
OutputStream 是所有的输出字节流的父类，它是一个抽象类。
ByteArrayOutputStream、FileOutputStream 是两种基本的介质流，它们分别向Byte 数组、和本地文件中写入数据。
PipedOutputStream 是向与其它线程共用的管道中写入数据。
ObjectOutputStream 和所有FilterOutputStream 的子类都是装饰流。
//输出字符流 Writer
OutputStreamWriter
StringWriter
FileWriter
```

**其中输入或者输入都是相对内存或者程序而言的,即输入到内存或者从内存输出**

### 2.按照操作单元划分

**分为字节流和字符流**

字符流的由来： 因为数据编码的不同，而有了对字符进行高效操作的流对象。本质其实就是基于字节流读取时，去查了指定的码表。 字节流和字符流的区别：

- 读写单位不同：字节流以字节（8bit）为单位，字符流以字符为单位，根据码表映射字符，一次可能读多个字节。
- 处理对象不同：**字节流**能处理**所有类型**的数据（如图片、avi等），而**字符流**只能处理**字符类型**的数据。
- 字节流：一次读入或读出是**8位**二进制。
- 字符流：一次读入或读出是**16位**二进制。

无论是图片或者视频，文字，它们都以二进制存储的。二进制的最终都是以一个8位为数据单元进行体现，所以计算机中的最小数据单元就是字节。意味着，字节流可以处理设备上的所有数据，所以字节流一样可以处理字符数据。

 **结论：只要是处理纯文本数据，就优先考虑使用字符流。 除此之外都使用字节流。**

```java
Reader/Writer结尾的都是字符流
InputStream/OutputStream结尾的都是字节流
```

### 3.按照流的角色划分

**节点流：**直接与数据源相连，读入或读出。 直接使用节点流，读写不方便，为了更快的读写文件，才有了处理流。 

```java
父　类 ：InputStream 、OutputStream、 Reader、 Writer
文　件 ：FileInputStream 、 FileOutputStrean 、FileReader 、FileWriter 文件进行处理的节点流
数　组 ：ByteArrayInputStream、 ByteArrayOutputStream、 CharArrayReader 、CharArrayWriter 对数组进行处理的节点流（对应的不再是文件，而是内存中的一个数组）
字符串 ：StringReader、 StringWriter 对字符串进行处理的节点流
管　道 ：PipedInputStream 、PipedOutputStream 、PipedReader 、PipedWriter 对管道进行处理的节点流
```

**处理流:**和节点流一块使用，在节点流的基础上，再套接一层，套接在节点流上的就是处理流。如`BufferedReader`处理流的构造方法总是要带一个其他的流对象做参数。一个流对象经过其他流的多次包装，称为流的链接。 

```java
常用的处理流
	缓冲流：BufferedInputStrean 、BufferedOutputStream、 BufferedReader、 BufferedWriter 增加缓冲		功能，避免频繁读写硬盘。
	转换流：InputStreamReader 、OutputStreamReader实现字节流和字符流之间的转换。
	数据流： DataInputStream 、DataOutputStream 等-提供将基础数据类型写入到文件中，或者读取出来。
	转换流
InputStreamReader 、OutputStreamWriter 要InputStream或OutputStream作为参数，实现从字节流到字符流的		转换。
```

## 3.IO使用

```java
 private void TesIO() {
        String strPath = "";
        String decPath = "";
        try {
            FileInputStream fis = new FileInputStream(strPath);//通过打开一个到实际文件的连接来创建一个 FileInputStream
            FileOutputStream fos = new FileOutputStream(decPath);//通过打开一个到实际文件的连接来创建一个 FileOutputStream
            int len;
            byte[] buffer = new byte[1024];
            while ((len = fis.read(buffer)) != -1) {   // fis.read(buffer) 将流中的最多buffer.length的数据写入buffer数组
                                                        //返回值len为读入缓冲区的字节总数，如果因为已经到达文件末尾而没有更多的数据，则返回 -1
                fos.write(len);    //将指定字节写入此文件输出流。
            }
            fos.flush();//刷新此输出流并强制写出所有缓冲的输出字节。将上面write写入到流的字节传递给操作系统进行磁盘写入

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
```

# 2.NIO

## 1..NIO简介

Java NIO 是 java 1.4, 之后新出的一套IO接口NIO中的N可以理解为**Non-blocking**，不单纯是New。 

**它支持面向缓冲的，基于通道的I/O操作方法。** 随着JDK 7的推出，NIO系统得到了扩展，为文件系统功能和文件处理提供了增强的支持。 由于NIO文件类支持的这些新的功能，NIO被广泛应用于文件处理。 

## 2..**NIO的特性/NIO与IO区别**

**IO是面向流的，NIO是面向缓冲区的**

- 标准的IO编程接口是面向字节流和字符流的。而NIO是面向通道和缓冲区的，数据总是从通道中读到buffer缓冲区内，或者从buffer缓冲区写入到通道中；（ NIO中的所有I/O操作都是通过一个通道开始的。）
- Java IO面向流意味着每次从流中读一个或多个字节，直至读取所有字节，它们没有被缓存在任何地方；
- Java NIO是面向缓存的I/O方法。 将数据读入缓冲器，使用通道进一步处理数据。 在NIO中，使用通道和缓冲区来处理I/O操作。

**IO流是阻塞的，NIO流是不阻塞的**。

- Java NIO使我们可以进行非阻塞IO操作。比如说，单线程中从通道读取数据到buffer，同时可以继续做别的事情，当数据读取到buffer中后，线程再继续处理数据。写数据也是一样的。另外，非阻塞写也是如此。一个线程请求写入一些数据到某通道，但不需要等待它完全写入，这个线程同时可以去做别的事情。
- Java IO的各种流是阻塞的。这意味着，当一个线程调用read() 或 write()时，该线程被阻塞，直到有一些数据被读取，或数据完全写入。该线程在此期间不能再干任何事情了

**NIO有选择器，而IO没有。**

* 选择器用于使用单个线程处理多个通道。因此，它需要较少的线程来处理这些通道。
* 线程之间的切换对于操作系统来说是昂贵的。 因此，为了提高系统效率选择器是有用的



## 3.NIO核心组件简单介绍

- **Channels**
- **Buffers**
- **Selectors**

### 3.1NIO之Channels

####  Channel（通道）介绍

**通常来说NIO中的所有IO都是从 Channel（通道） 开始的。**

**从通道进行数据读取** ：创建一个缓冲区，然后请求通道读取数据。

**从通道进行数据写入** ：创建一个缓冲区，填充数据，并要求通道写入数据。

**Channel通道和流**

1.通道可以读也可以写，流一般来说是单向的（只能读或者写，所以之前我们用流进行IO操作的时候需要分别创建一个输入流和一个输出流）。

2.通道可以异步读写。

3.通道总是基于缓冲区Buffer来读写。

**最重要的几个Channel的实现：**

**FileChannel：** 用于文件的数据读写

**DatagramChannel：** 用于UDP的数据读写

**SocketChannel：**用于TCP的数据读写，一般是客户端实现

**ServerSocketChannel: **允许我们监听TCP链接请求，每个请求会创建会一个SocketChannel，一般是服务器实现

### 3.2 NIO之Buffer

#### Buffer(缓冲区)介绍

**Java NIO Buffers用于和NIO Channel交互。 我们从Channel中读取数据到buffers里，从Buffer把数据写入到Channels.**

**Buffer本质上就是一块内存区**，可以用来写入数据，并在稍后读取出来。这块内存被NIO Buffer包裹起来，对外提供一系列的读写方便开发的接口。

在Java NIO中使用的核心缓冲区如下（覆盖了通过I/O发送的基本数据类型：byte, char、short, int, long, float, double ，long）

**每个缓冲区都具有**：

　　　　1、一个恒定的容量；

　　　　2、一个读写位置，下一个值将在此进行读写；

　　　　3、一个界限，超过他无法读写；

　　　　4、一个可选的标记，用于重复一个读入或写出操作；

　　0≤标记≤位置≤界限≤容量

　　![img](D:\lillusory\MyProject\lillusory.github.io\images\posts\Java\se\2018-12-05-6-NIO-buffer-info.png)

　　1、写：一开始时位置为0，界限等于容量，当我们不断调用put添值到缓冲区中，直至**耗尽所有数据**或者**写出的数据集量达到容量大小**时，就该进行读入操作了；

　　2、读：这时调用 flip 方法(flip()函数的作用是将写模式转变为读模式) **将界限设置到当前位置**（相当于trim），并把**位置复位到0（为了读操作），**现在在remaining方法返回（界限 — 位置）正数时，不断调用get；

 　  3、复位：将缓冲区中所有值读入后，调用clear（**位置复位到0，界限复位到容量**）使缓冲区为下一次**写**循环做准备；

　　4、复读：想复读缓冲区，可调用rewind或mark/reset方法；

> ### 容量（Capacity）

作为一块内存，buffer有一个固定的大小，叫做capacit（容量）。也就是最多只能写入容量值得字节，整形等数据。一旦buffer写满了就需要清空已读数据以便下次继续写入新的数据。

> ### 位置（Position）

**当写入数据到Buffer的时候需要从一个确定的位置开始**，默认初始化时这个位置position为0，一旦写入了数据比如一个字节，整形数据，那么position的值就会指向数据之后的一个单元，position最大可以到capacity-1.

**当从Buffer读取数据时，也需要从一个确定的位置开始。buffer从写入模式变为读取模式时，position会归零，每次读取后，position向后移动。**

> ### 上限（Limit）

在写模式，limit的含义是我们所能写入的最大数据量，它等同于buffer的容量。

一旦切换到读模式，limit则代表我们所能读取的最大数据量，他的值等同于写模式下position的位置。换句话说，您可以读取与写入数量相同的字节数（限制设置为写入的字节数，由位置标记）。



### 3.3NIO之Selector 

**Selector** 一般称 为**选择器** ，当然你也可以翻译为 **多路复用器** 。它是Java NIO核心组件中的一个，用于检查一个或多个NIO Channel（通道）的状态是否处于可读、可写。如此可以实现单线程管理多个channels,也就是可以管理多个网络链接。

**使用Selector的好处在于：** 使用更少的线程来就可以来处理通道了， 相比使用多个线程，避免了线程上下文切换带来的开销。

##### Selector（选择器）的使用方法介绍

- Selector的创建

```
Selector selector = Selector.open();
```

- 注册Channel到Selector(Channel必须是非阻塞的)

```
channel.configureBlocking(false);
SelectionKey key = channel.register(selector, Selectionkey.OP_READ);
```

- SelectionKey介绍

  一个SelectionKey键表示了一个特定的通道对象和一个特定的选择器对象之间的注册关系。

- 从Selector中选择channel(Selecting Channels via a Selector)

  选择器维护注册过的通道的集合，并且这种注册关系都被封装在SelectionKey当中.

- 停止选择的方法

  wakeup()方法 和close()方法。

## 4.NIO 内存映射文件

内存的访问速度比磁盘高几个数量级，但是基本的IO操作是直接调用native方法获得驱动和磁盘交互的，IO速度限制在磁盘速度上.

​	由此，就有了**缓存**的思想，将磁盘内容预先缓存在内存上，这样当供大于求的时候IO速度基本就是以内存的访问速度为主，例如BufferedInput/OutputStream等

　　而我们知道大多数OS都可以利用虚拟内存实现将一个文件或者文件的一部分映射到内存中，然后，这个文件就可以当作是内存数组一样地访问，我们可以把它看成一种“**永久的缓存**”

　　内存映射文件：内存映射文件允许我们创建和修改那些**因为太大而不能放入内存的文件，**此时就可以**假定**整个文件都放在内存中，而且可以完全把它当成非常大的数组来访问（随机访问）

当然，对于**中等尺寸**文件的**顺序读入**则没有必要使用内存映射以**避免占用本就有限的I/O资源**，这时应当使用**带缓冲的输入流。** 

### 1.首先，从文件中获得一个通道（channel）。

通道是用于磁盘文件的一种抽象，它使我们可以访问诸如内存映射、文件加锁机制(下文缓冲区数据结构部分将提到)、文件间快速数据传递等操作系统特性。

```java
FileChannel channel = FileChannel.open(path, options);
```

还能通过在一个打开的 File 对象（RandomAccessFile、FileInputStream 或 FileOutputStream）上调用 getChannel() 方法获取。调用 getChannel() 方法会返回一个连接到相同文件的 FileChannel 对象且该 FileChannel 对象具有与 File 对象相同的访问权限 

### 2通过调用FileChannel类的map方法**进行**内存映射

map方法从这个通道中**获得一个MappedByteBuffer对象（ByteBuffer的子类）**。

　　你可以指定想要映射的文件区域与映射模式，支持的模式有3种：

- FileChannel.MapMode.READ_ONLY:产生只读缓冲区，对缓冲区的写入操作将导致ReadOnlyBufferException；
- FileChannel.MapMode.READ_WRITE:产生可写缓冲区，任何修改将在**某个时刻**写回到文件中，而这某个时刻是依赖OS的，其他映射同一个文件的程序可能不能立即看到这些修改，多个程序同时进行文件映射的确切行为是依赖于系统的，但是它是线程安全的
- FileChannel.MapMode.PRIVATE:产生可写缓冲区，但任何修改是缓冲区私有的，不会回到文件中。。。

```java
public class MemoryMapTest
{

   public static long checksumMappedFile(Path filename) throws IOException
   {
      //直接通过传入的Path打开文件通道
      try (FileChannel channel = FileChannel.open(filename))
      {
         CRC32 crc = new CRC32();
         int length = (int) channel.size();
         //通过通道的map方法映射内存
         MappedByteBuffer buffer = channel.map(FileChannel.MapMode.READ_ONLY, 0, length);
   
         for (int p = 0; p < length; p++)
         {
            int c = buffer.get(p);
            crc.update(c);
         }
         return crc.getValue();
      }
   }

   public static void main(String[] args) throws IOException
   {
      System.out.println("Mapped File:");
      start = System.currentTimeMillis();
      crcValue = checksumMappedFile(filename);
      end = System.currentTimeMillis();
      System.out.println(Long.toHexString(crcValue));
      System.out.println((end - start) + " milliseconds");
   }
}
```

### 3.使用Buffer读写数据

一旦有了缓冲区，就可以使用**ByteBuffer**类和**Buffer**超类的方法来**读写数据**

　　缓冲区支持**顺序**和**随机**数据访问:

　　**顺序**：有一个可以通过get和put操作来移动的**位置**

```
 while(buffer.hasRemaining()){
    byte b = buffer.get(); //get当前位置
     ...
 }
```

**随机**：可以按内存数组索引访问 

```java
for(int i=0; i<buffer.limit(); i++){
     byte b = buffer.get(i); //这个get能指定索引
     ...
 }
```

```java
//可以用下面的方法来读写数据到一个字节数组（destination array）:
　　get(byte[] bytes) /get(byte[] bytes, int offset, int length) 
　　The method transfers bytes from this buffer into the given destination array.
//还有下列getXxx方法：用来读入在文件中存储为二进制值的基本类型值 
　　getInt, getLong, getShort, getChar, getFloat, getDouble 
```

　关于**二进制数据排序机制**不同的读取问题：

　　　　我们知道，Java对二进制数据使用**高位在前**的排序机制（比如 0XA就是 0000 1010，高位在前低位在后

　　　　但是，如果需要**低位在前**的排序方式（0101 0000）处理二进制数字的文件，需调用：

　　　　buffer.order(ByteOrder.LITTLE_ENDIAN);

　　　　要查询缓冲区内当前的字节顺序，可以调用：

　　　　ByteOrder b = buffer.order();

　　要向缓冲区写数字，使用对应的putXxx方法，**在恰当的时机，以及当通道关闭时，会将这些修改写回到文件中的哦**。

# 3.AIO

AIO即Asynchronous I/O 

jdk7主要增加了三个新的异步通道:

- AsynchronousFileChannel: 用于文件异步读写；
- AsynchronousSocketChannel: 客户端异步socket；
- AsynchronousServerSocketChannel: 服务器异步socket。

AIO就是异步IO，与NIO类似，区别在于AIO是等读写过程完成后再去调用回调函数。 

AIO的特点：

1.读完了再通知我

2.不会加快IO，只是在读完后进行通知

3.使用回调函数，进行业务处理

由于NIO的读写过程依然在应用线程里完成，所以对于那些读写过程时间长的，NIO就不太适合。

而AIO的读写过程完成后才被通知，所以AIO能够胜任那些重量级，读写过程长的任务。



# 参考

[Java知识总结指南](https://github.com/Snailclimb/JavaGuide)

[NIO文件内存映射](https://www.cnblogs.com/ixenos/p/5863921.html)





