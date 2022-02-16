# web 服务优雅关机和重启

## 1. 概述

我们编写的Web项目部署之后，经常会因为需要进行配置变更或功能迭代而重启服务，单纯的`kill -9 pid`的方式会强制关闭进程，这样就会导致服务端当前正在处理的请求失败，这时就需要更优雅的方式来实现关机或重启，以**保证正在处理的请求不受影响**。



## 2. 优雅关机

我们使用`CTRL+C`或者`kill -9` 关闭服务时，最大的问题在于**当前正在处理中的所有请求都会受到影响**，返回失败给用户。

> 虽然影响不算太大，但是依旧不够优雅。

只需要等处理中的请求结束后在关机就能避免这个问题了。



### 大致流程

大致流程如下：

* 1）接收到关机信号时，停止接收新请求
* 2）处理完系统中的剩余请求后退出
* 3）设置超时时间，超时后不再等待，直接退出，防止一直阻塞在步骤2无法退出的情况

> 实际上大部分系统的优雅关机都是这么个流程。



比如 Kubernetes 中的 [pod-termination](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination) 差不多也是这样的：

* 1）用户发送delete pod命令，grace period 参数即宽限期（假设为30秒）
* 2）API Server 更新 pod 的宽限期字段
* 3）执行pod get 命令显示pod状态变为Terminating
* 4）与3同时，kubelet看到pod被标识了deleteTimestamp也就是标识为Terminating，它开始执行关闭pod流程：
  * 如果pod中的一个容器定义了 preStop hook，就在容器中调用它。如果过了宽限期preStop还在运行，步骤2一次性延长一个短的宽限期（2秒）。如果要延长preStop，你要修改terminationGracePeriodSeconds
  * 向容器发送TERM信号。不是pod内的所有容器同时收到TERM信号并且如果它们关闭的顺序很重要，则每个容器都可能需要preStop hook
* 5）与3同时，pod 从 service的endpoints列表中移除，不再被视为副本控制器正在运行的Pod集合的一部分。缓慢关闭的Pod无法继续为流量提供服务，因为负载均衡器（如服务代理）会将其从轮换中删除。
* 6）宽限期过期时，pod中所有运行的进程被SIGKILL杀死
* 7）kubelet设置API Server的宽限期为0（立即删除）来结束pod的删除流程。pod从API消失，客户端不可见。

和我们的优雅关机流程基本一致：

* 首先是修改一些标识，并从endpoints中移除，让Pod不在接收新的请求
* 然后是给定宽限时间，让Pod优雅关闭
* 最后宽限时间到达时强制关闭



### http.Server 实现

