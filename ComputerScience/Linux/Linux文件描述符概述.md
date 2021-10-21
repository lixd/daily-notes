# Linux 文件描述符



## 1. 概述

Linux系统将所有设备都当作文件来处理，而Linux用文件描述符来标识每个文件对象。其实我们可以想象我们电脑的显示器和键盘在Linux系统中都被看作是文件，而它们都有相应的文件描述符与之对应。 

## 2. 文件描述符

| 文件描述符 | 缩写   | 描述         |
| ---------- | ------ | ------------ |
| 0          | STDIN  | 标准输入     |
| 1          | STDOUT | 标准输出     |
| 2          | STDERR | 标准错误输出 |

其实我们与计算机之间的交互是我可以输入一些指令之后它给我一些输出。那么我们可以把上面表格中的文件描述符0理解为我和计算机交互时的输入，而这个输入默认是指向键盘的; 文件描述符1理解为我和计算机交互时的输出，而这个输出默认是指向显示器的；文件描述符2理解为我和计算机交互时，计算机出现错误时的输出，而这个输出默认是和文件描述符1指向一个位置;

就像我上面说的那样，既然它们是默认的，我就可以更改它们。下面的命令就是把标准输出的位置改到xlinsist文件中：

```sh
exec 1> stdout.txt
```

这回如果我输入`ls -al` 或者`ps`命令，我们的终端将不会显示任何东西。现在，我们可以新开一个终端查看stdout.txt这个文件中是否有上面两个命令所显示的内容。注意：你必须新开一个终端,否则查看的结果又写入这个文件了。

## 3. Socket描述符

 在Linux编程时，无论是在操作文件还是网络操作时都能够通过文件描述符来read或者write。 

 Linux这一套文件机制就相当于面向对象里面的多态，拿到一个文件描述符都可以进行read或者write。但是具体的read和write却跟对应文件描述符的具体实现不同。比如socket的就是走网络，普通文件的就是走磁盘IO。 

下面一张UML类图大概表现出了Linux文件描述符的大概意思：

[![img](http://blog.chinaunix.net/attachment/201202/27/23146151_1330346934JQ6F.png)](http://blog.chinaunix.net/attachment/201202/27/23146151_1330346934JQ6F.png)

 当然，为了将不同的类型的I/O与对应的文件描述符绑定，则是需要不同的初始化函数的。 

普通文件就通过open函数，指定对应的文件路径，操作系统通过路径能够找到对应的文件系统类型，如ext4啊，fat啊等等。

如果是网络呢，就通过socket函数来初始化，socket函数就通过(domain, type, protocol)来找到对应的网络协议栈，比如TCP/IP，UNIX等等。

整个Linux 文件系统的结构差不多就这个意思，socket跟他绑定也是为了统一接口。

所以网络相关的调用，如connect, bind等等，第一步基本上就是通过文件描述符找到对应的内核socket结构，然后在进行对应的操作。

```c
SYSCALL_DEFINE2(listen, int, fd, int, backlog)
{
    struct socket *sock;
    int err, fput_needed;
    int somaxconn;

    /* 通过文件描述符获得 kernel socket结构， 并且增加此结构的引用计数 */
    sock = sockfd_lookup_light(fd, &err, &fput_needed);
    if (sock) {
        /* 进行检测，看看是否满足系统设计的需求，功能上不重要 */
        somaxconn = sock_net(sock->sk)->core.sysctl_somaxconn;
        if ((unsigned)backlog > somaxconn)
            backlog = somaxconn;
        /* 检测此调用是否安全 */
        err = security_socket_listen(sock, backlog);
        /* 执行具体的listen操作，TCP啊，或者是其他网络协议等等，这个ops是在socket时候绑定的 */
        if (!err)
            err = sock->ops->listen(sock, backlog);
        /* 减少kernel socket的引用计数 */
        fput_light(sock->file, fput_needed);
    }
    return err;
}
```

 上面就是一个典型的调用listen的内核操作。 

## 4. 查看程序打开的文件描述符

根据程序名查询PID

```sh
ps -aux|grep $programName
```

根据 PID 查询文件描述符个数

```sh
lsof -p {PID}| wc -l
```

查询打开的文件描述符信息

```sh
lsof -p {PID}
```

查看打开的文件描述符 

```sh
ll proc/{PID}/fd
```





