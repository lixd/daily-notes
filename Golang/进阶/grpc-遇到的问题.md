## 1. Code=Unimplemented desc = Method Not Found！

其中客户端由`golang`编写，服务端由`python`编写。

测试时 `python`客户端服务端可以正常交互

`golang`客户端 服务端也可以正常交互。

`golang`客户端调用`Python`服务端是提示

```go
rpc error:Code=Unimplemented desc = Method Not Found！
```

找不到方法emmm

下面是官网上的错误列表，其中`GRPC_STATUS_UNIMPLEMENTED`对应的case也是`Method not found on server`。

但是可以保证绝对不是这个问题。各种`google`之后总算找到了原因。

`https://www.itread01.com/content/1547029280.html`

### 原因

这是由于`proto文件`中的`package name` 被修改，和 server 端的package 不一致导致的，不修改`proto文件` packagename 重新编译生成对应的代码即可。

由于python写时没有加`package xxx;`这就 然后go这边加了。。。怪不得,修改之后果然能成功运行了。

| Case                                                         | Status code                   |
| :----------------------------------------------------------- | :---------------------------- |
| Client application cancelled the request                     | GRPC_STATUS_CANCELLED         |
| Deadline expired before server returned status               | GRPC_STATUS_DEADLINE_EXCEEDED |
| Method not found on server                                   | GRPC_STATUS_UNIMPLEMENTED     |
| Server shutting down                                         | GRPC_STATUS_UNAVAILABLE       |
| Server threw an exception (or did something other than returning a status code to terminate the RPC) | GRPC_STATUS_UNKNOWN           |

