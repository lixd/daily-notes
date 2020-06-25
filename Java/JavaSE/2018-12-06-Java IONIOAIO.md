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

## 1.NIO简介

Java NIO 是 java 1.4, 之后新出的一套IO接口NIO中的N可以理解为**Non-blocking**，不单纯是New。 

**它支持面向缓冲的，基于通道的I/O操作方法。** 随着JDK 7的推出，NIO系统得到了扩展，为文件系统功能和文件处理提供了增强的支持。 由于NIO文件类支持的这些新的功能，NIO被广泛应用于文件处理。 

## 2..**NIO的特性/NIO与IO区别**

**IO是面向流的，NIO是面向缓冲区的**

- 标准的IO编程接口是面向字节流和字符流的。而NIO是面向通道和缓冲区的，数据总是从通道中读到buffer缓冲区内，或者从buffer缓冲区写入到通道中；（ NIO中的所有I/O操作都是通过一个通道开始的。）
- Java IO面向流意味着每次从流中读一个或多个字节，直至读取所有字节，它们没有被缓存在任何地方；
- Java NIO是面向缓存的I/O方法。 将数据读入缓冲器，使用通道进一步处理数据。 在NIO中，使用通道和缓冲区来处理I/O操作。

**IO流是阻塞的，NIO流是不阻塞的**。

- Java NIO使我们可以进行非阻塞IO操作。比如说，单线程中从通道读取数据到buffer，同时可以继续做别的事情，当数据读取到buffer中后，线程再继续处理数据。写数据也是一样的。另外，非阻塞写也是如此。一个线程请求写入一些数据到某通道，但不需要等待它完全写入，这个线程同时可以去做别的事情。
- Java IO的各种流是阻塞的。这意味着，当一个线程调用read() 或 write()时，该线程被阻塞，直到有一些数据被读取，或数据完全写入。该线程在此期间不能再干任何事情了.

**NIO有选择器，而IO没有。**

* 选择器用于使用单个线程处理多个通道。因此，它需要较少的线程来处理这些通道。
* 线程之间的切换对于操作系统来说是昂贵的。 因此，为了提高系统效率选择器是有用的.

**准确的说NIO不是非阻塞IO,而是多路复用IO,应为NIO也会阻塞在selector上**

## 3.NIO核心组件简单介绍

- **Channels**
- **Buffers**
- **Selectors**

### 3.1NIO之Channels

####  1.Channel（通道）介绍

```java
--传统的数据流：
CPU处理IO，性能损耗太大
--改为：
内存和IO接口之间加了 DMA(Direct Memory Access)，DMA向CPU申请权限，IO的操作全部由DMA管理。CPU不要干预。
若有大量的IO请求，会造成DMA的走线过多，则也会影响性能。
--最后：
则改DMA为Channel，Channel为完全独立的单元，不需要向CPU申请权限，专门用于IO。
```



**通常来说NIO中的所有IO都是从 Channel（通道） 开始的。**

**从通道进行数据读取** ：创建一个缓冲区，然后请求通道读取数据。

**从通道进行数据写入** ：创建一个缓冲区，填充数据，并要求通道写入数据。

**Channel通道和流比较相似**

1.通道可以读也可以写，流一般来说是单向的（只能读或者写，所以之前我们用流进行IO操作的时候需要分别创建一个输入流和一个输出流）。

2.通道可以异步读写。

3.通道总是基于缓冲区Buffer来读写。

**最重要的几个Channel的实现：**

**FileChannel：** 用于文件的数据读写

**DatagramChannel：** 用于UDP的数据读写

**SocketChannel：**用于TCP的数据读写，一般是客户端实现

**ServerSocketChannel: **允许我们监听TCP链接请求，每个请求会创建会一个SocketChannel，一般是服务器实现

#### 2.FileChannel

