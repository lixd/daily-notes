# Jaeger

```json
https://github.com/xinliangnote/go-gin-api //gin框架接入

https://juejin.im/post/6844903942309019661#heading-10 // demo
https://studygolang.com/articles/28685?fr=sidebar  // demo2
```



## 1. 部署

Jaeger 官方提供了 all-in-one 的 docker 镜像，可以基于此进行一键部署。

### Docker

docker 命令如下：

```go
$ docker run -d --name jaeger \
  -e COLLECTOR_ZIPKIN_HTTP_PORT=9411 \
  -p 5775:5775/udp \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 5778:5778 \
  -p 16686:16686 \
  -p 14268:14268 \
  -p 14250:14250 \
  -p 9411:9411 \
  jaegertracing/all-in-one:1.20
```



### Docker Compose

也可以使用 docker compose 来启动

```go
version: '3.1'
services:
  db:
    image: jaegertracing/all-in-one
    restart: always
    environment:
      COLLECTOR_ZIPKIN_HTTP_PORT: 9411
    ports:
      - 5775:5775/udp
      - 6831:6831/udp
      - 6832:6832/udp
      - 5778:5778
      - 16686:16686
      - 14268:14268
      - 9411:9411
```



### binary

甚至还可以通过下载二进制文件直接运行。

下载地址

```http
https://www.jaegertracing.io/download/#binaries
```

启动参数

```shell
$ jaeger-all-in-one --collector.zipkin.http-port=9411
```

### Port

Jaeger 用到的端口及其作用如下表：

| Port  | Protocol | Component | Function                                                     |
| ----- | -------- | --------- | ------------------------------------------------------------ |
| 5775  | UDP      | agent     | accept `zipkin.thrift` over compact thrift protocol (deprecated, used by legacy clients only) |
| 6831  | UDP      | agent     | accept `jaeger.thrift` over compact thrift protocol          |
| 6832  | UDP      | agent     | accept `jaeger.thrift` over binary thrift protocol           |
| 5778  | HTTP     | agent     | serve configs                                                |
| 16686 | HTTP     | query     | serve frontend                                               |
| 14268 | HTTP     | collector | accept `jaeger.thrift` directly from clients                 |
| 14250 | HTTP     | collector | accept `model.proto`                                         |
| 9411  | HTTP     | collector | Zipkin compatible endpoint (optional)                        |

### UI 界面

启动之后就可以在`http://localhost:16686`看到 Jaeger 的 UI 界面了。



## 2. Hello World

### 1. 说明

大致步骤如下：

* 1）初始化一个 tracer
* 2）记录一个简单的 span
* 3）在span上添加注释信息

### 2. 例子

```go
func main() {
	// 解析命令行参数
	if len(os.Args) != 2 {
		panic("ERROR: Expecting one argument")
	}

	// 1.初始化 tracer
	tracer, closer := config.NewTracer("hello")
	defer closer.Close()

	// 2.开始新的 Span （注意:必须要调用 Finish()方法span才会上传到后端）
	span := tracer.StartSpan("say-hello")
	defer span.Finish()

    helloTo := os.Args[1]
	helloStr := fmt.Sprintf("Hello, %s!", helloTo)
	// 3.通过tag、log记录注释信息
	// LogFields 和 LogKV底层是调用的同一个方法
	span.SetTag("hello-to", helloTo)
	span.LogFields(
		log.String("event", "string-format"),
		log.String("value", helloStr),
	)
	span.LogKV("event", "println")
	println(helloStr)
}
```