Go 1.8版本之后，http.Server 内置的 [Shutdown()](https://link.juejin.cn/?target=https%3A%2F%2Fgolang.org%2Fpkg%2Fnet%2Fhttp%2F%23Server.Shutdown)  方法支持优雅关机，如下：

```go
func main() {
	// mux demo
	r := mux.NewRouter()
	r.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
		time.Sleep(5 * time.Second)
		_, _ = writer.Write([]byte("mux ok"))
	}).Methods("GET")

	// gin demo
	// r := gin.Default()
	// r.GET("/", func(c *gin.Context) {
	// 	time.Sleep(5 * time.Second)
	// 	c.JSON(http.StatusOK, "gin ok")
	// })
	// 注：这里需要创建一个http.Server对象，然后调用server.ListenAndServe方法，而不是直接调用http.ListenAndServe方法.
	// 因为graceful shutdown方法时由http.Server对象实现的
	// http.ListenAndServe内部也是创建了一个http.Server对象，只是外部无法获取
	server := http.Server{
		Addr:    ":8080",
		Handler: r,
	}
	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server listen err:%s", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	ctx, channel := context.WithTimeout(context.Background(), 5*time.Second)
	defer channel()
	// 优化关闭服务--会在请求处理完成后再关闭服务，而不是立即关闭
	// 通过ctx添加一个5秒钟超时限制
	if err := server.Shutdown(ctx); err != nil {
		log.Fatal("server shutdown error")
	}
	log.Println("server exiting...")
}
```

上面的代码运行后会在本地的`8080`端口开启一个web服务，它只注册了一条路由`/`，为了便于测试优雅关机效果，请求过来会先sleep 5秒钟然后才返回响应信息。

我们按下`Ctrl+C`时会发送`syscall.SIGINT`来通知程序优雅关机，具体做法如下：

* 1）打开终端，编译并执行上面的代码`go run main.go`
* 2）打开浏览器，访问`localhost:8080/`，此时浏览器白屏等待服务端返回响应。
* 3）在终端**迅速**执行`Ctrl+C`命令给程序发送`syscall.SIGINT`信号
  * 代码中 sleep 5秒钟就是为了这里方便测试
* 4）此时程序并不立即退出而是等我们第2步的响应返回之后再退出，从而实现优雅关机。



## 3. 优雅重启

服务运行中，如果更新了代码，直接编译并运行，那么不好意思，端口已经在使用中：

```shell
listen tcp :8000: bind: address already in use
```

看到这样的错误信息，我们通常都是一通下意识的操作：

```shell
lsof -i:8000
kill -9 …
```

这样做端口被占用的问题是解决了，程序也成功更新了。但是这里面还隐藏着两个问题：

* 1）kill 程序时可能把正在处理的用户请求给中断了
* 2）从 kill 到重新运行程序这段时间里没有应用在处理用户请求


熟悉 Nginx 的朋友肯定知道，Nginx 是支持热更新的，即在不停止服务的前提下升级或降级 Nginx 版本。

就是先拉起新进程，然后旧进程不再接收流量，让新请求都进入到新进程。

等旧进程把剩余的请求处理完成后就自动退出。

我们Web服务的优雅重启也可以参考这个流程。



### 大致流程

* 1）替换可执行文件或修改配置文件

* 2）发送信号量 `SIGHUP`

* 3）拒绝新连接请求旧进程，但要保证已有连接正常

* 4）启动新的子进程

* 5）新的子进程开始 `Accet`

* 6）系统将新的请求转交新的子进程

* 7）旧进程处理完所有旧连接后正常结束



### endless

社区已经有了完整的实现方案了： [endless](https://github.com/fvbock/endless)

endless 大致流程：

* 1）接收到重启信号时 fork 出子进程运行新的程序
* 2）该子进程接收从父进程传来的相关文件描述符，直接复用socket，同时父进程关闭socket
  * 将新流量全部由新进程来处理
  * 父进程不再接收流量
* 3）父进程把当前系统中的请求处理完成后退出

这样一来问题一解决了。且复用 socket 也直接解决了问题二，实现服务 0 down time 切换。

**复用 socket 可以说是 endless 方案的核心。**



endless 使用也很简单：

> 注意：**Windows 下没有 SIGUSR1、SIGUSR2 等信号，以下代码无法再 Windows 环境运行**。

```go
func main() {
	// mux demo
	// r := mux.NewRouter()
	// r.HandleFunc("/", func(writer http.ResponseWriter, request *http.Request) {
	// 	time.Sleep(5 * time.Second)
	// 	_, _ = writer.Write([]byte("mux ok"))
	// }).Methods("GET")

	// gin demo
	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		time.Sleep(5 * time.Second)
		c.String(http.StatusOK, "gin ok")
	})
	// 默认endless服务会监听下列信号：
	// syscall.SIGHUP，syscall.SIGUSR1，syscall.SIGUSR2，syscall.SIGINT，syscall.SIGTERM和syscall.SIGTSTP
	// 接收到 SIGHUP 信号将触发`fork/restart` 实现优雅重启（kill -1 pid会发送SIGHUP信号）
	// 接收到 syscall.SIGINT或syscall.SIGTERM 信号将触发优雅关机
	// 接收到 SIGUSR2 信号将触发HammerTime
	// SIGUSR1 和 SIGTSTP 被用来触发一些用户自定义的hook函数
	if err := endless.ListenAndServe(":8080", r); err != nil {
		log.Fatalf("listen: %s\n", err)
	}

	log.Println("Server exiting")
}
```

如何验证优雅重启的效果呢？

我们通过执行`kill -1 pid`命令发送`syscall.SIGINT`来通知程序优雅重启，具体做法如下：

* 1）打开终端，`go build -o graceful_restart`编译并执行`./graceful_restart`,终端输出当前PID(当前为2235)

* 2）将代码中处理请求函数返回的`gin ok`修改为`gin ok2`，再次编译`go build -o graceful_restart`

* 3）打开浏览器，访问`localhost:8080/`，此时浏览器白屏等待服务端返回响应。

* 4）在终端**迅速**执行`kill -1 2235`命令给程序发送`syscall.SIGHUP`信号

* 5）等第3步浏览器收到响应信息`gin ok`后再次访问`localhost:8080/`会收到`gin ok2`的响应。

* 6）在不影响当前未处理完请求的同时完成了程序代码的替换，实现了优雅重启。

最终endless的整个执行过程如其日志：

```shell
$ ./graceful_restart
[GIN-debug] [WARNING] Creating an Engine instance with the Logger and Recovery middleware already attached.

[GIN-debug] [WARNING] Running in "debug" mode. Switch to "release" mode in production.
 - using env:   export GIN_MODE=release
 - using code:  gin.SetMode(gin.ReleaseMode)

[GIN-debug] GET    /                         --> main.main.func1 (3 handlers)
2022/02/08 13:57:36 Actual pid is 3684
# 这里主进程收到 SIGHUP 信号开始 fork子进程
2022/02/08 13:57:55 3684 Received SIGHUP. forking.
[GIN-debug] [WARNING] Creating an Engine instance with the Logger and Recovery middleware already attached.

[GIN-debug] [WARNING] Running in "debug" mode. Switch to "release" mode in production.
 - using env:   export GIN_MODE=release
 - using code:  gin.SetMode(gin.ReleaseMode)
# 子进程启动成功
[GIN-debug] GET    /                         --> main.main.func1 (3 handlers)
2022/02/08 13:57:55 Actual pid is 3774
# 然后子进程给主进程发送了SIGTERM，主进程进入优雅关机流程
2022/02/08 13:57:55 3684 Received SIGTERM.
2022/02/08 13:57:55 3684 Waiting for connections to finish...
2022/02/08 13:57:55 3684 Serve() returning...
# 同时子进程复用 socket，新的用户请求进入到新程序
2022/02/08 13:57:55 listen: accept tcp [::]:8080: use of closed network connection
 [GIN] 2022/02/08 - 13:58:12 | 200 |    5.0059205s |             ::1 | GET      "/"
```

在执行`kill -1 xxx`前后分别发起的请求都正常的返回了，优雅重启完成。





但是需要注意的是，此时程序的 PID 变化了，因为`endless` 是通过`fork`子进程处理新请求，待原进程处理完当前请求后再退出的方式实现优雅重启的。

所以当你的项目是使用类似`supervisor`的软件管理进程时就**不适用**这种方式了。

> 此时用 http.Server 提供的优雅关机即可。



### endless 源码分析

首先是在 ListenAndServe 时启动了一个后台 goroutine 用于监听信号。

```go
func (srv *endlessServer) ListenAndServe() (err error) {
    ...
	go srv.handleSignals()
	l, err := srv.getListener(addr)
	if err != nil {
		log.Println(err)
		return
	}
	srv.EndlessListener = newEndlessListener(l, srv)
    // 如果当前是子进程，则给父进程发出中断信号
    // fork 出子进程后，父进程就可以走优雅关机流程了
	if srv.isChild {
	}
	...
	return srv.Serve()	//为socket提供新的服务
}

```



#### socket 复用

前面提到复用socket是endless的核心，必须在Serve前准备好，否则会导致端口已使用的异常。复用socket的实现在上面的getListener方法中：

```go
func (srv *endlessServer) getListener(laddr string) (l net.Listener, err error) {
	if srv.isChild {//如果此方法运行在子进程中，则复用socket
		var ptrOffset uint = 0
		runningServerReg.RLock()
		defer runningServerReg.RUnlock()
		if len(socketPtrOffsetMap) > 0 {
			ptrOffset = socketPtrOffsetMap[laddr]//获取和addr相对应的socket的位置
		}

		f := os.NewFile(uintptr(3+ptrOffset), "")//创建socket文件描述符
		l, err = net.FileListener(f)//创建socket文件监听器
		if err != nil {
			err = fmt.Errorf("net.FileListener error: %v", err)
			return
		}
	} else {//如果此方法不是运行在子进程中，则新建一个socket
		l, err = net.Listen("tcp", laddr)
		if err != nil {
			err = fmt.Errorf("net.Listen error: %v", err)
			return
		}
	}
	return
}
```



#### 信号监听

后台信号监听逻辑具体如下：

```go
func (srv *endlessServer) handleSignals() {
	var sig os.Signal

	signal.Notify(
		srv.sigChan,
		hookableSignals...,
	)

	pid := syscall.Getpid()
	for {
		sig = <-srv.sigChan
		srv.signalHooks(PRE_SIGNAL, sig)
		switch sig {
		case syscall.SIGHUP:
            // 收到 SIGHUP 信号时调用了 fork 方法，开启子进程。
			log.Println(pid, "Received SIGHUP. forking.")
			err := srv.fork()
			if err != nil {
				log.Println("Fork err:", err)
			}
		case syscall.SIGUSR1:
			log.Println(pid, "Received SIGUSR1.")
		case syscall.SIGUSR2:
			log.Println(pid, "Received SIGUSR2.")
			srv.hammerTime(0 * time.Second)
		case syscall.SIGINT:
			log.Println(pid, "Received SIGINT.")
			srv.shutdown()
		case syscall.SIGTERM:
			log.Println(pid, "Received SIGTERM.")
			srv.shutdown()
		case syscall.SIGTSTP:
			log.Println(pid, "Received SIGTSTP.")
		default:
			log.Printf("Received %v: nothing i care about...\n", sig)
		}
		srv.signalHooks(POST_SIGNAL, sig)
	}
}
```

收到 SIGHUP 信号时会调用 fork 方法开启子进程，具体如下：

```go
func (srv *endlessServer) fork() (err error) {
	...
	path := os.Args[0]	//获取当前程序的路径，在子进程执行。所以要保证新编译的程序路径和旧程序的一致。
	var args []string
	if len(os.Args) > 1 {
		args = os.Args[1:]
	}

	cmd := exec.Command(path, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.ExtraFiles = files	//socket在此处传给子进程，windows系统不支持获取socket文件，所以endless无法在windows上用。windows获取socket文件时报错：file tcp [::]:9999: not supported by windows。
	cmd.Env = env	//env有一个ENDLESS_SOCKET_ORDER变量存储了socket传递的顺序（如果有多个socket）
	...

	err = cmd.Start()	//运行新程序
	if err != nil {
		log.Fatalf("Restart: Failed to launch, error: %v", err)
	}

	return
}
```





## 4. 小结

无守护进程则推荐使用 endless，有守护进程则使用  http.Server.Shutdown 即可。

**无论是优雅关机还是优雅重启归根结底都是通过监听特定系统信号，然后执行一定的逻辑处理保障当前系统正在处理的请求被正常处理后再关闭当前进程。**

具体实现都比较简单，使用优雅关机还是使用优雅重启以及怎么实现，都可以根据项目实际情况来决定了。

**优雅关机**：

* 1）接收到关机信号时，停止接收新请求
* 2）处理完系统中的剩余请求后退出
* 3）设置超时时间，超时后不再等待，直接退出，防止一直阻塞在步骤2无法退出的情况

**优雅重启**：

* 1）接收到重启信号时 fork 出子进程运行新的程序
* 2）该子进程接收从父进程传来的相关文件描述符，直接复用socket，同时父进程关闭socket
  * 将新流量全部由新进程来处理
  * 父进程不再接收流量
* 3）父进程把当前系统中的请求处理完成后退出



## 5. 参考

[http.Server.Shutdown](https://go.dev/pkg/net/http/#Server.Shutdown)

[endless](https://github.com/fvbock/endless)

[Graceful Restart in Golang](https://grisha.org/blog/2014/06/03/graceful-restart-in-golang/)

[优雅重启或停止](https://www.kancloud.cn/shuangdeyu/gin_book/949445)

[Gin框架优雅关机和重启](https://juejin.cn/post/7015911395413721118)

[如何优雅地重启go程序--endless篇](https://blog.csdn.net/tomatomas/article/details/94839857)