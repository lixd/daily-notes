# no copy

因此，举一反三，如果在我们自己的项目开发中，定义某对象不能被copy，那么就可以参考Go源码中，嵌入noCopy结构体，最终通过go vet进行copy检查。



```go
type noCopy struct{}
func (*noCopy) Lock() {}
func (*noCopy) Unlock() {}
type MyType struct {
   noCopy noCopy
   ...
}
```

更多关于Go关于no copy的讨论请参考官方Github issue，地址：https://github.com/golang/go/issues/8005