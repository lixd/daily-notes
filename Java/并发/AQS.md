# ReentrantLock源码分析

`ReentrantLock`的实现依赖于`AbstractQueuedSynchronizer`所以需要了解一下`AQS`

## 1. AbstractQueuedSynchronizer

### 1.1 AQS的4个属性

```java
// 头结点，大概可以看做是当前持有锁的线程
private transient volatile Node head;
// 阻塞的尾节点，每个新的节点进来，都插入到最后
private transient volatile Node tail;
//当前锁的状态，0代表没有被占用，大于0代表有线程持有当前锁 
//是可重入锁 每次获取都活加1
private volatile int state;
// 代表当前持有独占锁的线程 锁重入时用这个来判断当前线程是否已经拥有了锁
//继承自AbstractOwnableSynchronizer
private transient Thread exclusiveOwnerThread; 
```

### 1.2 阻塞队列Node节点的属性

Node 的数据结构其实也挺简单的，就是 `thread` + `waitStatus` + `pre` + `next` 四个属性而已 

```java
static final class Node {
    /** Marker to indicate a node is waiting in shared mode */
    // 标识节点当前在共享模式下
    static final Node SHARED = new Node();
    /** Marker to indicate a node is waiting in exclusive mode */
    // 标识节点当前在独占模式下
    static final Node EXCLUSIVE = null;

    // ======== 下面的几个int常量是给waitStatus用的 ===========
    /** waitStatus value to indicate thread has cancelled */
    // 表示此线程取消了争抢这个锁
    static final int CANCELLED =  1;
    /** waitStatus value to indicate successor's thread needs unparking */
    //被标识为该等待唤醒状态的后继结点，当其前继结点的线程释放了同步锁或被取消，
    //将会通知该后继结点的线程执行。
    //就是处于唤醒状态，只要前继结点释放锁，就会通知标识为SIGNAL状态的后继结点的线程执行。
    static final int SIGNAL    = -1;
    /** waitStatus value to indicate thread is waiting on condition */
    //该标识的结点处于等待队列中，结点的线程等待在Condition上,等待其他线程唤醒
    //当其他线程调用了Condition的signal()方法后，CONDITION状态的结点将
    //从等待队列转移到同步队列中，等待获取同步锁。
    static final int CONDITION = -2;
    /**
     * waitStatus value to indicate the next acquireShared should
     * unconditionally propagate
     */
    // 与共享模式相关，在共享模式中，该状态标识结点的线程处于可运行状态。
    static final int PROPAGATE = -3;
    // =====================================================
	// 节点的等待状态
    // 取值为上面的1、-1、-2、-3，或者0
    // 这么理解，暂时只需要知道如果这个值 大于0 代表此线程取消了等待，
    // 也许就是说半天抢不到锁，不抢了，ReentrantLock是可以指定timeouot的
    //AQS在判断状态时，通过用waitStatus>0表示取消状态，而waitStatus<0表示有效状态。
    volatile int waitStatus;
    // 前驱节点的引用
    volatile Node prev;
    // 后继节点的引用
    volatile Node next;
    // 这个就是线程对象
    volatile Thread thread;

}
```

## 2. ReentrantLock的使用

```java
/**
 * Server层
 * 模拟ReentrantLock使用
 *
 * @author illusoryCloud
 */
public class UserServer {
    /**
     * 默认是非公平锁 传入参数true则创建的是公平锁
     */
    private static ReentrantLock reentrantLock = new ReentrantLock(true);

    public void updateUser() {
        //加锁 同一时刻只能有一个线程更新User
        reentrantLock.lock();
        try {

            //do something
        } finally {
            //释放锁放在finally代码块中 保证出现异常等情况也能释放锁
            reentrantLock.unlock();
        }
    }
}
```

## 3. ReentrantLock源码分析

### 1. 初始化

`ReentrantLock reentrantLock = new ReentrantLock(true);`

```java
/**
 *默认是非公平锁
 */
public ReentrantLock() {
    sync = new NonfairSync();
}

public ReentrantLock(boolean fair) {
    sync = fair ? new FairSync() : new NonfairSync();
}
```

### 2. 加锁过程

`reentrantLock.lock();`

公平锁实现如下(JDK1.8)：

