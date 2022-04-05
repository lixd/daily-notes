

## 1. 安装

暂时使用VMware安装的虚拟机,Ubuntu TLS 20.04。

> 官网下载： https://ubuntu.com/download/desktop

安装过程省略...



## 2. 配置

### 1. 安装VMwareTools

 打开虚拟机菜单栏中的虚拟机，点击安装VMware Tools，桌面上出现DVD光驱图标，说明VMware Tools被成功加载。 

 在桌面上单击右键，打开终端，即选择Open Terminal 

 新建一个叫做temp的文件夹，把VMware Tools拷贝过来，进入VMware Tools文件夹 

> VMware Tools 目录`/midea/username/WMware/Tools/WMwareTools-10.3.2-xxxx.tar.gz`

```shell
cp VMwareTools-10.3.10-xxx.tar.gz /home/lixd/tmp
# 解压
sudo tar -zxvf VMwareTools-10.3.10-xxx.tar.gz
# 解压后进入`vmware-tools-distrib`目录
cd vmware-tools-distrib
# 执行安装
sudo ./vmware-install.pl

```

安装过程中一路yes+回车就可以了

安装成功后虚拟机就可以全屏了，这里需要**重启**一次。

**问题**

安装vmware-tools出现”what is the location of the “ifconfig”program on your machine?”, 回车键后出现”The answer is invalid”.

**解决**

当出现”what is the location of the “ifconfig”program on your machine?”时直接输入“yes”,再回车即可，

### 2. 设置共享文件夹

VMware中选择 虚拟机--》设置--》选项--》共享文件夹--》添加。

再ubuntu下共享文件夹目录为`/mnt/hgfs/共享文件夹`

### 3. root账户直接登录

> 不推荐 root 账户登录 后续各种软件打开都可能会出问题

**1) 设置root 用户密码**

```sh
sudo passwd root
```

切换到root用户

```sh
su root
```



**2） 修改文件`50-ubuntu.conf`**

```shell
sudo gedit /usr/share/lightdm/lightdm.conf.d/50-ubuntu.conf
```

在文件末尾增加如下两行：

```shell
greeter-show-manual-login=true

all-guest=false 
```

**3） 修改登录相关文件**

```sh
sudo vi /etc/pam.d/gdm-autologin
```

 注释行``auth requied pam_succeed_if.so user != root quiet success`

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

**4） 修改 profile**

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

mesg n 2> /dev/null || true
```

将最后一行` mesg n 2> /dev/null || true `修改为

```sh
tty -s&&mesg n || true
```

**5） 重启** 

此时重启计算机，使用root账户登陆正常 

### 4. 目录切换到英文

由于安装的时候是选择的中文，生成的用户目录也全是中文。

这里将其替换为英文，不然每次输入时还要切换输入法就很烦。

打开终端执行以下命令

```sh
# 切换语言为英文即可
export LANG=en_US
xdg-user-dirs-gtk-update
```

执行后会弹出对话框询问是否将目录转化为英文路径,同意并关闭. 

然后在执行以下命令切换回中文即可

```sh
export LANG=zh_CN
```

关闭终端,并重启。下次进入系统,系统会提示是否把转化好的目录改回中文.选择不再提示,并取消修改.主目录的中文转英文就完成了。

### 5. 设置静态IP

**虚拟机中网络设置需要选桥接，否则虚拟机无法访问宿主机。**

相关配置文件在`/etc/netplan`目录下，当前机器上的文件名为`50-cloud-init.yaml`

注意这里的配置文件名未必和你机器上的相同，请根据实际情况修改。

```shell
cd /etc/netplan
sudo vi 50-cloud-init.yaml
```

修改内容如下：

```yaml
network:
    ethernets:
        ens33: #配置的网卡名称 ip addr 命令查看
          dhcp4: false
          dhcp6: false
          addresses: [192.168.1.111/24] #设置本机IP及掩码
          gateway4: 192.168.1.1 #设置网关 和宿主机相同
          nameservers:
            addresses: [114.114.114.114] #设置DNS
    version: 2
```

使配置生效 `netplan apply`


### 6. 换源

一般换源需要修改`/etc/apt/sources.list`文件。

不过桌面版 可以直接在`软件和更新`中选择想要的源即可，推荐 阿里云服务器。

然后更新一下

```shell
sudo apt update 
```



## 3. 常用软件安装

安装前先更新

```shell
sudo apt update 
```

### 1. vim

```shell
sudo apt install vim
```



### 2. Chrome

下载 deb 包，官网如下:

```text
http://www.google.cn/intl/zh-CN/chrome/browser/desktop/index.html
```

