# Go-kit 入门

## 1. 概述

github

```shell
https://github.com/go-kit/kit
# 对比 go micro
https://medium.com/seek-blog/microservices-in-go-2fc1570f6800
```



三层架构

* 1）Transport
  * 主要负责与 HTTP、gRPC、thrift 等相关的逻辑
  * 参数获取、返回值组装等
* 2）Endpoint
  * 定义 Request 和 Response 格式，并可以使用装饰器包装函数，以此来实现各种中间件嵌套
* 3）Service
  * 这里就是我们的业务类，接口等





## 2. 详解

这里先把所有的代码都放在`main.go`文件中。

### 1. Server

首先最简单的就是编写业务逻辑。

```go
// interface and it's implementation
type StringService interface {
	Uppercase(string) (string, error)
	Count(string) int
}
type stringService struct{}

func (stringService) Uppercase(s string) (string, error) {
	if s == "" {
		return "", ErrEmpty
	}
	return strings.ToUpper(s), nil
}

func (stringService) Count(s string) int {
	return len(s)
}

// ErrEmpty is returned when input string is empty
var ErrEmpty = errors.New("Empty string")
```

接下来就是定义 **request and response** structs。

> Go kit 中主要通信手段是 RPC，所以封装成 结构体比较好处理

```go
type uppercaseRequest struct {
	S string `json:"s"`
}

type uppercaseResponse struct {
	V   string `json:"v"`
	Err string `json:"err,omitempty"` // errors don't JSON-marshal, so we use a string
}

type countRequest struct {
	S string `json:"s"`
}

type countResponse struct {
	V int `json:"v"`
}
```



### 2. Endpoints

`Endpoint`是Go kit 中的定义，是方法或功能的抽象。

```go
// 就是一个 func 类型
type Endpoint func(ctx context.Context, request interface{}) (response interface{}, err error)
```

每个`Endpoint`都代表一个 RPC 调用，可以看到定义中的 request、response 都是 `interface{}` 类型，就是为了能够通用。

```go
import (
	"context"
	"github.com/go-kit/kit/endpoint"
)

func makeUppercaseEndpoint(svc StringService) endpoint.Endpoint {
	return func(_ context.Context, request interface{}) (interface{}, error) {
		req := request.(uppercaseRequest)
		v, err := svc.Uppercase(req.S)
		if err != nil {
			return uppercaseResponse{v, err.Error()}, nil
		}
		return uppercaseResponse{v, ""}, nil
	}
}

func makeCountEndpoint(svc StringService) endpoint.Endpoint {
	return func(_ context.Context, request interface{}) (interface{}, error) {
		req := request.(countRequest)
		v := svc.Count(req.S)
		return countResponse{v}, nil
	}
}
```

内容很简单，首先将 interface{} 参数进行断言，转换为 Server 中定义的类型，然后调用 server 中定义的 真正的业务逻辑方法。



### 3. Transports

具体逻辑写好后，就需要考虑怎么让外部进行访问了。

Go kit 支持多种 Transport，HTTP&JSON、RPC 这些都可以。

> 因为是自己来定义 request 与 response 的处理方法

这里用 HTTP&JSON 简单演示一下

首先是  request 与 response 的处理方法，比如参数怎么来的，如何获取，然后返回值又用什么格式之类的

```go
func decodeUppercaseRequest(_ context.Context, r *http.Request) (interface{}, error) {
	var request uppercaseRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return nil, err
	}
	return request, nil
}

func decodeCountRequest(_ context.Context, r *http.Request) (interface{}, error) {
	var request countRequest
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		return nil, err
	}
	return request, nil
}

func encodeResponse(_ context.Context, w http.ResponseWriter, response interface{}) error {
	return json.NewEncoder(w).Encode(response)
}
```

由于是用的 HTTP&JSON，所以参数是从 req.Body 里获取的，resp 也是通过 json.Encode 处理后返回的。

request 与 response 处理完成后就可以启动服务了

```go
import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	httptransport "github.com/go-kit/kit/transport/http"
)

func main() {
	svc := stringService{}

	uppercaseHandler := httptransport.NewServer(
		makeUppercaseEndpoint(svc),
		decodeUppercaseRequest,
		encodeResponse,
	)

	countHandler := httptransport.NewServer(
		makeCountEndpoint(svc),
		decodeCountRequest,
		encodeResponse,
	)

	http.Handle("/uppercase", uppercaseHandler)
	http.Handle("/count", countHandler)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
```

