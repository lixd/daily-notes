# NIO

```java
package com.kct.api.test.Proxy;

import com.kct.api.test.Builder.MessageTwo;
import com.kct.api.test.Message;

import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;

import java.io.File;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketAddress;
import java.nio.ByteBuffer;
import java.nio.channels.DatagramChannel;
import java.nio.channels.FileChannel;
import java.nio.channels.SelectableChannel;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.nio.channels.ServerSocketChannel;
import java.nio.channels.SocketChannel;
import java.nio.file.FileSystem;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Iterator;
import java.util.Set;

import static java.nio.file.LinkOption.NOFOLLOW_LINKS;

public class NIO {
    @Test
    public void testBuffer1() {
        ByteBuffer buffer = ByteBuffer.allocate(128);
        buffer.clear();
        buffer.put("abbcdefg".getBytes());
        buffer.flip();
        System.out.println((char) buffer.get()); //a
        buffer.rewind();
        System.out.println((char) buffer.get()); //b
        buffer.mark();
        System.out.println((char) buffer.get()); //c
        buffer.reset();
        System.out.println((char) buffer.get()); //d
        System.out.println((char) buffer.get()); //e
        System.out.println((char) buffer.get()); //f
        System.out.println((char) buffer.get()); //g
        buffer.compact();
        buffer.put("hijklmn".getBytes());
    }

    @Test
    public void testChannel1() throws IOException {
        //创建随机读写文件
        RandomAccessFile file = new RandomAccessFile("D:\\test.txt", "rw");
        //获取通道
        FileChannel channel = file.getChannel();
//      channel.transferFrom(channel2,0,channel.size()); //把channel2数据传输到channel
//      channel.transferTo(0,channel.size(),channel2)    //把channel数据传输到channel2
        //创建一个用于读的buffer
        ByteBuffer readBuffer = ByteBuffer.allocate(128);
        //从channel中读取数据到buffer
        int read = channel.read(readBuffer);
        //切换到读模式
        readBuffer.flip();
        int capacity = readBuffer.capacity();
        int limit = readBuffer.limit();
        System.out.println("readBuffer capacity" + capacity);
        System.out.println("readBuffer limit" + limit);
        //从buffer中读取数据
        System.out.println((char) readBuffer.get());
        System.out.println((char) readBuffer.get());
        System.out.println((char) readBuffer.get());
        System.out.println((char) readBuffer.get());
        System.out.println((char) readBuffer.get());
        System.out.println((char) readBuffer.get());

        //创建一个写数据的buffer
        ByteBuffer writeBuffer = ByteBuffer.allocate(128);
        //清空 然后加入一些数据
        writeBuffer.clear();
        writeBuffer.put("abcdefg".getBytes());
        //从写模式切换到读模式
        writeBuffer.flip();
        // 使用循环 将buffer中的数据写入文件
        while (writeBuffer.hasRemaining()) {
            channel.write(writeBuffer);
        }
        file.close();
    }

    @Test
    public void testSocketChannel() {
        try {
            SocketChannel socketChannel = SocketChannel.open();
            socketChannel.connect(new InetSocketAddress("127.0.0.1", 33333));
            ByteBuffer writeBuffer = ByteBuffer.allocate(128);
            writeBuffer.put("this is message from client".getBytes());
            writeBuffer.flip();
            socketChannel.write(writeBuffer);
            ByteBuffer readBuffer = ByteBuffer.allocate(128);
            socketChannel.read(readBuffer);
            readBuffer.flip();
            StringBuffer sb = new StringBuffer();
            while (readBuffer.hasRemaining()) {
                sb.append((char) readBuffer.get());
            }
            System.out.println("from server:" + sb);
            socketChannel.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testServerSocketChannel() {
        try {
            ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();
            //两者达到的效果是一样的，只需要使用其中之一即可。serverSocketChannel.socket().bind和serverSocketChannel.bind
            //其实，不使用ServerSocketChannel类，单纯的使用ServerSocket类和Socket类也能实现服务端和客户端通信的目的。
            // 但是主要注意的是不使用ServerSocketChannel类是无法实现IO的多路服用的。
            serverSocketChannel.socket().bind(new InetSocketAddress("127.0.0.1", 33333));
//            serverSocketChannel.bind(new InetSocketAddress("127.0.0.1", 33333));
            ServerSocket socket = serverSocketChannel.socket();
            SocketChannel socketChannel = serverSocketChannel.accept();
            ByteBuffer writeBuffer = ByteBuffer.allocate(128);
            writeBuffer.put("this is message from server".getBytes());
            writeBuffer.flip();
            socketChannel.write(writeBuffer);

            ByteBuffer readBuffer = ByteBuffer.allocate(128);
            socketChannel.read(readBuffer);
            readBuffer.flip();
            StringBuffer sb = new StringBuffer();
            while (readBuffer.hasRemaining()) {
                sb.append((char) readBuffer.get());
            }
            System.out.println("from client:" + sb);
            socketChannel.close();
            serverSocketChannel.close();

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    //-------先打开服务端 在打开客户端 此时客服端能收到消息 但是客户端收不到 重启服务端后双方都能收到消息了
    @Test
    public void testUDPClient() {
        try {
            // 获取通道
            DatagramChannel datagramChannel = DatagramChannel.open();
            // 通过绑定来监听端口 这里不用写IP地址是因为只能接收发送到本机的消息
            // 这样 这个通道就可以获取到33332端口的消息了
            datagramChannel.bind(new InetSocketAddress(33332));
            ByteBuffer readBuffer = ByteBuffer.allocate(128);
            ByteBuffer writeBuffer = ByteBuffer.allocate(128);
            int i = 1;
            while (true) {

                writeBuffer.clear();
                writeBuffer.put("this is message from client".getBytes());
                writeBuffer.flip();
                // 这里发送消息 发送时需要指定IP和端口
                // 这里发送到本机的33333端口 服务端监听的是这个端口
                datagramChannel.send(writeBuffer, new InetSocketAddress("127.0.0.1", 33333));

                readBuffer.clear();
                // 这里接收消息 端口就是上面的33332
                datagramChannel.receive(readBuffer);
                readBuffer.flip();
                StringBuffer sb = new StringBuffer();
                while (readBuffer.hasRemaining()) {
                    sb.append((char) readBuffer.get());
                }
                System.out.println("from server: " + sb + " " + i);
                i++;

            }
//            datagramChannel.close();

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testUDPServer() {
        try {
            DatagramChannel datagramChannel = DatagramChannel.open();
            //将通道设定为非阻塞的
            datagramChannel.configureBlocking(false);
            //绑定端口33333  可以接收发送到33333端口的数据 上面client就是发送到这个端口的
            datagramChannel.bind(new InetSocketAddress(33333));
//            Selector selector = Selector.open();
//            datagramChannel.register(selector, SelectionKey.OP_READ);
            ByteBuffer readBuffer = ByteBuffer.allocate(128);
            ByteBuffer writeBuffer = ByteBuffer.allocate(128);
//            datagramChannel.connect(new InetSocketAddress("127.0.0.1",33332));
            int i = 1;
            while (true) {
                writeBuffer.clear();
                writeBuffer.put("this is message from Server".getBytes());
                writeBuffer.flip();
                //发送数据到本机的33332端口 client监听的就是这个端口 所以可以收到数据
                datagramChannel.send(writeBuffer, new InetSocketAddress("127.0.0.1", 33332));

                //这里获取数据
                datagramChannel.receive(readBuffer);
                readBuffer.flip();
                StringBuffer sb = new StringBuffer();
                while (readBuffer.hasRemaining()) {
                    sb.append((char) readBuffer.get());
                }
                if (sb.length() != 0) {
                    System.out.println("from client: " + sb + " " + i);
                    i++;
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testSelector1() {
        try {
            ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();
            ServerSocketChannel serverSocketChannel2 = ServerSocketChannel.open();
            Selector selector = Selector.open();
            serverSocketChannel.bind(new InetSocketAddress("127.0.0.1", 33333));
            SocketChannel socketChannel=SocketChannel.open();
            socketChannel.configureBlocking(false);
            //将通道设置为非阻塞的 这样才能注册到selector上
            serverSocketChannel.configureBlocking(false);
            serverSocketChannel2.configureBlocking(false);
            //将通道注册到selector上，第二个参数为关注的事件 关注多个时用|隔开
//            SelectionKey.OP_READ
//            SelectionKey.OP_CONNECT
//            SelectionKey.OP_WRITE
//            SelectionKey.OP_ACCEPT
            //一个SelectionKey键表示了一个特定的通道对象和一个特定的选择器对象之间的注册关系。
            SelectionKey selectionKey = socketChannel.register(selector, SelectionKey.OP_READ);
            while (true) {
                int select = selector.select();  //该selector上已经准备好的channel个数
                if (select == 0) {
                    return;
                }
                // 通过遍历selector上的key 来监听selector上的channel状态变化
                Set<SelectionKey> selectionKeys = selector.selectedKeys();
                Iterator<SelectionKey> iterator = selectionKeys.iterator();
                while (iterator.hasNext()) {
                    SelectionKey key = iterator.next();
                    if (key.isConnectable()) {  //channel连接了

                    } else if (key.isAcceptable()) {
                        ServerSocketChannel serverSocketChannel1 = (ServerSocketChannel) key.channel();
                        SocketChannel accept = serverSocketChannel1.accept();
                        accept.configureBlocking(false);
                        System.out.println("连接成功");
                    } else if (key.isReadable()) {

                    } else if (key.isValid()) {

                    } else if (key.isWritable()) {

                    }
                    iterator.remove();
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testPath() {
        // 根据文件路径获取Path
        Path path = Paths.get("D:\\test.ttx");
        //Path与file相互装换
        File file = path.toFile();
        Path path1 = file.toPath();

        System.out.println("getFileName: " + path.getFileName());
        System.out.println("getFileSystem: " + path.getFileSystem());
        System.out.println("getNameCount: " + path.getNameCount());
        System.out.println("getRoot: " + path.getRoot());
        System.out.println("getParent: " + path.getParent());

        Path path2 = Paths.get("."); //点 “.”表示获取当前路径
        System.out.println("getFileName: " + path2.toAbsolutePath());
        // normalize() : 返回一个路径，该路径是冗余名称元素的消除。
        // toRealPath() : 融合了toAbsolutePath()方法和normalize()方法
        System.out.println("normalize: " + path2.toAbsolutePath().normalize());
        try {
            System.out.println("toRealPath: " + path2.toRealPath());
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testFile() {
        Path path = Paths.get("D:\\test.ttx");

        boolean exists = Files.exists(path, NOFOLLOW_LINKS);
        System.out.println("文件是否存在：" + exists);
        try {
            Files.createDirectory(path);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Test
    public void testSpring(){
        ApplicationContext context=new ClassPathXmlApplicationContext("classpath:application.xml");
        MessageTwo bean = context.getBean(MessageTwo.class);
    }
}
```