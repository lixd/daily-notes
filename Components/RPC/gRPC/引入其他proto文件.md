# proto文件中引入其他proto文件

## 1. 概述

proto文件一般定义如下:

```protobuf
syntax = "proto3";
option go_package = ".;proto";
package imp;
import "grpc/imp/user.proto";

service Msg {
  rpc GetMsgList (imp.UserID) returns (MsgReq);
}

message MsgReq {
  string ID = 1;
  imp.Profile user = 2;
}
```



```protobuf
syntax = "proto3";
```

指定使用 proto3 语法

```protobuf
option go_package = ".;proto";
```

具体语法为

```protobuf
option go_package = "{out_path};out_go_package";
```

前一个参数用于指定生成文件的位置，后一个参数指定生成的 go 文件的 package 参数。

这里指定的 out_path 并不是绝对路径，只是相对路径或者说只是路径的一部分。

和 protoc 的 `--go_out` 拼接后才是完整的路径。

使用`--go_opt=paths=source_relative`直接指定 protoc 中 指定的是绝对路径，这样就不会去管 protobuf 文件中指定的路径。



```protobuf
package imp;
```

表示当前 protbuf 文件输入 imp 包，这个package不是 Go 语言中的那个package



```protobuf
import "grpc/imp/user.proto";
```

导入 user.proto 文件，这个也是相对路径，具体和 protoc --proto_path 组合起来才是完整路径。

> 一般指定为项目根目录的次一级目录，编译的时候直接在根目录编译。

