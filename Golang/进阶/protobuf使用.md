# Protobuf 使用

## 概述

Protocol buffers是一个灵活的、高效的、自动化的用于对结构化数据进行序列化的协议，与XML、json相比，Protocol buffers序列化后的码流更小、速度更快、操作更简单。

## 使用

### 1. 安装protoc

protoc 用来将.proto文件转化为自己使用的语言格式，我使用的是go语言，所以还要下载一个与protoc配合的插件，一会再说这个插件。

**下载地址**

```go
https://github.com/protocolbuffers/protobuf/releases
```

我这里是windows，所以下载的是`[protoc-3.8.0-win64.zip]`,下载后解压,将`bin`目录下的`protoc.exe`复制到`$GOPATH/bin`目录中。

### 2. 安装插件

`protoc-gen-go` 是用来将protobuf的的代码转换成go语言代码的一个插件

github地址：`https://github.com/golang/protobuf`

使用以下命令将会自动把`protoc-gen-go`安装到`$GOPATH/bin`目录下

```go
go get -u github.com/golang/protobuf/protoc-gen-go
```

goprotobuf还有另外两个插件

- protoc-gen-gogo：和protoc-gen-go生成的文件差不多，性能也几乎一样(稍微快一点点)
- protoc-gen-gofast：生成的文件更复杂，性能也更高(快5-7倍)

```go
//gogo
go get github.com/gogo/protobuf/protoc-gen-gogo
 
//gofast
go get github.com/gogo/protobuf/protoc-gen-gofast
```

### 3. 安装proto

proto是protobuf在golang中的接口模块

```go
go get github.com/golang/protobuf/proto
```

如果是使用的另外两个插件，则可以装下面的

```go
go get github.com/gogo/protobuf/proto
go get github.com/gogo/protobuf/gogoproto  //这个不装也没关系
```



### 4. 编写一个proto文件

`derssbook.proto`

```protobuf
syntax = "proto3";
package go_protoc;

message Person {
  string name = 1;
  int32 id = 2;
  string email = 3;

  enum PhoneType {
    MOBILE = 0;
    HOME = 1;
    WORK = 2;
  }

  message PhoneNumber {
    string number = 1;
    PhoneType type = 2;
  }

  repeated PhoneNumber phones = 4;

}

message AddressBook {
  repeated Person people = 1;
}
```

### 5. 编译

```go
//官方
protoc --go_out=. derssbook.proto

//gogo
protoc --gogo_out=. derssbook.proto
 
//gofast
protoc --gofast_out=. derssbook.proto
```

编译后会生成一个`derssbook.pb.go`文件。

到此为止就ok了。

