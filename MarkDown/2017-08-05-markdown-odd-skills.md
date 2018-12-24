---
layout: post
title: 关于 Markdown 的一些语法
categories: Markdown
description: 介绍 Markdown 的一些基本用法。
keywords: Markdown
---

自从17年前开始在 GitHub 玩耍，接触到 Markdown 之后，就感觉很有意思。

不过也仅仅是了解一下基本语法，所以找了一下Markdown的语法用法来学习学习。

如下：

*注：如下技巧大多是利用 Markdown 兼容部分 HTML 标签的特性来完成，不一定在所有网站和软件里都完全支持，主要以 GitHub 支持为准。*

## 标题

```
# This is an <h1> tag
## This is an <h2> tag
###### This is an <h6> tag
```

## 重点

```
*This text will be italic*
_This will also be italic_

**This text will be bold**
__This will also be bold__

_You **can** combine them_
```

*This text will be italic*
_This will also be italic_

**This text will be bold**
__This will also be bold__

_You **can** combine them_

## 清单

### 无序

```
* Item 1
* Item 2
  * Item 2a
  * Item 2b
```

* Item 1
* Item 2
  * Item 2a
  * Item 2b

### 有序

```
1. Item 1
1. Item 2
1. Item 3
   1. Item 3a
   1. Item 3b
```

1. Item 1
2. Item 2
3. Item 3
   1. Item 3a
   2. Item 3b

## 图片

```
![GitHub Logo](/images/logo.png)
Format: ![Alt Text](url)
```

## 链接

```
http://github.com - automatic!
[GitHub](http://github.com)
```

