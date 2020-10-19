---
title: "Nginx入门教程(五)---访问日志简单分析"
description: "Nginx访问日志简单分析"
date: 2020-10-16 22:00:00
draft: false
tags: ["Nginx"]
categories: ["Nginx"]
---

本文主要记录了如何对 Nginx 的访问日志进行一些简单的分析。例如分析每日的 PV、UV、访问终端、topn页面等指标。

<!-- more-->



## 1. 概述

Nginx访问日志记录了Nginx的所有请求，默认会存储在`nginx/logs/access.log`文件中，也可以在配置文件中通过`access_log`参数自定义存放位置。

如果实在找不到可以通过如下命令查询

```shell
# find / -name "access.log"
/usr/local/nginx/logs/access.log
```

简单查看一些文件中的内容

```shell
less access.log
```

内容大概是这样子的

```javascript
183.69.208.21 - - [16/May/2020:10:04:59 +0000] "GET / HTTP/1.1" 200 4230 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36"
```

主要包含了IP、日期、HTTP Method和协议版本号 状态码 设备信息等。



本次分析主要用到了`awk`命令

> AWK 是一种处理文本文件的语言，是一个强大的文本分析工具。可以简单的理解为一种脚本语言吧。



## 2. 具体分析

### 1. PV数

`pv`是page view的缩写，即页面浏览,这里我们可以简单的把用户的每一次请求都看做一次访问。

于是通过access.log统计PV数就是统计内容的行数了。

具体命令如下：

```shell
wc -l access.log

#结果如下
108544 access.log
```

总PV数大约是108544。

### 2. 每天的PV数

只需要在PV数的基础上增加按日期分组即可。

这里就要用到`awk`命令了，具体命令如下：

```shell
awk '{print substr($4 , 2, 11)}' access.log|\
sort |uniq -c|\
sort -rn|\
head -n 10

#结果如下
   1901 21/May/2020
   1755 23/Jun/2020
   1667 15/Jul/2020
   1620 24/May/2020
   1593 24/Aug/2020
   1579 02/Oct/2020
   1485 16/Oct/2020
   1387 23/May/2020
   1361 29/May/2020
   1274 01/Sep/2020
```

具体解析：

```shell
# AWK 基本语法
# $1 表示第一行内容
awk '{print $1}' access.log

awk '{print substr($4 , 2, 11)}' access.log 这句表示对第四列进行截取然后打印出来 这里截取出来的刚好就是日期
uniq -c 则是计数（记录重复的有多少个）
sort -rn 排序
```



### 3. UV数

UV即Unique visitor，唯一访客，每个用户只算一次。

可以简单的把每个IP当做一个独立访客，这样只需要对于UV我们可以按IP进行分组统计就行了。

```shell
awk '{print $1}' access.log |\
sort | uniq |\
wc -l
# 注意 需要先sort在uniq去重，因为uniq只会对相邻的行进行去重

#结果如下
12354
```



### 4. 每天的UV数

同样的UV基础上增加按日期分组

```shell
awk '{print substr($4,2,11) " " $1}' access.log |\
sort | uniq |\
awk '{uv[$1]++;next}END{for(date in uv) print uv[date] " " date}'|\
sort -rn|\
head -n 10
# head 用于控制显示多少个head -n 10 即显示前10

# 结果如下
333 16/Oct/2020
321 12/Oct/2020
321 04/Oct/2020
319 29/May/2020
304 17/Jul/2020
299 05/Aug/2020
294 09/Oct/2020
293 23/Aug/2020
293 07/Oct/2020
290 28/Sep/2020

```



这次命令稍微复杂了一点点，具体分析如下

```shell
# 将日期（$4）和IP($1)提取出来重组成新的内容
awk '{print substr($4,2,11) " " $1}' access.log |\
# 排序并去重 这样统计出来的就是UV了
sort | uniq |\
# 取出每一行的第一列即日期 并将计数+1 最后for循环打印出来
awk '{uv[$1]++;next}END{for(date in uv) print uv[date] " " date}'
# 最后在按倒序排序
sort -rn
# 只输出前10条记录
head -n 10
```



### 5. 统计哪些设备访问过

```shell
cat access.log |\
awk '{devices[$12]++;next} END {for (d in devices) print devices[d] " " d}'|\
sort -rn|\
head -n 10

# 结果如下
88396 "Mozilla/5.0
9835 "-"
4021 "Mozilla/4.0
1705 
1422 "Go-http-client/1.1"
847 "fasthttp"
759 "Sogou
531 "serpstatbot/1.0
330 "MauiBot
323 "Mozilla"
```



### 6. 统计被访问最多的页面

```shell
cat access.log|\
awk '{print $7}'|sort|uniq -c|\
grep post|\ 
sort -rn|\
head -n 10

# grep post 过滤掉其他记录 只统计post下的页面

# 结果如下
    783 /post/etcd/05-watch/
    565 /post/etcd/06-why-mvcc/
    403 /post/etcd/03-v3-analyze/
    354 /post/grpc/00-faq/
    335 /post/elasticsearch/01-install-by-docker/
    285 /post/etcd/04-etcd-architecture/
    253 /post/grpc/04-interceptor/
    231 /post/etcd/01-install/
    230 /post/git/04-git-reduce/
    225 /post/mysql/04-cap-lock/
```



## 3. 小结

主要用到了以下几个命令

* **wc** 统计文件内容行数、字数、字节数
  * -l 只统计行数
* **cat** 查看文件内容
  * 会一次性加载出所有内容，不建议用在大文件上
  * ls -h 先查看文件大小
* **awk**文本分析工具
* **sort** 排序
  * 默认升序 -r参数指定降序
  * 默认按字符排序（该情况下2>10 因为 2>1） -n 参数指定按照数值大小排序 
* **grep**过滤
  * 支持正则表达式
* **uniq** 去重
  * 大部分情况下需要和sort配合使用
* **head** 控制输出行数
  * 和sort配合可以只输出topn
* **管道操作符** `|`
  * 通过该命令可以将一个命令的输出作为另一个命令的输出 非常常用



