---
title: "Git系列(二)---常用命令"
description: "Git基本使用和常用命令"
date: 2018-08-06 12:00:00
draft: false
categories: ["Git"]
tags: ["Git"]
---

本文主要记录了Git常用的一些命令，和Git基本使用教学，包括了版本库的创建、代码提交、推送、拉取、版本回退、撤销等操作。

<!--more-->

> 更多文章欢迎访问我的个人博客-->[幻境云图](https://www.lixueduan.com/)

## 1. 简介

### 1.1 Git简介

`Git`(读音为/gɪt/。)是一个开源的分布式版本控制系统。

可以有效、高速地处理从很小到非常大的项目版本管理。`Git` 是 `Linus Torvalds` 为了帮助管理 `Linux` 内核开发而开发的一个开放源码的版本控制软件。

### 1.2 Git工作区概念

Git本地有四个工作区域：

* 工作目录(Working Directory)
* 暂存区(Stage/Index)
* 版本库(Repository或Commit History)
* 远程仓库(Remote Directory)



文件在这四个区域之间的转换关系如下：

![](https://github.com/lixd/blog/raw/master/images/git/git-work-tree.png)

- **Working Directory**： 工作区，就是你平时存放项目代码的地方，大概就是一个文件夹。
- **Index / Stage**： 暂存区，用于临时存放你的改动，事实上它只是一个文件，保存即将提交到文件列表信息
- **Repository**： 仓库区（或版本库），就是安全存放数据的位置，这里面有你提交到所有版本的数据。其中HEAD指向最新放入仓库的版本
- **Remote**： 远程仓库，托管代码的服务器，可以简单的认为是你项目组中的一台电脑用于远程数据交换

### 1.3 工作流程

git的工作流程一般是这样的：

* 1) 在工作目录中添加、修改文件；

* 2) 将需要进行版本管理的文件放入暂存区域；

* 3) 将暂存区域的文件提交到git仓库。

因此，git管理的文件有三种状态：`已修改(modified)`,`已暂存(staged)`,`已提交(committed)`。

### 1.4 文件的四种状态

版本控制就是对文件的版本控制，要对文件进行修改、提交等操作，首先要知道文件当前在什么状态，不然可能会提交了现在还不想提交的文件，或者要提交的文件没提交上。

`Git`不关心文件两个版本之间的具体差别，而是关心文件的整体是否有改变，若文件被改变，在添加提交时就生成文件新版本的快照，而判断文件整体是否改变的方法就是用。



SHA-1算法计算文件的校验和。

![img](https://github.com/lixd/blog/raw/master/images/git/git-file-status.png)

**Untracked:**   未跟踪, 此文件在文件夹中, 但并没有加入到git库, 不参与版本控制. 通过git add 状态变为Staged。

 **Unmodify:**   文件已经入库, 未修改, 即版本库中的文件快照内容与文件夹中完全一致. 这种类型的文件有两种去处, 如果它被修改, 而变为Modified。如果使用git rm移出版本库, 则成为Untracked文件

  **Modified:** 文件已修改, 仅仅是修改, 并没有进行其他的操作. 这个文件也有两个去处, 通过git add可进入暂存staged状态, 使用git checkout 则丢弃修改过,返回到unmodify状态, 这个git checkout即从库中取出文件, 覆盖当前修改

**Staged:** 暂存状态. 执行git commit则将修改同步到库中, 这时库中的文件和本地文件又变为一致, 文件为Unmodify状态. 执行git reset HEAD filename取消暂存,文件状态为Modified。

 下面的图很好的解释了这四种状态的转变：

![img](https://github.com/lixd/blog/raw/master/images/git/git-status-change.png)

> 新建文件后 --->Untracked
>
> 使用add命令将新建的文件加入到暂存区--->Staged
>
> 使用commit命令将暂存区的文件提交到本地仓库--->Unmodified
>
> 如果对Unmodified状态的文件进行修改---> modified
>
> 如果对Unmodified状态的文件进行remove操作--->Untracked



## 2. 使用

基本配置在上一章写了这里就略过了。

### 2.1 创建git仓库

创建git仓库包含两种方式：

* 1) git init：本地创建后推送到远程服务器
* 2) git clone：远程服务器创建后克隆到本地

效果都是一样的。

#### git init

用 `git init` 在目录中创建新的 Git 仓库。 你可以在任何时候、任何目录中这么做，完全是本地化的。

执行后会在当前文件夹中多出一个`.git`文件夹，Git相关信息都在里面。