```java
    /**
     * Sync object for fair locks
     */
    static final class FairSync extends Sync {
        private static final long serialVersionUID = -3000897897090466540L;
		//争锁
        final void lock() {
            //1
            acquire(1);
        }  
        
        /**
         * Fair version of tryAcquire.  Don't grant access unless
         * recursive call or no waiters or is first.
         */
        protected final boolean tryAcquire(int acquires) {
            final Thread current = Thread.currentThread();
            int c = getState();
            if (c == 0) {
                if (!hasQueuedPredecessors() &&
                    compareAndSetState(0, acquires)) {
                    setExclusiveOwnerThread(current);
                    return true;
                }
            }
            else if (current == getExclusiveOwnerThread()) {
                int nextc = c + acquires;
                if (nextc < 0)
                    throw new Error("Maximum lock count exceeded");
                setState(nextc);
                return true;
            }
            return false;
        }
    }
```

`1. acquire(1);`

```java
    /**
     * 尝试获取锁
     */
    public final void acquire(int arg) {
        //tryAcquire(1) 首先尝试获取一下锁
        //若成功则不需要进入等待队列了
        //1.1
        if (!tryAcquire(arg) &&
            //1.2
            // tryAcquire(arg)没有成功，这个时候需要把当前线程挂起，放到阻塞队列中。
            acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
            //1.3
            selfInterrupt();
    }
```

`1.1 tryAcquire(1)`

```java
        /**
         * Fair version of tryAcquire.  Don't grant access unless
         * recursive call or no waiters or is first.
         * 尝试直接获取锁，返回值是boolean，代表是否获取到锁
         * 返回true：1.没有线程在等待锁；2.重入锁，线程本来就持有锁，也就可以理所当然可以直接获取
         */
        protected final boolean tryAcquire(int acquires) {
            //获取当前线程
            final Thread current = Thread.currentThread();
            //查看锁的状态
            int c = getState();
            //state == 0 此时此刻没有线程持有锁 可以直接获取锁
            if (c == 0) {
                //由于是公平锁 则在获取锁之前先看一下队列中还有没有其他等待的线程
                //讲究先来后到 所以是公平锁  这也是和非公平锁的差别
                //非公平锁在这里会直接尝试获取锁
                //1.1.1
                if (!hasQueuedPredecessors() &&
                   // 如果没有线程在等待，那就用CAS尝试获取一下锁
                   // 不成功的话，只能说明几乎同一时刻有个线程抢先获取到了锁
                   //因为刚才hasQueuedPredecessors判断是前面没有线程在等待的
                    //1.1.2
                    compareAndSetState(0, acquires)) {
                    //获取到锁后把当前线程设置为锁的拥有者
                    //1.1.3
                    setExclusiveOwnerThread(current);
                    //获取锁成功直接返回true
                    return true;
                }
            }
            //到这里说明当前锁已经被占了
            //然后判断如果当前线程就是持有锁的线程
            //那么这次就是锁的重入
            else if (current == getExclusiveOwnerThread()) {
                //把state加1
                int nextc = c + acquires;
                if (nextc < 0)
                    throw new Error("Maximum lock count exceeded");
                //1.1.4
                setState(nextc);
                return true;
            }
            //上面两个条件都不满足就返回false
            //获取锁失败了 回到上一个方法继续看
            return false;
        }
```

`1.1.1 hasQueuedPredecessors()`

```java
/**
  * 通过判断"当前线程"是不是在CLH队列的队首
  * 来返回AQS中是不是有比“当前线程”等待更久的线程
  */
public final boolean hasQueuedPredecessors() {
        // The correctness of this depends on head being initialized
        // before tail and on head.next being accurate if the current
        // thread is first in queue.
        Node t = tail; // Read fields in reverse initialization order
        Node h = head;
        Node s;
        return h != t &&
            ((s = h.next) == null || s.thread != Thread.currentThread());
    }
```

`1.1.2 compareAndSetState(0, acquires))`

```java
/**
 * 通过CAS设置锁的状态
 */     
protected final boolean compareAndSetState(int expect, int update) {
        // See below for intrinsics setup to support this
        return unsafe.compareAndSwapInt(this, stateOffset, expect, update);
    }
```

