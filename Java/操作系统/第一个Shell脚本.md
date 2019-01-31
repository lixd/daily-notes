# 第一个Shell脚本

### 1.HelloWorld

(1)新建一个文件 helloworld.sh :`touch helloworld.sh`，扩展名为 sh（sh代表Shell）（扩展名并不影响脚本执行，见名知意就好，如果你用 php 写 shell 脚本，扩展名就用 php 好了）

(2) 使用 vim 命令修改helloworld.sh文件：`vim helloworld.sh`(vim 文件------>进入文件----->命令模式------>按i进入编辑模式----->编辑文件 ------->按Esc进入底行模式----->输入:wq/q! （输入wq代表写入内容并退出，即保存；输入q!代表强制退出不保存。）)

helloworld.sh 内容如下：

```shell
#!/bin/bash
#第一个shell小程序,echo 是linux中的输出命令。
echo  "helloworld!"
```

shell中 # 符号表示注释。**shell 的第一行比较特殊，一般都会以#!开始来指定使用的 shell 类型。在linux中，除了bash shell以外，还有很多版本的shell， 例如zsh、dash等等...不过bash shell还是我们使用最多的。**

(3)添加权限： `chmod +x helloworld.sh`  使hello.sh拥有可执行权限

(4) 运行脚本:`./helloworld.sh` 。（注意，一定要写成 `./helloworld.sh` ，而不是 `helloworld.sh` ，运行其它二进制的程序也一样，直接写 `helloworld.sh` ，linux 系统会去 PATH 里寻找有没有叫 test.sh 的，而只有 /bin, /sbin, /usr/bin，/usr/sbin 等在 PATH 里，你的当前目录通常不在 PATH 里，所以写成 `helloworld.sh` 是会找不到命令的，要用`./helloworld.sh` 告诉系统说，就在当前目录找。）

### 2.Shell 编程中的变量介绍

**Shell编程中一般分为三种变量：**

1. **我们自己定义的变量（自定义变量）:** 仅在当前 Shell 实例中有效，其他 Shell 启动的程序不能访问局部变量。
2. **Linux已定义的环境变量**（环境变量， 例如：$PATH, $HOME 等..., 这类变量我们可以直接使用），使用 `env` 命令可以查看所有的环境变量，而set命令既可以查看环境变量也可以查看自定义变量。
3. **Shell变量** ：Shell变量是由 Shell 程序设置的特殊变量。Shell 变量中有一部分是环境变量，有一部分是局部变量，这些变量保证了 Shell 的正常运行

**常用的环境变量:**

> PATH 决定了shell将到哪些目录中寻找命令或程序 HOME 当前用户主目录 HISTSIZE　历史记录数 LOGNAME 当前用户的登录名 HOSTNAME　指主机的名称 SHELL 当前用户Shell类型 LANGUGE 　语言相关的环境变量，多语言可以修改此环境变量 MAIL　当前用户的邮件存放目录 PS1　基本提示符，对于root用户是#，对于普通用户是$

**使用 Linux 已定义的环境变量：**

比如我们要看当前用户目录可以使用：`echo $HOME`命令；如果我们要看当前用户Shell类型 可以使用`echo $SHELL`命令。可以看出，使用方法非常简单。

**使用自己定义的变量：**

```shell
#!/bin/bash
#自定义变量hello
hello="hello world"
echo $hello
echo  "helloworld!"
```

**Shell 编程中的变量名的命名的注意事项：**

- 命名只能使用英文字母，数字和下划线，首个字符不能以数字开头，但是可以使用下划线（_）开头。
- 中间不能有空格，可以使用下划线（_）。
- 不能使用标点符号。
- 不能使用bash里的关键字（可用help命令查看保留关键字）。

### Shell 字符串入门

字符串是shell编程中最常用最有用的数据类型（除了数字和字符串，也没啥其它类型好用了），字符串可以用单引号，也可以用双引号。这点和Java中有所不同。

**单引号字符串：**

```shell
#!/bin/bash
name='Shell'
hello='Hello, I  am '$name'!'
echo $hello
```

输出内容：

```
Hello, I am Shell!
```

**双引号字符串：**

```shell
#!/bin/bash
name='Shell'
hello="Hello, I  am "$name"!"
echo $hello
```

输出内容：

```
Hello, I am Shell!
```

### Shell 字符串常见操作

**拼接字符串：**

