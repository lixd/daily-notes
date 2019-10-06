# Mongodb

## ObjectId

在一个特定的collection中，需要唯一的标识文档, 因此MongoDB中存储的文档都由一个”_id”键，用于完成此功能。 这个键的值可以是任意类型的，默认试ObjectId(string)对象。

考虑分布式问题, “_id”要求不同的机器都能用全局唯一的同种方法方便的生成它。因此不能使用自增主键，mongodb的生成ObjectId对象的方法如下:

ObjectId使用12字节的存储空间，结构如下：

```sh
0 1 2 3|4 5 6 |7 8|9 10 11|
时间戳--|机器码-|PID|计数器-|
```

> 1). 前四个字节时间戳是从标准纪元开始的时间戳，单位为秒. 它保证插入顺序大致按时间排序; 隐含了文档创建时间. 
> 2). 接下来的三个字节是所在主机的唯一标识符，**一般是机器主机名的散列值**，这样就确保了不同主机生成不同的机器hash值，确保在分布式中不造成冲突. **所以在同一台机器中, 生成的objectid中这部分字符串都是一样**。
> 3). 上面的机器码是为了确保在不同机器产生的objectid不冲突，而pid就是为了在同一台机器不同的mongodb进程产生了objectid不冲突。
> 4). 前面的九个字节是保证了一秒内不同机器不同进程生成objectid不冲突，最后的三个字节是一个自动增加的计数器，用来确保在同一秒内产生的objectid也不会发现冲突。

综上: 时间戳保证秒级唯一; 机器ID保证设计时考虑分布式，避免时钟同步; PID保证同一台服务器运行多个mongod实例时的唯一性; 最后的计数器保证同一秒内的唯一性。

OK, 那么根据上面的规则, 我们可以很容易写出生成ObjectId的代码, 示例Go代码如下:

```go
// NewObjectId returns a new unique ObjectId.
func NewObjectId() ObjectId {
	var b [12]byte
	// Timestamp, 4 bytes, big endian
	binary.BigEndian.PutUint32(b[:], uint32(time.Now().Unix()))
	// Machine, first 3 bytes of md5(hostname)
	b[4] = machineId[0]
	b[5] = machineId[1]
	b[6] = machineId[2]
	// Pid, 2 bytes, specs don't specify endianness, but we use big endian.
	pid := os.Getpid()
	b[7] = byte(pid >> 8)
	b[8] = byte(pid)
	// Increment, 3 bytes, big endian
	i := atomic.AddUint32(&objectIdCounter, 1)
	b[9] = byte(i >> 16)
	b[10] = byte(i >> 8)
	b[11] = byte(i)
	return ObjectId(b[:])
}
```

那如果我们想要根据_id的时间戳来进行查询(注意是秒级别以上), 那么我们仅仅需要填充前面4个字节的时间部分, 后面的置0就OK.

```go
// NewObjectIdWithTime returns a dummy ObjectId with the timestamp part filled
// with the provided number of seconds from epoch UTC, and all other parts
// filled with zeroes. It's not safe to insert a document with an id generated
// by this method, it is useful only for queries to find documents with ids
// generated before or after the specified timestamp.
func NewObjectIdWithTime(t time.Time) ObjectId {
	var b [12]byte
	binary.BigEndian.PutUint32(b[:4], uint32(t.Unix()))
	return ObjectId(string(b[:]))
}
```

如果要查询这个时间之后的数据, 那么 `db.XXX.find({"_id": {"$gt": NewObjectIdWithTime(time)}})` 就可以了. 



## 分布式系统中如何为进程取标识符(process identifier)

在分布式系统中，如何指涉(refer to)某一个进程呢，或者说一个进程如何取得自己的全局标识符 (以下简称 gpid)容易想到的有两种做法：

* ip:port （port 是这个进程对外提供网络服务的端口号，一般就是它的 tcp listening port）
* host:pid

如果进程本身是无状态的，或者重启了也没有关系，那么用 ip:port 来标识一个“服务”是没问题的，比如常见的 httpd以用它们的惯用 port （80 ）来标识。就算这个 service 重启了，也不会有太恶劣的后果，大不了客户端重试一下，或者自动切换到备用地址。

如果服务是有状态的，那么 ip:port 这种标识方法就有大问题，因为客户端无法区分从头到尾和自己打交道的是一个进程还是先后多个进程。在开发服务端程序的时候，为了能快速重启，我们一般都会设置 SO_REUSEADDR，这样的结果是前一秒钟站在 10.0.0.7:8888 后面的进程和后一秒钟占据 10.0.0.7:8888 的进程可能不相同——服务端程序快速重启了。

正确做法
正确做法：以四元组 ip:port:start_time:pid 作为分布式系统中进程的 gpid，其中 start_time 是 64-bit 整数，表示进程的启动时刻（UTC 时区，muduo::Timestamp）。理由如下：

容易保证唯一性。如果程序短时间重启，那么两个进程的 pid 必定不重复（还没有走完一个轮回：就算每秒创建 1000 个进程，也要 30 多秒才会轮回，而以这么高的速度创建进程的话，服务器已基本瘫痪了。）；如果程序运行了相当长一段时间再重启，那么两次启动的 start_time 必定不重复。（见下文关于时间重复的解释）
产生这种 gpid 的成本很低（几次低成本系统调用），没有用到全局服务器，不存在 single point of failure。
gpid 本身有意义，根据 gpid 立刻就能知道是什么进程(port)，运行在哪台机器(ip)，是什么时间启动的，在 /proc 目录中的位置 (/proc/pid) 等，进程的资源使用情况也可以通过运行在那台机器上的监控程序报告出来。
gpid 具有历史意义，便于将来追溯。比方说进程 crash，那么我知道它的 gpid，就可以去历史记录中查询它 crash 之前的 cpu/mem 负载有多大。
如果仅以 ip:port:start_time 作为 gpid，则不能保证唯一性，如果程序短时间重启（间隔一秒或几秒），start_time 可能会往回跳变（NTP 在调时间）或暂停（正好处于闰秒期间）。关于时间跳变的问题留给下一篇博客《〈程序中的日期与时间〉第二章：计时与定时》，简单地说，计算机上的时钟不一定是单调递增的。



## 参考

`http://www.okyes.me/2016/06/11/mongodb-id.html`

`https://blog.csdn.net/solstice/article/details/6285216`