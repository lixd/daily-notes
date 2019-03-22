# idea下ProtoBuf使用
## 1.准备工作
使用protoBuf前需要添加依赖和安装插件等。

首先idea安装`ProtoBuf Support`插件

### 1.1 pom.xml
添加依赖
```xml
<!--版本定义-->
    <properties>
        <grpc.version>1.6.1</grpc.version>
        <protobuf.version>3.3.0</protobuf.version>
    </properties>
    
<dependencies>
  <!--protoBuf-->
        <dependency>
            <groupId>io.grpc</groupId>
            <artifactId>grpc-netty</artifactId>
            <version>${grpc.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>io.grpc</groupId>
            <artifactId>grpc-protobuf</artifactId>
            <version>${grpc.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>io.grpc</groupId>
            <artifactId>grpc-stub</artifactId>
            <version>${grpc.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>com.google.protobuf</groupId>
            <artifactId>protobuf-java</artifactId>
            <version>${protobuf.version}</version>
        </dependency>
</dependencies>
```
添加插件
```xml
 <build>
        <extensions>
            <extension>
            <!--这个是用来获取os.detected.classifier的-->
                <groupId>kr.motd.maven</groupId>
                <artifactId>os-maven-plugin</artifactId>
                <version>1.6.1</version>
            </extension>
        </extensions>
        <plugins>
            <plugin>
                <groupId>org.xolstice.maven.plugins</groupId>
                <artifactId>protobuf-maven-plugin</artifactId>
                <version>0.6.1</version>
                <configuration>
                    <protocArtifact>com.google.protobuf:protoc:${protobuf.version}:exe:${os.detected.classifier}</protocArtifact>
                    <pluginId>grpc-java</pluginId>
                    <pluginArtifact>io.grpc:protoc-gen-grpc-java:${grpc.version}:exe:${os.detected.classifier}</pluginArtifact>
                </configuration>
                <executions>
                    <execution>
                        <goals>
                            <goal>compile</goal>
                            <goal>compile-custom</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
```
到这里就可以开始编写ProtoBuf文件了。
## 2.编写proto文件
这是一个简单的文件 User.proto 
```proto
//定义使用的proto语法
//对于一个pb文件而言，文件首个非空、非注释的行必须注明pb的版本，即syntax = "proto3";，否则默认版本是proto2。
syntax = "proto3";
//定义编译后输出的文件位置
option java_package = "com.example.demo.demo.proto";
//定义编译后的Java文件的名字
option java_outer_classname = "ProUser";

message User {
    int32 id = 1;
    string name = 2;
    string email = 3;

    enum Sex {
        MAN = 0;
        WOMEN = 1;
    }
    Sex sex = 4;
    enum PhoneType {
        MOBILE = 0;
        HOME = 1;
        WORK = 2;
    }
    //可以看做内部类
    message Phone {
        string number = 1;
        PhoneType type = 2;
    }
    //集合
    repeated Phone phone = 5;

}
```
## 3.编译proto
idea中位置如下
View-->Tool Windows-->Maven-->Plugins-->protobuf-->protobuf:compile
会将proto文件编译为.java文件


## 4.protobuf语法

```proto
//对于一个pb文件而言，文件首个非空、非注释的行必须注明pb的版本，即syntax = "proto3";，否则默认版本是proto2。
syntax = "proto3";
//SearchRequest消息格式有3个字段，在消息中承载的数据分别对应于每一个字段。其中每个字段都有一个名字和一种类型。
message SearchRequest {
//两个整型（page_number和result_per_page），一个string类型（query）
  string query = 1;
  int32 page_number = 2;
  int32 result_per_page = 3;
}
message SearchRequest2 {
//两个整型（page_number和result_per_page），一个string类型（query）
  string query2 = 1;
  int32 page_number2 = 2;
  int32 result_per_page2 = 3;
}

//在消息定义中，每个字段都有唯一的一个数字标识符。这些标识符是用来在消息的二进制格式中识别各个字段的，一旦开始使用就不能够再改变。
//注：[1,15]之内的标识号在编码的时候会占用一个字节。[16,2047]之内的标识号则占用2个字节。所以应该为那些频繁出现的消息元素保留 [1,15]之内的标识号。
//切记：要为将来有可能添加的、频繁出现的标识号预留一些标识号。
//每个message块中的下=标识号不会冲突 即上面的SearchRequest和SearchRequest2

```