```shell
#!/bin/bash
name="SnailClimb"
# 使用双引号拼接
greeting="hello, "$name" !"
greeting_1="hello, ${name} !"
echo $greeting  $greeting_1
# 使用单引号拼接
greeting_2='hello, '$name' !'
greeting_3='hello, ${name} !'
echo $greeting_2  $greeting_3
```

**获取字符串长度：**

```shell
#!/bin/bash
#获取字符串长度
name="SnailClimb"
# 第一种方式
echo ${#name} #输出 10
# 第二种方式
expr length "$name";
```

输出结果:

```
10
10
```

使用 expr 命令时，表达式中的运算符左右必须包含空格，如果不包含空格，将会输出表达式本身:

```
expr 5+6    // 直接输出 5+6
expr 5 + 6       // 输出 11
```

对于某些运算符，还需要我们使用符号""进行转义，否则就会提示语法错误。

```shell
expr 5 * 6       // 输出错误
expr 5 \* 6      // 输出30
```



```shell
#!/bin/bash
echo "hello shell"
name="illusoryCloud"
msg='hello i am '$name''
echo $msg
expr length "$msg"
len=${#name}
echo "len is "$len""
sum=`expr  5 \* 6`
echo "the sum is "$sum""                    
```

```xml
sum=`expr  5 \* 6`  将表达式的值赋给sum 必须加`` 不然会报错 键盘左上角 tab键上方
```

**截取子字符串:**

简单的字符串截取：

```shell
#从字符串第 1 个字符开始往后截取 10 个字符
str="SnailClimb is a great man"
echo ${str:0:10} #输出:SnailClimb
```

根据表达式截取：

```shell
#!bin/bash
#author:amau

var="http://www.runoob.com/linux/linux-shell-variable.html"

s1=${var%%t*}#h
s2=${var%t*}#http://www.runoob.com/linux/linux-shell-variable.h
s3=${var%%.*}#http://www
s4=${var#*/}#/www.runoob.com/linux/linux-shell-variable.html
s5=${var##*/}#linux-shell-variable.html
```

### Shell 数组

bash支持一维数组（不支持多维数组），并且没有限定数组的大小。我下面给了大家一个关于数组操作的 Shell 代码示例，通过该示例大家可以知道如何创建数组、获取数组长度、获取/删除特定位置的数组元素、删除整个数组以及遍历数组。

在 Shell 中，用`括号`来表示数组，数组元素用`空格`符号分割开。定义数组的一般形式为：

```
数组名=(值1 值2 ... 值n)
array_name=(1 2 3 4 5)
```

读取数组元素值的一般格式是：

```
${数组名[下标]}
valuen=${array_name[n]}
```

使用 **@** 符号可以获取数组中的所有元素，例如：

```shell
echo ${array_name[@]}
```

```shell
#!/bin/bash
array=(1 2 3 4 5);
# 获取数组长度
length=${#array[@]}
# 或者
length2=${#array[*]}
#输出数组长度
echo $length #输出：5
echo $length2 #输出：5
# 输出数组第三个元素
echo ${array[2]} #输出：3
unset array[1]# 删除下表为1的元素也就是删除第二个元素
for i in ${array[@]};do echo $i ;done # 遍历数组，输出： 1 3 4 5 
unset arr_number; # 删除数组中的所有元素
for i in ${array[@]};do echo $i ;done # 遍历数组，数组元素为空，没有任何输出内容
```

## Shell 注释

以 **#** 开头的行就是注释，会被解释器忽略

通过每一行加一个 **#** 号设置多行注释，像这样：

```
#--------------------------------------------
# 这是一个注释
# author：菜鸟教程
# site：www.runoob.com
# slogan：学的不仅是技术，更是梦想！
#--------------------------------------------
##### 用户配置区 开始 #####
#
#
# 这里可以添加脚本描述信息
# 
#
##### 用户配置区 结束  #####
```

如果在开发过程中，遇到大段的代码需要临时注释起来，过一会儿又取消注释，怎么办呢？

每一行加个#符号太费力了，可以把这一段要注释的代码用一对花括号括起来，定义成一个函数，没有地方调用这个函数，这块代码就不会执行，达到了和注释一样的效果。

### 多行注释

多行注释还可以使用以下格式：

```shell
:<<EOF
注释内容...
注释内容...
注释内容...
EOF
```

EOF 也可以使用其他符号:

```shell
:<<'
注释内容...
注释内容...
注释内容...
'

:<<!
注释内容...
注释内容...
注释内容...
!
```