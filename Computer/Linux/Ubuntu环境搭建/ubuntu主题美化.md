

# Ubuntu主题美化

macOS看起来比较舒服这次就替换为macOS主题好了。

大致流程

```sh
1.下载主题文件
2.解压并复制到指定目录
3.在`优化(Tweaks)`中配置相关信息
```

## 1. 主题

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

## 2. shell

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

## 3. 图标

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

## 4. dock

导航栏软件设置

首选安装扩展，在ubuntu软件商店找到`Dash to Dock`并安装。

接着在`优化`扩展一栏中找到并启用`Dash to Dock`,接着点击小齿轮就可以对dock进行设置了.

到时位置ubuntu的主题美化就算基本完成了。

下一章会记录一下一些常用软件的下载。

