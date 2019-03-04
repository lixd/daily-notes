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



## 3. 生产级

### 3.0 问题与解决

```java
/**
 * 整个心跳测试与重连的思路大体相同，基本是如下6个步骤
 *
 * 1）客户端连接服务端
 *
 *  2）在客户端的的ChannelPipeline中加入一个比较特殊的IdleStateHandler，设置一下客户端的写空闲时间，例如5s
 *
 *  3）当客户端的所有ChannelHandler中4s内没有write事件，则会触发userEventTriggered方法（查看gitHub）
 *
 *  4）我们在客户端的userEventTriggered中对应的触发事件下发送一个心跳包给服务端，检测服务端是否还存活，防止服务端已经宕机，客户端还不知道
 *
 *  5）同样，服务端要对心跳包做出响应，其实给客户端最好的回复就是“不回复”，这样可以服务端的压力，假如有10w个空闲Idle的连接，那么服务端光发送心跳回复，则也是费事的事情，那么怎么才能告诉客户端它还活着呢，其实很简单，因为5s服务端都会收到来自客户端的心跳信息，那么如果10秒内收不到，服务端可以认为客户端挂了，可以close链路
 *
 *  6）加入服务端因为什么因素导致宕机的话，就会关闭所有的链路链接，所以作为客户端要做的事情就是短线重连
 * 要写工业级的Netty心跳重连的代码，需要解决一下几个问题：
 * <p>
 * 1）ChannelPipeline中的ChannelHandlers的维护，首次连接和重连都需要对ChannelHandlers进行管理
 * <p>
 * 2）重连对象的管理，也就是bootstrap对象的管理
 * <p>
 * 3）重连机制编写
 *
 * @author illusoryCloud
 */
public class ReadMe {

}
```

**解决方案**

1.ChannelPipeline中的ChannelHandlers的维护，首次连接和重连都需要对ChannelHandlers进行管理

使用`ChannelHandlerHolder`接口来管理`ChannelHandlers`,具体由子类(即重连类BaseConnectionWatchdog)实现

2.重连对象的管理，也就是bootstrap对象的管理

直接将`bootstrap`对象注入到`BaseConnectionWatchdog`,有重连类进行管理

3.重连机制

`BaseConnectionWatchdog`类中实现定时任务，当触发`channelInactive()`方法，即客户端下线时触发重连任务。

### 3.1 服务端handler

```java

/**
 * 心跳机制 服务端
 *
 * @author Administrator
 */
public class HeartBeatServerHandler extends ChannelHandlerAdapter {
    public static final String HEART_BEAT="Heartbeat";
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
        if (HEART_BEAT.equals(msg1)) {
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

### 3.2 服务端启动器

```java
/**
 * 生产级 心跳机制
 *
 * @author illusoryCloud
 */
public class HeartBeatServer {

    private int port;

    public HeartBeatServer(int port) {
        this.port = port;
    }

    public void start() {
        EventLoopGroup boss = new NioEventLoopGroup();
        EventLoopGroup worker = new NioEventLoopGroup();
        try {
            ServerBootstrap b = new ServerBootstrap();
            b.group(boss, worker)
                    //打印一下日志
                    .channel(NioServerSocketChannel.class)
                    .handler(new LoggingHandler(LogLevel.INFO))
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) {
                            ch.pipeline().addLast(new IdleStateHandler(5, 0, 0, TimeUnit.SECONDS));
                            ch.pipeline().addLast("decoder", new StringDecoder());
                            ch.pipeline().addLast("encoder", new StringEncoder());
                            ch.pipeline().addLast(new HeartBeatServerHandler());
                        }

                    })
                    .option(ChannelOption.SO_BACKLOG, 128)
                    .childOption(ChannelOption.SO_KEEPALIVE, true);
            // 绑定端口，开始接收进来的连接 然后一直阻塞在这里
            ChannelFuture future = b.bind(port).sync();

            System.out.println("Server start listen at " + port);
            future.channel().closeFuture().sync();
        } catch (Exception e) {
            boss.shutdownGracefully();
            worker.shutdownGracefully();
        }
    }

    public static void main(String[] args) throws Exception {
        int port;
        if (args.length > 0) {
            port = Integer.parseInt(args[0]);
        } else {
            port = 8081;
        }
        new HeartBeatServer(port).start();
    }

}

```

### 3.3 客户端handler

```java

/**
 * 心跳机制 客户端
 * 主要是写空闲超时后发送一个心跳包
 * 没有向服务端写数据会导致写超时 具体时间由自己设置  这里就是4秒
 * ch.pipeline().addLast("ping", new IdleStateHandler(0, 4, 0, TimeUnit.SECONDS));
 *
 * @author illusoryCloud
 */
@ChannelHandler.Sharable
public class HeartBeatClientHandler extends ChannelHandlerAdapter {
    /**
     * 最大重连次数
     */
    private static final int MAX_TRY_TIMES = 12;
    /**
     * 当前已尝试重连次数
     * 重连成功后置0
     */
    private int tryTimes;

    /**
     * 不释放资源，读取后
     */
    private static final ByteBuf HEARTBEAT_SEQUENCE = Unpooled.unreleasableBuffer(Unpooled.copiedBuffer("Heartbeat",
            CharsetUtil.UTF_8));

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

