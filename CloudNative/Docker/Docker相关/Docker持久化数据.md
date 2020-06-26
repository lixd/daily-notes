# Docker数据持久化

## Volume

将容器中创建的数据写入到外部宿主机的文件系统中。

docker有两种`Volume`

* **基于本地文件系统的Volume**。可以在Docker create或者Docker run的时候加上`-v`参数将主机目录作为容器数据卷。
* **基于plugins的Volume**。docker也支持第三方的存储方案,例如NAS，aws等

### Volume类型

* 受管理的data Volume，由docker后台自动创建
* 绑定挂载的Volume，具体挂载位置可以由用户指定

### Volume特点

 • 多个运行容器之间共享数据。

 • 当容器停止或被移除时，该卷依然存在。

 • 多个容器可以同时挂载相同的卷。

 • 当明确删除卷时，卷才会被删除。

 • 将容器的数据存储在远程主机或其他存储上

 • 将数据从一台Docker主机迁移到另一台时，先停止容器，然后备份卷的目录（/var/lib/docker/volumes/）

### 常用命令

```sh
sudo docker volume ls  # Volume列表
sudo docker volume rm [volumeId] # 移除
sudo docker volume inspect [volumeId] # 查看详情
```

### 使用

Dockerfile中先定义VOLUME

```sh
VOLUME["/var/lib/mysql"]
```

启动容器时指定

```sh
docker ruin -v volumeName:/var/lib/mysql
eg:docker ruin -v mysqldata:/var/lib/mysql
```



## Bind Mounting

直接将宿主机目录和容器中的目录同步。

任意一个地方修改了文件都会同步到另一边。

### Bind Mounts特点

• 从主机共享配置文件到容器。默认情况下，挂载主机/etc/resolv.conf到每个容器，提供DNS解析。 

• 在Docker主机上的开发环境和容器之间共享源代码。例如，可以将Maven target目录挂载到容器中，每次在Docker主机 上构建Maven项目时，容器都可以访问构建的项目包。

 • 当Docker主机的文件或目录结构保证与容器所需的绑定挂载一致时

### 使用

直接指定宿主机目录共享到容器。

```sh
docker run -v /home/data:/root/aaa
```

