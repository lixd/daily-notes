# Netty心跳机制实现
## 1.服务端
### 1.1 handler

```java
/**
 * 心跳机制 服务端
 *
 * @author Administrator
 */
public class HeartBeatServerHandler extends ChannelInboundHandlerAdapter {
    /**
     * 不释放资源，读取后
     */
    private static final ByteBuf HEARTBEAT_SEQUENCE = Unpooled.unreleasableBuffer(Unpooled.copiedBuffer("Heartbeat",
            CharsetUtil.UTF_8));
    /**
     * 当前超时次数
     */
    private int lossConnectTime = 0;
    /**
     * 超时次数限制 3次
     * 超过3次则判断客户端为不活跃状态
     */
    private static final int TIME_OUT = 3;

    /**
     * 在出现超时事件时会被触发，包括读空闲超时或者写空闲超时；
     * 这里是服务端判断的是读超时
     *
     * @param ctx
     * @param evt
     * @throws Exception
     */
    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
        //先判断evt是不是IdleStateEvent中几种类型
        if (evt instanceof IdleStateEvent) {
            IdleStateEvent event = (IdleStateEvent) evt;
            IdleState state = event.state();
            //这里是服务端判断的是读超时 客户端没发消息过来导致读超时
            if (state == IdleState.READER_IDLE) {
                lossConnectTime++;
                System.out.println("3秒没收到客户端的消息了 " + ctx.channel().remoteAddress() + "超时次数 : " + lossConnectTime);
                //连续超时次数满足TIME_OUT则判断为不活跃
                if (lossConnectTime >= TIME_OUT) {
                    System.out.println("关闭这个不活跃的channel " + ctx.channel().remoteAddress());
                    ctx.channel().close();
                }
            } else {
                super.userEventTriggered(ctx, evt);
            }
        }
    }

    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        //收到消息后 当前超时次数清0
        lossConnectTime = 0;
        String msg1 = (String) msg;
        System.out.println("channelRead...");
        System.out.println(ctx.channel().remoteAddress() + " server : " + msg.toString());
        // 如果收到客户端发过来的时心跳包 则服务器也回一个心跳包
        if ("Heartbeat".equals(msg1)) {
            ctx.writeAndFlush("server has read message from client");
            ctx.writeAndFlush(HEARTBEAT_SEQUENCE.duplicate());
        }
    }

    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }
}
```

### 1.2 启动器

```java
/**
 * 心跳机制 服务端
 * 负责检测服务端发送的消息
 * 如果客户端没有发送业务消息就会发送心跳包过来
 * 如果连续几次都没有发送消息则判断客户端不活跃
 * 关闭该客户端
 *
 * @author Administrator
 */
public class HeartBeatServer {
//    private final AcceptorIdleStateTrigger idleStateTrigger = new AcceptorIdleStateTrigger();

    private int port;

    public HeartBeatServer(int port) {
        this.port = port;
    }

    public void start() {
        EventLoopGroup bossGroup = new NioEventLoopGroup(1);
        EventLoopGroup workerGroup = new NioEventLoopGroup();
        try {
            ServerBootstrap b = new ServerBootstrap();
            b.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .handler(new LoggingHandler(LogLevel.INFO))
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            // 设置超时时间 5秒
                            ch.pipeline().addLast(new IdleStateHandler(5, 0, 0, TimeUnit.SECONDS));
                            //编码 解码器
                            ch.pipeline().addLast("decoder", new StringDecoder());
                            ch.pipeline().addLast("encoder", new StringEncoder());
                            //心跳包处理逻辑
                            ch.pipeline().addLast(new HeartBeatServerHandler());
                        }
                    }).option(ChannelOption.SO_BACKLOG, 128).childOption(ChannelOption.SO_KEEPALIVE, true);

            // 绑定端口，开始接收进来的连接
            ChannelFuture f = b.bind(port).sync();
            System.out.println("Server start listen at " + port);
            f.channel().closeFuture().sync();
        } catch (Exception e) {
            bossGroup.shutdownGracefully();
            workerGroup.shutdownGracefully();
        }
    }

    public static void main(String[] args) throws Exception {
        int port;
        if (args.length > 0) {
            port = Integer.parseInt(args[0]);
        } else {
            port = 8080;
        }
        new HeartBeatServer(port).start();
    }

}
```

## 2.客户端

