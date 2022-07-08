# Go exec 包执行命令超时失效问题分析

## 现象

**使用 os/exec 执行 shell 脚本并设置超时时间，然后到超时时间之后程序并未超时退出，反而一直阻塞。**

具体代码如下：

```Go
func main() {
        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer cancel()
        // 二者都可以触发
        cmd := exec.CommandContext(ctx, "bash","/root/sleep.sh")
        // cmd := exec.CommandContext(ctx, "bash","-c","echo hello && sleep 1200")
        out, err := cmd.CombinedOutput()
        fmt.Printf("ctx.Err : [%v]\n", ctx.Err())
        fmt.Printf("error   : [%v]\n", err)
        fmt.Printf("out     : [%s]\n", string(out))
}
```

 /root/sleep.sh：

```Bash
#!/bin/bash
sleep 1200
```

运行上述代码

```Bash
[root@kc ~]# go run main.go 
```

会创建一个 bash 进程，bash 进程又会创建一个 sleep 子进程：

```Plain
[root@kc ~]# ps -ef|grep sleep                                                                                                                                                 
root     15485 15479  0 11:38 pts/1    00:00:00 bash /root/sleep.sh                                                                                                            
root     15486 15485  0 11:38 pts/1    00:00:00 sleep 1200                                                                                                                     
root     15491 15239  0 11:38 pts/2    00:00:00 grep --color=auto sleep 
```

等 context 超时之后，bash 进程被 kill 掉，进而 sleep 进程被 1 号进程托管，并且**此时程序并未退出**。

```Plain
[root@kc ~]# ps -ef|grep sleep                                                                                                                                                 
root     15486     1  0 11:38 pts/1    00:00:00 sleep 1200                                                                                                                     
root     15499 15239  0 11:38 pts/2    00:00:00 grep --color=auto sleep 
```

手动 kill 掉 sleep 进程

```Bash
kill 15486
```

此时程序退出

```Plain
[root@kc ~]# go run main.go                                                                                                                                                    
ctx.Err : [context deadline exceeded]                                                                                                                                          
error   : [signal: killed]                                                                                                                                                     
out     : [] 
```

## 原因分析

### 执行流程

exec.cmd 执行流程如下：

