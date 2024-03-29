# cat
cat 命令的用途是连接文件或标准输入并打印。这个命令常用来显示文件内容，或者将几个文件连接起来显示，或者从标准输入读取内容并显示，它常与重定向符号配合使用。



## 语法

语法：cat [选项] [文件 ...]

共有一下几个选项：

* -b：显示行号
* -e：显示非打印字符，并在每行后面增加一个 `$`。
  * 等价于 -vE
* -l：设置一个排它锁
  * 应该是加上之后同时只能执行一个 cat 命令
* -n：输出中带上行号
  * 和 -b 的区别在于，-b 只是显示，-n 是把行号添加到内容中
  * -n 之后的结果输出到新的文件，内容中也会有行号
* -s：连续两行以上的空白行，就代换为一行的空白行
* -t：显示非打印字符，并将制表符显示为 `^I`
* -u：禁用输出缓冲
* -v：显示非打印字符



## 主要功能

**cat主要有三大功能：**

* 1）一次显示整个文件：cat filename
* 2）从键盘创建一个文件：cat > filename 只能创建新文件,不能编辑已有文件
* 3）将几个文件合并为一个文件：cat file1 file2 > file3





### 显示文件内容

```bash
$ cat tmp.txt
hello world
```



### 从键盘创建一个文件

```bash
# 以 ctrl+z 命令结束
$ cat  >  filename
# 以 EOF 为结束标记
$ cat  >  filename << EOF
```



```bash
$ tmp cat  >  t1
123
456
^Z
[2]  + 11415 suspended  cat > t1
$ cat t1
123
456
```



```bash
$ cat > t2 << EOF
heredoc> 123
heredoc> 456
heredoc> EOF 
$ cat t2
123
456
```



### 合并文件

```bash
cat file1 file2 > file3
$ cat t1 t2 > t3

# t3 同时包含了 t1 t2 的内容
$ cat t3
123
456
123
456
```

