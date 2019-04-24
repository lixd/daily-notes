# Linux 5种 IO模型

# 1 概念说明

在进行解释之前，首先要说明几个概念：

> 用户空间和内核空间
>
> 进程切换
>
> 进程的阻塞
>
> 文件描述符
>
> 缓存 IO

## 1.1 用户空间与内核空间

现在操作系统都是采用虚拟存储器，那么对32位操作系统而言，它的寻址空间（虚拟存储空间）为4G（2的32次方）。`操作系统的核心是内核，独立于普通的应用程序，可以访问受保护的内存空间，也有访问底层硬件设备的所有权限`。为了保证用户进程不能直接操作内核（kernel），保证内核的安全，`操作系统将虚拟空间划分为两部分，一部分为内核空间，一部分为用户空间`。针对linux操作系统而言，将最高的1G字节（从虚拟地址0xC0000000到0xFFFFFFFF），供内核使用，称为内核空间，而将较低的3G字节（从虚拟地址0x00000000到0xBFFFFFFF），供各个进程使用，称为用户空间。

## 1.2 进程切换

为了控制进程的执行，内核必须有能力挂起正在CPU上运行的进程，并恢复以前挂起的某个进程的执行。这种行为被称为进程切换。因此可以说，任何进程都是在操作系统内核的支持下运行的，是与内核紧密相关的。

从一个进程的运行转到另一个进程上运行，这个过程中经过下面这些变化：

> 1. 保存处理机上下文，包括程序计数器和其他寄存器。
> 2. 更新PCB信息。
> 3. 把进程的PCB移入相应的队列，如就绪、在某事件阻塞等队列。
> 4. 选择另一个进程执行，并更新其PCB。
> 5. 更新内存管理的数据结构。
> 6. 恢复处理机上下文。

注：总而言之就是很耗资源

## 1.3 进程的阻塞

正在执行的进程，由于期待的某些事件未发生，如请求系统资源失败、等待某种操作的完成、新数据尚未到达或无新工作做等，则由系统自动执行阻塞原语(Block)，使自己由运行状态变为阻塞状态。可见，进程的阻塞是进程自身的一种主动行为，也因此只有处于运行态的进程（获得CPU），才可能将其转为阻塞状态。`当进程进入阻塞状态，是不占用CPU资源的`。

## 1.4 文件描述符fd

文件描述符（File descriptor）是计算机科学中的一个术语，`是一个用于表述指向文件的引用的抽象化概念`。

文件描述符在形式上是一个非负整数。实际上，`它是一个索引值，指向内核为每一个进程所维护的该进程打开文件的记录表`。当程序打开一个现有文件或者创建一个新文件时，内核向进程返回一个文件描述符。在程序设计中，一些涉及底层的程序编写往往会围绕着文件描述符展开。但是文件描述符这一概念往往只适用于UNIX、Linux这样的操作系统。

## 1.5 缓存 IO

`缓存 IO 又被称作标准 IO，大多数文件系统的默认 IO 操作都是缓存 IO`。在 Linux 的缓存 IO 机制中，操作系统会将 IO 的数据缓存在文件系统的页缓存（ page cache ）中，也就是说，`数据会先被拷贝到操作系统内核的缓冲区中，然后才会从操作系统内核的缓冲区拷贝到应用程序的地址空间`。

**缓存 IO 的缺点：**

`数据在传输过程中需要在应用程序地址空间和内核进行多次数据拷贝操作`，这些数据拷贝操作所带来的 CPU 以及内存开销是非常大的。

# 2 Linux IO模型

`网络IO的本质是socket的读取，socket在linux系统被抽象为流，IO可以理解为对流的操作`。刚才说了，对于一次IO访问（以read举例），`数据会先被拷贝到操作系统内核的缓冲区中，然后才会从操作系统内核的缓冲区拷贝到应用程序的地址空间`。所以说，当一个read操作发生时，它会经历两个阶段：

> 1. 第一阶段：等待数据准备 (Waiting for the data to be ready)。
> 2. 第二阶段：将数据从内核拷贝到进程中 (Copying the data from the kernel to the process)。

对于socket流而言，

> 1. 第一步：通常涉及等待网络上的数据分组到达，然后被复制到内核的某个缓冲区。
> 2. 第二步：把数据从内核缓冲区复制到应用进程缓冲区。

网络应用需要处理的无非就是两大类问题，`网络IO，数据计算`。相对于后者，网络IO的延迟，给应用带来的性能瓶颈大于后者。网络IO的模型大致有如下几种：

> - **同步模型（synchronous IO）**
> - 阻塞IO（bloking IO）
> - 非阻塞IO（non-blocking IO）
> - 多路复用IO（multiplexing IO）
> - 信号驱动式IO（signal-driven IO）
> - **异步IO（asynchronous IO）**

**注：由于signal driven IO在实际中并不常用，所以我这只提及剩下的四种IO Model。**

### 阻塞IO（bloking IO）

阻塞 I/O 是最简单的 I/O 模型，一般表现为进程或线程等待某个条件，如果条件不满足，则一直等下去。条件满足，则进行下一步操作。

