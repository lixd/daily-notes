# TF-IDF

## 1. 概述

tf-idf 或者 TFIDF（term frequency–inverse document frequency），是一种数值统计，旨在反应单词对文章的重要性。

在信息检索、文本挖掘和用户建模的搜索中，它经常作为权重因子使用。是非常受欢迎的术语加权方案。

## 2. 详解

### TF

TF（term frequency）即单词在文章中的出现频率。
$$
TF=\frac{单词在文章中的出现次数}{文章总词数}
$$
这样可以避免词频偏向长文档（文档越长单词出现的次数肯定越多）。

### IDF

IDF（Inverse Document Frequency）指逆向文档频率，包含某词语的文档越少，说明该词语具有的区分能力越强,则改词的 IDF 值也会越大。
$$
IDF=log(\frac{文档总数}{包含该词的文档数+1})
$$

> 分母+1是为了避免分母为0

### TDIDF

$$
TFIDF=TF*IDF
$$

总得分即两者相乘。

### stop words

为了防止常用的词语干扰判断，一般会过滤掉停用词。

> 比如` 的`这样的词，每篇文章都大量出现，但是对分析毫无用处。



## 参考

https://en.wikipedia.org/wiki/Tf-idf