```java
//可以通过InputStream、OutputStream或RandomAccessFile来获取一个FileChannel实例
RandomAccessFile aFile = new RandomAccessFile("data/nio-data.txt", "rw");  
FileChannel inChannel = aFile.getChannel();  
//---------------------从FileChannel读取数据   --------------------
ByteBuffer buf = ByteBuffer.allocate(48);  
int bytesRead = inChannel.read(buf);  //将数据从FileChannel读取到Buffer中 int为读取的字节数
//---------------------向FileChannel写数据    --------------------
String newData = "New String to write to file..." + System.currentTimeMillis();  
ByteBuffer buf = ByteBuffer.allocate(48);  
buf.clear();  
buf.put(newData.getBytes());  
buf.flip();   
while(buf.hasRemaining()) {  
    channel.write(buf);  
}
//---------------------关闭FileChannel     --------------------
channel.close();  
//---------------------其他方法     --------------------
--//position 对FileChannel的某个特定位置进行数据的读/写操作
long pos = channel.position();  
channel.position(pos +123);  
--//size 返回该实例所关联文件的大小
long fileSize = channel.size();  
--//truncate 截取一个文件
channel.truncate(1024);//截取文件时，文件将中指定长度后面的部分将被删除
--//force 将通道里尚未写入磁盘的数据强制写到磁盘上
//出于性能方面的考虑，操作系统会将数据缓存在内存中，所以无法保证写入到FileChannel里的数据一定会即时写到磁盘上。要保证这一点，需要调用force()方法。 
channel.force(true);  //boolean类型的参数，指明是否同时将文件元数据（权限信息等）写到磁盘上。 

```

#### 3.Socket 通道

Java NIO中的SocketChannel是一个连接到TCP网络套接字的通道。可以通过以下2种方式创建SocketChannel： 

1.打开一个SocketChannel并连接到互联网上的某台服务器。

2.一个新连接到达ServerSocketChannel时，会创建一个SocketChannel。

```java
--//---------------1.打开 SocketChannel ---------------------
SocketChannel socketChannel = SocketChannel.open();  
socketChannel.connect(new InetSocketAddress("http://jenkov.com", 80));  

--//---------------2.关闭 SocketChannel ---------------------
socketChannel.close();  

--//--------------3.从 SocketChannel 读取数据--------------------
ByteBuffer buf = ByteBuffer.allocate(48);  
int bytesRead = socketChannel.read(buf);  //将数据从SocketChannel 读到Buffer中。 返回值为读取的字节数，如果返回的是-1，表示已经读到了流的末尾（连接关闭了）。 

--//--------------4.写入 SocketChannel --------------------
String newData = "New String to write to file..." + System.currentTimeMillis();  
ByteBuffer buf = ByteBuffer.allocate(48);  
buf.clear();  
buf.put(newData.getBytes());  
buf.flip();  
//rite()方法无法保证能写多少字节到SocketChannel。所以，我们重复调用write()直到Buffer没有要写的字节为止。 
while(buf.hasRemaining()) {  
    channel.write(buf);  
}  
```



```java
--//--------------5.非阻塞模式  --------------------
可以设置 SocketChannel 为非阻塞模式（non-blocking mode）.设置之后，就可以在异步模式下调用connect(), read() 和write()了。 

--//--------------6.connect()   --------------------
//如果SocketChannel在非阻塞模式下，此时调用connect()，该方法可能在连接建立之前就返回了。为了确定连接是否建立，可以调用finishConnect()的方法
socketChannel.configureBlocking(false);  
socketChannel.connect(new InetSocketAddress("http://jenkov.com", 80));  
while(! socketChannel.finishConnect() ){  
    //wait, or do something else...  
}  

//--------------7.write()   --------------------
非阻塞模式下，write()方法在尚未写出任何内容时可能就返回了。所以需要在循环中调用write()。前面已经有例子了，这里就不赘述了。 

--//--------------8.read() --------------------
非阻塞模式下,read()方法在尚未读取到任何数据时可能就返回了。所以需要关注它的int返回值，它会告诉你读取了多少字节。 

--//--------------9.非阻塞模式与选择器 --------------------
非阻塞模式与选择器搭配会工作的更好，通过将一或多个SocketChannel注册到Selector，可以询问选择器哪个通道已经准备好了读取，写入等。Selector与SocketChannel的搭配使用会在后面详讲。 
```

#### 4.ServerSocket 通道

