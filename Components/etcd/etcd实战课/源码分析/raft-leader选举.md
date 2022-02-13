# Etcd 中的 raft leader 选举实现



> https://mp.weixin.qq.com/s?__biz=Mzg3NTU3OTgxOA==&mid=2247494951&idx=1&sn=b6193f082416ebda21046afce0be0be1&chksm=cf3dfde2f84a74f403ec88949b28bc03c7f3bfcd28697007a2b11f064b4caf0624005ec46b8a&scene=21#wechat_redirect



> 以下分析记录 etcd v3.5.1
>
> 为了便于阅读，省略了无关代码，只保留主干部分。



## 1. 节点初始化

```go
// raft/raft.go 318行
func newRaft(c *Config) *raft {
	r := &raft{
		id:                        c.ID,
		lead:                      None,
		isLearner:                 false,
		raftLog:                   raftlog,
		maxMsgSize:                c.MaxSizePerMsg,
		maxUncommittedSize:        c.MaxUncommittedEntriesSize,
		prs:                       tracker.MakeProgressTracker(c.MaxInflightMsgs),
		electionTimeout:           c.ElectionTick,
		heartbeatTimeout:          c.HeartbeatTick,
		logger:                    c.Logger,
		checkQuorum:               c.CheckQuorum,
		preVote:                   c.PreVote,
		readOnly:                  newReadOnly(c.ReadOnlyOption),
		disableProposalForwarding: c.DisableProposalForwarding,
	}

    if !IsEmptyHardState(hs) {
		r.loadState(hs)
	}
    
	r.becomeFollower(r.Term, None)
	return r
}
```

首先根据配置文件，构造一个 raft 对象，然后如果有持久化数据的话就同步一下。

重点是`r.becomeFollower(r.Term, None)`,说明节点启动的时候默认都是 follower 。

追踪下去，看下做了些什么：

```go
// raft/raft.go 686行
func (r *raft) becomeFollower(term uint64, lead uint64) {
    // 这是一个func，主要是状态机的处理逻辑
	r.step = stepFollower
	r.reset(term)
    // 这就是 选举相关的逻辑
	r.tick = r.tickElection
	r.lead = lead
	r.state = StateFollower
}
```



## 2. 超时后开启选举

`tickElection`主要是判断是否能够开始选举Leader,实际是由外部驱动的：

```go
// raft/raft.go 645行
func (r *raft) tickElection() {
    // 每次计数加一
    r.electionElapsed++
    // 如果条件允许(并不是所有节点都可以参与Leader选举的)，并且已经超时，那么就开始选举
    if r.promotable() && r.pastElectionTimeout() {
        r.Step(pb.Message{From: r.id, Type: pb.MsgHup})
    }
}
// raft/raft.go 1714行
func (r *raft) pastElectionTimeout() bool {
 // 超时时间到了就可以开始去选举Leader了
 return r.electionElapsed >= r.randomizedElectionTimeout
}
// raft/raft.go 1718行
func (r *raft) resetRandomizedElectionTimeout() {
    // 再固定的超时时间上增加一个随机值，避免出现所有节点同时超时的情况
 r.randomizedElectionTimeout = r.electionTimeout + globalRand.Intn(r.electionTimeout)
}
```

超时时间居然并不是用时间来处理，而是每次+1，有点懵，实际上由于该方法是外部调用的，所以外部比如每毫秒调用一次，那么实际上超时时间单位就是 ms 了。

> 同时通过一个简单的随机算法，是的每个节点的超时时间不一致，巧妙地避免出现所有节点同时超时的情况。



## 3. 选举处理逻辑

```go
// raft/raft.go 847行
func (r *raft) Step(m pb.Message) error {
  switch m.Type {
        case pb.MsgHup:
            if r.preVote { // 如果开启了预选机制，则进入预选流程
                r.hup(campaignPreElection)
            } else { // 否则直接进入选举流程
                r.hup(campaignElection)
            }        
    }
}
```

preVote 也是 etcd 中新增的功能，主要用于避免无效选举，以提升集群的稳定性。

> 因为有的节点注定不会成为 Leader，开启选举也是白给



```go
// raft/raft.go 760行
func (r *raft) hup(t CampaignType) {
	if r.state == StateLeader { // 已经是 Leader 就不能再发起选举了
		return
	}

	if !r.promotable() { // 不满足参与 Leader 选举的条件也是不让选
		return
	}
    // 如果还有配置修改没有应用，也不能选
	ents, err := r.raftLog.slice(r.raftLog.applied+1, r.raftLog.committed+1, noLimit)
	if n := numOfPendingConf(ents); n != 0 && r.raftLog.committed > r.raftLog.applied {
		return
	}
    // 到此，正式开始选举
	r.campaign(t)
}

```



