---
layout: post
title: 二叉树与红黑树
categories: [数据结构与算法]
description: Java数据结构与算法之二叉树与红黑树
keywords: Java, Binary-Search-Tree
---

# Java数据结构与算法之树

## 1.二叉查找树（Binary Search Tree）

### 1.1特性

1.**左**子树上所有结点的值均**小于或等于**它的根结点的值。

2.**右**子树上所有结点的值均**大于或等于**它的根结点的值。

3.左、右子树也分别为二叉查找树。

下图就是一颗典型的二叉查找树：

![二叉查找树](https://github.com/lillusory/lillusory.github.io/raw/master/images/posts/Java/2018-12-30-Java-bst.jpg)



### 1.2查找

查找所需的最大次数等同于二叉树的最大高度

### 1.3缺陷

假设初始的二叉查找树只有三个节点，根节点值为9，左孩子值为8，右孩子值为12：

![](https://github.com/lillusory/lillusory.github.io/raw/master/images/posts/Java/2018-12-30-Java-bst-normal.jpg)

接下来我们依次插入如下五个节点：7,6,5,4,3。依照二叉查找树的特性，结果会变成什么样呢？

![](https://github.com/lillusory/lillusory.github.io/raw/master/images/posts/Java/2018-12-30-Java-bst-insert-bad.jpg)

在插入新节点时二叉树变得不那么平衡了。所以出现了**红黑树**;

## 2.红黑树（Red Black Tree）

### 2.1 特性

1.节点是红色或黑色。

2.根节点是黑色。

3.每个叶子节点都是黑色的空节点（NIL节点）。

4 每个红色节点的两个子节点都是黑色。(从每个叶子到根的所有路径上不能有两个连续的红色节点)

5.从任一节点到其每个叶子的所有路径都包含相同数目的黑色节点。

下图就是一颗典型的红黑树：

![红黑树](https://github.com/lillusory/lillusory.github.io/raw/master/images/posts/Java/2018-12-30-Java-bst-rbt-normal.jpg)

在插入或者删除节点时做出调整，以保持树的平衡。

### 2.2 调整

#### 变色

为了重新符合红黑树的规则，尝试把红色节点变为黑色，或者把黑色节点变为红色。 

#### 旋转

**左旋转：**

![left-rotate](https://github.com/lillusory/lillusory.github.io/raw/master/images/posts/Java/2018-12-30-Java-bst-rbt-left-rotate.gif)

**逆时针**旋转红黑树的两个节点，使得父节点被自己的右孩子取代，而自己成为自己的左孩子。

```java
原文：https://blog.csdn.net/eson_15/article/details/51144079
/*************对红黑树节点x进行左旋操作 ******************/
/*
 * 左旋示意图：对节点x进行左旋
 *     p                       p
 *    /                       /
 *   x                       y
 *  / \                     / \
 * lx  y      ----->       x  ry
 *    / \                 / \
 *   ly ry               lx ly
 * 左旋做了三件事：
 * 1. 将y的左子节点赋给x的右子节点,并将x赋给y左子节点的父节点(y左子节点非空时)
 * 2. 将x的父节点p(非空时)赋给y的父节点，同时更新p的子节点为y(左或右)
 * 3. 将y的左子节点设为x，将x的父节点设为y
 */
public void leftRotate(RBNode<T> x) {
    if (x == null) return;
    //1. 将y的左子节点赋给x的右子节点,并将x赋给y左子节点的父节点(y左子节点非空时)
    RBNode<T> y = x.right;
    x.right = y.left;
    if (y.left != null) {
        y.left.parent = x;
    }
    //2. 将x的父节点p(非空时)赋给y的父节点，同时更新p的子节点为y(左或右)
    y.parent = x.parent;
    if (x.parent == null) {
        //mRoot是RBTree的根节点
        this.mRoot = y;
    } else {
        if (x == x.parent.left) {
            x.parent.left = y;
        } else {
            x.parent.right = y;
        }
    } 	
    //3. 将y的左子节点设为x，将x的父节点设为y
    y.left = x;
    x.parent = y;
}
```

**右旋转：**

![right-rotate](https://github.com/lillusory/lillusory.github.io/raw/master/images/posts/Java/2018-12-30-Java-bst-rbt-right-rotate.gif)

**顺时针**旋转红黑树的两个节点，使得父节点被自己的左孩子取代，而自己成为自己的右孩子。

```java
原文：https://blog.csdn.net/eson_15/article/details/51144079
/*************对红黑树节点y进行右旋操作 ******************/
/*
 * 右旋示意图：对节点y进行右旋
 *        p                   p
 *       /                   /
 *      y                   x
 *     / \                 / \
 *    x  ry   ----->      lx  y
 *   / \                     / \
 * lx  rx                   rx ry
 * 右旋做了三件事：
 * 1. 将x的右子节点赋给y的左子节点,并将y赋给x右子节点的父节点(x右子节点非空时)
 * 2. 将y的父节点p(非空时)赋给x的父节点，同时更新p的子节点为x(左或右)
 * 3. 将x的右子节点设为y，将y的父节点设为x
 */
public void rightRotate(RBNode<T> y) {
    if (y == null) return;
    //1. 将x的右子节点赋给y的左子节点,并将y赋给x右子节点的父节点(x右子节点非空时)
    RBNode<T> x = y.left;
    y.left = x.right;
    if (x.right != null) {
        x.right.parent = y;
    }
    //2. 将y的父节点p(非空时)赋给x的父节点，同时更新p的子节点为x(左或右)
    x.parent = y.parent;
    if (y.parent == null) {
        this.mRoot = x;
    } else {
        if (y == y.parent.left) {
            y.parent.left = x;
        } else {
            y.parent.right = x;
        }
    }
    //3. 将x的右子节点设为y，将y的父节点设为x
    x.right = y;
    y.parent = x;
}

```

通过自平衡调整,红黑树可以始终保持在一个较为平衡的状态.

# 参考

算不上是参考了都,全是这篇文章里看到的东西,写得特别好.

[Java二叉树](https://blog.csdn.net/eson_15/article/details/51144079)