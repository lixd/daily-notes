# grep

[grep命令详解](https://www.zsythink.net/archives/1733)

## 1. 概述

grep 的全称为： Global search Regular Expression and Print out the line，即利用正则表达式进行全局搜索。

grep：支持基本正则表达式

egrep：支持扩展正则表达式，相当于grep -E

fgrep：不支持正则表达式，只能匹配写死的字符串，但是速度奇快，效率高，fastgrep



```bash
grep xxx testfile
cat testfile | grep xxx
```





## 2. 常用参数



* –color=auto 或者 –color：表示对匹配到的文本着色显示
  * centos 7 下 grep 设置了 alias，alias grep='grep --color=auto'

* **-i**：在搜索的时候忽略大小写
* **-n**：显示结果所在行号
* -c：统计匹配到的行数
  * 注意，是匹配到的总行数，不是匹配到的次数
* -o：只显示符合条件的字符串
  * 但是不整行显示，每个符合条件的字符串单独显示一行
* **-v**：输出不带关键字的行（反向查询，反向匹配）
* -w：匹配整个单词，如果是字符串中包含这个单词，则不作匹配
* -A {number}：在输出的时候包含结果所在行**之后**的指定行数
  * A：after 的意思
  * grep -A 1：输出是包括匹配行之前的 1 行
* -B {number}：在输出的时候包含结果所在行**之前**的指定行数
  * B：before 的意思
* **-C {number}**：在输出的时候包含结果所在行**之前和之后**的指定行数
  * C：context 的意思
* -e：实现多个选项的匹配，逻辑or关系
* -q：静默模式，不输出任何信息，当我们只关心有没有匹配到，却不关心匹配到什么内容时，我们可以使用此命令，然后，使用”echo $?”查看是否匹配到，0表示匹配到，1表示没有匹配到。
* -P：表示使用兼容 perl 的正则引擎。
* -E：使用扩展正则表达式，而不是基本正则表达式，在使用”-E”选项时，相当于使用egrep。