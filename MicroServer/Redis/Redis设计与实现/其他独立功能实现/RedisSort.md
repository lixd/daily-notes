# Redis排序

## 1. 概述

Redis的SORT命令可以对列表键、集合键、或者有序集合的值进行排序。

排序命令包括:`ASC`、`DESC`、`ALPHA`、`LIMIT`、`STORE`、`BY`、`GET`等



## 2. 实现

SORT 命令的最简单执行形式为：

```
SORT <key>
```

这个命令可以对一个包含数字值的键 `key` 进行排序。

服务器执行 `SORT numbers` 命令的详细步骤如下：

1. 创建一个和 `numbers` 列表长度相同的数组， 该数组的每个项都是一个 `redis.h/redisSortObject` 结构，
2. 遍历数组， 将各个数组项的 `obj` 指针分别指向 `numbers` 列表的各个项， 构成 `obj` 指针和列表项之间的一对一关系
3. 遍历数组， 将各个 `obj` 指针所指向的列表项转换成一个 `double` 类型的浮点数， 并将这个浮点数保存在相应数组项的 `u.score` 属性里面， 如图 IMAGE_SET_SCORE 所示。
4. 根据数组项 `u.score` 属性的值， 对数组进行数字值排序， 排序后的数组项按 `u.score` 属性的值从小到大排列
5. 遍历数组， 将各个数组项的 `obj` 指针所指向的列表项作为排序结果返回给客户端： 程序首先访问数组的索引 `0` ， 返回 `u.score` 值为`1.0` 的列表项 `"1"` ； 然后访问数组的索引 `1` ， 返回 `u.score` 值为 `2.0` 的列表项 `"2"` ； 最后访问数组的索引 `2` ， 返回 `u.score` 值为`3.0` 的列表项 `"3"` 。

```c
typedef struct _redisSortObject {

    // 被排序键的值
    robj *obj;

    // 权重
    union {

        // 排序数字值时使用
        double score;

        // 排序带有 BY 选项的字符串值时使用
        robj *cmpobj;

    } u;

} redisSortObject;
```

