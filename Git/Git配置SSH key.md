```
1. 配置git用户名和邮箱
   设置Git的user name和email：

git config --global user.name "lillusory"

git config --global user.email "xueduanli@163.com"

git config --global user.name "lixueduan"

git config --global user.email "lixueduan@cqkct.com"

1. 生成ssh key
   生成密钥：
   ssh-keygen -t rsa -C "xueduanli@163.com"
   按3个回车，密码为空。
2. 上传key到github
   clip < ~/.ssh/id_rsa.pub

复制key到剪贴板

登录github

点击右上方的Accounting settings图标

选择 SSH key

点击 Add SSH key

1. 测试是否配置成功
   ssh -T git@github.com

如果配置成功，则会显示： Hi username! You’ve successfully authenticated, but GitHub does not provide shell access.



```