其中`httptransport.NewServer()`定义如下

```go
// NewServer constructs a new server, which implements http.Handler and wraps
// the provided endpoint.
func NewServer(
	e endpoint.Endpoint,
	dec DecodeRequestFunc,
	enc EncodeResponseFunc,
	options ...ServerOption,
) *Server {
	s := &Server{
		e:            e,
		dec:          dec,
		enc:          enc,
		errorEncoder: DefaultErrorEncoder,
		errorHandler: transport.NewLogErrorHandler(log.NewNopLogger()),
	}
	for _, option := range options {
		option(s)
	}
	return s
}
```

传入前面定义的 Endpoint 和 request 与 response 的处理方法，然后就返回了一个 Server 对象，这个 Server 对象是 Go kit 定义的，但是实现了 `net/http`中的 `Handler`接口，所以这就是一个 `net/http.Handler`



到这里 第一个例子就完成了，运行之后可以试着访问一下，应该是没有问题的。

### 4. 结构调整

前面是把所有代码都放在了`main.go`，这样肯定是不科学的，在多几个 endpoint 就没法看了，于是开始对代码进行分类或者分层放置。

* 1）**service.go** - 业务逻辑相关代码

```go
type StringService
type stringService
func Uppercase
func Count
var ErrEmpty
```

* 2）**transport.go ** - 参数处理和结构定义
  * 其实就是剩下的所有代码 - 两个 endpoint 也暂时放在这里

```go
func makeUppercaseEndpoint
func makeCountEndpoint
func decodeUppercaseRequest
func decodeCountRequest
func encodeResponse
type uppercaseRequest
type uppercaseResponse
type countRequest
type countResponse
```



## 3. Middlewares

前面只是实现了基本的功能，但是其他的 日志记录和各种监控都没有实现，肯定是不能直接上线的。

所以开始添加中间件。



### 1. Transport logging

在 Go kit 中，日志也是被当做一个依赖项，在 main 文件中定义，然后`传递`到其他需要使用的地方，而不是使用一个全局 logger。

Go kit 中的传递并不是直接定义一个字段，而是用的自定义的**`middleware`**,也可以叫做`装饰器`。

```shell
# 接收一个 Endpoint 并且也返回一个 Endpoint
# 在这里就可以执行任何事情，比如 记录日志
type Middleware func(Endpoint) Endpoint
```

例如

```go
func loggingMiddleware(logger log.Logger) Middleware {
	return func(next endpoint.Endpoint) endpoint.Endpoint {
		return func(ctx context.Context, request interface{}) (interface{}, error) {
			logger.Log("msg", "calling endpoint")
			defer logger.Log("msg", "called endpoint")
			return next(ctx, request)
		}
	}
}
```

完整代码如下

```go
package main

import (
	"context"
	"github.com/go-kit/kit/endpoint"
	"github.com/go-kit/kit/log"
	httptransport "github.com/go-kit/kit/transport/http"
	"github.com/sirupsen/logrus"
	"net/http"
	"os"
)

func main() {
	logger := log.NewLogfmtLogger(os.Stderr)

	svc := stringService{}

	var uppercase endpoint.Endpoint
	uppercase = makeUppercaseEndpoint(svc)
	// 对 uppercase endpoint 进行包装
	uppercase = loggingMiddleware(log.With(logger, "method", "uppercase"))(uppercase)

	var count endpoint.Endpoint
	count = makeCountEndpoint(svc)
	count = loggingMiddleware(log.With(logger, "method", "count"))(count)

	uppercaseHandler := httptransport.NewServer(
		uppercase,
		decodeUppercaseRequest,
		encodeResponse,
	)

	countHandler := httptransport.NewServer(
		count,
		decodeCountRequest,
		encodeResponse,
	)

	http.Handle("/uppercase", uppercaseHandler)
	http.Handle("/count", countHandler)
	logrus.Fatal(http.ListenAndServe(":8080", nil))
}

// loggingMiddleware 日志中间件
func loggingMiddleware(logger log.Logger) endpoint.Middleware {
	return func(next endpoint.Endpoint) endpoint.Endpoint {
		return func(ctx context.Context, request interface{}) (interface{}, error) {
			logger.Log("msg", "calling endpoint")
			defer logger.Log("msg", "called endpoint")
			return next(ctx, request)
		}
	}
}

```



