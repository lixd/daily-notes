# Git Squash

**分支上 commit 过多或存在一些无效 commit 时，可以使用`git squash`命令进行合并。**

> 注：如果提交已经推送到远程了，就不能这样合并。
>
> 注：如果提交已经推送到远程了，就不能这样合并。
>
> 注：如果提交已经推送到远程了，就不能这样合并。
>
> push 到远程的提交可能已经被其他人拉到本地了，在合并后推上去可能会冲突。



比如一个功能点我们可能分了几个提交，如果合并到主分支的话，提交记录会显得繁琐，最终我们重点关注的应该是这个功能点的提交，而不是开发者中间做了多少开发，这时候就要用到了 git squash 进行 commit 合并。

比如这样，同一功能连续进行了4次提交：

```shell
$ git log --oneline
119db02 (HEAD -> master) commit 4
394ce56 commit 3
1ac6336 commit 2
98dfa09 commit 1
e63ec61 clear
```

因为都是同一个功能，因此在合并到 master 之前就可以先进行 commit 合并。

通过 rebase 进行 squash

```shell
# 
$ git rebase -i HEAD~4
```

要合并几个commit就调整 HEAD~后的数字即可，比如这里是要合并4个commit。

执行命令后会进入编辑界面，大概像这样：

```shell
pick 98dfa09 commit 1
pick 1ac6336 commit 2
pick 394ce56 commit 3
pick 119db02 commit 4

# Rebase e63ec61..119db02 onto e63ec61 (4 commands)
#
# Commands:
# p, pick <commit> = use commit
# r, reword <commit> = use commit, but edit the commit message
# e, edit <commit> = use commit, but stop for amending
# s, squash <commit> = use commit, but meld into previous commit
# f, fixup [-C | -c] <commit> = like "squash" but keep only the previous
#                    commit's log message, unless -C is used, in which case
#                    keep only this commit's message; -c is same as -C but
#                    opens the editor
# x, exec <command> = run command (the rest of the line) using shell
# b, break = stop here (continue rebase later with 'git rebase --continue')
# d, drop <commit> = remove commit
# l, label <label> = label current HEAD with a name
# t, reset <label> = reset HEAD to a label
# m, merge [-C <commit> | -c <commit>] <label> [# <oneline>]

```

前面几行为我们的提交记录,注意是倒叙的，旧的在上，新的在下

```shell
pick 98dfa09 commit 1
pick 1ac6336 commit 2
pick 394ce56 commit 3
pick 119db02 commit 4
```

保留最上面一个为 pick，其余 pick 都改成 squash就像这样：

```shell
pick 98dfa09 commit 1
squash 1ac6336 commit 2
squash 394ce56 commit 3
squash 119db02 commit 4
```

然后保存文件退出即可，保存退出后会进入第二个编辑界面,就像这样：

```shell
# This is a combination of 4 commits.
# This is the 1st commit message:

commit 1

# This is the commit message #2:

commit 2

# This is the commit message #3:

commit 3

# This is the commit message #4:

commit 4


```

再这里调整 commit message：

```shell
# This is a combination of 4 commits.
commit 1
commit 2
commit 3
commit 4

```

然后再次保存退出即可。

到此 commit 合并完成

```shell
$ git rebase -i HEAD~4
[detached HEAD 32c1953] commit 1 commit 2 commit 3 commit 4
 Date: Wed Jan 26 10:52:36 2022 +0800
 1 file changed, 4 insertions(+), 1 deletion(-)
Successfully rebased and updated refs/heads/master.
```

再次查看提交日志，可以看到已经合并为一个了：

```shell
$ git log --oneline
32c1953 (HEAD -> master) commit 1 commit 2 commit 3 commit 4
e63ec61 clear
```

