# Gin框架与gRPC接入Jaeger

## 1. Gin

通过Middleware可以追踪到最外层的Handler，更深层方法需要追踪的话可以通过ctx将span传递到各个方法去。

http 请求使用 request.Header 做载体。

```go
package middleware

import (
	"context"
	"github.com/gin-gonic/gin"
	"github.com/opentracing/opentracing-go"
	"github.com/opentracing/opentracing-go/ext"
	"i-go/apm/trace/config"
)

// Jaeger 通过 middleware 将 tracer 和 ctx 注入到 gin.Context 中
func Jaeger() gin.HandlerFunc {
	return func(c *gin.Context) {
		var parentSpan opentracing.Span
		tracer, closer := config.NewTracer("gin-demo")
		defer closer.Close()
		// 直接从 c.Request.Header 中提取 span,如果没有就新建一个
		spCtx, err := opentracing.GlobalTracer().Extract(opentracing.HTTPHeaders, opentracing.HTTPHeadersCarrier(c.Request.Header))
		if err != nil {
			parentSpan = tracer.StartSpan(c.Request.URL.Path)
			defer parentSpan.Finish()
		} else {
			parentSpan = opentracing.StartSpan(
				c.Request.URL.Path,
				opentracing.ChildOf(spCtx),
				opentracing.Tag{Key: string(ext.Component), Value: "HTTP"},
				ext.SpanKindRPCServer,
			)
			defer parentSpan.Finish()
		}
        // 然后存到 g.ctx 中 供后续使用
		c.Set("tracer", tracer)
		c.Set("ctx", opentracing.ContextWithSpan(context.Background(), parentSpan))
		c.Next()
	}
}

```

然后在 gin 中添加这个 middleware 即可。

```go
	e := gin.New()
	e.Use(middleware.Jaeger())
```

需要更细粒度的追踪，只需要将 span 传递到各个方法即可

```go
func Register(e *gin.Engine) {
	e.GET("/ping", Ping)
}

func Ping(c *gin.Context) {
	psc, _ := c.Get("ctx")
	ctx := psc.(context.Context)
	doPing1(ctx)
	doPing2(ctx)
	c.JSON(200, gin.H{"message": "pong"})
}
func doPing1(ctx context.Context) {
	span, _ := opentracing.StartSpanFromContext(ctx, "doPing1")
	defer span.Finish()
	time.Sleep(time.Second)
	fmt.Println("pong")
}
func doPing2(ctx context.Context) {
	span, _ := opentracing.StartSpanFromContext(ctx, "doPing2")
	defer span.Finish()
	time.Sleep(time.Second)
	fmt.Println("pong")
}
```





## 2. gRPC

同样通过拦截器实现。

gRPC 则使用 metadata 来做载体。

```go
// ClientInterceptor grpc client
func ClientInterceptor(tracer opentracing.Tracer) grpc.UnaryClientInterceptor {
	return func(ctx context.Context, method string, req, reply interface{}, cc *grpc.ClientConn,
		invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
		span, _ := opentracing.StartSpanFromContext(ctx,
			"call gRPC",
			opentracing.Tag{Key: string(ext.Component), Value: "gRPC"},
			ext.SpanKindRPCClient)
		defer span.Finish()

		md, ok := metadata.FromOutgoingContext(ctx)
		if !ok {
			md = metadata.New(nil)
		} else {
			md = md.Copy()
		}

		err := tracer.Inject(span.Context(), opentracing.TextMap, MDReaderWriter{md})
		if err != nil {
			span.LogFields(log.String("inject-error", err.Error()))
		}

		newCtx := metadata.NewOutgoingContext(ctx, md)
		err = invoker(newCtx, method, req, reply, cc, opts...)
		if err != nil {
			span.LogFields(log.String("call-error", err.Error()))
		}
		return err
	}
}
```



```go
func ServerInterceptor(tracer opentracing.Tracer) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (
		resp interface{}, err error) {
		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			md = metadata.New(nil)
		}
		// 服务端拦截器则是在MD中把 span提取出来
		spanContext, err := tracer.Extract(opentracing.TextMap, MDReaderWriter{md})
		if err != nil && err != opentracing.ErrSpanContextNotFound {
			fmt.Print("extract from metadata error: ", err)
		} else {
			span := tracer.StartSpan(
				info.FullMethod,
				ext.RPCServerOption(spanContext),
				opentracing.Tag{Key: string(ext.Component), Value: "gRPC"},
				ext.SpanKindRPCServer,
			)
			defer span.Finish()
			ctx = opentracing.ContextWithSpan(ctx, span)
		}
		return handler(ctx, req)
	}
}
```



MDReaderWriter 结构如下

> 为了做载体，必须要实现 `opentracing.TextMapWriter` `opentracing.TextMapReader` 这两个接口。

```go
// TextMapWriter is the Inject() carrier for the TextMap builtin format.With
// it, the caller can encode a SpanContext for propagation as entries in a map
// of unicode strings.
type TextMapWriter interface {
   Set(key, val string)
}

// TextMapReader is the Extract() carrier for the TextMap builtin format. With it,
// the caller can decode a propagated SpanContext as entries in a map of
// unicode strings.
type TextMapReader interface {
   ForeachKey(handler func(key, val string) error) error
}
```



```go
// metadata 读写
type MDReaderWriter struct {
	metadata.MD
}

// 为了 opentracing.TextMapReader ，参考 opentracing 代码
func (c MDReaderWriter) ForeachKey(handler func(key, val string) error) error {
	for k, vs := range c.MD {
		for _, v := range vs {
			if err := handler(k, v); err != nil {
				return err
			}
		}
	}
	return nil
}

// 为了 opentracing.TextMapWriter，参考 opentracing 代码
func (c MDReaderWriter) Set(key, val string) {
	key = strings.ToLower(key)
	c.MD[key] = append(c.MD[key], val)
}

```



然后建立连接或者启动服务的时候把拦截器添加上即可

**建立连接**

```go
func main() {
	// tracer
	tracer, closer := config.NewTracer("gRPC-hello")
	defer closer.Close()

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()
	// conn
	conn, err := grpc.DialContext(
		ctx,
		"localhost:50051",
		grpc.WithInsecure(),
		grpc.WithBlock(),
		grpc.WithUnaryInterceptor(
			grpcMiddleware.ChainUnaryClient(
				interceptor.ClientInterceptor(tracer),
			),
		),
	)
	if err != nil {
		fmt.Println("grpc conn err:", err)
		return
	}
	client := proto.NewHelloClient(conn)
	r, err := client.SayHello(context.Background(), &proto.HelloReq{Name: "xiaoming"})
	if err != nil {
		log.Fatalf("could not greet: %v", err)
	}
	log.Printf("Greeting: %s", r.Message)
}

```

**启动服务**

```go
func main() {
	lis, err := net.Listen("tcp", "50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	tracer, closer := config.NewTracer("gRPC-hello")
	defer closer.Close()
	// UnaryInterceptor
	s := grpc.NewServer(grpc.UnaryInterceptor(
		grpc_middleware.ChainUnaryServer(
			interceptor.ServerInterceptor(tracer),
		),
	))
	proto.RegisterHelloServer(s, &helloServer{})
	if err := s.Serve(lis); err != nil {
		panic(err)
	}
}
```





## 3. 完整代码

完整代码点这里！https://github.com/lixd/i-go/tree/master/apm/trace