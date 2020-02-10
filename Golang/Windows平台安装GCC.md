# Windows平台安装GCC

## 概述

`Windows`平台调试`GO`语言的时候出现如下错误

```sh
  exec: "gcc": executable file not found in %PATH%
```

提示需要安装`gcc`



## 下载

官网地址如下

```sh
https://sourceforge.net/projects/mingw-w64/files/
```



在线安装就下载这个`mingw-w64-install.exe`

```sh
https://sourceforge.net/projects/mingw-w64/files/Toolchains%20targetting%20Win32/Personal%20Builds/mingw-builds/installer/mingw-w64-install.exe
```

或者可以直接下载对应的压缩包

比如`x86_64-8.1.0-release-posix-seh-rt_v6-rev0.7z`

```sh
https://sourceforge.net/projects/mingw-w64/files/Toolchains%20targetting%20Win64/Personal%20Builds/mingw-builds/8.1.0/threads-posix/seh/x86_64-8.1.0-release-posix-seh-rt_v6-rev0.7z
```





如果不知道下载哪个的话一般就下载`x86_64-posix-seh`即可。

## 配置环境变量

下载之后解压配置一下环境变量

`此电脑-右键属性-高级系统设置-环境变量-系统变量-path`

```sh
key path
value D:\Program Files\GCC\x86_64-8.1.0-release-posix-seh-rt_v6-rev0\mingw64\bin
```



然后**重启电脑**,再次编译就没问题了。