> .git文件夹是隐藏的 如果看不到需要调整系统设置让其显示隐藏文件夹

```shell
$ git init
Initialized empty Git repository in C:/Users/13452/Desktop/gitte/.git/
```

#### git clone

当然，也可以在远程服务器上拉取代码，拷贝一个 Git 仓库到本地

```shell
git clone [url]
# 例如
git@github.com:lixd/daily-notes.git  
```

### 2.2 代码提交

假如已经通过`git clone`从远程服务器上拉取了一下`git`仓库到本地了。

然后在本地进行了一些编辑，比如:新增了一个`test.txt`文件

#### git status

可以通过`git status` 查看当前文件的状态

由于是新增的文件，还未加入 git 追踪，所以当前`test.txt`为`Untracked`状态

```shell
$ git status
On branch master
No commits yet
Untracked files:
  (use "git add <file>..." to include in what will be committed)
        test.txt
nothing added to commit but untracked files present (use "git add" to track)
```

#### git add

在本地(`Working Directory`)将文件修改完成后使用`git add`命令可将该文件添加到暂存区 (`Index`)

```shell
# 添加单个文件
git add filename
# 添加所有文件
git add .

# 将test.txt文件添加到Index
git add test.txt   
```

#### git commit

使用 `git add `命令是将已经更新的内容写入缓存区， 而执行` git commit `将缓存区内容提交到本地仓库中(`Repository`)。

```shell
# 提交Index中的文件 执行后会进入写注释的界面
git commit 
# 提交时直接写注释
git commit -m"注释"

# 例如提交test.txt文件
git commit -m"新增test.txt文件"
```

#### git push

在执行` git commit `将缓存区内容添加到本地仓库中后，可以使用`git push`将本地的修改推送到服务器上的远程仓库中，这样其他人就可以同步了。

```shell
git push [主机名] [分支名]
# 推送到origin主机的master分支 其中origin是默认的主机名
git push origin master  
```

#### git pull

在其他人提交代码后，可以通过`git pull`命令拉取服务器代码到本地。

```shell
git pull [主机名] [分支名]
# 拉取origin主机的master分支最新代码 其中默认的主机名是origin  
git pull origin master 
# 直接git pull 则会拉取当前分支最新代码
```



## 3. 进阶操作

学会前面的几个操作基本就能满足日常的使用了(如果不出意外的话)。

### 3.1 分支操作

创建项目后默认在`master`分支, 即主分支。

**应保证master分支代码永远是正确的，稳定的，可运行的**

所以正常开发是不会直接在`master`分支上修改的。

#### 创建分支

实际开发时一般会根据功能创建多个分支，或者每个开发者创建一个自己的分支。

```shell
# 创建分支branchName
git branch branchName 
# 切换到分支branchName
git checkout branchName
# 创建并切换到分支branchName
git checkout -b branchName

# 例如创建一个dev分支
git branch dev
git checkout dev
# 或者用下面这句 二者是等效的
git checkout -b dev
```

#### 合并(merge)分支

在新建的分支开发完后需要进行合并，将新的功能代码合并搭到`master`分支，当然也可以合并到任意分支。

```shell
# 会把branchName分支合并到`当前`分支
git merge branchName

# 例如dev分支开发完成 合并到master分支
git checkout master
gir merge dev
```

一般情况下并不会直接合并到master分支，而是先pull最新的master分支合并到自己的分支，然后没问题了在合并到master分支。

完整流程如下:

```sh
#1 创建功能分支
(master) git checkout -b feature
#2 功能迭代
(feature) git commit ...
#3 合并最新主分支代码
(feature) git checkout master
(master) git pull
(master) git checkout feature
(feature) git merge master
# 解决冲突(如果有的话)
#4 review，修改代码 再次提交
(feature) git commit
#5 没问题后再次合并到主分支
(feature) git checkout master
# --squash参数可加可不加 具体作用现在先不用管
(master) git merge feature --squash
(master) git commit #
# 推送到远端，正常结束
(master) git push origin #
#6 如果上一步被拒绝，是因为master有更新的代码入库了，为了防止master上出现分线，需要重新执行第5步
```



#### 删除分支

合并完成后即可删除开发时创建的分支。

```shell
# 删除分支branchName d->delete
git branch -d branchName
# 例如删除前面的功能分支
git branch -d feature
```

### 3.2 其他操作

#### git diff

执行`git diff`命令来查看文件与之前的区别。

