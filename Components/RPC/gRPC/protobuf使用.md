# Protobuf 使用

## 概述

Protocol buffers是一个灵活的、高效的、自动化的用于对结构化数据进行序列化的协议，与XML、json相比，Protocol buffers序列化后的码流更小、速度更快、操作更简单。

## 2. Windows

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



### 3. 编写 proto 文件

`derssbook.proto`

```protobuf
syntax = "proto3";
package go_protoc;
// 新版插件中 必须 配置 option go_package = "xxx";
option go_package = "/pb";

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

### 4. 编译

**编译命令**

```go
$ protoc --proto_path=IMPORT_PATH --cpp_out=DST_DIR --java_out=DST_DIR --python_out=DST_DIR --go_out=DST_DIR --ruby_out=DST_DIR --javanano_out=DST_DIR --objc_out=DST_DIR --csharp_out=DST_DIR path/to/file.proto
```

这里详细介绍golang的编译姿势:

- `-I` 参数：指定import路径，可以指定多个`-I`参数，编译时按顺序查找，不指定时默认查找当前目录
- `--go_out` ：golang编译支持，支持以下参数
  - `plugins=plugin1+plugin2` - 指定插件，目前只支持grpc，即：`plugins=grpc`
  - `M` 参数 - 指定导入的.proto文件路径编译后对应的golang包名(不指定本参数默认就是`.proto`文件中`import`语句的路径)
  - `import_prefix=xxx` - 为所有`import`路径添加前缀，主要用于编译子目录内的多个proto文件，这个参数按理说很有用，尤其适用替代一些情况时的`M`参数，但是实际使用时有个蛋疼的问题导致并不能达到我们预想的效果，自己尝试看看吧
  - `import_path=foo/bar` - 用于指定未声明`package`或`go_package`的文件的包名，最右面的斜线前的字符会被忽略
  - 末尾 `:编译文件路径  .proto文件路径(支持通配符)`



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

## 3. Linux

### 1. 安装 protoc

下载对应平台的二进制文件,配置环境变量即可。

> 也可以选择编译安装

```sh
https://github.com/protocolbuffers/protobuf/releases
```

`protoc-3.12.3-linux-x86_64.zip`

```shell
unzip protoc-3.12.3-linux-x86_64.zip -d protoc-3.12.3-linux-x86_64
```

解压后配置环境变量

```shell
vim /etc/profile 
```

`path`中增加`protoc`文件所在路径

```shell
export PATH=$PATH:/home/lixd/17x/protoc-3.12.3-linux-x86_64/bin
```

我这里的路径是`/usr/local/17x/protoc-3.12.3-linux-x86_64/bin`

使其生效

```shell
source /etc/profile
```

任意位置输入`protoc --version`出现以下结果则成功。

```sh
root@17x:/usr/local# protoc --version
libprotoc 3.12.3
```

### 2. 安装插件

`protoc-gen-go` 是用来将protobuf的的代码转换成go语言代码的一个插件

```sh
# 官方版
go get -u github.com/golang/protobuf/protoc-gen-go
# gofast
go get github.com/gogo/protobuf/protoc-gen-gofast
```

其中`gofast`会比官方的性能好些，生成出来的问题也更复杂。

### 3. 编写 proto 文件

```protobuf
syntax = "proto3";
package go_protoc;
// 新版插件中 必须 配置 option go_package = "xxx";
option go_package = "/pb";

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

### 4. 编译

```sh
#官方
protoc --go_out=. derssbook.proto
#gofast
protoc --gofast_out=. derssbook.proto
```
