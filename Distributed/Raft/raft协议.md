# Raft 协议

## 1. 背景

**什么是 Raft？**

Raft 协议是一种共识算法（consensus algorithm）。

> Raft is a consensus algorithm for managing a replicated log. It produces a result equivalent to (multi-)Paxos, and it is as efficient as Paxos, but its structure is different from Paxos; 

**为什么需要 Raft ？**

回答该问题之前可以思考一下另一个问题：**为什么需要共识算法？**

为了解决单点问题，软件系统工程师引入了数据复制技术，实现多副本。而多副本间的数据复制就会出现一致性问题。所以需要一致性协议来解决该问题。

共识算法的祖师爷是 Paxos， 但是由于它过于复杂，难于理解，工程实践上也较难落地，导致在工程界落地较慢。 Raft 算法正是为了可理解性、易实现而诞生的。

> The first drawback is that Paxos is exceptionally difficult to understand
>
> The second problem with Paxos is that it does not provide a good foundation for building practical implementations. 



## 2. Raft 算法

### 可理解性设计

为了达到易于理解的目标，raft做了很多努力，其中最主要是两件事情：

- 问题分解
- 状态简化

问题分解是将复杂的问题划分为数个可以被独立解释、理解、解决的子问题。在raft，子问题包括，*leader election*， *log replication*，*safety*，*membership changes*。

而状态简化更好理解，就是对算法做出一些限制，减少需要考虑的状态数，使得算法更加清晰，更少的不确定性（比如，保证新选举出来的 leader 会包含所有 commited log entry ）



### Raft 简介

raft 会先选举出 leader，leader 完全负责 replicated log 的管理。leader 负责接受所有客户端更新请求，然后复制到 follower 节点，并在“安全”的时候执行这些请求。如果 leader 故障，followes 会重新选举出新的 leader。

通过 leader，raft 将一致性问题分解成三个相当独立的子问题：

- **Leader Election**：当集群启动或者 leader 失效时必须选出一个新的l eader。
- **Log Replication**：leader 必须接收客户端提交的日志，并将其复制到集群中的其他节点，强制其他节点的日志与 leader 一样。
- **Safety**：最关键的安全点就是图3.2中的 State Machine Safety Property。如果任何一个 server 已经在它的状态机apply了一条日志，其他的 server 不可能在相同的 index 处 apply 其他不同的日志条目。后面将会讲述 raft 如何实现这一点。

下面两张图包含了 raft 的核心部分：

![raft-core][raft-core]

![raft-safety][raft-safety]



## 3. 子问题

### 1. Leader election

 在 raft 中，一个节点任一时刻都会处于以下三个状态之一：

* Leader
  * leader 处理所有来自客户端的请求(如果客户端访问 follower，会把请求重定向到 leader)
* Follower 
  * follower 是消极的，他们不会主动发出请求而仅仅对来自 leader 和 candidate 的请求作出回应。
* Candidate
  * Candidate 状态用来选举出一个 leader。

在正常情况下会只有一个 leader，其他节点都是 follower。

**Raft 使用心跳机制来触发 leader 选举**，具体状态转换流程如图：

![leder-election][leder-election]

可以看到：

* 所有节点启动时都是follower状态；
* 在一段时间内如果没有收到来自 leader 的心跳，从 follower 切换到 candidate，且 term+1并发起选举；
* 如果收到 majority 的投票（含自己的一票）则切换到 leader 状态；
* 如果发现其他节点 term 比自己更新，则主动切换到 follower。



#### Term

![term][term]

Raft 将时间划分为任意长度的 **term**，用连续整数编号。每一个 term都从选举开始，一个或多个 candidate 想要成为 leader，如果一个 candidate 赢得选举，它将会在剩余的 term 中作为 leader。在一些情况下选票可能会被瓜分，导致没有 leader 产生，这个 term 将会以没有 leader 结束，一个新的 term 将会很快产生。Raft 确保每个 term 至多有一个 leader。

**term 在 Raft 中起到了逻辑时钟的作用**，它可以帮助 server 检测过期信息比如过期的 leader。每一个 server 都存储有 current term 字段，会自动随时间增加。当 server 间通信的时候，会交换 current term，如果一个节点的 current term 比另一个小，它会自动将其更新为较大者。如果c andidate 或者 leader 发现了自己的 term 过期了，它会立刻转为 follower 状态。如果一个节点收到了一个含有过期的 term 的请求，它会拒绝该请求。



#### election timeout

可能会出现的一种情况是，所有 follower 节点，检测到超时后都同时发起选举，因为都会默认投票给自己，这就会导致最终没有节点可能获取到超过半数的选票，最终选举失败，然后选举超时后又开始下一轮选举，进入死循环。

Raft 使用随机选举超时来确保选票被瓜分的情况很少出现。election timeout 的值会在一个固定区间内随机的选取(比如150-300ms)。这使得在大部分情况下仅有一个 server 会检测到超时，它将会在其他节点发现超时前发起选举，则有很大概率赢得选举。



### 2. Log Replication

