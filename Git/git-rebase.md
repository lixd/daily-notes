## Git Rebase


假设Git目前只有一个分支master。开发人员的工作流程是

* `git clone master branch`：在自己本地checkout -b local创建一个本地开发分支
* 在本地的开发分支上开发和测试
* 阶段性开发完成后（包含功能代码和单元测试），可以准备提交代码



基于  Git Rebase 的代码提交流程如下：

* 首先切换到master分支，git pull拉取最新的分支状态
* 然后切回local分支
* 通过 git rebase -i 将本地的多次提交合并为一个，以简化提交历史。
  * 本地有多个提交时,如果不进行这一步,在git rebase master时会多次解决冲突(最坏情况下,每一个提交都会相应解决一个冲突)
* git rebase master 将master最新的分支同步到本地，这个过程可能需要手动解决冲突(如果进行了上一步的话,只用解决一次冲突)
* 然后切换到master分支，git merge将本地的local分支内容合并到master分支
* git push将master分支的提交上传
* 本地开发分支可以灵活管理
  * 还需要可以保留
  * 不需要则直接删除：git branch -d



```sh
git checkout master
git pull
git checkout local
git rebase -i HEAD~2 //合并提交 --- 2表示合并两个
git rebase master---->解决冲突--->git rebase --continue
git checkout master
git merge local
git push
```

