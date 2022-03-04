# fork



[fork(2) — Linux manual page](https://man7.org/linux/man-pages/man2/for
[k.2.html)

```shell
$ man fork
```



## 1. 概述

* 在Linux中fork函数是非常重要的函数，它的作用是从已经存在的进程中创建一个子进程，而原进程称为父进程。
* 一个进程，包括代码、数据和分配给进程的资源。fork（）函数通过系统调用创建一个与原来进程几乎完全相同的进程。
* 也就是两个进程可以做完全相同的事，但如果初始参数或者传入的变量不同，两个进程也可以做不同的事。

最重要的一点就是**对于父进程和子进程而言， fork 的返回值不同**：

* **在子进程中**：fork 函数返回 0；
* **在父进程中**：fork 返回新创建子进程的进程 ID。

我们可以通过 fork 返回的值来判断当前进程是子进程还是父进程。

> 由于 fork 后的父进程和子进程都是执行的同样的代码，因此如果想要执行不同的逻辑就只能根据 fork 返回值判断执行不同分支逻辑。



## 2. Demo

```c
 #include<unistd.h>
 #include<stdio.h>
// 测试fork调用
 int main(void){
 	pid_t pid;
 	pid=fork();
 	if(pid==0)	{
 		printf("child process\n");
 		printf("child  pid is %d\n",getpid());
 		printf("child  ppid is %d\n",getppid());
 	}	else if(pid>0)	{
 		printf("parent process\n");
 		printf("parent pid is %d\n",getpid());
 		printf("parent ppid is %d\n",getppid());
 	}else	{
 		printf("fork error\n");
 	}
 	return 0;
 }
```

测试

```shell
$ gcc -o fork fork.c
$ ./fork
parent process
parent pid is 2476
parent ppid is 14565
child process
child  pid is 2477
child  ppid is 2476
```

由于 fork 出的子进程和父进程一致（除了PID），所以二者都会执行同样的代码，如果是这样那 fork 的意义就没这么大了。



比如在我们的例子中：

fork 之前代码是由父进程在执行，fork 之后的代码,从`if(pid==0)`开始就是由父进程和子进程一起执行了。

在 fork 函数执行完毕后，如果创建新进程成功，则出现两个进程，一个是子进程，一个是父进程。

> 创建新进程成功后，系统中出现两个基本完全相同的进程，这两个进程执行没有固定的先后顺序，哪个进程先执行要看系统的进程调度策略。

**由于 fork 函数在父进程和子进程得到的返回值是不一样的，因此可以通过这个判断让父进程和子进程执行不同的代码**。

可能有人可能疑惑为什么不是从 #include 处开始复制代码的，这是因为 fork 是把进程当前的情况拷贝一份，执行 fork 时，进程已经执行完了`pid_t pid`这句代码了，**fork 只拷贝下一个要执行的代码到新的进程**。

> 在fork之后两个进程用的是相同的物理空间(内存区)，子进程的代码段、数据段、堆栈都是指向父进程的物理空间，也就是说，两者的虚拟空间不同，其对应的物理空间是一个。这是出于效率的考虑，在Linux中被称为**“写时复制”（COW）**技术，只有当父子进程中有更改相应段的行为发生时，再为子进程相应的段分配物理空间。另外fork之后内核会将子进程排在队列的前面，以让子进程先执行，以免父进程执行导致写时复制，而后子进程执行exec系统调用，因无意义的复制而造成效率的下降。



## 3. 测试进程上下文切换

父进程一直 fork 创建子进程，子进程打印当前是第几个子进程之后就开始 sleep，30秒后退出。

看似什么都没干，实际运行的时候会发现系统会明细变卡了，进程上下文切换消耗还是比较大的。

```c
 #include<unistd.h>
 #include<stdio.h>
 #include<stdlib.h>
 #include<sys/types.h>
 int main(void){
 	pid_t pid;
 	int n=0,m=30;
// 	主进程一直fork子进程，直到子进程达到1W个
 	while(1){
    pid=fork();
    if(pid==0){
      break;
    }
    else if(pid>0){
      printf(" %d\n",n++);
      if (n>10000){ // 限制最多运行10000个进程
        break;
      }
    }
    else{
      exit(1);
    }
  }
  // 子进程休眠30秒后退出
   while(m--){
    printf("sleep %d\n",m);
    sleep(1);
   }
   return 0;
 }
```

