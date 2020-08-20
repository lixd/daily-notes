# 缓存策略

## 1. 概述

比较常见的一个错误逻辑是这样的：先删除缓存，然后再更新数据库，接着后续的查询会把数据再装载的缓存中。

> 试想，两个并发操作，一个是更新操作，另一个是查询操作，更新操作删除缓存后，查询操作没有命中缓存，先把老数据读出来后放到缓存中，然后更新操作更新了数据库。于是，在缓存中的数据还是老的数据，导致缓存中的数据是脏的，而且还一直这样脏下去了。

## 2. Best Practice

更新缓存的的Design Pattern有四种：Cache aside, Read through, Write through, Write behind caching，我们下面一一来看一下这四种Pattern。

> 这些东西都是计算机体系结构里的设计，比如CPU的缓存，硬盘文件系统中的缓存，硬盘上的缓存，数据库中的缓存

### 1. Cache Aside Pattern

这是最常用最常用的 pattern 了。其具体逻辑如下：

* **query**
  * **miss**：应用程序先从 cache 取数据，没有得到，则从数据库中取数据，成功后，放到缓存中。
  * **hit**：应用程序从 cache 中取数据，取到后返回。

- **update**：先把数据存到数据库中，成功后，再让缓存失效。

**这个逻辑就没有问题了吗?**

这个逻辑依旧存在前面的并发问题。并发的查询操作拿的是没有更新的数据，但是，更新操作马上让缓存的失效了，后续的查询操作再把数据从数据库中拉出来，所以**旧数据不会一直存在**。

只有更新同时的查询请求可能会拿到旧数据，旧数据不会一直存在，而且这种概率也比较低。

这是标准的design pattern，包括Facebook的论文《[Scaling Memcache at Facebook](https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf)》也使用了这个策略。

**为什么不是写完数据库后更新缓存而是删除（过期）缓存？**

主要防止并发更新导致的脏数据问题。解决该问题要么通过 2PC 或是 Paxos 、Raft 等协议保证一致性，要么就是拼命的降低并发时脏数据的概率。

* `删除（过期）缓存`：则是用于降低并发时脏数据的概率，比较简单。

* `更新缓存` ：则需要保证一致性比较复杂且效率可能比较低，所以一般采用删除缓存。

###  2. Read/Write  through

在 Cache Aside 中应用方需要维护 一个缓存（Cache）和一个数据库（Repository），而在 Read/Write  through 中则是将二者看做单一存储，由该存储在内部维护自己的缓存（Cache），对应用来说是透明的。

#### Read through

Read through 逻辑为：在查询操作中更新缓存，也就是说，当缓存失效的时候（过期或LRU换出），Cache Aside是由调用方负责把数据加载入缓存，而Read Through 则用缓存服务自己来加载，从而对应用方是透明的。

#### Write  through

Write Through 和 Read Through 类似，不过是在更新数据时发生。

当有数据更新的时候，如果没有命中缓存（缓存中没有该数据），直接更新数据库，然后返回。

如果命中了缓存，则更新缓存，然后再由 Cache 自己更新数据库（这是一个同步操作）

可以看到 Read/Write  through 模式下存储端会自动进行缓存（Cache）和数据库（Repository）之间的同步。

### 3. Write Behind Caching Pattern

Write Behind 又叫 Write Back。**这就是Linux文件系统的Page Cache的算法。**

Write Behind Caching Pattern 具体逻辑为：在更新数据的时候，只更新缓存，不更新数据库，而我们的缓存会异步地批量更新数据库。

**优点**

这个设计的好处就是让数据的 I/O 操作飞快无比（因为直接操作内存 ），因为异步，write back 还可以合并对同一个数据的多次操作，所以性能的提高是相当可观的。

**缺点**

但是，其带来的问题是，数据不是强一致性的，而且可能会丢失。

> Unix/Linux 非正常关机会导致数据丢失，就是因为这个。

在软件设计上，我们基本上不可能做出一个没有缺陷的设计，就像算法设计中的时间换空间，空间换时间一个道理。

有时候，强一致性和高性能，高可用和高性性是有冲突的。软件设计从来都是取舍 `Trade-Off`。

另外，Write Back 实现逻辑比较复杂，因为需要 track 有哪数据是被更新的，需要刷到持久层上。

操作系统的write back 会在这个 cache 需要失效的时候（比如内存不足，或进程退出等情况），才会被真正持久化起来，，这又叫 `lazy write`。



## 3. 分布式事务

上面，我们没有考虑缓存（Cache）和持久层（Repository）的整体事务的问题。比如，更新Cache成功，更新数据库失败了怎么办？或是反过来。

这就需要分布式事务了，常见的有 2PC（ prepare, commit/rollback）

如 MySQL 的 [XA Transaction](http://dev.mysql.com/doc/refman/5.7/en/xa.html)