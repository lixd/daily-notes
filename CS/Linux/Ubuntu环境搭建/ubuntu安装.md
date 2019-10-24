

## 1. 安装

暂时使用VMware安装的虚拟机,Ubuntu TLS 18.04。

## 2. 配置

### 1. 安装VMwareTools

 打开虚拟机菜单栏中的虚拟机，点击安装VMware Tools，桌面上出现DVD光驱图标，说明VMware Tools被成功加载。 

 在桌面上单击右键，打开终端，即选择Open Terminal 

 新建一个叫做temp的文件夹，把VMware Tools拷贝过来，进入VMware Tools文件夹 

VMware Tools 目录`/midea/username/WMware/Tools/WMwareTools-10.3.2-xxxx.tar.gz`

解压` sudo tar -zxvf VMwareTools-10.3.2-xxx.tar.gz `

解压后进入vmware-tools-distrib目录使用命令`sudo ./vmware-install.pl`安装

然后一路yes+回车就可以了

问题

安装vmware-tools出现”what is the location of the “ifconfig”program on your machine?”, 回车键后出现”The answer is invalid”.

解决

当出现”what is the location of the “ifconfig”program on your machine?”时直接输入“yes”,再回车即可，

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

## 3. 美化

### macOS主题

大致流程

```sh
1.下载文件
2.解压缩
3.复制到指定目录
4.`优化(Tweaks)`中配置
```

#### 主题

安装`gnome-tweak-tool` 中文名叫`优化`，有点奇怪的翻译。

```sh
sudo apt-get update 
sudo apt-get install gnome-tweak-tool
```

下载主题文件 网址如下

```sh
https://www.pling.com/s/Gnome/browse/cat/135/order/latest/
```

这里下载的是macOS的主题

```sh
https://www.pling.com/s/Gnome/p/1275087/
```

下载` Mojave-light.tar.xz `到本地 然后解压出来

```sh
xz -d Mojave-light.tar.xz
tar xvf Mojave-light.tar
```

解压后得到文件夹` Mojave-light` 复制到`/usr/share/themes`目录下，这样就是全局替换，如果只替换当前账号的话就在`/home/用户名`目录下建立一个`/themes`目录 把主题文件夹复制到这里去。

```sh
$ sudo cp -r /home/illusory/Download/Mojave-light /usr/share/themes
```

然后关掉`tweaks(优化)`，重新打开就可以在外观这一栏找到并换成刚才下载的主题了。

#### shell

上面把主题修改后，状态栏(大概是这个吧)这些地方还是没变化，所以还需要继续修改一下`shell`.

现在在`优化`外观这一栏中`shell`这里有一个感叹号，是无法修改的，需要安装拓展。

```sh
sudo apt-get install gnome-shell-extensions
```

**这里安装之后需要重启电脑**。

重启之后打开`优化`在扩展一栏找到`User themes`并开启。

然后关掉`优化`再次打开就可以修改`shell`这一栏了。

找到并选择刚才复制过来的主题`Mojave-light`。

这样就算修改完成了。

#### 图标

到此为止，只有图标还是ubuntu原生图标了，只需要在替换掉图标就完成了。

 同样找到刚才下载主题的网站

```sh
https://www.pling.com/s/Gnome/browse/cat/135/order/latest/
```

在左边导航栏选择`Icon Themes`选择自己喜欢的图标包即可。

这里下载的是` Mojave CT icons `

一样的 解压

```sh
xz -d Mojave-CT-Light.tar.xz
tar xvf Mojave-CT-Light.tar
```

同样的,解压后复制到`/usr/share/icons`目录下

```sh
sudo cp -r /Mojave-CT-Light /usr/share/icons
```

重启`优化`之后就可以看到新的`Mojave-CT-Light`图标了，选择并应有上。

#### dock

导航栏软件设置

首选安装扩展，在ubuntu软件商店找到`Dash to Dock`并安装。

## 4. 常用软件

### 1. ssh

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
#root用户登录
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

### 2. vim

```sh
sudo apt-get install vim
```

依赖问题

