# CyclicBarrier &CountDownLatch

## 1.CyclicBarrier 
```java
    @Test
    public void CyclicBarrier() {
        /**
         * cyclicBarrier 
         * 参数10代表要10个线程准备好了才执行cyclicBarrier.await()后的代码
         */
        CyclicBarrier cyclicBarrier = new CyclicBarrier(10);
        Runnable r = () -> {
            System.out.println(Thread.currentThread().getName() + " is ready");
            try {
                cyclicBarrier.await();
            } catch (Exception e) {
                e.printStackTrace();
            }
            System.out.println(Thread.currentThread().getName() + " is finish");
        };
        // 创建线程池
        ExecutorService threadPool = Executors.newFixedThreadPool(10);
        //开始执行
        for (int i = 0; i < 10; i++) {
            threadPool.execute(r);
        }
    }
    
    //输出
    pool-1-thread-1 is ready
    pool-1-thread-2 is ready
    pool-1-thread-3 is ready
    pool-1-thread-4 is ready
    pool-1-thread-5 is ready
    pool-1-thread-6 is ready
    pool-1-thread-7 is ready
    pool-1-thread-8 is ready
    pool-1-thread-9 is ready
    pool-1-thread-10 is ready
    pool-1-thread-10 is finish
    pool-1-thread-1 is finish
    pool-1-thread-2 is finish
    pool-1-thread-4 is finish
    pool-1-thread-7 is finish
    pool-1-thread-8 is finish
    pool-1-thread-3 is finish
    pool-1-thread-9 is finish
    pool-1-thread-6 is finish
    pool-1-thread-5 is finish
```

## 2.CountDownLatch
```java

    @Test
    public void CountDownLatch() {
        CountDownLatch countDownLatch = new CountDownLatch(10);
        Runnable r = () -> {
            System.out.println(Thread.currentThread().getName() + " is finish");
            //每完成一个线程让countDownLatch减1 为0时 阻塞在countDownLatch.await();的线程才会继续执行
            countDownLatch.countDown();
        };
        // 创建线程池
        ExecutorService threadPool = Executors.newFixedThreadPool(10);
        Thread mainThread = new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("mainThread" + " is wait");
                try {
                    countDownLatch.await();
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println("mainThread" + " is finish");
            }
        });
        mainThread.start();
        //开始执行
        for (int i = 0; i < 10; i++) {
            threadPool.execute(r);
        }
    }
    //输出
    mainThread is wait
    pool-1-thread-2 is finish
    pool-1-thread-3 is finish
    pool-1-thread-1 is finish
    pool-1-thread-4 is finish
    pool-1-thread-5 is finish
    pool-1-thread-6 is finish
    pool-1-thread-7 is finish
    pool-1-thread-8 is finish
    pool-1-thread-9 is finish
    pool-1-thread-10 is finish
    mainThread is finish
```

## 3. CyclicBarrier和CountDownLatch的区别
CountDownLatch是计数器，只能使用一次，而CyclicBarrier的计数器提供reset功能，可以多次使用。
对于CountDownLatch来说，重点是“一个线程（多个线程）等待”，而其他的N个线程在完成“某件事情”之后，可以终止，也可以等待。
而对于CyclicBarrier，重点是多个线程，在任意一个线程没有完成，所有的线程都必须等待。