### 2. Application logging

前面只是在 transport 层打印日志，如果要在逻辑代码中打印日志怎么处理呢？

同样可以用 middleware 解决。

首先创建一个更大的结构体，包含前面定义的 Server

```go
type loggingServer struct {
	logger log.Logger
	next   StringService
}
```

接着在 Server 具体业务逻辑之前打印日志

```go
func (mw loggingServer) Uppercase(s string) (output string, err error) {
	defer func(begin time.Time) {
		mw.logger.Log(
			"method", "uppercase",
			"input", s,
			"output", output,
			"err", err,
			"took", time.Since(begin),
		)
	}(time.Now())

	output, err = mw.next.Uppercase(s)
	return
}

func (mw loggingServer) Count(s string) (n int) {
	defer func(begin time.Time) {
		mw.logger.Log(
			"method", "count",
			"input", s,
			"n", n,
			"took", time.Since(begin),
		)
	}(time.Now())

	n = mw.next.Count(s)
	return
}
```

使用的时候，把 Server 对象包装起来即可。

```shell
	var svc StringService
	svc = stringService{}
	svc = loggingServer{logger, svc}
```

由于 loggingServer 实现了 StringService 接口，所以 loggingServer  也是 StringService



### 3. Application instrumentation

同样的，使用 middleware 也可以用于统计 处理请求数量、正在执行中的任务数等等信息。

具体操作方式和 前面 logging 一样就不细说了。

```go
package main

import (
	"fmt"
	"github.com/go-kit/kit/metrics"
	"time"
)

type instrumentingMiddleware struct {
	requestCount   metrics.Counter
	requestLatency metrics.Histogram
	countResult    metrics.Histogram
	next           StringService
}

func (mw instrumentingMiddleware) Uppercase(s string) (output string, err error) {
	defer func(begin time.Time) {
		lvs := []string{"method", "uppercase", "error", fmt.Sprint(err != nil)}
		mw.requestCount.With(lvs...).Add(1)
		mw.requestLatency.With(lvs...).Observe(time.Since(begin).Seconds())
	}(time.Now())

	output, err = mw.next.Uppercase(s)
	return
}

func (mw instrumentingMiddleware) Count(s string) (n int) {
	defer func(begin time.Time) {
		lvs := []string{"method", "count", "error", "false"}
		mw.requestCount.With(lvs...).Add(1)
		mw.requestLatency.With(lvs...).Observe(time.Since(begin).Seconds())
		mw.countResult.Observe(float64(n))
	}(time.Now())

	n = mw.next.Count(s)
	return
}
```

使用的时候也是继续包装，这里用的是 `prometheus`这个工具。

```go
package main

import (
	"github.com/go-kit/kit/endpoint"
	"github.com/go-kit/kit/log"
	kitprometheus "github.com/go-kit/kit/metrics/prometheus"
	httptransport "github.com/go-kit/kit/transport/http"
	stdprometheus "github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/sirupsen/logrus"
	"net/http"
	"os"
)

func main() {
	logger := log.NewLogfmtLogger(os.Stderr)

	fieldKeys := []string{"method", "error"}
	requestCount := kitprometheus.NewCounterFrom(stdprometheus.CounterOpts{
		Namespace: "my_group",
		Subsystem: "string_service",
		Name:      "request_count",
		Help:      "Number of requests received.",
	}, fieldKeys)
	requestLatency := kitprometheus.NewSummaryFrom(stdprometheus.SummaryOpts{
		Namespace: "my_group",
		Subsystem: "string_service",
		Name:      "request_latency_microseconds",
		Help:      "Total duration of requests in microseconds.",
	}, fieldKeys)
	countResult := kitprometheus.NewSummaryFrom(stdprometheus.SummaryOpts{
		Namespace: "my_group",
		Subsystem: "string_service",
		Name:      "count_result",
		Help:      "The result of each count method.",
	}, []string{}) // no fields here

	var svc StringService
	svc = stringService{}
	//  包装 log
	svc = loggingServer{logger, svc}
	svc = instrumentingMiddleware{requestCount, requestLatency, countResult, svc}

}

```



