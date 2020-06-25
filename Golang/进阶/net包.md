# 1. HTTPServer demo

```go
package main

import (
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello World"))
	})
	if err := http.ListenAndServe(":8000", nil); err != nil {
		fmt.Println("start http server fail:", err)
	}
}

```

可以看到几行代码就启动了一个http服务,那么net包内部是怎么实现的呢？
既然原生net包这么强大了 为什么还会出现这么多的web框架?
在这之前先简单分析一下这个demo。

### 1. 注册路由

首先第一部分代码，即http.HandleFunc()方法

这里主要是讲自定义的方法存到路由表中。

```go

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello World"))
	})
```



跟着源码一路点进来

最后大概是这样的

```go
func (mux *ServeMux) Handle(pattern string, handler Handler) {
	mux.mu.Lock()
	defer mux.mu.Unlock()

	if pattern == "" {
		panic("http: invalid pattern")
	}
	if handler == nil {
		panic("http: nil handler")
	}
	if _, exist := mux.m[pattern]; exist {
		panic("http: multiple registrations for " + pattern)
	}

	if mux.m == nil {
		mux.m = make(map[string]muxEntry)
	}
	e := muxEntry{h: handler, pattern: pattern}
	mux.m[pattern] = e
	if pattern[len(pattern)-1] == '/' {
		mux.es = appendSorted(mux.es, e)
	}

	if pattern[0] != '/' {
		mux.hosts = true
	}
}
```

首先是加锁 然后用defer来释放锁。

接着检查一下参数是否正确。

`pattern`即访问路径不能为空

`handler`即处理方法也不能为空

然后遍历map检查是否存在同名的pattern，有重复的就直接`panic`

接着数组为nil即第一次添加 则make一下

然后将`pattern`和`handler`组装成`muxEntry`

存到map中，`key`为`pattern`,`value`为`handler`这个map就是路由表。

别以为到这里就结束了 后面还有一点

```go
	if pattern[len(pattern)-1] == '/' {
		mux.es = appendSorted(mux.es, e)
	}

	if pattern[0] != '/' {
		mux.hosts = true
	}
```

如果我们传进去的访问路径即`pattern`是以`/`结尾的还会执行`appendSorted()`这个方法 具体如下

```go
func appendSorted(es []muxEntry, e muxEntry) []muxEntry {
	n := len(es)
	i := sort.Search(n, func(i int) bool {
		return len(es[i].pattern) < len(e.pattern)
	})
	if i == n {
		return append(es, e)
	}
	// we now know that i points at where we want to insert
	es = append(es, muxEntry{}) // try to grow the slice in place, any entry works.
	copy(es[i+1:], es[i:])      // Move shorter entries down
	es[i] = e
	return es
}
```

大概就是按照`pattern`长度从长到短存放的，所以需要先找一找当前这个`muxEntry`存放的地方



然后让我们看一下路由表的结构

```go
type ServeMux struct {
	mu    sync.RWMutex
	m     map[string]muxEntry
	es    []muxEntry // slice of entries sorted from longest to shortest.
	hosts bool       // whether any patterns contain hostnames
}
```

可以看到不光是只有`m`即前面存`pattern`

和`handler`的map 还有其他的

其中`mu`是一个读写锁 这个就不说了

这里用到的`es`是一个`muxEntry`切片

根据后面注释可以知道这个切片是按照`pattern`长度从长到短进行排列的。同时根据当前这部分代码我们还可以知道这个切片只存了以`/`结尾的`pattern`

具体有什么用后面再说，在跳回`Handle`方法

还有最后一点

```go
	if pattern[0] != '/' {
		mux.hosts = true
	}
```

如果`pattern`不是以`/`开头 就把`mux.hosts`设置为true

这个要和后面的`pattern`匹配一起看了

大概是这样的

```go
	if mux.hosts {
		h, pattern = mux.match(host + path)
	}
	if h == nil {
		h, pattern = mux.match(path)
	}
```

如果为`true`就会带上主机名去匹配，否则只按路径匹配。

大概就是这个`pattern`有两种类型 一种是以`/`开头的正常

一种以主机名开头的 这种开头就不是`/` 所以注册了这种主机名模式在后续匹配的时候就会带上主机名。



### 2. 启动服务

```go
	if err := http.ListenAndServe(":8000", nil); err != nil {
		fmt.Println("start http server fail:", err)
	}
```



点进去可以看到

```go
func (srv *Server) ListenAndServe() error {
	if srv.shuttingDown() {
		return ErrServerClosed
	}
	addr := srv.Addr
	if addr == "" {
		addr = ":http"
	}
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		return err
	}
	return srv.Serve(ln)
}
```

`net.Listen("tcp", addr)`根据传的`addr`即端口号开启监听

继续看`srv.Serve(ln)`

这个方法挺长的 直接看最后吧

