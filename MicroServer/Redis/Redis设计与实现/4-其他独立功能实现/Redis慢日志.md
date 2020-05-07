# Redis慢日志

## 1. 概述

Redis慢日志功能用于记录执行时间超过给定时长的命令请求，用户可以通过这个功能产生的日志来监视和优化查询速度。



配置`redis.conf`中通过`slowlog-log-slower-than`选项指定执行时间超过多少微秒的命令请求会被记录

`slow-max-len`选项指定服务器最多保存多少条慢日志，当保存满之后会删除旧的再保存新的。



## 2. 实现

### 1. 保存

服务器状态中包含了几个和慢查询日志功能有关的属性：

```c
struct redisServer {

    // ...

    // 下一条慢查询日志的 ID
    long long slowlog_entry_id;

    // 保存了所有慢查询日志的链表
    list *slowlog;

    // 服务器配置 slowlog-log-slower-than 选项的值
    long long slowlog_log_slower_than;

    // 服务器配置 slowlog-max-len 选项的值
    unsigned long slowlog_max_len;

    // ...

};
```

`slowlog_entry_id` 属性的初始值为 `0` ， 每当创建一条新的慢查询日志时， 这个属性的值就会用作新日志的 `id` 值， 之后程序会对这个属性的值增一。

比如说， 在创建第一条慢查询日志时， `slowlog_entry_id` 的值 `0` 会成为第一条慢查询日志的 ID ， 而之后服务器会对这个属性的值增一； 当服务器再创建新的慢查询日志的时候， `slowlog_entry_id` 的值 `1` 就会成为第二条慢查询日志的 ID ， 然后服务器再次对这个属性的值增一， 以此类推。

`slowlog` 链表保存了服务器中的所有慢查询日志， 链表中的每个节点都保存了一个 `slowlogEntry` 结构， 每个 `slowlogEntry` 结构代表一条慢查询日志：

```c
typedef struct slowlogEntry {

    // 唯一标识符
    long long id;

    // 命令执行时的时间，格式为 UNIX 时间戳
    time_t time;

    // 执行命令消耗的时间，以微秒为单位
    long long duration;

    // 命令与命令参数
    robj **argv;

    // 命令与命令参数的数量
    int argc;

} slowlogEntry;
```

### 2. 查看

弄清楚了服务器状态的 `slowlog` 链表的作用之后， 我们可以用以下伪代码来定义查看日志的 SLOWLOG GET 命令：

```python
def SLOWLOG_GET(number=None):

    # 用户没有给定 number 参数
    # 那么打印服务器包含的全部慢查询日志
    if number is None:
        number = SLOWLOG_LEN()

    # 遍历服务器中的慢查询日志
    for log in redisServer.slowlog:

        if number <= 0:
            # 打印的日志数量已经足够，跳出循环
            break
        else:
            # 继续打印，将计数器的值减一
            number -= 1

        # 打印日志
        printLog(log)
```

查看日志数量的 SLOWLOG LEN 命令可以用以下伪代码来定义：

```python
def SLOWLOG_LEN():

    # slowlog 链表的长度就是慢查询日志的条目数量
    return len(redisServer.slowlog)
```

另外， 用于清除所有慢查询日志的 SLOWLOG RESET 命令可以用以下伪代码来定义：

```python
def SLOWLOG_RESET():

    # 遍历服务器中的所有慢查询日志
    for log in redisServer.slowlog:

        # 删除日志
        deleteLog(log)
```

### 3. 新增

在每次执行命令的之前和之后， 程序都会记录微秒格式的当前 UNIX 时间戳， 这两个时间戳之间的差就是服务器执行命令所耗费的时长， 服务器会将这个时长作为参数之一传给 `slowlogPushEntryIfNeeded` 函数， 而 `slowlogPushEntryIfNeeded` 函数则负责检查是否需要为这次执行的命令创建慢查询日志， 以下伪代码展示了这一过程：

```python
# 记录执行命令前的时间
before = unixtime_now_in_us()

# 执行命令
execute_command(argv, argc, client)

# 记录执行命令后的时间
after = unixtime_now_in_us()

# 检查是否需要创建新的慢查询日志
slowlogPushEntryIfNeeded(argv, argc, before-after)
```

`slowlogPushEntryIfNeeded` 函数的作用有两个：

1. 检查命令的执行时长是否超过 `slowlog-log-slower-than` 选项所设置的时间， 如果是的话， 就为命令创建一个新的日志， 并将新日志添加到 `slowlog` 链表的表头。
2. 检查慢查询日志的长度是否超过 `slowlog-max-len` 选项所设置的长度， 如果是的话， 那么将多出来的日志从 `slowlog` 链表中删除掉。



## 3. 小结

- Redis 的慢查询日志功能用于记录执行时间超过指定时长的命令。
- Redis 服务器将所有的慢查询日志保存在服务器状态的 `slowlog` 链表中， 每个链表节点都包含一个 `slowlogEntry` 结构， 每个`slowlogEntry` 结构代表一条慢查询日志。
- 打印和删除慢查询日志可以通过遍历 `slowlog` 链表来完成。
- `slowlog` 链表的长度就是服务器所保存慢查询日志的数量。
- 新的慢查询日志会被添加到 `slowlog` 链表的表头， 如果日志的数量超过 `slowlog-max-len` 选项的值， 那么多出来的日志会被删除。