```go
// raft/raft.go 785行
func (r *raft) campaign(t CampaignType) {
	var term uint64
	var voteMsg pb.MessageType
    // 根据始预选还是分别处理
	if t == campaignPreElection {
		r.becomePreCandidate() // 切换到 PreCandidate 状态
		voteMsg = pb.MsgPreVote
		term = r.Term + 1
	} else {
		r.becomeCandidate() // 切换到 Candidate 状态
		voteMsg = pb.MsgVote
		term = r.Term
	}
    
	if _, _, res := r.poll(r.id, voteRespMsgType(voteMsg), true); res == quorum.VoteWon {
		// We won the election after voting for ourselves (which must mean that
		// this is a single-node cluster). Advance to the next state.
		if t == campaignPreElection {
			r.campaign(campaignElection)
		} else {
			r.becomeLeader()
		}
		return
	}
     // 向所有节点发送消息
	var ids []uint64
	{
		idMap := r.prs.Voters.IDs()
		ids = make([]uint64, 0, len(idMap))
		for id := range idMap {
			ids = append(ids, id)
		}
		sort.Slice(ids, func(i, j int) bool { return ids[i] < ids[j] })
	}
   
	for _, id := range ids {
		if id == r.id { // 本节点除外
			continue
		}
			r.id, r.raftLog.lastTerm(), r.raftLog.lastIndex(), voteMsg, id, r.Term)

		var ctx []byte
		if t == campaignTransfer {
			ctx = []byte(t)
		}
		r.send(pb.Message{Term: term, To: id, Type: voteMsg, Index: r.raftLog.lastIndex(), LogTerm: r.raftLog.lastTerm(), Context: ctx})
	}
}
```

主要做了两件事：

* 切换到 Candidate 状态
* 发送投票消息给其他节点



## 4. 预选逻辑

这里的预选逻辑额外拿出来分析以下，raft paper 中没有，是 etcd 中的一个优化。

```go
if t == campaignPreElection {
    r.becomePreCandidate()
    voteMsg = pb.MsgPreVote
    term = r.Term + 1
} else {
    r.becomeCandidate()
    voteMsg = pb.MsgVote
    term = r.Term
}
```

首先看一下 `r.becomePreCandidate()`和`r.becomeCandidate()`有什么区别：

```go
// raft/raft.go 695行
func (r *raft) becomeCandidate() {
	r.step = stepCandidate
	r.reset(r.Term + 1)
	r.tick = r.tickElection
	r.Vote = r.id
	r.state = StateCandidate

}
// raft/raft.go 708行
func (r *raft) becomePreCandidate() {
	r.step = stepCandidate
	r.prs.ResetVotes()
	r.tick = r.tickElection
	r.lead = None
	r.state = StatePreCandidate
}
```

重点是，成为 candidate 调用了 `r.reset(r.Term + 1)`，把 term +1 了。

而 PreCandidate 则没有，只是在发送消息的时候，PreCandidate 把消息中的 term +1 而已。

follower切换成为candidate之后会增加系统的term，但如果该节点无法联系上系统中的大多数节点那么这次状态切换会导致term毫无意义的增大。





## 5. 投票结果处理

```go
// raft/raft.go 1376行
func stepCandidate(r *raft, m pb.Message) error {
    // 同样是预选和正选状态判定
	var myVoteRespType pb.MessageType
	if r.state == StatePreCandidate {
		myVoteRespType = pb.MsgPreVoteResp
	} else {
		myVoteRespType = pb.MsgVoteResp
	}
    // 处理投票结构
	switch m.Type {
	case myVoteRespType:
		gr, rj, res := r.poll(m.From, m.Type, !m.Reject)
		switch res {
            // 获取到了过半的选票
		case quorum.VoteWon:
            // 如果是预选那么此时就可以开始正式选举
			if r.state == StatePreCandidate {
				r.campaign(campaignElection)
			} else {
                // 如果是正选那么选举成功，切换成 leader
				r.becomeLeader()
				r.bcastAppend()
			}
		case quorum.VoteLost:
			// 如果失败了，不管是预选还是正选都切换成 follower
			r.becomeFollower(r.Term, None)
		}
	}
	return nil
}
```

投票结果有三种：

* VoteWon：成功，如果是预选那么此时就可以开始正式选举，如果是正选就成为 leader 了
* VoteLost：失败，不管是预选还是正选都切换成 follower
* VotePending：其实还有一种情况，即同意或者拒绝的票数都没到阈值，还需要进一步等待后续投票。不过Switch中没有写出来，即匹配不到上面的任何一种情况时就啥也不做。



