# find

## 1. 概述

 Linux find命令用来在指定目录下查找文件。 

## 2. 语法

```shell
find   path   -option   [   -print ]   [ -exec   -ok   command ]   {} \;
```

 **exec是以分号`;`作为结束标识符**，考虑到各个系统平台对分号的不同解释，我们在分号前再加个反斜杠，便于移植。

而在分号前，通常也会有一对**花括号`{}`，代表前面find命令查找出来的文件**。 

```sh
$ find . -name "*.c" -exec ls -l {} \;
```

 在这里，我们用find 命令匹配到了当前目录下的所有.c文件，并在 -exec 选项中使用 ls -l 命令将它们的详细信息列出来。 

```sh
find . -name "*.c" -exec cp {} ./temp2 \;
```

 在这里，我们用find 命令匹配到了当前目录下的所有.c文件，并在 -exec 选项中使用cp命令将它们复制到`./temp2`目录。