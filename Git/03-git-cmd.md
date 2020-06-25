---
title: "Git系列()---配置及SSH key"
description: "Git 配置及SSH key过程记录"
date: 2018-07-01 12:00:00
draft: true
categories: ["Git"]
tags: ["Git"]
---

Git 常用命令。

<!--more-->

## 1. 常用命令

### 1. 配置

```shell
# 用户名 邮箱
git config --global user.name "your_name" 
git config --global user.email "your_email@domain.com"
# 查看
git config --list --global

# --local 当前仓库
# --global 当前用户所有仓库
# --system 当前系统所有用户
```



```shell
# 重命名文件
git mv oldName newName
```



### 2. log

```shell
git log --oneline

# --oneline 简洁显示
# -nX 只显示 X 行 如 git log -n5 只显示 5 条
# --all 查看所有分支 log 默认只查看当前分支
# --graph 图形化
# branchName 指定查看某个分支 log e.g. git log dev 查看 dev分支 log
```



```shell
git cat-file commitId
# -p 查看内容
# -t 查看类型
# 查看 123456 这个 id 的类型
git cat-file -t 123456 
```



## 2. 常见场景

### 1. 修改提交的message

```shell
# 修改最近一次提交的 message
git commit --amend

# 修改老旧 commit 的 message 通过 rebase 操作 来修改
# 其中 commitId 必须为需要修改的 commit 的 parent id
git rebase -i parentCommitId

# 需要注意的是 如果当前这些提交已经push到远程仓库了 有其他人在依赖这些提交了 就不能这样随意 rebase 了
```

### 2. 合并 commit



`连续`几个 commit 合并为 1 个 commit。

```shell
# 同样的 id 必须是最早的一个 commit 的 parent
git rebase -i parentCommitId

rebase 策略一个选择 pick 其他全选择 squash
```

`不连续`几个 commit 合并为 1 个 commit。

和前面 连续 commit 合并一样

只是在后面合并的时候需要手动去调整 commit 顺序，将需要合并的那几个不连续的 commit 移动到一起就可以了。



```shell
# 暂存区文件和最新提交文件比较
git diff --cahced
# 工作区和暂存区比较
git diff

# --fileName  指定比较某个文件 默认比较所有文件
```



如何让暂存区恢复成和 HEAD 一样的。

> 即 丢弃 暂存区所有变更

```shell
# 丢弃所有暂存区变更
git reset HEAD
# 指定丢弃某个文件暂存区变更 可以添加多个文件 以 空格 隔开
git reset HEAD --filename1 filename2 
```



如何让 工作区 恢复成和 暂存区 一样。

> 即 丢弃 工作区 所有变更

```shell
# 丢弃 工作区 所有变更
git checkout
# 指定文件 可以添加多个文件 以 空格 隔开
git checkout --filename1 filename2 
```



消除最近几次提交

> 即 恢复 到某一个 提交

```shell
git reset --hard commitId
```

**如果你不知道在做什么的话 慎用**





查看不同提交之间 指定文件的变化

```shell
# 对比 commitId1 和 commitId2 中 filename 的不同
git diff commitId1 commitId2 --filename
```



正确删除文件的方法

```shell
git rm filemane
```



开发中临时加了紧急任务怎么办?

```shell
# 先暂时存放当前的这些变更信息
git stash

然后去完成紧急任务 

# 之后再恢复 stash 有两种恢复方式
# apply 会把 stash 应用到工作区 即 恢复 同时不会删除 stash 中的内容
git apply
# pop 则在恢复后还会删除掉 stash 中的内容
git stash pop
```



如何指定不需要 Git 管理的文件？

增加 `.gitignore`文件







