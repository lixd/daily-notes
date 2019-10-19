

## 1. 安装

暂时使用VMware安装的虚拟机,Ubuntu TLS 18.04。

## 2. 配置

### 安装VMwareTools并设置共享文件夹

 打开虚拟机菜单栏中的虚拟机，点击安装VMware Tools，桌面上出现DVD光驱图标，说明VMware Tools被成功加载。 

 在桌面上单击右键，打开终端，即选择Open Terminal 

 新建一个叫做temp的文件夹，把VMware Tools拷贝过来，进入VMware Tools文件夹 

VMware Tools 目录`/midea/username/WMware/Tools/WMwareTools-10.3.2-xxxx.tar.gz`

解压` sudo tar -zxvf VMwareTools-10.3.2-xxx.tar.gz `

解压后进入vmware-tools-distrib目录使用命令`sudo ./vmware-install.pl`安装

然后一路回车+yes就可以了



### ubuntu 换源

备份默认配置文件

```sh
sudo cp /etc/apt/sources.list /etc/apt/sources_init.list
```

更换源

```sh
sudo gedit /etc/apt/sources.list
```

阿里源

```go
deb http://mirrors.aliyun.com/ubuntu/ xenial main
deb-src http://mirrors.aliyun.com/ubuntu/ xenial main

deb http://mirrors.aliyun.com/ubuntu/ xenial-updates main
deb-src http://mirrors.aliyun.com/ubuntu/ xenial-updates main

deb http://mirrors.aliyun.com/ubuntu/ xenial universe
deb-src http://mirrors.aliyun.com/ubuntu/ xenial universe
deb http://mirrors.aliyun.com/ubuntu/ xenial-updates universe
deb-src http://mirrors.aliyun.com/ubuntu/ xenial-updates universe

deb http://mirrors.aliyun.com/ubuntu/ xenial-security main
deb-src http://mirrors.aliyun.com/ubuntu/ xenial-security main
deb http://mirrors.aliyun.com/ubuntu/ xenial-security universe
deb-src http://mirrors.aliyun.com/ubuntu/ xenial-security universe

```

更新

```sh
 sudo apt-get update 
```

修复受损安装包

```sh
sudo apt-get -f install
```

更新软件

```sh
sudo apt-get upgrade
```





vim错误

```sh
garfield@ubuntu:~$ sud0 apt-get install vim
Reading package lists... Done
Building dependency tree       
Reading state information... Done
Some packages could not be installed. This may mean that you have
requested an impossible situation or if you are using the unstable
distribution that some required packages have not yet been created
or been moved out of Incoming.
The following information may help to resolve the situation:




The following packages have unmet dependencies:
 vim : Depends: vim-common (= 2:7.3.429-2ubuntu2) but 2:7.3.429-2ubuntu2.1 is to be installed
E: Unable to correct problems, you have held broken packages.
```

解决方法：

```sh
a. 先执行$ sudo apt-get remove vim-common 卸载vim-common
b. 再进行安装vim，执行$ sudo apt-get install vim
```

### root用户直接登录

设置root用户密码

```sh
sudo passwd root
```

切换到root用户

```sh
su root
```

设置root用户登录

```sh
sudo vi /etc/pam.d/gdm-autologin
```

 注释行 "auth requied pam_succeed_if.so user != root quiet success" 

```sh
#%PAM-1.0
auth    requisite       pam_nologin.so
#auth   required        pam_succeed_if.so user != root quiet_success
auth    optional        pam_gdm.so
auth    optional        pam_gnome_keyring.so
auth    required        pam_permit.so

```

执行命令

```sh
sudo vi /etc/pam.d/gdm-password
```

同样是注释掉这行

```sh
#%PAM-1.0
auth    requisite       pam_nologin.so
#auth   required        pam_succeed_if.so user != root quiet_success
@include common-auth
auth    optional        pam_gnome_keyring.so
@include common-account

```

修改配置文件

```sh
sudo vi /root/.profile
```



```sh
# ~/.profile: executed by Bourne-compatible login shells.

if [ "$BASH" ]; then
  if [ -f ~/.bashrc ]; then
    . ~/.bashrc
  fi
fi

mesg n || true   
```

将最后一行` mesg n || true `修改为

```sh
tty -s && mesg n || true
```

 此时重启计算机，使用root账户登陆正常 

```sh
illusory@illusory-virtual-machine:~$ sudo passwd root
Enter new UNIX password: 
Retype new UNIX password: 
passwd: password updated successfully
illusory@illusory-virtual-machine:~$ su root
Password: 
root@illusory-virtual-machine:/home/illusory# sudo vi /etc/pam.d/gdm-autologin
root@illusory-virtual-machine:/home/illusory# sudo vi /etc/pam.d/gdm-password
root@illusory-virtual-machine:/home/illusory# sudo vi /root/.profile
root@illusory-virtual-machine:/home/illusory# reboot
```

### ssh

安装

```sh
sudo apt -y install openssh-server
```

依赖问题

```sh
root@illusory-virtual-machine:~# apt-get install openssh-server
Reading package lists... Done
Building dependency tree       
Reading state information... Done
Some packages could not be installed. This may mean that you have
requested an impossible situation or if you are using the unstable
distribution that some required packages have not yet been created
or been moved out of Incoming.
The following information may help to resolve the situation:

The following packages have unmet dependencies:
 openssh-server : Depends: openssh-client (= 1:7.2p2-4ubuntu2.8)
                  Depends: openssh-sftp-server but it is not going to be installed
                  Recommends: ssh-import-id but it is not going to be installed
E: Unable to correct problems, you have held broken packages.
卸载ubuntu自带的openssh-client即可
```

```sh
sudo apt-get remove openssh-client
```

再次安装就可以了

```sh
apt-get install openssh-server
```

启动ssh

```sh
root@illusory-virtual-machine:~# /etc/init.d/ssh start
[ ok ] Starting ssh (via systemctl): ssh.service.
```

关闭和重启命令

```sh
/etc/init.d/ssh restart   #重启SSH服务
/etc/init.d/ssh stop      #关闭SSH服务
```

 配置root用户SSH服务 

```sh
vim /etc/ssh/sshd_config
```

 查看是否有`PermitRootLogin yes`，没有添加即可，完成后保存退出 

```sh
# Package generated configuration file
# See the sshd_config(5) manpage for details
#添加这句就行
PermitRootLogin yes
# What ports, IPs and protocols we listen for
Port 22
# Use these options to restrict which interfaces/protocols sshd will bind to
#ListenAddress ::
#ListenAddress 0.0.0.0
Protocol 2
# HostKeys for protocol version 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_dsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
```

最后重启ssh服务

```sh
/etc/init.d/ssh restart 
```