### 4. Calling other services

> 通过代理的方式，对外提供服务

从这里开始就与前面的 Middleware 有一点不同的。

Middleware 是在执行真正方法前后，执行一些额外的方法，比如日志记录，处理数统计等。

这里用到的是 ServiceMiddleware，是直接对外提供另一个接口用以访问，内部实际还是调用的真正的接口。

首先定义 ServiceMiddleware , 和中间件类似，接收一个接口类型，又返回一个接口类型，在这中间就可以让我们做很多事情了。

```go
// ServiceMiddleware is a chainable behavior modifier for StringService.
type ServiceMiddleware func(StringService) StringService
```

再看一下普通 Middleware 是如何定义的

```go
// Middleware is a chainable behavior modifier for endpoints.
type Middleware func(Endpoint) Endpoint
```

同样的，创建一个结构体，包含 server 的那种。

```go
// proxymw implements StringService, forwarding Uppercase requests to the
// provided endpoint, and serving all other (i.e. Count) requests via the
// next StringService.
type proxymw struct {
	ctx       context.Context
	next      StringService     // Serve most requests via this service...
	uppercase endpoint.Endpoint // ...except Uppercase, which gets served by this endpoint
}
```

接着把 server 接口再实现一遍（因为这个 proxy 才是真正对外提供访问的）

```go
func (mw proxymw) Uppercase(s string) (string, error) {
	response, err := mw.uppercase(mw.ctx, uppercaseRequest{S: s})
	if err != nil {
		return "", err
	}
	resp := response.(uppercaseResponse)
	if resp.Err != "" {
		return resp.V, errors.New(resp.Err)
	}
	return resp.V, nil
}

func (mw proxymw) Count(s string) int {
	return mw.next.Count(s)
}
```

服务发现与负载均衡 也是通过 proxy 来实现的。

### 5. Service discovery and load balancing

Go kit 中也提供了服务发现与负载均衡。

负载均衡算法

```go
idx := old % uint64(len(endpoints))
```

具体负载均衡逻辑如下

```go
func proxyingMiddleware(ctx context.Context, instances string, logger log.Logger) ServiceMiddleware {
	// If instances is empty, don't proxy.
	if instances == "" {
		logger.Log("proxy_to", "none")
		return func(next StringService) StringService { return next }
	}

	// Set some parameters for our client.
	var (
		qps         = 100                    // beyond which we will return an error
		maxAttempts = 3                      // per request, before giving up
		maxTime     = 250 * time.Millisecond // wallclock time, before giving up
	)

	// Otherwise, construct an endpoint for each instance in the list, and add
	// it to a fixed set of endpoints. In a real service, rather than doing this
	// by hand, you'd probably use package sd's support for your service
	// discovery system.
	var (
		instanceList = split(instances)
		endpointer   sd.FixedEndpointer
	)
	logger.Log("proxy_to", fmt.Sprint(instanceList))
	for _, instance := range instanceList {
		var e endpoint.Endpoint
		e = makeUppercaseProxy(ctx, instance)
		e = circuitbreaker.Gobreaker(gobreaker.NewCircuitBreaker(gobreaker.Settings{}))(e)
		e = ratelimit.NewErroringLimiter(rate.NewLimiter(rate.Every(time.Second), qps))(e)
		endpointer = append(endpointer, e)
	}

	// Now, build a single, retrying, load-balancing endpoint out of all of
	// those individual endpoints.
	balancer := lb.NewRoundRobin(endpointer)
	retry := lb.Retry(maxAttempts, maxTime, balancer)

	// And finally, return the ServiceMiddleware, implemented by proxymw.
	return func(next StringService) StringService {
		return proxymw{ctx, next, retry}
	}
}
```

通过`balancer := lb.NewRoundRobin(endpointer)` 提供负载均衡能力

通过`retry := lb.Retry(maxAttempts, maxTime, balancer)` 则提供了重试能力



使用的时候传入 服务器列表即可

```go
	proxy := flag.String("proxy", "", "Optional comma-separated list of URLs to proxy uppercase requests")
	svc = proxyingMiddleware(context.Background(), *proxy,logger)(svc)
```



说好的服务发现呢...看起来需要纯手写