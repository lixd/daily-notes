

## 1.克隆远程项目

参考这里

```shell
https://backlog.com/git-tutorial/cn/reference/log.html
```



```java


git clone git@github.com:lillusory/ssm-crm.git

//进入仓库文件夹

cd D:\lillusory\MyProject\lillusory.github.io

关联本地库和GitHub远程库

先移除原有的关联

git remote rm origin 

再添加新的

git remote add origin git@github.com:lillusory/lillusory.github.io.git

git remote add origin git@github.com:lillusory/ssm-crm.git

将本地文件添加到本地缓存库和提交到本地分支

git add .

git commit -m "edit post"

//提交

git push -u origin master

//将远程仓库的拉到本地

git pull origin master
```

## 2.配置信息

```java

修改图片位置

仓库中的位置：https://github.com/lillusory/lillusory.github.io/blob/master/images/posts/java/java-base-learning-one.jpg

将blob改为raw即可在markdown中显示

https://github.com/lillusory/lillusory.github.io/raw/master/images/posts/java/java-base-learning-one.jpg

配置用户名和邮箱

git config --global user.name "lillusory"

git config --global user.email "xueduanli@163.com"

查看配置的信息

git config -l

最后分享一些Github常用的命令：

切换分支：git checkout name

撤销修改：git checkout -- file

删除文件：git rm file

查看状态：git status

添加记录：git add file 或 git add .

添加描述：git commit -m "miao shu nei rong"

同步数据：git pull

提交数据：git push origin name

分支操作

查看分支：git branch

创建分支：git branch name

切换分支：git checkout name

创建+切换分支：git checkout -b name

合并某分支到当前分支：git merge name

删除分支：git branch -d name

删除远程分支：git push origin :name

```

## 3.切换分支操作

```java
1. 创建项目后默认在master分支 即主分支 应保证该分支代码永远是正确的，可运行的
2.开发时一般会根据功能创建多个分支 
//git branch XXX 创建分支XXX git checkout XXX 切换到分支XXX
//或者git checkout -b XXX 创建并切换到分支XXX
3.开发完后进行合并 merge 切换到master分支 git merge XXX 把XXX分支合并到当前分支（即master分支）
4.合并完成后即可删除开发时创建的分支 git branch -d XXX 删除分支XXX
```



## 4.常用命令

#### 1、新建代码库

```
# 在当前目录新建一个Git代码库
 git init
# 新建一个目录，将其初始化为Git代码库
git init [project-name]
# 下载一个项目和它的整个代码历史
git clone [url]
```

####    2、查看文件状态

```
#查看指定文件状态
git status [filename]
#查看所有文件状态
git status
```

####     3、工作区<-->暂存区

```
# 添加指定文件到暂存区
git add [file1] [file2] ...
# 添加指定目录到暂存区，包括子目录
git add [dir]
# 添加当前目录的所有文件到暂存区
git add .
#当我们需要删除暂存区或分支上的文件, 同时工作区也不需要这个文件了, 可以使用（??）
git rm file_path
#当我们需要删除暂存区或分支上的文件, 但本地又需要使用, 这个时候直接push那边这个文件就没有，如果push之前重新add那么还是会有。
git rm --cached file_path
#直接加文件名   从暂存区将文件恢复到工作区，如果工作区已经有该文件，则会选择覆盖
#加了【分支名】 +文件名  则表示从分支名为所写的分支名中拉取文件 并覆盖工作区里的文件
git checkout
```

####     4、工作区<-->资源库（版本库）

```
#将暂存区-->资源库（版本库）
git commit -m '该次提交说明'
#如果出现:将不必要的文件commit 或者 上次提交觉得是错的  或者 不想改变暂存区内容，只是想调整提交的信息
#移除不必要的添加到暂存区的文件
git reset HEAD 文件名
#去掉上一次的提交（会直接变成add之前状态）   
git reset HEAD^ 
#去掉上一次的提交（变成add之后，commit之前状态） 
git reset --soft  HEAD^ 
```

####     5、远程操作

```
# 取回远程仓库的变化，并与本地分支合并
git pull
# 上传本地指定分支到远程仓库
git push
```

####    6、其它常用命令

```
# 显示当前的Git配置
git config --list
# 编辑Git配置文件
git config -e [--global]
#初次commit之前，需要配置用户邮箱及用户名，使用以下命令：
git config --global user.email "you@example.com"
git config --global user.name "Your Name"
#调出Git的帮助文档
git --help
#查看某个具体命令的帮助文档
git +命令 --help
#查看git的版本
git --version
```
