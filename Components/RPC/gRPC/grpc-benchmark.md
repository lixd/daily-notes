# gRPC Benchmark Tools

## 安装

https://github.com/bojand/ghz



直接去 github 下载即可

```http
https://github.com/bojand/ghz/releases
```



基本使用命令：

```sh
./ghz -c 100 -n 100000 \
  --insecure \
  --proto ./hello_world.proto \
  --call helloworld.Greeter.SayHello \
  -d '{"name":"Joe"}' \
  0.0.0.0:50051
```



## 参数

参数

* -proto：执行 protobuf 文件。
* -c：并发数
* -n：总请求次数
* -z：压测持续时间，指定z就会忽略掉n。
* -d：参数json格式，可以是json文件或json字符串。
* --cpus：指定压测使用的cpu核心数，默认使用全部。

其他常用参数

* --load-schedule：调度策略，默认是const，即恒定rps

可选值 step 步进递增，line 线性递增。

* --load-start：初始 rps
* --load-step：rps步进，递增值
* --load-step-duration：递增间隔时间
* --load-end：递增rps的最大值



例子

```sh
-n 10000 -c 10 --load-schedule=step --load-start=50 --load-end=150 --load-step=10 --load-step-duration=5s
```

rps 从 50开始，每过5s就增加10 直到 150。



## 配置文件

所有参数都可以通过配置文件来指定，这也是比较推荐的用法。

比如这样：

```json
{
    "proto": "/path/to/greeter.proto",
    "call": "helloworld.Greeter.SayHello",
    "total": 2000,
    "concurrency": 50,
    "data": {
        "name": "Joe"
    },
    "metadata": {
        "foo": "bar",
        "trace_id": "{{.RequestNumber}}",
        "timestamp": "{{.TimestampUnix}}"
    },
    "import-paths": [
        "/path/to/protos"
    ],
    "max-duration": "10s",
    "host": "0.0.0.0:50051"
}
```



## 输出

可以通过 `-O`参数指定输出格式，支持的格式如下：

* -O csv
* -O html
* -O json ，同时-O pretty可以输出格式化后的json
* 