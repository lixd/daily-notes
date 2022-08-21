# ssh 私钥登陆

## 1. 概述

私钥登录原理就是客户端将自己的公钥存储到远程主机的`.ssh/authorized_keys`中，客户端发起登录时，远程主机会发送一段随机字符串给客户端，客户端用自己的私钥加密后重新发回远程主机，远程主机用存储的客户端公钥解密之后对比之前发送给客户端的字符串，相同的话即认为客户机认证，不再需要入密码直接登录系统。



## 2. 配置

因此我们要做的就是生成一对公私钥文件，把公钥存储到远程主机的`.ssh/authorized_keys`中，然后客户端登陆时配置对应的私钥即可。



```bash
$ ssh-keygen -t rsa
Generating public/private rsa key pair.
# 这里注意指定文件存放位置
Enter file in which to save the key (/root/.ssh/id_rsa): /root/.ssh/id_rsa_test
Enter passphrase (empty for no passphrase): 
Enter same passphrase again: 
Your identification has been saved in /root/.ssh/id_rsa_test.
Your public key has been saved in /root/.ssh/id_rsa_test.pub.
The key fingerprint is:
SHA256:rfbKjgbYqOsocxTQ1YvG+e8YYlYW3N9izgCc4dlkLww root@caas
The key's randomart image is:
+---[RSA 2048]----+
| . ...E o        |
|. .  +.@ .       |
| . . oO.= .      |
|  . = .o + .     |
|   * .o S = .    |
|  + oo.  * .     |
| o  +...o o      |
|= .o ..*..       |
|==   .oo=..      |
+----[SHA256]-----+

# 查看生成的公钥
[root@caas ~]# cat ~/.ssh/id_rsa_test.pub
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDFjXNTTg+11ywRtFh4xp7I7gke323uEUN2+aH51xVy/N19srlFYe5i/FzAzbPRV3Uw4acxXL5R3oPxKDqIX3tnDU0CXArkVgyYfRyBwfOiyTfMNJDxYooWvX6IfExbBLGF8Wj0Co9GF3jgmECUkFSNejVdHXuGdSb6KiSowwwL15DEUNQyWYT99mXS1YHhmCDvQMhviJ4pnNDfC9hy1+M4sADKS1OxKLClOTsmWiiOCSleIheATxJKSKdQ6sje8vxLdbWcGAvxge/WCdBqI58dAaeR7IE6JTVp8CiGOTqdIoLxwfDwcBNYsqykpH7Gv7S1GwbbXA+Rj1iU99sSqoQz root@caas

```



将公钥信息添加到远程主机的 ~/.ssh/authorized_keys文件（没有则创建）

```bash
vi ~/.ssh/authorized_keys
```

如果当前主机也是 linux 的话就比较简单了,可以使用以下命令直接添加

```bash
ssh-copy-id -i ~/.ssh/id_rsa root@$ip
```



## 3. 使用私钥进行登陆

首先需要进行以下权限配置：

* ～/.ssh 目录的权限必须是700 
* ～/.ssh/authorized_keys 文件权限必须是600
* ～/.ssh/id_rsa_test **私钥**文件权限必须是 600

然后就可以使用私钥进行登陆了。

```bash
ssh -i ~/.ssh/id_rsa_test 172.20.100.200
```



但是到这一步只是做到了免密，如果不用默认名 id_rsa 的话，那么每次连接都需要使用 ssh-i 还是不够简练，所以还需要最后一步

配置 ~/.ssh/config 内容

```conf
#自定义远程主机名( #注释需要单独一行)
Host 172.20.100.200                
#服务器IP
HostName 172.20.100.200
#服务器用户名         
User root                      
#端口 
Port 22                         
#私钥地址
IdentityFile ~/.ssh/id_ras_test    
```

配置完成就可以直接在终端使用 ssh 172.20.100.200 连接主机了,不需要 -i 参数了。