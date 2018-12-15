

## 1.克隆远程项目

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