Java NIO中的 ServerSocketChannel 是一个可以监听新进来的TCP连接的通道，就像标准IO中的ServerSocket一样。ServerSocketChannel类在 java.nio.channels包中。 

```java
//例子
ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();  
serverSocketChannel.socket().bind(new InetSocketAddress(9999));  
while(true){  
    SocketChannel socketChannel =  
            serverSocketChannel.accept();  
  
    //do something with socketChannel...  
}  

--//-------1.打开 ServerSocketChannel   -------------
ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();  

--//-------2.关闭 ServerSocketChannel    -------------
serverSocketChannel.close();  

--//-------3.监听新进来的连接  -------------
通过 ServerSocketChannel.accept() 方法监听新进来的连接。当 accept()方法返回的时候，它返回一个包含新进来的连接的 SocketChannel。因此，accept()方法会一直阻塞到有新连接到达。 

通常不会仅仅只监听一个连接，在while循环中调用 accept()方法. 如下面的例子： 
while(true){  
    SocketChannel socketChannel =  
            serverSocketChannel.accept();  
  
    //do something with socketChannel...  
}  

--//-------4.非阻塞模式 -------------
ServerSocketChannel可以设置成非阻塞模式。在非阻塞模式下，accept() 方法会立刻返回，如果还没有新进来的连接，返回的将是null。 因此，需要检查返回的SocketChannel是否是null。如： 

ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();  
serverSocketChannel.socket().bind(new InetSocketAddress(9999));  
serverSocketChannel.configureBlocking(false);    
while(true){  
    SocketChannel socketChannel =  
            serverSocketChannel.accept();  
  
    if(socketChannel != null){  
        //do something with socketChannel...  
    }  
}  
```

#### 5.Datagram 通道

Java NIO中的DatagramChannel是一个能收发UDP包的通道。因为UDP是无连接的网络协议，所以不能像其它通道那样读取和写入。它发送和接收的是数据包。  

```java
--//----------1.打开 DatagramChannel---------- 
//这个例子打开的 DatagramChannel可以在UDP端口9999上接收数据包。 
DatagramChannel channel = DatagramChannel.open();  
channel.socket().bind(new InetSocketAddress(9999));  

--//----------2.接收数据 ---------- 
//通过receive()方法从DatagramChannel接收数据，如： 
ByteBuffer buf = ByteBuffer.allocate(48);  
buf.clear();  
channel.receive(buf);//将接收到的数据包内容复制到指定的Buffer. 如果Buffer容不下收到的数据，多出的数据将被丢弃。

--//----------3.发送数据  ---------- 
通过send()方法从DatagramChannel发送数据，这个例子发送一串字符到”jenkov.com”服务器的UDP端口80。 因为服务端并没有监控这个端口，所以什么也不会发生。也不会通知你发出的数据包是否已收到，因为UDP在数据传送方面没有任何保证。 
String newData = "New String to write to file..." + System.currentTimeMillis();  
ByteBuffer buf = ByteBuffer.allocate(48);  
buf.clear();  
buf.put(newData.getBytes());  
buf.flip();  
int bytesSent = channel.send(buf, new InetSocketAddress("jenkov.com", 80));  

--//----------4.连接到特定的地址   ----------
可以将DatagramChannel“连接”到网络中的特定地址的。由于UDP是无连接的，连接到特定地址并不会像TCP通道那样创建一个真正的连接。而是锁住DatagramChannel ，让其只能从特定地址收发数据。 
channel.connect(new InetSocketAddress("jenkov.com", 80)); 

--//----------5.读和写   ----------
当连接后，也可以使用read()和write()方法，就像在用传统的通道一样。只是在数据传送方面没有任何保证
int bytesRead = channel.read(buf);  
int bytesWritten = channel.write(but);  
```

#### 6.管道（Pipe）

Java NIO 管道是2个线程之间的单向数据连接。Pipe有一个source通道和一个sink通道。数据会被写到sink通道，从source通道读取。  