> 图源： [PureLife](https://chunlife.top/2019/03/22/go执行shell命令/)

![img](assets/go_exec_process.png)

首先 go 中调用 fork 创建子进程，在子进程中执行具体命令，并通过管道和子进程进行连接，子进程将结果输出到管道，go 从管道中读取。

go 与 /bin/bash 之间通过两个管道进行连接，分别用于捕获 stderr 和 stdout 输出，/bin/bash 程序退出后，管道写入端被关闭，从而 go 可以感知到子进程退出，从而立刻返回。

**猜想**：根据现象可知，创建了两个进程，超时后 bash 进程退出，但是 sleep 进程还在，如果 sleep 进程继续占有管道，那么就可能导致阻塞。后续手动 kill 掉 sleep 进程后程序退出也能印证这一点。

### 相关源码

带着这个猜想去查看一下源码，相关源码均在 os/exec/exec.go  中。

#### CombinedOutput

```Go
func (c *Cmd) CombinedOutput() ([]byte, error) {
   if c.Stdout != nil {
      return nil, errors.New("exec: Stdout already set")
   }
   if c.Stderr != nil {
      return nil, errors.New("exec: Stderr already set")
   }
   var b bytes.Buffer
   c.Stdout = &b
   c.Stderr = &b
   err := c.Run()
   return b.Bytes(), err
}

func (c *Cmd) Run() error {
   if err := c.Start(); err != nil {
      return err
   }
   return c.Wait()
}
```

CombinedOutput 逻辑很简单，和方法名一样，将 Stdout 和 Stderr 设置为同一个 writer。

Run 方法中则调用了 Start 和 Wait 方法：

- Start 方法用于启动子进程，启动后立即返回

- Wait 方法则阻塞，等待子进程结束并回收资源。

阻塞大概率出现在 Wait 方法中，因此先看 Wait 方法。

#### Wait

Wait 方法具体如下

```Go
func (c *Cmd) Wait() error {
   if c.Process == nil {
      return errors.New("exec: not started")
   }
   if c.finished {
      return errors.New("exec: Wait was already called")
   }
   c.finished = true

   state, err := c.Process.Wait()
   if c.waitDone != nil {
      close(c.waitDone)
   }
   c.ProcessState = state

   var copyError error
   for range c.goroutine {
      if err := <-c.errch; err != nil && copyError == nil {
         copyError = err
      }
   }

   c.closeDescriptors(c.closeAfterWait)

   if err != nil {
      return err
   } else if !state.Success() {
      return &ExitError{ProcessState: state}
   }

   return copyError
}
```

根据 debug 得知阻塞点就是 **err := <-c.errch**  这句。从 errch 中读取错误信息并最终返回给调用者。而 <-ch 命令阻塞的原因只有发送方未准备好，那么 errch 对应的发送方是谁呢，就在 Start 方法中：

#### Start

```Go
func (c *Cmd) Start() error {
         // ...
        if len(c.goroutine) > 0 {
                c.errch = make(chan error, len(c.goroutine))
                for _, fn := range c.goroutine {
                        go func(fn func() error) {
                                c.errch <- fn()
                        }(fn)
                }
        }

        if c.ctx != nil {
                c.waitDone = make(chan struct{})
                go func() {
                        select {
                        case <-c.ctx.Done():
                                c.Process.Kill()
                        case <-c.waitDone:
                        }
                }()
        }
      //...
```

第一部分，通过启动后台 goroutine 执行 c.goroutine 中的方法并将错误写入 c.errch，可以猜测一下应该是这里的产生了阻塞，需要继续追踪 c.goroutine 是哪儿来的。

第二部分则是开启了另一个 goroutine，用来监听 context，在超时之后会 kill 掉子进程。

> 这也符合现象中看到的，超时后 bash 进程被 kill 掉了。

接下来继续追踪 c.goroutine 是哪儿赋值的,同样是在 Start 方法中，前面提到了 go 通过管道来连接子进程以收集结果，具体逻辑就在这里：

```Go
 func (c *Cmd) Start() error {
         // ...
    type F func(*Cmd) (*os.File, error)
    for _, setupFd := range []F{(*Cmd).stdin, (*Cmd).stdout, (*Cmd).stderr} {
       fd, err := setupFd(c)
       if err != nil {
          c.closeDescriptors(c.closeAfterStart)
          c.closeDescriptors(c.closeAfterWait)
          return err
       }
       c.childFiles = append(c.childFiles, fd)
    }
  }
```

通过  (*Cmd).stdin, (*Cmd).stdout, (*Cmd).stderr 三个方法来分别处理 stdin、stdout、stderr。

> 这里先忽略掉 stdin，只看 stdout、stderr

具体 stdout、stderr 方法如下：

```Go
func (c *Cmd) stdout() (f *os.File, err error) {
   return c.writerDescriptor(c.Stdout)
}

func (c *Cmd) stderr() (f *os.File, err error) {
   // 如果 stderr 和 stdout 一样的就不重复处理了
   if c.Stderr != nil && interfaceEqual(c.Stderr, c.Stdout) {
      return c.childFiles[1], nil
   }
   return c.writerDescriptor(c.Stderr)
}
```

二者都是调用的 writerDescriptor，不过 stderr 中简单判断了一下避免重复处理。

writerDescriptor 方法如下：

```Go
func (c *Cmd) writerDescriptor(w io.Writer) (f *os.File, err error) {
   // case1
   if w == nil {
      f, err = os.OpenFile(os.DevNull, os.O_WRONLY, 0)
      if err != nil {
         return
      }
      c.closeAfterStart = append(c.closeAfterStart, f)
      return
   }
   // case2
   if f, ok := w.(*os.File); ok {
      return f, nil
   }
  // case3
   pr, pw, err := os.Pipe()
   if err != nil {
      return
   }

   c.closeAfterStart = append(c.closeAfterStart, pw)
   c.closeAfterWait = append(c.closeAfterWait, pr)
   c.goroutine = append(c.goroutine, func() error {
      _, err := io.Copy(w, pr)
      pr.Close() // in case io.Copy stopped due to write error
      return err
   })
   return pw, nil
}
```

有三个分支逻辑：

- case1：如果没有指定 stderr 或者 stdout 就直接写入 os.*DevNull* 

- case2：如果指定的 stderr 或者 stdout  是 *os.File 类型也直接返回，后续直接写入该文件

- case3：如果前两种情况都不是就进行最后一种情况，也即是最终的**阻塞点**。创建管道，子进程写入管道写端点，go 中启动一个 goroutine 从管道读端点读取并写入到指定的  stderr 或者 stdout 中。

这里只分析 case3，首先 io.Copy 方法会一直阻塞到 reader 被关闭才会返回，这也就是为什么这里会产生阻塞。

**正常情况**下 context 超时后，子进程会被 kill 掉，那么管道的写端点自然会被关闭， io.Copy 则在 copy 完成后正常返回，给 c.errch 中发送一个 nil，Wait 方法则从 c.errch 中读取到 error 就返回了，一切正常😄。

但是在之前的 demo 中除了 bash 这个子进程之外还启动了一个 sleep 子子进程，context 超时后，sleep 进程依旧在运行，并且持有管道的写端点，导致 io.Copy 一直等待，最终产生阻塞。

手动 kill 掉 sleep 进程后，管道的写端点被释放，读端点也被关闭，io.Copy 方法返回，Wait 方法才正常退出。

## 解决方案

根据上述分析可知，进入 case3 且产生子子进程就会导致阻塞，那么避免进入第三分支或者不产生子子进程即可。

### 使用 *os.File 类型接收输出

指定将 stdout、stderr 输出到文件，使用 *os.File 类型即可进入 case2，从而避免阻塞。

该方式存在两个问题：

1. 需要额外处理输出，比如从文件读取并写入到需要的地方

1. 程序退出后 子子进程被 1 号进程托管会继续运行

demo 如下：

```Go
func main() {
   ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
   defer cancel()

   cmd := exec.CommandContext(ctx, "bash", "/root/sleep.sh")
   combinedOutput, err := ioutil.TempFile("", "stdouterr")
   if err != nil {
      fmt.Println(err)
      return
   }
   defer func() { _ = os.Remove(combinedOutput.Name()) }()
   cmd.Stdout = combinedOutput
   cmd.Stderr = combinedOutput
   err = cmd.Run()
   if err != nil {
      fmt.Println(err)
   }
   _, err = combinedOutput.Seek(0, 0)

   var b bytes.Buffer
   _, err = io.Copy(&b, combinedOutput)
   if err != nil {
      fmt.Println(err)
      return
   }
   err = combinedOutput.Close()
   if err != nil {
      fmt.Println(err)
      return
   }
   fmt.Println("output:", b.String())

   fmt.Printf("ctx.Err : [%v]\n", ctx.Err())
   fmt.Printf("error   : [%v]\n", err)
}
```

### 避免产生子进程

#### 脚本方式

Shell 脚本的 5 种执行方式：

1. 使用绝对路径执行：**/root/sleep.sh**

1. 使用相对路径执行：**./sleep.sh** （需要 x 权限）

1. 使用 sh 或 bash 命令来执行：**bash /root/sleep.sh**

1. 使用 . (空格)脚本名称来执行：**.  /root/sleep.sh**

1. 使用 source 来执行(一般用于生效配置文件)：**source /root/sleep.sh**

**前三种方式都会在新的 bash 进程中执行，后续两种则会在当前 bash 进程中执行。**

> 感兴趣的可以在终端执行上面 5 条命令试一下，前 3 种都会出现 bash 进程和 sleep 进程，后两种则只会产生 sleep 进程。使用 echo $$ 打印当前 bash 进程 ID 和 sleep 进程的父进程对比即刻发现二者一致。

因为 Go 中没有 shell 环境因此只能用 **bash /root/sleep.sh**  方式执行，肯定会产生一个新的 bash 进程，该方法无效。

#### bash -c 方式

bash -c command 方式执行单条命令的时候有相关的优化，是不会产生多个进程的，因此如果将 demo 中的复杂命令或者脚本拆分成多个命令执行也可以实现。

单条命令和多条命令对比具体如下：

```Bash
[root@kc ~]# bash -c "sleep 1200"

[root@kc ~]# ps -ef|grep sleep                                                                                                                                                 
root     16449 15583  0 17:24 pts/1    00:00:00 sleep 1200                                                                                                                     
root     16451 15239  0 17:24 pts/2    00:00:00 grep --color=auto sleep
```

单条命令只会启动一个 sleep 进程

```Bash
root@kc ~]# bash -c "echo hello && sleep 1200"

[root@kc ~]# ps -ef|grep sleep                                                                                                                                                 
root     16452 15583  0 17:24 pts/1    00:00:00 bash -c echo hello && sleep 1200                                                                                               
root     16453 16452  0 17:24 pts/1    00:00:00 sleep 1200                                                                                                                     
root     16455 15239  0 17:24 pts/2    00:00:00 grep --color=auto sleep  
```

多条命令会启动一个 bash 进程和一个 sleep 进程。

**原因**

**单条命令时**：首先启动一个 bash 进程 然后发现是一个简单的命令，作为一种优化，它会调用`exec`然后在不 fork 的情况下执行该命令，然后将子 shell 替换为 sleep 命令。

**多条命令时：**需要使用子 shell 来处理`&&`操作符，它需要等待第一个命令终止的 SIGCHLD，然后决定是否需要运行第二个命令，因此不能将子 shell 替换为 sleep 命令，所以会有两个进程。

> && 表示前一条命令执行成功后才执行后续命令。

> 具体见 [shell.c](https://git.savannah.gnu.org/cgit/bash.git/tree/shell.c?id=7de27456f6494f5f9c11ea1c19024d0024f31112#n1370) 第 1370 行

因此我们只需要将 demo 中的命令拆分为以下两条命令分两次执行即可避免产生子进程

```Bash
bash -c 'echo hello'
bash -c 'sleep 1200'
```

**不过该方法改动比较大，如果脚本比较复杂基本没法用。**

### 手动 kill 所有子进程

除此之外还可以手动 kill 掉相关的子子进程，这样程序也可以正常返回。

- 通过将 cmd 的 Setpgid 设置为 true，从而创建新的进程组

- 根据 [ linux kill(2)](https://man7.org/linux/man-pages/man2/kill.2.html) 定义，指定 pid 为负数时会给这个进程组中的所有进程发送信号 

根据以上两个定义我们就可以手动 kill 掉所有的子进程了。

```Go
func main() {
   ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
   defer cancel()

   cmd := exec.CommandContext(ctx, "bash", sh)
   cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
   go func() {
      select {
      case <-ctx.Done():
         // cmd.Process.Kill()
         err := syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
         if err != nil {
            fmt.Printf("kill error   : [%v]\n", err)
         }
      }
   }()
   output, err := cmd.CombinedOutput()
   if err != nil {
      fmt.Println(err)
      return
   }

   fmt.Println("output:", string(output))
   fmt.Printf("ctx.Err : [%v]\n", ctx.Err())
   fmt.Printf("error   : [%v]\n", err)
}
```

该方法相比之下影响比较小，也没有子子进程遗留，比较完美，**推荐使用**。

### 社区提案

该问题其实很早就存在了，最早可以追溯到这个 2017 年的 Issue [#23019](https://github.com/golang/go/issues/23019)，不过为了保持向后兼容，在方案上一直没有达成共识，最新提案见这个 Issue [#50436](https://github.com/golang/go/issues/50436)，根据 [#53400](https://github.com/golang/go/issues/53400) 中的最新消息，该提案可能会在 **Go 1.20** 中实现。

大致方案为在 `exec.Cmd` 中添加一个 **Interrupt(os.Signal)** 字段，在 context 超时后将这个信号发送给子进程以关闭所有子进程。

```Go
        // Context is the context that controls the lifetime of the command
        // (typically the one passed to CommandContext).
        Context context.Context

        // If Interrupt is non-nil, Context must also be non-nil and Interrupt will be
        // sent to the child process when Context is done.
        //
        // If the command exits with a success code after the Interrupt signal has
        // been sent, Wait and similar methods will return Context.Err()
        // instead of nil.
        //
        // If the Interrupt signal is not supported on the current platform
        // (for example, if it is os.Interrupt on Windows), Start may fail
        // (and return a non-nil error).
        Interrupt os.Signal

        // If WaitDelay is non-zero, the command's I/O pipes will be closed after
        // WaitDelay has elapsed after either the command's process has exited or
        // (if Context is non-nil) Context is done, whichever occurs first.
        // If the command's process is still running after WaitDelay has elapsed,
        // it will be terminated with os.Kill before the pipes are closed.
        //
        // If the command exits with a success code after pipes are closed due to
        // WaitDelay and no Interrupt signal has been sent, Wait and similar methods
        // will return ErrWaitDelay instead of nil.
        //
        // If WaitDelay is zero (the default), I/O pipes will be read until EOF,
        // which might not occur until orphaned subprocesses of the command have
        // also closed their descriptors for the pipes.
        WaitDelay time.Duration
```

## 小结

**现象**

使用 os/exec 执行 shell 脚本并设置超时时间，然后到超时时间之后程序并未超时退出，反而一直阻塞。

**原因**

os/exec 包执行命令时会创建子进程，通过管道连接子进程以收集命令执行结果，goroutine 从管道中读取命令输出，超时后会 kill 掉子进程，从而关闭管道，管道被关闭后 goroutine 则自动退出。

**如果存在子子进程，占有管道则会导致 kill 掉子进程后管道依旧未能释放，读取输出的 goroutine 被阻塞，最终导致程序超时后也无法返回**。

**触发机制**

需要满足以下两个条件：

- 1）cmd.stdout、cmd.stderr 非 nil 且不是 *os.File 类型
  - 不满足该条件则不会进入阻塞路径

- 2）命令会产生子进程
  - 没有子进程则不会继续占用管道

**解决方案**

- 1.使用临时文件接收结果，破坏条件1
  - 只是解决阻塞问题，但是残留后台进程会继续运行

- 2.拆分复杂命令分别执行，破坏条件2

- 3.手动监听超时后 kill 掉整个进程组，手动补救

## 相关阅读

[22 shell组命令与子进程 - 声声慢43 - 博客园](https://www.cnblogs.com/mianbaoshu/p/12069777.html)

[如何在go中执行shell命令_陪计算机走过漫长岁月的博客-CSDN博客_go 执行shell脚本](https://blog.csdn.net/LuciferMS/article/details/121888491)

[Linux下Fork与Exec使用 - hicjiajia - 博客园](https://www.cnblogs.com/hicjiajia/archive/2011/01/20/1940154.html)

[golang如何launch一个shell - Go语言中文网 - Golang中文社区](https://studygolang.com/articles/29779)

[go cmd  使用小坑一记](https://www.jianshu.com/p/e147d856074c)

[如何避免 Go 命令行执行产生“孤儿”进程？](https://segmentfault.com/a/1190000040521383)

[go执行shell命令 | Pure Life](https://chunlife.top/2019/03/22/go执行shell命令/)

[when "bash -c" will cause child shell created?](https://stackoverflow.com/questions/49630873/when-bash-c-will-cause-child-shell-created)