会下载到Downloads目录下

进入该目录安装

```sh
sudo dpkg -i google-chrome-stable_current_amd64.deb
```

 如果执行完毕，没有错误，谷歌浏览器已经成功安装。

> 但是只能普通用户下才能正常运行，root用户下使用Chrome需要额外的操作。

**root 账户启动**

需要修改 启动命令

```shell
vim /usr/bin/google-chrome
```

修改最后一行，具体如下

```shell
#exec -a "$0" "$HERE/chrome" "$@"
exec -a "$0" "$HERE/chrome" "$@" --user-data-dir --no-sandbox
```

之前尝试修改了`google-chrome`的桌面文件属性，命令末尾增加了`--no-sandbox`，但在将应用添加到收藏夹时，依然打不开。

> 参考 https://www.cnblogs.com/baoyiluo/p/3898284.html



### 3. 科学上网

**推荐一个 ubuntu 下的 SSR GUI**

> https://github.com/josephpei/ussr/releases

下载`.deb`包  比如`ussr-amd64-0.1.5.deb`

```shell
# dpkg 安装
sudo dpkg -i ussr-amd64-0.1.5.deb
```

安装之后下载`ssr-local` **并赋予可执行权限**。 然后在 ussr 界面指定该目录。

> 这里试了下只能在输入框里填目录  后面那个选择目录按钮好像有点问题。

`ssr-local`文件在这个 repository 的 V0.1.0 版本 有提供。这里也保存了一份 ，也可以自行编译,具体看这个 repository

> 链接：https://pan.baidu.com/s/1oowfyO7q4xielEzRuh7UKA 
> 提取码：yygq

```text
https://github.com/ShadowsocksR-Live/shadowsocksr-native
```

> ubuntu 20.04 正常使用

上面那个不能用的话可以试一下这个 repository

> 第二次装的时候第一个不知道什么情况，也不能用了，所以找到了下面这个
>
> https://github.com/qingshuisiyuan/electron-ssr-backup
>
> ubuntu 20.04 也是正常使用

**虚拟机**

由于是安装的虚拟机，所以这里只需要设置一下走宿主机的代理就可以了。

> 走宿主机的代理的话网络模式必须设置为`桥接`才行

设置--》网络---》网络代理--》手动 IP 端口号都填宿主机上的 SSR 即可。

设置后就可以用了，但是在 Chrome 中使用还需要安装一个插件。

```text
https://github.com/FelisCatus/SwitchyOmega/releases
```

Chrome 浏览器则下载`.crx`文件如`SwitchyOmega_Chromium.crx`。

下载后将后缀改成`.tar` 并解压，然后在 Chrome 中找到扩展程序界面，将解压后文件夹拖进去即可安装。

安装后找到该插件，在设置中找到情景模式，然后代理模式，代理服务器，代理端口都填宿主机的，设置并应用，然后切换到对应情景模式即可科学上网。

自动过滤网址列表

```text
https://raw.githubusercontent.com/gfwlist/gfwlist/master/gfwlist.txt
```





## 4. 美化

### 1. 准备工作

美化=扩展+主题

大致流程

* 1).下载文件
* 2).解压缩
* 3).复制到指定目录
* 4).`优化(Tweaks)`中配置

#### gnome-tweak-tool

安装`gnome-tweak-tool` 中文名叫`优化`，有点奇怪的翻译。

```sh
sudo apt update 
sudo apt install gnome-tweak-tool
```

如果安装不了的话 可能是源的问题,可以先回到默认的源后再次安装。



安装完成后可以在软件列表中找到一个名为`优化`的软件了。

> 20.04 中 已经被收集到`工具`这个文件夹中了

打开`优化`后选中`Shell`一栏,发现改不了，有一个感叹号是无法修改的，需要安装扩展插件(gnome-shell-extensions)才行。

#### gnome-shell-extensions

现在在`优化`外观这一栏中`shell`这里有一个感叹号，是无法修改的，需要安装扩展插件。

```sh
sudo apt install gnome-shell-extensions
```

**这里安装之后需要重启电脑**。

重启之后打开`优化`在`扩展`一栏找到`User themes`并开启。

然后关掉`优化`再次打开就可以修改`shell`这一栏了。

`shell`可以看成是 主题。

> 准备工作完成后就可以准备主题了

### 2. 主题

准备工作完成后就可以准备主题了