当有了 leader，系统就可以对外提供服务了。每一个客户端的写请求都包含着一个待状态机执行的命令，leader 会将这个命令作为新的一条日志追加到自己的日志中，然后并行向其他 server 发出AppendEntries RPC 来复制日志。

当日志被安全的复制之后，leader可以将日志 apply 到自己的状态机，并将执行结果返回给客户端。如果 follower 宕机或运行很慢，甚至丢包，leader 会无限的重试RPC (即使已经将结果报告给了客户端)，直到所有的 follower 最终都存储了相同的日志。

#### Replicated State Machine

共识算法的实现一般是基于复制状态机（Replicated state machines）.replicated state machine 用于解决分布式系统中的各种容错问题。

> If two identical, **deterministic** processes begin in the same state and get the same inputs in the same order, they will produce the same output and end in the same state.

简单来说：**相同的初始状态 + 相同的输入 = 相同的结束状态**。

通常使用 replicated log 来实现 Replicated state machine ，如下图所示：

![replicated-state-machine][replicated-state-machine]

每一个 server 都有一个日志保存了一系列的指令，state machine 会顺序执行这些指令。每一个日志都以相同顺序保存着相同的指令，因此每一个 state machine 处理相同的指令，state machine 是一样的，所以最终会达到相同的状态及输出。

**共识算法的任务则是保证 replicated log 的一致**。server 中的一致性模块接收客户端传来的指令并添加到自己的日志中，它也可以和其他 server 中的一致性模块沟通来确保每一条 log 都能有相同的内容和顺序，即使其中一些 server 宕机。 一旦指令被正确复制，就可以称作**committed**。每一个 server 中的状态机按日志顺序处理committed 指令，并将输出返回客户端。

#### 请求完整流程

当系统（leader）收到一个来自客户端的写请求，到返回给客户端，整个过程从leader的视角来看会经历以下步骤：

- 1）leader append log entry
- 2）leader issue AppendEntries RPC in parallel
- 3）leader wait for majority response
- 4）leader apply entry to state machine
- 5）leader reply to client
- 6）leader notify follower apply log

> 可以看到日志的提交过程有点类似两阶段提交(2PC)，不过与2PC的区别在于，leader只需要大多数（majority）节点的回复即可，这样只要超过一半节点处于工作状态则系统就是可用的。

在上面的流程中，leader只需要日志被复制到大多数节点即可向客户端返回，一旦向客户端返回成功消息，那么系统就必须保证log（其实是log所包含的command）在任何异常的情况下都不会发生回滚。这里有两个词：

* **commit(committed)**：指日志被复制到了大多数节点后日志的状态
* **apply(applied)**：指节点将日志应用到状态机，真正影响到节点状态



日志按下图的方式进行组织：

![log-replication][log-replication]

每条日志储存了一条命令和 leader 接收到该指令时的 term 序号。日志中的 term 序号可以用来检测不一致的情况，每一条日志也拥有一个整数索引用于定位。

从上图可以看到，五个节点的日志并不完全一致，raft算法为了保证高可用，并不是强一致性，而是**最终一致性**，leader会不断尝试给follower发log entries，直到所有节点的log entries都相同。



### 3. Safety

衡量一个分布式算法，有许多属性，如

- safety：nothing bad happens,
- liveness： something good eventually happens.

在任何系统模型下，都需要满足safety属性，即在任何情况下，系统都不能出现不可逆的错误，也不能向客户端返回错误的内容。比如，raft保证被复制到大多数节点的日志不会被回滚，那么就是safety属性。而raft最终会让所有节点状态一致，这属于liveness属性。



raft 会保证以下属性：

![raft-safety][raft-safety]



#### Election safety

选举安全性，即任一任期内最多一个leader被选出。这一点非常重要，在一个复制集中任何时刻只能有一个leader。系统中同时有多余一个leader，被称之为脑裂（brain split），这是非常严重的问题，会导致数据的覆盖丢失。在raft中，两点保证了这个属性：

* 一个节点某一任期内最多只能投一票；
* 只有获得majority投票的节点才会成为leader。

因此，**某一任期内一定只有一个leader**。



#### Leader Append-Only

leader 不允许覆盖或删除日志条目，只能在后面进行追加。

这个限制比较简单容易实现。



#### Log Matching

log匹配特性， 就是说如果两个节点上的某个log entry的log index相同且term相同，那么在该index之前的所有log entry应该都是相同的。

依赖于以下两点：

* 首先，leader 在某一 term 的任一位置只会创建一个 log entry，且 log entry 是 append-only；
* 其次，consistency check。leader在AppendEntries中包含最新log entry之前的一个log 的term和index，如果follower在对应的term index找不到日志，那么就会告知leader不一致。

在没有异常的情况下，log matching是很容易满足的，但如果出现了node crash，情况就会变得复杂=，比如下图：

![log-matching][log-matching]

> 上图的a-f是某个follower可能存在的六个状态

leader、follower都可能crash，那么follower维护的日志与leader相比可能出现以下情况

- 比leader日志少，如上图中的ab
- 比leader日志多，如上图中的cd
- 某些位置比leader多，某些日志比leader少，如ef（多少是针对某一任期而言）

