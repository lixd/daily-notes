# Gin框架与gRPC接入Jaeger

## 1.Gin

通过Middleware可以追踪到最外层的Handler，更深层方法需要追踪的话可以通过ctx将span传递到各个方法去。



## 2. gRPC

同样通过拦截器