## CentOS安装教程

本章主要讲如何通过VMware虚拟机安装Linux，安装的是centos7.十分详细的一个安装教程。

## 1. 准备工作

### 1.1 VMware下载

百度网盘下载（内含注册机）

链接: `https://pan.baidu.com/s/1wz4hdNQBikTvyUMNokSVYg`提取码: yed7

怎么安装就不用写了吧。

### 1.2 CentOS下载

`http://mirrors.163.com/centos/7.6.1810/isos/x86_64/`

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/software-install/centos7-down.png)

## 2.CentOS 7安装

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/1-create-vm.png)

创建虚拟机，这里我们选择自定义安装类型。

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/2-custom-install.png)

然后选择版本，需要注意兼容问题，一般是向下兼容，14上的虚拟机复制到15上可以用，15的复制到14上可能会用不了。

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/3-version-select.png)

这里选择稍后再安装。

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/4-after-install.png)

接着选择系统，这里是CentOS 7 64位。

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/5-system-select.png)

这个是保存的文件名字。

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/6-filename.png)

这里一般默认的就行了,电脑配置好的可以调高点。

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/7-cpu-select.png)

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/8-memory-select.png)

网络这里,如果仅仅是让虚拟机能上网，两种模式都可以的，用桥接的话只要你在局域网内有合法的地址，比如你的ADSL猫是带路由功能的，如果是在单位，那就要网络管理人员给你合法IP才行。NAT模式下，虚拟机从属于主机，也就是访问外部网络必须通过主机来访问，因此虚拟机的IP只有主机才能识别。而桥接模式下，虚拟机和主机是平行关系，共享一张网卡（使用网卡的多个接口），可以直接访问外部网络。

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/9-network-select.png)

这些都默认的就行了。

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/10-IO-select.png)

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/11-disk-select.png)

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/12-newdisk-select.png)

这个是虚拟机文件的名字。

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/14-filename.png)

这里选择自定义硬件。

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/15-custom.png)

选择镜像文件。

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/17-file-select.png)

到这里就结束了，点击开启虚拟机后会自动开始安装。

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/18-start.png)

选择安装CentOS 7

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/19-setup.png)

语言选择

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/20-language.png)

调一下时间和地区。

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/21-time.png)

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/22-time2.png)

选择要安装的软件，新手还是安装一个GUI比较好。

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/23-software1.png)

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/24-software2.png)

查看一下网络连接

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/25-network-set1.png)

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/26-network-set2.png)

开始安装。

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/27-begin-install.png)

安装过程中可以设置一下账号密码，一个root账户，一个普通账户。

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/28-password-set1.png)

![](https://github.com/illusorycloud/illusorycloud.github.io/raw/hexo/myImages/linux/centos7-install/29-password-set2.png)

然后耐心等待安装完成就好了。

安装完成后重启就可以登录系统了。