![](https://mmbiz.qpic.cn/mmbiz_png/mQlO20PgUDLJyNAPpmHXFWjrXZ2uXvSeVo3htmYsApCW1lscbqBLOoqDSFEg47YxWfcyO6YqNnCpjuRbZGjbZw/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

应用进程通过系统调用 `recvfrom` 接收数据，但由于内核还未准备好数据报，应用进程就会阻塞住，直到内核准备好数据报，`recvfrom` 完成数据报复制工作，应用进程才能结束阻塞状态。

### 非阻塞IO模型

应用进程与内核交互，目的未达到之前，不再一味的等着，而是直接返回。然后通过轮询的方式，不停的去问内核数据准备有没有准备好。如果某一次轮询发现数据已经准备好了，那就把数据拷贝到用户空间中。

![](https://mmbiz.qpic.cn/mmbiz_jpg/mQlO20PgUDLJyNAPpmHXFWjrXZ2uXvSek6qWHALUicEVcAicEb9VBIehiaQEZWmUE62T87cQFTLToKme4JJhoCRYg/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

应用进程通过 `recvfrom` 调用不停的去和内核交互，直到内核准备好数据。如果没有准备好，内核会返回`error`，应用进程在得到`error`后，过一段时间再发送`recvfrom`请求。在两次发送请求的时间段，进程可以先做别的事情。

### 信号驱动IO模型

应用进程在读取文件时通知内核，如果某个 socket 的某个事件发生时，请向我发一个信号。在收到信号后，信号对应的处理函数会进行后续处理。

![](https://mmbiz.qpic.cn/mmbiz_jpg/mQlO20PgUDLJyNAPpmHXFWjrXZ2uXvSe3jGJekgJ1X4kjia7AABicVEAvNVXDQBI4o2pLW3b9EiaibiavFnTBABicUfw/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

应用进程预先向内核注册一个信号处理函数，然后用户进程返回，并且不阻塞，当内核数据准备就绪时会发送一个信号给进程，用户进程便在信号处理函数中开始把数据拷贝的用户空间中。

### IO复用模型

多个进程的IO可以注册到同一个管道上，这个管道会统一和内核进行交互。当管道中的某一个请求需要的数据准备好之后，进程再把对应的数据拷贝到用户空间中。

![](https://mmbiz.qpic.cn/mmbiz_jpg/mQlO20PgUDLJyNAPpmHXFWjrXZ2uXvSeud0ZosTZicUtNxS1xwjibBAGIF1WInW43rJAzWdibsaSVUUMVgNsFrGibQ/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

IO多路转接是多了一个`select`函数，多个进程的IO可以注册到同一个`select`上，当用户进程调用该`select`，`select`会监听所有注册好的IO，如果所有被监听的IO需要的数据都没有准备好时，`select`调用进程会阻塞。当任意一个IO所需的数据准备好之后，`select`调用就会返回，然后进程在通过`recvfrom`来进行数据拷贝。

**这里的IO复用模型，并没有向内核注册信号处理函数，所以，他并不是非阻塞的。**进程在发出`select`后，要等到`select`监听的所有IO操作中至少有一个需要的数据准备好，才会有返回，并且也需要再次发送请求去进行文件的拷贝。

### 异步IO模型

应用进程把IO请求传给内核后，完全由内核去操作文件拷贝。内核完成相关操作后，会发信号告诉应用进程本次IO已经完成。

![](https://mmbiz.qpic.cn/mmbiz_jpg/mQlO20PgUDLJyNAPpmHXFWjrXZ2uXvSeM1kjXMOiaZ5CgM3bBPlEeUvhib2vRtMqvwL8r2OWiaGtzj4QwiawTPtHEg/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

用户进程发起`aio_read`操作之后，给内核传递描述符、缓冲区指针、缓冲区大小等，告诉内核当整个操作完成时，如何通知进程，然后就立刻去做其他事情了。当内核收到`aio_read`后，会立刻返回，然后内核开始等待数据准备，数据准备好以后，直接把数据拷贝到用户控件，然后再通知进程本次IO已经完成。

## 5种IO模型对比

# 3 五种IO模型总结

## 3.1 blocking和non-blocking区别#

调用blocking IO会一直block住对应的进程直到操作完成，而non-blocking IO在kernel还准备数据的情况下会立刻返回。

## 3.2 synchronous IO和asynchronous IO区别

在说明synchronous IO和asynchronous IO的区别之前，需要先给出两者的定义。POSIX的定义是这样子的：

> A synchronous I/O operation causes the requesting process to be blocked until that I/O operation completes;
>
> An asynchronous I/O operation does not cause the requesting process to be blocked;

`两者的区别就在于synchronous IO做”IO operation”的时候会将process阻塞`。按照这个定义，之前所述的blocking IO，non-blocking IO，IO multiplexing都属于synchronous IO。

有人会说，non-blocking IO并没有被block啊。这里有个非常“狡猾”的地方，`定义中所指的”IO operation”是指真实的IO操作`，就是例子中的recvfrom这个system call。non-blocking IO在执行recvfrom这个system call的时候，如果kernel的数据没有准备好，这时候不会block进程。但是，`当kernel中数据准备好的时候，recvfrom会将数据从kernel拷贝到用户内存中，这个时候进程是被block了`，在这段时间内，进程是被block的。

而asynchronous IO则不一样，`当进程发起IO 操作之后，就直接返回再也不理睬了，直到kernel发送一个信号，告诉进程说IO完成`。在这整个过程中，进程完全没有被block。

![](https://mmbiz.qpic.cn/mmbiz_png/mQlO20PgUDLJyNAPpmHXFWjrXZ2uXvSeqeQfjNIVKzKA4lJUFPDKUic0FiayuEXticzTtnFPN74Y7poNjZbV0DygQ/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1)

## 参考

`https://www.jianshu.com/p/486b0965c296`