成为 Leader 后还调用了`r.bcastAppend()`方法，发送了一条广播日志（（ 如果没有有效日志，那么也会广播一条空的 Message ）。）。

这个在 Raft Paper 中是有提到的，主要在 State Machine Safety 这一条中。

如果一条日志成功复制到大多数节点上，leader就知道可以commit了。如果leader在commit之前崩溃了，新的leader将会尝试完成复制这条日志。然而一个leader不可能立刻推导出之前term的entry已经commit了。所以 Raft 做了以下限制：

某个leader选举成功之后，不会直接提交前任leader时期的日志，而是通过提交当前任期的日志的时候“顺手”把之前的日志也提交了，具体怎么实现了，在log matching部分有详细介绍。

> 为了避免leader在整个任期中都没有收到客户端请求，导致日志一直没有被提交的情况，leader 会在在任期开始的时候发立即尝试复制、提交一条空的log。



## 6. Leader 心跳

Follower 检测到心跳超时后就会开始选举 Leader，Leader 自然需要不断的给 Follower 发送心跳以保证自己的 Leader 地位。

```go
// raft/raft.go 724行
func (r *raft) becomeLeader() {
    // 成为 Leader 后设置了另一个 tick
    r.tick = r.tickHeartbeat
    // ...
}
```



```go
// raft/raft.go 657行
func (r *raft) tickHeartbeat() {
	r.heartbeatElapsed++ // 可以看到同样是用的计数来代表时间
	r.electionElapsed++


	if r.state != StateLeader {
		return
	}
	// 如果超了就给 Follower 发一个心跳消息过去
	if r.heartbeatElapsed >= r.heartbeatTimeout {
		r.heartbeatElapsed = 0
		if err := r.Step(pb.Message{From: r.id, Type: pb.MsgBeat}); err != nil {
		}
	}
}
```



```go
// raft/raft.go 847行
func (r *raft) Step(m pb.Message) error {
	switch m.Type {
	default:
		err := r.step(r, m)
		if err != nil {
			return err
		}
	}
	return nil
}
```

实际上这个类型，啥也匹配不到，最终会进入 Default 逻辑，调用 step 方法。



Leader 的 step 方法如下：

```go
// raft/raft.go 991行
func stepLeader(r *raft, m pb.Message) error {
	switch m.Type {
	case pb.MsgBeat:
		r.bcastHeartbeat()
		return nil
}
```

广播发送心跳：

```go
// raft/raft.go 525行
func (r *raft) bcastHeartbeat() {
	lastCtx := r.readOnly.lastPendingRequestCtx()
	if len(lastCtx) == 0 {
		r.bcastHeartbeatWithCtx(nil)
	} else {
		r.bcastHeartbeatWithCtx([]byte(lastCtx))
	}
}
```

此时去看下 Follower 收到心跳后会做什么呢：

```go
// raft/raft.go 1421行
func stepFollower(r *raft, m pb.Message) error {
	switch m.Type {
	case pb.MsgHeartbeat:
		r.electionElapsed = 0 // 直接把计数清0
		r.lead = m.From
		r.handleHeartbeat(m)  // 然后回复心跳消息
}
// raft/raft.go 1513行
func (r *raft) handleHeartbeat(m pb.Message) {
	r.raftLog.commitTo(m.Commit)
	r.send(pb.Message{To: m.From, Type: pb.MsgHeartbeatResp, Context: m.Context})
}
```

处理很简单，就是清0了 electionElapsed 然后再回复一个心跳响应消息。

根据前面 Follower 的逻辑中，每次调用 tick 时，electionElapsed 会+1，如果超时阈值就会发起选举。

然后 Leader 心跳消息时会直接将 electionElapsed  清0，所以如果 Leader 正常运行，Follower 用于不会触发选举。

通过计数的方式来实现了超时时间，比较巧妙。

> 如果真的记录绝对时间可能会出现的问题：
>
> 比如某个 Follower 卡了以下，等卡回来的时候发现已经超时了，直接就开启选举。
>
> 如果用计数方式来实现则不会出现这种问题，如果 Follower 卡了则electionElapsed 计数不会增加。





## 7. 小结

1）选举流程

* Follower tick 超时
* 产生 MsgHup 
*  广播 MsgVote 消息
*  接收 MsgVoteResp
  * VoteWin：切换到 Leader
  * VoteLost：切换会 Follower

2）心跳流程

* Leader tick 超时
* 产生 MsgBeat
* 广播 MsgHeartbeat 消息 
* Follower 清零 tick 计数

> 所以 Leader 的 tick 超时要小于 Follower 的 tick 超时才行



3）**预选**不会导致其他节点任期增加，模拟投票，如果能通过才正式开启选举。预选主要用于避免无效的选举。