```java
--//---------1.创建管道----------
Pipe pipe = Pipe.open();  

--//---------2.向管道写数据 ----------
//要向管道写数据，需要访问sink通道。
Pipe.SinkChannel sinkChannel = pipe.sink();  
//通过调用SinkChannel的write()方法，将数据写入SinkChannel
String newData = "New String to write to file..." + System.currentTimeMillis();  
ByteBuffer buf = ByteBuffer.allocate(48);  
buf.clear();  
buf.put(newData.getBytes());  
buf.flip();  
while(buf.hasRemaining()) {  
    <b>sinkChannel.write(buf);</b>  
}  

--//---------3.从管道读取数据  ----------
  
//从读取管道的数据，需要访问source通道，像这样： 
Pipe.SourceChannel sourceChannel = pipe.source();  
//调用source通道的read()方法来读取数据
ByteBuffer buf = ByteBuffer.allocate(48);  
int bytesRead = inChannel.read(buf);//将读取的内容写入buffer，返回值为读取到的字节数
```

```java
    @Test
    public void clientChannel() {
        try {
            //连接
            SocketChannel sc = SocketChannel.open();
            sc.connect(new InetSocketAddress("127.0.0.1", 33333));
            //读数据
            ByteBuffer writeBuffer = ByteBuffer.allocate(100);
            writeBuffer.put("this is message from client".getBytes());
            writeBuffer.flip();
            sc.write(writeBuffer);
            //写数据
            ByteBuffer readBuffer = ByteBuffer.allocate(100);
            sc.read(readBuffer);
            StringBuffer sb = new StringBuffer();
            readBuffer.flip();
            while (readBuffer.hasRemaining()) {
                sb.append((char) readBuffer.get());
            }
            System.out.println("from service:" + sb);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Test
    public void ServiceChannel() {
        try {
            //连接
            ServerSocketChannel ssc = ServerSocketChannel.open();
            ServerSocket socket = ssc.socket();
            socket.bind(new InetSocketAddress("127.0.0.1", 33333));
            SocketChannel socketChannel = ssc.accept();
            //读数据
            ByteBuffer writeBuffer = ByteBuffer.allocate(100);
            writeBuffer.put("this is message from service".getBytes());
            writeBuffer.flip();
            socketChannel.write(writeBuffer);
            //写数据
            ByteBuffer readBuffer = ByteBuffer.allocate(100);
            socketChannel.read(readBuffer);
            StringBuilder sb = new StringBuilder();
            readBuffer.flip();
            while (readBuffer.hasRemaining()) {
                sb.append((char) readBuffer.get());
            }
            System.out.println("from client:" + sb);
            socketChannel.close();
            ssc.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
```



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

与Selector一起使用时，Channel必须处于非阻塞模式下。这意味着不能将FileChannel与Selector一起使用，因为FileChannel不能切换到非阻塞模式,而套接字通道都可以。 

```java
ServerSocketChannel ssChannel=ServerSocketChannel.open();
ssChannel.configureBlocking(false);//设置为非阻塞
SelectionKey selectionKey = ssChannel.register(selector, SelectionKey.OP_ACCEPT);
```

##### SelectionKey介绍

一个SelectionKey键表示了一个特定的通道对象和一个特定的选择器对象之间的注册关系。

```java
这个对象包含了一些你感兴趣的属性： 

--interest集合
--ready集合 //通道已经准备就绪的操作的集合。
--Channel
--Selector
//从SelectionKey访问Channel和Selector很简单。
Channel  channel  = selectionKey.channel();  
Selector selector = selectionKey.selector();  
--附加的对象（可选）
//可以将一个对象或者更多信息附着到SelectionKey上，这样就能方便的识别某个给定的通道。
selectionKey.attach(theObject);  
Object attachedObj = selectionKey.attachment();  
//还可以在用register()方法向Selector注册Channel的时候附加对象。
SelectionKey key = channel.register(selector, SelectionKey.OP_READ, theObject);  
```

##### 从Selector中选择channel

```java
int select()//阻塞到至少有一个通道在你注册的事件上就绪了。 
int select(long timeout)//阻塞到至少有一个通道在你注册的事件上就绪了，可以设置最多不超过多长时间
int selectNow()//不会阻塞，不管什么通道就绪都立刻返回，没有就绪的通道就返回零
```

