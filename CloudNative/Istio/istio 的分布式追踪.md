# Istio 分布式追踪

Isito 中的分布式追踪，Istio 虽然在此过程中完成了大部分工作，但**还是要求对应用代码进行少量修改**：

应用代码中需要将收到的上游 HTTP 请求中的 [b3 HTTP header](https://www.servicemesher.com/istio-handbook/GLOSSARY.html#b3-http-header) 拷贝到其向下游发起的 HTTP 请求的 header 中，以将调用跟踪上下文传递到下游服务。

**原因是 Sidecar 并不清楚其代理的服务中的业务逻辑，无法将入向请求和出向请求按照业务逻辑进行关联**。

> 问题就是不知道入请求进来后对应的是哪个出请求，导致无法关联。



 Envoy 会对流量做如下的操作:

- Inbound 流量：对于经过 Sidecar 流入应用程序的流量，如果经过 Sidecar 时 Header 中没有任何跟踪相关的信息，则会在创建一个根 Span，TraceId 就是这个 SpanId，然后再将请求传递给业务容器的服务；如果请求中包含 Trace 相关的信息，则 Sidecar 从中提取 Trace 的上下文信息并发给应用程序。
- Outbound 流量：对于经过 Sidecar 流出的流量，如果经过 Sidecar 时 Header 中没有任何跟踪相关的信息，则会创建根 Span，并将该跟 Span 相关上下文信息放在请求头中传递给下一个调用的服务；当存在 Trace 信息时，Sidecar 从 Header 中提取 Span 相关信息，并基于这个 Span 创建子 Span，并将新的 Span 信息加在请求头中传递

总结就是: **每一次的调用, istio都会将请求中的header进行解析, 看header中是否包含上面声明的变量,如果不存在, 则创建一个root span, 如果存在, 则将spanid做为自己的parentid,如果还有调用, 则依次这样传递下去**



所以业务系统中需要将请求头带着走，不然每次 Envoy 都会创建一个新的 root span。

> 即：**每个服务中只需要提取调用方传来的 header 并传给下一个服务即可**。
>
> span 的创建和信息上报等工作由 Istio 完成。



好在由 [opentracing](https://github.com/opentracing/opentracing-go) 库的存在，这部分工作也比较简单。