`1.1.3 setExclusiveOwnerThread(current)`

```java
/**
 * 设置锁的拥有者
 */     
protected final void setExclusiveOwnerThread(Thread thread) {
        exclusiveOwnerThread = thread;
    }
```

`1.1.4 setState(nextc)`

```java
/**
 * 设置锁的状态
 */    
protected final void setState(int newState) {
        state = newState;
    }
```

回到前面的方法

```java
    /**
     * 尝试获取锁
     */
    public final void acquire(int arg) {
        //tryAcquire(1) 首先尝试获取一下锁
        //若成功则不需要进入等待队列了
        //1.1
        if (!tryAcquire(arg) &&
            //1.2
            // tryAcquire(arg)没有成功，这个时候需要把当前线程挂起，放到阻塞队列中。
            //addWaiter(Node.EXCLUSIVE) 1.2.1
            acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
            //1.3
            selfInterrupt();
    }
```

`1.1tryAcquire`返回false则继续执行后面的

`1.2acquireQueued(addWaiter(Node.EXCLUSIVE), arg)`

`1.2.1 addWaiter(Node.EXCLUSIVE)`

```java
/**
 * 此方法的作用是把线程包装成node，同时进入到队列中
 * 参数mode此时是Node.EXCLUSIVE，代表独占模式
 */
    private Node addWaiter(Node mode) {
        Node node = new Node(Thread.currentThread(), mode);
        // Try the fast path of enq; backup to full enq on failure
        // 以下几行代码想把当前node加到链表的最后面去，也就是进到阻塞队列的最后
        Node pred = tail;

        // tail!=null --> 队列不为空
        if (pred != null) { 
            // 设置自己的前驱 为当前的队尾节点
            node.prev = pred; 
            // 用CAS把自己设置为队尾, 如果成功后，tail == node了
            //1.2.1.1
            if (compareAndSetTail(pred, node)) { 
                // 进到这里说明设置成功，当前node==tail, 将自己与之前的队尾相连，
                // 上面已经有 node.prev = pred
                // 加上下面这句，也就实现了和之前的尾节点双向连接了
                pred.next = node;
                // 线程入队了，可以返回了
                return node;
            }
        }
        // 仔细看看上面的代码，如果会到这里，
        // 说明 pred==null(队列是空的) 或者 CAS失败(有线程在竞争入队)
      	//1.2.1.2
        enq(node);
        return node;
    }
```

`1.2.1.1 compareAndSetTail(pred, node)`

```java
/**
 * 使用CAS设置队列的Tail
 */
private final boolean compareAndSetTail(Node expect, Node update) {
        return unsafe.compareAndSwapObject(this, tailOffset, expect, update);
    }
```

`1.2.1.2enq(node)`

```java
/**
 * 进入这个方法只有两种可能：1.等待队列为空 2.有线程竞争入队
 * 采用自旋的方式入队
 * CAS设置tail过程中，竞争一次竞争不到，多次竞争，总会排到的
 */
    private Node enq(final Node node) {
        //无限循环
        for (;;) {
            Node t = tail;
            // 如果队列是空的就去初始化
            if (t == null) { // Must initialize
                // CAS初始化head节点
                //1.2.1.2.1
                if (compareAndSetHead(new Node()))
                // 给后面用：这个时候head节点的waitStatus==0, 看new Node()构造方法就知道了
                // 这个时候有了head，但是tail还是null，设置一下，
                // 设置完了以后，继续for循环，下次就到下面的else分支了
                    tail = head;
            } else {
                // 下面几行，和上一个方法 addWaiter 是一样的，
                // 通过CAS将当前线程排到队尾，有线程竞争的话排不上重复排
                // 直到成功了才return 
                // 这里return后前面的addWaiter()方法也返回 
                // 接下来进入acquireQueued(addWaiter(Node.EXCLUSIVE), arg))
                node.prev = t;
                if (compareAndSetTail(t, node)) {
                    t.next = node;
                    return t;
                }
            }
        }
    }

```

`1.2 acquireQueued(addWaiter(Node.EXCLUSIVE), arg))`

