# git 文件夹压缩

最近发现一个仓库居然有 300M 这么大。

分析了下发现`.git`文件夹就有 290M。

应该是存放了所有的提交历史吧.



最后就是千万不要在 git 仓库中存放会经常修改的那种 二进制文件。

> 每次修改 git 快照压缩效果都会很差。

工具

通过bfg.jar工具，永久删除git里的大文件

官网``https://rtyley.github.io/bfg-repo-cleaner/``

```shell
$ 
$ 
$ cd some-big-repo.git
$ git reflog expire --expire=now --all && git gc --prune=now --aggressive
$ git push
```



第一步 通过 mirror 方式 clone 仓库

```shell
git clone --mirror git://example.com/some-big-repo.git
```

第二步 清理大文件

```shell
# 100M 表示清除大于 100M 的文件 可调
java -jar bfg.jar --strip-blobs-bigger-than 100M some-big-repo.git
```

如果知道文件名 也可以清除指定文件

> 比如清除 password.txt 

```shell
bfg --replace-text password.txt  my-repo.git
```



第三步 清除缓存数据

```shell
cd some-big-repo.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

第四步 推送到远端

```shell
git push
```

如果仓库里有 commit 来自 pull request 的话 push 这里会报错。

>  ! [remote rejected] refs/pull/1/head -> refs/pull/1/head (deny updating a hidden ref)

暂时没找到解决方案，只能删库重建了..