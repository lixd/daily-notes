# HTTP2 帧

## 帧格式

[rfc7540#section-4](https://datatracker.ietf.org/doc/html/rfc7540#section-4)

### 帧格式

所有的帧都以一个9字节的报头开始, 后接变长的载荷:

```
+-----------------------------------------------+
|                 Length (24)                   |
+---------------+---------------+---------------+
|   Type (8)    |   Flags (8)   |
+-+-------------+---------------+-------------------------------+
|R|                 Stream Identifier (31)                      |
+=+=============================================================+
|                   Frame Payload (0...)                      ...
+---------------------------------------------------------------+
```

报头部分的字段定义如下:

- `Length`: 载荷的长度, 无符号24位整型. **对于发送值大于2^14 (长度大于16384字节)的载荷, 只有在接收方设置`SETTINGS_MAX_FRAME_SIZE`为更大的值时才被允许**

  注: 帧的报头9字节不算在length里.

- `Type`: 8位的值表示帧类型, 决定了帧的格式和语义. 协议实现上必须忽略任何未知类型的帧.

- `Flags`: 为Type保留的bool标识, 大小是8位. 对确定的帧类型赋予特定的语义, 否则发送时必须忽略(设置为0x0).

- `R`: 1位的保留字段, 尚未定义语义. 发送和接收必须忽略(0x0).

- `Stream Identifier`: 31位无符号整型的流标示符. 其中0x0作为保留值, 表示与连接相关的frames作为一个整体而不是一个单独的流.





### 帧大小

payload 大小受接收方设置的`SETTINGS_MAX_FRAME_SIZE`所限, 而这个值的取值区间是[2^14 (16384), 2^24-1 (16777215)] 字节。

RFC 规定所有 HTTP/2 的实现必须能够接收并且至少能够处理2^14字节大小的帧, 外加9字节的报头. 

> 这里描述的帧的大小是不包含帧的报头部分的。

终端必须响应一个错误码FRAME_SIZE_ERROR，如果帧大小超过了SETTINGS_MAX_FRAME_SIZE中的定义或超过了对特定类型帧的大小限制, 或是帧太小以至于无法容纳下必要的元信息。

终端不必完整填充一个帧的所有空间. 更小的帧能提高响应速度. 对于时间敏感的帧来讲(如RST_STREAM, WINDOW_UPDATE, PRIORITY), 发送大块的帧可能导致延迟, 如果传输链路被一个大块帧阻塞, 很可能会带来性能损耗.



### Header压缩和解压

HTTP/2 与 HTTP/1 的报头结构一样, 一个键可能存在多个值。除了用于 HTTP 请求和响应之外还用于 server push 操作。



#### 压缩&分片

报头列表包含0个或多个报头字段。

传输过程是: 

* 先用压缩把报头列表序列化成一个报头区块；
* 然后将这个区块分割成一个或多个字节序列, 称之为区块分片。
  * 分片可以作为 HEADERS 帧, PUSH_PROMISE 帧或者 CONTINUATION帧的载荷。

其中 Cookie 字段通过 HTTP mapping 特殊处理.



#### 解压&重组

报文接收端将分片拼接起来以重组报头区块, 然后解压区块得到原始的报头列表。

一个完整地报头区块可以由下面任意一种结构组成:

- 一个设置了`END_HEADERS`标记的`HEADERS`或`PUSH_PROMISE`帧.
- 一个`END_HEADERS`标记置空的`HEADERS`或`PUSH_PROMISE` 帧, 后接一个或多个`CONTINUATION`帧, 并且最后一个`CONTINUATION`帧设置了`END_HEADERS`标记.

报头压缩是个**有状态**的过程。 整个连接复用同一个压缩和解压上下文. 报头区块中发生的解码错误必须当成连接错误处理, 类型为`COMPRESSION_ERROR`.

每个报头区块被当做离散的单元处理. 必须确保这些区块传输的连续性, 期间不能交叉其他类型的或来自任何其他流的帧. `HEADERS`与`PUSH_PROMISE`的`CONTINUATION`传输序列中最后一帧一定设置了`END_HEADERS`标记. 这保证了报头区块在逻辑上等价于单个帧.

报头区块的分片只能作为`HEADERS`, `PUSH_PROMISE`以及`CONTINUATION`帧的载荷存在. 因为这些帧携带的数据可能修改接收方维护的压缩上下文: 接收方拿到这三种类型之一的帧之后需要重组区块并解压, 即便这些帧将被丢弃. 如果无法解压区块, 接收方必须以一个类型为`COMPRESSION_ERROR`的错误断开连接.





## 帧定义

[rfc7540#section-6](https://datatracker.ietf.org/doc/html/rfc7540#section-6)

RFC 文档定义了多种帧类型，每种都由一个唯一的8位类型码标识。每种帧类型都服务于建立和管理整个连接或独立的流方面的一个不同的目的。

为了能够发送不同的“数据信息”，通过帧数据传递不同的内容，HTTP/2中定义了10种不同类型的帧，在上面表格的Type字段中可对“帧”类型进行设置。下表是HTTP/2的帧类型：

| 名称          | ID   | 描述                                   |
| ------------- | ---- | -------------------------------------- |
| DATA          | 0x0  | 传输流的核心内容                       |
| HEADERS       | 0x1  | 包含HTTP首部，和可选的优先级参数       |
| PRIORITY      | 0x2  | 指示或者更改流的优先级和依赖           |
| RST_STREAM    | 0x3  | 允许一端停止流（通常是由于错误导致的） |
| SETTINGS      | 0x4  | 协商连接级参数                         |
| PUSH_PROMISE  | 0x5  | 提示客户端，服务端要推送些东西         |
| PING          | 0x6  | 测试连接可用性和往返时延（RTT）        |
| GOAWAY        | 0x7  | 告诉另外一端，当前端已结束             |
| WINDOW_UPDATE | 0x8  | 协商一端要接收多少字节（用于流量控制） |
| CONTINUATION  | 0x9  | 用以拓展HEADER数据块                   |



### DATA

DATA帧(type=0x0)传送与一个流关联的任意的，可变长度的字节序列。一个或多个DATA帧被用于，比如，携带HTTP请求或响应载荷。

DATA帧也 **可以(MAY)** 包含填充字节。填充字节可以被加进DATA帧来掩盖消息的大小。填充字节是一个安全性的功能；

```shell
 +---------------+
 |Pad Length? (8)|
 +---------------+-----------------------------------------------+
 |                            Data (*)                         ...
 +---------------------------------------------------------------+
 |                           Padding (*)                       ...
 +---------------------------------------------------------------+
```

* **Pad Length**：一个8位的字段，包含了以字节为单位的帧的填充的长度。
  * 这个字段是有条件的(如图中的"?"所指的)，只有在PADDED标记设置时才出现。
* **Data**：实际传输的数据。
  * 数据的大小是帧载荷减去出现的其它字段的长度剩余的大小。
* **Padding**：填充字节包含了无应用语义的值。



DATA帧定义了如下的标记：

* **END_STREAM (0x1)：**当设置了这个标记时，位0表示这个帧是终端将为标识的流发送的最后一帧。设置这个标记使得流进入某种"half-closed"状态或"closed"状态
* **PADDED (0x8):**当设置了这个标记时，位3表示上面描述的 填充长度 字段及填充存在。



### HEADERS

**HEADERS帧(type=0x1)用于打开一个流**，此外还携带一个首部块片段。HEADERS帧可以在一个"idle"，"reserved (local)"，"open"，或"half-closed (remote)"状态的流上发送。

```shell
 +---------------+
 |Pad Length? (8)|
 +-+-------------+-----------------------------------------------+
 |E|                 Stream Dependency? (31)                     |
 +-+-------------+-----------------------------------------------+
 |  Weight? (8)  |
 +-+-------------+-----------------------------------------------+
 |                   Header Block Fragment (*)                 ...
 +---------------------------------------------------------------+
 |                           Padding (*)                       ...
 +---------------------------------------------------------------+
```

* **Pad Length**：一个8位的字段，同上。
* **E**：一个单独的位标记，指示了流依赖是独占的
  * 这个字段只有在PRIORITY标记设置时才会出现。
* **Stream Dependency**：一个31位的标识，标识了这个流依赖的流。
  * 这个字段只有在PRIORITY标记设置时才会出现。
* **Weight**：一个无符号8位整型值，表示流的优先级权值。
  * 这个字段只有在PRIORITY标记设置时才会出现。
* **Header Block Fragment**：一个首部块片段
* **Padding**：同上，填充数据。



HEADERS帧定义了如下的标记：

* **END_STREAM (0x1)：**当设置时，位0表示这个首部块是终端将会为标识的流发送的最后一个块。
* **END_HEADERS (0x4):**当设置时，位2表示这个帧包含了这个首部块，而且后面没有任何的 CONTINUATION 帧。
* **PADDED (0x8):**当设置时，位3表示将会有填充长度和它对应的填充出现。
* **PRIORITY (0x20):**当设置时，位5指明独占标记(E)，流依赖和权值字段将出现；





### PRIORITY

PRIORITY帧 (type=0x2) 描述了给发送者建议的一个流的优先级，它可以在任何流状态下发送，包括idle和closed流。

```shell
 +-+-------------------------------------------------------------+
 |E|                  Stream Dependency (31)                     |
 +-+-------------+-----------------------------------------------+
 |   Weight (8)  |
 +-+-------------+
```

* **E**：一个单独的位标记，指示了流依赖是独占的
* **Stream Dependency**：一个31位的标识，标识了这个流依赖的流。
* **Weight**：一个无符号8位整型值，表示流的优先级权值。

PRIORITY帧不定义任何标记。



### RST_STREAM

RST_STREAM帧 (type=0x3)可以用于立即终止一个流。发送RST_STREAM来请求取消一个流，或者指明发生了一个错误状态。

```shell
 +---------------------------------------------------------------+
 |                        Error Code (32)                        |
 +---------------------------------------------------------------+
```

* **ErrorCode：**一个无符号32位整型值的错误码，错误码指明了为什么要终止流。

RST_STREAM帧不定义任何标记。



### SETTINGS

SETTINGS帧 (type=0x4) 携带影响端点间如何通信的配置参数，比如关于对端行为的首选项和限制。SETTINGS帧也用于确认接收到了那些参数。个别地，一个SETTINGS参数也可以被称为一个"setting"。

```shell
 +-------------------------------+
 |       Identifier (16)         |
 +-------------------------------+-------------------------------+
 |                        Value (32)                             |
 +---------------------------------------------------------------+
```



SETTINGS帧 **必须(MUST)** 在连接开始时，两端都发送，而在连接整个生命期中其它的任何时间点，其中的一个端点 **可以(MAY)** 发送。

SETTINGS帧定义了如下的标记：

* **ACK (0x1):** 设置时，位0指示了这个帧用于确认对端的SETTINGS帧的接收和应用。



SETTINGS帧已定义了如下的参数：

* **SETTINGS_HEADER_TABLE_SIZE (0x1):** 允许发送者通知远端，用于解码首部块的首部压缩表的最大大小，以字节位单位。
* **SETTINGS_ENABLE_PUSH (0x2):** 这个设置项可被用于禁用服务端推送。
  * 初始值是1，这表示服务端推送是允许的。
* **SETTINGS_MAX_CONCURRENT_STREAMS (0x3):** 指明了发送者允许的最大的并发流个数。
  * 这个限制是有方向的：它应用于发送者允许接收者创建的流的个数。初始时，这个值没有限制。
  * 建议这个值不要小于100，以便于不要不必要地限制了并发性。
* **SETTINGS_INITIAL_WINDOW_SIZE (0x4):** 指明了发送者stream-level flow control的初始窗口大小(以字节为单位)。
  * 初始值为2^16 - 1 (65,535)字节。
* **SETTINGS_MAX_FRAME_SIZE (0x5):** 指明了发送者期望接收的最大的帧载荷大小，以字节为单位。
* **SETTINGS_MAX_HEADER_LIST_SIZE (0x6):** 这个建议性的设置通知对端发送者准备接受的首部列表的最大大小，以字节为单位。



### PUSH_PROMISE

PUSH_PROMISE帧 (type=0x5)用于通知对端发送方想要启动一个流。PUSH_PROMISE帧包含终端计划创建的流的无符号31位标识符，及为流提供额外上下为的一系列的首部。

```shell
 +---------------+
 |Pad Length? (8)|
 +-+-------------+-----------------------------------------------+
 |R|                  Promised Stream ID (31)                    |
 +-+-----------------------------+-------------------------------+
 |                   Header Block Fragment (*)                 ...
 +---------------------------------------------------------------+
 |                           Padding (*)                       ...
 +---------------------------------------------------------------+
```

* **Pad Length**：一个8位的字段，同上。
* **R:** 一个保留位。
* **Promised Stream ID:**一个无符号31位整数，标识了PUSH_PROMISE保留的流。
* **Header Block Fragment**：一个首部块片段
* **Padding**：同上，填充数据。



PUSH_PROMISE帧定义了如下的标记：

* **END_HEADERS (0x4):** 设置时，位2表示这个帧包含一个完整的首部块而且后面没有CONTINUATION帧。
* **PADDED (0x8):** 设置时，位2表示 **填充长度** 字段和它所对应的填充将会出现。



### PING

PING帧 (type=0x6) 是一种测量自发送者开始的最小往返时间的机制，也用于测定一个idle连接是否仍然有效。PING帧可以自连接的任何一端发送。

> 心跳检测，测量发送往返时间，确定连接是否正常。

```shell
 +---------------------------------------------------------------+
 |                                                               |
 |                      Opaque Data (64)                         |
 |                                                               |
 +---------------------------------------------------------------+
```

* **Opaque Data:**8字节的不透明数据。

PING帧定义了如下的标记：

* **ACK (0x1):** 当设置时，位0指明了这个PING帧是一个PING响应。



### GOAWAY

GOAWAY帧(type=0x7)用于初始化一个连接的关闭，或通知严重的错误条件。GOAWAY允许一个终端在处理之前建立的流的同时优雅地停止接收新的流。这使管理操作称为可能，如服务器维护。

```shell
 +-+-------------------------------------------------------------+
 |R|                  Last-Stream-ID (31)                        |
 +-+-------------------------------------------------------------+
 |                      Error Code (32)                          |
 +---------------------------------------------------------------+
 |                  Additional Debug Data (*)                    |
 +---------------------------------------------------------------+
```

* **R：**一个保留位
* **Last-Stream-ID：**包含了GOAWAY帧的发送者可能已经处理或可能会处理的最大的流标识符
* **Error Code：**32位的错误码
* **Additional Debug Data:**附加的调试数据，用于诊断目的，而不携带语义值。



### WINDOW_UPDATE

WINDOW_UPDATE帧(type=0x8)用于实现flow control。

Flow control操作于两个层次：在每个单独的流上，和整个连接上。

```shell
 +-+-------------------------------------------------------------+
 |R|              Window Size Increment (31)                     |
 +-+-------------------------------------------------------------+
```

* **R：**一个保留位
* **Window Size Increment:**一个无符号31位的整数组成，指明了发送者在已有的flow-control窗口之外可以传输的字节数





### CONTINUATION

CONTINUATION帧 (type=0x9) 被用于继续发送首部块片段的序列。只要相同流上的前导帧是没有设置END_HEADERS标记的 HEADERS、PUSH_PROMISE或CONTINUATION帧，就可以发送任意数量的CONTINUATION帧。

```shell
 +---------------------------------------------------------------+
 |                   Header Block Fragment (*)                 ...
 +---------------------------------------------------------------+
```

* **Header Block Fragment:**一个首部块片段

CONTINUATION帧定义了如下的标记：

* **END_HEADERS (0x4):**当设置时，位2指明这个帧结束了一个首部块