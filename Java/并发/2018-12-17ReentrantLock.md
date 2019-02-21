# ReentrantLock



使用 `synchronized` 来做同步处理时，锁的获取和释放都是隐式的，实现的原理是通过编译后加上不同的机器指令来实现。

而 `ReentrantLock` 就是一个普通的类，它是基于 `AQS(AbstractQueuedSynchronizer)`来实现的。

是一个**重入锁**：一个线程获得了锁之后仍然可以**反复**的加锁，不会出现自己阻塞自己的情况。

> `AQS` 是 `Java` 并发包里实现锁、同步的一个重要的基础框架。



ReentrantLock 分为**公平锁**和**非公平锁**，可以通过构造方法来指定具体类型：

```
    //默认非公平锁
    public ReentrantLock() {
        sync = new NonfairSync();
    }

    //公平锁
    public ReentrantLock(boolean fair) {
        sync = fair ? new FairSync() : new NonfairSync();
    }
```

默认一般使用**非公平锁**，它的效率和吞吐量都比公平锁高的多(后面会分析具体原因)。

获取锁的过程 

第一步是尝试获取锁(`tryAcquire(arg)`) 

成功：

​	首先会判断 AQS 中的 state 是否等于 0，0 表示目前没有其他线程获得锁，当前线程就可以尝试获取锁。

注意:尝试之前会利用 hasQueuedPredecessors() 方法来判断 AQS 的队列中中是否有其他线程，如果有则不会尝试获取锁(这是公平锁特有的情况)。

如果队列中没有线程就利用 CAS 来将 AQS 中的 state 修改为1，也就是获取锁，获取成功则将当前线程置为获得锁的独占线程(setExclusiveOwnerThread(current))。

如果 state 大于 0 时，说明锁已经被获取了，则需要判断获取锁的线程是否为当前线程(ReentrantLock 支持重入)，是则需要将 state + 1，并将值更新。

失败：

如果 `tryAcquire(arg)` 获取锁失败，则需要用 `addWaiter(Node.EXCLUSIVE)` 将当前线程写入队列中。 

写入队列之后需要将当前线程挂起(利用`acquireQueued(addWaiter(Node.EXCLUSIVE), arg)` 。

会根据 `node.predecessor()` 获取到上一个节点是否为头节点，如果是则尝试获取一次锁，获取成功就万事大吉了。

如果不是头节点，或者获取锁失败，则会根据上一个节点的 `waitStatus` 状态来处理(`shouldParkAfterFailedAcquire(p, node)`)。

他是利用 `LockSupport` 的 `park` 方法来挂起当前线程的，直到被唤醒。 



公平锁与非公平锁的差异主要在获取锁：

公平锁就相当于买票，后来的人需要排到队尾依次买票，**不能插队**。

而非公平锁则没有这些规则，是**抢占模式**，每来一个人不会去管队列如何，直接尝试获取锁。

非公平锁:

```
        final void lock() {
            //直接尝试获取锁
            if (compareAndSetState(0, 1))
                setExclusiveOwnerThread(Thread.currentThread());
            else
                acquire(1);
        }
```

公平锁:

```
        final void lock() {
            acquire(1);
        }
```

还要一个重要的区别是在尝试获取锁时`tryAcquire(arg)`，非公平锁是不需要判断队列中是否还有其他线程，也是直接尝试获取锁：

```
        final boolean nonfairTryAcquire(int acquires) {
            final Thread current = Thread.currentThread();
            int c = getState();
            if (c == 0) {
                //没有 !hasQueuedPredecessors() 判断
                if (compareAndSetState(0, acquires)) {
                    setExclusiveOwnerThread(current);
                    return true;
                }
            }
            else if (current == getExclusiveOwnerThread()) {
                int nextc = c + acquires;
                if (nextc < 0) // overflow
                    throw new Error("Maximum lock count exceeded");
                setState(nextc);
                return true;
            }
            return false;
        }
```



```java
public final boolean hasQueuedPredecessors() {
    Node t = tail; 
    Node h = head;
    Node s;
    return h != t &&
        ((s = h.next) == null || s.thread != Thread.currentThread());
}
//hasQueuedPredecessors() 是通过判断"当前线程"是不是在CLH队列的队首，来返回AQS中是不是有比“当前线程”等待更久的线程。

```

(01) 先是通过tryAcquire()尝试获取锁。获取成功的话，直接返回；尝试失败的话，再通过acquireQueued()获取锁。 

(02) 尝试失败的情况下，会先通过addWaiter()来将“当前线程”加入到"CLH队列"末尾；然后调用acquireQueued()，在CLH队列中排序等待获取锁，在此过程中，线程处于休眠状态。直到获取锁了才返回。 如果在休眠等待过程中被中断过，则调用selfInterrupt()来自己产生一个中断。 