```java
    /**
     * 参数node，经过addWaiter(Node.EXCLUSIVE)，此时已经进入阻塞队列
     * 如果acquireQueued(addWaiter(Node.EXCLUSIVE), arg))返回true的话
     * 意味着上面这段代码将进入selfInterrupt()，所以正常情况下，下面应该返回false
     *
     * 这个方法非常重要，应该说真正的线程挂起，然后被唤醒后去获取锁，都在这个方法里了
     */
    final boolean acquireQueued(final Node node, int arg) {
        boolean failed = true;
        try {
            boolean interrupted = false;
            for (;;) {  //这里无线循环 直到下面的条件满足
                //获取当前节点的前一个节点 设置为p
                final Node p = node.predecessor();
                //p=head说明当前节点是队列的第一个 
                // 所以当前节点可以去试抢一下锁
                // enq(node) 方法里面有提到，head是延时初始化的，而且new Node()的时候没有设置任何线程
                // 也就是说，当前的head可能不属于任何一个线程，所以作为队头，可以去试一试，
                // tryAcquire已经分析过了,就是简单用CAS试操作一下state
                if (p == head && tryAcquire(arg)) {
                    setHead(node);
                    p.next = null; // help GC
                    failed = false;
                    return interrupted;
                }
                // 到这里，说明上面的if分支没有成功
                //要么当前node本来就不是队头
                // 要么就是tryAcquire(arg)没有抢赢别人
                //1.2.2
                if (shouldParkAfterFailedAcquire(p, node) &&
                    //1.2.3
                    parkAndCheckInterrupt())
                    interrupted = true;
            }
        } finally {
            if (failed)
                cancelAcquire(node);
        }
    }
```

`1.2.2 shouldParkAfterFailedAcquire(p, node)`

```java
    /**
     * 进入这里说明抢到锁，这个方法说的是："当前线程没有抢到锁，是否需要挂起当前线程？"
     * 第一个参数是前驱节点，第二个参数代表当前线程的节点 这里一共有三个规则
     * 1.如果前继的节点状态为SIGNAL，表明当前节点需要unpark，则返回true 将导致线程阻塞
     * 2.如果前继节点状态为CANCELLED(ws>0)，说明前置节点已经被放弃，则找到一个非取消的前驱节点        *   返回false，acquireQueued方法的无限循环将递归调用该方法，直至规则1返回true
     * 3.如果前继节点状态为非SIGNAL、非CANCELLED，则设置前继的状态为SIGNAL
     *  返回false后进入acquireQueued的无限循环，与规则2同
     */
    private static boolean shouldParkAfterFailedAcquire(Node pred, Node node) {
        int ws = pred.waitStatus;
        // 前驱节点的 waitStatus == -1 ，说明前驱节点状态正常，当前线程需要挂起，直接可以返回true
        if (ws == Node.SIGNAL)
            /*
             * This node has already set status asking a release
             * to signal it, so it can safely park.
             */
            return true;

        // 前驱节点 waitStatus大于0 ，说明前驱节点取消了排队。
        // 进入阻塞队列排队的线程会被挂起，而唤醒的操作是由前驱节点完成的。
        // 所以下面这块代码说的是将当前节点的prev指向waitStatus<=0的节点，
        // 就是为当前节点找一个正常的前驱节点 毕竟当前节点需要等着前驱节点来唤醒
        if (ws > 0) {
            /*
             * Predecessor was cancelled. Skip over predecessors and
             * indicate retry.
             */
            // 这里就在循环直到找到一个waitStatus 不大于 0的前驱节点
            do { 
                node.prev = pred = pred.prev;
            } while (pred.waitStatus > 0);
            pred.next = node;
        } else {
            /*
             * waitStatus must be 0 or PROPAGATE.  Indicate that we
             * need a signal, but don't park yet.  Caller will need to
             * retry to make sure it cannot acquire before parking.
             */
            // 仔细想想，如果进入到这个分支意味着什么
            // 前驱节点的waitStatus不等于-1也不大于0，那也就是只可能是0，-2，-3
            // 这里说明一下：每个新的node入队时，waitStatu都是0
            // 用CAS将前驱节点的waitStatus设置为Node.SIGNAL(也就是-1)
            compareAndSetWaitStatus(pred, ws, Node.SIGNAL);
        }
        return false;
    }
```

