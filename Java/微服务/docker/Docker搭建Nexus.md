# 搭建Nexus

## 1. 简介

Nexus 是一个强大的仓库管理器，极大地简化了内部仓库的维护和外部仓库的访问。

2016 年 4 月 6 日 Nexus 3.0 版本发布，相较 2.x 版本有了很大的改变：

- 对低层代码进行了大规模重构，提升性能，增加可扩展性以及改善用户体验。
- 升级界面，极大的简化了用户界面的操作和管理。
- 提供新的安装包，让部署更加简单。
- 增加对 Docker, NeGet, npm, Bower 的支持。
- 提供新的管理接口，以及增强对自动任务的管理。

## 2. 基于 Docker 安装 Nexus

### 1. 下载

```bash 
$ docker pull sonatype/nexus3
```

### 2. 配置文件

`docker-compose.yml`配置如下：

```yml
version: '3.1'
services:
  nexus:
    restart: always
    image: sonatype/nexus3
    container_name: nexus
    ports:
      - 8081:8081
    volumes:
      - /usr/local/docker/nexus/data:/nexus-data
```

### 3. 启动

```bash
$ docker-compose up
```

这里有个小问题，启动的时候提示没有data目录的权限，所以需要先加上权限后在启动。

```bash
$ chmod 777 data
```

## 4. 使用

地址：`http://ip:port/`

用户名：admin 

密码：admin123

## 5. 在项目中使用 Maven 私服

### 1. 配置认证信息

在 Maven `settings.xml` 中添加 Nexus 认证信息(`servers` 节点下)：

```xml
<server>
  <id>nexus-releases</id>
  <username>admin</username>
  <password>admin123</password>
</server>

<server>
  <id>nexus-snapshots</id>
  <username>admin</username>
  <password>admin123</password>
</server>
```

### 2. Snapshots 与 Releases 的区别

- nexus-releases: 用于发布 Release 版本
- nexus-snapshots: 用于发布 Snapshot 版本（快照版）

Release 版本与 Snapshot 定义如下：

```text
Release: 1.0.0/1.0.0-RELEASE
Snapshot: 1.0.0-SNAPSHOT
```

- 在项目 `pom.xml` 中设置的版本号添加 `SNAPSHOT` 标识的都会发布为 `SNAPSHOT` 版本，没有 `SNAPSHOT` 标识的都会发布为 `RELEASE` 版本。
- `SNAPSHOT` 版本会自动加一个时间作为标识，如：`1.0.0-SNAPSHOT` 发布后为变成 `1.0.0-SNAPSHOT-20190222.123456-1.jar`

### 3. 配置自动化部署

在 `pom.xml` 中添加如下代码：

```xml
<distributionManagement>  
  <repository>  
    <id>nexus-releases</id>  
    <name>Nexus Release Repository</name>  
    <url>http://127.0.0.1:8081/repository/maven-releases/</url>  
  </repository>  
  <snapshotRepository>  
    <id>nexus-snapshots</id>  
    <name>Nexus Snapshot Repository</name>  
    <url>http://127.0.0.1:8081/repository/maven-snapshots/</url>  
  </snapshotRepository>  
</distributionManagement> 
```

注意事项：

- ID 名称必须要与 `settings.xml` 中 Servers 配置的 ID 名称保持一致。
- 项目版本号中有 `SNAPSHOT` 标识的，会发布到 Nexus Snapshots Repository, 否则发布到 Nexus Release Repository，并根据 ID 去匹配授权账号。

### 4. 部署到仓库

```text
mvn deploy
```

### 5. 上传第三方 JAR 包

使用 maven 命令上传，也可以在页面上传：

```text
# 如第三方JAR包：aliyun-sdk-oss-2.2.3.jar
mvn deploy:deploy-file 
  -DgroupId=com.aliyun.oss 
  -DartifactId=aliyun-sdk-oss 
  -Dversion=2.2.3 
  -Dpackaging=jar 
  -Dfile=D:\aliyun-sdk-oss-2.2.3.jar 
  -Durl=http://192.168.1.114:8081/repository/maven-3rd/ 
  -DrepositoryId=nexus-releases
```

注意事项：

- 建议在上传第三方 JAR 包时，创建单独的第三方 JAR 包管理仓库，便于管理有维护。（maven-3rd）
- `-DrepositoryId=nexus-releases` 对应的是 `settings.xml` 中 Servers 配置的 ID 名称。（授权）

### 配置代理仓库

```xml
<repositories>
    <repository>
        <id>nexus</id>
        <name>Nexus Repository</name>
        <url>http://192.168.1.114:8081/repository/maven-public/</url>
        <snapshots>
            <enabled>true</enabled>
        </snapshots>
        <releases>
            <enabled>true</enabled>
        </releases>
    </repository>
</repositories>
<pluginRepositories>
    <pluginRepository>
        <id>nexus</id>
        <name>Nexus Plugin Repository</name>
        <url>http://192.1681.114:8081/repository/maven-public/</url>
        <snapshots>
            <enabled>true</enabled>
        </snapshots>
        <releases>
            <enabled>true</enabled>
        </releases>
    </pluginRepository>
</pluginRepositories>
```