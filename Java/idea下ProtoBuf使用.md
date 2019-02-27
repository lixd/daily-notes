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

    string phone=5;

}
```
## 3.编译proto
idea中位置如下
View-->Tool Windows-->Maven-->Plugins-->protobuf-->protobuf:compile
会将proto文件编译为.java文件


## 4.protobuf语法

