# 笔记本安装ubuntu





## 1. 制作启动盘

具体可以参考这个链接

```text
https://www.cnblogs.com/silentdoer/p/13044305.html
```



## 2. 配置项目



### 1.WIFI

我这边是安装之后都没有 WIFI 这个选项，只能连有线网。

> 网上查了下说是因为没有安装 驱动



```shell
sudo apt update
# 只适用于 BCM 的无线网卡(不过大部分电脑都是这个网卡)
sudo apt install bcmwl-kernel-source
```



安装好驱动之后应该就能在设置里找到 WIFI 了。