**当出现了leader与follower不一致的情况，leader强制让follower保持和自己一致。**

为了使得follower的日志和leader的日志一致，leader必须找到自己和follower最后一致的日志索引，然后删掉在那之后follower的日志，并将leader在那之后的日志全部发送给follower。所有的这些操作都发生在AppendEntries RPC的一致性检查中。

leader持有针对每一个follower的nextIndex索引，代表下一条要发送给对应follower的日志索引。当leader刚上任时，它会初始化所有的nextIndex值为最后一条日志的下一个索引，如图中的11。如果follower的日志和leader的不一致，下一次AppendEntries的一致性检查就会失败。在遭到拒绝后， leader就会降低该follower的nextIndex并进行重试。最终nextIndex会到达leader和follower一致的位置。这条AppendEntries RPC会执行成功，并覆盖follower在这之后原有的日志，之后follower的日志会保持和leader一致，直到这个term结束。



#### Leader Completeness

在任何基于leader的一致性算法中，leader必须最终存有全部committed日志。

> 在一些一致性算法（如Viewstamped Replication），节点 即使不包含全部 committed 日志也能被选举为 leader，这些算法通过其他的机制来定位缺失的日志，并将其转移给新的 leader。然而这增加了系统的复杂度，raft 使用了更加简单的方法来确保所有 committed 的日志存在于每个新选举出来的 leader，不需要转移日志。因此日志只需要从 leader 流向 follower 即可，而且不需要重写自己的日志。

Raft 使用投票过程来确保选举成为 leader 的 candidate 一定包含全部committed 的日志。

具体如下：

* 1）选举时，各个节点只会投票给 commited 日志大于等于自己的节点；

* 2）Candidate 必须获得超过半数的选票才能赢得选举；
* 3）Leader 复制日志时也需要复制给超过半数的节点。

这也就意味着，每次选举出来的 leader 一定包含最新的 committed 日志。



#### State Machine Safety

如果一条日志成功复制到大多数节点上，leader就知道可以commit了。如果leader在commit之前崩溃了，新的leader将会尝试完成复制这条日志。然而一个leader不可能立刻推导出之前term的entry已经commit了。

![state-machine-safety][state-machine-safety]

上图是一个较为复杂的情况：

* 在时刻(a), s1是leader，在term2提交的日志只复制到了s1 s2两个节点就crash了。
* 在时刻(b), s5成为了term 3的leader，日志只复制到了s5，然后crash。
* 然后在(c)时刻，s1又成为了term 4的leader，开始复制日志，于是把term2的日志复制到了s3，此刻，可以看出term2对应的日志已经被复制到了majority，因此是committed，可以被状态机应用。
* 不幸的是，接下来（d）时刻，s1又crash了，s5重新当选，然后将term3的日志复制到所有节点，这就出现了一种奇怪的现象：被复制到大多数节点（或者说可能已经应用）的日志（term 2 的日志）被回滚。

究其根本，是因为term4时的leader s1在（C）时刻提交了之前term2任期的日志。为了杜绝这种情况的发生，raft 做了以下限制：

某个leader选举成功之后，不会直接提交前任leader时期的日志，而是通过提交当前任期的日志的时候“顺手”把之前的日志也提交了，具体怎么实现了，在log matching部分有详细介绍。

为了避免leader在整个任期中都没有收到客户端请求，导致日志一直没有被提交的情况，leader 会在在任期开始的时候发立即尝试复制、提交一条空的log。

因此，在上图中，不会出现（C）时刻的情况，即term4任期的leader s1不会复制term2的日志到s3。而是如同(e)描述的情况，通过复制-提交 term4的日志顺便提交term2的日志。如果term4的日志提交成功，那么term2的日志也一定提交成功，此时即使s1 crash，s5也不会重新当选。





## 4. 小结

raft将共识问题分解成三个相对独立的问题，leader election，log replication 以及 safety。

流程是先选举出leader，然后leader负责复制、提交log（log中包含command），最后通过 safety 中的各种限制保证了 raft 不会出现或者能够应对各种异常情况。

leader election约束：

* 同一任期内最多只能投一票；
* 只会投票给日志和自己一样，或者比自己新的节点

log replication约束：

- 一个log被复制到大多数节点，就是committed，保证不会回滚
- leader一定包含最新的committed log，因此leader只会追加日志，不会删除覆盖日志
- 不同节点，某个位置上日志相同，那么这个位置之前的所有日志一定是相同的
- Raft never commits log entries from previous terms by counting replicas.



## 5. 相关资料

```sh
# raft 论文 中英文
https://raft.github.io/raft.pdf
https://github.com/maemual/raft-zh_cn
# raft 动画 中英文
http://thesecretlivesofdata.com/raft/
http://kailing.pub/raft/index.html
```





[leader-election]:leader-election.png
[log-matching]:log-matching.png
[log-replication]:log-replication.png
[raft-core]:raft-core.png
[raft-safety]:raft-safety.png
[replicated-state-machine]:replicated-state-machine.png
[state-machine-safety]:state-machine-safety.png
[term]:term.png

