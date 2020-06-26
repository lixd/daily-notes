# gRPC源码分析



## 1. Server

```go
func main() {
	// RPC
	// 监听
	lis, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()
	// 注册 server
	proto.RegisterHelloServer(s, &helloServer{})
	if err := s.Serve(lis); err != nil {
		panic(err)
	}
}
```

### 1. Serve方法

通过调用` s.Serve()`方法开启服务。

Server方法如下:

```go
func (s *Server) Serve(lis net.Listener) error {
    // 省略、、、
    
    	for {
		rawConn, err := lis.Accept()
		if err != nil {
			if ne, ok := err.(interface {
				Temporary() bool
			}); ok && ne.Temporary() {
				if tempDelay == 0 {
					tempDelay = 5 * time.Millisecond
				} else {
					tempDelay *= 2
				}
				if max := 1 * time.Second; tempDelay > max {
					tempDelay = max
				}
				s.mu.Lock()
				s.printf("Accept error: %v; retrying in %v", err, tempDelay)
				s.mu.Unlock()
				timer := time.NewTimer(tempDelay)
				select {
				case <-timer.C:
				case <-s.quit.Done():
					timer.Stop()
					return nil
				}
				continue
			}
			s.mu.Lock()
			s.printf("done serving; Accept = %v", err)
			s.mu.Unlock()

			if s.quit.HasFired() {
				return nil
			}
			return err
		}
		tempDelay = 0
		//重新启动一个goroutine处理accept的连接
		s.serveWG.Add(1)
		go func() {
			s.handleRawConn(rawConn)
			s.serveWG.Done()
		}()
	}
}
```

关键处理就是一个for循环。如果Accept() 返回错误，并且错误是临时性的，那么会有重试，重试时间以5ms翻倍增长，直到1s。

### 2. handleRawConn方法

主要作用就是获取一个服务端的Transport，并开一个goroutine等待处理stream，里面会涉及到调用注册的方法。

```go
func (s *Server) handleRawConn(rawConn net.Conn) {
	if s.quit.HasFired() {
		rawConn.Close()
		return
	}
	rawConn.SetDeadline(time.Now().Add(s.opts.connectionTimeout))
	conn, authInfo, err := s.useTransportAuthenticator(rawConn)
	if err != nil {
		if err != credentials.ErrConnDispatched {
			s.mu.Lock()
			s.errorf("ServerHandshake(%q) failed: %v", rawConn.RemoteAddr(), err)
			s.mu.Unlock()
			grpclog.Warningf("grpc: Server.Serve failed to complete security handshake from %q: %v", rawConn.RemoteAddr(), err)
			rawConn.Close()
		}
		rawConn.SetDeadline(time.Time{})
		return
	}

	// Finish handshaking (HTTP2)
	st := s.newHTTP2Transport(conn, authInfo)
	if st == nil {
		return
	}

	rawConn.SetDeadline(time.Time{})
	if !s.addConn(st) {
		return
	}
	go func() {
		s.serveStreams(st)
		s.removeConn(st)
	}()
}
```



## 2. Client

建立连接并初始化client

```go
func main() {
   // 开启一个链接
   conn, err := grpc.Dial(address, grpc.WithInsecure(), grpc.WithBlock())
   if err != nil {
      panic(err)
   }
   defer conn.Close()
   // 用conn new一个client
   c := proto.NewHelloClient(conn)
   // 用client 调用方法
   r, err := c.SayHello(context.Background(), &proto.HelloReq{Name: defaultName})
   if err != nil {
      log.Fatalf("could not greet: %v", err)
   }
   log.Printf("Greeting: %s", r.Message)
}
```



### 1. 具体方法实现



```go
// 原始方法
func (c *helloClient) SayHello(ctx context.Context, in *HelloReq, opts ...grpc.CallOption) (*HelloRep, error) {
	out := new(HelloRep)
	err := c.cc.Invoke(ctx, "/helloworld.Hello/SayHello", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}
```

重点是`invoke`方法

### 2. Invoke函数

```go
// Invoke
func (cc *ClientConn) Invoke(ctx context.Context, method string, args, reply interface{}, opts ...CallOption) error {
	opts = combine(cc.dopts.callOptions, opts)

	if cc.dopts.unaryInt != nil {
		return cc.dopts.unaryInt(ctx, method, args, reply, cc, invoke, opts...)
	}
	return invoke(ctx, method, args, reply, cc, opts...)
}
// Invoke最终实现
func invoke(ctx context.Context, method string, req, reply interface{}, cc *ClientConn, opts ...CallOption) error {
	cs, err := newClientStream(ctx, unaryStreamDesc, cc, method, opts...)
	if err != nil {
		return err
	}
	if err := cs.SendMsg(req); err != nil {
		return err
	}
	return cs.RecvMsg(reply)
}

```



* newClientStream：获取传输层 Trasport 并组合封装到 ClientStream 中返回，在这块会涉及负载均衡、超时控制、 Encoding、 Stream 的动作，与服务端基本一致的行为。
* cs.SendMsg：发送 RPC 请求出去，但其并不承担等待响应的功能。
* cs.RecvMsg：阻塞等待接受到的 RPC 方法响应结果。



## 3. 参考

`https://www.cnblogs.com/sunsky303/p/11119300.html`

`https://www.cnblogs.com/awesomeHai/p/liuhai.html`