> GTK、Shell的目录是：/usr/share/themes，图标的目录是/usr/share/icons。
>
> 放到/usr/share/下是全局修改，也就是说如果你换一个账户登陆，也是可以用这些主题文件的。弊端就是操作较复杂，需要sudo权限。
> 如果仅仅是想修改当前账户的主题，可以选择在/home/用户名 下新建两个目录：.themes 和 .icons。注意，目录名称前面有个点 “ . ” ，然后把shell、GTK主题文件放到 .themes中，图标文件放到 .icons 中。
>
> 参考 https://www.cnblogs.com/feipeng8848/p/8970556.html

下载主题文件 网址如下

```text
https://www.pling.com/s/Gnome/browse/cat/135/order/latest/
```

> 有一说一 这个网站打开是真滴慢

这里下载的是macOS的主题

```sh
https://www.pling.com/p/1241688/
```

有`light`和`dark`等多个版本选中，这里下载的是` Mc-OS-CTLina-Gnome-Dark-1.3.2.tar.xz ` 然后解压出来

```sh
xz -d Mc-OS-CTLina-Gnome-Dark-1.3.2.tar.xz
tar xvf Mc-OS-CTLina-Gnome-Dark-1.3.2.tar
```

解压后得到文件夹` Mc-OS-CTLina-Gnome-Dark-1.3.2` 复制到`/usr/share/themes`目录下，或者`/home/用户名/.themes`目录下

```sh
$ sudo cp -r Mc-OS-CTLina-Gnome-Dark-1.3.2 /usr/share/themes/
```

然后重新打开`tweaks(优化)`就可以在外观这一栏的`应用程序(Applications)`找到并换成刚才下载的主题了。

### 3. 图标

到此为止，只有图标还是ubuntu原生图标了，只需要在替换掉图标就完成了。

 同样找到刚才下载主题的网站

```sh
https://www.pling.com/s/Gnome/browse/cat/135/order/latest/
```

在左边导航栏选择`Icon Themes`选择自己喜欢的图标包即可。

这里下载的是` Cupertino.tar.xz `

```shell
https://www.pling.com/s/Gnome/p/1102582
```

一样的 解压

```sh
xz -d Cupertino.tar.xz
tar xvf Cupertino.tar
```

同样的,解压后复制到`/usr/share/icons`目录或者`/home/用户名/.icons`目录下

```sh
cp -r Cupertino /usr/share/icons/
```

重启`优化`之后就可以看到新的`Cupertino`图标了，选择并应用上即可。

### 4. gnome extension(扩展)

首先保证 科学上网能用。

接着打开这个网站

```text
https://extensions.gnome.org/
```

然后会出现一个提示`Click here to install browser extension`,点击会跳转到应用商店安装一个插件(`GNOME Shell integration`)。

安装好该插件后再回到这个网站，随便点一个 扩展 进去就会发现 多了一个 ON/OFF 的选项了。切换到 ON 之后会提示是否安装该扩展(可能需要返回桌面才能看到该提示)。

#### Dash to Panel 

dash to panel 能把顶栏和任务栏合并，减少竖向面积的占用，个人觉得非常好用。

## 4. 常用软件


### 1. 中文输入法

**搜狗输入法暂不支持 20.04 感觉自带的中文输入法也不错。**

以下是 20.04 版本安装谷歌输入法过程。

1）安装 谷歌输入法

```sh
sudo apt-get install fcitx-googlepinyin
```

2）启用fcitx

打开设置 --》`区域和语言`-->管理已安装的语言-->键盘输入法系统-->切换为`fcitx`

**重启Ubuntu(一定要重启，注销没有效果) **

启动搜狗输入法

点击屏幕右上角小键盘-->配置  选择谷歌输入法

或者运行下面命令配置谷歌输入法

```shell
fcitx-config-gtk3
```

> google 输入法放到第一位即可。

**再次重启**

然后就可以愉快的输入中文了。

> 感觉还是自带的输入法比较好用...
>
> 卸载方式
>
> sudo apt-get purge fcitx
>
> sudo apt-get autoremove



## 5. 开发环境

### 0. Git

```shell
sudo apt install git
```