> 监听开启之后，一旦客户端请求到底，go就开启一个协程处理请求，主要逻辑都在serve方法之中。
>
> serve方法比较长，其主要职能就是，创建一个上下文对象，然后调用Listener的Accept方法用来　获取连接数据并使用newConn方法创建连接对象。最后使用goroutein协程的方式处理连接请求。因为每一个连接都开起了一个协程，请求的上下文都不同，同时又保证了go的高并发。s



### 3. 处理请求

```go
func (srv *Server) Serve(l net.Listener) error {
 	//....
    go c.serve(ctx)
}
```

serve方法也很长

```go
func (c *conn) serve(ctx context.Context) {	
	serverHandler{c.server}.ServeHTTP(w, w.req)
}
```

> 主要是使用defer定义了函数退出时，连接关闭相关的处理。然后就是读取连接的网络数据，并处理读取完毕时候的状态。接下来就是调用`serverHandler{c.server}.ServeHTTP(w, w.req)`方法处理请求了。



```go
// http\server.go 2378行
func (mux *ServeMux) ServeHTTP(w ResponseWriter, r *Request) {
	if r.RequestURI == "*" {
		if r.ProtoAtLeast(1, 1) {
			w.Header().Set("Connection", "close")
		}
		w.WriteHeader(StatusBadRequest)
		return
	}
	h, _ := mux.Handler(r)
	h.ServeHTTP(w, r)
}
```

接着看`mux.Handler(r)`

```go
func (mux *ServeMux) Handler(r *Request) (h Handler, pattern string) {

	// CONNECT requests are not canonicalized.
	if r.Method == "CONNECT" {
		// If r.URL.Path is /tree and its handler is not registered,
		// the /tree -> /tree/ redirect applies to CONNECT requests
		// but the path canonicalization does not.
		if u, ok := mux.redirectToPathSlash(r.URL.Host, r.URL.Path, r.URL); ok {
			return RedirectHandler(u.String(), StatusMovedPermanently), u.Path
		}

		return mux.handler(r.Host, r.URL.Path)
	}

	// All other requests have any port stripped and path cleaned
	// before passing to mux.handler.
	host := stripHostPort(r.Host)
	path := cleanPath(r.URL.Path)

	// If the given path is /tree and its handler is not registered,
	// redirect for /tree/.
	if u, ok := mux.redirectToPathSlash(host, path, r.URL); ok {
		return RedirectHandler(u.String(), StatusMovedPermanently), u.Path
	}

	if path != r.URL.Path {
		_, pattern = mux.handler(host, path)
		url := *r.URL
		url.Path = path
		return RedirectHandler(url.String(), StatusMovedPermanently), pattern
	}

	return mux.handler(host, r.URL.Path)
}

```

继续看`mux.handler(host, r.URL.Path)`

```go
func (mux *ServeMux) handler(host, path string) (h Handler, pattern string) {
	mux.mu.RLock()
	defer mux.mu.RUnlock()

	// Host-specific pattern takes precedence over generic ones
	if mux.hosts {
		h, pattern = mux.match(host + path)
	}
	if h == nil {
		h, pattern = mux.match(path)
	}
	if h == nil {
		h, pattern = NotFoundHandler(), ""
	}
	return
}
```

可以看到已经到了最开始的pattern匹配了。

通过访问路径来匹配对应的`handler`

回到`ServeHTTP()`方法

```go
func (mux *ServeMux) ServeHTTP(w ResponseWriter, r *Request) {
	if r.RequestURI == "*" {
		if r.ProtoAtLeast(1, 1) {
			w.Header().Set("Connection", "close")
		}
		w.WriteHeader(StatusBadRequest)
		return
	}
	h, _ := mux.Handler(r)
	h.ServeHTTP(w, r)
}
```

最后一句`h.ServeHTTP(w, r)`

这个`h`就是我们自定义的`handler`

然后handler是个接口

```go
type Handler interface {
	ServeHTTP(ResponseWriter, *Request)
}
```

所以就是为什么自定义handler格式是固定了的。



然后在回到前面`serverHandler{c.server}.ServeHTTP(w, w.req)`方法处理请求之后

接下来就是对请求处理完毕之后上希望和连接断开的相关逻辑。

### 4. 小结

Golang通过一个ServeMux实现了的multiplexer路由多路复用器来管理路由。同时提供一个Handler接口提供ServeHTTP用来实现handler处理其函数，后者可以处理实际request并构造response。

ServeMux和handler处理器函数的连接桥梁就是Handler接口。ServeMux的ServeHTTP方法实现了寻找注册路由的handler的函数，并调用该handler的ServeHTTP方法。ServeHTTP方法就是真正处理请求和构造响应的地方。



简单说就是`ServeMux`内部通过map结构`key为访问路径，value则为一个内部对象`来存储自定义handler,当然必须实现Handler接口才行。
收到请求之后通过url匹配 在map中找到对应的handler 然后处理。





## 参考

` https://www.jianshu.com/p/be3d9cdc680b `