# Linux安装JDK、Tomcat

本章主要讲了如何通过解压方式在Linux下安装JDK和Tomcat等软件。

<!-- more-->

> 点击阅读更多Linux入门系列文章[我的个人博客-->幻境云图](https://www.lixueduan.com/categories/Linux/)

软件统一放在`/usr/software`下 解压后放在单独的文件夹下`/usr/local/java`/`/usr/local/mysql`

## 1.JDK

安装包下载`jdk-8u191-linux-x64.tar.gz ` 注意32位和64位的别下载错了。

命令`uname -a` 查看Linux系统位数。

网址：`https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html`

1.首先将压缩包传到虚拟机。放在`/usr/software`下

2.然后解压文件`tar zxvf jdk-8u191-linux-x64.tar.gz` 按tab会自动补全。

3.将解压得到的文件移动到`/usr/local/java`,命令`mv jdk1.8.0_191/ /usr/local/jdk8

4.配置环境变量 

 命令`vim /etc/profile` 

添加以下内容

```xml
　export JAVA_HOME=/usr/local/jdk8/
　export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar
　export PATH=$PATH:$JAVA_HOME/bin
```

5.解析该文件 命令`source /etc/profile`

6.测试 命令 `java -version` 输出版本信息就说明配好了。

## 2.Tomcat

安装包下载`apache-tomcat-8.5.37.tar.gz`

网址`https://tomcat.apache.org/download-80.cgi`

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/software-install/tomcat8-down.png)

1.压缩包上传到虚拟机`/usr/software目录下`

2.解压文件 `tar zxvf apache-tomcat-8.5.37.tar.gz `

3.将解压后的文件移动到`/usr/local/tomcat`,命令`mv apache-tomcat-8.5.37 /usr/local/tomcat`

4.配置环境变量 

 命令`vim /etc/profile` 

添加以下内容

```xml
export TOMCAT_HOME=/usr/local/tomcat
export CATANILA_HOME=/usr/local/tomcat
```

5.解析该文件 命令`source /etc/profile`

