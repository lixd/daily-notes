# Redis pipeline

## 1. 概述

 Redis本身是基于Request/Response协议（停等机制）的，正常情况下，客户端发送一个命令，等待Redis返回结果，Redis接收到命令，处理后响应。在这种情况下，如果同时需要执行大量的命令，那就是等待上一条命令应答后再执行，这中间不仅仅多了RTT（Round Time Trip），而且还频繁调用系统IO，发送网络请求。为了提升效率，这时候pipeline出现了，它允许客户端可以一次发送多条命令，而不等待上一条命令执行的结果，这和网络的Nagel算法有点像（TCP_NODELAY选项。

**pipeline不仅减少了RTT，同时也减少了IO调用次数（IO调用涉及到用户态到内核态之间的切换）。**

 要支持Pipeline，其实既要服务端的支持，也要客户端支持。对于服务端来说，所需要的是能够处理一个客户端通过同一个TCP连接发来的多个命令，可以理解为，这里将多个命令切分，和处理单个命令一样（之前老生常谈的黏包现象），Redis就是这样处理的。而客户端，则是要将多个命令缓存起来，缓冲区满了或者达到发送条件就发送出去，最后才处理Redis的应答。 



 ：Redis的Pipeline和Transaction（Redis事务）不同，Transaction会存储客户端的命令，最后一次性执行，而Pipeline则是处理一条(批次)，响应一条，从二者的不同处理机制来看，Redis事务中命令的执行是原子的（注意，其中一部分命令出现错误后续命令会继续执行，这里的原子说的是命令执行是完整的，中间不会被其他Redis命令所打断），而pipeline中命令的执行不一定是原子的。但是这里却有一点不同，就是pipeline机制中，客户端并不会调用read去读取socket里面的缓冲数据（除非已经发完pipeline中所有命令），这也就造成了，如果Redis应答的数据填满了该接收缓冲（SO_RECVBUF），那么客户端会通过ACK，WIN=0（接收窗口）来控制服务端不能再发送数据，那样子，数据就会缓冲在Redis的客户端应答缓冲区里面。所以需要**注意控制Pipeline的大小**。 

## 2. 简单使用

先按照普通get/set测试一下

```go
	for i := 0; i < 100; i++ {
		rc.Set("simple", i, 0)
		rc.Get("simple")
	}
```

然后换成pipeline

```go
	cmders, err := rc.Pipelined(func(pipeliner redis.Pipeliner) error {
		for i := 0; i < 100; i++ {
			pipeliner.Set("simple", i, 0)
			pipeliner.Get("simple")
		}
		return nil
	})
	logrus.Infof("cmders:%v,err:%v", cmders, err)
```

结果

一次get+set大概要5ms

100次用了1200ms

换成pipeline后用了4ms

提升很大

## 3. 注意事项

pipeline只适用于那些不需要获取同步结果的场景，比如hincr，hset等更新操作。而对于读取hget操作则不能适用。

pipeline组装命令也不能是没有节制的，如果pipeline组装命令数据过多，则会导致一次pipeline同步等待时间过长，影响客户端体验甚至导致网络阻塞。

pipeline不能保证命令执行的原子性。如多个命令在执行的中间发生了异常，那么将会丢失未执行的命令。所以我们一般使用pipeline时，需要自己保证执行命令的数据安全性。