```go
func NewTracer(service string) (opentracing.Tracer, io.Closer) {
	// 参数详解 https://www.jaegertracing.io/docs/1.20/sampling/
	cfg := jaegerConfig.Configuration{
		ServiceName: service,
		// 采样配置
		Sampler: &jaegerConfig.SamplerConfig{
			Type:  jaeger.SamplerTypeConst,
			Param: 1,
		},
		Reporter: &jaegerConfig.ReporterConfig{
			LogSpans:          true,
			CollectorEndpoint: http://localhost:14268/api/traces, // 将span发往jaeger-collector的服务地址
		},
	}
	tracer, closer, err := cfg.NewTracer(jaegerConfig.Logger(jaeger.StdLogger))
	if err != nil {
		panic(fmt.Sprintf("ERROR: cannot init Jaeger: %v\n", err))
	}
	opentracing.SetGlobalTracer(tracer)
	return tracer, closer
}
```



运行上述例子后就可以在 Jaeger UI 界面看到对应的链路信息了。

```shell
go run hello.go xiaoming
```



## 3. 使用 ctx 包装 tracer

### 1. 说明

* 1）通过`opentracing.ChildOf(rootSpan.Context())`保留span之间的因果关系。

* 2）通过ctx来实现在各个功能函数知之间传递span。

### 2. span 因果关系

span 是链路追踪里的最小组成单元，为了保留各个功能之间的因果关系，必须在各个方法之间传递 span 并且新建span时指定`opentracing.ChildOf(rootSpan.Context())`,否则新建的span会是独立的，无法构成一个完整的 trace。

比如方法A调用了B、C、D，那么就需要将方法A中的span传递到方法BCD中。

```go
	childSpan := rootSpan.Tracer().StartSpan(
		"formatString",
		opentracing.ChildOf(rootSpan.Context()),
	)
```

通过`opentracing.ChildOf(rootSpan.Context())`建立两个span之间的引用关系，如果不指定则会创建一个新的span（UI中查看的时候就是一个新的 trace）。



将前面的例子稍微修改一下，将formatString和printHello提成单独的方法，并新增span参数。

```go
func main() {
	// 解析命令行参数
	if len(os.Args) != 2 {
		panic("ERROR: Expecting one argument")
	}

	// 1.初始化 tracer
	tracer, closer := config.NewTracer("hello")
	defer closer.Close()
	// 2.开始新的 Span （注意:必须要调用 Finish()方法span才会上传到后端）
	span := tracer.StartSpan("say-hello")
	defer span.Finish()

	helloTo := os.Args[1]
	helloStr := formatString(span, helloTo)
	printHello(span, helloStr)
}

func formatString(span opentracing.Span, helloTo string) string {
	childSpan := span.Tracer().StartSpan(
		"formatString",
		opentracing.ChildOf(span.Context()),
	)
	defer childSpan.Finish()

	return fmt.Sprintf("Hello, %s!", helloTo)
}

func printHello(span opentracing.Span, helloStr string) {
	childSpan := span.Tracer().StartSpan(
		"printHello",
		opentracing.ChildOf(span.Context()),
	)
	defer childSpan.Finish()

	println(helloStr)
}

```



运行之后可以清楚的在 UI 界面中看到`say-hello`由`formatString`和`printHello`两个功能组成。

```shell
go run hello.go xiaoming
```



### 3. 通过 ctx 传递 span

前面虽然保留的 span 的因果关系，但是需要在各个方法中传递 span。这可能会污染整个程序，我们可以借助 Go 语言中的 `context.Context`对象来进行传递。

实例代码如下：

```go
ctx := context.Background()
ctx = opentracing.ContextWithSpan(ctx, span)
```

```go
helloStr := formatString(ctx, helloTo)
printHello(ctx, helloStr)
```

```go
func formatString(ctx context.Context, helloTo string) string {
    span, _ := opentracing.StartSpanFromContext(ctx, "formatString")
    defer span.Finish()
    ...

func printHello(ctx context.Context, helloStr string) {
    span, _ := opentracing.StartSpanFromContext(ctx, "printHello")
    defer span.Finish()
    ...
```

`opentracing.StartSpanFromContext()`返回的第二个参数是`子ctx`,如果需要的话可以将该子ctx继续往下传递，而不是传递父ctx。

需要注意的是`opentracing.StartSpanFromContext()`默认使用`GlobalTracer`来开始一个新的 span，所以使用之前需要设置 GlobalTracer。

