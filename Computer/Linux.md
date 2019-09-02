# Linux常用命令

## 后台任务

### 1. nohup 

当运行一个程序的时候，我们在退出当前账户，或者关闭终端的时候，程序都会收到一个SIGHUP的信号，nohup就是忽略这种信号，让程序不挂起。 nohup使用方法很简单，即：nohup command. 在使用过程中有几个小技巧：

#### 1. 同时使用nohup和&

使用方法：`nohup command &`

在退出当前账户或是关闭终端的时候程序会收到SIGHUP信号，这个信号会被使用了nohup的程序忽略，但是如果使用了CTRL + C 结束命令，程序会收到SIGINT信号，这个信号还是会让程序终结，如果不想程序被结束，就在结尾加上一个&, 让程序也忽略SIGINT 信号

#### 2. 重定向标准输出和标准错误

使用方法：`nohup command > filename 2<&1 &`

这里的1，2是文件描述符，0表示stdin标准输入，1表示stdout标准输出，2表示stderr标准错误， 还有一个/dev/null 表示空设备文件。

nohup 默认会把输出输出到nohup.out文件中，如果想重定向输出到别的文件，那么需要在nohup command后加入 > filename, 2<&1,表示把标准错误重定向到标准输出中。