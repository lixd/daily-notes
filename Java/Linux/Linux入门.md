# Linux入门

## 1. 系统目录

`/` 根目录 `~`表示root用户

**`etc` ** 存放系统配置文件

`home` 除了root以外，其他所有用户默认会在home下新建一个以用户名为名称的文件夹

​	用户xxx对/home/xxx 文件夹具有完全操作权限

`root` root用户单独的文件夹

`usr` 所有用户安装的文件夹都放在这个文件夹中

​	在/usr/local 下新建一个tmp文件夹,用来放安装包

## 2.常用命令

`pwd` 打印工作路径，即当前路径‘

`cd` 进入到文件夹

​	cd .. 

​	cd 路径

`mkdir` 创建空文件夹

​	mkdir 文件名

​	mkdir 文件名 存放位置

`touch` 创建空文件

`cat` 查看文件全部内容

`head [-n]` 查看文件前n行,默认前10行

`tail [-n]  ` 查看文件后n行,默认后10行

​	tailf 动态显示文件后n行 文件变化后也会持续输出，监控tomcat日志文件

`echo '内容' >> 文件名` 向文件中添加内容

 `ifconfig` 查看网卡信息

`reboo` 重启

`tar zxvf 文件名`  解压文件

`cp [-r] 源文件 新文件路径` 复制文件`-r`表示复制文件夹 复制文件时不用加

`mv 源文件 新文件 ` 剪切 具备重命名功能

`rm [-r] 文件名` 删除文件 -r表示删除文件夹

`clear` 清屏 

`ctrl+c` 中断 结束命令 

`su -root` 获取root权限

全路径： `/`开头

相对路径：从当前资源寻找其他资源的过程

## 3. Xshell 

linux客户端工具

cent os 默认只开启22端口，其他被防火墙拦截。

## 4. Xftp

文件传输



## yum

1.安装yum包：

```
$ yum install PACKAGE_NAME
```

2.取出yum包装：

```
$ yum remove PACKAGE_NAME
```

3.重新安装一个yum包：

```
$ yum reinstall PACKAGE_NAME
```

4.搜索yum包：

```
$ yum search PACKAGE_NAME
```

5.显示yum包的信息：

```
$ yum info PACKAGE_NAME
```

6.更新安装的yum包：

```
$ yum update
```

7.更新具体的yum包：

```
$ yum update PACKAGE_NAME
```

8.显示yum历史：

```
$ yum history
```

9.显示已启用的yum存储库的列表：

```
$ yum repolist
```

10.找出哪个yum包提供了一个特定的文件（例如：/usr/bin/nc)）：

```
$ yum whatprovides "*bin/nc"
```

11.清除yum缓存：

```
$ yum clean all
```