    /**
     * 客户端上线
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
     * 客户端下线
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
        if (HeartBeatServerHandler.HEART_BEAT.equals(message)) {
            ctx.writeAndFlush("client has read Heartbeat from server");
        }
        super.channelRead(ctx, msg);
    }


}
```

### 3.4 客户端启动器

```java
/**
 * 生产级心跳机制
 * 客户端
 *
 * @author illusoryCloud
 */
public class HeartBeatClient {
    protected final HashedWheelTimer timer = new HashedWheelTimer();


    public void connect(int port, String host) throws Exception {

        EventLoopGroup group = new NioEventLoopGroup();

        Bootstrap b = new Bootstrap();
        b.group(group)
                .channel(NioSocketChannel.class)
                .handler(new LoggingHandler(LogLevel.INFO));


        final BaseConnectionWatchdog watchdog = new BaseConnectionWatchdog(b, timer, port, host, true) {

            @Override
            public ChannelHandler[] handlers() {
                return new ChannelHandler[]{
                        this,
                        new IdleStateHandler(0, 4, 0, TimeUnit.SECONDS),
                        new StringDecoder(),
                        new StringEncoder(),
                        new HeartBeatClientHandler()
                };
            }
        };

        ChannelFuture future;
        //进行连接
        try {
            synchronized (b) {
                b.handler(new ChannelInitializer<Channel>() {

                    //初始化channel
                    @Override
                    protected void initChannel(Channel ch) throws Exception {
                        ch.pipeline().addLast(watchdog.handlers());
                    }
                });

                future = b.connect(host, port);
            }

            // 以下代码在synchronized同步块外面是安全的
            future.sync();

            future.channel().closeFuture().sync();
        } catch (Throwable t) {
            throw new Exception("connects to  fails", t);
        }
    }

    /**
     * @param args
     * @throws Exception
     */
    public static void main(String[] args) throws Exception {
        int port = 8081;
        if (args != null && args.length > 0) {
            try {
                port = Integer.valueOf(args[0]);
            } catch (NumberFormatException e) {
                // 采用默认值
            }
        }
        new HeartBeatClient().connect(port, "127.0.0.1");
    }
}

```

### 3.5 重连机制

```java
/**
 * 生产级心跳机制
 * 重连检测狗
 * 当发现当前的链路不稳定关闭之后，进行最多12次重连
 * 用在客户端
 *
 * @author illusoryCloud
 */
@ChannelHandler.Sharable
public abstract class BaseConnectionWatchdog extends ChannelHandlerAdapter implements TimerTask, ChannelHandlerHolder {
    private final Bootstrap bootstrap;
    private final Timer timer;
    private final int port;

    private final String host;

    private volatile boolean reconnect = true;
    /**
     * 最大重连次数
     */
    private static final int MAX_TRY_TIMES = 12;
    /**
     * 当前已尝试重连次数
     * 重连成功后置0
     */
    private int tryTimes;

    public BaseConnectionWatchdog(Bootstrap bootstrap, Timer timer, int port, String host, boolean reconnect) {
        this.bootstrap = bootstrap;
        this.timer = timer;
        this.port = port;
        this.host = host;
        this.reconnect = reconnect;
    }

    /**
     * channel链路每次active的时候，将其连接的次数重新☞ 0
     */
    @Override
    public void channelActive(ChannelHandlerContext ctx) {

        System.out.println("当前链路已经激活了，重连尝试次数重新置为0");

        tryTimes = 0;
        ctx.fireChannelActive();
    }

    @Override
    public void channelInactive(ChannelHandlerContext ctx) {
        System.out.println("链接关闭");
        if (reconnect) {
            System.out.println("链接关闭，将进行重连");
            if (tryTimes < MAX_TRY_TIMES) {
                tryTimes++;
                //重连的间隔时间会越来越长
                int timeout = 2 << tryTimes;
                timer.newTimeout(this, timeout, TimeUnit.MILLISECONDS);
            }
        }
        ctx.fireChannelInactive();
    }

    /**
     * 定时任务
     * 做的事情就是重连的工作
     *
     * @param timeout 重连超时时间
     */
    @Override
    public void run(Timeout timeout) {

        ChannelFuture future;
        //bootstrap已经初始化好了，只需要将handler填入就可以了
        synchronized (bootstrap) {
            bootstrap.handler(new ChannelInitializer<Channel>() {
                @Override
                protected void initChannel(Channel ch) throws Exception {
                    ch.pipeline().addLast(handlers());
                    ChannelHandler[] handlers = handlers();
                    System.out.println(handlers.length);
                }
            });
            future = bootstrap.connect(host, port);
        }
        //future对象
        future.addListener(new ChannelFutureListener() {

            @Override
            public void operationComplete(ChannelFuture f) {
                //如果重连失败，则调用ChannelInactive方法，再次出发重连事件
                // 一直尝试12次，如果失败则不再重连
                if (!f.isSuccess()) {
                    System.out.println("重连失败");
                    //重连失败后 再次触发ChannelInactive() 继续重连
                    f.channel().pipeline().fireChannelInactive();
                } else {
                    System.out.println("重连成功");
                }
            }
        });

    }
}

```

### 3.6 handlerholder

```java
/**
 *
 * 客户端的ChannelHandler集合，由子类实现，这样做的好处：
 * 继承这个接口的所有子类可以很方便地获取ChannelPipeline中的Handlers
 * 获取到handlers之后方便ChannelPipeline中的handler的初始化和在重连的时候也能很方便
 * 地获取所有的handlers
 * @author illusoryCloud
 */
public interface ChannelHandlerHolder {
    /**
     * 获取channel上的所有handler
     * @return handlers
     */
    ChannelHandler[] handlers();
}

```

