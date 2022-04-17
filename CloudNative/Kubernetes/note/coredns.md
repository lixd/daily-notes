# CoreDNS

> [CoreDNS篇1-CoreDNS简介和安装](https://zhuanlan.zhihu.com/p/387806561)
>
> [CoreDNS篇2-编译安装External Plugins](https://zhuanlan.zhihu.com/p/387807927)
>
> [CoreDNS篇3-接入prometheus监控](https://zhuanlan.zhihu.com/p/387809650)
>
> [CoreDNS篇4-编译安装unbound](https://zhuanlan.zhihu.com/p/389726349)
>
> [CoreDNS篇5-日志处理](https://zhuanlan.zhihu.com/p/457438192)





> [writing-plugins-for-coredns](https://coredns.io/2016/12/19/writing-plugins-for-coredns/)
>
> [compile-time-enabling-or-disabling-plugins](https://coredns.io/2017/07/25/compile-time-enabling-or-disabling-plugins/)



[CoreDNS 压测](https://www.jianshu.com/p/2fa3d78b768e)





## LoadBalance plugin

CoreDNS 中的 LoadBalance 插件主要用于做负载均衡。

具体实现如下：

```go
func (rr RoundRobin) ServeDNS(ctx context.Context, w dns.ResponseWriter, r *dns.Msg) (int, error) {
	wrr := &RoundRobinResponseWriter{w}
	return plugin.NextOrFailure(rr.Name(), rr.Next, ctx, wrr, r)
}
```

ServeDNS 方法很简单，只是对 dns.ResponseWriter 做了一个包装。

dns.ResponseWriter 是一个接口，具体如下：

```go
type ResponseWriter interface {
   // LocalAddr returns the net.Addr of the server
   LocalAddr() net.Addr
   // RemoteAddr returns the net.Addr of the client that sent the current request.
   RemoteAddr() net.Addr
   // WriteMsg writes a reply back to the client.
   WriteMsg(*Msg) error
   // Write writes a raw buffer back to the client.
   Write([]byte) (int, error)
   // Close closes the connection.
   Close() error
   // TsigStatus returns the status of the Tsig.
   TsigStatus() error
   // TsigTimersOnly sets the tsig timers only boolean.
   TsigTimersOnly(bool)
   // Hijack lets the caller take over the connection.
   // After a call to Hijack(), the DNS package will not do anything with the connection.
   Hijack()
}
```

其中的`WriteMsg`方法就是向客户端写入响应数据。

然后 LoadBalance 对这个接口包装后重写了这个方法

```go
// RoundRobinResponseWriter is a response writer that shuffles A, AAAA and MX records.
type RoundRobinResponseWriter struct{ dns.ResponseWriter }

// WriteMsg implements the dns.ResponseWriter interface.
func (r *RoundRobinResponseWriter) WriteMsg(res *dns.Msg) error {
	if res.Rcode != dns.RcodeSuccess {
		return r.ResponseWriter.WriteMsg(res)
	}

	if res.Question[0].Qtype == dns.TypeAXFR || res.Question[0].Qtype == dns.TypeIXFR {
		return r.ResponseWriter.WriteMsg(res)
	}
    // 对结果进行roundRobin负载均衡
	res.Answer = roundRobin(res.Answer)
	res.Ns = roundRobin(res.Ns)
	res.Extra = roundRobin(res.Extra)

	return r.ResponseWriter.WriteMsg(res)
}
```

因此在 LoadBalance 插件后面返回的所有结果都自带负载均衡效果。





## 插件规范

推荐从 [coredns-plugin-example](https://github.com/coredns/example) 为基础开始实现自己的插件。

1. `setup.go`和`setup_test.go`，实现从Corefile解析配置。每当 Corefile 解析器看到插件的名称时，都会调用（通常命名的）`setup`函数；在这种情况下，“示例”。
2. `example.go`（通常命名为`<plugin_name>.go`），它包含处理查询的逻辑，以及 `example_test.go`，它有基本的单元测试来检查插件是否工作。
3. `README.md`以 Unix 手册样式记录如何配置此插件的文档。
4. 许可证文件。要包含在 CoreDNS 中，这需要具有类似 APL 的许可证。