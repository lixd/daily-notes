# MySQL如何实现ACID特性

## 1. 概述

首先需要说明的是ACID4个特性中**一致性是目的，原子性、隔离性、持久性是手段**。

数据库通过原子性（A）、隔离性（I）、持久性（D）来保证一致性（C）。

因此**数据库必须实现AID三大特性才有可能实现一致性(C)**。



## 2. 原子性

一个事务（transaction）中的所有操作，要么全部完成(**执行成功**)，要么全部不执行。事务在执行过程中发生错误，会被回滚（Rollback）到事务开始前的状态，就像这个事务从来没有执行过一样。

**InnoDB存储引擎的undo log 回滚功能保证了事务的原子性。**

事务执行过程发生错误可以通过undo log回滚。

* 原子性就是一批操作，要不全部完成，要不一个也不执行。
* 原子性的结果就是中间结果对外不可见，如果中间结果对外可见，则一致性就不会得到满足（比如操作）。





## 3. 隔离性

数据库允许多个并发事务同时对其数据进行读写和修改的能力，隔离性可以防止多个事务并发执行时由于交叉执行而导致数据的不一致。

**锁(共享锁、排他锁)则保证了事务的隔离性。**

对同一记录的修改需要获取排他锁，当事务T1先获取到后，后续的事务则会阻塞。

隔离性，指一个事务内部的操作及使用的数据对正在进行的其他事务是隔离的，并发执行的各个事务之间不能互相干扰，**正是它保证了原子操作的过程中，中间结果对其它事务不可见**。



## 4. 持久性

事务处理结束后，对数据的修改就是永久的，即便系统故障也不会丢失。

**redo log重做日志保证了事务的持久性。**

事务开始之后就产生redo log，redo log的落盘并不是随着事务的提交才写入的，而是在事务的执行过程中，便开始写入redo log文件中。

参数`innodb_flush_log_at_trx_commit`可设置在事务commit的时候必须要写入redo log文件。

没有持久性，数据都保存不下来，就更不要谈其他了。

## 5. 一致性

一致性代表了底层数据存储的完整性。

**它必须由事务系统和开发人员共同来保证**。

事务系统通过AID三大特性来满足这个要求；

开发人员则需保证数据库有适当的约束(主键，引用完整性等)，并且保证业务逻辑中的数据的正确性。



## 6. 参考

`https://www.cnblogs.com/feixiablog/articles/8301798.html`

`https://www.cnblogs.com/jianzh5/p/11643151.html`

`https://www.cnblogs.com/f-ck-need-u/archive/2018/05/08/9010872.html#auto_id_11`

`https://www.cnblogs.com/xinysu/p/6555082.html`

`《MySQL技术内幕 InnoDB存储引擎》`



推荐阅读(考虑先后顺序)：

* 数据库系统基础教程
* 数据库系统实现
* 数据密集型应用系统设计