`1.2.3  parkAndCheckInterrupt()`

```java
   /**
     *这个方法很简单，因为前面返回true，所以需要挂起线程，这个方法就是负责挂起线程的
     *这里用了LockSupport.park(this)来挂起线程，然后就停在这里了，等待被唤醒
     */
    private final boolean parkAndCheckInterrupt() {
        LockSupport.park(this);
        return Thread.interrupted();
    }
```

### 3. 解锁过程

`reentrantLock.unlock()` 解锁的代码比较相比加锁的要简单不少

```java
/**
 * 解锁
 */
public void unlock() {
    //1
    sync.release(1);
}
```

`1. sync.release(1)`

```java
/**
 * 释放锁
 *
 */

public final boolean release(int arg) {
   	//1.1 
    //这里尝试释放锁如果成功则进入if里面
    if (tryRelease(arg)) {
        // h赋值为当前的head节点
        Node h = head;
        //如果head节点不是null
        //并且head节点的waitStatus不等于0 即head节点不是刚初始化的
        //因为刚初始化是waitStatus是等于0的
        if (h != null && h.waitStatus != 0)
            //1.2 
            //唤醒后继节点
            unparkSuccessor(h);
        return true;
    }
    return false;
}
```

`1.1 tryRelease(1) `

```java
/**
 * 尝试释放锁
 */
protected final boolean tryRelease(int releases) {
    //可重入锁 所以state可以大于1 每次释放时state减1
    int c = getState() - releases;
    //如果当前线程不是拥有锁的线程直接抛出异常 这肯定嘛 都没获取到锁你释放什么
    if (Thread.currentThread() != getExclusiveOwnerThread())
        throw new IllegalMonitorStateException();
    // 是否完全释放锁
    boolean free = false;
    // state==0了 说明可以完全释放锁了
    if (c == 0) {
        free = true;
        //把锁的拥有者设置为null
        setExclusiveOwnerThread(null);
    }
    //锁的状态设置为0 即没有被获取
    setState(c);
    //到这里 锁已经释放了 
    //回到上边的release(1)方法
    return free;
}
```

`1.2  unparkSuccessor(h)`

```java


/**
 * Wakes up node's successor, if one exists.
 * 唤醒后继节点 如果有的话
 * @param node the node 参数node是head头结点
 */
private void unparkSuccessor(Node node) {
    /*
     * If status is negative (i.e., possibly needing signal) try
     * to clear in anticipation of signalling.  It is OK if this
     * fails or if status is changed by waiting thread.
     */
    int ws = node.waitStatus;
    // 如果head节点当前waitStatus<0, 将其修改为0
    if (ws < 0)
        compareAndSetWaitStatus(node, ws, 0);
    /*
     * Thread to unpark is held in successor, which is normally
     * just the next node.  But if cancelled or apparently null,
     * traverse backwards from tail to find the actual
     * non-cancelled successor.
     */
    // 下面的代码就是唤醒后继节点，但是有可能后继节点取消了等待（waitStatus==1）
    Node s = node.next;
  //如果直接后继节点是null或者 waitStatus > 0即取消了等待
  //那么就直接从队尾往前找，找到waitStatus<=0的所有节点中排在最前面的
    if (s == null || s.waitStatus > 0) {
        s = null;
        // 从后往前找，不必担心中间有节点取消(waitStatus==1)的情况
        for (Node t = tail; t != null && t != node; t = t.prev)
            if (t.waitStatus <= 0)
                s = t;
    }
    //如果直接后继节点不是空的就直接唤醒
    if (s != null)
        // 唤醒线程
        LockSupport.unpark(s.thread);
}
```

唤醒线程以后，被唤醒的线程将从以下代码中继续往前走：

```java
private final boolean parkAndCheckInterrupt() {
    LockSupport.park(this); // 刚刚线程被挂起在这里了
    return Thread.interrupted();
}
// 又回到这个方法了：acquireQueued(final Node node, int arg)，这个时候，node的前驱是head了
```

## 4. 参考

`https://javadoop.com/post/AbstractQueuedSynchronizer#toc0`

`https://blog.csdn.net/chen77716/article/details/6641477`

`https://www.cnblogs.com/waterystone/p/4920797.html`