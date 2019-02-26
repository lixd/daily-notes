# Java生产者消费者模式

```
/**
 * 生产者消费者模式 生产者
 * @author illusoryCloud
 */
public class Product implements Runnable {
    /**
     * 队列
     */
    private Queue<Message> queue;
    /**
     * 队列最大容量
     */
    private Integer queueCapacity;
    /**
     * 可重入锁 生产者与消费者共用同一把锁
     */
    private ReentrantLock reentrantLock;
    /**
     * 条件变量 队列为空时
     */
    private Condition emptyWait;
    /**
     * 条件变量 队列满时
     */
    private Condition fullWait;

    public Product(Queue<Message> queue, Integer capaitly, ReentrantLock reentrantLock, Condition emptyWait, Condition fullWait) {
        this.queue = queue;
        queueCapacity = capaitly;
        this.reentrantLock = reentrantLock;
        this.emptyWait = emptyWait;
        this.fullWait = fullWait;
    }

    @Override
    public void run() {
        //无限循环
        while (true) {
            try {
                //每300ms执行一次 即生产一个消息
                Thread.sleep(300);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            //获取锁
            reentrantLock.lock();
            try {
                //生产前先判断一下队列是否满了
                if (queue.size() == queueCapacity) {
                    try {
                        //满了就让生产者线程在fullWait上等待 直到被消费者唤醒
                        fullWait.await();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
                //没满就继续生产消息
                Message message = Message.newBuilder()
                        .setTitle("start")
                        .setContent("no content")
                        .setTail("end")
                        .setTime(new Date())
                        .Build();
                //放入队列
                queue.add(message);
                System.out.println(Thread.currentThread().getName() + "生产   " + "现有消息数：" + queue.size());
                //生产消息后唤醒在emptyWait上等待的线程(即因为队列为空而等待的消费者线程)
                emptyWait.signalAll();
            } finally {
                //在finally中释放锁 确保出异常后也能释放锁
                reentrantLock.unlock();
            }

        }
    }

}
```

```
/**
 * 生产者消费者模式 消费者
 *
 * @author illusoryCloud
 */
public class Consumer implements Runnable {
    /**
     * 队列
     */
    private Queue<Message> queue;
    /**
     * 可重入锁 生产者与消费者共用同一把锁
     */
    private ReentrantLock reentrantLock;
    /**
     * 条件变量 队列为空时
     */
    private Condition emptyWait;
    /**
     * 条件变量 队列满时
     */
    private Condition fullWait;

    public Consumer(Queue<Message> queue, ReentrantLock reentrantLock, Condition emptyWait, Condition fullWait) {
        this.queue = queue;
        this.reentrantLock = reentrantLock;
        this.emptyWait = emptyWait;
        this.fullWait = fullWait;
    }

    @Override
    public void run() {
        //无限循环
        while (true) {
            try {
                //每1000ms执行一次 即消费一个消息
                TimeUnit.MILLISECONDS.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            //获取锁
            reentrantLock.lock();
            try {
                //消费前先判断一下队列是否为空
                if (queue.isEmpty()) {
                    try {
                        //为空就让消费者线程在emptyWait上等待 直到被生产者唤醒
                        emptyWait.await();
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
                //poll 移除队列头部元素 即消费一个消息
                Message poll = queue.poll();
                System.out.println(Thread.currentThread().getName() + "消费   " + "剩余消息数：" + queue.size());
                //消费消息后唤醒在fullWait上等待的线程(即因为队列满了而等待的消费者线程)
                fullWait.signalAll();
            } finally {
                //在finally中释放锁 确保出异常后也能释放锁
                reentrantLock.unlock();
            }

        }
    }


}

```

```
/**
 * 生产者消费者模式
 * 生产的对象
 * Message
 *
 * @author illusoryCloud
 */
public class Message {
    private String Title;
    private String Content;
    private String Tail;
    private Date Time;

    public Message() {
    }

    public static Builder newBuilder() {
        return new Builder();
    }

    public String getTitle() {
        return Title;
    }

    public String getContent() {
        return Content;
    }

    public String getTail() {
        return Tail;
    }

    public Date getTime() {
        return Time;
    }

    /**
     * 静态内部类
     */
    public static class Builder {
        private String Title;
        private String Content;
        private String Tail;
        private Date Time;

        public Builder setTitle(String title) {
            this.Title = title;
            return this;
        }

        public Builder setContent(String content) {
            this.Content = content;
            return this;
        }

        public Builder setTail(String tail) {
            this.Tail = tail;
            return this;
        }

        public Builder setTime(Date time) {
            this.Time = time;
            return this;
        }

        public Message Build() {
            Message message = new Message();
            message.Title = Title;
            message.Content = Content;
            message.Tail = Tail;
            message.Time = Time;
            return message;
        }
    }
}

```

```
/**
 * 生产者消费者模式 测试
 * 基于ReentrantLock的实现
 * 详解http://ifeve.com/producers-and-consumers-mode/
 *
 * @author illusoryCloud
 */
public class ProConTest {
    public static void main(String[] args) {
        //ReentrantLock 重入锁
        ReentrantLock reentrantLock = new ReentrantLock();
        //Condition 队列为空时让消费者在这个Condition上等待
        Condition emptyWait = reentrantLock.newCondition();
        //Condition 队列满时时让生产者在这个Condition上等待
        Condition fullWait = reentrantLock.newCondition();
        //队列最大容量
        Integer Captial = 10;
        //存消息的队列
        Queue<Message> queue = new ConcurrentLinkedQueue<>();

        //生产者
        Product p = new Product(queue, Captial, reentrantLock, emptyWait, fullWait);
        //开启一个生产者线程
        Thread p1 = new Thread(p);
        p1.start();

        //消费者
        Consumer c = new Consumer(queue, reentrantLock, emptyWait, fullWait);
        //开启两个消费者线程
        Thread c1 = new Thread(c);
        Thread c2 = new Thread(c);
        Thread c3 = new Thread(c);
        c1.start();
        c2.start();
        c3.start();
    }

}
```