```go
opentracing.SetGlobalTracer(tracer)
```



## 4. 追踪 rpc

### 1. 说明

通过`Inject(spanContext, format, carrier)` and `Extract(format, carrier)`来实现在RPC调用中传递上下文。

format 则为编码方式，由OpenTracing API定义，具体如下：

* 1）TextMap--span上下文被编码为字符串键-值对的集合
* 2）Binary--span上下文被编码为字节数组
* 3）HTTPHeaders--span上下文被作为 HTTPHeader 

carrier 则是底层实现的抽象：比如 TextMap 的实现则是一个包含 Set(key, value) 函数的接口。Binary 则是 io.Writer接口。

### 2. 例子

一个追踪 http 请求的demo。

**Inject**

客户端通过 Inject方法将span注入到req.Header中去，随着请求发送到服务端。

```go
//  "github.com/opentracing/opentracing-go/ext"
ext.SpanKindRPCClient.Set(span)
ext.HTTPUrl.Set(span, url)
ext.HTTPMethod.Set(span, "GET")
span.Tracer().Inject(
    span.Context(),
    opentracing.HTTPHeaders,
    opentracing.HTTPHeadersCarrier(req.Header),
)
```



```go
func formatString(ctx context.Context, helloTo string) string {
	span, _ := opentracing.StartSpanFromContext(ctx, "formatString")
	defer span.Finish()

	client := http.Client{}
	v := url.Values{}
	v.Set("helloTo", helloTo)
	url := "http://localhost:8081/format?" + v.Encode()
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		panic(err.Error())
	}

	ext.SpanKindRPCClient.Set(span)
	ext.HTTPUrl.Set(span, url)
	ext.HTTPMethod.Set(span, "GET")
	span.Tracer().Inject(
		span.Context(),
		opentracing.HTTPHeaders,
		opentracing.HTTPHeadersCarrier(req.Header),
	)

	resp, err := client.Do(req)
	if err != nil {
		ext.LogError(span, err)
		panic(err.Error())
	}
	all, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		ext.LogError(span, err)
		panic(err.Error())
	}
	defer resp.Body.Close()
	helloStr := string(all)

	span.LogFields(
		log.String("event", "string-format"),
		log.String("value", helloStr),
	)

	return helloStr
}
```



### Extract

服务端则通过Extract方法，解析请求头中的 span信息。

```go
		spanCtx, _ := tracer.Extract(opentracing.HTTPHeaders, opentracing.HTTPHeadersCarrier(r.Header))
		span := tracer.StartSpan("format", ext.RPCServerOption(spanCtx))
		defer span.Finish()
```



```go
func main() {
	tracer, closer := config.NewTracer("formatter")
	defer closer.Close()

	http.HandleFunc("/format", func(w http.ResponseWriter, r *http.Request) {
		spanCtx, _ := tracer.Extract(opentracing.HTTPHeaders, opentracing.HTTPHeadersCarrier(r.Header))
		span := tracer.StartSpan("format", ext.RPCServerOption(spanCtx))
		defer span.Finish()

		helloTo := r.FormValue("helloTo")
		helloStr := fmt.Sprintf("Hello, %s!", helloTo)
		span.LogFields(
			otlog.String("event", "string-format"),
			otlog.String("value", helloStr),
		)
		w.Write([]byte(helloStr))
	})

	log.Fatal(http.ListenAndServe(":8081", nil))
}
```



## 5. Baggage

### 1. 说明

我们可以在 span 中存储参数，然后该参数会跟着 span 传递到整个 trace。

> 这样的好处在于我们只需要修改一个地方就可以在整个trace中获取到该参数，而不用修改trace中的每一个地方。
>
> 但是也不要方太多数据进去，否则后续每次请求都会增加额外的开销。

### 2. 例子

客户端存入参数

```go
// after starting the span
span.SetBaggageItem("greeting", greeting)
```



服务端获取

```go
greeting := span.BaggageItem("greeting")
```