##### selectedKeys()

```java
Set selectedKeys = selector.selectedKeys();  //已选择键集（selected key set）”中的就绪通道
```

##### 停止选择的方法

```java
//wakeup()
某个线程调用select()方法后阻塞了，即使没有通道已经就绪，也有办法让其从select()方法返回。只要让其它线程在第一个线程调用select()方法的那个对象上调用Selector.wakeup()方法即可。阻塞在select()方法上的线程会立马返回。 

如果有其它线程调用了wakeup()方法，但当前没有线程阻塞在select()方法上，下个调用select()方法的线程会立即“醒来（wake up）”。 
//close()
用完Selector后调用其close()方法会关闭该Selector，且使注册到该Selector上的所有SelectionKey实例无效。通道本身并不会关闭。 
```

##### 例子

```java
try {
                ServerSocketChannel ssChannel = ServerSocketChannel.open();
                Selector selector = Selector.open();
                ssChannel.configureBlocking(false);
                SelectionKey key = ssChannel.register(selector, SelectionKey.OP_READ);
                while (true) {
                    int readyChannels = selector.select();
                    if (readyChannels == 0) continue;
                    Set selectedKeys = selector.selectedKeys();
                    Iterator keyIterator = selectedKeys.iterator();
                    while (keyIterator.hasNext()) {
                        SelectionKey key = keyIterator.next();
                        if (key.isAcceptable()) {
                            // a connection was accepted by a ServerSocketChannel.
                        } else if (key.isConnectable()) {
                            // a connection was established with a remote server.
                        } else if (key.isReadable()) {
                            // a channel is ready for reading
                        } else if (key.isWritable()) {
                            // a channel is ready for writing
                        }
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
```



### 3.4分散（Scatter）/聚集（Gather）

Java NIO开始支持scatter/gather，scatter/gather用于描述从Channel中读取或者写入到Channel的操作。 

**分散（scatter）**从Channel中读取是指在读操作时将读取的数据写入多个buffer中。因此，Channel将从Channel中读取的数据“分散（scatter）”到多个Buffer中。 
**聚集（gather）**写入Channel是指在写操作时将多个buffer的数据写入同一个Channel，因此，Channel 将多个Buffer中的数据“聚集（gather）”后发送到Channel。 
scatter / gather经常用于需要**将传输的数据分开处理**的场合，例如传输一个由消息头和消息体组成的消息，你可能会将消息体和消息头分散到不同的buffer中，这样你可以方便的处理消息头和消息体。 

```java
ByteBuffer header = ByteBuffer.allocate(128);  
ByteBuffer body   = ByteBuffer.allocate(1024);   
ByteBuffer[] bufferArray = { header, body };    
channel.read(bufferArray);  
```

注意buffer首先被插入到数组，然后再将数组作为channel.read() 的输入参数。read()方法按照buffer在数组中的顺序将从channel中读取的数据写入到buffer，当一个buffer被写满后，channel紧接着向另一个buffer中写。

Scattering Reads在移动下一个buffer前，必须填满当前的buffer，这也意味着它**不适用于动态消息**。换句话说，如果存在消息头和消息体，消息头必须完成填充（例如 128byte），Scattering Reads才能正常工作。   

```java
ByteBuffer header = ByteBuffer.allocate(128);  
ByteBuffer body   = ByteBuffer.allocate(1024);   
//write data into buffers  
ByteBuffer[] bufferArray = { header, body };   
channel.write(bufferArray);  
```

buffers数组是write()方法的入参，write()方法会按照buffer在数组中的顺序，将数据写入到channel，注意只有position和limit之间的数据才会被写入。因此，如果一个buffer的容量为128byte，但是仅仅包含58byte的数据，那么这58byte的数据将被写入到channel中。因此与Scattering Reads相反，**Gathering Writes能较好的处理动态消息。 



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

# 4.测试

## 4.1代码

