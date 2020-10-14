# Nginx access.log 简单分析



* 1）查看文件行数 统计PV量

```shell
wc -l access.log

[root@iz2ze0ephck4d0aztho5r5z logs]# wc -l access.log
108544 access.log
```

* 2）按日期统计PV量

只显示某一列的内容

```shell
# AWK 是一种处理文本文件的语言，是一个强大的文本分析工具。
# $1 表示第一行内容
awk '{print $1}' access.log
```

按照日期统计个数并去重

```shell
awk '{print substr($4 , 2, 11)}' access.log | sort | uniq -c

[root@iz2ze0ephck4d0aztho5r5z logs]# awk '{print substr($4 , 2, 11)}' access.log | sort | uniq -c
    454 01/Aug/2020
    788 01/Jul/2020
    968 01/Jun/2020

```

* 3）UV

即按照IP去重之后统计

```shell
awk '{print $1}' access.log | sort | uniq | wc -l

[root@iz2ze0ephck4d0aztho5r5z logs]# awk '{print $1}' access.log | sort | uniq | wc -l
12354
```

* 4）每天的UV

```shell
# 将时间和IP提取出来重组成新的内容
awk '{print substr($4,2,11) " " $1}' access.log |\
# 排序并去重 这样统计出来的就是UV了
sort | uniq |\
# 取出每一行的第一列即日期 并将计数+1 让for循环打印出来
awk '{uv[$1]++;next}END{for(date in uv) print date,uv[date]}'


[root@iz2ze0ephck4d0aztho5r5z logs]awk '{print substr($4,2,11) " " $1}' access.log |\
> sort | uniq |\
> awk '{uv[$1]++;next}END{for(date in uv) print date,uv[date]}'
31/Jul/2020 254
22/May/2020 179
17/Sep/2020 244
02/Sep/2020 163
06/Jun/2020 196
14/Sep/2020 271
```