### 2.1 handler
```java
/**
 * 心跳机制 客户端
 * 主要是写空闲超时后发送一个心跳包
 * 没有向服务端写数据会导致写超时 具体时间由自己设置  这里就是4秒
 * ch.pipeline().addLast("ping", new IdleStateHandler(0, 4, 0, TimeUnit.SECONDS));
 */
public class HeartBeatClientHandler extends ChannelInboundHandlerAdapter {
    /**
     * 不释放资源，读取后
     */
    private static final ByteBuf HEARTBEAT_SEQUENCE = Unpooled.unreleasableBuffer(Unpooled.copiedBuffer("Heartbeat",
            CharsetUtil.UTF_8));

    /**
     * 客户端下线
     *
     * @param ctx
     * @throws Exception
     */
    @Override
    public void channelActive(ChannelHandlerContext ctx) throws Exception {
        System.out.println("激活时间是：" + new Date());
        System.out.println("HeartBeatClientHandler channelActive");
        super.channelActive(ctx);
    }

    /**
     * 客户端上线
     *
     * @param ctx
     * @throws Exception
     */
    @Override
    public void channelInactive(ChannelHandlerContext ctx) throws Exception {
        System.out.println("停止时间是：" + new Date());
        System.out.println("HeartBeatClientHandler channelInactive");
        super.channelInactive(ctx);
    }

    /**
     * 出现异常直接关闭
     *
     * @param ctx
     * @param cause
     * @throws Exception
     */
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) throws Exception {
        cause.printStackTrace();
        ctx.close();
    }

    /**
     * 收到服务端发送过来的消息
     * 内部判断一下消息类型
     * 是心跳消息还是业务数据
     *
     * @param ctx
     * @param msg
     * @throws Exception
     */
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) throws Exception {
        //打印一下收到的消息
        String message = (String) msg;
        System.out.println(message);
        //如果是心跳包就向服务器发送消息表示收到了
        if (message.equals("Heartbeat")) {
            ctx.write("client has read Heartbeat from server");
            ctx.flush();
        }
        super.channelRead(ctx, msg);
    }

    /**
     * 在出现超时事件时会被触发，包括读空闲超时或者写空闲超时；
     * 这里是客户端 检测的时写超时 即客户端没有向服务端发送消息导致的超时
     * 如果客户端没有发送数据的话 每过4秒就会触发一次这个方法 然后发送一个心跳包给服务器
     * 每次触发超时后发送一个心跳包给服务器
     *
     * @param ctx
     * @param evt
     * @throws Exception
     */
    @Override
    public void userEventTriggered(ChannelHandlerContext ctx, Object evt) throws Exception {
        //判断是不是超时类型
        if (evt instanceof IdleStateEvent) {
            IdleState state = ((IdleStateEvent) evt).state();
            //客户端这里是写超时
            if (state == IdleState.WRITER_IDLE) {
                //每次超时都发送一个心跳包给服务器
                ctx.writeAndFlush(HEARTBEAT_SEQUENCE.duplicate());
            }
        } else {
            super.userEventTriggered(ctx, evt);
        }

    }
}
```
### 2.2启动器
```java

/**
 * 心跳机制 客户端启动器
 */
public class HeartBeatClient {
    public static void main(String[] args) throws InterruptedException {
        int port = 8080;
        if (args != null && args.length > 0) {
            try {
                port = Integer.valueOf(args[0]);
            } catch (Exception e) {
                port = 8080;
            }
        }
        Runnable r = new Runnable() {
            @Override
            public void run() {
                try {
                    new HeartBeatClient().connect("127.0.0.1", 8080);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        };
        //开启多个客户端
        Thread t1 = new Thread(r);
        Thread t2 = new Thread(r);
        Thread t3 = new Thread(r);

        t1.start();
        t2.start();
        t3.start();

    }

    private void connect(String host, int port) throws InterruptedException {
        NioEventLoopGroup loopGroup = new NioEventLoopGroup();
        ChannelFuture future = null;
        try {
            Bootstrap b = new Bootstrap();
            b.group(loopGroup)
                    .channel(NioSocketChannel.class)
                    .handler(new LoggingHandler(LogLevel.INFO))
                    .handler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) throws Exception {
                            // 设置超时时间
                            ch.pipeline().addLast("ping", new IdleStateHandler(0, 20, 0, TimeUnit.SECONDS));
                            ch.pipeline().addLast("decoder", new StringDecoder());
                            ch.pipeline().addLast("encoder", new StringEncoder());
                            ch.pipeline().addLast(new HeartBeatClientHandler());
                        }
                    });
            future = b.connect(host, port).sync();
            //添加一个监听 连接成功则做出提示
            future.addListener(future1 -> {
                if (future1.isSuccess()) {
                    System.out.println("连接成功~");
                }
            });
            //正常情况下会一直阻塞在这里 如果出现异常就会执行finally代码块
            //这里不再finally中关闭group 而是尝试重连
            future.channel().closeFuture().sync();
        } finally {
            //不关闭 尝试重连
//            loopGroup.shutdownGracefully();
            if (null != future) {
                if (future.channel() != null && future.channel().isOpen()) {
                    future.channel().close();
                }
            }
            System.out.println("开始重连~");
            //重新连接
            connect(host, port);

        }
    }
}

```