```shell
# 查看本地工作区和index区域的文件的区别
git diff 
# 查看Index区域与Repository区域的区别
git diff --cached 
# 查看所有文件与本地仓库的区别
git diff HEAD
# 只显示摘要而不是全部显示
git diff --stat
```

#### git reset

撤销命令，git中比较重要的命令之一了。

```shell
git reset [恢复等级] [commitId]
```

##### soft/mixed/hard

`git reset`有三个参数，可以看做是三个恢复等级。

`git reset –soft ` 仅仅将`commit`回退到了指定的提交 ，只修改`Repository`区域
`git reset –mixed `用指定的`commit`覆盖`Repository`区域和`Index区`，之前所有暂存的内容都变为未暂存的状态 (`默认为该参数`)

`git reset –hard `使用指定的commit的内容覆盖`Repository`区域、`Index区`和`工作区`。(**危险！！！ 此操作会丢弃工作区所做的修改！需谨慎！！！**)

具体如图：

![](git-reset-info.png)



##### commidID

表示将要恢复到哪个版本。有如下几种表示法

**HEAD**:表示当前最新的一次提交,`(HEAD^)`表示倒数第二次提交,`(HEAD^^)`表示倒数第三次提交，倒数第100次提交则是`HEAD^^...^^^` 100个`^`,当然不会这么傻，还有另外一种写法`HEAD~100` 就是倒数第100次了。

当然还可以使用具体的`commitID`: 

使用`git log`可以查看到提交历史，其中就包含了`commitID`

```shell
$ git log 
////这个是最新的一次提交的commitId
commit 06f1cd144f57c38d6fdbed07616af8ed5d69a9ea(HEAD -> hexo, origin/hexo, origin/HEAD)
Author: lillusory <xueduanli@163.com>
Date:   Sat Feb 16 17:51:18 2019 +0800

    添加Git工作区概念详解

commit 8f8908ff3edbba0d24d7eee7682e09d002faee6f   //这个就是commitId
Author: lillusory <xueduanli@163.com>
Date:   Fri Feb 15 19:10:06 2019 +0800

    fix建造者模式两种写法

commit 71a44acd12d427f694f554df1d2f26ad59df5978 //这个就是commitId
Author: lillusory <xueduanli@163.com>
Date:   Fri Feb 15 00:31:33 2019 +0800

    fix 单例模式+Git 常用命令

commit 099675715979832baa107f9da080bfd38d3d63e0 //这个就是commitId
Author: lillusory <xueduanli@163.com>
Date:   Thu Feb 14 23:26:10 2019 +0800

```

所以`git reset`有多种写法

```shell
git reset HEAD   //Repository和Index恢复到最后一次提交的状态 不影响工作区
git reset HEAD test.txt //只恢复test.txt 文件
git reset --soft HEAD  //Repository恢复到最后一次提交的状态
git reset --hard HEAD  //Repository、Index和工作区都恢复到最后一次提交的状态 丢弃工作区所有内容
git reset 099675715979832baa107f9da080bfd38d3d63e0  //恢复到commitID版本 一般不用写完整的commitid 写前几位git就可以分辨出来了
```

#### git reflog

前面的`git reset`可以恢复到各个版本，但是若恢复到前面的版本了，那么在使用`git log`查看是就找不到后面的提交了，想要恢复到后面的版本时就可以使用`git reflog`查看，该命令可以看到所有的版本改动信息。

```shell
$ git log
commit 86a08a6fbacffcf93f7b4dd94be4a21ca31682c4 (HEAD -> master)
Author: lillusory <xueduanli@163.com>
Date:   Sat Feb 16 18:29:48 2019 +0800

    新增test.txt
    
$ git reflog
86a08a6 HEAD@{1}: reset: moving to HEAD^
b9802c7 (HEAD -> master) HEAD@{2}: commit: 添加内容1111
86a08a6 HEAD@{3}: commit (initial): 新增test.txt
```




## 3. 常用命令

```shell
# 新建仓库
git init
git clone [url]

# 代码提交
git add <filename>
git commit -m"注释"
git push 

# 版本恢复
git reset

# 代码拉取
git pull

# 分支操作
git branch <branchName>
git checkout <branchName>
git merge <branchName>

# 信息查看
git status
git log
git reflog
git config -l
```

最后附上一张网上找到的`Git常用命令速查表`

![](https://github.com/lixd/blog/raw/master/images/git/git-comand-fast-select.png)

## 4. 参考

`http://www.runoob.com/git/git-basic-operations.html`

`https://www.cnblogs.com/qdhxhz/p/9757390.html`