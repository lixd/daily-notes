# Go pprof 内存分析

相关文章

> https://my.oschina.net/ytqvip/blog/1920459
>
> https://software.intel.com/content/www/us/en/develop/blogs/debugging-performance-issues-in-go-programs.html

## 1. 概述

`Golang pprof`是Golang官方的profiling工具，非常强大，使用也比较方便。

只需要在程序中嵌入如下几行代码：

```go
import _ "net/http/pprof"

go func() {
    http.ListenAndServe("0.0.0.0:8899", nil)
}()
```

在浏览器中输入`http://ip:8899/debug/pprof/`可以看到一个汇总页面，

```sh
/debug/pprof/

Types of profiles available:
Count	Profile
2576	allocs
0	block
0	cmdline
91	goroutine
2576	heap
0	mutex
0	profile
5	threadcreate
0	trace
full goroutine stack dump
```

## 2. heap 相关

其中`heap`项是我们需要关注的信息，点进去查看详细信息:

```sh
heap profile: 15: 24935632 [21131: 14342009728] @ heap/1048576
1: 10485760 [1: 10485760] @ 0x1dfafbc 0x44357a 0x443547 0x443547 0x443547 0x443547 0x443547 0x43695e 0x466da1
#	0x1dfafbb	vaptcha-go/core/service/vimage/downtime.init+0x6b	D:/wlinno/projects/vaptcha-go/core/service/vimage/downtime/generate_img.go:34
#	0x443579	runtime.doInit+0x89					c:/go/src/runtime/proc.go:5414
#	0x443546	runtime.doInit+0x56					c:/go/src/runtime/proc.go:5409
#	0x443546	runtime.doInit+0x56					c:/go/src/runtime/proc.go:5409
#	0x443546	runtime.doInit+0x56					c:/go/src/runtime/proc.go:5409
#	0x443546	runtime.doInit+0x56					c:/go/src/runtime/proc.go:5409
#	0x443546	runtime.doInit+0x56					c:/go/src/runtime/proc.go:5409
#	0x43695d	runtime.main+0x1cd					c:/go/src/runtime/proc.go:190
```

包括一些汇总信息，和各个go routine的内存开销，不过这里除了第一行信息比较直观，其他的信息太离散。

第一行为汇总信息，具体内容如下：

```sh
# heap profile: 15(inused_objects): 24935632(inused_bytes) [21131(allocated_objects): 14342009728(allocted_bytes)] @ heap/1048576

heap profile: 15: 24935632 [21131: 14342009728] @ heap/1048576
```

可以看到当前使用的堆内存是 24.9M（24935632），总共分配过 14.3GB（14342009728）。

更有用的信息我们需要借助`go tool pprof`来进行分析，

```sh
go tool pprof [-alloc_space/-inuse_space] http://ip:8899/debug/pprof/heap
```

这里有两个选项，**-alloc_space和-inuse_space**，从名字应该能看出二者的区别，不过条件允许的话，我们优先使用-inuse_space来分析，因为直接分析导致问题的现场比分析历史数据肯定要直观的多，一个函数alloc_space多不一定就代表它会导致进程的RSS高，因为我们比较幸运可以在线下复现这个OOM的场景，所以直接用-inuse_space。

这个命令进入后，是一个类似`gdb`的交互式界面，输入`top`命令可以前10大的内存分配，`flat`是堆栈中当前层的inuse内存值，cum是堆栈中本层级的累计inuse内存值（包括调用的函数的inuse内存值，上面的层级）

```sh
(pprof) top
Showing nodes accounting for 26194.02kB, 100% of 26194.02kB total
Showing top 10 nodes out of 88
      flat  flat%   sum%        cum   cum%
   17920kB 68.41% 68.41%    17920kB 68.41%  vaptcha-go/core/service/vimage/downtime.init
 4097.37kB 15.64% 84.05%  4097.37kB 15.64%  vaptcha-go/core/service/vimage/job.init
 1056.33kB  4.03% 88.09%  1056.33kB  4.03%  bufio.NewReaderSize
  544.67kB  2.08% 90.17%   544.67kB  2.08%  google.golang.org/grpc/internal/transport.newBufWriter
  524.09kB  2.00% 92.17%   524.09kB  2.00%  go.mongodb.org/mongo-driver/x/network/connection.(*connection).ReadWireMessage
     514kB  1.96% 94.13%      514kB  1.96%  bufio.NewWriterSize
     513kB  1.96% 96.09%      513kB  1.96%  crypto/x509.(*CertPool).AddCert
  512.44kB  1.96% 98.04%   512.44kB  1.96%  go.mongodb.org/mongo-driver/bson/bsoncodec.(*StructCodec).describeStruct
  512.11kB  1.96%   100%   512.11kB  1.96%  google.golang.org/protobuf/internal/filedesc.(*Message).unmarshalFull
         0     0%   100%      513kB  1.96%  crypto/tls.(*Conn).Handshake

```



## 3. 可视化

可以先采集数据，在可视化分析，或者实时采集并分析：

采集数据

```sh
go tool pprof http://127.0.0.1:8080/debug/pprof/profile?-seconds=10
```

可视化

```sh
go tool pprof -http=:8081 ~/pprof/pprof.samples.cpu.001.pb.gz
```

实时采集数据，然后分析

```sh
go tool pprof -http=:8081 http://127.0.0.1:8080/debug/pprof/heap
```



或者直接合并成一步

```go
go tool pprof -http :8081 http://127.0.0.1:8080/debug/pprof/profile?-seconds=10
```

