# Opentracing



## 1. 概述

在微服务架构的系统中，请求在各服务之间流转，调用链错综复杂，一旦出现了问题和异常，很难追查定位，这个时候就需要链路追踪来帮忙了。链路追踪系统能追踪并记录请求在系统中的调用顺序，调用时间等一系列关键信息，从而帮助我们定位异常服务和发现性能瓶颈。



## 2. Opentracing

Opentracing 是分布式链路追踪的一种规范标准，是 CNCF（云原生计算基金会）下的项目之一。和一般的规范标准不同，Opentracing 不是传输协议，消息格式层面上的规范标准，而是一种语言层面上的 `API 标准`。以 Go 语言为例，只要某链路追踪系统实现了 Opentracing 规定的接口（interface），符合Opentracing 定义的表现行为，那么就可以说该应用符合 Opentracing 标准。这意味着开发者只需修改少量的配置代码，就可以在符合 Opentracing 标准的链路追踪系统之间自由切换。

> [opentracing-go](https://github.com/opentracing/opentracing-go)



## 3. Data Model

在使用 Opentracing 来实现全链路追踪前，有必要先了解一下它所定义的数据模型。

### Span

Span 是一条追踪链路中的基本组成要素，一个 Span 表示一个独立的工作单元，比如可以表示一次函数调用，一次 HTTP 请求等等。Span 会记录如下基本要素:

- 服务名称(operation name)
- 服务的开始时间和结束时间
- K/V形式的**Tags**
- K/V形式的**Logs**
- **SpanContext**
- **References**：该span对一个或多个span的引用（通过引用SpanContext）

**Tags**

Tags以K/V键值对的形式保存用户自定义标签，主要用于链路追踪结果的查询过滤。例如： `http.method="GET",http.status_code=200`。其中key值必须为字符串，value必须是字符串，布尔型或者数值型。**Span 中的 tag 仅自己可见，不会随着 SpanContext 传递给后续 Span。** 例如：

```go
span.SetTag("http.method","GET")
span.SetTag("http.status_code",200)
```

**Logs**

Logs 与 tags 类似，也是 K/V 键值对形式。与 tags 不同的是，**logs 还会记录写入 logs 的时间，因此 logs 主要用于记录某些事件发生的时间**。logs 的 key 值同样必须为字符串，但对 value 类型则没有限制。例如：

```go
span.LogFields(
	log.String("event", "soft error"),
	log.String("type", "cache timeout"),
	log.Int("waited.millis", 1500),
)
```

> Opentracing列举了一些惯用的Tags和Logs： [semantic_conventions](https://github.com/opentracing/specification/blob/master/semantic_conventions.md)

**SpanContext**

SpanContext携带着一些用于跨服务通信的（跨进程）数据，主要包含：

- 足够在系统中标识该span的信息，比如：`span_id,trace_id`。
- **Baggage Items**，为整条追踪连保存跨服务（跨进程）的K/V格式的用户自定义数据。

**Baggage Items**

Baggage Items 与 tags 类似，也是 K/V键值对。与 tags 不同的是：

- 其 key 跟 value 都只能是字符串格式
- Baggage items 不仅当前 span 可见，**其会随着 SpanContext 传递给后续所有的子 span**。要小心谨慎的使用baggage items——因为在所有的span中传递这些K,V会带来不小的网络和CPU开销。

### References

Opentracing 定义了两种引用关系:`ChildOf`和`FollowFrom`。

* 1）**ChildOf**: **父span的执行`依赖`子span的执行结果**时，此时子span对父span的引用关系是`ChildOf`。比如对于一次RPC调用，服务端的span（子span）与客户端调用的span（父span）是`ChildOf`关系。

* 2）**FollowFrom**：**父span的执`不依赖`子span执行结果**时，此时子span对父span的引用关系是`FollowFrom`。`FollowFrom`常用于异步调用的表示，例如消息队列中`consumer`span与`producer`span之间的关系。

### Trace

Trace表示一次完整的追踪链路，trace由一个或多个span组成。下图示例表示了一个由8个span组成的trace:

```go
        [Span A]  ←←←(the root span)
            |
     +------+------+
     |             |
 [Span B]      [Span C] ←←←(Span C is a `ChildOf` Span A)
     |             |
 [Span D]      +---+-------+
               |           |
           [Span E]    [Span F] >>> [Span G] >>> [Span H]
                                       ↑
                                       ↑
                                       ↑
                         (Span G `FollowsFrom` Span F)

```

时间轴的展现方式会更容易理解：

```go
––|–––––––|–––––––|–––––––|–––––––|–––––––|–––––––|–––––––|–> time

 [Span A···················································]
   [Span B··············································]
      [Span D··········································]
    [Span C········································]
         [Span E·······]        [Span F··] [Span G··] [Span H··]

```

> 示例来源：[the-opentracing-data-model](https://github.com/opentracing/specification/blob/master/specification.md#the-opentracing-data-model)



### Inject/Extract

为了实现分布式系统中的链路追踪，Opentracing 提供了 Inject/Extract 用于在请求中注入 SpanContext 或者从请求中提取出 SpanContext。

> 客户端通过 Inject 将 SpanContext 注入到载体中，随着请求一起发送到服务端。
>
> 服务端则通过 Extract 将 SpanContext 提取出来,进行后续处理。

## 参考

https://juejin.im/post/6844903942309019661



```shell
https://github.com/opentracing/specification/blob/master/specification.md
https://github.com/opentracing/specification/blob/master/semantic_conventions.md
https://github.com/yurishkuro/opentracing-tutorial/tree/master/go
https://opentracing.io/docs/overview/
```

