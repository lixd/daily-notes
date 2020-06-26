---
title: "Git系列(四)---Git 仓库瘦身"
description: "Git 仓库瘦身方案及 Git 仓库膨胀原理"
date: 2020-06-25 22:00:00
draft: false
categories: ["Git"]
tags: ["Git"]
---

本文主要记录了 如何给 Git 仓库瘦身和 Git 仓库膨胀的原理。

<!--more-->

# Git 仓库瘦身

## 1. 问题

> 曾经年少轻狂 啥都往 Git 仓库里放。
> 现在看着那高达1个G 的 仓库 后悔莫及呀。

最近发现一个仓库居然有 300M 这么大。

分析了下发现`.git`文件夹就有 290M。

每次 pull 的时候那叫一个慢呀，所以网上查了下如何给 git 仓库瘦身。

## 2. 解决方案

### 1. bfg 工具

通过`bfg`工具，永久删除 git 里的大文件

官网

```shell
https://rtyley.github.io/bfg-repo-cleaner
```

> 需要配一下 Java 运行环境



**第一步 通过 mirror 方式 clone 仓库**

```shell
git clone --mirror git://example.com/some-big-repo.git
```

**第二步 清理大文件**

```shell
# 100M 表示清除大于 100M 的文件 可调
java -jar bfg.jar --strip-blobs-bigger-than 100M some-big-repo.git
```

如果知道文件名 也可以清除指定文件

> 比如清除 password.txt 

```shell
bfg --replace-text password.txt  my-repo.git
```

**第三步 清除缓存数据**

```shell
cd some-big-repo.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

**第四步 推送到远端**

```shell
git push
```

**如果仓库里有 commit 来自 pull request 的话 push 这里会报如下错误**

>  ! [remote rejected] refs/pull/1/head -> refs/pull/1/head (deny updating a hidden ref)

暂时没找到解决方案，只能使用方案二或方案三了。



### 2. clear history

如果前面方案一 最后一步出错的话可以试一下方案二或方案三。

> 注意：**以下操作会直接清除掉所有提交历史**



**首先移除 `.git`文件夹**

```shell
rm -rf .git
```

**接着重新 init 并提交**

```shell
git init
git add .
git commit -m "Initial commit"
```

**最后设置 remote 并 push**

```shell
git remote add origin git@github.com:<YOUR ACCOUNT>/<YOUR REPOS>.git
git push -u --force origin master
```



具体看这里

```shell
https://gist.github.com/stephenhardy/5470814
```



### 3. 手动移除

如果前两种方案就不满意的话，这里还有第三种方案。

> 手动删除大文件

**首先先找出git中最大的文件**

```shell
git verify-pack -v .git/objects/pack/pack-*.idx | sort -k 3 -g | tail -5
```

结果大概是这样的

```shell
$ git verify-pack -v .git/objects/pack/pack-*.idx | sort -k 3 -g | tail -5
494580d30b106e7f5bf27bf7deed5af33fc80e00 blob   42314931 18206133 368694903
91bc73a5400c80bf6bd6de6544b420d2f55d2a99 blob   43997239 18921853 290304930
2c73a462bb20affe462c36eaf65cc2d2188a82f6 blob   55561789 21433258 182854804
aa5923eb2531825e4fa38c50385389bef31f1cc0 blob   60930637 28939719 2565863
b5f530aca5c7e76563ddf6458199303220e67ee3 blob   80517316 25578808 75067267

```

> 第一列为文件 id。 第二列为文件类型，第三列则是文件大小(单位字节)。
>
> 可以看到 最大的一个文件是 80M。

**接着根据 id 查询文件名**

```shell
git rev-list --objects --all | grep id
```

例如

```shell
$ git rev-list --objects --all | grep b5f530aca5c7e76563ddf6458199303220e67ee3
b5f530aca5c7e76563ddf6458199303220e67ee3 server/admin/admin
```

可以看到 这个最大的 80M 的文件居然是编译后的二进制文件。

**删除文件**

查看名字后 如果觉得没问题就可以开始删除文件了。

```shell
git filter-branch --force --prune-empty --index-filter 'git rm -rf --cached --ignore-unmatch filename' --tag-name-filter cat -- --all
```

比如要删除上面那个二进制文件

```shell
git filter-branch --force --prune-empty --index-filter 'git rm -rf --cached --ignore-unmatch server/admin/admin' --tag-name-filter cat -- --all
```



**最后 push**

```shell
git push --force --all
```

## 3. 分析

为什么`.git/objects/pack`文件夹会变得非常大？

首先看一下  Git 目录结构

```shell
├── HEAD
├── branches
├── index
├── config
├── description
├── hooks/
├── logs/
│   ├── HEAD
│   └── refs
│       └── heads
│           └── master
├── objects/
│   ├── 88
│   │   └── 23efd7fa394844ef4af3c649823fa4aedefec5
│   ├── 91
│   │   └── 0fc16f5cc5a91e6712c33aed4aad2cfffccb73
│   ├── 9f
│   │   └── 4d96d5b00d98959ea9960f069585ce42b1349a
│   ├── info
│   └── pack
└── refs/
    ├── heads
    │   └── master
    └── tags
```

具体如下

* `hooks/` 钩子 存放一些 shell 脚本
* `info/` 仓库信息
* `logs/` 保存所有更新的引用记录
* `objects/` 存放所有的 Git 对象
* `refs/` 目录下有 heads 和 tags 两个目录，heads 存放最新一次提交的哈希值
* `COMMIT_EDITMSG` 最新提交的一次提交注释（git commit -m “……”。即commit提交时引号里的注释），git系统不会用到，给用户一个参考
* `description` 仓库的描述信息，主要给gitweb等git托管系统使用
* `config` Git 仓库配置文件
* `index` 暂存区
* `HEAD`记录了一个路径，映射到ref引用，能够找到下一次commit的前一次哈希值



每次 `git add`都会生成一个**blob 对象**，存放在objects 目录下。
**这个blob 对象里保存的是什么呢?**
Git在 add 文件时，会把文件完整的保存成一个新的 blob 对象。通过 `git gc` 打包或者每次`git push`的时候 Git 都会自动执行一次打包过程，将 Blob 对象`合并`成一个包文并生成一个索引文件。
索引文件中包含了每个 Blob 对象在包文件中的偏移信息，Git 在打包的过程中使用了`增量编码`方案，只保存 Blob 对象的不同版本之间的差异，这使得仓库会瘦身。

**既然Git会对Blob对象进行合并优化，那么objects文件夹为什么还会那么大呢?**

因为当 Blob 对象在合并时**不能对 .a 进行差异化比较**，所以每次在添加 .a 文件时，都会保存一份 .a文件，用于后续代码还原时使用。

所以当频繁更换 .a 文件时，objects下的 pack 文件会越来越大。
> **虽然这个 .a 文件后续可能用不到删除了，但是pack中的这个 .a 文件的缓存还是会一直存在。**
>
> 这就是为什么 `.git` 文件夹有时候会变得超级大。

## 4. 小结

本文记录了 Git 仓库变大的现象及其原因，同时也提供了 3 种解决方案。

最后再次提醒

**千万不要在 git 仓库中存放会经常修改的那种 .a文件**

**千万不要在 git 仓库中存放会经常修改的那种 .a文件**

**千万不要在 git 仓库中存放会经常修改的那种 .a文件**

重要的话说三遍。

## 5. 参考

`https://rtyley.github.io/bfg-repo-cleaner`

`https://gist.github.com/stephenhardy/5470814`

`https://www.jianshu.com/p/4f2ccb48da77`

`https://blog.csdn.net/weixin_43897044/article/details/87260235`