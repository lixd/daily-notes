# 1.Looper、Handler、Message

## 1.Looper

对于Looper主要是prepare()和loop()两个方法。 

首先看prepare()方法 

```java
public static final void prepare() {
        if (sThreadLocal.get() != null) {
            throw new RuntimeException("Only one Looper may be created per thread");
        }
        sThreadLocal.set(new Looper(true));
}
```



sThreadLocal是一个ThreadLocal对象，可以在一个线程中存储变量。可以看到，在第5行，将一个Looper的实例放入了ThreadLocal 

下面看Looper的构造方法： 

```java
private Looper(boolean quitAllowed) {
        mQueue = new MessageQueue(quitAllowed);
        mRun = true;
        mThread = Thread.currentThread();
}
```

在构造方法中，创建了一个MessageQueue（消息队列）。 

然后我们看loop()方法： 

```java
public static void loop() {
        final Looper me = myLooper();
        if (me == null) {
            throw new RuntimeException("No Looper; Looper.prepare() wasn't called on this thread.");
        }
        final MessageQueue queue = me.mQueue;
 
        // Make sure the identity of this thread is that of the local process,
        // and keep track of what that identity token actually is.
        Binder.clearCallingIdentity();
        final long ident = Binder.clearCallingIdentity();
 
        for (;;) {
            Message msg = queue.next(); // might block
            if (msg == null) {
                // No message indicates that the message queue is quitting.
                return;
            }
 
            // This must be in a local variable, in case a UI event sets the logger
            Printer logging = me.mLogging;
            if (logging != null) {
                logging.println(">>>>> Dispatching to " + msg.target + " " +
                        msg.callback + ": " + msg.what);
            }
 
            msg.target.dispatchMessage(msg);
 
            if (logging != null) {
                logging.println("<<<<< Finished to " + msg.target + " " + msg.callback);
            }
 
            // Make sure that during the course of dispatching the
            // identity of the thread wasn't corrupted.
            final long newIdent = Binder.clearCallingIdentity();
            if (ident != newIdent) {
                Log.wtf(TAG, "Thread identity changed from 0x"
                        + Long.toHexString(ident) + " to 0x"
                        + Long.toHexString(newIdent) + " while dispatching to "
                        + msg.target.getClass().getName() + " "
                        + msg.callback + " what=" + msg.what);
            }
 
            msg.recycle();
        }
}
```

具体如下：

1.拿到Looper实例

```java
  final Looper me = myLooper();
```

2.然后拿到该looper实例中的mQueue（消息队列） 

```java
  final MessageQueue queue = me.mQueue;
```

3.进入无限循环

```java
   for (;;)  
```

4.取出一条消息，如果没有消息则阻塞

```java
 Message msg = queue.next(); // might block
            if (msg == null) {
                // No message indicates that the message queue is quitting.
                return;
            }
```

5.把消息交给msg的target的dispatchMessage方法去处理

```java
msg.target.dispatchMessage(msg);
```

Msg的target就是handler对象

6.释放资源

```java
msg.recycle();
```

##  2.Handler

```java
public Handler() {
        this(null, false);
}
public Handler(Callback callback, boolean async) {
        if (FIND_POTENTIAL_LEAKS) {
            final Class<? extends Handler> klass = getClass();
            if ((klass.isAnonymousClass() || klass.isMemberClass() || klass.isLocalClass()) &&
                    (klass.getModifiers() & Modifier.STATIC) == 0) {
                Log.w(TAG, "The following Handler class should be static or leaks might occur: " +
                    klass.getCanonicalName());
            }
        }
 
        mLooper = Looper.myLooper();
        if (mLooper == null) {
            throw new RuntimeException(
                "Can't create handler inside thread that has not called Looper.prepare()");
        }
        mQueue = mLooper.mQueue;
        mCallback = callback;
        mAsynchronous = async;
    }
```

1.获取looper对象

```java
 mLooper = Looper.myLooper();
```

2.获取 mQueue 

```java
 mQueue = mLooper.mQueue;
```

这样Handler的实例与我们Looper实例中MessageQueue关联上了。

然后看我们最常用的sendMessage方法 

```java
   public final boolean sendMessage(Message msg)
    {
        return sendMessageDelayed(msg, 0);
    }
```

```java
   public final boolean sendEmptyMessageDelayed(int what, long delayMillis) {
        Message msg = Message.obtain();
        msg.what = what;
        return sendMessageDelayed(msg, delayMillis);
    }
```

```java
 public final boolean sendMessageDelayed(Message msg, long delayMillis)
    {
        if (delayMillis < 0) {
            delayMillis = 0;
        }
        return sendMessageAtTime(msg, SystemClock.uptimeMillis() + delayMillis);
    }
```

```java
 public boolean sendMessageAtTime(Message msg, long uptimeMillis) {
        MessageQueue queue = mQueue;
        if (queue == null) {
            RuntimeException e = new RuntimeException(
                    this + " sendMessageAtTime() called with no mQueue");
            Log.w("Looper", e.getMessage(), e);
            return false;
        }
        return enqueueMessage(queue, msg, uptimeMillis);
    }
```

```java
 private boolean enqueueMessage(MessageQueue queue, Message msg, long uptimeMillis) {
        msg.target = this;
        if (mAsynchronous) {
            msg.setAsynchronous(true);
        }
        return queue.enqueueMessage(msg, uptimeMillis);
    }
```

enqueueMessage中首先为meg.target赋值为this，【如果大家还记得Looper的loop方法会取出每个msg然后交给msg,target.dispatchMessage(msg)去处理消息】，也就是把当前的handler作为msg的target属性。最终会调用queue的enqueueMessage的方法，也就是说handler发出的消息，最终会保存到消息队列中去。 

```java
public void dispatchMessage(Message msg) {
        if (msg.callback != null) {
            handleCallback(msg);
        } else {
            if (mCallback != null) {
                if (mCallback.handleMessage(msg)) {
                    return;
                }
            }
            handleMessage(msg);
        }
    }
```

```java
  /**
     * Subclasses must implement this to receive messages.
     */
    public void handleMessage(Message msg) {
    }
```

可以看到这是一个空方法，我们自己复写这个方法，然后根据msg.what进行消息处理。 1、首先Looper.prepare()在本线程中保存一个Looper实例，然后该实例中保存一个MessageQueue对象；因为Looper.prepare()在一个线程中只能调用一次，所以MessageQueue在一个线程中只会存在一个。

2、Looper.loop()会让当前线程进入一个无限循环，不端从MessageQueue的实例中读取消息，然后回调msg.target.dispatchMessage(msg)方法。

3、Handler的构造方法，会首先得到当前线程中保存的Looper实例，进而与Looper实例中的MessageQueue想关联。

4、Handler的sendMessage方法，会给msg的target赋值为handler自身，然后加入MessageQueue中。

5、在构造Handler实例时，我们会重写handleMessage方法，也就是msg.target.dispatchMessage(msg)最终调用的方法。