然后 [配置 ssh-key](https://www.lixueduan.com/post/git/01-git-ssh-key-set/)



### 1. golang

下载

```sh
https://golang.org/dl
https://studygolang.com/dl
```

解压

```sh
# 可以解压到任意位置
$ sudo tar -zxvf go1.14.4.linux-amd64.tar.gz  -C /home/lixd/17x/
```

配置环境变量

```sh
sudo vim /etc/profile
```

文件末尾添加以下内容

```sh
# gopath 你的项目路径
export GOPATH=/home/lixd/17x/gopath
# go 解压位置
export GOROOT=/home/lixd/17x/go
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
root@17x:~/Desktop/17x# go version
go version go1.14.4 linux/amd64
```

### 2. goland

推荐使用 Jetbrains Tools下载。

```text
https://www.jetbrains.com/toolbox-app/
```

下载后解压 出一个二进制文件，执行即可。

**goland 中不能输入中文的问题**

 找到`goland.sh` 在注释之后的首行添加如下内容：

```shell
export XMODIFIERS="@im=ibus"
export GTK_IM_MODULE="ibus"
export QT_IM_MODULE="ibus"
```

部分文件内容如下:

```shell
!/bin/sh
# ---------------------------------------------------------------------
# GoLand startup script.
# ---------------------------------------------------------------------
export XMODIFIERS="@im=ibus"
export GTK_IM_MODULE="ibus"
export QT_IM_MODULE="ibus"

message()
{
  TITLE="Cannot start GoLand"
  if [ -n "$(command -v zenity)" ]; then
    zenity --error --title="$TITLE" --text="$1" --no-wrap
  elif [ -n "$(command -v kdialog)" ]; then
    kdialog --error "$1" --title "$TITLE"
  elif [ -n "$(command -v notify-send)" ]; then
    notify-send "ERROR: $TITLE" "$1"
  elif [ -n "$(command -v xmessage)" ]; then
    xmessage -center "ERROR: $TITLE: $1"
  else
    printf "ERROR: %s\n%s\n" "$TITLE" "$1"
  fi
}

```

其中`goland.sh`我是在这个位置

```shell
/home/lixd/.local/share/JetBrains/Toolbox/apps/Goland/ch-0/201.7846.93/bin/goland.sh
```

> 参考 https://blog.csdn.net/xianjs616/article/details/102178455

上面的方法不行的话试一下下面这个

在 ide 对应的 vmoptions 文件中增加

```sh
-Drecreate.x11.input.method=true
```

然后重启应该就可以了。

> 除了输入法候选框不会跟随光标之外，基本能够勉强使用。
>
> https://github.com/libpinyin/ibus-libpinyin/issues/262
>
> https://youtrack.jetbrains.com/issue/IDEA-23472



### 3. protobuf

#### 1.安装`protoc`

下载对应平台的二进制文件,配置环境变量即可。

> 也可以选择编译安装

```sh
https://github.com/protocolbuffers/protobuf/releases
```

`protoc-3.12.3-linux-x86_64.zip`

```shell
unzip protoc-3.12.3-linux-x86_64.zip -d protoc-3.12.3-linux-x86_64
```

解压后配置环境变量

```shell
vim /etc/profile 
```

`path`中增加`protoc`文件所在路径

```shell
export PATH=$PATH:/home/lixd/17x/protoc-3.12.3-linux-x86_64/bin
```

我这里的路径是`/usr/local/17x/protoc-3.12.3-linux-x86_64/bin`

使其生效

```shell
source /etc/profile
```

任意位置输入`protoc --version`出现以下结果则成功。

```sh
root@17x:/usr/local# protoc --version
libprotoc 3.12.3
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



#### 3.编写proto文件测试

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

#### 4.编译

```sh
#官方
protoc --go_out=. derssbook.proto
#gofast
protoc --gofast_out=. derssbook.proto
```

#### 5.问题

插件会自动安装到`/$gopath/bin`目录下。不过在ubuntu中安装到了`/$gopath/bin/linux_386`下面 导致使用的时候找不到文件，最后复制出来就能正常使用了。

分辨率问题

```shell
#!/bin/bash
# set screen resolution to 2560 1440
cvt 2560 1440
xrandr --newmode "2560x1440_60.00"  312.25  2560 2752 3024 3488  1440 1443 1448 1493 -hsync +vsync
xrandr --addmode Virtual1 "2560x1440_60.00"
xrandr --output Virtual1 --mode "2560x1440_60.00"
```



## 6.  终端

https://juejin.im/post/5eb3a1556fb9a0434b73545c

### 1. Terminator 



### 2. ZSH

TODO

### 3. 有趣的命令行小玩具

#### 终端黑客帝国屏保

```shell
# 安装
sudo apt install cmatrix

# 运行（加上 -lba 参数看起来更像电影，加上 -ol 参数起来更像 Win/Mac 的屏保）
cmatrix
```

#### 终端小火车动效

```shell
# 安装
sudo apt install sl

# 运行
sl
```

#### screenfetch

The Bash Screenshot Information Tool，用于在终端显示系统信息及 ASCII 化的 Linux 发行版图标

```shell
# 安装
sudo apt install screenfetch

# 运行
screenfetch
```



