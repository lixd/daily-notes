

## 1. 安装

本次使用VMware安装的Ubuntu TLS 18.04。

具体安装方法见[超详细的VMware虚拟机安装CentOS7教程]( https://blog.csdn.net/java_1996/article/details/86485145),只是镜像文件不一样，其他的都差不多的。

## 2. 配置

### 1. 安装VMwareTools

 打开虚拟机菜单栏中的虚拟机，点击安装VMware Tools，桌面上出现DVD光驱图标，说明VMware Tools被成功加载。 

 在桌面上单击右键，打开终端，即选择Open Terminal 

 新建一个叫做temp的文件夹，把VMware Tools拷贝过来，进入VMware Tools文件夹 

VMware Tools 目录`/midea/username/WMware/Tools/WMwareTools-10.3.2-xxxx.tar.gz`

解压` sudo tar -zxvf VMwareTools-10.3.2-xxx.tar.gz `

解压后进入vmware-tools-distrib目录使用命令`sudo ./vmware-install.pl`安装

然后一路yes+回车就可以了

### 2. 设置共享文件夹

VMware中选择 虚拟机--》设置--》选项--》共享文件夹--》添加。

再ubuntu下共享文件夹目录为`/mnt/hgfs/共享文件夹`

### 3. 换国内源

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



### 4. 下载中文包

下载全局中文包之前要先在`软件和更新`里把源换成中国的源在下载语言包，否则会下载失败。

### 5. 目录切换到英文

将用户目录下的下载 文档等文件夹替换为英文，不然每次输入时还要切换输入法就很烦。

打开终端执行以下命令

```sh
 export LANG=en_US
 xdg-user-dirs-gtk-update
```

 跳出对话框询问是否将目录转化为英文路径,同意并关闭. 

然后在执行以下命令

```sh
export LANG=zh_CN
```

 关闭终端,并重起.下次进入系统,系统会提示是否把转化好的目录改回中文.选择不再提示,并取消修改.主目录的中文转英文就完成了 

### 6. root用户直接登录

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

