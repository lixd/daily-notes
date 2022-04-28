# jq

## 1. 什么是 jq



> [tutorial](https://stedolan.github.io/jq/tutorial/)
>
> [manual](https://stedolan.github.io/jq/manual)
>
> [linux工具之jq](https://blog.csdn.net/weixin_44398879/article/details/85774977)



以下是来自官网的描述：[jq](https://github.com/stedolan/jq)

> jq is a lightweight and flexible command-line JSON processor.



## 2. 基本使用

首先准备一个 json 数据

```bash
wget https://api.github.com/repos/stedolan/jq/commits?per_page=5 -O tmp.json
```



### 点命令

 **点命令 `.`** ：对内容做 json 格式化处理并输出

```bash
cat tmp.json| jq '.'
```



### [index]命令

**[index]** 命令：根据索引选取指定数据。

* .[0]：打印出第一个元素

* .[1]：打印第二个元素

* .[]：**不指定 index 则会打印全部元素**。

```bash
cat tmp.json | jq '.[0]'
cat tmp.json | jq '.[]'
```



### 管道线 `|`

**管道线 `|`**：jq支持管道线 `|`，它如同linux命令中的管道线——把前面命令的输出当作是后面命令的输入。如下命令把.[0]作为{…}的输入，进而访问嵌套的属性。

```bash
cat tmp.json | jq '.[0] | {commitId: .sha,author:.commit.author.name}'
```

输出如下

```bash
{
  "commitId": "f9afa950e26f5d548d955f92e83e6b8e10cc8438",
  "author": "Owen Ou"
}
```



### 自定义key

**自定义key**

在{}中，冒号前面的名字是映射的名称，你可以任意修改，如：

```bash
$ cat tmp.json | jq '.[0] | {customCommitId: .sha,customAuthor:.commit.author.name}'

{
  "customCommitId": "f9afa950e26f5d548d955f92e83e6b8e10cc8438",
  "customAuthor": "Owen Ou"
}
```





### [] 命令

**[]**：如果希望把jq的输出当作一个数组，可以用[]把整个指令框起来。

```bash
# 就像这样
cat tmp.json | jq '[{command}]'
# 修改之前的语句，打印出所有提交信息
cat tmp.json | jq '[.[] | {commitId: .sha,author:.commit.author.name}]'
```

输出如下：

```bash
[
  {
    "commitId": "f9afa950e26f5d548d955f92e83e6b8e10cc8438",
    "author": "Owen Ou"
  },
  {
    "commitId": "6c24c71ddb32441de28521203ade7d3737203b29",
    "author": "Owen Ou"
  },
  {
    "commitId": "a9f97e9e61a910a374a5d768244e8ad63f407d3e",
    "author": "Nicolas Williams"
  },
  {
    "commitId": "0c3455d3290fa03da8c01c135dd7126a80ed28a8",
    "author": "Nicolas Williams"
  },
  {
    "commitId": "1a1804afcb88cdc3f1f0e74e83385146b55ae205",
    "author": "Nicolas Williams"
  }
]
```

