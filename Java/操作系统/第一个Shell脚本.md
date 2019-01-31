# 第一个Shell脚本

(1)新建一个文件 helloworld.sh :`touch helloworld.sh`，扩展名为 sh（sh代表Shell）（扩展名并不影响脚本执行，见名知意就好，如果你用 php 写 shell 脚本，扩展名就用 php 好了）

(2) 使用 vim 命令修改helloworld.sh文件：`vim helloworld.sh`(vim 文件------>进入文件----->命令模式------>按i进入编辑模式----->编辑文件 ------->按Esc进入底行模式----->输入:wq/q! （输入wq代表写入内容并退出，即保存；输入q!代表强制退出不保存。）)

helloworld.sh 内容如下：

```
#!/bin/bash
#第一个shell小程序,echo 是linux中的输出命令。
echo  "helloworld!"
```

shell中 # 符号表示注释。**shell 的第一行比较特殊，一般都会以#!开始来指定使用的 shell 类型。在linux中，除了bash shell以外，还有很多版本的shell， 例如zsh、dash等等...不过bash shell还是我们使用最多的。**

(3)添加权限： `chmod +x helloworld.sh`  使hello.sh拥有可执行权限

(4) 运行脚本:`./helloworld.sh` 。（注意，一定要写成 `./helloworld.sh` ，而不是 `helloworld.sh` ，运行其它二进制的程序也一样，直接写 `helloworld.sh` ，linux 系统会去 PATH 里寻找有没有叫 test.sh 的，而只有 /bin, /sbin, /usr/bin，/usr/sbin 等在 PATH 里，你的当前目录通常不在 PATH 里，所以写成 `helloworld.sh` 是会找不到命令的，要用`./helloworld.sh` 告诉系统说，就在当前目录找。）