http://github.com - automatic!
[GitHub](http://github.com)

## 引用文字

```
As Kanye West said:

> We're living the future so
> the present is our past.
```

As Kanye West said:

> We're living the future so
> the present is our past.

## 内联代码

```
I think you should use an
`<addr>` element here instead.
```

I think you should use an
`<addr>` element here instead.

## 删除线

用两个波浪线（如`~~this~~`）包裹的任何单词都会显示为划掉。

~~这是被删除的内容~~

## 在表格单元格里换行

借助于 HTML 里的 `<br />` 实现。

示例代码：

```
| Header1 | Header2                          |
|---------|----------------------------------|
| item 1  | 1. one<br />2. two<br />3. three |
```

示例效果：

| Header1 | Header2                          |
|---------|----------------------------------|
| item 1  | 1. one<br />2. two<br />3. three |

## 引用

 在引用的文字前加>即可。引用也可以嵌套，如加两个>>三个>>> 

> 这是引用的内容
>
> > 这是引用的内容

## 分割线

三个或者三个以上的 - 或者 * 都可以。 

---

***

## 流程图

```
​```flow
st=>start: 开始
op=>operation: My Operation
cond=>condition: Yes or No?
e=>end
st->op->cond
cond(yes)->e
cond(no)->op
&```
```

## 表格

```
| 左对齐标题 | 右对齐标题 | 居中对齐标题 |
| :------| ------: | :------: |
| 短文本 | 中等文本 | 稍微长一点的文本 |
| 稍微长一点的文本 | 短文本 | 中等文本 |
```

> //语法：
>
> 1）|、-、:之间的多余空格会被忽略，不影响布局。
> 2）默认标题栏居中对齐，内容居左对齐。
> 3）-:表示内容和标题栏居右对齐，:-表示内容和标题栏居左对齐，:-:表示内容和标题栏居中对齐。
> 4）内容和|之间的多余空格会被忽略，每行第一个|和最后一个|可以省略，-的数量至少有一个。

表格在渲染之后很整洁好看，但是在文件源码里却可能是这样的：

```
|Header1|Header2|
|---|---|
|a|a|
|ab|ab|
|abc|abc|
```

不知道你能不能忍，反正我是不能忍。

好在广大网友们的智慧是无穷的，在各种编辑器里为 Markdown 提供了表格格式化功能，比如我使用 Vim 编辑器，就有 [vim-table-mode](https://github.com/dhruvasagar/vim-table-mode) 插件，它能帮我自动将表格格式化成这样：

```
| Header1 | Header2 |
|---------|---------|
| a       | a       |
| ab      | ab      |
| abc     | abc     |
```

是不是看着舒服多了？

如果你不使用 Vim，也没有关系，比如 Atom 编辑器的 [markdown-table-formatter](https://atom.io/packages/markdown-table-formatter) 插件，Sublime Text 3 的 [MarkdownTableFormatter](https://github.com/bitwiser73/MarkdownTableFormatter) 等等，都提供了类似的解决方案。

## 使用 Emoji

这个是 GitHub 对标准 Markdown 标记之外的扩展了，用得好能让文字生动一些。

示例代码：

```
我和我的小伙伴们都笑了。:smile:
```

示例效果：

我和我的小伙伴们都笑了。:smile:

[Github支持的表情在这里哟](https://github.com/ikatyang/emoji-cheat-sheet/blob/master/README.md)

## 行首缩进

直接在 Markdown 里用空格和 Tab 键缩进在渲染后会被忽略掉，需要借助 HTML 转义字符在行首添加空格来实现，`&ensp;` 代表半角空格，`&emsp;` 代表全角空格。

示例代码：

```
&emsp;&emsp;春天来了，又到了万物复苏的季节。
```

示例效果：

&emsp;&emsp;春天来了，又到了万物复苏的季节。

## 展示数学公式

如果是在 GitHub Pages，可以参考 <http://wanguolin.github.io/mathmatics_rending/> 使用 MathJax 来优雅地展示数学公式（非图片）。

如果是在 GitHub 项目的 README 等地方，目前我能找到的方案只能是贴图了，以下是一种比较方便的贴图方案：

1. 在 <https://www.codecogs.com/latex/eqneditor.php> 网页上部的输入框里输入 LaTeX 公式，比如 `$$x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}$$`；

2. 在网页下部拷贝 URL Encoded 的内容，比如以上公式生成的是 `https://latex.codecogs.com/png.latex?%24%24x%3D%5Cfrac%7B-b%5Cpm%5Csqrt%7Bb%5E2-4ac%7D%7D%7B2a%7D%24%24`；

   ![](D:\lillusory\MyProject\lillusory.github.io\images\posts\Markdown\Markdown_latex_img)

3. 在文档需要的地方使用以上 URL 贴图，比如

   ```
   ![](https://latex.codecogs.com/png.latex?%24%24x%3D%5Cfrac%7B-b%5Cpm%5Csqrt%7Bb%5E2-4ac%7D%7D%7B2a%7D%24%24)
   ```

   示例效果：

   ![](https://latex.codecogs.com/png.latex?%24%24x%3D%5Cfrac%7B-b%5Cpm%5Csqrt%7Bb%5E2-4ac%7D%7D%7B2a%7D%24%24)

## 任务列表

在 GitHub 和 GitLab 等网站，除了可以使用有序列表和无序列表外，还可以使用任务列表，很适合要列出一些清单的场景。

示例代码：

```
**购物清单**

- [ ] 一次性水杯
- [x] 西瓜
- [ ] 豆浆
- [x] 可口可乐
- [ ] 小茗同学
```

示例效果：

**购物清单**

- [ ] 一次性水杯
- [x] 西瓜
- [ ] 豆浆
- [x] 可口可乐
- [ ] 小茗同学

## 自动维护目录

有时候维护一份比较长的文档，希望能够自动根据文档中的标题生成目录（Table of Contents），并且当标题有变化时自动更新目录，能减轻工作量，也不易出错。比如 Atom 编辑器的 [markdown-toc](https://atom.io/packages/markdown-toc) 插件，Sublime Text 的 [MarkdownTOC](https://packagecontrol.io/packages/MarkdownTOC) 插件等。

## 后话

希望自己，也希望大家在了解这些之后能有所收获，更好地排版，专注写作。

## 参考

* <https://raw.githubusercontent.com/matiassingers/awesome-readme/master/readme.md>

* <https://www.zybuluo.com/songpfei/note/247346>

* [支持的表情](https://guides.github.com/features/mastering-markdown/)

  ![markdown-odd-skills](https://github.com/lillusory/lillusory.github.io/raw/master/images/posts/Markdown/Markdown_odd_skills.jpg)
