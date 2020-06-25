---
title: "Git系列(一)---配置及SSH key"
description: "Git 配置SSH key过程记录"
date: 2018-07-01 12:00:00
draft: false
categories: ["Git"]
tags: ["Git"]
---

本文主要记录了使用`git`之前的基本操作，首先配置全局用户名和邮箱，接着添加一个`ssh key`,这样就不用每天提交的时候都输一次密码了。

<!--more-->

`本地 Git 仓库`和 `远程(github)仓库`之间的传输是通过 `SSH` 加密的，所以配置`SSH key`之后，上传代码到`Github`远程仓库时就不用输入密码了。

一般是在C盘用户目录下有一个 `something` 和 `something.pub` 来命名的一对文件，这个 `something` 通常就是 `id_dsa` 或 `id_rsa`。

有 `.pub` 后缀的文件就是公钥，另一个文件则是密钥。连接时必须提供一个公钥用于授权，没有的话就要生成一个。



## 1. 配置用户名和邮箱

配置全局用户名和邮箱，git提交代码时用来显示你身份和联系方式，并不是github用户名和邮箱

```sh
# 记得改成自己的...
git config --global user.name "lixd" 
git config --global user.email "xueduanli@163.com"
ssh-keygen -t rsa -C "xueduanli@163.com"
```

## 2. 生成SSH key

### 2.1 生成秘钥

- 执行`ssh-keygen -t rsa -C "你的邮箱地址" ` 命令 生成`ssh key`
- 然后会叫你输入保存路径，直接按回车即可，保存在C盘用户目录下
- 然后会提示输入密码和确认密码，不用输入直接按两下回车即可

到这里`SSH key`就生成好了，接下来就是配置到`github`上。

### 2.2 配置SSH key

![](https://github.com/lixd/blog/raw/master/images/git/2018-12-27-git-ssh-key-set1.png)

![](https://github.com/lixd/blog/raw/master/images/git/2018-12-27-git-ssh-key-set2.png)



```sh
登陆Github-->点击头像-->Settings-->SSH and GPG keys-->选择SSh keys上的New SSH keys-->name 随便写，key就是刚才生成的文件中的所有内容。
```



文件默认是在C盘用户目录下，我的是`C:\Users\13452\.ssh`

文件夹中应该会有两个文件 ：`id_rsa`和`id_rsa.pub` 

`id_rsa.pub`就是我们要的key, 一般以`ssh-rsa`开头，以你刚才输的邮箱结尾。

### 2.3 测试

执行`ssh -T git@github.com`命令验证一下。

可能会提示，`无法验证主机的真实性`是否要建立连接，输入`yes`就行了。

如果，看到：

> Hi xxx! You've successfully authenticated, but GitHub does not # provide shell access.

恭喜你，你的设置已经成功了。

## 3. 参考

`https://git-scm.com/book/zh/v2`