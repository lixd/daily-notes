# proto文件中引入其他proto文件

## 1. 概述

proto文件一般定义如下:

```protobuf
syntax = "proto3";
option go_package = ".;proto";
package imp;


service Msg {
  rpc GetMsg (imp.UserID) returns (MsgReq);
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

前一个参数用于指定生成文件的位置，后一个参数指定生成的 .go 文件的 package 。

**这里指定的 out_path 并不是绝对路径，只是相对路径或者说只是路径的一部分**。

和 protoc 的 `--go_out` 拼接后才是完整的路径。

使用`--go_opt=paths=source_relative`直接指定 protoc 中 指定的是绝对路径，这样就不会去管 protobuf 文件中指定的路径。



```protobuf
package imp;
```

表示当前 protbuf 文件属于 imp 包，这个package不是 Go 语言中的那个package



## 2. 导入其他proto文件

要导入其他 proto 文件只需要使用 **import **关键字

```protobuf
import "grpc/imp/user.proto";
```

导入后则通过 **包名.结构体名 ** 使用。

user.proto 文件中 package 指定为 imp，所以通过 imp.UserID 和 imp.Profile 语法进行引用。

完整代码如下

```protobuf
syntax = "proto3";
option go_package = "/grpc/imp/;proto";
package imp;
import "grpc/imp/user.proto";

service Msg {
  rpc GetMsg (imp.UserID) returns (MsgReq);
}

message MsgReq {
  string ID = 1;
  imp.Profile user = 2;
}
```

导入 user.proto 文件，这个也是相对路径，具体和 protoc --proto_path 组合起来才是完整路径。

> 一般指定为项目根目录的次一级目录，编译的时候直接在根目录编译。



protoc 编译的时候通过 `--proto_path` 指定在哪个目录去寻找 import 指定的文件。

比如指定 `--proto_path=.`即表示在当前目录下去寻找`grpc/imp/user.proto`这个文件。



## 3. 例子

目录结构如下

```sh
/i-go
	/grpc
		/imp
			--msg.proto
			--user.ptoto
```



### user.ptoto

```protobuf
syntax = "proto3";
option go_package = "/grpc/imp/;proto";
package imp;

message UserID {
  int64  ID = 1;
}

message Profile {
  string ID = 1;
  string Name = 2;
}
```

### msg.proto

```protobuf
syntax = "proto3";
option go_package = "/grpc/imp/;proto";
package imp;
import "grpc/imp/user.proto";

service Msg {
  rpc GetMsg (imp.UserID) returns (MsgReq);
}

message MsgReq {
  string ID = 1;
  imp.Profile user = 2;
}
```



### 编译参数

在 i-go 目录(项目根路径)下进行编译

```sh
protoc --proto_path=. \
	--go_out=. \ 
	--go-grpc_out=. \
	./grpc/imp/*.proto
```



参数详解：

**--proto_path=.**

指定在当前目录( i-go)寻找 import 的文件（默认值也是当前目录）

然后 import 具体路径如下

```protobuf
import "grpc/imp/user.proto";
```

所以最终会去找 i-go/grpc/imp/user.proto。

`--proto_path`和`import`是可以互相调整的，只需要能找到就行。

> 建议 --proto_path 指定为根目录，import 则从根目录次一级目录开始。



**--go_out=.**

指定将生成文件放在当前目录( i-go)，但是因为 protobuf 文件中也指定了目录为`/grpc/imp/`,具体如下：

```protobuf
option go_package = "/grpc/imp/;proto";
```

所以最终生成目录为`--go_out+go_package= i-go/grpc/imp/` 这个目录。

参数 `--go_opt=paths=source_relative` 可以使用绝对路径，从而忽略掉 proto 文件中的 go_package 路径，直接生成在 --go_out 指定的路径。

 

**--go-grpc_out=.**

同`--go_out=.`

参数 `--go-grpc_opt=paths=source_relative` 同`--go_opt=paths=source_relative`。



**./grpc/imp/*.proto**

指定编译 imp 目录下的所有 proto 文件。