```java
  /**
     * 普通IO
     */
    @Test
    public void normal() {
        // 文件大小 32M 220ms  1G 4912ms 100k 2ms
        long begin = System.currentTimeMillis();
        FileInputStream fis = null;
        FileOutputStream fos = null;
        try {
            fis = new FileInputStream("src/1.txt");//文件输入流 文件大小 -32M 117ms  -1G 4475ms
            fos = new FileOutputStream("src/two.txt");
           // BufferedInputStream bis = new BufferedInputStream(fis);
           // BufferedOutputStream bos = new BufferedOutputStream(fos);
            byte[] bytes = new byte[1024];
            int len;
            while ((len = fis.read(bytes)) != -1) {
                fos.write(bytes, 0, len);
            }
            fos.flush();

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            closeUtils.close(fis, fos);
            System.out.println("normal IO total time-->" + String.valueOf(System.currentTimeMillis() - begin));
        }
    }

    /**
     * NIO  1.利用通道完成文件的复制（非直接缓冲区）
     */
    @Test
    public static void nio() {
        //文件大小32M 139ms 1G 3922ms  100k 7ms
        long begin = System.currentTimeMillis();
        FileInputStream fis = null;
        FileOutputStream fos = null;
        FileChannel fisChannel = null;
        FileChannel fosChannel = null;
        try {
            fis = new FileInputStream("src/1.txt");
            fos = new FileOutputStream("src/one.txt");
            fisChannel = fis.getChannel();
            fosChannel = fos.getChannel();
            ByteBuffer buffer = ByteBuffer.allocate(1024);

            while (fisChannel.read(buffer) != -1) {
                buffer.flip();//将Buffer从写模式切换到读模式
                fosChannel.write(buffer);
                buffer.clear();
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            closeUtils.close(fis, fos, fisChannel, fosChannel);
            System.out.println("nio normal total time-->" + String.valueOf(System.currentTimeMillis() - begin));
        }
    }

    /**
     *  NIO 2.内存映射方法(直接缓冲区)
     */
    @Test
    public void nio2() {
        long begin = System.currentTimeMillis();
        FileChannel inChannel = null;
        FileChannel outChinnel = null;
        try {
            //文件大小 32M 30ms 1G 820ms 100K 8ms
            inChannel = (FileChannel) FileChannel.open(Paths.get("src/1.txt"), StandardOpenOption.READ);
            outChinnel = FileChannel.open(Paths.get("src/three.txt"), StandardOpenOption.WRITE, StandardOpenOption.READ, StandardOpenOption.CREATE);
            //内存映射文件 第三个参数为大小 都设定为读取时的大小
            MappedByteBuffer in = inChannel.map(FileChannel.MapMode.READ_ONLY, 0, inChannel.size());
            MappedByteBuffer out = outChinnel.map(FileChannel.MapMode.READ_WRITE, 0, inChannel.size());
            byte[] dst = new byte[in.limit()];
            in.get(dst);
            out.put(dst);
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                inChannel.close();
                outChinnel.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
            System.out.println("memory mapper total time-->" + String.valueOf(System.currentTimeMillis() - begin));
        }
    }
```

##  4.2结论

| 方式\时间(ms)\文件大小 | 100K | 32M  | 1G   |
| :--------------------: | ---- | ---- | ---- |
|         普通IO         | 2    | 220  | 4912 |
|     带缓冲的普通IO     | 2    | 40   | 1150 |
|      FileChannel       | 7    | 139  | 3922 |
|      内存映射文件      | 8    | 30   | 820  |

　这个小实验也验证了**内存映射文件**这个方法的可行性，由于具有**随机访问**的功能(映射在内存数组)，所以常用来替代RandomAccessFile。

　　当然，对于**中小文件**的**顺序读入**则没有必要使用内存映射以**避免占用本就有限的I/O资源**，这时应当使用**带缓冲的输入流。**

**小结:** `小文件`-->`带缓冲的IO`,`中等大小文件`-->`都可以` `大文件`-->`内存映射文件`

# 参考

[Java知识总结指南](https://github.com/Snailclimb/JavaGuide)

[NIO文件内存映射](https://www.cnblogs.com/ixenos/p/5863921.html)

[Java NIO](https://www.iteye.com/magazines/132-Java-NIO)



