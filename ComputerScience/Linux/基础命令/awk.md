# awk

[awk 从入门到放弃系列](https://www.zsythink.net/archives/tag/awk)



## 1. 什么是 awk

awk是一个报告生成器，它拥有强大的文本格式化的能力，这就是专业的说法。

awk是由Alfred Aho 、Peter Weinberger 和 Brian Kernighan这三个人创造的，awk由这个三个人的姓氏的首个字母组成。

awk其实是一门编程语言，它支持条件判断、数组、循环等功能。所以，我们也可以把awk理解成一个脚本语言解释器。

grep 、sed、awk被称为linux中的”三剑客”。

我们总结一下这三个”剑客”的特长。

grep 更适合单纯的查找或匹配文本

sed  更适合编辑匹配到的文本

awk  更适合格式化文本，对文本进行较复杂格式处理



## 2. 基础

### 语法

```bash
awk [options] ‘program’ file1 , file2
```

对于上述语法中的 program 来说，又可以细分成 pattern 和 action，也就是说，awk 的基本语法如下:

```bash
awk [options] ‘Pattern{Action}’ file1 file2
```



### Action

action 指的就是动作，awk 擅长文本格式化，并且将格式化以后的文本输出，所以 awk 最常用的动作就是 **print** 和 **printf**。



```bash
# 打印出 testfile 中的所有内容
awk '{print}' testfile
```



#### $number

在 awk 中，**${number} : 表示分割后第 number 列的数据**

* $1 第一列，$2 第二列 $5 则是第五列
* **$0**和 **$NF** 为内置变量，$0 表示显示整行 ，$NF表示当前行分割后的最后一列。
* 倒数第二行也可以用 **$(NF-1) ** 这种形式来表示。



打印第五列的语法如下：

```bash
df | awk '{print $5 }'
```



#### 分隔符

awk 中不指定分隔符时，**默认使用空格作为分隔符**，会自动将多个连续空格理解为一个分隔符。

awk默认以”**换行符**”为标记，识别每一行。



#### 字符串拼接

还可以将我们指定的字符与每一列进行拼接。

```bash
# 需要注意：$1 后面的逗号在 awk 中会当作空格打印出来
awk '{print "first name:" $1,"last name:" $2}'
```

需要注意的是：**$1这种内置变量的外侧不能加入双引号，否则$1会被当做文本输出**。

```bash
awk '{print "first name: $1,""last name: $2"}'
```

这样打印出的就是

```bash
first name: $1,last name: $2
```





### Pattern

AWK 普通模式比较多，先略过。

AWK 包含两种特殊的模式：BEGIN 和 END。

* BEGIN 模式指定了处理文本**之前**需要执行的操作
* END 模式指定了处理完所有行**之后**所需要执行的操作



#### BEGIN

```bash
awk 'BEGIN{print "aaa","bbb"}' testfile
```

表示在处理 testfile 之前先打印 aaa bbb,由于 BEGIN 是在处理文本前执行的，还没有到处理阶段，因此我们甚至可以不指定 testfile

```bash
awk 'BEGIN{print "aaa","bbb"}'
```

一样会打印出 aaa bbb



#### END

理解了 BEGIN 之后，END 也就是一样的。 

```bash
awk '{print $1 $2} END{print "ccc","ddd"}'
```

在内容后面输出一个 ccc ddd。



BEGIN 和 END 一起用可以做表头、表尾的输出。



```bash
$ cat tmp.txt 
admin root
$ cat tmp.txt |awk 'BEGIN{print "username","password"} {print $1,$2} END{print "username","password"}'
username password
admin root
username password
```



## 3. 输入输出分隔符

* 输入分隔符：field separator，简写 FS
* 输出分隔符: output field separator,简写 OFS

输入输出分隔符在 awk 中的内置变量名就是他们的缩写,FS 和 OFS。



### 输入分隔符

awk 默认使用**空格**作为输入分隔符，比如`A B`就会被分为 A 和 B 两部分。

可以使用`-F`手动指定输入分隔符，对于`A#B`这段内容，可以使用 `#`来分隔，

```BASH
echo 'A#B' | awk -F# '{print $1,$2}'
```

除了使用 -F 选项指定输入分隔符，还能够通过**设置内部变量**的方式，指定 awk 的输入分隔符。

awk 内置变量 FS 可以用于指定输入分隔符，但是在使用变量时，需要使用 -v 选项，用于指定对应的变量，比如 -v FS=’#’，

```BASH
echo 'A#B' | awk -v FS='#' '{print $1,$2}'
```



### 输出分隔符

输出分隔符默认也是**空格**。

例如

```BASH
$ echo 'A#B' | awk -F# '{print $1,$2}'
A B
```

我们的输出，$1,$2 是以空格进行分隔的。同样可以使用`-v OFS='{xxx}'` 来指定输出分隔符。

```bash
echo 'A#B' | awk -v FS='#' -v OFS='---' '{print $1,$2}'
A---B
```



awk ‘{print $1 $2}’ 表示每行分割后，将第一列（第一个字段）和第二列（第二个字段）**连接在一起输出**。

awk ‘{print $1,$2}’ 表示每行分割后，将第一列（第一个字段）和第二列（第二个字段）以**输出分隔符隔开**后显示。



## 4. 变量

对于 awk 来说”变量”又分为”内置变量” 和 “自定义变量” , “输入分隔符 FS”和”输出分隔符 OFS”都属于内置变量。

### 内置变量

awk 常用的内置变量以及其作用如下

 

* FS：输入字段分隔符， 默认为空白字符
* OFS：输出字段分隔符， 默认为空白字符
* RS：输入记录分隔符(输入换行符)， 指定输入时的换行符
* ORS：输出记录分隔符（输出换行符），输出时用指定符号代替换行符
* NF：number of Field，当前行的字段的个数(即当前行被分割成了几列)，字段数量
* NR：行号，当前处理的文本行的行号。
* FNR：各文件分别计数的行号
* FILENAME：当前文件名
* ARGC：命令行参数的个数
* ARGV：数组，保存的是命令行所给定的各参数





### 自定义变量

有两种方法可以自定义变量。

* 方法一：**-v varname=value**  变量名**区分大小写**。
* 方法二：在 program 中直接定义,但是注意，变量定义与动作之间需要用分号”;”隔开。



方法一

```bash
$ awk -v myVar="test var" BEGIN'{print myVar}'
test var
```



方法二

```bash
$ awk 'BEGIN{ myVar1="test var 1"; myVar2="test var 2"; print myVar1,myVar2}'
test var 1 test var 2
```





第一种方法虽然看上去比较麻烦，但是这种方法也有自己的优势

当我们需要在 awk 中引用 shell 中的变量的时候，则可以通过方法一间接的引用。

```bash
$ shellVar=123
$ awk -v myVar=$shellVar BEGIN'{print myVar}'
123
```



## 5. 格式化 printf

awk 的 printf 动作和 printf 命令类似，有以下注意点：

* 1）使用 printf 动作输出的文本不会换行，如果需要换行，可以在对应的”格式替换符”后加入”\n”进行转义。

* 2）使用 printf 动作时，”指定的格式” 与 “被格式化的文本” 之间，需要用”逗号”隔开。

* 3）使用 printf 动作时，”格式”中的”格式替换符”必须与 “被格式化的文本” 一一对应。



```bash
$ awk 'BEGIN{printf "%s\n%s\n",1,2}'
1
2
```



配合上 BGIN，就可以像表格一样输出，一个简单的例子：

```bash
[root@kc netns]# awk -v FS=":" 'BEGIN{printf "%-10s \t %s\n", "用户名","用户ID"} {printf "%-10s\t %s\n",$1,$3}' /etc/passwd
用户名           用户ID
root             0
bin              1
daemon           2
adm              3
lp               4
sync             5
shutdown         6
halt             7
mail             8
operator         11
games            12
ftp              14
nobody           99
systemd-network  192
dbus             81
polkitd          999
rpc              32
rpcuser          29
nfsnobody        65534
sshd             74
postfix          89
chrony           998
tcpdump          72
centos           1000
```





## 6.模式

awk 中的模式可以理解为**条件**。

awk 是逐行处理文本的，也就是说，awk 会先处理完当前行，再处理下一行。

* 如果我们不指定任何”条件”，awk会一行一行的处理文本中的每一行；
* 如果我们指定了”条件”，只有满足”条件”的行才会被处理，不满足”条件”的行就不会被处理。

这其实就是awk中的”模式”。

awk 中包括多种默认

* 空模式：即没有指定模式
* 关系运算模式：支持 >、>=、<、==、!=、~、!~ 等关系运算符
* 特殊模式：BEGIN、END 为特殊模式
* 正则模式
* 行范围模式



### 关系运算模式

```bash
$ echo  'abc 123
bac 234 333
' >> test

# NF==2 表示只有两列，所以只有第一行会被打印出来
$ awk 'NF==2 {print $0}' test
abc 123

# $1==bac 第一列值为bac才会被打印出来，因此只有第二列
$ awk '$1=="bac" {print $0}' test
bac 234 333
```





### 正则模式

**正则模式即使用正则表达式作为条件。**

```BASH
awk '/正则表达式/{print $0}'
```

awk 中把正则表达式用`//`框起来了。

使用 grep 可以很方便的找到使用 /bin/bash 的用户

```BASH
[root@kc netns]# grep /bin/bash$ /etc/passwd
root:x:0:0:root:/root:/bin/bash
centos:x:1000:1000:Cloud User:/home/centos:/bin/bash
```

同样的，也可以使用 awk 实现

```bash
[root@kc netns]# awk '//bin/bash$/{print $0}' /etc/passwd
awk: cmd. line:1: //bin/bash$/{print $0}
awk: cmd. line:1:             ^ unterminated regexp
```

直接报错了，在 awk 中需要对 / 进行转义

```bash
[root@kc netns]# awk '/\/bin\/bash$/{print $0}' /etc/passwd
root:x:0:0:root:/root:/bin/bash
centos:x:1000:1000:Cloud User:/home/centos:/bin/bash
```



需要注意的是：

* 1）当在 awk 命令中的正则用法属于”扩展正则表达式”。
* 2）当使用 {x,y} 这种次数匹配的正则表达式时，需要配合 –posix 选项或者 –re-interval 选 项。





### 行范围模式