```sh
illusory@ubuntu:~$ sudo apt-get install vim
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

卸载ubuntu自带的vim-common 再安装

```sh
$ sudo apt-get remove vim-common
$ sudo apt-get install vim
```

### 3. Chrome

登陆该网站下载进行下载

```sh
http://www.google.cn/intl/zh-CN/chrome/browser/desktop/index.html
```

会下载到Downloads目录下

进入该目录安装

```sh
sudo dpkg -i google-chrome-stable_current_amd64.deb
```

 如果执行完毕，没有错误，谷歌浏览器已经成功安装。

只能普通用户下才能正常运行，root用户下使用Chrome需要额外的操作，这里也没试。

### 4. 搜狗输入法

安装fcitx

```sh
sudo apt-get install fcitx-bin
```

安装搜狗输入法

```sh
sudo apt-get install fcitx-table
```

启用fcitx

打开设置 --》`区域和语言`-->管理已安装的语言-->键盘输入法系统-->切换为`fcitx`

**重启Ubuntu(一定要重启，注销没有效果) **

启动搜狗输入法

点击屏幕右上角小键盘-->配置 这时候已经可以选输入法了 只是没有搜狗输入法

下载搜狗

```sh
https://pinyin.sogou.com/linux/?r=pinyin
```

下载之后安装

**这里也要重启Ubuntu(一定要重启，注销没有效果) **

然后就可以愉快的输入中文了。

### 5. 科学上网

由于是安装的虚拟机，所以这里只需要设置一下走宿主机的代理就可以了。

设置--》网络---》网络代理--》手动 ip填宿主机IP 端口号这里填的是ssr的。

`Chrome+SwitchyOmega+shadowsocks`具体的就自行百度了.

### 6. github打开慢的问题

打开下面网址获取`github.com`的IP

```sh
ipaddress.com
```

然后添加到hosts里

```sh
vim /etc/hosts
```

```sh
192.30.253.112 github.com
```

重启网络

```sh
/etc/init.d/networking restart
```



## 5. 开发环境

### 1. golang

下载

```sh
https://golang.org/d
https://studygolang.com/dl
```

解压

```sh
$ sudo tar -zxzf go1.13.1.linux-amd64.tar.gz  -C /usr/local
```

配置环境变量

```sh
vim /etc/profile
```

文件末尾添加以下内容

```sh
# gopath 你的项目路径
export GOPATH=/home/illusory/golang/projects 
# go 解压位置
export GOROOT=/usr/local/go
export GOARCH=386
export GOOS=linux
export GOTOOLS=$GOROOT/pkg/tool
export PATH=$PATH:$GOROOT/bin:$GOPATH/bin
```

 重新加载 profile 文件 

```sh
source /etc/profile
```

测试

任意目录输入`go version`出现以下结果即可

```sh
illusory@illusory-virtual-machine:/$ go version
go version go1.13.3 linux/amd64
```

### 2. goland

下载

```sh
https://www.jetbrains.com/go/download/#section=linux
```

解压

```sh
sudo tar -zxzf goland-2019.2.3.tar.gz -C /opt
```

运行

```sh
illusory@illusory-virtual-machine: $ cd /opt/GoLand-2019.2.3/bin
illusory@illusory-virtual-machine:/opt/GoLand-2019.2.3/bin$ ./goland.sh 
```

创建快捷方式

```sh
sudo vim /usr/share/applications/jetbrains-goland.desktop
```

添加以下内容

```sh
[Desktop Entry]
Name=goland
Comment=golang IDE
Exec=/opt/GoLand-2019.2.3/bin/goland.sh
Icon=/opt/GoLand-2019.2.3/bin/goland.png
Terminal=false
Type=Application
Categories=Application;Development;
```

添加可执行权限

```sh
sudo chmod +x /usr/share/applications/jetbrains-goland.desktop
```

然后 按`win键`搜索`goland`并右键添加到`收藏夹` 这样就能方便的打开了。



```sh
ssh-keygen -trsa -C "xueduanli@163.com"
```

### 3. protobuf

#### 1.下载`protoc`

```sh
https://github.com/protocolbuffers/protobuf/releases
```

下载并解压后将`/bin`目录下的`protoc`复制到`/gopath/bin`目录下。

输入`protoc --version`出现以下结果则成功。

```sh
illusory@illusory-virtual-machine:/mnt/hgfs/Share$ protoc --version
libprotoc 3.10.0
```

#### 2.安装插件

`protoc-gen-go` 是用来将protobuf的的代码转换成go语言代码的一个插件

```sh
# 官方版
go get -u github.com/golang/protobuf/protoc-gen-go
# gofast
go get github.com/gogo/protobuf/protoc-gen-gofast
```

其中`gofast`会比官方的性能好些，生成出来的问题也更复杂。

#### 3.安装`proto`

proto是protobuf在golang中的接口模块

```sh
# 官方
go get github.com/golang/protobuf/proto
# gofast
go get github.com/gogo/protobuf/gogoproto
```

#### 4.编写proto文件测试

```protobuf
syntax = "proto3";
package go_protoc;

message Person {
  string name = 1;
  int32 id = 2;
  string email = 3;

  enum PhoneType {
    MOBILE = 0;
    HOME = 1;
    WORK = 2;
  }

  message PhoneNumber {
    string number = 1;
    PhoneType type = 2;
  }

  repeated PhoneNumber phones = 4;

}

message AddressBook {
  repeated Person people = 1;
}
```

#### 5.编译

```sh
#官方
protoc --go_out=. derssbook.proto
#gofast
protoc --gofast_out=. derssbook.proto
```

#### 6.问题

插件会自动安装到`/$gopath/bin`目录下。不过在ubuntu中安装到了`/$gopath/bin/linux_386`下面 导致使用的时候找不到文件，最后复制出来就能正常使用了。